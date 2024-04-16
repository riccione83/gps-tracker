import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect, useRoute} from '@react-navigation/native';
import axios from 'axios';
import React, {useEffect, useState} from 'react';
import {Button, StyleSheet, Text, TextInput, View} from 'react-native';
import {BASE_URL} from '../constants/App';

export default function LogoutScreen({navigation}: any) {
  const {path} = useRoute();

  const deleteData = async () => {
    return AsyncStorage.removeItem('userinfo');
  };

  const logout = async () => {
    return axios.get(BASE_URL + '/logout');
  };

  // useEffect(() => {
  //   if (user) {
  //     navigation.push('Login');
  //   }
  // }, [navigation, user, path]);

  useFocusEffect(
    React.useCallback(() => {
      console.info('Logging out');
      deleteData().then(() => {
        logout()
          .then(() => {
            navigation.push('Login');
          })
          .catch(error => navigation.push('Login'));
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
