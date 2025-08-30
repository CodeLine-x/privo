import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableWithoutFeedback,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { StorageManager, ImageData } from "../utils/StorageManager";

interface ImageGridProps {
  images: string[];
  onImagePress: (uri: string, index: number) => void;
  onImageLongPress: (index: number) => void;
}

export function ImageGrid({
  images,
  onImagePress,
  onImageLongPress,
}: ImageGridProps) {
  const [imageMetadata, setImageMetadata] = useState<ImageData[]>([]);
  const storageManager = new StorageManager();

  useEffect(() => {
    loadImageMetadata();
  }, [images]);

  const loadImageMetadata = async () => {
    const metadata = await storageManager.loadImageMetadata();
    setImageMetadata(metadata);
  };

  const handleImagePress = (imageUri: string, index: number) => {
    // Always open PhotoViewer, let it handle password logic
    onImagePress(imageUri, index);
  };

  const getImageToDisplay = (imageUri: string): string => {
    // Show blurred version if available, otherwise show original
    // Note: thumbnailPath is now always undefined, so we skip it
    const metadata = imageMetadata.find(
      (item) => item.originalPath === imageUri
    );
    return metadata?.blurredPath || imageUri;
  };

  const hasBlurredVersion = (imageUri: string): boolean => {
    const metadata = imageMetadata.find(
      (item) => item.originalPath === imageUri
    );
    return !!metadata?.blurredPath;
  };

  // Sort images by upload date (newest first) and create 3-column grid
  const getSortedImagesWithMetadata = () => {
    return images
      .map((imageUri) => {
        const metadata = imageMetadata.find(
          (item) => item.originalPath === imageUri
        );
        return {
          uri: imageUri,
          metadata: metadata || {
            originalPath: imageUri,
            hasFaces: false,
            uploadedAt: Date.now(),
          },
        };
      })
      .sort((a, b) => b.metadata.uploadedAt - a.metadata.uploadedAt); // Descending order (newest first)
  };

  const renderImageGrid = () => {
    const sortedImages = getSortedImagesWithMetadata();
    const rows = [];

    // Create rows of 3 images each
    for (let i = 0; i < sortedImages.length; i += 3) {
      const row = sortedImages.slice(i, i + 3);
      rows.push(row);
    }

    return rows.map((row, rowIndex) => (
      <View key={`row-${rowIndex}`} style={styles.row}>
        {row.map((imageData, colIndex) => (
          <TouchableWithoutFeedback
            key={`image-${rowIndex}-${colIndex}`}
            onPress={() => {
              const originalIndex = images.indexOf(imageData.uri);
              handleImagePress(imageData.uri, originalIndex);
            }}
            onLongPress={() => {
              const originalIndex = images.indexOf(imageData.uri);
              onImageLongPress(originalIndex);
            }}
          >
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: getImageToDisplay(imageData.uri) }}
                style={styles.image}
                resizeMode="cover"
                onError={(error) => {
                  console.error("Image loading error:", error);
                }}
              />
              {hasBlurredVersion(imageData.uri) && (
                <View style={styles.imageOverlay}>
                  <Text style={styles.imageText}>Private</Text>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        ))}
        {/* Fill empty spaces in the last row to maintain grid alignment */}
        {row.length < 3 &&
          Array.from({ length: 3 - row.length }).map((_, index) => (
            <View
              key={`empty-${rowIndex}-${index}`}
              style={styles.emptyContainer}
            />
          ))}
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {renderImageGrid()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  imageContainer: {
    width: "31.5%",
    aspectRatio: 1,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#F78231",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  imageText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  emptyContainer: {
    width: "31.5%",
    aspectRatio: 1,
  },
});
