import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../constants/theme";

export default function PushNotificationPlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Push notifications will be supported here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 8,
  },
  text: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
});

// TODO: Integrate Expo Notifications for push notifications
