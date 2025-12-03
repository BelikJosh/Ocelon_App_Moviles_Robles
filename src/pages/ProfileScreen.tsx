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

// Definimos las escalas como funciones globales para que estén disponibles
const createScalers = (width: number, height: number) => ({
  hs: (size: number) => (width / BASE_W) * size,
  vs: (size: number) => (height / BASE_H) * size,
  ms: (size: number, factor = 0.5) => size + ((width / BASE_W) * size - size) * factor,
});

// Componente InfoRow - Ahora definido afuera con sus props
interface InfoRowProps {
  label: string;
  value: string;
  colors: any;
  hs: (size: number) => number;
  vs: (size: number) => number;
  ms: (size: number, factor?: number) => number;
  icon: string;
}

const InfoRow = ({ label, value, colors, hs, vs, ms, icon }: InfoRowProps) => (
  <View style={[styles.infoRow, { marginBottom: vs(16) }]}>
    <View style={styles.infoLabelContainer}>
      <Ionicons 
        name={icon as any} 
        size={ms(16)} 
        color={colors.textSecondary} 
        style={{ marginRight: hs(10) }}
      />
      <Text style={[styles.infoLabel, { 
        fontSize: ms(14),
        color: colors.textSecondary,
        marginBottom: vs(4)
      }]}>
        {label}
      </Text>
    </View>
    <Text style={[styles.infoValue, { 
      fontSize: ms(14),
      color: colors.text,
      fontWeight: '600',
      textAlign: 'left',
      flexShrink: 1,
      flexWrap: 'wrap',
      paddingLeft: hs(26), // Para alinear con el ícono
    }]}>
      {value}
    </Text>
  </View>
);

