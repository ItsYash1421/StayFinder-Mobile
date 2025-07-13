import React, { useState, useRef, useEffect, useContext } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { COLORS } from "../constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { Animated } from "react-native";
import { AuthContext } from "../context/AuthContext";

export default function HomePostCard({
  title = "Sample Property",
  location = "City, Country",
  price = "$100/night",
  image,
  style,
  onPress = () => {},
  bookingCount,
  views,
  rating,
  wishlisted = false,
  onToggleWishlist,
  listingId,
}) {
  const { user } = useContext(AuthContext);
  
  // Image loading state
  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const imageOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (imgError || imgLoading) {
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
  }, [imgError, imgLoading]);

  const handleImageLoadEnd = () => {
    setImgLoading(false);
    setTimeout(() => setShowPlaceholder(false), 10); // Hide placeholder just as fade-in starts
    Animated.timing(imageOpacity, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  };

  const handleWishlistPress = (e) => {
    e.stopPropagation();
    console.log("Wishlist button pressed for listing:", listingId);
    console.log("Current wishlisted state:", wishlisted);
    console.log("User logged in:", !!user);
    
    if (onToggleWishlist) {
      console.log("Calling onToggleWishlist");
      onToggleWishlist();
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={[styles.card, style]}
      onPress={onPress}
      onPressIn={(e) =>
        e.currentTarget.setNativeProps({
          style: { transform: [{ scale: 1.03 }] },
        })
      }
      onPressOut={(e) =>
        e.currentTarget.setNativeProps({ style: { transform: [{ scale: 1 }] } })
      }
    >
      <View style={styles.imageWrapper}>
        {showPlaceholder && (imgLoading && !imgError) && (
          <Animated.View
            style={[
              styles.image,
              placeholderContainer,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <Feather name="image" size={48} color={COLORS.primary} />
          </Animated.View>
        )}
        {!imgError && (
          <Animated.Image
            source={image ? { uri: image } : require("../assets/placeholder.png")}
            style={[styles.image, { opacity: imageOpacity }]}
            resizeMode="cover"
            onError={() => setImgError(true)}
            onLoadEnd={handleImageLoadEnd}
          />
        )}
        {imgError && (
          <Animated.View
            style={[
              styles.image,
              placeholderContainer,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <Feather name="image" size={48} color={COLORS.primary} />
          </Animated.View>
        )}
        <LinearGradient
          colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0.22)"]}
          style={styles.gradientOverlay}
          pointerEvents="none"
        />
        <TouchableOpacity
          style={styles.wishlistBtn}
          onPress={handleWishlistPress}
          activeOpacity={0.8}
        >
          <Feather
            name="heart"
            size={18}
            color={wishlisted ? COLORS.primary : "#fff"}
            style={{ 
              opacity: wishlisted ? 1 : 0.9,
              fontWeight: wishlisted ? "bold" : "normal"
            }}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View
          style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}
        >
          <Feather
            name="map-pin"
            size={15}
            color={COLORS.primary}
            style={{ marginRight: 4 }}
          />
          <Text style={styles.location} numberOfLines={1}>
            {location}
          </Text>
        </View>
        <Text style={styles.price}>{price}</Text>
        {(bookingCount !== undefined || views !== undefined || rating) && (
          <View style={styles.popularityInfo}>
            {bookingCount !== undefined && (
              <View style={styles.popularityItem}>
                <Feather name="calendar" size={12} color={COLORS.textMuted} />
                <Text style={styles.popularityText}>
                  {bookingCount} bookings
                </Text>
              </View>
            )}
            {views !== undefined && (
              <View style={styles.popularityItem}>
                <Feather name="eye" size={12} color={COLORS.textMuted} />
                <Text style={styles.popularityText}>{views} views</Text>
              </View>
            )}
            {rating && (
              <View style={styles.popularityItem}>
                <Feather name="star" size={12} color="#FFD700" />
                <Text style={styles.popularityText}>{rating}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.13,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    borderWidth: 2,
    borderColor: COLORS.primary + "22",
    width: 260,
    alignSelf: "center",
  },
  imageWrapper: {
    width: "100%",
    height: 140,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.border,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    zIndex: 1,
  },
  info: {
    padding: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 2,
  },
  location: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 0,
    flexShrink: 1,
  },
  price: {
    fontSize: 16,
    color: COLORS.primary,
    marginTop: 8,
    fontWeight: "600",
  },
  popularityInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 8,
  },
  popularityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  popularityText: {
    fontSize: 12,
    color: COLORS.textMuted,
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
});

const placeholderContainer = {
  backgroundColor: 'transparent',
  alignItems: 'center',
  justifyContent: 'center',
  borderTopLeftRadius: 18,
  borderTopRightRadius: 18,
  width: '100%',
  height: '100%',
  position: 'absolute',
  left: 0,
  top: 0,
  zIndex: 2,
};
