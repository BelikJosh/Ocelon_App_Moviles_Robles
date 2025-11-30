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
import { useConfig } from '../contexts/ConfigContext'; // Importa el hook

type Props = NativeStackScreenProps<RootStackParamList, 'CrearUsuario'>;

// Base para calcular escalas (iPhone X)
const BASE_W = 375;
const BASE_H = 812;

const CrearUsuarioScreen = ({ navigation }: Props) => {
  const { width, height } = useWindowDimensions();
  const { t, isDark } = useConfig(); // Usa el hook de configuración

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

  // Colores dinámicos según el tema
  const colors = {
    background: isDark ? '#0b0b0c' : '#f8f9fa',
    card: isDark ? '#151518' : '#ffffff',
    text: isDark ? '#ffffff' : '#000000',
    textSecondary: isDark ? '#c9c9cf' : '#666666',
    inputBackground: isDark ? '#1b1b20' : '#f1f3f4',
    inputBorder: isDark ? '#2a2a30' : '#e0e0e0',
    placeholder: isDark ? '#8b8b95' : '#999999',
    primary: '#42b883',
    secondary: '#6C63FF',
  };

  useEffect(() => {
    if (error) {
      Alert.alert(t('error'), error);
      limpiarEstado();
    }
  }, [error, limpiarEstado, t]);

  useEffect(() => {
    if (success) {
      Alert.alert(t('success'), t('accountCreated'), [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    }
  }, [success, navigation, t]);

  const handleRegister = async () => {
    if (!nombre || !email || !password || !confirmPassword) {
      Alert.alert(t('error'), t('completeAllFields'));
      return;
    }

    // Validación simple de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('error'), t('validEmail'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('error'), t('passwordsDontMatch'));
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
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.container, { padding: PADDING, backgroundColor: colors.background }]}>
          {/* Logo superior */}
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
              borderColor: colors.primary
            }}
          />

          {/* Título */}
          <Text style={[styles.title, { 
            fontSize: ms(26), 
            marginBottom: vs(12),
            color: colors.text 
          }]}>
            {t('createAccount')}
          </Text>
          <Text style={[styles.subtitle, { 
            fontSize: ms(14), 
            marginBottom: vs(16),
            color: colors.textSecondary 
          }]}>
            {t('registerToStart')}
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
                width: '100%',
                backgroundColor: colors.card,
              }
            ]}
          >
            {/* Nombre */}
            <Text style={[styles.label, { 
              fontSize: ms(13),
              color: colors.textSecondary 
            }]}>{t('fullName')}</Text>
            <TextInput
              style={[
                styles.input,
                {
                  padding: INPUT_PADDING,
                  borderRadius: INPUT_RADIUS,
                  fontSize: ms(16),
                  marginBottom: vs(12),
                  backgroundColor: colors.inputBackground,
                  color: colors.text,
                  borderColor: colors.inputBorder,
                }
              ]}
              placeholder={t('fullNamePlaceholder')}
              placeholderTextColor={colors.placeholder}
              value={nombre}
              onChangeText={setNombre}
              editable={!loading}
            />

            {/* Email */}
            <Text style={[styles.label, { 
              fontSize: ms(13),
              color: colors.textSecondary 
            }]}>{t('email')}</Text>
            <TextInput
              style={[
                styles.input,
                {
                  padding: INPUT_PADDING,
                  borderRadius: INPUT_RADIUS,
                  fontSize: ms(16),
                  marginBottom: vs(12),
                  backgroundColor: colors.inputBackground,
                  color: colors.text,
                  borderColor: colors.inputBorder,
                }
              ]}
              placeholder={t('emailPlaceholder')}
              placeholderTextColor={colors.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />

            {/* Teléfono */}
            <Text style={[styles.label, { 
              fontSize: ms(13),
              color: colors.textSecondary 
            }]}>{t('phoneOptional')}</Text>
            <TextInput
              style={[
                styles.input,
                {
                  padding: INPUT_PADDING,
                  borderRadius: INPUT_RADIUS,
                  fontSize: ms(16),
                  marginBottom: vs(12),
                  backgroundColor: colors.inputBackground,
                  color: colors.text,
                  borderColor: colors.inputBorder,
                }
              ]}
              placeholder={t('phonePlaceholder')}
              placeholderTextColor={colors.placeholder}
              keyboardType="phone-pad"
              value={telefono}
              onChangeText={setTelefono}
              editable={!loading}
              maxLength={15}
            />

            {/* Contraseña */}
            <Text style={[styles.label, { 
              fontSize: ms(13),
              color: colors.textSecondary 
            }]}>{t('password')}</Text>
            <View style={{ position: 'relative', marginBottom: vs(12) }}>
              <TextInput
                style={[
                  styles.input,
                  {
                    padding: INPUT_PADDING,
                    borderRadius: INPUT_RADIUS,
                    fontSize: ms(16),
                    paddingRight: hs(44),
                    backgroundColor: colors.inputBackground,
                    color: colors.text,
                    borderColor: colors.inputBorder,
                  }
                ]}
                placeholder={t('passwordPlaceholder')}
                placeholderTextColor={colors.placeholder}
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
                <Ionicons name={showPass ? 'eye-off' : 'eye'} size={ICON_SIZE} color={colors.placeholder} />
              </TouchableOpacity>
            </View>

            {/* Confirmar contraseña */}
            <Text style={[styles.label, { 
              fontSize: ms(13),
              color: colors.textSecondary 
            }]}>{t('confirmPassword')}</Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={[
                  styles.input,
                  {
                    padding: INPUT_PADDING,
                    borderRadius: INPUT_RADIUS,
                    fontSize: ms(16),
                    paddingRight: hs(44),
                    backgroundColor: colors.inputBackground,
                    color: colors.text,
                    borderColor: colors.inputBorder,
                  }
                ]}
                placeholder={t('confirmPasswordPlaceholder')}
                placeholderTextColor={colors.placeholder}
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
                <Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={ICON_SIZE} color={colors.placeholder} />
              </TouchableOpacity>
            </View>

            {/* Botón Crear */}
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                loading && { opacity: 0.6 },
                { 
                  paddingVertical: vs(13), 
                  borderRadius: INPUT_RADIUS, 
                  marginTop: vs(16),
                  backgroundColor: colors.primary 
                }
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0b0b0c" />
              ) : (
                <Text style={[styles.primaryText, { fontSize: ms(16) }]}>{t('createAccount')}</Text>
              )}
            </TouchableOpacity>

            {/* Volver */}
            <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading} style={{ marginTop: vs(12) }}>
              <Text style={[styles.backText, { 
                fontSize: ms(14),
                color: colors.secondary 
              }]}>{t('backToLogin')}</Text>
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
    fontWeight: '800'
  },
  subtitle: {
  },
  card: {
    // sombra iOS
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    // sombra Android
    elevation: 8
  },
  label: {
    marginBottom: 6
  },
  input: {
    width: '100%',
    borderWidth: 1,
  },
  eyeBtn: {
    position: 'absolute',
    height: 28,
    width: 28,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryBtn: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryText: {
    color: '#0b0b0c',
    fontWeight: '800'
  },
  backText: {
    fontWeight: '600',
    textAlign: 'center'
  }
});

export default CrearUsuarioScreen;