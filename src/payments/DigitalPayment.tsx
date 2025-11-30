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
import { useConfig } from '../contexts/ConfigContext';
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
  const { t, isDark } = useConfig();

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

  // Colores dinámicos
  const colors = {
    background: isDark ? '#131318' : '#ffffff',
    text: isDark ? '#ffffff' : '#000000',
    textSecondary: isDark ? '#9aa0a6' : '#666666',
    border: isDark ? '#42b883' : '#42b883',
    secondaryBorder: isDark ? '#3a3a42' : '#e0e0e0',
  };

  // Función para determinar el estilo del botón basado en su texto
  const getButtonStyle = (buttonText: string, index: number) => {
    // Para modales de confirmación (tipo 'info')
    if (type === 'info') {
      if (buttonText.toLowerCase().includes('cancelar') || buttonText.toLowerCase().includes('cancel')) {
        return [alertStyles.cancelButton, { backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa', borderColor: isDark ? '#ff6b6b' : '#ff6b6b' }];
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
      return [alertStyles.secondaryButton, { backgroundColor: 'transparent', borderColor: colors.secondaryBorder }];
    }
  };

  const getButtonTextStyle = (buttonText: string, index: number) => {
    if (type === 'info') {
      if (buttonText.toLowerCase().includes('pagar') || buttonText.toLowerCase().includes('pay') || buttonText.toLowerCase().includes('confirm')) {
        return alertStyles.payButtonText;
      }
      if (buttonText.toLowerCase().includes('cancelar') || buttonText.toLowerCase().includes('cancel')) {
        return [alertStyles.buttonText, { color: '#ff6b6b' }];
      }
    }
    
    if (index === 0 && (type === 'success' || type === 'info')) {
      return alertStyles.primaryButtonText;
    }
    
    return [alertStyles.buttonText, { color: colors.text }];
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={alertStyles.overlay}>
        <View style={[alertStyles.container, { backgroundColor: colors.background, borderColor: colors.border }]}>
          {/* Header con Logo */}
          <View style={alertStyles.header}>
            <Image
              source={require('../../assets/images/Logo_ocelon.jpg')}
              style={alertStyles.logo}
              resizeMode="contain"
            />
            <View style={alertStyles.titleContainer}>
              <Ionicons name={getIcon()} size={28} color={getIconColor()} />
              <Text style={[alertStyles.title, { color: colors.text }]}>{title}</Text>
            </View>
          </View>

          {/* Mensaje */}
          <Text style={[alertStyles.message, { color: colors.textSecondary }]}>{message}</Text>

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
  const { t, isDark } = useConfig();
  
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

  // Colores dinámicos
  const colors = {
    background: isDark ? '#0b0b0c' : '#f8f9fa',
    cardBackground: isDark ? '#131318' : '#ffffff',
    text: isDark ? '#ffffff' : '#000000',
    textSecondary: isDark ? '#9aa0a6' : '#666666',
    border: isDark ? '#202028' : '#e0e0e0',
    primary: '#42b883',
    success: '#42b883',
    error: '#ff4444',
    overlay: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.7)',
    backButtonBg: isDark ? 'rgba(66, 184, 131, 0.15)' : 'rgba(66, 184, 131, 0.1)',
    backButtonBorder: isDark ? 'rgba(66, 184, 131, 0.3)' : 'rgba(66, 184, 131, 0.2)',
    amountCardBg: isDark ? '#131318' : '#ffffff',
    amountCardBorder: isDark ? '#202028' : '#e0e0e0',
  };

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
      title: t('cardAddedSuccess'),
      message: t('cardAddedMessage', { brand: newCard.brand, last4: newCard.last4 })
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
        title: t('error'),
        message: t('loginRequired')
      });
      setShowErrorAlert(true);
      return;
    }

    let paymentMethod = method;
    if (method === "card") {
      if (!selectedCard) {
        setAlertData({
          title: t('error'),
          message: t('selectCardRequired')
        });
        setShowErrorAlert(true);
        return;
      }
      paymentMethod = `${selectedCard.brand} •••• ${selectedCard.last4}`;
      
      // Mostrar confirmación de pago personalizada
      setAlertData({
        title: t('confirmPayment'),
        message: t('confirmPaymentMessage', { 
          amount: totalInMXN.toFixed(2), 
          brand: selectedCard.brand, 
          last4: selectedCard.last4 
        })
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
              {t('digitalPayment')}
            </Text>
            <View style={s.headerPlaceholder} />
          </View>

          {/* Card del monto total */}
          <View style={[s.amountCard, { 
            borderRadius: CARD_RADIUS, 
            padding: hs(20),
            backgroundColor: colors.amountCardBg,
            borderColor: colors.amountCardBorder
          }]}>
            <View style={s.amountHeader}>
              <View style={s.amountIconContainer}>
                <Ionicons name="card" size={ms(24)} color={colors.primary} />
              </View>
              <Text style={[s.amountLabel, { color: colors.textSecondary }]}>
                {t('totalToPay')}
              </Text>
            </View>
            <Text style={[s.amountValue, { fontSize: ms(42), color: colors.primary }]}>
              ${totalInMXN.toFixed(2)}
            </Text>
            <Text style={[s.amountCurrency, { color: colors.primary }]}>MXN</Text>
          </View>

          {/* Sección de pago rápido */}
          <View style={[s.sectionHeader, { marginTop: vs(24) }]}>
            <Ionicons name="flash" size={ms(18)} color={colors.primary} />
            <Text style={[s.sectionTitle, { fontSize: ms(16), color: colors.text }]}>
              {t('quickPayment')}
            </Text>
          </View>

          <View style={[s.card, { 
            borderRadius: CARD_RADIUS, 
            padding: hs(8),
            backgroundColor: colors.cardBackground,
            borderColor: colors.border
          }]}>
            {["Apple Pay", "PayPal", "Google Pay"].map((method, index) => (
              <TouchableOpacity
                key={method}
                style={[
                  s.paymentRow,
                  index !== 2 && [s.paymentRowBorder, { borderBottomColor: colors.border }]
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
                  <Text style={[s.paymentOption, { color: colors.text }]}>{method}</Text>
                </View>
                <Ionicons name="chevron-forward" size={ms(20)} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Sección de tarjetas */}
          <View style={[s.sectionHeader, { marginTop: vs(24) }]}>
            <View style={s.sectionHeaderLeft}>
              <Ionicons name="wallet" size={ms(18)} color={colors.primary} />
              <Text style={[s.sectionTitle, { fontSize: ms(16), color: colors.text }]}>
                {t('myCards')}
              </Text>
            </View>
            <TouchableOpacity
              style={s.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add-circle" size={ms(20)} color={colors.primary} />
              <Text style={[s.addButtonText, { color: colors.primary }]}>{t('add')}</Text>
            </TouchableOpacity>
          </View>

          <View style={[s.card, { 
            borderRadius: CARD_RADIUS, 
            padding: hs(8),
            backgroundColor: colors.cardBackground,
            borderColor: colors.border
          }]}>
            {cards.length === 0 ? (
              <View style={s.emptyCards}>
                <Ionicons name="card-outline" size={ms(40)} color={colors.textSecondary} />
                <Text style={[s.emptyCardsText, { color: colors.textSecondary }]}>
                  {t('noCardsSaved')}
                </Text>
                <TouchableOpacity
                  style={[s.emptyCardsButton, { 
                    backgroundColor: colors.backButtonBg,
                    borderColor: colors.backButtonBorder
                  }]}
                  onPress={() => setShowAddModal(true)}
                >
                  <Text style={[s.emptyCardsButtonText, { color: colors.primary }]}>
                    {t('addCard')}
                  </Text>
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
                      index !== cards.length - 1 && [s.cardRowBorder, { borderBottomColor: colors.border }],
                      selectedCard?.id === card.id && [s.cardRowSelected, { backgroundColor: isDark ? 'rgba(66, 184, 131, 0.1)' : 'rgba(66, 184, 131, 0.05)' }]
                    ]}
                    onPress={() => setSelectedCard(card)}
                    activeOpacity={0.7}
                  >
                    <View style={s.cardRowLeft}>
                      <View style={[
                        s.cardIconContainer,
                        { backgroundColor: isDark ? '#1a1a1f' : '#f8f9fa' },
                        selectedCard?.id === card.id && [s.cardIconSelected, { backgroundColor: isDark ? 'rgba(66, 184, 131, 0.2)' : 'rgba(66, 184, 131, 0.15)' }]
                      ]}>
                        <MaterialCommunityIcons
                          name={cardIcon.icon as any}
                          size={ms(24)}
                          color={selectedCard?.id === card.id ? colors.primary : cardIcon.color}
                        />
                      </View>
                      <View style={s.cardInfo}>
                        <View style={s.cardBrandRow}>
                          <Text style={[
                            s.cardBrand,
                            { color: colors.text },
                            selectedCard?.id === card.id && [s.cardBrandSelected, { color: colors.primary }]
                          ]}>
                            {card.brand}
                          </Text>
                          <Text style={s.cardEmoji}>{cardIcon.emoji}</Text>
                        </View>
                        <Text style={[s.cardNumber, { color: colors.textSecondary }]}>
                          •••• •••• •••• {card.last4}
                        </Text>
                        {card.cardholderName && (
                          <Text style={[s.cardholderName, { color: colors.textSecondary }]}>
                            {card.cardholderName}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={s.cardRowRight}>
                      <View style={[
                        s.cardTypeBadge,
                        { backgroundColor: isDark ? 'rgba(66, 184, 131, 0.15)' : 'rgba(66, 184, 131, 0.1)' },
                        card.type === 'debit' && [s.cardTypeBadgeDebit, { backgroundColor: isDark ? 'rgba(108, 99, 255, 0.15)' : 'rgba(108, 99, 255, 0.1)' }]
                      ]}>
                        <Text style={[
                          s.cardTypeText,
                          { color: colors.primary },
                          card.type === 'debit' && [s.cardTypeTextDebit, { color: '#6C63FF' }]
                        ]}>
                          {card.type === 'credit' ? t('credit') : t('debit')}
                        </Text>
                      </View>
                      {selectedCard?.id === card.id && (
                        <Ionicons name="checkmark-circle" size={ms(22)} color={colors.primary} />
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
                opacity: !selectedCard ? 0.6 : 1,
                backgroundColor: colors.primary
              }
            ]}
            onPress={() => handlePayment("card")}
            disabled={!selectedCard}
          >
            <Ionicons name="lock-closed" size={ms(18)} color="#0b0b0c" />
            <Text style={[s.primaryBtnText, { fontSize: ms(16) }]}>
              {selectedCard
                ? t('payWithCard', { amount: totalInMXN.toFixed(2), brand: selectedCard.brand })
                : t('selectCard')
              }
            </Text>
          </TouchableOpacity>

          {/* Indicador de seguridad */}
          <View style={s.securityBadge}>
            <Ionicons name="shield-checkmark" size={ms(14)} color={colors.primary} />
            <Text style={[s.securityText, { color: colors.textSecondary }]}>
              {t('securePayment')}
            </Text>
          </View>

          {/* Footer */}
          <Text style={[s.footer, { fontSize: ms(11), marginTop: vs(24), color: colors.textSecondary }]}>
            © {new Date().getFullYear()} Ocelon — {t('smartParking')}
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
        buttons={[{ text: t('continue'), onPress: () => {} }]}
      />

      {/* Modal de error personalizado */}
      <CustomAlertModal
        visible={showErrorAlert}
        onClose={() => setShowErrorAlert(false)}
        title={alertData.title}
        message={alertData.message}
        type="error"
        buttons={[{ text: t('understood'), onPress: () => {} }]}
      />

      {/* Modal de confirmación personalizado */}
      <CustomAlertModal
        visible={showConfirmAlert}
        onClose={() => setShowConfirmAlert(false)}
        title={alertData.title}
        message={alertData.message}
        type="info"
        buttons={[
          { text: t('cancel'), onPress: () => {} },
          { text: t('pay'), onPress: () => processPayment(`${selectedCard?.brand} •••• ${selectedCard?.last4}`) }
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
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
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
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
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
    borderWidth: 1,
  },
  // Botones específicos para confirmación de pago
  cancelButton: {
    borderWidth: 1,
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
    backgroundColor: 'rgba(66, 184, 131, 0.15)',
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
    fontWeight: '700',
    marginLeft: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Cards
  card: {
    width: '100%',
    borderWidth: 1,
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
  },
  cardRowSelected: {
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconSelected: {
    // Estilos se aplican dinámicamente
  },
  cardBrand: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardBrandSelected: {
    // Estilos se aplican dinámicamente
  },
  cardEmoji: {
    fontSize: 16,
  },
  cardNumber: {
    fontSize: 13,
    marginTop: 2,
  },
  cardholderName: {
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
  },
  cardTypeBadgeDebit: {
    // Estilos se aplican dinámicamente
  },
  cardTypeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardTypeTextDebit: {
    // Estilos se aplican dinámicamente
  },

  // Empty Cards
  emptyCards: {
    alignItems: 'center',
    padding: 30,
  },
  emptyCardsText: {
    fontSize: 14,
    marginTop: 12,
  },
  emptyCardsButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  emptyCardsButtonText: {
    fontWeight: '600',
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

  // Security Badge
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  securityText: {
    fontSize: 12,
  },

  // Footer
  footer: {
    textAlign: 'center',
  },
});