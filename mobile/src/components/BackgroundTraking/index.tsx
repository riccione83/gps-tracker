import BackgroundGeolocation, {
  ConfigureOptions,
} from '@mak12/react-native-background-geolocation';
import axios from 'axios';
import {useEffect, useState} from 'react';
import {Alert} from 'react-native';
import {isEnabled} from 'react-native/Libraries/Performance/Systrace';
import {BASE_URL} from '../../constants/App';
import {GPSPacket} from '../../main';
import useDevice from '../hooks/use-device';
import {getData} from '../../utils/storage';

const useTracking = (enabled: boolean) => {
  const [backgroud, setBackground] = useState(false);
  const [pause, setPause] = useState(false);
  const [activityType, setActivityType] = useState<string | null>(null);
  const [currentLocation, setLocation] = useState<GPSPacket | null>(null);
  const {currentDevice} = useDevice();

  const config: ConfigureOptions = {
    desiredAccuracy: BackgroundGeolocation.MEDIUM_ACCURACY,
    stationaryRadius: 50, //50
    distanceFilter: 50, //50
    notificationTitle: 'Background tracking',
    notificationText: 'enabled',
    debug: true,
    startOnBoot: true,
    stopOnTerminate: false,
    locationProvider: BackgroundGeolocation.ACTIVITY_PROVIDER,
    interval: 5000, //10000
    fastestInterval: 5000, //5000
    activitiesInterval: 5000, //10000
    stopOnStillActivity: false,
    notificationsEnabled: true,
    saveBatteryOnBackground: false,
  };

  useEffect(() => {
    console.info('HERE2');
    currentDevice &&
      BackgroundGeolocation.getCurrentLocation(location => {
        console.info('Getting current location', location);
        setPause(true);
        const gps: GPSPacket = {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          altitude: location.altitude,
          speed: location.speed,
          activity: activityType,
          device: currentDevice.id,
        };
        setLocation(gps);
      });
  }, [currentDevice]);

  useEffect(() => {
    const getDevice = async () => {
      return await getData('deviceinfo');
    };

    BackgroundGeolocation.configure(config);

    BackgroundGeolocation.on('activity', activity => {
      //STILL, IN_VEHICLE, WALKING
      console.info('ACTIVITY:', activity);
      setActivityType(activity.type);
    });

    BackgroundGeolocation.on('location', location => {
      console.info('Reading from background');
      getDevice().then(device => {
        console.info('Backgound: On location', device, enabled);
        if (device && location) {
          setPause(false);
          const gps: GPSPacket = {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            altitude: location.altitude,
            speed: location.speed,
            activity: activityType,
            device: (device as any).id,
          };
          setLocation(gps);

          BackgroundGeolocation.startTask(async taskKey => {
            // execute long running task
            // eg. ajax post location
            // IMPORTANT: task has to be ended by endTask
            // if (backgroud) {
            console.info('From background task: SEND PACKET', taskKey);
            await axios
              .post(BASE_URL + '/gps', {...gps, activity: 'BACKGROUND'})
              .then(response =>
                console.info('Sent GPS packet from background:', response.data),
              )
              .catch(error => console.info('Error on GPS packet', error, gps));
            // }
            BackgroundGeolocation.endTask(taskKey);
          });
        }
        // else {
        //   setPause(true);
        // }
      });
    });

    BackgroundGeolocation.on('stationary', stationaryLocation => {
      console.info('Device is stationary', stationaryLocation);
      setPause(true);
      // handle stationary locations here
      //   Actions.sendLocation(stationaryLocation);
    });

    BackgroundGeolocation.on('error', error => {
      console.info('[ERROR] BackgroundGeolocation error:', error);
    });

    BackgroundGeolocation.on('start', () => {
      console.info('[INFO] BackgroundGeolocation service has been started');
    });

    BackgroundGeolocation.on('stop', () => {
      console.info('[INFO] BackgroundGeolocation service has been stopped');
    });

    BackgroundGeolocation.on('authorization', status => {
      console.info(
        '[INFO] BackgroundGeolocation authorization status: ' + status,
      );
      if (status !== BackgroundGeolocation.AUTHORIZED) {
        // we need to set delay or otherwise alert may not be shown
        setTimeout(
          () =>
            Alert.alert(
              'App requires location tracking permission',
              'Would you like to open app settings?',
              [
                {
                  text: 'Yes',
                  onPress: () => BackgroundGeolocation.showAppSettings(),
                },
                {
                  text: 'No',
                  onPress: () => console.log('No Pressed'),
                  style: 'cancel',
                },
              ],
            ),
          1000,
        );
      }
    });

    BackgroundGeolocation.on('background', () => {
      console.info('[INFO] App is in background');
      setBackground(true);
    });

    BackgroundGeolocation.on('foreground', () => {
      console.info('[INFO] App is in foreground');
      setBackground(false);
    });

    BackgroundGeolocation.on('abort_requested', () => {
      console.info('[INFO] Server responded with 285 Updates Not Required');

      // Here we can decide whether we want stop the updates or not.
      // If you've configured the server to return 285, then it means the server does not require further update.
      // So the normal thing to do here would be to `BackgroundGeolocation.stop()`.
      // But you might be counting on it to receive location updates in the UI, so you could just reconfigure and set `url` to null.
    });

    BackgroundGeolocation.on('http_authorization', () => {
      console.info('[INFO] App needs to authorize the http requests');
    });

    BackgroundGeolocation.checkStatus(status => {
      console.info(
        '[INFO] BackgroundGeolocation service is running',
        status.isRunning,
      );
      console.info(
        '[INFO] BackgroundGeolocation services enabled',
        status.locationServicesEnabled,
      );
      console.info(
        '[INFO] BackgroundGeolocation auth status: ' + status.authorization,
      );
      // you don't need to check status before start (this is just the example)
      if (!status.isRunning) {
        BackgroundGeolocation.start(); //triggers start on start event
      }
    });

    // you can also just start without checking for status
    // BackgroundGeolocation.start();

    return () =>
      (console.info('ENDING') as any) ||
      BackgroundGeolocation.removeAllListeners();
  }, []); //[currentDevice, backgroud, isEnabled, activityType, pause]);

  return {
    location: currentLocation,
    backgroud,
    pause,
    activityType,
  };
};

export default useTracking;
