import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  TouchableWithoutFeedback,
  Modal,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { PhotoViewerScreen } from "./PhotoViewerScreen";
import { ClearButton } from "../components/ClearButton";
import { ImageGrid } from "../components/ImageGrid";
import { BottomNavBar } from "../components/BottomNavBar";
import { ImageHandler } from "../utils/ImageHandler";
import { StorageManager, ImageData } from "../utils/StorageManager";
import { NativeBridge } from "../utils/NativeBridge";
import * as FileSystem from "expo-file-system";

export function GalleryScreen() {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentScreen, setCurrentScreen] = useState<"gallery" | "photoViewer">(
    "gallery"
  );
  const [photoViewerInitialIndex, setPhotoViewerInitialIndex] = useState(0);
  const [imageMetadata, setImageMetadata] = useState<ImageData[]>([]);

  const imageHandler = new ImageHandler();
  const storageManager = new StorageManager();

  useEffect(() => {
    loadImagesFromStorage();
  }, []);

  const loadImagesFromStorage = async () => {
    const images = await storageManager.loadImages();
    const metadata = await storageManager.loadImageMetadata();
    setSelectedImages(images);
    setImageMetadata(metadata);
  };

  // Get the image to display (blurred version if available, otherwise original)
  const getImageToDisplay = (imageUri: string): string => {
    const metadata = imageMetadata.find(
      (item) => item.originalPath === imageUri
    );
    // Only use blurredPath if it exists and is different from original
    return metadata?.blurredPath || imageUri;
  };

  // Get all images to display in PhotoViewer (blurred versions)
  const getPhotoViewerImages = (): string[] => {
    return selectedImages.map((imageUri) => getImageToDisplay(imageUri));
  };

  const processImageForSensitiveContent = async (
    imagePath: string
  ): Promise<{
    hasSensitiveContent: boolean;
    itemCount: number;
    detectedTexts?: string;
  }> => {
    try {
      const result = await NativeBridge.scanAndBlurSensitiveContent(imagePath);

      // Always store metadata, whether sensitive content was found or not
      const detectedTextsArray: string[] = [];
      const piiTexts: string[] = [];

      // Extract PII texts from the new array format
      if (result.piiTexts && Array.isArray(result.piiTexts)) {
        piiTexts.push(...result.piiTexts);
      }

      // Extract detected texts from debugDetectedTexts (fallback)
      if (result.debugDetectedTexts) {
        const texts = result.debugDetectedTexts
          .split(", ")
          .filter((text) => text.trim());
        detectedTextsArray.push(...texts);
      }

      // Store metadata with detection results
      // Only store blurredPath if sensitive content was detected and a different path was returned
      const hasSensitiveContent = result.sensitiveItemsFound > 0;
      const blurredPath = hasSensitiveContent && result.blurredImagePath !== imagePath 
        ? result.blurredImagePath 
        : undefined;
      
      await storageManager.updateImageWithBlurredVersion(
        imagePath,
        blurredPath || imagePath, // Use original path if no blur
        result.faceCount || 0,
        result.textCount || 0,
        result.piiCount || 0,
        detectedTextsArray,
        piiTexts
      );

      return {
        hasSensitiveContent: result.sensitiveItemsFound > 0,
        itemCount: result.sensitiveItemsFound,
        detectedTexts: result.debugDetectedTexts || "",
      };
    } catch (error) {
      console.error("Error processing image for sensitive content:", error);
      return { hasSensitiveContent: false, itemCount: 0 };
    }
  };

  const handleUpload = () => {
    Alert.alert("Upload Image", "Choose an option", [
      {
        text: "Camera",
        onPress: () => takePhoto(),
      },
      {
        text: "Gallery",
        onPress: () => pickFromGallery(),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const takePhoto = async () => {
    try {
      const validImages = await imageHandler.takePhoto();
      if (validImages.length > 0) {
        const updatedImages = [...validImages, ...selectedImages];
        setSelectedImages(updatedImages);
        await storageManager.saveImages(updatedImages);

        // Process each image for sensitive content detection and blur
        let totalSensitiveItems = 0;
        let processedCount = 0;
        let allDetectedTexts: string[] = [];

        for (const imagePath of validImages) {
          const result = await processImageForSensitiveContent(imagePath);
          totalSensitiveItems += result.itemCount;
          if (result.hasSensitiveContent) processedCount++;
          if (result.detectedTexts) {
            allDetectedTexts.push(result.detectedTexts);
          }
        }

        // Reload images to refresh the gallery with blurred versions
        await loadImagesFromStorage();

        // Show meaningful feedback with detected text debug info
        if (totalSensitiveItems > 0) {
          let message = `Found ${totalSensitiveItems} face(s) in ${processedCount} image. Faces have been blurred for privacy.`;

          message += `\n\nDetected Text: ${allDetectedTexts.join(", ")}`;

          Alert.alert("Photo Processed", message);
        } else {
          Alert.alert(
            "Success",
            "Photo taken successfully! No faces detected."
          );
        }
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  const pickFromGallery = async () => {
    try {
      const validImages = await imageHandler.pickFromGallery();
      if (validImages.length > 0) {
        const updatedImages = [...validImages, ...selectedImages];
        setSelectedImages(updatedImages);
        await storageManager.saveImages(updatedImages);

        // Process each image for sensitive content detection and blur
        let totalSensitiveItems = 0;
        let processedCount = 0;
        let allDetectedTexts: string[] = [];

        for (const imagePath of validImages) {
          const result = await processImageForSensitiveContent(imagePath);
          totalSensitiveItems += result.itemCount;
          if (result.hasSensitiveContent) processedCount++;
          if (result.detectedTexts) {
            allDetectedTexts.push(result.detectedTexts);
          }
        }

        // Reload images to refresh the gallery with blurred versions
        await loadImagesFromStorage();

        // Show meaningful feedback with detected text debug info
        if (totalSensitiveItems > 0) {
          let message = `Selected ${validImages.length} image(s). Found ${totalSensitiveItems} face(s) in ${processedCount} image(s). Faces have been blurred for privacy.`;

          message += `\n\nDetected Text: ${allDetectedTexts.join(", ")}`;

          Alert.alert("Images Processed", message);
        } else {
          Alert.alert(
            "Success",
            `${validImages.length} image(s) selected! No faces detected.`
          );
        }
      }
    } catch (error) {
      console.error("Error picking images:", error);
      Alert.alert("Error", "Failed to pick images. Please try again.");
    }
  };

  const removeImage = (index: number) => {
    Alert.alert("Remove Image", "Are you sure you want to remove this image?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          const updatedImages = selectedImages.filter((_, i) => i !== index);
          setSelectedImages(updatedImages);
          await storageManager.saveImages(updatedImages);
        },
      },
    ]);
  };

  const clearAllImages = async () => {
    Alert.alert(
      "Clear All Images",
      "Are you sure you want to remove all uploaded images and files?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("=== Clearing all images and files ===");

              // Clear the images from storage
              setSelectedImages([]);
              await storageManager.saveImages([]);

              // Clear all image files from cache and document directories
              const cacheDir = FileSystem.cacheDirectory;
              const documentDir = FileSystem.documentDirectory;

              if (!cacheDir || !documentDir) {
                throw new Error("Cache or document directory not available");
              }

              // List all files in cache directory
              const cacheFiles = await FileSystem.readDirectoryAsync(cacheDir);

              // List all files in document directory
              const documentFiles = await FileSystem.readDirectoryAsync(
                documentDir
              );

              let deletedCount = 0;

              // Delete cache image files
              for (const fileName of cacheFiles) {
                if (fileName.match(/\.(jpg|jpeg|png|webp)$/i)) {
                  const filePath = `${cacheDir}${fileName}`;
                  try {
                    await FileSystem.deleteAsync(filePath);
                    console.log(`Deleted cache file: ${fileName}`);
                    deletedCount++;
                  } catch (error) {
                    console.error(
                      `Failed to delete cache file ${fileName}:`,
                      error
                    );
                  }
                }
              }

              // Delete document image files
              for (const fileName of documentFiles) {
                if (fileName.match(/\.(jpg|jpeg|png|webp)$/i)) {
                  const filePath = `${documentDir}${fileName}`;
                  try {
                    await FileSystem.deleteAsync(filePath);
                    console.log(`Deleted document file: ${fileName}`);
                    deletedCount++;
                  } catch (error) {
                    console.error(
                      `Failed to delete document file ${fileName}:`,
                      error
                    );
                  }
                }
              }

              console.log(`Cleared ${deletedCount} image files`);

              Alert.alert(
                "Cleared Successfully",
                `Removed all images and deleted ${deletedCount} files.`
              );
            } catch (error) {
              console.error("Error clearing images and files:", error);
              Alert.alert(
                "Error",
                "Failed to clear some files. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const openPhotoViewer = async (imageUri: string, index: number) => {
    try {
      const processedUri = await imageHandler.handleImageUri(imageUri);
      if (processedUri && imageHandler.isValidImageUri(processedUri)) {
        setPhotoViewerInitialIndex(index);
        setCurrentScreen("photoViewer");
      } else {
        Alert.alert(
          "Error",
          "This image cannot be displayed. Please try uploading it again."
        );
      }
    } catch (error) {
      console.error("Error opening photo viewer:", error);
      Alert.alert("Error", "Unable to display this image. Please try again.");
    }
  };

  const closePhotoViewer = () => {
    setCurrentScreen("gallery");
  };

  if (currentScreen === "photoViewer") {
    return (
      <PhotoViewerScreen
        images={getPhotoViewerImages()}
        initialIndex={photoViewerInitialIndex}
        onBack={closePhotoViewer}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Privo Gallery</Text>
          {selectedImages.length > 0 && (
            <Text style={styles.imageCount}>
              {selectedImages.length} uploaded
            </Text>
          )}
        </View>
        <View style={styles.headerButtons}>
          {selectedImages.length > 0 && (
            <ClearButton onPress={clearAllImages} />
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {selectedImages.length > 0 ? (
          <ImageGrid
            images={selectedImages}
            onImagePress={openPhotoViewer}
            onImageLongPress={removeImage}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No uploaded images</Text>
            <Text style={styles.emptySubtext}>
              Upload some photos to get started!
            </Text>
          </View>
        )}
      </ScrollView>

      <BottomNavBar onUploadPress={handleUpload} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "#F7F7F7",
    paddingTop: 54,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2C2C2E",
    letterSpacing: -0.5,
  },
  imageCount: {
    fontSize: 15,
    color: "#8E8E93",
    marginTop: 4,
    fontWeight: "500",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 104,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    color: "#2C2C2E",
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
    fontWeight: "400",
    lineHeight: 22,
  },
});
