// screens/WalletScreen.tsx - VERSIÓN CORREGIDA
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

// ═══════════════════════════════════════════════════════════════
// Tipos
// ═══════════════════════════════════════════════════════════════

type QrPayload = {
  raw?: string;
  scheme?: string;
  amount?: string;     // Monto en USD (viene del TimerScreen)
  nonce?: string;
  ts?: string;
  from?: string;
  spot?: string;       // Cajón de estacionamiento
  parking?: string;    // Nombre del estacionamiento
};

// ═══════════════════════════════════════════════════════════════
// Constantes
// ═══════════════════════════════════════════════════════════════

const SERVER_URL = 'http://192.168.100.28:3001'; //CAMBIAR DIRECCION IP
const FINISH_SCHEME = 'ocelon://pay/finish';
const FINISH_PATH = '/op/finish';

// Tasa de conversión aproximada USD → MXN (en producción usar API de tasas)
const USD_TO_MXN_RATE = 17.5;

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

function shorten(s?: string, head = 14, tail = 8) {
  if (!s) return '—';
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

function formatUSD(amount?: string | number) {
  const n = Number(amount ?? '0');
  if (!isFinite(n)) return '$0.00 USD';
  return `$${n.toFixed(2)} USD`;
}

function formatMXN(amount: number) {
  if (!isFinite(amount)) return '$0.00 MXN';
  return `$${amount.toFixed(2)} MXN`;
}

function convertUSDtoMXN(usd: number): number {
  return usd * USD_TO_MXN_RATE;
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

function getFinishHash(url: string) {
  try {
    const u = new URL(url);
    const hash = u.searchParams.get('hash') || '';
    return decodeURIComponent(hash);
  } catch {
    const m = url.match(/[?&]hash=([^&#]+)/);
    return m ? decodeURIComponent(m[1]) : '';
  }
}

// ═══════════════════════════════════════════════════════════════
// Componente DetailRow
// ═══════════════════════════════════════════════════════════════

function DetailRow({
  icon,
  label,
  value,
  hs,
  ms,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  hs: (n: number) => number;
  ms: (n: number, f?: number) => number;
  valueColor?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: hs(10), paddingVertical: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: hs(8), flexShrink: 0 }}>
        {icon}
        <Text style={{ color: '#a0a0a0', fontSize: hs(12) }}>{label}</Text>
      </View>
      <Text
        style={{
          color: valueColor || '#fff',
          fontWeight: '600',
          marginLeft: 'auto',
          maxWidth: '60%',
          textAlign: 'right',
          fontSize: hs(12)
        }}
        numberOfLines={2}
      >
        {value ?? '—'}
      </Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// Componente Principal
// ═══════════════════════════════════════════════════════════════

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

  // ====== Estados ======
  const [flow, setFlow] = useState<{
    incomingId?: string;
    continueUri?: string;
    continueAccessToken?: string;
    grantAccessToken?: string;
    outgoingPaymentId?: string;
    status?: 'initial' | 'authorizing' | 'processing' | 'completed' | 'failed';
  }>({ status: 'initial' });

  const [loading, setLoading] = useState(false);
  const [serverInfo, setServerInfo] = useState<{
    sender: string;
    receiver: string;
    senderCurrency: string;
    receiverCurrency: string;
  } | null>(null);
  const [consentUrl, setConsentUrl] = useState<string | null>(null);
  const [showConsent, setShowConsent] = useState(false);

  // ====== Constantes de diseño ======
  const PADDING = hs(18);
  const RADIUS = hs(18);
  const ICON = ms(18);
  const MAX_W = Math.min(560, width - hs(32));

  // ====== Resumen del pago ======
  const summary = useMemo(() => {
    const amountUSD = Number(qr.amount ?? '0');
    const amountMXN = convertUSDtoMXN(amountUSD);

    return {
      amountUSD,              // Lo que paga el usuario en USD
      amountMXN,              // Lo que recibe ocelon1 en MXN
      spot: qr.spot ?? '—',
      parking: qr.parking ?? 'Estacionamiento',
      nonce: qr.nonce ?? '—',
      timestamp: qr.ts ?? '—',
      raw: qr.raw,
      scheme: (qr.scheme ?? 'openpayment').toUpperCase(),
    };
  }, [qr]);

  // ====== Cargar info del servidor ======
  useEffect(() => {
    (async () => {
      try {
        const w = await opApi.wallets();
        setServerInfo({
          sender: w.senderWallet.publicName,
          receiver: w.receiverWallet.publicName,
          senderCurrency: w.senderWallet.assetCode,
          receiverCurrency: w.receiverWallet.assetCode,
        });
        console.log('✅ Wallets cargados:', {
          sender: w.senderWallet.publicName,
          receiver: w.receiverWallet.publicName,
        });
      } catch (e: any) {
        console.error('❌ No se pudo leer /op/wallets:', e?.message);
        Alert.alert(
          'Error de Conexión',
          `No se pudo conectar al servidor: ${e?.message}\n\nAsegúrate de que el servidor esté ejecutándose en ${SERVER_URL}`
        );
      }
    })();
  }, []);

  // ====== Finalizar el pago ======
  const finalizeOnce = (fn: () => void) => {
    if (continuedRef.current) return;
    continuedRef.current = true;
    fn();
  };

  const finalizePayment = useCallback(async (interact_ref: string, hash?: string) => {
    if (finishingRef.current) return;
    finishingRef.current = true;

    try {
      console.log('🏁 [FINISH] Finalizando pago...');

      // Validar que tenemos todos los datos necesarios
      if (!flow.incomingId || !flow.continueUri || !flow.continueAccessToken) {
        throw new Error('Faltan datos necesarios para finalizar el pago');
      }

      // 1. Finalizar el grant y obtener access token
      const result = await opApi.finishOutgoing({
        incomingPaymentId: flow.incomingId,
        continueUri: flow.continueUri,
        continueAccessToken: flow.continueAccessToken,
        interact_ref,
        hash,
      });

      // 2. Crear el outgoing payment
      console.log('🎯 Creando outgoing payment...');
      const payResult = await opApi.payOutgoing({
        incomingPaymentId: flow.incomingId,
        grantAccessToken: result.grantAccessToken,
      });

      console.log('✅ Outgoing payment creado:', payResult.outgoingPayment?.id);

      // 3. Actualizar estado
      setFlow(prev => ({
        ...prev,
        grantAccessToken: result.grantAccessToken,
        outgoingPaymentId: payResult.outgoingPayment?.id,
        status: 'completed'
      }));

      setShowConsent(false);
      setConsentUrl(null);

      // 4. Mostrar confirmación con detalles de conversión
      Alert.alert(
        '¡Pago Completado! ✅',
        `Estacionamiento pagado exitosamente.\n\n` +
        `💵 Pagaste: ${formatUSD(summary.amountUSD)}\n` +
        `💱 Convertido a: ~${formatMXN(summary.amountMXN)}\n` +
        `📍 Cajón: ${summary.spot}\n\n` +
        `ID: ${shorten(payResult.outgoingPayment?.id)}`,
        [{ text: 'OK' }]
      );

    } catch (e: any) {
      console.error('❌ [finishOutgoing error]', e);
      setFlow(prev => ({ ...prev, status: 'failed' }));
      Alert.alert(
        'Error en Pago',
        e?.message || 'No se pudo completar el pago. Por favor intenta nuevamente.'
      );
    } finally {
      finishingRef.current = false;
    }
  }, [flow, summary]);

  // ====== Iniciar el pago ======
  const confirmar = async () => {
    try {
      setLoading(true);
      setFlow(prev => ({ ...prev, status: 'initial' }));

      // El monto que recibe ocelon1 es en MXN (centavos)
      // Convertimos USD a MXN y luego a centavos
      const mxnCentavos = Math.round(summary.amountMXN * 100).toString();

      console.log('💰 Iniciando pago:', {
        usd: summary.amountUSD,
        mxn: summary.amountMXN,
        centavos: mxnCentavos,
      });

      // 1. Crear incoming payment (en MXN - ocelon1)
      console.log('📦 Creando incoming payment en MXN...');
      const result = await opApi.createIncoming(mxnCentavos);

      console.log('📦 Respuesta del servidor:', JSON.stringify(result, null, 2));

      // CORRECCIÓN: El ID viene dentro de incomingPayment.id
      if (!result.incomingPayment?.id) {
        console.error('❌ No se recibió ID del incoming payment:', result);
        throw new Error('No se pudo crear el incoming payment - ID no recibido en la estructura esperada');
      }

      const incomingPayment = result.incomingPayment;

      console.log('✅ Incoming payment creado:', {
        id: incomingPayment.id,
        state: incomingPayment.state,
        amount: incomingPayment.incomingAmount
      });

      // 2. Iniciar outgoing grant (desde car21 en USD)
      console.log('🚀 Iniciando outgoing grant...');
      const startResult = await opApi.startOutgoing(incomingPayment.id);

      // Validar que tenemos todos los datos del grant
      if (!startResult.redirectUrl || !startResult.continueUri || !startResult.continueAccessToken) {
        throw new Error('No se recibieron todos los datos necesarios del grant');
      }

      setFlow({
        incomingId: incomingPayment.id,
        continueUri: startResult.continueUri,
        continueAccessToken: startResult.continueAccessToken,
        status: 'authorizing'
      });

      setConsentUrl(startResult.redirectUrl);
      setShowConsent(true);
      continuedRef.current = false;

    } catch (e: any) {
      console.error('❌ Error en confirmar:', e);
      setFlow(prev => ({ ...prev, status: 'failed' }));

      let errorMessage = e?.message ?? 'No se pudo iniciar el pago';

      // Mensajes más específicos para el usuario
      if (errorMessage.includes('connection') || errorMessage.includes('network')) {
        errorMessage = 'Error de conexión. Verifica que el servidor esté funcionando.';
      } else if (errorMessage.includes('incoming payment')) {
        errorMessage = 'Error creando la solicitud de pago. Intenta nuevamente.';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ====== Cancelar ======
  const cancelar = () => {
    setFlow({ status: 'initial' });
    setShowConsent(false);
    setConsentUrl(null);
  };

  // ====== Handlers de WebView ======
  const handleShouldStart = useCallback((req: any) => {
    const url: string = req?.url || '';

    if (url.startsWith(FINISH_SCHEME) || (url.startsWith('http') && url.includes(FINISH_PATH))) {
      const interact_ref = getInteractRef(url);
      const hash = getFinishHash(url);
      try { webRef.current?.stopLoading(); } catch { }
      setFlow(prev => ({ ...prev, status: 'processing' }));
      finalizeOnce(() => finalizePayment(interact_ref, hash));
      return false;
    }
    return true;
  }, [finalizePayment]);

  const handleNavChange = useCallback((navState: any) => {
    const url: string = navState?.url || '';
    if (!url) return;

    if (url.startsWith(FINISH_SCHEME) || (url.startsWith('http') && url.includes(FINISH_PATH))) {
      const interact_ref = getInteractRef(url);
      const hash = getFinishHash(url);
      try { webRef.current?.stopLoading(); } catch { }
      setFlow(prev => ({ ...prev, status: 'processing' }));
      finalizeOnce(() => finalizePayment(interact_ref, hash));
    }
  }, [finalizePayment]);

  const handleMessage = useCallback((e: any) => {
    try {
      const data = JSON.parse(e?.nativeEvent?.data || '{}');
      if (data?.interact_ref) {
        setFlow(prev => ({ ...prev, status: 'processing' }));
        finalizeOnce(() => finalizePayment(data.interact_ref, data?.hash));
      }
    } catch { }
  }, [finalizePayment]);

  // ====== Render ======
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
              <Text style={[s.title, { fontSize: ms(22) }]}>Pagar</Text>
              <Text style={[s.subtitle, { fontSize: ms(12) }]}>Open Payments</Text>
            </View>
          </View>

          <View style={[s.badge, { borderRadius: 999, paddingHorizontal: hs(10), paddingVertical: vs(6) }]}>
            <Ionicons name="car" size={ms(14)} color="#0b0b0c" />
            <Text style={[s.badgeText, { fontSize: ms(12) }]}>{summary.spot}</Text>
          </View>
        </View>

        {/* Card monto principal - USD */}
        <View style={[s.amountCard, { maxWidth: MAX_W, borderRadius: RADIUS, padding: hs(16) }]}>
          <Text style={[s.amountLabel, { fontSize: ms(12) }]}>Monto a Pagar</Text>

          <View style={s.amountRow}>
            <Ionicons name="logo-usd" size={ms(28)} color="#42b883" />
            <Text style={[s.amount, { fontSize: ms(40) }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
              {formatUSD(summary.amountUSD)}
            </Text>
          </View>

          {/* Conversión */}
          <View style={s.conversionBox}>
            <View style={s.conversionRow}>
              <Ionicons name="swap-horizontal" size={ms(18)} color="#6C63FF" />
              <Text style={s.conversionLabel}>Se convertirá a:</Text>
            </View>
            <Text style={s.conversionAmount}>
              ~{formatMXN(summary.amountMXN)}
            </Text>
            <Text style={s.conversionRate}>
              Tasa: 1 USD = {USD_TO_MXN_RATE} MXN
            </Text>
          </View>

          {/* Wallets info */}
          {serverInfo && (
            <View style={s.walletsInfo}>
              <View style={s.walletRow}>
                <Ionicons name="arrow-up-circle-outline" size={ms(16)} color="#ff6b6b" />
                <Text style={s.walletLabel}>Desde:</Text>
                <Text style={s.walletValue}>{serverInfo.sender} ({serverInfo.senderCurrency})</Text>
              </View>
              <View style={s.walletRow}>
                <Ionicons name="arrow-down-circle-outline" size={ms(16)} color="#42b883" />
                <Text style={s.walletLabel}>Hacia:</Text>
                <Text style={s.walletValue}>{serverInfo.receiver} ({serverInfo.receiverCurrency})</Text>
              </View>
            </View>
          )}
        </View>

        {/* Detalles del estacionamiento */}
        <View style={[s.card, { maxWidth: MAX_W, borderRadius: RADIUS, padding: hs(14) }]}>
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: ms(14), marginBottom: vs(8) }}>
            Detalles del Estacionamiento
          </Text>

          <DetailRow
            hs={hs}
            ms={ms}
            icon={<Ionicons name="location" size={ICON} color="#42b883" />}
            label="Cajón"
            value={summary.spot}
            valueColor="#42b883"
          />
          <DetailRow
            hs={hs}
            ms={ms}
            icon={<Ionicons name="business-outline" size={ICON} color="#9aa0a6" />}
            label="Estacionamiento"
            value={summary.parking}
          />
          <DetailRow
            hs={hs}
            ms={ms}
            icon={<Ionicons name="finger-print-outline" size={ICON} color="#9aa0a6" />}
            label="Sesión"
            value={shorten(summary.nonce, 8, 6)}
          />
          <DetailRow
            hs={hs}
            ms={ms}
            icon={<Ionicons name="time-outline" size={ICON} color="#9aa0a6" />}
            label="Timestamp"
            value={summary.timestamp}
          />
        </View>

        {/* Estado del pago */}
        <View style={[s.statusContainer, { maxWidth: MAX_W }]}>
          {flow.status === 'authorizing' && (
            <View style={s.statusRow}>
              <ActivityIndicator size="small" color="#42b883" />
              <Text style={s.statusText}>Autorizando pago...</Text>
            </View>
          )}

          {flow.status === 'processing' && (
            <View style={s.statusRow}>
              <ActivityIndicator size="small" color="#42b883" />
              <Text style={s.statusText}>Procesando conversión USD → MXN...</Text>
            </View>
          )}

          {flow.status === 'completed' && (
            <View style={[s.statusRow, s.statusCompleted]}>
              <Ionicons name="checkmark-circle" size={ms(18)} color="#42b883" />
              <Text style={[s.statusText, s.statusCompletedText]}>¡Pago completado!</Text>
            </View>
          )}

          {flow.status === 'failed' && (
            <View style={[s.statusRow, s.statusFailed]}>
              <Ionicons name="close-circle" size={ms(18)} color="#ff6b6b" />
              <Text style={[s.statusText, { color: '#ff6b6b' }]}>Error en el pago</Text>
            </View>
          )}

          {flow.outgoingPaymentId && (
            <Text style={s.paymentIdText}>ID: {shorten(flow.outgoingPaymentId, 18, 10)}</Text>
          )}
        </View>

        {/* Acciones */}
        <View style={[s.actions, { maxWidth: MAX_W, gap: vs(10) }]}>
          <TouchableOpacity
            style={[
              s.btn,
              s.confirm,
              {
                borderRadius: hs(12),
                paddingVertical: vs(14),
                opacity: (loading || flow.status === 'completed') ? 0.7 : 1
              }
            ]}
            onPress={confirmar}
            disabled={loading || flow.status === 'completed'}
          >
            {loading ? (
              <ActivityIndicator color="#0b0b0c" />
            ) : (
              <>
                <Ionicons
                  name={flow.status === 'completed' ? "checkmark-done" : "card-outline"}
                  size={ms(18)}
                  color="#0b0b0c"
                />
                <Text style={[s.btnText, { fontSize: ms(15) }]}>
                  {flow.status === 'completed' ? 'Pago Completado' : `Pagar ${formatUSD(summary.amountUSD)}`}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.btn, s.cancel, { borderRadius: hs(12), paddingVertical: vs(14) }]}
            onPress={cancelar}
            disabled={loading}
          >
            <Ionicons name="close-circle" size={ms(18)} color="#fff" />
            <Text style={[s.btnTextAlt, { fontSize: ms(15) }]}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de consentimiento */}
      <Modal visible={showConsent} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowConsent(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0b0b0c' }}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Autorizar Pago</Text>
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
              renderLoading={() => (
                <View style={s.webviewLoading}>
                  <ActivityIndicator size="large" color="#42b883" />
                  <Text style={s.webviewText}>Cargando autorización...</Text>
                </View>
              )}
            />
          ) : (
            <View style={s.webviewLoading}>
              <ActivityIndicator size="large" color="#42b883" />
              <Text style={s.webviewText}>Preparando autorización...</Text>
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

// ═══════════════════════════════════════════════════════════════
// Estilos (mantener igual)
// ═══════════════════════════════════════════════════════════════

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
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 },
    }),
  },
  amountLabel: { color: '#9f9faf', letterSpacing: 0.4, marginBottom: 4 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  amount: { color: '#42b883', fontWeight: '900' },

  conversionBox: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  conversionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  conversionLabel: { color: '#6C63FF', fontSize: 12 },
  conversionAmount: { color: '#fff', fontSize: 22, fontWeight: '700' },
  conversionRate: { color: '#9f9faf', fontSize: 11, marginTop: 4 },

  walletsInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#202028',
  },
  walletRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  walletLabel: { color: '#9f9faf', fontSize: 12 },
  walletValue: { color: '#fff', fontSize: 12, fontWeight: '600', marginLeft: 'auto' },

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

  statusContainer: {
    width: '100%',
    padding: 12,
    backgroundColor: '#151518',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#202028',
    minHeight: 50,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusText: { color: '#cfcfff', fontSize: 13 },
  statusCompleted: {
    backgroundColor: 'rgba(66, 184, 131, 0.15)',
    padding: 10,
    borderRadius: 8,
  },
  statusCompletedText: { color: '#42b883', fontWeight: '600' },
  statusFailed: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    padding: 10,
    borderRadius: 8,
  },
  paymentIdText: {
    color: '#9aa0a6',
    fontSize: 10,
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  actions: { width: '100%' },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' },
  confirm: { backgroundColor: '#42b883' },
  cancel: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#3a3a42' },
  btnText: { color: '#0b0b0c', fontWeight: '800' },
  btnTextAlt: { color: '#fff', fontWeight: '800' },

  modalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f25',
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  webviewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0b0b0c',
  },
  webviewText: { color: '#fff', marginTop: 16 },
});