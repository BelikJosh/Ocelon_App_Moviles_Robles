// SupportScreen.tsx
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';

export default function SupportScreen() {
  const { width } = useWindowDimensions();
  
  // Escalas responsivas
  const BASE_W = 375;
  const hs = (n: number) => (width / BASE_W) * n;
  const ms = (n: number, f = 0.5) => n + (hs(n) - n) * f;
  
  const PADDING = hs(16);
  const MAX_W = Math.min(600, width - PADDING * 2);

  const handleCall = () => {
    Linking.openURL('tel:+524497510854');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:soporte@ocelon.com');
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/524497510854');
  };

  return (
    <View style={s.container}>
      <ScrollView
        contentContainerStyle={[s.scrollContent, { paddingHorizontal: PADDING }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header con logo y título */}
        <View style={[s.header, { maxWidth: MAX_W, width: '100%', alignSelf: 'center' }]}>
          <View style={[s.logoContainer, { 
            width: hs(140), 
            height: hs(140),
            borderRadius: hs(16),
            marginBottom: hs(16)
          }]}>
            <Image
              source={require('../../assets/images/Logo_ocelon.jpg')}
              style={[s.logo, { width: hs(120), height: hs(120), borderRadius: hs(12) }]}
            />
          </View>
          <Text style={[s.title, { fontSize: ms(30) }]}>Soporte</Text>
          <Text style={[s.greeting, { fontSize: ms(18) }]}>Hola (Nombre)</Text>
        </View>

        {/* Contenedor para las secciones */}
        <View style={{ width: '100%', maxWidth: MAX_W, alignSelf: 'center' }}>
          {/* Sección: ¿Tienes un problema? */}
          <View style={s.section}>
            <Text style={[s.sectionTitle, { fontSize: ms(17) }]}>¿Tienes un problema?</Text>

            <TouchableOpacity style={[s.card, { borderRadius: hs(14), padding: hs(14) }]} onPress={handleCall} activeOpacity={0.7}>
              <View style={s.cardContent}>
                <Ionicons name="call-outline" size={ms(20)} color="#42b883" />
                <Text style={[s.cardText, { fontSize: ms(14) }]} numberOfLines={2}>
                  Contáctanos al número +524497510854
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={ms(18)} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={[s.card, { borderRadius: hs(14), padding: hs(14) }]} onPress={handleEmail} activeOpacity={0.7}>
              <View style={s.cardContent}>
                <Ionicons name="mail-outline" size={ms(20)} color="#42b883" />
                <Text style={[s.cardText, { fontSize: ms(14) }]} numberOfLines={2}>
                  Contáctanos al correo electrónico
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={ms(18)} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Sección: ¿Tienes alguna queja? */}
          <View style={s.section}>
            <Text style={[s.sectionTitle, { fontSize: ms(17) }]}>¿Tienes alguna queja?</Text>

            <TouchableOpacity style={[s.card, { borderRadius: hs(14), padding: hs(14) }]} onPress={handleEmail} activeOpacity={0.7}>
              <View style={s.cardContent}>
                <Ionicons name="mail-outline" size={ms(20)} color="#42b883" />
                <Text style={[s.cardText, { fontSize: ms(14) }]} numberOfLines={2}>
                  Contáctanos al correo electrónico
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={ms(18)} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={[s.card, { borderRadius: hs(14), padding: hs(14) }]} onPress={handleWhatsApp} activeOpacity={0.7}>
              <View style={s.cardContent}>
                <MaterialIcons name="phone" size={ms(20)} color="#42b883" />
                <Text style={[s.cardText, { fontSize: ms(14) }]} numberOfLines={2}>
                  Escríbenos por WhatsApp
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={ms(18)} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Información adicional */}
          <View style={[s.infoBox, { borderRadius: hs(12), padding: hs(14) }]}>
            <Ionicons name="information-circle-outline" size={ms(22)} color="#42b883" />
            <Text style={[s.infoText, { fontSize: ms(12), lineHeight: ms(17) }]}>
              Nuestro equipo de soporte está disponible de lunes a viernes de 9:00 AM a 6:00 PM
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0c',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    backgroundColor: '#151518',
    borderWidth: 2,
    borderColor: '#2a2a30',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  logo: {
    resizeMode: 'cover',
  },
  title: {
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  greeting: {
    color: '#9f9faf',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#151518',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#202028',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  cardText: {
    color: '#e0e0e5',
    fontWeight: '500',
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(66, 184, 131, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(66, 184, 131, 0.2)',
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    color: '#c9c9cf',
  },
});