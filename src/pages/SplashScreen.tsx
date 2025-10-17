import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo } from 'react';
import { Dimensions, Pressable, StyleSheet } from 'react-native';
import { RootStackParamList } from '../navegation/types/navigation';

import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import Carrito from '../pages/Carrito';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const { width: W, height: H } = Dimensions.get('window');

/** ====== Parámetros ====== */
const CLOUD_SPEED_PX_S = 180;
const CLOUD_DIST = W + 420;
const CLOUD_CROSS_MS = Math.max(1800, Math.round((CLOUD_DIST / CLOUD_SPEED_PX_S) * 1000));

const DAY_HOLD_MS = CLOUD_CROSS_MS + 600; // nubes cruzan al menos una vez
const TRANSITION_MS = 1800;               // azul → negro
const STAR_COUNT = 50;

const STAR_LEAD_MS = 800;     // estrellas solas antes del logo
const LOGO_DISPLAY_MS = 3000; // tiempo mostrando logo + frase

/** ====== Nube (burbujas) ====== */
const Cloud = ({
  size = 140,
  tint = 'rgba(255,255,255,0.9)',
  style,
}: { size?: number; tint?: string; style?: any }) => {
  const r = size / 2;
  return (
    <Animated.View style={[{ width: size, height: r, position: 'absolute' }, style]}>
      <Animated.View style={{ position: 'absolute', width: r, height: r, borderRadius: r / 2, backgroundColor: tint, left: 0, bottom: 0 }} />
      <Animated.View style={{ position: 'absolute', width: r * 0.9, height: r * 0.9, borderRadius: r * 0.45, backgroundColor: tint, left: r * 0.35, bottom: r * 0.1 }} />
      <Animated.View style={{ position: 'absolute', width: r * 0.75, height: r * 0.75, borderRadius: r * 0.375, backgroundColor: tint, left: r * 0.75, bottom: 0 }} />
      <Animated.View style={{ position: 'absolute', width: size, height: r * 0.5, borderRadius: r * 0.25, backgroundColor: tint, bottom: -r * 0.05 }} />
    </Animated.View>
  );
};

/** ====== Estrella (cada una es un componente; aquí sí usamos hooks al tope) ====== */
const Star = ({
  x, size, startY, endY, duration, delay,
}: {
  x: number;
  size: number;
  startY: number;
  endY: number;
  duration: number;
  delay: number;
}) => {
  const y = useSharedValue(startY);

  useEffect(() => {
    y.value = startY;
    y.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(endY, { duration, easing: Easing.linear }),
          withTiming(startY, { duration: 0 })
        ),
        -1,
        false
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startY, endY, duration, delay]);

  const style = useAnimatedStyle(() => ({
    left: x,
    width: size,
    height: size,
    borderRadius: size / 2,
    transform: [{ translateY: y.value }],
  }));

  return <Animated.View style={[styles.star, style]} />;
};

