
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const apiKey = process.env.VITE_GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("No API Key found");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
      // There isn't a direct listModels on the client instance in some versions, 
      // but usually we can try to guess or use a specific manager. 
      // However, looking at the docs for @google/generative-ai, it usually doesn't have a model listing method exposed easily in the main class in older versions, 
      // but let's try to access the model list via the API if possible or just try 'gemini-pro'.
      

      const modelsToCheck = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-pro", "gemini-1.5-pro"];

      for (const modelName of modelsToCheck) {
        console.log(`Testing '${modelName}'...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            console.log(`✅ Success with '${modelName}'`);
        } catch (e) {
            console.log(`❌ Failed '${modelName}': ${e.message} (Status: ${e.status})`);
        }
      }

  } catch (error) {
    console.error("Error:", error);
  }
}

listModels();
