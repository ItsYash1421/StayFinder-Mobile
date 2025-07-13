import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Dimensions,
  InteractionManager,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../constants/theme";
import { api } from "../constants/api";
import PostCard from "../components/PostCard";
import HomePostCard from "../components/HomePostCard";
import HeroSection from "../components/HeroSection";
import DestinationHighlights from "../components/DestinationHighlights";
import HowItWorks from "../components/HowItWorks";
import WhyChooseUs from "../components/WhyChooseUs";
import Testimonials from "../components/Testimonials";
import HostBenefits from "../components/HostBenefits";
import AppHeader from "../components/AppHeader";
import BecomeHost from "../components/BecomeHost";
import { Feather } from "@expo/vector-icons";
import useWishlist from "../hooks/useWishlist";
import LoginPromptModal from "../components/LoginPromptModal";

// Normalization function to ensure consistent filter structure
function normalizeFilters(obj = {}) {
  return {
    search: obj.search || "",
    location: obj.location || "",
    category: obj.category || "all",
    minPrice: obj.minPrice || "",
    maxPrice: obj.maxPrice || "",
    guests: obj.guests || "",
    amenities: Array.isArray(obj.amenities) ? obj.amenities : [],
    sortBy: obj.sortBy || "relevance",
    date: obj.date || "",
  };
}

const defaultFilters = normalizeFilters();

