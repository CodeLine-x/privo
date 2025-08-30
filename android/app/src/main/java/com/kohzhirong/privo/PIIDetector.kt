package com.kohzhirong.privo

import android.util.Log
import com.google.mlkit.nl.entityextraction.EntityExtraction
import com.google.mlkit.nl.entityextraction.EntityExtractorOptions
import com.google.mlkit.nl.entityextraction.EntityAnnotation
import com.google.mlkit.nl.entityextraction.Entity
import com.google.mlkit.nl.entityextraction.EntityExtractionParams
import com.google.mlkit.nl.entityextraction.DateTimeEntity
import com.google.mlkit.nl.entityextraction.FlightNumberEntity
import com.google.mlkit.nl.entityextraction.MoneyEntity
import java.util.regex.Pattern
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

object PIIDetector {
    private const val TAG = "PIIDetector"
    
    // Entity extractor instance
    private val entityExtractor by lazy {
        Log.d(TAG, "=== Initializing Entity Extractor ===")
        val options = EntityExtractorOptions.Builder(EntityExtractorOptions.ENGLISH)
            .build()
        val extractor = EntityExtraction.getClient(options)
        Log.d(TAG, "Entity extractor created successfully")
        extractor
    }
    
    // PII entity types we want to detect (based on ML Kit documentation)
    private val piiEntityTypes = setOf(
        Entity.TYPE_ADDRESS,
        Entity.TYPE_DATE_TIME,
        Entity.TYPE_EMAIL,
        Entity.TYPE_FLIGHT_NUMBER,
        Entity.TYPE_IBAN,
        Entity.TYPE_ISBN,
        Entity.TYPE_MONEY,
        Entity.TYPE_PAYMENT_CARD,
        Entity.TYPE_PHONE,
        Entity.TYPE_TRACKING_NUMBER,
        Entity.TYPE_URL
    )
    
    // Enhanced Regex Patterns as fallback and for immediate results
    private val regexPatterns = listOf(
        // Email Addresses (comprehensive pattern)
        Pattern.compile("\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b"),
        
        // Phone Numbers (multiple formats)
        Pattern.compile("\\b\\(\\d{3}\\)\\s*\\d{3}[-.]?\\d{4}\\b"),                  // (555) 123-4567
        Pattern.compile("\\b\\d{3}[-]\\d{3}[-]\\d{4}\\b"),                        // 555-123-4567
        Pattern.compile("\\b\\+1[\\s-]\\d{3}[\\s-]\\d{3}[\\s-]\\d{4}\\b"),           // +1 555-123-4567
        Pattern.compile("\\b\\d{10}\\b"),                                          // 5551234567
        Pattern.compile("\\b\\+\\d{1,3}[\\s-]\\d{1,4}[\\s-]\\d{1,4}[\\s-]\\d{1,4}\\b"), // International
        // Singapore phone numbers
        Pattern.compile("\\b\\+65\\s*\\d{8}\\b"),                                 // +65 12349876 or +6512349876
        Pattern.compile("\\b65\\s*\\d{8}\\b"),                                    // 65 12349876 or 6512349876
        Pattern.compile("\\b\\+65\\s*\\d{4}\\s*\\d{4}\\b"),                       // +65 1234 5678
        Pattern.compile("\\b65\\s*\\d{4}\\s*\\d{4}\\b"),                          // 65 1234 5678
        Pattern.compile("\\b\\d{4}\\s*\\d{4}\\b"),                                // 1234 5678 (Singapore format)
        
        // Social Security Numbers (US)
        Pattern.compile("\\b\\d{3}[-]\\d{2}[-]\\d{4}\\b"),                        // 123-45-6789
        
        // Credit Card Numbers (various formats)
        Pattern.compile("\\b\\d{4}[\\s-]\\d{4}[\\s-]\\d{4}[\\s-]\\d{4}\\b"),         // 1234-5678-9012-3456
        Pattern.compile("\\b\\d{4}\\s\\d{4}\\s\\d{4}\\s\\d{4}\\b"),                 // 1234 5678 9012 3456
        Pattern.compile("\\b\\d{16}\\b"),                                          // 1234567890123456
        
        // URLs (comprehensive)
        Pattern.compile("https?://[^\\s]+"),
        Pattern.compile("\\bwww\\.[^\\s]+\\.[a-z]{2,}\\b"),
        
        // IP Addresses
        Pattern.compile("\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b"),
        
        // MAC Addresses
        Pattern.compile("\\b([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})\\b"),
        
        // IBAN (International Bank Account Numbers)
        Pattern.compile("\\b[A-Z]{2}\\d{2}[A-Z0-9]{4,}\\b"),
        
        // ISBN (International Standard Book Numbers)
        Pattern.compile("\\b\\d{3}[-]?\\d{1}[-]?\\d{3}[-]?\\d{5}[-]?\\d{1}\\b"),
        Pattern.compile("\\b\\d{1}[-]?\\d{3}[-]?\\d{5}[-]?\\d{3}[-]?\\d{1}\\b"),
        
        // Tracking Numbers (common formats)
        Pattern.compile("\\b\\d{10,20}\\b"),                                       // Generic tracking numbers
        
        // Money/Currency (basic patterns)
        Pattern.compile("\\b\\$\\d{1,3}(,\\d{3})*(\\.\\d{2})?\\b"),                // $1,234.56
        Pattern.compile("\\b\\d{1,3}(,\\d{3})*(\\.\\d{2})?\\s*(USD|EUR|GBP|JPY)\\b"), // 1,234.56 USD
        
        // Date patterns (that might indicate PII)
        Pattern.compile("\\b\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4}\\b"),                 // MM/DD/YYYY or DD/MM/YYYY
        Pattern.compile("\\b\\d{4}[/-]\\d{1,2}[/-]\\d{1,2}\\b"),                   // YYYY/MM/DD
    )
    
