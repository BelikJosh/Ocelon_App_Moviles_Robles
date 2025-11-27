// components/TimerFloatingBar.tsx
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getTimer, onTimerChange } from "../utils/TimerStore";

export default function TimerFloatingBar() {
  const navigation: any = useNavigation();
  const [data, setData] = useState(getTimer());

  useEffect(() => {
    const unsub = onTimerChange(() => setData({ ...getTimer() }));
    return unsub;
  }, []);

  if (!data.active) return null;

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const displayTime = data.phase === 'COUNTDOWN'
    ? `⏱ ${data.countdown}s`
    : `⏱ ${formatTime(data.seconds)}`;

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate("Timer")}
      activeOpacity={0.8}
      style={styles.container}
    >
      <View style={styles.content}>
        <Ionicons name="time-outline" size={20} color="#fff" />
        <Text style={styles.text}>
          {displayTime} — 💰 USD {data.cost}.00
        </Text>
        <Ionicons name="chevron-forward" size={18} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 105, // ← CAMBIADO: de 80 a 160 para estar más arriba
    left: 16,
    right: 16,
    backgroundColor: "#42b883",
    borderRadius: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 9999,
  },
  content: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  text: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    flex: 1,
    textAlign: "center",
  },
});