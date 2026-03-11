import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function check() {
    const { data: students, error: studentError } = await supabase.from('students').select('*');
    if (studentError) {
        console.error("Student Error:", studentError);
        return;
    }
    console.log("Students:", JSON.stringify(students, null, 2));

    let department = students.length > 0 ? students[0].department : 'Computer Science';
    let year = students.length > 0 ? students[0].year : '1';

    const currentDay = new Date().getDay(); // get today's day

    const mockSubject = {
        name: 'Automated Testing Subject',
        code: 'TEST-' + currentDay,
        department: department,
        year: year,
        semester: '1',
        dayOfWeek: currentDay,
        startTime: '09:00',
        endTime: '16:00'
    };

    console.log("Inserting subject:", mockSubject);

    const { data: inserted, error: insertError } = await supabase.from('subjects').insert(mockSubject).select();
    
    if (insertError) {
        console.error("Insert Error:", insertError);
        return;
    }
    console.log("Inserted subject successfully:", inserted);
}
check();
