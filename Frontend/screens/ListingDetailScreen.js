import React, { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Modal,
  FlatList,
  Platform,
  Share,
} from "react-native";
import { BlurView } from "expo-blur";
import { COLORS } from "../constants/theme";
import { Feather } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { api } from "../constants/api";
import AppHeader from "../components/AppHeader";
import useWishlist from "../hooks/useWishlist";
import { Animated } from "react-native";
import CustomDatePickerModal from "../components/CustomDatePickerModal";
import { useToast } from '../context/ToastContext';
import LoginPromptModal from '../components/LoginPromptModal';

const { width } = Dimensions.get("window");

export default function ListingDetailScreen({ navigation, route }) {
  const { id } = route.params;
  const { user, token } = useContext(AuthContext);
  const { toggleWishlist, wishlist } = useWishlist();
  const toast = useToast();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [guests, setGuests] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState("checkIn");
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [tempGuests, setTempGuests] = useState(guests);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [showHostContact, setShowHostContact] = useState(false);
  const [imageLoading, setImageLoading] = useState([]);
  const pulseAnims = useRef([]);
  const [showBookingSheetContent, setShowBookingSheetContent] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    fetchListing();
  }, [id]);

  useEffect(() => {
    // Reset image loading state and pulse anims when images change
    if (listing && listing.images) {
      setImageLoading(Array(listing.images.length).fill(true));
      pulseAnims.current = listing.images.map(() => new Animated.Value(1));
    }
  }, [listing]);

  useEffect(() => {
    // Start pulse animation for all loading images
    imageLoading.forEach((isLoading, idx) => {
      if (isLoading && pulseAnims.current[idx]) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnims.current[idx], {
              toValue: 1.15,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnims.current[idx], {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        ).start();
      } else if (pulseAnims.current[idx]) {
        pulseAnims.current[idx].setValue(1);
      }
    });
  }, [imageLoading]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleShare} style={{ marginRight: 18 }}>
          <Feather name="share-2" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, listing]);

  const fetchListing = async () => {
    try {
      const response = await api.get(`/api/listings/${id}`);
      setListing(response.data.listing);
    } catch (error) {
      console.error("Error fetching listing:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!checkIn || !checkOut) {
      toast.showToast("Please select check-in and check-out dates", "error");
      return;
    }

    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    setBookingLoading(true);
    try {
      const response = await api.post(
        "/api/bookings",
        {
          propertyId: listing._id,
          propertyTitle: listing.title,
          checkIn,
          checkOut,
          amountPaid: calculateTotal(),
          guestName: user?.name || "Guest",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        toast.showToast("Booking created successfully!", "success");
        // Close the booking modal with smooth animation
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowBookingModal(false);
          // Navigate to MyBookings after a short delay for smooth transition
          setTimeout(() => {
            navigation.navigate("Bookings");
          }, 100);
        });
      }
    } catch (error) {
      console.error("Error booking listing:", error);
      const errorMessage = error.response?.data?.message || "Failed to create booking";
      toast.showToast(errorMessage, "error");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleDisabledButtonClick = () => {
    if (!checkIn || !checkOut) {
      return;
    }
  };

  const selectDate = (type) => {
    setDatePickerType(type);
    setShowDatePicker(true);
  };

  const setDate = (type, date) => {
    if (type === "checkIn") {
      setCheckIn(date);
      // If check-out is before check-in, update it
      if (checkOut && date >= checkOut) {
        const newCheckOut = new Date(date);
        newCheckOut.setDate(newCheckOut.getDate() + 1);
        setCheckOut(newCheckOut);
      }
    } else {
      // Ensure check-out is after check-in
      if (checkIn && date <= checkIn) {
        return;
      }
      setCheckOut(date);
    }
    setShowDatePicker(false);
  };

  const selectGuests = () => {
    setShowGuestPicker(true);
  };

  const generateDateOptions = () => {
    const options = [];
    const today = new Date();

    // Quick options
    options.push({
      id: "today",
      label: "Today",
      date: today,
      subtitle: today.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    options.push({
      id: "tomorrow",
      label: "Tomorrow",
      date: tomorrow,
      subtitle: tomorrow.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    });

    // Next 30 days
    for (let i = 2; i <= 30; i++) {
      const customDate = new Date();
      customDate.setDate(customDate.getDate() + i);
      options.push({
        id: `day${i}`,
        label: customDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          weekday: "short",
        }),
        date: customDate,
        subtitle: customDate.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        }),
      });
    }

    return options;
  };

  const generateGuestOptions = () => {
    const options = [];
    const maxGuests = listing?.guests || 10;

    for (let i = 1; i <= maxGuests; i++) {
      options.push({
        id: i,
        label: `${i} guest${i !== 1 ? "s" : ""}`,
        value: i,
      });
    }

    return options;
  };

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const diffTime = new Date(checkOut) - new Date(checkIn);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    const nights = calculateNights();
    const basePrice = listing.price * nights;
    const serviceFee = 85;
    return basePrice + serviceFee;
  };

  const formatDateDisplay = (date) => {
    if (!date) return "Select date";

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        weekday: "short",
      });
    }
  };

  const isInWishlist = listing ? wishlist.includes(listing._id) : false;

  const openBooking = () => {
    setShowBookingModal(true);
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      if (Platform.OS === 'android') {
        setShowBookingSheetContent(false);
        setTimeout(() => setShowBookingSheetContent(true), 80);
      } else {
        setShowBookingSheetContent(true);
      }
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    });
  };

  const closeBooking = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowBookingSheetContent(false);
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        setShowBookingModal(false);
      });
    });
  };

  // Add share handler
  const handleShare = () => {
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading listing details...</Text>
      </View>
    );
  }

  if (!listing && !loading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Listing Details" />
        <View style={styles.errorContainer}>
          <Feather name="wifi-off" size={48} color={COLORS.textMuted} />
          <Text style={styles.errorTitle}>Failed to load listing details</Text>
          <Text style={styles.errorSubtitle}>
            Please check your internet connection and try again
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              setLoading(true);
              fetchListing();
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

  // Use hostId as the host object (populated from backend)
  const hostData = listing.hostId;

  function formatHostDuration(sinceDate) {
    if (!sinceDate) return '';
    const now = new Date();
    const since = new Date(sinceDate);
    const diffMs = now - since;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 100) return `${diffDays} days`;
    const diffMonths = Math.floor(diffDays / 30.44);
    if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    return `${years} year${years > 1 ? 's' : ''}${months > 0 ? ` ${months} month${months > 1 ? 's' : ''}` : ''}`;
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Listing Details" />
      <View style={{ height: 90 }} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 }]}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>{listing.title}</Text>
          <View style={styles.headerRow}>
            <View style={styles.ratingLocationRow}>
              <View style={styles.ratingContainer}>
                <Feather name="star" size={16} color="#ff385c" />
                <Text style={styles.ratingText}>{listing.rating}</Text>
                <Text style={styles.reviewCount}>
                  ({listing.reviewCount} reviews)
                </Text>
              </View>
              <View style={styles.locationContainer}>
                <Feather name="map-pin" size={16} color={COLORS.textMuted} />
                <Text style={styles.locationText}>{listing.location}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                style={styles.wishlistButton}
                onPress={() => toggleWishlist(listing._id, true, () => setShowLoginPrompt(true))}
                activeOpacity={0.8}
              >
                <Feather
                  name="heart"
                  size={20}
                  color={isInWishlist ? "#ff385c" : COLORS.textMuted}
                  fill={isInWishlist ? "#ff385c" : "none"}
                />
                <Text
                  style={[
                    styles.wishlistText,
                    isInWishlist && styles.wishlistTextActive,
                  ]}
                >
                  {isInWishlist ? "Saved" : "Save"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShare}
                style={{ marginLeft: 8, padding: 6, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.primary + '22' }}
                activeOpacity={0.8}
              >
                <Feather name="share-2" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Image Carousel */}
        <View style={styles.carouselContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / width,
              );
              setCurrentImageIndex(index);
            }}
          >
            {listing.images?.map((imageUrl, index) => (
              <View key={index} style={{ position: 'relative', width: width, aspectRatio: 16/9, overflow: 'hidden', borderRadius: 16, backgroundColor: '#f3f4f6' }}>
                {imageLoading[index] && (
                  <Animated.View
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: '100%',
                      height: '100%',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f3f4f6',
                      zIndex: 2,
                      transform: [{ scale: pulseAnims.current[index] || 1 }],
                      borderRadius: 16,
                    }}
                  >
                    <Feather name="image" size={48} color={COLORS.primary} />
                  </Animated.View>
                )}
                <Image
                  source={{ uri: imageUrl }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                  onLoadEnd={() => {
                    setImageLoading((prev) => {
                      const next = [...prev];
                      next[index] = false;
                      return next;
                    });
                  }}
                />
              </View>
            ))}
          </ScrollView>
          {listing.images?.length > 1 && (
            <View style={styles.pagination}>
              {listing.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === currentImageIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* About this property section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>About this property</Text>
          <Text style={styles.description}>{listing.description}</Text>

          <View style={styles.highlightsGrid}>
            <View style={styles.highlightItem}>
              <Feather name="users" size={20} color={COLORS.primary} />
              <View>
                <Text style={styles.highlightLabel}>Guests</Text>
                <Text style={styles.highlightValue}>{listing.guests}</Text>
              </View>
            </View>
            <View style={styles.highlightItem}>
              <Feather name="home" size={20} color={COLORS.primary} />
              <View>
                <Text style={styles.highlightLabel}>Bedrooms</Text>
                <Text style={styles.highlightValue}>{listing.bedrooms}</Text>
              </View>
            </View>
            <View style={styles.highlightItem}>
              <Feather name="droplet" size={20} color={COLORS.primary} />
              <View>
                <Text style={styles.highlightLabel}>Bathrooms</Text>
                <Text style={styles.highlightValue}>{listing.bathrooms}</Text>
              </View>
            </View>
            <View style={styles.highlightItem}>
              <Feather name="image" size={20} color={COLORS.primary} />
              <View>
                <Text style={styles.highlightLabel}>View</Text>
                <Text style={styles.highlightValue}>Ocean</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Host Info section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>About your host</Text>
          {hostData ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ position: 'relative' }}>
                  <Image
                    source={{ uri: hostData.profileImage || 'https://randomuser.me/api/portraits/men/32.jpg' }}
                    style={{ width: 56, height: 56, borderRadius: 28 }}
                  />
                  <View style={{
                    position: 'absolute',
                    right: -8,
                    bottom: -8,
                    backgroundColor: '#fff',
                    borderRadius: 16,
                    padding: 4,
                    borderWidth: 1,
                    borderColor: '#eee',
                    shadowColor: '#000',
                    shadowOpacity: 0.06,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 2,
                  }}>
                    <Feather name="user" size={18} color={COLORS.primary} />
                  </View>
                </View>
                <View style={{ marginLeft: 16, flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.text }}>{hostData.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                    <Text style={{ color: COLORS.textMuted, fontWeight: '600', marginRight: 6 }}>Hosting since</Text>
                    <Feather name="calendar" size={18} color={COLORS.primary} style={{ marginRight: 4 }} />
                    <Text style={{ color: COLORS.primary, fontWeight: '600', fontSize: 16 }}>
                      {hostData.createdAt ? new Date(hostData.createdAt).toLocaleString('en-US', { month: 'long', year: 'numeric' }) : '--'}
                    </Text>
                    <Text style={{ color: COLORS.text, fontWeight: '600', fontSize: 16, marginLeft: 8 }}>
                      • {hostData.createdAt ? formatHostDuration(hostData.createdAt) : ''}
                    </Text>
                  </View>
                </View>
              </View>
              {!showHostContact ? (
                <TouchableOpacity
                  style={{
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                    borderRadius: 12,
                    paddingVertical: 14,
                    paddingHorizontal: 18,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 8,
                    backgroundColor: '#f9fafb',
                  }}
                  onPress={() => setShowHostContact(true)}
                  activeOpacity={0.85}
                >
                  <Feather name="phone" size={20} color={COLORS.textMuted} style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 16, color: COLORS.textMuted, fontWeight: '600' }}>Show contact info</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ marginTop: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Feather name="phone" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 16, color: COLORS.primary, fontWeight: '600' }}>{hostData.phone}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Feather name="mail" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 16, color: COLORS.primary, fontWeight: '600' }}>{hostData.email}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowHostContact(false)} style={{ marginTop: 6, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center', backgroundColor: '#f9fafb' }}>
                    <Text style={{ color: COLORS.textMuted, fontWeight: '600', fontSize: 15 }}>Hide contact info</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <Text style={{ color: COLORS.textMuted }}>Loading host info...</Text>
          )}
        </View>

        {/* Amenities section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {listing.amenities?.wifi && (
              <View style={styles.amenityItem}>
                <Feather name="wifi" size={18} color={COLORS.primary} />
                <Text style={styles.amenityText}>High-speed WiFi</Text>
              </View>
            )}
            {listing.amenities?.kitchen && (
              <View style={styles.amenityItem}>
                <Feather name="coffee" size={18} color={COLORS.primary} />
                <Text style={styles.amenityText}>Fully equipped kitchen</Text>
              </View>
            )}
            {listing.amenities?.parking && (
              <View style={styles.amenityItem}>
                <Feather name="map-pin" size={18} color={COLORS.primary} />
                <Text style={styles.amenityText}>Free parking</Text>
              </View>
            )}
            {listing.amenities?.tv && (
              <View style={styles.amenityItem}>
                <Feather name="tv" size={18} color={COLORS.primary} />
                <Text style={styles.amenityText}>Smart TV</Text>
              </View>
            )}
            {listing.amenities?.fireplace && (
              <View style={styles.amenityItem}>
                <Feather name="zap" size={18} color={COLORS.primary} />
                <Text style={styles.amenityText}>Fireplace</Text>
              </View>
            )}
            {listing.amenities?.bbq && (
              <View style={styles.amenityItem}>
                <Feather name="sun" size={18} color={COLORS.primary} />
                <Text style={styles.amenityText}>BBQ grill</Text>
              </View>
            )}
          </View>
        </View>

        {/* House Rules section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>House Rules</Text>
          <View style={styles.rulesContainer}>
            <View style={styles.ruleItem}>
              <Feather name="clock" size={18} color={COLORS.primary} />
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>Check-in/Check-out</Text>
                <Text style={styles.ruleText}>
                  {listing.houseRules?.checkInTime} /{" "}
                  {listing.houseRules?.checkOutTime}
                </Text>
              </View>
            </View>
            <View style={styles.ruleItem}>
              <Feather
                name={listing.houseRules?.smoking ? "x" : "x-circle"}
                size={18}
                color={COLORS.primary}
              />
              <Text style={styles.ruleText}>
                {listing.houseRules?.smoking ? "Smoking allowed" : "No smoking"}
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Feather
                name={listing.houseRules?.pets ? "heart" : "x-circle"}
                size={18}
                color={COLORS.primary}
              />
              <Text style={styles.ruleText}>
                {listing.houseRules?.pets ? "Pets allowed" : "No pets"}
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Feather
                name={listing.houseRules?.parties ? "users" : "x-circle"}
                size={18}
                color={COLORS.primary}
              />
              <Text style={styles.ruleText}>
                {listing.houseRules?.parties
                  ? "Parties allowed"
                  : "No parties/events"}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Nail Bar */}
      <View style={[nailBarStyles.nailBar, { paddingHorizontal: 10, paddingVertical: 12 }]}> 
        {/* Left: Price row and date range stacked */}
        <View style={{ flex: 1, flexDirection: 'column', minWidth: 0, justifyContent: 'center' }}>
          {/* Price row: price and /per night in a row */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
            <Text style={nailBarStyles.price}>£{listing.price}</Text>
            <Text style={nailBarStyles.perNightBottom}>/per night</Text>
          </View>
          {/* Date Range Box under price row */}
          <View style={{
            marginTop: 6,
            borderWidth: 1,
            borderColor: '#e5e7eb',
            borderRadius: 10,
            paddingVertical: 5,
            paddingHorizontal: 8,
            backgroundColor: '#f9fafb',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 30,
            minWidth: 0,
            maxWidth: 120,
            alignSelf: 'flex-start',
          }}>
            <Text style={{ color: '#374151', fontSize: 13 }} numberOfLines={1} ellipsizeMode="tail">
              {checkIn && checkOut
                ? `${formatDateDisplay(new Date(checkIn))} – ${formatDateDisplay(new Date(checkOut))}`
                : 'Select dates'}
            </Text>
          </View>
        </View>
        {/* Reserve Button */}
        <TouchableOpacity
          style={[
            nailBarStyles.reserveBtn,
            { marginLeft: 0, marginRight: 0, minWidth: 110, paddingHorizontal: 22, alignSelf: 'center' },
          ]}
          onPress={openBooking}
          activeOpacity={0.9}
        >
          <Text style={nailBarStyles.reserveBtnText}>Reserve</Text>
        </TouchableOpacity>
      </View>

      {/* Booking Modal/Bottom Sheet */}
      <Modal
        visible={showBookingModal}
        transparent
        animationType="none"
        onShow={() => {}}
      >
        {Platform.OS === 'ios' ? (
          <Animated.View style={[nailBarStyles.blurOverlay, StyleSheet.absoluteFillObject, { opacity: overlayOpacity }]}> 
            <BlurView intensity={20} style={StyleSheet.absoluteFill} />
            <TouchableOpacity
              style={nailBarStyles.blurTouchable}
              onPress={closeBooking}
              activeOpacity={1}
            />
          </Animated.View>
        ) : (
          <Animated.View style={[styles.modalOverlay, { opacity: overlayOpacity }]}> 
            <BlurView
              intensity={-10}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.androidFrosted} />
            <TouchableOpacity
              style={nailBarStyles.blurTouchable}
              onPress={closeBooking}
              activeOpacity={1}
            />
          </Animated.View>
        )}
        {(Platform.OS === 'ios' || showBookingSheetContent) && (
          <Animated.View
            style={[
              nailBarStyles.bookingSheet,
              {
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [400, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={nailBarStyles.bookingTitle}>Complete your booking</Text>
            <View style={nailBarStyles.bookingForm}>
              <View style={nailBarStyles.dateRow}>
                <TouchableOpacity
                  style={nailBarStyles.dateButton}
                  onPress={() => selectDate("checkIn")}
                >
                  <Text style={nailBarStyles.dateLabel}>Check-in</Text>
                  <Text style={nailBarStyles.dateText}>
                    {checkIn
                      ? formatDateDisplay(new Date(checkIn))
                      : "Select date"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={nailBarStyles.dateButton}
                  onPress={() => selectDate("checkOut")}
                >
                  <Text style={nailBarStyles.dateLabel}>Check-out</Text>
                  <Text style={nailBarStyles.dateText}>
                    {checkOut
                      ? formatDateDisplay(new Date(checkOut))
                      : "Select date"}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={nailBarStyles.guestsInput}>
                <Text style={nailBarStyles.guestsLabel}>Guests</Text>
                <TouchableOpacity
                  style={nailBarStyles.guestsButton}
                  onPress={() => {
                    setTempGuests(guests);
                    setShowGuestPicker(true);
                  }}
                >
                  <Text style={nailBarStyles.guestsText}>
                    {guests} guest{guests > 1 ? "s" : ""}
                  </Text>
                  <Feather name="users" size={18} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              {checkIn && checkOut && (
                <View style={nailBarStyles.paymentBreakdown}>
                  <Text style={nailBarStyles.paymentBreakdownTitle}>
                    Payment Breakdown
                  </Text>

                  <View style={nailBarStyles.paymentRow}>
                    <Text style={nailBarStyles.paymentLabel}>
                      £{listing.price} × {calculateNights()} night
                      {calculateNights() > 1 ? "s" : ""}
                    </Text>
                    <Text style={nailBarStyles.paymentValue}>
                      £{listing.price * calculateNights()}
                    </Text>
                  </View>

                  <View style={nailBarStyles.paymentRow}>
                    <Text style={nailBarStyles.paymentLabel}>Service fee</Text>
                    <Text style={nailBarStyles.paymentValue}>£85</Text>
                  </View>

                  <View style={nailBarStyles.paymentDivider} />

                  <View style={nailBarStyles.paymentRow}>
                    <Text style={nailBarStyles.paymentTotalLabel}>Total</Text>
                    <Text style={nailBarStyles.paymentTotalValue}>
                      £{calculateTotal()}
                    </Text>
                  </View>
                </View>
              )}
              <TouchableOpacity
                style={[
                  nailBarStyles.bookButton,
                  (!checkIn || !checkOut) && nailBarStyles.bookButtonDisabled,
                ]}
                onPress={
                  !checkIn || !checkOut || bookingLoading
                    ? handleDisabledButtonClick
                    : handleBooking
                }
                disabled={bookingLoading}
              >
                <Text style={nailBarStyles.bookButtonText}>
                  {bookingLoading ? "Booking..." : "Confirm Booking"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={closeBooking}
                style={nailBarStyles.closeBtn}
              >
                <Text
                  style={{ color: "#e11d48", fontWeight: "bold", fontSize: 16 }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
        {/* Date Picker Modal */}
        <CustomDatePickerModal
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onSelect={(date) => setDate(datePickerType, date)}
          type={datePickerType}
        />
        {/* Guest Picker Modal */}
        <Modal
          visible={showGuestPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowGuestPicker(false)}
        >
          {Platform.OS === "android" ? (
            <BlurView
              intensity={-10}
              tint="dark"
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  padding: 24,
                  width: "80%",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}
                >
                  Select Number of Guests
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 24,
                  }}
                >
                  <TouchableOpacity
                    style={{ padding: 12, opacity: tempGuests <= 1 ? 0.5 : 1 }}
                    onPress={() =>
                      tempGuests > 1 && setTempGuests(tempGuests - 1)
                    }
                    disabled={tempGuests <= 1}
                  >
                    <Feather
                      name="minus"
                      size={22}
                      color={tempGuests <= 1 ? "#ccc" : COLORS.text}
                    />
                  </TouchableOpacity>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "600",
                      marginHorizontal: 24,
                      minWidth: 32,
                      textAlign: "center",
                    }}
                  >
                    {tempGuests}
                  </Text>
                  <TouchableOpacity
                    style={{
                      padding: 12,
                      opacity: tempGuests >= (listing?.guests || 10) ? 0.5 : 1,
                    }}
                    onPress={() =>
                      tempGuests < (listing?.guests || 10) &&
                      setTempGuests(tempGuests + 1)
                    }
                    disabled={tempGuests >= (listing?.guests || 10)}
                  >
                    <Feather
                      name="plus"
                      size={22}
                      color={
                        tempGuests >= (listing?.guests || 10)
                          ? "#ccc"
                          : COLORS.text
                      }
                    />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={{
                    backgroundColor: COLORS.primary,
                    borderRadius: 8,
                    paddingVertical: 10,
                    paddingHorizontal: 32,
                    marginBottom: 8,
                  }}
                  onPress={() => {
                    setGuests(tempGuests);
                    setShowGuestPicker(false);
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}
                  >
                    Done
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowGuestPicker(false)}>
                  <Text
                    style={{
                      color: "#e11d48",
                      fontWeight: "bold",
                      fontSize: 15,
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          ) : (
            <BlurView
              intensity={10}
              tint="dark"
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  padding: 24,
                  width: "80%",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}
                >
                  Select Number of Guests
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 24,
                  }}
                >
                  <TouchableOpacity
                    style={{ padding: 12, opacity: tempGuests <= 1 ? 0.5 : 1 }}
                    onPress={() =>
                      tempGuests > 1 && setTempGuests(tempGuests - 1)
                    }
                    disabled={tempGuests <= 1}
                  >
                    <Feather
                      name="minus"
                      size={22}
                      color={tempGuests <= 1 ? "#ccc" : COLORS.text}
                    />
                  </TouchableOpacity>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "600",
                      marginHorizontal: 24,
                      minWidth: 32,
                      textAlign: "center",
                    }}
                  >
                    {tempGuests}
                  </Text>
                  <TouchableOpacity
                    style={{
                      padding: 12,
                      opacity: tempGuests >= (listing?.guests || 10) ? 0.5 : 1,
                    }}
                    onPress={() =>
                      tempGuests < (listing?.guests || 10) &&
                      setTempGuests(tempGuests + 1)
                    }
                    disabled={tempGuests >= (listing?.guests || 10)}
                  >
                    <Feather
                      name="plus"
                      size={22}
                      color={
                        tempGuests >= (listing?.guests || 10)
                          ? "#ccc"
                          : COLORS.text
                      }
                    />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={{
                    backgroundColor: COLORS.primary,
                    borderRadius: 8,
                    paddingVertical: 10,
                    paddingHorizontal: 32,
                    marginBottom: 8,
                  }}
                  onPress={() => {
                    setGuests(tempGuests);
                    setShowGuestPicker(false);
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}
                  >
                    Done
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowGuestPicker(false)}>
                  <Text
                    style={{
                      color: "#e11d48",
                      fontWeight: "bold",
                      fontSize: 15,
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          )}
        </Modal>
      </Modal>

      {/* Login Prompt Modal */}
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  errorTitle: {
    fontSize: 22,
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
    alignSelf: "center",
  },
  refreshButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerSection: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  ratingLocationRow: {
    flex: 1,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  wishlistButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wishlistText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginLeft: 6,
  },
  wishlistTextActive: {
    color: "#ff385c",
  },
  carouselContainer: {
    position: "relative",
    marginBottom: 20,
  },
  carouselImage: {
    width: width,
    height: 250,
  },
  pagination: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: "#fff",
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 14,
  },
  highlightsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  highlightItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    marginBottom: 16,
  },
  highlightLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 8,
  },
  highlightValue: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginLeft: 8,
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "50%",
    marginBottom: 12,
  },
  amenityText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
  },
  rulesContainer: {
    gap: 16,
  },
  ruleItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  ruleContent: {
    marginLeft: 12,
    flex: 1,
  },
  ruleTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 2,
  },
  ruleText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginLeft: 12,
  },
  bookingSection: {
    padding: 20,
    paddingTop: 0,
  },
  bookingCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  price: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ff385c",
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  bookingForm: {
    gap: 16,
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
  },
  dateInput: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f9fafb",
  },
  dateText: {
    fontSize: 14,
    color: COLORS.text,
  },
  guestsInput: {
    marginBottom: 8,
  },
  guestsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  guestsButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f9fafb",
  },
  guestsText: {
    fontSize: 14,
    color: COLORS.text,
  },
  bookButton: {
    backgroundColor: "#ff385c",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  bookButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  bookButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bookingNote: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 8,
  },
  priceBreakdown: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 8,
  },
  priceItem: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  priceValue: {
    fontSize: 14,
    color: COLORS.text,
  },
  totalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    marginTop: 8,
  },
  totalText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    width: "80%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.text,
  },
  closeButton: {
    padding: 8,
  },
  dateListContainer: {
    padding: 16,
  },
  dateOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
  },
  dateOptionContent: {
    flex: 1,
  },
  dateOptionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  dateOptionSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  guestListContainer: {
    padding: 16,
  },
  guestOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
  },
  guestOptionLabel: {
    fontSize: 14,
    color: COLORS.text,
  },
  guestOptionLabelSelected: {
    fontWeight: "bold",
  },
  guestOptionSelected: {
    backgroundColor: "#f9fafb",
  },
  androidFrosted: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0)",
    borderColor: "rgba(0, 0, 0, 0.1)",
    borderWidth: 0.5,
  },
});

