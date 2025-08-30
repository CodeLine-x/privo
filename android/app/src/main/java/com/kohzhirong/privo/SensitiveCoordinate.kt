package com.kohzhirong.privo

import android.util.Log

data class SensitiveCoordinate(
    val x: Double,
    val y: Double,
    val width: Double,
    val height: Double,
    val confidence: Float,
    val type: SensitiveContentType,
    val textContent: String? = null
) {
    companion object {
        private const val TAG = "SensitiveCoordinate"
    }

    fun toMap(): Map<String, Any> {
        val map = mutableMapOf<String, Any>(
            "x" to x,
            "y" to y,
            "width" to width,
            "height" to height,
            "confidence" to confidence
        )
        
        if (textContent != null) {
            map["textContent"] = textContent
        }
        
        Log.d(TAG, "Converting coordinate to map: $map")
        return map
    }
}

enum class SensitiveContentType {
    FACE,
    TEXT
}
