import React, { useEffect, useState } from 'react';
import { AttendanceRecord } from '../types'; // Check if imported elsewhere, but I need explicit import
import { db } from '../services/dbService';
import { Student } from '../types';
import { CheckCircle2, Clock, Calendar, BarChart2, Shield } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
  student: Student;
}

const StudentDashboard: React.FC<Props> = ({ student }) => {
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
  const [workingDays, setWorkingDays] = useState(90); // Default to 90
  const [courseStrength, setCourseStrength] = useState(0);
  
  useEffect(() => {
    db.getAttendance().then(setAllAttendance);
    db.getClassConfiguration(student.department, student.year, '1').then(conf => {
       if (conf) {
           setWorkingDays(conf.working_days || 90);
           setCourseStrength(conf.total_students || 0);
       }
    });
  }, [student]);

  const myAttendance = allAttendance.filter(a => a.studentId === student.id);
  
  // Group by Subject
  const subjectAttendance = myAttendance.reduce((acc, curr) => {
      acc[curr.subject] = (acc[curr.subject] || 0) + 1;
      return acc;
  }, {} as Record<string, number>);

  // Unique days present
  const presentDays = new Set(myAttendance.map(a => a.date)).size;
  const percentage = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0;

  const data = [
    { name: 'Present Days', value: presentDays },
    { name: 'Absent Days', value: Math.max(0, workingDays - presentDays) },
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-8 md:p-12 text-white shadow-2xl shadow-indigo-900/20">
         <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-600 rounded-full opacity-20 blur-3xl"></div>
         <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-emerald-600 rounded-full opacity-20 blur-3xl"></div>
         
         <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              {student.profileImageUrl ? (
                <img src={student.profileImageUrl} alt="Profile" className="w-24 h-24 rounded-2xl border-4 border-white/10 shadow-lg object-cover" />
              ) : (
                <div className="w-24 h-24 bg-indigo-500 rounded-2xl flex items-center justify-center text-2xl font-bold">
                  {student.name.charAt(0)}
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full border-4 border-slate-900">
                <Shield className="w-4 h-4" />
              </div>
            </div>
            
            <div className="flex-1">
               <h2 className="text-3xl font-bold tracking-tight">Hi, {student.name.split(' ')[0]}</h2>
               <div className="flex flex-wrap gap-3 mt-3 text-sm font-medium text-slate-300">
                  <span className="bg-white/10 px-3 py-1 rounded-full border border-white/10">{student.admissionNumber}</span>
                  <span className="bg-white/10 px-3 py-1 rounded-full border border-white/10">{student.department}</span>
                  <span className="bg-white/10 px-3 py-1 rounded-full border border-white/10">Year {student.year} - {student.section}</span>
               </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center min-w-[120px]">
               <div className="text-3xl font-bold text-emerald-400">{percentage}%</div>
               <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">Attendance</div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Attendance Chart Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
           <div className="flex items-center gap-2 mb-6">
             <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><BarChart2 className="w-5 h-5" /></div>
             <h3 className="font-bold text-slate-800">Attendance Overview</h3>
           </div>
           
           <div className="h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#4f46e5" />
                    <Cell fill="#f1f5f9" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-sm text-slate-400 font-medium">Present</span>
                 <span className="text-3xl font-bold text-slate-900">{myAttendance.length}</span>
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-4 mt-4 text-center">
              <div className="p-3 bg-slate-50 rounded-xl">
                 <p className="text-xs text-slate-500 font-medium uppercase">Days Present</p>
                 <p className="text-lg font-bold text-indigo-600">{presentDays}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                 <p className="text-xs text-slate-500 font-medium uppercase">Total Days</p>
                 <p className="text-lg font-bold text-slate-400">{workingDays}</p>
              </div>
           </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
           <div className="flex items-center gap-2 mb-6">
             <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Clock className="w-5 h-5" /></div>
             <h3 className="font-bold text-slate-800">Recent Activity</h3>
           </div>

           <div className="space-y-4 max-h-[300px] overflow-auto">
              {myAttendance.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                   <p>No attendance records found yet.</p>
                </div>
              ) : (
                myAttendance.slice().reverse().map((record) => (
                   <div key={record.id} className="group flex items-start gap-4 p-4 mb-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                      <div className="flex-shrink-0 mt-1">
                         <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 ring-4 ring-white">
                           <CheckCircle2 className="w-5 h-5" />
                         </div>
                      </div>
                      <div className="flex-1">
                         <div className="flex justify-between items-start">
                            <h4 className="font-bold text-slate-900">{record.subject}</h4>
                            <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full border border-emerald-100">PRESENT</span>
                         </div>
                         <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {record.date}</span>
                         </div>
                      </div>
                   </div>
                ))
              )}
           </div>
        </div>

        {/* Semester Subject Wise Attendance */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
           <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-2">
                 <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><BarChart2 className="w-5 h-5" /></div>
                 <h3 className="font-bold text-slate-800">Subject-wise Breakdown</h3>
             </div>
             <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full">Semester 1</span>
           </div>

           <div className="space-y-4">
              {Object.keys(subjectAttendance).length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                   <p>No subject data yet.</p>
                </div>
              ) : (
                Object.entries(subjectAttendance).map(([subject, count]) => (
                   <div key={subject} className="mb-4">
                      <div className="flex justify-between items-end mb-1">
                         <h4 className="font-semibold text-slate-800 text-sm">{subject}</h4>
                         <span className="text-xs font-bold text-indigo-600">{count} Classes</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                         <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (Number(count) / (workingDays || 1)) * 100)}%` }} />
                      </div>
                   </div>
                ))
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;