export default function SplashScreen({ navigation }: Props) {
  // Progreso 0 (día) → 1 (noche)
  const progress = useSharedValue(0);

  // Nubes (posición X)
  const cloudX1 = useSharedValue(-300);
  const cloudX2 = useSharedValue(-300);
  const cloudX3 = useSharedValue(-300);

  /** Array de estrellas: SOLO DATOS (sin hooks) ✅ */
  type StarDef = {
    key: string;
    x: number;
    size: number;
    startY: number;
    endY: number;
    duration: number;
    delay: number;
  };
  const stars = useMemo<StarDef[]>(() => {
    return Array.from({ length: STAR_COUNT }).map((_, i) => {
      const size = Math.random() * 2.2 + 0.8;
      const x = Math.random() * W;
      const startY = -Math.random() * H - 80;
      const endY = H + 80 + Math.random() * (H * 0.25);
      const duration = 4500 + Math.random() * 5000; // 4.5–9.5 s
      const delay = Math.random() * 1200;
      return { key: `star-${i}`, x, size, startY, endY, duration, delay };
    });
  }, []);

  // Logo + frase
  const logoOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const overlayOpacity = useSharedValue(1);

  useEffect(() => {
    let mounted = true;

    // Bucle nubes
    const cloudLoop = (sv: Animated.SharedValue<number>, dist: number, dur: number, startOffset = 0) => {
      sv.value = -300 - startOffset;
      sv.value = withRepeat(
        withSequence(
          withTiming(dist, { duration: dur, easing: Easing.linear }),
          withTiming(-300 - startOffset, { duration: 0 })
        ),
        -1,
        false
      );
    };
    cloudLoop(cloudX1, W + 420, Math.round(CLOUD_CROSS_MS * 1.0), 0);
    cloudLoop(cloudX2, W + 380, Math.round(CLOUD_CROSS_MS * 0.9), 120);
    cloudLoop(cloudX3, W + 450, Math.round(CLOUD_CROSS_MS * 1.2), 240);

    // Transición día → noche
    progress.value = withDelay(
      DAY_HOLD_MS,
      withTiming(1, { duration: TRANSITION_MS, easing: Easing.inOut(Easing.cubic) }, (finished) => {
        if (!finished || !mounted) return;

        // Logo + frase (pequeño desfase tras estrellas)
        logoOpacity.value = withDelay(
          STAR_LEAD_MS,
          withTiming(1, { duration: 650, easing: Easing.out(Easing.quad) })
        );
        taglineOpacity.value = withDelay(
          STAR_LEAD_MS + 80,
          withTiming(1, { duration: 650, easing: Easing.out(Easing.quad) })
        );

        overlayOpacity.value = withDelay(
          STAR_LEAD_MS + LOGO_DISPLAY_MS,
          withTiming(0, { duration: 450, easing: Easing.inOut(Easing.quad) }, () => {
            runOnJS(navigation.replace)('Login');
          })
        );
      })
    );

    return () => { mounted = false; };
  }, [cloudX1, cloudX2, cloudX3, progress, logoOpacity, taglineOpacity, overlayOpacity, navigation]);

  /* ====== estilos animados ====== */
  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], ['#BEE3FF', '#000000']),
  }));
  const dayOpacityStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));
  const cloud1Style = useAnimatedStyle(() => ({ transform: [{ translateX: cloudX1.value }], top: H * 0.22 }));
  const cloud2Style = useAnimatedStyle(() => ({ transform: [{ translateX: cloudX2.value }], top: H * 0.38 }));
  const cloud3Style = useAnimatedStyle(() => ({ transform: [{ translateX: cloudX3.value }], top: H * 0.55 }));

  const starContainerStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: interpolate(logoOpacity.value, [0, 1], [0.92, 1]) }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: interpolate(taglineOpacity.value, [0, 1], [6, 0]) }],
  }));

  /** 🎭 Morph suave del carro al final del día (no desaparece de golpe) */
  const MORPH_START = 0.95;
  const carMorphStyle = useAnimatedStyle(() => {
    const t = interpolate(progress.value, [MORPH_START, 1], [0, 1]); // 0..1
    return {
      opacity: 1 - t,
      transform: [{ scale: interpolate(t, [0, 1], [1, 0.9]) }],
    };
  });

  const skip = () => navigation.replace('Login');

  return (
    <Pressable onPress={skip} style={styles.hitSlop} accessibilityLabel="Continuar a Login">
      <Animated.View style={[styles.root, bgStyle]}>
        {/* ===== CIELO (nubes + CARRO CENTRADO) ===== */}
        <Animated.View style={[styles.layer, dayOpacityStyle]}>
          <Cloud style={cloud1Style} size={160} />
          <Cloud style={cloud2Style} size={120} tint="rgba(255,255,255,0.85)" />
          <Cloud style={cloud3Style} size={180} tint="rgba(255,255,255,0.95)" />

          <Animated.View style={[styles.carLayer, carMorphStyle]}>
            <Carrito
              yOffset={0}     // 0 = centro exacto del contenedor
              scale={0.55}
              opacity={1}
              wheelPeriodMs={520}
              bounceAmpPx={2}
            />
          </Animated.View>
        </Animated.View>

        {/* ===== NOCHE (estrellas) ===== */}
        <Animated.View style={[styles.layer, starContainerStyle]}>
          {stars.map((s) => (
            <Star
              key={s.key}
              x={s.x}
              size={s.size}
              startY={s.startY}
              endY={s.endY}
              duration={s.duration}
              delay={s.delay}
            />
          ))}
        </Animated.View>

        {/* ===== LOGO + FRASE ===== */}
        <Animated.View pointerEvents="none" style={[styles.center, overlayStyle]}>
          <Animated.Image
            source={require('../../assets/images/Logo_ocelon.jpg')}
            style={[styles.logo, logoStyle]}
            resizeMode="contain"
            accessible
            accessibilityLabel="Logo Ocelon"
          />
          <Animated.Text style={[styles.tagline, taglineStyle]}>
            Estaciona fácil, paga con velocidad, vive una mejor vida
          </Animated.Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hitSlop: { flex: 1 },
  root: { flex: 1, backgroundColor: '#000' },
  layer: { ...StyleSheet.absoluteFillObject },

  // Contenedor pantalla completa que centra al carro (X e Y)
  carLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },

  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: { width: Math.min(W * 0.55, 260), height: Math.min(W * 0.55, 260), marginBottom: 14 },
  tagline: { color: '#fff', fontSize: 16, lineHeight: 22, textAlign: 'center', opacity: 0.92, maxWidth: 560 },
  star: { position: 'absolute', top: 0, backgroundColor: '#fff', opacity: 0.95 },
});
