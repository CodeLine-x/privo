import FoundationModels
import Vision
import UIKit
import CoreImage
import CoreGraphics

class ScanforText {
  
  // Foundation Models analyzer for iOS 18+
  @available(iOS 18.0, *)
  static func analyzeSensitiveContent(_ detectedTexts: [String]) async -> [String] {
    guard !detectedTexts.isEmpty else { return [] }
    
    // Check if model is available
    let model = SystemLanguageModel.default
    guard model.availability == .available else { return detectedTexts } // Fallback to all text if model unavailable
    
    // Create session
    let session = LanguageModelSession()
    
    // Create instructions for the model
    let instructions = """
    You are a privacy-focused text analyzer. Your role is to identify personally identifiable information (PII) and sensitive data from a list of detected text.
    
    Identify text that contains:
    - Phone numbers
    - Email addresses  
    - Social Security Numbers
    - Credit card numbers
    - Home addresses
    - Names of people
    - License plate numbers
    - Medical information
    - Financial information
    
    Respond with only the sensitive text items from the input list, one per line. If no sensitive information is found, respond with "NONE".
    """
    
    // Create session with instructions
    let sessionWithInstructions = LanguageModelSession(instructions: instructions)
    
    // Create the prompt with detected text
    let textList = detectedTexts.joined(separator: "\n")
    let prompt = "Analyze the following detected text and identify only the sensitive information:\n\n\(textList)"
    
    do {
      // Call the model
      let response = try await sessionWithInstructions.respond(to: prompt)
      
      // Parse response - split by lines and filter out empty lines
      let sensitiveWords = response.components(separatedBy: .newlines)
        .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
        .filter { !$0.isEmpty && $0 != "NONE" }
      
      return sensitiveWords
    } catch {
      print("Foundation Models error: \(error)")
      return [] // Return empty if error occurs
    }
  }
  
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
        
        // Extract all detected text for analysis
        let allDetectedTexts = allTextCoordinates.compactMap { $0.textContent }
        
        // Use Foundation Models for iOS 18+
        if #available(iOS 18.0, *) {
          Task {
            let sensitiveTexts = await analyzeSensitiveContent(allDetectedTexts)
            let filteredCoordinates = allTextCoordinates.filter { coordinate in
              guard let textContent = coordinate.textContent else { return false }
              return sensitiveTexts.contains(textContent)
            }
            completion(filteredCoordinates)
          }
        } else {
          // For older iOS versions, return empty (no sensitive detection)
          completion([])
        }
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