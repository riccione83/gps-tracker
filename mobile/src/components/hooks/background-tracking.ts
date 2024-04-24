import {useEffect, useState} from 'react';
import BackgroundGeolocation from '@mak12/react-native-background-geolocation';
import {Platform, Alert} from 'react-native';
import {getData} from '../../utils/storage';
import {GPSPacket, sendGPSPacket} from '../../main';
import {BASE_URL} from '../../constants/App';
import {Setting} from '../../models/settings';

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
          stationaryRadius: 50,
          distanceFilter: 5,
          notificationTitle: 'Background tracking',
          notificationText: 'enabled',
          debug: true,
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
          maxLocations: 1,
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
      console.log(
        '[DEBUG] BackgroundGeolocation location',
        location,
        activityType,
      );

      BackgroundGeolocation.startTask(taskKey => {
        const region = Object.assign({}, location, {
          latitudeDelta,
          longitudeDelta,
        });
        getDevice().then(device => {
          getData('settings').then((setting: Setting) => {
            console.info('Current settings:', setting);
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
            console.info('SENDING:', setting.locationEnabled);
            state && setting.locationEnabled && sendGPSPacket(state);
          });
        });

        BackgroundGeolocation.endTask(taskKey);
      });
    });

    // On Start
    BackgroundGeolocation.on('start', () => {
      console.log('[INFO] BackgroundGeolocation service has been started');

      // BackgroundGeolocation.getCurrentLocation(
      //   location => {
      //     const region = Object.assign({}, location, {
      //       latitudeDelta,
      //       longitudeDelta,
      //     });
      //     getDevice().then(device => {
      //       setState((state: any) => ({
      //         ...state,
      //         longitude: location.longitude,
      //         accuracy: location.accuracy,
      //         altitude: location.altitude,
      //         speed: location.speed,
      //         activity: activityType,
      //         device: device.id,
      //         // region: region,
      //       }));
      //     });
      //   },
      //   error => {
      //     setTimeout(() => {
      //       Alert.alert(
      //         'Error obtaining current location',
      //         JSON.stringify(error),
      //       );
      //     }, 100);
      //   },
      // );
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

  return state;
};

export default useBackgroundGeolocationTracker;
