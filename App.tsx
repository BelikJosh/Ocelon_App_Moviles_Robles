// App.tsx
import 'react-native-gesture-handler';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import 'text-encoding-polyfill';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

import { ConfigProvider } from './src/contexts/ConfigContext'; // Añade esta línea
import { RootStackParamList } from './src/navegation/types/navigation';

import AppTabs from './src/pages/AppTabs';
import CrearUsuarioScreen from './src/pages/CrearUsuarioScreen';
import EditProfileScreen from './src/pages/EditProfileScreen';
import ExitScreen from './src/pages/ExitScreen';
import LoginScreen from './src/pages/LoginScreen';
import ProfileScreen from './src/pages/ProfileScreen';
import SplashScreen from './src/pages/SplashScreen';
import TimerScreen from './src/pages/TimerScreen';
import ValorationScreen from './src/pages/ValorationScreen';
import WalletScreen from './src/pages/WalletScreen';
import CashPayment from './src/payments/CashPayment';
import DigitalPayment from './src/payments/DigitalPayment';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <ConfigProvider> {/* Envuelve todo con el ConfigProvider */}
      <NavigationContainer>
        <StatusBar style="auto" /> {/* Cambia a "auto" para que se adapte al tema */}
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="AppTabs" component={AppTabs} />
          <Stack.Screen name="CrearUsuario" component={CrearUsuarioScreen} />
          <Stack.Screen name="Timer" component={TimerScreen} />
          <Stack.Screen name="CashPayment" component={CashPayment} />
          <Stack.Screen name="DigitalPayment" component={DigitalPayment} />
          <Stack.Screen name="ExitScreen" component={ExitScreen} />
          <Stack.Screen name="ValorationScreen" component={ValorationScreen} />
          <Stack.Screen name="WalletScreen" component={WalletScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ConfigProvider>
  );
}