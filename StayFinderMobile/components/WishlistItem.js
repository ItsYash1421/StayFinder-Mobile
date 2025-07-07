import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { COLORS } from "../constants/theme";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import useWishlist from '../hooks/useWishlist';

const { width } = Dimensions.get("window");

export default function WishlistItem({ listing, onPress }) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const [placeholderOpacity] = useState(new Animated.Value(1));
  const { toggleWishlist, wishlist } = useWishlist();

  useEffect(() => {
    if (imageError || imageLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [imageError, imageLoading]);

  const handleImageLoadEnd = () => {
    setImageLoading(false);
    Animated.timing(imageOpacity, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
    Animated.timing(placeholderOpacity, {
      toValue: 0,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const getAmenityIcon = (amenity) => {
    switch (amenity) {
      case "wifi":
        return "wifi";
      case "kitchen":
        return "coffee";
      case "parking":
        return "map-pin";
      case "tv":
        return "tv";
      case "fireplace":
        return "zap";
      case "heating":
        return "thermometer";
      default:
        return "check";
    }
  };

  const availableAmenities = Object.entries(listing.amenities || {})
    .filter(([_, value]) => value)
    .map(([key, _]) => key)
    .slice(0, 4); // Show max 4 amenities

  const wishlisted = wishlist.includes(listing._id);

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.9}
      onPress={() => onPress(listing._id)}
    >
      {/* Image Section */}
      <View style={styles.imageContainer}>
        {!imageError && (
          <Animated.Image
            source={{ uri: listing.images?.[0] || "https://via.placeholder.com/300x200" }}
            style={[styles.image, { opacity: imageOpacity, zIndex: 1 }]}
            resizeMode="cover"
            onError={() => {
              setImageError(true);
              placeholderOpacity.setValue(1);
            }}
            onLoadEnd={handleImageLoadEnd}
          />
        )}
        <Animated.View
          style={[
            styles.image,
            styles.placeholderContainer,
            { transform: [{ scale: pulseAnim }], zIndex: 2, opacity: placeholderOpacity },
          ]}
        >
          <Feather name="image" size={48} color={COLORS.primary} />
        </Animated.View>

        {/* Rating Badge */}
        <View style={styles.ratingBadge}>
          <Feather name="star" size={12} color="#FFD700" />
          <Text style={styles.ratingText}>{listing.rating || "New"}</Text>
        </View>

        {/* Heart Toggle Button */}
        <TouchableOpacity
          style={styles.wishlistBtn}
          onPress={() => toggleWishlist(listing._id, true)}
          activeOpacity={0.8}
        >
          <Feather
            name="heart"
            size={18}
            color={wishlisted ? COLORS.primary : "#fff"}
            style={{ opacity: wishlisted ? 1 : 0.9 }}
          />
        </TouchableOpacity>

        {/* Gradient Overlay */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.1)"]}
          style={styles.gradient}
          pointerEvents="none"
        />
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        {/* Title and Location */}
        <Text style={styles.title} numberOfLines={1}>
          {listing.title}
        </Text>

        <View style={styles.locationContainer}>
          <Feather name="map-pin" size={14} color={COLORS.textMuted} />
          <Text style={styles.location} numberOfLines={1}>
            {listing.location}
          </Text>
        </View>

        {/* Basic Info */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Feather name="users" size={14} color={COLORS.textMuted} />
            <Text style={styles.infoText}>{listing.guests} guests</Text>
          </View>
          <View style={styles.infoItem}>
            <Feather name="home" size={14} color={COLORS.textMuted} />
            <Text style={styles.infoText}>{listing.bedrooms} beds</Text>
          </View>
          <View style={styles.infoItem}>
            <Feather name="droplet" size={14} color={COLORS.textMuted} />
            <Text style={styles.infoText}>{listing.bathrooms} baths</Text>
          </View>
        </View>

        {/* Amenities */}
        {availableAmenities.length > 0 && (
          <View style={styles.amenitiesContainer}>
            {availableAmenities.map((amenity, index) => (
              <View key={index} style={styles.amenityChip}>
                <Feather
                  name={getAmenityIcon(amenity)}
                  size={12}
                  color={COLORS.primary}
                />
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Price */}
        <View style={styles.priceContainer}>
          <Text style={styles.price}>${listing.price?.toLocaleString()}</Text>
          <Text style={styles.priceUnit}>/ night</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  imageContainer: {
    position: "relative",
    height: 200,
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.border,
  },
  placeholderContainer: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 2,
  },
  ratingBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
    marginLeft: 4,
  },
  wishlistBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 16,
    padding: 8,
    zIndex: 3,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  location: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginLeft: 4,
    flex: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  amenitiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  amenityChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary + "15",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  amenityText: {
    fontSize: 11,
    color: COLORS.primary,
    marginLeft: 4,
    textTransform: "capitalize",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  price: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  priceUnit: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
});