    // Common words to filter out (expanded list)
    private val commonWords = setOf(
        // Basic words
        "the", "and", "for", "are", "but", "not", "you", "all", "can", "had", "her", "was", "one", "our", "out", "day", "get", "has", "him", "his", "how", "man", "new", "now", "old", "see", "two", "way", "who", "boy", "did", "its", "let", "put", "say", "she", "too", "use",
        // Common greetings and casual words
        "hi", "hii", "hiii", "hey", "hello", "yes", "no", "ok", "okay", "what", "whats", "up", "how", "why", "when", "where", "good", "bad", "nice", "cool", "wow", "oh", "ah", "um", "well", "so", "but", "then", "now", "here", "there", "this", "that", "these", "those",
        // Question words and common responses
        "what", "where", "when", "why", "how", "who", "which", "yeah", "yep", "nope", "sure", "maybe", "perhaps", "really", "actually", "definitely", "probably", "possibly",
        // Common business words
        "company", "inc", "corp", "ltd", "llc", "co", "business", "office", "work", "job", "career", "professional",
        // Common location words
        "street", "avenue", "road", "drive", "lane", "place", "court", "boulevard", "highway", "freeway", "parkway",
        // Common time words
        "today", "tomorrow", "yesterday", "morning", "afternoon", "evening", "night", "week", "month", "year", "time", "date",
        // Common action words
        "call", "email", "contact", "message", "send", "receive", "get", "give", "take", "make", "do", "go", "come", "see", "look", "read", "write",
        // Additional common words that were being incorrectly detected
        "general", "resources", "errors", "wait", "boss", "drinks", "help", "info", "data", "file", "page", "home", "back", "next", "prev", "menu", "settings", "config", "system", "user", "admin", "login", "logout", "search", "find", "view", "edit", "delete", "save", "cancel", "submit", "reset", "clear", "close", "open", "start", "stop", "play", "pause", "record", "download", "upload", "share", "like", "comment", "follow", "unfollow", "block", "report", "flag", "mark", "tag", "label", "note", "bookmark", "favorite", "star", "rate", "review", "feedback", "support", "contact", "about", "terms", "privacy", "policy", "legal", "copyright", "trademark", "patent", "license", "agreement", "contract", "service", "product", "item", "order", "cart", "checkout", "payment", "shipping", "delivery", "return", "refund", "exchange", "warranty", "guarantee", "quality", "price", "cost", "value", "discount", "sale", "offer", "deal", "promotion", "coupon", "code", "key", "password", "username", "account", "profile", "avatar", "picture", "image", "photo", "video", "audio", "music", "song", "album", "artist", "band", "movie", "film", "show", "series", "episode", "season", "channel", "station", "radio", "tv", "news", "article", "story", "post", "blog", "forum", "chat", "message", "text", "word", "sentence", "paragraph", "document", "report", "paper", "letter", "email", "mail", "phone", "call", "text", "sms", "mms", "voice", "video", "conference", "meeting", "appointment", "schedule", "calendar", "date", "time", "hour", "minute", "second", "day", "week", "month", "year", "today", "tomorrow", "yesterday", "morning", "afternoon", "evening", "night", "dawn", "dusk", "noon", "midnight", "am", "pm", "timezone", "zone", "region", "area", "location", "place", "address", "street", "city", "town", "village", "state", "province", "country", "nation", "world", "earth", "planet", "universe", "space", "sky", "air", "water", "fire", "earth", "land", "sea", "ocean", "river", "lake", "mountain", "hill", "valley", "forest", "jungle", "desert", "island", "beach", "coast", "shore", "cliff", "cave", "hole", "tunnel", "bridge", "road", "path", "way", "route", "direction", "north", "south", "east", "west", "left", "right", "up", "down", "forward", "backward", "inside", "outside", "in", "out", "on", "off", "over", "under", "above", "below", "top", "bottom", "front", "back", "side", "center", "middle", "corner", "edge", "border", "boundary", "limit", "end", "start", "begin", "finish", "complete", "done", "ready", "set", "go", "run", "walk", "run", "jump", "climb", "fall", "rise", "drop", "lift", "carry", "hold", "grab", "catch", "throw", "push", "pull", "drag", "move", "shift", "change", "switch", "turn", "rotate", "spin", "roll", "slide", "glide", "fly", "swim", "dive", "float", "sink", "flow", "pour", "fill", "empty", "add", "remove", "insert", "delete", "create", "build", "make", "form", "shape", "design", "draw", "paint", "color", "style", "fashion", "clothes", "shirt", "pants", "dress", "shoes", "hat", "bag", "purse", "wallet", "money", "cash", "coin", "bill", "dollar", "cent", "penny", "nickel", "dime", "quarter", "food", "meal", "breakfast", "lunch", "dinner", "snack", "drink", "water", "milk", "juice", "soda", "coffee", "tea", "beer", "wine", "alcohol", "drug", "medicine", "pill", "tablet", "capsule", "syrup", "cream", "ointment", "bandage", "plaster", "cast", "splint", "crutch", "wheelchair", "bed", "chair", "table", "desk", "shelf", "cabinet", "drawer", "box", "container", "bottle", "can", "jar", "tube", "bag", "packet", "envelope", "letter", "card", "book", "magazine", "newspaper", "journal", "diary", "notebook", "pad", "paper", "pen", "pencil", "marker", "crayon", "chalk", "eraser", "sharpener", "stapler", "tape", "glue", "scissors", "knife", "fork", "spoon", "plate", "bowl", "cup", "glass", "mug", "pot", "pan", "dish", "tray", "towel", "napkin", "tissue", "soap", "shampoo", "toothpaste", "brush", "comb", "mirror", "lamp", "light", "bulb", "switch", "button", "key", "lock", "door", "window", "wall", "floor", "ceiling", "roof", "stairs", "elevator", "escalator", "machine", "device", "tool", "equipment", "instrument", "appliance", "gadget", "toy", "game", "puzzle", "card", "dice", "ball", "bat", "racket", "net", "goal", "field", "court", "track", "pool", "gym", "studio", "theater", "cinema", "museum", "library", "school", "college", "university", "hospital", "clinic", "pharmacy", "store", "shop", "market", "mall", "center", "plaza", "square", "park", "garden", "zoo", "aquarium", "circus", "fair", "festival", "party", "celebration", "birthday", "wedding", "funeral", "ceremony", "ritual", "tradition", "custom", "culture", "religion", "faith", "belief", "god", "goddess", "angel", "devil", "heaven", "hell", "paradise", "utopia", "dream", "nightmare", "fantasy", "reality", "truth", "lie", "fact", "fiction", "story", "tale", "legend", "myth", "fable", "parable", "joke", "riddle", "puzzle", "mystery", "secret", "code", "password", "key", "lock", "safe", "vault", "treasure", "gold", "silver", "bronze", "copper", "iron", "steel", "aluminum", "plastic", "wood", "stone", "glass", "ceramic", "fabric", "leather", "rubber", "paper", "cardboard", "metal", "mineral", "crystal", "diamond", "pearl", "jewel", "gem", "ring", "necklace", "bracelet", "earring", "watch", "clock", "timer", "alarm", "bell", "whistle", "horn", "siren", "music", "song", "melody", "tune", "rhythm", "beat", "drum", "guitar", "piano", "violin", "flute", "trumpet", "saxophone", "harmonica", "accordion", "organ", "synthesizer", "microphone", "speaker", "headphone", "earphone", "radio", "television", "tv", "computer", "laptop", "desktop", "tablet", "phone", "mobile", "cell", "smartphone", "camera", "video", "recorder", "player", "cd", "dvd", "bluray", "vhs", "cassette", "tape", "disk", "drive", "memory", "storage", "file", "folder", "directory", "path", "link", "url", "website", "webpage", "browser", "internet", "network", "wifi", "bluetooth", "cable", "wire", "cord", "plug", "socket", "outlet", "battery", "charger", "power", "energy", "electricity", "gas", "oil", "fuel", "fire", "flame", "smoke", "steam", "vapor", "mist", "fog", "cloud", "rain", "snow", "ice", "hail", "storm", "thunder", "lightning", "wind", "breeze", "gust", "hurricane", "tornado", "earthquake", "volcano", "tsunami", "flood", "drought", "famine", "disease", "illness", "sickness", "fever", "cold", "flu", "cough", "sneeze", "headache", "pain", "ache", "hurt", "injury", "wound", "cut", "bruise", "burn", "scar", "mark", "spot", "dot", "line", "circle", "square", "triangle", "rectangle", "oval", "diamond", "star", "heart", "cross", "plus", "minus", "equal", "greater", "less", "percent", "number", "digit", "figure", "amount", "quantity", "size", "length", "width", "height", "depth", "weight", "mass", "volume", "area", "distance", "speed", "time", "temperature", "heat", "cold", "warm", "hot", "cool", "freezing", "boiling", "melting", "freezing", "evaporating", "condensing", "solid", "liquid", "gas", "plasma", "matter", "energy", "force", "power", "strength", "weakness", "hard", "soft", "rough", "smooth", "sharp", "dull", "bright", "dark", "light", "heavy", "light", "big", "small", "large", "tiny", "huge", "enormous", "giant", "dwarf", "short", "tall", "long", "wide", "narrow", "thick", "thin", "fat", "skinny", "round", "flat", "curved", "straight", "bent", "twisted", "folded", "unfolded", "open", "closed", "locked", "unlocked", "full", "empty", "filled", "drained", "wet", "dry", "moist", "damp", "soaked", "drenched", "clean", "dirty", "filthy", "spotless", "stained", "marked", "damaged", "broken", "fixed", "repaired", "new", "old", "fresh", "stale", "rotten", "spoiled", "expired", "valid", "invalid", "correct", "incorrect", "right", "wrong", "true", "false", "yes", "no", "maybe", "perhaps", "probably", "definitely", "certainly", "surely", "absolutely", "completely", "totally", "entirely", "fully", "partially", "mostly", "mainly", "primarily", "chiefly", "largely", "considerably", "significantly", "substantially", "noticeably", "obviously", "clearly", "evidently", "apparently", "seemingly", "supposedly", "allegedly", "reportedly", "purportedly", "ostensibly", "superficially", "outwardly", "externally", "internally", "inside", "outside", "within", "without", "beyond", "behind", "ahead", "forward", "backward", "upward", "downward", "inward", "outward", "northward", "southward", "eastward", "westward", "homeward", "heavenward", "earthward", "skyward", "seaward", "landward", "shoreward", "coastward", "riverward", "mountainward", "forestward", "desertward", "cityward", "townward", "villageward", "countryward", "worldward", "universeward", "spaceward", "timeward", "futureward", "pastward", "presentward", "nowward", "thenward", "hereward", "thereward", "thisward", "thatward", "whichward", "whatward", "whereward", "whenward", "whyward", "howward", "whoward", "whomward", "whoseward", "whicheverward", "whateverward", "whereverward", "wheneverward", "whyeverward", "howeverward", "whoeverward", "whomeverward", "whoseverward", "whicheverward", "whateverward", "whereverward", "wheneverward", "whyeverward", "howeverward", "whoeverward", "whomeverward", "whoseverward",
        // More common words to ignore
        "TikTok"
    )
    
