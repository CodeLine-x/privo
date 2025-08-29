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

  const processImageForFaces = async (imagePath: string): Promise<{ hasFaces: boolean; faceCount: number }> => {
    try {
      const result = await NativeBridge.detectFaces(imagePath);
      
      if (result.hasFaces) {
        const blurResult = await NativeBridge.blurFacesInImage(imagePath);
        if (blurResult.success) {
          await storageManager.updateImageWithBlurredVersion(imagePath, blurResult.blurredImagePath);
        }
      }
      
      return { hasFaces: result.hasFaces, faceCount: result.faceCount };
    } catch (error) {
      console.error("Error processing image for faces:", error);
      return { hasFaces: false, faceCount: 0 };
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
        const updatedImages = [...selectedImages, ...validImages];
        setSelectedImages(updatedImages);
        await storageManager.saveImages(updatedImages);
        
        // Process each image for face detection and blur
        let totalFaces = 0;
        let processedCount = 0;
        
        for (const imagePath of validImages) {
          const result = await processImageForFaces(imagePath);
          totalFaces += result.faceCount;
          if (result.hasFaces) processedCount++;
        }
        
        // Reload images to refresh the gallery with blurred versions
        await loadImagesFromStorage();
        
        // Show meaningful feedback
        if (totalFaces > 0) {
          Alert.alert(
            "Photo Processed", 
            `Found ${totalFaces} face(s) in ${processedCount} image(s). Faces have been automatically blurred for privacy.`
          );
        } else {
          Alert.alert("Success", "Photo taken successfully! No faces detected.");
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
        const updatedImages = [...selectedImages, ...validImages];
        setSelectedImages(updatedImages);
        await storageManager.saveImages(updatedImages);
        
        // Process each image for face detection and blur
        let totalFaces = 0;
        let processedCount = 0;
        
        for (const imagePath of validImages) {
          const result = await processImageForFaces(imagePath);
          totalFaces += result.faceCount;
          if (result.hasFaces) processedCount++;
        }
        
        // Reload images to refresh the gallery with blurred versions
        await loadImagesFromStorage();
        
        // Show meaningful feedback
        if (totalFaces > 0) {
          Alert.alert(
            "Images Processed", 
            `Selected ${validImages.length} image(s). Found ${totalFaces} face(s) in ${processedCount} image(s). Faces have been automatically blurred for privacy.`
          );
        } else {
          Alert.alert("Success", `${validImages.length} image(s) selected! No faces detected.`);
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
      "Are you sure you want to remove all uploaded images?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            setSelectedImages([]);
            await storageManager.saveImages([]);
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