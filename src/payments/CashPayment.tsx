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
import { useConfig } from '../contexts/ConfigContext';
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
  const { t, isDark } = useConfig();

  // Escalas responsivas
  const { width, height } = useWindowDimensions();
  const hs = (size: number) => (width / BASE_W) * size;
  const vs = (size: number) => (height / BASE_H) * size;
  const ms = (size: number, factor = 0.5) => size + (hs(size) - size) * factor;

  const referencia = `ocelon_cash_${Date.now()}`;
  const [total, setTotal] = useState(getTimer().cost);

  // Colores dinámicos
  const colors = {
    background: isDark ? '#0b0b0c' : '#f8f9fa',
    cardBackground: isDark ? '#131318' : '#ffffff',
    cardSecondary: isDark ? '#151518' : '#f8f9fa',
    text: isDark ? '#ffffff' : '#000000',
    textSecondary: isDark ? '#9aa0a6' : '#666666',
    border: isDark ? '#202028' : '#e0e0e0',
    primary: '#42b883',
    warning: '#ffaa00',
    success: '#42b883',
    methodBadge: '#ffaa00',
    backButtonBg: isDark ? 'rgba(66, 184, 131, 0.15)' : 'rgba(66, 184, 131, 0.1)',
    backButtonBorder: isDark ? 'rgba(66, 184, 131, 0.3)' : 'rgba(66, 184, 131, 0.2)',
    warningBg: isDark ? 'rgba(255, 170, 0, 0.1)' : 'rgba(255, 170, 0, 0.15)',
    warningBorder: isDark ? 'rgba(255, 170, 0, 0.3)' : 'rgba(255, 170, 0, 0.4)',
    scanBg: isDark ? 'rgba(66, 184, 131, 0.1)' : 'rgba(66, 184, 131, 0.15)',
    scanBorder: isDark ? 'rgba(66, 184, 131, 0.3)' : 'rgba(66, 184, 131, 0.4)',
  };

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
    { step: 1, text: t('cashInstruction1'), icon: "walk" },
    { step: 2, text: t('cashInstruction2'), icon: "apps" },
    { step: 3, text: t('cashInstruction3'), icon: "qr-code" },
    { step: 4, text: t('cashInstruction4'), icon: "cash" },
    { step: 5, text: t('cashInstruction5'), icon: "checkmark-circle" },
  ];

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Logo de fondo transparente */}
      <Image
        source={require('../../assets/images/Logo_ocelon.jpg')}
        style={[s.backgroundLogo, {
          width: width * 0.8,
          height: width * 0.8,
          opacity: isDark ? 0.05 : 0.03,
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
              style={[s.backButton, { 
                backgroundColor: colors.backButtonBg,
                borderColor: colors.backButtonBorder 
              }]}
              onPress={handleGoBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={26} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[s.headerTitle, { fontSize: ms(18), color: colors.text }]}>
              {t('cashPayment')}
            </Text>
            <View style={s.headerPlaceholder} />
          </View>

          {/* Badge de método de pago */}
          <View style={[s.methodBadge, { backgroundColor: colors.methodBadge }]}>
            <Ionicons name="cash" size={ms(16)} color="#0b0b0c" />
            <Text style={s.methodBadgeText}>{t('authorizedCashier')}</Text>
          </View>

          {/* Card del monto total */}
          <View style={[s.amountCard, { 
            borderRadius: CARD_RADIUS, 
            padding: hs(20), 
            marginTop: vs(16),
            backgroundColor: colors.cardBackground,
            borderColor: colors.border
          }]}>
            <View style={s.amountHeader}>
              <View style={[s.amountIconContainer, { backgroundColor: 'rgba(255, 170, 0, 0.15)' }]}>
                <Ionicons name="receipt" size={ms(24)} color={colors.warning} />
              </View>
              <Text style={[s.amountLabel, { color: colors.textSecondary }]}>
                {t('totalToPay')}
              </Text>
            </View>
            <Text style={[s.amountValue, { fontSize: ms(42), color: colors.warning }]}>
              ${totalInMXN.toFixed(2)}
            </Text>
            <Text style={[s.amountCurrency, { color: colors.warning }]}>MXN</Text>

            {/* Referencia */}
            <View style={[s.referenceContainer, { borderTopColor: colors.border }]}>
              <Text style={[s.referenceLabel, { color: colors.textSecondary }]}>
                {t('paymentReference')}:
              </Text>
              <Text style={[s.referenceValue, { color: colors.text }]}>
                {referencia.slice(-12)}
              </Text>
            </View>
          </View>

          {/* Código QR */}
          <View style={[s.qrCard, { 
            borderRadius: CARD_RADIUS, 
            padding: hs(20), 
            marginTop: vs(20),
            backgroundColor: colors.cardBackground,
            borderColor: colors.border
          }]}>
            <Text style={[s.qrTitle, { color: colors.text }]}>
              {t('qrForCashier')}
            </Text>
            <Text style={[s.qrSubtitle, { color: colors.textSecondary }]}>
              {t('showAtCashier')}
            </Text>

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
            <View style={[s.scanIndicator, { 
              backgroundColor: colors.scanBg,
              borderColor: colors.scanBorder
            }]}>
              <Ionicons name="scan-outline" size={ms(18)} color={colors.primary} />
              <Text style={[s.scanText, { color: colors.primary }]}>
                {t('scanAtCashier')}
              </Text>
            </View>
          </View>

          {/* Instrucciones */}
          <View style={[s.instructionsCard, { 
            borderRadius: CARD_RADIUS, 
            padding: hs(20), 
            marginTop: vs(20),
            backgroundColor: colors.cardSecondary,
            borderColor: colors.border
          }]}>
            <View style={s.instructionsHeader}>
              <Ionicons name="list" size={ms(20)} color={colors.primary} />
              <Text style={[s.instructionsTitle, { color: colors.text }]}>
                {t('instructions')}
              </Text>
            </View>

            {instructions.map((item, index) => (
              <View
                key={item.step}
                style={[
                  s.instructionRow,
                  index !== instructions.length - 1 && [s.instructionRowBorder, { borderBottomColor: colors.border }]
                ]}
              >
                <View style={s.instructionStep}>
                  <Text style={s.instructionStepText}>{item.step}</Text>
                </View>
                <View style={s.instructionContent}>
                  <Ionicons name={item.icon as any} size={ms(18)} color={colors.textSecondary} />
                  <Text style={[s.instructionText, { color: colors.text }]}>{item.text}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Información importante */}
          <View style={[s.warningCard, { 
            borderRadius: CARD_RADIUS, 
            padding: hs(16), 
            marginTop: vs(16),
            backgroundColor: colors.warningBg,
            borderColor: colors.warningBorder
          }]}>
            <View style={s.warningHeader}>
              <Ionicons name="information-circle" size={ms(20)} color={colors.warning} />
              <Text style={[s.warningTitle, { color: colors.warning }]}>
                {t('important')}
              </Text>
            </View>
            <Text style={[s.warningText, { color: colors.text }]}>
              {t('cashPaymentWarning')}
            </Text>
          </View>

          {/* Botón principal */}
          <TouchableOpacity
            style={[s.primaryBtn, { 
              borderRadius: CARD_RADIUS, 
              paddingVertical: vs(16), 
              marginTop: vs(24),
              backgroundColor: colors.primary
            }]}
            onPress={handleConfirm}
          >
            <Ionicons name="checkmark-done" size={ms(20)} color="#0b0b0c" />
            <Text style={[s.primaryBtnText, { fontSize: ms(16) }]}>
              {t('paidAtCashier')}
            </Text>
          </TouchableOpacity>

          {/* Botón secundario - Cambiar método */}
          <TouchableOpacity
            style={[s.secondaryBtn, { 
              borderRadius: CARD_RADIUS, 
              paddingVertical: vs(14), 
              marginTop: vs(12),
              borderColor: colors.border
            }]}
            onPress={handleGoBack}
          >
            <Ionicons name="swap-horizontal" size={ms(18)} color={colors.primary} />
            <Text style={[s.secondaryBtnText, { color: colors.primary }]}>
              {t('changePaymentMethod')}
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={[s.footer, { 
            fontSize: ms(11), 
            marginTop: vs(24), 
            color: colors.textSecondary 
          }]}>
            © {new Date().getFullYear()} Ocelon — {t('smartParking')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundLogo: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [
      { translateX: -150 },
      { translateY: -150 }
    ],
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
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: {
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
    alignItems: 'center',
    borderWidth: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  amountValue: {
    fontWeight: '900',
  },
  amountCurrency: {
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
  },
  referenceLabel: {
    fontSize: 12,
  },
  referenceValue: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // QR Card
  qrCard: {
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 },
    }),
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  qrSubtitle: {
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
    borderRadius: 20,
    borderWidth: 1,
  },
  scanText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Instructions Card
  instructionsCard: {
    width: '100%',
    borderWidth: 1,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  instructionsTitle: {
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
    fontSize: 14,
    flex: 1,
  },

  // Warning Card
  warningCard: {
    width: '100%',
    borderWidth: 1,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  warningText: {
    fontSize: 13,
    lineHeight: 20,
  },

  // Primary Button
  primaryBtn: {
    width: '100%',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },

  // Footer
  footer: {
    textAlign: 'center',
  },
});