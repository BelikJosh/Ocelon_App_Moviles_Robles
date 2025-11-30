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
import { useConfig } from '../contexts/ConfigContext'; // Importa el hook

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
  const { t, isDark } = useConfig(); // Usa el hook de configuración

  // Escalas responsivas
  const { width, height } = useWindowDimensions();
  const hs = (size: number) => (width / BASE_W) * size;
  const vs = (size: number) => (height / BASE_H) * size;
  const ms = (size: number, factor = 0.5) => size + (hs(size) - size) * factor;

  // Colores dinámicos según el tema
  const colors = {
    background: isDark ? '#0b0b0c' : '#f8f9fa',
    card: isDark ? '#131318' : '#ffffff',
    cardSecondary: isDark ? '#151518' : '#f8f9fa',
    text: isDark ? '#ffffff' : '#000000',
    textSecondary: isDark ? '#9aa0a6' : '#666666',
    border: isDark ? '#202028' : '#e0e0e0',
    primary: '#42b883',
    inputBackground: isDark ? '#1a1a1f' : '#f1f3f4',
    placeholder: isDark ? '#555' : '#999999',
    starFilled: '#FFD700',
    starEmpty: isDark ? '#3a3a42' : '#cccccc',
    modalBackground: isDark ? '#131318' : '#ffffff',
    modalBorder: isDark ? '#42b883' : '#42b883',
  };

  // Datos de la sesión (vienen de la navegación)
  const data: ValorationData = route.params || {
    parking: t('ocelonParking'),
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
        color={filled ? colors.starFilled : colors.starEmpty}
      />
    </TouchableOpacity>
  );

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
          paddingTop: insets.top + vs(20),
          paddingBottom: vs(40),
        }}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={{ width: '100%', maxWidth: MAX_W, alignItems: 'center' }}>

          {/* Header con logo */}
          <View style={s.header}>
            <View style={[s.logoContainer, { 
              borderRadius: hs(20),
              backgroundColor: isDark ? 'rgba(66, 184, 131, 0.1)' : 'rgba(66, 184, 131, 0.05)',
              borderColor: colors.primary 
            }]}>
              <Image
                source={require('../../assets/images/Logo_ocelon.jpg')}
                style={[s.logo, { width: hs(80), height: hs(80), borderRadius: hs(16) }]}
                resizeMode="cover"
              />
            </View>
            <Text style={[s.title, { 
              fontSize: ms(24),
              color: colors.text 
            }]}>{t('thanksForUsingOcelon')}</Text>
            <Text style={[s.subtitle, { 
              fontSize: ms(14),
              color: colors.textSecondary 
            }]}>
              {t('howWasExperience')}
            </Text>
          </View>

          {/* Resumen de la sesión */}
          <View style={[s.sessionCard, { 
            borderRadius: CARD_RADIUS, 
            padding: hs(16), 
            marginTop: vs(20),
            backgroundColor: colors.card,
            borderColor: colors.border 
          }]}>
            <View style={[s.sessionHeader, { borderBottomColor: colors.border }]}>
              <Ionicons name="receipt-outline" size={ms(20)} color={colors.primary} />
              <Text style={[s.sessionTitle, { 
                fontSize: ms(16),
                color: colors.text 
              }]}>{t('sessionSummary')}</Text>
            </View>

            <View style={s.sessionDetails}>
              <View style={s.detailRow}>
                <View style={s.detailLeft}>
                  <Ionicons name="business-outline" size={ms(18)} color={colors.textSecondary} />
                  <Text style={[s.detailLabel, { color: colors.textSecondary }]}>{t('parking')}</Text>
                </View>
                <Text style={[s.detailValue, { color: colors.text }]}>{data.parking}</Text>
              </View>

              <View style={s.detailRow}>
                <View style={s.detailLeft}>
                  <Ionicons name="location-outline" size={ms(18)} color={colors.textSecondary} />
                  <Text style={[s.detailLabel, { color: colors.textSecondary }]}>{t('spot')}</Text>
                </View>
                <Text style={[s.detailValue, { color: colors.primary }]}>{data.spot}</Text>
              </View>

              <View style={s.detailRow}>
                <View style={s.detailLeft}>
                  <Ionicons name="time-outline" size={ms(18)} color={colors.textSecondary} />
                  <Text style={[s.detailLabel, { color: colors.textSecondary }]}>{t('time')}</Text>
                </View>
                <Text style={[s.detailValue, { color: colors.text }]}>{data.time}</Text>
              </View>

              <View style={s.detailRow}>
                <View style={s.detailLeft}>
                  <Ionicons name="logo-usd" size={ms(18)} color={colors.textSecondary} />
                  <Text style={[s.detailLabel, { color: colors.textSecondary }]}>{t('totalPaid')}</Text>
                </View>
                <Text style={[s.detailValue, { color: colors.primary, fontWeight: '800' }]}>
                  ${amountInMXN.toFixed(2)} MXN
                </Text>
              </View>

              {/* Referencia si existe */}
              {(data.paymentId || data.referencia) && (
                <View style={s.detailRow}>
                  <View style={s.detailLeft}>
                    <Ionicons name="finger-print-outline" size={ms(18)} color={colors.textSecondary} />
                    <Text style={[s.detailLabel, { color: colors.textSecondary }]}>{t('reference')}</Text>
                  </View>
                  <Text style={[s.referenceValue, { color: colors.textSecondary }]}>
                    {(data.paymentId || data.referencia || '').slice(-12)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Sistema de valoración */}
          <View style={[s.ratingCard, { 
            borderRadius: CARD_RADIUS, 
            padding: hs(20), 
            marginTop: vs(20),
            backgroundColor: colors.card,
            borderColor: colors.border 
          }]}>
            <Text style={[s.ratingTitle, { 
              fontSize: ms(18),
              color: colors.text 
            }]}>
              {t('rateExperience')}
            </Text>
            <Text style={[s.ratingSubtitle, { color: colors.textSecondary }]}>
              {t('yourOpinionMatters')}
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
              <Text style={[s.ratingLabel, { color: colors.textSecondary }]}>{t('bad')}</Text>
              <Text style={[s.ratingLabelCenter, { color: colors.primary }]}>
                {rating === 0 ? t('tapToRate') :
                  rating <= 2 ? t('canImprove') :
                    rating <= 4 ? t('goodExperience') : t('excellent')}
              </Text>
              <Text style={[s.ratingLabel, { color: colors.textSecondary }]}>{t('excellent')}</Text>
            </View>
          </View>

          {/* Comentarios opcionales */}
          <View style={[s.commentCard, { 
            borderRadius: CARD_RADIUS, 
            padding: hs(16), 
            marginTop: vs(16),
            backgroundColor: colors.cardSecondary,
            borderColor: colors.border 
          }]}>
            <View style={s.commentHeader}>
              <Ionicons name="chatbubble-outline" size={ms(18)} color={colors.primary} />
              <Text style={[s.commentTitle, { 
                fontSize: ms(14),
                color: colors.text 
              }]}>
                {t('commentsOptional')}
              </Text>
            </View>
            <Text style={[s.commentSubtitle, { color: colors.textSecondary }]}>
              {t('shareExperience')}
            </Text>

            <TextInput
              style={[s.commentInput, {
                minHeight: vs(100),
                borderRadius: hs(12),
                marginTop: vs(12),
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
                color: colors.text
              }]}
              placeholder={t('writeCommentsHere')}
              placeholderTextColor={colors.placeholder}
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
              opacity: rating === 0 ? 0.6 : 1,
              backgroundColor: colors.primary
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
              {rating === 0 ? t('selectRating') : t('submitRating')}
            </Text>
          </TouchableOpacity>

          {/* Omitir valoración */}
          <TouchableOpacity
            style={[s.skipButton, { paddingVertical: vs(14), marginTop: vs(12) }]}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-forward" size={ms(18)} color={colors.textSecondary} />
            <Text style={[s.skipText, { color: colors.textSecondary }]}>{t('skipAndContinue')}</Text>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={[s.footer, { 
            fontSize: ms(11), 
            marginTop: vs(24),
            color: colors.textSecondary 
          }]}>
            © {new Date().getFullYear()} Ocelon — {t('smartParking')}
          </Text>
        </View>
      </ScrollView>

      {/* Modal de agradecimiento */}
      <Modal
        visible={showThankYouModal}
        animationType="fade"
        transparent={true}
      >
        <View style={[s.modalOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.7)' }]}>
          <View style={[s.thankYouModal, { 
            maxWidth: width * 0.85, 
            borderRadius: CARD_RADIUS,
            backgroundColor: colors.modalBackground,
            borderColor: colors.modalBorder 
          }]}>
            {/* Logo de Ocelon en lugar del ícono */}
            <View style={[s.modalIconContainer, { 
              backgroundColor: isDark ? 'rgba(66, 184, 131, 0.1)' : 'rgba(66, 184, 131, 0.05)',
              borderColor: colors.primary 
            }]}>
              <Image
                source={require('../../assets/images/Logo_ocelon.jpg')}
                style={[s.modalLogo, { width: ms(70), height: ms(70), borderRadius: ms(14) }]}
                resizeMode="cover"
              />
            </View>

            <Text style={[s.thankYouTitle, { 
              fontSize: ms(22),
              color: colors.text 
            }]}>
              {wasSkipped ? t('thanksForUsingOcelon') : t('thanksForRating')}
            </Text>

            <Text style={[s.thankYouText, { 
              fontSize: ms(14),
              color: colors.textSecondary 
            }]}>
              {wasSkipped
                ? t('seeYouSoon')
                : t('opinionHelpsImprove')
              }
            </Text>

            {/* Resumen rápido */}
            <View style={[s.modalSummary, { 
              backgroundColor: isDark ? '#1a1a1f' : '#f1f3f4' 
            }]}>
              <View style={s.modalSummaryRow}>
                <Text style={[s.modalSummaryLabel, { color: colors.textSecondary }]}>{t('parking')}:</Text>
                <Text style={[s.modalSummaryValue, { color: colors.text }]}>{data.parking}</Text>
              </View>
              <View style={s.modalSummaryRow}>
                <Text style={[s.modalSummaryLabel, { color: colors.textSecondary }]}>{t('totalPaid')}:</Text>
                <Text style={[s.modalSummaryValue, { color: colors.primary }]}>
                  ${amountInMXN.toFixed(2)} MXN
                </Text>
              </View>
              {!wasSkipped && rating > 0 && (
                <View style={s.modalSummaryRow}>
                  <Text style={[s.modalSummaryLabel, { color: colors.textSecondary }]}>{t('yourRating')}:</Text>
                  <View style={s.modalStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= rating ? "star" : "star-outline"}
                        size={ms(16)}
                        color={star <= rating ? colors.starFilled : colors.starEmpty}
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Botón centrado */}
            <View style={s.modalButtonContainer}>
              <TouchableOpacity
                style={[s.closeButton, { 
                  paddingVertical: vs(14), 
                  borderRadius: hs(12),
                  backgroundColor: colors.primary 
                }]}
                onPress={handleCloseThankYou}
                activeOpacity={0.8}
              >
                <Ionicons name="home" size={ms(18)} color="#0b0b0c" />
                <Text style={s.closeButtonText}>{t('backToHome')}</Text>
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

  // Header
  header: {
    alignItems: 'center',
  },
  logoContainer: {
    padding: 4,
    borderWidth: 2,
    marginBottom: 16,
  },
  logo: {
    borderWidth: 0,
  },
  title: {
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },

  // Session Card
  sessionCard: {
    width: '100%',
    borderWidth: 1,
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
  },
  sessionTitle: {
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
    fontSize: 13,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  referenceValue: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Rating Card
  ratingCard: {
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
  },
  ratingTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  ratingSubtitle: {
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
    fontSize: 11,
  },
  ratingLabelCenter: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Comment Card
  commentCard: {
    width: '100%',
    borderWidth: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  commentTitle: {
    fontWeight: '600',
  },
  commentSubtitle: {
    fontSize: 12,
  },
  commentInput: {
    borderWidth: 1,
    padding: 14,
    fontSize: 14,
  },

  // Buttons
  submitButton: {
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
    fontSize: 14,
    fontWeight: '500',
  },

  // Footer
  footer: {
    textAlign: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  thankYouModal: {
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#42b883', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
      android: { elevation: 10 },
    }),
  },
  modalIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
  },
  modalLogo: {
    borderWidth: 0,
  },
  thankYouTitle: {
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  thankYouText: {
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalSummary: {
    width: '100%',
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
    fontSize: 13,
  },
  modalSummaryValue: {
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