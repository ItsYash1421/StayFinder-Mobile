import React, { useEffect, useState, useContext, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import {
  COLORS,
  getResponsiveSize,
  FONT_SIZES,
  SPACING,
  BORDER_RADIUS,
  getShadow,
  isTablet,
  isLargeTablet,
  getGridColumns,
} from "../constants/theme";
import { Feather } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { api } from "../constants/api";
import AppHeader from "../components/AppHeader";
import BecomeHost from "../components/BecomeHost";
import { useFocusEffect } from "@react-navigation/native";
import { useToast } from '../context/ToastContext';


export default function HostDashboardScreen({ navigation }) {
  const { user, token } = useContext(AuthContext);
  const toast = useToast();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  const [imageErrorStates, setImageErrorStates] = useState({});

  // Fetch host's listings
  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/api/listings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Filter listings by hostId (populated object or string)
      const hostListings = response.data.listings.filter(
        (l) =>
          (typeof l.hostId === "object" && l.hostId._id === user?._id) ||
          (typeof l.hostId === "string" && l.hostId === user?._id)
      );
      setListings(hostListings);
    } catch (err) {
      setError("Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (user && token) fetchListings();
    }, [user, token]),
  );

  // Stats
  const totalListings = listings.length;
  const averagePrice =
    listings.reduce((sum, l) => sum + l.price, 0) / (totalListings || 1);
  const averageRating =
    listings.reduce((sum, l) => sum + (l.rating || 0), 0) /
    (totalListings || 1);

  // Delete listing
  const handleDeleteListing = async (listingId) => {
    try {
      const response = await api.delete(`/api/listings/${listingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        toast.showToast("Listing deleted successfully!", "success");
        // Remove from local state
        setListings(prev => prev.filter(listing => listing._id !== listingId));
      } else {
        const errorMessage = response.data.message || "Failed to delete listing";
        toast.showToast(errorMessage, "error");
      }
    } catch (error) {
      console.error("Error deleting listing:", error);
      const errorMessage = error.response?.data?.message || "Failed to delete listing";
      toast.showToast(errorMessage, "error");
    }
  };

  const handleImageLoadStart = (listingId) => {
    setImageLoadingStates(prev => ({ ...prev, [listingId]: true }));
  };

  const handleImageLoadEnd = (listingId) => {
    setImageLoadingStates(prev => ({ ...prev, [listingId]: false }));
  };

  const handleImageError = (listingId) => {
    setImageErrorStates(prev => ({ ...prev, [listingId]: true }));
    setImageLoadingStates(prev => ({ ...prev, [listingId]: false }));
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Host Dashboard" />
      <View style={{ height: 90 }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Host Dashboard</Text>
        <Text style={styles.subtitle}>
          Manage your listings and view performance
        </Text>
        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: "#e0edfa" }]}>
            <Feather
              name="home"
              size={getResponsiveSize(24, 26, 28, 32)}
              color={COLORS.primary}
            />
            <Text style={styles.statLabel}>Total Listings</Text>
            <Text style={styles.statValue}>{totalListings}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#e6f7ec" }]}>
            <Feather
              name="dollar-sign"
              size={getResponsiveSize(24, 26, 28, 32)}
              color={COLORS.success || "#22c55e"}
            />
            <Text style={styles.statLabel}>Average Price</Text>
            <Text
              style={[styles.statValue, { color: COLORS.success || "#22c55e" }]}
            >
              ${averagePrice.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#f3e8ff" }]}>
            <Feather
              name="star"
              size={getResponsiveSize(24, 26, 28, 32)}
              color={COLORS.warning || "#a21caf"}
            />
            <Text style={styles.statLabel}>Average Rating</Text>
            <Text
              style={[styles.statValue, { color: COLORS.warning || "#a21caf" }]}
            >
              {averageRating.toFixed(1)}/5
            </Text>
          </View>
        </View>
        {/* Add New Listing Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("CreateListing")}
          activeOpacity={0.85}
        >
          <Feather
            name="plus"
            size={getResponsiveSize(16, 18, 20, 22)}
            color="#fff"
          />
          <Text style={styles.addButtonText}>Add New Listing</Text>
        </TouchableOpacity>
        {/* Listings Section */}
        <View style={styles.listingsSection}>
          <Text style={styles.sectionTitle}>Your Listings</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading your listings...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Feather name="wifi-off" size={48} color={COLORS.textMuted} />
              <Text style={styles.errorTitle}>Failed to load listings</Text>
              <Text style={styles.errorSubtitle}>
                Please check your internet connection and try again
              </Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={fetchListings}
                activeOpacity={0.8}
              >
                <Feather name="refresh-cw" size={20} color="#fff" />
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          ) : listings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather
                name="home"
                size={getResponsiveSize(36, 40, 44, 48)}
                color={COLORS.textMuted}
              />
              <Text style={styles.emptyText}>No listings yet!</Text>
              <TouchableOpacity
                style={styles.createFirstButton}
                onPress={() => navigation.navigate("CreateListing")}
                activeOpacity={0.85}
              >
                <Text style={styles.createFirstButtonText}>
                  Create Your First Listing
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.listingsGrid}>
              {listings.map((listing) => {
                const isImageLoading = imageLoadingStates[listing._id] !== false;
                const isImageError = imageErrorStates[listing._id] === true;
                
                return (
                  <View key={listing._id} style={styles.listingCard}>
                    <View style={styles.listingImageContainer}>
                      {!isImageError && (
                        <Image
                          source={{ uri: listing.images?.[0] || "https://via.placeholder.com/300x200?text=Property" }}
                          style={styles.listingImage}
                          resizeMode="cover"
                          onLoadStart={() => handleImageLoadStart(listing._id)}
                          onLoadEnd={() => handleImageLoadEnd(listing._id)}
                          onError={() => handleImageError(listing._id)}
                        />
                      )}
                      {(isImageLoading || isImageError) && (
                        <View style={[styles.listingImage, styles.placeholderContainer]}>
                          <Feather name="image" size={24} color={COLORS.primary} />
                        </View>
                      )}
                    </View>
                    <View style={styles.listingInfo}>
                      <Text style={styles.listingTitle}>{listing.title}</Text>
                      <View style={styles.listingRow}>
                        <Feather
                          name="map-pin"
                          size={getResponsiveSize(14, 16, 18, 20)}
                          color={COLORS.textMuted}
                        />
                        <Text style={styles.listingLocation}>
                          {listing.location || "City, Country"}
                        </Text>
                      </View>
                      <View style={styles.listingStatsRow}>
                        <Text style={styles.listingStat}>
                          ${listing.price}/night
                        </Text>
                        <Text style={styles.listingStat}>
                          {listing.bedrooms} beds
                        </Text>
                        <Text style={styles.listingStat}>
                          {listing.bathrooms} baths
                        </Text>
                      </View>
                      <View style={styles.amenitiesRow}>
                        {listing.amenities &&
                          Object.entries(listing.amenities)
                            .filter(([_, v]) => v)
                            .slice(0, 3) // Limit to 3 amenities for better layout
                            .map(([k]) => (
                              <View key={k} style={styles.amenityChip}>
                                <Text style={styles.amenityText}>{k}</Text>
                              </View>
                            ))}
                      </View>
                      <View style={styles.ratingRow}>
                        <Feather
                          name="star"
                          size={getResponsiveSize(14, 16, 18, 20)}
                          color="#fbbf24"
                        />
                        <Text style={styles.ratingText}>
                          {listing.rating?.toFixed(1) || "New"}
                        </Text>
                      </View>
                      <View style={styles.actionsRow}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() =>
                            navigation.navigate("ListingDetail", {
                              id: listing._id,
                            })
                          }
                        >
                          <Feather
                            name="eye"
                            size={getResponsiveSize(14, 16, 18, 20)}
                            color={COLORS.primary}
                          />
                          <Text style={styles.actionButtonText} numberOfLines={1} ellipsizeMode="tail">View</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() =>
                            navigation.navigate("EditListing", {
                              id: listing._id,
                            })
                          }
                        >
                          <Feather
                            name="edit"
                            size={getResponsiveSize(14, 16, 18, 20)}
                            color={COLORS.warning || "#eab308"}
                          />
                          <Text style={styles.actionButtonText} numberOfLines={1} ellipsizeMode="tail">Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleDeleteListing(listing._id)}
                        >
                          <Feather
                            name="trash-2"
                            size={getResponsiveSize(14, 16, 18, 20)}
                            color={COLORS.error || "#ef4444"}
                          />
                          <Text style={styles.actionButtonText} numberOfLines={1} ellipsizeMode="tail">Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Separate Become a Host section below listingsSection */}

        <BecomeHost />
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
    paddingBottom: getResponsiveSize(30, 35, 40, 45),
  },
  title: {
    fontSize: FONT_SIZES["4xl"],
    fontWeight: "bold",
    color: COLORS.text,
    marginHorizontal: getResponsiveSize(16, 18, 20, 24),
    marginTop: getResponsiveSize(12, 14, 16, 18),
    marginBottom: getResponsiveSize(2, 4, 6, 8),
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textMuted,
    marginHorizontal: getResponsiveSize(16, 18, 20, 24),
    marginBottom: getResponsiveSize(16, 18, 20, 24),
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: getResponsiveSize(16, 18, 20, 24),
    marginBottom: getResponsiveSize(16, 18, 20, 24),
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BORDER_RADIUS.lg,
    padding: getResponsiveSize(14, 16, 18, 20),
    marginHorizontal: getResponsiveSize(4, 6, 8, 10),
    ...getShadow("sm"),
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: getResponsiveSize(6, 8, 10, 12),
    textAlign: "center",
  },
  statValue: {
    fontSize: FONT_SIZES["2xl"],
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: getResponsiveSize(2, 3, 4, 5),
    textAlign: "center",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: getResponsiveSize(12, 14, 16, 18),
    marginHorizontal: getResponsiveSize(16, 18, 20, 24),
    marginBottom: getResponsiveSize(16, 18, 20, 24),
    ...getShadow("md"),
  },
  addButtonText: {
    color: "#fff",
    fontSize: FONT_SIZES.lg,
    fontWeight: "600",
    marginLeft: getResponsiveSize(6, 8, 10, 12),
  },
  listingsSection: {
    paddingHorizontal: getResponsiveSize(10, 14, 18, 22),
    marginTop: getResponsiveSize(6, 8, 10, 12),
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: getResponsiveSize(10, 12, 14, 16),
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: getResponsiveSize(32, 36, 40, 44),
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.lg,
    marginTop: getResponsiveSize(10, 12, 14, 16),
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: getResponsiveSize(32, 36, 40, 44),
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.lg,
    marginTop: getResponsiveSize(10, 12, 14, 16),
    marginBottom: getResponsiveSize(14, 16, 18, 20),
  },
  createFirstButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: getResponsiveSize(20, 22, 24, 28),
    paddingVertical: getResponsiveSize(10, 12, 14, 16),
    marginTop: getResponsiveSize(6, 8, 10, 12),
    ...getShadow("sm"),
  },
  createFirstButtonText: {
    color: "#fff",
    fontSize: FONT_SIZES.lg,
    fontWeight: "600",
  },
  listingsGrid: {
    flexDirection: isTablet ? "row" : "column",
    flexWrap: isTablet ? "wrap" : "nowrap",
    justifyContent: isTablet ? "space-between" : "flex-start",
    gap: getResponsiveSize(12, 14, 16, 18),
  },
  listingCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: getResponsiveSize(10, 12, 14, 16),
    ...getShadow("sm"),
    overflow: "hidden",
    width: "100%",
    alignSelf: "center",
    padding: getResponsiveSize(8, 10, 12, 14),
  },
  listingImageContainer: {
    position: "relative",
    width: getResponsiveSize(80, 90, 100, 110),
    height: getResponsiveSize(80, 90, 100, 110),
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: "#eee",
  },
  listingImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: "#eee",
  },
  placeholderContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
  },
  listingInfo: {
    flex: 1,
    paddingLeft: getResponsiveSize(10, 12, 14, 16),
    justifyContent: "center",
  },
  listingTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: getResponsiveSize(2, 3, 4, 5),
  },
  listingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: getResponsiveSize(4, 6, 8, 10),
  },
  listingLocation: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginLeft: getResponsiveSize(3, 4, 5, 6),
  },
  listingStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: getResponsiveSize(4, 6, 8, 10),
    gap: getResponsiveSize(12, 14, 16, 18),
  },
  listingStat: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginRight: getResponsiveSize(12, 14, 16, 18),
  },
  amenitiesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: getResponsiveSize(4, 6, 8, 10),
    gap: getResponsiveSize(4, 6, 8, 10),
  },
  amenityChip: {
    backgroundColor: COLORS.primary + "11",
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: getResponsiveSize(6, 8, 10, 12),
    paddingVertical: getResponsiveSize(3, 4, 5, 6),
    marginRight: getResponsiveSize(4, 6, 8, 10),
    marginBottom: getResponsiveSize(3, 4, 5, 6),
  },
  amenityText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    textTransform: "capitalize",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: getResponsiveSize(4, 6, 8, 10),
  },
  ratingText: {
    fontSize: FONT_SIZES.sm,
    color: "#fbbf24",
    marginLeft: getResponsiveSize(3, 4, 5, 6),
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: getResponsiveSize(6, 8, 10, 12),
    gap: getResponsiveSize(6, 8, 10, 12),
    flexWrap: "nowrap",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: getResponsiveSize(8, 10, 12, 14),
    paddingVertical: getResponsiveSize(4, 6, 8, 10),
    minWidth: 70,
    flex: 1,
    justifyContent: "center",
    marginRight: getResponsiveSize(4, 6, 8, 10),
  },
  actionButtonText: {
    fontSize: 12,
    color: COLORS.text,
    marginLeft: getResponsiveSize(3, 4, 5, 6),
  },
  sectionSpacing: {
    height: getResponsiveSize(20, 22, 24, 28),
  },
  becomeHostCard: {
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.lg,
    padding: getResponsiveSize(20, 22, 24, 28),
    marginHorizontal: getResponsiveSize(16, 18, 20, 24),
    marginTop: getResponsiveSize(20, 22, 24, 28),
    marginBottom: getResponsiveSize(28, 32, 36, 40),
    ...getShadow("md"),
    alignItems: "center",
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: getResponsiveSize(32, 36, 40, 44),
  },
  errorTitle: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.lg,
    marginTop: getResponsiveSize(10, 12, 14, 16),
    marginBottom: getResponsiveSize(6, 8, 10, 12),
  },
  errorSubtitle: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    marginBottom: getResponsiveSize(14, 16, 18, 20),
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: getResponsiveSize(20, 22, 24, 28),
    paddingVertical: getResponsiveSize(10, 12, 14, 16),
    marginTop: getResponsiveSize(6, 8, 10, 12),
    ...getShadow("sm"),
  },
  refreshButtonText: {
    color: "#fff",
    fontSize: FONT_SIZES.lg,
    fontWeight: "600",
  },
});
