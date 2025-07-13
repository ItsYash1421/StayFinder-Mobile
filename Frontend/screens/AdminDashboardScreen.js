import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { COLORS, getHeaderHeight, getResponsiveSize, getShadow } from "../constants/theme";
import { Feather, Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { api } from "../constants/api";
import AdminHeader from "../components/AdminHeader";
import { useToast } from '../context/ToastContext';
import { LinearGradient } from "expo-linear-gradient";

// Calculate proper header height with status bar
const STATUS_BAR_HEIGHT = Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 24;
const HEADER_PADDING_TOP = 0; // Now 0 as per AppHeader
const HEADER_PADDING_BOTTOM = getResponsiveSize(10, 12, 14, 16);
const HEADER_CONTENT_HEIGHT = getResponsiveSize(48, 52, 56, 60);
const TOTAL_HEADER_HEIGHT = STATUS_BAR_HEIGHT + HEADER_PADDING_TOP + HEADER_CONTENT_HEIGHT + HEADER_PADDING_BOTTOM;

export default function AdminDashboardScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/admin/analytics/mobile-stats");
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.showToast("Failed to load statistics", "error");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: () => logout(navigation) },
      ]
    );
  };

  const StatCard = ({ title, value, icon, color, onPress }) => (
    <TouchableOpacity
      style={[styles.statCard, { borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[color + '10', color + '05']}
        style={styles.statGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.statContent}>
          <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <Feather name={icon} size={getResponsiveSize(20, 22, 24, 26)} color={color} />
          </View>
          <View style={styles.statText}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statTitle}>{title}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const MenuCard = ({ title, description, icon, onPress, color = COLORS.primary }) => (
    <TouchableOpacity style={styles.menuCard} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={['#ffffff', '#fafafa']}
        style={styles.menuGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.menuContent}>
          <View style={[styles.menuIcon, { backgroundColor: color + '15' }]}>
            <Feather name={icon} size={getResponsiveSize(20, 22, 24, 26)} color={color} />
          </View>
          <View style={styles.menuText}>
            <Text style={styles.menuTitle}>{title}</Text>
            <Text style={styles.menuDescription}>{description}</Text>
          </View>
          <View style={styles.chevronContainer}>
            <Feather name="chevron-right" size={getResponsiveSize(18, 20, 22, 24)} color={COLORS.textMuted} />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header removed as per request */}
        
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryHover]}
              style={styles.welcomeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.welcomeContent}>
                <View style={styles.welcomeIconContainer}>
                  <Feather name="shield" size={getResponsiveSize(24, 26, 28, 30)} color="white" />
                </View>
                <View style={styles.welcomeText}>
                  <Text style={styles.welcomeTitle}>Welcome back, Admin!</Text>
                  <Text style={styles.welcomeSubtitle}>Manage your platform from here</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Stats Section */}
          <View style={styles.statsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Platform Overview</Text>
              <TouchableOpacity style={styles.refreshButton} onPress={fetchStats}>
                <Feather name="refresh-cw" size={getResponsiveSize(16, 18, 20, 22)} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading statistics...</Text>
              </View>
            ) : (
              <View style={styles.statsGrid}>
                <StatCard
                  title="Total Users"
                  value={stats.totalUsers?.toLocaleString() || '0'}
                  icon="users"
                  color="#3B82F6"
                />
                <StatCard
                  title="Properties"
                  value={stats.totalProperties?.toLocaleString() || '0'}
                  icon="home"
                  color="#10B981"
                />
                <StatCard
                  title="Bookings"
                  value={stats.totalBookings?.toLocaleString() || '0'}
                  icon="calendar"
                  color="#F59E0B"
                />
                <StatCard
                  title="Revenue"
                  value={`$${stats.totalRevenue?.toLocaleString() || '0'}`}
                  icon="dollar-sign"
                  color="#EF4444"
                />
              </View>
            )}
          </View>

          {/* Admin Menu */}
          <View style={styles.menuSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Admin Actions</Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.badgeText}>5</Text>
              </View>
            </View>
            
            <MenuCard
              title="Manage Users"
              description="View and manage all platform users"
              icon="users"
              color="#3B82F6"
              onPress={() => {
                navigation.navigate("AdminUserManagement");
              }}
            />

            <MenuCard
              title="Manage Properties"
              description="Review and manage property listings"
              icon="home"
              color="#10B981"
              onPress={() => {
                navigation.navigate("AdminPropertyManagement");
              }}
            />

            <MenuCard
              title="View Bookings"
              description="Monitor all platform bookings"
              icon="calendar"
              color="#F59E0B"
              onPress={() => {
                navigation.navigate("AdminBookingManagement");
              }}
            />

            <MenuCard
              title="Analytics"
              description="View detailed platform analytics"
              icon="bar-chart-2"
              color="#8B5CF6"
              onPress={() => {
                navigation.navigate("AdminAnalytics");
              }}
            />

            <MenuCard
              title="Settings"
              description="Configure platform settings"
              icon="settings"
              color="#6B7280"
              onPress={() => {
                toast.showToast("Settings coming soon", "info");
              }}
            />
          </View>

          {/* Logout Section */}
          <View style={styles.logoutSection}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
              <LinearGradient
                colors={['#FEF2F2', '#FEE2E2']}
                style={styles.logoutGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Feather name="log-out" size={getResponsiveSize(18, 20, 22, 24)} color="#EF4444" />
                <Text style={styles.logoutText}>Logout</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: getResponsiveSize(30, 35, 40, 45),
  },
  welcomeSection: {
    marginHorizontal: getResponsiveSize(16, 18, 20, 24),
    marginBottom: getResponsiveSize(24, 28, 32, 36),
    marginTop: getResponsiveSize(8, 10, 12, 14),
  },
  welcomeGradient: {
    borderRadius: getResponsiveSize(16, 18, 20, 24),
    padding: getResponsiveSize(20, 24, 28, 32),
    ...getShadow("lg"),
  },
  welcomeContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  welcomeIconContainer: {
    width: getResponsiveSize(48, 52, 56, 60),
    height: getResponsiveSize(48, 52, 56, 60),
    borderRadius: getResponsiveSize(24, 26, 28, 30),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: getResponsiveSize(16, 18, 20, 24),
  },
  welcomeText: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: getResponsiveSize(20, 22, 24, 26),
    fontWeight: "bold",
    color: "white",
    marginBottom: getResponsiveSize(4, 6, 8, 10),
  },
  welcomeSubtitle: {
    fontSize: getResponsiveSize(14, 15, 16, 17),
    color: "rgba(255, 255, 255, 0.9)",
  },
  statsSection: {
    marginHorizontal: getResponsiveSize(16, 18, 20, 24),
    marginBottom: getResponsiveSize(32, 36, 40, 44),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: getResponsiveSize(16, 18, 20, 24),
  },
  sectionTitle: {
    fontSize: getResponsiveSize(18, 20, 22, 24),
    fontWeight: "bold",
    color: COLORS.text,
  },
  refreshButton: {
    padding: getResponsiveSize(8, 10, 12, 14),
    borderRadius: getResponsiveSize(8, 10, 12, 14),
    backgroundColor: COLORS.backgroundSecondary,
  },
  sectionBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: getResponsiveSize(12, 14, 16, 18),
    paddingHorizontal: getResponsiveSize(8, 10, 12, 14),
    paddingVertical: getResponsiveSize(4, 6, 8, 10),
  },
  badgeText: {
    color: "white",
    fontSize: getResponsiveSize(12, 13, 14, 15),
    fontWeight: "bold",
  },
  loadingContainer: {
    padding: getResponsiveSize(40, 45, 50, 55),
    alignItems: "center",
  },
  loadingText: {
    marginTop: getResponsiveSize(12, 14, 16, 18),
    fontSize: getResponsiveSize(14, 15, 16, 17),
    color: COLORS.textMuted,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    borderRadius: getResponsiveSize(16, 18, 20, 24),
    marginBottom: getResponsiveSize(12, 14, 16, 18),
    overflow: "hidden",
    ...getShadow("md"),
  },
  statGradient: {
    padding: getResponsiveSize(16, 18, 20, 24),
  },
  statContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: getResponsiveSize(44, 48, 52, 56),
    height: getResponsiveSize(44, 48, 52, 56),
    borderRadius: getResponsiveSize(22, 24, 26, 28),
    alignItems: "center",
    justifyContent: "center",
    marginRight: getResponsiveSize(12, 14, 16, 18),
  },
  statText: {
    flex: 1,
  },
  statValue: {
    fontSize: getResponsiveSize(18, 20, 22, 24),
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: getResponsiveSize(2, 4, 6, 8),
  },
  statTitle: {
    fontSize: getResponsiveSize(12, 13, 14, 15),
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  menuSection: {
    marginHorizontal: getResponsiveSize(16, 18, 20, 24),
    marginBottom: getResponsiveSize(32, 36, 40, 44),
  },
  menuCard: {
    borderRadius: getResponsiveSize(16, 18, 20, 24),
    marginBottom: getResponsiveSize(12, 14, 16, 18),
    overflow: "hidden",
    ...getShadow("sm"),
  },
  menuGradient: {
    padding: getResponsiveSize(16, 18, 20, 24),
  },
  menuContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIcon: {
    width: getResponsiveSize(44, 48, 52, 56),
    height: getResponsiveSize(44, 48, 52, 56),
    borderRadius: getResponsiveSize(22, 24, 26, 28),
    alignItems: "center",
    justifyContent: "center",
    marginRight: getResponsiveSize(16, 18, 20, 24),
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: getResponsiveSize(16, 17, 18, 19),
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: getResponsiveSize(2, 4, 6, 8),
  },
  menuDescription: {
    fontSize: getResponsiveSize(13, 14, 15, 16),
    color: COLORS.textMuted,
    lineHeight: getResponsiveSize(18, 20, 22, 24),
  },
  chevronContainer: {
    padding: getResponsiveSize(4, 6, 8, 10),
  },
  logoutSection: {
    marginHorizontal: getResponsiveSize(16, 18, 20, 24),
  },
  logoutButton: {
    borderRadius: getResponsiveSize(16, 18, 20, 24),
    overflow: "hidden",
    ...getShadow("sm"),
  },
  logoutGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: getResponsiveSize(16, 18, 20, 24),
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  logoutText: {
    fontSize: getResponsiveSize(16, 17, 18, 19),
    fontWeight: "600",
    color: "#EF4444",
    marginLeft: getResponsiveSize(8, 10, 12, 14),
  },
}); 