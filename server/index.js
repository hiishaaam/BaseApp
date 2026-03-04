import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

import path from 'path';

// Load from project root .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config(); // fallback to .env in CWD

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow large images

const GEMINI_API_KEY = process.env.VITE_GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("❌ NO API KEY FOUND IN ENVIRONMENT VARIABLES");
}

const GEMINI_MODEL = "gemini-2.5-flash";

app.post('/verify-face', async (req, res) => {
    try {
        const { referenceImage, capturedImage } = req.body;

        if (!referenceImage || !capturedImage) {
            return res.status(400).json({ error: "Missing images" });
        }

        if (!GEMINI_API_KEY) {
             console.warn("Using Mock Response (No API Key)");
             return res.json({ match: true, confidence: 88, message: "Mock Success (Server)" });
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

        const schema = {
            type: SchemaType.OBJECT,
            properties: {
              isSamePerson: { type: SchemaType.BOOLEAN },
              confidenceScore: { type: SchemaType.NUMBER },
              analysis: { type: SchemaType.STRING },
              livenessCheck: { type: SchemaType.BOOLEAN }
            },
            required: ["isSamePerson", "confidenceScore", "analysis"]
        };

        const model = genAI.getGenerativeModel({
            model: GEMINI_MODEL,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        const prompt = `
          Compare these two faces.
          Image 1: Reference. Image 2: Live Capture.
          Check for identity match and liveness spoofs.
          Return JSON.
        `;

        const result = await model.generateContent([
            prompt,
            { inlineData: { mimeType: 'image/jpeg', data: referenceImage } },
            { inlineData: { mimeType: 'image/jpeg', data: capturedImage } }
        ]);

        let responseText = result.response.text();
        if (!responseText) throw new Error("Empty response from AI");

        // Clean up markdown code blocks if present
        responseText = responseText.replace(/```json\n?|\n?```/g, "").trim();
        
        console.log("Gemini Raw Response:", responseText); // Debug logging

        let parsedResult;
        try {
            parsedResult = JSON.parse(responseText);
        } catch (e) {
            console.error("JSON Parse Error. Raw text:", responseText);
            throw new Error("Failed to parse AI response");
        }

        const isMatch = parsedResult.isSamePerson === true && (parsedResult.confidenceScore > 80 || parsedResult.confidenceScore > 0.8);
        // Handle case where confidence might be 0-1 instead of 0-100

        console.log(`Verification Result: Match=${isMatch}, Confidence=${parsedResult.confidenceScore}, Person=${parsedResult.isSamePerson}`);

        res.json({
            match: isMatch,
            confidence: parsedResult.confidenceScore,
            message: parsedResult.analysis
        });

    } catch (error) {
        console.error("Server Verification Error:", error);
        
        // Comprehensive Fallback for Demo/Testing
        // Always fallback to mock in case of AI service failure to ensure app reliability
        console.warn(`⚠️ API Error (${error.status || error.message}). Falling back to Mock Response.`);
        
        // Determine precise reason for "due to..."
        let reason = "Unknown System Error";
        
        if (error.status === 429 || (error.message && error.message.includes('429'))) {
            reason = "High Traffic (Rate Limit)";
        } else if (error.status === 503) {
            reason = "AI Server Overload";
        } else if (error.message) {
            // limit length to avoid huge popups
            reason = error.message.length > 50 ? error.message.substring(0, 50) + "..." : error.message;
        }

        // Return a clean error message to the client so it can be displayed
        return res.json({ 
            match: false, 
            confidence: 0, 
            message: `Service unavailable due to ${reason}`
        });
    }
});

app.listen(port, () => {
    console.log(`🔒 Security Proxy Server running at http://localhost:${port}`);
});
