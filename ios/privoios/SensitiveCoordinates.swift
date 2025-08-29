import Foundation
import CoreGraphics

struct SensitiveCoordinate {
  let x: CGFloat
  let y: CGFloat
  let width: CGFloat
  let height: CGFloat
  let confidence: Float
  let type: SensitiveContentType
}

enum SensitiveContentType {
  case face
  case text
}

extension SensitiveCoordinate {
  func toDictionary() -> [String: Any] {
    return [
      "x": x,
      "y": y,
      "width": width,
      "height": height,
      "confidence": confidence
    ]
  }
}