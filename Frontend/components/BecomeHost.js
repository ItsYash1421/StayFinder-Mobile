import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { COLORS } from "../constants/theme";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const HOST_INFO = [
  {
    icon: <Feather name="trending-up" size={17} color="#ef4444" />,
    text: "4M+ Active Hosts",
  },
  {
    icon: <FontAwesome5 name="globe" size={15} color="#f59e42" />,
    text: "150+ Countries",
  },
  {
    icon: <Feather name="dollar-sign" size={17} color="#22c55e" />,
    text: "$924 Avg. Monthly",
  },
  {
    icon: <Feather name="trending-up" size={17} color={COLORS.primary} />,
    text: "20% More Bookings",
  },
];

export default function BecomeHost() {
  const navigation = useNavigation();
  const { user, token } = useContext(AuthContext);

  const handleGetStarted = () => {
    if (!user || !token) {
      navigation.navigate("Register");
    } else {
      navigation.navigate("BecomeHostStack", { screen: "BecomeHostIntro" });
    }
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.cardContainer}>
        <View style={styles.hostInfoHeader}>
          <Feather name="home" size={20} color={COLORS.primary} />
          <Text style={styles.hostInfoTitle}>Hosting with StayFindz</Text>
        </View>
        <Text style={styles.hostInfoSubtitle}>
          Join our community of hosts and start earning from your space with
          StayFindz
        </Text>
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            {HOST_INFO.slice(0, 2).map((stat, idx) => (
              <View key={idx} style={styles.statPill}>
                {stat.icon}
                <Text style={styles.statText}>{stat.text}</Text>
              </View>
            ))}
          </View>
          <View style={styles.statsRow}>
            {HOST_INFO.slice(2, 4).map((stat, idx) => (
              <View key={idx} style={styles.statPill}>
                {stat.icon}
                <Text style={styles.statText}>{stat.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      <View style={styles.copyrightSection}>
        <Text style={styles.copyrightText}>
          © 2025 StayFindz. All rights reserved.
        </Text>
      </View>
    </View>
  );
}

const CARD_WIDTH = SCREEN_WIDTH - 32;
const PILL_WIDTH = (CARD_WIDTH - 48) / 2; // 2 pills per row, 24px margin between

const styles = StyleSheet.create({
  outerContainer: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingTop: 24,
    paddingBottom: 0,
  },
  cardContainer: {
    width: CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 32,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  hostInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  hostInfoTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginLeft: 10,
  },
  hostInfoSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 18,
    textAlign: "center",
    fontWeight: "400",
  },
  statsGrid: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    gap: 10,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
    gap: 8,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f6f7fa",
    borderRadius: 999,
    paddingVertical: 8,
    width: PILL_WIDTH,
    justifyContent: "center",
    marginHorizontal: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.02,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  statText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: "500",
    marginLeft: 7,
  },
  copyrightSection: {
    width: "100%",
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
    marginTop: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    letterSpacing: 0.2,
    fontWeight: "400",
  },
});
