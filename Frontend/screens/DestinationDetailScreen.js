import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  TextInput,
  Animated,
  PanResponder,
  Pressable,
  Share,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { api } from "../constants/api";
import PostCard from "../components/PostCard";
import AppHeader from "../components/AppHeader";
import { COLORS } from "../constants/theme";
import { Feather } from "@expo/vector-icons";
import FilterModal from "../components/FilterModal";
import useWishlist from "../hooks/useWishlist";
import LoginPromptModal from "../components/LoginPromptModal";

const { width, height } = Dimensions.get("window");
const SNAP_POINTS = [height - 120, height * 0.5, height * 0.15]; // [collapsed, half, expanded]

export default function DestinationDetailScreen({ route, navigation }) {
  const { location } = route.params;
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [sheetHalf, setSheetHalf] = useState(true); // Track if at half
  const flatListRef = useRef();
  const mapRef = useRef();
  const sheetAnim = useRef(new Animated.Value(SNAP_POINTS[1])).current; // Start at half
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    minPrice: "",
    maxPrice: "",
    guests: "",
    amenities: [],
    sortBy: "relevance",
  });
  const { wishlist, toggleWishlist } = useWishlist();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    fetchListings();
  }, [location]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/listings");
      const filtered = (res.data.listings || []).filter(
        (l) => l.location?.trim() === location
      );
      setListings(filtered);
    } catch (e) {
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  // Compute initial region
  const initialRegion = useMemo(() => {
    if (!listings.length)
      return {
        latitude: 28.6139,
        longitude: 77.209,
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
      };
    const first = listings[0];
    return {
      latitude: first.latitude || 28.6139,
      longitude: first.longitude || 77.209,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }, [listings]);

  // Filter listings by filters (like ExploreScreen)
  const filteredListings = useMemo(() => {
    let filtered = [...listings];
    const f = filters;
    if (f.search?.trim()) {
      const searchTerm = f.search.trim().toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.title?.toLowerCase().includes(searchTerm) ||
          l.description?.toLowerCase().includes(searchTerm) ||
          l.location?.toLowerCase().includes(searchTerm)
      );
    }
    if (f.category && f.category !== "all") {
      filtered = filtered.filter(
        (l) => l.category && l.category.toLowerCase() === f.category.toLowerCase()
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
    return filtered;
  }, [listings, filters]);

  // Draggable bottom sheet logic
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 10,
      onPanResponderMove: (_, gestureState) => {
        let startPoint = sheetExpanded
          ? SNAP_POINTS[2]
          : sheetHalf
          ? SNAP_POINTS[1]
          : SNAP_POINTS[0];
        let newY = startPoint + gestureState.dy;
        newY = Math.max(SNAP_POINTS[2], Math.min(SNAP_POINTS[0], newY));
        sheetAnim.setValue(newY);
      },
      onPanResponderRelease: (_, gestureState) => {
        const current = sheetAnim._value;
        // Only handle drag snapping here
        const distances = SNAP_POINTS.map((p) => Math.abs(current - p));
        const minDist = Math.min(...distances);
        const nearest = SNAP_POINTS[distances.indexOf(minDist)];
        if (nearest === SNAP_POINTS[2]) {
          expandSheet();
        } else if (nearest === SNAP_POINTS[1]) {
          halfSheet();
        } else {
          collapseSheet();
        }
      },
    })
  ).current;

  const expandSheet = () => {
    setSheetExpanded(true);
    setSheetHalf(false);
    Animated.spring(sheetAnim, {
      toValue: SNAP_POINTS[2],
      useNativeDriver: false,
    }).start();
  };
  const halfSheet = () => {
    setSheetExpanded(false);
    setSheetHalf(true);
    Animated.spring(sheetAnim, {
      toValue: SNAP_POINTS[1],
      useNativeDriver: false,
    }).start();
  };
  const collapseSheet = () => {
    setSheetExpanded(false);
    setSheetHalf(false);
    Animated.spring(sheetAnim, {
      toValue: SNAP_POINTS[0],
      useNativeDriver: false,
    }).start();
  };

  const handleMapPress = (e) => {
    if (sheetExpanded || sheetHalf) collapseSheet();
  };

  const handleMarkerPress = (id, idx) => {
    setSelectedId(id);
    flatListRef.current?.scrollToIndex({ index: idx, animated: true });
    expandSheet();
  };

  const handleListingPress = (id, idx, lat, lng) => {
    setSelectedId(id);
    mapRef.current?.animateToRegion(
      {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      },
      350
    );
  };

  const handleShare = (item) => {
    const url = `https://stayfindz.com/listing/${item._id}`;
    Share.share({
      message: `Check out this stay: ${item.title} in ${item.location}\n${url}`,
      url,
      title: item.title,
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

  const renderItem = ({ item, index }) => (
    <View style={{ marginBottom: 20 }}>
      <View style={{ position: 'absolute', top: 12, left: 18, zIndex: 10 }}>
        <TouchableOpacity
          onPress={() => handleShare(item)}
          style={{ padding: 8, backgroundColor: '#fff', borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="share-2" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        activeOpacity={0.93}
        onPress={() =>
          handleListingPress(item._id, index, item.latitude, item.longitude)
        }
        style={{
          opacity: selectedId === item._id ? 1 : 0.92,
          borderRadius: 18,
          backgroundColor: "#fff",
          shadowColor: Platform.OS === "ios" ? "#000" : undefined,
          shadowOpacity: Platform.OS === "ios" ? 0.08 : 0,
          shadowRadius: Platform.OS === "ios" ? 8 : 0,
          shadowOffset: Platform.OS === "ios" ? { width: 0, height: 2 } : undefined,
          elevation: Platform.OS === "android" ? 0 : 3,
          borderWidth: 2,
          borderColor: selectedId === item._id ? COLORS.primary : "#eee",
        }}
      >
        <PostCard
          {...item}
          image={item.images?.[0]}
          onPress={() => navigation.navigate("ListingDetail", { id: item._id })}
          style={{
            backgroundColor: "transparent",
            borderWidth: 0,
            marginBottom: 0,
          }}
          wishlisted={wishlist.includes(item._id)}
          onToggleWishlist={() => toggleWishlist(item._id, true, () => setShowLoginPrompt(true))}
        />
      </TouchableOpacity>
    </View>
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search?.trim()) count++;
    if (filters.category && filters.category !== "all") count++;
    if (filters.minPrice) count++;
    if (filters.maxPrice) count++;
    if (filters.guests) count++;
    if (Array.isArray(filters.amenities) && filters.amenities.length > 0) count++;
    if (filters.sortBy && filters.sortBy !== "relevance") count++;
    return count;
  }, [filters]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title={location} onBack={() => navigation.goBack()} />
      {/* Map always visible, tap to collapse sheet */}
      <Pressable
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: height,
          zIndex: 0,
        }}
        onPress={handleMapPress}
      >
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={initialRegion}
          showsUserLocation={false}
          showsMyLocationButton={false}
          toolbarEnabled={false}
          zoomControlEnabled={Platform.OS === "android"}
          pitchEnabled={false}
          rotateEnabled={false}
          scrollEnabled
          loadingEnabled
        >
          {listings.map((item, idx) => (
            typeof item.latitude === 'number' &&
            typeof item.longitude === 'number' &&
            !isNaN(item.latitude) &&
            !isNaN(item.longitude) ? (
              <Marker
                key={item._id}
                coordinate={{
                  latitude: item.latitude,
                  longitude: item.longitude,
                }}
                pinColor={selectedId === item._id ? COLORS.primary : "#222"}
                onPress={() => handleMarkerPress(item._id, idx)}
                title={item.title}
                description={item.location}
              />
            ) : null
          ))}
        </MapView>
      </Pressable>
      {/* Draggable Listings Panel */}
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: sheetAnim,
          height: height,
          backgroundColor: COLORS.background,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
          elevation: 6,
          zIndex: 2,
        }}
      >
        {/* Drag Handle Area (now supports both tap and drag) */}
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 0,
            height: 40,
          }}
          {...panResponder.panHandlers}
        >
          <Pressable
            onPress={() => {
              if (sheetExpanded) {
                collapseSheet();
              } else {
                expandSheet();
              }
            }}
            style={{
              width: 60,
              height: 16,
              alignItems: "center",
              justifyContent: "center",
            }}
            android_ripple={{ color: "#eee" }}
          >
            <View
              style={{
                width: 60,
                height: 5,
                borderRadius: 3,
                backgroundColor: "#ccc",
                marginBottom: 4,
              }}
            />
          </Pressable>
        </View>
        {/* Title */}
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            color: COLORS.text,
            textAlign: "center",
            marginTop: 0,
            marginBottom: 8,
          }}
        >
          Stays in {location}
        </Text>
        {/* Search/Filter only when expanded */}
        {sheetExpanded && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginHorizontal: 18,
              marginBottom: 8,
            }}
          >
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#fff",
                borderRadius: 999,
                borderWidth: 1.5,
                borderColor: "#f3e8ff",
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
            >
              <Feather
                name="search"
                size={18}
                color={COLORS.textMuted}
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={{
                  flex: 1,
                  fontSize: 16,
                  color: COLORS.text,
                  backgroundColor: "transparent",
                  paddingVertical: 0,
                }}
                placeholder="Search by title, description, or location"
                placeholderTextColor={COLORS.textMuted}
                value={filters.search}
                onChangeText={text => setFilters(f => ({ ...f, search: text }))}
                returnKeyType="search"
              />
              {filters.search?.length > 0 && (
                <TouchableOpacity
                  onPress={() => setFilters(f => ({ ...f, search: "" }))}
                  style={{ padding: 4, marginLeft: 4 }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="x-circle" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            <View style={{ position: 'relative' }}>
              <TouchableOpacity
                style={{
                  marginLeft: 12,
                  backgroundColor: COLORS.primary,
                  borderRadius: 12,
                  padding: 10,
                }}
                onPress={() => setFilterModalVisible(true)}
                activeOpacity={0.85}
              >
                <Feather name="sliders" size={18} color="#fff" />
              </TouchableOpacity>
              {activeFilterCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    backgroundColor: COLORS.error || '#f43f5e',
                    borderRadius: 10,
                    minWidth: 18,
                    height: 18,
                    paddingHorizontal: 4,
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 10,
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>{activeFilterCount}</Text>
                </View>
              )}
            </View>
          </View>
        )}
        {/* Listings */}
        <FlatList
          ref={flatListRef}
          data={filteredListings}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{
            padding: 18,
            paddingTop: 0,
            paddingBottom: 32,
          }}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text
              style={{
                color: COLORS.textMuted,
                textAlign: "center",
                marginTop: 32,
              }}
            >
              No stays found in this destination.
            </Text>
          }
        />
      </Animated.View>
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        currentFilters={filters}
        onApply={(newFilters) => setFilters(newFilters)}
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
