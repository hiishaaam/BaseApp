import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

console.log("Testing Supabase Connection...");
console.log("URL:", url);
console.log("Key Length:", key ? key.length : 0);

if (!url || !key) {
    console.error("Missing credentials.");
    process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
    try {
        const start = Date.now();
        // Just try to fetch root or health check or empty query
        // Selecting from a likely table 'students'
        const { data, error } = await supabase.from('students').select('count', { count: 'exact', head: true });
        
        console.log("Response Time:", Date.now() - start, "ms");

        if (error) {
            console.error("Supabase Error:", error.message);
            console.error("Details:", error);
            if(error.message === "Failed to fetch") {
                console.log("\nDIAGNOSIS: 'Failed to fetch' usually means:");
                console.log("1. No internet connection.");
                console.log("2. The VITE_SUPABASE_URL does not exist.");
                console.log("3. Firewall blocking connection.");
            }
        } else {
            console.log("Connection Successful! Status: OK");
        }
    } catch (err) {
        console.error("Exception:", err.message);
    }
}

test();