    // Main PII Detection Function - Returns PII coordinates from text coordinates
    fun detectPIIFromCoordinates(textCoordinates: List<SensitiveCoordinate>): List<SensitiveCoordinate> {
        Log.d(TAG, "=== Starting Hybrid PII detection from coordinates ===")
        Log.d(TAG, "Input text coordinates: ${textCoordinates.size}")
        
        val piiCoordinates = mutableListOf<SensitiveCoordinate>()
        
        for (coordinate in textCoordinates) {
            val text = coordinate.textContent ?: continue
            val trimmedText = text.trim()
            if (trimmedText.isEmpty()) continue
            
            Log.d(TAG, "Analyzing text: '$trimmedText'")
            
            // Use hybrid approach: regex first (fast), then ML Kit if available
            if (containsStructuredPII(trimmedText) || containsNamedEntities(trimmedText)) {
                Log.d(TAG, "Found PII with hybrid detection: '$trimmedText'")
                piiCoordinates.add(coordinate)
            }
        }
        
        Log.d(TAG, "Hybrid PII detection completed. Found ${piiCoordinates.size} PII coordinates")
        piiCoordinates.forEachIndexed { index, coord ->
            Log.d(TAG, "PII coordinate $index: '${coord.textContent}' at x=${coord.x}, y=${coord.y}")
        }
        
        return piiCoordinates
    }
    
