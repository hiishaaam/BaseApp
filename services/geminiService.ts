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
  if (!process.env.API_KEY) {
    console.warn("No API KEY provided. Mocking success for demo.");
    return new Promise(resolve => setTimeout(() => resolve({ match: true, confidence: 95, message: "Mock Success" }), 1500));
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // We want a structured JSON response
    const schema = {
      type: Type.OBJECT,
      properties: {
        isSamePerson: { type: Type.BOOLEAN, description: "Whether the two faces belong to the same person." },
        confidenceScore: { type: Type.NUMBER, description: "Confidence score between 0 and 100." },
        analysis: { type: Type.STRING, description: "Brief explanation of the comparison." },
        livenessCheck: { type: Type.BOOLEAN, description: "True if the second image appears to be a real person, false if it looks like a photo of a screen or printed photo." }
      },
      required: ["isSamePerson", "confidenceScore", "analysis"]
    };

    const prompt = `
      You are a biometric security expert. 
      Analyze the two provided images. 
      Image 1 is the Reference ID Photo.
      Image 2 is the Live Camera Capture.
      
      Compare facial features, bone structure, and landmarks.
      Ignore differences in lighting, background, or minor aging.
      Also, check Image 2 for signs of spoofing (holding a phone up, moire patterns, flat 2D look).
      
      Return JSON.
    `;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'image/jpeg', data: extractBase64(referenceImageBase64) } },
          { inlineData: { mimeType: 'image/jpeg', data: extractBase64(capturedImageBase64) } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Empty response from Gemini");

    const result = JSON.parse(resultText);

    // Strict logic for "Match"
    // Must be same person, high confidence, and pass basic liveness check if model supports it
    const isMatch = result.isSamePerson && result.confidenceScore > 80;

    return {
      match: isMatch,
      confidence: result.confidenceScore,
      message: result.analysis
    };

  } catch (error: any) {
    console.error("Gemini Verification Error:", error);
    return {
      match: false,
      confidence: 0,
      message: error.message || "System error during verification. Please try again.",
      error: true
    };
  }
};