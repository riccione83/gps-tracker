import {useLazyQuery, useMutation} from '@apollo/client';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import {useFocusEffect} from '@react-navigation/native';
import axios from 'axios';
import React, {useEffect, useState} from 'react';
import {Button, ScrollView, StyleSheet, Switch} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import {Text, View} from '../components/Themed';
import BottomSlidingView from '../components/bottomslidingview';
import useBackgroundGeolocationTracker from '../components/hooks/background-tracking';
import useDevice from '../components/hooks/use-device';
import MapComponent from '../components/map';
import ModalComponent from '../components/modal';
import {BASE_URL} from '../constants/App';
import {GPSPacket} from '../models/gps';
import {Setting} from '../models/settings';
import {
  createDeviceMutation,
  devicesQuery,
  latestGpsPositions,
} from '../queries';
import {sendLocalNotification} from '../utils/local-notifications';
import {getData, storeData} from '../utils/storage';
import PushNotification from 'react-native-push-notification';

export const sendGPSPacket = async (gps: GPSPacket) => {
  axios
    .post(BASE_URL + '/gps', gps)
    .then(response => console.info('Sent GPS packet:', response.data))
    .catch(error => console.info('Error on GPS packet', error, gps));
};

export default function MainScreen({navigation}: any) {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const toggleSwitch = () => {
    setIsEnabled(previousState => !previousState);
    storeData('settings', {locationEnabled: !isEnabled});
  };
  const [createDeviceModal, setCreateDeviceModal] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const {currentDevice, currentDeviceDisplay} = useDevice();
  const [token, setToken] = useState('');

  const location = useBackgroundGeolocationTracker(isEnabled);
  console.log('useTraking: ', location);

  useEffect(() => {
    PushNotificationIOS.addEventListener('register', onRegistered);
    PushNotificationIOS.addEventListener(
      'registrationError',
      onRegistrationError,
    );
    PushNotificationIOS.addEventListener('notification', onRemoteNotification);
    PushNotificationIOS.addEventListener(
      'localNotification',
      onLocalNotification,
    );

    PushNotificationIOS.requestPermissions({
      alert: true,
      badge: true,
      sound: true,
      critical: true,
    }).then(
      data => {
        console.log('PushNotificationIOS.requestPermissions', data);
      },
      data => {
        console.log('PushNotificationIOS.requestPermissions failed', data);
      },
    );

    return () => {
      PushNotificationIOS.removeEventListener('register');
      PushNotificationIOS.removeEventListener('registrationError');
      PushNotificationIOS.removeEventListener('notification');
      PushNotificationIOS.removeEventListener('localNotification');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRegistered = (deviceToken: any) => {
    console.log('Registered For Remote Push', `Device Token: ${deviceToken}`);
    setToken(deviceToken);
  };

  const onRegistrationError = (error: any) => {
    console.log(
      'Failed To Register For Remote Push',
      `Error (${error.code}): ${error.message}`,
    );
  };

  const onRemoteNotification = (notification: any) => {
    const isClicked = notification.getData().userInteraction === 1;

    const result = `
      Title:  ${notification.getTitle()};\n
      Subtitle:  ${notification.getSubtitle()};\n
      Message: ${notification.getMessage()};\n
      badge: ${notification.getBadgeCount()};\n
      sound: ${notification.getSound()};\n
      category: ${notification.getCategory()};\n
      content-available: ${notification.getContentAvailable()};\n
      Notification is clicked: ${String(isClicked)}.`;

    if (notification.getTitle() == undefined) {
      console.info('Silent push notification Received', result);
    } else {
      console.info('Push Notification Received', result);
    }
    notification.finish('UIBackgroundFetchResultNoData');
  };

  const onLocalNotification = (notification: any) => {
    const isClicked = notification.getData().userInteraction === 1;

    console.log(
      'Local Notification Received',
      `Alert title:  ${notification.getTitle()},
      Alert subtitle:  ${notification.getSubtitle()},
      Alert message:  ${notification.getMessage()},
      Badge: ${notification.getBadgeCount()},
      Sound: ${notification.getSound()},
      Thread Id:  ${notification.getThreadID()},
      Action Id:  ${notification.getActionIdentifier()},
      User Text:  ${notification.getUserText()},
      Notification is clicked: ${String(isClicked)}.`,
      [
        {
          text: 'Dismiss',
          onPress: null,
        },
      ],
    );
  };

  useEffect(() => {
    if (location !== null && !loaded) {
      console.info('Send notification');
      setLoaded(true);
      getData('settings').then((setting: Setting) => {
        sendLocalNotification(
          'TrackMe',
          `Tracking is now ${
            setting.locationEnabled ? 'enabled' : 'disabled'
          }. You can now hide the application.`,
        );
      });
    }
  }, [location]);

  const [getPositionForDevice, {data: selectedDevicePosition}] = useLazyQuery(
    latestGpsPositions,
    {
      fetchPolicy: 'network-only',
    },
  );

  const [createDevice] = useMutation(createDeviceMutation, {
    fetchPolicy: 'network-only',
  });

  const [getDeviceList, {data: devices}] = useLazyQuery(devicesQuery);

  useEffect(() => {
    const readSettings = async () => {
      const settings: Setting = (await getData('settings')) as Setting;
      if (!settings) {
        const newSetting: Setting = {
          locationEnabled: isEnabled,
        };
        storeData('settings', newSetting);
        console.info('Created settings:', newSetting);
      } else {
        setIsEnabled(settings.locationEnabled);
        console.info('Read settings:', isEnabled);
      }
    };
    readSettings();
  }, [isEnabled]);

  React.useEffect(() => {
    // Use `setOptions` to update the button that we previously specified
    // Now the button includes an `onPress` handler to update the count
    navigation.setOptions({
      headerRight: () => (
        <Button
          onPress={() => navigation.replace('Logout')}
          title="Logout"
          color="#000"
        />
      ),
    });
  }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      const uData = async () => {
        const user = await getData('userinfo');
        if (user) {
          setCurrentUser(user);
          getDeviceList({variables: {userId: user.id}});
        }
      };
      if (!currentUser) {
        uData();
      }

      if (currentUser && token !== '' && token !== 'ALREADY_SET') {
        //Set new token to the BE
        setToken('ALREADY_SET');
      }
    }, [currentUser, token]),
  );

  useEffect(() => {
    // Implementing the setInterval method

    const interval = setInterval(() => {
      PushNotificationIOS.setApplicationIconBadgeNumber(0);
      PushNotification.setApplicationIconBadgeNumber(0);
      if (location && isEnabled && currentUser) {
        //Check the current location is inside a polygon
        sendGPSPacket(location);
      } else {
        // console.info('No device found');
      }
    }, 5000);
    //Clearing the interval
    return () => clearInterval(interval);
  }, [isEnabled, location, currentDevice]);

  const getMarker = () => {
    if (location && isEnabled) {
      return {
        latitude: location?.latitude,
        longitude: location?.longitude,
      };
    }
    if (selectedDevicePosition && currentDevice) {
      const selected = selectedDevicePosition.latestPosition.find(
        (d: any) => d.description === currentDevice.description,
      );
      if (!selected) {
        console.info('No device found', currentDevice, selectedDevicePosition);
        return undefined;
      }
      return {
        latitude: selected?.coord.latitude,
        longitude: selected?.coord.longitude,
      };
    }

    return undefined;
  };

  return (
    <View style={styles.container}>
      <View style={styles.appContainer}>
        <ModalComponent
          open={createDeviceModal}
          cancelTitle="Cancel"
          successTitle="Yes"
          onClose={() => {
            setCreateDeviceModal(false);
            setIsEnabled(false);
          }}
          onSuccess={() => {
            DeviceInfo.getDeviceName().then(display => {
              const deviceId = DeviceInfo.getDeviceId() + '_' + display;
              createDevice({
                variables: {
                  userId: Number(currentUser.id),
                  description: display,
                  serial: deviceId,
                },
                onCompleted: d => {
                  // setCurrentDevice(d);
                  setCreateDeviceModal(false);
                },
                // refetchQueries: [checkDeviceQuery],
              }).catch(e => console.error('Creating error: ', e.message));
            });
          }}
          title="This device is not registered, do you want to register it?"
        />
      </View>

      <View style={styles.mapContainer}>
        <MapComponent
          showUserPosition={location === null || !isEnabled}
          marker={getMarker()}
        />
      </View>

      <BottomSlidingView>
        <View
          style={styles.container}
          onTouchEnd={e => {
            // e.preventDefault();
            // e.stopPropagation();
          }}>
          <Text style={styles.title}>Share my location</Text>
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'transparent',
            }}>
            <Switch
              trackColor={{false: '#767577', true: '#81b0ff'}}
              thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={() => toggleSwitch()}
              value={isEnabled}
              disabled={!currentDevice}
              onTouchEnd={e => {
                e.stopPropagation();
                e.preventDefault();
              }}
            />
            <Text style={{marginLeft: 16}}>Enable sharing location</Text>
          </View>
          <View
            style={styles.separator}
            lightColor="#eee"
            darkColor="rgba(255,255,255,0.1)"
          />
          <Text>
            {isEnabled
              ? location
                ? location.latitude + ' ' + location.longitude
                : 'Not started yet'
              : 'Position share not enabled'}
          </Text>
          <View
            style={styles.separator}
            lightColor="#eee"
            darkColor="rgba(255,255,255,0.1)"
          />
          <Text style={{marginBottom: 16}}>
            {/*style={{alignSelf: 'flex-start', marginLeft: 16}}*/}
            Your devices
          </Text>
          <ScrollView>
            {devices &&
              devices.user.devices.map((d: any) => {
                return (
                  <View
                    key={`device-list-${d.id}`}
                    onTouchEnd={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.info('Selected', d);
                      // setCurrentDevice(d);
                      // setIsEnabled(currentDeviceDisplay === d.description);

                      getPositionForDevice({
                        variables: {
                          userId: currentUser.id,
                        },
                      });
                    }}>
                    <Text style={styles.title} key={d.id}>
                      {currentDeviceDisplay &&
                      currentDeviceDisplay === d.description
                        ? `${d.description} (this device)`
                        : `${d.description}`}
                    </Text>
                  </View>
                );
              })}
          </ScrollView>
        </View>
      </BottomSlidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    position: 'relative',
    alignItems: 'center',
    // justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },

  mapContainer: {
    flexBasis: '100%',
    top: 0,
    backgroundColor: 'red',
    width: '100%',
  },

  appContainer: {
    flex: 1,
    display: 'flex',
    // flexBasis: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgb(71,155,230)',
    width: '100%',
    height: '0%',
    borderTopColor: 'grey',
  },
});
