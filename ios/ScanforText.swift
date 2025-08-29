import Foundation
import Vision
import UIKit
import CoreImage
import CoreGraphics

class ScanforText {
  
  static func detectText(in image: CGImage, imageSize: CGSize, completion: @escaping ([SensitiveCoordinate]) -> Void) {
    let request = VNRecognizeTextRequest()
    let handler = VNImageRequestHandler(cgImage: image, options: [:])
    
    do {
      try handler.perform([request])
      
      if let observations = request.results {
        // Create all text coordinates first
        let allTextCoordinates = observations.compactMap { observation -> SensitiveCoordinate? in
          let detectedText = observation.topCandidates(1).first?.string ?? ""
          guard !detectedText.isEmpty else { return nil }
          
          let boundingBox = observation.boundingBox
          let pixelX = boundingBox.origin.x * imageSize.width
          let pixelWidth = boundingBox.size.width * imageSize.width
          let pixelHeight = boundingBox.size.height * imageSize.height
          let pixelY = imageSize.height - (boundingBox.origin.y * imageSize.height + pixelHeight)
          
          return SensitiveCoordinate(
            x: pixelX,
            y: pixelY,
            width: pixelWidth,
            height: pixelHeight,
            confidence: observation.confidence,
            type: .text,
            textContent: detectedText
          )
        }
        
        // Return all detected text coordinates
        completion(allTextCoordinates)
      } else {
        completion([])
      }
    } catch {
      completion([])
    }
  }
  
  static func detectTextAsync(in image: CGImage, imageSize: CGSize) async -> [SensitiveCoordinate] {
    return await withCheckedContinuation { continuation in
      detectText(in: image, imageSize: imageSize) { coordinates in
        continuation.resume(returning: coordinates)
      }
    }
  }
}