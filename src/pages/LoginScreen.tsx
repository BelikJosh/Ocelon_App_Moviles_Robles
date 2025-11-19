// screens/LoginScreen.tsx (solo las partes modificadas)
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
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
  
  // 🔥 MODIFICADO: Ahora incluye entrarComoInvitado
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
      Alert.alert('¡Éxito!', 'Inicio de sesión exitoso');
      navigation.replace('AppTabs');
    }
  };

  // 🔥 MODIFICADO: Ahora usa entrarComoInvitado
  const handleGuestLogin = async () => {
    await entrarComoInvitado();
    navigation.replace('AppTabs');
  };

  const handleCreateAccount = () => navigation.navigate('CrearUsuario');

  // ... (el resto del código JSX permanece IGUAL)
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
    </KeyboardAvoidingView>
  );
};

// ... (los styles permanecen IGUALES)
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
});

export default LoginScreen;