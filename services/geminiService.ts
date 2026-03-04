import { GoogleGenAI, Type } from "@google/genai";
import { GEMINI_MODEL } from '../constants';

// Helper to strip data:image/xyz;base64, prefix safely
const extractBase64 = (dataUrl: string) => {
  const parts = dataUrl.split(',');
  return parts.length > 1 ? parts[1] : dataUrl;
};

export interface VerificationResult {
  match: boolean;
  confidence: number;
  message: string;
  error?: boolean;
}


export const verifyFaceWithGemini = async (
  referenceImageBase64: string,
  capturedImageBase64: string
): Promise<VerificationResult> => {
  
  // Use relative path - Vite proxy handles this in dev, Vercel handles it in prod
  const PROXY_URL = '/api/verify-face';

  try {
    const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            referenceImage: extractBase64(referenceImageBase64),
            capturedImage: extractBase64(capturedImageBase64)
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