// screens/CashPayment.tsx
// Pantalla de pago en efectivo con QR para cajero
import { Ionicons } from "@expo/vector-icons";
import { RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from "../navegation/types/navigation";
import { getTimer, onTimerChange, stopTimer } from "../utils/TimerStore";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "CashPayment">;
  route: RouteProp<RootStackParamList, "CashPayment">;
};

// Constantes de diseño
const BASE_W = 375;
const BASE_H = 812;

// Tipo de cambio USD a MXN (aproximado)
const USD_TO_MXN = 17.5;

export default function CashPayment({ navigation, route }: Props) {
  const { rawQrData } = route.params;
  const insets = useSafeAreaInsets();

  // Escalas responsivas
  const { width, height } = useWindowDimensions();
  const hs = (size: number) => (width / BASE_W) * size;
  const vs = (size: number) => (height / BASE_H) * size;
  const ms = (size: number, factor = 0.5) => size + (hs(size) - size) * factor;

  const referencia = `ocelon_cash_${Date.now()}`;
  const [total, setTotal] = useState(getTimer().cost);

  // Convertir USD a MXN
  const totalInMXN = total * USD_TO_MXN;

  // Suscribirse a cambios del timer para actualizar el total
  useEffect(() => {
    const unsub = onTimerChange(() => {
      const storeData = getTimer();
      setTotal(storeData.cost);
    });
    return unsub;
  }, []);

  const qrPayload = JSON.stringify({
    tipo: "cajero",
    monto: totalInMXN,
    referencia,
    rawQrData: rawQrData || null,
  });

  const handleGoBack = () => {
    navigation.navigate("Timer", { rawQrData });
  };

  const handleConfirm = () => {
    stopTimer();
    navigation.navigate("ExitScreen", {
      rawQrData,
      referencia,
      monto: total,
    });
  };

  const PADDING = hs(20);
  const CARD_RADIUS = hs(16);
  const MAX_W = 600;

  // Instrucciones del pago
  const instructions = [
    { step: 1, text: "Dirígete a un cajero autorizado", icon: "walk" },
    { step: 2, text: "Selecciona \"Pago de Servicios\"", icon: "apps" },
    { step: 3, text: "Escanea este código QR", icon: "qr-code" },
    { step: 4, text: "Deposita el monto exacto", icon: "cash" },
    { step: 5, text: "Confirma la operación", icon: "checkmark-circle" },
  ];

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

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          paddingHorizontal: PADDING,
          paddingTop: insets.top + vs(16),
          paddingBottom: vs(40),
        }}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={{ width: '100%', maxWidth: MAX_W }}>

          {/* Header con botón de regreso */}
          <View style={[s.header, { marginBottom: vs(24), paddingVertical: vs(8) }]}>
            <TouchableOpacity
              style={s.backButton}
              onPress={handleGoBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={26} color="#42b883" />
            </TouchableOpacity>
            <Text style={[s.headerTitle, { fontSize: ms(18) }]}>
              Pago en Efectivo
            </Text>
            <View style={s.headerPlaceholder} />
          </View>

          {/* Badge de método de pago */}
          <View style={s.methodBadge}>
            <Ionicons name="cash" size={ms(16)} color="#0b0b0c" />
            <Text style={s.methodBadgeText}>Cajero Autorizado</Text>
          </View>

          {/* Card del monto total */}
          <View style={[s.amountCard, { borderRadius: CARD_RADIUS, padding: hs(20), marginTop: vs(16) }]}>
            <View style={s.amountHeader}>
              <View style={s.amountIconContainer}>
                <Ionicons name="receipt" size={ms(24)} color="#ffaa00" />
              </View>
              <Text style={s.amountLabel}>Total a Pagar</Text>
            </View>
            <Text style={[s.amountValue, { fontSize: ms(42) }]}>
              ${totalInMXN.toFixed(2)}
            </Text>
            <Text style={s.amountCurrency}>MXN</Text>

            {/* Referencia */}
            <View style={s.referenceContainer}>
              <Text style={s.referenceLabel}>Referencia de pago:</Text>
              <Text style={s.referenceValue}>{referencia.slice(-12)}</Text>
            </View>
          </View>

          {/* Código QR */}
          <View style={[s.qrCard, { borderRadius: CARD_RADIUS, padding: hs(20), marginTop: vs(20) }]}>
            <Text style={s.qrTitle}>Código QR para Cajero</Text>
            <Text style={s.qrSubtitle}>Muestra este código en el cajero autorizado</Text>

            <View style={s.qrWrapper}>
              <View style={[s.qrBox, { borderRadius: hs(16) }]}>
                <QRCode
                  value={qrPayload}
                  size={hs(200)}
                  backgroundColor="#fff"
                  color="#0b0b0c"
                />
              </View>
            </View>

            {/* Indicador de escaneo */}
            <View style={s.scanIndicator}>
              <Ionicons name="scan-outline" size={ms(18)} color="#42b883" />
              <Text style={s.scanText}>Escanea en el cajero</Text>
            </View>
          </View>

          {/* Instrucciones */}
          <View style={[s.instructionsCard, { borderRadius: CARD_RADIUS, padding: hs(20), marginTop: vs(20) }]}>
            <View style={s.instructionsHeader}>
              <Ionicons name="list" size={ms(20)} color="#42b883" />
              <Text style={s.instructionsTitle}>Instrucciones</Text>
            </View>

            {instructions.map((item, index) => (
              <View
                key={item.step}
                style={[
                  s.instructionRow,
                  index !== instructions.length - 1 && s.instructionRowBorder
                ]}
              >
                <View style={s.instructionStep}>
                  <Text style={s.instructionStepText}>{item.step}</Text>
                </View>
                <View style={s.instructionContent}>
                  <Ionicons name={item.icon as any} size={ms(18)} color="#9aa0a6" />
                  <Text style={s.instructionText}>{item.text}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Información importante */}
          <View style={[s.warningCard, { borderRadius: CARD_RADIUS, padding: hs(16), marginTop: vs(16) }]}>
            <View style={s.warningHeader}>
              <Ionicons name="information-circle" size={ms(20)} color="#ffaa00" />
              <Text style={s.warningTitle}>Importante</Text>
            </View>
            <Text style={s.warningText}>
              El pago debe realizarse por el monto exacto. Conserva tu comprobante hasta salir del estacionamiento.
            </Text>
          </View>

          {/* Botón principal */}
          <TouchableOpacity
            style={[s.primaryBtn, { borderRadius: CARD_RADIUS, paddingVertical: vs(16), marginTop: vs(24) }]}
            onPress={handleConfirm}
          >
            <Ionicons name="checkmark-done" size={ms(20)} color="#0b0b0c" />
            <Text style={[s.primaryBtnText, { fontSize: ms(16) }]}>
              He pagado en cajero
            </Text>
          </TouchableOpacity>

          {/* Botón secundario - Cambiar método */}
          <TouchableOpacity
            style={[s.secondaryBtn, { borderRadius: CARD_RADIUS, paddingVertical: vs(14), marginTop: vs(12) }]}
            onPress={handleGoBack}
          >
            <Ionicons name="swap-horizontal" size={ms(18)} color="#42b883" />
            <Text style={s.secondaryBtnText}>Cambiar método de pago</Text>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={[s.footer, { fontSize: ms(11), marginTop: vs(24) }]}>
            © {new Date().getFullYear()} Ocelon — Estacionamiento Inteligente
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0c',
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
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(66, 184, 131, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(66, 184, 131, 0.3)',
  },
  headerTitle: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  headerPlaceholder: {
    width: 46,
  },

  // Method Badge
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    backgroundColor: '#ffaa00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  methodBadgeText: {
    color: '#0b0b0c',
    fontWeight: '800',
    fontSize: 14,
  },

  // Amount Card
  amountCard: {
    width: '100%',
    backgroundColor: '#131318',
    borderWidth: 1,
    borderColor: '#202028',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 5 },
    }),
  },
  amountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  amountIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 170, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountLabel: {
    color: '#9f9faf',
    fontSize: 14,
    fontWeight: '500',
  },
  amountValue: {
    color: '#ffaa00',
    fontWeight: '900',
  },
  amountCurrency: {
    color: '#ffaa00',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  referenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#202028',
  },
  referenceLabel: {
    color: '#9aa0a6',
    fontSize: 12,
  },
  referenceValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // QR Card
  qrCard: {
    width: '100%',
    backgroundColor: '#131318',
    borderWidth: 1,
    borderColor: '#202028',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 },
    }),
  },
  qrTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  qrSubtitle: {
    color: '#9aa0a6',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  qrWrapper: {
    padding: 4,
    backgroundColor: '#fff',
    borderRadius: 20,
  },
  qrBox: {
    padding: 16,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  scanIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(66, 184, 131, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(66, 184, 131, 0.3)',
  },
  scanText: {
    color: '#42b883',
    fontSize: 13,
    fontWeight: '600',
  },

  // Instructions Card
  instructionsCard: {
    width: '100%',
    backgroundColor: '#151518',
    borderWidth: 1,
    borderColor: '#202028',
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  instructionsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  instructionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#202028',
  },
  instructionStep: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(66, 184, 131, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionStepText: {
    color: '#42b883',
    fontSize: 14,
    fontWeight: '700',
  },
  instructionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  instructionText: {
    color: '#e0e0e0',
    fontSize: 14,
    flex: 1,
  },

  // Warning Card
  warningCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 170, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 170, 0, 0.3)',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  warningTitle: {
    color: '#ffaa00',
    fontSize: 14,
    fontWeight: '700',
  },
  warningText: {
    color: '#e0e0e0',
    fontSize: 13,
    lineHeight: 20,
  },

  // Primary Button
  primaryBtn: {
    width: '100%',
    backgroundColor: '#42b883',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...Platform.select({
      ios: { shadowColor: '#42b883', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 5 },
    }),
  },
  primaryBtnText: {
    color: '#0b0b0c',
    fontWeight: '800',
  },

  // Secondary Button
  secondaryBtn: {
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3a3a42',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryBtnText: {
    color: '#42b883',
    fontWeight: '600',
    fontSize: 14,
  },

  // Footer
  footer: {
    color: '#85859a',
    textAlign: 'center',
  },
});