const ProfileScreen = ({ navigation }: Props) => {
  const { width, height } = useWindowDimensions();
  const { t, isDark } = useConfig();
  const { usuario, esInvitado } = useAuthState();

  // Crear las funciones de escala
  const { hs, vs, ms } = createScalers(width, height);

  // Tokens de diseño
  const PADDING = hs(20);
  const CARD_RADIUS = hs(18);
  const BUTTON_RADIUS = hs(12);
  const AVATAR_SIZE = Math.min(hs(100), 140);

  // Colores dinámicos según el tema
  const colors = {
    background: isDark ? '#0b0b0c' : '#f8f9fa',
    card: isDark ? '#151518' : '#ffffff',
    text: isDark ? '#ffffff' : '#000000',
    textSecondary: isDark ? '#c9c9cf' : '#666666',
    border: isDark ? '#2a2a30' : '#e0e0e0',
    primary: '#42b883',
    secondary: '#6C63FF',
    inputBackground: isDark ? '#1b1b20' : '#f1f3f4',
    placeholder: isDark ? '#8b8b95' : '#999999',
  };

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
      <ScrollView 
        style={{ flex: 1, backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, { padding: PADDING }]}>
          
          {/* Header - SIN logo */}
          <View style={[styles.header, { 
            marginBottom: vs(32),
            paddingTop: vs(20)
          }]}>
            <View style={styles.headerContent}>
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
                {t('myProfile')}
              </Text>
              
              <View style={{ width: hs(40) }} />
            </View>
          </View>

          {/* User Info Section para Invitado */}
          <View style={[styles.userSection, { 
            marginBottom: vs(40),
            alignItems: 'center'
          }]}>
            <View style={[
              styles.avatarContainer,
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
                alignItems: 'center',
                justifyContent: 'center'
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
                {t('guest')}
              </Text>
              
              <Text style={[styles.userEmail, { 
                fontSize: ms(14),
                color: colors.textSecondary,
                marginBottom: vs(12)
              }]}>
                {t('noEmailSet')}
              </Text>
              
              <View style={[styles.guestBadge, { 
                backgroundColor: colors.primary + '20',
                paddingHorizontal: hs(16),
                paddingVertical: vs(6),
                borderRadius: hs(20),
                borderWidth: 1,
                borderColor: colors.primary + '40'
              }]}>
                <Text style={[styles.guestBadgeText, { 
                  fontSize: ms(12),
                  color: colors.primary,
                  fontWeight: '700'
                }]}>
                  {t('guestAccount').toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* Info Cards para Invitado */}
          <View style={[styles.infoContainer, { marginBottom: vs(32) }]}>
            {/* Información Personal */}
            <View style={[
              styles.infoCard,
              {
                borderRadius: CARD_RADIUS,
                padding: hs(24),
                backgroundColor: colors.card,
                marginBottom: vs(20),
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: '#000',
                shadowOpacity: 0.25,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
                elevation: 8,
              }
            ]}>
              <View style={[styles.cardHeader, { marginBottom: vs(20) }]}>
                <Ionicons name="person-circle-outline" size={ms(22)} color={colors.primary} />
                <Text style={[styles.cardTitle, { 
                  fontSize: ms(18),
                  color: colors.text,
                  marginLeft: hs(10)
                }]}>
                  {t('personalInfo')}
                </Text>
              </View>
              
              <InfoRow 
                label={t('fullName')} 
                value={t('guest')} 
                colors={colors}
                hs={hs}
                vs={vs}
                ms={ms}
                icon="person-outline"
              />
              <InfoRow 
                label={t('email')} 
                value={t('noEmailSet')} 
                colors={colors}
                hs={hs}
                vs={vs}
                ms={ms}
                icon="mail-outline"
              />
              <InfoRow 
                label={t('phone')} 
                value={t('notSet')} 
                colors={colors}
                hs={hs}
                vs={vs}
                ms={ms}
                icon="call-outline"
              />
              <InfoRow 
                label={t('memberSince')} 
                value={new Date().toLocaleDateString()} 
                colors={colors}
                hs={hs}
                vs={vs}
                ms={ms}
                icon="calendar-outline"
              />
            </View>

            {/* Información de Cuenta */}
            <View style={[
              styles.infoCard,
              {
                borderRadius: CARD_RADIUS,
                padding: hs(24),
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: '#000',
                shadowOpacity: 0.25,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
                elevation: 8,
              }
            ]}>
              <View style={[styles.cardHeader, { marginBottom: vs(20) }]}>
                <Ionicons name="card-outline" size={ms(22)} color={colors.secondary} />
                <Text style={[styles.cardTitle, { 
                  fontSize: ms(18),
                  color: colors.text,
                  marginLeft: hs(10)
                }]}>
                  {t('accountInfo')}
                </Text>
              </View>
              
              <InfoRow 
                label={t('accountType')} 
                value={t('guestAccount')} 
                colors={colors}
                hs={hs}
                vs={vs}
                ms={ms}
                icon="star-outline"
              />
              <InfoRow 
                label={t('wallet')} 
                value={t('notAvailable')} 
                colors={colors}
                hs={hs}
                vs={vs}
                ms={ms}
                icon="wallet-outline"
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
                  marginBottom: vs(16),
                  shadowColor: '#000',
                  shadowOpacity: 0.3,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 6,
                }
              ]}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <Ionicons name="log-in" size={ms(22)} color="#ffffff" />
              <Text style={[styles.primaryButtonText, { 
                fontSize: ms(16),
                color: '#ffffff',
                marginLeft: hs(12)
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
              activeOpacity={0.8}
            >
              <Ionicons name="person-add" size={ms(22)} color={colors.primary} />
              <Text style={[styles.secondaryButtonText, { 
                fontSize: ms(16),
                color: colors.primary,
                marginLeft: hs(12)
              }]}>
                {t('createAccount')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={[styles.footer, { 
            fontSize: ms(12), 
            marginTop: vs(32),
            color: colors.textSecondary,
            textAlign: 'center'
          }]}>
            © {new Date().getFullYear()} Ocelon — {t('allRightsReserved')}
          </Text>
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
        alignItems: 'center',
        flex: 1
      }]}>
        {/* Avatar grande en lugar del logo */}
        <View style={[
          styles.avatarContainer,
          {
            width: hs(120),
            height: hs(120),
            borderRadius: hs(60),
            backgroundColor: colors.inputBackground,
            borderWidth: Math.max(2, hs(3)),
            borderColor: colors.primary,
            marginBottom: vs(24),
            alignItems: 'center',
            justifyContent: 'center'
          }
        ]}>
          <Ionicons name="person" size={ms(48)} color={colors.primary} />
        </View>
        
        <Text style={[styles.noDataText, { 
          fontSize: ms(16),
          color: colors.textSecondary,
          marginBottom: vs(32),
          textAlign: 'center'
        }]}>{t('noUserData')}</Text>
        
        <TouchableOpacity
          style={[
            styles.primaryButton,
            {
              paddingVertical: vs(16),
              borderRadius: BUTTON_RADIUS,
              backgroundColor: colors.primary,
              paddingHorizontal: hs(32),
              shadowColor: '#000',
              shadowOpacity: 0.3,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 6,
            }
          ]}
          onPress={handleLogin}
          activeOpacity={0.8}
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
      </View>
    );
  }

  // Si es usuario registrado con datos
  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.container, { padding: PADDING }]}>
        
        {/* Header - SIN logo */}
        <View style={[styles.header, { 
          marginBottom: vs(32),
          paddingTop: vs(20)
        }]}>
          <View style={styles.headerContent}>
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
              {t('myProfile')}
            </Text>
            
            {/* Espacio en lugar del botón de editar */}
            <View style={{ width: hs(40) }} />
          </View>
        </View>

        {/* User Info Section para Usuario Registrado */}
        <View style={[styles.userSection, { 
          marginBottom: vs(40),
          alignItems: 'center'
        }]}>
          <View style={[
            styles.avatarContainer,
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
              alignItems: 'center',
              justifyContent: 'center'
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
              {usuario.nombre}
            </Text>
            
            <Text style={[styles.userEmail, { 
              fontSize: ms(14),
              color: colors.textSecondary,
              marginBottom: vs(12)
            }]}>
              {usuario.email}
            </Text>
            
            <View style={[styles.userBadge, { 
              backgroundColor: colors.secondary + '20',
              paddingHorizontal: hs(16),
              paddingVertical: vs(6),
              borderRadius: hs(20),
              borderWidth: 1,
              borderColor: colors.secondary + '40'
            }]}>
              <Text style={[styles.userBadgeText, { 
                fontSize: ms(12),
                color: colors.secondary,
                fontWeight: '700'
              }]}>
                {t('registeredAccount').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Info Cards para Usuario Registrado */}
        <View style={[styles.infoContainer, { marginBottom: vs(32) }]}>
          {/* Información Personal */}
          <View style={[
            styles.infoCard,
            {
              borderRadius: CARD_RADIUS,
              padding: hs(24),
              backgroundColor: colors.card,
              marginBottom: vs(20),
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: '#000',
              shadowOpacity: 0.25,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 8,
            }
          ]}>
            <View style={[styles.cardHeader, { marginBottom: vs(20) }]}>
              <Ionicons name="person-circle-outline" size={ms(22)} color={colors.primary} />
              <Text style={[styles.cardTitle, { 
                fontSize: ms(18),
                color: colors.text,
                marginLeft: hs(10)
              }]}>
                {t('personalInfo')}
              </Text>
            </View>
            
            <InfoRow 
              label={t('fullName')} 
              value={usuario.nombre} 
              colors={colors}
              hs={hs}
              vs={vs}
              ms={ms}
              icon="person-outline"
            />
            <InfoRow 
              label={t('email')} 
              value={usuario.email} 
              colors={colors}
              hs={hs}
              vs={vs}
              ms={ms}
              icon="mail-outline"
            />
            <InfoRow 
              label={t('phone')} 
              value={usuario.telefono || t('notSet')} 
              colors={colors}
              hs={hs}
              vs={vs}
              ms={ms}
              icon="call-outline"
            />
            <InfoRow 
              label={t('memberSince')} 
              value={new Date(usuario.fechaRegistro).toLocaleDateString()} 
              colors={colors}
              hs={hs}
              vs={vs}
              ms={ms}
              icon="calendar-outline"
            />
          </View>

          {/* Información de Cuenta */}
          <View style={[
            styles.infoCard,
            {
              borderRadius: CARD_RADIUS,
              padding: hs(24),
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: '#000',
              shadowOpacity: 0.25,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 8,
            }
          ]}>
            <View style={[styles.cardHeader, { marginBottom: vs(20) }]}>
              <Ionicons name="card-outline" size={ms(22)} color={colors.secondary} />
              <Text style={[styles.cardTitle, { 
                fontSize: ms(18),
                color: colors.text,
                marginLeft: hs(10)
              }]}>
                {t('accountInfo')}
              </Text>
            </View>
            
            <InfoRow 
              label={t('accountType')} 
              value={t('registeredAccount')} 
              colors={colors}
              hs={hs}
              vs={vs}
              ms={ms}
              icon="star-outline"
            />
            <InfoRow 
              label={t('wallet')} 
              value={`$${usuario.wallet || '0'}`} 
              colors={colors}
              hs={hs}
              vs={vs}
              ms={ms}
              icon="wallet-outline"
            />
          </View>
        </View>

        {/* Botón Editar Perfil */}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            {
              paddingVertical: vs(16),
              borderRadius: BUTTON_RADIUS,
              backgroundColor: colors.primary,
              marginBottom: vs(16),
              shadowColor: '#000',
              shadowOpacity: 0.3,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 6,
            }
          ]}
          onPress={handleEditProfile}
          activeOpacity={0.8}
        >
          <Ionicons name="pencil" size={ms(22)} color="#ffffff" />
          <Text style={[styles.primaryButtonText, { 
            fontSize: ms(16),
            color: '#ffffff',
            marginLeft: hs(12)
          }]}>
            {t('editProfile')}
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={[styles.footer, { 
          fontSize: ms(12), 
          marginTop: vs(24),
          color: colors.textSecondary,
          textAlign: 'center'
        }]}>
          © {new Date().getFullYear()} Ocelon — {t('allRightsReserved')}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    width: '100%',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  editButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userSection: {
    width: '100%',
  },
  avatarContainer: {
    alignSelf: 'center',
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
  guestBadgeText: {
    fontWeight: '700',
  },
  userBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userBadgeText: {
    fontWeight: '700',
  },
  infoContainer: {
    width: '100%',
  },
  infoCard: {
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
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
  footer: {
    fontWeight: '400',
  },
  noDataText: {
    fontWeight: '500',
  },
});

export default ProfileScreen;
//Se logró