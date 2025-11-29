// screens/DigitalPayment.tsx
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AddCardModal from '../components/AddCardModal';
import { useAuthState } from "../hooks/useAuthState";
import { RootStackParamList } from "../navegation/types/navigation";
import { getTimer, onTimerChange, stopTimer } from "../utils/TimerStore";

type Card = { 
  id: string; 
  brand: string; 
  last4: string; 
  type: "credit" | "debit";
  cardholderName?: string;
};

// Constantes de diseño
const BASE_W = 375;
const BASE_H = 812;
const USD_TO_MXN = 17.5;

// Componente Modal Personalizado para Alertas
const CustomAlertModal = ({ 
  visible, 
  onClose, 
  title, 
  message, 
  type = 'success',
  buttons = [{ text: 'OK', onPress: () => {} }] 
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  buttons?: { text: string; onPress: () => void }[];
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'close-circle';
      case 'warning': return 'warning';
      default: return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success': return '#42b883';
      case 'error': return '#ff6b6b';
      case 'warning': return '#ffa726';
      default: return '#42b883';
    }
  };

  // Función para determinar el estilo del botón basado en su texto
  const getButtonStyle = (buttonText: string, index: number) => {
    // Para modales de confirmación (tipo 'info')
    if (type === 'info') {
      if (buttonText.toLowerCase().includes('cancelar') || buttonText.toLowerCase().includes('cancel')) {
        return alertStyles.cancelButton;
      }
      if (buttonText.toLowerCase().includes('pagar') || buttonText.toLowerCase().includes('pay') || buttonText.toLowerCase().includes('confirm')) {
        return alertStyles.payButton;
      }
    }

    // Para otros tipos de modales
    if (index === 0) {
      switch (type) {
        case 'success': return alertStyles.primaryButton;
        case 'error': return alertStyles.dangerButton;
        case 'warning': return alertStyles.warningButton;
        default: return alertStyles.primaryButton;
      }
    } else {
      return alertStyles.secondaryButton;
    }
  };

  const getButtonTextStyle = (buttonText: string, index: number) => {
    if (type === 'info') {
      if (buttonText.toLowerCase().includes('pagar') || buttonText.toLowerCase().includes('pay') || buttonText.toLowerCase().includes('confirm')) {
        return alertStyles.payButtonText;
      }
    }
    
    if (index === 0 && (type === 'success' || type === 'info')) {
      return alertStyles.primaryButtonText;
    }
    
    return alertStyles.buttonText;
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={alertStyles.overlay}>
        <View style={alertStyles.container}>
          {/* Header con Logo */}
          <View style={alertStyles.header}>
            <Image
              source={require('../../assets/images/Logo_ocelon.jpg')}
              style={alertStyles.logo}
              resizeMode="contain"
            />
            <View style={alertStyles.titleContainer}>
              <Ionicons name={getIcon()} size={28} color={getIconColor()} />
              <Text style={alertStyles.title}>{title}</Text>
            </View>
          </View>

          {/* Mensaje */}
          <Text style={alertStyles.message}>{message}</Text>

          {/* Botones */}
          <View style={alertStyles.buttonsContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  alertStyles.button,
                  getButtonStyle(button.text, index)
                ]}
                onPress={() => {
                  button.onPress();
                  onClose();
                }}
              >
                {/* Agregar íconos a los botones de confirmación */}
                {type === 'info' && button.text.toLowerCase().includes('pagar') && (
                  <Ionicons name="lock-closed" size={16} color="#0b0b0c" style={alertStyles.buttonIcon} />
                )}
                {type === 'info' && button.text.toLowerCase().includes('cancelar') && (
                  <Ionicons name="close" size={16} color="#ff6b6b" style={alertStyles.buttonIcon} />
                )}
                
                <Text style={getButtonTextStyle(button.text, index)}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

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
  const [total, setTotal] = useState(initialMonto);

  // Estados para modales personalizados
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '' });

  // Convertir USD a MXN
  const totalInMXN = total * USD_TO_MXN;

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
      { id: "1", brand: "Mastercard", last4: "2681", type: "credit", cardholderName: "JUAN PEREZ" },
      { id: "2", brand: "BBVA", last4: "9854", type: "debit", cardholderName: "MARIA GARCIA" },
      { id: "3", brand: "Visa", last4: "4521", type: "credit", cardholderName: "CARLOS LOPEZ" },
    ];
    setCards(savedCards);
  }, [usuario]);

  // Función para manejar la adición de nueva tarjeta desde el modal
  const handleAddCardFromModal = (newCard: any) => {
    const cardToAdd: Card = {
      id: Math.random().toString(),
      brand: newCard.brand,
      last4: newCard.last4,
      type: "credit",
      cardholderName: newCard.cardholderName
    };
    
    setCards([...cards, cardToAdd]);
    setSelectedCard(cardToAdd);
    
    // Mostrar alerta personalizada de éxito
    setAlertData({
      title: "¡Tarjeta Agregada!",
      message: `Tu tarjeta ${newCard.brand} •••• ${newCard.last4} ha sido agregada exitosamente.`
    });
    setShowSuccessAlert(true);
  };

  const handleGoBack = () => {
    navigation.navigate("Timer", { rawQrData });
  };

  // Función que simula pago y redirige a ExitScreen
  const handlePayment = (method: string) => {
    if (!usuario) {
      setAlertData({
        title: "Error",
        message: "Debe iniciar sesión para realizar un pago digital"
      });
      setShowErrorAlert(true);
      return;
    }

    let paymentMethod = method;
    if (method === "card") {
      if (!selectedCard) {
        setAlertData({
          title: "Error",
          message: "Seleccione una tarjeta para continuar con el pago"
        });
        setShowErrorAlert(true);
        return;
      }
      paymentMethod = `${selectedCard.brand} •••• ${selectedCard.last4}`;
      
      // Mostrar confirmación de pago personalizada
      setAlertData({
        title: "Confirmar Pago",
        message: `¿Estás seguro de pagar $${totalInMXN.toFixed(2)} con tu tarjeta ${selectedCard.brand} •••• ${selectedCard.last4}?`
      });
      setShowConfirmAlert(true);
    } else {
      processPayment(paymentMethod);
    }
  };

  const processPayment = (paymentMethod: string) => {
    stopTimer();

    const finalQrData = rawQrData || `digital_${Date.now()}_${paymentMethod}`;

    navigation.navigate("ExitScreen", {
      rawQrData: finalQrData,
      monto: total,
      referencia: `digital_${Date.now()}`,
    });
  };

  // Función para obtener el ícono/logo de la tarjeta
  const getCardIcon = (brand: string) => {
    const brandLower = brand.toLowerCase();
    if (brandLower.includes('visa')) return { icon: 'cc-visa', color: '#1a1f71', emoji: '💳' };
    if (brandLower.includes('master')) return { icon: 'cc-mastercard', color: '#eb001b', emoji: '💳' };
    if (brandLower.includes('amex')) return { icon: 'cc-amex', color: '#2e77bc', emoji: '💳' };
    if (brandLower.includes('bbva')) return { icon: 'bank', color: '#004481', emoji: '🏦' };
    return { icon: 'credit-card', color: '#42b883', emoji: '💳' };
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
              ${totalInMXN.toFixed(2)}
            </Text>
            <Text style={s.amountCurrency}>MXN</Text>
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
              cards.map((card, index) => {
                const cardIcon = getCardIcon(card.brand);
                return (
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
                          name={cardIcon.icon as any}
                          size={ms(24)}
                          color={selectedCard?.id === card.id ? "#42b883" : cardIcon.color}
                        />
                      </View>
                      <View style={s.cardInfo}>
                        <View style={s.cardBrandRow}>
                          <Text style={[
                            s.cardBrand,
                            selectedCard?.id === card.id && s.cardBrandSelected
                          ]}>
                            {card.brand}
                          </Text>
                          <Text style={s.cardEmoji}>{cardIcon.emoji}</Text>
                        </View>
                        <Text style={s.cardNumber}>•••• •••• •••• {card.last4}</Text>
                        {card.cardholderName && (
                          <Text style={s.cardholderName}>{card.cardholderName}</Text>
                        )}
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
                );
              })
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
                ? `Pagar $${totalInMXN.toFixed(2)} con ${selectedCard.brand}`
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
      <AddCardModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCardAdded={handleAddCardFromModal}
      />

      {/* Modal de éxito personalizado */}
      <CustomAlertModal
        visible={showSuccessAlert}
        onClose={() => setShowSuccessAlert(false)}
        title={alertData.title}
        message={alertData.message}
        type="success"
        buttons={[{ text: 'Continuar', onPress: () => {} }]}
      />

      {/* Modal de error personalizado */}
      <CustomAlertModal
        visible={showErrorAlert}
        onClose={() => setShowErrorAlert(false)}
        title={alertData.title}
        message={alertData.message}
        type="error"
        buttons={[{ text: 'Entendido', onPress: () => {} }]}
      />

      {/* Modal de confirmación personalizado */}
      <CustomAlertModal
        visible={showConfirmAlert}
        onClose={() => setShowConfirmAlert(false)}
        title={alertData.title}
        message={alertData.message}
        type="info"
        buttons={[
          { text: 'Cancelar', onPress: () => {} },
          { text: 'Pagar', onPress: () => processPayment(`${selectedCard?.brand} •••• ${selectedCard?.last4}`) }
        ]}
      />
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

// Estilos para los alerts personalizados
const alertStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#131318',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#42b883',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 50,
    height: 50,
    marginBottom: 15,
    borderRadius: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: '#9aa0a6',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#42b883',
  },
  dangerButton: {
    backgroundColor: '#ff6b6b',
  },
  warningButton: {
    backgroundColor: '#ffa726',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3a3a42',
  },
  // Botones específicos para confirmación de pago
  cancelButton: {
    backgroundColor: 'red',
    borderWidth: 1,
    borderColor: '#green',
  },
  payButton: {
    backgroundColor: '#42b883',
    ...Platform.select({
      ios: {
        shadowColor: '#42b883',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  buttonIcon: {
    marginRight: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  primaryButtonText: {
    color: '#0b0b0c',
    fontWeight: '700',
  },
  payButtonText: {
    color: '#0b0b0c',
    fontWeight: '700',
  },
});

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
    flex: 1,
  },
  cardInfo: {
    flex: 1,
  },
  cardBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  cardEmoji: {
    fontSize: 16,
  },
  cardNumber: {
    color: '#9aa0a6',
    fontSize: 13,
    marginTop: 2,
  },
  cardholderName: {
    color: '#6c757d',
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
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
});