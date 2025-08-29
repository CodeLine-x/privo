import React, { useState, useEffect } from "react";
import { View, ScrollView, TouchableWithoutFeedback, Image, Text, StyleSheet, TouchableOpacity } from "react-native";
import { StorageManager, ImageData } from "../utils/StorageManager";

interface ImageGridProps {
  images: string[];
  onImagePress: (uri: string) => void;
  onImageLongPress: (index: number) => void;
}

export function ImageGrid({ images, onImagePress, onImageLongPress }: ImageGridProps) {
  const [imageMetadata, setImageMetadata] = useState<ImageData[]>([]);
  const storageManager = new StorageManager();

  useEffect(() => {
    loadImageMetadata();
  }, [images]);

  const loadImageMetadata = async () => {
    const metadata = await storageManager.loadImageMetadata();
    setImageMetadata(metadata);
  };

  const handleImagePress = (imageUri: string) => {
    // Simply open the image in full screen - no manual scanning needed
    onImagePress(imageUri);
  };


  const getImageToDisplay = (imageUri: string): string => {
    // Always show blurred version if available in main gallery
    const metadata = imageMetadata.find(item => item.originalPath === imageUri);
    return metadata?.blurredPath || imageUri;
  };

  const hasBlurredVersion = (imageUri: string): boolean => {
    const metadata = imageMetadata.find(item => item.originalPath === imageUri);
    return !!metadata?.blurredPath;
  };
  return (
    <View style={styles.uploadedSection}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
      >
        {images.map((imageUri, index) => (
          <TouchableWithoutFeedback
            key={`uploaded-${index}`}
            onPress={() => handleImagePress(imageUri)}
            onLongPress={() => onImageLongPress(index)}
          >
            <View style={styles.uploadedImageContainer}>
              <Image
                source={{ uri: getImageToDisplay(imageUri) }}
                style={styles.uploadedImage}
                resizeMode="cover"
                onError={(error) => {
                  console.error("Image loading error:", error);
                }}
              />
              <View style={styles.uploadedImageOverlay}>
                <Text style={styles.uploadedImageText}>
                  {hasBlurredVersion(imageUri) ? "Blurred" : "Uploaded"}
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  uploadedSection: {
    marginBottom: 20,
  },
  horizontalScroll: {
    paddingHorizontal: 10,
  },
  uploadedImageContainer: {
    width: 120,
    height: 120,
    marginRight: 10,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  uploadedImage: {
    width: "100%",
    height: "100%",
  },
  uploadedImageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 123, 255, 0.8)",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  uploadedImageText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});