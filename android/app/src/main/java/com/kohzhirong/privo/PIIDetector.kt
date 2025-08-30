package com.kohzhirong.privo

import android.util.Log
import java.util.regex.Pattern

object PIIDetector {
    private const val TAG = "PIIDetector"
    
    // Regex Patterns for Structured PII (More Conservative)
    private val regexPatterns = listOf(
        // Phone Numbers (more specific patterns)
        Pattern.compile("\\b\\(\\d{3}\\)\\s*\\d{3}[-.]?\\d{4}\\b"),                  // (555) 123-4567
        Pattern.compile("\\b\\d{3}[-]\\d{3}[-]\\d{4}\\b"),                        // 555-123-4567 (with dashes)
        Pattern.compile("\\b\\+1[\\s-]\\d{3}[\\s-]\\d{3}[\\s-]\\d{4}\\b"),           // +1 555-123-4567
        
        // Email Addresses (unchanged - reliable pattern)
        Pattern.compile("\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b"),
        
        // Social Security Numbers (more specific)
        Pattern.compile("\\b\\d{3}[-]\\d{2}[-]\\d{4}\\b"),                        // 123-45-6789 (with dashes only)
        
        // Credit Card Numbers (16 digits with separators)
        Pattern.compile("\\b\\d{4}[\\s-]\\d{4}[\\s-]\\d{4}[\\s-]\\d{4}\\b"),         // 1234-5678-9012-3456
        
        // URLs (unchanged)
        Pattern.compile("https?://[^\\s]+")
    )
    
    // Common words to filter out
    private val commonWords = setOf(
        // Basic words
        "the", "and", "for", "are", "but", "not", "you", "all", "can", "had", "her", "was", "one", "our", "out", "day", "get", "has", "him", "his", "how", "man", "new", "now", "old", "see", "two", "way", "who", "boy", "did", "its", "let", "put", "say", "she", "too", "use",
        // Common greetings and casual words
        "hi", "hii", "hiii", "hey", "hello", "yes", "no", "ok", "okay", "what", "whats", "up", "how", "why", "when", "where", "good", "bad", "nice", "cool", "wow", "oh", "ah", "um", "well", "so", "but", "then", "now", "here", "there", "this", "that", "these", "those",
        // Question words and common responses
        "what", "where", "when", "why", "how", "who", "which", "yeah", "yep", "nope", "sure", "maybe", "perhaps", "really", "actually", "definitely", "probably", "possibly"
    )
    
    // Main PII Detection Function
    fun detectPII(texts: List<String>): List<String> {
        Log.d(TAG, "=== Starting PII detection ===")
        Log.d(TAG, "Input texts: ${texts.joinToString(", ")}")
        
        val piiTexts = mutableListOf<String>()
        
        for (text in texts) {
            val trimmedText = text.trim()
            if (trimmedText.isEmpty()) continue
            
            Log.d(TAG, "Analyzing text: '$trimmedText'")
            
            // Check regex patterns first (faster)
            if (containsStructuredPII(trimmedText)) {
                Log.d(TAG, "Found structured PII: '$trimmedText'")
                piiTexts.add(text)
                continue
            }
            
            // Check for named entities (simplified version)
            if (containsNamedEntities(trimmedText)) {
                Log.d(TAG, "Found named entity: '$trimmedText'")
                piiTexts.add(text)
            }
        }
        
        Log.d(TAG, "PII detection completed. Found: ${piiTexts.joinToString(", ")}")
        return piiTexts
    }
    
    // Regex-based PII Detection
    private fun containsStructuredPII(text: String): Boolean {
        for (pattern in regexPatterns) {
            if (pattern.matcher(text).find()) {
                Log.d(TAG, "Regex pattern matched: $pattern")
                return true
            }
        }
        return false
    }
    
    // Simplified named entity detection (since Android doesn't have NaturalLanguage framework)
    private fun containsNamedEntities(text: String): Boolean {
        // Skip very short text that's unlikely to be real names
        if (text.length < 3) return false
        
        // Split into words
        val words = text.split("\\s+".toRegex()).filter { it.isNotEmpty() }
        
        // Check if it looks like a name (simplified logic)
        val potentialNameWords = words.filter { word ->
            val cleanWord = word.trim().removeSuffix(".").removeSuffix(",")
            cleanWord.length >= 2 && 
            !isCommonWord(cleanWord) &&
            cleanWord[0].isUpperCase() &&
            !cleanWord.any { it.isDigit() }
        }
        
        // Only flag as PII if we have a plausible name
        val isPlausibleName = potentialNameWords.size >= 2 || 
                             (potentialNameWords.size == 1 && potentialNameWords[0].length >= 4)
        
        if (isPlausibleName) {
            Log.d(TAG, "Potential name detected: '$text' with words: $potentialNameWords")
        }
        
        return isPlausibleName
    }
    
    private fun isCommonWord(word: String): Boolean {
        val normalizedWord = word.lowercase()
        return commonWords.any { commonWord ->
            normalizedWord == commonWord || 
            (normalizedWord.startsWith(commonWord) && normalizedWord.length <= commonWord.length + 2)
        }
    }
    
    // Debug Function to Show What Was Detected
    fun analyzeText(text: String): Triple<Boolean, Boolean, List<String>> {
        Log.d(TAG, "=== Analyzing text: '$text' ===")
        
        val hasRegexPII = containsStructuredPII(text)
        val hasNamedEntities = containsNamedEntities(text)
        
        val entities = mutableListOf<String>()
        if (hasRegexPII) entities.add("Regex PII")
        if (hasNamedEntities) entities.add("Named Entity")
        
        Log.d(TAG, "Analysis result: hasRegexPII=$hasRegexPII, hasNamedEntities=$hasNamedEntities, entities=$entities")
        
        return Triple(hasRegexPII, hasNamedEntities, entities)
    }
}
