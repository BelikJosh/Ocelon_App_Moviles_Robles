// components/TimerFloatingBar.tsx
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getTimer, onTimerChange, stopTimer } from "../utils/TimerStore";

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

  const handlePress = () => {
    navigation.navigate("Timer");
  };

  const handleStop = () => {
    stopTimer();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={styles.content}
      >
        <View style={styles.timeSection}>
          <Ionicons name="time-outline" size={20} color="#fff" />
          <Text style={styles.text}>
            {displayTime}
          </Text>
        </View>

        <View style={styles.costSection}>
          <Text style={styles.costText}>
            ${data.cost.toFixed(2)} USD
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.stopButton}
        onPress={handleStop}
      >
        <Ionicons name="stop-circle-outline" size={16} color="#ff6b6b" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 105,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  costSection: {
    flex: 1,
    alignItems: 'center',
  },
  text: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  costText: {
    color: "#0b0b0c",
    fontWeight: "800",
    fontSize: 14,
  },
  stopButton: {
    padding: 12,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.3)',
  },
});