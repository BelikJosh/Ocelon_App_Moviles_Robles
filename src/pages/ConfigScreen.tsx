// screens/ConfigScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useConfig } from '../contexts/ConfigContext';

// ❗ Ajusta la ruta según dónde tengas tu servicio
import { DynamoDBService } from '../services/DynamoService';

// ═══════════════════════════════════════════════════════════════
// Configuración - ACTUALIZA ESTO con tus datos
// ═══════════════════════════════════════════════════════════════

// Wallet del ESTACIONAMIENTO (ocelon1) - donde se recibirán los pagos en MXN
const PARKING_WALLET = 'https://ilp.interledger-test.dev/ocelon1';
const PARKING_NAME = 'Ocelon Estacionamiento';

// TODO: reemplazar por tu fuente real (contexto de auth)
const useCurrentUser = () => ({
  id: 'USER#1758342031701_4659',
  email: 'juan@gmail.com',
});

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

function randomNonce(len = 16) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function randomParkingSpot() {
  const letters = 'ABCDEF';
  const letter = letters[Math.floor(Math.random() * letters.length)];
  const number = Math.floor(Math.random() * 50) + 1;
  return `${letter}-${number.toString().padStart(2, '0')}`;
}

const shorten = (s?: string, head = 12, tail = 8) =>
  !s ? '—' : s.length <= head + tail + 1 ? s : `${s.slice(0, head)}…${s.slice(-tail)}`;

// ═══════════════════════════════════════════════════════════════
// Componente Principal
// ═══════════════════════════════════════════════════════════════

