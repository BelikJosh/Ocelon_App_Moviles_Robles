// src/components/CarRunner.tsx
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  createAnimatedComponent,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';

type Props = {
  yOffset?: number;         // ajuste vertical fino
  scale?: number;           // escala global del coche
  opacity?: number;         // opacidad global
  wheelPeriodMs?: number;   // ms por vuelta de rueda
  bounceAmpPx?: number;     // amplitud del rebote
  windowOffsetX?: number;   // desplazamiento horizontal de las ventanas (negativo=atrás, positivo=adelante)
};

const BODY = '#D7263D';
const BODY_SHADOW = '#B61F33';   // ← corregido
const PANEL_LINE = '#9E1C2B';
const WINDOW = '#DFE7EA';
const WINDOW_TINT = '#C9D4D9';
const BUMPER = '#7A7D80';
const HEADLIGHT = '#C8CDD1';
const TAIL = '#FF6B6B';
const TIRE = '#1B1B1B';
const TIRE_INNER = '#9AA3A7';
const RIM = '#EDEDED';

const A_G = createAnimatedComponent(G);

export default function CarRunner({
  yOffset = 0,
  scale = 0.8,          // tamaño compacto por defecto
  opacity = 1,
  wheelPeriodMs = 650,
  bounceAmpPx = 2,
  windowOffsetX = -11,  // posición de la ventana (antes -14). -11 = +3 hacia delante
}: Props) {
  // viewBox fijo; escalamos con 'scale'
  const VW = 220;
  const VH = 120;

  // Posiciones de ruedas
  const wheelCXrear = 76;
  const wheelCXfront = 166;
  const wheelCY = 86;

  // desplazamiento de ventanas
  const WIN_SHIFT = windowOffsetX;

  // animaciones
  const spin = useSharedValue(0);
  const bounce = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(
      withTiming(1, { duration: wheelPeriodMs, easing: Easing.linear }),
      -1,
      false
    );
    bounce.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(0, { duration: 500 })
      ),
      -1,
      false
    );
  }, [spin, bounce, wheelPeriodMs]);

  const groupStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: yOffset + interpolate(bounce.value, [0, 1], [0, -bounceAmpPx]) },
      { scale },
    ],
    opacity,
  }));

  const wheelRot = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(spin.value, [0, 1], [0, 360])}deg` }],
  }));

  return (
    <Animated.View style={[styles.box, groupStyle]}>
      <Svg width={VW} height={VH} viewBox={`0 0 ${VW} ${VH}`}>
        {/* SOMBRA anclada a las ruedas */}
        <Ellipse
          cx={VW * 0.5}
          cy={wheelCY + 6}
          rx={VW * 0.38}
          ry={7}
          fill="rgba(0,0,0,0.15)"
        />

        {/* Silueta hatchback */}
        <Path
          d="
            M 18 78
            L 18 66
            Q 22 42, 46 36
            L 92 28
            Q 110 18, 138 18
            L 162 18
            Q 176 18, 186 30
            L 198 44
            Q 210 46, 212 56
            L 212 72
            Q 212 80, 206 82
            L 198 84
            Q 192 86, 186 86
            L 38 86
            Q 26 86, 22 84
            L 18 82 Z"
          fill={BODY}
        />

        {/* Zócalo/parte baja */}
        <Path
          d="M 30 78 L 200 78 Q 208 76 208 70 L 208 68 L 28 68 Z"
          fill={BODY_SHADOW}
          opacity={0.9}
        />

        {/* Defensa / nariz */}
        <Path
          d="M 198 70 Q 208 68, 210 62 Q 212 56, 204 52 L 192 52 L 190 70 Z"
          fill={BUMPER}
          opacity={0.9}
        />

        {/* Faro + luz trasera */}
        <Circle cx={204} cy={60} r={8} fill={HEADLIGHT} />
        <Rect x={20} y={63} width={10} height={10} rx={3} fill={TAIL} />

         {/* ===== Ventanas desplazadas (usa WIN_SHIFT) ===== */}
        {/* Ventana principal */}
        <Polygon
          points={`${114+WIN_SHIFT},30  ${145+WIN_SHIFT},25  ${180+WIN_SHIFT},25  ${168+WIN_SHIFT},48  ${90+WIN_SHIFT},48`}
          fill={WINDOW}
        />
        {/* Tinte (inset ~2px y un poco más estrecho) */}
<Polygon
  points={`${116+WIN_SHIFT},30  ${145+WIN_SHIFT},27  ${178+WIN_SHIFT},27  ${166+WIN_SHIFT},46  ${112+WIN_SHIFT},46`}
  fill={WINDOW_TINT}
  opacity={0.45}
/>

{/* Ventanilla trasera (pequeña, antes del pilar) */}
<Polygon
  points={`${90+WIN_SHIFT},38  ${112+WIN_SHIFT},30  ${112+WIN_SHIFT},48  ${88+WIN_SHIFT},52`}
  fill={WINDOW}
/>

{/* Pilar central entre ventanilla trasera y ventana principal */}
<Rect
  x={112 + WIN_SHIFT}
  y={30}
  width={3}
  height={20}
  fill={PANEL_LINE}
  opacity={0.8}
/>

{/* Líneas de puerta alineadas con la ventana principal */}
<Path
  d={`M ${118 + WIN_SHIFT} 50 L ${178 + WIN_SHIFT} 50`}
  stroke={PANEL_LINE}
  strokeWidth={1.2}
  opacity={0.7}
/>
<Path
  d={`M ${148 + WIN_SHIFT} 50 L ${148 + WIN_SHIFT} 78`}
  stroke={PANEL_LINE}
  strokeWidth={1.2}
  opacity={0.7}
/>


        {/* Arcos de rueda */}
        <Path d="M 60 86 Q 60 70, 76 70 Q 92 70, 92 86" stroke={BODY_SHADOW} strokeWidth={10} strokeLinecap="round" />
        <Path d="M 150 86 Q 150 70, 166 70 Q 182 70, 182 86" stroke={BODY_SHADOW} strokeWidth={10} strokeLinecap="round" />

        {/* RUEDAS girando */}
        <A_G style={wheelRot}>
          {/* Trasera */}
          <G transform={`translate(${wheelCXrear},${wheelCY})`}>
            <Circle cx={0} cy={0} r={18} fill={TIRE} />
            <Circle cx={0} cy={0} r={14} fill={TIRE_INNER} />
            <Circle cx={0} cy={0} r={10} fill={RIM} />
            <Path d="M0 -10 L0 10" stroke="#cfcfcf" strokeWidth={2} />
            <Path d="M-8 -6 L8 6" stroke="#cfcfcf" strokeWidth={2} />
            <Path d="M-8 6 L8 -6" stroke="#cfcfcf" strokeWidth={2} />
          </G>
          {/* Delantera */}
          <G transform={`translate(${wheelCXfront},${wheelCY})`}>
            <Circle cx={0} cy={0} r={18} fill={TIRE} />
            <Circle cx={0} cy={0} r={14} fill={TIRE_INNER} />
            <Circle cx={0} cy={0} r={10} fill={RIM} />
            <Path d="M0 -10 L0 10" stroke="#cfcfcf" strokeWidth={2} />
            <Path d="M-8 -6 L8 6" stroke="#cfcfcf" strokeWidth={2} />
            <Path d="M-8 6 L8 -6" stroke="#cfcfcf" strokeWidth={2} />
          </G>
        </A_G>
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
