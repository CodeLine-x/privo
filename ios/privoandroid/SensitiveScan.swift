import Foundation
import Vision
import UIKit
import React
import CoreImage
import CoreGraphics

@objc(SensitiveScan)
class SensitiveScan: NSObject {
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  @objc
  func detectFaces(_ imagePath: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    // Handle React Native file URIs by removing file:// prefix if present
    let processedPath = imagePath.replacingOccurrences(of: "file://", with: "")
    
    // Try loading with contentsOfFile first, then fall back to Data loading for WebP support
    var image: UIImage?
    
    if let img = UIImage(contentsOfFile: processedPath) {
      image = img
    } else if let data = NSData(contentsOfFile: processedPath), let img = UIImage(data: data as Data) {
      image = img
    }
    
    guard let finalImage = image else {
      rejecter("IMAGE_LOAD_ERROR", "Failed to load image", nil)
      return
    }
    
    guard let cgImage = finalImage.cgImage else {
      rejecter("IMAGE_CONVERSION_ERROR", "Failed to convert image", nil)
      return
    }
    
    // Run face detection on a background queue
    DispatchQueue.global(qos: .userInitiated).async {
      self.detectFacesWithCoordinates(in: cgImage, imageSize: finalImage.size) { faceData in
        DispatchQueue.main.async {
          let hasFaces = faceData.count > 0
          resolver([
            "hasFaces": hasFaces,
            "faceCount": faceData.count,
            "message": hasFaces ? "Sensitive content detected!" : "No sensitive content found",
            "faces": faceData
          ])
        }
      }
    }
  }
  
  private func detectFacesWithCoordinates(in image: CGImage, imageSize: CGSize, completion: @escaping ([[String: Any]]) -> Void) {
    let request = VNDetectFaceRectanglesRequest()
    let handler = VNImageRequestHandler(cgImage: image, options: [:])
    
    do {
      try handler.perform([request])
      
      if let observations = request.results as? [VNFaceObservation] {
        let faceData = observations.map { observation -> [String: Any] in
          // Vision framework uses normalized coordinates (0-1) with origin at bottom-left
          // UIImage uses pixel coordinates with origin at top-left
          let boundingBox = observation.boundingBox
          
          // Convert to pixel coordinates
          let pixelX = boundingBox.origin.x * imageSize.width
          let pixelWidth = boundingBox.size.width * imageSize.width
          let pixelHeight = boundingBox.size.height * imageSize.height
          
          // Flip Y coordinate from bottom-left to top-left origin
          let pixelY = imageSize.height - (boundingBox.origin.y * imageSize.height + pixelHeight)
          
          return [
            "x": pixelX,
            "y": pixelY,
            "width": pixelWidth,
            "height": pixelHeight,
            "confidence": observation.confidence
          ]
        }
        completion(faceData)
      } else {
        completion([])
      }
    } catch {
      completion([])
    }
  }
  
