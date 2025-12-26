import React from 'react';
import { COLLEGE_NAME, APP_NAME } from '../constants';
import { LogOut, ShieldCheck, GraduationCap } from 'lucide-react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  userRole?: UserRole;
  onLogout?: () => void;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, userRole, onLogout, title }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">{APP_NAME}</h1>
              <p className="text-xs text-slate-400">{COLLEGE_NAME}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
             {title && <span className="hidden md:inline-block text-slate-300 font-medium border-r border-slate-700 pr-4">{title}</span>}
             {userRole && onLogout && (
               <button 
                onClick={onLogout}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 transition px-3 py-1.5 rounded-md text-sm"
               >
                 <LogOut className="w-4 h-4" />
                 <span>Logout</span>
               </button>
             )}
          </div>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-slate-500 text-sm">
        &copy; {new Date().getFullYear()} {COLLEGE_NAME}. All rights reserved.
      </footer>
    </div>
  );
};

export default Layout;