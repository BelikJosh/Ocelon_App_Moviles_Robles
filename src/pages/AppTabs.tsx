// AppTabs.tsx
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 👉 Usa tu HomeScreen real
import HomeScreen from './HomeScreen';

// Si ya tienes estas páginas reales, importa desde ./pages/* si aplica
import ConfigScreen from './ConfigScreen';
import MapScreen from './MapScreen';
import ScannerScreen from './ScannerScreen';
import WalletScreen from './WalletScreen';

// Perfil (dummy). Si ya tienes uno real, impórtalo y borra este comp
function ProfileScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0b0b0c' }} edges={['top', 'left', 'right']}>
      <View style={s.center}>
        <Ionicons name="person-circle" size={84} color="#cfcfff" />
        <Text style={s.title}>Tu perfil</Text>
        <Text style={s.text}>Configura tus datos y preferencias.</Text>
      </View>
    </SafeAreaView>
  );
}

// ----------------- TABS -----------------
const Tab = createBottomTabNavigator();

function ScannerTabButton(props: any) {
  const { onPress, accessibilityState } = props;
  const focused = accessibilityState?.selected;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.95}
      style={[styles.scannerButton, focused && { transform: [{ scale: 0.98 }] }]}
      accessibilityRole="button"
      accessibilityLabel="Abrir escáner"
      accessibilityState={{ selected: !!focused }}
    >
      <MaterialIcons name="qr-code-scanner" size={34} color="#0b0b0c" />
    </TouchableOpacity>
  );
}

export default function AppTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#42b883',
        tabBarInactiveTintColor: '#174d34ff',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => <View style={styles.tabBarBg} />,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}   // 👈 ahora sí importado
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
          tabBarLabel: 'Home',
        }}
      />

      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          tabBarIcon: ({ color, size }) => <FontAwesome5 name="wallet" size={size} color={color} />,
          tabBarLabel: 'Wallet',
        }}
      />

      {/* Botón central flotante: Scanner */}
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          tabBarLabel: '',
          tabBarButton: (props) => <ScannerTabButton {...props} />,
        }}
      />

      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} />,
          tabBarLabel: 'Map',
        }}
      />

      <Tab.Screen
        name="Config"
        component={ConfigScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
          tabBarLabel: 'Config',
        }}
      />
    </Tab.Navigator>
  );
}

// ----------------- STYLES -----------------
const styles = StyleSheet.create({
  tabBar: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: 74,
  borderTopWidth: 0,
  elevation: 0,
  backgroundColor: 'transparent',
  alignItems: 'center',
  justifyContent: 'center',
  },
 
  tabBarBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#121218',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#42b883',
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  scannerButton: {
  position: 'absolute',
  bottom: 20,
  alignSelf: 'center',
  width: 68,
  height: 68,
  borderRadius: 34,
  backgroundColor: '#42b883',
  justifyContent: 'center',
  alignItems: 'center',
  shadowColor: '#000',
  shadowOpacity: 0.3,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 5 },
  elevation: 10,
  },
});

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  title: { fontSize: 22, fontWeight: '800', color: '#42b883', marginBottom: 6 },
  text: { fontSize: 14, color: '#42b883' },
});

