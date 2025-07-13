import React from "react";
import { View, Text, StyleSheet, Platform, StatusBar, TouchableOpacity } from "react-native";
import {
  COLORS,
  getHeaderHeight,
  FONT_SIZES,
  getResponsiveSize,
  getShadow,
} from "../constants/theme";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// Get status bar height for proper positioning
const STATUS_BAR_HEIGHT = Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 24;
const HEADER_PADDING_TOP = 0; // Set to 0 as requested
const HEADER_PADDING_BOTTOM = getResponsiveSize(10, 12, 14, 16);

export default function AppHeader({ title, showBack, onBackPress }) {
  return (
    <LinearGradient
      colors={[COLORS.background, "#fff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
            <Feather
              name="arrow-left"
              size={getResponsiveSize(20, 22, 24, 26)}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        ) : (
          <Feather
            name="home"
            size={getResponsiveSize(28, 30, 32, 36)}
            color={COLORS.primary}
            style={{ marginRight: getResponsiveSize(8, 10, 12, 14) }}
          />
        )}
        <Text style={styles.title}>{title || "StayFindz"}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    backgroundColor: "#fff",
    paddingTop: 35,
    paddingBottom: HEADER_PADDING_BOTTOM,
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
    paddingRight: getResponsiveSize(16, 18, 20, 24),
    borderBottomLeftRadius: getResponsiveSize(16, 18, 20, 24),
    borderBottomRightRadius: getResponsiveSize(16, 18, 20, 24),
    ...getShadow("lg"),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  backButton: {
    marginRight: getResponsiveSize(8, 10, 12, 14),
    padding: getResponsiveSize(4, 6, 8, 10),
    borderRadius: getResponsiveSize(8, 10, 12, 14),
  },
  title: {
    fontSize: FONT_SIZES["4xl"],
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: getResponsiveSize(0.8, 1.0, 1.2, 1.4),
    textShadowColor: "rgba(244,63,94,0.08)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
    flex: 1,
  },
});
