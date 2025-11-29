// screens/ValorationScreen.tsx
// Pantalla de valoración de la experiencia de estacionamiento
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import {
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navegation/types/navigation';

// Tipos para los parámetros de navegación
type ValorationScreenRouteProp = RouteProp<RootStackParamList, 'ValorationScreen'>;

interface ValorationData {
  parking?: string;
  spot?: string;
  amount?: number;
  time?: string;
  paymentMethod?: 'open_payments' | 'digital' | 'cash' | string;
  paymentId?: string;
  referencia?: string;
}

// Constantes de diseño
const BASE_W = 375;
const BASE_H = 812;

// Tipo de cambio USD a MXN (aproximado)
const USD_TO_MXN = 17.5;

export default function ValorationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<ValorationScreenRouteProp>();
  const insets = useSafeAreaInsets();

  // Escalas responsivas
  const { width, height } = useWindowDimensions();
  const hs = (size: number) => (width / BASE_W) * size;
  const vs = (size: number) => (height / BASE_H) * size;
  const ms = (size: number, factor = 0.5) => size + (hs(size) - size) * factor;

  // Datos de la sesión (vienen de la navegación)
  const data: ValorationData = route.params || {
    parking: 'Ocelon Estacionamiento',
    spot: 'A-15',
    amount: 12.50,
    time: '01:25:30',
    paymentMethod: 'open_payments',
  };

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [wasSkipped, setWasSkipped] = useState(false);

  // Convertir USD a MXN
  const amountInMXN = (data.amount || 0) * USD_TO_MXN;

  const handleSubmit = () => {
    // Aquí podrías enviar la valoración a tu backend
    console.log('Valoración enviada:', { rating, comment, data });
    setWasSkipped(false);
    setShowThankYouModal(true);
  };

  const handleSkip = () => {
    console.log('Valoración omitida');
    setWasSkipped(true);
    setShowThankYouModal(true);
  };

  const handleCloseThankYou = () => {
    setShowThankYouModal(false);
    // Navegar al Home
    navigation.reset({
      index: 0,
      routes: [{ name: 'AppTabs' as never }],
    });
  };

  const RatingStar = ({ filled, onPress, size = 36 }: { filled: boolean; onPress: () => void; size?: number }) => (
    <TouchableOpacity
      onPress={onPress}
      style={s.starButton}
      activeOpacity={0.7}
    >
      <Ionicons
        name={filled ? "star" : "star-outline"}
        size={hs(size)}
        color={filled ? "#FFD700" : "#3a3a42"}
      />
    </TouchableOpacity>
  );

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
          paddingTop: insets.top + vs(20),
          paddingBottom: vs(40),
        }}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={{ width: '100%', maxWidth: MAX_W, alignItems: 'center' }}>

          {/* Header con logo */}
          <View style={s.header}>
            <View style={[s.logoContainer, { borderRadius: hs(20) }]}>
              <Image
                source={require('../../assets/images/Logo_ocelon.jpg')}
                style={[s.logo, { width: hs(80), height: hs(80), borderRadius: hs(16) }]}
                resizeMode="cover"
              />
            </View>
            <Text style={[s.title, { fontSize: ms(24) }]}>¡Gracias por usar Ocelon!</Text>
            <Text style={[s.subtitle, { fontSize: ms(14) }]}>
              ¿Cómo fue tu experiencia de estacionamiento?
            </Text>
          </View>

          {/* Resumen de la sesión */}
          <View style={[s.sessionCard, { borderRadius: CARD_RADIUS, padding: hs(16), marginTop: vs(20) }]}>
            <View style={s.sessionHeader}>
              <Ionicons name="receipt-outline" size={ms(20)} color="#42b883" />
              <Text style={[s.sessionTitle, { fontSize: ms(16) }]}>Resumen de tu Sesión</Text>
            </View>

            <View style={s.sessionDetails}>
              <View style={s.detailRow}>
                <View style={s.detailLeft}>
                  <Ionicons name="business-outline" size={ms(18)} color="#9aa0a6" />
                  <Text style={s.detailLabel}>Estacionamiento</Text>
                </View>
                <Text style={s.detailValue}>{data.parking}</Text>
              </View>

              <View style={s.detailRow}>
                <View style={s.detailLeft}>
                  <Ionicons name="location-outline" size={ms(18)} color="#9aa0a6" />
                  <Text style={s.detailLabel}>Cajón</Text>
                </View>
                <Text style={[s.detailValue, { color: '#42b883' }]}>{data.spot}</Text>
              </View>

              <View style={s.detailRow}>
                <View style={s.detailLeft}>
                  <Ionicons name="time-outline" size={ms(18)} color="#9aa0a6" />
                  <Text style={s.detailLabel}>Tiempo</Text>
                </View>
                <Text style={s.detailValue}>{data.time}</Text>
              </View>

              <View style={s.detailRow}>
                <View style={s.detailLeft}>
                  <Ionicons name="logo-usd" size={ms(18)} color="#9aa0a6" />
                  <Text style={s.detailLabel}>Total pagado</Text>
                </View>
                <Text style={[s.detailValue, { color: '#42b883', fontWeight: '800' }]}>
                  ${amountInMXN.toFixed(2)} MXN
                </Text>
              </View>

              {/* Referencia si existe */}
              {(data.paymentId || data.referencia) && (
                <View style={s.detailRow}>
                  <View style={s.detailLeft}>
                    <Ionicons name="finger-print-outline" size={ms(18)} color="#9aa0a6" />
                    <Text style={s.detailLabel}>Referencia</Text>
                  </View>
                  <Text style={s.referenceValue}>
                    {(data.paymentId || data.referencia || '').slice(-12)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Sistema de valoración */}
          <View style={[s.ratingCard, { borderRadius: CARD_RADIUS, padding: hs(20), marginTop: vs(20) }]}>
            <Text style={[s.ratingTitle, { fontSize: ms(18) }]}>
              Califica tu experiencia
            </Text>
            <Text style={s.ratingSubtitle}>
              Tu opinión nos ayuda a mejorar
            </Text>

            <View style={s.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <RatingStar
                  key={star}
                  filled={star <= rating}
                  onPress={() => setRating(star)}
                  size={40}
                />
              ))}
            </View>

            <View style={s.ratingLabels}>
              <Text style={s.ratingLabel}>Mala</Text>
              <Text style={s.ratingLabelCenter}>
                {rating === 0 ? 'Toca para calificar' :
                  rating <= 2 ? 'Podemos mejorar' :
                    rating <= 4 ? 'Buena experiencia' : '¡Excelente!'}
              </Text>
              <Text style={s.ratingLabel}>Excelente</Text>
            </View>
          </View>

          {/* Comentarios opcionales */}
          <View style={[s.commentCard, { borderRadius: CARD_RADIUS, padding: hs(16), marginTop: vs(16) }]}>
            <View style={s.commentHeader}>
              <Ionicons name="chatbubble-outline" size={ms(18)} color="#42b883" />
              <Text style={[s.commentTitle, { fontSize: ms(14) }]}>
                Comentarios (opcional)
              </Text>
            </View>
            <Text style={s.commentSubtitle}>
              ¿Algo que quieras compartir sobre tu experiencia?
            </Text>

            <TextInput
              style={[s.commentInput, {
                minHeight: vs(100),
                borderRadius: hs(12),
                marginTop: vs(12)
              }]}
              placeholder="Escribe tus comentarios aquí..."
              placeholderTextColor="#555"
              value={comment}
              onChangeText={setComment}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Botón de enviar */}
          <TouchableOpacity
            style={[s.submitButton, {
              paddingVertical: vs(16),
              borderRadius: CARD_RADIUS,
              marginTop: vs(24),
              opacity: rating === 0 ? 0.6 : 1
            }]}
            onPress={handleSubmit}
            disabled={rating === 0}
            activeOpacity={0.8}
          >
            <Ionicons
              name={rating === 0 ? "star-outline" : "star"}
              size={ms(20)}
              color="#0b0b0c"
            />
            <Text style={[s.submitButtonText, { fontSize: ms(16) }]}>
              {rating === 0 ? 'Selecciona una calificación' : 'Enviar Valoración'}
            </Text>
          </TouchableOpacity>

          {/* Omitir valoración */}
          <TouchableOpacity
            style={[s.skipButton, { paddingVertical: vs(14), marginTop: vs(12) }]}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-forward" size={ms(18)} color="#85859a" />
            <Text style={s.skipText}>Omitir y continuar</Text>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={[s.footer, { fontSize: ms(11), marginTop: vs(24) }]}>
            © {new Date().getFullYear()} Ocelon — Estacionamiento Inteligente
          </Text>
        </View>
      </ScrollView>

      {/* Modal de agradecimiento */}
      <Modal
        visible={showThankYouModal}
        animationType="fade"
        transparent={true}
      >
        <View style={s.modalOverlay}>
          <View style={[s.thankYouModal, { maxWidth: width * 0.85, borderRadius: CARD_RADIUS }]}>
            {/* Logo de Ocelon en lugar del ícono */}
            <View style={s.modalIconContainer}>
              <Image
                source={require('../../assets/images/Logo_ocelon.jpg')}
                style={[s.modalLogo, { width: ms(70), height: ms(70), borderRadius: ms(14) }]}
                resizeMode="cover"
              />
            </View>

            <Text style={[s.thankYouTitle, { fontSize: ms(22) }]}>
              {wasSkipped ? '¡Gracias por usar Ocelon!' : '¡Gracias por tu Valoración!'}
            </Text>

            <Text style={[s.thankYouText, { fontSize: ms(14) }]}>
              {wasSkipped
                ? 'Esperamos verte pronto de nuevo. ¡Buen viaje!'
                : 'Tu opinión nos ayuda a mejorar el servicio para todos.'
              }
            </Text>

            {/* Resumen rápido */}
            <View style={s.modalSummary}>
              <View style={s.modalSummaryRow}>
                <Text style={s.modalSummaryLabel}>Estacionamiento:</Text>
                <Text style={s.modalSummaryValue}>{data.parking}</Text>
              </View>
              <View style={s.modalSummaryRow}>
                <Text style={s.modalSummaryLabel}>Total pagado:</Text>
                <Text style={[s.modalSummaryValue, { color: '#42b883' }]}>
                  ${amountInMXN.toFixed(2)} MXN
                </Text>
              </View>
              {!wasSkipped && rating > 0 && (
                <View style={s.modalSummaryRow}>
                  <Text style={s.modalSummaryLabel}>Tu calificación:</Text>
                  <View style={s.modalStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= rating ? "star" : "star-outline"}
                        size={ms(16)}
                        color={star <= rating ? "#FFD700" : "#3a3a42"}
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Botón centrado */}
            <View style={s.modalButtonContainer}>
              <TouchableOpacity
                style={[s.closeButton, { paddingVertical: vs(14), borderRadius: hs(12) }]}
                onPress={handleCloseThankYou}
                activeOpacity={0.8}
              >
                <Ionicons name="home" size={ms(18)} color="#0b0b0c" />
                <Text style={s.closeButtonText}>Volver al Inicio</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

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

  // Header
  header: {
    alignItems: 'center',
  },
  logoContainer: {
    padding: 4,
    backgroundColor: 'rgba(66, 184, 131, 0.1)',
    borderWidth: 2,
    borderColor: '#42b883',
    marginBottom: 16,
  },
  logo: {
    borderWidth: 0,
  },
  title: {
    color: '#fff',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#9aa0a6',
    textAlign: 'center',
  },

  // Session Card
  sessionCard: {
    width: '100%',
    backgroundColor: '#131318',
    borderWidth: 1,
    borderColor: '#202028',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
      android: { elevation: 4 },
    }),
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#202028',
  },
  sessionTitle: {
    color: '#fff',
    fontWeight: '700',
  },
  sessionDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailLabel: {
    color: '#9aa0a6',
    fontSize: 13,
  },
  detailValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  referenceValue: {
    color: '#9aa0a6',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Rating Card
  ratingCard: {
    width: '100%',
    backgroundColor: '#131318',
    borderWidth: 1,
    borderColor: '#202028',
    alignItems: 'center',
  },
  ratingTitle: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
  ratingSubtitle: {
    color: '#9aa0a6',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  ratingLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  ratingLabel: {
    color: '#666',
    fontSize: 11,
  },
  ratingLabelCenter: {
    color: '#42b883',
    fontSize: 12,
    fontWeight: '600',
  },

  // Comment Card
  commentCard: {
    width: '100%',
    backgroundColor: '#151518',
    borderWidth: 1,
    borderColor: '#202028',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  commentTitle: {
    color: '#fff',
    fontWeight: '600',
  },
  commentSubtitle: {
    color: '#9aa0a6',
    fontSize: 12,
  },
  commentInput: {
    backgroundColor: '#1a1a1f',
    borderWidth: 1,
    borderColor: '#202028',
    padding: 14,
    color: '#fff',
    fontSize: 14,
  },

  // Buttons
  submitButton: {
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
  submitButtonText: {
    color: '#0b0b0c',
    fontWeight: '800',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  skipText: {
    color: '#85859a',
    fontSize: 14,
    fontWeight: '500',
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
    alignItems: 'center',
    padding: 20,
  },
  thankYouModal: {
    backgroundColor: '#131318',
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#42b883',
    ...Platform.select({
      ios: { shadowColor: '#42b883', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
      android: { elevation: 10 },
    }),
  },
  modalIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(66, 184, 131, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#42b883',
  },
  modalLogo: {
    borderWidth: 0,
  },
  thankYouTitle: {
    color: '#fff',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  thankYouText: {
    color: '#9aa0a6',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalSummary: {
    width: '100%',
    backgroundColor: '#1a1a1f',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 10,
  },
  modalSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalSummaryLabel: {
    color: '#9aa0a6',
    fontSize: 13,
  },
  modalSummaryValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  modalStars: {
    flexDirection: 'row',
    gap: 2,
  },
  modalButtonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#42b883',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 32,
  },
  closeButtonText: {
    color: '#0b0b0c',
    fontSize: 16,
    fontWeight: '800',
  },
});