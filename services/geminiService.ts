import { GoogleGenAI, Type } from "@google/genai";
import { GEMINI_MODEL } from '../constants';

// Helper removed as we will pass URLs instead of base64

export interface VerificationResult {
  match: boolean;
  confidence: number;
  message: string;
  error?: boolean;
}


export const verifyFaceWithGemini = async (
  referenceImageUrl: string,
  capturedImageUrl: string
): Promise<VerificationResult> => {
  
  // Use relative path - Vite proxy handles this in dev, Vercel handles it in prod
  const PROXY_URL = '/api/verify-face';

  try {
    const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            referenceImage: referenceImageUrl,
            capturedImage: capturedImageUrl,
            isUrl: true
        })
    });

    if (!response.ok) {
        if (response.status === 429) {
            throw new Error(`429: Too Many Requests`);
        }
        throw new Error(`Server returned ${response.status}`);
    }

    const result = await response.json();
    return {
        match: result.match,
        confidence: result.confidence,
        message: result.message
    };

  } catch (error: any) {
    console.error("Verification Error (Proxy):", error);
    // Fallback? Or just fail. 
    // Ideally we fail secure.
    // For demo purposes, we could return a specific error message.
    return {
      match: false,
      confidence: 0,
      message: error.message || "Security Service Unavailable",
      error: true
    };
  }
};