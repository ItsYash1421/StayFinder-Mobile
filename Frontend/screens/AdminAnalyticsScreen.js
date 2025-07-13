import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
} from "react-native";
import { COLORS, getHeaderHeight, getResponsiveSize } from "../constants/theme";
import { Feather } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { api } from "../constants/api";
import AdminHeader, { ADMIN_HEADER_HEIGHT } from "../components/AdminHeader";
import { useToast } from '../context/ToastContext';

const ANDROID_EXTRA_TOP = Platform.OS === "android" ? StatusBar.currentHeight || 24 : 0;
const HEADER_HEIGHT = getHeaderHeight() + ANDROID_EXTRA_TOP;

export default function AdminAnalyticsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalViews: 0,
    conversionRate: 0,
    averageRating: 0,
    revenuePerBooking: 0,
    monthlyPerformance: [],
    topLocations: [],
    avgStayDuration: 0,
    avgLeadTime: 0,
    cancellationRate: 0,
    repeatGuestRate: 0,
    avgPrice: 0,
    occupancyRate: 0,
  });

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/admin/analytics");
      setAnalytics(response.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.showToast("Failed to load analytics", "error");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const StatCard = ({ title, value, subtitle, icon, color, trend }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Feather name={icon} size={24} color={color} />
        </View>
        <View style={styles.statText}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
          {trend && (
            <View style={[styles.trendContainer, { backgroundColor: trend > 0 ? "#10B981" : "#EF4444" }]}>
              <Feather name={trend > 0 ? "trending-up" : "trending-down"} size={12} color="white" />
              <Text style={styles.trendText}>{Math.abs(trend)}%</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const MetricCard = ({ title, value, description, color }) => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricDescription}>{description}</Text>
    </View>
  );

  const LocationCard = ({ location, index }) => (
    <View style={styles.locationCard}>
      <View style={styles.locationRank}>
        <Text style={styles.rankText}>#{index + 1}</Text>
      </View>
      <View style={styles.locationInfo}>
        <Text style={styles.locationName}>{location.location}</Text>
        <Text style={styles.locationStats}>
          {location.properties} properties • ${location.revenue?.toLocaleString()} revenue
        </Text>
      </View>
      <View style={styles.locationViews}>
        <Feather name="eye" size={14} color={COLORS.textMuted} />
        <Text style={styles.viewsText}>{location.views}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <AdminHeader
        title="Analytics"
        showBack={true}
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView
        style={[styles.scrollView, { marginTop: 40 }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <>
            {/* Key Metrics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Key Metrics</Text>
              <View style={styles.statsGrid}>
                <StatCard
                  title="Total Views"
                  value={analytics.totalViews?.toLocaleString() || "0"}
                  icon="eye"
                  color="#3B82F6"
                />
                <StatCard
                  title="Conversion Rate"
                  value={`${analytics.conversionRate?.toFixed(1) || "0"}%`}
                  icon="trending-up"
                  color="#10B981"
                />
                <StatCard
                  title="Average Rating"
                  value={analytics.averageRating?.toFixed(1) || "0"}
                  subtitle="out of 5"
                  icon="star"
                  color="#F59E0B"
                />
                <StatCard
                  title="Revenue per Booking"
                  value={`$${analytics.revenuePerBooking?.toFixed(0) || "0"}`}
                  icon="dollar-sign"
                  color="#EF4444"
                />
              </View>
            </View>

            {/* Performance Metrics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Performance Metrics</Text>
              <View style={styles.metricsGrid}>
                <MetricCard
                  title="Average Stay Duration"
                  value={`${analytics.avgStayDuration?.toFixed(1) || "0"} days`}
                  description="Average length of guest stays"
                  color="#3B82F6"
                />
                <MetricCard
                  title="Average Lead Time"
                  value={`${analytics.avgLeadTime?.toFixed(1) || "0"} days`}
                  description="Time between booking and stay"
                  color="#10B981"
                />
                <MetricCard
                  title="Cancellation Rate"
                  value={`${analytics.cancellationRate?.toFixed(1) || "0"}%`}
                  description="Percentage of cancelled bookings"
                  color="#F59E0B"
                />
                <MetricCard
                  title="Repeat Guest Rate"
                  value={`${analytics.repeatGuestRate?.toFixed(1) || "0"}%`}
                  description="Percentage of returning guests"
                  color="#8B5CF6"
                />
              </View>
            </View>

            {/* Revenue & Pricing */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Revenue & Pricing</Text>
              <View style={styles.metricsGrid}>
                <MetricCard
                  title="Average Price"
                  value={`$${analytics.avgPrice?.toFixed(0) || "0"}`}
                  description="Average nightly rate"
                  color="#EF4444"
                />
                <MetricCard
                  title="Occupancy Rate"
                  value={`${analytics.occupancyRate?.toFixed(1) || "0"}%`}
                  description="Property utilization rate"
                  color="#10B981"
                />
              </View>
            </View>

            {/* Top Locations */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Performing Locations</Text>
              {analytics.topLocations && analytics.topLocations.length > 0 ? (
                analytics.topLocations.slice(0, 5).map((location, index) => (
                  <LocationCard key={location.location} location={location} index={index} />
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Feather name="map-pin" size={48} color={COLORS.textMuted} />
                  <Text style={styles.emptyText}>No location data available</Text>
                </View>
              )}
            </View>

            {/* Monthly Performance */}
            {analytics.monthlyPerformance && analytics.monthlyPerformance.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Monthly Performance</Text>
                <View style={styles.monthlyContainer}>
                  {analytics.monthlyPerformance.slice(0, 6).map((month, index) => (
                    <View key={index} style={styles.monthlyItem}>
                      <Text style={styles.monthlyLabel}>{month.month}</Text>
                      <Text style={styles.monthlyValue}>${month.revenue?.toLocaleString() || "0"}</Text>
                      <Text style={styles.monthlyBookings}>{month.bookings || "0"} bookings</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: getResponsiveSize(18, 19, 20, 21),
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  statText: {
    flex: 1,
  },
  statValue: {
    fontSize: getResponsiveSize(18, 19, 20, 21),
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 2,
  },
  statTitle: {
    fontSize: getResponsiveSize(12, 13, 14, 15),
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: getResponsiveSize(10, 11, 12, 13),
    color: COLORS.textMuted,
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  trendText: {
    fontSize: getResponsiveSize(10, 11, 12, 13),
    color: "white",
    fontWeight: "500",
    marginLeft: 2,
  },
  metricsGrid: {
    gap: 12,
  },
  metricCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricTitle: {
    fontSize: getResponsiveSize(14, 15, 16, 17),
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: getResponsiveSize(20, 22, 24, 26),
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  metricDescription: {
    fontSize: getResponsiveSize(12, 13, 14, 15),
    color: COLORS.textMuted,
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rankText: {
    fontSize: getResponsiveSize(12, 13, 14, 15),
    fontWeight: "bold",
    color: "white",
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: getResponsiveSize(14, 15, 16, 17),
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 2,
  },
  locationStats: {
    fontSize: getResponsiveSize(12, 13, 14, 15),
    color: COLORS.textMuted,
  },
  locationViews: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewsText: {
    fontSize: getResponsiveSize(12, 13, 14, 15),
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: getResponsiveSize(14, 15, 16, 17),
    color: COLORS.textMuted,
    marginTop: 10,
  },
  monthlyContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monthlyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  monthlyLabel: {
    fontSize: getResponsiveSize(14, 15, 16, 17),
    fontWeight: "500",
    color: COLORS.text,
  },
  monthlyValue: {
    fontSize: getResponsiveSize(14, 15, 16, 17),
    fontWeight: "bold",
    color: COLORS.primary,
  },
  monthlyBookings: {
    fontSize: getResponsiveSize(12, 13, 14, 15),
    color: COLORS.textMuted,
  },
}); 