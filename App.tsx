import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import 'text-encoding-polyfill';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { RootStackParamList } from './src/navegation/types/navigation';
import AppTabs from './src/pages/AppTabs';
import CrearUsuarioScreen from './src/pages/CrearUsuarioScreen';
import LoginScreen from './src/pages/LoginScreen';


const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (

    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="AppTabs" component={AppTabs} />
        <Stack.Screen name="CrearUsuario" component={CrearUsuarioScreen} /> 

      </Stack.Navigator>
    </NavigationContainer>

  );
}