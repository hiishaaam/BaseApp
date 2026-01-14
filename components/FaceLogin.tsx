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

  const handleCapture = async (capturedImage: string) => {
    if (status === 'PROCESSING') return;
    setStatus('PROCESSING');
    setMessage('Analyzing biometric data...');

    const students = db.getStudents().filter(s => s.isApproved && s.faceEmbeddings);
    
    if (students.length === 0) {
      setStatus('ERROR');
      setMessage("Database empty.");
      return;
    }

    // Demo optimization: verify against latest 3 students
    const candidates = [...students].reverse().slice(0, 3); 
    let matchedStudent: Student | null = null;
    let highestConfidence = 0;

    for (const student of candidates) {
       if (!student.faceEmbeddings) continue;
       const result = await verifyFaceWithGemini(student.faceEmbeddings, capturedImage);
       if (result.match) {
         matchedStudent = student;
         highestConfidence = result.confidence;
         break;
       }
    }

    if (matchedStudent && activeSubject) {
      const today = new Date().toISOString().split('T')[0];
      const hasMarked = db.hasMarkedAttendance(matchedStudent.id, activeSubject.code, today);

      if (hasMarked) {
        setStatus('ERROR');
        setMessage(`Already checked in for ${activeSubject.name}.`);
        return;
      }

      const record: AttendanceRecord = {
        id: crypto.randomUUID(),
        studentId: matchedStudent.id,
        studentName: matchedStudent.name,
        department: matchedStudent.department,
        subject: activeSubject.code,
        date: today,
        timestamp: new Date().toISOString(),
        status: AttendanceStatus.PRESENT,
        verificationConfidence: highestConfidence
      };
      
      db.addAttendance(record);
      setMatchDetails({ studentName: matchedStudent.name, confidence: highestConfidence });
      setStatus('SUCCESS');
      
      setTimeout(() => onSuccess(matchedStudent!), 2500);

    } else {
       setStatus('ERROR');
       setMessage(matchedStudent ? "No active class found." : "Face not recognized. Try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] w-full max-w-4xl mx-auto p-6 animate-fade-in">
       
       {/* Active Class Indicator */}
       {activeSubject && (
         <div className="mb-8 flex items-center gap-4 bg-white/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/50 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
               <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Session</span>
               <span className="text-sm font-semibold text-slate-800">{activeSubject.name} <span className="text-slate-400 font-normal">({activeSubject.startTime} - {activeSubject.endTime})</span></span>
            </div>
         </div>
       )}

       <div className="relative w-full max-w-lg aspect-[3/4] md:aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl ring-8 ring-slate-100 dark:ring-slate-800">
         
         {/* Status Overlays */}
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
                autoCapture={status === 'IDLE' || status === 'ERROR'}
                isProcessing={status === 'PROCESSING'}
                label="Scan Face"
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
       </div>

       <button onClick={onBack} className="mt-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium">
          <X className="w-4 h-4" /> Cancel Check-in
       </button>
    </div>
  );
};

export default FaceLogin;