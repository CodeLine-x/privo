import React, { useState, useEffect } from "react";
import { Image, ImageStyle, StyleProp, View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { StorageManager, ImageData } from "../utils/StorageManager";

interface ImageViewerProps {
  uri: string;
  style?: StyleProp<ImageStyle>;
  onError?: () => void;
}

export function ImageViewer({ uri, style, onError }: ImageViewerProps) {
  const [imageMetadata, setImageMetadata] = useState<ImageData | undefined>();
  const [showBlurred, setShowBlurred] = useState(false);
  const storageManager = new StorageManager();

  useEffect(() => {
    loadImageMetadata();
  }, [uri]);

  const loadImageMetadata = async () => {
    const metadata = await storageManager.getImageMetadata(uri);
    setImageMetadata(metadata);
  };

  const getImageToDisplay = (): string => {
    // Toggle between original and blurred version
    if (showBlurred && imageMetadata?.blurredPath) {
      return imageMetadata.blurredPath;
    }
    return uri; // Show original by default
  };

  const hasBlurredVersion = (): boolean => {
    return !!imageMetadata?.blurredPath;
  };

  const toggleBlurView = () => {
    setShowBlurred(!showBlurred);
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
      
      {/* Toggle button - only show if there's a blurred version */}
      {hasBlurredVersion() && (
        <TouchableOpacity 
          style={styles.toggleButton} 
          onPress={toggleBlurView}
        >
          <Text style={styles.toggleText}>
            {showBlurred ? "👁️ Show Original" : "🔒 Show Blurred"}
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
    top: 50,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 1,
  },
  toggleText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});
