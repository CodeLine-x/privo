import Foundation
import CoreGraphics

struct SensitiveCoordinate {
  let x: CGFloat
  let y: CGFloat
  let width: CGFloat
  let height: CGFloat
  let confidence: Float
  let type: SensitiveContentType
  let textContent: String? // Store the actual text content
}

enum SensitiveContentType {
  case face
  case text
}

extension SensitiveCoordinate {
  func toDictionary() -> [String: Any] {
    var dict: [String: Any] = [
      "x": x,
      "y": y,
      "width": width,
      "height": height,
      "confidence": confidence
    ]
    
    if let text = textContent {
      dict["textContent"] = text
    }
    
    return dict
  }
}