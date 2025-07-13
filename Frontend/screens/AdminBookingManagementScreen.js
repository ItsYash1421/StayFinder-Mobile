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
  TextInput,
  FlatList,
} from "react-native";
import { COLORS, getHeaderHeight, getResponsiveSize } from "../constants/theme";
import { Feather } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { api } from "../constants/api";
import AdminHeader, { ADMIN_HEADER_HEIGHT } from "../components/AdminHeader";
import { useToast } from '../context/ToastContext';

const ANDROID_EXTRA_TOP = Platform.OS === "android" ? StatusBar.currentHeight || 24 : 0;
const HEADER_HEIGHT = getHeaderHeight() + ANDROID_EXTRA_TOP;

export default function AdminBookingManagementScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/admin/bookings");
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.showToast("Failed to load bookings", "error");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleBookingAction = (bookingId, action) => {
    Alert.alert(
      "Confirm Action",
      `Are you sure you want to ${action} this booking?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: action.charAt(0).toUpperCase() + action.slice(1), 
          style: action === "cancel" ? "destructive" : "default",
          onPress: () => performBookingAction(bookingId, action)
        },
      ]
    );
  };

  const performBookingAction = async (bookingId, action) => {
    try {
      const response = await api.put(`/api/admin/bookings/${bookingId}/${action}`);
      if (response.data.success) {
        toast.showToast(`Booking ${action}ed successfully`, "success");
        fetchBookings();
      }
    } catch (error) {
      console.error(`Error ${action}ing booking:`, error);
      toast.showToast(`Failed to ${action} booking`, "error");
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.guestName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         booking.propertyTitle?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || booking.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const BookingCard = ({ booking }) => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <Text style={styles.bookingId}>#{booking._id.slice(-6)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
          <Text style={styles.statusText}>{booking.status}</Text>
        </View>
      </View>
      
      <View style={styles.bookingInfo}>
        <Text style={styles.propertyTitle}>{booking.propertyTitle}</Text>
        <Text style={styles.guestName}>Guest: {booking.guestName}</Text>
        <Text style={styles.hostName}>Host: {booking.hostName}</Text>
        
        <View style={styles.bookingDates}>
          <View style={styles.dateItem}>
            <Feather name="calendar" size={14} color={COLORS.textMuted} />
            <Text style={styles.dateText}>
              {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
            </Text>
          </View>
        </View>
        
        <View style={styles.bookingMeta}>
          <Text style={styles.bookingPrice}>${booking.totalPrice}</Text>
          <Text style={styles.bookingGuests}>{booking.guests} guests</Text>
        </View>
      </View>

      <View style={styles.bookingActions}>
        {booking.status === "pending" && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#10B981" }]}
              onPress={() => handleBookingAction(booking._id, "approve")}
            >
              <Feather name="check" size={16} color="white" />
              <Text style={styles.actionText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#EF4444" }]}
              onPress={() => handleBookingAction(booking._id, "reject")}
            >
              <Feather name="x" size={16} color="white" />
              <Text style={styles.actionText}>Reject</Text>
            </TouchableOpacity>
          </>
        )}
        {booking.status === "confirmed" && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#EF4444" }]}
            onPress={() => handleBookingAction(booking._id, "cancel")}
          >
            <Feather name="x-circle" size={16} color="white" />
            <Text style={styles.actionText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed": return "#10B981";
      case "pending": return "#F59E0B";
      case "cancelled": return "#EF4444";
      case "completed": return "#6B7280";
      default: return "#6B7280";
    }
  };

  return (
    <View style={styles.container}>
      <AdminHeader
        title="Booking Management"
        showBack={true}
        onBackPress={() => navigation.goBack()}
      />
      {/* Main Content with top margin to avoid overlap */}
      <ScrollView
        style={[styles.scrollView, { marginTop: 40 }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Search and Filter Section */}
        <View style={styles.filterSection}>
          <View style={styles.searchContainer}>
            <Feather name="search" size={20} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search bookings..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
          
          <View style={styles.filterButtons}>
            {["all", "pending", "confirmed", "cancelled", "completed"].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterButton,
                  filterStatus === status && styles.filterButtonActive
                ]}
                onPress={() => setFilterStatus(status)}
              >
                <Text style={[
                  styles.filterButtonText,
                  filterStatus === status && styles.filterButtonTextActive
                ]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bookings List */}
        <View style={styles.bookingsSection}>
          <Text style={styles.sectionTitle}>
            Bookings ({filteredBookings.length})
          </Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : filteredBookings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="calendar" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No bookings found</Text>
            </View>
          ) : (
            <FlatList
              data={filteredBookings}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => <BookingCard booking={item} />}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
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
  filterSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: getResponsiveSize(14, 15, 16, 17),
    color: COLORS.text,
  },
  filterButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 2,
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: getResponsiveSize(10, 11, 12, 13),
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: "white",
  },
  bookingsSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: getResponsiveSize(18, 19, 20, 21),
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 15,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
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
  bookingCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  bookingId: {
    fontSize: getResponsiveSize(12, 13, 14, 15),
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: getResponsiveSize(10, 11, 12, 13),
    fontWeight: "500",
    color: "white",
  },
  bookingInfo: {
    marginBottom: 12,
  },
  propertyTitle: {
    fontSize: getResponsiveSize(16, 17, 18, 19),
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  guestName: {
    fontSize: getResponsiveSize(13, 14, 15, 16),
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  hostName: {
    fontSize: getResponsiveSize(13, 14, 15, 16),
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  bookingDates: {
    marginBottom: 8,
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: getResponsiveSize(12, 13, 14, 15),
    color: COLORS.textMuted,
    marginLeft: 6,
  },
  bookingMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bookingPrice: {
    fontSize: getResponsiveSize(14, 15, 16, 17),
    fontWeight: "bold",
    color: COLORS.primary,
  },
  bookingGuests: {
    fontSize: getResponsiveSize(12, 13, 14, 15),
    color: COLORS.textMuted,
  },
  bookingActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
    justifyContent: "center",
  },
  actionText: {
    fontSize: getResponsiveSize(12, 13, 14, 15),
    color: "white",
    fontWeight: "500",
    marginLeft: 4,
  },
}); 