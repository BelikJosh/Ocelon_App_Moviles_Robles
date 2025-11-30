// screens/WalletScreen.tsx - VERSIÓN COMPLETA CON TEMA E IDIOMA
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
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
import CustomSuccessModal from '../components/CustomSuccessModal';
import { opApi } from '../services/opApi';
import { useConfig } from '../contexts/ConfigContext'; // Importa el hook

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
  elapsedTime?: number; // Tiempo transcurrido en segundos
  finalCost?: number;  // Costo final en USD
};

// ═══════════════════════════════════════════════════════════════
// Constantes
// ═══════════════════════════════════════════════════════════════

const SERVER_URL = 'http://192.168.100.77:3001'; //CAMBIAR DIRECCION IP
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

function formatTime(totalSeconds: number) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
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
  vs,
  ms,
  valueColor,
  colors,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  hs: (n: number) => number;
  vs: (n: number) => number;
  ms: (n: number, f?: number) => number;
  valueColor?: string;
  colors: any;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: hs(10), paddingVertical: vs(6) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: hs(8), flexShrink: 0 }}>
        {icon}
        <Text style={{ color: colors.textSecondary, fontSize: hs(12) }}>{label}</Text>
      </View>
      <Text
        style={{
          color: valueColor || colors.text,
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
  const navigation = useNavigation<any>();
  const qr: QrPayload = route.params?.qr ?? {};
  const webRef = useRef<WebView>(null);
  const continuedRef = useRef(false);
  const finishingRef = useRef(false);
  const { t, isDark } = useConfig(); // Usa el hook de configuración

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
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // ====== Constantes de diseño ======
  const PADDING = hs(18);
  const RADIUS = hs(18);
  const ICON = ms(18);
  const MAX_W = Math.min(560, width - hs(32));

  // ====== Colores dinámicos según el tema ======
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
    error: isDark ? '#ff6b6b' : '#d32f2f',
    success: isDark ? '#42b883' : '#2e7d32',
  };

  // ====== Resumen del pago ======
  const summary = useMemo(() => {
    const amountUSD = Number(qr.amount ?? qr.finalCost ?? '0');
    const amountMXN = convertUSDtoMXN(amountUSD);
    const elapsedTime = qr.elapsedTime ?? 0;

    return {
      amountUSD,              // Lo que paga el usuario en USD
      amountMXN,              // Lo que recibe ocelon1 en MXN
      spot: qr.spot ?? '—',
      parking: qr.parking ?? t('parking'),
      nonce: qr.nonce ?? '—',
      timestamp: qr.ts ?? '—',
      elapsedTime: elapsedTime,
      formattedTime: formatTime(elapsedTime),
      raw: qr.raw,
      scheme: (qr.scheme ?? 'openpayment').toUpperCase(),
    };
  }, [qr, t]);

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
          t('connectionError'),
          `${t('serverConnectionError')}: ${e?.message}\n\n${t('ensureServerRunning')} ${SERVER_URL}`
        );
      }
    })();
  }, [t]);

  // ====== Función para redirigir a ExitScreen ======
  const redirectToExitScreen = useCallback(() => {
    console.log('🔄 Redirigiendo a ExitScreen...');

    // Navegar a ExitScreen con los datos necesarios
    navigation.navigate('ExitScreen', {
      rawQrData: qr.raw || '',
      referencia: `op_${flow.outgoingPaymentId || Date.now()}`,
      monto: summary.amountUSD
    });
  }, [navigation, qr.raw, flow.outgoingPaymentId, summary.amountUSD]);

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
        throw new Error(t('missingPaymentData'));
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

      // 4. Mostrar modal personalizado de éxito
      setShowSuccessModal(true);

    } catch (e: any) {
      console.error('❌ [finishOutgoing error]', e);
      setFlow(prev => ({ ...prev, status: 'failed' }));
      Alert.alert(
        t('paymentError'),
        e?.message || t('paymentFailed')
      );
    } finally {
      finishingRef.current = false;
    }
  }, [flow, summary, t]);

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
        tiempo: summary.formattedTime,
        cajon: summary.spot,
      });

      // 1. Crear incoming payment (en MXN - ocelon1)
      console.log('📦 Creando incoming payment en MXN...');
      const result = await opApi.createIncoming(mxnCentavos);

      console.log('📦 Respuesta del servidor:', JSON.stringify(result, null, 2));

      // CORRECCIÓN: El ID viene dentro de incomingPayment.id
      if (!result.incomingPayment?.id) {
        console.error('❌ No se recibió ID del incoming payment:', result);
        throw new Error(t('incomingPaymentError'));
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
        throw new Error(t('grantDataError'));
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

      let errorMessage = e?.message ?? t('paymentInitError');

      // Mensajes más específicos para el usuario
      if (errorMessage.includes('connection') || errorMessage.includes('network')) {
        errorMessage = t('connectionError');
      } else if (errorMessage.includes('incoming payment')) {
        errorMessage = t('paymentRequestError');
      }

      Alert.alert(t('error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ====== Cancelar ======
  const cancelar = () => {
    setFlow({ status: 'initial' });
    setShowConsent(false);
    setConsentUrl(null);
    navigation.goBack();
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

  // ====== Función para manejar el éxito del pago ======
  const handlePaymentSuccess = () => {
    setShowSuccessModal(false);
    redirectToExitScreen();
  };

  // ====== Render ======
  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[s.scroll, { padding: PADDING }]} showsVerticalScrollIndicator={false} bounces>

        {/* Header Mejorado */}
        <View style={[s.header, { maxWidth: MAX_W }]}>
          <View style={s.headerLeft}>
            <View style={[s.headerIcon, { 
              borderRadius: hs(12),
              backgroundColor: colors.secondary,
              borderColor: colors.border 
            }]}>
              <Ionicons name="wallet-outline" size={ms(20)} color={colors.primary} />
            </View>
            <View style={s.headerTextContainer}>
              <Text style={[s.title, { 
                fontSize: ms(20),
                color: colors.text 
              }]} numberOfLines={1}>
                {t('payParking')}
              </Text>
              <Text style={[s.subtitle, { 
                fontSize: ms(11),
                color: colors.textSecondary 
              }]} numberOfLines={1}>
                Open Payments
              </Text>
            </View>
          </View>

          <View style={[s.badge, {
            maxWidth: hs(65),
            minWidth: hs(45),
            paddingHorizontal: hs(6),
            paddingVertical: vs(3),
            backgroundColor: colors.primary
          }]}>
            <Ionicons name="car" size={ms(10)} color="#0b0b0c" />
            <Text
              style={[s.badgeText, { fontSize: ms(9) }]}
              numberOfLines={1}
            >
              {summary.spot.length > 6 ? `${summary.spot.substring(0, 6)}` : summary.spot}
            </Text>
          </View>
        </View>

        {/* Card monto principal - USD */}
        <View style={[s.amountCard, { 
          maxWidth: MAX_W, 
          borderRadius: RADIUS, 
          padding: hs(16),
          backgroundColor: colors.card,
          borderColor: colors.border 
        }]}>
          <Text style={[s.amountLabel, { 
            fontSize: ms(12),
            color: colors.textSecondary 
          }]}>{t('amountToPay')}</Text>

          <View style={s.amountRow}>
            <Ionicons name="logo-usd" size={ms(28)} color={colors.primary} />
            <Text style={[s.amount, { 
              fontSize: ms(40),
              color: colors.primary 
            }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
              {formatUSD(summary.amountUSD)}
            </Text>
          </View>

          {/* Información de tiempo */}
          <View style={[s.timeInfo, { borderTopColor: colors.border }]}>
            <View style={s.timeRow}>
              <Ionicons name="time-outline" size={ms(16)} color={colors.primary} />
              <Text style={[s.timeLabel, { color: colors.textSecondary }]}>{t('parkingTime')}:</Text>
              <Text style={[s.timeValue, { color: colors.primary }]}>{summary.formattedTime}</Text>
            </View>
          </View>

          {/* Conversión */}
          <View style={[s.conversionBox, { 
            backgroundColor: isDark ? 'rgba(108, 99, 255, 0.1)' : 'rgba(108, 99, 255, 0.05)',
            borderColor: isDark ? 'rgba(108, 99, 255, 0.3)' : 'rgba(108, 99, 255, 0.2)'
          }]}>
            <View style={s.conversionRow}>
              <Ionicons name="swap-horizontal" size={ms(18)} color={colors.tertiaryText} />
              <Text style={[s.conversionLabel, { color: colors.tertiaryText }]}>{t('willConvertTo')}:</Text>
            </View>
            <Text style={[s.conversionAmount, { color: colors.text }]}>
              ~{formatMXN(summary.amountMXN)}
            </Text>
            <Text style={[s.conversionRate, { color: colors.textSecondary }]}>
              {t('rate')}: 1 USD = {USD_TO_MXN_RATE} MXN
            </Text>
          </View>

          {/* Wallets info */}
          {serverInfo && (
            <View style={[s.walletsInfo, { borderTopColor: colors.border }]}>
              <View style={s.walletRow}>
                <Ionicons name="arrow-up-circle-outline" size={ms(16)} color={colors.error} />
                <Text style={[s.walletLabel, { color: colors.textSecondary }]}>{t('from')}:</Text>
                <Text style={[s.walletValue, { color: colors.text }]}>{serverInfo.sender} ({serverInfo.senderCurrency})</Text>
              </View>
              <View style={s.walletRow}>
                <Ionicons name="arrow-down-circle-outline" size={ms(16)} color={colors.success} />
                <Text style={[s.walletLabel, { color: colors.textSecondary }]}>{t('to')}:</Text>
                <Text style={[s.walletValue, { color: colors.text }]}>{serverInfo.receiver} ({serverInfo.receiverCurrency})</Text>
              </View>
            </View>
          )}
        </View>

        {/* Detalles del estacionamiento */}
        <View style={[s.card, { 
          maxWidth: MAX_W, 
          borderRadius: RADIUS, 
          padding: hs(14),
          backgroundColor: colors.card,
          borderColor: colors.border 
        }]}>
          <Text style={{ 
            color: colors.text, 
            fontWeight: '600', 
            fontSize: ms(14), 
            marginBottom: vs(8) 
          }}>
            {t('parkingDetails')}
          </Text>

          <DetailRow
            hs={hs}
            vs={vs}
            ms={ms}
            colors={colors}
            icon={<Ionicons name="location" size={ICON} color={colors.primary} />}
            label={t('spot')}
            value={summary.spot}
            valueColor={colors.primary}
          />
          <DetailRow
            hs={hs}
            vs={vs}
            ms={ms}
            colors={colors}
            icon={<Ionicons name="business-outline" size={ICON} color={colors.textSecondary} />}
            label={t('parking')}
            value={summary.parking}
          />
          <DetailRow
            hs={hs}
            vs={vs}
            ms={ms}
            colors={colors}
            icon={<Ionicons name="time-outline" size={ICON} color={colors.textSecondary} />}
            label={t('totalTime')}
            value={summary.formattedTime}
          />
          <DetailRow
            hs={hs}
            vs={vs}
            ms={ms}
            colors={colors}
            icon={<Ionicons name="finger-print-outline" size={ICON} color={colors.textSecondary} />}
            label={t('session')}
            value={shorten(summary.nonce, 8, 6)}
          />
          <DetailRow
            hs={hs}
            vs={vs}
            ms={ms}
            colors={colors}
            icon={<Ionicons name="calendar-outline" size={ICON} color={colors.textSecondary} />}
            label={t('timestamp')}
            value={summary.timestamp}
          />
        </View>

        {/* Estado del pago */}
        <View style={[s.statusContainer, { 
          maxWidth: MAX_W,
          backgroundColor: colors.card,
          borderColor: colors.border 
        }]}>
          {flow.status === 'authorizing' && (
            <View style={s.statusRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[s.statusText, { color: colors.text }]}>{t('authorizingPayment')}</Text>
            </View>
          )}

          {flow.status === 'processing' && (
            <View style={s.statusRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[s.statusText, { color: colors.text }]}>{t('processingConversion')}</Text>
            </View>
          )}

          {flow.status === 'completed' && (
            <View style={[s.statusRow, s.statusCompleted, { 
              backgroundColor: isDark ? 'rgba(66, 184, 131, 0.15)' : 'rgba(46, 125, 50, 0.1)' 
            }]}>
              <Ionicons name="checkmark-circle" size={ms(18)} color={colors.success} />
              <Text style={[s.statusText, s.statusCompletedText, { color: colors.success }]}>{t('paymentCompleted')}</Text>
            </View>
          )}

          {flow.status === 'failed' && (
            <View style={[s.statusRow, s.statusFailed, { 
              backgroundColor: isDark ? 'rgba(255, 107, 107, 0.15)' : 'rgba(211, 47, 47, 0.1)' 
            }]}>
              <Ionicons name="close-circle" size={ms(18)} color={colors.error} />
              <Text style={[s.statusText, { color: colors.error }]}>{t('paymentError')}</Text>
            </View>
          )}

          {flow.outgoingPaymentId && (
            <Text style={[s.paymentIdText, { color: colors.textSecondary }]}>
              ID: {shorten(flow.outgoingPaymentId, 18, 10)}
            </Text>
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
                opacity: (loading || flow.status === 'completed') ? 0.7 : 1,
                backgroundColor: colors.primary
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
                  {flow.status === 'completed' ? t('paymentCompleted') : `${t('pay')} ${formatUSD(summary.amountUSD)}`}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.btn, s.cancel, { 
              borderRadius: hs(12), 
              paddingVertical: vs(14),
              backgroundColor: 'transparent',
              borderColor: colors.border 
            }]}
            onPress={cancelar}
            disabled={loading}
          >
            <Ionicons name="close-circle" size={ms(18)} color={colors.text} />
            <Text style={[s.btnTextAlt, { 
              fontSize: ms(15),
              color: colors.text 
            }]}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de consentimiento */}
      <Modal visible={showConsent} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowConsent(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>{t('authorizePayment')}</Text>
            <TouchableOpacity onPress={() => setShowConsent(false)} style={{ padding: 6 }}>
              <Ionicons name="close" size={22} color={colors.text} />
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
              style={{ flex: 1, backgroundColor: colors.background }}
              renderLoading={() => (
                <View style={[s.webviewLoading, { backgroundColor: colors.background }]}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[s.webviewText, { color: colors.text }]}>{t('loadingAuthorization')}</Text>
                </View>
              )}
            />
          ) : (
            <View style={[s.webviewLoading, { backgroundColor: colors.background }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[s.webviewText, { color: colors.text }]}>{t('preparingAuthorization')}</Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Modal de éxito personalizado */}
      <CustomSuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        onContinue={handlePaymentSuccess}
        data={{
          parking: summary.parking,
          spot: summary.spot,
          amount: summary.amountUSD,
          time: summary.formattedTime,
          paymentId: flow.outgoingPaymentId
        }}
      />

      {/* Fondo decorativo */}
      <Image
        source={require('../../assets/images/Logo_ocelon.jpg')}
        style={{
          position: 'absolute',
          opacity: isDark ? 0.04 : 0.02,
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
// Estilos (actualizados)
// ═══════════════════════════════════════════════════════════════

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { alignItems: 'center', gap: 14 },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 50,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  headerTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  headerIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 },
    }),
  },
  title: {
    fontWeight: '800',
    flexShrink: 1,
  },
  subtitle: {
    flexShrink: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    flexShrink: 0,
    marginLeft: 8,
  },
  badgeText: {
    color: '#0b0b0c',
    fontWeight: '800',
    flexShrink: 1,
  },

  amountCard: {
    width: '100%',
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 },
    }),
  },
  amountLabel: { letterSpacing: 0.4, marginBottom: 4 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  amount: { fontWeight: '900' },

  timeInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  timeLabel: { fontSize: 12 },
  timeValue: { fontSize: 14, fontWeight: '600', marginLeft: 'auto' },

  conversionBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  conversionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  conversionLabel: { fontSize: 12 },
  conversionAmount: { fontSize: 22, fontWeight: '700' },
  conversionRate: { fontSize: 11, marginTop: 4 },

  walletsInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  walletRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  walletLabel: { fontSize: 12 },
  walletValue: { fontSize: 12, fontWeight: '600', marginLeft: 'auto' },

  card: {
    width: '100%',
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 3 },
    }),
  },

  statusContainer: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 50,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusText: { fontSize: 13 },
  statusCompleted: {
    padding: 10,
    borderRadius: 8,
  },
  statusCompletedText: { fontWeight: '600' },
  statusFailed: {
    padding: 10,
    borderRadius: 8,
  },
  paymentIdText: {
    fontSize: 10,
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  actions: { width: '100%' },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' },
  confirm: { },
  cancel: { borderWidth: 1 },
  btnText: { fontWeight: '800' },
  btnTextAlt: { fontWeight: '800' },

  modalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  webviewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webviewText: { marginTop: 16 },
});