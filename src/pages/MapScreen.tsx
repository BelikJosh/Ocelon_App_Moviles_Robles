// MapScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import MapView, { Callout, Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    latitude: 19.4326,
    longitude: -99.1332,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  });
  const [locating, setLocating] = useState(false);
  const [headerH, setHeaderH] = useState(0);

  useEffect(() => {
    fitAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerH]);

  const fitAll = useCallback(() => {
    if (!mapRef.current) return;
    const coords = PARKING_SPOTS.map(s => ({ latitude: s.latitude, longitude: s.longitude }));
    if (!coords.length) return;

    mapRef.current.fitToCoordinates(coords, {
      edgePadding: {
        top: Math.ceil(headerH + vs(10)),
        right: hs(20),
        bottom: Math.ceil(insets.bottom + vs(120)),
        left: hs(20),
      },
      animated: true,
    });
  }, [hs, vs, headerH, insets.bottom]);

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
    <View style={s.container}>
      {/* Header */}
      <View
        style={s.header}
        onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}
      >
        <View style={s.headerLeft}>
          <View style={[s.headerIcon, { 
            width: hs(40), 
            height: hs(40), 
            borderRadius: hs(12), 
            marginRight: hs(10) 
          }]}>
            <Ionicons name="map-outline" size={ms(20)} color="#42b883" />
          </View>
          <View style={{ flex: 1, marginRight: hs(8) }}>
            <Text 
              style={[s.title, { fontSize: ms(18) }]} 
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              Mapa de estacionamientos
            </Text>
            <Text 
              style={[s.subtitle, { fontSize: ms(11), marginTop: 2 }]}
              numberOfLines={1}
            >
              Visualización de ubicaciones
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={fitAll}
          style={[s.badge, { 
            paddingHorizontal: hs(8), 
            paddingVertical: vs(5),
            minWidth: hs(80)
          }]}
        >
          <Ionicons name="resize-outline" size={ms(12)} color="#0b0b0c" />
          <Text style={[s.badgeText, { fontSize: ms(11), marginLeft: 4 }]}>Ver todos</Text>
        </TouchableOpacity>
      </View>

      <MapView
        ref={mapRef}
        style={s.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        customMapStyle={DARK_MAP_STYLE as any}
        onRegionChangeComplete={setRegion}
        showsCompass
        showsUserLocation
        toolbarEnabled={false}
        paddingAdjustmentBehavior="always"
        {...(Platform.OS === 'android'
          ? {
              mapPadding: {
                top: Math.ceil(headerH),
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
            <View style={[s.pin, { 
              paddingVertical: vs(6), 
              paddingHorizontal: hs(6),
              borderRadius: hs(10) 
            }]}>
              <Ionicons name="car-sport" size={ms(16)} color="#0b0b0c" />
            </View>
            <Callout tooltip>
              <View style={[s.callout, { 
                borderRadius: hs(12),
                paddingVertical: vs(8),
                paddingHorizontal: hs(10),
                maxWidth: width * 0.7
              }]}>
                <Text style={[s.calloutTitle, { fontSize: ms(14) }]}>{spot.title}</Text>
                {!!spot.description && (
                  <Text style={[s.calloutDesc, { fontSize: ms(12), marginTop: 2 }]}>
                    {spot.description}
                  </Text>
                )}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* FABs */}
      <View style={[s.fabs, { 
        bottom: Math.max(vs(16), insets.bottom + vs(12)),
        right: hs(16)
      }]}>
        <TouchableOpacity 
          onPress={goToMyLocation} 
          style={[s.fab, { 
            width: hs(46), 
            height: hs(46),
            borderRadius: hs(14)
          }, locating && { opacity: 0.7 }]}
        >
          <Ionicons name="locate" size={ms(20)} color="#0b0b0c" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={fitAll} 
          style={[s.fab, { 
            width: hs(46), 
            height: hs(46),
            borderRadius: hs(14),
            marginTop: vs(10) 
          }]}
        >
          <Ionicons name="grid" size={ms(20)} color="#0b0b0c" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0c' },

  header: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerLeft: { 
    flexDirection: 'row', 
    alignItems: 'center',
    flex: 1,
    minWidth: 0, // Permite que se contraiga si es necesario
  },
  headerIcon: {
    backgroundColor: '#121215', 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1, 
    borderColor: '#1f1f25',
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
    justifyContent: 'center',
  },
  badgeText: { color: '#0b0b0c', fontWeight: '800' },

  map: { flex: 1 },

  pin: {
    backgroundColor: '#42b883',
    borderWidth: 1,
    borderColor: '#1c744f',
  },
  callout: {
    backgroundColor: '#151518',
    borderWidth: 1,
    borderColor: '#202028',
  },
  calloutTitle: { color: '#fff', fontWeight: '800' },
  calloutDesc: { color: '#cfcfff' },

  fabs: {
    position: 'absolute',
    alignItems: 'flex-end',
  },
  fab: {
    backgroundColor: '#42b883',
    alignItems: 'center', 
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 5 },
    }),
  },
});