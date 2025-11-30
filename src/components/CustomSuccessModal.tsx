// components/CustomSuccessModal.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { useConfig } from '../contexts/ConfigContext';

interface CustomSuccessModalProps {
    visible: boolean;
    onClose: () => void;
    onContinue: () => void;
    data: {
        parking: string;
        spot: string;
        amount: number;
        time: string;
        paymentId?: string;
    };
}

export default function CustomSuccessModal({
    visible,
    onClose,
    onContinue,
    data,
}: CustomSuccessModalProps) {
    const { width } = useWindowDimensions();
    const { t, isDark } = useConfig();
    const hs = (size: number) => (width / 375) * size;

    // Colores dinámicos
    const colors = {
        background: isDark ? '#1a1a1a' : '#ffffff',
        cardBackground: isDark ? '#1a1a1a' : '#ffffff',
        headerBg: isDark ? 'rgba(66, 184, 131, 0.1)' : 'rgba(66, 184, 131, 0.15)',
        text: isDark ? '#ffffff' : '#000000',
        textSecondary: isDark ? '#b0b0b0' : '#666666',
        border: isDark ? '#42b883' : '#42b883',
        secondaryBorder: isDark ? '#333' : '#e0e0e0',
        primary: '#42b883',
        success: '#42b883',
        overlay: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.7)',
        detailBg: isDark ? 'rgba(11, 11, 12, 0.5)' : 'rgba(66, 184, 131, 0.05)',
        nextStepBg: isDark ? 'rgba(66, 184, 131, 0.1)' : 'rgba(66, 184, 131, 0.15)',
        footerBg: isDark ? 'rgba(11, 11, 12, 0.8)' : 'rgba(248, 249, 250, 0.8)',
        footerText: isDark ? '#85859a' : '#666666',
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
                <View style={[
                    styles.modalContent, 
                    { 
                        maxWidth: width * 0.85,
                        backgroundColor: colors.background,
                        borderColor: colors.border
                    }
                ]}>

                    {/* Header con logo */}
                    <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
                        <Image
                            source={require('../../assets/images/Logo_ocelon.jpg')}
                            style={[styles.logo, { width: hs(70), height: hs(70) }]}
                            resizeMode="cover"
                        />
                        <View style={styles.headerText}>
                            <Text style={[styles.title, { color: colors.primary }]}>
                                {t('paymentSuccess')} 🎉
                            </Text>
                            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                                {t('ocelonParking')}
                            </Text>
                        </View>
                    </View>

                    {/* Línea decorativa */}
                    <View style={[styles.divider, { backgroundColor: 'rgba(66, 184, 131, 0.3)' }]} />

                    {/* Icono de éxito */}
                    <View style={[styles.successIcon, { backgroundColor: isDark ? 'rgba(66, 184, 131, 0.05)' : 'rgba(66, 184, 131, 0.08)' }]}>
                        <Ionicons name="checkmark-circle" size={hs(80)} color={colors.primary} />
                    </View>

                    {/* Información del pago */}
                    <View style={styles.infoSection}>
                        <Text style={[styles.congratsText, { color: colors.text }]}>
                            {t('paymentProcessed')}
                        </Text>

                        <View style={styles.detailsGrid}>
                            <View style={[
                                styles.detailItem, 
                                { 
                                    backgroundColor: colors.detailBg,
                                    borderColor: colors.secondaryBorder
                                }
                            ]}>
                                <Ionicons name="business-outline" size={hs(20)} color={colors.primary} />
                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                                    {t('parking')}
                                </Text>
                                <Text style={[styles.detailValue, { color: colors.text }]}>
                                    {data.parking}
                                </Text>
                            </View>

                            <View style={[
                                styles.detailItem, 
                                { 
                                    backgroundColor: colors.detailBg,
                                    borderColor: colors.secondaryBorder
                                }
                            ]}>
                                <Ionicons name="location-outline" size={hs(20)} color={colors.primary} />
                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                                    {t('spot')}
                                </Text>
                                <Text style={[styles.detailValue, { color: colors.text }]}>
                                    {data.spot}
                                </Text>
                            </View>

                            <View style={[
                                styles.detailItem, 
                                { 
                                    backgroundColor: colors.detailBg,
                                    borderColor: colors.secondaryBorder
                                }
                            ]}>
                                <Ionicons name="time-outline" size={hs(20)} color={colors.primary} />
                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                                    {t('time')}
                                </Text>
                                <Text style={[styles.detailValue, { color: colors.text }]}>
                                    {data.time}
                                </Text>
                            </View>

                            <View style={[
                                styles.detailItem, 
                                { 
                                    backgroundColor: colors.detailBg,
                                    borderColor: colors.secondaryBorder
                                }
                            ]}>
                                <Ionicons name="card-outline" size={hs(20)} color={colors.primary} />
                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                                    {t('totalPaid')}
                                </Text>
                                <Text style={[styles.detailValue, styles.amount, { color: colors.primary }]}>
                                    ${data.amount.toFixed(2)} USD
                                </Text>
                            </View>
                        </View>

                        {/* Mensaje de siguiente paso */}
                        <View style={[
                            styles.nextStep, 
                            { 
                                backgroundColor: colors.nextStepBg,
                                borderColor: 'rgba(66, 184, 131, 0.3)'
                            }
                        ]}>
                            <Ionicons name="car-outline" size={hs(24)} color={colors.primary} />
                            <Text style={[styles.nextStepText, { color: colors.primary }]}>
                                {t('goToExit')}
                            </Text>
                        </View>
                    </View>

                    {/* Botón de continuar */}
                    <TouchableOpacity
                        style={[styles.continueButton, { paddingVertical: hs(16), backgroundColor: colors.primary }]}
                        onPress={onContinue}
                    >
                        <Ionicons name="arrow-forward" size={hs(20)} color="#0b0b0c" />
                        <Text style={styles.continueButtonText}>
                            {t('continueToExit')}
                        </Text>
                    </TouchableOpacity>

                    {/* Footer */}
                    <View style={[
                        styles.footer, 
                        { 
                            backgroundColor: colors.footerBg,
                            borderTopColor: colors.secondaryBorder
                        }
                    ]}>
                        <Text style={[styles.footerText, { color: colors.footerText }]}>
                            {t('transactionId')}: {data.paymentId ? data.paymentId.slice(0, 12) + '...' : 'N/A'}
                        </Text>
                        <Text style={[styles.footerSubText, { color: colors.textSecondary }]}>
                            {new Date().toLocaleString()}
                        </Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        borderRadius: 20,
        borderWidth: 2,
        overflow: 'hidden',
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    logo: {
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#42b883',
    },
    headerText: {
        flex: 1,
        marginLeft: 15,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    divider: {
        height: 2,
    },
    successIcon: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    infoSection: {
        padding: 20,
    },
    congratsText: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 24,
    },
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 15,
        marginBottom: 20,
    },
    detailItem: {
        flex: 1,
        minWidth: '45%',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    detailLabel: {
        fontSize: 12,
        marginTop: 6,
        textAlign: 'center',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
        textAlign: 'center',
    },
    amount: {
        fontWeight: '800',
        fontSize: 16,
    },
    nextStep: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
    },
    nextStepText: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        margin: 20,
        borderRadius: 14,
    },
    continueButtonText: {
        color: '#0b0b0c',
        fontSize: 16,
        fontWeight: '800',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        fontFamily: 'monospace',
    },
    footerSubText: {
        fontSize: 10,
        marginTop: 2,
    },
});