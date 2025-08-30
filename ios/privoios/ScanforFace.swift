import Foundation
import UIKit
import CoreImage
import CoreGraphics
import MLKitVision
import MLKitFaceDetection

class ScanforFace {
  
  // ML Kit Face Detector (lazy initialization)
  private static let faceDetector: FaceDetector = {
    let options = FaceDetectorOptions()
    options.performanceMode = .accurate
    options.landmarkMode = .none  // We only need bounding boxes for privacy
    options.classificationMode = .none  // No need for smile/eyes detection
    return FaceDetector.faceDetector(options: options)
  }()
  
  static func detectFaces(in image: CGImage, imageSize: CGSize, completion: @escaping ([SensitiveCoordinate]) -> Void) {
    // Convert CGImage to MLKitVision Image
    let visionImage = VisionImage(image: UIImage(cgImage: image))
    visionImage.orientation = .up
    
    faceDetector.process(visionImage) { faces, error in
      if let error = error {
        completion([])
        return
      }
      
      guard let faces = faces, !faces.isEmpty else {
        completion([])
        return
      }
      
      let faceCoordinates = faces.map { face -> SensitiveCoordinate in
        // ML Kit uses UIKit coordinates (top-left origin) - no conversion needed
        let boundingBox = face.frame
        
        return SensitiveCoordinate(
          x: boundingBox.origin.x,
          y: boundingBox.origin.y, 
          width: boundingBox.size.width,
          height: boundingBox.size.height,
          confidence: 1.0, // ML Kit doesn't provide confidence for face bounds
          type: .face,
          textContent: nil
        )
      }
      
      completion(faceCoordinates)
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