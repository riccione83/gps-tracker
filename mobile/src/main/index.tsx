import {
  Button,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import {useLazyQuery, useMutation, useQuery} from '@apollo/client';
import {View, Text} from '../components/Themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect} from '@react-navigation/native';
import axios from 'axios';
import React, {useEffect, useState} from 'react';
import DeviceInfo from 'react-native-device-info';
import MapComponent from '../components/map';
import ModalComponent from '../components/modal';
import {BASE_URL} from '../constants/App';
import {
  checkDeviceQuery,
  createDeviceMutation,
  devicesQuery,
  latestGpsPositions,
  userQuery,
} from '../queries';
import BottomSlidingView from '../components/bottomslidingview';

interface GPSPacket {
  latitude: number;
  longitude: number;
  device: number;
}

export default function MainScreen({navigation}: any) {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [currentDevice, setCurrentDevice] = useState<any | null>(null);
  const [currentDeviceDisplay, setCurrentDeviceDisplay] = useState<any | null>(
    null,
  );
  const [isEnabled, setIsEnabled] = useState(true);
  const toggleSwitch = () => setIsEnabled(previousState => !previousState);
  const [location, setLocation] = useState<Geolocation.GeoPosition | null>(
    null,
  );
  const [createDeviceModal, setCreateDeviceModal] = useState(false);

  const [checkDevice] = useLazyQuery(checkDeviceQuery, {
    fetchPolicy: 'network-only',
  });

  const [getPositionForDevice, {data: selectedDevicePosition}] = useLazyQuery(
    latestGpsPositions,
    {
      fetchPolicy: 'network-only',
    },
  );

  console.info(selectedDevicePosition);

  const [createDevice] = useMutation(createDeviceMutation, {
    fetchPolicy: 'network-only',
  });

  const [getDeviceList, {data: devices}] = useLazyQuery(devicesQuery);

  // Function to get permission for location
  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      // your code using Geolocation and asking for authorisation with
      return Geolocation.requestAuthorization('always');
    } else {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return Promise.resolve<boolean>(true);
      } else {
        return Promise.reject();
      }
    }
  };

  const getLocation = () => {
    const result = requestLocationPermission();
    result.then(res => {
      if (res) {
        currentDevice &&
          Geolocation.getCurrentPosition(
            async position => {
              setLocation(position);
              const newPacket: GPSPacket = {
                device: Number(currentDevice.id),
                latitude: Number(position.coords.latitude.toFixed(6)),
                longitude: Number(position.coords.longitude.toFixed(6)),
              };
              await sendGPSPacket(newPacket);
            },
            () => {
              // See error code charts below.
              setLocation(null);
            },
            {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
          );
      }
    });
  };

  const sendGPSPacket = async (gps: GPSPacket) => {
    axios
      .post(BASE_URL + '/gps', gps)
      // .then(response => console.info('Sent GPS packet:', response.data))
      .catch(error => console.info('Error on GPS packet', error));
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
      if (!currentDevice) {
        DeviceInfo.getDeviceName().then(display => {
          setCurrentDeviceDisplay(display);
          const deviceId = DeviceInfo.getDeviceId() + '_' + display;
          checkDevice({
            variables: {
              serial: deviceId,
            },
          })
            .then(result => {
              if (result.data?.checkDevice) {
                setCurrentDevice(result.data?.checkDevice);
              } else {
                setCreateDeviceModal(true);
              }
            })
            .catch(() => {});
        });
      }
    }, [currentUser, currentDevice]),
  );

  useEffect(() => {
    //Implementing the setInterval method
    const interval = setInterval(() => {
      isEnabled && currentUser && currentDevice && getLocation();
    }, 5000);

    //Clearing the interval
    return () => clearInterval(interval);
  }, [currentUser, currentDevice, isEnabled]);

  const getMarker = () => {
    if (location && isEnabled) {
      return {
        latitude: location?.coords.latitude,
        longitude: location?.coords.longitude,
      };
    }
    if (selectedDevicePosition && currentDevice) {
      const selected = selectedDevicePosition.latestPosition.find(
        d => d.description === currentDevice.description,
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
                  setCurrentDevice(d);
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
        <MapComponent showUserPosition={false} marker={getMarker()} />
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
                ? location.coords.latitude + ' ' + location.coords.longitude
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
                      setCurrentDevice(d);
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
