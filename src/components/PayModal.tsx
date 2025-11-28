// components/PayModal.tsx
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Modal from "react-native-modal";
import { useAuthState } from "../hooks/useAuthState";
import { RootStackParamList } from "../navegation/types/navigation";

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
  const { usuario, esInvitado, loading } = useAuthState();

  // Solo mostrar modal si el usuario está logueado y no es invitado
  const shouldShowModal = !loading && usuario && !esInvitado;

  if (!shouldShowModal) return null;

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropOpacity={0.7}
    >
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.title}>Selecciona un método de pago</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.electronicButton]}
            onPress={() => {
              onClose();
              navigation.navigate("DigitalPayment", { monto: total, rawQrData });
            }}
          >
            <Ionicons name="card-outline" size={24} color="#fff" />
            <Text style={styles.buttonText}>Pago Electrónico</Text>
            <Text style={styles.buttonSubtext}>Tarjetas, Apple Pay, PayPal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.cashButton]}
            onPress={() => {
              onClose();
              navigation.navigate("CashPayment", { monto: total, rawQrData });
            }}
          >
            <Ionicons name="cash-outline" size={24} color="#fff" />
            <Text style={styles.buttonText}>Pago en Efectivo</Text>
            <Text style={styles.buttonSubtext}>Cajeros autorizados</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.openPaymentsButton]}
            onPress={onOpenPaymentsPress}
          >
            <Ionicons name="flash-outline" size={24} color="#42b883" />
            <Text style={[styles.buttonText, { color: "#42b883" }]}>Open Payments</Text>
            <Text style={[styles.buttonSubtext, { color: "#42b883" }]}>Pago instantáneo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: "#1a1a1a",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: "#fff",
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
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  buttonSubtext: {
    color: "#b0b0b0",
    textAlign: "center",
    fontSize: 12,
    marginTop: 4,
  }
});