import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const Debug: React.FC = () => {
  const [status, setStatus] = useState<any>({});

  useEffect(() => {
    checkSystem();
  }, []);

  const checkSystem = async () => {
    const report: any = {};
    
    // 1. Env Vars
    report.supabaseUrl = import.meta.env.VITE_SUPABASE_URL ? 'Defined (starts with ' + import.meta.env.VITE_SUPABASE_URL.substring(0, 8) + '...)' : 'MISSING';
    report.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Defined' : 'MISSING';
    
    // 2. Connectivity
    try {
        const start = Date.now();
        const { data, error } = await supabase.from('students').select('count', { count: 'exact', head: true });
        report.supabaseConnection = error ? `Error: ${error.message}` : `OK (${Date.now() - start}ms)`;
    } catch (err: any) {
        report.supabaseConnection = `Failed: ${err.message}`;
    }

    // 3. Backend Proxy
    try {
        const start = Date.now();
        const res = await fetch('/api/verify-face', { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ referenceImage: '', capturedImage: '' }) // Should return 400 or Mock success
        });
        if (res.status === 400) report.backendProxy = `OK (Reachable, ${Date.now() - start}ms)`;
        else report.backendProxy = `Unexpected Status: ${res.status}`;
    } catch (err: any) {
        report.backendProxy = `Failed: ${err.message}`;
    }

    setStatus(report);
  };

  return (
    <div className="p-8 bg-slate-900 text-slate-200 min-h-screen font-mono">
      <h1 className="text-2xl font-bold mb-4 text-white">System Diagnostics</h1>
      <pre className="bg-black p-4 rounded border border-slate-700 overflow-auto">
        {JSON.stringify(status, null, 2)}
      </pre>
      <button onClick={checkSystem} className="mt-4 px-4 py-2 bg-indigo-600 rounded text-white">Re-run Checks</button>
      <div className="mt-8 text-sm text-slate-400">
        <p>If Supabase Connection says "Failed to fetch", check:</p>
        <ul className="list-disc ml-6 mt-2">
           <li>Internet Connection</li>
           <li>Ad Blockers / Extensions</li>
           <li>Valid VITE_SUPABASE_URL in .env.local</li>
        </ul>
      </div>
    </div>
  );
};

export default Debug;
