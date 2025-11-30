// AppTabs.tsx - Versión con 5 tabs y TimerFloatingBar
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import TimerFloatingBar from '../components/TimerFloatingBar';
import { useAuthState } from '../hooks/useAuthState';
import { useConfig } from '../contexts/ConfigContext'; // Importa el hook de configuración
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
  const { t, isDark } = useConfig(); // Usa el hook de configuración

  // Colores dinámicos según el tema
  const colors = {
    background: isDark ? '#002618ff' : '#e8f5e8',
    text: isDark ? '#42b883' : '#2e7d32',
    textSecondary: isDark ? '#85e0b3' : '#4caf50',
    button: isDark ? '#42b883' : '#2e7d32',
    buttonText: isDark ? '#0b0b0c' : '#ffffff',
    iconButton: isDark ? 'rgba(66, 184, 131, 0.1)' : 'rgba(46, 125, 50, 0.1)',
  };

  return (
    <View style={[styles.topBarContainer, { 
      paddingTop: insets.top + 12,
      backgroundColor: colors.background 
    }]}>
      <TouchableOpacity style={styles.profileSection} onPress={onPressProfile} activeOpacity={0.7}>
        <View style={[styles.avatarCircle, { backgroundColor: colors.button }]}>
          <Ionicons name="person" size={20} color={colors.buttonText} />
        </View>
        <View>
          <Text style={[styles.greeting, { color: colors.text }]}>
            {t('hello')}, {userName}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.userStatus, { color: colors.textSecondary }]}>{userStatus}</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.text} />
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.rightSection}>
        <TouchableOpacity 
          style={[styles.iconButton, { backgroundColor: colors.iconButton }]} 
          onPress={onPressNotifications} 
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
          <View style={styles.badge} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.iconButton, styles.supportButton, { backgroundColor: colors.button }]} 
          onPress={onPressSupport} 
          activeOpacity={0.7}
        >
          <MaterialIcons name="headset-mic" size={20} color={colors.buttonText} />
          <Text style={[styles.supportText, { color: colors.buttonText }]}>{t('support')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Wrapper con Modal de Soporte Y TimerFloatingBar
function ScreenWithTopBar({ Component, navigation }: { Component: any; navigation: any }) {
  const insets = useSafeAreaInsets();
  const [showSupport, setShowSupport] = useState(false);
  const { t, isDark } = useConfig(); // Usa el hook de configuración

  const { usuario, esInvitado, loading } = useAuthState();

  // Colores dinámicos según el tema
  const colors = {
    background: isDark ? '#0b0b0c' : '#f5f5f5',
    text: isDark ? '#42b883' : '#2e7d32',
    card: isDark ? '#121218' : '#ffffff',
    border: isDark ? '#1e1e1e' : '#e0e0e0',
  };

  const getUserName = () => {
    if (loading) return t('loading');
    if (usuario) return usuario.nombre;
    return t('guest');
  };

  const getUserStatus = () => {
    if (loading) return t('loading');
    if (usuario) return t('premiumUser');
    if (esInvitado) return t('guestMode');
    return t('notAuthenticated');
  };

  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: colors.background, 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <Text style={{ color: colors.text }}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
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

        {/* TimerFloatingBar */}
        <TimerFloatingBar />
      </View>

      {/* Modal de Soporte */}
      <Modal
        visible={showSupport}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSupport(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[styles.modalHeader, { 
            paddingTop: insets.top - 20,
            backgroundColor: colors.background 
          }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('support')}</Text>
            <TouchableOpacity
              onPress={() => setShowSupport(false)}
              style={[styles.closeButton, { backgroundColor: colors.card }]}
            >
              <Ionicons name="close" size={28} color={colors.text} />
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
  const { isDark } = useConfig();

  const colors = {
    button: isDark ? '#42b883' : '#2e7d32',
    buttonText: isDark ? '#0b0b0c' : '#ffffff',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.95}
      style={[
        styles.scannerButton, 
        { backgroundColor: colors.button },
        focused && { transform: [{ scale: 0.98 }] }
      ]}
      accessibilityRole="button"
      accessibilityLabel="Abrir escáner QR"
      accessibilityState={{ selected: !!focused }}
    >
      <MaterialIcons name="qr-code-scanner" size={34} color={colors.buttonText} />
    </TouchableOpacity>
  );
}

export default function AppTabs() {
  const { t, isDark } = useConfig();

  // Colores dinámicos para la tab bar
  const colors = {
    background: isDark ? '#121218' : '#ffffff',
    active: isDark ? '#42b883' : '#2e7d32',
    inactive: isDark ? '#174d34ff' : '#81c784',
    tabBarBg: isDark ? '#121218' : '#f8f9fa',
    shadow: isDark ? '#42b883' : '#2e7d32',
  };

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.active,
        tabBarInactiveTintColor: colors.inactive,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 6
        },
        tabBarStyle: [styles.tabBar, { 
          backgroundColor: 'transparent' 
        }],
        tabBarBackground: () => (
          <View style={[
            styles.tabBarBg, 
            { 
              backgroundColor: colors.tabBarBg,
              shadowColor: colors.shadow,
            }
          ]} />
        ),
      }}
    >
      <Tab.Screen
        name="Home"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          tabBarLabel: t('home')
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
          tabBarLabel: t('wallet')
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
          tabBarLabel: t('map')
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
          tabBarLabel: t('settings')
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
    justifyContent: 'center',
    alignItems: 'center'
  },
  greeting: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2
  },
  userStatus: {
    fontSize: 11,
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
    paddingHorizontal: 12,
    width: 'auto',
    gap: 6
  },
  supportText: {
    fontSize: 13,
    fontWeight: '600',
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    borderBottomWidth: 0,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
});