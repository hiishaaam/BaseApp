import React from 'react';
import { COLLEGE_NAME, APP_NAME } from '../constants';
import { LogOut, ShieldCheck, LayoutDashboard, Users, FileText, Settings, Fingerprint, Bell, Search, Menu } from 'lucide-react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  userRole?: UserRole;
  onLogout?: () => void;
  title?: string;
  onNavigate?: (view: string) => void;
  currentView?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, userRole, onLogout, title, onNavigate, currentView }) => {
  const isDashboard = userRole === UserRole.ADMIN || userRole === UserRole.HOD || userRole === UserRole.TUTOR || (userRole === UserRole.STUDENT && title);
  const isStaff = userRole === UserRole.ADMIN || userRole === UserRole.HOD || userRole === UserRole.TUTOR;

  if (isDashboard && isStaff) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex text-slate-900">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 text-slate-300 flex-shrink-0 fixed h-full z-20 hidden md:flex flex-col border-r border-slate-800">
          <div className="h-16 flex items-center px-6 border-b border-slate-800">
            <div className="flex items-center gap-2 text-white">
              <div className="bg-indigo-600 p-1.5 rounded-lg shadow-lg shadow-indigo-500/20">
                <Fingerprint className="w-5 h-5" />
              </div>
              <span className="font-bold tracking-tight">EduFace</span>
            </div>
          </div>

          <div className="flex-1 py-6 px-3 space-y-1">
            <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Overview
            </div>
            <NavItem 
              icon={<LayoutDashboard className="w-5 h-5" />} 
              label="Dashboard" 
              active={currentView === 'overview'} 
              onClick={() => onNavigate?.('overview')} 
            />
            <NavItem 
              icon={<Users className="w-5 h-5" />} 
              label="Students" 
              active={currentView === 'students'} 
              onClick={() => onNavigate?.('students')} 
            />
            <NavItem 
              icon={<FileText className="w-5 h-5" />} 
              label="Reports" 
              active={currentView === 'reports'} 
              onClick={() => onNavigate?.('reports')} 
            />
            
            <div className="px-3 mt-8 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Configuration
            </div>
            <NavItem 
              icon={<Settings className="w-5 h-5" />} 
              label="Settings" 
              active={currentView === 'settings'} 
              onClick={() => onNavigate?.('settings')} 
            />
          </div>

          <div className="p-4 border-t border-slate-800">
            <button 
              onClick={onLogout}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 md:ml-64 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-10 px-4 sm:px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-slate-800">{title || 'Dashboard'}</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative hidden sm:block">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="pl-9 pr-4 py-1.5 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-indigo-500 w-64 transition-all"
                />
              </div>
              <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <div className="h-8 w-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm">
                AD
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Student Dashboard Layout (Simplified) or Transactional Layout
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 relative">
      {/* Background Texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <header className="bg-white/70 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="bg-slate-900 p-1.5 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-white" />
             </div>
             <div>
               <h1 className="font-bold text-sm tracking-tight leading-none">{APP_NAME}</h1>
               <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">{COLLEGE_NAME}</p>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
             {title && <span className="hidden md:inline-flex px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-600 border border-slate-200">{title}</span>}
             {userRole && onLogout && (
               <button 
                onClick={onLogout}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
               >
                 <span>Sign Out</span>
                 <LogOut className="w-4 h-4" />
               </button>
             )}
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col relative z-0">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex-grow flex flex-col">
          {children}
        </div>
      </main>

      <footer className="py-6 text-center text-slate-400 text-xs border-t border-slate-100 bg-white/50 backdrop-blur-sm">
        <p>&copy; {new Date().getFullYear()} {COLLEGE_NAME}. secure system.</p>
      </footer>
    </div>
  );
};

const NavItem = ({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default Layout;