// screens/TimerScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import PayModal from '../components/PayModal';
import { useAuthState } from '../hooks/useAuthState';
import { RootStackParamList } from '../navegation/types/navigation';
import { getTimer, onTimerChange, startTimer, stopTimer } from '../utils/TimerStore'; // ← QUITAR updateTimer
import { initNotifications, sendNotification } from '../utils/notifications';

type Props = NativeStackScreenProps<RootStackParamList, 'Timer'>;

const BASE_W = 375;
const BASE_H = 812;

export default function TimerScreen({ route, navigation }: Props) {
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
    
    // --- ESTADOS SINCRONIZADOS CON EL STORE ---
    const [storeData, setStoreData] = useState(getTimer());
    const rawQrData = route.params?.rawQrData || storeData.rawQrData;

    // Sincronizar con el store
    useEffect(() => {
        const unsub = onTimerChange(() => setStoreData({ ...getTimer() }));
        return unsub;
    }, []);

    // Iniciar timer si viene de QR
    useEffect(() => {
        if (route.params?.rawQrData && !storeData.active) {
            startTimer(route.params.rawQrData);
        }
    }, [route.params?.rawQrData]);

    useEffect(() => {
        initNotifications();
    }, []);

    useEffect(() => {
        if (!storeData.active) return;

        const interval = setInterval(() => {
            sendNotification(
                "Tiempo de Estacionamiento",
                `Tiempo transcurrido: ${formatTime(storeData.seconds)} - Costo: MXN ${storeData.cost}.00`
            );
        }, 30000);

        return () => clearInterval(interval);
    }, [storeData.seconds, storeData.cost, storeData.active]);

    const [isPayModalVisible, setPayModalVisible] = useState(false);
    const { usuario, esInvitado } = useAuthState(); // ← accedemos al usuario
    
    // --- LÓGICA DE UTILIDAD ---
    const formatTime = (totalSeconds: number) => {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        const pad = (num: number) => String(num).padStart(2, '0');
        return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    };
    
    const handleGoBack = () => {
        // Solo navegar hacia atrás, no detener el timer
        navigation.navigate("AppTabs");
    };
    
    const [refreshing, setRefreshing] = useState(false);
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        // Reiniciar completamente
        if (storeData.active) {
            stopTimer();
        }
        setTimeout(() => setRefreshing(false), 800);
    }, [storeData.active]);
    // ---------------------------------------------------

    // Determina el texto principal y la etiqueta a mostrar
    const mainText = storeData.phase === 'COUNTDOWN' 
        ? storeData.countdown 
        : formatTime(storeData.seconds);
    
    const mainLabel = storeData.phase === 'COUNTDOWN' 
        ? `Tiempo libre restante` 
        : 'Tiempo Transcurrido (HH:MM:SS)';

    const handlePaymentPress = () => {
        if (usuario && !esInvitado) {
            // Usuario logueado → mostrar modal
            setPayModalVisible(true);
        } else {
            navigation.navigate("CashPayment", { monto: storeData.cost, rawQrData });
        }
    };

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
                    
                    {/* Header */}
                    <View style={[s.header, { marginBottom: vs(20) }]}>
                        <TouchableOpacity 
                            style={s.backButton} 
                            onPress={handleGoBack}
                        >
                            <Ionicons name="arrow-back" size={24} color="#42b883" />
                        </TouchableOpacity>
                        <Text style={[s.headerTitle, { fontSize: ms(20) }]}>
                            Temporizador de Estacionamiento
                        </Text>
                        <View style={s.headerPlaceholder} />
                    </View>

                    {/* Contenedor Principal del Tiempo (Círculo) */}
                    <View
                        style={[s.timerCircle, {
                            width: LOGO_TIMER,
                            height: LOGO_TIMER,
                            borderRadius: LOGO_TIMER / 2,
                            marginBottom: vs(16),
                            borderColor: storeData.phase === 'COUNTDOWN' ? '#ffaa00' : '#42b883', 
                        }]}
                    >
                        <Text style={[
                            s.timerText, 
                            { 
                                fontSize: storeData.phase === 'COUNTDOWN' ? ms(50) : ms(36),
                                fontWeight: storeData.phase === 'COUNTDOWN' ? '800' : '600',
                                color: storeData.phase === 'COUNTDOWN' ? '#ffaa00' : '#42b883',
                            }
                        ]}>
                            {mainText}
                        </Text>
                        <Text style={[s.timerLabel, { fontSize: ms(14) }]}>
                            {mainLabel}
                        </Text>
                    </View>

                    {/* Información del QR */}
                    <View style={[s.qrCard, { maxWidth: MAX_W, borderRadius: CARD_RADIUS, padding: hs(16) }]}>
                        <Text style={[s.qrTitle, { fontSize: ms(16) }]}>
                            Datos del QR Escaneado
                        </Text>
                        <View style={s.qrDataContainer}>
                            <Text style={[s.qrData, { fontSize: ms(12) }]} numberOfLines={3}>
                                {rawQrData}
                            </Text>
                        </View>
                    </View>
                        
                    {/* Contador de Costo */}
                    <View style={[s.costCard, { maxWidth: MAX_W, borderRadius: CARD_RADIUS, padding: hs(16) }]}>
                        <View style={s.costHeader}>
                            <Ionicons name="cash-outline" size={ms(20)} color="#42b883" />
                            <Text style={[s.costTitle, { fontSize: ms(18) }]}>
                                Costo Total
                            </Text>
                        </View>
                        <Text style={[s.costAmount, { fontSize: ms(32) }]}>
                            MXN {storeData.cost}.00
                        </Text>
                        <Text style={[s.costSubtitle, { fontSize: ms(12) }]}>
                            $15.00 MXN por cada 10 segundos
                        </Text>
                    </View>
                    
                    {/* Botón Pagar */}
                    <TouchableOpacity
                        style={[
                            s.primaryBtn,
                            { 
                                borderRadius: CARD_RADIUS, 
                                paddingVertical: vs(16),
                                marginTop: vs(20),
                                marginBottom: vs(24)
                            }
                        ]}
                        onPress={() => handlePaymentPress()}
                    >
                        <Ionicons name="stop-circle-outline" size={ms(20)} color="#0b0b0c" />
                        <Text style={[s.btnText, { fontSize: ms(16) }]}>
                            Pagar
                        </Text>
                    </TouchableOpacity>

                    <PayModal
                        visible={isPayModalVisible}
                        total={storeData.cost}
                        rawQrData={rawQrData}
                        onClose={() => setPayModalVisible(false)}
                        navigation={navigation}
                    />
                    
                    {/* Footer */}
                    <Text style={[s.footer, { fontSize: ms(12) }]}>
                        © {new Date().getFullYear()} Ocelon — Sistema de Estacionamiento
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

