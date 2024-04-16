/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import {ApolloClient, ApolloProvider, InMemoryCache} from '@apollo/client';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  ThemeProvider,
} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';
import {Button, useColorScheme} from 'react-native';
import {BASE_URL} from './src/constants/App';
import LoginScreen from './src/login';
import MainScreen from './src/main';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import LogoutScreen from './src/logout';

const App = () => {
  const colorScheme = useColorScheme();
  const Stack = createNativeStackNavigator();

  // Initialize Apollo Client
  const client = new ApolloClient({
    uri: BASE_URL + '/api',
    cache: new InMemoryCache(),
  });

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ApolloProvider client={client}>
        <GestureHandlerRootView style={{flex: 1}}>
          <NavigationContainer>
            <Stack.Navigator initialRouteName="Login">
              <Stack.Screen
                name="Main"
                component={MainScreen}
                options={{
                  title: 'Welcome',
                }}
              />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen
                name="Logout"
                component={LogoutScreen}
                options={{animation: 'none'}}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </GestureHandlerRootView>
      </ApolloProvider>
    </ThemeProvider>
  );
};

export default App;
