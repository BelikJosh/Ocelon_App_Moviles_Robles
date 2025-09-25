import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import {
  Image,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native';

const BASE_W = 375; // iPhone X ancho base
const BASE_H = 812; // iPhone X alto base

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();

  // Escalas responsivas
  const hs = (size: number) => (width / BASE_W) * size;
  const vs = (size: number) => (height / BASE_H) * size;
  const ms = (size: number, factor = 0.5) => size + (hs(size) - size) * factor;

  // Tokens
  const PADDING = hs(20);
  const LOGO = Math.min(hs(160), 220);
  const CARD_RADIUS = hs(18);
  const ICON_SIZE = ms(22);
  const MAX_W = 720;

  // Pull to refresh (opcional)
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // aquí podrías recargar data remota
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  return (
    <SafeAreaView style={[s.container, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          paddingHorizontal: PADDING,
          paddingBottom: vs(24),
        }}
        showsVerticalScrollIndicator={false}
        bounces
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#42b883" />
        }
      >
        <View style={{ width: '100%', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
          {/* Logo con aro */}
          <View
            style={{
              width: LOGO + hs(24),
              height: LOGO + hs(24),
              borderRadius: (LOGO + hs(24)) / 2,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#121215',
              borderWidth: Math.max(1, hs(2)),
              borderColor: '#2a2a30',
              shadowColor: '#000',
              shadowOpacity: 0.35,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 8 },
              elevation: 10,
              marginTop: vs(24),
              marginBottom: vs(16),
            }}
          >
            <Image
              source={require('../../assets/images/Logo_ocelon.jpg')}
              style={{
                width: LOGO,
                height: LOGO,
                borderRadius: hs(24),
                resizeMode: 'contain',
              }}
            />
          </View>

          {/* Slogan */}
          <View style={{ maxWidth: MAX_W, width: '100%', alignItems: 'center' }}>
            <Text style={[s.kicker, { fontSize: ms(14), marginBottom: vs(6) }]}>
              Welcome to Ocelon
            </Text>
            <Text
              style={[
                s.title,
                { fontSize: ms(28), lineHeight: ms(34), marginBottom: vs(8), textAlign: 'center' },
              ]}
            >
              Park with ease, <Text style={{ color: '#42b883' }}>pay with speed</Text>, live a better life.
            </Text>

            {/* Brand row con mini logo */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: hs(8), marginBottom: vs(16) }}>
              <Image
                source={require('../../assets/images/Logo_ocelon.jpg')}
                style={{ width: hs(24), height: hs(24), borderRadius: hs(6) }}
              />
              <Text style={[s.subtitle, { fontSize: ms(13) }]}>Estaciona fácil, paga rápido, vive mejor</Text>
            </View>
          </View>

          {/* Feature cards */}
          <View
            style={{
              flexDirection: 'row',
              gap: hs(12),
              maxWidth: MAX_W,
              width: '100%',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: vs(16),
            }}
          >
            <FeatureCard
              hs={hs}
              vs={vs}
              ms={ms}
              radius={CARD_RADIUS}
              icon={<Ionicons name="car-outline" size={ICON_SIZE} color="#9aa0a6" />}
              title="Entrada ágil"
              text="Genera tu QR en segundos para acceder sin filas."
            />
            <FeatureCard
              hs={hs}
              vs={vs}
              ms={ms}
              radius={CARD_RADIUS}
              icon={<Ionicons name="qr-code-outline" size={ICON_SIZE} color="#9aa0a6" />}
              title="Pago con QR"
              text="Compatible con Open Payments. Simple y directo."
            />
            <FeatureCard
              hs={hs}
              vs={vs}
              ms={ms}
              radius={CARD_RADIUS}
              icon={<Ionicons name="map-outline" size={ICON_SIZE} color="#9aa0a6" />}
              title="Ubica tu sitio"
              text="Consulta mapa y zonas disponibles al instante."
            />
          </View>

          {/* Footer */}
          <Text style={[s.footer, { fontSize: ms(12), marginBottom: vs(24) }]}>
            © {new Date().getFullYear()} Ocelon — All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureCard({
  hs, vs, ms, radius, icon, title, text,
}: {
  hs: (n: number) => number;
  vs: (n: number) => number;
  ms: (n: number, f?: number) => number;
  radius: number;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <View
      style={{
        backgroundColor: '#151518',
        borderRadius: radius,
        paddingVertical: vs(14),
        paddingHorizontal: hs(14),
        width: '100%',
        maxWidth: 360,
        borderWidth: 1,
        borderColor: '#202028',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: hs(10), marginBottom: vs(6) }}>
        <View
          style={{
            width: hs(36),
            height: hs(36),
            borderRadius: hs(10),
            backgroundColor: '#1b1b20',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#2a2a30',
          }}
        >
          {icon}
        </View>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: ms(16) }}>{title}</Text>
      </View>
      <Text style={{ color: '#a9a9b3', fontSize: ms(13), lineHeight: ms(18) }}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0c' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  kicker: { color: '#9f9faf', letterSpacing: 0.5 },
  title: { color: '#ffffff', fontWeight: '800' },
  subtitle: { color: '#c9c9cf' },
  footer: { color: '#85859a' },
});