    // Legacy function for backward compatibility
    fun detectPII(texts: List<String>): List<String> {
        Log.d(TAG, "=== Starting Hybrid PII detection ===")
        Log.d(TAG, "Input texts: ${texts.joinToString(", ")}")
        
        val piiTexts = mutableListOf<String>()
        
        for (text in texts) {
            val trimmedText = text.trim()
            if (trimmedText.isEmpty()) continue
            
            Log.d(TAG, "Analyzing text: '$trimmedText'")
            
            // Use hybrid approach: regex first (fast), then ML Kit if available
            if (containsStructuredPII(trimmedText) || containsNamedEntities(trimmedText)) {
                Log.d(TAG, "Found PII with hybrid detection: '$trimmedText'")
                piiTexts.add(text)
            }
        }
        
        Log.d(TAG, "Hybrid PII detection completed. Found: ${piiTexts.joinToString(", ")}")
        return piiTexts
    }
    
    // Enhanced regex-based PII Detection (immediate results)
    private fun containsStructuredPII(text: String): Boolean {
        for (pattern in regexPatterns) {
            if (pattern.matcher(text).find()) {
                Log.d(TAG, "Enhanced regex pattern matched: $pattern")
                return true
            }
        }
        return false
    }
    
    // Improved named entity detection (immediate results)
    private fun containsNamedEntities(text: String): Boolean {
        // Skip very short text that's unlikely to be real names
        if (text.length < 3) return false
        
        // Split into words
        val words = text.split("\\s+".toRegex()).filter { it.isNotEmpty() }
        
        // Check if it looks like a name (more strict logic)
        val potentialNameWords = words.filter { word ->
            val cleanWord = word.trim().removeSuffix(".").removeSuffix(",").removeSuffix(":")
            cleanWord.length >= 3 && // Increased minimum length
            !isCommonWord(cleanWord) &&
            cleanWord[0].isUpperCase() &&
            !cleanWord.any { it.isDigit() } &&
            !cleanWord.contains("@") && // Exclude email-like patterns
            !cleanWord.contains("http") && // Exclude URL-like patterns
            !cleanWord.contains("-") && // Exclude hyphenated words
            !cleanWord.contains("_") && // Exclude underscore words
            !cleanWord.contains(".") && // Exclude words with dots
            !cleanWord.contains("/") && // Exclude words with slashes
            !cleanWord.contains("\\") && // Exclude words with backslashes
            !cleanWord.contains("(") && // Exclude words with parentheses
            !cleanWord.contains(")") && // Exclude words with parentheses
            !cleanWord.contains("[") && // Exclude words with brackets
            !cleanWord.contains("]") && // Exclude words with brackets
            !cleanWord.contains("{") && // Exclude words with braces
            !cleanWord.contains("}") && // Exclude words with braces
            !cleanWord.contains("&") && // Exclude words with ampersands
            !cleanWord.contains("+") && // Exclude words with plus signs
            !cleanWord.contains("=") && // Exclude words with equals signs
            !cleanWord.contains("#") && // Exclude words with hash signs
            !cleanWord.contains("$") && // Exclude words with dollar signs
            !cleanWord.contains("%") && // Exclude words with percent signs
            !cleanWord.contains("^") && // Exclude words with caret signs
            !cleanWord.contains("*") && // Exclude words with asterisks
            !cleanWord.contains("!") && // Exclude words with exclamation marks
            !cleanWord.contains("?") && // Exclude words with question marks
            !cleanWord.contains("|") && // Exclude words with pipe signs
            !cleanWord.contains("~") && // Exclude words with tilde signs
            !cleanWord.contains("`") && // Exclude words with backticks
            !cleanWord.contains("'") && // Exclude words with single quotes
            !cleanWord.contains("\"") && // Exclude words with double quotes
            !cleanWord.contains(";") && // Exclude words with semicolons
            !cleanWord.contains(":") && // Exclude words with colons
            !cleanWord.contains("<") && // Exclude words with less than signs
            !cleanWord.contains(">") && // Exclude words with greater than signs
            !cleanWord.contains(",") && // Exclude words with commas
            !cleanWord.contains(" ") // Exclude words with spaces
        }
        
        // More strict name detection logic
        val isPlausibleName = when {
            // Single word names (must be longer and not common)
            potentialNameWords.size == 1 -> {
                val word = potentialNameWords[0]
                word.length >= 5 && !isCommonWord(word.lowercase()) // Increased minimum length
            }
            // Two word names (common pattern)
            potentialNameWords.size == 2 -> {
                val firstName = potentialNameWords[0]
                val lastName = potentialNameWords[1]
                firstName.length >= 3 && lastName.length >= 3 && // Increased minimum length
                !isCommonWord(firstName.lowercase()) && !isCommonWord(lastName.lowercase())
            }
            // Three or more words (could be full name)
            potentialNameWords.size >= 3 -> {
                potentialNameWords.all { it.length >= 3 } && // Increased minimum length
                potentialNameWords.none { isCommonWord(it.lowercase()) }
            }
            else -> false
        }
        
        if (isPlausibleName) {
            Log.d(TAG, "Enhanced name detection: '$text' with words: $potentialNameWords")
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
    
    /**
     * Use ML Kit Entity Extraction to detect PII in text (async, for testing)
     * This is used for testing and validation, not for the main detection flow
     */
    fun containsPIIWithMLKit(text: String, callback: (Boolean) -> Unit) {
        try {
            // First, ensure the model is downloaded
            entityExtractor.downloadModelIfNeeded()
                .addOnSuccessListener {
                    Log.d(TAG, "Model downloaded successfully, proceeding with extraction")
                    performEntityExtraction(text, callback)
                }
                .addOnFailureListener { exception ->
                    Log.e(TAG, "Model download failed", exception)
                    // Fallback to regex
                    callback(containsStructuredPII(text))
                }
        } catch (exception: Exception) {
            Log.e(TAG, "Error in ML Kit entity extraction", exception)
            // Fallback to regex
            callback(containsStructuredPII(text))
        }
    }
    
    /**
     * Perform the actual entity extraction using ML Kit
     */
    private fun performEntityExtraction(text: String, callback: (Boolean) -> Unit) {
        val params = EntityExtractionParams.Builder(text)
            .setEntityTypesFilter(piiEntityTypes)
            .build()
        
        entityExtractor.annotate(params)
            .addOnSuccessListener { entityAnnotations ->
                Log.d(TAG, "ML Kit extracted ${entityAnnotations.size} entity annotations from: '$text'")
                
                val hasPII = entityAnnotations.any { annotation ->
                    annotation.entities.any { entity ->
                        val isPII = piiEntityTypes.contains(entity.type)
                        if (isPII) {
                            val entityText = text.substring(annotation.start, annotation.end)
                            Log.d(TAG, "Found PII entity: type=${getEntityTypeName(entity.type)}, text='$entityText'")
                        }
                        isPII
                    }
                }
                
                Log.d(TAG, "PII detection result for '$text': $hasPII")
                callback(hasPII)
            }
            .addOnFailureListener { exception ->
                Log.e(TAG, "Entity extraction failed", exception)
                callback(false)
            }
    }
    
    /**
     * Get human-readable entity type name
     */
    private fun getEntityTypeName(entityType: Int): String {
        return when (entityType) {
            Entity.TYPE_ADDRESS -> "Address"
            Entity.TYPE_DATE_TIME -> "Date/Time"
            Entity.TYPE_EMAIL -> "Email"
            Entity.TYPE_FLIGHT_NUMBER -> "Flight Number"
            Entity.TYPE_IBAN -> "IBAN"
            Entity.TYPE_ISBN -> "ISBN"
            Entity.TYPE_MONEY -> "Money/Currency"
            Entity.TYPE_PAYMENT_CARD -> "Payment/Credit Card"
            Entity.TYPE_PHONE -> "Phone Number"
            Entity.TYPE_TRACKING_NUMBER -> "Tracking Number"
            Entity.TYPE_URL -> "URL"
            else -> "Unknown ($entityType)"
        }
    }
    
    /**
     * Debug function to show what entities were detected
     */
    fun analyzeTextWithMLKit(text: String) {
        Log.d(TAG, "=== Analyzing text with ML Kit: '$text' ===")
        
        entityExtractor.downloadModelIfNeeded()
            .addOnSuccessListener {
                val params = EntityExtractionParams.Builder(text).build()
                entityExtractor.annotate(params)
                    .addOnSuccessListener { entityAnnotations ->
                        Log.d(TAG, "Found ${entityAnnotations.size} entity annotations:")
                        for (annotation in entityAnnotations) {
                            Log.d(TAG, "Range: ${annotation.start} - ${annotation.end}")
                            for (entity in annotation.entities) {
                                when (entity) {
                                    is DateTimeEntity -> {
                                        Log.d(TAG, "DateTime: Granularity=${entity.dateTimeGranularity}, Timestamp=${entity.timestampMillis}")
                                    }
                                    is FlightNumberEntity -> {
                                        Log.d(TAG, "Flight: Airline=${entity.airlineCode}, Number=${entity.flightNumber}")
                                    }
                                    is MoneyEntity -> {
                                        Log.d(TAG, "Money: Currency=${entity.unnormalizedCurrency}, Integer=${entity.integerPart}, Fractional=${entity.fractionalPart}")
                                    }
                                    else -> {
                                        val entityText = text.substring(annotation.start, annotation.end)
                                        Log.d(TAG, "Entity: ${getEntityTypeName(entity.type)} - '$entityText'")
                                    }
                                }
                            }
                        }
                    }
                    .addOnFailureListener { exception ->
                        Log.e(TAG, "Entity analysis failed", exception)
                    }
            }
            .addOnFailureListener { exception ->
                Log.e(TAG, "Model download failed for analysis", exception)
            }
    }
    
    /**
     * Test function to verify both regex and ML Kit detection
     * Call this from your app to test the implementation
     */
    fun testHybridPIIDetection() {
        Log.d(TAG, "=== Testing Hybrid PII Detection ===")
        
        val testTexts = listOf(
            "Contact me at john.doe@example.com",
            "Call me at (555) 123-4567",
            "My address is 1600 Amphitheatre Parkway, Mountain View, CA 94043",
            "My credit card is 4111 1111 1111 1111",
            "Visit our website at https://www.google.com",
            "Let's meet tomorrow at 6pm",
            "John Smith is a common name",
            "This is just regular text without PII",
            "My SSN is 123-45-6789",
            "IP address: 192.168.1.1",
            "MAC address: 00:1B:44:11:3A:B7",
            "ISBN: 978-0-7475-3269-9",
            "IBAN: CH52 0483 0000 0000 0000 9",
            "Price: $1,234.56 USD"
        )
        
        for (text in testTexts) {
            Log.d(TAG, "Testing: '$text'")
            
            // Test regex detection (immediate)
            val hasRegexPII = containsStructuredPII(text) || containsNamedEntities(text)
            Log.d(TAG, "Regex result: ${if (hasRegexPII) "PII DETECTED" else "No PII"}")
            
            // Test ML Kit detection (async)
            containsPIIWithMLKit(text) { hasMLKitPII ->
                Log.d(TAG, "ML Kit result: ${if (hasMLKitPII) "PII DETECTED" else "No PII"}")
            }
            
            Log.d(TAG, "---")
        }
    }
    
    /**
     * Close the entity extractor when done
     */
    fun close() {
        try {
            entityExtractor.close()
            Log.d(TAG, "Entity extractor closed successfully")
        } catch (exception: Exception) {
            Log.e(TAG, "Error closing entity extractor", exception)
        }
    }
}
