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
import { PasswordPrompt } from "./PasswordPrompt";

interface ImageGridProps {
  images: string[];
  onImagePress: (uri: string) => void;
  onImageLongPress: (index: number) => void;
}

export function ImageGrid({
  images,
  onImagePress,
  onImageLongPress,
}: ImageGridProps) {
  const [imageMetadata, setImageMetadata] = useState<ImageData[]>([]);
  const [passwordPromptVisible, setPasswordPromptVisible] = useState(false);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const storageManager = new StorageManager();

  useEffect(() => {
    loadImageMetadata();
  }, [images]);

  const loadImageMetadata = async () => {
    const metadata = await storageManager.loadImageMetadata();
    setImageMetadata(metadata);
  };

  const handleImagePress = (imageUri: string) => {
    // Check if this image has a blurred version (needs password)
    if (hasBlurredVersion(imageUri)) {
      setPendingImageUri(imageUri);
      setPasswordPromptVisible(true);
    } else {
      // No blurred version, open directly
      onImagePress(imageUri);
    }
  };

  const handlePasswordSuccess = () => {
    setPasswordPromptVisible(false);
    if (pendingImageUri) {
      onImagePress(pendingImageUri);
      setPendingImageUri(null);
    }
  };

  const handlePasswordCancel = () => {
    setPasswordPromptVisible(false);
    setPendingImageUri(null);
  };

  const getImageToDisplay = (imageUri: string): string => {
    // Show blurred version if available, otherwise show original
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
            onPress={() => handleImagePress(imageData.uri)}
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
              <View style={styles.imageOverlay}>
                <Text style={styles.imageText}>
                  {hasBlurredVersion(imageData.uri) ? "🔒" : "📷"}
                </Text>
              </View>
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

      <PasswordPrompt
        visible={passwordPromptVisible}
        onClose={handlePasswordCancel}
        onSuccess={handlePasswordSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  imageContainer: {
    width: "31%", // Slightly less than 33.33% to account for spacing
    aspectRatio: 1, // Square images
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
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  imageText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    width: "31%",
    aspectRatio: 1,
  },
});
