import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { Feather } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { api } from '../constants/api';
import AppHeader from '../components/AppHeader';
import { LinearGradient } from 'expo-linear-gradient';

export default function GuestRequestScreen({ navigation }) {
  const { user, token } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    if (!user || !token) return;
    setLoading(true);
    try {
      console.log('Fetching guest requests for user:', user._id);
      const response = await api.get('/api/user/host-guest-listings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Guest requests response:', response.data);
      if (response.data.success) {
        setRequests(response.data.listings || []);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching guest requests:', error);
      setRequests([]);
      Alert.alert('Error', 'Failed to load guest requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handleAction = async (bookingId, action) => {
    Alert.alert(
      `${action === 'approved' ? 'Approve' : 'Reject'} Request`,
      `Are you sure you want to ${action === 'approved' ? 'approve' : 'reject'} this booking request?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: action === 'approved' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const response = await api.post('/api/bookings/approve-booking',
                { bookingId, status: action, userId: user._id },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              if (response.data.success) {
                setRequests(prev => prev.filter(r => r._id !== bookingId));
                Alert.alert('Success', `Booking ${action === 'approved' ? 'approved' : 'rejected'} successfully`);
              } else {
                Alert.alert('Error', response.data.message || 'Failed to update booking');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to update booking');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Status color mapping
  const statusStyles = {
    approved: { bg: '#dcfce7', text: '#166534' },
    cancelled: { bg: '#fee2e2', text: '#dc2626' },
    rejected: { bg: '#f3e8ff', text: '#7c3aed' },
    pending: { bg: '#fef3c7', text: '#d97706' },
  };

  // Split requests into pending and approved
  const pendingRequests = requests.filter(r => r.status === 'pending' && r.status !== 'paused');
  const approvedRequests = requests
    .filter(r => r.status === 'approved' && r.status !== 'paused')
    .sort((a, b) => {
      // Prefer updatedAt if available, else endDate
      const aDate = a.updatedAt ? new Date(a.updatedAt) : new Date(a.endDate);
      const bDate = b.updatedAt ? new Date(b.updatedAt) : new Date(b.endDate);
      return bDate - aDate;
    })
    .slice(0, 5);
  console.log('pendingRequests:', pendingRequests.length);
  console.log('approvedRequests:', approvedRequests.length);
  console.log('All requests statuses:', requests.map(r => r.status));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading guest requests...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[COLORS.background, '#f0fdfa', '#f9fafb']}
      style={styles.gradientBg}
    >
      <AppHeader title="Guest Requests" />
      <View style={{ height: 40 }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Pending Requests Section - moved above */}
        <View style={[styles.sectionContainer, { backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 12, marginBottom: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, padding: 18, paddingTop: 70 }]}> 
          <View style={styles.sectionHeaderRow}>
            <Feather name="clock" size={22} color="#fbbf24" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Pending Requests</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Requests waiting for your approval.</Text>
          {pendingRequests.length === 0 ? (
            <View style={styles.emptyStateBox}>
              <Feather name="clock" size={40} color="#fde68a" />
              <Text style={styles.emptySubText}>No pending requests.</Text>
            </View>
          ) : (
            <View style={styles.requestsList}>
              {pendingRequests.map((req) => {
                const startDate = new Date(req.startDate);
                const endDate = new Date(req.endDate);
                const nights = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
                const statusColor = statusStyles[req.status] || statusStyles.pending;
                return (
                  <TouchableOpacity
                    key={req._id}
                    activeOpacity={0.92}
                    style={{ marginBottom: 18 }}
                  >
                    <LinearGradient
                      colors={["#fffbe6", "#fef9c3"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.requestCard,
                        styles.floatingCard,
                        {
                          borderLeftWidth: 4,
                          borderLeftColor: statusColor.bg,
                          borderColor: '#fde68a',
                          backgroundColor: '#fffbe6',
                          shadowColor: '#fbbf24',
                          shadowOpacity: 0.10,
                          shadowRadius: 16,
                          elevation: 6,
                          borderRadius: 18,
                          borderWidth: 1.5,
                        },
                      ]}
                    >
                      <Image
                        source={{ uri: req.listing?.images?.[0] || 'https://via.placeholder.com/300x200?text=Property' }}
                        style={styles.requestImageRounded}
                        resizeMode="cover"
                      />
                      <View style={styles.requestContent}>
                        <View style={styles.requestHeader}>
                          <View style={styles.requestTitleContainer}>
                            <Text style={styles.requestTitleModern} numberOfLines={1}>
                              {req.listing?.title || 'Property'}
                            </Text>
                            <View style={styles.locationContainer}>
                              <Feather name="map-pin" size={14} color={COLORS.textMuted} />
                              <Text style={styles.locationText} numberOfLines={1}>
                                {req.listing?.location || 'Location'}
                              </Text>
                            </View>
                          </View>
                          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}> 
                            <Text style={[styles.statusText, { color: statusColor.text }]}> 
                              {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.requestDetails}>
                          <View style={styles.detailRow}>
                            <View style={styles.detailItem}>
                              <Feather name="calendar" size={16} color={COLORS.textMuted} />
                              <View>
                                <Text style={styles.detailLabelModern}>Check-in</Text>
                                <Text style={styles.detailValueModern}>{formatDate(req.startDate)}</Text>
                              </View>
                            </View>
                            <View style={styles.detailItem}>
                              <Feather name="calendar" size={16} color={COLORS.textMuted} />
                              <View>
                                <Text style={styles.detailLabelModern}>Check-out</Text>
                                <Text style={styles.detailValueModern}>{formatDate(req.endDate)}</Text>
                              </View>
                            </View>
                          </View>
                          <View style={styles.detailRow}>
                            <View style={styles.detailItem}>
                              <Feather name="users" size={16} color={COLORS.textMuted} />
                              <View>
                                <Text style={styles.detailLabelModern}>Guests</Text>
                                <Text style={styles.detailValueModern}>{req.adults || 1}</Text>
                              </View>
                            </View>
                            <View style={styles.detailItem}>
                              <Feather name="user" size={16} color={COLORS.textMuted} />
                              <View>
                                <Text style={styles.detailLabelModern}>Guest</Text>
                                <Text style={styles.detailValueModern}>{req.userId?.name || 'N/A'}</Text>
                              </View>
                            </View>
                          </View>
                          <View style={styles.detailRow}>
                            <View style={styles.detailItem}>
                              <Feather name="clock" size={16} color={COLORS.textMuted} />
                              <View>
                                <Text style={styles.detailLabelModern}>Duration</Text>
                                <Text style={styles.detailValueModern}>{nights} {nights === 1 ? 'night' : 'nights'}</Text>
                              </View>
                            </View>
                            <View style={styles.detailItem}>
                              <Feather name="dollar-sign" size={16} color={COLORS.textMuted} />
                              <View>
                                <Text style={styles.detailLabelModern}>Total</Text>
                                <Text style={styles.detailValueModern}>${req.totalPrice?.toLocaleString() || 0}</Text>
                              </View>
                            </View>
                          </View>
                          {req.specialRequests ? (
                            <View style={styles.specialRequestRow}>
                              <Feather name="message-circle" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                              <Text style={styles.specialRequestText}>{req.specialRequests}</Text>
                            </View>
                          ) : null}
                        </View>
                        <View style={styles.actionRow}>
                          <TouchableOpacity
                            style={[
                              styles.actionBtn,
                              styles.actionBtnModern,
                              { backgroundColor: COLORS.primary, marginRight: 4 },
                            ]}
                            onPress={() => handleAction(req._id, 'approved')}
                            activeOpacity={0.85}
                          >
                            <Feather name="check" size={20} color="#fff" />
                            <Text style={[styles.actionBtnText, styles.actionBtnTextModern]}>Approve</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.actionBtn,
                              styles.actionBtnModern,
                              { backgroundColor: '#fee2e2' },
                            ]}
                            onPress={() => handleAction(req._id, 'rejected')}
                            activeOpacity={0.85}
                          >
                            <Feather name="x" size={20} color={COLORS.primary} />
                            <Text style={[styles.actionBtnText, styles.actionBtnTextModern, { color: COLORS.primary }]}>Reject</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Divider */}
        <View style={[styles.sectionDivider, { marginVertical: 12 }]} />

        {/* Approved Requests Section */}
        <View style={[styles.sectionContainer, { backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 12, marginBottom: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, padding: 18 }]}> 
          <View style={styles.sectionHeaderRow}>
            <Feather name="check-circle" size={22} color="#22c55e" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Recent Approved Requests</Text>
          </View>
          <Text style={styles.sectionSubtitle}>The latest 5 bookings you have approved.</Text>
          {approvedRequests.length === 0 ? (
            <View style={styles.emptyStateBox}>
              <Feather name="check-circle" size={40} color="#a7f3d0" />
              <Text style={styles.emptySubText}>No approved requests yet.</Text>
            </View>
          ) : (
            <View style={styles.requestsList}>
              {approvedRequests.map((req) => {
                const startDate = new Date(req.startDate);
                const endDate = new Date(req.endDate);
                const nights = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
                const statusColor = statusStyles[req.status] || statusStyles.pending;
                return (
                  <TouchableOpacity
                    key={req._id}
                    activeOpacity={0.92}
                    style={{ marginBottom: 18 }}
                  >
                    <LinearGradient
                      colors={["#f0fdf4", "#dcfce7"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.requestCard, styles.floatingCard, { borderLeftWidth: 4, borderLeftColor: statusColor.bg, borderColor: '#d1fae5', backgroundColor: '#f8fafc', shadowColor: '#22c55e', shadowOpacity: 0.10, shadowRadius: 16, elevation: 6 }]}
                    >
                      <Image
                        source={{ uri: req.listing?.images?.[0] || 'https://via.placeholder.com/300x200?text=Property' }}
                        style={styles.requestImageRounded}
                        resizeMode="cover"
                      />
                      <View style={styles.requestContent}>
                        <View style={styles.requestHeader}>
                          <View style={styles.requestTitleContainer}>
                            <Text style={styles.requestTitleModern} numberOfLines={1}>
                              {req.listing?.title || 'Property'}
                            </Text>
                            <View style={styles.locationContainer}>
                              <Feather name="map-pin" size={14} color={COLORS.textMuted} />
                              <Text style={styles.locationText} numberOfLines={1}>
                                {req.listing?.location || 'Location'}
                              </Text>
                            </View>
                          </View>
                          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}> 
                            <Text style={[styles.statusText, { color: statusColor.text }]}> 
                              {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.requestDetails}>
                          <View style={styles.detailRow}>
                            <View style={styles.detailItem}>
                              <Feather name="calendar" size={16} color={COLORS.textMuted} />
                              <View>
                                <Text style={styles.detailLabelModern}>Check-in</Text>
                                <Text style={styles.detailValueModern}>{formatDate(req.startDate)}</Text>
                              </View>
                            </View>
                            <View style={styles.detailItem}>
                              <Feather name="calendar" size={16} color={COLORS.textMuted} />
                              <View>
                                <Text style={styles.detailLabelModern}>Check-out</Text>
                                <Text style={styles.detailValueModern}>{formatDate(req.endDate)}</Text>
                              </View>
                            </View>
                          </View>
                          <View style={styles.detailRow}>
                            <View style={styles.detailItem}>
                              <Feather name="users" size={16} color={COLORS.textMuted} />
                              <View>
                                <Text style={styles.detailLabelModern}>Guests</Text>
                                <Text style={styles.detailValueModern}>{req.adults || 1}</Text>
                              </View>
                            </View>
                            <View style={styles.detailItem}>
                              <Feather name="user" size={16} color={COLORS.textMuted} />
                              <View>
                                <Text style={styles.detailLabelModern}>Guest</Text>
                                <Text style={styles.detailValueModern}>{req.userId?.name || 'N/A'}</Text>
                              </View>
                            </View>
                          </View>
                          <View style={styles.detailRow}>
                            <View style={styles.detailItem}>
                              <Feather name="clock" size={16} color={COLORS.textMuted} />
                              <View>
                                <Text style={styles.detailLabelModern}>Duration</Text>
                                <Text style={styles.detailValueModern}>{nights} {nights === 1 ? 'night' : 'nights'}</Text>
                              </View>
                            </View>
                            <View style={styles.detailItem}>
                              <Feather name="dollar-sign" size={16} color={COLORS.textMuted} />
                              <View>
                                <Text style={styles.detailLabelModern}>Total</Text>
                                <Text style={styles.detailValueModern}>${req.totalPrice?.toLocaleString() || 0}</Text>
                              </View>
                            </View>
                          </View>
                          {req.specialRequests ? (
                            <View style={styles.specialRequestRow}>
                              <Feather name="message-circle" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                              <Text style={styles.specialRequestText}>{req.specialRequests}</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textMuted,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerSection: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  sectionContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: 10,
  },
  requestsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    color: COLORS.textMuted,
    marginTop: 12,
    marginBottom: 8,
    fontWeight: '500',
  },
  requestsList: {
    gap: 18,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    marginBottom: 8,
  },
  requestImage: {
    width: 110,
    height: 110,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  requestContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  requestTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  requestTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  statusBadge: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#d97706',
    fontWeight: 'bold',
    fontSize: 13,
  },
  requestDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 18,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  detailValue: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  specialRequestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 2,
  },
  specialRequestText: {
    fontSize: 13,
    color: COLORS.primary,
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    gap: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 20,
  },
  emptyStateBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  gradientBg: {
    flex: 1,
  },
  floatingCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 6,
  },
  requestImageRounded: {
    width: 110,
    height: 110,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  sectionSubtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginBottom: 10,
  },
  requestTitleModern: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  detailLabelModern: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  detailValueModern: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  actionBtnModern: {
    height: 36,
    width: 92,
    paddingHorizontal: 0,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: 10,
  },
  actionBtnTextModern: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft:0,
    textAlign: 'center',
  },
}); 