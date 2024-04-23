import {useLazyQuery, useMutation} from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect} from '@react-navigation/native';
import axios from 'axios';
import React, {useEffect, useState} from 'react';
import {Button, ScrollView, StyleSheet, Switch} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import useTracking from '../components/BackgroundTraking';
import {Text, View} from '../components/Themed';
import BottomSlidingView from '../components/bottomslidingview';
import MapComponent from '../components/map';
import ModalComponent from '../components/modal';
import {BASE_URL} from '../constants/App';
import {
  createDeviceMutation,
  devicesQuery,
  latestGpsPositions,
} from '../queries';
import useDevice from '../components/hooks/use-device';

export interface GPSPacket {
  latitude: number;
  longitude: number;
  device: number;
  speed: number;
  altitude: number;
  accuracy: number;
  activity: string | null;
}

export default function MainScreen({navigation}: any) {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const toggleSwitch = () => setIsEnabled(previousState => !previousState);
  const [createDeviceModal, setCreateDeviceModal] = useState(false);

  const {location, backgroud, pause} = useTracking(isEnabled);
  const {currentDevice, currentDeviceDisplay} = useDevice();

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

  const sendGPSPacket = async (gps: GPSPacket) => {
    axios
      .post(BASE_URL + '/gps', gps)
      .then(response => console.info('Sent GPS packet:', response.data))
      .catch(error => console.info('Error on GPS packet', error, gps));
  };

  const getData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('userinfo');
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      // error reading value
    }
  };

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
        const user = await getData();
        if (user) {
          setCurrentUser(user);
          getDeviceList({variables: {userId: user.id}});
        }
      };
      if (!currentUser) {
        uData();
      }

      // getDevice();
      // if (!currentDevice) {
      //   DeviceInfo.getDeviceName().then(display => {
      //     setCurrentDeviceDisplay(display);
      //     const deviceId = DeviceInfo.getDeviceId() + '_' + display;
      //     checkDevice({
      //       variables: {
      //         serial: deviceId,
      //       },
      //     })
      //       .then(result => {
      //         if (result.data?.checkDevice) {
      //           setCurrentDevice(result.data?.checkDevice);
      //         } else {
      //           setCreateDeviceModal(true);
      //         }
      //       })
      //       .catch(() => {});
      //   });
      // }
    }, [currentUser]),
  );

  useEffect(() => {
    // Implementing the setInterval method

    const interval = setInterval(() => {
      console.info(pause, backgroud, location, isEnabled);
      if (!pause && !backgroud && location && isEnabled && !!location.device) {
        console.info(location);
        sendGPSPacket(location);
      } else {
        // console.info('No device found');
      }
    }, 5000);
    //Clearing the interval
    return () => clearInterval(interval);
  }, [isEnabled, location, pause, backgroud, currentDevice]);

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
          showUserPosition={location === null}
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
