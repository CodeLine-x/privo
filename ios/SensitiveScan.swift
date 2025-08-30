import Foundation
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
  func scanAndBlurSensitiveContent(_ imagePath: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
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
    
    // Run face and text detection and blurring on a background queue
    DispatchQueue.global(qos: .userInitiated).async {
      let group = DispatchGroup()
      var faceCoordinates: [SensitiveCoordinate] = []
      var textCoordinates: [SensitiveCoordinate] = []
      
      group.enter()
      ScanforFace.detectFaces(in: cgImage, imageSize: originalImage.size) { faces in
        faceCoordinates = faces
        group.leave()
      }
      
      group.enter()
      ScanforText.detectText(in: cgImage, imageSize: originalImage.size) { text in
        textCoordinates = text
        group.leave()
      }
      
      group.notify(queue: .global(qos: .userInitiated)) {
        let allCoordinates = faceCoordinates + textCoordinates
        
        guard !allCoordinates.isEmpty else {
          // No sensitive content found, return original image path
          DispatchQueue.main.async {
            resolver([
              "success": true,
              "blurredImagePath": imagePath,
              "sensitiveItemsFound": 0,
              "sensitiveItemsBlurred": 0,
              "message": "No sensitive content found to blur",
              "coordinates": [],
              "debugDetectedTexts": ""
            ])
          }
          return
        }
        
        // Extract PII texts for debugging (these are already filtered by PIIDetector)
        let piiTextsDebug = allCoordinates
          .compactMap { $0.textContent }
          .joined(separator: ", ")
        
        // Apply blur to all sensitive content
        if let blurredImage = self.blurSensitiveContent(originalImage, coordinates: allCoordinates) {
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
                  "sensitiveItemsFound": allCoordinates.count,
                  "sensitiveItemsBlurred": allCoordinates.count,
                  "message": "Successfully blurred \(allCoordinates.count) sensitive item(s)",
                  "coordinates": allCoordinates.map { $0.toDictionary() },
                  "debugDetectedTexts": piiTextsDebug
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
  
  private func blurSensitiveContent(_ image: UIImage, coordinates: [SensitiveCoordinate]) -> UIImage? {
    // Start with original image
    UIGraphicsBeginImageContextWithOptions(image.size, false, image.scale)
    image.draw(at: .zero)
    
    // Get the current context
    guard let context = UIGraphicsGetCurrentContext() else {
      UIGraphicsEndImageContext()
      return nil
    }
    
    // Apply blur to each sensitive content region
    for coordinate in coordinates {
      let x = coordinate.x
      let y = coordinate.y
      let width = coordinate.width
      let height = coordinate.height
      
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