import {useLazyQuery, useMutation} from '@apollo/client';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import {useFocusEffect} from '@react-navigation/native';
import React, {useEffect, useState} from 'react';
import {Button, ScrollView, StyleSheet, Switch} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import PushNotification from 'react-native-push-notification';
import {Text, View} from '../components/Themed';
import BottomSlidingView from '../components/bottomslidingview';
import useBackgroundGeolocationTracker from '../components/hooks/background-tracking';
import useDevice from '../components/hooks/use-device';
import MapComponent from '../components/map';
import ModalComponent from '../components/modal';
import {Setting} from '../models/settings';
import {sendGPSPacket} from '../networking';
import {
  createDeviceMutation,
  devicesQuery,
  getGeofencesQuery,
  latestGpsPositions,
} from '../queries';
import {
  onLocalNotification,
  onRegistered,
  onRegistrationError,
  onRemoteNotification,
  sendLocalNotification,
} from '../utils/local-notifications';
import {getData, storeData} from '../utils/storage';
import NetInfo from '@react-native-community/netinfo';

export default function MainScreen({navigation}: any) {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const [createDeviceModal, setCreateDeviceModal] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const {currentDevice, currentDeviceDisplay} = useDevice();
  const [token, setToken] = useState('');
  const [networkError, setNetworkError] = useState<{
    sent: boolean;
    sentAt: Date;
  } | null>(null);
  const [connected, setConnected] = useState(true);
  const location = useBackgroundGeolocationTracker(isEnabled);

  /** GraphQL query and mutations */
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
  const [getGeofences, {data: geofences}] = useLazyQuery(getGeofencesQuery);

  // Effects

  /** Register Push notifications events and listeners */
  useEffect(() => {
    PushNotificationIOS.addEventListener('register', token =>
      onRegistered(token, () => setToken(token)),
    );
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
  }, []);

  /** Send local notification if location start */
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
    } else if (location === null) {
      setLoaded(false);
    }
  }, [location]);

  /** Networks event listener*/
  useEffect(() => {
    const network = NetInfo.addEventListener(state => {
      console.info('Connection type', state.type);
      console.info('Is connected?', state.isConnected);
      setConnected(!!state.isInternetReachable);
    });

    network();
  }, []);

  /** Read settings and apply them */
  useEffect(() => {
    const readSettings = async () => {
      const settings: Setting = (await getData('settings')) as Setting;
      if (!settings) {
        const newSetting: Setting = {
          locationEnabled: isEnabled,
        };
        storeData('settings', newSetting);
      } else {
        setIsEnabled(settings.locationEnabled);
      }
    };
    readSettings();
  }, [isEnabled]);

  /** Add Logout button on the navigation panel */
  useEffect(() => {
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

  /** Read the user info from local storage and if valid fetch data */
  useFocusEffect(
    React.useCallback(() => {
      const uData = async () => {
        const user = await getData('userinfo');
        if (user) {
          setCurrentUser(user);
          getDeviceList({variables: {userId: user.id}});
          getGeofences({
            variables: {
              userId: user.id,
            },
          });
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

  /** 5000ms timer. Send location data to BE and checks if gps history is present. In this case this will send the history */
  useEffect(() => {
    const interval = setInterval(async () => {
      PushNotificationIOS.setApplicationIconBadgeNumber(0);
      PushNotification.setApplicationIconBadgeNumber(0);
      if (connected) {
        //Check if there are pending messages
        const history = (await getData('history')) as any[];
        // console.info(`${history.length} messages to send`);
        if (history && history.length > 0) {
          const messages = [...history];

          await await Promise.all(
            messages.map(async (message, index) => {
              return sendGPSPacket(message).then(() => {
                // console.info('Sent from history:', message);
                history.splice(index, 1);
                // console.info(`To send: ${history.length}`);
              });
            }),
          );
          // console.info('Completed, saving: ', history);
          await storeData('history', history);
        }
      }
      if (location && isEnabled && currentUser && connected) {
        try {
          await sendGPSPacket(location);
          if (networkError !== null && networkError.sent) {
            setNetworkError(null);
            sendLocalNotification(
              'TrackMe',
              `Network restored, if data is pending, will be synced soon`,
            );
          }
        } catch (error) {
          const lastSent = networkError
            ? networkError.sentAt.getTime()
            : Date.now();

          const mils = Date.now() - lastSent;
          if (
            networkError === null ||
            (Math.floor(mils / 1000) >= 60 && networkError.sent)
          ) {
            console.info('Sending notification after error');
            setNetworkError({sent: true, sentAt: new Date()});
            sendLocalNotification(
              'Unable to send packet',
              `Network error: ${error}`,
            );
          }
        }
      }
    }, 5000);
    //Clearing the interval
    return () => clearInterval(interval);
  }, [isEnabled, location, currentDevice]);

  // Methods
  const toggleSwitch = () => {
    setIsEnabled(previousState => !previousState);
    storeData('settings', {locationEnabled: !isEnabled});
  };

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
        return undefined;
      }
      return {
        latitude: selected?.coord.latitude,
        longitude: selected?.coord.longitude,
      };
    }
    return undefined;
  };

  // UI
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
                onCompleted: () => {
                  setCreateDeviceModal(false);
                },
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
          geofences={geofences ? geofences.geofences : null}
        />
      </View>

      <BottomSlidingView>
        <View style={styles.container}>
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
          <Text style={{marginBottom: 16}}>Your devices</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgb(71,155,230)',
    width: '100%',
    height: '0%',
    borderTopColor: 'grey',
  },
});
