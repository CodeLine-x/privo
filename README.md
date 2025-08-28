# Privo Android - Image Library App

A React Native app built with Expo that allows users to upload and manage images in a beautiful grid layout.

## Features

- **Persistent Storage**: Uploaded images are saved locally and persist even after closing the app
- **Image Upload**: Upload images from your device's gallery or take new photos with the camera
- **Multiple Selection**: Select multiple images at once from the gallery
- **Full Screen View**: Tap any image to view it in full screen
- **Visual Indicators**: Uploaded images have a blue overlay with "Uploaded" label
- **Image Management**: Long press on uploaded images to remove them, or use the Clear button to remove all
- **Image Counter**: See how many images you've uploaded in the header
- **Responsive Layout**: Horizontal scroll for easy browsing of uploaded images

## How to Use

1. **Upload Images**: Tap the "Upload" button in the top right corner
2. **Choose Source**: Select either "Camera" to take a new photo or "Gallery" to pick existing images
3. **Select Images**: When choosing from gallery, you can select multiple images
4. **View Uploads**: Your uploaded images will appear in a horizontal scroll with blue overlays
5. **Full Screen View**: Tap any image to view it in full screen
6. **Remove Images**: Long press on any uploaded image to remove it, or use the "Clear" button to remove all
7. **Persistent Storage**: Your uploaded images will be saved and remain even after closing and reopening the app

## Technical Details

- Built with React Native and Expo
- Uses `expo-image-picker` for image selection and camera access
- Uses `expo-media-library` for gallery permissions
- Uses `expo-file-system` for persistent local storage
- Responsive design that adapts to different screen sizes
- TypeScript for type safety

## Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm start
   ```

3. Run on your preferred platform:
   ```bash
   npm run android  # For Android
   npm run ios      # For iOS
   npm run web      # For Web
   ```

## Permissions

The app requires the following permissions:

- Camera access (for taking photos)
- Media library access (for selecting images from gallery)

These permissions will be requested when you first try to use the respective features.
