import React from "react";
import { View, Image, StyleSheet } from "react-native";
import { COLORS } from "../constants/theme";

export default function ProfileAvatar({ image, size = 64 }) {
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Image
        source={
          image ? { uri: image } : require("../assets/avatar-placeholder.png")
        }
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
