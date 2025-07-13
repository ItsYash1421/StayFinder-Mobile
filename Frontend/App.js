import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import {
  COLORS,
  getTabBarHeight,
  getResponsiveSize,
  ICON_SIZES,
  FONT_SIZES,
  getShadow,
} from "./constants/theme";
import {
  TestImageSliderScreen,
  HomeScreen,
  LoginScreen,
  RegisterScreen,
  ProfileScreen,
  ExploreScreen,
  MyBookingScreen,
  WishlistScreen,
  CreateListingScreen,
  EditListingScreen,
  ListingDetailScreen,
  HostDashboardScreen,
  AdminDashboardScreen,
  AdminUserManagementScreen,
  AdminPropertyManagementScreen,
  AdminBookingManagementScreen,
  AdminAnalyticsScreen,
  GuestRequestScreen,
  BecomeHostScreen,
  DestinationDetailScreen,
} from "./screens";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { WishlistProvider } from './context/WishlistContext';

import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import React, { useState, useContext, useRef, useEffect } from "react";
import { BlurView } from "expo-blur";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const { width, height } = Dimensions.get("window");

// Tab bar height for animation calculations - now responsive
const TAB_BAR_HEIGHT = getTabBarHeight();

// Custom Tab Bar Component
function CustomTabBar({ state, descriptors, navigation }) {
  const { logout, user } = useContext(AuthContext);
  const [showMoreModal, setShowMoreModal] = useState(false);

  // Animation refs for tab button effects
  const tabAnimations = useRef({
    Home: new Animated.Value(1),
    Explore: new Animated.Value(1),
    Wishlist: new Animated.Value(1),
    Host: new Animated.Value(1),
    Bookings: new Animated.Value(1),
    More: new Animated.Value(1),
  }).current;

  const animateTabPress = (tabName) => {
    // Animate the pressed tab button with "sucking" effect
    Animated.sequence([
      Animated.timing(tabAnimations[tabName], {
        toValue: 0.75,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.spring(tabAnimations[tabName], {
        toValue: 1,
        useNativeDriver: true,
        stiffness: 600,
        damping: 30,
        mass: 0.6,
      }),
    ]).start();
  };

  const isHost = user?.role === "host";

  return (
    <>
      <LinearGradient
        colors={[COLORS.background, "#f7f7f7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tabBar}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              // Animate tab button press
              animateTabPress(route.name);
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          // Skip rendering the More tab as a button since it's handled by modal
          if (route.name === "More") {
            return (
              <TouchableOpacity
                key={route.key}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                activeOpacity={0.85}
                onPress={() => setShowMoreModal(true)}
              >
                <Animated.View
                  style={[
                    styles.tabItem,
                    {
                      transform: [{ scale: tabAnimations.More }],
                    },
                  ]}
                >
                  <Feather
                    name="menu"
                    size={24}
                    color={COLORS.textMuted}
                    style={{ marginBottom: 2 }}
                  />
                  <Text style={styles.tabLabel}>More</Text>
                </Animated.View>
              </TouchableOpacity>
            );
          }

          let iconName;
          switch (route.name) {
            case "Home":
              iconName = "home";
              break;
            case "Explore":
              iconName = "search";
              break;
            case "Wishlist":
              iconName = "heart";
              break;
            case "Host":
              iconName = "briefcase";
              break;
            case "Bookings":
              iconName = "calendar";
              break;
            default:
              iconName = "circle";
          }

          return (
            <TouchableOpacity
              key={route.key}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.85}
              onPress={onPress}
              onLongPress={onLongPress}
            >
              <Animated.View
                style={[
                  styles.tabItem,
                  {
                    transform: [{ scale: tabAnimations[route.name] }],
                    // Only apply shadow/elevation for iOS
                    ...(Platform.OS === "ios" && isFocused
                      ? {
                          shadowColor: COLORS.primary,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.3,
                          shadowRadius: 8,
                          elevation: 8,
                        }
                      : {
                          shadowColor: "transparent",
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0,
                          shadowRadius: 0,
                          elevation: 0,
                        }),
                  },
                ]}
              >
                {/* Render icon and label for all tabs, no circle or background for selected */}
                <Feather
                  name={iconName}
                  size={
                    isFocused
                      ? getResponsiveSize(28, 30, 32, 34)
                      : getResponsiveSize(22, 24, 26, 28)
                  }
                  color={isFocused ? COLORS.primary : COLORS.textMuted}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    isFocused
                      ? { color: COLORS.primary, fontWeight: "bold" }
                      : null,
                  ]}
                >
                  {label}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </LinearGradient>

      {/* More Modal */}
      <Modal
        visible={showMoreModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMoreModal(false)}
      >
        <BlurView
          intensity={30}
          tint="dark"
          style={{ flex: 1, justifyContent: "flex-end" }}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setShowMoreModal(false)}
          />
          <View
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 28,
              paddingBottom: 36,
              minHeight: 260,
              shadowColor: "#000",
              shadowOpacity: 0.13,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: -8 },
              elevation: 12,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 12 }}>
              <View
                style={{
                  width: 48,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: "#e5e7eb",
                  marginBottom: 10,
                }}
              />
              <Text
                style={{
                  fontWeight: "bold",
                  fontSize: 20,
                  marginBottom: 8,
                  color: COLORS.primary,
                }}
              >
                More Options
              </Text>
            </View>

            {/* Profile - Always shown */}
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 16,
              }}
              onPress={() => {
                setShowMoreModal(false);
                navigation.navigate("ProfileStack");
              }}
            >
              <Feather
                name="user"
                size={22}
                color={COLORS.primary}
                style={{ marginRight: 14 }}
              />
              <Text style={{ fontSize: 17, color: COLORS.text }}>Profile</Text>
            </TouchableOpacity>

            {/* Role-specific options */}
            {!isHost ? (
              // User options
              <>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 16,
                  }}
                  onPress={() => {
                    setShowMoreModal(false);
                    navigation.navigate("WishlistStack");
                  }}
                >
                  <Feather
                    name="heart"
                    size={22}
                    color={COLORS.primary}
                    style={{ marginRight: 14 }}
                  />
                  <Text style={{ fontSize: 17, color: COLORS.text }}>
                    Wishlist
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 16,
                  }}
                  onPress={() => {
                    setShowMoreModal(false);
                    navigation.navigate("BecomeHostStack");
                  }}
                >
                  <Feather
                    name="home"
                    size={22}
                    color={COLORS.primary}
                    style={{ marginRight: 14 }}
                  />
                  <Text style={{ fontSize: 17, color: COLORS.text }}>
                    Become Host
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              // Host options
              <>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 16,
                  }}
                  onPress={() => {
                    setShowMoreModal(false);
                    navigation.navigate("WishlistStack");
                  }}
                >
                  <Feather
                    name="heart"
                    size={22}
                    color={COLORS.primary}
                    style={{ marginRight: 14 }}
                  />
                  <Text style={{ fontSize: 17, color: COLORS.text }}>
                    Wishlist
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 16,
                  }}
                  onPress={() => {
                    setShowMoreModal(false);
                    navigation.navigate("GuestRequestStack");
                  }}
                >
                  <Feather
                    name="users"
                    size={22}
                    color={COLORS.primary}
                    style={{ marginRight: 14 }}
                  />
                  <Text style={{ fontSize: 17, color: COLORS.text }}>
                    Guest bookings
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Authentication options */}
            {user ? (
              // Logout - Only shown when logged in
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 16,
                }}
                onPress={async () => {
                  setShowMoreModal(false);
                  // Immediate logout without delay
                  await logout(navigation);
                }}
                activeOpacity={0.7}
              >
                <Feather
                  name="log-out"
                  size={22}
                  color="#ef4444"
                  style={{ marginRight: 14 }}
                />
                <Text
                  style={{ fontSize: 17, color: "#ef4444", fontWeight: "bold" }}
                >
                  Logout
                </Text>
              </TouchableOpacity>
            ) : (
              // Login/Signup - Only shown when not logged in
              <>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 16,
                  }}
                  onPress={() => {
                    setShowMoreModal(false);
                    navigation.navigate("Login");
                  }}
                >
                  <Feather
                    name="log-in"
                    size={22}
                    color={COLORS.primary}
                    style={{ marginRight: 14 }}
                  />
                  <Text
                    style={{
                      fontSize: 17,
                      color: COLORS.primary,
                      fontWeight: "600",
                    }}
                  >
                    Sign In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 16,
                  }}
                  onPress={() => {
                    setShowMoreModal(false);
                    navigation.navigate("Register");
                  }}
                >
                  <Feather
                    name="user-plus"
                    size={22}
                    color={COLORS.primary}
                    style={{ marginRight: 14 }}
                  />
                  <Text
                    style={{
                      fontSize: 17,
                      color: COLORS.primary,
                      fontWeight: "600",
                    }}
                  >
                    Create Account
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={{
                alignItems: "center",
                marginTop: 10,
                paddingVertical: 10,
                backgroundColor: COLORS.backgroundSecondary,
                borderRadius: 8,
                paddingHorizontal: 24,
              }}
              onPress={() => setShowMoreModal(false)}
            >
              <Text
                style={{
                  color: COLORS.primary,
                  fontWeight: "bold",
                  fontSize: 16,
                }}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>
    </>
  );
}

