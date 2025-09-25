// ScannerScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { DynamoDBService } from '../services/DynamoService'; // ⬅️ tu servicio real


const CURRENT_USER_ID = 'USER#1758339411234_5487';

function parseOpenPaymentPayload(data: string) {
  const tryParse = (urlStr: string) => {
    const u = new URL(urlStr);
    const params = Object.fromEntries(u.searchParams.entries());
    return {
      scheme: u.protocol.replace(':', ''),
      path: (u.hostname ? `/${u.hostname}` : '') + (u.pathname || ''),
      ...params,
      raw: data,
    };
  };
  try {
    if (data.startsWith('openpayment://')) {
      const normalized = data.replace('openpayment://', 'https://openpayment.local/');
      const parsed = tryParse(normalized);
      (parsed as any).scheme = 'openpayment';
      (parsed as any).path = '/pay';
      return parsed;
    }
    return tryParse(data);
  } catch {
    return { raw: data };
  }
}



export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();

  // Escalas responsivas
  const { width, height } = useWindowDimensions();
  const BASE_W = 375, BASE_H = 812;
  const hs = (n: number) => (width / BASE_W) * n;
  const vs = (n: number) => (height / BASE_H) * n;
  const ms = (n: number, f = 0.5) => n + (hs(n) - n) * f;

  const FRAME_SIZE = Math.min(width * 0.64, 300);
  const CORNER = Math.max(20, hs(22));
  const LOGO = Math.min(hs(44), 60);

  // anti-spam: protege de múltiples lecturas en milisegundos
  const lastDataRef = useRef<string | null>(null);

  const onBarcodeScanned = useCallback(
    async ({ data }: { data: string; type?: string }) => {
      if (scanned || data === lastDataRef.current) return; // evita lecturas repetidas
      lastDataRef.current = data;

      setScanned(true);
      setLoading(true);
      try {
        // guarda el QR en Dynamo (campo "QR" del usuario actual)
        await DynamoDBService.actualizarQRUsuario(CURRENT_USER_ID, data);

        const parsed = parseOpenPaymentPayload(data);
        navigation.navigate('Wallet', { qr: parsed });
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'No se pudo guardar el QR. Intenta de nuevo.');
        lastDataRef.current = null; // permite reintentar
      } finally {
        setLoading(false);
        setTimeout(() => setScanned(false), 600);
      }
    },
    [scanned, navigation]
  );

  let content: React.ReactNode = null;

  if (!permission) {
    content = (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.info}>Verificando permisos…</Text>
      </View>
    );
  } else if (!permission.granted) {
    content = (
      <View style={styles.center}>
        {/* Logo arriba */}
        <Image
          source={require('../../assets/images/Logo_ocelon.jpg')}
          style={{ width: LOGO * 2, height: LOGO * 2, borderRadius: hs(12), marginBottom: vs(12) }}
          resizeMode="cover"
        />
        <Text style={[styles.title, { fontSize: ms(20) }]}>Necesitamos acceso a la cámara</Text>
        <Text style={[styles.info, { fontSize: ms(13), marginTop: vs(4) }]}>
          Para escanear códigos QR, permite el acceso a la cámara.
        </Text>

        <TouchableOpacity style={[styles.primaryBtn, { marginTop: vs(14), borderRadius: hs(12) }]} onPress={requestPermission}>
          <Ionicons name="camera-outline" size={ms(16)} color="#fff" />
          <Text style={[styles.btnText, { marginLeft: 8 }]}>Conceder permiso</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.secondaryBtn, { marginTop: vs(10) }]} onPress={() => Linking.openSettings()}>
          <Text style={styles.secondaryText}>Abrir ajustes</Text>
        </TouchableOpacity>
      </View>
    );
  } else {
    content = (
      <>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={onBarcodeScanned as any}
        />

        {/* Overlay superior con logo + título */}
        <View style={[styles.topOverlay, { paddingHorizontal: hs(14), paddingVertical: vs(10), marginTop:50 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={require('../../assets/images/Logo_ocelon.jpg')}
              style={{
                width: LOGO,
                height: LOGO,
                borderRadius: hs(10),
                marginRight: hs(10),
                borderWidth: 1,
                borderColor: '#2a2a30',
              }}
              resizeMode="cover"
            />
            <View>
              <Text style={[styles.overlayTitle, { fontSize: ms(16) }]}>Escáner Ocelon</Text>
              <Text style={[styles.overlayInfo, { fontSize: ms(12) }]}>Apunta al código dentro del marco</Text>
            </View>
          </View>
          {loading && <ActivityIndicator style={{ marginTop: vs(6) }} />}
        </View>

        {/* Marco de escaneo (esquinas) */}
        <View
          pointerEvents="none"
          style={[
            styles.frameBox,
            { width: FRAME_SIZE, height: FRAME_SIZE, top: height * 0.26 },
          ]}
        >
          {/* Esquinas */}
          <View style={[styles.cornerTL, { width: CORNER, height: CORNER, borderTopLeftRadius: hs(16) }]} />
          <View style={[styles.cornerTR, { width: CORNER, height: CORNER, borderTopRightRadius: hs(16) }]} />
          <View style={[styles.cornerBL, { width: CORNER, height: CORNER, borderBottomLeftRadius: hs(16) }]} />
          <View style={[styles.cornerBR, { width: CORNER, height: CORNER, borderBottomRightRadius: hs(16) }]} />
        </View>

        {/* Tip inferior */}
        <View style={[styles.bottomTip, { paddingHorizontal: hs(14), paddingVertical: vs(10) }]}>
          <Ionicons name="qr-code-outline" size={ms(14)} color="#cfcfff" />
          <Text style={[styles.bottomText, { marginLeft: 6, fontSize: ms(12) }]}>
            Solo QR de pago (Open Payments)
          </Text>
        </View>
      </>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent={false} />
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // estados sin cámara
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontWeight: '700', marginBottom: 4, textAlign: 'center', color: '#fff' },
  info: { fontSize: 14, color: '#aaa', textAlign: 'center' },
  primaryBtn: {
    backgroundColor: '#42b883',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
  },
  btnText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: { padding: 8 },
  secondaryText: { color: '#cfcfff', fontWeight: '600' },

  // overlay superior
  topOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 12,
    backgroundColor: 'rgba(11,11,12,0.50)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a2a30',
  },
  overlayTitle: { color: '#fff', fontWeight: '800' },
  overlayInfo: { color: '#cfcfff' },

  // marco de escaneo (solo esquinas)
  frameBox: {
    position: 'absolute',
    alignSelf: 'center',
  },
  cornerTL: {
    position: 'absolute',
    left: 0, top: 0,
    borderLeftWidth: 4, borderTopWidth: 4,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  cornerTR: {
    position: 'absolute',
    right: 0, top: 0,
    borderRightWidth: 4, borderTopWidth: 4,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  cornerBL: {
    position: 'absolute',
    left: 0, bottom: 0,
    borderLeftWidth: 4, borderBottomWidth: 4,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  cornerBR: {
    position: 'absolute',
    right: 0, bottom: 0,
    borderRightWidth: 4, borderBottomWidth: 4,
    borderColor: 'rgba(255,255,255,0.95)',
  },

  // tip inferior
  bottomTip: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: Platform.select({ ios: 22, android: 18 }) as number,
    backgroundColor: 'rgba(11,11,12,0.50)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a30',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },
  bottomText: { color: '#cfcfff' },
});
