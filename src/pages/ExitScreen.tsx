// screens/ExitScreen.tsx
// Pantalla de salida con QR y temporizador
import { Ionicons } from "@expo/vector-icons";
import { CommonActions, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BlurView } from "expo-blur";
import * as Notifications from "expo-notifications";
import React, { useEffect, useRef, useState } from "react";
import {
  BackHandler,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from "../navegation/types/navigation";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ExitScreen">;
  route: RouteProp<RootStackParamList, "ExitScreen">;
};

// Helper para detectar el método de pago desde la referencia o rawQrData
const detectPaymentMethod = (referencia?: string, rawQrData?: string): string => {
  if (referencia?.startsWith('op_') || rawQrData?.includes('openpayment')) {
    return 'open_payments';
  }
  if (referencia?.startsWith('digital_') || rawQrData?.includes('digital')) {
    return 'digital';
  }
  if (referencia?.startsWith('ocelon_cash') || rawQrData?.includes('cajero')) {
    return 'cash';
  }
  return 'digital'; // default
};

// Constantes de diseño
const BASE_W = 375;
const BASE_H = 812;
const TOTAL_SECONDS = 15;

// Tipo de cambio USD a MXN (aproximado)
const USD_TO_MXN = 17.5;

export default function ExitScreen({ navigation, route }: Props) {
  const { rawQrData, monto, referencia } = route.params;
  const insets = useSafeAreaInsets();

  // Escalas responsivas
  const { width, height } = useWindowDimensions();
  const hs = (size: number) => (width / BASE_W) * size;
  const vs = (size: number) => (height / BASE_H) * size;
  const ms = (size: number, factor = 0.5) => size + (hs(size) - size) * factor;

  const [seconds, setSeconds] = useState(TOTAL_SECONDS);
  const startTimeRef = useRef(Date.now());
  const prevColorRef = useRef<string>("");
  const hasNavigatedRef = useRef(false); // Nueva ref para controlar navegación

  // Convertir USD a MXN
  const montoInMXN = (monto || 0) * USD_TO_MXN;

  const getTimerColor = (sec: number) => {
    if (sec >= 11) return "#42b883"; // verde
    if (sec >= 6) return "#ffaa00"; // amarillo
    return "#ff4444"; // rojo
  };

  const getTimerBgColor = (sec: number) => {
    if (sec >= 11) return "rgba(66, 184, 131, 0.15)";
    if (sec >= 6) return "rgba(255, 170, 0, 0.15)";
    return "rgba(255, 68, 68, 0.15)";
  };

  const getTimerMessage = (sec: number) => {
    if (sec >= 11) return "¡Tienes tiempo suficiente!";
    if (sec >= 6) return "Apresúrate, queda poco tiempo";
    return "¡Muestra el código ahora!";
  };

  const getTimerIcon = (sec: number): any => {
    if (sec >= 11) return "checkmark-circle";
    if (sec >= 6) return "warning";
    return "alert-circle";
  };

  // Bloquear botón físico de retroceso
  useEffect(() => {
    const backAction = () => true;
    if (Platform.OS === "android") {
      const subscription = BackHandler.addEventListener("hardwareBackPress", backAction);
      return () => subscription.remove();
    }
  }, []);

  // Crear canal de notificaciones para Android
  useEffect(() => {
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("timer-channel", {
        name: "Timer Notifications",
        importance: Notifications.AndroidImportance.MAX,
        sound: "default",
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }
  }, []);

  // Función para enviar notificación
  const sendNotification = async (title: string, body: string) => {
    const trigger: Notifications.TimeIntervalTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 0.1,
      repeats: false,
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        ...(Platform.OS === "android" ? { channelId: "timer-channel" } : {}),
      },
      trigger,
    });
  };

  // Temporizador con notificaciones solo al cambiar de color
  useEffect(() => {
    const interval = setInterval(async () => {
      // Si ya navegamos a ValorationScreen, no hacer nada
      if (hasNavigatedRef.current) {
        clearInterval(interval);
        return;
      }

      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = TOTAL_SECONDS - elapsed;
      const sec = Math.max(remaining, 0);
      setSeconds(sec);

      const currentColor = getTimerColor(sec);

      // Notificación solo cuando cambia el color
      if (prevColorRef.current !== currentColor) {
        prevColorRef.current = currentColor;
        await sendNotification(`Tiempo restante: ${sec}s`, getTimerMessage(sec));
      }

      // Terminar timer y navegar a Timer (solo si NO hemos ido a ValorationScreen)
      if (sec <= 0 && !hasNavigatedRef.current) {
        clearInterval(interval);
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Timer", params: { rawQrData } }],
          })
        );
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Botón para simular QR escaneado y finalizar
  const simulateQrScanned = () => {
    // Marcar que ya navegamos para detener el timer
    hasNavigatedRef.current = true;
    setSeconds(0);

    // Detectar el método de pago basado en la referencia o rawQrData
    const paymentMethod = detectPaymentMethod(referencia, rawQrData);

    navigation.navigate("ValorationScreen", {
      parking: "Ocelon Estacionamiento",
      spot: "A-15",
      amount: monto || 0,
      time: "00:15:00",
      paymentMethod: paymentMethod,
      referencia: referencia,
    });
  };

  const CARD_RADIUS = hs(20);

  return (
    <View style={s.container}>
      {/* Logo de fondo transparente */}
      <Image
        source={require('../../assets/images/Logo_ocelon.jpg')}
        style={[s.backgroundLogo, {
          width: width * 0.8,
          height: width * 0.8,
        }]}
        resizeMode="contain"
      />

      {/* Header con ícono de éxito */}
      <View style={[s.header, { paddingTop: insets.top + vs(20) }]}>
        <View style={s.successIconContainer}>
          <Ionicons name="checkmark-circle" size={ms(32)} color="#42b883" />
        </View>
        <Text style={[s.headerTitle, { fontSize: ms(24) }]}>¡Pago Confirmado!</Text>
        <Text style={[s.headerSubtitle, { fontSize: ms(14) }]}>
          Muestra este código en la salida
        </Text>
      </View>

      {/* Card principal con QR */}
      <BlurView intensity={40} tint="dark" style={[s.mainCard, { borderRadius: CARD_RADIUS }]}>
        {/* Información del pago */}
        {monto !== undefined && (
          <View style={s.paymentInfo}>
            <View style={s.paymentRow}>
              <Text style={s.paymentLabel}>Monto pagado</Text>
              <Text style={s.paymentValue}>${montoInMXN.toFixed(2)} MXN</Text>
            </View>
            {referencia && (
              <View style={s.paymentRow}>
                <Text style={s.paymentLabel}>Referencia</Text>
                <Text style={s.paymentRef}>{referencia.slice(-12)}</Text>
              </View>
            )}
          </View>
        )}

        {/* QR Code */}
        <View style={s.qrSection}>
          <View style={[s.qrWrapper, { borderRadius: hs(16) }]}>
            <View style={s.qrInner}>
              <QRCode
                value={rawQrData || 'ocelon-exit'}
                size={hs(180)}
                backgroundColor="#fff"
                color="#0b0b0c"
              />
            </View>
          </View>

          {/* Indicador de escaneo */}
          <View style={s.scanHint}>
            <Ionicons name="scan-outline" size={ms(16)} color="#9aa0a6" />
            <Text style={s.scanHintText}>Escanea en la barrera de salida</Text>
          </View>
        </View>

        {/* Temporizador */}
        <View style={[s.timerSection, { backgroundColor: getTimerBgColor(seconds) }]}>
          <View style={[s.timerCircle, { borderColor: getTimerColor(seconds) }]}>
            <Text style={[s.timerText, { color: getTimerColor(seconds), fontSize: ms(36) }]}>
              {seconds}
            </Text>
            <Text style={[s.timerUnit, { color: getTimerColor(seconds) }]}>seg</Text>
          </View>

          <View style={s.timerInfo}>
            <View style={s.timerMessageRow}>
              <Ionicons
                name={getTimerIcon(seconds)}
                size={ms(20)}
                color={getTimerColor(seconds)}
              />
              <Text style={[s.timerMessage, { color: getTimerColor(seconds) }]}>
                {getTimerMessage(seconds)}
              </Text>
            </View>
            <Text style={s.timerHint}>
              El código expirará cuando el tiempo termine
            </Text>
          </View>
        </View>
      </BlurView>

      {/* Barra de progreso visual */}
      <View style={s.progressContainer}>
        <View style={s.progressBg}>
          <View
            style={[
              s.progressFill,
              {
                width: `${(seconds / TOTAL_SECONDS) * 100}%`,
                backgroundColor: getTimerColor(seconds)
              }
            ]}
          />
        </View>
      </View>

      {/* Botón de simulación (Debug) */}
      <TouchableOpacity
        style={[s.simulateBtn, { borderRadius: CARD_RADIUS }]}
        onPress={simulateQrScanned}
        activeOpacity={0.8}
      >
        <Ionicons name="qr-code" size={ms(20)} color="#0b0b0c" />
        <Text style={[s.simulateBtnText, { fontSize: ms(16) }]}>
          Simular QR Escaneado
        </Text>
      </TouchableOpacity>

      {/* Nota de ayuda */}
      <View style={s.helpNote}>
        <Ionicons name="information-circle-outline" size={ms(16)} color="#9aa0a6" />
        <Text style={s.helpNoteText}>
          Si tienes problemas, contacta al personal del estacionamiento
        </Text>
      </View>

      {/* Footer */}
      <Text style={[s.footer, { fontSize: ms(11), marginBottom: insets.bottom + vs(16) }]}>
        © {new Date().getFullYear()} Ocelon — Estacionamiento Inteligente
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0c',
    alignItems: 'center',
  },
  backgroundLogo: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [
      { translateX: -150 },
      { translateY: -150 }
    ],
    opacity: 0.05,
    zIndex: 0,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  successIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(66, 184, 131, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(66, 184, 131, 0.3)',
  },
  headerTitle: {
    color: '#42b883',
    fontWeight: '800',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: '#9aa0a6',
    textAlign: 'center',
    marginTop: 6,
  },

  // Main Card
  mainCard: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'rgba(20, 20, 25, 0.8)',
    borderWidth: 1,
    borderColor: '#202028',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 8 } },
      android: { elevation: 8 },
    }),
  },

  // Payment Info
  paymentInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#202028',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  paymentLabel: {
    color: '#9aa0a6',
    fontSize: 13,
  },
  paymentValue: {
    color: '#42b883',
    fontSize: 16,
    fontWeight: '700',
  },
  paymentRef: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // QR Section
  qrSection: {
    alignItems: 'center',
    padding: 20,
  },
  qrWrapper: {
    padding: 4,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: { shadowColor: '#42b883', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 },
    }),
  },
  qrInner: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  scanHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  scanHintText: {
    color: '#9aa0a6',
    fontSize: 12,
  },

  // Timer Section
  timerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#202028',
  },
  timerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  timerText: {
    fontWeight: '800',
    lineHeight: 38,
  },
  timerUnit: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: -4,
  },
  timerInfo: {
    flex: 1,
  },
  timerMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  timerMessage: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  timerHint: {
    color: '#9aa0a6',
    fontSize: 11,
  },

  // Progress Bar
  progressContainer: {
    width: '90%',
    maxWidth: 400,
    marginTop: 16,
  },
  progressBg: {
    height: 6,
    backgroundColor: '#202028',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Simulate Button
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#42b883',
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 24,
    ...Platform.select({
      ios: { shadowColor: '#42b883', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 5 },
    }),
  },
  simulateBtnText: {
    color: '#0b0b0c',
    fontWeight: '800',
  },

  // Help Note
  helpNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 20,
  },
  helpNoteText: {
    color: '#9aa0a6',
    fontSize: 12,
    textAlign: 'center',
  },

  // Footer
  footer: {
    color: '#85859a',
    textAlign: 'center',
    marginTop: 'auto',
  },
});