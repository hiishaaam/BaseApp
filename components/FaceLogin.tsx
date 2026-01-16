import React, { useState } from 'react';
import Camera from './Camera';
import { db } from '../services/dbService';
import { verifyFaceWithGemini } from '../services/geminiService';
import { AttendanceRecord, AttendanceStatus, Student } from '../types';
import { CheckCircle2, AlertTriangle, X, ScanFace, Loader2, CalendarCheck } from 'lucide-react';

interface Props {
  onSuccess: (student: Student) => void;
  onBack: () => void;
}

const FaceLogin: React.FC<Props> = ({ onSuccess, onBack }) => {
  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [message, setMessage] = useState('Position your face within the frame');
  const [matchDetails, setMatchDetails] = useState<{ studentName: string; confidence: number } | null>(null);

  const handleCapture = async (capturedImage: string) => {
    if (status === 'PROCESSING') return;
    setStatus('PROCESSING');
    setMessage('Analyzing biometric identity...');

    const students = db.getStudents().filter(s => s.isApproved && s.faceEmbeddings);
    
    if (students.length === 0) {
      setStatus('ERROR');
      setMessage("No approved students found.");
      return;
    }

    // Identify candidate (usually the model handles 1:N but we iterate for demo)
    const candidates = [...students].reverse(); 
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

    if (matchedStudent) {
      const today = new Date().toISOString().split('T')[0];
      const alreadyCheckedIn = db.hasMarkedAttendance(matchedStudent.id, today);

      if (alreadyCheckedIn) {
        setStatus('ERROR');
        setMessage(`Attendance already marked for today.`);
        return;
      }

      const record: AttendanceRecord = {
        id: crypto.randomUUID(),
        studentId: matchedStudent.id,
        studentName: matchedStudent.name,
        department: matchedStudent.department,
        subject: 'DAILY_CHECKIN', // Standard identifier for daily mode
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
       setMessage("Face not recognized. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] w-full max-w-4xl mx-auto p-6 animate-fade-in">
       
       {/* Daily Mode Indicator */}
       <div className="mb-8 flex items-center gap-4 bg-white/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/50 shadow-sm">
          <CalendarCheck className="w-5 h-5 text-indigo-600" />
          <div className="flex items-center gap-4">
             <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Mode</span>
             <span className="text-sm font-semibold text-slate-800">Daily Attendance Log</span>
          </div>
       </div>

       <div className="relative w-full max-w-lg aspect-[3/4] md:aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl ring-8 ring-slate-100 dark:ring-slate-800">
         
         {/* Status Overlays */}
         {status === 'SUCCESS' && matchDetails ? (
           <div className="absolute inset-0 z-20 bg-emerald-500/90 backdrop-blur-sm flex flex-col items-center justify-center text-white animate-fade-in">
              <div className="bg-white text-emerald-600 rounded-full p-6 shadow-xl mb-6 transform scale-110">
                <CheckCircle2 className="w-16 h-16" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight">Access Granted</h2>
              <p className="text-emerald-100 mt-2 text-lg font-medium">{matchDetails.studentName}</p>
              <div className="mt-8 bg-black/20 px-4 py-2 rounded-lg font-mono text-xs">
                 Verification: {matchDetails.confidence}%
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
                 <div className="absolute top-6 left-6 w-12 h-12 border-t-4 border-l-4 border-white/20 rounded-tl-xl" />
                 <div className="absolute top-6 right-6 w-12 h-12 border-t-4 border-r-4 border-white/20 rounded-tr-xl" />
                 <div className="absolute bottom-6 left-6 w-12 h-12 border-b-4 border-l-4 border-white/20 rounded-bl-xl" />
                 <div className="absolute bottom-6 right-6 w-12 h-12 border-b-4 border-r-4 border-white/20 rounded-br-xl" />
                 
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
          <X className="w-4 h-4" /> Exit
       </button>
    </div>
  );
};

export default FaceLogin;