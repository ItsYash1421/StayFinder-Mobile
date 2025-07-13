import React, { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
  Animated,
  Easing,
} from "react-native";
import { COLORS } from "../constants/theme";
import { Feather } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { api } from "../constants/api";
import AppHeader from "../components/AppHeader";
import { LinearGradient } from "expo-linear-gradient";
import { useToast } from '../context/ToastContext';

export default function GuestRequestScreen({ navigation }) {
  const { user, token } = useContext(AuthContext);
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  const [imageErrorStates, setImageErrorStates] = useState({});

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    if (!user || !token) return;
    setLoading(true);
    try {
      console.log("Fetching guest requests for user:", user._id);
      const response = await api.get("/api/user/host-guest-listings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Guest requests response:", response.data);
      if (response.data.success) {
        setRequests(response.data.listings || []);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error("Error fetching guest requests:", error);
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handleImageLoadStart = (requestId) => {
    setImageLoadingStates((prev) => ({ ...prev, [requestId]: true }));
  };

  const handleImageLoadEnd = (requestId) => {
    setImageLoadingStates((prev) => ({ ...prev, [requestId]: false }));
  };

  const handleImageError = (requestId) => {
    setImageErrorStates((prev) => ({ ...prev, [requestId]: true }));
    setImageLoadingStates((prev) => ({ ...prev, [requestId]: false }));
  };

  const handleAction = async (bookingId, action) => {
    try {
      // Map action to status as expected by backend
      const status = action === "approved" ? "approved" : "rejected";
      // Debug log to trace API call
      console.log("Sending to /api/booking/approve-booking", { bookingId, status, userId: user._id });
      const response = await api.post(
        "/api/bookings/approve-booking",
        {
          bookingId,
          status,
          userId: user._id, // host's user ID
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        toast.showToast(`Booking ${status} successfully!`, "success");
        fetchRequests();
      } else {
        const errorMessage = response.data.message || `Failed to ${status} booking`;
        toast.showToast(errorMessage, "error");
      }
    } catch (error) {
      console.error(`Error ${action}ing booking:`, error);
      const errorMessage = error.response?.data?.message || `Failed to ${action} booking`;
      toast.showToast(errorMessage, "error");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Status color mapping
  const statusStyles = {
    approved: { bg: "#dcfce7", text: "#166534" },
    confirmed: { bg: "#dbeafe", text: "#1e40af" },
    cancelled: { bg: "#fee2e2", text: "#dc2626" },
    rejected: { bg: "#f3e8ff", text: "#7c3aed" },
    pending: { bg: "#fef3c7", text: "#d97706" },
  };

  // Filter requests for the logged-in host only
  const myRequests = requests.filter(
    (r) => r.hostId === user?._id || r.hostId?._id === user?._id
  );

  // Split requests into pending and approved/confirmed
  const pendingRequests = myRequests.filter(
    (r) => r.status === "pending" && r.status !== "paused"
  );
  const approvedRequests = myRequests
    .filter(
      (r) =>
        (r.status === "approved" || r.status === "confirmed") &&
        r.status !== "paused"
    )
    .sort((a, b) => {
      // Prefer updatedAt if available, else endDate
      const aDate = a.updatedAt ? new Date(a.updatedAt) : new Date(a.endDate);
      const bDate = b.updatedAt ? new Date(b.updatedAt) : new Date(b.endDate);
      return bDate - aDate;
    })
    .slice(0, 5);
  console.log("pendingRequests:", pendingRequests.length);
  console.log("approvedRequests:", approvedRequests.length);
  console.log(
    "All requests statuses:",
    myRequests.map((r) => r.status)
  );

  // Calculate total requests for the logged-in host (pending, approved, confirmed, rejected, cancelled only)
  const totalRequestsCount = myRequests.filter((r) =>
    ["pending", "approved", "confirmed", "rejected", "cancelled"].includes(
      r.status
    )
  ).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading guest requests...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[COLORS.background, "#f0fdfa", "#f9fafb"]}
      style={styles.gradientBg}
    >
      <AppHeader title="Guest Requests" />
      <View style={{ height: 40 }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginTop: 76, marginBottom: 8, marginHorizontal: 18 }}>
          <Text style={{ fontSize: 26, fontWeight: "bold", color: "#111" }}>
            Welcome back, {user?.name || "Host"}!
          </Text>
          <Text style={{ fontSize: 16, color: "#888", marginTop: 2 }}>
            Manage your guest requests and account
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginHorizontal: 12,
            marginTop: 0,
            marginBottom: 18,
            gap: 10,
          }}
        >
          {/* Total Requests */}
          <View
            style={{
              flex: 1,
              backgroundColor: "#f0f9ff",
              borderRadius: 18,
              alignItems: "center",
              paddingVertical: 18,
              marginRight: 4,
              shadowColor: "#38bdf8",
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Feather
              name="list"
              size={28}
              color="#0ea5e9"
              style={{ marginBottom: 6 }}
            />
            <Text style={{ color: "#222", fontWeight: "600", fontSize: 15 }}>
              Total Requests
            </Text>
            <Text
              style={{
                color: "#0ea5e9",
                fontWeight: "bold",
                fontSize: 22,
                marginTop: 2,
              }}
            >
              {totalRequestsCount}
            </Text>
          </View>
          {/* Approved Requests */}
          <View
            style={{
              flex: 1,
              backgroundColor: "#f0fdf4",
              borderRadius: 18,
              alignItems: "center",
              paddingVertical: 18,
              marginHorizontal: 4,
              shadowColor: "#22c55e",
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Feather
              name="check-circle"
              size={28}
              color="#22c55e"
              style={{ marginBottom: 6 }}
            />
            <Text style={{ color: "#222", fontWeight: "600", fontSize: 15 }}>
              Approved
            </Text>
            <Text
              style={{
                color: "#22c55e",
                fontWeight: "bold",
                fontSize: 22,
                marginTop: 2,
              }}
            >
              {
                myRequests.filter(
                  (r) => r.status === "approved" || r.status === "confirmed"
                ).length
              }
            </Text>
          </View>
          {/* Rejected Requests */}
          <View
            style={{
              flex: 1,
              backgroundColor: "#fef2f2",
              borderRadius: 18,
              alignItems: "center",
              paddingVertical: 18,
              marginLeft: 4,
              shadowColor: "#ef4444",
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Feather
              name="x-circle"
              size={28}
              color="#ef4444"
              style={{ marginBottom: 6 }}
            />
            <Text style={{ color: "#222", fontWeight: "600", fontSize: 15 }}>
              Rejected
            </Text>
            <Text
              style={{
                color: "#ef4444",
                fontWeight: "bold",
                fontSize: 22,
                marginTop: 2,
              }}
            >
              {
                myRequests.filter(
                  (r) => r.status === "rejected" || r.status === "cancelled"
                ).length
              }
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.sectionContainer,
            {
              backgroundColor: "#fff",
              borderRadius: 16,
              marginHorizontal: 12,
              marginBottom: 18,
              shadowColor: "#000",
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
              padding: 18,
              paddingTop: 70,
            },
          ]}
        >
          <View
            style={[
              styles.sectionHeaderRow,
              { marginBottom: 18, alignItems: "center" },
            ]}
          >
            <Feather
              name="clock"
              size={26}
              color="#fbbf24"
              style={{ marginRight: 12 }}
            />
            <Text
              style={[
                styles.sectionTitle,
                { fontSize: 22, fontWeight: "bold", color: COLORS.text },
              ]}
            >
              Pending Requests
            </Text>
          </View>
          <Text
            style={[styles.sectionSubtitle, { fontSize: 16, marginBottom: 18 }]}
          >
            Requests waiting for your approval.
          </Text>
          {pendingRequests.length === 0 ? (
            <View style={styles.emptyStateBox}>
              <Feather
                name="clock"
                size={48}
                color="#fde68a"
                style={{ marginBottom: 8 }}
              />
              <Text
                style={[
                  styles.emptySubText,
                  {
                    fontSize: 16,
                    color: COLORS.textMuted,
                    textAlign: "center",
                  },
                ]}
              >
                No pending requests.
              </Text>
            </View>
          ) : (
            <View style={styles.requestsList}>
              {pendingRequests.map((req) => {
                const startDate = new Date(req.startDate);
                const endDate = new Date(req.endDate);
                const nights = Math.round(
                  (endDate - startDate) / (1000 * 60 * 60 * 24)
                );
                const statusColor =
                  statusStyles[req.status] || statusStyles.pending;
                const isImageLoading = imageLoadingStates[req._id] !== false;
                const isImageError = imageErrorStates[req._id] === true;

                return (
                  <Animated.View
                    key={req._id}
                    style={{
                      marginBottom: 28,
                      borderRadius: 24,
                      backgroundColor: "#fff",
                      shadowColor: "#000",
                      shadowOpacity: 0.15,
                      shadowRadius: 18,
                      shadowOffset: { width: 0, height: 6 },
                      elevation: 8,
                      overflow: "visible",
                      transform: [{ scale: 1 }],
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        padding: 18,
                      }}
                    >
                      {/* Left: Details column */}
                      <View
                        style={{
                          flex: 1,
                          minWidth: 0,
                          justifyContent: "flex-start",
                        }}
                      >
                        <Text
                          style={{
                            fontWeight: "bold",
                            fontSize: 19,
                            color: "#222",
                            marginBottom: 2,
                          }}
                          numberOfLines={1}
                        >
                          {req.listing?.title || "Property"}
                        </Text>
                        {/* Location */}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 2,
                          }}
                        >
                          <Feather
                            name="map-pin"
                            size={15}
                            color={COLORS.textMuted}
                          />
                          <Text
                            style={{
                              fontSize: 13,
                              color: COLORS.textMuted,
                              marginLeft: 4,
                            }}
                            numberOfLines={1}
                          >
                            {req.listing?.location || "Location"}
                          </Text>
                        </View>
                        {/* Order by (Guest) */}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 2,
                          }}
                        >
                          <Feather
                            name="user"
                            size={14}
                            color={COLORS.textMuted}
                            style={{ marginRight: 2 }}
                          />
                          <Text
                            style={{ fontSize: 13, color: COLORS.textMuted }}
                          >
                            Order by:{" "}
                            <Text
                              style={{ color: COLORS.text, fontWeight: "500" }}
                            >
                              {req.userId?.name || "N/A"}
                            </Text>
                          </Text>
                        </View>
                        {/* Check-in */}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 2,
                          }}
                        >
                          <Feather
                            name="calendar"
                            size={14}
                            color={COLORS.textMuted}
                            style={{ marginRight: 2 }}
                          />
                          <Text
                            style={{ fontSize: 13, color: COLORS.textMuted }}
                          >
                            Check-in:{" "}
                            <Text
                              style={{ color: COLORS.text, fontWeight: "500" }}
                            >
                              {formatDate(req.startDate)}
                            </Text>
                          </Text>
                        </View>
                        {/* Check-out */}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 2,
                          }}
                        >
                          <Feather
                            name="calendar"
                            size={14}
                            color={COLORS.textMuted}
                            style={{ marginRight: 2 }}
                          />
                          <Text
                            style={{ fontSize: 13, color: COLORS.textMuted }}
                          >
                            Check-out:{" "}
                            <Text
                              style={{ color: COLORS.text, fontWeight: "500" }}
                            >
                              {formatDate(req.endDate)}
                            </Text>
                          </Text>
                        </View>
                        {/* Guests */}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 2,
                          }}
                        >
                          <Feather
                            name="users"
                            size={14}
                            color={COLORS.textMuted}
                            style={{ marginRight: 2 }}
                          />
                          <Text
                            style={{ fontSize: 13, color: COLORS.textMuted }}
                          >
                            Guests:{" "}
                            <Text
                              style={{ color: COLORS.text, fontWeight: "500" }}
                            >
                              {req.adults || 1}
                            </Text>
                          </Text>
                        </View>
                        {/* Duration */}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 2,
                          }}
                        >
                          <Feather
                            name="clock"
                            size={14}
                            color={COLORS.textMuted}
                            style={{ marginRight: 2 }}
                          />
                          <Text
                            style={{ fontSize: 13, color: COLORS.textMuted }}
                          >
                            Duration:{" "}
                            <Text
                              style={{ color: COLORS.text, fontWeight: "500" }}
                            >
                              {nights} {nights === 1 ? "night" : "nights"}
                            </Text>
                          </Text>
                        </View>
                        {/* Total */}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 2,
                          }}
                        >
                          <Feather
                            name="dollar-sign"
                            size={14}
                            color={COLORS.textMuted}
                            style={{ marginRight: 2 }}
                          />
                          <Text
                            style={{ fontSize: 13, color: COLORS.textMuted }}
                          >
                            Total:{" "}
                            <Text
                              style={{ color: COLORS.text, fontWeight: "500" }}
                            >
                              ${req.totalPrice?.toLocaleString() || 0}
                            </Text>
                          </Text>
                        </View>
                        {req.specialRequests ? (
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginTop: 2,
                            }}
                          >
                            <Feather
                              name="message-circle"
                              size={15}
                              color={COLORS.primary}
                              style={{ marginRight: 6 }}
                            />
                            <Text
                              style={{
                                fontSize: 13,
                                color: COLORS.primary,
                                fontStyle: "italic",
                              }}
                            >
                              {req.specialRequests}
                            </Text>
                          </View>
                        ) : null}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginTop: 8,
                          }}
                        >
                          <View
                            style={{
                              backgroundColor: statusColor.bg,
                              borderRadius: 16,
                              paddingHorizontal: 18,
                              paddingVertical: 6,
                              shadowColor: statusColor.bg,
                              shadowOpacity: 0.12,
                              shadowRadius: 8,
                              elevation: 4,
                              alignSelf: "flex-start",
                            }}
                          >
                            <Text
                              style={{
                                color: statusColor.text,
                                fontWeight: "bold",
                                fontSize: 14,
                                letterSpacing: 1,
                              }}
                            >
                              {req.status.charAt(0).toUpperCase() +
                                req.status.slice(1)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      {/* Right: Image at top, buttons below */}
                      <View
                        style={{
                          alignItems: "flex-end",
                          justifyContent: "flex-start",
                          marginLeft: 18,
                          gap: 4,
                        }}
                      >
                        <View style={styles.requestImageContainer}>
                          {!isImageError && (
                            <Image
                              source={{
                                uri:
                                  req.listing?.images?.[0] ||
                                  "https://via.placeholder.com/300x200?text=Property",
                              }}
                              style={styles.requestImage}
                              resizeMode="cover"
                              onLoadStart={() => handleImageLoadStart(req._id)}
                              onLoadEnd={() => handleImageLoadEnd(req._id)}
                              onError={() => handleImageError(req._id)}
                            />
                          )}
                          {(isImageLoading || isImageError) && (
                            <View
                              style={[
                                styles.requestImage,
                                styles.placeholderContainer,
                              ]}
                            >
                              <Feather
                                name="image"
                                size={24}
                                color={COLORS.primary}
                              />
                            </View>
                          )}
                        </View>
                        <View style={{ width: 110 }}>
                          <TouchableOpacity
                            style={{
                              backgroundColor: COLORS.primary,
                              borderRadius: 20,
                              paddingVertical: 8,
                              alignItems: "center",
                              flexDirection: "row",
                              justifyContent: "center",
                              shadowColor: COLORS.primary,
                              shadowOpacity: 0.13,
                              shadowRadius: 6,
                              elevation: 2,
                              marginBottom: 7,
                            }}
                            onPress={() => handleAction(req._id, "approved")}
                            activeOpacity={0.85}
                          >
                            <Feather
                              name="check"
                              size={15}
                              color="#fff"
                              style={{ marginRight: 6 }}
                            />
                            <Text
                              style={{
                                color: "#fff",
                                fontWeight: "bold",
                                fontSize: 14,
                              }}
                            >
                              Approve
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={{
                              backgroundColor: "#fee2e2",
                              borderRadius: 20,
                              paddingVertical: 8,
                              alignItems: "center",
                              flexDirection: "row",
                              justifyContent: "center",
                              shadowColor: "#dc2626",
                              shadowOpacity: 0.1,
                              shadowRadius: 6,
                              elevation: 2,
                            }}
                            onPress={() => handleAction(req._id, "rejected")}
                            activeOpacity={0.85}
                          >
                            <Feather
                              name="x"
                              size={15}
                              color={COLORS.primary}
                              style={{ marginRight: 6 }}
                            />
                            <Text
                              style={{
                                color: COLORS.primary,
                                fontWeight: "bold",
                                fontSize: 14,
                              }}
                            >
                              Reject
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </View>

        {/* Divider */}
        <View style={[styles.sectionDivider, { marginVertical: 12 }]} />

        {/* Approved Requests Section */}
        <View
          style={[
            styles.sectionContainer,
            {
              backgroundColor: "#fff",
              borderRadius: 16,
              marginHorizontal: 12,
              marginBottom: 18,
              shadowColor: "#000",
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
              padding: 18,
            },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <Feather
              name="check-circle"
              size={22}
              color="#22c55e"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.sectionTitle}>Recent Approved Requests</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            The latest 5 bookings you have approved.
          </Text>
          {approvedRequests.length === 0 ? (
            <View style={styles.emptyStateBox}>
              <Feather name="check-circle" size={40} color="#a7f3d0" />
              <Text style={styles.emptySubText}>No approved requests yet.</Text>
            </View>
          ) : (
            <View style={styles.requestsList}>
              {approvedRequests.map((req) => {
                const startDate = new Date(req.startDate);
                const endDate = new Date(req.endDate);
                const nights = Math.round(
                  (endDate - startDate) / (1000 * 60 * 60 * 24)
                );
                const statusColor =
                  statusStyles[req.status] || statusStyles.pending;
                const isImageLoading = imageLoadingStates[req._id] !== false;
                const isImageError = imageErrorStates[req._id] === true;

                return (
                  <Animated.View
                    key={req._id}
                    style={{
                      marginBottom: 28,
                      borderRadius: 24,
                      backgroundColor: "#fff",
                      shadowColor: "#000",
                      shadowOpacity: 0.15,
                      shadowRadius: 18,
                      shadowOffset: { width: 0, height: 6 },
                      elevation: 8,
                      overflow: "visible",
                      transform: [{ scale: 1 }],
                      position: "relative",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 18,
                        paddingTop: 10,
                        gap: 10,
                      }}
                    >
                      {/* Image with border/shadow */}
                      <View style={styles.requestImageContainer}>
                        {!isImageError && (
                          <Image
                            source={{
                              uri:
                                req.listing?.images?.[0] ||
                                "https://via.placeholder.com/300x200?text=Property",
                            }}
                            style={styles.requestImage}
                            resizeMode="cover"
                            onLoadStart={() => handleImageLoadStart(req._id)}
                            onLoadEnd={() => handleImageLoadEnd(req._id)}
                            onError={() => handleImageError(req._id)}
                          />
                        )}
                        {(isImageLoading || isImageError) && (
                          <View
                            style={[
                              styles.requestImage,
                              styles.placeholderContainer,
                            ]}
                          >
                            <Feather
                              name="image"
                              size={24}
                              color={COLORS.primary}
                            />
                          </View>
                        )}
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          style={{
                            fontWeight: "bold",
                            fontSize: 19,
                            color: "#222",
                            marginBottom: 2,
                          }}
                          numberOfLines={1}
                        >
                          {req.listing?.title || "Property"}
                        </Text>
                        {/* Location */}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 2,
                          }}
                        >
                          <Feather
                            name="map-pin"
                            size={15}
                            color={COLORS.textMuted}
                          />
                          <Text
                            style={{
                              fontSize: 13,
                              color: COLORS.textMuted,
                              marginLeft: 4,
                            }}
                            numberOfLines={1}
                          >
                            {req.listing?.location || "Location"}
                          </Text>
                        </View>
                        {/* Order by (Guest) */}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 2,
                          }}
                        >
                          <Feather
                            name="user"
                            size={14}
                            color={COLORS.textMuted}
                            style={{ marginRight: 2 }}
                          />
                          <Text
                            style={{ fontSize: 13, color: COLORS.textMuted }}
                          >
                            Order by:{" "}
                            <Text
                              style={{ color: COLORS.text, fontWeight: "500" }}
                            >
                              {req.userId?.name || "N/A"}
                            </Text>
                          </Text>
                        </View>
                        {/* Check-in */}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 2,
                          }}
                        >
                          <Feather
                            name="calendar"
                            size={14}
                            color={COLORS.textMuted}
                            style={{ marginRight: 2 }}
                          />
                          <Text
                            style={{ fontSize: 13, color: COLORS.textMuted }}
                          >
                            Check-in:{" "}
                            <Text
                              style={{ color: COLORS.text, fontWeight: "500" }}
                            >
                              {formatDate(req.startDate)}
                            </Text>
                          </Text>
                        </View>
                        {/* Check-out */}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 2,
                          }}
                        >
                          <Feather
                            name="calendar"
                            size={14}
                            color={COLORS.textMuted}
                            style={{ marginRight: 2 }}
                          />
                          <Text
                            style={{ fontSize: 13, color: COLORS.textMuted }}
                          >
                            Check-out:{" "}
                            <Text
                              style={{ color: COLORS.text, fontWeight: "500" }}
                            >
                              {formatDate(req.endDate)}
                            </Text>
                          </Text>
                        </View>
                        {/* Guests */}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 2,
                          }}
                        >
                          <Feather
                            name="users"
                            size={14}
                            color={COLORS.textMuted}
                            style={{ marginRight: 2 }}
                          />
                          <Text
                            style={{ fontSize: 13, color: COLORS.textMuted }}
                          >
                            Guests:{" "}
                            <Text
                              style={{ color: COLORS.text, fontWeight: "500" }}
                            >
                              {req.adults || 1}
                            </Text>
                          </Text>
                        </View>
                        {/* Duration */}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 2,
                          }}
                        >
                          <Feather
                            name="clock"
                            size={14}
                            color={COLORS.textMuted}
                            style={{ marginRight: 2 }}
                          />
                          <Text
                            style={{ fontSize: 13, color: COLORS.textMuted }}
                          >
                            Duration:{" "}
                            <Text
                              style={{ color: COLORS.text, fontWeight: "500" }}
                            >
                              {nights} {nights === 1 ? "night" : "nights"}
                            </Text>
                          </Text>
                        </View>
                        {/* Total */}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 2,
                          }}
                        >
                          <Feather
                            name="dollar-sign"
                            size={14}
                            color={COLORS.textMuted}
                            style={{ marginRight: 2 }}
                          />
                          <Text
                            style={{ fontSize: 13, color: COLORS.textMuted }}
                          >
                            Total:{" "}
                            <Text
                              style={{ color: COLORS.text, fontWeight: "500" }}
                            >
                              ${req.totalPrice?.toLocaleString() || 0}
                            </Text>
                          </Text>
                        </View>
                        {req.specialRequests ? (
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginTop: 2,
                            }}
                          >
                            <Feather
                              name="message-circle"
                              size={15}
                              color={COLORS.primary}
                              style={{ marginRight: 6 }}
                            />
                            <Text
                              style={{
                                fontSize: 13,
                                color: COLORS.primary,
                                fontStyle: "italic",
                              }}
                            >
                              {req.specialRequests}
                            </Text>
                          </View>
                        ) : null}
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginTop: 8,
                          }}
                        >
                          <View
                            style={{
                              backgroundColor: statusColor.bg,
                              borderRadius: 16,
                              paddingHorizontal: 18,
                              paddingVertical: 6,
                              shadowColor: statusColor.bg,
                              shadowOpacity: 0.12,
                              shadowRadius: 8,
                              elevation: 4,
                              alignSelf: "flex-start",
                            }}
                          >
                            <Text
                              style={{
                                color: statusColor.text,
                                fontWeight: "bold",
                                fontSize: 14,
                                letterSpacing: 1,
                              }}
                            >
                              {req.status.charAt(0).toUpperCase() +
                                req.status.slice(1)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textMuted,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerSection: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.text,
  },
  sectionContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: 10,
  },
  requestsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    color: COLORS.textMuted,
    marginTop: 12,
    marginBottom: 8,
    fontWeight: "500",
  },
  requestsList: {
    gap: 18,
  },
  requestCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: "row",
    marginBottom: 8,
  },
  requestImage: {
    width: 110,
    height: 110,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    backgroundColor: "#f3f4f6",
  },
  requestContent: {
    flex: 1,
    padding: 14,
    justifyContent: "space-between",
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  requestTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  requestTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 2,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  statusBadge: {
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  statusText: {
    color: "#d97706",
    fontWeight: "bold",
    fontSize: 13,
  },
  requestDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 6,
    gap: 18,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  detailValue: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: "500",
  },
  specialRequestRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 2,
  },
  specialRequestText: {
    fontSize: 13,
    color: COLORS.primary,
    fontStyle: "italic",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    gap: 8,
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 20,
  },
  emptyStateBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  gradientBg: {
    flex: 1,
  },
  floatingCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  requestImageRounded: {
    width: 110,
    height: 110,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    backgroundColor: "#f3f4f6",
  },
  sectionSubtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginBottom: 10,
  },
  requestTitleModern: {
    fontSize: 17,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 2,
  },
  detailLabelModern: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  detailValueModern: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: "500",
  },
  actionBtnModern: {
    height: 36,
    width: 92,
    paddingHorizontal: 0,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    borderRadius: 10,
  },
  actionBtnTextModern: {
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 0,
    textAlign: "center",
  },
  requestImageContainer: {
    width: 110,
    height: 110,
    borderRadius: 16,
    overflow: "hidden",
  },
  placeholderContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  requestImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
  },
});
