import React, { useEffect, useState } from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View, Platform } from "react-native";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import { Feather } from "@expo/vector-icons";
import { api } from "../constants/api";

const IOS_CLIENT_ID = "749009970460-gqv180tsfd00hiokv3ca39q7eeis2130.apps.googleusercontent.com";
const ANDROID_CLIENT_ID = "749009970460-6nf9bo28n45ouju5sipav245tkvaetqp.apps.googleusercontent.com";
const WEB_CLIENT_ID = "749009970460-9ogahv5mb8gcodm9spj3586jijugvht9.apps.googleusercontent.com";

export default function GoogleLoginButton({ onSuccess, buttonText = "Continue with Google", style }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
    redirectUri: AuthSession.makeRedirectUri({ useProxy: true }),
  });

  useEffect(() => {
    if (response?.type === "success") {
      handleGoogleSuccess(response.authentication.idToken);
    }
    // eslint-disable-next-line
  }, [response]);

  const handleGoogleSuccess = async (idToken) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/auth/google/mobile", { access_token: idToken });
      if (res.data.success && onSuccess) {
        onSuccess(res.data);
      } else {
        setError(res.data.message || "Google login failed");
      }
    } catch (err) {
      setError("Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={style}>
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={() => promptAsync()}
        disabled={loading}
        activeOpacity={0.85}
      >
        <Feather name="google" size={20} color="#fff" style={{ marginRight: 10 }} />
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{buttonText}</Text>
        )}
      </TouchableOpacity>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4285F4",
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 12,
    marginBottom: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
  },
});