  @objc
  func blurFacesInImage(_ imagePath: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    // Handle React Native file URIs by removing file:// prefix if present
    let processedPath = imagePath.replacingOccurrences(of: "file://", with: "")
    
    // Try loading with contentsOfFile first, then fall back to Data loading for WebP support
    var image: UIImage?
    
    if let img = UIImage(contentsOfFile: processedPath) {
      image = img
    } else if let data = NSData(contentsOfFile: processedPath), let img = UIImage(data: data as Data) {
      image = img
    }
    
    guard let originalImage = image else {
      rejecter("IMAGE_LOAD_ERROR", "Failed to load image", nil)
      return
    }
    
    guard let cgImage = originalImage.cgImage else {
      rejecter("IMAGE_CONVERSION_ERROR", "Failed to convert image", nil)
      return
    }
    
    // Run face detection and blurring on a background queue
    DispatchQueue.global(qos: .userInitiated).async {
      self.detectFacesWithCoordinates(in: cgImage, imageSize: originalImage.size) { faceData in
        
        guard !faceData.isEmpty else {
          // No faces found, return original image path
          DispatchQueue.main.async {
            resolver([
              "success": true,
              "blurredImagePath": imagePath,
              "facesBlurred": 0,
              "message": "No faces found to blur"
            ])
          }
          return
        }
        
        // Apply blur to faces
        if let blurredImage = self.blurFacesInUIImage(originalImage, faceData: faceData) {
          // Save blurred image to temporary location
          let tempDir = FileManager.default.temporaryDirectory
          let fileName = (processedPath as NSString).lastPathComponent
          let nameWithoutExtension = (fileName as NSString).deletingPathExtension
          let fileExtension = (fileName as NSString).pathExtension
          let blurredFileName = "\(nameWithoutExtension)_blurred.\(fileExtension)"
          let blurredImagePath = tempDir.appendingPathComponent(blurredFileName).path
          
          if let imageData = blurredImage.jpegData(compressionQuality: 0.9) {
            do {
              try imageData.write(to: URL(fileURLWithPath: blurredImagePath))
              
              DispatchQueue.main.async {
                resolver([
                  "success": true,
                  "blurredImagePath": "file://\(blurredImagePath)",
                  "facesBlurred": faceData.count,
                  "message": "Successfully blurred \(faceData.count) face(s)"
                ])
              }
            } catch {
              DispatchQueue.main.async {
                rejecter("SAVE_ERROR", "Failed to save blurred image", nil)
              }
            }
          } else {
            DispatchQueue.main.async {
              rejecter("IMAGE_DATA_ERROR", "Failed to convert blurred image to data", nil)
            }
          }
        } else {
          DispatchQueue.main.async {
            rejecter("BLUR_ERROR", "Failed to apply blur to image", nil)
          }
        }
      }
    }
  }
  
  private func blurFacesInUIImage(_ image: UIImage, faceData: [[String: Any]]) -> UIImage? {
    // Start with original image
    UIGraphicsBeginImageContextWithOptions(image.size, false, image.scale)
    image.draw(at: .zero)
    
    // Get the current context
    guard let context = UIGraphicsGetCurrentContext() else {
      UIGraphicsEndImageContext()
      return nil
    }
    
    // Apply blur to each face region
    for face in faceData {
      guard let x = face["x"] as? CGFloat,
            let y = face["y"] as? CGFloat,
            let width = face["width"] as? CGFloat,
            let height = face["height"] as? CGFloat else { continue }
      
      // Add padding around face for better blur coverage
      let padding: CGFloat = 30
      let blurRect = CGRect(
        x: max(0, x - padding),
        y: max(0, y - padding),
        width: min(image.size.width - max(0, x - padding), width + 2 * padding),
        height: min(image.size.height - max(0, y - padding), height + 2 * padding)
      )
      
      // Save the graphics state
      context.saveGState()
      
      // Create elliptical clipping path for more natural blur
      let ellipsePath = UIBezierPath(ovalIn: blurRect)
      ellipsePath.addClip()
      
      // Create blurred version of the face region
      let faceImage = cropImage(image, to: blurRect)
      if let blurredFaceImage = applyBlur(to: faceImage) {
        blurredFaceImage.draw(in: blurRect)
      }
      
      // Restore the graphics state
      context.restoreGState()
    }
    
    let blurredImage = UIGraphicsGetImageFromCurrentImageContext()
    UIGraphicsEndImageContext()
    
    return blurredImage
  }
  
  private func cropImage(_ image: UIImage, to rect: CGRect) -> UIImage? {
    UIGraphicsBeginImageContextWithOptions(rect.size, false, image.scale)
    image.draw(at: CGPoint(x: -rect.origin.x, y: -rect.origin.y))
    let croppedImage = UIGraphicsGetImageFromCurrentImageContext()
    UIGraphicsEndImageContext()
    return croppedImage
  }
  
  private func applyBlur(to image: UIImage?) -> UIImage? {
    guard let image = image,
          let ciImage = CIImage(image: image) else { return nil }
    
    let blurFilter = CIFilter(name: "CIGaussianBlur")!
    blurFilter.setValue(ciImage, forKey: kCIInputImageKey)
    blurFilter.setValue(25.0, forKey: kCIInputRadiusKey) // Increased blur for better privacy
    
    guard let outputImage = blurFilter.outputImage else { return nil }
    
    let context = CIContext()
    guard let cgImage = context.createCGImage(outputImage, from: ciImage.extent) else { return nil }
    
    return UIImage(cgImage: cgImage)
  }
  
}