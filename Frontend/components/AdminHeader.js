import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

export default function AdminHeader({ title = "Admin Panel", showBack, onBackPress }) {
  return (
    <View style={{
      height: 60,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      zIndex: 100,
      elevation: 4,
    }}>
      {showBack && (
        <TouchableOpacity onPress={onBackPress} style={{ position: 'absolute', left: 16, padding: 8 }}>
          <Feather name="arrow-left" size={24} color="#f43f5e" />
        </TouchableOpacity>
      )}
      <Text style={{ fontSize: 20, fontWeight: '700', color: '#f43f5e' }}>{title}</Text>
    </View>
  );
} 