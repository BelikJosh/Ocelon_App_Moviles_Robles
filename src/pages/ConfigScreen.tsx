// ConfigScreen.tsx
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

// TODO: reemplazar por tu fuente real (contexto de auth)
const useCurrentUser = () => ({
  id: 'USER#1758342031701_4659',
  wallet: 'https://ilp.interledger-test.dev/ocelonusd',
  email: 'juan@gmail.com',
});

function randomNonce(len = 16) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
const shorten = (s?: string, head = 12, tail = 8) =>
  !s ? '—' : s.length <= head + tail + 1 ? s : `${s.slice(0, head)}…${s.slice(-tail)}`;

export default function ConfigScreen() {
  const CURRENT_USER = useCurrentUser();
  const [amount, setAmount] = useState('123.45');
  const [nonce, setNonce] = useState(randomNonce());
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

  const payload = useMemo(() => {
    const ts = new Date().toISOString();
    const params = new URLSearchParams({
      to: CURRENT_USER.wallet,
      amount: String(amount || '0'),
      nonce,
      ts,
      from: CURRENT_USER.id,
    }).toString();
    return `openpayment://pay?${params}`;
  }, [CURRENT_USER.wallet, CURRENT_USER.id, amount, nonce]);

  const regenerate = useCallback(() => setNonce(randomNonce()), []);

  const guardarEnNube = useCallback(async () => {
    try {
      setSaving(true);
      await DynamoDBService.actualizarQRUsuario(CURRENT_USER.id, payload);
      Alert.alert('Listo ✅', 'QR publicado/actualizado en la nube.');
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
        `mailto:?subject=QR%20OpenPayment&body=${encodeURIComponent(payload)}`
      );
    } catch {
      Alert.alert('Ups', 'No se pudo compartir el enlace.');
    }
  }, [payload]);

  const testDeepLink = useCallback(async () => {
    try {
      setSaving(true);
      await DynamoDBService.actualizarQRUsuario(CURRENT_USER.id, payload);
    } catch {}
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
              <Ionicons name="qr-code-outline" size={ms(18)} color="#42b883" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text 
                style={{ color: '#fff', fontWeight: '800', fontSize: ms(18) }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                Configurar Cobro
              </Text>
              <Text 
                style={{ color: '#bdbdbd', fontSize: ms(11) }}
                numberOfLines={1}
              >
                Genera un QR de pago
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
            minWidth: hs(90)
          }}>
            <Ionicons name="shield-checkmark-outline" size={ms(10)} color="#0b0b0c" />
            <Text 
              style={{ color: '#0b0b0c', fontWeight: '800', fontSize: ms(10) }}
              numberOfLines={1}
            >
              OPENPAYMENT
            </Text>
          </View>
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
          gap: vs(8)
        }}>
          <Text style={{ color: '#a0a0a0', fontSize: ms(12) }}>Wallet destino</Text>
          <View style={{
            backgroundColor: '#1b1b20', 
            borderRadius: hs(10),
            borderWidth: 1, 
            borderColor: '#2a2a30', 
            padding: hs(10)
          }}>
            <Text 
              style={{ color: '#fff', fontSize: ms(11), fontFamily: 'monospace' as any }} 
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {shorten(CURRENT_USER.wallet, 14, 8)}
            </Text>
          </View>

          <Text style={{ color: '#a0a0a0', fontSize: ms(12), marginTop: vs(4) }}>Monto</Text>
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
            <Text style={{ color: '#9f9faf', fontWeight: '700', fontSize: ms(14) }}>$</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#7d7d85"
              style={{
                flex: 1, 
                color: '#fff', 
                paddingVertical: vs(10), 
                fontWeight: '700', 
                fontSize: ms(15)
              }}
            />
            <Text style={{ color: '#9f9faf', fontWeight: '700', fontSize: ms(13) }}>MXN</Text>
          </View>

          <Text style={{ color: '#a0a0a0', fontSize: ms(12), marginTop: vs(4) }}>Nonce</Text>
          <View style={{
            backgroundColor: '#1b1b20', 
            borderRadius: hs(10),
            borderWidth: 1, 
            borderColor: '#2a2a30', 
            padding: hs(10)
          }}>
            <Text 
              style={{ color: '#fff', fontSize: ms(11), fontFamily: 'monospace' as any }} 
              numberOfLines={1}
            >
              {nonce}
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
              opacity: saving ? 0.7 : 1
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: ms(14) }}>Regenerar QR</Text>
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
              <Ionicons name="link-outline" size={ms(15)} color="#cfcfff" />
              <Text style={[styles.secondaryText, { fontSize: ms(12) }]} numberOfLines={1}>
                Probar link
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
            <Text style={[styles.saveText, { fontSize: ms(14) }]}>
              Guardar/Actualizar en la nube
            </Text>
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
            • Al tocar "Guardar/Actualizar en la nube", se escribe el payload en el campo{' '}
            <Text style={{ color: '#fff', fontWeight: '700' }}>QR</Text> de tu usuario.
          </Text>
          <Text style={{ color: '#9f9faf', fontSize: ms(11), marginTop: vs(4), lineHeight: ms(16) }}>
            • El <Text style={{ color: '#fff', fontWeight: '700' }}>ScannerScreen</Text> también guarda el QR escaneado en AWS y navega a{' '}
            <Text style={{ color: '#fff', fontWeight: '700' }}>WalletScreen</Text>.
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
  },
  saveText: { color: '#0b0b0c', fontWeight: '800' },
});