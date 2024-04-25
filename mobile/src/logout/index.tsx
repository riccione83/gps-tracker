import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect} from '@react-navigation/native';
import axios from 'axios';
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {BASE_URL} from '../constants/App';

export default function LogoutScreen({navigation}: any) {
  const deleteData = async () => {
    return AsyncStorage.removeItem('userinfo');
  };

  const logout = async () => {
    return axios.get(BASE_URL + '/logout');
  };

  useFocusEffect(
    React.useCallback(() => {
      console.info('Logging out');
      deleteData().then(() => {
        logout()
          .then(() => {
            navigation.push('Login');
          })
          .catch(() => navigation.push('Login'));
      });
    }, []), //TODO check for path
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Logging out</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 32,
  },
});
