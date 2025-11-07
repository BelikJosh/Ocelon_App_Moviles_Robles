import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import { RootStackParamList } from '../navegation/types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'IniciarSesion'>;

const BASE_W = 375;
const BASE_H = 812;

const IniciarSesionScreen = ({ navigation }: Props) => {
  const { width, height } = useWindowDimensions();

  // Escalas responsivas
  const hs = (size: number) => (width / BASE_W) * size;
  const vs = (size: number) => (height / BASE_H) * size;
  const ms = (size: number, factor = 0.5) => size + (hs(size) - size) * factor;

  const PADDING = hs(20);
  const LOGO = Math.min(hs(140), 180);
  const CARD_RADIUS = hs(18);
  const ICON_SIZE = ms(24);

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleCreateAccount = () => {
    navigation.navigate('CrearUsuario');
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header con botón de volver - Fuera del ScrollView para posición fija */}
      <TouchableOpacity 
        style={[styles.backButton, { top: vs(40), left: hs(20) }]} 
        onPress={handleGoBack}
      >
        <Ionicons name="arrow-back" size={ICON_SIZE} color="#42b883" />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { padding: PADDING, paddingTop: vs(80) } // paddingTop para dar espacio al botón de volver
        ]}
        showsVerticalScrollIndicator={false}
        bounces={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <Image
          source={require('../../assets/images/Logo_ocelon.jpg')}
          style={{
            width: LOGO,
            height: LOGO,
            borderRadius: hs(30),
            marginBottom: vs(20),
            marginTop: vs(10), // Reducido porque el paddingTop ya da espacio
            resizeMode: 'cover',
            borderWidth: Math.max(1, hs(3)),
            borderColor: '#42b883'
          }}
        />

        {/* Icono de usuario grande */}
        <View style={[styles.userIconContainer, { marginBottom: vs(24) }]}>
          <Ionicons name="person-circle-outline" size={hs(80)} color="#42b883" />
        </View>

        {/* Título principal */}
        <Text style={[styles.title, { fontSize: ms(28), marginBottom: vs(12) }]}>
          Inicia Sesión
        </Text>

        {/* Subtítulo */}
        <Text style={[styles.subtitle, { fontSize: ms(16), marginBottom: vs(8) }]}>
          Para editar tu perfil y obtener
        </Text>
        <Text style={[styles.highlightText, { fontSize: ms(18), marginBottom: vs(24) }]}>
          ¡Grandes Recompensas!
        </Text>

        {/* Descripción */}
        <Text style={[styles.description, { fontSize: ms(14), marginBottom: vs(32) }]}>
          Al crear una cuenta podrás personalizar tu perfil, guardar tus preferencias y acceder a beneficios exclusivos.
        </Text>

        {/* Botón Iniciar Sesión */}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            { paddingVertical: vs(15), borderRadius: CARD_RADIUS, marginBottom: vs(16) }
          ]}
          onPress={handleLogin}
        >
          <Text style={[styles.primaryButtonText, { fontSize: ms(16) }]}>
            Iniciar Sesión
          </Text>
        </TouchableOpacity>

        {/* Botón Crear Perfil */}
        <TouchableOpacity
          style={[
            styles.secondaryButton,
            { paddingVertical: vs(15), borderRadius: CARD_RADIUS, marginBottom: vs(24) }
          ]}
          onPress={handleCreateAccount}
        >
          <Text style={[styles.secondaryButtonText, { fontSize: ms(16) }]}>
            Crear Perfil
          </Text>
        </TouchableOpacity>

        {/* Beneficios */}
        <View style={[styles.benefitsContainer, { borderRadius: CARD_RADIUS, padding: hs(20), marginBottom: vs(40) }]}>
          <Text style={[styles.benefitsTitle, { fontSize: ms(16), marginBottom: vs(12) }]}>
            Beneficios de tener cuenta:
          </Text>
          
          <View style={styles.benefitItem}>
            <Ionicons name="star" size={ms(16)} color="#42b883" />
            <Text style={[styles.benefitText, { fontSize: ms(13), marginLeft: hs(8) }]}>
              Perfil personalizable
            </Text>
          </View>
          
          <View style={styles.benefitItem}>
            <Ionicons name="gift" size={ms(16)} color="#42b883" />
            <Text style={[styles.benefitText, { fontSize: ms(13), marginLeft: hs(8) }]}>
              Recompensas exclusivas
            </Text>
          </View>
          
          <View style={styles.benefitItem}>
            <Ionicons name="time" size={ms(16)} color="#42b883" />
            <Text style={[styles.benefitText, { fontSize: ms(13), marginLeft: hs(8) }]}>
              Historial de estacionamientos
            </Text>
          </View>
          
          <View style={styles.benefitItem}>
            <Ionicons name="card" size={ms(16)} color="#42b883" />
            <Text style={[styles.benefitText, { fontSize: ms(13), marginLeft: hs(8) }]}>
              Pagos más rápidos
            </Text>
          </View>

          <View style={styles.benefitItem}>
            <Ionicons name="shield-checkmark" size={ms(16)} color="#42b883" />
            <Text style={[styles.benefitText, { fontSize: ms(13), marginLeft: hs(8) }]}>
              Mayor seguridad
            </Text>
          </View>

          <View style={styles.benefitItem}>
            <Ionicons name="trending-up" size={ms(16)} color="#42b883" />
            <Text style={[styles.benefitText, { fontSize: ms(13), marginLeft: hs(8) }]}>
              Descuentos especiales
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0c'
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    zIndex: 10,
    padding: 8
  },
  userIconContainer: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    color: '#ffffff',
    fontWeight: '800',
    textAlign: 'center'
  },
  subtitle: {
    color: '#c9c9cf',
    textAlign: 'center'
  },
  highlightText: {
    color: '#42b883',
    fontWeight: '700',
    textAlign: 'center'
  },
  description: {
    color: '#a0a0a8',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300
  },
  primaryButton: {
    backgroundColor: '#42b883',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 280
  },
  primaryButtonText: {
    color: '#0b0b0c',
    fontWeight: '700'
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 280,
    borderWidth: 2,
    borderColor: '#42b883'
  },
  secondaryButtonText: {
    color: '#42b883',
    fontWeight: '700'
  },
  benefitsContainer: {
    backgroundColor: '#151518',
    width: '100%',
    maxWidth: 300
  },
  benefitsTitle: {
    color: '#ffffff',
    fontWeight: '700',
    textAlign: 'center'
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  benefitText: {
    color: '#c9c9cf',
    flex: 1
  }
});

export default IniciarSesionScreen;