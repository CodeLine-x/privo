import Foundation
import Vision
import UIKit
import CoreImage
import CoreGraphics

class ScanforFace {
  
  static func detectFaces(in image: CGImage, imageSize: CGSize, completion: @escaping ([SensitiveCoordinate]) -> Void) {
    let request = VNDetectFaceRectanglesRequest()
    let handler = VNImageRequestHandler(cgImage: image, options: [:])
    
    do {
      try handler.perform([request])
      
      if let observations = request.results {
        let faceCoordinates = observations.map { observation -> SensitiveCoordinate in
          // Vision framework uses normalized coordinates (0-1) with origin at bottom-left
          // UIImage uses pixel coordinates with origin at top-left
          let boundingBox = observation.boundingBox
          
          // Convert to pixel coordinates
          let pixelX = boundingBox.origin.x * imageSize.width
          let pixelWidth = boundingBox.size.width * imageSize.width
          let pixelHeight = boundingBox.size.height * imageSize.height
          
          // Flip Y coordinate from bottom-left to top-left origin
          let pixelY = imageSize.height - (boundingBox.origin.y * imageSize.height + pixelHeight)
          
          return SensitiveCoordinate(
            x: pixelX,
            y: pixelY,
            width: pixelWidth,
            height: pixelHeight,
            confidence: observation.confidence,
            type: .face
          )
        }
        completion(faceCoordinates)
      } else {
        completion([])
      }
    } catch {
      completion([])
    }
  }
  
  static func detectFacesAsync(in image: CGImage, imageSize: CGSize) async -> [SensitiveCoordinate] {
    return await withCheckedContinuation { continuation in
      detectFaces(in: image, imageSize: imageSize) { coordinates in
        continuation.resume(returning: coordinates)
      }
    }
  }
}