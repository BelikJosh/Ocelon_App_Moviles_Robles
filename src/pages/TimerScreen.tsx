// TimerScreen.tsx
import React, { useCallback, useState, useEffect } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
    TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const BASE_W = 375;
const BASE_H = 812;

export default function TimerScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    
    // --- LÓGICA DE LA PLANTILLA (Responsiva) ---
    const { width, height } = useWindowDimensions();
    const hs = (size: number) => (width / BASE_W) * size;
    const vs = (size: number) => (height / BASE_H) * size;
    const ms = (size: number, factor = 0.5) => size + (hs(size) - size) * factor;

    // Tokens de Diseño adaptados
    const PADDING = hs(20);
    const LOGO_TIMER = Math.min(hs(180), 240);
    const CARD_RADIUS = hs(18);
    const MAX_W = 720;
    // ---------------------------------------------
    
    // --- NUEVOS ESTADOS DE TIEMPO Y FASE ---
    const [phase, setPhase] = useState<'COUNTDOWN' | 'STOPWATCH'>('COUNTDOWN'); // Controla qué timer se muestra
    const [countdown, setCountdown] = useState(10); // Inicia la cuenta regresiva en 5
    const [mainTimerSeconds, setMainTimerSeconds] = useState(0); // Cronómetro (Stopwatch)
    const [secondaryCounter, setSecondaryCounter] = useState(0); // Contador que sube cada 10s
    
    const rawQrData = (route.params as { rawQrData: string | undefined })?.rawQrData || 'Error: QR no encontrado';

    // --- EFECTO 1: CUENTA REGRESIVA (5 -> 0) ---
    useEffect(() => {
        if (phase !== 'COUNTDOWN') return;
        
        const countdownInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    setPhase('STOPWATCH'); // 🎯 Transición al Cronómetro
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        
        return () => clearInterval(countdownInterval);
    }, [phase]);

    // --- EFECTO 2: CRONÓMETRO Y CONTADOR SECUNDARIO ---
    useEffect(() => {
        if (phase !== 'STOPWATCH') return;
        
        const timerInterval = setInterval(() => {
            setMainTimerSeconds(s => {
                const nextS = s + 1;
                
                // Lógica del contador secundario: aumenta  cada 10 segundos
                if (nextS > 0 && nextS % 10 === 0) {
                    setSecondaryCounter(c => c + 15);
                }
                return nextS;
            });
        }, 1000);
        
        return () => clearInterval(timerInterval);
    }, [phase]);
    // ---------------------------------------------------
    
    // --- LÓGICA DE UTILIDAD ---
    
    // FUNCIÓN PARA FORMATEAR EL CRONÓMETRO (HH:MM:SS)
    const formatTime = (totalSeconds: number) => {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        const pad = (num: number) => String(num).padStart(2, '0');
        return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    };
    
    // FUNCIÓN PARA REGRESAR
    const handleGoBack = () => {
        setPhase('COUNTDOWN'); // Asegura que los efectos se detengan
        navigation.goBack(); 
    };
    
    // LÓGICA DEL PULL TO REFRESH (Mantenida)
    const [refreshing, setRefreshing] = useState(false);
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        // Reiniciar timers al refrescar si es necesario
        // setPhase('COUNTDOWN'); 
        // setCountdown(5);
        // setMainTimerSeconds(0);
        // setSecondaryCounter(0);
        setTimeout(() => setRefreshing(false), 800);
    }, []);
    // ---------------------------------------------------

    // --- RENDERIZADO ---
    
    // Determina el texto principal y la etiqueta a mostrar
    const mainText = phase === 'COUNTDOWN' 
        ? countdown 
        : formatTime(mainTimerSeconds);
    
    const mainLabel = phase === 'COUNTDOWN' 
        ? `Tiempo libre restante` 
        : 'Tiempo Transcurrido (HH:MM:SS)';


    return (
        <View style={s.container}>
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
                    
                    {/* Contenedor Principal del Tiempo (Círculo) */}
                    <View
                        style={[s.timerCircle, {
                            width: LOGO_TIMER,
                            height: LOGO_TIMER,
                            borderRadius: LOGO_TIMER / 2,
                            marginTop: vs(24),
                            marginBottom: vs(16),
                            // El color del texto principal cambia según la fase
                            borderColor: phase === 'COUNTDOWN' ? '#ffaa00' : '#2a2a30', 
                        }]}
                    >
                        <Text style={[
                            s.timerText, 
                            { 
                                fontSize: phase === 'COUNTDOWN' ? ms(50) : ms(40), // 
                                fontWeight: phase === 'COUNTDOWN' ? '800' : '500',
                                color: phase === 'COUNTDOWN' ? '#68d59dff' : '#42b883',
                            }
                        ]}>
                            {mainText}
                        </Text>
                        <Text style={[s.subtitle, { fontSize: ms(16), alignSelf:'center' }]}>
                            {mainLabel}
                        </Text>
                    </View>

                    {/* Título y Data del QR */}
                    <View style={{ maxWidth: MAX_W, width: '100%', alignItems: 'center' }}>
                        <Text style={[s.kicker, { fontSize: ms(14), marginBottom: vs(6) }]}>
                            Datos Escaneados (para pruebas):
                        </Text>
                        <Text
                            style={[s.title, { fontSize: ms(20), lineHeight: ms(28), marginBottom: vs(16), textAlign: 'center' }]}
                        >
                            <Text style={{ color: '#42b883' }}>{rawQrData.substring(0, 25)}</Text>
                            {rawQrData.length > 25 ? '...' : ''}
                        </Text>
                        
                        {/* 🎯 CONTADOR SECUNDARIO */}
                        <View style={s.secondaryCounterBox}>
                            <Text style={[s.timerText, { fontSize: ms(18), color: '#c9c9cf' }]}>
                                MXN {secondaryCounter}
                            </Text>
                            <Text style={[s.subtitle, { fontSize: ms(13) }]}>
                                Costo Total
                            </Text>
                            <Text style={[s.subtitle, { fontSize: ms(10) }]}>
                                Ajustado a 15 pesos por 10 segundos para pruebas.
                            </Text>
                        </View>
                    </View>
                    
                    {/* Botón de Regreso */}
                    <TouchableOpacity
                        style={[s.primaryBtn, { paddingVertical: vs(16), borderRadius: CARD_RADIUS, marginTop: vs(40), marginBottom: vs(24) }]}
                        onPress={handleGoBack}
                    >
                        <Text style={[s.btnText, { fontSize: ms(16) }]}>
                            Terminar y Regresar
                        </Text>
                    </TouchableOpacity>
                    
                    {/* Footer */}
                    <Text style={[s.footer, { fontSize: ms(12) }]}>
                        © {new Date().getFullYear()} Ocelon — Escaneo QR
                    </Text>
                </View>
            </ScrollView>
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
    
    // Estilos principales del timer
    timerText: { color: '#42b883' },
    timerCircle: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#121215',
        borderWidth: 2,
        borderColor: '#2a2a30',
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        elevation: 10,
    },
    
    // Estilos para el botón y el contador secundario
    primaryBtn: {
        backgroundColor: '#42b883',
        paddingHorizontal: 30,
        alignItems: 'center',
    },
    btnText: { 
        color: '#0b0b0c',
        fontWeight: '700' 
    },
    secondaryCounterBox: {
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#1b1b20',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#2a2a30',
        minWidth: 150,
    },
});