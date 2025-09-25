// ConfigScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
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
  const hs = (n: number) => (width / BASE_W) * n;            // horizontalScale
  const vs = (n: number) => (height / BASE_H) * n;           // verticalScale
  const ms = (n: number, f = 0.5) => n + (hs(n) - n) * f;    // moderateScale

  const PADDING = hs(18);
  const RADIUS = hs(18);
  const MAX_W = Math.min(600, width - hs(32));

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
      await DynamoDBService.actualizarQRUsuario(CURRENT_USER.id, payload); // ✅ directo a Dynamo
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
    <SafeAreaView
      style={[styles.container, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}
    >
      <ScrollView
        contentContainerStyle={{ alignItems: 'center', gap: vs(14), padding: PADDING, paddingBottom: vs(24) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ width: '100%', maxWidth: MAX_W, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: hs(10) }}>
            <View style={{
              width: hs(42), height: hs(42), borderRadius: hs(12),
              backgroundColor: '#121215', borderWidth: 1, borderColor: '#1f1f25',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <Ionicons name="qr-code-outline" size={ms(20)} color="#42b883" />
            </View>
            <View>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: ms(22) }}>Configurar Cobro</Text>
              <Text style={{ color: '#bdbdbd', fontSize: ms(12) }}>
                Genera un QR de pago (Open Payments)
              </Text>
            </View>
          </View>

          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: '#42b883', paddingHorizontal: hs(10), paddingVertical: vs(6),
            borderRadius: 999
          }}>
            <Ionicons name="shield-checkmark-outline" size={ms(8)} color="#0b0b0c" />
            <Text style={{ color: '#0b0b0c', fontWeight: '800', fontSize: ms(12) }}>OPENPAYMENT</Text>
          </View>
        </View>

        {/* Card de configuración */}
        <View style={{
          width: '100%', maxWidth: MAX_W,
          backgroundColor: '#151518', borderRadius: RADIUS,
          borderWidth: 1, borderColor: '#202028',
          padding: hs(16), gap: vs(10)
        }}>
          <Text style={{ color: '#a0a0a0', fontSize: ms(13) }}>Wallet destino</Text>
          <View style={{
            backgroundColor: '#1b1b20', borderRadius: hs(10),
            borderWidth: 1, borderColor: '#2a2a30', padding: hs(12)
          }}>
            <Text style={{ color: '#fff', fontFamily: 'monospace' as any }} numberOfLines={1}>
              {shorten(CURRENT_USER.wallet, 16, 10)}
            </Text>
          </View>

          <Text style={{ color: '#a0a0a0', fontSize: ms(13), marginTop: vs(4) }}>Monto</Text>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: hs(8),
            backgroundColor: '#1b1b20', borderRadius: hs(10),
            borderWidth: 1, borderColor: '#2a2a30', paddingHorizontal: hs(12)
          }}>
            <Text style={{ color: '#9f9faf', fontWeight: '700' }}>$</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#7d7d85"
              style={{
                flex: 1, color: '#fff', paddingVertical: vs(10), fontWeight: '700', fontSize: ms(16)
              }}
            />
            <Text style={{ color: '#9f9faf', fontWeight: '700' }}>MXN</Text>
          </View>

          <Text style={{ color: '#a0a0a0', fontSize: ms(13), marginTop: vs(4) }}>Nonce</Text>
          <View style={{
            backgroundColor: '#1b1b20', borderRadius: hs(10),
            borderWidth: 1, borderColor: '#2a2a30', padding: hs(12)
          }}>
            <Text style={{ color: '#fff', fontFamily: 'monospace' as any }} numberOfLines={1}>
              {nonce}
            </Text>
          </View>

          <TouchableOpacity
            onPress={regenerate}
            disabled={saving}
            style={{
              marginTop: vs(6),
              backgroundColor: '#6C63FF',
              paddingVertical: vs(12),
              alignItems: 'center',
              borderRadius: hs(12),
              opacity: saving ? 0.7 : 1
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: ms(15) }}>Regenerar QR</Text>
          </TouchableOpacity>
        </View>

        {/* Tarjeta del QR */}
        <View style={{
          width: '100%', maxWidth: MAX_W, alignItems: 'center',
          backgroundColor: '#131318', borderRadius: RADIUS, borderWidth: 1, borderColor: '#202028',
          padding: hs(14), gap: vs(10)
        }}>
          <View style={{ alignSelf: 'center', padding: hs(12), backgroundColor: '#fff', borderRadius: hs(16) }}>
            <QRCode value={payload} size={Math.min(hs(240), 280)} />
          </View>
          <Text style={{ color: '#9f9faf', textAlign: 'center', fontSize: ms(12) }}>
            Deep link: <Text style={{ color: '#fff', fontFamily: 'monospace' as any }}>{payload}</Text>
          </Text>

          <View style={{ flexDirection: 'row', gap: hs(10), width: '100%' }}>
            <TouchableOpacity
              onPress={copyToMail}
              disabled={saving}
              style={[
                styles.secondaryBtn,
                { flex: 1, borderRadius: hs(12), paddingVertical: vs(12) }
              ]}
            >
              <Ionicons name="share-outline" size={ms(16)} color="#cfcfff" />
              <Text style={styles.secondaryText}>Compartir</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={testDeepLink}
              disabled={saving}
              style={[
                styles.secondaryBtn,
                { flex: 1, borderRadius: hs(12), paddingVertical: vs(12) }
              ]}
            >
              <Ionicons name="link-outline" size={ms(16)} color="#cfcfff" />
              <Text style={styles.secondaryText}>Probar deep link</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Guardar / actualizar */}
        <TouchableOpacity
          style={[
            styles.saveBtn,
            { width: '100%', maxWidth: MAX_W, borderRadius: hs(12), paddingVertical: vs(12) },
            saving && { opacity: 0.7 },
          ]}
          onPress={guardarEnNube}
          disabled={saving}
        >
          {saving ? <ActivityIndicator /> : <Text style={styles.saveText}>Guardar/Actualizar en la nube</Text>}
        </TouchableOpacity>

        {/* Hint / ayuda */}
        <View style={{
          width: '100%', maxWidth: MAX_W,
          backgroundColor: '#14141a', borderWidth: 1, borderColor: '#202028',
          borderRadius: hs(12), padding: hs(10)
        }}>
          <Text style={{ color: '#9f9faf', fontSize: ms(12) }}>
            • Al tocar “Guardar/Actualizar en la nube”, se escribe el payload en el campo <Text style={{ color: '#fff', fontWeight: '700' }}>QR</Text> de tu usuario.
          </Text>
          <Text style={{ color: '#9f9faf', fontSize: ms(12), marginTop: vs(4) }}>
            • El <Text style={{ color: '#fff', fontWeight: '700' }}>ScannerScreen</Text> también guarda el QR escaneado en AWS y navega a <Text style={{ color: '#fff', fontWeight: '700' }}>WalletScreen</Text>.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    gap: 8,
  },
  secondaryText: { color: '#cfcfff', fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#42b883',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { color: '#0b0b0c', fontWeight: '800' },
});
