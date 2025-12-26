import React, { useState } from 'react';
import { db } from '../services/dbService';
import { Student } from '../types';
import Camera from './Camera';
import { Upload, CheckCircle, UserPlus, ArrowLeft } from 'lucide-react';

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

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newStudent: Student = {
      id: crypto.randomUUID(),
      ...formData,
      faceEmbeddings: faceImage,
      isApproved: false, // Requires admin approval
      createdAt: new Date().toISOString()
    };

    db.addStudent(newStudent);
    setIsSubmitting(false);
    onSuccess();
  };

  const departments = db.getDepartments();

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-blue-600 p-6 text-white flex items-center justify-between">
         <h2 className="text-2xl font-bold flex items-center gap-2">
           <UserPlus className="w-6 h-6" /> Student Registration
         </h2>
         <button onClick={onBack} className="text-blue-100 hover:text-white flex items-center text-sm font-medium">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
         </button>
      </div>

      <div className="p-8">
        <div className="mb-8 flex items-center justify-center">
          <div className={`flex items-center ${step === 1 ? 'text-blue-600 font-bold' : 'text-slate-500'}`}>
            <span className="w-8 h-8 rounded-full border-2 flex items-center justify-center mr-2 border-current">1</span>
            Basic Info
          </div>
          <div className="w-16 h-px bg-slate-300 mx-4"></div>
          <div className={`flex items-center ${step === 2 ? 'text-blue-600 font-bold' : 'text-slate-500'}`}>
            <span className="w-8 h-8 rounded-full border-2 flex items-center justify-center mr-2 border-current">2</span>
            Face Data
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Admission Number</label>
                <input required type="text" name="admissionNumber" value={formData.admissionNumber} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="2024CS101" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">College Email</label>
                <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="john.doe@college.edu" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <select required name="department" value={formData.department} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                <select required name="year" value={formData.year} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Section</label>
                <input required type="text" name="section" value={formData.section} onChange={handleChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="A, B, C..." />
              </div>
              
              <div className="md:col-span-2 flex justify-end mt-4">
                <button type="button" onClick={() => setStep(2)} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">Next: Face Capture</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center animate-fade-in">
              <div className="text-center mb-6">
                 <h3 className="text-lg font-semibold text-slate-800">Setup Face ID</h3>
                 <p className="text-sm text-slate-500">Ensure good lighting and look directly at the camera.</p>
              </div>

              {!faceImage ? (
                <div className="w-full max-w-md">
                   <Camera onCapture={handleCapture} label="Capture Reference Photo" />
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-4">
                   <div className="relative">
                     <img src={faceImage} alt="Captured" className="w-64 h-64 object-cover rounded-xl border-4 border-green-500 shadow-lg transform scale-x-[-1]" />
                     <div className="absolute -bottom-3 -right-3 bg-green-500 text-white p-2 rounded-full">
                       <CheckCircle className="w-6 h-6" />
                     </div>
                   </div>
                   <div className="flex space-x-3">
                     <button type="button" onClick={() => setFaceImage(null)} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700">Retake</button>
                     <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md disabled:opacity-50">
                        {isSubmitting ? 'Registering...' : 'Complete Registration'}
                     </button>
                   </div>
                </div>
              )}
              
              <div className="w-full flex justify-start mt-8">
                 <button type="button" onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-800 text-sm">← Back to Info</button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default StudentSignup;