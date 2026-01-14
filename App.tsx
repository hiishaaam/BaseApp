import React, { useState } from 'react';
import Layout from './components/Layout';
import { ViewState, UserRole, Student } from './types';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from './constants';
import { db } from './services/dbService'; // Keep db import to ensure init runs
import FaceLogin from './components/FaceLogin';
import StudentSignup from './components/StudentSignup';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import { 
  Shield, User, Camera, ArrowRight, Lock, Zap, CheckCircle2, 
  BarChart3, Fingerprint, Sparkles, ChevronRight, 
  LayoutDashboard, Users, Clock, Building2, Quote, Menu, X
} from 'lucide-react';

interface BadgeProps {
  children?: React.ReactNode;
  className?: string;
}

const Badge = ({ children, className }: BadgeProps) => (
  <div className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${className}`}>
    {children}
  </div>
);

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LANDING');
  const [currentUser, setCurrentUser] = useState<{ role: UserRole; data?: any } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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

  // --- UI Components ---

  // --- Landing Page Sections ---

  const Navbar = () => (
    <nav className="fixed w-full z-50 transition-all duration-300 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => setView('LANDING')}>
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white">
              <Fingerprint className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">EduFace</span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Platform</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">How it Works</a>
            <a href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Customers</a>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <button 
              onClick={() => setView('ADMIN_LOGIN')}
              className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
            >
              Sign in
            </button>
            <button 
              onClick={() => setView('STUDENT_SIGNUP')}
              className="px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-semibold shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:scale-105 transition-all active:scale-95"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-600 p-2">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 p-4 space-y-4">
           <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-600">Platform</a>
           <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-slate-600">How it Works</a>
           <div className="pt-4 border-t border-slate-100 flex flex-col space-y-3">
             <button onClick={() => { setView('ADMIN_LOGIN'); setMobileMenuOpen(false); }} className="text-left font-semibold text-slate-800">Sign in (Admin)</button>
             <button onClick={() => { setView('STUDENT_SIGNUP'); setMobileMenuOpen(false); }} className="text-left font-semibold text-indigo-600">Get Started</button>
           </div>
        </div>
      )}
    </nav>
  );

  const Hero = () => (
    <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-[100px] mix-blend-multiply opacity-70 animate-blob" />
        <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-[100px] mix-blend-multiply opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-purple-50/50 rounded-full blur-[100px] mix-blend-multiply opacity-70 animate-blob animation-delay-4000" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex justify-center mb-8">
          <Badge className="border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 cursor-default">
            <Sparkles className="w-3 h-3 mr-2 text-indigo-500 fill-indigo-500" />
            <span className="font-semibold">New: Gemini 3.5 AI Integration</span>
            <span className="mx-2 text-indigo-300">|</span>
            <span className="hover:underline cursor-pointer">Read the announcement &rarr;</span>
          </Badge>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
          Identity verification <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 animate-gradient-x">
            reimagined for education.
          </span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          EduFace replaces outdated roll-calls with instant, AI-powered biometric attendance. Secure, contactless, and undeniably accurate.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={() => setView('STUDENT_LOGIN')}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-slate-900 text-white font-semibold shadow-xl shadow-indigo-900/20 hover:bg-slate-800 hover:scale-105 transition-all flex items-center justify-center group"
          >
            <Camera className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
            Launch Face ID
            <ChevronRight className="w-4 h-4 ml-1 opacity-50 group-hover:translate-x-1 transition-transform" />
          </button>
          <button 
             onClick={() => setView('STUDENT_SIGNUP')}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-slate-700 border border-slate-200 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center justify-center"
          >
            Create Student ID
          </button>
        </div>

        {/* Hero Visual Mockup */}
        <div className="mt-20 relative max-w-5xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 bottom-0 h-20" />
          
          <div className="relative rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 p-2 shadow-2xl shadow-indigo-500/10 ring-1 ring-slate-900/5">
             <div className="rounded-xl overflow-hidden bg-slate-50 border border-slate-100 aspect-[16/9] relative flex items-center justify-center group">
                
                {/* Interface Mockup CSS */}
                <div className="absolute inset-0 grid grid-cols-4 gap-4 p-6 opacity-40">
                   <div className="col-span-1 bg-white rounded-lg shadow-sm h-full" />
                   <div className="col-span-3 grid grid-rows-3 gap-4">
                      <div className="row-span-1 bg-white rounded-lg shadow-sm" />
                      <div className="row-span-2 bg-white rounded-lg shadow-sm" />
                   </div>
                </div>

                {/* Floating Card - The "Action" */}
                <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 w-full max-w-sm transform group-hover:-translate-y-2 transition-transform duration-500">
                   <div className="flex items-center space-x-4 mb-6">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                         <div className="h-2 w-24 bg-slate-900 rounded mb-2" />
                         <div className="h-2 w-16 bg-slate-200 rounded" />
                      </div>
                      <div className="ml-auto">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                           <CheckCircle2 className="w-5 h-5" />
                        </div>
                      </div>
                   </div>
                   <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <span>Biometric Match</span>
                        <span className="font-mono text-green-600">99.8%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 w-[98%] h-full rounded-full" />
                      </div>
                   </div>
                   <div className="mt-6 flex justify-between items-center border-t border-slate-50 pt-4">
                      <div className="flex items-center text-xs text-slate-400">
                        <Clock className="w-3 h-3 mr-1" /> 09:41 AM
                      </div>
                      <div className="text-xs font-semibold bg-green-50 text-green-700 px-2 py-1 rounded">
                        Access Granted
                      </div>
                   </div>
                </div>

             </div>
          </div>
        </div>
      </div>
    </div>
  );

  const SocialProof = () => (
    <div className="py-12 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-semibold text-slate-500 uppercase tracking-wider mb-8">
          Trusted by innovative campuses worldwide
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
           {['TechInstitute', 'UniGlobal', 'FutureAcademy', 'ScienceHub'].map((name, i) => (
             <div key={i} className="flex items-center justify-center gap-2 group cursor-default">
               <Building2 className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
               <span className="text-lg font-bold text-slate-400 group-hover:text-slate-800 transition-colors">{name}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );

  const Features = () => (
    <div id="features" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl mb-4">
            Everything you need to manage <br/> campus attendance.
          </h2>
          <p className="text-lg text-slate-600">
            A complete platform that handles student registration, verification, and analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Zap className="w-6 h-6 text-amber-500" />,
              title: "Lightning Fast",
              desc: "Optimized for speed. Verify a classroom of 60 students in under 2 minutes with our parallel processing engine."
            },
            {
              icon: <Shield className="w-6 h-6 text-indigo-500" />,
              title: "Anti-Spoofing",
              desc: "Advanced liveness detection prevents students from using photos or videos to proxy for their friends."
            },
            {
              icon: <LayoutDashboard className="w-6 h-6 text-blue-500" />,
              title: "Admin Controls",
              desc: "Powerful dashboards give you a bird's-eye view of attendance trends, cuts, and irregularities."
            },
            {
              icon: <Lock className="w-6 h-6 text-green-500" />,
              title: "Enterprise Security",
              desc: "Bank-grade encryption for all facial data. We prioritize student privacy and data sovereignty."
            },
            {
              icon: <Users className="w-6 h-6 text-purple-500" />,
              title: "Scalable Registry",
              desc: "Handle thousands of student records without performance degradation. Built for growth."
            },
            {
              icon: <BarChart3 className="w-6 h-6 text-rose-500" />,
              title: "Export & Sync",
              desc: "Seamlessly export data to CSV or sync with your existing LMS via our flexible API."
            }
          ].map((feature, i) => (
            <div key={i} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const HowItWorks = () => (
    <div id="how-it-works" className="py-24 bg-white">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
               <Badge className="border-blue-200 bg-blue-50 text-blue-700 mb-6">Workflow</Badge>
               <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl mb-6">
                 Three steps to <br/> effortless attendance.
               </h2>
               <div className="space-y-12">
                  {[
                    { title: "Register", desc: "Students create a profile and take a one-time reference selfie.", step: "01" },
                    { title: "Scan", desc: "Walk up to the kiosk or use a personal device to check in.", step: "02" },
                    { title: "Verify", desc: "Our AI matches the face instantly and logs the record.", step: "03" }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-6 group">
                       <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-slate-100 flex items-center justify-center font-mono font-bold text-slate-300 group-hover:border-indigo-600 group-hover:text-indigo-600 transition-colors">
                          {item.step}
                       </div>
                       <div>
                          <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                          <p className="text-slate-600">{item.desc}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
            <div className="relative">
               {/* Decorative Gradient Blob */}
               <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 to-purple-100 rounded-full blur-3xl opacity-60" />
               <div className="relative bg-slate-900 rounded-2xl p-8 shadow-2xl text-white overflow-hidden border border-slate-800">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Fingerprint className="w-64 h-64" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                       <div className="w-3 h-3 rounded-full bg-red-500" />
                       <div className="w-3 h-3 rounded-full bg-amber-500" />
                       <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="space-y-6 font-mono text-sm text-slate-300">
                       <p><span className="text-purple-400">const</span> <span className="text-blue-400">verifyStudent</span> = <span className="text-purple-400">async</span> (image) ={'>'} {'{'}</p>
                       <div className="pl-4 border-l-2 border-slate-700">
                          <p><span className="text-slate-500">// AI Analysis</span></p>
                          <p><span className="text-purple-400">const</span> result = <span className="text-purple-400">await</span> gemini.compare(image);</p>
                          <p><span className="text-purple-400">if</span> (result.confidence {'>'} <span className="text-amber-400">0.98</span>) {'{'}</p>
                          <p className="pl-4 text-green-400">return "ACCESS_GRANTED";</p>
                          <p>{'}'}</p>
                       </div>
                       <p>{'}'}</p>
                    </div>
                    <div className="mt-8 pt-8 border-t border-slate-800">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center text-green-500">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-bold text-white">System Operational</p>
                            <p className="text-xs text-slate-500">Latency: 45ms</p>
                          </div>
                       </div>
                    </div>
                  </div>
               </div>
            </div>
         </div>
       </div>
    </div>
  );

  const Testimonials = () => (
    <div id="testimonials" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-16">Don't just take our word for it</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {[
             { quote: "EduFace has completely transformed our morning routine. No more roll-call delays.", author: "Dr. Sarah Lin", role: "Dean, TechInstitute" },
             { quote: "The accuracy is astounding. It even works when students change their hairstyles.", author: "James Carter", role: "SysAdmin, UniGlobal" },
             { quote: "Setup was incredibly easy. We were live across 40 classrooms in less than a week.", author: "Emily Chen", role: "Registrar, FutureAcademy" }
           ].map((t, i) => (
             <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                <Quote className="w-8 h-8 text-indigo-100 mb-4" />
                <p className="text-slate-700 text-lg mb-6 flex-grow">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300" />
                   <div>
                      <p className="font-bold text-slate-900 text-sm">{t.author}</p>
                      <p className="text-slate-500 text-xs">{t.role}</p>
                   </div>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );

  const CTA = () => (
    <div className="bg-slate-900 py-24 relative overflow-hidden">
       {/* Background Glow */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px]" />
       
       <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to upgrade your campus?</h2>
          <p className="text-slate-400 text-xl mb-10 max-w-2xl mx-auto">
             Join the institutions that are saving thousands of hours every semester with automated attendance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <button 
               onClick={() => setView('STUDENT_SIGNUP')}
               className="px-8 py-4 bg-white text-slate-900 rounded-full font-bold hover:bg-indigo-50 transition-colors shadow-lg shadow-white/10"
             >
               Start Free Trial
             </button>
             <button 
               onClick={() => window.location.href = "mailto:sales@eduface.com"}
               className="px-8 py-4 bg-transparent border border-slate-700 text-white rounded-full font-bold hover:bg-slate-800 transition-colors"
             >
               Contact Sales
             </button>
          </div>
          <p className="mt-6 text-sm text-slate-500">No credit card required for demo access.</p>
       </div>
    </div>
  );

  const Footer = () => (
    <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
               <div className="flex items-center gap-2 mb-4 text-white">
                  <Fingerprint className="w-6 h-6" />
                  <span className="font-bold text-xl">EduFace</span>
               </div>
               <p className="text-sm leading-relaxed mb-4">
                  The new standard for biometric security in education. Secure, fast, and reliable.
               </p>
            </div>
            <div>
               <h4 className="font-bold text-white mb-4">Product</h4>
               <ul className="space-y-2 text-sm">
                  <li className="hover:text-white cursor-pointer">Features</li>
                  <li className="hover:text-white cursor-pointer">Security</li>
                  <li className="hover:text-white cursor-pointer">Enterprise</li>
               </ul>
            </div>
            <div>
               <h4 className="font-bold text-white mb-4">Company</h4>
               <ul className="space-y-2 text-sm">
                  <li className="hover:text-white cursor-pointer">About</li>
                  <li className="hover:text-white cursor-pointer">Blog</li>
                  <li className="hover:text-white cursor-pointer">Careers</li>
               </ul>
            </div>
            <div>
               <h4 className="font-bold text-white mb-4">Legal</h4>
               <ul className="space-y-2 text-sm">
                  <li className="hover:text-white cursor-pointer">Privacy</li>
                  <li className="hover:text-white cursor-pointer">Terms</li>
                  <li className="hover:text-white cursor-pointer">Contact</li>
               </ul>
            </div>
         </div>
         <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>&copy; {new Date().getFullYear()} EduFace Systems Inc.</p>
            <div className="flex gap-6">
               <span className="hover:text-white cursor-pointer">Twitter</span>
               <span className="hover:text-white cursor-pointer">LinkedIn</span>
               <span className="hover:text-white cursor-pointer">GitHub</span>
            </div>
         </div>
      </div>
    </footer>
  );

  // Render Logic
  const renderContent = () => {
    switch (view) {
      case 'LANDING':
        return (
          <div className="min-h-screen bg-white font-sans selection:bg-indigo-100 selection:text-indigo-900">
             <Navbar />
             <main>
               <Hero />
               <SocialProof />
               <Features />
               <HowItWorks />
               <Testimonials />
               <CTA />
             </main>
             <Footer />
          </div>
        );

      case 'STUDENT_LOGIN':
        return (
          <Layout userRole={currentUser?.role}>
            <FaceLogin 
              onSuccess={handleStudentLoginSuccess} 
              onBack={() => setView('LANDING')} 
            />
          </Layout>
        );

      case 'STUDENT_SIGNUP':
        return (
          <Layout userRole={currentUser?.role}>
            <StudentSignup 
              onBack={() => setView('LANDING')} 
              onSuccess={() => {
                alert("Registration submitted! Please wait for admin approval.");
                setView('LANDING');
              }} 
            />
          </Layout>
        );

      case 'ADMIN_LOGIN':
        return (
          <Layout userRole={currentUser?.role}>
             <div className="flex items-center justify-center min-h-[80vh] bg-slate-50">
              <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
                <div className="text-center mb-8">
                  <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600 shadow-sm">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Admin Portal</h2>
                  <p className="text-slate-500 mt-2">Sign in to manage the system</p>
                </div>
                <form onSubmit={handleAdminLogin} className="space-y-5">
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
                  <button type="button" onClick={() => setView('LANDING')} className="w-full text-slate-500 text-sm hover:text-slate-800 mt-4">
                     &larr; Back to Website
                  </button>
                </form>
              </div>
            </div>
          </Layout>
        );

      case 'ADMIN_DASHBOARD':
        return (
          <Layout 
            userRole={currentUser?.role} 
            onLogout={handleLogout}
            title="Administrator"
          >
            <AdminDashboard />
          </Layout>
        );

      case 'STUDENT_DASHBOARD':
        return (
           <Layout 
            userRole={currentUser?.role} 
            onLogout={handleLogout}
            title={currentUser?.data?.name}
          >
            {currentUser?.data ? <StudentDashboard student={currentUser.data} /> : <div>Error loading profile</div>}
          </Layout>
        );

      default:
        return <div>Not found</div>;
    }
  };

  return renderContent();
};

export default App;