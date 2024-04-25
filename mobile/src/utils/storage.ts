import AsyncStorage from '@react-native-async-storage/async-storage';

type StorageType = 'userinfo' | 'deviceinfo' | 'settings' | 'history';

export const storeData = async <T, _>(type: StorageType, value: T) => {
  try {
    await AsyncStorage.setItem(type, JSON.stringify(value));
  } catch (e) {
    console.info('ERROR!!!!', e);
  }
};

export const getData = async (type: StorageType) => {
  try {
    const jsonValue = await AsyncStorage.getItem(type);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    // error reading value
  }
};
