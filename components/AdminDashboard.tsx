import React, { useState, useMemo } from 'react';
import { db } from '../services/dbService';
import { AdminSection } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Check, X, Users, ClipboardCheck, AlertOctagon, Trash2, Filter, MoreHorizontal, ArrowUpRight, Search, Calendar, RotateCcw } from 'lucide-react';

interface Props {
  view: AdminSection;
  onNavigate: (section: AdminSection) => void;
}

const AdminDashboard: React.FC<Props> = ({ view, onNavigate }) => {
  const [refresh, setRefresh] = useState(0);
  
  // Filter States
  const [searchName, setSearchName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
        db.deleteStudent(id);
      }
      setRefresh(prev => prev + 1);
    }
  };

  const filteredAttendance = useMemo(() => {
    return attendance.filter(record => {
      const matchesName = record.studentName.toLowerCase().includes(searchName.toLowerCase());
      const recordDate = new Date(record.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      let matchesDate = true;
      if (start) {
        matchesDate = matchesDate && recordDate >= start;
      }
      if (end) {
        matchesDate = matchesDate && recordDate <= end;
      }
      
      return matchesName && matchesDate;
    }).slice().reverse();
  }, [attendance, searchName, startDate, endDate]);

  const exportCSV = () => {
    const headers = ['Date', 'Name', 'Department', 'Status', 'Time'];
    const rows = filteredAttendance.map(r => [
      r.date,
      r.studentName,
      r.department,
      r.status,
      new Date(r.timestamp).toLocaleTimeString()
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const resetFilters = () => {
    setSearchName('');
    setStartDate('');
    setEndDate('');
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
      
      {view === 'overview' && (
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
              onClick={() => onNavigate('approvals')}
              clickable
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800">Department Performance</h3>
                <button 
                  onClick={() => onNavigate('students')}
                  className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100 transition"
                >
                  View Directory
                </button>
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
              <div className="flex-1 flex items-center justify-center relative cursor-pointer" onClick={() => onNavigate('reports')}>
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

      {view === 'approvals' && (
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
                         <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
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

      {view === 'students' && (
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
                 {approvedStudents.length === 0 ? (
                   <tr><td colSpan={4} className="p-8 text-center text-slate-400 text-sm">No approved students enrolled.</td></tr>
                 ) : approvedStudents.map(student => (
                   <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                     <td className="p-4">
                       <div className="flex items-center gap-3">
                         <div className="relative">
                            {student.faceEmbeddings ? (
                              <img src={student.faceEmbeddings} alt="" className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-100" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 text-xs font-bold">{student.name.charAt(0)}</div>
                            )}
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
                        onClick={() => { if(window.confirm("Are you sure you want to delete this student profile?")) handleApprove(student.id, false); }}
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

      {view === 'reports' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Search className="w-3 h-3" /> Student Name
                </label>
                <input 
                  type="text" 
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Filter by name..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> From
                </label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> To
                </label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <button 
                onClick={resetFilters}
                className="p-2.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                title="Reset Filters"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>

          <Card 
            title={`Daily Attendance Logs (${filteredAttendance.length})`} 
            icon={<Filter className="w-5 h-5 text-blue-500" />} 
            action={
              <button 
                onClick={exportCSV} 
                disabled={filteredAttendance.length === 0}
                className={`text-sm font-medium flex items-center gap-1 ${filteredAttendance.length === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-indigo-600 hover:underline'}`}
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            }
          >
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                    <th className="p-4 font-semibold">Time</th>
                    <th className="p-4 font-semibold">Student</th>
                    <th className="p-4 font-semibold">Department</th>
                    <th className="p-4 font-semibold">Confidence</th>
                    <th className="p-4 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAttendance.length === 0 ? (
                     <tr><td colSpan={5} className="p-8 text-center text-slate-400 text-sm">No matching records found.</td></tr>
                  ) : filteredAttendance.map(record => (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-sm text-slate-500 font-mono">
                        {new Date(record.timestamp).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="p-4 font-medium text-sm text-slate-900">{record.studentName}</td>
                      <td className="p-4 text-sm text-slate-600">{record.department}</td>
                      <td className="p-4 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${record.verificationConfidence}%` }} />
                          </div>
                          <span className="text-xs">{Math.round(record.verificationConfidence)}%</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
               </table>
             </div>
          </Card>
        </div>
      )}

      {view === 'settings' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card title="General Settings" icon={<Filter className="w-5 h-5 text-slate-500" />}>
               <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="font-semibold text-sm text-slate-800">System Notifications</p>
                        <p className="text-xs text-slate-500">Receive alerts for new registrations</p>
                     </div>
                     <div className="w-10 h-6 bg-indigo-600 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" /></div>
                  </div>
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="font-semibold text-sm text-slate-800">Auto-Approval</p>
                        <p className="text-xs text-slate-500">Automatically approve high-confidence matches</p>
                     </div>
                     <div className="w-10 h-6 bg-slate-200 rounded-full relative cursor-pointer"><div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" /></div>
                  </div>
               </div>
            </Card>
            <Card title="Data Management" icon={<Trash2 className="w-5 h-5 text-red-500" />}>
               <div className="p-6">
                  <p className="text-sm text-slate-600 mb-4">
                     Resetting the database will remove all students and attendance records. This action cannot be undone.
                  </p>
                  <button 
                     onClick={() => { if(window.confirm("WARNING: This will wipe all data. Continue?")) { db.clearData(); setRefresh(prev => prev + 1); } }}
                     className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors w-full flex items-center justify-center gap-2"
                  >
                     <Trash2 className="w-4 h-4" /> Clear All Database Records
                  </button>
               </div>
            </Card>
         </div>
      )}
    </div>
  );
};

// UI Components for Dashboard
const StatCard = ({ title, value, subValue, change, trend, icon, urgent, onClick, clickable }: any) => (
  <div 
    onClick={clickable ? onClick : undefined}
    className={`p-6 rounded-2xl border shadow-sm transition-all hover:shadow-md ${urgent ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'} ${clickable ? 'cursor-pointer active:scale-95' : ''}`}
  >
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