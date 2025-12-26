import React, { useState } from 'react';
import { db } from '../services/dbService';
import { AttendanceRecord, Student, AttendanceStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Check, X, Users, ClipboardCheck, AlertOctagon, Trash2, UserCheck } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'students' | 'reports'>('overview');
  const [refresh, setRefresh] = useState(0); // Force re-render

  const students = db.getStudents();
  const attendance = db.getAttendance();
  const pendingStudents = students.filter(s => !s.isApproved);
  const approvedStudents = students.filter(s => s.isApproved);

  const handleApprove = (id: string, approve: boolean) => {
    const student = db.getStudentById(id);
    if (student) {
      if (approve) {
        db.updateStudent({ ...student, isApproved: true });
      } else {
        // In a real app, delete or mark rejected
        const filtered = students.filter(s => s.id !== id);
        localStorage.setItem('eduface_students', JSON.stringify(filtered));
      }
      setRefresh(prev => prev + 1);
    }
  };

  const exportCSV = () => {
    const headers = ['Date', 'Name', 'Department', 'Subject', 'Status', 'Time'];
    const rows = attendance.map(r => [
      r.date,
      r.studentName,
      r.department,
      r.subject,
      r.status,
      new Date(r.timestamp).toLocaleTimeString()
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "attendance_report.csv");
    document.body.appendChild(link);
    link.click();
  };

  // Stats for Charts
  const deptStats = db.getDepartments().map(dept => {
    const deptStudents = approvedStudents.filter(s => s.department === dept.name).length;
    const deptAttendance = attendance.filter(a => a.department === dept.name).length;
    return { name: dept.id.toUpperCase(), students: deptStudents, present: deptAttendance };
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex flex-wrap">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'approvals', label: 'Approvals' },
          { id: 'students', label: 'Approved Students' },
          { id: 'reports', label: 'Attendance Reports' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all flex items-center ${
              activeTab === tab.id ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
            {tab.id === 'approvals' && pendingStudents.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingStudents.length}</span>
            )}
             {tab.id === 'students' && (
              <span className="ml-2 bg-slate-200 text-slate-600 text-xs px-1.5 py-0.5 rounded-full">{approvedStudents.length}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-slate-500 text-sm font-medium">Total Students</p>
                   <h3 className="text-3xl font-bold text-slate-800">{approvedStudents.length}</h3>
                 </div>
                 <div className="bg-blue-100 p-3 rounded-full text-blue-600"><Users /></div>
               </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-slate-500 text-sm font-medium">Present Today</p>
                   <h3 className="text-3xl font-bold text-slate-800">
                     {attendance.filter(a => a.date === new Date().toISOString().split('T')[0]).length}
                   </h3>
                 </div>
                 <div className="bg-green-100 p-3 rounded-full text-green-600"><ClipboardCheck /></div>
               </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-slate-500 text-sm font-medium">Pending Approvals</p>
                   <h3 className="text-3xl font-bold text-slate-800">{pendingStudents.length}</h3>
                 </div>
                 <div className="bg-amber-100 p-3 rounded-full text-amber-600"><AlertOctagon /></div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
              <h4 className="text-lg font-bold text-slate-800 mb-4">Department Attendance</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="students" fill="#94a3b8" name="Total Students" />
                  <Bar dataKey="present" fill="#3b82f6" name="Present" />
                </BarChart>
              </ResponsiveContainer>
            </div>
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
              <h4 className="text-lg font-bold text-slate-800 mb-4">Attendance Distribution</h4>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Present', value: attendance.length },
                      { name: 'Absent', value: (approvedStudents.length * 1) - attendance.length } // Simplified math
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {deptStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#22c55e' : '#ef4444'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="p-4 border-b border-slate-200 bg-amber-50">
              <h3 className="font-bold text-amber-800 flex items-center">
                <AlertOctagon className="w-5 h-5 mr-2" /> Pending Registration Requests
              </h3>
           </div>
           <table className="w-full text-left">
             <thead className="bg-slate-50 border-b border-slate-200">
               <tr>
                 <th className="p-4 font-semibold text-slate-600 text-sm">Student</th>
                 <th className="p-4 font-semibold text-slate-600 text-sm">Dept</th>
                 <th className="p-4 font-semibold text-slate-600 text-sm">Year</th>
                 <th className="p-4 font-semibold text-slate-600 text-sm">Action</th>
               </tr>
             </thead>
             <tbody>
               {pendingStudents.length === 0 ? (
                 <tr>
                   <td colSpan={4} className="p-8 text-center text-slate-500">No pending approvals.</td>
                 </tr>
               ) : (
                 pendingStudents.map(student => (
                   <tr key={student.id} className="border-b border-slate-100">
                     <td className="p-4">
                       <div className="flex items-center space-x-3">
                         {student.faceEmbeddings && (
                           <img src={student.faceEmbeddings} alt="Face" className="w-10 h-10 rounded-full object-cover border" />
                         )}
                         <div>
                           <p className="font-medium text-slate-800">{student.name}</p>
                           <p className="text-xs text-slate-500">{student.admissionNumber}</p>
                         </div>
                       </div>
                     </td>
                     <td className="p-4 text-slate-600 text-sm">{student.department}</td>
                     <td className="p-4 text-slate-600 text-sm">{student.year}</td>
                     <td className="p-4">
                       <div className="flex space-x-2">
                         <button onClick={() => handleApprove(student.id, true)} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200" title="Approve"><Check className="w-4 h-4" /></button>
                         <button onClick={() => handleApprove(student.id, false)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200" title="Reject"><X className="w-4 h-4" /></button>
                       </div>
                     </td>
                   </tr>
                 ))
               )}
             </tbody>
           </table>
        </div>
      )}

      {activeTab === 'students' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="p-4 border-b border-slate-200 bg-blue-50">
              <h3 className="font-bold text-blue-800 flex items-center">
                <UserCheck className="w-5 h-5 mr-2" /> Registered Students
              </h3>
           </div>
           <table className="w-full text-left">
             <thead className="bg-slate-50 border-b border-slate-200">
               <tr>
                 <th className="p-4 font-semibold text-slate-600 text-sm">Student</th>
                 <th className="p-4 font-semibold text-slate-600 text-sm">Email</th>
                 <th className="p-4 font-semibold text-slate-600 text-sm">Dept / Year</th>
                 <th className="p-4 font-semibold text-slate-600 text-sm">Section</th>
                 <th className="p-4 font-semibold text-slate-600 text-sm">Action</th>
               </tr>
             </thead>
             <tbody>
               {approvedStudents.length === 0 ? (
                 <tr>
                   <td colSpan={5} className="p-8 text-center text-slate-500">No students found.</td>
                 </tr>
               ) : (
                 approvedStudents.map(student => (
                   <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50">
                     <td className="p-4">
                       <div className="flex items-center space-x-3">
                         {student.faceEmbeddings && (
                           <div className="relative group">
                              <img src={student.faceEmbeddings} alt="Face" className="w-10 h-10 rounded-full object-cover border" />
                              <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 p-1 bg-white border shadow-lg rounded-lg z-10">
                                <img src={student.faceEmbeddings} alt="Face Large" className="w-24 h-24 object-cover rounded-md" />
                              </div>
                           </div>
                         )}
                         <div>
                           <p className="font-medium text-slate-800">{student.name}</p>
                           <p className="text-xs text-slate-500">{student.admissionNumber}</p>
                         </div>
                       </div>
                     </td>
                     <td className="p-4 text-slate-600 text-sm">{student.email}</td>
                     <td className="p-4 text-slate-600 text-sm">{student.department} - {student.year} Yr</td>
                     <td className="p-4 text-slate-600 text-sm">{student.section}</td>
                     <td className="p-4">
                       <button 
                        onClick={() => {
                          if(window.confirm(`Are you sure you want to remove ${student.name}? This cannot be undone.`)) {
                            handleApprove(student.id, false); // False triggers delete logic
                          }
                        }} 
                        className="p-2 bg-slate-100 text-red-500 rounded-lg hover:bg-red-50 border border-slate-200 hover:border-red-200 transition"
                        title="Remove Student"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                     </td>
                   </tr>
                 ))
               )}
             </tbody>
           </table>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
           <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Attendance Log</h3>
              <button onClick={exportCSV} className="flex items-center space-x-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700">
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Time</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Student</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Subject</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Status</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {attendance.slice().reverse().map(record => (
                  <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 text-slate-600 text-sm">
                      {new Date(record.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 font-medium text-slate-800">{record.studentName}</td>
                    <td className="p-4 text-slate-600 text-sm"><span className="bg-slate-100 px-2 py-1 rounded">{record.subject}</span></td>
                    <td className="p-4">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold uppercase">
                        {record.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 text-xs">
                      {Math.round(record.verificationConfidence)}%
                    </td>
                  </tr>
                ))}
                 {attendance.length === 0 && (
                 <tr>
                   <td colSpan={5} className="p-8 text-center text-slate-500">No attendance records found.</td>
                 </tr>
               )}
              </tbody>
             </table>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;