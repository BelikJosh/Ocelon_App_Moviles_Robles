// SupportScreen.tsx
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { useAuthState } from '../hooks/useAuthState';
import { useConfig } from '../contexts/ConfigContext'; // Importa el hook

export default function SupportScreen() {
  const { width } = useWindowDimensions();
  const { t, isDark } = useConfig(); // Usa el hook de configuración
  
  // Estado de autenticación
  const { usuario, esInvitado, loading } = useAuthState();

  // Escalas responsivas
  const BASE_W = 375;
  const hs = (n: number) => (width / BASE_W) * n;
  const ms = (n: number, f = 0.5) => n + (hs(n) - n) * f;
  
  const PADDING = hs(16);
  const MAX_W = Math.min(600, width - PADDING * 2);

  // Colores dinámicos según el tema
  const colors = {
    background: isDark ? '#0b0b0c' : '#f8f9fa',
    card: isDark ? '#151518' : '#ffffff',
    text: isDark ? '#ffffff' : '#000000',
    textSecondary: isDark ? '#a0a0a0' : '#666666',
    border: isDark ? '#202028' : '#e0e0e0',
    primary: '#42b883',
    secondary: isDark ? '#1b1b20' : '#f1f3f4',
    infoBox: isDark ? 'rgba(66, 184, 131, 0.1)' : 'rgba(66, 184, 131, 0.05)',
    infoBoxBorder: isDark ? 'rgba(66, 184, 131, 0.2)' : 'rgba(66, 184, 131, 0.1)',
  };

  const getUserName = () => {
    if (loading) return t('loading');
    if (usuario) return usuario.nombre;
    return t('guest');
  };

  const handleCall = () => {
    Linking.openURL('tel:+524497510854');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:soporte@ocelon.com');
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/524497510854');
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[s.scrollContent, { paddingHorizontal: PADDING }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header con logo y título */}
        <View style={[s.header, { maxWidth: MAX_W, width: '100%', alignSelf: 'center' }]}>
          <View style={[s.logoContainer, { 
            width: hs(140), 
            height: hs(140),
            borderRadius: hs(16),
            marginBottom: hs(16),
            backgroundColor: colors.card,
            borderColor: colors.border,
          }]}>
            <Image
              source={require('../../assets/images/Logo_ocelon.jpg')}
              style={[s.logo, { width: hs(120), height: hs(120), borderRadius: hs(12) }]}
            />
          </View>

          <Text style={[s.title, { 
            fontSize: ms(30),
            color: colors.text 
          }]}>{t('support')}</Text>

          {/* Nombre dinámico */}
          <Text style={[s.greeting, { 
            fontSize: ms(18),
            color: colors.textSecondary 
          }]}>
            {t('hello')} {getUserName()}
          </Text>
        </View>

        {/* Contenedor para las secciones */}
        <View style={{ width: '100%', maxWidth: MAX_W, alignSelf: 'center' }}>
          
          {/* Sección: ¿Tienes un problema? */}
          <View style={s.section}>
            <Text style={[s.sectionTitle, { 
              fontSize: ms(17),
              color: colors.text 
            }]}>{t('haveProblem')}</Text>

            <TouchableOpacity 
              style={[s.card, { 
                borderRadius: hs(14), 
                padding: hs(14),
                backgroundColor: colors.card,
                borderColor: colors.border,
              }]} 
              onPress={handleCall} 
              activeOpacity={0.7}
            >
              <View style={s.cardContent}>
                <Ionicons name="call-outline" size={ms(20)} color={colors.primary} />
                <Text style={[s.cardText, { 
                  fontSize: ms(14),
                  color: colors.text 
                }]} numberOfLines={2}>
                  {t('contactUsPhone')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={ms(18)} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[s.card, { 
                borderRadius: hs(14), 
                padding: hs(14),
                backgroundColor: colors.card,
                borderColor: colors.border,
              }]} 
              onPress={handleEmail} 
              activeOpacity={0.7}
            >
              <View style={s.cardContent}>
                <Ionicons name="mail-outline" size={ms(20)} color={colors.primary} />
                <Text style={[s.cardText, { 
                  fontSize: ms(14),
                  color: colors.text 
                }]} numberOfLines={2}>
                  {t('contactUsEmail')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={ms(18)} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Sección: ¿Tienes alguna queja? */}
          <View style={s.section}>
            <Text style={[s.sectionTitle, { 
              fontSize: ms(17),
              color: colors.text 
            }]}>{t('haveComplaint')}</Text>

            <TouchableOpacity 
              style={[s.card, { 
                borderRadius: hs(14), 
                padding: hs(14),
                backgroundColor: colors.card,
                borderColor: colors.border,
              }]} 
              onPress={handleEmail} 
              activeOpacity={0.7}
            >
              <View style={s.cardContent}>
                <Ionicons name="mail-outline" size={ms(20)} color={colors.primary} />
                <Text style={[s.cardText, { 
                  fontSize: ms(14),
                  color: colors.text 
                }]} numberOfLines={2}>
                  {t('contactUsEmail')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={ms(18)} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[s.card, { 
                borderRadius: hs(14), 
                padding: hs(14),
                backgroundColor: colors.card,
                borderColor: colors.border,
              }]} 
              onPress={handleWhatsApp} 
              activeOpacity={0.7}
            >
              <View style={s.cardContent}>
                <MaterialIcons name="phone" size={ms(20)} color={colors.primary} />
                <Text style={[s.cardText, { 
                  fontSize: ms(14),
                  color: colors.text 
                }]} numberOfLines={2}>
                  {t('contactUsWhatsApp')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={ms(18)} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Información adicional */}
          <View style={[s.infoBox, { 
            borderRadius: hs(12), 
            padding: hs(14),
            backgroundColor: colors.infoBox,
            borderColor: colors.infoBoxBorder,
          }]}>
            <Ionicons name="information-circle-outline" size={ms(22)} color={colors.primary} />
            <Text style={[s.infoText, { 
              fontSize: ms(12), 
              lineHeight: ms(17),
              color: colors.textSecondary 
            }]}>
              {t('supportSchedule')}
            </Text>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  logo: {
    resizeMode: 'cover',
  },
  title: {
    fontWeight: '800',
    marginBottom: 6,
  },
  greeting: {
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  cardText: {
    fontWeight: '500',
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
  },
});