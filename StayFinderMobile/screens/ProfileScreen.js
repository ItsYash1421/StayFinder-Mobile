import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';
import { api } from '../constants/api';
import * as ImagePicker from 'expo-image-picker';
import AppHeader from '../components/AppHeader';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen({ navigation }) {
  const { user, token, logout, setUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [profileFetched, setProfileFetched] = useState(false);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    gender: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Function to fetch latest user profile from backend
  const fetchLatestProfile = async () => {
    if (!token) return;
    
    console.log('🔄 Fetching latest profile from backend...');
    setRefreshing(true);
    try {
      const response = await api.get('/api/user/get-profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success && response.data.user) {
        const latestUser = response.data.user;
        console.log('✅ Profile fetched successfully:', {
          name: latestUser.name,
          phone: latestUser.phone,
          bio: latestUser.bio
        });
        
        // Update AuthContext and AsyncStorage with fresh data
        setUser(latestUser);
        await AsyncStorage.setItem('user', JSON.stringify(latestUser));
        
        // Update profile form data
        setProfileData({
          name: latestUser.name || '',
          email: latestUser.email || '',
          phone: latestUser.phone || '',
          bio: latestUser.bio || '',
          gender: latestUser.gender || '',
        });
        
        setProfileFetched(true);
      }
    } catch (err) {
      console.error('❌ Error fetching latest profile:', err);
      // Don't show error to user as this is a background refresh
    } finally {
      setRefreshing(false);
    }
  };

  // Manual refresh function for pull-to-refresh
  const handleManualRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    setProfileFetched(false);
    await fetchLatestProfile();
  };

  // Fetch profile once on mount if not already fetched
  useEffect(() => {
    if (user && token && !profileFetched) {
      console.log('🚀 Initial profile fetch on mount');
      fetchLatestProfile();
    }
  }, [user, token, profileFetched]);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        gender: user.gender || '',
      });
    }
  }, [user]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const updateProfile = async () => {
    if (!token) {
      Alert.alert('Error', 'Please login to update your profile');
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    // Required fields check
    const requiredFields = ['name', 'email'];
    for (let field of requiredFields) {
      if (!profileData[field] || profileData[field].trim() === '') {
        setError(`Please fill in your ${field}.`);
        setLoading(false);
        return;
      }
    }

    try {
      const formData = new FormData();
      formData.append('userId', user._id);
      formData.append('name', profileData.name);
      formData.append('email', profileData.email);
      formData.append('phone', profileData.phone);
      formData.append('bio', profileData.bio);
      formData.append('gender', profileData.gender);

      if (selectedImage) {
        formData.append('profileImage', {
          uri: selectedImage.uri,
          type: 'image/jpeg',
          name: 'profile.jpg',
        });
      }

      // Log FormData for debugging
      for (let pair of formData.entries()) {
        console.log(pair[0]+ ', ' + pair[1]);
      }

      const response = await api.post('/api/user/update-profile', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setMessage('Profile updated successfully');
        setSelectedImage(null);
        // Reset profile fetched flag and fetch fresh data
        setProfileFetched(false);
        await fetchLatestProfile();
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        setError(response.data.message || 'Failed to update profile');
      }
    } catch (err) {
      setError('Failed to update profile');
      console.error('Profile update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // Add a brief visual feedback delay for ultra-smooth experience
            setTimeout(() => {
              logout(navigation);
            }, 100);
          },
        },
      ]
    );
  };

  const handlePasswordChange = async () => {
    setPasswordMessage(null);
    setPasswordError(null);
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match!');
      return;
    }
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setPasswordError('Please fill in all fields.');
      return;
    }
    setPasswordLoading(true);
    try {
      const response = await api.post('/api/user/change-password', {
        userId: user._id,
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setPasswordMessage(response.data.message || 'Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        Alert.alert('Success', 'Password changed successfully!');
        setShowChangePassword(false);
      } else {
        setPasswordError(response.data.message || 'Failed to change password.');
      }
    } catch (err) {
      setPasswordError('Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Not logged in state
  if (!user || !token) {
    return (
      <View style={styles.container}>
        <AppHeader title="Profile" />
        <View style={{ height: 110 }} />
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.notLoggedInContainer}>
            <View style={styles.notLoggedInIcon}>
              <Feather name="user" size={64} color={COLORS.textMuted} />
            </View>
            <Text style={styles.notLoggedInTitle}>Welcome to StayFinder</Text>
            <Text style={styles.notLoggedInSubtitle}>
              Sign in to access your profile, manage your bookings, and save your favorite properties.
            </Text>
            
            <View style={styles.authButtonsContainer}>
              <TouchableOpacity 
                style={styles.loginButton}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.8}
              >
                <Text style={styles.loginButtonText}>Sign In</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.signupButton}
                onPress={() => navigation.navigate('Register')}
                activeOpacity={0.8}
              >
                <Text style={styles.signupButtonText}>Create Account</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>What you can do:</Text>
              <View style={styles.featuresGrid}>
                <View style={styles.featureCard}>
                  <View style={styles.featureIconContainer}>
                    <Feather name="heart" size={24} color={COLORS.primary} />
                  </View>
                  <Text style={styles.featureText}>Save favorite properties</Text>
                </View>
                <View style={styles.featureCard}>
                  <View style={styles.featureIconContainer}>
                    <Feather name="calendar" size={24} color={COLORS.primary} />
                  </View>
                  <Text style={styles.featureText}>Manage your bookings</Text>
                </View>
                <View style={styles.featureCard}>
                  <View style={styles.featureIconContainer}>
                    <Feather name="user" size={24} color={COLORS.primary} />
                  </View>
                  <Text style={styles.featureText}>Update your profile</Text>
                </View>
                <View style={styles.featureCard}>
                  <View style={styles.featureIconContainer}>
                    <Feather name="home" size={24} color={COLORS.primary} />
                  </View>
                  <Text style={styles.featureText}>List your property</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Logged in state
  return (
    <View style={styles.container}>
      <AppHeader title="Profile" />
      <View style={{ height: 110 }} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleManualRefresh}
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={['#1f2937', '#374151']}
            style={styles.headerGradient}
          >
            <View style={styles.profileInfo}>
              <TouchableOpacity style={styles.profileImageContainer} onPress={pickImage}>
                <View style={styles.profileImage}>
                  {selectedImage ? (
                    <Image source={{ uri: selectedImage.uri }} style={styles.image} />
                  ) : user.profileImage ? (
                    <Image source={{ uri: user.profileImage }} style={styles.image} />
                  ) : (
                    <Feather name="user" size={32} color="#fff" />
                  )}
                </View>
                <View style={styles.cameraButton}>
                  <Feather name="camera" size={16} color={COLORS.primary} />
                </View>
              </TouchableOpacity>
              
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>
                    {user.role === 'host' ? 'Host' : 'Guest'}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
            onPress={() => setActiveTab('profile')}
          >
            <Feather name="user" size={20} color={activeTab === 'profile' ? COLORS.primary : COLORS.textMuted} />
            <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
              Profile
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'security' && styles.activeTab]}
            onPress={() => setActiveTab('security')}
          >
            <Feather name="shield" size={20} color={activeTab === 'security' ? COLORS.primary : COLORS.textMuted} />
            <Text style={[styles.tabText, activeTab === 'security' && styles.activeTabText]}>
              Security
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'profile' && (
            <View style={styles.profileForm}>
              {message && (
                <View style={styles.successMessage}>
                  <Text style={styles.successText}>{message}</Text>
                </View>
              )}
              
              {error && (
                <View style={styles.errorMessage}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={styles.formRow}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Full Name *</Text>
                  <View style={styles.inputWrapper}>
                    <Feather name="user" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={profileData.name}
                      onChangeText={(text) => setProfileData({ ...profileData, name: text })}
                      placeholder="Enter your full name"
                      placeholderTextColor={COLORS.textMuted}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email Address *</Text>
                  <View style={styles.inputWrapper}>
                    <Feather name="mail" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={profileData.email}
                      onChangeText={(text) => setProfileData({ ...profileData, email: text })}
                      placeholder="Enter your email"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="email-address"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Phone Number</Text>
                  <View style={styles.inputWrapper}>
                    <Feather name="phone" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={profileData.phone}
                      onChangeText={(text) => setProfileData({ ...profileData, phone: text })}
                      placeholder="Enter your phone number"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.bioInputContainer}>
                <Text style={styles.label}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={profileData.bio}
                  onChangeText={(text) => setProfileData({ ...profileData, bio: text })}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity 
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={updateProfile}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="save" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'security' && (
            <View style={styles.securityContent}>
              <Text style={styles.securityTitle}>Security Settings</Text>
              <Text style={styles.securitySubtitle}>
                Manage your account security and privacy settings.
              </Text>
              
              <TouchableOpacity 
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Feather name="log-out" size={20} color="#ef4444" />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'security' && (
            <View style={styles.tabContent}>
              {!showChangePassword ? (
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={() => setShowChangePassword(true)}
                  activeOpacity={0.8}
                >
                  <Feather name="lock" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Change Password</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.passwordCard}>
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primary + 'cc']}
                    style={styles.passwordCardHeader}
                  >
                    <Feather name="lock" size={22} color="#fff" />
                    <Text style={styles.passwordCardTitle}>Change Password</Text>
                  </LinearGradient>
                  <View style={{ maxHeight: 360 }}>
                    <ScrollView
                      contentContainerStyle={styles.passwordCardBody}
                      showsVerticalScrollIndicator={false}
                    >
                      {passwordMessage && (
                        <Text style={styles.successMessage}>{passwordMessage}</Text>
                      )}
                      {passwordError && (
                        <Text style={styles.errorMessage}>{passwordError}</Text>
                      )}
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Current Password</Text>
                        <View style={styles.passwordInputRow}>
                          <TextInput
                            style={[styles.input, styles.passwordInput]}
                            value={passwordData.currentPassword}
                            onChangeText={text => setPasswordData({ ...passwordData, currentPassword: text })}
                            placeholder="Enter current password"
                            placeholderTextColor={COLORS.textMuted}
                            secureTextEntry={!showPasswords.current}
                            selectionColor={COLORS.primary}
                          />
                          <TouchableOpacity onPress={() => setShowPasswords(p => ({ ...p, current: !p.current }))}>
                            <Feather name={showPasswords.current ? 'eye-off' : 'eye'} size={20} color={COLORS.textMuted} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>New Password</Text>
                        <View style={styles.passwordInputRow}>
                          <TextInput
                            style={[styles.input, styles.passwordInput]}
                            value={passwordData.newPassword}
                            onChangeText={text => setPasswordData({ ...passwordData, newPassword: text })}
                            placeholder="Enter new password"
                            placeholderTextColor={COLORS.textMuted}
                            secureTextEntry={!showPasswords.new}
                            selectionColor={COLORS.primary}
                          />
                          <TouchableOpacity onPress={() => setShowPasswords(p => ({ ...p, new: !p.new }))}>
                            <Feather name={showPasswords.new ? 'eye-off' : 'eye'} size={20} color={COLORS.textMuted} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Confirm New Password</Text>
                        <View style={styles.passwordInputRow}>
                          <TextInput
                            style={[styles.input, styles.passwordInput]}
                            value={passwordData.confirmPassword}
                            onChangeText={text => setPasswordData({ ...passwordData, confirmPassword: text })}
                            placeholder="Confirm new password"
                            placeholderTextColor={COLORS.textMuted}
                            secureTextEntry={!showPasswords.confirm}
                            selectionColor={COLORS.primary}
                          />
                          <TouchableOpacity onPress={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))}>
                            <Feather name={showPasswords.confirm ? 'eye-off' : 'eye'} size={20} color={COLORS.textMuted} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </ScrollView>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 12 }}>
                    <TouchableOpacity
                      style={[styles.saveButton, passwordLoading && styles.saveButtonDisabled, { flex: 1 }]}
                      onPress={handlePasswordChange}
                      disabled={passwordLoading}
                      activeOpacity={0.8}
                    >
                      {passwordLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Feather name="save" size={20} color="#fff" />
                          <Text style={styles.saveButtonText}>Save</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.cancelButton, { flex: 1 }]}
                      onPress={() => setShowChangePassword(false)}
                      activeOpacity={0.8}
                    >
                      <Feather name="x" size={20} color={COLORS.text} />
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
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
    paddingBottom: 40,
  },
  
  // Not logged in styles
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  notLoggedInIcon: {
    marginBottom: 24,
  },
  notLoggedInTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  notLoggedInSubtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  authButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    flex: 0.48,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signupButton: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    flex: 0.48,
    alignItems: 'center',
  },
  signupButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  featuresContainer: {
    width: '100%',
    marginTop: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  featureCard: {
    width: '48%',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Profile header styles
  profileHeader: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  headerGradient: {
    padding: 24,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },

  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginLeft: 8,
  },
  activeTabText: {
    color: COLORS.primary,
  },

  // Tab content styles
  tabContent: {
    marginHorizontal: 20,
  },
  profileForm: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  successMessage: {
    backgroundColor: '#dcfce7',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  successText: {
    color: '#166534',
    fontSize: 14,
  },
  errorMessage: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  formRow: {
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  inputIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  bioInputContainer: {
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 0,
    shadowColor: '#22c55e',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },

  // Security styles
  securityContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  securityTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  securitySubtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginBottom: 24,
    lineHeight: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: '600',
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  passwordInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  passwordCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  passwordCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius:16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  passwordCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
  },
  passwordCardBody: {
    padding: 20,
  },
  passwordInput: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  cancelButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 