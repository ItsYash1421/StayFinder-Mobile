import React, { useContext, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
} from "react-native";
import {
  COLORS,
  getResponsiveSize,
  FONT_SIZES,
  CARD_DIMENSIONS,
  getShadow,
} from "../constants/theme";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { AuthContext } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";

export default function PostCard({
  title,
  location,
  price,
  image,
  rating,
  guests,
  bedrooms,
  bathrooms,
  amenities,
  wishlisted = false,
  onToggleWishlist,
  onPress,
  style,
}) {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();

  // Image loading state
  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const [placeholderOpacity] = useState(new Animated.Value(1));

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

  const handleWishlistPress = (e) => {
    e.stopPropagation();
    onToggleWishlist();
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        style,
        Platform.OS === "android"
          ? {
              elevation: 0,
              shadowColor: undefined,
              shadowOpacity: 0,
              shadowRadius: 0,
              shadowOffset: undefined,
              borderWidth: 1,
              borderColor: '#eee',
            }
          : {},
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.imageWrapper}>
        {!imgError && (
          <Animated.Image
            source={{ uri: image }}
            style={[styles.image, { opacity: imageOpacity, zIndex: 1 }]}
            resizeMode="cover"
            onError={() => {
              setImgError(true);
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
        {/* Gradient overlay for text readability (iOS only) */}
        {Platform.OS === "ios" && (
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.3)"]}
            style={styles.gradientOverlay}
          />
        )}
        <TouchableOpacity
          style={styles.wishlistBtn}
          onPress={handleWishlistPress}
          activeOpacity={0.8}
        >
          <Feather
            name={wishlisted ? "heart" : "heart"}
            size={getResponsiveSize(16, 18, 20, 22)}
            color={wishlisted ? COLORS.primary : "#fff"}
            style={{ opacity: wishlisted ? 1 : 0.7 }}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <View style={styles.rowBetween}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.ratingBox}>
            <Feather
              name="star"
              size={getResponsiveSize(12, 14, 16, 18)}
              color={COLORS.primary}
            />
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
        </View>

        <Text style={styles.location} numberOfLines={1}>
          <Feather name="map-pin" size={getResponsiveSize(13, 14, 15, 16)} color={COLORS.textMuted} style={{ marginRight: 4 }} />
          {location}
        </Text>

        {amenities && (
          <View style={styles.amenitiesRow}>
            {amenities.wifi && (
              <Feather
                name="wifi"
                size={getResponsiveSize(12, 14, 16, 18)}
                color={COLORS.textMuted}
              />
            )}
            {amenities.kitchen && (
              <Feather
                name="coffee"
                size={getResponsiveSize(12, 14, 16, 18)}
                color={COLORS.textMuted}
              />
            )}
            {amenities.parking && (
              <Feather
                name="car"
                size={getResponsiveSize(12, 14, 16, 18)}
                color={COLORS.textMuted}
              />
            )}
            {amenities.tv && (
              <Feather
                name="tv"
                size={getResponsiveSize(12, 14, 16, 18)}
                color={COLORS.textMuted}
              />
            )}
          </View>
        )}

        <View style={styles.capacityRow}>
          <View style={styles.capItem}>
            <Feather
              name="users"
              size={getResponsiveSize(12, 14, 16, 18)}
              color={COLORS.textMuted}
            />
            <Text style={styles.capText}>{guests} guests</Text>
          </View>
          <View style={styles.capItem}>
            <Feather
              name="home"
              size={getResponsiveSize(12, 14, 16, 18)}
              color={COLORS.textMuted}
            />
            <Text style={styles.capText}>{bedrooms} bed</Text>
          </View>
          <View style={styles.capItem}>
            <Feather
              name="droplet"
              size={getResponsiveSize(12, 14, 16, 18)}
              color={COLORS.textMuted}
            />
            <Text style={styles.capText}>{bathrooms} bath</Text>
          </View>
        </View>

        <Text style={styles.price}>
          ${price}
          <Text style={styles.priceLabel}>/per night</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: getResponsiveSize(16, 18, 20, 24),
    overflow: "hidden",
    marginBottom: getResponsiveSize(12, 14, 16, 18),
    ...getShadow("md"),
    borderWidth: 2,
    borderColor: COLORS.primary + "22",
    width: "98%",
    maxWidth: getResponsiveSize(380, 400, 420, 480),
    alignSelf: "center",
  },
  imageWrapper: {
    width: "100%",
    height: getResponsiveSize(180, 190, 200, 220),
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.border,
    borderTopLeftRadius: getResponsiveSize(16, 18, 20, 24),
    borderTopRightRadius: getResponsiveSize(16, 18, 20, 24),
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: getResponsiveSize(16, 18, 20, 24),
    borderTopRightRadius: getResponsiveSize(16, 18, 20, 24),
    zIndex: 1,
  },
  info: {
    padding: getResponsiveSize(12, 14, 16, 18),
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: getResponsiveSize(2, 3, 4, 5),
    flex: 1,
    marginRight: getResponsiveSize(6, 8, 10, 12),
  },
  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary + "11",
    borderRadius: getResponsiveSize(6, 8, 10, 12),
    paddingHorizontal: getResponsiveSize(4, 6, 8, 10),
    paddingVertical: getResponsiveSize(2, 3, 4, 5),
  },
  ratingText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: getResponsiveSize(11, 12, 13, 14),
    marginLeft: getResponsiveSize(2, 3, 4, 5),
  },
  location: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: getResponsiveSize(2, 3, 4, 5),
    flexShrink: 1,
  },
  amenitiesRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: getResponsiveSize(4, 6, 8, 10),
    gap: getResponsiveSize(6, 8, 10, 12),
  },
  capacityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: getResponsiveSize(8, 10, 12, 14),
    gap: getResponsiveSize(12, 14, 16, 18),
  },
  capItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: getResponsiveSize(8, 10, 12, 14),
  },
  capText: {
    color: COLORS.textMuted,
    fontSize: getResponsiveSize(11, 12, 13, 14),
    marginLeft: getResponsiveSize(2, 3, 4, 5),
  },
  priceLabel: {
    color: COLORS.textMuted,
    fontSize: getResponsiveSize(10, 11, 12, 13),
    marginTop: getResponsiveSize(8, 10, 12, 14),
  },
  price: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "bold",
    color: COLORS.primary,
    marginTop: getResponsiveSize(10, 12, 14, 16),
  },
  wishlistBtn: {
    position: "absolute",
    top: getResponsiveSize(8, 10, 12, 14),
    right: getResponsiveSize(8, 10, 12, 14),
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: getResponsiveSize(16, 18, 20, 22),
    padding: getResponsiveSize(6, 8, 10, 12),
    zIndex: 2,
  },
  placeholderContainer: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: getResponsiveSize(16, 18, 20, 24),
    borderTopRightRadius: getResponsiveSize(16, 18, 20, 24),
    width: '100%',
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 2,
  },
});