const nailBarStyles = StyleSheet.create({
  nailBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  price: { fontWeight: "bold", fontSize: 22 },
  nights: { color: "#555", fontSize: 15, marginTop: 2 },

  reserveBtn: {
    backgroundColor: "#ff385c",
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 36,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#e11d48",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    marginLeft: -50,
    marginRight: 10,
    minWidth: 120,
    alignSelf: "center",
  },
  reserveBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    letterSpacing: 0.2,
  },
  bookingSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 24,
    minHeight: 320,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  bookingTitle: { fontWeight: "bold", fontSize: 20, marginBottom: 18 },
  bookingForm: { gap: 16 },
  dateRow: { flexDirection: "row", gap: 12 },
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f9fafb",
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888",
    marginBottom: 6,
  },
  dateText: { fontSize: 14, color: "#222" },
  guestsInput: { marginBottom: 8 },
  guestsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888",
    marginBottom: 6,
  },
  guestsButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f9fafb",
  },
  guestsText: { fontSize: 14, color: "#222" },
  bookButton: {
    backgroundColor: "#e11d48",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  bookButtonDisabled: {
    backgroundColor: "black",
  },
  bookButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  closeBtn: { marginTop: 18, alignSelf: "center" },
  priceSummary: {
    marginTop: 8,
    marginBottom: 4,
    alignItems: "center",
  },
  priceSummaryText: {
    fontSize: 16,
    color: "#222",
  },
  perNightBottom: {
    color: "#555",
    fontSize: 14,
    marginLeft: 1,
    fontWeight: "500",
    marginBottom: 3,
  },
  ratingText: {
    color: "#e11d48",
    fontWeight: "bold",
    fontSize: 15,
    marginLeft: 4,
  },
  nightsSummary: { color: "#888", fontSize: 13, marginTop: 2, marginLeft: 0 },
  dateRange: { color: "#888", fontSize: 13, marginTop: 2, marginLeft: 0 },
  blurOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  blurTouchable: {
    flex: 1,
  },
  paymentBreakdown: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 8,
  },
  paymentBreakdownTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 16,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  paymentValue: {
    fontSize: 14,
    color: COLORS.text,
  },
  paymentDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 8,
  },
  paymentTotalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
  },
  paymentTotalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
  },
});
