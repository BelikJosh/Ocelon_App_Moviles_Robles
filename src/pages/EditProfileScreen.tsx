// screens/EditProfileScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useConfig } from '../contexts/ConfigContext';
import { useAuthState } from '../hooks/useAuthState';
import { RootStackParamList } from '../navegation/types/navigation';
import { DynamoDBService } from '../services/DynamoService';
import { FirebaseService } from '../services/FirebaseService';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

// Base para calcular escalas (iPhone X)
const BASE_W = 375;
const BASE_H = 812;

// Definimos las escalas como funciones globales para que estén disponibles
const createScalers = (width: number, height: number) => ({
  hs: (size: number) => (width / BASE_W) * size,
  vs: (size: number) => (height / BASE_H) * size,
  ms: (size: number, factor = 0.5) => size + ((width / BASE_W) * size - size) * factor,
});

const EditProfileScreen = ({ navigation }: Props) => {
  const { width, height } = useWindowDimensions();
  const { t, isDark } = useConfig();
  const { usuario, esInvitado, refetch, logout, actualizarUsuarioLocal } = useAuthState();

  // Crear las funciones de escala
  const { hs, vs, ms } = createScalers(width, height);

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Tokens de diseño
  const PADDING = hs(20);
  const CARD_RADIUS = hs(18);
  const INPUT_RADIUS = hs(10);
  const INPUT_PADDING = hs(14);
  const AVATAR_SIZE = Math.min(hs(100), 140);
  const ICON_SIZE = ms(22);

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
    error: isDark ? '#ff6b6b' : '#d32f2f',
  };

  // Cargar datos del usuario
  useEffect(() => {
    if (usuario) {
      setNombre(usuario.nombre || '');
      setEmail(usuario.email || '');
      setTelefono(usuario.telefono || '');
    }
  }, [usuario]);

  const handleSave = async () => {
    if (!nombre || !email) {
      Alert.alert(t('error'), t('completeRequiredFields'));
      return;
    }

    // Validación simple de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('error'), t('validEmail'));
      return;
    }

    if (password && password !== confirmPassword) {
      Alert.alert(t('error'), t('passwordsDontMatch'));
      return;
    }

    if (password && password.length < 6) {
      Alert.alert(t('error'), t('passwordMinLength'));
      return;
    }

    setLoading(true);

    try {
      // Preparar datos para actualización
      const updateData: any = {
        nombre,
        email,
        telefono: telefono || null,
      };

      // Si hay nueva contraseña, incluirla
      if (password) {
        updateData.password = password;
      }

      console.log('🔄 Iniciando actualización de perfil...');
      console.log('📝 Datos a actualizar:', updateData);

      // 1. ACTUALIZAR EN DYNAMODB
      if (usuario?.id) {
        await DynamoDBService.actualizarCamposUsuario(usuario.id, updateData);
        console.log('✅ Perfil actualizado en DynamoDB');
      }

      // 2. ACTUALIZAR ESTADO LOCAL INMEDIATAMENTE
      if (usuario && actualizarUsuarioLocal) {
        const usuarioActualizado = {
          ...usuario,
          ...updateData,
          ultimaActualizacion: new Date().toISOString()
        };
        
        await actualizarUsuarioLocal(usuarioActualizado);
        console.log('✅ Estado local actualizado');
      }

      // 3. ACTUALIZAR EMAIL EN FIREBASE (si cambió el email)
      if (email !== usuario?.email && !esInvitado) {
        try {
          const currentUser = FirebaseService.getCurrentUser();
          if (currentUser) {
            console.log('ℹ️ Cambio de email detectado, se requiere reautenticación en Firebase');
          }
        } catch (firebaseError) {
          console.error('❌ Error al actualizar email en Firebase:', firebaseError);
        }
      }

      // 4. ACTUALIZAR CONTRASEÑA EN FIREBASE (si se cambió)
      if (password && !esInvitado) {
        try {
          const currentUser = FirebaseService.getCurrentUser();
          if (currentUser) {
            console.log('ℹ️ Cambio de contraseña detectado, se requiere reautenticación en Firebase');
          }
        } catch (firebaseError) {
          console.error('❌ Error al actualizar contraseña en Firebase:', firebaseError);
        }
      }

      // 5. RECARGAR DATOS COMPLETOS
      console.log('🔄 Recargando datos del usuario...');
      if (refetch) {
        await refetch();
        console.log('✅ Datos recargados desde el servidor');
      }
      
      Alert.alert(t('success'), t('profileUpdated'), [
        { 
          text: 'OK', 
          onPress: () => {
            // Limpiar campos de contraseña
            setPassword('');
            setConfirmPassword('');
            navigation.goBack();
          }
        }
      ]);
      
    } catch (error: any) {
      console.error('❌ Error al actualizar perfil:', error);
      
      // Manejo específico del error de DynamoDB
      let errorMessage = t('errorUpdatingProfile');
      if (error.message.includes('Two document paths overlap')) {
        errorMessage = t('databaseError');
      } else {
        errorMessage += ': ' + error.message;
      }
      
      Alert.alert(t('error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      t('confirmLogout'),
      t('logoutConfirmationMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('logout'), 
          style: 'destructive',
          onPress: async () => {
            try {
              // Cerrar sesión en Firebase
              await FirebaseService.signOut();
              console.log('✅ Sesión cerrada en Firebase');
              
              // Cerrar sesión en la app (limpiar AsyncStorage)
              if (logout) {
                await logout();
              }
              
              // Navegar al Login
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('❌ Error al cerrar sesión:', error);
              Alert.alert(t('error'), t('logoutError'));
            }
          }
        }
      ]
    );
  };

  // Función para convertir invitado a usuario registrado
  const handleConvertToUser = async () => {
    if (!nombre || !email || !password) {
      Alert.alert(t('error'), t('completeAllFields'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('error'), t('passwordsDontMatch'));
      return;
    }

    Alert.alert(
      t('createAccount'),
      t('convertGuestMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('createAccount'), 
          onPress: async () => {
            setLoading(true);
            try {
              // 1. CREAR USUARIO EN FIREBASE
              const firebaseResult = await FirebaseService.createUserWithEmail(email, password);
              
              if (!firebaseResult.success) {
                Alert.alert(t('error'), firebaseResult.error || t('errorCreatingAccount'));
                return;
              }

              // 2. CREAR USUARIO EN DYNAMODB
              const userData = {
                nombre,
                email,
                password,
                telefono: telefono || null,
                ultimaActualizacion: new Date().toISOString()
              };

              const nuevoUsuario = await DynamoDBService.crearUsuario(userData);
              
              // 3. TRANSFERIR DATOS DEL INVITADO (si existen)
              if (usuario?.estancias && usuario.estancias.length > 0) {
                console.log('🔄 Transfiriendo datos del invitado...');
                // Aquí iría la lógica para transferir estancias del invitado al nuevo usuario
              }

              console.log('✅ Cuenta creada exitosamente en Firebase y DynamoDB');
              
              // 4. ACTUALIZAR ESTADO LOCAL
              if (actualizarUsuarioLocal) {
                await actualizarUsuarioLocal(nuevoUsuario);
              }
              
              // 5. RECARGAR DATOS
              if (refetch) {
                await refetch();
              }

              Alert.alert(t('success'), t('accountCreated'), [
                { 
                  text: 'OK', 
                  onPress: () => {
                    setPassword('');
                    setConfirmPassword('');
                    navigation.goBack();
                  }
                }
              ]);
              
            } catch (error: any) {
              console.error('❌ Error al crear cuenta:', error);
              Alert.alert(t('error'), t('errorCreatingAccount') + ': ' + error.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (!usuario && !esInvitado) {
    return (
      <View style={[styles.container, { 
        padding: PADDING, 
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1
      }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ 
          color: colors.text, 
          marginTop: vs(16),
          fontSize: ms(16)
        }}>
          {t('loading')}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, { 
          padding: PADDING, 
          backgroundColor: colors.background,
          paddingTop: vs(20)
        }]}>
          
          {/* Header - SIN logo */}
          <View style={[styles.header, { marginBottom: vs(32) }]}>
            <TouchableOpacity 
              style={[styles.backButton, {
                padding: hs(8),
                borderRadius: hs(8),
                backgroundColor: colors.inputBackground
              }]}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={ms(22)} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.title, { 
              fontSize: ms(28),
              color: colors.text 
            }]}>
              {t('editProfile')}
            </Text>
            <View style={{ width: hs(40) }} />
          </View>

          {/* Info del usuario */}
          <View style={[styles.userInfo, { marginBottom: vs(40) }]}>
            <View style={[
              styles.userIcon,
              {
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                borderRadius: AVATAR_SIZE / 2,
                backgroundColor: colors.inputBackground,
                borderWidth: Math.max(2, hs(3)),
                borderColor: colors.primary,
                shadowColor: '#000',
                shadowOpacity: 0.3,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 8 },
                elevation: 12,
                marginBottom: vs(20),
              }
            ]}>
              <Ionicons name="person" size={ms(48)} color={colors.primary} />
            </View>
            
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.userName, { 
                fontSize: ms(24),
                color: colors.text,
                marginBottom: vs(4)
              }]}>
                {nombre || usuario?.nombre || t('guest')}
              </Text>
              
              <Text style={[styles.userEmail, { 
                fontSize: ms(14),
                color: colors.textSecondary 
              }]}>
                {email || usuario?.email || t('noEmailSet')}
              </Text>
              
              {esInvitado && (
                <View style={[styles.guestBadge, { 
                  backgroundColor: colors.primary + '20',
                  paddingHorizontal: hs(16),
                  paddingVertical: vs(6),
                  borderRadius: hs(20),
                  borderWidth: 1,
                  borderColor: colors.primary + '40',
                  marginTop: vs(12)
                }]}>
                  <Text style={[styles.guestText, { 
                    fontSize: ms(12),
                    color: colors.primary,
                    fontWeight: '700'
                  }]}>
                    {t('guestAccount').toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Card de formulario */}
          <View
            style={[
              styles.card,
              {
                borderRadius: CARD_RADIUS,
                padding: hs(24),
                maxWidth: 520,
                width: '100%',
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: '#000',
                shadowOpacity: 0.25,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
                elevation: 8,
                alignSelf: 'center',
              }
            ]}
          >
            {/* Nombre */}
            <Text style={[styles.label, { 
              fontSize: ms(13),
              color: colors.textSecondary,
              marginBottom: vs(6)
            }]}>{t('fullName')}</Text>
            <TextInput
              style={[
                styles.input,
                {
                  padding: INPUT_PADDING,
                  borderRadius: INPUT_RADIUS,
                  fontSize: ms(16),
                  marginBottom: vs(16),
                  backgroundColor: colors.inputBackground,
                  color: colors.text,
                  borderColor: colors.inputBorder,
                  borderWidth: 1,
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
              color: colors.textSecondary,
              marginBottom: vs(6)
            }]}>{t('email')}</Text>
            <TextInput
              style={[
                styles.input,
                {
                  padding: INPUT_PADDING,
                  borderRadius: INPUT_RADIUS,
                  fontSize: ms(16),
                  marginBottom: vs(16),
                  backgroundColor: colors.inputBackground,
                  color: colors.text,
                  borderColor: colors.inputBorder,
                  borderWidth: 1,
                }
              ]}
              placeholder={t('emailPlaceholder')}
              placeholderTextColor={colors.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!loading && esInvitado} // Solo invitados pueden cambiar email
            />

            {/* Teléfono */}
            <Text style={[styles.label, { 
              fontSize: ms(13),
              color: colors.textSecondary,
              marginBottom: vs(6)
            }]}>{t('phoneOptional')}</Text>
            <TextInput
              style={[
                styles.input,
                {
                  padding: INPUT_PADDING,
                  borderRadius: INPUT_RADIUS,
                  fontSize: ms(16),
                  marginBottom: vs(16),
                  backgroundColor: colors.inputBackground,
                  color: colors.text,
                  borderColor: colors.inputBorder,
                  borderWidth: 1,
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

            {/* Nueva Contraseña */}
            <Text style={[styles.label, { 
              fontSize: ms(13),
              color: colors.textSecondary,
              marginBottom: vs(6)
            }]}>{t('newPassword')}</Text>
            <View style={{ position: 'relative', marginBottom: vs(16) }}>
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
                    borderWidth: 1,
                  }
                ]}
                placeholder={t('newPasswordPlaceholder')}
                placeholderTextColor={colors.placeholder}
                secureTextEntry={!showPass}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPass((v) => !v)}
                style={[styles.eyeBtn, { 
                  right: hs(12), 
                  top: '50%',
                  marginTop: -14,
                }]}
                disabled={loading}
              >
                <Ionicons 
                  name={showPass ? 'eye-off' : 'eye'} 
                  size={ICON_SIZE} 
                  color={colors.placeholder} 
                />
              </TouchableOpacity>
            </View>

            {/* Confirmar Contraseña */}
            {password ? (
              <>
                <Text style={[styles.label, { 
                  fontSize: ms(13),
                  color: colors.textSecondary,
                  marginBottom: vs(6)
                }]}>{t('confirmPassword')}</Text>
                <View style={{ position: 'relative', marginBottom: vs(24) }}>
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
                        borderWidth: 1,
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
                    style={[styles.eyeBtn, { 
                      right: hs(12), 
                      top: '50%',
                      marginTop: -14,
                    }]}
                    disabled={loading}
                  >
                    <Ionicons 
                      name={showConfirm ? 'eye-off' : 'eye'} 
                      size={ICON_SIZE} 
                      color={colors.placeholder} 
                    />
                  </TouchableOpacity>
                </View>
              </>
            ) : null}

            {/* Botón Guardar / Crear Cuenta */}
            {esInvitado ? (
              // Botón para convertir invitado a usuario
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  loading && { opacity: 0.6 },
                  { 
                    paddingVertical: vs(16), 
                    borderRadius: INPUT_RADIUS, 
                    marginBottom: vs(16),
                    backgroundColor: colors.primary,
                    shadowColor: '#000',
                    shadowOpacity: 0.3,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 6,
                  }
                ]}
                onPress={handleConvertToUser}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#0b0b0c" />
                ) : (
                  <Text style={[styles.primaryText, { 
                    fontSize: ms(16),
                    fontWeight: '700'
                  }]}>
                    {t('createAccount')}
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              // Botón para guardar cambios (usuarios registrados)
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  loading && { opacity: 0.6 },
                  { 
                    paddingVertical: vs(16), 
                    borderRadius: INPUT_RADIUS, 
                    marginBottom: vs(16),
                    backgroundColor: colors.primary,
                    shadowColor: '#000',
                    shadowOpacity: 0.3,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 6,
                  }
                ]}
                onPress={handleSave}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#0b0b0c" />
                ) : (
                  <Text style={[styles.primaryText, { 
                    fontSize: ms(16),
                    fontWeight: '700'
                  }]}>
                    {t('saveChanges')}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {/* Botón Cerrar Sesión */}
            <TouchableOpacity
              style={[
                styles.logoutBtn,
                { 
                  paddingVertical: vs(16), 
                  borderRadius: INPUT_RADIUS, 
                  backgroundColor: 'transparent',
                  borderColor: colors.error,
                  borderWidth: 1,
                }
              ]}
              onPress={handleLogout}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={ms(20)} color={colors.error} />
              <Text style={[styles.logoutText, { 
                fontSize: ms(16), 
                color: colors.error,
                fontWeight: '600',
                marginLeft: hs(12)
              }]}>
                {esInvitado ? t('exitGuest') : t('logout')}
              </Text>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '800',
    textAlign: 'center',
    flex: 1,
  },
  userInfo: {
    alignItems: 'center',
    width: '100%',
  },
  userIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontWeight: '700',
    textAlign: 'center',
  },
  userEmail: {
    fontWeight: '400',
    textAlign: 'center',
  },
  guestBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestText: {
    fontWeight: '600',
  },
  card: {
    width: '100%',
  },
  label: {
    fontWeight: '500',
  },
  input: {
    width: '100%',
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
    justifyContent: 'center',
  },
  primaryText: {
    color: '#0b0b0c',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontWeight: '600',
  }
});

export default EditProfileScreen;