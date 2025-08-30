import Foundation
import NaturalLanguage

class PIIDetector {
    
    // MARK: - Regex Patterns for Structured PII (More Conservative)
    private static let regexPatterns: [String] = [
        // Phone Numbers (more specific patterns)
        #"\b\(\d{3}\)\s*\d{3}[-.]?\d{4}\b"#,                  // (555) 123-4567
        #"\b\d{3}[-]\d{3}[-]\d{4}\b"#,                        // 555-123-4567 (with dashes)
        #"\b\+1[\s-]\d{3}[\s-]\d{3}[\s-]\d{4}\b"#,           // +1 555-123-4567
        
        // Email Addresses (unchanged - reliable pattern)
        #"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"#,
        
        // Social Security Numbers (more specific)
        #"\b\d{3}[-]\d{2}[-]\d{4}\b"#,                        // 123-45-6789 (with dashes only)
        
        // Credit Card Numbers (16 digits with separators)
        #"\b\d{4}[\s-]\d{4}[\s-]\d{4}[\s-]\d{4}\b"#,         // 1234-5678-9012-3456
        
        // URLs (unchanged)
        #"https?://[^\s]+"#,
    ]
    
    // MARK: - NL Entity Types for Semantic PII (Conservative)
    private static let sensitiveEntityTypes: Set<NLTag> = [
        .personalName  // Only detect personal names, skip places/orgs for now
    ]
    
    // MARK: - Main PII Detection Function
    static func detectPII(in texts: [String]) -> [String] {
        var piiTexts: [String] = []
        
        for text in texts {
            let trimmedText = text.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !trimmedText.isEmpty else { continue }
            
            // Check regex patterns first (faster)
            if containsStructuredPII(trimmedText) {
                piiTexts.append(text)
                continue
            }
            
            // Check Apple NL for named entities
            if containsNamedEntities(trimmedText) {
                piiTexts.append(text)
            }
        }
        
        return piiTexts
    }
    
    // MARK: - Regex-based PII Detection
    private static func containsStructuredPII(_ text: String) -> Bool {
        for pattern in regexPatterns {
            do {
                let regex = try NSRegularExpression(pattern: pattern, options: [.caseInsensitive])
                let range = NSRange(location: 0, length: text.utf16.count)
                
                if regex.firstMatch(in: text, options: [], range: range) != nil {
                    return true
                }
            } catch {
                // Skip invalid regex patterns
                print("Invalid regex pattern: \(pattern)")
                continue
            }
        }
        return false
    }
    
    // MARK: - Apple NL-based Entity Detection with Confidence Threshold
    private static let confidenceThreshold: Double = 0.8  // High confidence required (0.0 to 1.0)
    
    private static func containsNamedEntities(_ text: String) -> Bool {
        // Skip very short text that's unlikely to be real names
        guard text.count >= 3 else { return false }
        
        let tagger = NLTagger(tagSchemes: [.nameType])
        tagger.string = text
        
        var potentialEntities: [String] = []
        
        tagger.enumerateTags(in: text.startIndex..<text.endIndex,
                            unit: .word,
                            scheme: .nameType,
                            options: [.omitWhitespace, .omitPunctuation, .omitOther]) { tag, tokenRange in
            if let tag = tag, sensitiveEntityTypes.contains(tag) {
                let entityText = String(text[tokenRange])
                
                // Stricter filters for names
                if entityText.count >= 2 && // Minimum length for a name
                   !isCommonWord(entityText) &&
                   entityText.first?.isUppercase == true &&
                   !entityText.contains(where: { $0.isNumber }) { // Exclude words with numbers
                    potentialEntities.append(entityText)
                }
            }
            return true // Continue enumeration to collect all entities
        }
        
        // Only flag as PII if we have a plausible name (e.g., at least two words or a long single word)
        return potentialEntities.count >= 2 || (potentialEntities.count == 1 && potentialEntities[0].count >= 4)
    }
    
    private static func isCommonWord(_ word: String) -> Bool {
        let commonWords = [
            // Basic words
            "the", "and", "for", "are", "but", "not", "you", "all", "can", "had", "her", "was", "one", "our", "out", "day", "get", "has", "him", "his", "how", "man", "new", "now", "old", "see", "two", "way", "who", "boy", "did", "its", "let", "put", "say", "she", "too", "use",
            // Common greetings and casual words
            "hi", "hii", "hiii", "hey", "hello", "yes", "no", "ok", "okay", "what", "whats", "up", "how", "why", "when", "where", "good", "bad", "nice", "cool", "wow", "oh", "ah", "um", "well", "so", "but", "then", "now", "here", "there", "this", "that", "these", "those",
            // Question words and common responses
            "what", "where", "when", "why", "how", "who", "which", "yeah", "yep", "nope", "sure", "maybe", "perhaps", "really", "actually", "definitely", "probably", "possibly"
        ]
        
        let normalizedWord = word.lowercased()
        return commonWords.contains { commonWord in
            // Exact match or close variants (e.g., "Hii" or "Whats")
            normalizedWord == commonWord || normalizedWord.hasPrefix(commonWord) && normalizedWord.count <= commonWord.count + 2
        }
    }
    
    // MARK: - Debug Function to Show What Was Detected
    static func analyzeText(_ text: String) -> (hasRegexPII: Bool, hasNamedEntities: Bool, entities: [String]) {
        var entities: [String] = []
        
        // Check regex patterns
        let hasRegexPII = containsStructuredPII(text)
        
        // Get named entities
        let tagger = NLTagger(tagSchemes: [.nameType])
        tagger.string = text
        
        var hasNamedEntities = false
        
        tagger.enumerateTags(in: text.startIndex..<text.endIndex,
                            unit: .word,
                            scheme: .nameType,
                            options: [.omitWhitespace, .omitPunctuation]) { tag, tokenRange in
            if let tag = tag, sensitiveEntityTypes.contains(tag) {
                let entityText = String(text[tokenRange])
                // Log all tagged entities for debugging
                entities.append("\(entityText) (\(tag.rawValue))")
                if entityText.count >= 2 &&
                   !isCommonWord(entityText) &&
                   entityText.first?.isUppercase == true &&
                   !entityText.contains(where: { $0.isNumber }) {
                    hasNamedEntities = true
                }
            }
            return true
        }
        
        return (hasRegexPII, hasNamedEntities, entities)
    }
}