import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
} from "react-native";
import { COLORS, getHeaderHeight } from "../constants/theme";
import { Feather } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { api } from "../constants/api";
import AppHeader from "../components/AppHeader";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import { useToast } from '../context/ToastContext';
import AsyncStorage from "@react-native-async-storage/async-storage";
import GoogleLoginButton from "../components/GoogleLoginButton";

const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

const ANDROID_EXTRA_TOP =
  Platform.OS === "android" ? StatusBar.currentHeight || 24 : 0;
const HEADER_HEIGHT = getHeaderHeight() + ANDROID_EXTRA_TOP;

export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const toast = useToast();
  
  // Show logout toast when landing on login page after logout
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Check if user just logged out using the logout flag
      const checkLogout = async () => {
        try {
          const justLoggedOut = await AsyncStorage.getItem("justLoggedOut");
          if (justLoggedOut === "true") {
            // User just logged out, show toast and clear the flag
            toast.showToast("Logged out successfully", "info");
            await AsyncStorage.removeItem("justLoggedOut");
          }
        } catch (error) {
          console.error("Error checking logout status:", error);
        }
      };
      checkLogout();
    });

    return unsubscribe;
  }, [navigation, toast]);
  const [formData, setFormData] = useState({
    emailOrPhone: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Google OAuth setup
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId:
      "1085702517310-ruc0mnuai2roucks2i8e4ogh7jfn6i6v.apps.googleusercontent.com",
    iosClientId:
      "1085702517310-sbafv3ihnfvmnl2q9ni2rpieij66k4fu.apps.googleusercontent.com",
    androidClientId:
      "1085702517310-fm819crgb6nr797crvme0p0v0si8820s.apps.googleusercontent.com",
    redirectUri: AuthSession.makeRedirectUri({ useProxy: true }),
  });

  useEffect(() => {
    if (response?.type === "success") {
      handleGoogleSuccess(response.authentication.accessToken);
    }
  }, [response]);

  const handleGoogleSuccess = async (accessToken) => {
    setGoogleLoading(true);
    try {
      const response = await api.post("/api/auth/google", { accessToken });
      if (response.data.success) {
        login(response.data.user, response.data.token);
        toast.showToast("Login successful!", "success");
        navigation.replace("MainTabs");
      } else {
        console.error("Google login failed", response.data.message);
      }
    } catch (error) {
      console.error("Google login failed", error);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    if (!formData.emailOrPhone || !formData.password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10,15}$/;
    if (
      !emailRegex.test(formData.emailOrPhone) &&
      !phoneRegex.test(formData.emailOrPhone)
    ) {
      setError("Please enter a valid email or phone number");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/api/user/login", {
        emailOrPhone: formData.emailOrPhone,
        password: formData.password,
      });

      if (response.data.success) {
        login(response.data.user, response.data.token);
        toast.showToast("Login successful!", "success");
        
        // Navigate based on user role
        if (response.data.user.role === "admin") {
          navigation.replace("AdminStack");
        } else {
          navigation.replace("MainTabs");
        }
      } else {
        setError(response.data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login failed", error);
      setError(
        error.response?.data?.message || "An error occurred. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    promptAsync();
  };

  const handleSkip = () => {
    navigation.replace("MainTabs");
  };

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={{ height: HEADER_HEIGHT }} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Logo and App Title */}
          <View style={styles.logoContainer}>
            <Image source={require("../assets/icon.png")} style={styles.logo} />
            <Text style={styles.appTitle}>StayFindz</Text>
          </View>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            {error && (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={20} color="#dc2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Email or Phone Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email or Phone</Text>
              <View style={styles.inputWrapper}>
                <Feather
                  name="mail"
                  size={20}
                  color={COLORS.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.emailOrPhone}
                  onChangeText={(text) => handleChange("emailOrPhone", text)}
                  placeholder="Enter your email or phone"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Feather
                  name="lock"
                  size={20}
                  color={COLORS.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.password}
                  onChangeText={(text) => handleChange("password", text)}
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Sign in</Text>
              )}
            </TouchableOpacity>

            {/* Google Login Button */}
            <GoogleLoginButton
              buttonText="Sign in with Google"
              onSuccess={({ user, token }) => {
                login(user, token);
                toast.showToast("Login successful!", "success");
                
                // Navigate based on user role
                if (user.role === "admin") {
                  navigation.replace("AdminStack");
                } else {
                  navigation.replace("MainTabs");
                }
              }}
              style={{ marginTop: 8, marginBottom: 8 }}
            />

            {/* Skip Button */}
            <TouchableOpacity
              style={styles.skipLink}
              onPress={handleSkip}
              activeOpacity={0.8}
            >
              <Text style={styles.skipLinkText}>Skip for now</Text>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>
                Don't have an account?{" "}
                <Text
                  style={styles.signupLink}
                  onPress={() => navigation.navigate("Register")}
                >
                  Sign up
                </Text>
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: 16,
  },
  content: {
    paddingHorizontal: 20,
  },

  // Header styles
  header: {
    alignItems: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: "center",
  },

  // Form styles
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  inputContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
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
  eyeButton: {
    padding: 12,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Skip button styles
  skipLink: {
    alignItems: "center",
    marginTop: 12,
  },
  skipLinkText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 16,
  },

  // Sign up link styles
  signupContainer: {
    alignItems: "center",
    marginTop: 12,
  },
  signupText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  signupLink: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 18,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginBottom: 8,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 2,
    letterSpacing: 1,
  },
});
