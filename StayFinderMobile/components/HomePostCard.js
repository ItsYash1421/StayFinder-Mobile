import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { COLORS } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

export default function HomePostCard({ 
  title = 'Sample Property', 
  location = 'City, Country', 
  price = '$100/night', 
  image, 
  style, 
  onPress = () => {},
  bookingCount,
  views,
  rating
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={[styles.card, style]}
      onPress={onPress}
      onPressIn={e => e.currentTarget.setNativeProps({ style: { transform: [{ scale: 1.03 }] } })}
      onPressOut={e => e.currentTarget.setNativeProps({ style: { transform: [{ scale: 1 }] } })}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={image ? { uri: image } : require('../assets/placeholder.png')}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={[ 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.22)' ]}
          style={styles.gradientOverlay}
          pointerEvents="none"
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
          <Feather name="map-pin" size={15} color={COLORS.primary} style={{ marginRight: 4 }} />
          <Text style={styles.location} numberOfLines={1}>{location}</Text>
        </View>
        <Text style={styles.price}>{price}</Text>
        {(bookingCount !== undefined || views !== undefined || rating) && (
          <View style={styles.popularityInfo}>
            {bookingCount !== undefined && (
              <View style={styles.popularityItem}>
                <Feather name="calendar" size={12} color={COLORS.textMuted} />
                <Text style={styles.popularityText}>{bookingCount} bookings</Text>
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
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.13,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    borderWidth: 2,
    borderColor: COLORS.primary + '22',
    width: 260,
    alignSelf: 'center',
  },
  imageWrapper: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
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
    fontWeight: 'bold',
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
    fontWeight: '600',
  },
  popularityInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  popularityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  popularityText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
}); 