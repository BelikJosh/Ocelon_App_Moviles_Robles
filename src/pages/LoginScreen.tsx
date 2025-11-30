// screens/LoginScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { useLogin } from '../hooks/useLogin';
import { RootStackParamList } from '../navegation/types/navigation';
import { DynamoDBService } from '../services/DynamoService';
import * as AuthSession from 'expo-auth-session';
import { useConfig } from '../contexts/ConfigContext'; // Importa el hook

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const BASE_W = 375; // iPhone X width
const BASE_H = 812; // iPhone X height

const LoginScreen = ({ navigation }: Props) => {
  const { width, height } = useWindowDimensions();
  const { t, isDark } = useConfig(); // Usa el hook de configuración

  // escalas responsivas
  const hs = (size: number) => (width / BASE_W) * size;
  const vs = (size: number) => (height / BASE_H) * size;
  const ms = (size: number, factor = 0.5) => size + (hs(size) - size) * factor;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Colores dinámicos según el tema
  const colors = {
    background: isDark ? '#000000' : '#ffffff',
    card: isDark ? '#1b1b20' : '#f8f9fa',
    text: isDark ? '#ffffff' : '#000000',
    textSecondary: isDark ? '#9ea0a3' : '#666666',
    border: isDark ? '#42b883' : '#42b883',
    primary: '#42b883',
    secondary: isDark ? '#151518' : '#e8f5e9',
    placeholder: isDark ? '#7f8c8d' : '#999999',
    separator: isDark ? '#bdc3c7' : '#e0e0e0',
    separatorText: isDark ? '#d7dedf' : '#666666',
    modalBackground: isDark ? '#131318' : '#ffffff',
    modalText: isDark ? '#ffffff' : '#000000',
    modalSecondary: isDark ? '#9aa0a6' : '#666666',
  };

  const getRedirectUri = () => {
    const redirectUri = AuthSession.makeRedirectUri({
      useProxy: true,
    });
    
    console.log('🔗 REDIRECT URI CORRECTO:', redirectUri);
    
    Alert.alert(
      '🔗 Redirect URI para Google',
      `Copia y pega ESTE URI EXACTO:\n\n${redirectUri}\n\nEn Google Cloud Console`
    );
  };

  // Estado para el modal de bienvenida
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeName, setWelcomeName] = useState('');
  const [saveBiometric, setSaveBiometric] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'face' | 'biometric'>('biometric');
  
  const { 
    loading, 
    error, 
    login, 
    loginWithGoogle, 
    loginWithBiometrics, 
    canUseBiometrics, 
    entrarComoInvitado, 
    limpiarError 
  } = useLogin();

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const biometricInfo = await canUseBiometrics();
    setBiometricAvailable(biometricInfo.available);
    setBiometricEnabled(biometricInfo.enabled);
    if (biometricInfo.type) {
      setBiometricType(biometricInfo.type as 'fingerprint' | 'face' | 'biometric');
    }
  };

  useEffect(() => {
    if (error) {
      Alert.alert(t('error'), error);
      limpiarError();
      DynamoDBService.diagnosticarPermisos();
    }
  }, [error, limpiarError, t]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('error'), t('completeAllFields'));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('error'), t('validEmail'));
      return;
    }
    const resultado = await login(email, password, saveBiometric);
    if (resultado.success) {
      const nombreUsuario = resultado.usuario?.nombre || t('user');
      setWelcomeName(nombreUsuario);
      setShowWelcomeModal(true);
    }
  };

  // Función para login con Google
  const handleGoogleLogin = async () => {
    const resultado = await loginWithGoogle();
    if (resultado.success) {
      const nombreUsuario = resultado.usuario?.nombre || t('googleUser');
      setWelcomeName(nombreUsuario);
      setShowWelcomeModal(true);
    }
  };

  // Función para login con biometría
  const handleBiometricLogin = async () => {
    const resultado = await loginWithBiometrics();
    if (resultado.success) {
      const nombreUsuario = resultado.usuario?.nombre || t('user');
      setWelcomeName(nombreUsuario);
      setShowWelcomeModal(true);
    }
  };

  const handleGuestLogin = async () => {
    await entrarComoInvitado();
    // Mostrar modal de bienvenida para invitado
    setWelcomeName(t('guest'));
    setShowWelcomeModal(true);
  };

  const handleWelcomeModalClose = () => {
    setShowWelcomeModal(false);
    navigation.replace('AppTabs');
  };

  const handleCreateAccount = () => navigation.navigate('CrearUsuario');

  // tamaños dependientes de pantalla
  const PADDING = hs(20);
  const INPUT_RADIUS = hs(10);
  const INPUT_PADDING = hs(15);
  const EYE_SIZE = ms(22);
  const EYE_TOP = vs(12);
  const EYE_RIGHT = hs(12);
  const LOGO = Math.min(hs(160), 200);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.container, { padding: PADDING, backgroundColor: colors.background }]}>
          {/* Logo */}
          <Image
            source={require('../../assets/images/Logo_ocelon.jpg')}
            style={{
              width: LOGO,
              height: LOGO,
              borderRadius: hs(30),
              marginBottom: vs(15),
              marginTop: vs(30),
              resizeMode: 'cover',
              borderWidth: Math.max(1, hs(3)),
              borderColor: colors.primary,
            }}
          />

          {/* Títulos */}
          <View style={[styles.header, { marginBottom: vs(10) }]}>
            <Text style={[styles.welcomeText, { 
              fontSize: ms(24), 
              marginBottom: vs(0),
              color: colors.textSecondary 
            }]}>
              {t('welcomeTo')}
            </Text>
            <Text style={[styles.appName, { 
              fontSize: ms(32), 
              marginTop: vs(-10),
              color: colors.text 
            }]}>
              Ocelon
            </Text>
          </View>

          {/* Formulario */}
          <View style={[styles.formContainer, { marginBottom: vs(20), maxWidth: 500, alignSelf: 'stretch' }]}>
            <Text style={[styles.label, { 
              fontSize: ms(16), 
              marginBottom: vs(8),
              color: colors.textSecondary 
            }]}>
              {t('email')}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  padding: INPUT_PADDING,
                  borderRadius: INPUT_RADIUS,
                  marginBottom: vs(20),
                  fontSize: ms(16),
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder={t('enterEmail')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={colors.placeholder}
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />

            <Text style={[styles.label, { 
              fontSize: ms(16), 
              marginBottom: vs(8),
              color: colors.textSecondary 
            }]}>
              {t('password')}
            </Text>

            {/* Input con ojo */}
            <View style={{ position: 'relative' }}>
              <TextInput
                style={[
                  styles.input,
                  {
                    padding: INPUT_PADDING,
                    borderRadius: INPUT_RADIUS,
                    marginBottom: vs(10),
                    fontSize: ms(16),
                    paddingRight: hs(44), // espacio para el ojo
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder={t('enterPassword')}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={colors.placeholder}
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />

              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                style={[styles.eyeButton, { right: EYE_RIGHT, top: EYE_TOP }]}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? t('hidePassword') : t('showPassword')}
                disabled={loading}
              >
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={EYE_SIZE} color={colors.placeholder} />
              </TouchableOpacity>
            </View>

            <View style={styles.biometricContainer}>
              <Switch
                value={saveBiometric}
                onValueChange={setSaveBiometric}
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor={saveBiometric ? '#f4f3f4' : '#f4f3f4'}
                disabled={!biometricAvailable}
              />
              <Text style={[styles.biometricText, { color: colors.textSecondary }]}>
                {t('useBiometric')} {biometricType === 'face' ? t('faceRecognition') : biometricType === 'fingerprint' ? t('fingerprint') : t('biometrics')} {t('forFutureLogins')}
              </Text>
            </View>

            {biometricAvailable && biometricEnabled && (
              <TouchableOpacity
                style={[styles.biometricButton, loading && styles.buttonDisabled, { backgroundColor: colors.primary }]}
                onPress={handleBiometricLogin}
                disabled={loading}
              >
                <Ionicons 
                  name={biometricType === 'face' ? 'face-recognition' : 'finger-print'} 
                  size={ms(20)} 
                  color="#FFFFFF" 
                />
                <Text style={styles.biometricButtonText}>
                  {t('loginWith')} {biometricType === 'face' ? t('faceRecognition') : t('fingerprint')}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={handleCreateAccount} disabled={loading}>
              <Text
                style={[
                  styles.createAccountText,
                  { 
                    fontSize: ms(14), 
                    marginTop: vs(10), 
                    opacity: loading ? 0.5 : 1,
                    color: '#3498db'
                  },
                ]}
              >
                {t('createAccount')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleGuestLogin} disabled={loading}>
              <Text
                style={[
                  styles.guestText,
                  { 
                    fontSize: ms(14), 
                    marginTop: vs(10), 
                    opacity: loading ? 0.5 : 1,
                    color: colors.textSecondary 
                  },
                ]}
              >
                {t('continueAsGuest')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Botón principal */}
          <TouchableOpacity
            style={[
              styles.mainButton,
              loading && styles.buttonDisabled,
              { 
                padding: vs(15), 
                borderRadius: INPUT_RADIUS, 
                marginBottom: vs(5), 
                maxWidth: 500, 
                alignSelf: 'stretch',
                backgroundColor: colors.primary 
              },
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.mainButtonText, { fontSize: ms(18) }]}>
                {t('login')}
              </Text>
            )}
          </TouchableOpacity>

          {/* Separador */}
          <View style={[styles.separator, { marginVertical: vs(20), maxWidth: 500, alignSelf: 'stretch' }]}>
            <View style={[styles.separatorLine, { height: vs(1), backgroundColor: colors.separator }]} />
            <Text style={[styles.separatorText, { fontSize: ms(14), marginHorizontal: hs(10), color: colors.separatorText }]}>{t('or')}</Text>
            <View style={[styles.separatorLine, { height: vs(1), backgroundColor: colors.separator }]} />
          </View>

          {/* Botón Google */}
          <TouchableOpacity
            style={[
              styles.googleButton,
              loading && styles.buttonDisabled,
              { 
                padding: vs(12), 
                borderRadius: INPUT_RADIUS, 
                marginBottom: vs(20), 
                maxWidth: 500, 
                alignSelf: 'stretch',
                backgroundColor: colors.primary,
                borderColor: colors.border 
              },
            ]}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            <Image
              source={require('../../assets/images/Logo_Google.png')}
              style={{ width: ms(20), height: ms(20), resizeMode: 'contain' }}
            />
            <Text
              style={[
                styles.googleButtonText,
                { fontSize: ms(16), marginLeft: hs(10) },
              ]}
            >
              {t('loginWithGoogle')}
            </Text>
          </TouchableOpacity>

        

          {/* Legales */}
          <View style={[styles.legalLinks, { maxWidth: 500, alignSelf: 'stretch' }]}>
            <TouchableOpacity disabled={loading}>
              <Text style={[styles.legalText, { 
                fontSize: ms(12), 
                opacity: loading ? 0.5 : 1,
                color: colors.textSecondary 
              }]}>
                {t('termsOfService')}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.legalSeparator, { 
              fontSize: ms(12), 
              marginHorizontal: hs(5),
              color: colors.textSecondary 
            }]}>
              |
            </Text>
            <TouchableOpacity disabled={loading}>
              <Text style={[styles.legalText, { 
                fontSize: ms(12), 
                opacity: loading ? 0.5 : 1,
                color: colors.textSecondary 
              }]}>
                {t('privacyPolicy')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modal de Bienvenida */}
      <Modal
        visible={showWelcomeModal}
        animationType="fade"
        transparent={true}
        onRequestClose={handleWelcomeModalClose}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.92)' : 'rgba(0, 0, 0, 0.8)' }]}>
          <View style={[styles.modalContent, { 
            maxWidth: width * 0.85, 
            borderRadius: hs(20),
            backgroundColor: colors.modalBackground,
            borderColor: colors.primary 
          }]}>
            {/* Decoración superior */}
            <View style={[styles.modalDecoration, { height: vs(6), borderRadius: hs(3), backgroundColor: colors.primary }]} />
            
            {/* Logo de Ocelon */}
            <View style={[styles.modalLogoContainer, { 
              width: hs(120), 
              height: hs(120), 
              borderRadius: hs(60),
              marginTop: vs(24),
              backgroundColor: isDark ? 'rgba(66, 184, 131, 0.1)' : 'rgba(66, 184, 131, 0.05)',
              borderColor: colors.primary 
            }]}>
              <Image
                source={require('../../assets/images/Logo_ocelon.jpg')}
                style={[styles.modalLogo, { 
                  width: hs(100), 
                  height: hs(100), 
                  borderRadius: hs(20) 
                }]}
                resizeMode="cover"
              />
            </View>

            {/* Título de bienvenida */}
            <Text style={[styles.modalWelcomeText, { 
              fontSize: ms(16), 
              marginTop: vs(20),
              color: colors.modalSecondary 
            }]}>
              {t('welcome')}
            </Text>
            <Text style={[styles.modalUserName, { 
              fontSize: ms(28),
              color: colors.primary 
            }]}>
              {welcomeName}
            </Text>
            <Text style={[styles.modalToText, { 
              fontSize: ms(16),
              color: colors.modalSecondary 
            }]}>
              {t('toOcelon')}
            </Text>

            {/* Línea decorativa */}
            <View style={[styles.modalDivider, { marginVertical: vs(20), backgroundColor: isDark ? '#2a2a30' : '#e0e0e0' }]} />

            {/* Slogan */}
            <View style={styles.sloganContainer}>
              <Text style={[styles.modalSlogan, { 
                fontSize: ms(15), 
                lineHeight: ms(24),
                color: colors.modalText 
              }]}>
                {t('sloganPart1')}{' '}
                <Text style={styles.sloganHighlight}>{t('sloganPart2')}</Text>,{'\n'}
                {t('sloganPart3')}
              </Text>
            </View>

            {/* Íconos de características */}
            <View style={[styles.featuresRow, { marginTop: vs(16), marginBottom: vs(24) }]}>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { 
                  width: hs(40), 
                  height: hs(40), 
                  borderRadius: hs(12),
                  backgroundColor: isDark ? 'rgba(66, 184, 131, 0.15)' : 'rgba(66, 184, 131, 0.1)',
                  borderColor: isDark ? 'rgba(66, 184, 131, 0.3)' : 'rgba(66, 184, 131, 0.2)'
                }]}>
                  <Ionicons name="car-outline" size={ms(20)} color={colors.primary} />
                </View>
                <Text style={[styles.featureText, { color: colors.modalSecondary }]}>{t('easy')}</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { 
                  width: hs(40), 
                  height: hs(40), 
                  borderRadius: hs(12),
                  backgroundColor: isDark ? 'rgba(66, 184, 131, 0.15)' : 'rgba(66, 184, 131, 0.1)',
                  borderColor: isDark ? 'rgba(66, 184, 131, 0.3)' : 'rgba(66, 184, 131, 0.2)'
                }]}>
                  <Ionicons name="flash-outline" size={ms(20)} color={colors.primary} />
                </View>
                <Text style={[styles.featureText, { color: colors.modalSecondary }]}>{t('fast')}</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { 
                  width: hs(40), 
                  height: hs(40), 
                  borderRadius: hs(12),
                  backgroundColor: isDark ? 'rgba(66, 184, 131, 0.15)' : 'rgba(66, 184, 131, 0.1)',
                  borderColor: isDark ? 'rgba(66, 184, 131, 0.3)' : 'rgba(66, 184, 131, 0.2)'
                }]}>
                  <Ionicons name="shield-checkmark-outline" size={ms(20)} color={colors.primary} />
                </View>
                <Text style={[styles.featureText, { color: colors.modalSecondary }]}>{t('secure')}</Text>
              </View>
            </View>

            {/* Botón de continuar */}
            <TouchableOpacity
              style={[styles.modalButton, { 
                paddingVertical: vs(16), 
                borderRadius: hs(14),
                marginBottom: vs(20),
                backgroundColor: colors.primary 
              }]}
              onPress={handleWelcomeModalClose}
              activeOpacity={0.8}
            >
              <Text style={[styles.modalButtonText, { fontSize: ms(16) }]}>
                {t('getStarted')}
              </Text>
              <Ionicons name="arrow-forward" size={ms(20)} color="#0b0b0c" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  header: { alignItems: 'center' },
  welcomeText: { fontWeight: '300' },
  appName: { fontWeight: 'bold' },
  formContainer: { width: '100%' },
  label: { fontWeight: '600' },
  input: {
    width: '100%',
    borderWidth: 1,
  },
  eyeButton: {
    position: 'absolute',
    height: 28,
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createAccountText: { textAlign: 'center', fontWeight: '600' },
  guestText: { textAlign: 'center', fontWeight: '500' },
  mainButton: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { opacity: 0.7 },
  mainButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
  separator: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  separatorLine: { flex: 1 },
  separatorText: { },
  googleButton: {
    width: '100%',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: { color: '#FFFFFF', fontWeight: '500' },
  legalLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  legalText: { },
  legalSeparator: { },
  // En tu StyleSheet, añade:
  biometricContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  biometricText: {
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    maxWidth: 500,
    alignSelf: 'stretch',
  },
  biometricButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  // Modal de Bienvenida
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    alignItems: 'center',
    borderWidth: 1,
    width: '100%',
    overflow: 'hidden',
  },
  modalDecoration: {
    width: '100%',
  },
  modalLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    shadowColor: '#42b883',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  modalLogo: {
    borderWidth: 0,
  },
  modalWelcomeText: {
    fontWeight: '500',
  },
  modalUserName: {
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 4,
  },
  modalToText: {
    fontWeight: '500',
    marginTop: 4,
  },
  modalDivider: {
    width: '60%',
    height: 1,
  },
  sloganContainer: {
    paddingHorizontal: 24,
  },
  modalSlogan: {
    fontWeight: '600',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sloganHighlight: {
    fontWeight: '800',
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  featureItem: {
    alignItems: 'center',
    gap: 6,
  },
  featureIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '80%',
    shadowColor: '#42b883',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  modalButtonText: {
    color: '#0b0b0c',
    fontWeight: '800',
  },
});

export default LoginScreen;