import React, { useState, useEffect } from 'react';
import Camera from './Camera';
import { db } from '../services/dbService';
import { verifyFaceWithGemini } from '../services/geminiService';
import { AttendanceRecord, AttendanceStatus, Student, Subject } from '../types';
import { CheckCircle2, AlertTriangle, X, Clock, ScanFace, Loader2 } from 'lucide-react';

interface Props {
  onSuccess: (student: Student) => void;
  onBack: () => void;
}

const FaceLogin: React.FC<Props> = ({ onSuccess, onBack }) => {
  const [step, setStep] = useState<'INPUT_ID' | 'SCAN_FACE'>('INPUT_ID');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [targetStudent, setTargetStudent] = useState<Student | null>(null);

  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [message, setMessage] = useState('Position your face within the frame');
  const [matchDetails, setMatchDetails] = useState<{ studentName: string; confidence: number } | null>(null);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);

  useEffect(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const subjects = db.getSubjects();
    const subject = subjects.find(s => {
      const startH = parseInt(s.startTime.split(':')[0]);
      const endH = parseInt(s.endTime.split(':')[0]);
      return currentHour >= startH && currentHour < endH;
    });
    setActiveSubject(subject || subjects[0]);
  }, []);

  // Handle Admission Number Submit
  const handleAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('PROCESSING');
    setMessage('Verifying ID...');
    
    const student = await db.getStudentByAdmission(admissionNumber);
    
    if (student) {
       if (!student.isApproved) {
         setStatus('ERROR');
         setMessage('Student ID not active/approved.');
         return;
       }

       // Check if already marked attendance for today's active subject
       if (activeSubject) {
         const today = new Date().toISOString().split('T')[0];
         const hasMarked = await db.hasMarkedAttendance(student.id, activeSubject.code, today);
         
         if (hasMarked) {
             // Already checked in, redirect to dashboard immediately
             onSuccess(student);
             return;
         }
       }

       setTargetStudent(student);
       setStep('SCAN_FACE');
       setStatus('IDLE');
       setMessage(`Welcome ${student.name.split(' ')[0]}, scan face to confirm.`);
    } else {
       setStatus('ERROR');
       setMessage('Admission number not found.');
    }
  };

  const handleCapture = async (capturedImage: string) => {
    if (status === 'PROCESSING') return;
    setStatus('PROCESSING');
    setMessage('Verifying identity...');

    if (!targetStudent || !targetStudent.profileImageUrl) {
        setStatus('ERROR');
        setMessage("Student profile incomplete.");
        return;
    }

    try {
        // Fetch the reference image as base64
        const imageBase64 = await urlToBase64(targetStudent.profileImageUrl);
        
        // Compare captured face with the SPECIFIC student's reference face
        const result = await verifyFaceWithGemini(imageBase64, capturedImage);
        
        if (result.match) {
            if (activeSubject) {
                const today = new Date().toISOString().split('T')[0];
                const hasMarked = await db.hasMarkedAttendance(targetStudent.id, activeSubject.code, today);

                if (hasMarked) {
                    setStatus('ERROR');
                    setMessage(`Already checked in today.`);
                    return;
                }

                const record: AttendanceRecord = {
                    id: crypto.randomUUID(),
                    studentId: targetStudent.id,
                    studentName: targetStudent.name,
                    department: targetStudent.department,
                    subject: activeSubject.code,
                    date: today,
                    timestamp: new Date().toISOString(),
                    status: AttendanceStatus.PRESENT,
                    verificationConfidence: result.confidence
                };
                
                await db.addAttendance(record);
                setMatchDetails({ studentName: targetStudent.name, confidence: result.confidence });
                setStatus('SUCCESS');
                
                setTimeout(() => onSuccess(targetStudent), 2500);
            } else {
                setStatus('ERROR');
                setMessage("No active class session found.");
            }
        } else {
            console.log("Face mismatch", result.message);
            setStatus('ERROR');
            setMessage("Face does not match profile.");
        }
    } catch (err) {
        console.error("Verification error", err);
        setStatus('ERROR');
        setMessage("Verification failed. Try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] w-full max-w-4xl mx-auto p-6 animate-fade-in">
       
       {/* Active Class Indicator */}
       {activeSubject && (
         <div className="mb-8 flex flex-col items-center gap-2 bg-white/60 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/50 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-1">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               Active Session
            </div>
            <div className="text-xl font-bold text-slate-800">
               {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
         </div>
       )}

       <div className="relative w-full max-w-lg aspect-[3/4] md:aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl ring-8 ring-slate-100 dark:ring-slate-800">
         
         {/* STEP 1: Admission Input */}
         {step === 'INPUT_ID' && (
            <div className="absolute inset-0 z-30 bg-white flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
                   <ScanFace className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Student Check-in</h2>
                <p className="text-slate-500 text-center mb-8">Enter your admission number to initiate face verification.</p>
                
                <form onSubmit={handleAdmissionSubmit} className="w-full max-w-xs space-y-4">
                   <input 
                     type="text" 
                     value={admissionNumber}
                     onChange={e => { setAdmissionNumber(e.target.value.toUpperCase()); setStatus('IDLE'); }}
                     className="w-full text-center text-lg uppercase font-mono tracking-widest p-4 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                     placeholder="BIT/2024/001"
                     autoFocus
                   />
                   <button 
                     type="submit" 
                     className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-transform active:scale-95 flex items-center justify-center gap-2"
                     disabled={status === 'PROCESSING'}
                   >
                      {status === 'PROCESSING' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
                   </button>
                   {status === 'ERROR' && (
                      <p className="text-red-500 text-sm text-center font-medium animate-shake">{message}</p>
                   )}
                </form>
            </div>
         )}

         {/* STEP 2: Face Scan */}
         {step === 'SCAN_FACE' && (
             <>
                {status === 'SUCCESS' && matchDetails ? (
                   <div className="absolute inset-0 z-20 bg-emerald-500/90 backdrop-blur-sm flex flex-col items-center justify-center text-white animate-fade-in">
                      <div className="bg-white text-emerald-600 rounded-full p-6 shadow-xl mb-6 transform scale-110">
                        <CheckCircle2 className="w-16 h-16" />
                      </div>
                      <h2 className="text-3xl font-bold tracking-tight">Verified</h2>
                      <p className="text-emerald-100 mt-2 text-lg font-medium">{matchDetails.studentName}</p>
                      <div className="mt-8 bg-black/20 px-4 py-2 rounded-lg font-mono text-sm">
                         Confidence: {matchDetails.confidence}%
                      </div>
                   </div>
                 ) : (
                   <>
                      <Camera 
                        onCapture={handleCapture} 
                        autoCapture={true}
                        isProcessing={status === 'PROCESSING'}
                        label={`Verify: ${targetStudent?.name}`}
                      />
                      
                      {/* HUD Overlay */}
                      <div className="absolute inset-0 pointer-events-none z-10">
                         {/* Corners */}
                         <div className="absolute top-6 left-6 w-12 h-12 border-t-4 border-l-4 border-white/30 rounded-tl-xl" />
                         <div className="absolute top-6 right-6 w-12 h-12 border-t-4 border-r-4 border-white/30 rounded-tr-xl" />
                         <div className="absolute bottom-6 left-6 w-12 h-12 border-b-4 border-l-4 border-white/30 rounded-bl-xl" />
                         <div className="absolute bottom-6 right-6 w-12 h-12 border-b-4 border-r-4 border-white/30 rounded-br-xl" />
                         
                         {/* Status Message */}
                         <div className="absolute bottom-10 left-0 right-0 flex justify-center">
                            <div className={`
                              px-6 py-2 rounded-full backdrop-blur-md font-medium text-sm border flex items-center gap-2 shadow-lg transition-all duration-300
                              ${status === 'ERROR' ? 'bg-red-500/80 border-red-400 text-white' : 
                                status === 'PROCESSING' ? 'bg-indigo-500/80 border-indigo-400 text-white' : 
                                'bg-black/50 border-white/10 text-white'}
                            `}>
                               {status === 'PROCESSING' && <Loader2 className="w-4 h-4 animate-spin" />}
                               {status === 'ERROR' && <AlertTriangle className="w-4 h-4" />}
                               {status === 'IDLE' && <ScanFace className="w-4 h-4" />}
                               {message}
                            </div>
                         </div>
                      </div>
                   </>
                 )}
             </>
         )}
       </div>

       <button onClick={() => {
           if(step === 'SCAN_FACE') {
               setStep('INPUT_ID');
               setTargetStudent(null);
               setStatus('IDLE');
               setAdmissionNumber('');
               setMessage('');
           } else {
               onBack();
           }
       }} className="mt-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium">
          <X className="w-4 h-4" /> {step === 'SCAN_FACE' ? 'Back to ID Entry' : 'Cancel Check-in'}
       </button>
    </div>
  );
};

async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default FaceLogin;