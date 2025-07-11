import React from "react";
import { View, Text, StyleSheet, Platform, StatusBar } from "react-native";
import {
  COLORS,
  getHeaderHeight,
  FONT_SIZES,
  getResponsiveSize,
  getShadow,
} from "../constants/theme";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const ANDROID_EXTRA_TOP = Platform.OS === "android" ? 16 : 0;

export default function AppHeader() {
  return (
    <LinearGradient
      colors={[COLORS.background, "#fff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <View style={styles.row}>
        <Feather
          name="home"
          size={getResponsiveSize(28, 30, 32, 36)}
          color={COLORS.primary}
          style={{ marginRight: getResponsiveSize(8, 10, 12, 14) }}
        />
        <Text style={styles.title}>StayFindz</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    backgroundColor: "#fff",
    paddingTop: getHeaderHeight() + ANDROID_EXTRA_TOP,
    paddingBottom: getResponsiveSize(10, 12, 14, 16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: "flex-start",
    justifyContent: "center",
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 100,
    elevation: 8,
    paddingLeft: getResponsiveSize(16, 18, 20, 24),
    borderBottomLeftRadius: getResponsiveSize(16, 18, 20, 24),
    borderBottomRightRadius: getResponsiveSize(16, 18, 20, 24),
    ...getShadow("lg"),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: FONT_SIZES["4xl"],
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: getResponsiveSize(0.8, 1.0, 1.2, 1.4),
    textShadowColor: "rgba(244,63,94,0.08)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
});
