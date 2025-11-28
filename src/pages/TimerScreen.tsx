// screens/TimerScreen.tsx
// Contador de tiempo de estacionamiento - COSTO EN USD
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PayModal from '../components/PayModal';
import { useAuthState } from '../hooks/useAuthState';
import { RootStackParamList } from '../navegation/types/navigation';
import { getTimer, onTimerChange, startTimer, stopTimer } from '../utils/TimerStore';
import { initNotifications, sendNotification } from '../utils/notifications';

type Props = NativeStackScreenProps<RootStackParamList, 'Timer'>;

// ═══════════════════════════════════════════════════════════════
// Configuración de Tarifas
// ═══════════════════════════════════════════════════════════════

// Tarifa: $1.00 USD por cada 10 segundos (para demo)
// En producción podrías usar: $0.10 USD por minuto, etc.
const RATE_USD_PER_INTERVAL = 1.00;  // USD por intervalo
const INTERVAL_SECONDS = 10;          // Cada cuántos segundos se cobra

// Tiempo libre inicial (en segundos) - 5 segundos para demo
const FREE_TIME_SECONDS = 5;

// ═══════════════════════════════════════════════════════════════

const BASE_W = 375;
const BASE_H = 812;

export default function TimerScreen({ route, navigation }: Props) {
    // --- LÓGICA DE LA PLANTILLA (Responsiva) ---
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const hs = (size: number) => (width / BASE_W) * size;
    const vs = (size: number) => (height / BASE_H) * size;
    const ms = (size: number, factor = 0.5) => size + (hs(size) - size) * factor;

    // Tokens de Diseño adaptados
    const PADDING = hs(20);
    const LOGO_TIMER = Math.min(hs(180), 240);
    const CARD_RADIUS = hs(18);
    const MAX_W = 720;

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
                `Tiempo: ${formatTime(storeData.seconds)} - Costo: $${storeData.cost.toFixed(2)} USD`
            );
        }, 30000);

        return () => clearInterval(interval);
    }, [storeData.seconds, storeData.cost, storeData.active]);

    const [isPayModalVisible, setPayModalVisible] = useState(false);
    const { usuario, esInvitado } = useAuthState();

    // --- LÓGICA DE UTILIDAD ---
    const formatTime = (totalSeconds: number) => {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        const pad = (num: number) => String(num).padStart(2, '0');
        return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    };

    // Formatear dinero en USD
    const formatUSD = (amount: number) => {
        return `$${amount.toFixed(2)} USD`;
    };

    const handleGoBack = () => {
        navigation.navigate("AppTabs");
    };

    const [refreshing, setRefreshing] = useState(false);
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        if (storeData.active) {
            stopTimer();
        }
        setTimeout(() => setRefreshing(false), 800);
    }, [storeData.active]);

    // Determina el texto principal y la etiqueta a mostrar
    const mainText = storeData.phase === 'COUNTDOWN'
        ? storeData.countdown
        : formatTime(storeData.seconds);

    const mainLabel = storeData.phase === 'COUNTDOWN'
        ? `Tiempo libre restante`
        : 'Tiempo Transcurrido (HH:MM:SS)';

    // Extraer info del QR (spot, parking name, etc.)
    const qrInfo = React.useMemo(() => {
        try {
            const url = new URL(rawQrData || '');
            return {
                spot: url.searchParams.get('spot') || 'N/A',
                parking: url.searchParams.get('parking') || 'Estacionamiento',
                nonce: url.searchParams.get('nonce') || '',
                ts: url.searchParams.get('ts') || '',
                from: url.searchParams.get('from') || '',
                scheme: 'openpayment',
            };
        } catch {
            return {
                spot: 'N/A',
                parking: 'Estacionamiento',
                nonce: '',
                ts: '',
                from: '',
                scheme: 'openpayment'
            };
        }
    }, [rawQrData]);

    const handlePaymentPress = () => {
        if (usuario && !esInvitado) {
            setPayModalVisible(true);
        } else {
            // Para invitados - pago en efectivo
            navigation.navigate("CashPayment", {
                monto: storeData.cost,
                rawQrData
            });
        }
    };

    // Función para manejar pago con Open Payments
    const handleOpenPaymentsPayment = () => {
        // Detener el timer antes de navegar
        stopTimer();

        // Navegar al tab de Wallet en AppTabs con los datos
        navigation.navigate("AppTabs", {
            screen: "Wallet",
            params: {
                qr: {
                    amount: storeData.cost.toString(),
                    raw: rawQrData,
                    scheme: qrInfo.scheme,
                    nonce: qrInfo.nonce,
                    ts: qrInfo.ts,
                    from: qrInfo.from,
                    spot: qrInfo.spot,
                    parking: qrInfo.parking,
                    elapsedTime: storeData.seconds,
                    finalCost: storeData.cost
                }
            }
        });

        setPayModalVisible(false);
    };

    return (
        <View style={s.container}>
            {/* Logo de fondo transparente */}
            <Image
                source={require('../../assets/images/Logo_ocelon.jpg')}
                style={[s.backgroundLogo, {
                    width: width * 0.8,
                    height: width * 0.8,
                }]}
                resizeMode="contain"
            />

            <ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    alignItems: 'center',
                    paddingHorizontal: PADDING,
                    paddingTop: insets.top + vs(16), // Respeta el notch + padding extra
                    paddingBottom: vs(40),
                    minHeight: height,
                }}
                showsVerticalScrollIndicator={true}
                bounces={true}
                alwaysBounceVertical={true}
                scrollEnabled={true}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#42b883"
                        colors={['#42b883']}
                        progressViewOffset={insets.top} // Ajusta el indicador de refresh
                    />
                }
            >
                <View style={{ width: '100%', alignItems: 'center' }}>

                    {/* Header */}
                    <View style={[s.header, { marginBottom: vs(24), paddingVertical: vs(8) }]}>
                        <TouchableOpacity
                            style={s.backButton}
                            onPress={handleGoBack}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="arrow-back" size={26} color="#42b883" />
                        </TouchableOpacity>
                        <Text style={[s.headerTitle, { fontSize: ms(18) }]}>
                            {qrInfo.parking}
                        </Text>
                        <View style={s.headerPlaceholder} />
                    </View>

                    {/* Cajón info */}
                    <View style={[s.spotBadge, { marginBottom: vs(16) }]}>
                        <Ionicons name="car" size={ms(16)} color="#0b0b0c" />
                        <Text style={s.spotText}>Cajón {qrInfo.spot}</Text>
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
                        <Text style={[s.timerLabel, { fontSize: ms(12) }]}>
                            {mainLabel}
                        </Text>
                    </View>

                    {/* Contador de Costo - EN USD */}
                    <View style={[s.costCard, { maxWidth: MAX_W, borderRadius: CARD_RADIUS, padding: hs(16) }]}>
                        <View style={s.costHeader}>
                            <View style={s.costIconContainer}>
                                <Ionicons name="logo-usd" size={ms(24)} color="#42b883" />
                            </View>
                            <Text style={[s.costTitle, { fontSize: ms(16) }]}>
                                Costo Total
                            </Text>
                        </View>

                        <Text style={[s.costAmount, { fontSize: ms(40) }]}>
                            {formatUSD(storeData.cost)}
                        </Text>

                        <View style={s.rateInfo}>
                            <Ionicons name="time-outline" size={ms(14)} color="#9f9faf" />
                            <Text style={[s.costSubtitle, { fontSize: ms(12) }]}>
                                ${RATE_USD_PER_INTERVAL.toFixed(2)} USD cada {INTERVAL_SECONDS} segundos
                            </Text>
                        </View>

                        {/* Indicador de conversión */}
                        <View style={s.conversionBanner}>
                            <Ionicons name="swap-horizontal" size={ms(16)} color="#6C63FF" />
                            <Text style={s.conversionText}>
                                Se convertirá a MXN al pagar
                            </Text>
                        </View>
                    </View>

                    {/* Información del QR */}
                    <View style={[s.qrCard, { maxWidth: MAX_W, borderRadius: CARD_RADIUS, padding: hs(14) }]}>
                        <Text style={[s.qrTitle, { fontSize: ms(14) }]}>
                            Detalles de la Sesión
                        </Text>

                        <View style={s.qrRow}>
                            <Ionicons name="finger-print-outline" size={ms(14)} color="#9aa0a6" />
                            <Text style={s.qrLabel}>ID Sesión:</Text>
                            <Text style={s.qrValue} numberOfLines={1}>
                                {qrInfo.nonce.slice(0, 12)}...
                            </Text>
                        </View>

                        <View style={s.qrRow}>
                            <Ionicons name="location-outline" size={ms(14)} color="#9aa0a6" />
                            <Text style={s.qrLabel}>Cajón:</Text>
                            <Text style={s.qrValue}>{qrInfo.spot}</Text>
                        </View>

                        <View style={s.qrRow}>
                            <Ionicons name="business-outline" size={ms(14)} color="#9aa0a6" />
                            <Text style={s.qrLabel}>Estacionamiento:</Text>
                            <Text style={s.qrValue}>{qrInfo.parking}</Text>
                        </View>

                        <View style={s.qrRow}>
                            <Ionicons name="time-outline" size={ms(14)} color="#9aa0a6" />
                            <Text style={s.qrLabel}>Tiempo transcurrido:</Text>
                            <Text style={s.qrValue}>{formatTime(storeData.seconds)}</Text>
                        </View>
                    </View>

                    {/* Botón Pagar */}
                    <TouchableOpacity
                        style={[
                            s.primaryBtn,
                            {
                                borderRadius: CARD_RADIUS,
                                paddingVertical: vs(16),
                                marginTop: vs(20),
                                marginBottom: vs(12),
                                width: '100%',
                                maxWidth: MAX_W,
                            }
                        ]}
                        onPress={handlePaymentPress}
                        disabled={storeData.cost === 0}
                    >
                        <Ionicons name="card-outline" size={ms(20)} color="#0b0b0c" />
                        <Text style={[s.btnText, { fontSize: ms(16) }]}>
                            Pagar {formatUSD(storeData.cost)}
                        </Text>
                    </TouchableOpacity>

                    {/* Botón secundario - Detener sin pagar (para testing) */}
                    <TouchableOpacity
                        style={[
                            s.secondaryBtn,
                            {
                                borderRadius: CARD_RADIUS,
                                paddingVertical: vs(12),
                                width: '100%',
                                maxWidth: MAX_W,
                            }
                        ]}
                        onPress={() => {
                            stopTimer();
                            navigation.navigate("AppTabs");
                        }}
                    >
                        <Ionicons name="stop-circle-outline" size={ms(18)} color="#ff6b6b" />
                        <Text style={s.secondaryBtnText}>
                            Cancelar (Debug)
                        </Text>
                    </TouchableOpacity>

                    <PayModal
                        visible={isPayModalVisible}
                        total={storeData.cost}
                        rawQrData={rawQrData}
                        onClose={() => setPayModalVisible(false)}
                        navigation={navigation}
                        onOpenPaymentsPress={handleOpenPaymentsPayment}
                    />

                    {/* Footer */}
                    <Text style={[s.footer, { fontSize: ms(11), marginTop: vs(24) }]}>
                        © {new Date().getFullYear()} Ocelon — Estacionamiento Inteligente
                    </Text>

                    {/* Espaciado extra para asegurar scroll */}
                    <View style={{ height: vs(20) }} />
                </View>
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0b0b0c'
    },
    backgroundLogo: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [
            { translateX: -150 },  // Ajusta según el tamaño del logo
            { translateY: -150 }   // Ajusta según el tamaño del logo
        ],
        opacity: 0.05,
        zIndex: 0,
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1,
    },
    backButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: 'rgba(66, 184, 131, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(66, 184, 131, 0.3)',
    },
    headerTitle: {
        color: '#fff',
        fontWeight: '700',
        textAlign: 'center',
        flex: 1,
    },
    headerPlaceholder: {
        width: 46,
    },
    spotBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#42b883',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        zIndex: 1,
    },
    spotText: {
        color: '#0b0b0c',
        fontWeight: '800',
        fontSize: 14,
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
        zIndex: 1,
    },
    timerText: {
        fontWeight: '700',
    },
    timerLabel: {
        color: '#c9c9cf',
        marginTop: 8,
        textAlign: 'center',
    },
    costCard: {
        width: '100%',
        backgroundColor: '#131318',
        borderWidth: 1,
        borderColor: '#202028',
        alignItems: 'center',
        zIndex: 1,
    },
    costHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    costIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(66, 184, 131, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    costTitle: {
        color: '#fff',
        fontWeight: '600',
    },
    costAmount: {
        color: '#42b883',
        fontWeight: '900',
        marginBottom: 8,
    },
    rateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    costSubtitle: {
        color: '#9f9faf',
        textAlign: 'center',
    },
    conversionBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(108, 99, 255, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginTop: 12,
        borderWidth: 1,
        borderColor: 'rgba(108, 99, 255, 0.3)',
    },
    conversionText: {
        color: '#6C63FF',
        fontSize: 12,
        fontWeight: '600',
    },
    qrCard: {
        width: '100%',
        backgroundColor: '#151518',
        borderWidth: 1,
        borderColor: '#202028',
        marginTop: 12,
        zIndex: 1,
    },
    qrTitle: {
        color: '#fff',
        fontWeight: '600',
        marginBottom: 12,
    },
    qrRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 6,
    },
    qrLabel: {
        color: '#9aa0a6',
        fontSize: 12,
    },
    qrValue: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 'auto',
    },
    primaryBtn: {
        backgroundColor: '#42b883',
        paddingHorizontal: 30,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 10,
        zIndex: 1,
    },
    btnText: {
        color: '#0b0b0c',
        fontWeight: '800'
    },
    secondaryBtn: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#3a3a42',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        zIndex: 1,
    },
    secondaryBtnText: {
        color: '#ff6b6b',
        fontWeight: '600',
        fontSize: 14,
    },
    footer: {
        color: '#85859a',
        textAlign: 'center',
        zIndex: 1,
    },
});