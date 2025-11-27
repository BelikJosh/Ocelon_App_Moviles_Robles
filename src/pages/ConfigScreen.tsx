// screens/ConfigScreen.tsx
// Genera QR para INICIAR el estacionamiento (sin monto - se calcula en TimerScreen)
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

  // Payload del QR - SIN monto (se calcula en TimerScreen)
  const payload = useMemo(() => {
    const ts = new Date().toISOString();
    const params = new URLSearchParams({
      // Wallet destino (ocelon1 - recibe MXN)
      to: PARKING_WALLET,
      // Identificador del cajón/zona
      spot: parkingSpot,
      // Nonce único para esta sesión
      nonce,
      // Timestamp de inicio
      ts,
      // ID del estacionamiento
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
      Alert.alert('Listo ✅', 'QR de estacionamiento publicado en la nube.');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo guardar el QR en la nube.');
    } finally {
      setSaving(false);
    }
  }, [CURRENT_USER.id, payload]);

  const copyToMail = useCallback(async () => {
    try {
      await Linking.openURL(
        `mailto:?subject=QR%20Estacionamiento%20${parkingSpot}&body=${encodeURIComponent(payload)}`
      );
    } catch {
      Alert.alert('Ups', 'No se pudo compartir el enlace.');
    }
  }, [payload, parkingSpot]);

  const testDeepLink = useCallback(async () => {
    try {
      setSaving(true);
      await DynamoDBService.actualizarQRUsuario(CURRENT_USER.id, payload);
    } catch { }
    setSaving(false);
    Linking.openURL(payload);
  }, [CURRENT_USER.id, payload]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          alignItems: 'center',
          gap: vs(12),
          padding: PADDING,
          paddingBottom: vs(24)
        }}
        showsVerticalScrollIndicator={false}
      >
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
              backgroundColor: '#121215',
              borderWidth: 1,
              borderColor: '#1f1f25',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Ionicons name="car-outline" size={ms(18)} color="#42b883" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{ color: '#fff', fontWeight: '800', fontSize: ms(18) }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                Configurar Cajón
              </Text>
              <Text
                style={{ color: '#bdbdbd', fontSize: ms(11) }}
                numberOfLines={1}
              >
                QR para iniciar estacionamiento
              </Text>
            </View>
          </View>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: hs(4),
            backgroundColor: '#42b883',
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
          backgroundColor: 'rgba(66, 184, 131, 0.1)',
          borderWidth: 1,
          borderColor: 'rgba(66, 184, 131, 0.3)',
          borderRadius: RADIUS,
          padding: hs(12),
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: hs(8), marginBottom: vs(6) }}>
            <Ionicons name="information-circle" size={ms(18)} color="#42b883" />
            <Text style={{ color: '#42b883', fontWeight: '700', fontSize: ms(13) }}>
              ¿Cómo funciona?
            </Text>
          </View>
          <Text style={{ color: '#9f9faf', fontSize: ms(11), lineHeight: ms(16) }}>
            1. El usuario escanea este QR al entrar al estacionamiento{'\n'}
            2. Se inicia el contador de tiempo automáticamente{'\n'}
            3. Al salir, paga en USD y se convierte a MXN{'\n'}
            4. Tarifa: $1.00 USD por cada 10 segundos (demo)
          </Text>
        </View>

        {/* Card de configuración */}
        <View style={{
          width: '100%',
          maxWidth: MAX_W,
          backgroundColor: '#151518',
          borderRadius: RADIUS,
          borderWidth: 1,
          borderColor: '#202028',
          padding: hs(14),
          gap: vs(10)
        }}>
          {/* Wallet destino (fijo) */}
          <Text style={{ color: '#a0a0a0', fontSize: ms(12) }}>Wallet destino (recibe MXN)</Text>
          <View style={{
            backgroundColor: '#1b1b20',
            borderRadius: hs(10),
            borderWidth: 1,
            borderColor: '#2a2a30',
            padding: hs(10),
            flexDirection: 'row',
            alignItems: 'center',
            gap: hs(8)
          }}>
            <Ionicons name="wallet-outline" size={ms(16)} color="#42b883" />
            <Text
              style={{ color: '#fff', fontSize: ms(11), fontFamily: 'monospace' as any, flex: 1 }}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {shorten(PARKING_WALLET, 16, 10)}
            </Text>
          </View>

          {/* Cajón/Zona */}
          <Text style={{ color: '#a0a0a0', fontSize: ms(12), marginTop: vs(4) }}>Cajón / Zona</Text>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: hs(6),
            backgroundColor: '#1b1b20',
            borderRadius: hs(10),
            borderWidth: 1,
            borderColor: '#2a2a30',
            paddingHorizontal: hs(10)
          }}>
            <Ionicons name="location-outline" size={ms(16)} color="#9f9faf" />
            <TextInput
              value={parkingSpot}
              onChangeText={setParkingSpot}
              placeholder="A-01"
              placeholderTextColor="#7d7d85"
              style={{
                flex: 1,
                color: '#fff',
                paddingVertical: vs(10),
                fontWeight: '700',
                fontSize: ms(15)
              }}
            />
          </View>

          {/* Nonce */}
          <Text style={{ color: '#a0a0a0', fontSize: ms(12), marginTop: vs(4) }}>ID de Sesión (Nonce)</Text>
          <View style={{
            backgroundColor: '#1b1b20',
            borderRadius: hs(10),
            borderWidth: 1,
            borderColor: '#2a2a30',
            padding: hs(10),
            flexDirection: 'row',
            alignItems: 'center',
            gap: hs(8)
          }}>
            <Ionicons name="finger-print-outline" size={ms(16)} color="#9f9faf" />
            <Text
              style={{ color: '#fff', fontSize: ms(11), fontFamily: 'monospace' as any }}
              numberOfLines={1}
            >
              {nonce}
            </Text>
          </View>

          {/* Tarifa */}
          <View style={{
            backgroundColor: '#1a1a2e',
            borderRadius: hs(10),
            borderWidth: 1,
            borderColor: '#2a2a40',
            padding: hs(12),
            marginTop: vs(4)
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: hs(8) }}>
              <Ionicons name="cash-outline" size={ms(18)} color="#6C63FF" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: ms(13) }}>
                Tarifa (Demo)
              </Text>
            </View>
            <Text style={{ color: '#9f9faf', fontSize: ms(12), marginTop: vs(4) }}>
              $1.00 USD por cada 10 segundos
            </Text>
            <Text style={{ color: '#6C63FF', fontSize: ms(11), marginTop: vs(2) }}>
              El usuario paga en USD → Se convierte a MXN
            </Text>
          </View>

          <TouchableOpacity
            onPress={regenerate}
            disabled={saving}
            style={{
              marginTop: vs(6),
              backgroundColor: '#6C63FF',
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
              Regenerar Cajón y Nonce
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tarjeta del QR */}
        <View style={{
          width: '100%',
          maxWidth: MAX_W,
          alignItems: 'center',
          backgroundColor: '#131318',
          borderRadius: RADIUS,
          borderWidth: 1,
          borderColor: '#202028',
          padding: hs(12),
          gap: vs(8)
        }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: ms(16), marginBottom: vs(4) }}>
            Cajón {parkingSpot}
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
            backgroundColor: '#1b1b20',
            borderRadius: hs(8),
            padding: hs(8),
            marginTop: vs(4)
          }}>
            <Text
              style={{
                color: '#9f9faf',
                fontSize: ms(10),
                marginBottom: 4,
                textAlign: 'center'
              }}
            >
              Deep link:
            </Text>
            <Text
              style={{
                color: '#fff',
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
                  paddingHorizontal: hs(8)
                }
              ]}
            >
              <Ionicons name="share-outline" size={ms(15)} color="#cfcfff" />
              <Text style={[styles.secondaryText, { fontSize: ms(12) }]}>Compartir</Text>
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
                  paddingHorizontal: hs(8)
                }
              ]}
            >
              <Ionicons name="play-outline" size={ms(15)} color="#cfcfff" />
              <Text style={[styles.secondaryText, { fontSize: ms(12) }]} numberOfLines={1}>
                Probar
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
              paddingVertical: vs(11)
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
                Publicar QR en la nube
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Hint / ayuda */}
        <View style={{
          width: '100%',
          maxWidth: MAX_W,
          backgroundColor: '#14141a',
          borderWidth: 1,
          borderColor: '#202028',
          borderRadius: hs(12),
          padding: hs(10)
        }}>
          <Text style={{ color: '#9f9faf', fontSize: ms(11), lineHeight: ms(16) }}>
            • Este QR <Text style={{ color: '#fff', fontWeight: '700' }}>NO incluye monto</Text> - se calcula según el tiempo de estacionamiento.
          </Text>
          <Text style={{ color: '#9f9faf', fontSize: ms(11), marginTop: vs(4), lineHeight: ms(16) }}>
            • Al escanear, se inicia el <Text style={{ color: '#fff', fontWeight: '700' }}>TimerScreen</Text> que cuenta el tiempo y calcula el costo en USD.
          </Text>
          <Text style={{ color: '#9f9faf', fontSize: ms(11), marginTop: vs(4), lineHeight: ms(16) }}>
            • El pago se hace desde la wallet del usuario en <Text style={{ color: '#42b883', fontWeight: '700' }}>USD</Text> y llega a ocelon1 en <Text style={{ color: '#42b883', fontWeight: '700' }}>MXN</Text>.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0c' },
  secondaryBtn: {
    backgroundColor: '#202028',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    gap: 6,
  },
  secondaryText: { color: '#cfcfff', fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#42b883',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveText: { color: '#0b0b0c', fontWeight: '800' },
});