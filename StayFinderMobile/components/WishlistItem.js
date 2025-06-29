import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { COLORS } from '../constants/theme';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function WishlistItem({ listing, onRemove, onPress }) {
  const getAmenityIcon = (amenity) => {
    switch (amenity) {
      case 'wifi':
        return 'wifi';
      case 'kitchen':
        return 'coffee';
      case 'parking':
        return 'map-pin';
      case 'tv':
        return 'tv';
      case 'fireplace':
        return 'zap';
      case 'heating':
        return 'thermometer';
      default:
        return 'check';
    }
  };

  const availableAmenities = Object.entries(listing.amenities || {})
    .filter(([_, value]) => value)
    .map(([key, _]) => key)
    .slice(0, 4); // Show max 4 amenities

  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={0.9}
      onPress={() => onPress(listing._id)}
    >
      {/* Image Section */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: listing.images?.[0] || 'https://via.placeholder.com/300x200' }} 
          style={styles.image}
          resizeMode="cover"
        />
        
        {/* Rating Badge */}
        <View style={styles.ratingBadge}>
          <Feather name="star" size={12} color="#FFD700" />
          <Text style={styles.ratingText}>{listing.rating || 'New'}</Text>
        </View>

        {/* Remove Button */}
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => onRemove(listing._id)}
          activeOpacity={0.8}
        >
          <Feather name="heart" size={18} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.1)']}
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
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 4,
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  gradient: {
    position: 'absolute',
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
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  location: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginLeft: 4,
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
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
    textTransform: 'capitalize',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  priceUnit: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
}); 