import Foundation
import Vision
import UIKit
import CoreImage
import CoreGraphics

class ScanforText {
  
  static func detectText(in image: CGImage, imageSize: CGSize, completion: @escaping ([SensitiveCoordinate]) -> Void) {
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate // Better accuracy
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
        
        // Extract all detected text for PII analysis
        let allDetectedTexts = allTextCoordinates.compactMap { $0.textContent }
        
        // Use PIIDetector to identify sensitive text
        let piiTexts = PIIDetector.detectPII(in: allDetectedTexts)
        
        // Filter coordinates to only return PII text
        let piiCoordinates = allTextCoordinates.filter { coordinate in
            guard let textContent = coordinate.textContent else { return false }
            return piiTexts.contains(textContent)
        }
        
        completion(piiCoordinates)
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