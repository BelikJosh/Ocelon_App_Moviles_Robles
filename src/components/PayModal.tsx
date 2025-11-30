// components/PayModal.tsx
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Modal from "react-native-modal";
import { RootStackParamList } from "../navegation/types/navigation";
import { useConfig } from '../contexts/ConfigContext'; // Importa el hook

export type PayModalProps = {
  visible: boolean;
  total: number;
  rawQrData: string;
  onClose: () => void;
  navigation: NativeStackNavigationProp<RootStackParamList>;
  onOpenPaymentsPress: () => void;
};

export default function PayModal({
  visible,
  total,
  rawQrData,
  onClose,
  navigation,
  onOpenPaymentsPress
}: PayModalProps) {
  const { t, isDark } = useConfig(); // Usa el hook de configuración

  // Colores dinámicos según el tema
  const colors = {
    background: isDark ? '#1a1a1a' : '#ffffff',
    card: isDark ? '#2a2a2a' : '#f8f9fa',
    text: isDark ? '#ffffff' : '#000000',
    textSecondary: isDark ? '#b0b0b0' : '#666666',
    border: isDark ? '#333333' : '#e0e0e0',
    primary: '#42b883',
    warning: '#ffaa00',
    success: '#42b883',
  };

  const handleDigitalPayment = () => {
    console.log('🔵 Navegando a DigitalPayment');
    onClose();
    // Pequeño delay para asegurar que el modal se cierre antes de navegar
    setTimeout(() => {
      navigation.navigate("DigitalPayment", { monto: total, rawQrData });
    }, 100);
  };

  const handleCashPayment = () => {
    console.log('🟠 Navegando a CashPayment');
    onClose();
    setTimeout(() => {
      navigation.navigate("CashPayment", { monto: total, rawQrData });
    }, 100);
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropOpacity={0.7}
    >
      <View style={[styles.modal, { 
        backgroundColor: colors.background,
        borderColor: colors.border 
      }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('selectPaymentMethod')}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.buttonsContainer}>
          {/* Pago Electrónico / Digital */}
          <TouchableOpacity
            style={[styles.button, styles.electronicButton, { 
              backgroundColor: colors.card,
              borderColor: colors.primary 
            }]}
            onPress={handleDigitalPayment}
          >
            <Ionicons name="card-outline" size={24} color={colors.primary} />
            <Text style={[styles.buttonText, { color: colors.text }]}>
              {t('electronicPayment')}
            </Text>
            <Text style={[styles.buttonSubtext, { color: colors.textSecondary }]}>
              {t('electronicPaymentSubtext')}
            </Text>
          </TouchableOpacity>

          {/* Pago en Efectivo */}
          <TouchableOpacity
            style={[styles.button, styles.cashButton, { 
              backgroundColor: colors.card,
              borderColor: colors.warning 
            }]}
            onPress={handleCashPayment}
          >
            <Ionicons name="cash-outline" size={24} color={colors.warning} />
            <Text style={[styles.buttonText, { color: colors.text }]}>
              {t('cashPayment')}
            </Text>
            <Text style={[styles.buttonSubtext, { color: colors.textSecondary }]}>
              {t('cashPaymentSubtext')}
            </Text>
          </TouchableOpacity>

          {/* Open Payments */}
          <TouchableOpacity
            style={[styles.button, styles.openPaymentsButton, { 
              backgroundColor: 'transparent',
              borderColor: colors.primary 
            }]}
            onPress={onOpenPaymentsPress}
          >
            <Ionicons name="flash-outline" size={24} color={colors.primary} />
            <Text style={[styles.buttonText, { color: colors.primary }]}>
              {t('openPayments')}
            </Text>
            <Text style={[styles.buttonSubtext, { color: colors.primary }]}>
              {t('openPaymentsSubtext')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
  },
  closeIcon: {
    padding: 4,
  },
  buttonsContainer: {
    gap: 12,
  },
  button: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  electronicButton: {
    backgroundColor: "#2a2a2a",
    borderColor: "#42b883",
  },
  cashButton: {
    backgroundColor: "#2a2a2a",
    borderColor: "#ffaa00",
  },
  openPaymentsButton: {
    backgroundColor: "transparent",
    borderColor: "#42b883",
  },
  buttonText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  buttonSubtext: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 4,
  }
});