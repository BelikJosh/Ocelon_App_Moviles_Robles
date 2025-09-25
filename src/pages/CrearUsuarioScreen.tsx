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
import { useRegistro } from '../hooks/useRegistro';
import { RootStackParamList } from '../navegation/types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'CrearUsuario'>;

// Base para calcular escalas (iPhone X)
const BASE_W = 375;
const BASE_H = 812;

const CrearUsuarioScreen = ({ navigation }: Props) => {
  const { width, height } = useWindowDimensions();
  const hs = (size: number) => (width / BASE_W) * size;                    // horizontal scale
  const vs = (size: number) => (height / BASE_H) * size;                   // vertical scale
  const ms = (size: number, factor = 0.5) => size + (hs(size) - size) * factor; // moderate scale

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { loading, error, success, registrarUsuario, limpiarEstado } = useRegistro();

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      limpiarEstado();
    }
  }, [error, limpiarEstado]);

  useEffect(() => {
    if (success) {
      Alert.alert('Éxito', 'Cuenta creada correctamente en DynamoDB', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    }
  }, [success, navigation]);

  const handleRegister = async () => {
    if (!nombre || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    // Validación simple de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    try {
      await registrarUsuario({
        nombre,
        email,
        password,
        telefono: telefono || undefined
      });
    } catch {
      // se maneja en useEffect
    }
  };

  const PADDING = hs(20);
  const CARD_RADIUS = hs(18);
  const INPUT_RADIUS = hs(10);
  const INPUT_PADDING = hs(14);
  const LOGO = Math.min(hs(120), 160);
  const ICON_SIZE = ms(22);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0b0b0c' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.container, { padding: PADDING }]}>
          {/* Logo superior (tal como pediste) */}
          <Image
            source={require('../../assets/images/Logo_ocelon.jpg')}
            style={{
              width: LOGO,
              height: LOGO,
              borderRadius: hs(30),
              marginBottom: vs(8),
              marginTop: vs(28),
              resizeMode: 'cover',
              borderWidth: Math.max(1, hs(3)),
              borderColor: '#42b883'
            }}
          />

          {/* Título */}
          <Text style={[styles.title, { fontSize: ms(26), marginBottom: vs(12) }]}>
            Crear Cuenta
          </Text>
          <Text style={[styles.subtitle, { fontSize: ms(14), marginBottom: vs(16) }]}>
            Regístrate para empezar a usar Ocelon
          </Text>

          {/* Card de formulario */}
          <View
            style={[
              styles.card,
              {
                borderRadius: CARD_RADIUS,
                padding: hs(16),
                paddingBottom: hs(18),
                maxWidth: 520,
                width: '100%'
              }
            ]}
          >
            {/* Nombre */}
            <Text style={[styles.label, { fontSize: ms(13) }]}>Nombre completo</Text>
            <TextInput
              style={[
                styles.input,
                {
                  padding: INPUT_PADDING,
                  borderRadius: INPUT_RADIUS,
                  fontSize: ms(16),
                  marginBottom: vs(12)
                }
              ]}
              placeholder="Nombre completo"
              placeholderTextColor="#8b8b95"
              value={nombre}
              onChangeText={setNombre}
              editable={!loading}
            />

            {/* Email */}
            <Text style={[styles.label, { fontSize: ms(13) }]}>Correo electrónico</Text>
            <TextInput
              style={[
                styles.input,
                {
                  padding: INPUT_PADDING,
                  borderRadius: INPUT_RADIUS,
                  fontSize: ms(16),
                  marginBottom: vs(12)
                }
              ]}
              placeholder="correo@ejemplo.com"
              placeholderTextColor="#8b8b95"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />

            {/* Teléfono */}
            <Text style={[styles.label, { fontSize: ms(13) }]}>Teléfono (opcional)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  padding: INPUT_PADDING,
                  borderRadius: INPUT_RADIUS,
                  fontSize: ms(16),
                  marginBottom: vs(12)
                }
              ]}
              placeholder="10 dígitos"
              placeholderTextColor="#8b8b95"
              keyboardType="phone-pad"
              value={telefono}
              onChangeText={setTelefono}
              editable={!loading}
              maxLength={15}
            />

            {/* Contraseña */}
            <Text style={[styles.label, { fontSize: ms(13) }]}>Contraseña</Text>
            <View style={{ position: 'relative', marginBottom: vs(12) }}>
              <TextInput
                style={[
                  styles.input,
                  {
                    padding: INPUT_PADDING,
                    borderRadius: INPUT_RADIUS,
                    fontSize: ms(16),
                    paddingRight: hs(44)
                  }
                ]}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#8b8b95"
                secureTextEntry={!showPass}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPass((v) => !v)}
                style={[styles.eyeBtn, { right: hs(12), top: vs(12) }]}
                disabled={loading}
              >
                <Ionicons name={showPass ? 'eye-off' : 'eye'} size={ICON_SIZE} color="#9aa0a6" />
              </TouchableOpacity>
            </View>

            {/* Confirmar contraseña */}
            <Text style={[styles.label, { fontSize: ms(13) }]}>Confirmar contraseña</Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={[
                  styles.input,
                  {
                    padding: INPUT_PADDING,
                    borderRadius: INPUT_RADIUS,
                    fontSize: ms(16),
                    paddingRight: hs(44)
                  }
                ]}
                placeholder="Repite tu contraseña"
                placeholderTextColor="#8b8b95"
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirm((v) => !v)}
                style={[styles.eyeBtn, { right: hs(12), top: vs(12) }]}
                disabled={loading}
              >
                <Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={ICON_SIZE} color="#9aa0a6" />
              </TouchableOpacity>
            </View>

            {/* Botón Crear */}
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                loading && { opacity: 0.6 },
                { paddingVertical: vs(13), borderRadius: INPUT_RADIUS, marginTop: vs(16) }
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0b0b0c" />
              ) : (
                <Text style={[styles.primaryText, { fontSize: ms(16) }]}>Crear Cuenta</Text>
              )}
            </TouchableOpacity>

            {/* Volver */}
            <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading} style={{ marginTop: vs(12) }}>
              <Text style={[styles.backText, { fontSize: ms(14) }]}>Volver al login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center'
  },
  title: {
    color: '#ffffff',
    fontWeight: '800'
  },
  subtitle: {
    color: '#c9c9cf'
  },
  card: {
    backgroundColor: '#151518',
    // sombra iOS
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    // sombra Android
    elevation: 8
  },
  label: {
    color: '#a0a0a8',
    marginBottom: 6
  },
  input: {
    width: '100%',
    backgroundColor: '#1b1b20',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2a2a30'
  },
  eyeBtn: {
    position: 'absolute',
    height: 28,
    width: 28,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryBtn: {
    backgroundColor: '#42b883',
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryText: {
    color: '#0b0b0c',
    fontWeight: '800'
  },
  backText: {
    color: '#6C63FF',
    fontWeight: '600',
    textAlign: 'center'
  }
});

export default CrearUsuarioScreen;
