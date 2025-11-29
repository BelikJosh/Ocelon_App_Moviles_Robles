// HomeScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { RootStackParamList } from '../navegation/types/navigation';

const BASE_W = 375;
const BASE_H = 812;

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Escalas responsivas
  const hs = (size: number) => (width / BASE_W) * size;
  const vs = (size: number) => (height / BASE_H) * size;
  const ms = (size: number, factor = 0.5) => size + (hs(size) - size) * factor;

  // Tokens
  const PADDING = hs(20);
  const LOGO = Math.min(hs(160), 220);
  const CARD_RADIUS = hs(18);
  const ICON_SIZE = ms(22);
  const MAX_W = 720;

  // Pull to refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  // Modal de cierre de sesión
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutPress = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    // Navegar al LoginScreen y resetear el stack
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <View style={s.container}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          paddingHorizontal: PADDING,
          paddingBottom: vs(24),
        }}
        showsVerticalScrollIndicator={false}
        bounces
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#42b883" />
        }
      >
        <View style={{ width: '100%', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
          {/* Logo con aro */}
          <View
            style={{
              width: LOGO + hs(24),
              height: LOGO + hs(24),
              borderRadius: (LOGO + hs(24)) / 2,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#121215',
              borderWidth: Math.max(1, hs(2)),
              borderColor: '#2a2a30',
              shadowColor: '#000',
              shadowOpacity: 0.35,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 8 },
              elevation: 10,
              marginTop: vs(24),
              marginBottom: vs(16),
            }}
          >
            <Image
              source={require('../../assets/images/Logo_ocelon.jpg')}
              style={{
                width: LOGO,
                height: LOGO,
                borderRadius: hs(24),
                resizeMode: 'contain',
              }}
            />
          </View>

          {/* Slogan */}
          <View style={{ maxWidth: MAX_W, width: '100%', alignItems: 'center' }}>
            <Text style={[s.kicker, { fontSize: ms(14), marginBottom: vs(6) }]}>
              Welcome to Ocelon
            </Text>
            <Text
              style={[
                s.title,
                { fontSize: ms(28), lineHeight: ms(34), marginBottom: vs(8), textAlign: 'center' },
              ]}
            >
              Park with ease, <Text style={{ color: '#42b883' }}>pay with speed</Text>, live a better life.
            </Text>

            {/* Brand row con mini logo */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: hs(8), marginBottom: vs(16) }}>
              <Image
                source={require('../../assets/images/Logo_ocelon.jpg')}
                style={{ width: hs(24), height: hs(24), borderRadius: hs(6) }}
              />
              <Text style={[s.subtitle, { fontSize: ms(13) }]}>Estaciona fácil, paga rápido, vive mejor</Text>
            </View>
          </View>

          {/* Feature cards */}
          <View
            style={{
              flexDirection: 'row',
              gap: hs(12),
              maxWidth: MAX_W,
              width: '100%',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: vs(16),
            }}
          >
            <FeatureCard
              hs={hs}
              vs={vs}
              ms={ms}
              radius={CARD_RADIUS}
              icon={<Ionicons name="car-outline" size={ICON_SIZE} color="#9aa0a6" />}
              title="Entrada ágil"
              text="Genera tu QR en segundos para acceder sin filas."
            />
            <FeatureCard
              hs={hs}
              vs={vs}
              ms={ms}
              radius={CARD_RADIUS}
              icon={<Ionicons name="qr-code-outline" size={ICON_SIZE} color="#9aa0a6" />}
              title="Pago con QR"
              text="Compatible con Open Payments. Simple y directo."
            />
            <FeatureCard
              hs={hs}
              vs={vs}
              ms={ms}
              radius={CARD_RADIUS}
              icon={<Ionicons name="map-outline" size={ICON_SIZE} color="#9aa0a6" />}
              title="Ubica tu sitio"
              text="Consulta mapa y zonas disponibles al instante."
            />
          </View>

          {/* Botón de Cerrar Sesión */}
          <TouchableOpacity
            style={[s.logoutButton, { 
              borderRadius: CARD_RADIUS, 
              paddingVertical: vs(14),
              paddingHorizontal: hs(24),
              marginBottom: vs(16),
            }]}
            onPress={handleLogoutPress}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={ms(20)} color="#ff6b6b" />
            <Text style={[s.logoutButtonText, { fontSize: ms(15) }]}>Cerrar Sesión</Text>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={[s.footer, { fontSize: ms(12), marginBottom: vs(24) }]}>
            © {new Date().getFullYear()} Ocelon — All rights reserved.
          </Text>
        </View>
      </ScrollView>

      {/* Modal de Agradecimiento */}
      <Modal
        visible={showLogoutModal}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCancelLogout}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { maxWidth: width * 0.85, borderRadius: hs(16) }]}>
            {/* Logo de Ocelon */}
            <View style={[s.modalLogoContainer, { 
              width: hs(100), 
              height: hs(100), 
              borderRadius: hs(50) 
            }]}>
              <Image
                source={require('../../assets/images/Logo_ocelon.jpg')}
                style={[s.modalLogo, { 
                  width: hs(80), 
                  height: hs(80), 
                  borderRadius: hs(16) 
                }]}
                resizeMode="cover"
              />
            </View>

            {/* Título */}
            <Text style={[s.modalTitle, { fontSize: ms(22) }]}>
              ¡Gracias por usar Ocelon!
            </Text>

            {/* Subtítulo */}
            <Text style={[s.modalSubtitle, { fontSize: ms(14) }]}>
              Esperamos verte pronto de nuevo. ¡Buen viaje!
            </Text>

            {/* Botones */}
            <View style={s.modalButtons}>
              <TouchableOpacity
                style={[s.cancelButton, { 
                  borderRadius: hs(12), 
                  paddingVertical: vs(14),
                  flex: 1,
                }]}
                onPress={handleCancelLogout}
                activeOpacity={0.8}
              >
                <Text style={[s.cancelButtonText, { fontSize: ms(15) }]}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.confirmButton, { 
                  borderRadius: hs(12), 
                  paddingVertical: vs(14),
                  flex: 1,
                }]}
                onPress={handleConfirmLogout}
                activeOpacity={0.8}
              >
                <Ionicons name="log-out-outline" size={ms(18)} color="#0b0b0c" />
                <Text style={[s.confirmButtonText, { fontSize: ms(15) }]}>Salir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function FeatureCard({
  hs,
  vs,
  ms,
  radius,
  icon,
  title,
  text,
}: {
  hs: (n: number) => number;
  vs: (n: number) => number;
  ms: (n: number, f?: number) => number;
  radius: number;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <View
      style={{
        backgroundColor: '#151518',
        borderRadius: radius,
        paddingVertical: vs(14),
        paddingHorizontal: hs(14),
        width: '100%',
        maxWidth: 360,
        borderWidth: 1,
        borderColor: '#202028',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: hs(10), marginBottom: vs(6) }}>
        <View
          style={{
            width: hs(36),
            height: hs(36),
            borderRadius: hs(10),
            backgroundColor: '#1b1b20',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#2a2a30',
          }}
        >
          {icon}
        </View>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: ms(16) }}>{title}</Text>
      </View>
      <Text style={{ color: '#a9a9b3', fontSize: ms(13), lineHeight: ms(18) }}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0c' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  kicker: { color: '#9f9faf', letterSpacing: 0.5 },
  title: { color: '#ffffff', fontWeight: '800' },
  subtitle: { color: '#c9c9cf' },
  footer: { color: '#85859a' },

  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  logoutButtonText: {
    color: '#ff6b6b',
    fontWeight: '700',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#131318',
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#42b883',
    width: '100%',
  },
  modalLogoContainer: {
    backgroundColor: 'rgba(66, 184, 131, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#42b883',
  },
  modalLogo: {
    borderWidth: 0,
  },
  modalTitle: {
    color: '#fff',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: '#9aa0a6',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3a3a42',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#9aa0a6',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#42b883',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonText: {
    color: '#0b0b0c',
    fontWeight: '800',
  },
});