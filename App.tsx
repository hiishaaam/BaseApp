import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import { UserRole, Student } from './types';
import FaceLogin from './components/FaceLogin';
import StudentSignup from './components/StudentSignup';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import LandingPage from './components/LandingPage';
import AdminLogin from './components/AdminLogin';
import Debug from './components/Debug';

const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<{ role: UserRole; data?: any } | null>(null);
  const [adminView, setAdminView] = useState('overview'); 

  // Wrapper for Navigation access inside components if needed, 
  // though we are using useNavigate hook in children now.
  
  const handleLogout = () => {
    setCurrentUser(null);
    // Navigate is handled by the component calling this or via return link
    // But since this function is passed down, we might need a way to redirect.
    // However, since we are inside BrowserRouter, we can't use useNavigate in AppContent easily 
    // unless we split AppContent. 
    // Actually, let's wrap the routes in a component requiring Auth if needed.
    // For now, simpler approach: pass a logout handler that basically resets state 
    // and let the child redirect if it detects no user. 
    // OR: use <Navigate> in the render if currentUser is null for protected routes.
  };

  const RequireAuth = ({ children, role }: { children: React.ReactElement, role?: UserRole }) => {
     if (!currentUser) {
       return <Navigate to="/" replace />;
     }
     // Simple role check
     if (role && currentUser.role !== role && currentUser.role !== UserRole.ADMIN) {
        // Allow Admin to see everything or handle strictly
        // For now, loose check
     }
     return children;
  };

  return (
    <Routes>
      <Route path="/debug" element={<Debug />} />
      <Route path="/" element={<LandingPage />} />
      
      <Route path="/student/login" element={
        <Layout userRole={currentUser?.role}>
          <FaceLoginWrapper setCurrentUser={setCurrentUser} />
        </Layout>
      } />
      
      <Route path="/student/signup" element={
        <Layout userRole={currentUser?.role}>
          <StudentSignupWrapper />
        </Layout>
      } />
      
      <Route path="/admin/login" element={
        <Layout userRole={currentUser?.role}>
          <AdminLoginWrapper setCurrentUser={setCurrentUser} />
        </Layout>
      } />

      <Route path="/dashboard/admin" element={
        <RequireAuth>
          <Layout 
            userRole={currentUser?.role} 
            onLogout={handleLogout}
            title="Administrator"
            currentView={adminView}
            onNavigate={setAdminView}
          >
            {currentUser ? (
               <AdminDashboard 
                currentUser={currentUser}
                view={adminView}
                onViewChange={setAdminView}
              /> 
            ) : <Navigate to="/admin/login" />}
          </Layout>
        </RequireAuth>
      } />

      <Route path="/dashboard/student" element={
        <RequireAuth>
          <Layout 
            userRole={currentUser?.role} 
            onLogout={handleLogout}
            title={currentUser?.data?.name}
          >
             {currentUser?.data ? <StudentDashboard student={currentUser.data} /> : <div>Error loading profile</div>}
          </Layout>
        </RequireAuth>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Wrappers to handle navigation logic that was previously in App.tsx
const FaceLoginWrapper = ({ setCurrentUser }: { setCurrentUser: (u: any) => void }) => {
  const navigate = useNavigate();
  return (
    <FaceLogin 
      onSuccess={(student) => {
        setCurrentUser({ role: UserRole.STUDENT, data: student });
        navigate('/dashboard/student');
      }} 
      onBack={() => navigate('/')} 
    />
  );
};

const StudentSignupWrapper = () => {
  const navigate = useNavigate();
  return (
    <StudentSignup 
      onBack={() => navigate('/')} 
      onSuccess={() => {
        alert("Registration submitted! Please wait for admin approval.");
        navigate('/');
      }} 
    />
  );
};

const AdminLoginWrapper = ({ setCurrentUser }: { setCurrentUser: (u: any) => void }) => {
  const navigate = useNavigate();
  return (
    <AdminLogin 
      onLoginSuccess={(user) => {
        setCurrentUser(user);
        navigate('/dashboard/admin');
      }}
    />
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
