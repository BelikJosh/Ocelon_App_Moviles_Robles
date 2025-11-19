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
import { RootStackParamList } from '../navigation/types/navigation';
import { startTimer } from '../utils/TimerStore';

type ScannerScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Timer'>;

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const navigation = useNavigation<ScannerScreenNavigationProp>();

const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    console.log(`📸 QR escaneado - Tipo: ${type}, Datos: ${data}`);
    
    // Iniciar el timer global
    startTimer(data);
    
    // Navegar a TimerScreen
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
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="camera-outline" size={50} color="#42b883" />
          <Text style={styles.loadingText}>Cargando permisos...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-off-outline" size={50} color="#ff6b6b" />
          <Text style={styles.permissionText}>Sin acceso a la cámara</Text>
          <Text style={styles.permissionSubtext}>
            Necesitamos acceso a la cámara para escanear códigos QR
          </Text>
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={requestPermission} 
          >
            <Text style={styles.permissionButtonText}>Permitir cámara</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
        <TouchableOpacity style={styles.closeButton} onPress={handleManualClose}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Escanear QR</Text>
        <View style={styles.headerPlaceholder} />
      </View>
      
      {scanned && (
        <View style={styles.overlay}>
          <View style={styles.scanResult}>
            <Ionicons name="checkmark-circle" size={40} color="#42b883" />
            <Text style={styles.scanResultText}>¡QR Escaneado!</Text>
            <Text style={styles.scanResultSubtext}>Redirigiendo al temporizador...</Text>
            <TouchableOpacity 
              style={styles.scanAgainButton}
              onPress={() => setScanned(false)} 
            >
              <Text style={styles.scanAgainText}>Escanear otro QR</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Marco de escaneo visual */}
      <View style={styles.scanFrame}>
        <View style={styles.cornerTopLeft} />
        <View style={styles.cornerTopRight} />
        <View style={styles.cornerBottomLeft} />
        <View style={styles.cornerBottomRight} />
      </View>
      
      {/* Instrucciones */}
      <View style={styles.instructionContainer}>
        <Text style={styles.instruction}>
          Encuadra el código QR dentro del marco
        </Text>
        <Text style={styles.instructionSubtext}>
          El escaneo es automático
        </Text>
      </View>
    </View>
  );
}

// Los estilos se mantienen igual...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: '#000',
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  headerPlaceholder: {
    width: 40,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  scanResult: {
    backgroundColor: '#1a1a1a',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  scanResultText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  scanResultSubtext: {
    color: '#b0b0b0',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  scanAgainButton: {
    backgroundColor: '#42b883',
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
    borderColor: '#42b883',
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderColor: '#42b883',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#42b883',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#42b883',
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  instructionSubtext: {
    color: '#b0b0b0',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0b0b0c',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0b0b0c',
    paddingHorizontal: 40,
  },
  permissionText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionSubtext: {
    color: '#b0b0b0',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: '#42b883',
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