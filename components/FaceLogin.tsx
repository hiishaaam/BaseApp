import React, { useState, useEffect } from 'react';
import Camera from './Camera';
import { db } from '../services/dbService';
import { verifyFaceWithGemini } from '../services/geminiService';
import { AttendanceRecord, AttendanceStatus, Student, Subject } from '../types';
import { CheckCircle, XCircle, Clock, Calendar, AlertTriangle } from 'lucide-react';

interface Props {
  onSuccess: (student: Student) => void;
  onBack: () => void;
}

const FaceLogin: React.FC<Props> = ({ onSuccess, onBack }) => {
  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [message, setMessage] = useState('Position your face within the frame.');
  const [matchDetails, setMatchDetails] = useState<{ studentName: string; confidence: number } | null>(null);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);

  // Determine current active subject based on time
  useEffect(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const subjects = db.getSubjects();
    
    // Simple logic: find subject that is happening NOW
    const subject = subjects.find(s => {
      const startH = parseInt(s.startTime.split(':')[0]);
      const endH = parseInt(s.endTime.split(':')[0]);
      return currentHour >= startH && currentHour < endH;
    });

    // Fallback for demo if no class is active, just pick the first one
    setActiveSubject(subject || subjects[0]);
  }, []);

  const handleCapture = async (capturedImage: string) => {
    if (status === 'PROCESSING') return;
    setStatus('PROCESSING');
    setMessage('Verifying identity with Gemini AI...');

    const students = db.getStudents().filter(s => s.isApproved && s.faceEmbeddings);
    
    if (students.length === 0) {
      setStatus('ERROR');
      setMessage("No approved students in database.");
      return;
    }

    let matchedStudent: Student | null = null;
    let highestConfidence = 0;
    let apiErrorOccurred = false;
    let lastErrorMessage = "";

    // For demo efficiency: Check the most recently created student first
    const candidates = [...students].reverse().slice(0, 3); 

    for (const student of candidates) {
       if (!student.faceEmbeddings) continue;
       
       const result = await verifyFaceWithGemini(student.faceEmbeddings, capturedImage);
       
       if (result.match) {
         matchedStudent = student;
         highestConfidence = result.confidence;
         break; // Found match
       }
       
       if (result.error) {
         apiErrorOccurred = true;
         lastErrorMessage = result.message;
       }
    }

    if (matchedStudent && activeSubject) {
      // Check for duplicate attendance
      const today = new Date().toISOString().split('T')[0];
      const hasMarked = db.hasMarkedAttendance(matchedStudent.id, activeSubject.code, today);

      if (hasMarked) {
        setStatus('ERROR');
        setMessage(`Attendance already marked for ${activeSubject.name} today.`);
        return;
      }

      // Mark Attendance
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
      setMessage('Attendance Marked Successfully!');
      
      // Auto redirect after 3s
      setTimeout(() => onSuccess(matchedStudent!), 3000);

    } else {
       setStatus('ERROR');
       if (apiErrorOccurred) {
          setMessage(`Verification System Error: ${lastErrorMessage}`);
       } else if (!activeSubject) {
          setMessage("No active classes found at this time.");
       } else {
          setMessage("Face not recognized. Please remove glasses/masks and try again.");
       }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-2xl mx-auto p-4">
       {activeSubject && (
         <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200 w-full flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Current Class</p>
              <h3 className="text-lg font-bold text-slate-800">{activeSubject.name}</h3>
              <p className="text-sm text-slate-600">{activeSubject.code} • {activeSubject.startTime} - {activeSubject.endTime}</p>
            </div>
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
               <Clock className="w-6 h-6" />
            </div>
         </div>
       )}

       {status === 'SUCCESS' && matchDetails ? (
         <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center animate-fade-in w-full">
            <div className="inline-flex bg-green-100 p-4 rounded-full mb-4">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Attendance Marked!</h2>
            <p className="text-lg text-green-700 font-medium">Welcome, {matchDetails.studentName}</p>
            <div className="mt-4 flex justify-center space-x-4 text-sm text-green-600">
               <span className="flex items-center"><Calendar className="w-4 h-4 mr-1"/> {new Date().toLocaleDateString()}</span>
               <span className="flex items-center"><Clock className="w-4 h-4 mr-1"/> {new Date().toLocaleTimeString()}</span>
            </div>
            <p className="mt-2 text-xs text-green-500">Confidence: {matchDetails.confidence}%</p>
         </div>
       ) : (
         <div className="w-full">
            <Camera 
              onCapture={handleCapture} 
              autoCapture={status === 'IDLE' || status === 'ERROR'} // Retry automatically if idle or error
              isProcessing={status === 'PROCESSING'}
              label="Scan Face"
            />
            
            <div className={`mt-6 p-4 rounded-lg text-center font-medium transition-colors duration-300
              ${status === 'ERROR' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-white text-slate-600'}
            `}>
              {status === 'ERROR' && <AlertTriangle className="inline-block w-5 h-5 mr-2 -mt-1" />}
              {message}
            </div>

            <button onClick={onBack} className="mt-8 w-full py-3 text-slate-500 hover:text-slate-800 font-medium">
               Cancel Login
            </button>
         </div>
       )}
    </div>
  );
};

export default FaceLogin;