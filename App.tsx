import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { ViewState, UserRole, Student } from './types';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from './constants';
import { db } from './services/dbService';
import FaceLogin from './components/FaceLogin';
import StudentSignup from './components/StudentSignup';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import { Shield, User, Camera, ArrowRight, Lock } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LANDING');
  const [currentUser, setCurrentUser] = useState<{ role: UserRole; data?: any } | null>(null);
  
  // Login Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setCurrentUser({ role: UserRole.ADMIN });
      setView('ADMIN_DASHBOARD');
      setLoginError('');
    } else {
      setLoginError('Invalid credentials');
    }
  };

  const handleStudentLoginSuccess = (student: Student) => {
    setCurrentUser({ role: UserRole.STUDENT, data: student });
    setView('STUDENT_DASHBOARD');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('LANDING');
    setEmail('');
    setPassword('');
  };

  // Render Logic
  const renderContent = () => {
    switch (view) {
      case 'LANDING':
        return (
          <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fade-in">
             <div className="text-center max-w-2xl mx-auto mb-12">
               <h1 className="text-5xl font-bold text-slate-900 mb-6 tracking-tight">Smart Attendance. <br/><span className="text-blue-600">Secure & Instant.</span></h1>
               <p className="text-xl text-slate-500">The next-generation biometric attendance system for modern institutions.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                {/* Student Card */}
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 hover:shadow-2xl transition group cursor-pointer relative overflow-hidden"
                     onClick={() => setView('STUDENT_LOGIN')}>
                   <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                      <Camera className="w-32 h-32 text-blue-600" />
                   </div>
                   <div className="bg-blue-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                      <User className="w-8 h-8" />
                   </div>
                   <h3 className="text-2xl font-bold text-slate-800 mb-2">Student Access</h3>
                   <p className="text-slate-500 mb-6">Mark attendance instantly using Face ID or view your dashboard.</p>
                   <span className="text-blue-600 font-semibold flex items-center">Start Face Scan <ArrowRight className="ml-2 w-4 h-4"/></span>
                </div>

                {/* Admin Card */}
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 hover:shadow-2xl transition group cursor-pointer relative overflow-hidden"
                     onClick={() => setView('ADMIN_LOGIN')}>
                   <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                      <Shield className="w-32 h-32 text-purple-600" />
                   </div>
                   <div className="bg-purple-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6 text-purple-600">
                      <Lock className="w-8 h-8" />
                   </div>
                   <h3 className="text-2xl font-bold text-slate-800 mb-2">Admin Portal</h3>
                   <p className="text-slate-500 mb-6">Manage students, subjects, approvals, and view detailed reports.</p>
                   <span className="text-purple-600 font-semibold flex items-center">Login as Admin <ArrowRight className="ml-2 w-4 h-4"/></span>
                </div>
             </div>
             
             <div className="mt-12 text-slate-400">
               New Student? <button onClick={() => setView('STUDENT_SIGNUP')} className="text-blue-600 font-semibold hover:underline">Register Here</button>
             </div>
          </div>
        );

      case 'STUDENT_LOGIN':
        return (
          <FaceLogin 
            onSuccess={handleStudentLoginSuccess} 
            onBack={() => setView('LANDING')} 
          />
        );

      case 'STUDENT_SIGNUP':
        return (
          <StudentSignup 
            onBack={() => setView('LANDING')} 
            onSuccess={() => {
              alert("Registration submitted! Please wait for admin approval.");
              setView('LANDING');
            }} 
          />
        );

      case 'ADMIN_LOGIN':
        return (
          <div className="flex items-center justify-center min-h-[70vh]">
            <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border border-slate-200">
              <div className="text-center mb-8">
                <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Admin Login</h2>
              </div>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" 
                    placeholder="admin@college.edu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" 
                    placeholder="••••••"
                  />
                </div>
                {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
                <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-lg transition">
                   Login
                </button>
                <button type="button" onClick={() => setView('LANDING')} className="w-full text-slate-500 text-sm hover:text-slate-800 mt-2">
                   Back to Home
                </button>
              </form>
            </div>
          </div>
        );

      case 'ADMIN_DASHBOARD':
        return <AdminDashboard />;

      case 'STUDENT_DASHBOARD':
        return currentUser?.data ? <StudentDashboard student={currentUser.data} /> : <div>Error loading profile</div>;

      default:
        return <div>Not found</div>;
    }
  };

  return (
    <Layout 
      userRole={currentUser?.role} 
      onLogout={handleLogout}
      title={currentUser?.role === UserRole.ADMIN ? 'Administrator' : currentUser?.data?.name}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;