// Create nested stack navigators for each tab
function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: "horizontal",
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen
        name="ListingDetail"
        component={ListingDetailScreen}
        options={{
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              transform: [
                {
                  translateY: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [height, 0],
                    extrapolate: "clamp",
                  }),
                },
              ],
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
                extrapolate: "clamp",
              }),
            },
          }),
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      />
    </Stack.Navigator>
  );
}

function ExploreStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: "horizontal",
      }}
    >
      <Stack.Screen name="ExploreMain" component={ExploreScreen} />
      <Stack.Screen
        name="DestinationDetail"
        component={DestinationDetailScreen}
        options={{
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              transform: [
                {
                  translateY: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [height, 0],
                    extrapolate: "clamp",
                  }),
                },
              ],
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
                extrapolate: "clamp",
              }),
            },
          }),
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      />
      <Stack.Screen
        name="ListingDetail"
        component={ListingDetailScreen}
        options={{
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              transform: [
                {
                  translateY: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [height, 0],
                    extrapolate: "clamp",
                  }),
                },
              ],
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
                extrapolate: "clamp",
              }),
            },
          }),
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      />
    </Stack.Navigator>
  );
}

function WishlistStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: "horizontal",
      }}
    >
      <Stack.Screen name="WishlistMain" component={WishlistScreen} />
      <Stack.Screen
        name="ListingDetail"
        component={ListingDetailScreen}
        options={{
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              transform: [
                {
                  translateY: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [height, 0],
                    extrapolate: "clamp",
                  }),
                },
              ],
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
                extrapolate: "clamp",
              }),
            },
          }),
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      />
    </Stack.Navigator>
  );
}

function BookingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: "horizontal",
      }}
    >
      <Stack.Screen name="BookingsMain" component={MyBookingScreen} />
      <Stack.Screen
        name="ListingDetail"
        component={ListingDetailScreen}
        options={{
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              transform: [
                {
                  translateY: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [height, 0],
                    extrapolate: "clamp",
                  }),
                },
              ],
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
                extrapolate: "clamp",
              }),
            },
          }),
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      />
    </Stack.Navigator>
  );
}

function HostStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: "horizontal",
      }}
    >
      <Stack.Screen name="HostMain" component={HostDashboardScreen} />
      <Stack.Screen
        name="CreateListing"
        component={CreateListingScreen}
        options={{
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              transform: [
                {
                  translateY: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [height, 0],
                    extrapolate: "clamp",
                  }),
                },
              ],
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
                extrapolate: "clamp",
              }),
            },
          }),
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      />
      <Stack.Screen
        name="EditListing"
        component={EditListingScreen}
        options={{
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              transform: [
                {
                  translateY: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [height, 0],
                    extrapolate: "clamp",
                  }),
                },
              ],
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
                extrapolate: "clamp",
              }),
            },
          }),
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      />
      <Stack.Screen
        name="GuestRequest"
        component={GuestRequestScreen}
        options={{
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              transform: [
                {
                  translateY: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [height, 0],
                    extrapolate: "clamp",
                  }),
                },
              ],
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
                extrapolate: "clamp",
              }),
            },
          }),
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      />
      <Stack.Screen
        name="ListingDetail"
        component={ListingDetailScreen}
        options={{
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              transform: [
                {
                  translateY: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [height, 0],
                    extrapolate: "clamp",
                  }),
                },
              ],
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
                extrapolate: "clamp",
              }),
            },
          }),
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: "horizontal",
      }}
    >
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

function BecomeHostStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: "horizontal",
      }}
    >
      <Stack.Screen name="BecomeHostIntro" component={BecomeHostScreen} />
      <Stack.Screen
        name="CreateListing"
        component={CreateListingScreen}
        options={{
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              transform: [
                {
                  translateY: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [height, 0],
                    extrapolate: "clamp",
                  }),
                },
              ],
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
                extrapolate: "clamp",
              }),
            },
          }),
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      />
      <Stack.Screen
        name="EditListing"
        component={EditListingScreen}
        options={{
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: {
              transform: [
                {
                  translateY: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [height, 0],
                    extrapolate: "clamp",
                  }),
                },
              ],
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
                extrapolate: "clamp",
              }),
            },
          }),
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      />
    </Stack.Navigator>
  );
}

function GuestRequestStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: "horizontal",
      }}
    >
      <Stack.Screen name="GuestRequestMain" component={GuestRequestScreen} />
    </Stack.Navigator>
  );
}

function AdminStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: "horizontal",
      }}
    >
      <Stack.Screen name="AdminMain" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminUserManagement" component={AdminUserManagementScreen} />
      <Stack.Screen name="AdminPropertyManagement" component={AdminPropertyManagementScreen} />
      <Stack.Screen name="AdminBookingManagement" component={AdminBookingManagementScreen} />
      <Stack.Screen name="AdminAnalytics" component={AdminAnalyticsScreen} />
    </Stack.Navigator>
  );
}

function MainTabs({ navigation }) {
  const { user } = useContext(AuthContext);

  // Determine if user is a host
  const isHost = user?.role === "host";

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
      initialRouteName="Home"
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen
        name="Explore"
        component={ExploreStack}
        options={{ unmountOnBlur: true }}
      />
      {isHost && <Tab.Screen name="Host" component={HostStack} />}
      <Tab.Screen name="Bookings" component={BookingsStack} />
      <Tab.Screen
        name="More"
        children={() => null}
        options={{ tabBarLabel: "More" }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <WishlistProvider>
          <NavigationContainer>
            <StatusBar style="auto" />
            <AppNavigator />
          </NavigationContainer>
        </WishlistProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

function AppNavigator() {
  const { user, loading } = useContext(AuthContext);

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // Auth screens
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : user.role === "admin" ? (
        // Admin screens
        <Stack.Screen name="AdminStack" component={AdminStack} />
      ) : (
        // Regular user screens
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="ProfileStack" component={ProfileStack} />
          <Stack.Screen name="BecomeHostStack" component={BecomeHostStack} />
          <Stack.Screen name="WishlistStack" component={WishlistStack} />
          <Stack.Screen name="GuestRequestStack" component={GuestRequestStack} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    height: getTabBarHeight(),
    paddingBottom: getResponsiveSize(16, 18, 20, 24),
    paddingTop: getResponsiveSize(6, 8, 10, 12),
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    ...getShadow("md"),
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical:
      Platform.OS === "android" ? 0 : getResponsiveSize(6, 8, 10, 12),
    paddingHorizontal:
      Platform.OS === "android" ? 0 : getResponsiveSize(10, 12, 14, 16),
    borderRadius: getResponsiveSize(12, 14, 16, 18),
    minWidth:
      Platform.OS === "android" ? undefined : getResponsiveSize(50, 55, 60, 65),
    backgroundColor: "transparent",
    transition: "all 0.2s ease",
  },
  tabLabel: {
    fontSize: getResponsiveSize(10, 11, 12, 13),
    color: COLORS.textMuted,
    fontWeight: "500",
    marginTop: getResponsiveSize(2, 3, 4, 5),
  },
});
