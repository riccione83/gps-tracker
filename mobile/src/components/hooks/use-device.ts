import {useLazyQuery} from '@apollo/client';
import {useEffect, useState} from 'react';
import DeviceInfo from 'react-native-device-info';
import {checkDeviceQuery} from '../../queries';
import {getData, storeData} from '../../utils/storage';

const useDevice = () => {
  const [currentDevice, setCurrentDevice] = useState<any | null>(null);
  const [currentDeviceDisplay, setCurrentDeviceDisplay] = useState<any | null>(
    null,
  );
  const [checkDevice] = useLazyQuery(checkDeviceQuery, {
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    const getDevice = async () => {
      if (!currentDevice) {
        const deviceFromStorage = await getData('deviceinfo');
        if (deviceFromStorage) {
          setCurrentDevice(deviceFromStorage);
        } else {
          DeviceInfo.getDeviceName().then((display: any) => {
            setCurrentDeviceDisplay(display);
            const deviceId = DeviceInfo.getDeviceId() + '_' + display;
            checkDevice({
              variables: {
                serial: deviceId,
              },
            })
              .then(async result => {
                if (result.data?.checkDevice) {
                  setCurrentDevice(result.data?.checkDevice);
                  await storeData('deviceinfo', result.data?.checkDevice);
                }
              })
              .catch(() => {});
          });
        }
      }
    };

    getDevice();
  }, []);

  return {currentDevice, currentDeviceDisplay};
};

export default useDevice;
