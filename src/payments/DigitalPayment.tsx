import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useAuthState } from "../hooks/useAuthState";
import { RootStackParamList } from "../navegation/types/navigation";
import { getTimer, onTimerChange, stopTimer } from "../utils/TimerStore";

type Card = { id: string; brand: string; last4: string; type: "credit" | "debit" };

export default function DigitalPayment() {
  const route = useRoute<RouteProp<RootStackParamList, "DigitalPayment">>();
  const navigation = useNavigation<any>();
  const { usuario } = useAuthState();
  const initialMonto = route.params?.monto ?? 0;

  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState("");
  const [newCardBrand, setNewCardBrand] = useState("");
  const [total, setTotal] = useState(initialMonto);

  // Actualiza monto dinámicamente desde TimerStore
  useEffect(() => {
    const unsub = onTimerChange(() => {
      const store = getTimer();
      setTotal(store.cost);
    });
    return unsub;
  }, []);

  // Tarjetas simuladas por usuario
  useEffect(() => {
    if (!usuario) return;

    const savedCards: Card[] = [
      { id: "1", brand: "Mastercard", last4: "2681", type: "credit" },
      { id: "2", brand: "BBVA", last4: "9854", type: "debit" },
    ];
    setCards(savedCards);
  }, [usuario]);

  const handleAddCard = () => {
    if (!newCardNumber || !newCardBrand)
      return Alert.alert("Error", "Complete los datos de la tarjeta");

    const newCard: Card = {
      id: Math.random().toString(),
      brand: newCardBrand,
      last4: newCardNumber.slice(-4),
      type: "credit",
    };
    setCards([...cards, newCard]);
    setShowAddModal(false);
    setNewCardNumber("");
    setNewCardBrand("");
  };

  // Función que simula pago y redirige a ExitScreen
  const handlePayment = (method: string) => {
    if (!usuario) {
      Alert.alert("Error", "Debe iniciar sesión para realizar un pago digital");
      return;
    }

    let paymentMethod = method;
    if (method === "card") {
      if (!selectedCard) return Alert.alert("Error", "Seleccione una tarjeta");
      paymentMethod = `${selectedCard.brand} •••• ${selectedCard.last4}`;
    }

    stopTimer();

    // Simula QR generado para el pago
    const rawQrData = `digital_${Date.now()}_${paymentMethod}`;

    // Redirige a ExitScreen
    navigation.navigate("ExitScreen", {
      rawQrData,
      monto: total,
      referencia: `digital_${Date.now()}`,
    });
  };

  const { width } = useWindowDimensions();
  const hs = (v: number) => (width / 375) * v;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.total, { fontSize: hs(28) }]}>Son ${total.toFixed(2)}</Text>
      </View>

      {/* Pago rápido */}
      <Text style={[styles.sectionTitle, { marginTop: hs(20) }]}>Pago rápido</Text>

      <View style={styles.card}>
        {["Apple Pay", "PayPal", "OpenPay"].map((method) => (
          <TouchableOpacity
            key={method}
            style={styles.row}
            onPress={() => handlePayment(method)}
          >
            <Text style={styles.option}>Pago con {method}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Mis tarjetas */}
      <View style={styles.rowBetween}>
        <Text style={styles.sectionTitle}>Mis tarjetas 💳</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Text style={styles.add}>Agregar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        {cards.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.row, selectedCard?.id === c.id && styles.selectedRow]}
            onPress={() => setSelectedCard(c)}
          >
            <Text style={styles.option}>
              {c.brand} •••• {c.last4}
            </Text>
          </TouchableOpacity>
        ))}
        {cards.length === 0 && (
          <Text style={{ padding: 15, color: "#ccc" }}>No tienes tarjetas guardadas</Text>
        )}
      </View>

      {/* Botón pagar con tarjeta */}
      <TouchableOpacity
        style={[styles.primaryBtn, { marginTop: 20, marginBottom: 40 }]}
        onPress={() => handlePayment("card")}
      >
        <Text style={styles.btnText}>Pagar con tarjeta seleccionada</Text>
      </TouchableOpacity>

      {/* Modal para agregar tarjeta */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalBackground}>
         <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Agregar nueva tarjeta</Text>
      <TextInput
        placeholder="Número de tarjeta"
        placeholderTextColor="#999"
        keyboardType="numeric"
        style={styles.input}
        value={newCardNumber}
        onChangeText={setNewCardNumber}
      />
      <TextInput
        placeholder="Marca (Mastercard, Visa...)"
        placeholderTextColor="#999"
        style={styles.input}
        value={newCardBrand}
        onChangeText={setNewCardBrand}
      />
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
        <TouchableOpacity onPress={() => setShowAddModal(false)}>
          <Text style={styles.cancel}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleAddCard}>
          <Text style={styles.add}>Guardar</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0d", padding: 20 },
  header: { alignItems: "center", marginTop: 10 },
  total: { color: "#42b883", fontWeight: "bold", marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  card: { backgroundColor: "#151515", padding: 10, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: "#222" },
  row: { paddingVertical: 15, borderBottomWidth: 1, borderColor: "#222" },
  selectedRow: { backgroundColor: "#42b88322" },
  option: { fontSize: 16, color: "#00e676" },
  primaryBtn: { backgroundColor: "#42b883", padding: 15, alignItems: "center", borderRadius: 12 },
  btnText: { color: "#0d0d0d", fontWeight: "700", fontSize: 16 },
  modalBackground: { flex: 1, backgroundColor: "rgba(13,13,13,0.95)", justifyContent: "center",
    padding: 20 },
  modalContent: { backgroundColor: "#0d0d0d", borderRadius: 12, padding: 20, borderWidth: 1, 
    borderColor: "#42b883" },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 15, color: "#00e676" },
  input: { borderWidth: 1, borderColor: "#42b883", borderRadius: 8, padding: 10,
   marginBottom: 10, color: "#fff", backgroundColor: "#151515" },
  add: { color: "#42b883", fontSize: 16, fontWeight: "600" },
  cancel: { color: "#ff4d4d", fontSize: 16, fontWeight: "600" },
});
