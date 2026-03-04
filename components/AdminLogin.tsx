import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Shield } from 'lucide-react';
import { ADMIN_EMAIL, ADMIN_PASSWORD, MOCK_DEPARTMENTS, MOCK_TUTORS } from '../constants';
import { UserRole } from '../types';

interface AdminLoginProps {
  onLoginSuccess: (user: { role: UserRole; department?: string; year?: string; email?: string }) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Check for Super Admin
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      onLoginSuccess({ role: UserRole.ADMIN });
      return;
    }

    // 2. Check for HOD Logic
    const hod = MOCK_DEPARTMENTS.find((d: any) => d.hodEmail === email && d.hodPassword === password);
    if (hod) {
       onLoginSuccess({ role: UserRole.HOD, department: hod.name, email: hod.hodEmail });
       return;
    }

    // 3. Check for Tutor Logic
    const tutor = MOCK_TUTORS.find((t: any) => t.email === email && t.password === password);
    if (tutor) {
       onLoginSuccess({ role: UserRole.TUTOR, year: tutor.year, email: tutor.email });
       return;
    }

    setLoginError('Invalid credentials');
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] bg-slate-50">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-8">
          <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Admin Portal</h2>
          <p className="text-slate-500 mt-2">Sign in to manage the system</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
              placeholder="admin@college.edu"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
              placeholder="••••••"
            />
          </div>
          {loginError && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center">
               <Shield className="w-4 h-4 mr-2" /> {loginError}
            </div>
          )}
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-indigo-200">
             Sign In
          </button>
          <button type="button" onClick={() => navigate('/')} className="w-full text-slate-500 text-sm hover:text-slate-800 mt-4">
             &larr; Back to Website
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
