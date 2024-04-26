import {useEffect, useState} from 'react';
import BackgroundGeolocation from '@mak12/react-native-background-geolocation';
import {Platform, Alert} from 'react-native';
import {getData} from '../../utils/storage';
import {Setting} from '../../models/settings';
import {GPSPacket} from '../../models/gps';
import {sendGPSPacket} from '../../networking';

const useBackgroundGeolocationTracker = (enabled: boolean) => {
  const [activityType, setActivityType] = useState<string | null>(null);
  const [state, setState] = useState<GPSPacket | null>(null);
  const longitudeDelta = 0.01;
  const latitudeDelta = 0.01;

  useEffect(() => {
    const getDevice = async () => {
      return await getData('deviceinfo');
    };

    // Configs
    getDevice().then(device => {
      console.info('APPLY SETTINGS FOR: ', device);
      BackgroundGeolocation.configure(
        {
          desiredAccuracy: BackgroundGeolocation.HIGH_ACCURACY,
          stationaryRadius: 0, //50,
          distanceFilter: 0, //5
          notificationTitle: 'Background tracking',
          notificationText: 'enabled',
          debug: false,
          startOnBoot: false,
          stopOnTerminate: false,
          locationProvider: BackgroundGeolocation.ACTIVITY_PROVIDER,
          // Platform.OS === 'android'
          //   ? BackgroundGeolocation.ACTIVITY_PROVIDER
          //   : BackgroundGeolocation.DISTANCE_FILTER_PROVIDER,
          interval: 10000,
          fastestInterval: 10000,
          activitiesInterval: 10000,
          stopOnStillActivity: false,
          pauseLocationUpdates: false,
          saveBatteryOnBackground: false,
          syncThreshold: '0',
          maxLocations: 0,
        },
        () => {
          console.info('SUCCESS');
          BackgroundGeolocation.on('activity', activity => {
            //STILL, IN_VEHICLE, WALKING
            console.info('ACTIVITY:', activity);
            setActivityType(activity.type);
          });
        },
        () => console.info('FAIL'),
      );
    });

    // Onchange
    BackgroundGeolocation.on('location', location => {
      BackgroundGeolocation.startTask(taskKey => {
        const region = Object.assign({}, location, {
          latitudeDelta,
          longitudeDelta,
        });
        getDevice().then(device => {
          console.info('Device read');
          getData('settings').then((setting: Setting) => {
            console.info('Settings read');
            setState((state: any) => ({
              ...state,
              latitude: location.latitude,
              longitude: location.longitude,
              // region: region,
              accuracy: location.accuracy,
              altitude: location.altitude,
              speed: location.speed,
              activity: activityType,
              device: device.id,
            }));
            state &&
              setting.locationEnabled &&
              sendGPSPacket(state).catch(e => console.info('ERROR', e));
            console.log(
              '[DEBUG] BackgroundGeolocation location',
              location,
              activityType,
            );
          });
        });

        BackgroundGeolocation.endTask(taskKey);
      });
    });

    // On Start
    BackgroundGeolocation.on('start', () => {
      console.log('[INFO] BackgroundGeolocation service has been started');

      BackgroundGeolocation.getCurrentLocation(
        location => {
          const region = Object.assign({}, location, {
            latitudeDelta,
            longitudeDelta,
          });
          getDevice().then(device => {
            getData('settings').then((setting: Setting) => {
              setting.locationEnabled &&
                setState((state: any) => ({
                  latitude: location.latitude,
                  longitude: location.longitude,
                  accuracy: location.accuracy,
                  altitude: location.altitude,
                  speed: location.speed,
                  activity: activityType,
                  device: device.id,
                  // region: region,
                }));
            });
          });
        },
        error => {
          setTimeout(() => {
            Alert.alert(
              'Error obtaining current location',
              JSON.stringify(error),
            );
          }, 100);
        },
      );
    });

    BackgroundGeolocation.checkStatus(status => {
      console.log(
        '[INFO] BackgroundGeolocation service is running',
        status.isRunning,
      );
      console.log(
        '[INFO] BackgroundGeolocation services enabled',
        status.locationServicesEnabled,
      );
      console.log(
        '[INFO] BackgroundGeolocation auth status: ' + status.authorization,
      );

      // you don't need to check status before start (this is just the example)
      // if (!status.isRunning) {
      BackgroundGeolocation.start(); //triggers start on start event
      // }
    });

    BackgroundGeolocation.on('background', () => {
      console.log('[INFO] App is in background');
    });

    BackgroundGeolocation.on('foreground', () => {
      console.log('[INFO] App is in foreground');
    });

    BackgroundGeolocation.on('stationary', location => {
      console.log('[DEBUG] BackgroundGeolocation stationary', location);
    });

    return () => {
      BackgroundGeolocation.events.forEach(event =>
        BackgroundGeolocation.removeAllListeners(event),
      );
    };
  }, [enabled, activityType]);

  return {location: state, activity: activityType};
};

export default useBackgroundGeolocationTracker;
