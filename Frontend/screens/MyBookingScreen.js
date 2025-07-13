import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
  Easing,
  Share,
} from "react-native";
import { COLORS } from "../constants/theme";
import { Feather } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { api } from "../constants/api";
import AppHeader from "../components/AppHeader";
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';
import useWishlist from "../hooks/useWishlist";
import LoginPromptModal from "../components/LoginPromptModal";


export default function MyBookingScreen({ navigation }) {
  const { user, token, loading: authLoading } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [cancellingBookings, setCancellingBookings] = useState(new Set());
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  const [imageErrorStates, setImageErrorStates] = useState({});
  const [error, setError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const cardImageSize = screenWidth < 400 ? 70 : 90;
  const badgeFontSize = screenWidth < 400 ? 11 : 12;
  const badgePadH = screenWidth < 400 ? 6 : 8;
  const badgePadV = screenWidth < 400 ? 3 : 4;
  const toast = useToast();
  const { wishlist, toggleWishlist } = useWishlist();

  const fetchBookings = useCallback(async () => {
    // Don't fetch if auth is still loading or user is not authenticated
    if (authLoading || !user || !token) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const response = await api.get("/api/user/my-listings");
      if (response.data.success) {
        setBookings(response.data.listings || []);
      }
    } catch (error) {
      if (
        error.response?.status !== 401 &&
        !error.message?.includes("No authentication token")
      ) {
        console.error("Error fetching bookings:", error);
        // Alert.alert("Error", "Failed to load bookings"); // Removed system alert
      } else if (
        error.response?.status === 401 ||
        error.message?.includes("No authentication token")
      ) {
        // Only log to console, do not show alert
        console.error("Error fetching bookings:", error);
      }
      // Set error state for failed fetch
      setError("Failed to load bookings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authLoading, user, token]);

  // Initial data fetch
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Auto-refresh when screen comes into focus
  useEffect(() => {
    if (!navigation) return; // Safety check

    const unsubscribe = navigation.addListener("focus", () => {
      // Smooth fade out
      Animated.timing(fadeAnim, {
        toValue: 0.7,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        // Refresh data
        fetchBookings();
        // Smooth fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    });

    return unsubscribe;
  }, [navigation, fetchBookings, fadeAnim]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleImageLoadStart = (bookingId) => {
    setImageLoadingStates(prev => ({ ...prev, [bookingId]: true }));
  };

  const handleImageLoadEnd = (bookingId) => {
    setImageLoadingStates(prev => ({ ...prev, [bookingId]: false }));
  };

  const handleImageError = (bookingId) => {
    setImageErrorStates(prev => ({ ...prev, [bookingId]: true }));
    setImageLoadingStates(prev => ({ ...prev, [bookingId]: false }));
  };

  const showCancelConfirmation = (booking) => {
    setBookingToCancel(booking);
    setShowCancelModal(true);
  };

  const handleCancelBooking = useCallback(
    async (bookingId) => {
      // Immediately add to cancelling set for instant UI removal
      setCancellingBookings((prev) => new Set([...prev, bookingId]));

      try {
        const response = await api.post("/api/user/cancel-booking", {
          bookingId,
        });
        if (response.data.success) {
          // Remove from bookings state
          setBookings((prev) =>
            prev.filter((booking) => booking._id !== bookingId),
          );

          // Remove from cancelling set
          setCancellingBookings((prev) => {
            const newSet = new Set(prev);
            newSet.delete(bookingId);
            return newSet;
          });

          // Smooth fade animation
          Animated.timing(fadeAnim, {
            toValue: 0.8,
            duration: 150,
            useNativeDriver: true,
          }).start(() => {
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }).start();
          });

          toast.showToast("Booking cancelled successfully!", "success");
        } else {
          const errorMessage = response.data.message || "Failed to cancel booking";
          toast.showToast(errorMessage, "error");
        }
      } catch (error) {
        console.error("Error cancelling booking:", error);
        const errorMessage = error.response?.data?.message || "Failed to cancel booking";

        // Remove from bookings state even if error
        setBookings((prev) =>
          prev.filter((booking) => booking._id !== bookingId),
        );

        // Remove from cancelling set
        setCancellingBookings((prev) => {
          const newSet = new Set(prev);
          newSet.delete(bookingId);
          return newSet;
        });

        toast.showToast(errorMessage, "error");
      }
    },
    [token, fadeAnim, toast],
  );

  const confirmCancelBooking = () => {
    if (bookingToCancel) {
      handleCancelBooking(bookingToCancel._id);
      setShowCancelModal(false);
      setBookingToCancel(null);
    }
  };

  const now = new Date();
  const activeBookings = bookings
    .filter(
      (booking) =>
        booking.status !== "cancelled" &&
        booking.status !== "rejected" &&
        booking.status !== "paused" &&
        !cancellingBookings.has(booking._id) &&
        new Date(booking.endDate) >= now // Only future or ongoing bookings
    )
    .sort((a, b) => {
      // Sort by creation date, newest first
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  // Get cancelled bookings for display, sorted by creation date (newest first)
  const cancelledBookings = bookings
    .filter((booking) => booking.status === "cancelled")
    .sort((a, b) => {
      // Sort by creation date, newest first (new to old)
      // If creation dates are the same, sort by check-in date
      const aCreated = new Date(a.createdAt);
      const bCreated = new Date(b.createdAt);

      if (aCreated.getTime() === bCreated.getTime()) {
        return new Date(b.startDate) - new Date(a.startDate);
      }

      return bCreated - aCreated;
    });

  // Completed bookings: status 'approved' or 'confirmed' and checkOut date/time in the past
  const completedBookings = bookings
    .filter(
      (booking) =>
        (booking.status === 'approved' || booking.status === 'confirmed') &&
        new Date(booking.endDate) < now
    )
    .sort((a, b) => new Date(b.endDate) - new Date(a.endDate));

  // Debug: Log the sorting order for cancelled bookings
  useEffect(() => {
    if (cancelledBookings.length > 0) {
      console.log("Cancelled bookings sorted order (newest first):");
      cancelledBookings.forEach((booking, index) => {
        console.log(
          `${index + 1}. ${booking.listing?.title} - Created: ${new Date(booking.createdAt).toLocaleDateString()}`,
        );
      });
    }
  }, [cancelledBookings]);

  // Debug: Log all booking statuses
  useEffect(() => {
    console.log(
      "All booking statuses:",
      bookings.map((b) => b.status),
    );
    console.log("Active bookings count:", activeBookings.length);
    console.log("Cancelled bookings count:", cancelledBookings.length);
    console.log("Completed bookings count:", completedBookings.length);
    
    // Debug: Log details of the approved booking
    const approvedBooking = bookings.find(b => b.status === 'approved');
    if (approvedBooking) {
      console.log("Approved booking details:", {
        id: approvedBooking._id,
        status: approvedBooking.status,
        endDate: approvedBooking.endDate,
        endDateType: typeof approvedBooking.endDate,
        isPast: new Date(approvedBooking.endDate) < new Date(),
        now: new Date().toISOString()
      });
    }
  }, [bookings, activeBookings, cancelledBookings, completedBookings]);

  const calculateStats = () => {
    const totalSpent = completedBookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);

    const upcomingTrips = activeBookings.filter(
      (booking) => new Date(booking.startDate) > new Date(),
    ).length;

    return { totalSpent, upcomingTrips };
  };

  const { totalSpent, upcomingTrips } = calculateStats();

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return { bg: "#dcfce7", text: "#166534" };
      case "approved":
        return { bg: "#dbeafe", text: "#1e40af" };
      case "cancelled":
        return { bg: "#fee2e2", text: "#dc2626" };
      case "rejected":
        return { bg: "#f3e8ff", text: "#7c3aed" };
      default:
        return { bg: "#fef3c7", text: "#d97706" };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const calculateNights = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  };

  // Check if user is authenticated
  if (authLoading) {
    return (
      <View style={styles.container}>
        <AppHeader title="My Bookings" />
        <View style={{ height: 90 }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!user || !token) {
    return (
      <View style={styles.container}>
        <AppHeader title="My Bookings" />
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
              <Feather name="calendar" size={64} color={COLORS.textMuted} />
            </View>
            <Text style={styles.notLoggedInTitle}>Manage Your Bookings</Text>
            <Text style={styles.notLoggedInSubtitle}>
              Sign in to view and manage all your property bookings. Track your
              upcoming trips, view booking history, and manage your reservations
              in one place.
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your bookings...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <AppHeader title="My Bookings" />
        <View style={{ height: 90 }} />
        <View style={styles.errorContainer}>
          <Feather name="wifi-off" size={48} color={COLORS.textMuted} />
          <Text style={styles.errorTitle}>Failed to load bookings</Text>
          <Text style={styles.errorSubtitle}>
            Please check your internet connection and try again
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              setError(null);
              fetchBookings();
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

  // Add share handler
  const handleShare = (booking) => {
    const listing = booking.listing;
    if (!listing) return;
    const url = `https://stayfindz.com/listing/${listing._id}`;
    Share.share({
      message: `Check out this stay: ${listing.title} in ${listing.location}\n${url}`,
      url,
      title: listing.title,
    });
  };

  // Login prompt handlers
  const handleLoginPrompt = () => {
    navigation.navigate('Login');
  };

  const handleLater = () => {
    // User chose to continue browsing without logging in
    // No action needed, just close the modal
  };

  return (
    <View style={styles.container} key={`bookings-${bookings.length}`}>
      <AppHeader title="My Bookings" />
      <View style={{ height: 90 }} />

      <View style={{ flex: 1 }}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Welcome Header */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>
              Welcome back, {user?.name || "User"}!
            </Text>
            <Text style={styles.welcomeSubtitle}>
              Manage your bookings and account
            </Text>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Feather name="calendar" size={20} color="#3b82f6" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Total Bookings</Text>
                <Text style={styles.statValue}>{activeBookings.length + completedBookings.length}</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: "#dcfce7" },
                ]}
              >
                <Feather name="credit-card" size={20} color="#16a34a" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Total Spent</Text>
                <Text style={[styles.statValue, { color: "#16a34a" }]}>
                  ${totalSpent.toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: "#f3e8ff" },
                ]}
              >
                <Feather name="trending-up" size={20} color="#7c3aed" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Upcoming Trips</Text>
                <Text style={[styles.statValue, { color: "#7c3aed" }]}>
                  {upcomingTrips}
                </Text>
              </View>
            </View>
          </View>

          {/* Bookings List */}
          <View style={styles.bookingsContainer}>
            <View style={styles.bookingsHeader}>
              <View style={styles.bookingsTitleContainer}>
                <Feather name="home" size={20} color={COLORS.primary} />
                <Text style={styles.bookingsTitle}>Your Bookings</Text>
              </View>
            </View>

            {activeBookings.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Feather name="calendar" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>No bookings yet!</Text>
                <TouchableOpacity
                  style={styles.browseButton}
                  onPress={() => {
                    // Navigate to Home tab with smooth animation
                    if (navigation.getParent()) {
                      const parentNav = navigation.getParent();
                      if (parentNav.navigate) {
                        parentNav.navigate("Home");
                      }
                    } else {
                      navigation.navigate("Home");
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.browseButtonText}>Go Home</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View
                style={styles.bookingsList}
                key={`bookings-${bookings.length}`}
              >
                {activeBookings.map((booking) => {
                  const nights = calculateNights(
                    booking.startDate,
                    booking.endDate,
                  );
                  const statusColors = getStatusColor(booking.status);
                  const isImageLoading = imageLoadingStates[booking._id] !== false;
                  const isImageError = imageErrorStates[booking._id] === true;

                  return (
                    <TouchableOpacity
                      key={booking._id}
                      style={styles.bookingCard}
                      activeOpacity={0.85}
                      onPress={() => {
                        if (booking.listing?._id) {
                          navigation.navigate('ListingDetail', { id: booking.listing._id });
                        }
                      }}
                    >
                      {/* Image Section */}
                      <View style={styles.bookingImageContainer}>
                        {/* Share Button - top left */}
                        <TouchableOpacity
                          onPress={() => handleShare(booking)}
                          style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, padding: 6, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.primary + '22' }}
                          activeOpacity={0.8}
                        >
                          <Feather name="share-2" size={18} color={COLORS.primary} />
                        </TouchableOpacity>
                        {/* Wishlist Button - top right */}
                        <TouchableOpacity
                          onPress={() => toggleWishlist(booking.listing?._id, true, () => setShowLoginPrompt(true))}
                          style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, padding: 6, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.primary + '22' }}
                          activeOpacity={0.8}
                        >
                          <Feather name="heart" size={18} color={wishlist.includes(booking.listing?._id) ? COLORS.primary : COLORS.textMuted} />
                        </TouchableOpacity>
                        {!isImageError && (
                          <Image
                            source={{ uri: booking.listing?.images?.[0] || "https://via.placeholder.com/300x200?text=Property" }}
                            style={styles.bookingImage}
                            resizeMode="cover"
                            onLoadStart={() => handleImageLoadStart(booking._id)}
                            onLoadEnd={() => handleImageLoadEnd(booking._id)}
                            onError={() => handleImageError(booking._id)}
                          />
                        )}
                        {(isImageLoading || isImageError) && (
                          <View style={[styles.bookingImage, styles.placeholderContainer]}>
                            <Feather name="image" size={32} color={COLORS.primary} />
                          </View>
                        )}
                      </View>

                      {/* Content Section */}
                      <View style={styles.bookingContent}>
                        <View style={styles.bookingHeader}>
                          <View style={styles.bookingTitleContainer}>
                            <Text style={styles.bookingTitle} numberOfLines={1}>
                              {booking.listing?.title || "Property"}
                            </Text>
                            <View style={styles.locationContainer}>
                              <Feather
                                name="map-pin"
                                size={14}
                                color={COLORS.textMuted}
                              />
                              <Text
                                style={styles.locationText}
                                numberOfLines={1}
                              >
                                {booking.listing?.location || "Location"}
                              </Text>
                            </View>
                          </View>
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: statusColors.bg },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusText,
                                { color: statusColors.text },
                              ]}
                            >
                              {booking.status?.charAt(0).toUpperCase() +
                                booking.status?.slice(1)}
                            </Text>
                          </View>
                        </View>

                        {/* Booking Details */}
                        <View style={styles.bookingDetails}>
                          <View style={styles.detailRow}>
                            <View style={styles.detailItem}>
                              <Feather
                                name="calendar"
                                size={16}
                                color={COLORS.textMuted}
                              />
                              <View>
                                <Text style={styles.detailLabel}>Check-in</Text>
                                <Text style={styles.detailValue}>
                                  {formatDate(booking.startDate)}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.detailItem}>
                              <Feather
                                name="calendar"
                                size={16}
                                color={COLORS.textMuted}
                              />
                              <View>
                                <Text style={styles.detailLabel}>
                                  Check-out
                                </Text>
                                <Text style={styles.detailValue}>
                                  {formatDate(booking.endDate)}
                                </Text>
                              </View>
                            </View>
                          </View>

                          <View style={styles.detailRow}>
                            <View style={styles.detailItem}>
                              <Feather
                                name="users"
                                size={16}
                                color={COLORS.textMuted}
                              />
                              <View>
                                <Text style={styles.detailLabel}>Guests</Text>
                                <Text style={styles.detailValue}>
                                  {booking.adults || 1}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.detailItem}>
                              <Feather
                                name="dollar-sign"
                                size={16}
                                color={COLORS.textMuted}
                              />
                              <View>
                                <Text style={styles.detailLabel}>Total</Text>
                                <Text style={styles.detailValue}>
                                  ${booking.totalPrice || 0}
                                </Text>
                              </View>
                            </View>
                          </View>

                          <Text style={styles.nightsText}>
                            {nights} night{nights !== 1 ? "s" : ""} stay
                          </Text>
                          {booking.createdAt && (
                            <Text style={styles.bookingDate}>
                              Booking Date: {formatDate(booking.createdAt)}
                            </Text>
                          )}
                        </View>

                        {/* Cancel Button */}
                        {(booking.status === "approved" ||
                          booking.status === "pending" ||
                          booking.status === "confirmed") && (
                          <TouchableOpacity
                            style={[
                              styles.cancelButton,
                              booking.status === "confirmed" &&
                                styles.cancelButtonConfirmed,
                            ]}
                            onPress={() => showCancelConfirmation(booking)}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.cancelButtonText,
                                booking.status === "confirmed" &&
                                  styles.cancelButtonTextConfirmed,
                              ]}
                            >
                              {booking.status === "confirmed"
                                ? "Cancel Booking"
                                : booking.status === "approved"
                                  ? "Cancel"
                                  : "Cancel Request"}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          <View style={{ height: 28 }} />
          {/* Previous Bookings Section (now above Deleted Bookings, styled like deleted but green) */}
          {completedBookings.length > 0 && (
            <View style={[styles.bookingsContainer, { marginTop: 28 }]}> 
              <View style={styles.bookingsHeader}>
                <View style={styles.bookingsTitleContainer}>
                  <Feather name="clock" size={20} color="#16a34a" />
                  <Text style={styles.bookingsTitle}>Previous Bookings</Text>
                </View>
              </View>
              <View style={styles.bookingsList}>
                {completedBookings.slice(0, 3).map((booking) => (
                  <View key={booking._id} style={[
                    styles.bookingCard,
                    {
                      flexDirection: 'row',
                      backgroundColor: '#dcfce7', // green bg
                      borderWidth: 2,
                      borderColor: '#16a34a', // green border
                      opacity: 1,
                      padding: 0,
                      marginBottom: 14,
                      minHeight: cardImageSize + 14,
                    },
                  ]}> 
                    <Image
                      source={{ uri: booking.listing?.images?.[0] || 'https://via.placeholder.com/300x200?text=Property' }}
                      style={{ width: cardImageSize, height: cardImageSize, borderRadius: 12, backgroundColor: '#eee', margin: screenWidth < 400 ? 7 : 10 }}
                      resizeMode="cover"
                    />
                    <View style={{ flex: 1, padding: screenWidth < 400 ? 7 : 10, justifyContent: 'space-between' }}>
                      <View>
                        <Text style={{ fontWeight: 'bold', fontSize: 15, color: '#166534', marginBottom: 2 }} numberOfLines={1}>{booking.listing?.title || 'Property'}</Text>
                        <Text style={{ color: '#166534', fontSize: 13 }} numberOfLines={1}>{booking.listing?.location || 'Location'}</Text>
                        <Text style={{ color: '#166534', fontSize: 13, marginTop: 2 }}>Check-in: {formatDate(booking.startDate)}</Text>
                        <Text style={{ color: '#166534', fontSize: 13 }}>Check-out: {formatDate(booking.endDate)}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-end', marginTop: 6 }}>
                        <View style={{
                          backgroundColor: '#16a34a',
                          borderRadius: 10,
                          paddingHorizontal: badgePadH + 4,
                          paddingVertical: badgePadV + 2,
                          minWidth: 80 * (screenWidth / 375),
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: '#16a34a',
                          shadowOpacity: 0.15,
                          shadowRadius: 6,
                          shadowOffset: { width: 0, height: 2 },
                          elevation: 2,
                        }}>
                          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: badgeFontSize + 2, letterSpacing: 1 }}>COMPLETED</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Cancelled Bookings Section (now below previous bookings) */}
          {cancelledBookings.length > 0 && (
            <View style={[styles.bookingsContainer, { marginTop: 28 }]}> 
              <View style={styles.bookingsHeader}>
                <View style={styles.bookingsTitleContainer}>
                  <Feather name="trash-2" size={20} color={COLORS.textMuted} />
                  <Text style={styles.bookingsTitle}>Deleted Bookings</Text>
                </View>
              </View>
              <View style={styles.bookingsList}>
                {cancelledBookings.slice(0, 3).map((booking) => (
                  <View key={booking._id} style={[
                    styles.bookingCard,
                    {
                      flexDirection: 'row',
                      backgroundColor: '#fee2e2',
                      borderWidth: 2,
                      borderColor: '#dc2626',
                      opacity: 1,
                      padding: 0,
                      marginBottom: 14,
                      minHeight: cardImageSize + 14,
                    },
                  ]}> 
                    <Image
                      source={{ uri: booking.listing?.images?.[0] || 'https://via.placeholder.com/300x200?text=Property' }}
                      style={{ width: cardImageSize, height: cardImageSize, borderRadius: 12, backgroundColor: '#eee', margin: screenWidth < 400 ? 7 : 10 }}
                      resizeMode="cover"
                    />
                    <View style={{ flex: 1, padding: screenWidth < 400 ? 7 : 10, justifyContent: 'space-between' }}>
                      <View>
                        <Text style={{ fontWeight: 'bold', fontSize: 15, color: '#991b1b', marginBottom: 2 }} numberOfLines={1}>{booking.listing?.title || 'Property'}</Text>
                        <Text style={{ color: '#991b1b', fontSize: 13 }} numberOfLines={1}>{booking.listing?.location || 'Location'}</Text>
                        <Text style={{ color: '#991b1b', fontSize: 13, marginTop: 2 }}>Check-in: {formatDate(booking.startDate)}</Text>
                        <Text style={{ color: '#991b1b', fontSize: 13 }}>Check-out: {formatDate(booking.endDate)}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-end', marginTop: 6 }}>
                        <View style={{
                          backgroundColor: '#dc2626',
                          borderRadius: 10,
                          paddingHorizontal: badgePadH + 4,
                          paddingVertical: badgePadV + 2,
                          minWidth: 80 * (screenWidth / 375),
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: '#dc2626',
                          shadowOpacity: 0.15,
                          shadowRadius: 6,
                          shadowOffset: { width: 0, height: 2 },
                          elevation: 2,
                        }}>
                          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: badgeFontSize + 2, letterSpacing: 1 }}>CANCELLED</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Cancel Booking Confirmation Modal */}
      <ConfirmationModal
        visible={showCancelModal}
        title="Cancel Booking"
        message={`Are you sure you want to cancel your booking for "${bookingToCancel?.listing?.title || 'this property'}"?`}
        confirmText="Cancel Booking"
        cancelText="Keep Booking"
        onConfirm={confirmCancelBooking}
        onCancel={() => {
          setShowCancelModal(false);
          setBookingToCancel(null);
        }}
        icon="x-circle"
      />
      
      <LoginPromptModal
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onLogin={handleLoginPrompt}
        onLater={handleLater}
      />
    </View>
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
  welcomeSection: {
    padding: 20,
    paddingBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "500",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
  },
  bookingsContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 0,
  },
  bookingsHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  bookingsTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bookingsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: 12,
    marginBottom: 20,
  },
  browseButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bookingsList: {
    padding: 20,
  },
  bookingCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  bookingImageContainer: {
    position: "relative",
    width: "100%",
    height: 200,
  },
  bookingImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.border,
  },
  placeholderContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  bookingContent: {
    padding: 16,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  bookingTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  bookingDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
  },
  nightsText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonConfirmed: {
    backgroundColor: "#fee2e2",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  cancelButtonTextConfirmed: {
    color: "#dc2626",
  },
  moreBookingsContainer: {
    padding: 20,
    alignItems: "center",
  },
  moreBookingsText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  bookingDate: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 2,
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
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 12,
  },
  errorSubtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginBottom: 40,
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  refreshButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
