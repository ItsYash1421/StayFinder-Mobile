import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Animated,
  TextInput,
} from "react-native";
import { COLORS, getGridColumns, getResponsiveSize, FONT_SIZES, SPACING, getShadow, isTablet, isLargeTablet } from "../constants/theme";
import { api } from "../constants/api";
import PostCard from "../components/PostCard";
import { useNavigation, useRoute } from "@react-navigation/native";
import FilterModal from "../components/FilterModal";
import { Feather } from "@expo/vector-icons";
import AppHeader from "../components/AppHeader";
import { ScrollView as RNScrollView } from "react-native";
import useWishlist from "../hooks/useWishlist";
import CustomDatePickerModal from '../components/CustomDatePickerModal';

// Use responsive grid columns instead of hardcoded tablet detection
const gridColumns = getGridColumns();

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

export default function ExploreScreen() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const [showFooter, setShowFooter] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { wishlist, toggleWishlist } = useWishlist();

  // Animation refs for end message
  const headerAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/listings");
      setListings(res.data.listings || []);
    } catch (err) {
      setError("Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  // Guarded sync: Only update filters if route.params and filters differ (normalized)
  useEffect(() => {
    if (route.params) {
      const paramsNorm = normalizeFilters(route.params);
      const filtersNorm = normalizeFilters(filters);
      if (JSON.stringify(paramsNorm) !== JSON.stringify(filtersNorm)) {
        setFilters(paramsNorm);
      }
    }
  }, [route.params]);

  // Guarded sync: Only update route.params if filters and route.params differ (normalized)
  useEffect(() => {
    if (navigation.setParams) {
      const paramsNorm = normalizeFilters(route.params || {});
      const filtersNorm = normalizeFilters(filters);
      if (JSON.stringify(paramsNorm) !== JSON.stringify(filtersNorm)) {
        navigation.setParams(filtersNorm);
      }
    }
  }, [filters]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
  };

  // Filtering logic
  const filteredListings = React.useMemo(() => {
    let filtered = [...listings];
    // Only use filters state for filtering
    const f = Object.fromEntries(
      Object.entries(filters).filter(
        ([, v]) =>
          v !== null &&
          v !== undefined &&
          v !== "" &&
          !(Array.isArray(v) && v.length === 0)
      )
    );
    if (f.search) {
      const searchTerm = f.search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.title?.toLowerCase().includes(searchTerm) ||
          l.description?.toLowerCase().includes(searchTerm) ||
          l.location?.toLowerCase().includes(searchTerm)
      );
    }
    if (f.location) {
      const searchLoc = f.location.trim().toLowerCase();
      filtered = filtered.filter(
        (l) => l.location && l.location.trim().toLowerCase().includes(searchLoc)
      );
    }
    if (f.destination) {
      filtered = filtered.filter(
        (l) =>
          l.title && l.title.toLowerCase().includes(f.destination.toLowerCase())
      );
    }
    if (f.category && f.category !== "all") {
      filtered = filtered.filter(
        (l) =>
          l.title?.toLowerCase().includes(f.category.toLowerCase()) ||
          l.description?.toLowerCase().includes(f.category.toLowerCase())
      );
    }
    if (f.minPrice) {
      filtered = filtered.filter((l) => l.price >= parseInt(f.minPrice));
    }
    if (f.maxPrice) {
      filtered = filtered.filter((l) => l.price <= parseInt(f.maxPrice));
    }
    if (f.guests) {
      filtered = filtered.filter((l) => l.guests >= parseInt(f.guests));
    }
    if (f.amenities && f.amenities.length > 0) {
      filtered = filtered.filter((l) => {
        const listingAmenities = l.amenities
          ? Object.entries(l.amenities)
              .filter(([k, v]) => v)
              .map(([k]) => k)
          : [];
        return f.amenities.every((a) => listingAmenities.includes(a));
      });
    }
    if (f.sortBy) {
      switch (f.sortBy) {
        case "price-low":
          filtered.sort((a, b) => a.price - b.price);
          break;
        case "price-high":
          filtered.sort((a, b) => b.price - a.price);
          break;
        case "rating":
          filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case "newest":
          filtered.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          break;
        case "popular":
          filtered.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
          break;
        default:
          break;
      }
    }
    return filtered;
  }, [listings, filters]);

  const activeFilterCount = Object.values(filters).filter((v) =>
    Array.isArray(v) ? v.length > 0 : v && v !== "all" && v !== "relevance"
  ).length;

  // Helper to get filter chips
  const filterChips = [];
  if (filters.search)
    filterChips.push({ key: "search", label: `Search: "${filters.search}"` });
  if (filters.location)
    filterChips.push({
      key: "location",
      label: `Location: ${filters.location}`,
    });
  if (filters.category && filters.category !== "all")
    filterChips.push({ key: "category", label: `Type: ${filters.category}` });
  if (
    (filters.minPrice && parseInt(filters.minPrice) > 0) ||
    (filters.maxPrice && parseInt(filters.maxPrice) < 1000)
  )
    filterChips.push({
      key: "price",
      label: `Price: $${filters.minPrice || 0} - $${filters.maxPrice || 1000}`,
    });
  if (filters.guests && parseInt(filters.guests) > 1)
    filterChips.push({ key: "guests", label: `${filters.guests} guests` });
  if (filters.amenities && filters.amenities.length > 0)
    filterChips.push({
      key: "amenities",
      label: `${filters.amenities.length} amenities`,
    });
  if (filters.sortBy && filters.sortBy !== "relevance")
    filterChips.push({ key: "sortBy", label: `Sort: ${filters.sortBy}` });

  const removeFilter = (key) => {
    const newFilters = normalizeFilters(filters);
    if (key === "price") {
      newFilters.minPrice = "";
      newFilters.maxPrice = "";
    } else if (key === "amenities") {
      newFilters.amenities = [];
    } else if (key === "category") {
      newFilters.category = "all";
    } else if (key === "sortBy") {
      newFilters.sortBy = "relevance";
    } else {
      newFilters[key] = "";
    }
    // Remove from navigation params as well
    if (navigation.setParams) {
      const newParams = normalizeFilters(route.params || {});
      if (key === "price") {
        newParams.minPrice = "";
        newParams.maxPrice = "";
      } else if (key === "amenities") {
        newParams.amenities = [];
      } else if (key === "category") {
        newParams.category = "all";
      } else if (key === "sortBy") {
        newParams.sortBy = "relevance";
      } else {
        newParams[key] = "";
      }
      navigation.setParams(newParams);
    }
    // If all filters are now empty/default, reset to default values (like clearAllFilters)
    const isAllCleared = Object.entries(newFilters).every(
      ([k, v]) =>
        v === "" ||
        v === "all" ||
        v === "relevance" ||
        (Array.isArray(v) && v.length === 0)
    );
    if (isAllCleared) {
      setFilters(defaultFilters);
      if (navigation.setParams) {
        navigation.setParams(defaultFilters);
      }
    } else {
      setFilters(newFilters);
    }
  };

  const clearAllFilters = () => {
    setFilters(defaultFilters);
    if (navigation.setParams) {
      navigation.setParams(defaultFilters);
    }
  };

  // Demo: local wishlist state (replace with global/persisted in real app)
  const handleToggleWishlist = async (id) => {
    const result = await toggleWishlist(id);
    if (!result?.success) {
      // You could show a toast or alert here
      console.error("Failed to toggle wishlist:", result?.message);
    }
  };

  // Helper to detect if user came from Home search (location param only, no other filters)
  // const isHomeSearch = !!route.params?.location;

  // Special clear for Home search
  // const clearHomeSearch = () => {
  //   navigation.navigate("Home");
  // };

  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const currentScrollY = contentOffset.y;
    const paddingToBottom = 20;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= 
      contentSize.height - paddingToBottom;
    
    // Header visibility logic with improved detection
    const scrollThreshold = 30; // Minimum scroll distance to trigger
    const scrollDifference = currentScrollY - lastScrollY;
    
    if (Math.abs(scrollDifference) > scrollThreshold) {
      if (scrollDifference > 0 && currentScrollY > 50) {
        // Scrolling down and past initial area - hide header
        if (showHeader) {
          setShowHeader(false);
          Animated.timing(headerAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }).start();
        }
      } else if (scrollDifference < 0) {
        // Scrolling up - show header
        if (!showHeader) {
          setShowHeader(true);
          Animated.timing(headerAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }).start();
        }
      }
    }
    
    setLastScrollY(currentScrollY);
    
    if (isCloseToBottom && filteredListings.length > 0) {
      setShowFooter(true);
      // Trigger animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(bounceAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(bounceAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    }
  };

  const handleRefreshListings = () => {
    fetchListings();
    setShowFooter(false);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.8);
    bounceAnim.setValue(0);
  };

  const handleExploreMore = () => {
    navigation.navigate("Home");
  };

  // Helper to format date like Home page
  const formatDateDisplay = (date) => {
    if (!date) return 'Date (YYYY-MM-DD)';
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if (new Date(date).toDateString() === today.toDateString()) {
      return 'Today';
    } else if (new Date(date).toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        weekday: 'short',
      });
    }
  };

  // Responsive grid: adapts to screen size
  const renderGrid = () => {
    if (gridColumns > 1) {
      const rows = [];
      for (let i = 0; i < filteredListings.length; i += gridColumns) {
        const rowItems = [];
        for (let j = 0; j < gridColumns; j++) {
          if (i + j < filteredListings.length) {
            const listing = filteredListings[i + j];
            rowItems.push(
              <PostCard
                {...listing}
                key={listing._id}
                title={listing.title}
                location={listing.location}
                price={`$${listing.price}/night`}
                image={listing.images?.[0]}
                rating={listing.rating}
                guests={listing.guests}
                bedrooms={listing.bedrooms}
                bathrooms={listing.bathrooms}
                amenities={listing.amenities}
                wishlisted={wishlist.includes(listing._id)}
                onToggleWishlist={() => handleToggleWishlist(listing._id)}
                onPress={() =>
                  navigation.navigate("ListingDetail", {
                    id: listing._id,
                  })
                }
                style={[styles.card, { flex: 1, marginHorizontal: getResponsiveSize(2, 3, 4, 6) }]}
              />
            );
          }
        }
        rows.push(
          <View key={i} style={styles.gridRow}>
            {rowItems}
          </View>
        );
      }
      return rows;
    } else {
      // Single column layout for mobile
      return filteredListings.map((listing) => (
        <PostCard
          {...listing}
          key={listing._id}
          title={listing.title}
          location={listing.location}
          price={`$${listing.price}/night`}
          image={listing.images?.[0]}
          rating={listing.rating}
          guests={listing.guests}
          bedrooms={listing.bedrooms}
          bathrooms={listing.bathrooms}
          amenities={listing.amenities}
          wishlisted={wishlist.includes(listing._id)}
          onToggleWishlist={() => handleToggleWishlist(listing._id)}
          onPress={() =>
            navigation.navigate("ListingDetail", {
              id: listing._id,
            })
          }
          style={styles.card}
        />
      ));
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader />
      <ScrollView
        style={{ flex: 1, width: '100%' }}
        contentContainerStyle={[styles.grid, { paddingTop: showHeader ? 0 : 0 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={true}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.exploreCard}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Explore Stays</Text>
            <TouchableOpacity
              style={styles.filterBtn}
              onPress={() => setFilterModalVisible(true)}
            >
              <Feather name="sliders" size={20} color={COLORS.primary} />
              <Text style={styles.filterBtnText}>
                Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
              </Text>
            </TouchableOpacity>
          </View>
          {/* Direct Search Bar */}
          <View style={styles.searchBarCard}>
            <View style={styles.searchBarRow}>
              <Feather name="map-pin" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Where to? (Location)"
                placeholderTextColor={COLORS.textMuted}
                value={filters.location}
                onChangeText={text => setFilters(f => ({ ...f, location: text }))}
                returnKeyType="search"
                onSubmitEditing={() => setFilters(f => ({ ...f, location: f.location.trim() }))}
              />
              {!!filters.location && (
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => setFilters(f => ({ ...f, location: '' }))}
                >
                  <Feather name="x-circle" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.searchBarRow}>
              <Feather name="calendar" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
              <TouchableOpacity
                style={[styles.searchInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 6 }]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
              >
                <Text style={{ color: filters.date ? COLORS.text : COLORS.textMuted, fontSize: 15 }}>
                  {formatDateDisplay(filters.date)}
                </Text>
                {filters.date ? (
                  <TouchableOpacity
                    onPress={() => setFilters(f => ({ ...f, date: '' }))}
                    style={{ marginLeft: 6 }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="x-circle" size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </TouchableOpacity>
            </View>
          </View>
          {/* Active Filters Section */}
          {filterChips.length > 0 && (
            <View style={styles.activeFiltersCard}>
              <View style={styles.activeFiltersHeader}>
                <Text style={styles.activeFiltersTitle}>Active Filters</Text>
                <TouchableOpacity
                  style={styles.clearAllButton}
                  onPress={clearAllFilters}
                  activeOpacity={0.8}
                >
                  <Feather name="refresh-cw" size={16} color="#fff" />
                  <Text style={styles.clearAllButtonText}>Clear All</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.filterChipsRow}>
                {filterChips.map((chip) => (
                  <TouchableOpacity
                    key={chip.key}
                    style={[styles.filterChip, chipColorStyle(chip.key)]}
                    onPress={() => removeFilter(chip.key)}
                  >
                    <Text style={[styles.filterChipText, chipTextColorStyle(chip.key)]}>
                      {chip.label}
                    </Text>
                    <Feather
                      name="x"
                      size={14}
                      color={chipTextColor(chip.key)}
                      style={{ marginLeft: 6 }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          {/* Stays found count */}
          <View style={styles.staysCount}>
            <Feather name="check-circle" size={20} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.staysCountText}>{filteredListings.length} stays found</Text>
          </View>
        </View>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 32 }} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : filteredListings.length === 0 ? (
          <Text style={styles.empty}>No listings found.</Text>
        ) : (
          renderGrid()
        )}
        {/* Simple end message */}
        {!loading && showFooter && (
          <Animated.View
            style={[
              styles.endMessage,
              {
                opacity: fadeAnim,
                transform: [
                  { scale: scaleAnim },
                  {
                    translateY: bounceAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -5],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.endMessageContent}>
              <View style={styles.endMessageIcon}>
                <Feather
                  name="check-circle"
                  size={32}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.endMessageText}>
                You've seen all properties! 🏠
              </Text>
              <Text style={styles.endMessageSubtext}>
                Check back later for new listings
              </Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleRefreshListings}
                activeOpacity={0.8}
              >
                <Feather name="refresh-cw" size={18} color="#fff" />
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
        <Text style={{
          fontSize: 12,
          color: '#9ca3af',
          textAlign: 'center',
          letterSpacing: 0.2,
          fontWeight: '400',
          marginTop: 16,
          marginBottom: 8
        }}>
          © 2024 StayFinder. All rights reserved.
        </Text>
      </ScrollView>
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={setFilters}
        onClear={clearAllFilters}
        initialFilters={{ ...filters }}
      />
      <CustomDatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelect={selectedDate => {
          setFilters(f => ({ ...f, date: selectedDate.toISOString().split('T')[0] }));
          setShowDatePicker(false);
        }}
        type="checkIn"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: getResponsiveSize(20, 22, 24, 28),
    paddingHorizontal: 0,
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: getResponsiveSize(88, 90, 92, 94) + "%",
    marginBottom: getResponsiveSize(2, 4, 6, 8),
  },
  title: {
    color: COLORS.primary,
    fontSize: FONT_SIZES['4xl'],
    fontWeight: "bold",
    textAlign: "left",
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: getResponsiveSize(6, 8, 10, 12),
    paddingVertical: getResponsiveSize(6, 8, 10, 12),
    paddingHorizontal: getResponsiveSize(12, 14, 16, 18),
    marginLeft: getResponsiveSize(60, 70, 80, 90),
  },
  filterBtnText: {
    color: COLORS.primary,
    fontWeight: "bold",
    marginLeft: getResponsiveSize(4, 6, 8, 10),
    fontSize: FONT_SIZES.base,
  },
  subtitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.base,
    marginBottom: getResponsiveSize(12, 14, 16, 18),
    textAlign: "center",
  },
  grid: {
    alignItems: "center",
    paddingBottom: getResponsiveSize(30, 35, 40, 45),
    paddingTop: getResponsiveSize(6, 8, 10, 12),
    width: "100%",
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: getResponsiveSize(88, 90, 92, 94) + "%",
    marginBottom: getResponsiveSize(14, 16, 18, 20),
  },
  card: {
    marginBottom: getResponsiveSize(14, 16, 18, 20),
    flex: 1,
    marginHorizontal: getResponsiveSize(2, 3, 4, 6),
  },
  error: {
    color: COLORS.error,
    textAlign: "center",
    marginTop: getResponsiveSize(28, 32, 36, 40),
    fontSize: FONT_SIZES.lg,
  },
  empty: {
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: getResponsiveSize(28, 32, 36, 40),
    fontSize: FONT_SIZES.lg,
  },
  activeFiltersCard: {
    maxWidth: getResponsiveSize(350, 380, 400, 450),
    minWidth: getResponsiveSize(350, 380, 400, 450),
    alignSelf: 'center',
    backgroundColor: "#fff",
    borderRadius: getResponsiveSize(14, 16, 18, 20),
    padding: getResponsiveSize(14, 16, 18, 20),
    marginTop: getResponsiveSize(14, 16, 18, 20),
    marginBottom: getResponsiveSize(6, 8, 10, 12),
    ...getShadow('sm'),
  },
  activeFiltersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: getResponsiveSize(8, 10, 12, 14),
  },
  activeFiltersTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: '#111',
    flex: 1,
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    marginLeft: 8,
    flexShrink: 0,
  },
  clearAllButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 6,
    fontSize: 14,
  },
  filterChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fce7f3",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipText: {
    color: "#be185d",
    fontWeight: "bold",
    fontSize: 15,
  },
  endMessage: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    marginTop: 20,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  endMessageContent: {
    alignItems: "center",
  },
  endMessageIcon: {
    marginBottom: 16,
    backgroundColor: COLORS.primary + "15",
    borderRadius: 30,
    padding: 12,
  },
  endMessageText: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "center",
  },
  endMessageSubtext: {
    color: COLORS.textMuted,
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  refreshButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 16,
  },
  exploreCard: {
    padding: 20,
    backgroundColor: '#fcfcfd',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#f3e8ff',
    maxWidth: 420,
    alignSelf: 'center',
    marginTop: 80,
    marginBottom: 12,
    shadowColor: '#a21caf',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  searchBarCard: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 0,
    marginTop: 8,
    marginBottom: 0,
    shadowColor: 'transparent',
    elevation: 0,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ececec',
    borderRadius: 10,
    backgroundColor: '#fff',
    fontSize: 15,
    marginBottom: 0,
  },
  clearBtn: {
    padding: 5,
  },
  staysCount: {
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: '#f3e8ff',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 18,
    marginTop: 18,
    marginBottom: 2,
    alignItems: 'center',
    gap: 6,
  },
  staysCountText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.2,
  },
});

// Helper for chip colors
function chipColorStyle(key) {
  switch (key) {
    case "category":
      return { backgroundColor: "#ede9fe" };
    case "price":
      return { backgroundColor: "#d1fae5" };
    case "guests":
      return { backgroundColor: "#fef3c7" };
    case "sortBy":
      return { backgroundColor: "#f3f4f6" };
    case "location":
      return { backgroundColor: "#e0f2fe" };
    case "search":
      return { backgroundColor: "#fce7f3" };
    case "amenities":
      return { backgroundColor: "#e0e7ff" };
    default:
      return { backgroundColor: COLORS.backgroundSecondary };
  }
}

function chipTextColorStyle(key) {
  switch (key) {
    case "category":
      return { color: "#7c3aed", fontWeight: "bold" };
    case "price":
      return { color: "#047857", fontWeight: "bold" };
    case "guests":
      return { color: "#b45309", fontWeight: "bold" };
    case "sortBy":
      return { color: "#374151" };
    case "location":
      return { color: "#0369a1", fontWeight: "bold" };
    case "search":
      return { color: "#be185d", fontWeight: "bold" };
    case "amenities":
      return { color: "#3730a3", fontWeight: "bold" };
    default:
      return { color: COLORS.text };
  }
}

function chipTextColor(key) {
  switch (key) {
    case "category":
      return "#7c3aed";
    case "price":
      return "#047857";
    case "guests":
      return "#b45309";
    case "sortBy":
      return "#374151";
    case "location":
      return "#0369a1";
    case "search":
      return "#be185d";
    case "amenities":
      return "#3730a3";
    default:
      return COLORS.primary;
  }
}
 