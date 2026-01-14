import React, { useState } from 'react';
import { db } from '../services/dbService';
import { AttendanceRecord, Student } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Check, X, Users, ClipboardCheck, AlertOctagon, Trash2, Filter, MoreHorizontal, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'students' | 'reports'>('overview');
  const [refresh, setRefresh] = useState(0);

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
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "attendance_report.csv");
    document.body.appendChild(link);
    link.click();
  };

  // Stats Logic
  const deptStats = db.getDepartments().map(dept => {
    const deptStudents = approvedStudents.filter(s => s.department === dept.name).length;
    const deptAttendance = attendance.filter(a => a.department === dept.name).length;
    return { name: dept.id.toUpperCase(), students: deptStudents, present: deptAttendance };
  });

  const presentToday = attendance.filter(a => a.date === new Date().toISOString().split('T')[0]).length;
  const attendanceRate = approvedStudents.length > 0 ? Math.round((presentToday / approvedStudents.length) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'approvals', label: 'Approvals', count: pendingStudents.length, alert: true },
          { id: 'students', label: 'Students', count: approvedStudents.length },
          { id: 'reports', label: 'Reports' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === tab.id 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                tab.alert ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              title="Total Enrolled" 
              value={approvedStudents.length} 
              change="+12%" 
              trend="up"
              icon={<Users className="w-5 h-5 text-indigo-600" />} 
            />
            <StatCard 
              title="Present Today" 
              value={presentToday} 
              subValue={`${attendanceRate}% Rate`}
              change="+5%" 
              trend="up"
              icon={<ClipboardCheck className="w-5 h-5 text-emerald-600" />} 
            />
            <StatCard 
              title="Pending Approval" 
              value={pendingStudents.length} 
              change="Action Required" 
              trend="neutral"
              icon={<AlertOctagon className="w-5 h-5 text-amber-600" />} 
              urgent={pendingStudents.length > 0}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800">Department Performance</h3>
                <button className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100 transition">View Details</button>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptStats} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip 
                      cursor={{fill: '#f1f5f9'}}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="students" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Total" />
                    <Bar dataKey="present" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Present" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
              <h3 className="font-bold text-slate-800 mb-6">Daily Attendance</h3>
              <div className="flex-1 flex items-center justify-center relative">
                 <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Present', value: presentToday },
                        { name: 'Absent', value: Math.max(0, approvedStudents.length - presentToday) }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f1f5f9" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold text-slate-800">{attendanceRate}%</span>
                  <span className="text-xs text-slate-500 uppercase font-semibold">Turnout</span>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-center text-sm">
                   <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-emerald-500" />
                     <span className="text-slate-600">Present</span>
                   </div>
                   <span className="font-semibold text-slate-900">{presentToday}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                   <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-slate-200" />
                     <span className="text-slate-600">Absent</span>
                   </div>
                   <span className="font-semibold text-slate-900">{Math.max(0, approvedStudents.length - presentToday)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'approvals' && (
        <Card title="Pending Registration Requests" icon={<AlertOctagon className="w-5 h-5 text-amber-500" />}>
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                   <th className="p-4 font-semibold">Candidate</th>
                   <th className="p-4 font-semibold">Department</th>
                   <th className="p-4 font-semibold">Details</th>
                   <th className="p-4 font-semibold text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {pendingStudents.length === 0 ? (
                   <tr><td colSpan={4} className="p-8 text-center text-slate-400 text-sm">No pending approvals found.</td></tr>
                 ) : (
                   pendingStudents.map(student => (
                     <tr key={student.id} className="group hover:bg-slate-50 transition-colors">
                       <td className="p-4">
                         <div className="flex items-center gap-3">
                           {student.faceEmbeddings ? (
                             <img src={student.faceEmbeddings} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm" />
                           ) : (
                             <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><Users className="w-5 h-5" /></div>
                           )}
                           <div>
                             <p className="font-semibold text-slate-900 text-sm">{student.name}</p>
                             <p className="text-xs text-slate-500 font-mono">{student.email}</p>
                           </div>
                         </div>
                       </td>
                       <td className="p-4 text-sm text-slate-600">{student.department}</td>
                       <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                            {student.year} Year • Sec {student.section}
                          </span>
                       </td>
                       <td className="p-4 text-right">
                         <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => handleApprove(student.id, true)} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 shadow-sm transition-all">
                             <Check className="w-3 h-3" /> Approve
                           </button>
                           <button onClick={() => handleApprove(student.id, false)} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 hover:text-red-600 transition-all">
                             <X className="w-3 h-3" /> Reject
                           </button>
                         </div>
                       </td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
           </div>
        </Card>
      )}

      {activeTab === 'students' && (
        <Card title="Student Directory" icon={<Users className="w-5 h-5 text-indigo-500" />}>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                   <th className="p-4 font-semibold">Student</th>
                   <th className="p-4 font-semibold">Admission No</th>
                   <th className="p-4 font-semibold">Cohort</th>
                   <th className="p-4 font-semibold text-right">Menu</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {approvedStudents.map(student => (
                   <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                     <td className="p-4">
                       <div className="flex items-center gap-3">
                         <div className="relative">
                            <img src={student.faceEmbeddings} alt="" className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-100" />
                            <div className="absolute inset-0 rounded-full shadow-inner"></div>
                         </div>
                         <div>
                            <p className="font-medium text-slate-900 text-sm">{student.name}</p>
                            <p className="text-xs text-slate-500">{student.email}</p>
                         </div>
                       </div>
                     </td>
                     <td className="p-4 text-sm font-mono text-slate-500">{student.admissionNumber}</td>
                     <td className="p-4 text-sm text-slate-600">{student.department} / {student.year}</td>
                     <td className="p-4 text-right">
                       <button 
                        onClick={() => { if(window.confirm("Delete student?")) handleApprove(student.id, false); }}
                        className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-400 transition-colors"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </Card>
      )}

      {activeTab === 'reports' && (
        <Card title="Attendance Logs" icon={<Filter className="w-5 h-5 text-blue-500" />} action={<button onClick={exportCSV} className="text-sm font-medium text-indigo-600 hover:underline flex items-center gap-1"><Download className="w-4 h-4" /> CSV</button>}>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                  <th className="p-4 font-semibold">Time</th>
                  <th className="p-4 font-semibold">Student</th>
                  <th className="p-4 font-semibold">Subject</th>
                  <th className="p-4 font-semibold">Confidence</th>
                  <th className="p-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {attendance.slice().reverse().map(record => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="p-4 text-sm text-slate-500 font-mono">
                      {new Date(record.timestamp).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-4 font-medium text-sm text-slate-900">{record.studentName}</td>
                    <td className="p-4 text-sm text-slate-600">
                      <span className="inline-block bg-slate-100 px-2 py-0.5 rounded text-xs font-semibold">{record.subject}</span>
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${record.verificationConfidence}%` }} />
                        </div>
                        <span className="text-xs">{Math.round(record.verificationConfidence)}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
             </table>
           </div>
        </Card>
      )}
    </div>
  );
};

// UI Components for Dashboard
const StatCard = ({ title, value, subValue, change, trend, icon, urgent }: any) => (
  <div className={`p-6 rounded-2xl border shadow-sm transition-all hover:shadow-md ${urgent ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
    <div className="flex items-start justify-between mb-4">
      <div className={`p-2 rounded-lg ${urgent ? 'bg-amber-100' : 'bg-slate-50'}`}>
        {icon}
      </div>
      {change && (
        <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${
          urgent ? 'bg-amber-200 text-amber-800' : 
          trend === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
        }`}>
          {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <MoreHorizontal className="w-3 h-3 mr-1" />}
          {change}
        </div>
      )}
    </div>
    <div>
      <h3 className={`text-sm font-medium ${urgent ? 'text-amber-800' : 'text-slate-500'}`}>{title}</h3>
      <div className="flex items-baseline gap-2 mt-1">
        <p className={`text-3xl font-bold ${urgent ? 'text-amber-900' : 'text-slate-900'}`}>{value}</p>
        {subValue && <span className="text-sm text-slate-400 font-medium">{subValue}</span>}
      </div>
    </div>
  </div>
);

const Card = ({ title, icon, action, children }: any) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-bold text-slate-800">{title}</h3>
      </div>
      {action}
    </div>
    <div>{children}</div>
  </div>
);

export default AdminDashboard;