import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import { RootStackParamList } from "../navegation/types/navigation";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ValorationScreen">;
};

export default function ValorationScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();

  // Escalas responsivas
  const hs = (size: number) => (width / 375) * size;
  const vs = (size: number) => (height / 812) * size;
  const ms = (size: number, factor = 0.5) => size + (hs(size) - size) * factor;

  const LOGO = Math.min(hs(160), 220);

  const [rating, setRating] = useState(0);
  const stars = [1, 2, 3, 4, 5];

  const handleSubmit = () => {
    navigation.navigate("AppTabs");
  };

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: hs(20),
        paddingBottom: vs(24),
        backgroundColor: "#0d0d0d",
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Logo con aro */}
      <View
        style={{
          width: LOGO + hs(24),
          height: LOGO + hs(24),
          borderRadius: (LOGO + hs(24)) / 2,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#121215",
          borderWidth: Math.max(1, hs(2)),
          borderColor: "#2a2a30",
          shadowColor: "#000",
          shadowOpacity: 0.35,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 8 },
          elevation: 10,
          marginTop: vs(24),
          marginBottom: vs(16),
        }}
      >
        <Image
          source={require("../../assets/images/Logo_ocelon.jpg")}
          style={{
            width: LOGO,
            height: LOGO,
            borderRadius: hs(24),
            resizeMode: "contain",
          }}
        />
      </View>

      {/* Lema */}
      <Text
        style={{
          color: "#42b883",
          fontSize: ms(16),
          fontWeight: "600",
          marginBottom: vs(20),
          textAlign: "center",
        }}
      >
        Estaciona fácil, paga rápido, vive mejor
      </Text>

      {/* Título */}
      <Text
        style={{
          color: "#fff",
          fontSize: ms(22),
          fontWeight: "700",
          marginBottom: vs(16),
          textAlign: "center",
        }}
      >
        Valora nuestro servicio
      </Text>

      {/* Estrellas */}
      <View style={{ flexDirection: "row", marginBottom: vs(30) }}>
        {stars.map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Text
              style={{
                fontSize: ms(40),
                color: rating >= star ? "#00e676" : "#555",
                marginHorizontal: hs(6),
              }}
            >
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Botón enviar solo si seleccionó al menos una estrella */}
      {rating > 0 && (
        <TouchableOpacity
          style={{
            backgroundColor: "#42b883",
            paddingVertical: vs(14),
            paddingHorizontal: hs(28),
            borderRadius: hs(12),
            marginBottom: vs(24),
          }}
          onPress={handleSubmit}
        >
          <Text
            style={{
              color: "#0d0d0d",
              fontSize: ms(16),
              fontWeight: "700",
            }}
          >
            Enviar valoración
          </Text>
        </TouchableOpacity>
      )}

      {/* Footer */}
      <Text style={{ color: "#85859a", fontSize: ms(12) }}>
        © {new Date().getFullYear()} Ocelon — All rights reserved.
      </Text>
    </ScrollView>
  );
}
