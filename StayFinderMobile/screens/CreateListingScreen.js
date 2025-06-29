import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { COLORS, getResponsiveSize, FONT_SIZES, SPACING, BORDER_RADIUS, getShadow } from '../constants/theme';
import { Feather } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { api } from '../constants/api';
import AppHeader from '../components/AppHeader';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';

const categories = [
  'Beach',
  'Mountain',
  'City',
  'Countryside',
  'Luxury',
  'Budget',
  'Historical',
  'Adventure',
];

const defaultAmenities = {
  wifi: false,
  kitchen: false,
  parking: false,
  tv: false,
  fireplace: false,
  balcony: false,
  heating: false,
  bbq: false,
};

const defaultHouseRules = {
  smoking: false,
  pets: false,
  parties: false,
  checkInTime: '15:00',
  checkOutTime: '11:00',
};

export default function CreateListingScreen({ navigation }) {
  const { token, user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    latitude: '',
    longitude: '',
    price: '',
    guests: '',
    category: '',
    bedrooms: '',
    bathrooms: '',
    amenities: { ...defaultAmenities },
    houseRules: { ...defaultHouseRules },
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState(1);
  const totalPhases = 5;
  const pickerRef = React.useRef(null);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAmenityToggle = (key) => {
    setFormData({
      ...formData,
      amenities: { ...formData.amenities, [key]: !formData.amenities[key] },
    });
  };

  const handleHouseRuleToggle = (key) => {
    setFormData({
      ...formData,
      houseRules: { ...formData.houseRules, [key]: !formData.houseRules[key] },
    });
  };

  const handleImagePick = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit reached', 'You can upload a maximum of 5 images.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: 5 - images.length,
      aspect: [4, 3],
      allowsEditing: false,
    });
    if (!result.canceled) {
      const newImages = result.assets.map((asset) => ({ uri: asset.uri }));
      setImages([...images, ...newImages].slice(0, 5));
    }
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    
    // Check if user is logged in
    if (!user || !user._id) {
      setError('User not authenticated. Please log in again.');
      setLoading(false);
      return;
    }
    
    console.log('=== MOBILE APP DEBUG ===');
    console.log('User data:', user);
    console.log('User ID:', user._id);
    console.log('Token:', token);
    
    // Validation
    if (!formData.title || !formData.description || !formData.location || !formData.price || !formData.guests || !formData.category || !formData.bedrooms || !formData.bathrooms) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }
    if (images.length === 0) {
      setError('Please upload at least one image.');
      setLoading(false);
      return;
    }
    try {
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach((key) => {
        if (key === 'amenities' || key === 'houseRules') {
          Object.keys(formData[key]).forEach((subKey) => {
            formDataToSend.append(`${key}.${subKey}`, formData[key][subKey]);
          });
        } else if ((key === 'latitude' || key === 'longitude') && formData[key] === '') {
          // skip empty latitude/longitude
          return;
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Add images
      images.forEach((img, idx) => {
        formDataToSend.append('images', {
          uri: img.uri,
          name: `image${idx}.jpg`,
          type: 'image/jpeg',
        });
      });
      
      // Add hostId - this is what the backend expects
      formDataToSend.append('hostId', user._id);
      
      console.log('FormData entries:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`${key}:`, value);
      }
      
      console.log('Sending hostId:', user._id); // Debug log
      
      const response = await api.post('/api/listings/create-listing', formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes timeout for image uploads
      });
      
      if (response.data.success) {
        Alert.alert('Success', 'Listing created successfully!');
        setFormData({
          title: '',
          description: '',
          location: '',
          latitude: '',
          longitude: '',
          price: '',
          guests: '',
          category: '',
          bedrooms: '',
          bathrooms: '',
          amenities: { ...defaultAmenities },
          houseRules: { ...defaultHouseRules },
        });
        setImages([]);
        setTimeout(() => { navigation.navigate('HostMain'); }, 400);
      } else {
        setError(response.data.message || 'Failed to create listing');
      }
    } catch (err) {
      console.error('Error creating listing:', err);
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        setError('Upload timed out. Please check your internet connection and try again with fewer or smaller images.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to create listing. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 1. Header section improvements
  <View style={styles.headerSection}>
    <Text style={styles.title}>Create New Listing</Text>
    <Text style={styles.subtitle}>Fill out the form below to list your property on StayFinder</Text>
    <View style={styles.headerDivider} />
  </View>

  // 2. Stepper improvements
  const stepIcons = [
    'edit-3', // Details
    'map-pin', // Location
    'home', // Specs
    'grid', // Amenities
    'settings', // Rules
  ];
  const stepLabels = [
    'Details',
    'Location',
    'Specs',
    'Amenities',
    'Rules'
  ];

  return (
    <View style={styles.container}>
      <AppHeader title="Create Listing" />
      <View style={{ height: 90 }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 24, alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={styles.title}>Create New Listing</Text>
          <Text style={styles.subtitle}>Fill out the form below to list your property on StayFinder</Text>
          <View style={styles.headerDivider} />
        </View>
        <View style={styles.premiumStepperContainer}>
          <View style={styles.premiumStepperRow}>
            {[1,2,3,4,5].map((num, idx) => {
              const isCompleted = phase > idx + 1;
              const isActive = phase === idx + 1;
              return (
                <React.Fragment key={num}>
                  <View style={styles.premiumStepperItem}>
                    <View style={[
                      styles.premiumStepperCircle,
                      isCompleted && styles.premiumStepperCircleCompleted,
                      isActive && styles.premiumStepperCircleActive,
                      isActive && styles.premiumStepperCircleShadow,
                    ]}>
                      <Text style={[
                        styles.premiumStepperNumber,
                        isActive && styles.premiumStepperNumberActive,
                        isCompleted && styles.premiumStepperNumberCompleted
                      ]}>{num}</Text>
                    </View>
                  </View>
                  {idx < 4 && (
                    <View style={[
                      styles.premiumStepperLine,
                      isCompleted && styles.premiumStepperLineCompleted,
                      isActive && styles.premiumStepperLineActive
                    ]} />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>
        {phase === 1 && (
          <View style={styles.phaseCard}>
            <Text style={styles.phaseTitle}>Property Details</Text>
            {/* Title */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Property Title *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => handleChange('title', text)}
                placeholder="Cozy Mountain Cabin, Beachfront Villa, etc."
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
            {/* Description */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => handleChange('description', text)}
                placeholder="Describe your property in detail..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            {/* Images */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Property Images</Text>
              <Text style={styles.sectionSubtitle}>Upload up to 5 images</Text>
              <View style={styles.imagesRow}>
                {images.map((img, idx) => (
                  <View key={idx} style={styles.imagePreviewContainer}>
                    <Image source={{ uri: img.uri }} style={styles.imagePreview} />
                    <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(idx)}>
                      <Feather name="x" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                {images.length < 5 && (
                  <TouchableOpacity style={styles.addImageBtn} onPress={handleImagePick}>
                    <Feather name="upload" size={28} color={COLORS.primary} />
                    <Text style={styles.addImageText}>Add Image</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}
        {phase === 2 && (
          <View style={styles.phaseCard}>
            <Text style={styles.phaseTitle}>Location & Category</Text>
            <Text style={styles.phaseSubtitle}>Where is your property located?</Text>
            <View style={styles.cardDivider} />
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Location *</Text>
              <View style={styles.inputWithIcon}>
                <Feather name="map-pin" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.inputDense}
                  value={formData.location}
                  onChangeText={(text) => handleChange('location', text)}
                  placeholder="City, State or City, Country"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Category *</Text>
              <View style={styles.categoryChipsGrid}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChipGrid, formData.category === cat && styles.categoryChipSelected]}
                    onPress={() => handleChange('category', cat)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.categoryChipText, formData.category === cat && styles.categoryChipTextSelected]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
        {phase === 3 && (
          <View style={styles.phaseCard}>
            <Text style={styles.phaseTitle}>Property Specs</Text>
            <Text style={styles.phaseSubtitle}>Tell us about your property's size and price</Text>
            <View style={styles.cardDivider} />
            <View style={styles.rowDense}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}> 
                <Text style={styles.label}>Price per night ($) *</Text>
                <View style={styles.inputWithIcon}>
                  <Feather name="dollar-sign" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.inputDense}
                    value={formData.price}
                    onChangeText={(text) => handleChange('price', text)}
                    placeholder="$"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}> 
                <Text style={styles.label}>Bedrooms *</Text>
                <View style={styles.inputWithIcon}>
                  <Feather name="home" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.inputDense}
                    value={formData.bedrooms}
                    onChangeText={(text) => handleChange('bedrooms', text)}
                    placeholder="Number"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
            <View style={styles.rowDense}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}> 
                <Text style={styles.label}>Bathrooms *</Text>
                <View style={styles.inputWithIcon}>
                  <Feather name="droplet" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.inputDense}
                    value={formData.bathrooms}
                    onChangeText={(text) => handleChange('bathrooms', text)}
                    placeholder="Number"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}> 
                <Text style={styles.label}>Max Guests *</Text>
                <View style={styles.inputWithIcon}>
                  <Feather name="users" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.inputDense}
                    value={formData.guests}
                    onChangeText={(text) => handleChange('guests', text)}
                    placeholder="Number"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          </View>
        )}
        {phase === 4 && (
          <View style={styles.phaseCard}>
            <Text style={styles.phaseTitle}>Amenities</Text>
            <Text style={styles.phaseSubtitle}>Select all amenities your property offers</Text>
            <View style={styles.cardDivider} />
            <View style={styles.amenitiesRowDense}>
              {Object.keys(defaultAmenities).map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.amenityChipDense, formData.amenities[key] && styles.amenityChipSelectedDense]}
                  onPress={() => handleAmenityToggle(key)}
                  activeOpacity={0.8}
                >
                  <Feather name={key === 'wifi' ? 'wifi' : key === 'kitchen' ? 'coffee' : key === 'parking' ? 'map-pin' : key === 'tv' ? 'tv' : key === 'fireplace' ? 'zap' : key === 'balcony' ? 'home' : key === 'heating' ? 'thermometer' : key === 'bbq' ? 'sun' : 'check'} size={18} color={formData.amenities[key] ? COLORS.primary : COLORS.textMuted} />
                  <Text style={[styles.amenityTextDense, formData.amenities[key] && styles.amenityTextSelectedDense]}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        {phase === 5 && (
          <View style={styles.phaseCard}>
            <Text style={styles.phaseTitle}>House Rules & Timing</Text>
            <Text style={styles.phaseSubtitle}>Set your house rules and check-in/out times</Text>
            <View style={styles.cardDivider} />
            <View style={styles.amenitiesRowDense}>
              {['smoking', 'pets', 'parties'].map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.amenityChipDense, formData.houseRules[key] && styles.amenityChipSelectedDense]}
                  onPress={() => handleHouseRuleToggle(key)}
                  activeOpacity={0.8}
                >
                  <Feather name={key === 'smoking' ? 'slash' : key === 'pets' ? 'heart' : key === 'parties' ? 'users' : 'check'} size={18} color={formData.houseRules[key] ? COLORS.primary : COLORS.textMuted} />
                  <Text style={[styles.amenityTextDense, formData.houseRules[key] && styles.amenityTextSelectedDense]}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.rowDense}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}> 
                <Text style={styles.label}>Check-in Time</Text>
                <View style={styles.inputWithIcon}>
                  <Feather name="clock" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.inputDense}
                    value={formData.houseRules.checkInTime}
                    onChangeText={(text) => setFormData({ ...formData, houseRules: { ...formData.houseRules, checkInTime: text } })}
                    placeholder="15:00"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              </View>
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}> 
                <Text style={styles.label}>Check-out Time</Text>
                <View style={styles.inputWithIcon}>
                  <Feather name="clock" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.inputDense}
                    value={formData.houseRules.checkOutTime}
                    onChangeText={(text) => setFormData({ ...formData, houseRules: { ...formData.houseRules, checkOutTime: text } })}
                    placeholder="11:00"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
      {/* Sticky/floating Next button */}
      <View style={styles.stickyNav}>
        <View style={styles.stickyNavRow}>
          {/* Cancel button (always left, text only) */}
          <TouchableOpacity
            style={({ pressed }) => [
              styles.cancelBtn,
              pressed && styles.cancelBtnPressed
            ]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <View style={styles.cancelBtnContent}>
              <Feather name="x" size={18} color="#ff385c" style={{ marginRight: 4 }} />
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </View>
          </TouchableOpacity>
          {/* Back button (not on step 1) */}
          {phase > 1 && (
            <TouchableOpacity style={styles.phaseNavBtn} onPress={() => setPhase(phase - 1)}>
              <Text style={styles.phaseNavBtnText}>Back</Text>
            </TouchableOpacity>
          )}
          {/* Next or Submit button (right, primary) */}
          {phase < totalPhases ? (
            <TouchableOpacity style={styles.phaseNavBtnPrimary} onPress={() => setPhase(phase + 1)}>
              <Text style={styles.phaseNavBtnPrimaryText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.phaseNavBtnPrimary, loading && styles.phaseNavBtnDisabled]} 
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.phaseNavBtnPrimaryText}>Uploading...</Text>
                </View>
              ) : (
                <Text style={styles.phaseNavBtnPrimaryText}>Submit</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: getResponsiveSize(30, 35, 40, 45),
  },
  title: {
    fontSize: FONT_SIZES['4xl'],
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: getResponsiveSize(6, 8, 10, 12),
    marginBottom: getResponsiveSize(4, 6, 8, 10),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textMuted,
    fontWeight: '400',
    marginBottom: getResponsiveSize(16, 18, 20, 24),
    textAlign: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginTop: getResponsiveSize(16, 18, 20, 24),
    marginBottom: getResponsiveSize(16, 18, 20, 24),
  },
  headerDivider: {
    height: getResponsiveSize(1, 1.5, 2, 2.5),
    backgroundColor: '#ececec',
    width: '80%',
    alignSelf: 'center',
    marginTop: getResponsiveSize(2, 3, 4, 5),
    marginBottom: getResponsiveSize(6, 8, 10, 12),
    borderRadius: 1,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: BORDER_RADIUS.lg,
    padding: getResponsiveSize(18, 20, 22, 24),
    marginHorizontal: getResponsiveSize(18, 20, 22, 24),
    marginTop: getResponsiveSize(6, 8, 10, 12),
    ...getShadow('sm'),
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: getResponsiveSize(10, 12, 14, 16),
    marginBottom: getResponsiveSize(18, 20, 22, 24),
  },
  errorText: {
    color: '#dc2626',
    fontSize: FONT_SIZES.sm,
    marginLeft: getResponsiveSize(6, 8, 10, 12),
    flex: 1,
  },
  inputContainer: {
    marginBottom: getResponsiveSize(16, 18, 20, 24),
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: getResponsiveSize(6, 8, 10, 12),
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: getResponsiveSize(1, 1.5, 2, 2.5),
    borderColor: '#e5e7eb',
    paddingHorizontal: getResponsiveSize(14, 16, 18, 20),
    paddingVertical: getResponsiveSize(12, 14, 16, 18),
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    marginBottom: getResponsiveSize(8, 10, 12, 14),
    width: '100%',
    maxWidth: getResponsiveSize(320, 340, 360, 400),
    alignSelf: 'center',
  },
  textArea: {
    minHeight: getResponsiveSize(80, 90, 100, 110),
    maxHeight: getResponsiveSize(160, 170, 180, 190),
  },
  row: {
    flexDirection: 'row',
    marginBottom: getResponsiveSize(16, 18, 20, 24),
  },
  pickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f8fa',
    borderRadius: getResponsiveSize(8, 10, 12, 14),
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: getResponsiveSize(6, 8, 10, 12),
    paddingVertical: getResponsiveSize(2, 3, 4, 5),
    minHeight: getResponsiveSize(32, 34, 36, 38),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    marginTop: 2,
  },
  pickerSmall: {
    flex: 1,
    height: getResponsiveSize(28, 30, 32, 34),
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    backgroundColor: 'transparent',
    marginLeft: 0,
    marginRight: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  sectionContainer: {
    marginBottom: getResponsiveSize(16, 18, 20, 24),
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: getResponsiveSize(6, 8, 10, 12),
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginBottom: getResponsiveSize(6, 8, 10, 12),
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsiveSize(6, 8, 10, 12),
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: getResponsiveSize(8, 10, 12, 14),
    paddingVertical: getResponsiveSize(4, 6, 8, 10),
    marginRight: getResponsiveSize(6, 8, 10, 12),
    marginBottom: getResponsiveSize(6, 8, 10, 12),
  },
  amenityChipSelected: {
    backgroundColor: COLORS.primary + '11',
    borderColor: COLORS.primary,
  },
  amenityText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginLeft: getResponsiveSize(4, 6, 8, 10),
    textTransform: 'capitalize',
  },
  amenityTextSelected: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  imagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: getResponsiveSize(8, 10, 12, 14),
    width: '100%',
    maxWidth: getResponsiveSize(320, 340, 360, 400),
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: getResponsiveSize(8, 10, 12, 14),
  },
  imagePreview: {
    width: getResponsiveSize(80, 90, 100, 110),
    height: getResponsiveSize(80, 90, 100, 110),
    borderRadius: BORDER_RADIUS.md,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -getResponsiveSize(4, 6, 8, 10),
    right: -getResponsiveSize(4, 6, 8, 10),
    backgroundColor: '#ef4444',
    borderRadius: getResponsiveSize(10, 12, 14, 16),
    width: getResponsiveSize(20, 22, 24, 26),
    height: getResponsiveSize(20, 22, 24, 26),
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageBtn: {
    width: getResponsiveSize(80, 90, 100, 110),
    height: getResponsiveSize(80, 90, 100, 110),
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '08',
  },
  addImageText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.xs,
    marginTop: getResponsiveSize(2, 3, 4, 5),
    textAlign: 'center',
  },
  phaseCard: {
    backgroundColor: '#fff',
    borderRadius: BORDER_RADIUS.lg,
    padding: getResponsiveSize(20, 22, 24, 28),
    marginHorizontal: getResponsiveSize(16, 18, 20, 24),
    marginBottom: getResponsiveSize(16, 18, 20, 24),
    ...getShadow('sm'),
    width: getResponsiveSize(320, 340, 360, 400),
    alignSelf: 'center',
  },
  phaseTitle: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: getResponsiveSize(16, 18, 20, 24),
    textAlign: 'center',
  },
  phaseNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelBtn: {
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 22,
    marginRight: 4,
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#ff385c',
    shadowColor: '#ff385c',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cancelBtnPressed: {
    backgroundColor: '#ffe4ec',
  },
  cancelBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#ff385c',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.2,
  },
  phaseNavBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    paddingVertical: 16,
    alignItems: 'center',
    minWidth: 90,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  phaseNavBtnText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 16,
  },
  phaseNavBtnPrimary: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    minWidth: 90,
    marginHorizontal: 0,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
    transform: [{ scale: 1 }],
  },
  phaseNavBtnPrimaryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stickyNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fafbfcEE',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
    zIndex: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 18,
  },
  stickyNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  premiumStepperContainer: {
    marginBottom: getResponsiveSize(24, 28, 32, 36),
    width: getResponsiveSize(320, 340, 360, 400),
    alignSelf: 'center',
  },
  premiumStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  premiumStepperItem: {
    alignItems: 'center',
    width: getResponsiveSize(40, 44, 48, 52),
  },
  premiumStepperCircle: {
    width: getResponsiveSize(22, 24, 26, 28),
    height: getResponsiveSize(22, 24, 26, 28),
    borderRadius: getResponsiveSize(11, 12, 13, 14),
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getResponsiveSize(2, 3, 4, 5),
    transitionProperty: 'all',
    transitionDuration: '200ms',
    transitionTimingFunction: 'ease',
  },
  premiumStepperCircleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    width: getResponsiveSize(28, 30, 32, 34),
    height: getResponsiveSize(28, 30, 32, 34),
    borderRadius: getResponsiveSize(14, 15, 16, 17),
    transform: [{ scale: 1.12 }],
  },
  premiumStepperCircleShadow: {
    shadowColor: COLORS.primary,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  premiumStepperCircleCompleted: {
    backgroundColor: '#fff',
    borderColor: '#22c55e',
  },
  premiumStepperNumber: {
    color: COLORS.textMuted,
    fontWeight: 'bold',
    fontSize: FONT_SIZES.base,
  },
  premiumStepperNumberActive: {
    color: '#fff',
  },
  premiumStepperNumberCompleted: {
    color: '#22c55e',
  },
  premiumStepperLine: {
    width: getResponsiveSize(18, 20, 22, 24),
    height: 3,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 2,
    borderRadius: 2,
    transitionProperty: 'background-color',
    transitionDuration: '200ms',
    transitionTimingFunction: 'ease',
  },
  premiumStepperLineActive: {
    backgroundColor: COLORS.primary,
  },
  premiumStepperLineCompleted: {
    backgroundColor: '#22c55e',
  },
  phaseSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginBottom: getResponsiveSize(8, 10, 12, 14),
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#ececec',
    width: '100%',
    alignSelf: 'center',
    marginBottom: getResponsiveSize(14, 16, 18, 20),
    borderRadius: 1,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f8fa',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: getResponsiveSize(8, 10, 12, 14),
    minHeight: getResponsiveSize(36, 38, 40, 42),
    position: 'relative',
  },
  pickerSmall: {
    flex: 1,
    height: getResponsiveSize(32, 34, 36, 38),
    fontSize: FONT_SIZES.base,
    color: COLORS.text,
    backgroundColor: 'transparent',
    marginLeft: 0,
    marginRight: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  pickerChevron: {
    position: 'absolute',
    right: getResponsiveSize(8, 10, 12, 14),
    top: '50%',
    marginTop: -8,
    pointerEvents: 'none',
  },
  inputDense: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    paddingVertical: getResponsiveSize(8, 10, 12, 14),
    paddingHorizontal: 0,
  },
  rowDense: {
    flexDirection: 'row',
    marginBottom: getResponsiveSize(8, 10, 12, 14),
    gap: 0,
  },
  amenitiesRowDense: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsiveSize(10, 12, 14, 16),
    marginBottom: getResponsiveSize(16, 18, 20, 24),
  },
  amenityChipDense: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f8fa',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: getResponsiveSize(14, 16, 18, 20),
    paddingVertical: getResponsiveSize(8, 10, 12, 14),
    marginRight: getResponsiveSize(8, 10, 12, 14),
    marginBottom: getResponsiveSize(8, 10, 12, 14),
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  amenityChipSelectedDense: {
    backgroundColor: COLORS.primary + '11',
    borderColor: COLORS.primary,
  },
  amenityTextDense: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textMuted,
    marginLeft: getResponsiveSize(6, 8, 10, 12),
    textTransform: 'capitalize',
  },
  amenityTextSelectedDense: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  categoryChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginTop: getResponsiveSize(2, 3, 4, 5),
    marginBottom: getResponsiveSize(2, 3, 4, 5),
  },
  categoryChipGrid: {
    width: '33.33%',
    marginBottom: getResponsiveSize(10, 12, 14, 16),
    paddingHorizontal: 0,
    paddingVertical: getResponsiveSize(10, 12, 14, 16),
    borderRadius: getResponsiveSize(18, 20, 22, 24),
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: '#fff',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    elevation: 2,
  },
  categoryChipText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.base,
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  helperText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: getResponsiveSize(2, 3, 4, 5),
    marginLeft: 2,
  },
  phaseNavBtnDisabled: {
    backgroundColor: '#ccc',
  },
}); 