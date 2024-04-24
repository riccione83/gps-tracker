import AsyncStorage from '@react-native-async-storage/async-storage';

type StorageType = 'userinfo' | 'deviceinfo' | 'settings';

export const storeData = async <T, _>(type: StorageType, value: T) => {
  try {
    console.info('Saving', value);
    await AsyncStorage.setItem(type, JSON.stringify(value));
  } catch (e) {
    // saving error
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
