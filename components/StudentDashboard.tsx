import React from 'react';
import { db } from '../services/dbService';
import { Student } from '../types';
import { CheckCircle, Clock, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props {
  student: Student;
}

const StudentDashboard: React.FC<Props> = ({ student }) => {
  const allAttendance = db.getAttendance();
  const myAttendance = allAttendance.filter(a => a.studentId === student.id);
  
  // Mock total classes for calculation (assuming 1 per day for demo simplicity or calculating distinct days)
  const totalClasses = Math.max(myAttendance.length + 2, 10); // Mocking total classes
  const percentage = Math.round((myAttendance.length / totalClasses) * 100);

  const data = [
    { name: 'Present', value: myAttendance.length },
    { name: 'Absent', value: totalClasses - myAttendance.length },
  ];
  
  const COLORS = ['#22c55e', '#ef4444'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg">
         <div className="flex items-center space-x-4">
            {student.faceEmbeddings && (
              <img src={student.faceEmbeddings} alt="Profile" className="w-20 h-20 rounded-full border-4 border-white/30 object-cover" />
            )}
            <div>
              <h2 className="text-3xl font-bold">Welcome, {student.name.split(' ')[0]}!</h2>
              <p className="text-blue-100 mt-1">{student.department} • {student.year} Year • Section {student.section}</p>
              <p className="text-sm opacity-80 mt-2 font-mono">{student.admissionNumber}</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
           <h3 className="text-slate-500 font-medium mb-4">Overall Attendance</h3>
           <div className="relative w-40 h-40 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-2xl font-bold text-slate-800">{percentage}%</div>
           </div>
           <p className="text-sm text-slate-400 mt-2">{myAttendance.length} / {totalClasses} classes</p>
        </div>

        {/* History */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="p-4 border-b border-slate-200 bg-slate-50">
             <h3 className="font-bold text-slate-700">Recent Activity</h3>
           </div>
           <div className="p-0">
              {myAttendance.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No attendance marked yet. Go to the home page to login.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {myAttendance.slice().reverse().map((record) => (
                    <div key={record.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                       <div className="flex items-center space-x-4">
                          <div className="bg-green-100 p-2 rounded-full text-green-600">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{record.subject}</p>
                            <div className="flex items-center text-xs text-slate-500 space-x-2 mt-1">
                               <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {record.date}</span>
                               <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {new Date(record.timestamp).toLocaleTimeString()}</span>
                            </div>
                          </div>
                       </div>
                       <div className="text-green-600 text-sm font-bold bg-green-50 px-3 py-1 rounded-full">
                         PRESENT
                       </div>
                    </div>
                  ))}
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;