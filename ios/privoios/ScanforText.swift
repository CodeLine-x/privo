import Foundation
import Vision
import CoreImage
import CoreGraphics

// MARK: - String Extension for PII Extraction (Following Apple's Pattern)
extension String {
    func extractPIIRanges() -> [(Range<String.Index>, String)]? {
        var results: [(Range<String.Index>, String)] = []
        
        // Use PIIDetector to find PII matches
        let piiMatches = PIIDetector.detectPIIRanges(in: self)
        
        for match in piiMatches {
            // Convert NSRange to Range<String.Index> like Apple does
            if let range = Range(match.range, in: self) {
                results.append((range, match.matchedText))
            }
        }
        
        return results.isEmpty ? nil : results
    }
}

class ScanforText {
  
  static func detectText(in image: CGImage, imageSize: CGSize, completion: @escaping ([SensitiveCoordinate]) -> Void) {
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .fast
    request.usesLanguageCorrection = false
    let handler = VNImageRequestHandler(cgImage: image, options: [:])
    
    do {
      try handler.perform([request])
      
      guard let results = request.results as? [VNRecognizedTextObservation] else {
        completion([])
        return
      }
      
      var piiCoordinates: [SensitiveCoordinate] = []
      let maximumCandidates = 1
      
      for visionResult in results {
        guard let candidate = visionResult.topCandidates(maximumCandidates).first else { continue }
        let detectedText = candidate.string
        
        // Check if this text contains PII and extract ranges (following Apple's exact pattern)
        if let piiRanges = detectedText.extractPIIRanges() {
          for (range, piiText) in piiRanges {
            // Get precise bounding box for this PII substring (Apple's exact method)
            if let box = try? candidate.boundingBox(for: range)?.boundingBox {
              // Convert normalized coordinates to pixel coordinates  
              let pixelX = box.origin.x * imageSize.width
              let pixelWidth = box.size.width * imageSize.width
              let pixelHeight = box.size.height * imageSize.height
              let pixelY = imageSize.height - (box.origin.y * imageSize.height + pixelHeight)
              
              let coordinate = SensitiveCoordinate(
                x: pixelX,
                y: pixelY,
                width: pixelWidth,
                height: pixelHeight,
                confidence: visionResult.confidence,
                type: .text,
                textContent: piiText
              )
              
              piiCoordinates.append(coordinate)
            }
          }
        }
      }
      
      completion(piiCoordinates)
    } catch {
      print("Text detection error: \(error)")
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