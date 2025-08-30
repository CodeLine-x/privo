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
import { ImageViewer } from "../components/ImageViewer";
import { UploadButton } from "../components/UploadButton";
import { ClearButton } from "../components/ClearButton";
import { ImageGrid } from "../components/ImageGrid";
import { ImageHandler } from "../utils/ImageHandler";
import { StorageManager } from "../utils/StorageManager";
import { NativeBridge } from "../utils/NativeBridge";
import * as FileSystem from "expo-file-system";

export function GalleryScreen() {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);

  const imageHandler = new ImageHandler();
  const storageManager = new StorageManager();

  useEffect(() => {
    loadImagesFromStorage();
  }, []);

  const loadImagesFromStorage = async () => {
    const images = await storageManager.loadImages();
    setSelectedImages(images);
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

      // Use the debug field directly from native response
      const detectedTexts = result.debugDetectedTexts || "";

      if (result.success && result.sensitiveItemsBlurred > 0) {
        await storageManager.updateImageWithBlurredVersion(
          imagePath,
          result.blurredImagePath,
          result.faceCount,
          result.textCount,
          result.piiCount
        );
      }

      return {
        hasSensitiveContent: result.sensitiveItemsFound > 0,
        itemCount: result.sensitiveItemsFound,
        detectedTexts,
      };
    } catch (error) {
      console.error("Error processing image for sensitive content:", error);
      return { hasSensitiveContent: false, itemCount: 0 };
    }
  };

  const handleUpload = async () => {
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

  const openImageModal = async (imageUri: string) => {
    try {
      const processedUri = await imageHandler.handleImageUri(imageUri);
      if (processedUri && imageHandler.isValidImageUri(processedUri)) {
        setSelectedImage(processedUri);
        setIsImageModalVisible(true);
      } else {
        Alert.alert(
          "Error",
          "This image cannot be displayed. Please try uploading it again."
        );
      }
    } catch (error) {
      console.error("Error opening image modal:", error);
      Alert.alert("Error", "Unable to display this image. Please try again.");
    }
  };

  const closeImageModal = () => {
    setIsImageModalVisible(false);
    setSelectedImage(null);
  };

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
          <UploadButton onPress={handleUpload} />
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
            onImagePress={openImageModal}
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

      <Modal
        visible={isImageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <TouchableWithoutFeedback onPress={closeImageModal}>
          <View style={styles.modalOverlay}>
            {selectedImage && (
              <ImageViewer
                uri={selectedImage}
                style={styles.fullScreenImage}
                onError={closeImageModal}
              />
            )}
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212529",
  },
  imageCount: {
    fontSize: 14,
    color: "#6c757d",
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  scrollView: {
    flex: 1,
    padding: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: "#6c757d",
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#adb5bd",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "100%",
    height: "100%",
  },
});
