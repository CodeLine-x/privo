import Foundation
import NaturalLanguage
import MLKitEntityExtraction

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
    
    // MARK: - PII Range Detection for Word-Level Blurring
    struct PIIMatch {
        let range: NSRange
        let type: String
        let matchedText: String
    }
    
    // MARK: - ML Kit Entity Extractor (Lazy initialization)
    private static var entityExtractor: EntityExtractor? = {
        let options = EntityExtractorOptions(modelIdentifier: .english)
        let extractor = EntityExtractor.entityExtractor(options: options)
        
        // Ensure model is downloaded
        extractor.downloadModelIfNeeded { error in
            if let error = error {
                print("❌ ML Kit model download failed: \(error)")
            } else {
                print("✅ ML Kit model ready for entity extraction")
            }
        }
        
        return extractor
    }()
    
    // Returns specific ranges of PII within the text for word-level blurring
    static func detectPIIRanges(in text: String) -> [PIIMatch] {
        var matches: [PIIMatch] = []
        
        // 1. Use ML Kit for enhanced entity detection (if available)
        matches.append(contentsOf: findMLKitEntityRanges(in: text))
        
        // 2. Check regex patterns (for entities ML Kit might miss)
        matches.append(contentsOf: findRegexPIIRanges(in: text))
        
        // 3. Check for named entities (names) using Apple NL
        matches.append(contentsOf: findNamedEntityRanges(in: text))
        
        // Remove duplicates based on overlapping ranges
        return removeDuplicateMatches(matches)
    }
    
    // MARK: - Main PII Detection Function (Legacy)
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
    
    // MARK: - ML Kit Entity Detection
    private static func findMLKitEntityRanges(in text: String) -> [PIIMatch] {
        var matches: [PIIMatch] = []
        
        print("🔍 ML Kit: Analyzing text: '\(text)'")
        
        // Check if ML Kit is available (will be nil until pod is installed)
        guard let extractor = entityExtractor else {
            print("❌ ML Kit Entity Extractor not available - using fallback methods")
            return matches
        }
        
        print("✅ ML Kit Entity Extractor available")
        
        // Create dispatch group for async operation
        let group = DispatchGroup()
        group.enter()
        
        // ML Kit entity detection is async, but we need sync for our current architecture
        extractor.annotateText(text) { result, error in
            defer { group.leave() }
            
            if let error = error {
                print("❌ ML Kit entity detection error: \(error)")
                return
            }
            
            guard let annotations = result else { 
                print("⚠️ ML Kit returned no annotations")
                return 
            }
            
            print("📊 ML Kit found \(annotations.count) annotations")
            
            for annotation in annotations {
                print("📍 Annotation range: \(annotation.range), entities: \(annotation.entities.count)")
                
                for entity in annotation.entities {
                    print("🏷️ Entity type: \(entity.entityType)")
                    
                    // Map ML Kit entity types to our PII types
                    let piiType = mapMLKitEntityType(entity.entityType)
                    if !piiType.isEmpty {
                        let range = NSRange(location: Int(annotation.range.location), 
                                          length: Int(annotation.range.length))
                        let matchedText = (text as NSString).substring(with: range)
                        
                        print("✅ ML Kit detected PII: '\(matchedText)' as \(piiType)")
                        
                        matches.append(PIIMatch(
                            range: range,
                            type: piiType,
                            matchedText: matchedText
                        ))
                    } else {
                        print("⚠️ ML Kit entity type \(entity.entityType) not mapped to PII")
                    }
                }
            }
            
            print("🎯 ML Kit final matches: \(matches.count)")
        }
        
        // Wait for async operation to complete (with timeout)
        let waitResult = group.wait(timeout: .now() + 3.0)
        if waitResult == .timedOut {
            print("⏱️ ML Kit detection timed out")
        }
        
        return matches
    }
    
    private static func mapMLKitEntityType(_ entityType: EntityType) -> String {
        switch entityType {
        case .address:
            return "address"
        case .dateTime:
            return "datetime"
        case .email:
            return "email"
        case .flightNumber:
            return "flight"
        case .IBAN:
            return "iban"
        case .ISBN:
            return "isbn"
        case .paymentCard:
            return "creditcard"
        case .phone:
            return "phone"
        case .trackingNumber:
            return "tracking"
        case .URL:
            return "url"
        case .money:
            return "money"
        default:
            return ""
        }
    }
    
    private static func removeDuplicateMatches(_ matches: [PIIMatch]) -> [PIIMatch] {
        var uniqueMatches: [PIIMatch] = []
        
        for match in matches {
            // Check if this match overlaps with any existing match
            let hasOverlap = uniqueMatches.contains { existingMatch in
                let existingEnd = existingMatch.range.location + existingMatch.range.length
                let matchEnd = match.range.location + match.range.length
                
                return !(match.range.location >= existingEnd || existingMatch.range.location >= matchEnd)
            }
            
            if !hasOverlap {
                uniqueMatches.append(match)
            }
        }
        
        return uniqueMatches
    }
    
    // MARK: - Word-Level PII Range Detection Methods
    private static func findRegexPIIRanges(in text: String) -> [PIIMatch] {
        var matches: [PIIMatch] = []
        
        let patterns: [(pattern: String, type: String)] = [
            (#"\b\(\d{3}\)\s*\d{3}[-.]?\d{4}\b"#, "phone"),
            (#"\b\d{3}[-]\d{3}[-]\d{4}\b"#, "phone"),
            (#"\b\+1[\s-]\d{3}[\s-]\d{3}[\s-]\d{4}\b"#, "phone"),
            (#"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"#, "email"),
            (#"\b\d{3}[-]\d{2}[-]\d{4}\b"#, "ssn"),
            (#"\b\d{4}[\s-]\d{4}[\s-]\d{4}[\s-]\d{4}\b"#, "creditcard"),
            (#"https?://[^\s]+"#, "url")
        ]
        
        for (pattern, type) in patterns {
            do {
                let regex = try NSRegularExpression(pattern: pattern, options: [.caseInsensitive])
                let range = NSRange(location: 0, length: text.utf16.count)
                
                let regexMatches = regex.matches(in: text, options: [], range: range)
                
                for match in regexMatches {
                    let matchedText = (text as NSString).substring(with: match.range)
                    matches.append(PIIMatch(
                        range: match.range,
                        type: type,
                        matchedText: matchedText
                    ))
                }
            } catch {
                print("Invalid regex pattern: \(pattern)")
                continue
            }
        }
        
        return matches
    }
    
    private static func findNamedEntityRanges(in text: String) -> [PIIMatch] {
        var matches: [PIIMatch] = []
        
        // Skip very short text
        guard text.count >= 3 else { return matches }
        
        let tagger = NLTagger(tagSchemes: [.nameType])
        tagger.string = text
        
        var potentialEntities: [PIIMatch] = []
        
        tagger.enumerateTags(in: text.startIndex..<text.endIndex,
                            unit: .word,
                            scheme: .nameType,
                            options: [.omitWhitespace, .omitPunctuation, .omitOther]) { tag, tokenRange in
            if let tag = tag, tag == .personalName {
                let entityText = String(text[tokenRange])
                
                // Apply same filtering as original PIIDetector
                if entityText.count >= 2 &&
                   !isCommonWord(entityText) &&
                   entityText.first?.isUppercase == true &&
                   !entityText.contains(where: { $0.isNumber }) {
                    
                    // Convert String.Index range to NSRange
                    let nsRange = NSRange(tokenRange, in: text)
                    potentialEntities.append(PIIMatch(
                        range: nsRange,
                        type: "name",
                        matchedText: entityText
                    ))
                }
            }
            return true
        }
        
        // Only include names if we have plausible name patterns
        if potentialEntities.count >= 2 || (potentialEntities.count == 1 && potentialEntities[0].matchedText.count >= 4) {
            matches.append(contentsOf: potentialEntities)
        }
        
        return matches
    }
    
    // MARK: - ML Kit Test Function
    static func testMLKit() {
        print("🧪 Testing ML Kit with sample data...")
        let testTexts = [
            "Call me at (555) 123-4567",
            "Email me at test@example.com", 
            "My address is 123 Main Street, Anytown, CA 90210",
            "Credit card: 4111 1111 1111 1111"
        ]
        
        for testText in testTexts {
            print("\n🧪 Testing: '\(testText)'")
            let matches = findMLKitEntityRanges(in: testText)
            print("Result: \(matches.count) matches found")
            for match in matches {
                print("  - \(match.type): '\(match.matchedText)'")
            }
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