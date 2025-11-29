import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

interface CardData {
  cardNumber: string;
  cvv: string;
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
}

interface AddCardModalProps {
  visible: boolean;
  onClose: () => void;
  onCardAdded: (card: any) => void;
}

const AddCardModal: React.FC<AddCardModalProps> = ({ visible, onClose, onCardAdded }) => {
  const [cardData, setCardData] = useState<CardData>({
    cardNumber: '',
    cvv: '',
    expiryMonth: '',
    expiryYear: '',
    cardholderName: '',
  });

  const [cardBrand, setCardBrand] = useState<string>('');
  const [errors, setErrors] = useState<Partial<CardData>>({});
  const [showBack, setShowBack] = useState(false);

  // Animaciones simplificadas
  const slideAnim = useRef(new Animated.Value(0)).current;
  const frontAnim = useRef(new Animated.Value(1)).current;
  const backAnim = useRef(new Animated.Value(0)).current;

  // Referencias para los inputs
  const cvvInputRef = useRef<TextInput>(null);
  const expiryInputRef = useRef<TextInput>(null);
  const nameInputRef = useRef<TextInput>(null);
  const cardNumberInputRef = useRef<TextInput>(null);

  // Efecto de entrada/salida del modal
  useEffect(() => {
    if (visible) {
      resetForm();
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp),
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp),
      }).start();
    }
  }, [visible]);

  // Animación de volteo simplificada
  const flipCard = (showBackSide: boolean) => {
    setShowBack(showBackSide);
    
    if (showBackSide) {
      // Mostrar reverso
      Animated.parallel([
        Animated.timing(frontAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(backAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        })
      ]).start();
    } else {
      // Mostrar frente
      Animated.parallel([
        Animated.timing(frontAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(backAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        })
      ]).start();
    }
  };

  const resetForm = () => {
    setCardData({
      cardNumber: '',
      cvv: '',
      expiryMonth: '',
      expiryYear: '',
      cardholderName: '',
    });
    setCardBrand('');
    setErrors({});
    setShowBack(false);
    frontAnim.setValue(1);
    backAnim.setValue(0);
  };

  const detectCardBrand = (number: string): string => {
    const cleanNumber = number.replace(/\s/g, '');
    if (/^4/.test(cleanNumber)) return 'Visa';
    if (/^5[1-5]/.test(cleanNumber)) return 'Mastercard';
    if (/^3[47]/.test(cleanNumber)) return 'Amex';
    if (/^6/.test(cleanNumber)) return 'Discover';
    if (/^415231|4555/.test(cleanNumber)) return 'BBVA';
    return '';
  };

  const getCardColor = () => {
    const brand = cardBrand.toLowerCase();
    if (brand === 'visa') return '#1a1f71';
    if (brand === 'mastercard') return '#222';
    if (brand === 'bbva') return '#004481';
    if (brand === 'amex') return '#006fcf';
    return '#34343f';
  };

  const handleCardNumberChange = (text: string) => {
    const cleanText = text.replace(/\D/g, '');
    const formatted = cleanText.replace(/(\d{4})/g, '$1 ').trim().substring(0, 19);
    setCardData(prev => ({ ...prev, cardNumber: formatted }));
    setCardBrand(detectCardBrand(formatted));

    if (cleanText.length === 16) {
      nameInputRef.current?.focus();
    }
  };

  const handleExpiryChange = (text: string) => {
    const cleanText = text.replace(/\D/g, '');
    let formatted = cleanText;
    if (cleanText.length >= 2) {
      formatted = `${cleanText.substring(0, 2)}/${cleanText.substring(2, 4)}`;
    }
    const parts = formatted.split('/');
    setCardData(prev => ({
      ...prev,
      expiryMonth: parts[0] || '',
      expiryYear: parts[1] || ''
    }));

    if (cleanText.length === 4) {
      cvvInputRef.current?.focus();
    }
  };

  const handleCvvChange = (text: string) => {
    const cleanText = text.replace(/\D/g, '');
    setCardData(prev => ({ ...prev, cvv: cleanText }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CardData> = {};
    if (cardData.cardNumber.replace(/\s/g, '').length < 15) newErrors.cardNumber = 'Número de tarjeta incompleto';
    if (cardData.cvv.length < 3) newErrors.cvv = 'CVV inválido';
    if (!cardData.expiryMonth || !cardData.expiryYear) newErrors.expiryMonth = 'Fecha de vencimiento requerida';
    if (!cardData.cardholderName) newErrors.cardholderName = 'Nombre del titular requerido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddCard = () => {
    if (!validateForm()) return;
    
    onCardAdded({
      ...cardData,
      brand: cardBrand || 'Genérica',
      last4: cardData.cardNumber.slice(-4).trim()
    });
    onClose();
  };

  const renderVirtualCard = () => (
    <View style={styles.cardContainer}>
      {/* Frente de la tarjeta */}
      <Animated.View 
        style={[
          styles.cardFace,  
          { 
            backgroundColor: getCardColor(),
            opacity: frontAnim,
            transform: [{
              scale: frontAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1]
              })
            }]
          }
        ]}
      >
        <View style={styles.cardTopRow}>
          <MaterialCommunityIcons name="integrated-circuit-chip" size={34} color="#e0e0e0" />
          <View style={styles.cardLogoContainer}>
            {cardBrand === 'Visa' && <FontAwesome name="cc-visa" size={32} color="#fff" />}
            {cardBrand === 'Mastercard' && <FontAwesome name="cc-mastercard" size={32} color="#fff" />}
            {cardBrand === 'Amex' && <FontAwesome name="cc-amex" size={32} color="#fff" />}
            {!['Visa', 'Mastercard', 'Amex'].includes(cardBrand) && (
              <Text style={styles.cardBrandText}>{cardBrand || 'TARJETA'}</Text>
            )}
          </View>
        </View>
        
        <Text style={styles.cardVirtualNumber}>
          {cardData.cardNumber || '•••• •••• •••• ••••'}
        </Text>

        <View style={styles.cardBottomRow}>
          <View style={{ flex: 2 }}>
            <Text style={styles.cardLabel}>TITULAR</Text>
            <Text style={styles.cardValue} numberOfLines={1}>
              {cardData.cardholderName || 'NOMBRE APELLIDO'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardLabel}>EXPIRA</Text>
            <Text style={styles.cardValue}>
              {cardData.expiryMonth || 'MM'}/{cardData.expiryYear || 'AA'}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Reverso de la tarjeta */}
      <Animated.View 
        style={[
          styles.cardFace,  
          styles.cardBack,  
          { 
            backgroundColor: getCardColor(),
            opacity: backAnim,
            transform: [{
              scale: backAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1]
              })
            }]
          }
        ]}
      >
        <View style={styles.magneticStrip} />
        <View style={styles.signatureRow}>
          <View style={styles.signatureStrip} />
          <View style={styles.cvvBox}>
            <Text style={styles.cvvText}>{cardData.cvv || '•••'}</Text>
          </View>
        </View>
        <Text style={styles.backNote}>
          Esta tarjeta es intransferible y para uso exclusivo del titular.
        </Text>
        <View style={styles.hologramContainer}>
          <MaterialCommunityIcons name="shield-check" size={24} color="rgba(255,255,255,0.3)" />
        </View>
      </Animated.View>
    </View>
  );

  const modalTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="none" 
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
    >
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.modalContent, { transform: [{ translateY: modalTranslateY }] }]}>
          
          <View style={styles.header}>
            <Text style={styles.title}>Agregar Tarjeta</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {renderVirtualCard()}

          <View style={styles.formContainer}>
            <Text style={styles.label}>Número de tarjeta</Text>
            <TextInput
              ref={cardNumberInputRef}
              style={[styles.input, errors.cardNumber && styles.inputError]}
              placeholder="0000 0000 0000 0000"
              placeholderTextColor="#666"
              keyboardType="number-pad"
              maxLength={19}
              value={cardData.cardNumber}
              onChangeText={handleCardNumberChange}
              onFocus={() => flipCard(false)}
              returnKeyType="next"
              onSubmitEditing={() => nameInputRef.current?.focus()}
            />
            {errors.cardNumber && <Text style={styles.errorText}>{errors.cardNumber}</Text>}

            <Text style={styles.label}>Nombre del titular</Text>
            <TextInput
              ref={nameInputRef}
              style={[styles.input, errors.cardholderName && styles.inputError]}
              placeholder="COMO APARECE EN LA TARJETA"
              placeholderTextColor="#666"
              autoCapitalize="characters"
              value={cardData.cardholderName}
              onChangeText={(t) => setCardData(p => ({ ...p, cardholderName: t.toUpperCase() }))}
              onFocus={() => flipCard(false)}
              returnKeyType="next"
              onSubmitEditing={() => expiryInputRef.current?.focus()}
            />
            {errors.cardholderName && <Text style={styles.errorText}>{errors.cardholderName}</Text>}

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>Vencimiento (MM/AA)</Text>
                <TextInput
                  ref={expiryInputRef}
                  style={[styles.input, errors.expiryMonth && styles.inputError]}
                  placeholder="MM/AA"
                  placeholderTextColor="#666"
                  keyboardType="number-pad"
                  maxLength={5}
                  value={`${cardData.expiryMonth}${cardData.expiryYear ? '/' + cardData.expiryYear : ''}`}
                  onChangeText={handleExpiryChange}
                  onFocus={() => flipCard(false)}
                  returnKeyType="next"
                  onSubmitEditing={() => cvvInputRef.current?.focus()}
                />
                {errors.expiryMonth && <Text style={styles.errorText}>{errors.expiryMonth}</Text>}
              </View>
              
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>CVV</Text>
                <TextInput
                  ref={cvvInputRef}
                  style={[styles.input, errors.cvv && styles.inputError]}
                  placeholder="123"
                  placeholderTextColor="#666"
                  keyboardType="number-pad"
                  maxLength={4}
                  value={cardData.cvv}
                  onChangeText={handleCvvChange}
                  onFocus={() => flipCard(true)}
                  onBlur={() => setTimeout(() => flipCard(false), 500)}
                  returnKeyType="done"
                  onSubmitEditing={handleAddCard}
                />
                {errors.cvv && <Text style={styles.errorText}>{errors.cvv}</Text>}
              </View>
            </View>

            <View style={styles.secureBadge}>
              <Ionicons name="lock-closed" size={16} color="#42b883" />
              <Text style={styles.secureText}>Pagos seguros con encriptación SSL</Text>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleAddCard}>
              <Text style={styles.submitBtnText}>Guardar Tarjeta</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#131318',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    height: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  
  cardContainer: {
    height: 200,
    width: '100%',
    marginBottom: 20,
    position: 'relative',
  },
  cardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    padding: 20,
    justifyContent: 'space-between',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardBack: {
    // Estilos específicos del reverso
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLogoContainer: {
    height: 40,
    justifyContent: 'center',
  },
  cardBrandText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    fontStyle: 'italic',
  },
  cardVirtualNumber: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '500',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginTop: 10,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    marginBottom: 4,
  },
  cardValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  // Estilos del reverso
  magneticStrip: {
    height: 40,
    backgroundColor: '#000',
    marginHorizontal: -20,
    marginTop: 10,
  },
  signatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 10,
  },
  signatureStrip: {
    flex: 1,
    height: 30,
    backgroundColor: '#ccc',
    opacity: 0.8,
  },
  cvvBox: {
    width: 50,
    height: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  cvvText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backNote: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 8,
    marginTop: 15,
    textAlign: 'center',
  },
  hologramContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },

  formContainer: {
    flex: 1,
  },
  label: {
    color: '#9aa0a6',
    marginBottom: 8,
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#1c1c22',
    color: '#fff',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2d2d35',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secureBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: 20,
    padding: 12,
    backgroundColor: 'rgba(66, 184, 131, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(66, 184, 131, 0.3)',
  },
  secureText: {
    color: '#42b883',
    fontSize: 12,
  },
  submitBtn: {
    backgroundColor: '#42b883',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#42b883',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  submitBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AddCardModal;