export default function ConfigScreen() {
  const CURRENT_USER = useCurrentUser();
  const { theme, language, isDark, setTheme, setLanguage, toggleTheme, toggleLanguage, t } = useConfig();
  
  // Estados
  const [nonce, setNonce] = useState(randomNonce());
  const [parkingSpot, setParkingSpot] = useState(randomParkingSpot());
  const [saving, setSaving] = useState(false);

  // ===== Responsivo =====
  const { width, height } = useWindowDimensions();
  const BASE_W = 375, BASE_H = 812;
  const hs = (n: number) => (width / BASE_W) * n;
  const vs = (n: number) => (height / BASE_H) * n;
  const ms = (n: number, f = 0.5) => n + (hs(n) - n) * f;

  const PADDING = hs(16);
  const RADIUS = hs(16);
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
    tertiary: isDark ? '#1a1a2e' : '#e8eaf6',
    tertiaryText: isDark ? '#6C63FF' : '#3f51b5',
    qrBackground: isDark ? '#131318' : '#f5f5f5',
  };

  // Payload del QR - SIN monto (se calcula en TimerScreen)
  const payload = useMemo(() => {
    const ts = new Date().toISOString();
    const params = new URLSearchParams({
      to: PARKING_WALLET,
      spot: parkingSpot,
      nonce,
      ts,
      parking: PARKING_NAME,
    }).toString();
    return `openpayment://parking?${params}`;
  }, [parkingSpot, nonce]);

  const regenerate = useCallback(() => {
    setNonce(randomNonce());
    setParkingSpot(randomParkingSpot());
  }, []);

  const guardarEnNube = useCallback(async () => {
    try {
      setSaving(true);
      await DynamoDBService.actualizarQRUsuario(CURRENT_USER.id, payload);
      Alert.alert(t('success') + ' ✅', t('qrPublished'));
    } catch (e) {
      console.error(e);
      Alert.alert(t('error'), t('qrSaveError'));
    } finally {
      setSaving(false);
    }
  }, [CURRENT_USER.id, payload, t]);

  const copyToMail = useCallback(async () => {
    try {
      await Linking.openURL(
        `mailto:?subject=QR%20Estacionamiento%20${parkingSpot}&body=${encodeURIComponent(payload)}`
      );
    } catch {
      Alert.alert(t('oops'), t('shareError'));
    }
  }, [payload, parkingSpot, t]);

  const testDeepLink = useCallback(async () => {
    try {
      setSaving(true);
      await DynamoDBService.actualizarQRUsuario(CURRENT_USER.id, payload);
    } catch { }
    setSaving(false);
    Linking.openURL(payload);
  }, [CURRENT_USER.id, payload]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          alignItems: 'center',
          gap: vs(12),
          padding: PADDING,
          paddingBottom: vs(24)
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Sección de Configuración de Tema e Idioma */}
        <View style={{
          width: '100%',
          maxWidth: MAX_W,
          backgroundColor: colors.card,
          borderRadius: RADIUS,
          borderWidth: 1,
          borderColor: colors.border,
          padding: hs(16),
          gap: vs(16)
        }}>
          <Text style={{ 
            color: colors.text, 
            fontWeight: '800', 
            fontSize: ms(18),
            marginBottom: vs(8)
          }}>
            {t('settings')}
          </Text>

          {/* Configuración de Tema */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons 
                name={isDark ? "moon" : "sunny"} 
                size={ms(20)} 
                color={colors.primary} 
              />
              <View style={styles.settingTexts}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  {t('theme')}
                </Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  {theme === 'auto' ? t('auto') : theme === 'dark' ? t('dark') : t('light')}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={toggleTheme}
              style={[styles.themeToggle, { backgroundColor: colors.secondary }]}
            >
              <Text style={[styles.themeText, { color: colors.text }]}>
                {theme === 'auto' ? 'A' : theme === 'dark' ? '🌙' : '☀️'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Configuración de Idioma */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons 
                name="language" 
                size={ms(20)} 
                color={colors.primary} 
              />
              <View style={styles.settingTexts}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  {t('language')}
                </Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  {language === 'es' ? t('spanish') : t('english')}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={toggleLanguage}
              style={[styles.languageButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.languageText}>
                {language === 'es' ? 'EN' : 'ES'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Header */}
        <View style={{
          width: '100%',
          maxWidth: MAX_W,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: hs(8)
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: hs(10), flex: 1, minWidth: 0 }}>
            <View style={{
              width: hs(40),
              height: hs(40),
              borderRadius: hs(12),
              backgroundColor: colors.secondary,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Ionicons name="car-outline" size={ms(18)} color={colors.primary} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{ color: colors.text, fontWeight: '800', fontSize: ms(18) }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {t('configureSpot')}
              </Text>
              <Text
                style={{ color: colors.textSecondary, fontSize: ms(11) }}
                numberOfLines={1}
              >
                {t('qrForParking')}
              </Text>
            </View>
          </View>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: hs(4),
            backgroundColor: colors.primary,
            paddingHorizontal: hs(8),
            paddingVertical: vs(5),
            borderRadius: 999,
            minWidth: hs(70)
          }}>
            <Ionicons name="shield-checkmark-outline" size={ms(10)} color="#0b0b0c" />
            <Text
              style={{ color: '#0b0b0c', fontWeight: '800', fontSize: ms(10) }}
              numberOfLines={1}
            >
              PARKING
            </Text>
          </View>
        </View>

        {/* Información importante */}
        <View style={{
          width: '100%',
          maxWidth: MAX_W,
          backgroundColor: isDark ? 'rgba(66, 184, 131, 0.1)' : 'rgba(66, 184, 131, 0.05)',
          borderWidth: 1,
          borderColor: 'rgba(66, 184, 131, 0.3)',
          borderRadius: RADIUS,
          padding: hs(12),
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: hs(8), marginBottom: vs(6) }}>
            <Ionicons name="information-circle" size={ms(18)} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: ms(13) }}>
              {t('howItWorks')}
            </Text>
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: ms(11), lineHeight: ms(16) }}>
            {t('howItWorksDescription')}
          </Text>
        </View>

        {/* Card de configuración */}
        <View style={{
          width: '100%',
          maxWidth: MAX_W,
          backgroundColor: colors.card,
          borderRadius: RADIUS,
          borderWidth: 1,
          borderColor: colors.border,
          padding: hs(14),
          gap: vs(10)
        }}>
          {/* Wallet destino (fijo) */}
          <Text style={{ color: colors.textSecondary, fontSize: ms(12) }}>{t('destinationWallet')}</Text>
          <View style={{
            backgroundColor: colors.secondary,
            borderRadius: hs(10),
            borderWidth: 1,
            borderColor: colors.border,
            padding: hs(10),
            flexDirection: 'row',
            alignItems: 'center',
            gap: hs(8)
          }}>
            <Ionicons name="wallet-outline" size={ms(16)} color={colors.primary} />
            <Text
              style={{ color: colors.text, fontSize: ms(11), fontFamily: 'monospace' as any, flex: 1 }}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {shorten(PARKING_WALLET, 16, 10)}
            </Text>
          </View>

          {/* Cajón/Zona */}
          <Text style={{ color: colors.textSecondary, fontSize: ms(12), marginTop: vs(4) }}>{t('parkingSpot')}</Text>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: hs(6),
            backgroundColor: colors.secondary,
            borderRadius: hs(10),
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: hs(10)
          }}>
            <Ionicons name="location-outline" size={ms(16)} color={colors.textSecondary} />
            <TextInput
              value={parkingSpot}
              onChangeText={setParkingSpot}
              placeholder="A-01"
              placeholderTextColor={colors.textSecondary}
              style={{
                flex: 1,
                color: colors.text,
                paddingVertical: vs(10),
                fontWeight: '700',
                fontSize: ms(15)
              }}
            />
          </View>

          {/* Nonce */}
          <Text style={{ color: colors.textSecondary, fontSize: ms(12), marginTop: vs(4) }}>{t('sessionId')}</Text>
          <View style={{
            backgroundColor: colors.secondary,
            borderRadius: hs(10),
            borderWidth: 1,
            borderColor: colors.border,
            padding: hs(10),
            flexDirection: 'row',
            alignItems: 'center',
            gap: hs(8)
          }}>
            <Ionicons name="finger-print-outline" size={ms(16)} color={colors.textSecondary} />
            <Text
              style={{ color: colors.text, fontSize: ms(11), fontFamily: 'monospace' as any }}
              numberOfLines={1}
            >
              {nonce}
            </Text>
          </View>

          {/* Tarifa */}
          <View style={{
            backgroundColor: colors.tertiary,
            borderRadius: hs(10),
            borderWidth: 1,
            borderColor: colors.border,
            padding: hs(12),
            marginTop: vs(4)
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: hs(8) }}>
              <Ionicons name="cash-outline" size={ms(18)} color={colors.tertiaryText} />
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: ms(13) }}>
                {t('rateDemo')}
              </Text>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: ms(12), marginTop: vs(4) }}>
              {t('rateDescription')}
            </Text>
            <Text style={{ color: colors.tertiaryText, fontSize: ms(11), marginTop: vs(2) }}>
              {t('paymentConversion')}
            </Text>
          </View>

          <TouchableOpacity
            onPress={regenerate}
            disabled={saving}
            style={{
              marginTop: vs(6),
              backgroundColor: colors.tertiaryText,
              paddingVertical: vs(11),
              alignItems: 'center',
              borderRadius: hs(12),
              opacity: saving ? 0.7 : 1,
              flexDirection: 'row',
              justifyContent: 'center',
              gap: hs(8)
            }}
          >
            <Ionicons name="refresh-outline" size={ms(16)} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: ms(14) }}>
              {t('regenerateSpot')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tarjeta del QR */}
        <View style={{
          width: '100%',
          maxWidth: MAX_W,
          alignItems: 'center',
          backgroundColor: colors.qrBackground,
          borderRadius: RADIUS,
          borderWidth: 1,
          borderColor: colors.border,
          padding: hs(12),
          gap: vs(8)
        }}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: ms(16), marginBottom: vs(4) }}>
            {t('spot')} {parkingSpot}
          </Text>

          <View style={{
            alignSelf: 'center',
            padding: hs(10),
            backgroundColor: '#fff',
            borderRadius: hs(14)
          }}>
            <QRCode value={payload} size={Math.min(hs(220), width * 0.55, 260)} />
          </View>

          <View style={{
            width: '100%',
            backgroundColor: colors.secondary,
            borderRadius: hs(8),
            padding: hs(8),
            marginTop: vs(4)
          }}>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: ms(10),
                marginBottom: 4,
                textAlign: 'center'
              }}
            >
              {t('deepLink')}:
            </Text>
            <Text
              style={{
                color: colors.text,
                fontSize: ms(9),
                fontFamily: 'monospace' as any,
                textAlign: 'center'
              }}
              numberOfLines={2}
              ellipsizeMode="middle"
            >
              {payload}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: hs(8), width: '100%', marginTop: vs(4) }}>
            <TouchableOpacity
              onPress={copyToMail}
              disabled={saving}
              style={[
                styles.secondaryBtn,
                {
                  flex: 1,
                  borderRadius: hs(12),
                  paddingVertical: vs(10),
                  paddingHorizontal: hs(8),
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                }
              ]}
            >
              <Ionicons name="share-outline" size={ms(15)} color={colors.text} />
              <Text style={[styles.secondaryText, { fontSize: ms(12), color: colors.text }]}>{t('share')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={testDeepLink}
              disabled={saving}
              style={[
                styles.secondaryBtn,
                {
                  flex: 1,
                  borderRadius: hs(12),
                  paddingVertical: vs(10),
                  paddingHorizontal: hs(8),
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                }
              ]}
            >
              <Ionicons name="play-outline" size={ms(15)} color={colors.text} />
              <Text style={[styles.secondaryText, { fontSize: ms(12), color: colors.text }]} numberOfLines={1}>
                {t('test')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Guardar / actualizar */}
        <TouchableOpacity
          style={[
            styles.saveBtn,
            {
              width: '100%',
              maxWidth: MAX_W,
              borderRadius: hs(12),
              paddingVertical: vs(11),
              backgroundColor: colors.primary,
            },
            saving && { opacity: 0.7 },
          ]}
          onPress={guardarEnNube}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#0b0b0c" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={ms(16)} color="#0b0b0c" />
              <Text style={[styles.saveText, { fontSize: ms(14) }]}>
                {t('publishQR')}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Hint / ayuda */}
        <View style={{
          width: '100%',
          maxWidth: MAX_W,
          backgroundColor: colors.secondary,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: hs(12),
          padding: hs(10)
        }}>
          <Text style={{ color: colors.textSecondary, fontSize: ms(11), lineHeight: ms(16) }}>
            • {t('hint1')}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: ms(11), marginTop: vs(4), lineHeight: ms(16) }}>
            • {t('hint2')}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: ms(11), marginTop: vs(4), lineHeight: ms(16) }}>
            • {t('hint3')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
  },
  secondaryText: { fontWeight: '600' },
  saveBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveText: { color: '#0b0b0c', fontWeight: '800' },
  // Nuevos estilos para la configuración
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingTexts: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
  },
  themeToggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#42b883',
  },
  themeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  languageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 50,
    alignItems: 'center',
  },
  languageText: {
    color: '#0b0b0c',
    fontWeight: '800',
    fontSize: 14,
  },
});