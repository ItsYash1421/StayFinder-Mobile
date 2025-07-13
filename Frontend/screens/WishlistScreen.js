import React, { useState, useEffect, useRef, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { COLORS } from "../constants/theme";
import { Feather } from "@expo/vector-icons";
import { api } from "../constants/api";
import WishlistItem from "../components/WishlistItem";
import useWishlist from "../hooks/useWishlist";
import AppHeader from "../components/AppHeader";
import { useFocusEffect } from "@react-navigation/native";
import { AuthContext } from "../context/AuthContext";
import { useToast } from '../context/ToastContext';

export default function WishlistScreen({ navigation }) {
  const { user, token } = useContext(AuthContext);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const {
    wishlist,
    getWishlist,
    toggleWishlist,
    loading: wishlistLoading,
  } = useWishlist();
  const hasLoadedRef = useRef(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  // Fetch all listings to filter wishlist items
  const fetchListings = async () => {
    try {
      const response = await api.get("/api/listings");
      setListings(response.data.listings || []);
    } catch (error) {
      console.error("Error fetching listings:", error);
      // Set error state for listings fetch
      setError("Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  // Refresh data when screen comes into focus (only once)
  useFocusEffect(
    React.useCallback(() => {
      if (!hasLoadedRef.current) {
        console.log("WishlistScreen focused, loading initial data...");
        getWishlist();
        fetchListings();
        hasLoadedRef.current = true;
      }
    }, [getWishlist]),
  );

  useEffect(() => {
    if (!hasLoadedRef.current) {
      fetchListings();
      hasLoadedRef.current = true;
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([getWishlist(), fetchListings()]);
    setRefreshing(false);
  };

  // Filter listings that are in wishlist and not paused
  const wishlistListings = listings.filter((listing) => {
    const isInWishlist =
      wishlist.includes(listing._id) ||
      wishlist.includes(listing._id.toString());
    const isNotPaused = listing.status !== "paused";
    return isInWishlist && isNotPaused;
  });

  // Debug function to check wishlist data (only log when there's an issue)
  const debugWishlist = () => {
    console.log("=== WISHLIST DEBUG ===");
    console.log("Wishlist array:", wishlist);
    console.log("Wishlist length:", wishlist.length);
    console.log("Available listings:", listings.length);
    console.log("Wishlist listings found:", wishlistListings.length);
    console.log("Loading states:", { loading, wishlistLoading, refreshing });
    console.log("=== END DEBUG ===");
  };

  // Call debug function when data changes
  useEffect(() => {
    debugWishlist();
  }, [wishlist, listings, loading, wishlistLoading]);

  const handleRemoveFromWishlist = async (listingId) => {
    await toggleWishlist(listingId, toast.showToast);
  };

  const handlePressListing = (listingId) => {
    navigation.navigate("ListingDetail", { id: listingId });
  };

  const handleBrowseProperties = () => {
    navigation.navigate("Explore");
  };

  // Not logged in state
  if (!user || !token) {
    return (
      <View style={styles.container}>
        <AppHeader title="Wishlist" />
        <View style={{ height: 90 }} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 20,
            paddingBottom: 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.notLoggedInContainer}>
            <View style={styles.notLoggedInIcon}>
              <Feather name="heart" size={64} color={COLORS.textMuted} />
            </View>
            <Text style={styles.notLoggedInTitle}>Save Your Favorites</Text>
            <Text style={styles.notLoggedInSubtitle}>
              Sign in to save properties you love and access them anytime.
              Create your personalized wishlist to keep track of your dream
              destinations.
            </Text>

            <View style={styles.authButtonsContainer}>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => navigation.navigate("Login")}
                activeOpacity={0.8}
              >
                <Text style={styles.loginButtonText}>Sign In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.signupButton}
                onPress={() => navigation.navigate("Register")}
                activeOpacity={0.8}
              >
                <Text style={styles.signupButtonText}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (loading || wishlistLoading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Wishlist" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your wishlist...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <AppHeader title="Wishlist" />
        <View style={styles.errorContainer}>
          <Feather name="wifi-off" size={48} color={COLORS.textMuted} />
          <Text style={styles.errorTitle}>Failed to load listings</Text>
          <Text style={styles.errorSubtitle}>
            Please check your internet connection and try again
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              setError(null);
              fetchListings();
            }}
            activeOpacity={0.8}
          >
            <Feather name="refresh-cw" size={20} color="#fff" />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Wishlist" />
      <View style={{ height: 90 }} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with count */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Your Wishlist</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerRefreshButton}
              onPress={onRefresh}
              activeOpacity={0.7}
              disabled={refreshing}
            >
              {refreshing ? (
                <ActivityIndicator size={18} color={COLORS.primary} />
              ) : (
                <Feather name="refresh-cw" size={18} color={COLORS.primary} />
              )}
            </TouchableOpacity>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {wishlistListings.length}{" "}
                {wishlistListings.length === 1 ? "item" : "items"}
              </Text>
            </View>
          </View>
        </View>

        {/* Empty State */}
        {wishlistListings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Feather name="heart" size={48} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
            <Text style={styles.emptySubtitle}>
              Save listings you love by clicking the heart icon
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={handleBrowseProperties}
              activeOpacity={0.8}
            >
              <Text style={styles.browseButtonText}>Browse Properties</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Wishlist Items */
          <View style={styles.listingsContainer}>
            {wishlistListings.map((listing) => (
              <WishlistItem
                key={listing._id}
                listing={listing}
                onRemove={handleRemoveFromWishlist}
                onPress={handlePressListing}
              />
            ))}
          </View>
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textMuted,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerRefreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
  },
  countBadge: {
    backgroundColor: COLORS.primary + "20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  countText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  browseButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  listingsContainer: {
    flex: 1,
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  notLoggedInIcon: {
    marginBottom: 24,
  },
  notLoggedInTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 12,
    textAlign: "center",
  },
  notLoggedInSubtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  authButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 20,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    flex: 0.48,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  signupButton: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    flex: 0.48,
    alignItems: "center",
  },
  signupButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 12,
    textAlign: "center",
  },
  errorSubtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 32,
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  refreshButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
