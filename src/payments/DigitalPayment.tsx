// screens/DigitalPayment.tsx
// Pantalla de pago digital con tarjetas y métodos rápidos
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthState } from "../hooks/useAuthState";
import { RootStackParamList } from "../navegation/types/navigation";
import { getTimer, onTimerChange, stopTimer } from "../utils/TimerStore";

type Card = { id: string; brand: string; last4: string; type: "credit" | "debit" };

// Constantes de diseño
const BASE_W = 375;
const BASE_H = 812;

export default function DigitalPayment() {
  const route = useRoute<RouteProp<RootStackParamList, "DigitalPayment">>();
  const navigation = useNavigation<any>();
  const { usuario } = useAuthState();
  const insets = useSafeAreaInsets();
  const initialMonto = route.params?.monto ?? 0;
  const rawQrData = route.params?.rawQrData ?? '';

  // Escalas responsivas
  const { width, height } = useWindowDimensions();
  const hs = (size: number) => (width / BASE_W) * size;
  const vs = (size: number) => (height / BASE_H) * size;
  const ms = (size: number, factor = 0.5) => size + (hs(size) - size) * factor;

  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState("");
  const [newCardBrand, setNewCardBrand] = useState("");
  const [newCardType, setNewCardType] = useState<"credit" | "debit">("credit");
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
      { id: "3", brand: "Visa", last4: "4521", type: "credit" },
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
      type: newCardType,
    };
    setCards([...cards, newCard]);
    setShowAddModal(false);
    setNewCardNumber("");
    setNewCardBrand("");
    setNewCardType("credit");
  };

  const handleGoBack = () => {
    navigation.navigate("Timer", { rawQrData });
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

    const finalQrData = rawQrData || `digital_${Date.now()}_${paymentMethod}`;

    navigation.navigate("ExitScreen", {
      rawQrData: finalQrData,
      monto: total,
      referencia: `digital_${Date.now()}`,
    });
  };

  const getCardIcon = (brand: string) => {
    const brandLower = brand.toLowerCase();
    if (brandLower.includes('visa')) return 'cc-visa';
    if (brandLower.includes('master')) return 'cc-mastercard';
    if (brandLower.includes('amex')) return 'cc-amex';
    return 'credit-card';
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'Apple Pay': return 'apple';
      case 'PayPal': return 'paypal';
      case 'Google Pay': return 'google';
      default: return 'credit-card-fast';
    }
  };

  const PADDING = hs(20);
  const CARD_RADIUS = hs(16);
  const MAX_W = 600;

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
              Pago Digital
            </Text>
            <View style={s.headerPlaceholder} />
          </View>

          {/* Card del monto total */}
          <View style={[s.amountCard, { borderRadius: CARD_RADIUS, padding: hs(20) }]}>
            <View style={s.amountHeader}>
              <View style={s.amountIconContainer}>
                <Ionicons name="card" size={ms(24)} color="#42b883" />
              </View>
              <Text style={s.amountLabel}>Total a Pagar</Text>
            </View>
            <Text style={[s.amountValue, { fontSize: ms(42) }]}>
              ${total.toFixed(2)}
            </Text>
            <Text style={s.amountCurrency}>USD</Text>
          </View>

          {/* Sección de pago rápido */}
          <View style={[s.sectionHeader, { marginTop: vs(24) }]}>
            <Ionicons name="flash" size={ms(18)} color="#42b883" />
            <Text style={[s.sectionTitle, { fontSize: ms(16) }]}>Pago Rápido</Text>
          </View>

          <View style={[s.card, { borderRadius: CARD_RADIUS, padding: hs(8) }]}>
            {["Apple Pay", "PayPal", "Google Pay"].map((method, index) => (
              <TouchableOpacity
                key={method}
                style={[
                  s.paymentRow,
                  index !== 2 && s.paymentRowBorder
                ]}
                onPress={() => handlePayment(method)}
                activeOpacity={0.7}
              >
                <View style={s.paymentRowLeft}>
                  <View style={[s.paymentIconContainer, { backgroundColor: getPaymentBgColor(method) }]}>
                    <MaterialCommunityIcons
                      name={getPaymentIcon(method) as any}
                      size={ms(22)}
                      color={getPaymentIconColor(method)}
                    />
                  </View>
                  <Text style={s.paymentOption}>{method}</Text>
                </View>
                <Ionicons name="chevron-forward" size={ms(20)} color="#42b883" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Sección de tarjetas */}
          <View style={[s.sectionHeader, { marginTop: vs(24) }]}>
            <View style={s.sectionHeaderLeft}>
              <Ionicons name="wallet" size={ms(18)} color="#42b883" />
              <Text style={[s.sectionTitle, { fontSize: ms(16) }]}>Mis Tarjetas</Text>
            </View>
            <TouchableOpacity
              style={s.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add-circle" size={ms(20)} color="#42b883" />
              <Text style={s.addButtonText}>Agregar</Text>
            </TouchableOpacity>
          </View>

          <View style={[s.card, { borderRadius: CARD_RADIUS, padding: hs(8) }]}>
            {cards.length === 0 ? (
              <View style={s.emptyCards}>
                <Ionicons name="card-outline" size={ms(40)} color="#3a3a42" />
                <Text style={s.emptyCardsText}>No tienes tarjetas guardadas</Text>
                <TouchableOpacity
                  style={s.emptyCardsButton}
                  onPress={() => setShowAddModal(true)}
                >
                  <Text style={s.emptyCardsButtonText}>Agregar tarjeta</Text>
                </TouchableOpacity>
              </View>
            ) : (
              cards.map((card, index) => (
                <TouchableOpacity
                  key={card.id}
                  style={[
                    s.cardRow,
                    index !== cards.length - 1 && s.cardRowBorder,
                    selectedCard?.id === card.id && s.cardRowSelected
                  ]}
                  onPress={() => setSelectedCard(card)}
                  activeOpacity={0.7}
                >
                  <View style={s.cardRowLeft}>
                    <View style={[
                      s.cardIconContainer,
                      selectedCard?.id === card.id && s.cardIconSelected
                    ]}>
                      <MaterialCommunityIcons
                        name={getCardIcon(card.brand) as any}
                        size={ms(24)}
                        color={selectedCard?.id === card.id ? "#42b883" : "#9aa0a6"}
                      />
                    </View>
                    <View>
                      <Text style={[
                        s.cardBrand,
                        selectedCard?.id === card.id && s.cardBrandSelected
                      ]}>
                        {card.brand}
                      </Text>
                      <Text style={s.cardNumber}>•••• •••• •••• {card.last4}</Text>
                    </View>
                  </View>
                  <View style={s.cardRowRight}>
                    <View style={[
                      s.cardTypeBadge,
                      card.type === 'debit' && s.cardTypeBadgeDebit
                    ]}>
                      <Text style={[
                        s.cardTypeText,
                        card.type === 'debit' && s.cardTypeTextDebit
                      ]}>
                        {card.type === 'credit' ? 'Crédito' : 'Débito'}
                      </Text>
                    </View>
                    {selectedCard?.id === card.id && (
                      <Ionicons name="checkmark-circle" size={ms(22)} color="#42b883" />
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Botón principal de pago */}
          <TouchableOpacity
            style={[
              s.primaryBtn,
              {
                borderRadius: CARD_RADIUS,
                paddingVertical: vs(16),
                marginTop: vs(28),
                opacity: !selectedCard ? 0.6 : 1
              }
            ]}
            onPress={() => handlePayment("card")}
            disabled={!selectedCard}
          >
            <Ionicons name="lock-closed" size={ms(18)} color="#0b0b0c" />
            <Text style={[s.primaryBtnText, { fontSize: ms(16) }]}>
              {selectedCard
                ? `Pagar $${total.toFixed(2)} con ${selectedCard.brand}`
                : 'Selecciona una tarjeta'
              }
            </Text>
          </TouchableOpacity>

          {/* Indicador de seguridad */}
          <View style={s.securityBadge}>
            <Ionicons name="shield-checkmark" size={ms(14)} color="#42b883" />
            <Text style={s.securityText}>Pago seguro con encriptación SSL</Text>
          </View>

          {/* Footer */}
          <Text style={[s.footer, { fontSize: ms(11), marginTop: vs(24) }]}>
            © {new Date().getFullYear()} Ocelon — Estacionamiento Inteligente
          </Text>
        </View>
      </ScrollView>

      {/* Modal para agregar tarjeta */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { borderRadius: CARD_RADIUS }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Agregar Nueva Tarjeta</Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={s.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={s.modalBody}>
              {/* Número de tarjeta */}
              <Text style={s.inputLabel}>Número de tarjeta</Text>
              <View style={s.inputContainer}>
                <Ionicons name="card-outline" size={20} color="#9aa0a6" />
                <TextInput
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor="#555"
                  keyboardType="numeric"
                  style={s.input}
                  value={newCardNumber}
                  onChangeText={setNewCardNumber}
                  maxLength={19}
                />
              </View>

              {/* Marca de tarjeta */}
              <Text style={s.inputLabel}>Marca de la tarjeta</Text>
              <View style={s.inputContainer}>
                <MaterialCommunityIcons name="credit-card-outline" size={20} color="#9aa0a6" />
                <TextInput
                  placeholder="Visa, Mastercard, BBVA..."
                  placeholderTextColor="#555"
                  style={s.input}
                  value={newCardBrand}
                  onChangeText={setNewCardBrand}
                />
              </View>

              {/* Tipo de tarjeta */}
              <Text style={s.inputLabel}>Tipo de tarjeta</Text>
              <View style={s.cardTypeSelector}>
                <TouchableOpacity
                  style={[
                    s.cardTypeOption,
                    newCardType === 'credit' && s.cardTypeOptionSelected
                  ]}
                  onPress={() => setNewCardType('credit')}
                >
                  <Text style={[
                    s.cardTypeOptionText,
                    newCardType === 'credit' && s.cardTypeOptionTextSelected
                  ]}>
                    Crédito
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    s.cardTypeOption,
                    newCardType === 'debit' && s.cardTypeOptionSelected
                  ]}
                  onPress={() => setNewCardType('debit')}
                >
                  <Text style={[
                    s.cardTypeOptionText,
                    newCardType === 'debit' && s.cardTypeOptionTextSelected
                  ]}>
                    Débito
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Botones del modal */}
            <View style={s.modalActions}>
              <TouchableOpacity
                style={s.modalCancelBtn}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={s.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.modalSaveBtn}
                onPress={handleAddCard}
              >
                <Ionicons name="checkmark" size={20} color="#0b0b0c" />
                <Text style={s.modalSaveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Helpers para colores de íconos de pago
const getPaymentBgColor = (method: string) => {
  switch (method) {
    case 'Apple Pay': return 'rgba(255, 255, 255, 0.1)';
    case 'PayPal': return 'rgba(0, 119, 181, 0.15)';
    case 'Google Pay': return 'rgba(66, 133, 244, 0.15)';
    default: return 'rgba(66, 184, 131, 0.15)';
  }
};

const getPaymentIconColor = (method: string) => {
  switch (method) {
    case 'Apple Pay': return '#fff';
    case 'PayPal': return '#0077B5';
    case 'Google Pay': return '#4285F4';
    default: return '#42b883';
  }
};

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
    backgroundColor: 'rgba(66, 184, 131, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountLabel: {
    color: '#9f9faf',
    fontSize: 14,
    fontWeight: '500',
  },
  amountValue: {
    color: '#42b883',
    fontWeight: '900',
  },
  amountCurrency: {
    color: '#42b883',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    color: '#42b883',
    fontSize: 14,
    fontWeight: '600',
  },

  // Cards
  card: {
    width: '100%',
    backgroundColor: '#151518',
    borderWidth: 1,
    borderColor: '#202028',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 3 },
    }),
  },

  // Payment Row
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  paymentRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#202028',
  },
  paymentRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentOption: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Card Row
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  cardRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#202028',
  },
  cardRowSelected: {
    backgroundColor: 'rgba(66, 184, 131, 0.1)',
    borderRadius: 12,
  },
  cardRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1a1a1f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconSelected: {
    backgroundColor: 'rgba(66, 184, 131, 0.2)',
  },
  cardBrand: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cardBrandSelected: {
    color: '#42b883',
  },
  cardNumber: {
    color: '#9aa0a6',
    fontSize: 13,
    marginTop: 2,
  },
  cardRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(66, 184, 131, 0.15)',
  },
  cardTypeBadgeDebit: {
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
  },
  cardTypeText: {
    color: '#42b883',
    fontSize: 11,
    fontWeight: '600',
  },
  cardTypeTextDebit: {
    color: '#6C63FF',
  },

  // Empty Cards
  emptyCards: {
    alignItems: 'center',
    padding: 30,
  },
  emptyCardsText: {
    color: '#9aa0a6',
    fontSize: 14,
    marginTop: 12,
  },
  emptyCardsButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(66, 184, 131, 0.15)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(66, 184, 131, 0.3)',
  },
  emptyCardsButtonText: {
    color: '#42b883',
    fontWeight: '600',
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

  // Security Badge
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  securityText: {
    color: '#9aa0a6',
    fontSize: 12,
  },

  // Footer
  footer: {
    color: '#85859a',
    textAlign: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#131318',
    borderWidth: 1,
    borderColor: '#42b883',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#202028',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    color: '#9aa0a6',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1f',
    borderWidth: 1,
    borderColor: '#202028',
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 14,
  },
  cardTypeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  cardTypeOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1a1a1f',
    borderWidth: 1,
    borderColor: '#202028',
    alignItems: 'center',
  },
  cardTypeOptionSelected: {
    backgroundColor: 'rgba(66, 184, 131, 0.15)',
    borderColor: '#42b883',
  },
  cardTypeOptionText: {
    color: '#9aa0a6',
    fontWeight: '600',
  },
  cardTypeOptionTextSelected: {
    color: '#42b883',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#202028',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3a3a42',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#ff6b6b',
    fontWeight: '600',
    fontSize: 16,
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#42b883',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalSaveText: {
    color: '#0b0b0c',
    fontWeight: '700',
    fontSize: 16,
  },
});