export default function HomeScreen() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { wishlist, toggleWishlist, getWishlist } = useWishlist();

  // Animation refs
  const fadeAnim1 = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  const fadeAnim3 = useRef(new Animated.Value(0)).current;
  const fadeAnim4 = useRef(new Animated.Value(0)).current;
  const fadeAnim5 = useRef(new Animated.Value(0)).current;

  const scrollRef = useRef(null);
  const CARD_WIDTH = 260 + 16; // card width + marginRight
  const VISIBLE_CARDS = Math.floor(Dimensions.get("window").width / CARD_WIDTH);
  const [autoScrollIndex, setAutoScrollIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const autoScrollInterval = useRef(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    Animated.stagger(180, [
      Animated.timing(fadeAnim1, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim2, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim3, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim4, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim5, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Fetch wishlist when component mounts
  useEffect(() => {
    getWishlist();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch popular listings instead of all listings
      const res = await api.get("/api/listings/popular");
      setListings(res.data.listings || []);
    } catch (err) {
      console.error("Error fetching popular listings:", err);
      // Fallback to regular listings if popular endpoint fails
      try {
        const fallbackRes = await api.get("/api/listings");
        setListings(fallbackRes.data.listings || []);
      } catch (fallbackErr) {
        setError("Failed to load listings");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
  };

  // Search handler
  const handleSearch = (params) => {
    const trimmedParams = {
      ...params,
      search: params.search ? params.search.trim() : "",
      location: params.location ? params.location.trim() : "",
    };
    navigation.navigate("Explore", {
      screen: "ExploreMain",
      params: { ...defaultFilters, ...trimmedParams },
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

  // Filter out paused listings and duplicate first card at the end for seamless looping
  const activeListings = listings.filter(
    (listing) => listing.status !== "paused"
  );
  const carouselData = activeListings.slice(0, 10);
  const infiniteData = [...carouselData, carouselData[0]];
  const lastIndex = carouselData.length - 1;

  // Helper to clear and restart auto-scroll interval
  const startAutoScroll = useCallback(() => {
    if (autoScrollInterval.current) clearInterval(autoScrollInterval.current);
    if (!carouselData.length) return;
    autoScrollInterval.current = setInterval(() => {
      setAutoScrollIndex((prev) => {
        let next = prev + 1;
        if (next > lastIndex) {
          // Scroll to duplicate (animated), then jump to real first
          if (scrollRef.current) {
            scrollRef.current.scrollTo({
              x: (lastIndex + 1) * CARD_WIDTH,
              animated: true,
            });
            setTimeout(() => {
              scrollRef.current &&
                scrollRef.current.scrollTo({ x: 0, animated: false });
            }, 400); // match animation duration
          }
          return 0;
        } else {
          if (scrollRef.current) {
            scrollRef.current.scrollTo({
              x: next * CARD_WIDTH,
              animated: true,
            });
          }
          return next;
        }
      });
    }, 3000);
  }, [carouselData.length, CARD_WIDTH, lastIndex]);

  useEffect(() => {
    startAutoScroll();
    return () => {
      if (autoScrollInterval.current) clearInterval(autoScrollInterval.current);
    };
  }, [startAutoScroll]);

  // Sync manual scroll with autoScrollIndex and handle seamless swipe
  const onMomentumScrollEnd = (event) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / CARD_WIDTH);
    if (slide === infiniteData.length - 1) {
      // If swiped to duplicate, jump to real first
      setTimeout(() => {
        scrollRef.current &&
          scrollRef.current.scrollTo({ x: 0, animated: false });
      }, 10);
      setAutoScrollIndex(0);
    } else {
      setAutoScrollIndex(slide);
    }
    // Reset auto-scroll interval to resume from this index
    startAutoScroll();
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.backgroundSecondary }}>
      <AppHeader />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 70 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim1 }}>
          <HeroSection onSearch={handleSearch} listings={listings} />
        </Animated.View>
        <View style={styles.sectionSpacing} />
        <Animated.View style={{ opacity: fadeAnim2 }}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.trendingTitle}>
              Top{" "}
              <Text style={{ color: COLORS.primary }}>Popular Listings</Text>
            </Text>
            <TouchableOpacity
              style={styles.exploreMoreBtn}
              onPress={() => navigation.navigate("Explore")}
              activeOpacity={0.8}
            >
              <Text style={styles.exploreMoreText}>Explore More</Text>
              <Text style={styles.exploreMoreArrow}>›</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={COLORS.primary}
              />
              <Text style={styles.loadingText}>Loading listings...</Text>
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
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <ScrollView
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsRow}
                snapToAlignment="start"
                decelerationRate="fast"
                bounces={false}
                scrollEventThrottle={16}
                onMomentumScrollEnd={onMomentumScrollEnd}
              >
                {infiniteData.map((listing, idx) => (
                  <HomePostCard
                    key={
                      idx === infiniteData.length - 1
                        ? "duplicate"
                        : listing._id
                    }
                    title={listing.title}
                    location={listing.location}
                    price={`$${listing.price}/night`}
                    image={listing.images?.[0]}
                    style={styles.card}
                    bookingCount={listing.bookingCount}
                    views={listing.views}
                    rating={listing.rating}
                    onPress={() =>
                      navigation.navigate("ListingDetail", { id: listing._id })
                    }
                    wishlisted={wishlist.includes(listing._id)}
                    onToggleWishlist={() => toggleWishlist(listing._id, true, () => setShowLoginPrompt(true))}
                    listingId={listing._id}
                  />
                ))}
              </ScrollView>
            </View>
          )}
          <View style={styles.sectionSpacingSmall} />
          <DestinationHighlights />
        </Animated.View>
        <View style={styles.sectionSpacing} />
        <Animated.View style={{ opacity: fadeAnim4 }}>
          <HowItWorks />
        </Animated.View>
        <View style={styles.sectionSpacing} />
        <Animated.View style={{ opacity: fadeAnim5 }}>
          <WhyChooseUs />
          <View style={styles.sectionSpacingSmall} />
          <Testimonials />
          <View style={styles.sectionSpacingSmall} />
          <HostBenefits />
        </Animated.View>
      </ScrollView>
      
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
    top: -13,
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  sectionSpacing: {
    height: 32,
  },
  sectionSpacingSmall: {
    height: 18,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginLeft: 20,
    marginBottom: 8,
    marginRight: 20,
  },
  trendingTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.text,
    marginLeft: 0,
    marginBottom: 4,
  },
  cardsRow: {
    paddingHorizontal: 16,
  },
  card: {
    marginRight: 16,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  loadingText: {
    color: COLORS.primary,
    fontSize: 16,
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  errorTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },
  errorSubtitle: {
    color: COLORS.textMuted,
    fontSize: 16,
    marginBottom: 24,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  exploreMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
    paddingHorizontal: 0,
  },
  exploreMoreText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 16,
    marginRight: 2,
  },
  exploreMoreArrow: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 1,
  },
});
