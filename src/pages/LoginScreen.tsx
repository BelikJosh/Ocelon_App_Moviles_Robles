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
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { useLogin } from '../hooks/useLogin';
import { RootStackParamList } from '../navegation/types/navigation';
import { DynamoDBService } from '../services/DynamoService';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const BASE_W = 375; // iPhone X width
const BASE_H = 812; // iPhone X height

const LoginScreen = ({ navigation }: Props) => {
  const { width, height } = useWindowDimensions();

  // escalas responsivas
  const hs = (size: number) => (width / BASE_W) * size;
  const vs = (size: number) => (height / BASE_H) * size;
  const ms = (size: number, factor = 0.5) => size + (hs(size) - size) * factor;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Estado para el modal de bienvenida
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeName, setWelcomeName] = useState('');
  
  const { loading, error, login, entrarComoInvitado, limpiarError } = useLogin();

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      limpiarError();
      DynamoDBService.diagnosticarPermisos();
    }
  }, [error, limpiarError]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return;
    }
    const resultado = await login(email, password);
    if (resultado.success) {
      // Mostrar modal de bienvenida con el nombre del usuario
      const nombreUsuario = resultado.usuario?.nombre || 'Usuario';
      setWelcomeName(nombreUsuario);
      setShowWelcomeModal(true);
    }
  };

  const handleGuestLogin = async () => {
    await entrarComoInvitado();
    // Mostrar modal de bienvenida para invitado
    setWelcomeName('Invitado');
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
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.container, { padding: PADDING }]}>
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
              borderColor: '#42b883',
            }}
          />

          {/* Títulos */}
          <View style={[styles.header, { marginBottom: vs(10) }]}>
            <Text style={[styles.welcomeText, { fontSize: ms(24), marginBottom: vs(0) }]}>
              Bienvenido a
            </Text>
            <Text style={[styles.appName, { fontSize: ms(32), marginTop: vs(-10) }]}>
              Ocelon
            </Text>
          </View>

          {/* Formulario */}
          <View style={[styles.formContainer, { marginBottom: vs(20), maxWidth: 500, alignSelf: 'stretch' }]}>
            <Text style={[styles.label, { fontSize: ms(16), marginBottom: vs(8) }]}>
              Correo electrónico
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  padding: INPUT_PADDING,
                  borderRadius: INPUT_RADIUS,
                  marginBottom: vs(20),
                  fontSize: ms(16),
                },
              ]}
              placeholder="Ingresa tu correo electrónico"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#7f8c8d"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />

            <Text style={[styles.label, { fontSize: ms(16), marginBottom: vs(8) }]}>
              Contraseña
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
                  },
                ]}
                placeholder="Ingresa tu contraseña"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#7f8c8d"
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />

              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                style={[styles.eyeButton, { right: EYE_RIGHT, top: EYE_TOP }]}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                disabled={loading}
              >
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={EYE_SIZE} color="#7f8c8d" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleCreateAccount} disabled={loading}>
              <Text
                style={[
                  styles.createAccountText,
                  { fontSize: ms(14), marginTop: vs(10), opacity: loading ? 0.5 : 1 },
                ]}
              >
                Crear cuenta
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleGuestLogin} disabled={loading}>
              <Text
                style={[
                  styles.guestText,
                  { fontSize: ms(14), marginTop: vs(10), opacity: loading ? 0.5 : 1 },
                ]}
              >
                Continuar como invitado
              </Text>
            </TouchableOpacity>
          </View>

          {/* Botón principal */}
          <TouchableOpacity
            style={[
              styles.mainButton,
              loading && styles.buttonDisabled,
              { padding: vs(15), borderRadius: INPUT_RADIUS, marginBottom: vs(5), maxWidth: 500, alignSelf: 'stretch' },
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.mainButtonText, { fontSize: ms(18) }]}>
                Iniciar sesión
              </Text>
            )}
          </TouchableOpacity>

          {/* Separador */}
          <View style={[styles.separator, { marginVertical: vs(20), maxWidth: 500, alignSelf: 'stretch' }]}>
            <View style={[styles.separatorLine, { height: vs(1) }]} />
            <Text style={[styles.separatorText, { fontSize: ms(14), marginHorizontal: hs(10) }]}>o</Text>
            <View style={[styles.separatorLine, { height: vs(1) }]} />
          </View>

          {/* Botón Google */}
          <TouchableOpacity
            style={[
              styles.googleButton,
              loading && styles.buttonDisabled,
              { padding: vs(12), borderRadius: INPUT_RADIUS, marginBottom: vs(20), maxWidth: 500, alignSelf: 'stretch' },
            ]}
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
              Iniciar sesión con Google
            </Text>
          </TouchableOpacity>

          {/* Legales */}
          <View style={[styles.legalLinks, { maxWidth: 500, alignSelf: 'stretch' }]}>
            <TouchableOpacity disabled={loading}>
              <Text style={[styles.legalText, { fontSize: ms(12), opacity: loading ? 0.5 : 1 }]}>
                Términos de servicio
              </Text>
            </TouchableOpacity>
            <Text style={[styles.legalSeparator, { fontSize: ms(12), marginHorizontal: hs(5) }]}>
              |
            </Text>
            <TouchableOpacity disabled={loading}>
              <Text style={[styles.legalText, { fontSize: ms(12), opacity: loading ? 0.5 : 1 }]}>
                Política de privacidad
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
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: width * 0.85, borderRadius: hs(20) }]}>
            {/* Decoración superior */}
            <View style={[styles.modalDecoration, { height: vs(6), borderRadius: hs(3) }]} />
            
            {/* Logo de Ocelon */}
            <View style={[styles.modalLogoContainer, { 
              width: hs(120), 
              height: hs(120), 
              borderRadius: hs(60),
              marginTop: vs(24),
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
            <Text style={[styles.modalWelcomeText, { fontSize: ms(16), marginTop: vs(20) }]}>
              Bienvenido
            </Text>
            <Text style={[styles.modalUserName, { fontSize: ms(28) }]}>
              {welcomeName}
            </Text>
            <Text style={[styles.modalToText, { fontSize: ms(16) }]}>
              a Ocelon
            </Text>

            {/* Línea decorativa */}
            <View style={[styles.modalDivider, { marginVertical: vs(20) }]} />

            {/* Slogan */}
            <View style={styles.sloganContainer}>
              <Text style={[styles.modalSlogan, { fontSize: ms(15), lineHeight: ms(24) }]}>
                Park with ease,{' '}
                <Text style={styles.sloganHighlight}>pay with speed</Text>,{'\n'}
                live a better life.
              </Text>
            </View>

            {/* Íconos de características */}
            <View style={[styles.featuresRow, { marginTop: vs(16), marginBottom: vs(24) }]}>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { width: hs(40), height: hs(40), borderRadius: hs(12) }]}>
                  <Ionicons name="car-outline" size={ms(20)} color="#42b883" />
                </View>
                <Text style={styles.featureText}>Fácil</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { width: hs(40), height: hs(40), borderRadius: hs(12) }]}>
                  <Ionicons name="flash-outline" size={ms(20)} color="#42b883" />
                </View>
                <Text style={styles.featureText}>Rápido</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { width: hs(40), height: hs(40), borderRadius: hs(12) }]}>
                  <Ionicons name="shield-checkmark-outline" size={ms(20)} color="#42b883" />
                </View>
                <Text style={styles.featureText}>Seguro</Text>
              </View>
            </View>

            {/* Botón de continuar */}
            <TouchableOpacity
              style={[styles.modalButton, { 
                paddingVertical: vs(16), 
                borderRadius: hs(14),
                marginBottom: vs(20),
              }]}
              onPress={handleWelcomeModalClose}
              activeOpacity={0.8}
            >
              <Text style={[styles.modalButtonText, { fontSize: ms(16) }]}>
                ¡Comenzar!
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
  container: { flex: 1, alignItems: 'center', backgroundColor: '#000000ff' },
  header: { alignItems: 'center' },
  welcomeText: { color: '#939ca5ff', fontWeight: '300' },
  appName: { color: '#64707cff', fontWeight: 'bold' },
  formContainer: { width: '100%' },
  label: { color: '#9ea0a3ff', fontWeight: '600' },
  input: {
    width: '100%',
    backgroundColor: '#1b1b20',
    color: '#d3dbe4ff',
    borderWidth: 1,
    borderColor: '#42b883',
  },
  eyeButton: {
    position: 'absolute',
    height: 28,
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createAccountText: { color: '#3498db', textAlign: 'center', fontWeight: '600' },
  guestText: { color: '#e9f0f0ff', textAlign: 'center', fontWeight: '500' },
  mainButton: { width: '100%', backgroundColor: '#42b883', alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { backgroundColor: '#ebf2f3ff' },
  mainButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
  separator: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  separatorLine: { flex: 1, backgroundColor: '#bdc3c7' },
  separatorText: { color: '#d7dedfff' },
  googleButton: {
    width: '100%',
    backgroundColor: '#42b883',
    borderWidth: 1,
    borderColor: '#bdc3c7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: { color: '#e3e7ebff', fontWeight: '500' },
  legalLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  legalText: { color: '#7f8c8d' },
  legalSeparator: { color: '#7f8c8d' },

  // Modal de Bienvenida
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#131318',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#42b883',
    width: '100%',
    overflow: 'hidden',
  },
  modalDecoration: {
    width: '100%',
    backgroundColor: '#42b883',
  },
  modalLogoContainer: {
    backgroundColor: 'rgba(66, 184, 131, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#42b883',
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
    color: '#9aa0a6',
    fontWeight: '500',
  },
  modalUserName: {
    color: '#42b883',
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 4,
  },
  modalToText: {
    color: '#9aa0a6',
    fontWeight: '500',
    marginTop: 4,
  },
  modalDivider: {
    width: '60%',
    height: 1,
    backgroundColor: '#2a2a30',
  },
  sloganContainer: {
    paddingHorizontal: 24,
  },
  modalSlogan: {
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sloganHighlight: {
    color: '#42b883',
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
    backgroundColor: 'rgba(66, 184, 131, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(66, 184, 131, 0.3)',
  },
  featureText: {
    color: '#9aa0a6',
    fontSize: 12,
    fontWeight: '500',
  },
  modalButton: {
    backgroundColor: '#42b883',
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