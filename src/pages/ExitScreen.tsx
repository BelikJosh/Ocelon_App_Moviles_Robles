import { CommonActions, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BlurView } from "expo-blur";
import * as Notifications from "expo-notifications";
import React, { useEffect, useRef, useState } from "react";
import { BackHandler, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { RootStackParamList } from "../navegation/types/navigation";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ExitScreen">;
  route: RouteProp<RootStackParamList, "ExitScreen">;
};

export default function ExitScreen({ navigation, route }: Props) {
  const { rawQrData } = route.params;
  const TOTAL_SECONDS = 15;

  const [seconds, setSeconds] = useState(TOTAL_SECONDS);
  const startTimeRef = useRef(Date.now());
  const prevColorRef = useRef<string>("");

  const getTimerColor = (sec: number) => {
    if (sec >= 11) return "#00e676"; // verde
    if (sec >= 6) return "#ffaa00"; // amarillo
    return "#ff1744"; // rojo
  };

  const getTimerMessage = (sec: number) => {
    if (sec >= 11) return "¡Aún tienes tiempo!";
    if (sec >= 6) return "Apresúrate, queda poco tiempo";
    return "Últimos segundos, muéstralo ahora";
  };

  // Bloquear botón físico de retroceso
  useEffect(() => {
    const backAction = () => true;
    if (Platform.OS === "android") {
      const subscription = BackHandler.addEventListener("hardwareBackPress", backAction);
      return () => subscription.remove();
    }
  }, []);

  // Crear canal de notificaciones para Android
  useEffect(() => {
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("timer-channel", {
        name: "Timer Notifications",
        importance: Notifications.AndroidImportance.MAX,
        sound: "default",
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }
  }, []);

  // Función para enviar notificación
  const sendNotification = async (title: string, body: string) => {
    const trigger: Notifications.TimeIntervalTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 0.1,
      repeats: false,
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        ...(Platform.OS === "android" ? { channelId: "timer-channel" } : {}),
      },
      trigger,
    });
  };

  // Temporizador con notificaciones solo al cambiar de color
  useEffect(() => {
    const interval = setInterval(async () => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = TOTAL_SECONDS - elapsed;
      const sec = Math.max(remaining, 0);
      setSeconds(sec);

      const currentColor = getTimerColor(sec);

      // ✅ Notificación solo cuando cambia el color
      if (prevColorRef.current !== currentColor) {
        prevColorRef.current = currentColor;
        await sendNotification(`Tiempo restante: ${sec}s`, getTimerMessage(sec));
      }

      // Terminar timer y navegar a Timer
      if (sec <= 0) {
        clearInterval(interval);
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Timer", params: { rawQrData } }],
          })
        );
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Botón para simular QR escaneado y finalizar
  const simulateQrScanned = () => {
    setSeconds(0); // detener visualmente
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "ValorationScreen" }],
      })
    );
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={70} tint="dark" style={styles.blurContainer}>
        <Text style={styles.title}>Pago Confirmado</Text>
        <Text style={styles.subTitle}>Muestra este código en la salida</Text>

        <View style={styles.qrContainer}>
          <QRCode value={rawQrData} size={200} backgroundColor="transparent" color="#00e676" />
        </View>

        <View style={[styles.circle, { borderColor: getTimerColor(seconds) }]}>
          <Text style={[styles.timerText, { color: getTimerColor(seconds) }]}>{seconds}s</Text>
        </View>
        <TouchableOpacity style={styles.simulateBtn} onPress={simulateQrScanned}>
  <Text style={styles.simulateBtnText}>Simular QR Escaneado</Text>
</TouchableOpacity>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  blurContainer: { width: "85%", padding: 30, borderRadius: 25, alignItems: "center", backgroundColor: "rgba(0,0,0,0.3)", overflow: "hidden" },
  title: { color: "#00e676", fontSize: 28, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  subTitle: { color: "#fff", fontSize: 16, marginBottom: 25, textAlign: "center" },
  qrContainer: { padding: 20, backgroundColor: "#111", borderRadius: 20, marginBottom: 25 },
  circle: { width: 120, height: 120, borderRadius: 100, borderWidth: 6, justifyContent: "center", alignItems: "center", marginBottom: 20 },
  timerText: { fontSize: 32, fontWeight: "bold" },
  simulateBtn: {
  backgroundColor: "#ffaa00",
  paddingVertical: 12,
  paddingHorizontal: 25,
  borderRadius: 20,
  marginTop: 20,
},
simulateBtnText: {
  color: "#000",
  fontWeight: "bold",
  fontSize: 16,
},
});
