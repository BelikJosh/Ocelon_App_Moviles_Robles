// screens/ProfileScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import { useConfig } from '../contexts/ConfigContext';
import { useAuthState } from '../hooks/useAuthState';
import { RootStackParamList } from '../navegation/types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const BASE_W = 375;
const BASE_H = 812;

const ProfileScreen = ({ navigation }: Props) => {
  const { width, height } = useWindowDimensions();
  const { t, isDark } = useConfig();
  const { usuario, esInvitado } = useAuthState();

  // Escalas responsivas
  const hs = (size: number) => (width / BASE_W) * size;
  const vs = (size: number) => (height / BASE_H) * size;
  const ms = (size: number, factor = 0.5) => size + (hs(size) - size) * factor;

  // Colores dinámicos según el tema
  const colors = {
    background: isDark ? '#0b0b0c' : '#f8f9fa',
    card: isDark ? '#151518' : '#ffffff',
    text: isDark ? '#ffffff' : '#000000',
    textSecondary: isDark ? '#a0a0a0' : '#666666',
    border: isDark ? '#2a2a30' : '#e0e0e0',
    primary: '#42b883',
    secondary: isDark ? '#1b1b20' : '#f1f3f4',
  };

  // Tokens de diseño
  const PADDING = hs(20);
  const CARD_RADIUS = hs(16);
  const BUTTON_RADIUS = hs(12);

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleCreateAccount = () => {
    navigation.navigate('CrearUsuario');
  };

  // Si es invitado, mostrar pantalla de invitado
  if (esInvitado) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[styles.container, { padding: PADDING }]}>
          
          {/* Header */}
          <View style={[styles.header, { marginBottom: vs(24) }]}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={ms(24)} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.title, { 
              fontSize: ms(24),
              color: colors.text
            }]}>
              {t('myProfile')}
            </Text>
            <View style={{ width: ms(24) }} />
          </View>

          {/* User Info Section para Invitado */}
          <View style={[styles.userSection, { marginBottom: vs(32) }]}>
            <View style={[
              styles.userIconContainer,
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
              fontSize: ms(20),
              color: colors.text,
              marginTop: vs(12)
            }]}>
              {t('guest')}
            </Text>
            <Text style={[styles.userEmail, { 
              fontSize: ms(14),
              color: colors.textSecondary
            }]}>
              {t('noEmailSet')}
            </Text>
            
            <View style={[styles.guestBadge, { 
              backgroundColor: colors.primary + '20',
              paddingHorizontal: hs(12),
              paddingVertical: vs(4),
              borderRadius: hs(8),
              marginTop: vs(8)
            }]}>
              <Text style={[styles.guestBadgeText, { 
                fontSize: ms(12),
                color: colors.primary
              }]}>
                {t('guestAccount')}
              </Text>
            </View>
          </View>

          {/* Info Cards para Invitado */}
          <View style={[styles.infoContainer, { marginBottom: vs(24) }]}>
            {/* Información Personal */}
            <View style={[
              styles.infoCard,
              {
                borderRadius: CARD_RADIUS,
                padding: hs(20),
                backgroundColor: colors.card,
                marginBottom: vs(16),
              }
            ]}>
              <Text style={[styles.cardTitle, { 
                fontSize: ms(16),
                color: colors.text,
                marginBottom: vs(16)
              }]}>
                {t('personalInfo')}
              </Text>
              
              <InfoRow 
                label={t('fullName')} 
                value={t('guest')} 
                colors={colors}
                ms={ms}
              />
              <InfoRow 
                label={t('email')} 
                value={t('noEmailSet')} 
                colors={colors}
                ms={ms}
              />
              <InfoRow 
                label={t('phone')} 
                value={t('notSet')} 
                colors={colors}
                ms={ms}
              />
              <InfoRow 
                label={t('memberSince')} 
                value={new Date().toLocaleDateString()} 
                colors={colors}
                ms={ms}
              />
            </View>

            {/* Información de Cuenta */}
            <View style={[
              styles.infoCard,
              {
                borderRadius: CARD_RADIUS,
                padding: hs(20),
                backgroundColor: colors.card,
              }
            ]}>
              <Text style={[styles.cardTitle, { 
                fontSize: ms(16),
                color: colors.text,
                marginBottom: vs(16)
              }]}>
                {t('accountInfo')}
              </Text>
              
              <InfoRow 
                label={t('accountType')} 
                value={t('guestAccount')} 
                colors={colors}
                ms={ms}
              />
              <InfoRow 
                label={t('wallet')} 
                value={t('notAvailable')} 
                colors={colors}
                ms={ms}
              />
              <InfoRow 
                label={t('stays')} 
                value={'0'} 
                colors={colors}
                ms={ms}
              />
            </View>
          </View>

          {/* Botones para Invitado */}
          <View style={styles.buttonsContainer}>
            {/* Botón Iniciar Sesión */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  paddingVertical: vs(16),
                  borderRadius: BUTTON_RADIUS,
                  backgroundColor: colors.primary,
                  marginBottom: vs(12),
                }
              ]}
              onPress={handleLogin}
            >
              <Ionicons name="log-in" size={ms(20)} color="#ffffff" />
              <Text style={[styles.primaryButtonText, { 
                fontSize: ms(16),
                color: '#ffffff',
                marginLeft: hs(10)
              }]}>
                {t('login')}
              </Text>
            </TouchableOpacity>

            {/* Botón Crear Cuenta */}
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                {
                  paddingVertical: vs(16),
                  borderRadius: BUTTON_RADIUS,
                  backgroundColor: 'transparent',
                  borderColor: colors.primary,
                  borderWidth: 1,
                }
              ]}
              onPress={handleCreateAccount}
            >
              <Ionicons name="person-add" size={ms(20)} color={colors.primary} />
              <Text style={[styles.secondaryButtonText, { 
                fontSize: ms(16),
                color: colors.primary,
                marginLeft: hs(10)
              }]}>
                {t('createAccount')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Si es usuario registrado pero no hay datos
  if (!usuario) {
    return (
      <View style={[styles.container, { 
        padding: PADDING, 
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center'
      }]}>
        <Text style={{ color: colors.text, marginBottom: vs(16) }}>{t('noUserData')}</Text>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            {
              paddingVertical: vs(16),
              borderRadius: BUTTON_RADIUS,
              backgroundColor: colors.primary,
              paddingHorizontal: hs(24),
            }
          ]}
          onPress={handleLogin}
        >
          <Text style={[styles.primaryButtonText, { 
            fontSize: ms(16),
            color: '#ffffff',
          }]}>
            {t('login')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Si es usuario registrado con datos
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.container, { padding: PADDING }]}>
        
        {/* Header */}
        <View style={[styles.header, { marginBottom: vs(24) }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={ms(24)} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, { 
            fontSize: ms(24),
            color: colors.text
          }]}>
            {t('myProfile')}
          </Text>
          <TouchableOpacity 
            style={[styles.editButton, { 
              backgroundColor: colors.primary,
              borderRadius: hs(8),
              padding: hs(8)
            }]}
            onPress={handleEditProfile}
          >
            <Ionicons name="pencil" size={ms(18)} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* User Info Section para Usuario Registrado */}
        <View style={[styles.userSection, { marginBottom: vs(32) }]}>
          <View style={[
            styles.userIconContainer,
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
            fontSize: ms(20),
            color: colors.text,
            marginTop: vs(12)
          }]}>
            {usuario.nombre}
          </Text>
          <Text style={[styles.userEmail, { 
            fontSize: ms(14),
            color: colors.textSecondary
          }]}>
            {usuario.email}
          </Text>
        </View>

        {/* Info Cards para Usuario Registrado */}
        <View style={[styles.infoContainer, { marginBottom: vs(24) }]}>
          {/* Información Personal */}
          <View style={[
            styles.infoCard,
            {
              borderRadius: CARD_RADIUS,
              padding: hs(20),
              backgroundColor: colors.card,
              marginBottom: vs(16),
            }
          ]}>
            <Text style={[styles.cardTitle, { 
              fontSize: ms(16),
              color: colors.text,
              marginBottom: vs(16)
            }]}>
              {t('personalInfo')}
            </Text>
            
            <InfoRow 
              label={t('fullName')} 
              value={usuario.nombre} 
              colors={colors}
              ms={ms}
            />
            <InfoRow 
              label={t('email')} 
              value={usuario.email} 
              colors={colors}
              ms={ms}
            />
            <InfoRow 
              label={t('phone')} 
              value={usuario.telefono || t('notSet')} 
              colors={colors}
              ms={ms}
            />
            <InfoRow 
              label={t('memberSince')} 
              value={new Date(usuario.fechaRegistro).toLocaleDateString()} 
              colors={colors}
              ms={ms}
            />
          </View>

          {/* Información de Cuenta */}
          <View style={[
            styles.infoCard,
            {
              borderRadius: CARD_RADIUS,
              padding: hs(20),
              backgroundColor: colors.card,
            }
          ]}>
            <Text style={[styles.cardTitle, { 
              fontSize: ms(16),
              color: colors.text,
              marginBottom: vs(16)
            }]}>
              {t('accountInfo')}
            </Text>
            
            <InfoRow 
              label={t('accountType')} 
              value={t('registeredAccount')} 
              colors={colors}
              ms={ms}
            />
            <InfoRow 
              label={t('wallet')} 
              value={usuario.wallet} 
              colors={colors}
              ms={ms}
            />
            <InfoRow 
              label={t('stays')} 
              value={usuario.estancias?.length?.toString() || '0'} 
              colors={colors}
              ms={ms}
            />
          </View>
        </View>

        {/* Botón Editar Perfil (SOLO para usuarios registrados) */}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            {
              paddingVertical: vs(16),
              borderRadius: CARD_RADIUS,
              backgroundColor: colors.primary,
              marginBottom: vs(16),
            }
          ]}
          onPress={handleEditProfile}
        >
          <Ionicons name="pencil" size={ms(20)} color="#ffffff" />
          <Text style={[styles.primaryButtonText, { 
            fontSize: ms(16),
            color: '#ffffff',
            marginLeft: hs(10)
          }]}>
            {t('editProfile')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// Componente para mostrar filas de información
const InfoRow = ({ label, value, colors, ms }: any) => (
  <View style={styles.infoRow}>
    <Text style={[styles.infoLabel, { 
      fontSize: ms(14),
      color: colors.textSecondary
    }]}>
      {label}
    </Text>
    <Text style={[styles.infoValue, { 
      fontSize: ms(14),
      color: colors.text
    }]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontWeight: '700',
  },
  editButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userSection: {
    alignItems: 'center',
  },
  userIconContainer: {
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
  guestBadgeText: {
    fontWeight: '600',
  },
  infoContainer: {
    width: '100%',
  },
  infoCard: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  cardTitle: {
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontWeight: '500',
  },
  infoValue: {
    fontWeight: '600',
  },
  buttonsContainer: {
    width: '100%',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontWeight: '600',
  },
});

export default ProfileScreen;