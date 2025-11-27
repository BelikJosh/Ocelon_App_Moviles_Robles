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
};

export default function PayModal({ visible, total, rawQrData, onClose, navigation }: PayModalProps) {
  const { usuario, esInvitado, loading } = useAuthState();

  // Solo mostrar modal si el usuario está logueado y no es invitado
  const shouldShowModal = !loading && usuario && !esInvitado;

  if (!shouldShowModal) return null;

  return (
    <Modal isVisible={visible} onBackdropPress={onClose}>
      <View style={styles.modal}>
        <Text style={styles.title}>Selecciona un método de pago</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            //stopTimer();
            onClose();
            navigation.navigate("DigitalPayment", { monto: total, rawQrData });
          }}
        >
          <Text style={styles.buttonText}>Pago Digital</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            //stopTimer();
            onClose();
            navigation.navigate("CashPayment", { monto: total, rawQrData });
          }}
        >
          <Text style={styles.buttonText}>Pago en Cajero</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#121215", borderWidth: 1, borderColor: "#42b883" }]}
          onPress={() => {
            onClose();
            // @ts-ignore
            navigation.navigate("AppTabs", {
              screen: "Wallet",
              params: {
                qr: {
                  amount: total.toString(),
                  raw: rawQrData,
                  scheme: 'openpayment'
                }
              }
            });
          }}
        >
          <Text style={[styles.buttonText, { color: "#42b883" }]}>Pago con OpenPayments</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: "#0b0b0c",
    padding: 20,
    borderRadius: 10
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15
  },
  button: {
    backgroundColor: "#42b883",
    padding: 15,
    borderRadius: 10,
    marginTop: 10
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16
  }
});
