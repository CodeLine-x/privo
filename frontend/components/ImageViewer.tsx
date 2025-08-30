import React, { useState, useEffect } from "react";
import { Image, ImageStyle, StyleProp, View, StyleSheet } from "react-native";
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
});
