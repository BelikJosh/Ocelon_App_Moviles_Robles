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
import { useConfig } from '../contexts/ConfigContext'; // Importa el hook

const BASE_W = 375;
const BASE_H = 812;

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t, isDark } = useConfig(); // Usa el hook de configuración

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

  // Colores dinámicos según el tema
  const colors = {
    background: isDark ? '#0b0b0c' : '#f8f9fa',
    card: isDark ? '#151518' : '#ffffff',
    text: isDark ? '#ffffff' : '#000000',
    textSecondary: isDark ? '#a0a0a0' : '#666666',
    border: isDark ? '#202028' : '#e0e0e0',
    primary: '#42b883',
    secondary: isDark ? '#1b1b20' : '#f1f3f4',
    error: isDark ? '#ff6b6b' : '#d32f2f',
    overlay: isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.7)',
  };

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
    <View style={[s.container, { backgroundColor: colors.background }]}>
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
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
              backgroundColor: colors.secondary,
              borderWidth: Math.max(1, hs(2)),
              borderColor: colors.border,
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
            <Text style={[s.kicker, { 
              fontSize: ms(14), 
              marginBottom: vs(6),
              color: colors.textSecondary 
            }]}>
              {t('welcomeTo')} Ocelon
            </Text>
            <Text
              style={[
                s.title, 
                { 
                  fontSize: ms(28), 
                  lineHeight: ms(34), 
                  marginBottom: vs(8), 
                  textAlign: 'center',
                  color: colors.text 
                },
              ]}
            >
              {t('sloganPart1')} <Text style={{ color: colors.primary }}>{t('sloganPart2')}</Text>, {t('sloganPart3')}
            </Text>

            {/* Brand row con mini logo */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: hs(8), marginBottom: vs(16) }}>
              <Image
                source={require('../../assets/images/Logo_ocelon.jpg')}
                style={{ width: hs(24), height: hs(24), borderRadius: hs(6) }}
              />
              <Text style={[s.subtitle, { 
                fontSize: ms(13),
                color: colors.textSecondary 
              }]}>{t('spanishSlogan')}</Text>
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
              colors={colors}
              icon={<Ionicons name="car-outline" size={ICON_SIZE} color={colors.textSecondary} />}
              title={t('feature1Title')}
              text={t('feature1Text')}
            />
            <FeatureCard
              hs={hs}
              vs={vs}
              ms={ms}
              radius={CARD_RADIUS}
              colors={colors}
              icon={<Ionicons name="qr-code-outline" size={ICON_SIZE} color={colors.textSecondary} />}
              title={t('feature2Title')}
              text={t('feature2Text')}
            />
            <FeatureCard
              hs={hs}
              vs={vs}
              ms={ms}
              radius={CARD_RADIUS}
              colors={colors}
              icon={<Ionicons name="map-outline" size={ICON_SIZE} color={colors.textSecondary} />}
              title={t('feature3Title')}
              text={t('feature3Text')}
            />
          </View>

          {/* Botón de Cerrar Sesión */}
          <TouchableOpacity
            style={[s.logoutButton, { 
              borderRadius: CARD_RADIUS, 
              paddingVertical: vs(14),
              paddingHorizontal: hs(24),
              marginBottom: vs(16),
              backgroundColor: isDark ? 'rgba(255, 107, 107, 0.1)' : 'rgba(211, 47, 47, 0.1)',
              borderColor: isDark ? 'rgba(255, 107, 107, 0.3)' : 'rgba(211, 47, 47, 0.3)',
            }]}
            onPress={handleLogoutPress}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={ms(20)} color={colors.error} />
            <Text style={[s.logoutButtonText, { 
              fontSize: ms(15),
              color: colors.error 
            }]}>{t('logout')}</Text>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={[s.footer, { 
            fontSize: ms(12), 
            marginBottom: vs(24),
            color: colors.textSecondary 
          }]}>
            © {new Date().getFullYear()} Ocelon — {t('allRightsReserved')}
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
        <View style={[s.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[s.modalContent, { 
            maxWidth: width * 0.85, 
            borderRadius: hs(16),
            backgroundColor: colors.card,
            borderColor: colors.primary 
          }]}>
            {/* Logo de Ocelon */}
            <View style={[s.modalLogoContainer, { 
              width: hs(100), 
              height: hs(100), 
              borderRadius: hs(50),
              backgroundColor: isDark ? 'rgba(66, 184, 131, 0.1)' : 'rgba(66, 184, 131, 0.05)',
              borderColor: colors.primary 
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
            <Text style={[s.modalTitle, { 
              fontSize: ms(22),
              color: colors.text 
            }]}>
              {t('thanksForUsing')}
            </Text>

            {/* Subtítulo */}
            <Text style={[s.modalSubtitle, { 
              fontSize: ms(14),
              color: colors.textSecondary 
            }]}>
              {t('seeYouSoon')}
            </Text>

            {/* Botones */}
            <View style={s.modalButtons}>
              <TouchableOpacity
                style={[s.cancelButton, { 
                  borderRadius: hs(12), 
                  paddingVertical: vs(14),
                  flex: 1,
                  backgroundColor: 'transparent',
                  borderColor: colors.border 
                }]}
                onPress={handleCancelLogout}
                activeOpacity={0.8}
              >
                <Text style={[s.cancelButtonText, { 
                  fontSize: ms(15),
                  color: colors.textSecondary 
                }]}>{t('cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.confirmButton, { 
                  borderRadius: hs(12), 
                  paddingVertical: vs(14),
                  flex: 1,
                  backgroundColor: colors.primary 
                }]}
                onPress={handleConfirmLogout}
                activeOpacity={0.8}
              >
                <Ionicons name="log-out-outline" size={ms(18)} color="#0b0b0c" />
                <Text style={[s.confirmButtonText, { 
                  fontSize: ms(15) 
                }]}>{t('exit')}</Text>
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
  colors,
  icon,
  title,
  text,
}: {
  hs: (n: number) => number;
  vs: (n: number) => number;
  ms: (n: number, f?: number) => number;
  radius: number;
  colors: any;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: radius,
        paddingVertical: vs(14),
        paddingHorizontal: hs(14),
        width: '100%',
        maxWidth: 360,
        borderWidth: 1,
        borderColor: colors.border,
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
            backgroundColor: colors.secondary,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {icon}
        </View>
        <Text style={{ 
          color: colors.text, 
          fontWeight: '700', 
          fontSize: ms(16) 
        }}>{title}</Text>
      </View>
      <Text style={{ 
        color: colors.textSecondary, 
        fontSize: ms(13), 
        lineHeight: ms(18) 
      }}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  kicker: { letterSpacing: 0.5 },
  title: { fontWeight: '800' },
  subtitle: { },
  footer: { },

  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
  },
  logoutButtonText: {
    fontWeight: '700',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    width: '100%',
  },
  modalLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
  },
  modalLogo: {
    borderWidth: 0,
  },
  modalTitle: {
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
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
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontWeight: '600',
  },
  confirmButton: {
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