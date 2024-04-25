import {useFocusEffect, useRoute} from '@react-navigation/native';
import axios from 'axios';
import React, {useEffect, useState} from 'react';
import {Button, StyleSheet, Text, TextInput, View} from 'react-native';
import {BASE_URL} from '../constants/App';
import {getData, storeData} from '../utils/storage';

export default function LoginScreen({navigation}: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setCurrentUser] = useState<any | null>(null);
  const [error, setError] = useState('');
  const {path} = useRoute();

  const login = async (email: string, password: string) => {
    return axios.post(BASE_URL + '/login', {
      email,
      password,
    });
  };

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (user) {
        navigation.push('Main');
      }
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (user) {
      navigation.push('Main');
    }
  }, [navigation, user, path]);

  useFocusEffect(
    React.useCallback(() => {
      const uData = async () => {
        const user = await getData('userinfo');
        if (user) {
          login(user.email, user.password)
            .then(async response => {
              setCurrentUser(response.data);
              const _user = response.data;
              _user.password = user.password;
              await storeData('userinfo', _user);
            })
            .catch(error => setError(error.message));
        }
      };

      if (!user) {
        uData();
      }

      return () => {};
    }, [user, path]),
  );

  const handleLogin = () => {
    setError('');
    login(email, password)
      .then(async response => {
        setCurrentUser(response.data);
        await storeData('userinfo', {...response.data, password: password});
      })
      .catch(error => (console.info(error) as any) || setError(error.message));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      {error !== '' && <Text style={styles.errorTitle}>{error}</Text>}
      <View style={styles.separator} />
      <TextInput
        style={styles.input}
        placeholder="Email"
        textContentType="emailAddress"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        onChangeText={e => setEmail(e)}
      />
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="Password"
        autoCapitalize="none"
        onChangeText={e => setPassword(e)}
      />
      <Button title="Login" onPress={() => handleLogin()} />
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
  errorTitle: {
    fontSize: 14,
    fontWeight: 'normal',
    color: 'red',
    marginTop: 32,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    minWidth: 300,
  },
});
