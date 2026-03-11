import { GoogleGenAI, Type } from "@google/genai";

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb', // Allow large images
        },
    },
};

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    let { referenceImage, capturedImage, isUrl } = req.body;

    if (!referenceImage || !capturedImage) {
        return res.status(400).json({ error: "Missing images" });
    }

    if (isUrl) {
        try {
            const [refRes, capRes] = await Promise.all([
                fetch(referenceImage),
                fetch(capturedImage)
            ]);
            
            const refBuffer = await refRes.arrayBuffer();
            const capBuffer = await capRes.arrayBuffer();
            
            referenceImage = Buffer.from(refBuffer).toString('base64');
            capturedImage = Buffer.from(capBuffer).toString('base64');
        } catch (err) {
            console.error("Image download error:", err);
            return res.status(500).json({ error: "Failed to fetch images from URLs" });
        }
    }

    const GEMINI_API_KEY = process.env.VITE_GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        console.warn("Using Mock Response (No API Key)");
        return res.json({ match: true, confidence: 88, message: "Mock Success (Serverless)" });
    }

    try {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const GEMINI_MODEL = "gemini-2.5-flash";

        const schema = {
            type: Type.OBJECT,
            properties: {
              isSamePerson: { type: Type.BOOLEAN },
              confidenceScore: { type: Type.NUMBER },
              analysis: { type: Type.STRING },
              livenessCheck: { type: Type.BOOLEAN }
            },
            required: ["isSamePerson", "confidenceScore", "analysis"]
        };

        const prompt = `
          Compare these two faces.
          Image 1: Reference. Image 2: Live Capture.
          Check for identity match and liveness spoofs.
          Return JSON.
        `;

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: {
              parts: [
                { text: prompt },
                { inlineData: { mimeType: 'image/jpeg', data: referenceImage } },
                { inlineData: { mimeType: 'image/jpeg', data: capturedImage } }
              ]
            },
            config: {
              responseMimeType: "application/json",
              responseSchema: schema
            }
        });

        const resultText = response.text;
        if (!resultText) throw new Error("Empty response from AI");
        const result = JSON.parse(resultText);

        const isMatch = result.isSamePerson && result.confidenceScore > 80;

        res.status(200).json({
            match: isMatch,
            confidence: result.confidenceScore,
            message: result.analysis
        });

    } catch (error) {
        console.error("Serverless Verification Error:", error);
        res.status(500).json({ error: "Verification failed", details: error.message });
    }
}
