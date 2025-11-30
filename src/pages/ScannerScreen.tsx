// screens/ScannerScreen.tsx - VERSIÓN ACTUALIZADA
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { RootStackParamList } from '../navegation/types/navigation';
import { startTimer } from '../utils/TimerStore';
import { useConfig } from '../contexts/ConfigContext'; // Importa el hook

type ScannerScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Timer'>;

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const navigation = useNavigation<ScannerScreenNavigationProp>();
  const { t, isDark } = useConfig(); // Usa el hook de configuración

  // Colores dinámicos según el tema
  const colors = {
    background: isDark ? '#000000' : '#000000', // Scanner siempre en fondo negro
    overlay: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.8)',
    card: isDark ? '#1a1a1a' : '#2a2a2a',
    text: '#ffffff',
    textSecondary: isDark ? '#b0b0b0' : '#cccccc',
    primary: '#42b883',
    buttonBackground: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.5)',
    permissionBackground: isDark ? '#0b0b0c' : '#1a1a1a',
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    console.log(`📸 QR escaneado - Tipo: ${type}, Datos: ${data}`);

    // Iniciar el timer global
    startTimer(data);

    // Navegar a TimerScreen con todos los datos del QR
    setTimeout(() => {
      navigation.navigate('Timer', {
        rawQrData: data
      });
    }, 500);
  };

  const handleManualClose = () => {
    navigation.goBack();
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.permissionBackground }]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="camera-outline" size={50} color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>{t('loadingPermissions')}</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.permissionBackground }]}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-off-outline" size={50} color="#ff6b6b" />
          <Text style={[styles.permissionText, { color: colors.text }]}>{t('noCameraAccess')}</Text>
          <Text style={[styles.permissionSubtext, { color: colors.textSecondary }]}>
            {t('cameraAccessRequired')}
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: colors.primary }]}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>{t('allowCamera')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "pdf417"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Header con botón de cerrar */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.buttonBackground }]} onPress={handleManualClose}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('scanQR')}</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {scanned && (
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.scanResult, { backgroundColor: colors.card }]}>
            <Ionicons name="checkmark-circle" size={40} color={colors.primary} />
            <Text style={[styles.scanResultText, { color: colors.text }]}>{t('qrScanned')}</Text>
            <Text style={[styles.scanResultSubtext, { color: colors.textSecondary }]}>
              {t('redirectingToTimer')}
            </Text>
            <TouchableOpacity
              style={[styles.scanAgainButton, { backgroundColor: colors.primary }]}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.scanAgainText}>{t('scanAnotherQR')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Marco de escaneo visual */}
      <View style={styles.scanFrame}>
        <View style={[styles.cornerTopLeft, { borderColor: colors.primary }]} />
        <View style={[styles.cornerTopRight, { borderColor: colors.primary }]} />
        <View style={[styles.cornerBottomLeft, { borderColor: colors.primary }]} />
        <View style={[styles.cornerBottomRight, { borderColor: colors.primary }]} />
      </View>

      {/* Instrucciones */}
      <View style={styles.instructionContainer}>
        <Text style={[styles.instruction, { color: colors.text }]}>
          {t('frameQRCode')}
        </Text>
        <Text style={[styles.instructionSubtext, { color: colors.textSecondary }]}>
          {t('scanningAutomatic')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerPlaceholder: {
    width: 40,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  scanResult: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  scanResultText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  scanResultSubtext: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  scanAgainButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  scanAgainText: {
    color: '#0b0b0c',
    fontSize: 16,
    fontWeight: '600',
  },
  scanFrame: {
    position: 'absolute',
    top: '30%',
    left: '15%',
    width: '70%',
    height: '30%',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderLeftWidth: 4,
    borderTopWidth: 4,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRightWidth: 4,
    borderTopWidth: 4,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRightWidth: 4,
    borderBottomWidth: 4,
  },
  instructionContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instruction: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  instructionSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#0b0b0c',
    fontSize: 16,
    fontWeight: '600',
  },
});