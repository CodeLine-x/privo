import React, { useState, useEffect } from "react";
import {
  Image,
  ImageStyle,
  StyleProp,
  View,
  StyleSheet,
  Text,
} from "react-native";
import { StorageManager, ImageData } from "../utils/StorageManager";

interface ImageViewerProps {
  uri: string;
  style?: StyleProp<ImageStyle>;
  onError?: () => void;
}

export function ImageViewer({ uri, style, onError }: ImageViewerProps) {
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
    // Always show the original image when accessed through password
    return uri;
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

      {/* Display detection information */}
      {imageMetadata && (
        <View style={styles.detectionInfo}>
          <Text style={styles.detectionTitle}>Detection Results:</Text>
          <Text style={styles.detectionText}>
            Faces: {imageMetadata.faceCount || 0}
          </Text>
          <Text style={styles.detectionText}>
            Text Elements: {imageMetadata.textCount || 0}
          </Text>
          <Text style={styles.detectionText}>
            PII Elements: {imageMetadata.piiCount || 0}
          </Text>
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
  detectionInfo: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: 15,
    borderRadius: 10,
  },
  detectionTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  detectionText: {
    color: "white",
    fontSize: 14,
    marginBottom: 4,
  },
});
