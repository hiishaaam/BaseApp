import React, { useState } from 'react';
import { db } from '../services/dbService';
import { Student } from '../types';
import Camera from './Camera';
import { CheckCircle, User, ArrowLeft, ArrowRight, UploadCloud, BadgeCheck } from 'lucide-react';

interface Props {
  onBack: () => void;
  onSuccess: () => void;
}

const StudentSignup: React.FC<Props> = ({ onBack, onSuccess }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    admissionNumber: '',
    department: '',
    year: '',
    section: ''
  });
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCapture = (imageSrc: string) => {
    setFaceImage(imageSrc);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faceImage) return;

    setIsSubmitting(true);
    
    try {
      // We pass the faceImage separately to the DB service to handle upload.
      // The student object should not contain the image yet (it will be set after upload).
      const studentData: any = {
         id: crypto.randomUUID(),
         ...formData,
         faceEmbeddings: faceImage,
         isApproved: false,
         createdAt: new Date().toISOString()
      };

      await db.addStudent(studentData);
      onSuccess();
    } catch (error: any) {
      console.error("Signup Error:", error);
      alert(`Registration Failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const departments = db.getDepartments();

  return (
    <div className="max-w-2xl mx-auto py-8 animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-800 text-sm font-medium flex items-center gap-1 transition-colors mb-4">
           <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Create Student ID</h1>
        <p className="text-slate-500 mt-2">Complete your profile to enable facial recognition access.</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-10">
         <StepIndicator step={1} current={step} label="Personal Details" />
         <div className={`flex-1 h-0.5 rounded-full ${step > 1 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
         <StepIndicator step={2} current={step} label="Biometric Setup" />
      </div>

      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden relative">
        <form onSubmit={handleSubmit} className="p-8">
          
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup label="Full Name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Alex Johnson" autoFocus />
                <InputGroup label="Admission Number" name="admissionNumber" value={formData.admissionNumber} onChange={handleChange} placeholder="e.g. 2024CS101" />
                <InputGroup label="College Email" name="email" value={formData.email} onChange={handleChange} type="email" placeholder="alex@college.edu" className="md:col-span-2" />
                
                <div>
                   <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Department</label>
                   <div className="relative">
                     <select required name="department" value={formData.department} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none transition-all font-medium text-slate-700">
                        <option value="">Select...</option>
                        {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                     </select>
                     <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ArrowRight className="w-4 h-4 rotate-90" />
                     </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Year</label>
                    <select required name="year" value={formData.year} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700">
                      <option value="">...</option>
                      {[1, 2, 3, 4].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <InputGroup label="Section" name="section" value={formData.section} onChange={handleChange} placeholder="A" />
                </div>
              </div>

              <div className="pt-6 flex justify-end border-t border-slate-100 mt-6">
                <button 
                  type="button" 
                  onClick={() => {
                    if (formData.name && formData.admissionNumber) setStep(2);
                    else alert("Please fill basic details");
                  }} 
                  className="bg-slate-900 text-white px-8 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 flex items-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in flex flex-col items-center">
              <div className="text-center max-w-md mx-auto mb-8">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                   <User className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Reference Photo</h3>
                <p className="text-slate-500 text-sm mt-2">
                  We need a clear photo of your face to set up your biometric ID. This will be used for verification.
                </p>
              </div>

              <div className="w-full max-w-md bg-slate-950 rounded-2xl overflow-hidden shadow-2xl relative group">
                 {!faceImage ? (
                   <Camera onCapture={handleCapture} label="Capture Reference" />
                 ) : (
                   <div className="relative">
                      <img src={faceImage} alt="Captured" className="w-full aspect-video object-cover opacity-80" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                         <div className="bg-white/10 p-4 rounded-full backdrop-blur-md mb-4 border border-white/20">
                            <BadgeCheck className="w-12 h-12 text-emerald-400" />
                         </div>
                         <p className="text-white font-semibold">Photo Captured Successfully</p>
                         <button type="button" onClick={() => setFaceImage(null)} className="mt-4 text-xs text-slate-300 hover:text-white underline">
                           Retake Photo
                         </button>
                      </div>
                   </div>
                 )}
              </div>

              <div className="w-full flex justify-between items-center mt-8 pt-6 border-t border-slate-100">
                 <button type="button" onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-900 font-medium text-sm">
                   Back
                 </button>
                 <button 
                    type="submit" 
                    disabled={!faceImage || isSubmitting}
                    className={`px-8 py-3 rounded-xl font-semibold text-white shadow-lg transition-all flex items-center gap-2
                      ${!faceImage || isSubmitting ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30 hover:scale-105'}
                    `}
                 >
                    {isSubmitting ? (
                      <>Processing <span className="animate-pulse">...</span></>
                    ) : (
                      <>Complete Registration <UploadCloud className="w-4 h-4" /></>
                    )}
                 </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
};

const StepIndicator = ({ step, current, label }: any) => {
  const active = current >= step;
  return (
    <div className={`flex items-center gap-2 ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
        ${active ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300 bg-white'}
      `}>
        {active ? <CheckCircle className="w-4 h-4" /> : step}
      </div>
      <span className="font-semibold text-sm hidden sm:block">{label}</span>
    </div>
  );
};

const InputGroup = ({ label, className, ...props }: any) => (
  <div className={className}>
    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">{label}</label>
    <input 
      {...props} 
      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-900" 
    />
  </div>
);

export default StudentSignup;