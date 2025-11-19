// AppTabs.tsx - Versión con 5 tabs y TimerFloatingBar
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import TimerFloatingBar from '../components/TimerFloatingBar'; // ← AGREGAR ESTA IMPORTACIÓN
import { useAuthState } from '../hooks/useAuthState';
import ConfigScreen from './ConfigScreen';
import HomeScreen from './HomeScreen';
import MapScreen from './MapScreen';
import ScannerScreen from './ScannerScreen';
import SupportScreen from './SupportScreen';
import WalletStack from './WalletScreen';

// ----------------- TOP BAR -----------------
interface TopBarProps {
  userName?: string;
  userStatus?: string;
  onPressProfile?: () => void;
  onPressNotifications?: () => void;
  onPressSupport?: () => void;
}

function TopBar({
  userName = 'Usuario',
  userStatus = 'Invitado',
  onPressProfile,
  onPressNotifications,
  onPressSupport,
}: TopBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.topBarContainer, { paddingTop: insets.top + 12 }]}>
      <TouchableOpacity style={styles.profileSection} onPress={onPressProfile} activeOpacity={0.7}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={20} color="#0b0b0c" />
        </View>
        <View>
          <Text style={styles.greeting}>Hola, {userName}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.userStatus}>{userStatus}</Text>
            <Ionicons name="chevron-forward" size={14} color="#42b883" />
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.rightSection}>
        <TouchableOpacity style={styles.iconButton} onPress={onPressNotifications} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={24} color="#42b883" />
          <View style={styles.badge} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.iconButton, styles.supportButton]} onPress={onPressSupport} activeOpacity={0.7}>
          <MaterialIcons name="headset-mic" size={20} color="#0b0b0c" />
          <Text style={styles.supportText}>Soporte</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Wrapper con Modal de Soporte Y TimerFloatingBar
function ScreenWithTopBar({ Component, navigation }: { Component: any; navigation: any }) {
  const insets = useSafeAreaInsets();
  const [showSupport, setShowSupport] = useState(false);
  
  const { usuario, esInvitado, loading } = useAuthState();

  const getUserName = () => {
    if (loading) return 'Cargando...';
    if (usuario) return usuario.nombre;
    return 'Invitado';
  };

  const getUserStatus = () => {
    if (loading) return 'Cargando...';
    if (usuario) return 'Usuario Premium';
    if (esInvitado) return 'Modo Invitado';
    return 'No autenticado';
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0b0b0c', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#42b883' }}>Cargando...</Text>
      </View>
    );
  }

  return (
    <>
      <View style={{ flex: 1, backgroundColor: '#0b0b0c' }}>
        <TopBar 
          userName={getUserName()}
          userStatus={getUserStatus()}
          onPressProfile={() => console.log('ProfileScreen')}
          onPressNotifications={() => console.log('NotifScreen')}
          onPressSupport={() => setShowSupport(true)}
        />
        <View style={{ flex: 1, paddingBottom: 74 + insets.bottom }}>
          <Component />
        </View>
        
        {/* ← AGREGAR TimerFloatingBar AQUÍ - Aparece en TODAS las pantallas */}
        <TimerFloatingBar />
      </View>

      {/* Modal de Soporte */}
      <Modal
        visible={showSupport}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSupport(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#0b0b0c' }}>
          <View style={[styles.modalHeader, { paddingTop: insets.top - 20 }]}>
            <Text style={styles.modalTitle}>Soporte</Text>
            <TouchableOpacity 
              onPress={() => setShowSupport(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color="#42b883" />
            </TouchableOpacity>
          </View>
          <SupportScreen />
        </View>
      </Modal>
    </>
  );
}

// ----------------- TABS -----------------
const Tab = createBottomTabNavigator();

// Botón del Scanner centrado
function ScannerTabButton(props: any) {
  const { onPress, accessibilityState } = props;
  const focused = accessibilityState?.selected;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.95}
      style={[styles.scannerButton, focused && { transform: [{ scale: 0.98 }] }]}
      accessibilityRole="button"
      accessibilityLabel="Abrir escáner QR"
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
        tabBarLabelStyle: { 
          fontSize: 12, 
          fontWeight: '600', 
          marginBottom: 6 
        },
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => <View style={styles.tabBarBg} />,
      }}
    >
      <Tab.Screen
        name="Home"
        options={{ 
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ), 
          tabBarLabel: 'Home' 
        }}
      >
        {(props) => <ScreenWithTopBar Component={HomeScreen} navigation={props.navigation} />}
      </Tab.Screen>

      <Tab.Screen
        name="Wallet"
        options={{ 
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="wallet" size={size} color={color} />
          ), 
          tabBarLabel: 'Wallet' 
        }}
      >
        {(props) => <ScreenWithTopBar Component={WalletStack} navigation={props.navigation} />}
      </Tab.Screen>

      {/* Scanner como botón flotante centrado */}
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          tabBarButton: (props) => <ScannerTabButton {...props} />,
        }}
      />

      <Tab.Screen
        name="Map"
        options={{ 
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ), 
          tabBarLabel: 'Map' 
        }}
      >
        {(props) => <ScreenWithTopBar Component={MapScreen} navigation={props.navigation} />}
      </Tab.Screen>

      <Tab.Screen
        name="Config"
        options={{ 
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ), 
          tabBarLabel: 'Config' 
        }}
      >
        {(props) => <ScreenWithTopBar Component={ConfigScreen} navigation={props.navigation} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// ----------------- STYLES -----------------
const styles = StyleSheet.create({
  topBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#002618ff',
    borderBottomWidth: 0,
  },
  profileSection: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
  avatarCircle: { 
    width: 42, 
    height: 42, 
    borderRadius: 21, 
    backgroundColor: '#42b883', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  greeting: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#42b883', 
    marginBottom: 2 
  },
  userStatus: { 
    fontSize: 11, 
    color: '#85e0b3', 
    fontWeight: '500',
    marginRight: 4
  },
  rightSection: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
  iconButton: { 
    width: 42, 
    height: 42, 
    borderRadius: 21, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(66, 184, 131, 0.1)' 
  },
  badge: { 
    position: 'absolute', 
    top: 8, 
    right: 8, 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: '#ff4444' 
  },
  supportButton: { 
    flexDirection: 'row', 
    backgroundColor: '#42b883', 
    paddingHorizontal: 12, 
    width: 'auto', 
    gap: 6 
  },
  supportText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#0b0b0c' 
  },

  // Tab Bar - Mejor distribución para 5 tabs
  tabBar: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    height: 74, 
    borderTopWidth: 0, 
    elevation: 0, 
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
  },
  tabBarBg: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: '#121218', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    shadowColor: '#42b883', 
    shadowOpacity: 0.18, 
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
  },
  
  // Scanner button - Perfectamente centrado para 5 tabs
  scannerButton: { 
    position: 'absolute', 
    bottom: 20,
    left: '50%',
    marginLeft: -34, // Mitad del width (68/2) para centrar perfectamente
    width: 68, 
    height: 68, 
    borderRadius: 34, 
    backgroundColor: '#42b883', 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOpacity: 0.3, 
    shadowRadius: 12, 
    shadowOffset: { width: 0, height: 5 }, 
    elevation: 12,
    zIndex: 1,
  },
  
  // Modal styles
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#0b0b0c',
    borderBottomWidth: 0,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(66, 184, 131, 0.1)',
  },
});