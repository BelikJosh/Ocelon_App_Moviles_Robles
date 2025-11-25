import { Ionicons } from "@expo/vector-icons";
import { RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { RootStackParamList } from "../navegation/types/navigation";
import { getTimer, onTimerChange, stopTimer } from "../utils/TimerStore";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "CashPayment">;
  route: RouteProp<RootStackParamList, "CashPayment">;
};

export default function CashPayment({ navigation, route }: Props) {
  const { rawQrData } = route.params;

  const { width } = useWindowDimensions();
  const hs = (v: number) => (width / 375) * v;

  const referencia = `ocelon_cash_${Date.now()}`;

  const [total, setTotal] = useState(getTimer().cost);

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
    monto: total,
    referencia,
    rawQrData: rawQrData || null,
  });

  const handleConfirm = () => {
    stopTimer();
    navigation.navigate("ExitScreen", {
      rawQrData,
      referencia,
      monto: total,
    });
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <Text style={[styles.title, { fontSize: hs(28) }]}>Pago en Cajero</Text>
      <Text style={[styles.amount, { fontSize: hs(32) }]}>${total}.00 MXN</Text>

      {/* INSTRUCCIONES */}
      <View style={[styles.instructionsBox, { padding: hs(20) }]}>
        <Ionicons name="cash-outline" size={hs(50)} color="#42b883" />
        <Text style={[styles.instructionsTitle, { fontSize: hs(20) }]}>
          Instrucciones
        </Text>

        <Text style={[styles.instructionsText, { fontSize: hs(14), lineHeight: hs(20) }]}>
          1. Dirígete a un cajero autorizado.{"\n"}
          2. Selecciona "Pago de Servicios".{"\n"}
          3. Escanea este código QR.{"\n"}
          4. Deposita el monto exacto.{"\n"}
          5. Confirma la operación.
        </Text>
      </View>

      {/* QR */}
      <View style={styles.qrWrapper}>
        <View style={[styles.qrBox, { padding: hs(16), borderRadius: hs(12) }]}>
          <QRCode value={qrPayload} size={hs(220)} />
        </View>
      </View>

      {/* BOTÓN */}
      <TouchableOpacity style={styles.button} onPress={handleConfirm}>
        <Text style={styles.buttonText}>He pagado en cajero</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    padding: 20,
  },

  title: {
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 10,
  },

  amount: {
    color: "#42b883",
    fontWeight: "bold",
    marginBottom: 30,
  },

  instructionsBox: {
    backgroundColor: "#151515",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 25,
  },

  instructionsTitle: {
    color: "#fff",
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 10,
  },

  instructionsText: {
    color: "#ccc",
  },

  qrWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 35,
  },

  qrBox: {
    backgroundColor: "#151515",
    borderWidth: 1,
    borderColor: "#222",
  },

  button: {
    backgroundColor: "#42b883",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#0d0d0d",
    fontSize: 18,
    fontWeight: "bold",
  },
});
