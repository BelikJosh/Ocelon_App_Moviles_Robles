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
import { useConfig } from '../contexts/ConfigContext'; // Importa el hook

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
    const { t, isDark } = useConfig(); // Usa el hook de configuración
    const hs = (size: number) => (width / BASE_W) * size;
    const vs = (size: number) => (height / BASE_H) * size;
    const ms = (size: number, factor = 0.5) => size + (hs(size) - size) * factor;

    // Colores dinámicos según el tema
    const colors = {
        background: isDark ? '#0b0b0c' : '#f8f9fa',
        card: isDark ? '#151518' : '#ffffff',
        text: isDark ? '#ffffff' : '#000000',
        textSecondary: isDark ? '#c9c9cf' : '#666666',
        border: isDark ? '#202028' : '#e0e0e0',
        primary: '#42b883',
        secondary: isDark ? '#121215' : '#f1f3f4',
        timerBackground: isDark ? '#121215' : '#f8f9fa',
        timerBorder: isDark ? '#42b883' : '#42b883',
        countdownColor: '#ffaa00',
        error: '#ff6b6b',
        conversion: isDark ? '#6C63FF' : '#3f51b5',
        conversionBackground: isDark ? 'rgba(108, 99, 255, 0.1)' : 'rgba(63, 81, 181, 0.1)',
        conversionBorder: isDark ? 'rgba(108, 99, 255, 0.3)' : 'rgba(63, 81, 181, 0.2)',
    };

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
                t('parkingTime'),
                `${t('time')}: ${formatTime(storeData.seconds)} - ${t('cost')}: $${storeData.cost.toFixed(2)} USD`
            );
        }, 30000);

        return () => clearInterval(interval);
    }, [storeData.seconds, storeData.cost, storeData.active, t]);

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
        ? t('freeTimeRemaining')
        : t('elapsedTime');

    // Extraer info del QR (spot, parking name, etc.)
    const qrInfo = React.useMemo(() => {
        try {
            const url = new URL(rawQrData || '');
            return {
                spot: url.searchParams.get('spot') || 'N/A',
                parking: url.searchParams.get('parking') || t('parking'),
                nonce: url.searchParams.get('nonce') || '',
                ts: url.searchParams.get('ts') || '',
                from: url.searchParams.get('from') || '',
                scheme: 'openpayment',
            };
        } catch {
            return {
                spot: 'N/A',
                parking: t('parking'),
                nonce: '',
                ts: '',
                from: '',
                scheme: 'openpayment'
            };
        }
    }, [rawQrData, t]);

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
        <View style={[s.container, { backgroundColor: colors.background }]}>
            {/* Logo de fondo transparente */}
            <Image
                source={require('../../assets/images/Logo_ocelon.jpg')}
                style={[s.backgroundLogo, {
                    width: width * 0.8,
                    height: width * 0.8,
                    opacity: isDark ? 0.05 : 0.03,
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
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                        progressViewOffset={insets.top} // Ajusta el indicador de refresh
                    />
                }
            >
                <View style={{ width: '100%', alignItems: 'center' }}>

                    {/* Header */}
                    <View style={[s.header, { marginBottom: vs(24), paddingVertical: vs(8) }]}>
                        <TouchableOpacity
                            style={[s.backButton, { 
                                backgroundColor: isDark ? 'rgba(66, 184, 131, 0.15)' : 'rgba(66, 184, 131, 0.1)',
                                borderColor: isDark ? 'rgba(66, 184, 131, 0.3)' : 'rgba(66, 184, 131, 0.2)',
                            }]}
                            onPress={handleGoBack}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="arrow-back" size={26} color={colors.primary} />
                        </TouchableOpacity>
                        <Text style={[s.headerTitle, { 
                            fontSize: ms(18),
                            color: colors.text 
                        }]}>
                            {qrInfo.parking}
                        </Text>
                        <View style={s.headerPlaceholder} />
                    </View>

                    {/* Cajón info */}
                    <View style={[s.spotBadge, { marginBottom: vs(16), backgroundColor: colors.primary }]}>
                        <Ionicons name="car" size={ms(16)} color="#0b0b0c" />
                        <Text style={s.spotText}>{t('spot')} {qrInfo.spot}</Text>
                    </View>

                    {/* Contenedor Principal del Tiempo (Círculo) */}
                    <View
                        style={[s.timerCircle, {
                            width: LOGO_TIMER,
                            height: LOGO_TIMER,
                            borderRadius: LOGO_TIMER / 2,
                            marginBottom: vs(16),
                            backgroundColor: colors.timerBackground,
                            borderColor: storeData.phase === 'COUNTDOWN' ? colors.countdownColor : colors.timerBorder,
                        }]}
                    >
                        <Text style={[
                            s.timerText,
                            {
                                fontSize: storeData.phase === 'COUNTDOWN' ? ms(50) : ms(36),
                                fontWeight: storeData.phase === 'COUNTDOWN' ? '800' : '600',
                                color: storeData.phase === 'COUNTDOWN' ? colors.countdownColor : colors.primary,
                            }
                        ]}>
                            {mainText}
                        </Text>
                        <Text style={[s.timerLabel, { 
                            fontSize: ms(12),
                            color: colors.textSecondary 
                        }]}>
                            {mainLabel}
                        </Text>
                    </View>

                    {/* Contador de Costo - EN USD */}
                    <View style={[s.costCard, { 
                        maxWidth: MAX_W, 
                        borderRadius: CARD_RADIUS, 
                        padding: hs(16),
                        backgroundColor: colors.card,
                        borderColor: colors.border 
                    }]}>
                        <View style={s.costHeader}>
                            <View style={[s.costIconContainer, { 
                                backgroundColor: isDark ? 'rgba(66, 184, 131, 0.15)' : 'rgba(66, 184, 131, 0.1)' 
                            }]}>
                                <Ionicons name="logo-usd" size={ms(24)} color={colors.primary} />
                            </View>
                            <Text style={[s.costTitle, { 
                                fontSize: ms(16),
                                color: colors.text 
                            }]}>
                                {t('totalCost')}
                            </Text>
                        </View>

                        <Text style={[s.costAmount, { 
                            fontSize: ms(40),
                            color: colors.primary 
                        }]}>
                            {formatUSD(storeData.cost)}
                        </Text>

                        <View style={s.rateInfo}>
                            <Ionicons name="time-outline" size={ms(14)} color={colors.textSecondary} />
                            <Text style={[s.costSubtitle, { 
                                fontSize: ms(12),
                                color: colors.textSecondary 
                            }]}>
                                ${RATE_USD_PER_INTERVAL.toFixed(2)} USD {t('every')} {INTERVAL_SECONDS} {t('seconds')}
                            </Text>
                        </View>

                        {/* Indicador de conversión */}
                        <View style={[s.conversionBanner, { 
                            backgroundColor: colors.conversionBackground,
                            borderColor: colors.conversionBorder 
                        }]}>
                            <Ionicons name="swap-horizontal" size={ms(16)} color={colors.conversion} />
                            <Text style={[s.conversionText, { color: colors.conversion }]}>
                                {t('willConvertToMXN')}
                            </Text>
                        </View>
                    </View>

                    {/* Información del QR */}
                    <View style={[s.qrCard, { 
                        maxWidth: MAX_W, 
                        borderRadius: CARD_RADIUS, 
                        padding: hs(14),
                        backgroundColor: colors.card,
                        borderColor: colors.border 
                    }]}>
                        <Text style={[s.qrTitle, { 
                            fontSize: ms(14),
                            color: colors.text 
                        }]}>
                            {t('sessionDetails')}
                        </Text>

                        <View style={s.qrRow}>
                            <Ionicons name="finger-print-outline" size={ms(14)} color={colors.textSecondary} />
                            <Text style={[s.qrLabel, { color: colors.textSecondary }]}>{t('sessionId')}:</Text>
                            <Text style={[s.qrValue, { color: colors.text }]} numberOfLines={1}>
                                {qrInfo.nonce.slice(0, 12)}...
                            </Text>
                        </View>

                        <View style={s.qrRow}>
                            <Ionicons name="location-outline" size={ms(14)} color={colors.textSecondary} />
                            <Text style={[s.qrLabel, { color: colors.textSecondary }]}>{t('spot')}:</Text>
                            <Text style={[s.qrValue, { color: colors.text }]}>{qrInfo.spot}</Text>
                        </View>

                        <View style={s.qrRow}>
                            <Ionicons name="business-outline" size={ms(14)} color={colors.textSecondary} />
                            <Text style={[s.qrLabel, { color: colors.textSecondary }]}>{t('parking')}:</Text>
                            <Text style={[s.qrValue, { color: colors.text }]}>{qrInfo.parking}</Text>
                        </View>

                        <View style={s.qrRow}>
                            <Ionicons name="time-outline" size={ms(14)} color={colors.textSecondary} />
                            <Text style={[s.qrLabel, { color: colors.textSecondary }]}>{t('elapsedTime')}:</Text>
                            <Text style={[s.qrValue, { color: colors.text }]}>{formatTime(storeData.seconds)}</Text>
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
                                backgroundColor: colors.primary
                            }
                        ]}
                        onPress={handlePaymentPress}
                        disabled={storeData.cost === 0}
                    >
                        <Ionicons name="card-outline" size={ms(20)} color="#0b0b0c" />
                        <Text style={[s.btnText, { fontSize: ms(16) }]}>
                            {t('pay')} {formatUSD(storeData.cost)}
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
                                backgroundColor: 'transparent',
                                borderColor: colors.border 
                            }
                        ]}
                        onPress={() => {
                            stopTimer();
                            navigation.navigate("AppTabs");
                        }}
                    >
                        <Ionicons name="stop-circle-outline" size={ms(18)} color={colors.error} />
                        <Text style={[s.secondaryBtnText, { color: colors.error }]}>
                            {t('cancelDebug')}
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
                    <Text style={[s.footer, { 
                        fontSize: ms(11), 
                        marginTop: vs(24),
                        color: colors.textSecondary 
                    }]}>
                        © {new Date().getFullYear()} Ocelon — {t('smartParking')}
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
    },
    backgroundLogo: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [
            { translateX: -150 },  // Ajusta según el tamaño del logo
            { translateY: -150 }   // Ajusta según el tamaño del logo
        ],
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
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    headerTitle: {
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
        marginTop: 8,
        textAlign: 'center',
    },
    costCard: {
        width: '100%',
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    costTitle: {
        fontWeight: '600',
    },
    costAmount: {
        fontWeight: '900',
        marginBottom: 8,
    },
    rateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    costSubtitle: {
        textAlign: 'center',
    },
    conversionBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginTop: 12,
        borderWidth: 1,
    },
    conversionText: {
        fontSize: 12,
        fontWeight: '600',
    },
    qrCard: {
        width: '100%',
        marginTop: 12,
        zIndex: 1,
    },
    qrTitle: {
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
        fontSize: 12,
    },
    qrValue: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 'auto',
    },
    primaryBtn: {
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
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        borderWidth: 1,
        zIndex: 1,
    },
    secondaryBtnText: {
        fontWeight: '600',
        fontSize: 14,
    },
    footer: {
        textAlign: 'center',
        zIndex: 1,
    },
});