import React, { useState, useEffect } from "react";
import { Image, ImageStyle, StyleProp, View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { StorageManager, ImageData } from "../utils/StorageManager";

interface ImageViewerProps {
  uri: string;
  style?: StyleProp<ImageStyle>;
  onError?: () => void;
}

export function ImageViewer({ uri, style, onError }: ImageViewerProps) {
  const [imageMetadata, setImageMetadata] = useState<ImageData | undefined>();
  const [showOriginal, setShowOriginal] = useState(false); // Start with blurred by default
  const storageManager = new StorageManager();

  useEffect(() => {
    loadImageMetadata();
  }, [uri]);

  const loadImageMetadata = async () => {
    const metadata = await storageManager.getImageMetadata(uri);
    setImageMetadata(metadata);
  };

  const getImageToDisplay = (): string => {
    if (!showOriginal && imageMetadata?.blurredPath) {
      return imageMetadata.blurredPath; // Show blurred
    }
    return uri; // Show original (fallback or when showOriginal is true)
  };

  const hasBlurredVersion = (): boolean => {
    return !!imageMetadata?.blurredPath;
  };

  const toggleVersion = () => {
    setShowOriginal(!showOriginal);
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: getImageToDisplay() }}
        style={style || styles.image}
        resizeMode="contain"
        onError={(error) => {
          console.error("Image loading error:", error);
          onError?.();
        }}
      />
      {hasBlurredVersion() && (
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={toggleVersion}
        >
          <Text style={styles.toggleButtonText}>
            {showOriginal ? "🔒" : "👁️"}
          </Text>
          <Text style={styles.toggleLabel}>
            {showOriginal ? "Hide" : "Show"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    width: "100%",
    height: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  toggleButton: {
    position: "absolute",
    top: 60,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
    zIndex: 1000,
  },
  toggleButtonText: {
    fontSize: 20,
    marginBottom: 4,
  },
  toggleLabel: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});