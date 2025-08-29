import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";

export interface ImageData {
  originalPath: string;
  blurredPath?: string;
  hasFaces: boolean;
  uploadedAt: number;
}

export class StorageManager {
  private readonly UPLOADED_IMAGES_KEY = "uploaded_images";
  private readonly IMAGE_METADATA_KEY = "image_metadata";

  async saveImages(images: string[]): Promise<void> {
    try {
      await FileSystem.writeAsStringAsync(
        FileSystem.documentDirectory + this.UPLOADED_IMAGES_KEY,
        JSON.stringify(images)
      );
    } catch (error) {
      console.error("Error saving images:", error);
    }
  }

  async loadImages(): Promise<string[]> {
    try {
      const fileUri = FileSystem.documentDirectory + this.UPLOADED_IMAGES_KEY;
      const fileExists = await FileSystem.getInfoAsync(fileUri);

      if (fileExists.exists) {
        const data = await FileSystem.readAsStringAsync(fileUri);
        const images = JSON.parse(data);

        const validImages =
          Platform.OS === "ios"
            ? images.filter((uri: string) => !uri.startsWith("ph://"))
            : images;

        if (validImages.length !== images.length) {
          await this.saveImages(validImages);
        }

        return validImages;
      }
    } catch (error) {
      console.error("Error loading images:", error);
      try {
        await this.saveImages([]);
        return [];
      } catch (clearError) {
        console.error("Error clearing storage:", clearError);
      }
    }

    return [];
  }

  async saveImageMetadata(imageData: ImageData[]): Promise<void> {
    try {
      await FileSystem.writeAsStringAsync(
        FileSystem.documentDirectory + this.IMAGE_METADATA_KEY,
        JSON.stringify(imageData)
      );
    } catch (error) {
      console.error("Error saving image metadata:", error);
    }
  }

  async loadImageMetadata(): Promise<ImageData[]> {
    try {
      const fileUri = FileSystem.documentDirectory + this.IMAGE_METADATA_KEY;
      const fileExists = await FileSystem.getInfoAsync(fileUri);

      if (fileExists.exists) {
        const data = await FileSystem.readAsStringAsync(fileUri);
        return JSON.parse(data) as ImageData[];
      }
    } catch (error) {
      console.error("Error loading image metadata:", error);
    }
    return [];
  }

  async addImageWithMetadata(imagePath: string, hasFaces: boolean = false): Promise<void> {
    try {
      // Load existing data
      const images = await this.loadImages();
      const metadata = await this.loadImageMetadata();

      // Add new image to arrays
      const newImages = [...images, imagePath];
      const newMetadata: ImageData = {
        originalPath: imagePath,
        hasFaces,
        uploadedAt: Date.now()
      };

      // Save updated data
      await this.saveImages(newImages);
      await this.saveImageMetadata([...metadata, newMetadata]);
    } catch (error) {
      console.error("Error adding image with metadata:", error);
    }
  }

  async updateImageWithBlurredVersion(originalPath: string, blurredPath: string): Promise<void> {
    try {
      const metadata = await this.loadImageMetadata();
      
      // Check if metadata exists for this image, if not create it
      let updatedMetadata;
      const existingIndex = metadata.findIndex(item => item.originalPath === originalPath);
      
      if (existingIndex >= 0) {
        // Update existing metadata
        updatedMetadata = metadata.map(item => 
          item.originalPath === originalPath 
            ? { ...item, blurredPath } 
            : item
        );
      } else {
        // Create new metadata entry
        const newMetadata: ImageData = {
          originalPath,
          blurredPath,
          hasFaces: true,
          uploadedAt: Date.now()
        };
        updatedMetadata = [...metadata, newMetadata];
      }
      
      await this.saveImageMetadata(updatedMetadata);
    } catch (error) {
      console.error("Error updating image with blurred version:", error);
    }
  }

  async getImageMetadata(imagePath: string): Promise<ImageData | undefined> {
    try {
      const metadata = await this.loadImageMetadata();
      return metadata.find(item => item.originalPath === imagePath);
    } catch (error) {
      console.error("Error getting image metadata:", error);
      return undefined;
    }
  }

  async removeImageAndMetadata(imagePath: string): Promise<void> {
    try {
      const images = await this.loadImages();
      const metadata = await this.loadImageMetadata();

      const updatedImages = images.filter(img => img !== imagePath);
      const updatedMetadata = metadata.filter(item => item.originalPath !== imagePath);

      await this.saveImages(updatedImages);
      await this.saveImageMetadata(updatedMetadata);
    } catch (error) {
      console.error("Error removing image and metadata:", error);
    }
  }
}