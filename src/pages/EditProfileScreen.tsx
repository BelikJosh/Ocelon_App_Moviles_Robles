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

const EditProfileScreen = ({ navigation }: Props) => {
  const { width, height } = useWindowDimensions();
  const { t, isDark } = useConfig();
  const { usuario, esInvitado, refetch, logout, actualizarUsuarioLocal } = useAuthState();

  const hs = (size: number) => (width / BASE_W) * size;
  const vs = (size: number) => (height / BASE_H) * size;
  const ms = (size: number, factor = 0.5) => size + (hs(size) - size) * factor;

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

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
        errorMessage = 'Error en la base de datos: Campos duplicados. Contacta al administrador.';
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

  const PADDING = hs(20);
  const CARD_RADIUS = hs(18);
  const INPUT_RADIUS = hs(10);
  const INPUT_PADDING = hs(14);
  const ICON_SIZE = ms(22);

  if (!usuario && !esInvitado) {
    return (
      <View style={[styles.container, { 
        padding: PADDING, 
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center'
      }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: vs(16) }}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.container, { padding: PADDING, backgroundColor: colors.background }]}>
          
          {/* Header */}
          <View style={[styles.header, { marginBottom: vs(24) }]}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={ms(24)} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.title, { 
              fontSize: ms(26), 
              marginBottom: vs(12),
              color: colors.text 
            }]}>
              {t('editProfile')}
            </Text>
            <View style={{ width: ms(24) }} />
          </View>

          {/* Info del usuario - MOSTRANDO DATOS ACTUALIZADOS */}
          <View style={[styles.userInfo, { marginBottom: vs(24) }]}>
            <View style={[
              styles.userIcon,
              {
                width: hs(80),
                height: hs(80),
                borderRadius: hs(40),
                backgroundColor: colors.secondary,
                borderColor: colors.primary,
                borderWidth: 3,
              }
            ]}>
              <Ionicons name="person" size={ms(36)} color={colors.primary} />
            </View>
            <Text style={[styles.userName, { 
              fontSize: ms(18),
              color: colors.text,
              marginTop: vs(12)
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
                paddingHorizontal: hs(12),
                paddingVertical: vs(4),
                borderRadius: hs(8),
                marginTop: vs(8)
              }]}>
                <Text style={[styles.guestText, { 
                  fontSize: ms(12),
                  color: colors.primary
                }]}>
                  {t('guestAccount')}
                </Text>
              </View>
            )}
          </View>

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
              editable={!loading && esInvitado} // Solo invitados pueden cambiar email
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

            {/* Nueva Contraseña */}
            <Text style={[styles.label, { 
              fontSize: ms(13),
              color: colors.textSecondary 
            }]}>{t('newPassword')}</Text>
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
                style={[styles.eyeBtn, { right: hs(12), top: vs(12) }]}
                disabled={loading}
              >
                <Ionicons name={showPass ? 'eye-off' : 'eye'} size={ICON_SIZE} color={colors.placeholder} />
              </TouchableOpacity>
            </View>

            {/* Confirmar Contraseña */}
            {password ? (
              <>
                <Text style={[styles.label, { 
                  fontSize: ms(13),
                  color: colors.textSecondary 
                }]}>{t('confirmPassword')}</Text>
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
                    paddingVertical: vs(13), 
                    borderRadius: INPUT_RADIUS, 
                    marginTop: vs(8),
                    backgroundColor: colors.primary 
                  }
                ]}
                onPress={handleConvertToUser}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#0b0b0c" />
                ) : (
                  <Text style={[styles.primaryText, { fontSize: ms(16) }]}>{t('createAccount')}</Text>
                )}
              </TouchableOpacity>
            ) : (
              // Botón para guardar cambios (usuarios registrados)
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  loading && { opacity: 0.6 },
                  { 
                    paddingVertical: vs(13), 
                    borderRadius: INPUT_RADIUS, 
                    marginTop: vs(8),
                    backgroundColor: colors.primary 
                  }
                ]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#0b0b0c" />
                ) : (
                  <Text style={[styles.primaryText, { fontSize: ms(16) }]}>{t('saveChanges')}</Text>
                )}
              </TouchableOpacity>
            )}

            {/* Botón Cerrar Sesión */}
            <TouchableOpacity
              style={[
                styles.logoutBtn,
                { 
                  paddingVertical: vs(12), 
                  borderRadius: INPUT_RADIUS, 
                  marginTop: vs(12),
                  backgroundColor: 'transparent',
                  borderColor: colors.error,
                  borderWidth: 1,
                }
              ]}
              onPress={handleLogout}
              disabled={loading}
            >
              <Ionicons name="log-out-outline" size={ms(18)} color={colors.error} />
              <Text style={[styles.logoutText, { fontSize: ms(14), color: colors.error }]}>
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
    alignItems: 'center'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  backButton: {
    padding: 8,
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
    fontWeight: '600',
  },
  userEmail: {
    fontWeight: '400',
  },
  guestBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestText: {
    fontWeight: '600',
  },
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
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
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    fontWeight: '600',
  }
});

export default EditProfileScreen;