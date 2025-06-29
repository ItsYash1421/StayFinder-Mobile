import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';

const DESTINATIONS = [
  {
    image:
      'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    title: 'Beach Getaways',
    count: '1,200+ properties',
    category: 'Beach',
  },
  {
    image:
      'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    title: 'Mountain Retreats',
    count: '850+ properties',
    category: 'Mountain',
  },
  {
    image:
      'https://images.unsplash.com/photo-1496568816309-51d7c20e3b21?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    title: 'Urban Escapes',
    count: '2,300+ properties',
    category: 'City',
  },
];

export default function DestinationHighlights() {
  const navigation = useNavigation();

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Trending <Text style={{ color: COLORS.primary }}>Destinations</Text></Text>
      <Text style={styles.subtitle}>Discover stays in the world's most sought-after locations</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsRow}>
        {DESTINATIONS.map((dest, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Explore', { category: dest.category })}
            onPressIn={e => e.currentTarget.setNativeProps({ style: { transform: [{ scale: 1.04 }] } })}
            onPressOut={e => e.currentTarget.setNativeProps({ style: { transform: [{ scale: 1 }] } })}
          >
            <Image source={{ uri: dest.image }} style={styles.image} />
            <LinearGradient
              colors={[ 'rgba(0,0,0,0.10)', 'rgba(0,0,0,0.45)' ]}
              style={styles.gradientOverlay}
              pointerEvents="none"
            />
            <View style={styles.cardBorder} pointerEvents="none" />
            <BlurView intensity={35} tint="dark" style={styles.glassContent}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="map-pin" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={styles.cardTitle}>{dest.title}</Text>
              </View>
              <Text style={styles.cardCount}>{dest.count}</Text>
            </BlurView>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingVertical: 28,
    paddingHorizontal: 0,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 20,
    marginBottom: 4,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 15,
    marginLeft: 20,
    marginBottom: 16,
  },
  cardsRow: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  card: {
    width: 260,
    height: 160,
    borderRadius: 22,
    marginRight: 16,
    overflow: 'hidden',
    backgroundColor: '#eee',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.13,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 2,
    borderColor: COLORS.primary + '22',
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.primary + '33',
    zIndex: 2,
  },
  glassContent: {
    position: 'absolute',
    bottom: 16,
    left: 14,
    right: 14,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(30,30,40,0.22)',
    zIndex: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.primary + '22',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  cardCount: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.95,
    marginTop: 2,
  },
}); 