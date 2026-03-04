
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

async function testModel() {
    const modelName = "gemini-2.5-flash";
    console.log(`Testing '${modelName}'...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello");
        console.log(`✅ Success with '${modelName}'`);
        console.log("Response:", result.response.text());
    } catch (e) {
        console.log(`❌ Failed '${modelName}': ${e.message} (Status: ${e.status})`);
    }
}

testModel();
