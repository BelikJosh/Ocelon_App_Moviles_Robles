// MapScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import MapView, { Callout, Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type Spot = {
  id: string;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
};

const PARKING_SPOTS: Spot[] = [
  { id: 'p-1', title: 'Ocelon Centro', description: '24h · Tech-friendly', latitude: 19.4337, longitude: -99.1410 },
  { id: 'p-2', title: 'Ocelon Norte', description: 'Cubierto · Cámaras', latitude: 19.4515, longitude: -99.1365 },
  { id: 'p-3', title: 'Ocelon Sur', description: 'Pago con QR', latitude: 19.4040, longitude: -99.1520 },
];

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1f1f24' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#c8c8d0' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1f1f24' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1a1a1f' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a30' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#a9a9b2' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#101015' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#6e6e7a' }] },
];

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // Escalas responsivas
  const BASE_W = 375, BASE_H = 812;
  const hs = (n: number) => (width / BASE_W) * n;
  const vs = (n: number) => (height / BASE_H) * n;
  const ms = (n: number, f = 0.5) => n + (hs(n) - n) * f;

  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 19.4326, // CDMX
    longitude: -99.1332,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  });
  const [locating, setLocating] = useState(false);
  const [headerH, setHeaderH] = useState(0); // medimos header

  // Ajusta cámara a todos los spots al montar y cuando cambia el header/top inset
  useEffect(() => {
    fitAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerH, insets.top]);

  const fitAll = useCallback(() => {
    if (!mapRef.current) return;
    const coords = PARKING_SPOTS.map(s => ({ latitude: s.latitude, longitude: s.longitude }));
    if (!coords.length) return;

    mapRef.current.fitToCoordinates(coords, {
      edgePadding: {
        top: Math.ceil(insets.top + headerH + vs(10)),
        right: hs(40),
        bottom: Math.ceil(insets.bottom + vs(120)),
        left: hs(40),
      },
      animated: true,
    });
  }, [hs, vs, headerH, insets.top, insets.bottom]);

  const goToMyLocation = useCallback(async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Activa el permiso de ubicación para centrar el mapa en tu posición.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const next: Region = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      };
      setRegion(next);
      mapRef.current?.animateToRegion(next, 800);
    } catch {
      Alert.alert('Ups', 'No se pudo obtener tu ubicación.');
    } finally {
      setLocating(false);
    }
  }, []);

  return (
    <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0b0c" translucent={false} />

      {/* Header */}
      <View
        style={s.header}
        onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}
      >
        <View style={s.headerLeft}>
          <View style={[s.headerIcon, { borderRadius: hs(12), marginRight: 10 }]}>
            <Ionicons name="map-outline" size={ms(20)} color="#42b883" />
          </View>
          <View>
            <Text style={[s.title, { fontSize: ms(20) }]}>Mapa de estacionamientos</Text>
            <Text style={[s.subtitle, { fontSize: ms(12), marginTop: 2 }]}>Solo visualización de ubicaciones</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={fitAll}
          style={[s.badge, { paddingHorizontal: hs(10), paddingVertical: vs(6) }]}
        >
          <Ionicons name="resize-outline" size={ms(14)} color="#0b0b0c" />
          <Text style={[s.badgeText, { fontSize: ms(12), marginLeft: 6 }]}>Ver todos</Text>
        </TouchableOpacity>
      </View>

      <MapView
        ref={mapRef}
        style={s.map}
        provider={PROVIDER_GOOGLE} // quítalo en iOS si no usas Google Maps
        initialRegion={region}
        customMapStyle={DARK_MAP_STYLE as any}
        onRegionChangeComplete={setRegion}
        showsCompass
        showsUserLocation
        toolbarEnabled={false}
        paddingAdjustmentBehavior="always"
        {...(Platform.OS === 'android'
          ? {
              // Evita que controles/markers se oculten tras status/tab bars
              mapPadding: {
                top: Math.ceil(insets.top + headerH),
                right: 0,
                bottom: Math.ceil(insets.bottom + vs(16)),
                left: 0,
              },
            }
          : {})}
      >
        {PARKING_SPOTS.map((spot) => (
          <Marker
            key={spot.id}
            coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
            title={spot.title}
            description={spot.description}
            tracksViewChanges={false}
          >
            <View style={s.pin}>
              <Ionicons name="car-sport" size={ms(16)} color="#0b0b0c" />
            </View>
            <Callout tooltip>
              <View style={s.callout}>
                <Text style={s.calloutTitle}>{spot.title}</Text>
                {!!spot.description && <Text style={s.calloutDesc}>{spot.description}</Text>}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* FABs */}
      <View style={[s.fabs, { bottom: Math.max(16, insets.bottom + 12) }]}>
        <TouchableOpacity onPress={goToMyLocation} style={[s.fab, locating && { opacity: 0.7 }]}>
          <Ionicons name="locate" size={ms(20)} color="#0b0b0c" />
        </TouchableOpacity>
        <TouchableOpacity onPress={fitAll} style={[s.fab, { marginTop: 10 }]}>
          <Ionicons name="grid" size={ms(20)} color="#0b0b0c" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0c' },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerIcon: {
    width: 40, height: 40, backgroundColor: '#121215', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#1f1f25',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 },
    }),
  },
  title: { color: '#fff', fontWeight: '800' },
  subtitle: { color: '#bdbdbd' },
  badge: {
    backgroundColor: '#42b883',
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: { color: '#0b0b0c', fontWeight: '800' },

  map: { flex: 1 },

  pin: {
    backgroundColor: '#42b883',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1c744f',
  },
  callout: {
    backgroundColor: '#151518',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#202028',
  },
  calloutTitle: { color: '#fff', fontWeight: '800' },
  calloutDesc: { color: '#cfcfff', marginTop: 2 },

  fabs: {
    position: 'absolute',
    right: 16,
    // bottom se calcula con insets.bottom
    alignItems: 'flex-end',
  },
  fab: {
    backgroundColor: '#42b883',
    width: 46, height: 46,
    borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 5 },
    }),
  },
});
