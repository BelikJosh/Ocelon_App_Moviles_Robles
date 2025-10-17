import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { opApi } from '../services/opApi';

type QrPayload = {
  raw?: string;
  scheme?: string;
  path?: string;
  to?: string;
  amount?: string;
  nonce?: string;
  ts?: string;
  from?: string;
};

const FINISH_SCHEME = 'ocelon://pay/finish';
const FINISH_URL = 'http://10.49.122.204:3001/op/finish';
const FINISH_PATH = '/op/finish';

function shorten(s?: string, head = 14, tail = 8) {
  if (!s) return '—';
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}
function money(mx?: string) {
  const n = Number(mx ?? '0');
  if (!isFinite(n)) return '$0.00 MXN';
  return `$${n.toFixed(2)} MXN`;
}
function getInteractRef(url: string) {
  try {
    const u = new URL(url);
    return u.searchParams.get('interact_ref') || '';
  } catch {
    const m = url.match(/[?&]interact_ref=([^&#]+)/);
    return m ? decodeURIComponent(m[1]) : '';
  }
}
function safeDecode(s?: string) {
  if (!s) return s;
  try { return decodeURIComponent(s); } catch { return s; }
}
function getFinishHash(url: string) {
  try {
    const u = new URL(url);
    return safeDecode(u.searchParams.get('hash') || '');
  } catch {
    const m = url.match(/[?&]hash=([^&#]+)/);
    return m ? safeDecode(m[1]) : '';
  }
}

export default function WalletScreen() {
  const route = useRoute<any>();
  const qr: QrPayload = route.params?.qr ?? {};
  const webRef = useRef<WebView>(null);
  const continuedRef = useRef(false);
  const finishingRef = useRef(false);

  // ====== Escalas responsivas ======
  const { width, height } = useWindowDimensions();
  const BASE_W = 375, BASE_H = 812;
  const hs = (n: number) => (width / BASE_W) * n;
  const vs = (n: number) => (height / BASE_H) * n;
  const ms = (n: number, f = 0.5) => n + (hs(n) - n) * f;

  const [flow, setFlow] = useState<{
    incomingId?: string;
    continueUri?: string;
    continueAccessToken?: string;
    grantAccessToken?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [serverReceiver, setServerReceiver] = useState<string | null>(null);

  const [consentUrl, setConsentUrl] = useState<string | null>(null);
  const [showConsent, setShowConsent] = useState(false);

  const PADDING = hs(18);
  const RADIUS = hs(18);
  const ICON = ms(18);
  const MAX_W = Math.min(560, width - hs(32));

  const summary = useMemo(
    () => ({
      walletDestino: qr.to ?? 'N/D',
      monto: qr.amount ?? '0',
      referencia: qr.nonce ?? '—',
      timestamp: qr.ts ?? '—',
      origen: qr.from ?? '—',
      raw: qr.raw,
      scheme: (qr.scheme ?? 'openpayment').toUpperCase(),
    }),
    [qr]
  );

  useEffect(() => {
    (async () => {
      try {
        const w = await opApi.wallets();
        setServerReceiver(w.receiverWallet.id);
      } catch (e: any) {
        console.warn('No se pudo leer /op/wallets:', e?.message);
      }
    })();
  }, []);

  const finalizeOnce = (fn: () => void) => {
    if (continuedRef.current) return;
    continuedRef.current = true;
    fn();
  };

  const finalizePayment = useCallback(async (interact_ref: string, hash?: string) => {
    if (finishingRef.current) return;
    finishingRef.current = true;

    try {
      console.log('[FINISH] flow:', JSON.stringify({ ...flow, interact_ref, hash }));
      const { grantAccessToken } = await opApi.finishOutgoing({
        incomingPaymentId: flow.incomingId!,
        continueUri: flow.continueUri!,
        continueAccessToken: flow.continueAccessToken!,
        interact_ref,
        hash,
      });

      setShowConsent(false);
      setConsentUrl(null);
    } catch (e: any) {
      console.log('[finishOutgoing error]', e);
      Alert.alert('Finish error', e?.message || 'No se pudo finalizar');
    } finally {
      finishingRef.current = false;
    }
  }, [flow]);

  const pagarAhora = useCallback(async () => {
    try {
      if (!flow.incomingId || !flow.grantAccessToken) {
        Alert.alert('Error', 'No hay un pago pendiente para ejecutar.');
        return;
      }
      setLoading(true);
      const { outgoingPayment } = await opApi.payOutgoing({
        incomingPaymentId: flow.incomingId,
        grantAccessToken: flow.grantAccessToken,
      });
      setFlow({});
      Alert.alert('Pago realizado ✅', `ID: ${outgoingPayment.id}`);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo crear el Outgoing Payment');
    } finally {
      setLoading(false);
    }
  }, [flow]);

  const confirmar = async () => {
    try {
      if (serverReceiver && summary.walletDestino !== 'N/D' && summary.walletDestino !== serverReceiver) {
        Alert.alert(
          'Destino distinto',
          `El QR apunta a:\n${summary.walletDestino}\n\npero el backend está configurado para cobrar en:\n${serverReceiver}\n\nSe usará el receiver del backend.`
        );
      }
      setLoading(true);

      const minor = Math.round(Number(summary.monto || '0') * 100).toString();
      const { incomingPayment } = await opApi.createIncoming(minor);

      const { redirectUrl, continueUri, continueAccessToken } = await opApi.startOutgoing(incomingPayment.id);
      setFlow({ incomingId: incomingPayment.id, continueUri, continueAccessToken });

      setConsentUrl(redirectUrl);
      setShowConsent(true);
      continuedRef.current = false;
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo iniciar el pago');
      setFlow({});
    } finally {
      setLoading(false);
    }
  };

  const cancelar = () => Alert.alert('Cancelado', 'Operación cancelada');

  const handleShouldStart = useCallback(
    (req: any) => {
      const url: string = req?.url || '';

      if (url.startsWith(FINISH_SCHEME)) {
        const interact_ref = getInteractRef(url);
        const hash = getFinishHash(url);
        try { webRef.current?.stopLoading(); } catch {}
        finalizeOnce(() => finalizePayment(interact_ref, hash));
        return false;
      }
      if (url.startsWith('http') && url.includes(FINISH_PATH)) {
        const interact_ref = getInteractRef(url);
        const hash = getFinishHash(url);
        try { webRef.current?.stopLoading(); } catch {}
        finalizeOnce(() => finalizePayment(interact_ref, hash));
        return false;
      }
      return true;
    },
    [finalizePayment]
  );

  const handleNavChange = useCallback(
    (navState: any) => {
      const url: string = navState?.url || '';
      if (!url) return;
      if (url.startsWith(FINISH_SCHEME) || (url.startsWith('http') && url.includes(FINISH_PATH))) {
        const interact_ref = getInteractRef(url);
        const hash = getFinishHash(url);
        try { webRef.current?.stopLoading(); } catch {}
        finalizeOnce(() => finalizePayment(interact_ref, hash));
      }
    },
    [finalizePayment]
  );

  const handleMessage = useCallback(
    (e: any) => {
      try {
        const data = JSON.parse(e?.nativeEvent?.data || '{}');
        if (data?.interact_ref) {
          finalizeOnce(() => finalizePayment(data.interact_ref, data?.hash));
        }
      } catch {}
    },
    [finalizePayment]
  );

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={[s.scroll, { padding: PADDING }]} showsVerticalScrollIndicator={false} bounces>
        {/* Header */}
        <View style={[s.header, { maxWidth: MAX_W }]}>
          <View style={s.headerLeft}>
            <View style={[s.headerIcon, { borderRadius: hs(12) }]}>
              <Ionicons name="wallet-outline" size={ms(20)} color="#42b883" />
            </View>
            <View>
              <Text style={[s.title, { fontSize: ms(22) }]}>Wallet</Text>
              <Text style={[s.subtitle, { fontSize: ms(12) }]}>Pago con Open Payments</Text>
            </View>
          </View>

          <View style={[s.badge, { borderRadius: 999, paddingHorizontal: hs(10), paddingVertical: vs(6) }]}>
            <Ionicons name="shield-checkmark-outline" size={ms(14)} color="#0b0b0c" />
            <Text style={[s.badgeText, { fontSize: ms(12) }]}>{summary.scheme}</Text>
          </View>
        </View>

        {/* Card monto + destino */}
        <View style={[s.amountCard, { maxWidth: MAX_W, borderRadius: RADIUS, padding: hs(16) }]}>
          <Text style={[s.amountLabel, { fontSize: ms(12) }]}>Monto</Text>

          <Text style={[s.amount, { fontSize: ms(36), marginBottom: vs(6) }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {money(summary.monto)}
          </Text>

          <View style={[s.destRow, { gap: hs(8) }]}>
            <Ionicons name="arrow-forward-circle" size={ICON} color="#cfcfff" />
            <Text style={[s.destLabel, { fontSize: ms(12) }]}>Destino</Text>
            <Text style={[s.destValue, { fontSize: ms(13) }]} numberOfLines={1}>
              {shorten(summary.walletDestino)}
            </Text>
          </View>

          {serverReceiver && summary.walletDestino !== 'N/D' && summary.walletDestino !== serverReceiver && (
            <Text style={{ color: '#ffcf99', marginTop: 6 }}>Se usará el receiver del servidor: {shorten(serverReceiver)}</Text>
          )}
        </View>

        {/* Detalles */}
        <View style={[s.card, { maxWidth: MAX_W, borderRadius: RADIUS, padding: hs(14) }]}>
          <DetailRow hs={hs} icon={<Ionicons name="person-outline" size={ICON} color="#9aa0a6" />} label="Origen" value={shorten(summary.origen)} />
          <DetailRow hs={hs} icon={<Ionicons name="pricetag-outline" size={ICON} color="#9aa0a6" />} label="Referencia" value={summary.referencia} />
          <DetailRow hs={hs} icon={<Ionicons name="time-outline" size={ICON} color="#9aa0a6" />} label="Timestamp" value={summary.timestamp} />
          {!!summary.raw && (
            <DetailRow hs={hs} icon={<Ionicons name="document-text-outline" size={ICON} color="#9aa0a6" />} label="Payload" value={shorten(summary.raw, 22, 12)} />
          )}
        </View>

        {/* Acciones */}
        <View style={[s.actions, { maxWidth: MAX_W, gap: vs(10) }]}>
          <TouchableOpacity
            style={[s.btn, s.confirm, { borderRadius: hs(12), paddingVertical: vs(14), opacity: loading ? 0.7 : 1 }]}
            onPress={confirmar}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={ms(18)} color="#0b0b0c" />
                <Text style={[s.btnText, { fontSize: ms(15) }]}>Confirmar pago (iniciar)</Text>
              </>
            )}
          </TouchableOpacity>

          {!!flow.grantAccessToken && !!flow.incomingId && (
            <TouchableOpacity
              style={[s.btn, s.confirm, { borderRadius: hs(12), paddingVertical: vs(14), opacity: loading ? 0.7 : 1 }]}
              onPress={pagarAhora}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator />
              ) : (
                <>
                  <Ionicons name="cash-outline" size={ms(18)} color="#0b0b0c" />
                  <Text style={[s.btnText, { fontSize: ms(15) }]}>Pagar ahora</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[s.btn, s.cancel, { borderRadius: hs(12), paddingVertical: vs(14) }]} onPress={cancelar} disabled={loading}>
            <Ionicons name="close-circle" size={ms(18)} color="#fff" />
            <Text style={[s.btnTextAlt, { fontSize: ms(15) }]}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de consentimiento */}
      <Modal visible={showConsent} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowConsent(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0b0b0c' }}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Autorizar pago</Text>
            <TouchableOpacity onPress={() => setShowConsent(false)} style={{ padding: 6 }}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {consentUrl ? (
            <WebView
              ref={webRef}
              source={{ uri: consentUrl }}
              onShouldStartLoadWithRequest={handleShouldStart}
              onNavigationStateChange={handleNavChange}
              onMessage={handleMessage}
              startInLoadingState
              cacheEnabled={false}
              domStorageEnabled
              javaScriptEnabled
              sharedCookiesEnabled
              thirdPartyCookiesEnabled
              setSupportMultipleWindows={true}
              originWhitelist={['*']}
              mixedContentMode="always"
              style={{ flex: 1, backgroundColor: '#0b0b0c' }}
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator />
              <Text style={{ color: '#fff', marginTop: 8 }}>Cargando…</Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Fondo decorativo */}
      <Image
        source={require('../../assets/images/Logo_ocelon.jpg')}
        style={{
          position: 'absolute',
          opacity: 0.04,
          width: width * 0.7,
          height: width * 0.7,
          bottom: -vs(40),
          right: -hs(20),
          borderRadius: hs(20),
        }}
        resizeMode="cover"
      />
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
  hs,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  hs: (n: number) => number;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: hs(10), paddingVertical: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: hs(8), flexShrink: 0 }}>
        {icon}
        <Text style={{ color: '#a0a0a0' }}>{label}</Text>
      </View>
      <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 'auto', maxWidth: '66%', textAlign: 'right' }} numberOfLines={2}>
        {value ?? '—'}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0c' },
  scroll: { alignItems: 'center', gap: 14 },
  header: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#121215',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1f1f25',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 },
    }),
  },
  title: { color: '#fff', fontWeight: '800' },
  subtitle: { color: '#bdbdbd' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#42b883' },
  badgeText: { color: '#0b0b0c', fontWeight: '800' },
  amountCard: {
    width: '100%',
    backgroundColor: '#131318',
    borderWidth: 1,
    borderColor: '#202028',
  },
  amountLabel: { color: '#9f9faf', letterSpacing: 0.4 },
  amount: { color: '#ffffff', fontWeight: '900' },
  destRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 2 },
  destLabel: { color: '#9f9faf' },
  destValue: { color: '#cfcfff', fontWeight: '700', marginLeft: 'auto' },
  card: {
    width: '100%',
    backgroundColor: '#151518',
    borderWidth: 1,
    borderColor: '#202028',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 3 },
    }),
  },
  actions: { width: '100%' },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' },
  confirm: { backgroundColor: '#42b883' },
  cancel: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#3a3a42' },
  btnText: { color: '#0b0b0c', fontWeight: '800' },
  btnTextAlt: { color: '#fff', fontWeight: '800' },
  helper: {
    backgroundColor: '#14141a',
    borderWidth: 1,
    borderColor: '#202028',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helperText: { color: '#9aa0a6' },
});