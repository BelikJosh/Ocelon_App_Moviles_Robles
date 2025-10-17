// src/pages/MapScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import MapView, {
  Callout,
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  Region,
} from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* ================== CONSTANTES ================== */
type Spot = { id: string; title: string; description?: string; latitude: number; longitude: number };

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

type Parked = { latitude: number; longitude: number; ts: number };

const PARKED_KEY = 'ocelon@parked-location';
const GOOGLE_MAPS_APIKEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const NEAR_THRESHOLD_M = 30; // si estás a <30 m del auto, no pedimos Directions

/* ================== UTILES ================== */
const haversineMeters = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/* ================== COMPONENTE ================== */
export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // Escalas responsivas
  const BASE_W = 375, BASE_H = 812;
  const hs = (n: number) => (width / BASE_W) * n;
  const vs = (n: number) => (height / BASE_H) * n;
  const ms = (n: number, f = 0.5) => n + (hs(n) - n) * f;

  const isLandscape = width > height;
  const FAB = isLandscape ? Math.max(32, hs(34)) : Math.max(46, hs(48));
  const RADIUS = isLandscape ? Math.max(10, hs(12)) : Math.max(14, hs(16));

  const mapRef = useRef<MapView>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  // cámara que sigue al usuario
  const [followMe, setFollowMe] = useState(true);
  const lastCoordRef = useRef<{ lat: number; lon: number } | null>(null);
  const lastHeadingRef = useRef<number | null>(null);
  const lastCamUpdateRef = useRef<number>(0);

  // estado
  const [region, setRegion] = useState<Region>({
    latitude: 19.4326,
    longitude: -99.1332,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  });
  const [locating, setLocating] = useState(false);
  const [userLoc, setUserLoc] = useState<{ latitude: number; longitude: number } | null>(null);
  const [parked, setParked] = useState<Parked | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null);

  // Solo este screen permite landscape
  useFocusEffect(
    React.useCallback(() => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.ALL);
      return () => {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      };
    }, [])
  );

  // Reencuadre al rotar
  const fitContextual = useCallback(() => {
    if (!mapRef.current) return;

    const edge = {
      top: Math.ceil(insets.top + vs(isLandscape ? 6 : 10)),
      right: hs(isLandscape ? 8 : 20),
      bottom: Math.ceil(insets.bottom + vs(isLandscape ? 8 : 100)),
      left: hs(isLandscape ? 8 : 20),
    };

    if (userLoc && parked) {
      mapRef.current.fitToCoordinates([userLoc, { latitude: parked.latitude, longitude: parked.longitude }], {
        edgePadding: edge,
        animated: true,
      });
      return;
    }
    if (userLoc) {
      mapRef.current.animateCamera({ center: userLoc, zoom: 16 }, { duration: 400 });
      return;
    }
    const coords = PARKING_SPOTS.map((s) => ({ latitude: s.latitude, longitude: s.longitude }));
    if (coords.length) mapRef.current.fitToCoordinates(coords, { edgePadding: edge, animated: true });
  }, [userLoc, parked, insets.top, insets.bottom, isLandscape, hs, vs]);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', () => requestAnimationFrame(() => fitContextual()));
    return () => sub.remove();
  }, [fitContextual]);

  // Cargar guardado
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PARKED_KEY);
        if (raw) {
          const parsed: Parked = JSON.parse(raw);
          if (typeof parsed?.latitude === 'number' && typeof parsed?.longitude === 'number') {
            setParked(parsed);
          }
        }
      } catch {}
    })();
  }, []);

  // Primer fix de precisión alta y watch balanceado + seguir cámara
  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const first = await Location.getCurrentPositionAsync({
          accuracy: Platform.OS === 'ios' ? Location.Accuracy.BestForNavigation : Location.Accuracy.Highest,
          maximumAge: 1000,
        });
        const me = { latitude: first.coords.latitude, longitude: first.coords.longitude };
        setUserLoc(me);
        mapRef.current?.animateCamera({ center: me, zoom: 16 }, { duration: 500 });

        watchRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 2000,
            distanceInterval: 3,
          },
          (loc) => {
            const next = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
            setUserLoc(next);

            if (followMe && mapRef.current) {
              const now = Date.now();
              const movedEnough =
                !lastCoordRef.current ||
                haversineMeters({ latitude: lastCoordRef.current.lat, longitude: lastCoordRef.current.lon }, next) > 1.5;
              const heading = Number.isFinite(loc.coords.heading!) ? (loc.coords.heading as number) : null;
              const headingChanged =
                heading !== null &&
                (lastHeadingRef.current === null || Math.abs(heading - lastHeadingRef.current) > 8);

              if ((movedEnough || headingChanged) && now - lastCamUpdateRef.current > 400) {
                mapRef.current.animateCamera(
                  {
                    center: next,
                    zoom: 17,
                    heading: heading ?? undefined,
                    pitch: 40,
                  },
                  { duration: 350 }
                );
                lastCamUpdateRef.current = now;
                lastCoordRef.current = { lat: next.latitude, lon: next.longitude };
                if (heading !== null) lastHeadingRef.current = heading;
              }
            }
          }
        );
      })();

      return () => {
        watchRef.current?.remove();
        watchRef.current = null;
      };
    }, [followMe])
  );

  useEffect(() => {
    fitContextual();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parked, userLoc, isLandscape]);

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
      setUserLoc({ latitude: next.latitude, longitude: next.longitude });
      mapRef.current?.animateToRegion(next, 600);
    } catch {
      Alert.alert('Ups', 'No se pudo obtener tu ubicación.');
    } finally {
      setLocating(false);
    }
  }, []);

  const saveParkedLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Activa el permiso de ubicación para guardar dónde estacionaste.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const p: Parked = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, ts: Date.now() };
      await AsyncStorage.setItem(PARKED_KEY, JSON.stringify(p));
      setParked(p);
      setFollowMe(false); // evita que salte la cámara al guardar
      mapRef.current?.animateToRegion(
        { latitude: p.latitude, longitude: p.longitude, latitudeDelta: 0.012, longitudeDelta: 0.012 },
        500
      );
      Alert.alert('Guardado', 'Ubicación del auto guardada.');
    } catch {
      Alert.alert('Ups', 'No se pudo guardar tu ubicación.');
    }
  }, []);

  const clearParked = useCallback(async () => {
    await AsyncStorage.removeItem(PARKED_KEY);
    setParked(null);
    setRouteInfo(null);
    Alert.alert('Listo', 'Ubicación del auto eliminada.');
  }, []);

  const openExternalNav = useCallback(async () => {
    if (!parked) return;
    const { latitude, longitude } = parked;
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=walking`;
    const iosUrl = `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=w`;
    const androidUrl = `google.navigation:q=${latitude},${longitude}&mode=w`;
    const candidates = Platform.select({ ios: [iosUrl, webUrl], android: [androidUrl, webUrl], default: [webUrl] })!;
    for (const url of candidates) {
      const can = await Linking.canOpenURL(url);
      if (can) { Linking.openURL(url); return; }
    }
    Linking.openURL(webUrl);
  }, [parked]);

  /* ===== lógica de ruta: evitar pedir Directions cuando estás pegado ===== */
  const userIsNear =
    !!(userLoc && parked) &&
    haversineMeters(userLoc!, { latitude: parked!.latitude, longitude: parked!.longitude }) < NEAR_THRESHOLD_M;

  // Mostrar Directions sólo si hay distancia suficiente y hay API key
  const hasDirections = !!(userLoc && parked && GOOGLE_MAPS_APIKEY && !userIsNear);

  return (
    <View style={s.container}>
      {/* Botón chip “Ajustar vista” (header grande fue eliminado) */}
      <View style={[s.topChipWrap, { top: Math.max(vs(8), insets.top + vs(4)), left: hs(10) }]}>
        <TouchableOpacity onPress={fitContextual} style={s.badge}>
          <Ionicons name="resize-outline" size={ms(12)} color="#0b0b0c" />
          <Text style={[s.badgeText, { marginLeft: 6 }]}>Ajustar vista</Text>
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
        onTouchStart={() => setFollowMe(false)} // si tocas el mapa, pausamos seguimiento
        {...(Platform.OS === 'android'
          ? { mapPadding: { top: 0, right: 0, bottom: Math.ceil(insets.bottom + vs(isLandscape ? 6 : 10)), left: 0 } }
          : {})}
      >
        {/* Marcadores predefinidos SOLO si no hay user/parked */}
        {(!userLoc && !parked) &&
          PARKING_SPOTS.map((spot) => (
            <Marker
              key={spot.id}
              coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
              title={spot.title}
              description={spot.description}
              tracksViewChanges={false}
            >
              <View style={[s.pin, { paddingVertical: vs(6), paddingHorizontal: hs(6), borderRadius: hs(10) }]}>
                <Ionicons name="car-sport" size={ms(16)} color="#0b0b0c" />
              </View>
              <Callout tooltip>
                <View style={[s.callout, { borderRadius: hs(12), paddingVertical: vs(8), paddingHorizontal: hs(10), maxWidth: width * 0.7 }]}>
                  <Text style={[s.calloutTitle, { fontSize: ms(14) }]}>{spot.title}</Text>
                  {!!spot.description && <Text style={[s.calloutDesc, { fontSize: ms(12), marginTop: 2 }]}>{spot.description}</Text>}
                </View>
              </Callout>
            </Marker>
          ))}

        {/* Auto guardado */}
        {parked && (
          <Marker
            coordinate={{ latitude: parked.latitude, longitude: parked.longitude }}
            title="Auto estacionado"
            description={new Date(parked.ts).toLocaleString()}
          >
            <View style={[s.pinSaved, { paddingVertical: vs(6), paddingHorizontal: hs(6), borderRadius: hs(10) }]}>
              <Ionicons name="bookmark" size={ms(16)} color="#0b0b0c" />
            </View>
          </Marker>
        )}

        {/* Polyline de Directions (in-app) cuando NO estás pegado */}
        {hasDirections && (
          <MapViewDirections
            origin={userLoc!}
            destination={{ latitude: parked!.latitude, longitude: parked!.longitude }}
            apikey={GOOGLE_MAPS_APIKEY}
            mode="WALKING"
            strokeWidth={Math.max(3, Math.min(6, Math.round(hs(3))))}
            strokeColor="#7ad3ff"
            optimizeWaypoints={false}
            onReady={(result) => {
              setRouteInfo({ distanceKm: result.distance, durationMin: result.duration });
              mapRef.current?.fitToCoordinates(result.coordinates, {
                edgePadding: {
                  top: Math.ceil(insets.top + vs(isLandscape ? 6 : 10)),
                  right: hs(isLandscape ? 8 : 18),
                  bottom: Math.ceil(insets.bottom + vs(isLandscape ? 60 : 120)),
                  left: hs(isLandscape ? 8 : 18),
                },
                animated: true,
              });
            }}
            onError={(err) => {
              console.warn('Directions error:', err);
              setRouteInfo(null);
            }}
          />
        )}

        {/* Fallback visual: si estás MUY cerca, línea recta local opcional */}
        {userLoc && parked && userIsNear && (
          <Polyline
            coordinates={[userLoc, { latitude: parked.latitude, longitude: parked.longitude }]}
            strokeColor="#7ad3ff"
            strokeWidth={4}
            geodesic
          />
        )}
      </MapView>

      {/* Píldora distancia/tiempo o mensaje de cercanía */}
      {routeInfo && !userIsNear && (
        <View style={[s.routePill, { top: Math.max(vs(isLandscape ? 6 : 10), insets.top + vs(isLandscape ? 4 : 6)), left: hs(isLandscape ? 8 : 12) }]}>
          <Ionicons name="walk" size={ms(isLandscape ? 12 : 14)} color="#0b0b0c" />
          <Text style={[s.routePillText, { marginLeft: 6 }]}>
            {routeInfo.distanceKm.toFixed(2)} km · {Math.round(routeInfo.durationMin)} min
          </Text>
          <TouchableOpacity onPress={openExternalNav} style={[s.routePillBtn, { marginLeft: 8 }]}>
            <Ionicons name="open-outline" size={ms(isLandscape ? 12 : 14)} color="#0b0b0c" />
          </TouchableOpacity>
        </View>
      )}

      {userLoc && parked && userIsNear && (
        <View style={[s.routePillNear, { top: Math.max(vs(6), insets.top + vs(4)), left: hs(10) }]}>
          <Ionicons name="walk" size={ms(isLandscape ? 12 : 14)} color="#0b0b0c" />
          <Text style={[s.routePillText, { marginLeft: 6 }]}>
            Estás a ~{Math.max(1, Math.round(haversineMeters(userLoc, { latitude: parked.latitude, longitude: parked.longitude })))} m de tu auto
          </Text>
        </View>
      )}

      {/* FAB izquierdo: guardar/borrar auto */}
      <View style={[
        s.leftFabs,
        { bottom: Math.max(vs(isLandscape ? 8 : 16), insets.bottom + vs(isLandscape ? 6 : 12)), left: hs(isLandscape ? 8 : 16) }
      ]}>
        {!parked ? (
          <TouchableOpacity
            onPress={saveParkedLocation}
            style={[s.fabSave, { width: FAB, height: FAB, borderRadius: RADIUS }]}
            accessibilityLabel="Guardar auto aquí"
          >
            <Ionicons name="car-sport" size={isLandscape ? ms(16) : ms(20)} color="#0b0b0c" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={clearParked}
            style={[s.fabDanger, { width: FAB, height: FAB, borderRadius: RADIUS }]}
            accessibilityLabel="Borrar ubicación guardada"
          >
            <Ionicons name="trash" size={isLandscape ? ms(16) : ms(20)} color="#0b0b0c" />
          </TouchableOpacity>
        )}
      </View>

      {/* FAB derecho: “Seguir” / centrar mi posición */}
      <View
        style={[
          s.fabs,
          { bottom: Math.max(vs(isLandscape ? 8 : 16), insets.bottom + vs(isLandscape ? 6 : 12)), right: hs(isLandscape ? 8 : 16) },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            setFollowMe(true);
            if (userLoc && mapRef.current) {
              mapRef.current.animateCamera({ center: userLoc, zoom: 17 }, { duration: 300 });
            } else {
              goToMyLocation();
            }
          }}
          style={[s.fab, { width: FAB, height: FAB, borderRadius: RADIUS }, locating && { opacity: 0.7 }]}
          accessibilityLabel="Seguir mi movimiento"
        >
          <Ionicons name={followMe ? 'walk' : 'compass'} size={isLandscape ? ms(16) : ms(20)} color="#0b0b0c" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ================== ESTILOS ================== */
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0c' },
  map: { flex: 1 },

  // Chip superior pequeño
  topChipWrap: { position: 'absolute', zIndex: 10 },
  badge: {
    backgroundColor: '#42b883',
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: { color: '#0b0b0c', fontWeight: '800' },

  // Pins
  pin: {
    backgroundColor: '#42b883',
    borderWidth: 1,
    borderColor: '#1c744f',
  },
  pinSaved: {
    backgroundColor: '#ffd166',
    borderWidth: 1,
    borderColor: '#b08b2c',
  },
  callout: {
    backgroundColor: '#151518',
    borderWidth: 1,
    borderColor: '#202028',
  },
  calloutTitle: { color: '#fff', fontWeight: '800' },
  calloutDesc: { color: '#cfcfff' },

  // Píldoras
  routePill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7ad3ff',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    zIndex: 10,
  },
  routePillNear: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#c7e8ff',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    zIndex: 10,
  },
  routePillText: { color: '#0b0b0c', fontWeight: '800' },
  routePillBtn: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    padding: 4,
    borderRadius: 999,
    marginLeft: 6,
  },

  // FABs
  fabs: { position: 'absolute', alignItems: 'flex-end' },
  leftFabs: { position: 'absolute', alignItems: 'flex-start' },

  fab: {
    backgroundColor: '#42b883',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 5 },
    }),
  },
  fabSave: {
    backgroundColor: '#ffd166',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 5 },
    }),
  },
  fabDanger: {
    backgroundColor: '#ff8b8b',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 5 },
    }),
  },
});
