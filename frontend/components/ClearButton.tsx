import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

interface ClearButtonProps {
  onPress: () => void;
}

export function ClearButton({ onPress }: ClearButtonProps) {
  return (
    <TouchableOpacity style={styles.clearButton} onPress={onPress}>
      <Text style={styles.clearButtonText}>Clear</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  clearButton: {
    backgroundColor: "#dc3545",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});