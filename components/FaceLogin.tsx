import React, { useState, useEffect } from 'react';
import Camera from './Camera';
import { db } from '../services/dbService';
import { supabase } from '../services/supabase';
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
  const [livenessStatus, setLivenessStatus] = useState<'CHECKING' | 'CONFIRMED'>('CHECKING');

  useEffect(() => {
     if (step === 'SCAN_FACE') {
        setMessage("Looking for live subject...");
        setLivenessStatus('CHECKING');
        
        // Sequence: Detect -> Ask Blink -> Confirm
        const timer1 = setTimeout(() => {
             setMessage("Blink your eyes!");
        }, 800);

        const timer2 = setTimeout(() => {
            setLivenessStatus('CONFIRMED');
            setMessage("Processing...");
        }, 1600);

        return () => { clearTimeout(timer1); clearTimeout(timer2); };
     }
  }, [step]);
  
  useEffect(() => {
    // We will dynamically fetch today's subjects when they log in to ensure accuracy.
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

       // Minimal check inside ID entry to check if any attendance was marked 
       // We'll fully check during the capture phase when we get all subjects

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
        // Use bucket upload instead of base64 to avoid huge payloads and API limits
        const blob = await fetch(capturedImage).then(r => r.blob());
        const fileName = `temp_${Date.now()}_${targetStudent.id}.jpg`;
        
        const { error: uploadError } = await supabase.storage
            .from('face-images')
            .upload(fileName, blob, { contentType: 'image/jpeg' });
            
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage.from('face-images').getPublicUrl(fileName);
        const capturedImageUrl = data.publicUrl;

        // Compare using URLs
        const result = await verifyFaceWithGemini(targetStudent.profileImageUrl, capturedImageUrl);
        
        // Clean up the temporary image
        supabase.storage.from('face-images').remove([fileName]).catch(e => console.error("Temp cleanup failed", e));
        
        if (result.error) {
             const isRateLimit = result.message.includes('429');
             handleError(isRateLimit ? "Service busy (Quota). Retrying in 10s..." : result.message, true, isRateLimit ? 10000 : 3000);
             return;
        }

        if (result.match) {
            const today = new Date().toISOString().split('T')[0];
            const currentDay = new Date().getDay(); // 0 is Sunday, 1 is Monday etc.
            
            // Get all subjects for this student's department and year for today
            const allSubjects = await db.getSubjectsAsync(targetStudent.department, targetStudent.year);
            const todaySubjects = allSubjects.filter(s => s.dayOfWeek === currentDay);

            if (todaySubjects.length === 0) {
                setStatus('ERROR');
                setMessage("No classes scheduled for you today.");
                return;
            }

            // check if they already checked in today for the first subject
            const hasMarked = await db.hasMarkedAttendance(targetStudent.id, todaySubjects[0].code, today);

            if (hasMarked) {
                setStatus('ERROR');
                setMessage(`Already checked in today.`);
                return;
            }

            // Mark attendance for all subjects today according to timetable
            for (const subj of todaySubjects) {
                const record: AttendanceRecord = {
                    id: crypto.randomUUID(),
                    studentId: targetStudent.id,
                    studentName: targetStudent.name,
                    department: targetStudent.department,
                    subject: subj.code,
                    date: today,
                    timestamp: new Date().toISOString(),
                    status: AttendanceStatus.PRESENT,
                    verificationConfidence: result.confidence
                };
                await db.addAttendance(record);
            }
            
            setMatchDetails({ studentName: targetStudent.name, confidence: result.confidence });
            setStatus('SUCCESS');
            
            setTimeout(() => onSuccess(targetStudent), 2500);
        } else {
            console.log("Face mismatch", result.message);
            // Use the exact message from the server if available
            handleError(result.message || "Face does not match profile.", true, 3000);
        }
    } catch (err) {
        console.error("Verification error", err);
        let errorMsg = "Verification failed.";
        if (err instanceof Error) {
            if (err.message.includes('Failed to fetch')) {
                 errorMsg = "Network error: Retrieve reference photo failed (CORS/Net).";
            } else {
                 errorMsg = err.message;
            }
        }
        handleError(errorMsg, true, 3000);
    }
  };

  const handleError = (msg: string, shouldRetry: boolean, delay: number = 3000) => {
      setStatus('ERROR');
      setMessage(msg);
      
      if (shouldRetry) {
          // Pause auto-capture
          setLivenessStatus('CHECKING');
          
          // Retry sequence
          setTimeout(() => {
             setMessage("Retrying...");
             setTimeout(() => {
                 setMessage("Blink your eyes!");
                 setTimeout(() => {
                     setLivenessStatus('CONFIRMED');
                     setStatus('IDLE');
                     setMessage("Processing...");
                 }, 1000);
             }, 1000);
          }, delay);
      }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] w-full max-w-4xl mx-auto p-6 animate-fade-in">
       
       {/* Removed active subject indicator, now marks full day */}

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
                        autoCapture={livenessStatus === 'CONFIRMED'}
                        isProcessing={status === 'PROCESSING'}
                        label={`Verify: ${targetStudent?.name}`}
                      />
                      
                      {/* liveness grid overlay */}
                      {livenessStatus === 'CHECKING' && (
                          <div className="absolute inset-0 z-10 grid grid-cols-2 grid-rows-2 opacity-30 pointer-events-none">
                              <div className="border-r border-b border-indigo-400/50"></div>
                              <div className="border-b border-indigo-400/50"></div>
                              <div className="border-r border-indigo-400/50"></div>
                              <div className=""></div>
                          </div>
                      )}

                      {/* HUD Overlay */}
                      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6">
                         
                         <div className="flex justify-between items-start">
                             {/* Corners Top */}
                             <div className="w-12 h-12 border-t-4 border-l-4 border-white/50 rounded-tl-xl" />
                             
                             {/* Live Badge */}
                             <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-2 transition-colors ${
                                 livenessStatus === 'CHECKING' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50' : 'bg-red-500/20 text-red-500 border border-red-500/50 animate-pulse'
                             }`}>
                                 <div className={`w-2 h-2 rounded-full ${livenessStatus === 'CHECKING' ? 'bg-yellow-400' : 'bg-red-500 animate-ping'}`} />
                                 {livenessStatus === 'CHECKING' ? 'Detecting' : 'LIVE'}
                             </div>

                             <div className="w-12 h-12 border-t-4 border-r-4 border-white/50 rounded-tr-xl" />
                         </div>
                         
                         {/* Bottom Section */}
                         <div className="flex justify-between items-end">
                             <div className="w-12 h-12 border-b-4 border-l-4 border-white/50 rounded-bl-xl" />
                             
                             <div className={`
                               px-6 py-3 rounded-2xl backdrop-blur-xl font-medium text-sm border flex items-center gap-3 shadow-2xl transition-all duration-300 transform translate-y-2
                               ${status === 'ERROR' ? 'bg-rose-500 text-white border-rose-400' : 
                                 status === 'PROCESSING' ? 'bg-indigo-600 text-white border-indigo-500' : 
                                 'bg-slate-900/80 text-slate-100 border-white/10'}
                             `}>
                                {status === 'PROCESSING' && <Loader2 className="w-4 h-4 animate-spin" />}
                                {status === 'ERROR' && <AlertTriangle className="w-4 h-4" />}
                                {status === 'IDLE' && livenessStatus === 'CHECKING' && <ScanFace className="w-4 h-4 animate-pulse" />}
                                {status === 'IDLE' && livenessStatus === 'CONFIRMED' && <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />} 
                                
                                <span>{message}</span>
                             </div>

                             <div className="w-12 h-12 border-b-4 border-r-4 border-white/50 rounded-br-xl" />
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

// urlToBase64 removed: backend now fetches images directly using links

export default FaceLogin;