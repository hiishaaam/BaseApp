
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const apiKey = process.env.VITE_GOOGLE_API_KEY;

if (!apiKey) {
  console.error("No API Key");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function list() {
  try {
    // This method depends on the SDK capabilities
    // For @google/genai, checking if there is a listModels or similar
    // Actually, @google/genai might not have a simple listModels on the client.
    // But let's verify if we can just try a different model name in a simple call.
    
    console.log("Testing gemini-1.5-flash-001...");
    const model = ai.models; // Access models namespace?
    
    // We'll just try to generate content with a different model name
    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash-001',
        contents: { parts: [{ text: "Hello" }] }
    });
    console.log("Success with gemini-1.5-flash-001");
  } catch (e) {
    console.error("Failed with gemini-1.5-flash-001", e.message);
  }

  try {
    console.log("Testing gemini-1.5-flash...");
    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: { parts: [{ text: "Hello" }] }
    });
    console.log("Success with gemini-1.5-flash");
  } catch (e) {
    console.error("Failed with gemini-1.5-flash", e.message);
  }
  
  try {
    console.log("Testing gemini-2.0-flash-exp...");
    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: { parts: [{ text: "Hello" }] }
    });
    console.log("Success with gemini-2.0-flash-exp");
  } catch (e) {
     console.error("Failed with gemini-2.0-flash-exp", e.message);
  }
}

list();
