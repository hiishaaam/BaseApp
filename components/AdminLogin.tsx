import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Shield } from 'lucide-react';
import { ADMIN_EMAIL, MOCK_DEPARTMENTS, MOCK_TUTORS } from '../constants';
import { UserRole } from '../types';
import { supabase } from '../services/supabase';
import { Loader2 } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (user: { role: UserRole; department?: string; year?: string; email?: string }) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    try {
      // 1. Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoginError(error.message);
        setIsLoading(false);
        return;
      }

      // 2. Map authenticated user to their Role
      const authEmail = data.user?.email || email;

      if (authEmail === ADMIN_EMAIL) {
        onLoginSuccess({ role: UserRole.ADMIN, email: authEmail });
      } else {
        const hod = MOCK_DEPARTMENTS.find((d: any) => d.hodEmail === authEmail);
        if (hod) {
          onLoginSuccess({ role: UserRole.HOD, department: hod.name, email: authEmail });
        } else {
          const tutor = MOCK_TUTORS.find((t: any) => t.email === authEmail);
          if (tutor) {
             onLoginSuccess({ role: UserRole.TUTOR, year: tutor.year, email: authEmail });
          } else {
             // Default to standard admin if email doesn't match predefined roles but exists in Supabase
             onLoginSuccess({ role: UserRole.ADMIN, email: authEmail });
          }
        }
      }
    } catch (err: any) {
      setLoginError(err.message || 'An unexpected error occurred during login');
    } finally {
      setIsLoading(false);
    }
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
          <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
             {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
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
