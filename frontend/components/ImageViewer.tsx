import React, { useState, useEffect } from "react";
import {
  Image,
  ImageStyle,
  StyleProp,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
} from "react-native";
import { StorageManager, ImageData } from "../utils/StorageManager";

interface ImageViewerProps {
  uri: string;
  style?: StyleProp<ImageStyle>;
  onError?: () => void;
  showClearImage?: boolean;
}

export function ImageViewer({
  uri,
  style,
  onError,
  showClearImage = false,
}: ImageViewerProps) {
  const [imageMetadata, setImageMetadata] = useState<ImageData | undefined>();
  const storageManager = new StorageManager();

  useEffect(() => {
    loadImageMetadata();
  }, [uri]);

  const loadImageMetadata = async () => {
    const metadata = await storageManager.getImageMetadata(uri);
    setImageMetadata(metadata);
  };

  const getImageToDisplay = (): string => {
    // If showClearImage is true, always show original
    // Otherwise, show blurred version if available
    if (showClearImage) {
      return uri; // Always show original when password is entered
    }
    return imageMetadata?.blurredPath || uri; // Show blurred version as default
  };

  const hasBlurredVersion = (): boolean => {
    return !!imageMetadata?.blurredPath;
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

      {/* Show image information when clear image is displayed */}
      {showClearImage && imageMetadata && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Image Analysis Results:</Text>

          {imageMetadata.faceCount !== undefined && (
            <Text style={styles.infoText}>
              Number of face(s) in the picture: {imageMetadata.faceCount}
            </Text>
          )}

          {imageMetadata.detectedTexts &&
            imageMetadata.detectedTexts.length > 0 && (
              <Text style={styles.infoText}>
                Text found in picture: [{imageMetadata.detectedTexts.join(", ")}
                ]
              </Text>
            )}

          {imageMetadata.piiTexts && imageMetadata.piiTexts.length > 0 && (
            <Text style={styles.infoText}>
              PIIs detected: [{imageMetadata.piiTexts.join(", ")}]
            </Text>
          )}
        </View>
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
  infoContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: 16,
    borderRadius: 12,
    zIndex: 1,
  },
  infoTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  infoText: {
    color: "#ffffff",
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
});
