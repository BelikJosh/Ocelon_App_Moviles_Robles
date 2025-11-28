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
    const hs = (size: number) => (width / 375) * size;

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { maxWidth: width * 0.85 }]}>

                    {/* Header con logo */}
                    <View style={styles.header}>
                        <Image
                            source={require('../../assets/images/Logo_ocelon.jpg')}
                            style={[styles.logo, { width: hs(70), height: hs(70) }]}
                            resizeMode="cover"
                        />
                        <View style={styles.headerText}>
                            <Text style={styles.title}>¡Pago Exitoso! 🎉</Text>
                            <Text style={styles.subtitle}>Ocelon Estacionamiento</Text>
                        </View>
                    </View>

                    {/* Línea decorativa */}
                    <View style={styles.divider} />

                    {/* Icono de éxito */}
                    <View style={styles.successIcon}>
                        <Ionicons name="checkmark-circle" size={hs(80)} color="#42b883" />
                    </View>

                    {/* Información del pago */}
                    <View style={styles.infoSection}>
                        <Text style={styles.congratsText}>
                            Tu pago ha sido procesado exitosamente
                        </Text>

                        <View style={styles.detailsGrid}>
                            <View style={styles.detailItem}>
                                <Ionicons name="business-outline" size={hs(20)} color="#42b883" />
                                <Text style={styles.detailLabel}>Estacionamiento</Text>
                                <Text style={styles.detailValue}>{data.parking}</Text>
                            </View>

                            <View style={styles.detailItem}>
                                <Ionicons name="location-outline" size={hs(20)} color="#42b883" />
                                <Text style={styles.detailLabel}>Cajón</Text>
                                <Text style={styles.detailValue}>{data.spot}</Text>
                            </View>

                            <View style={styles.detailItem}>
                                <Ionicons name="time-outline" size={hs(20)} color="#42b883" />
                                <Text style={styles.detailLabel}>Tiempo</Text>
                                <Text style={styles.detailValue}>{data.time}</Text>
                            </View>

                            <View style={styles.detailItem}>
                                <Ionicons name="card-outline" size={hs(20)} color="#42b883" />
                                <Text style={styles.detailLabel}>Total Pagado</Text>
                                <Text style={[styles.detailValue, styles.amount]}>
                                    ${data.amount.toFixed(2)} USD
                                </Text>
                            </View>
                        </View>

                        {/* Mensaje de siguiente paso */}
                        <View style={styles.nextStep}>
                            <Ionicons name="car-outline" size={hs(24)} color="#42b883" />
                            <Text style={styles.nextStepText}>
                                Dirígete a la salida y muestra el código QR
                            </Text>
                        </View>
                    </View>

                    {/* Botón de continuar */}
                    <TouchableOpacity
                        style={[styles.continueButton, { paddingVertical: hs(16) }]}
                        onPress={onContinue}
                    >
                        <Ionicons name="arrow-forward" size={hs(20)} color="#0b0b0c" />
                        <Text style={styles.continueButtonText}>Continuar a la Salida</Text>
                    </TouchableOpacity>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            ID de transacción: {data.paymentId ? data.paymentId.slice(0, 12) + '...' : 'N/A'}
                        </Text>
                        <Text style={styles.footerSubText}>
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#42b883',
        overflow: 'hidden',
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(66, 184, 131, 0.1)',
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
        color: '#42b883',
        fontSize: 22,
        fontWeight: '800',
    },
    subtitle: {
        color: '#b0b0b0',
        fontSize: 14,
        marginTop: 4,
    },
    divider: {
        height: 2,
        backgroundColor: 'rgba(66, 184, 131, 0.3)',
    },
    successIcon: {
        alignItems: 'center',
        paddingVertical: 20,
        backgroundColor: 'rgba(66, 184, 131, 0.05)',
    },
    infoSection: {
        padding: 20,
    },
    congratsText: {
        color: '#fff',
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
        backgroundColor: 'rgba(11, 11, 12, 0.5)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    detailLabel: {
        color: '#b0b0b0',
        fontSize: 12,
        marginTop: 6,
        textAlign: 'center',
    },
    detailValue: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
        textAlign: 'center',
    },
    amount: {
        color: '#42b883',
        fontWeight: '800',
        fontSize: 16,
    },
    nextStep: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(66, 184, 131, 0.1)',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(66, 184, 131, 0.3)',
    },
    nextStepText: {
        color: '#42b883',
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    continueButton: {
        backgroundColor: '#42b883',
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
        backgroundColor: 'rgba(11, 11, 12, 0.8)',
        borderTopWidth: 1,
        borderTopColor: '#333',
        alignItems: 'center',
    },
    footerText: {
        color: '#85859a',
        fontSize: 12,
        fontFamily: 'monospace',
    },
    footerSubText: {
        color: '#656575',
        fontSize: 10,
        marginTop: 2,
    },
});