// Los styles se mantienen igual (sin cambios)...
const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0b0b0c' },
    header: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(66, 184, 131, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontWeight: '700',
        textAlign: 'center',
        flex: 1,
    },
    headerPlaceholder: {
        width: 40,
    },
    timerCircle: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#121215',
        borderWidth: 3,
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        elevation: 10,
    },
    timerText: {
        fontWeight: '700',
    },
    timerLabel: {
        color: '#c9c9cf',
        marginTop: 8,
        textAlign: 'center',
    },
    qrCard: {
        width: '100%',
        backgroundColor: '#151518',
        borderWidth: 1,
        borderColor: '#202028',
        marginBottom: 16,
    },
    qrTitle: {
        color: '#fff',
        fontWeight: '600',
        marginBottom: 12,
    },
    qrDataContainer: {
        backgroundColor: '#1b1b20',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#2a2a30',
    },
    qrData: {
        color: '#a9a9b3',
        fontFamily: 'monospace',
    },
    costCard: {
        width: '100%',
        backgroundColor: '#131318',
        borderWidth: 1,
        borderColor: '#202028',
        alignItems: 'center',
    },
    costHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    costTitle: {
        color: '#fff',
        fontWeight: '600',
    },
    costAmount: {
        color: '#42b883',
        fontWeight: '700',
        marginBottom: 8,
    },
    costSubtitle: {
        color: '#9f9faf',
        textAlign: 'center',
    },
    primaryBtn: {
        backgroundColor: '#42b883',
        paddingHorizontal: 30,
        alignItems: 'center',
        flexDirection: 'row',
        gap: 10,
    },
    btnText: { 
        color: '#0b0b0c',
        fontWeight: '700' 
    },
    footer: { 
        color: '#85859a',
        textAlign: 'center',
    },
});