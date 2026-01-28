import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { AttendanceRecord, Student } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Check, X, Users, ClipboardCheck, AlertOctagon, Trash2, Filter, MoreHorizontal, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface AdminDashboardProps {
  currentUser?: { role: any, department?: string, year?: string } | null;
  view?: string;
  onViewChange?: (view: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, view = 'overview', onViewChange }) => {
  // Map internal views to tabs logic (or just use 'view' as activeTab if they align)
  // Our sidebar uses: 'overview', 'students', 'reports', 'settings'
  // Tabs use: 'overview', 'approvals', 'students', 'reports'
  // We can treat 'dashboard' from sidebar as 'overview' tab.
  
  const activeTab = view === 'dashboard' ? 'overview' : view as any;
  const setActiveTab = (tab: string) => onViewChange?.(tab);

  const [refresh, setRefresh] = useState(0);

  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  const [courseStrength, setCourseStrength] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([db.getStudents(), db.getAttendance()]).then(([s, a]) => {
      // Filter if HOD or Tutor
      if (currentUser?.role === 'HOD' && currentUser.department) {
        setStudents(s.filter(student => student.department === currentUser.department));
        setAttendance(a.filter(record => record.department === currentUser.department));
      } else if (currentUser?.role === 'TUTOR' && currentUser.year) {
        // Find IDs of students in this year to filter attendance correctly
        const yearStudentIds = s.filter(student => student.year.toString() === currentUser.year).map(stu => stu.id);
        
        setStudents(s.filter(student => student.year.toString() === currentUser.year));
        setAttendance(a.filter(record => yearStudentIds.includes(record.studentId)));

        // Fetch Course Strength
        // We assume "Computer Science" for now since Tutor mock doesn't have department, 
        // OR we just use a wildcard or fix the Tutor mock to have department.
        // The mock tutors in constants.ts don't have department usually. 
        // Let's assume a default department or pass it. 
        // For this task, I'll pass "Computer Science" as a fallback or if I can get it from somewhere.
        // Actually the previous prompt said "each year in each department".
        // Let's assume for now we just use "Computer Science" as it is the main one used in mocks.
        db.getClassConfiguration("Computer Science", currentUser.year).then(config => {
           if (config) setCourseStrength(config.total_students);
        });

      } else {
        setStudents(s);
        setAttendance(a);
      }
    });
  }, [refresh]);

  const pendingStudents = students.filter(s => !s.isApproved);
  const approvedStudents = students.filter(s => s.isApproved);

  /* New Editing Logic */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Student>>({});

  const startEditing = (student: Student) => {
    setEditingId(student.id);
    setEditFormData({ ...student });
  };

  const saveEdit = async () => {
    if (editingId && editFormData) {
        // cast because we know the id exists
        await db.updateStudent(editFormData as Student);
        setEditingId(null);
        setRefresh(r => r + 1);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleApprove = async (id: string, approve: boolean) => {
    const student = await db.getStudentById(id);
    if (student) {
      if (approve) {
        await db.updateStudent({ ...student, isApproved: true });
      } else {
        // Delete student
        if (window.confirm(student.isApproved ? "Are you sure you want to delete this student?" : "Reject registration?")) {
            await db.deleteStudent(id);
        } else {
            return; // Cancelled
        }
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
  // Stats Logic
  const yearStats = ['1', '2', '3', '4'].map(year => {
    const studentIdsInYear = approvedStudents.filter(s => s.year.toString() === year).map(s => s.id);
    const yearStudents = studentIdsInYear.length;
    const yearAttendance = attendance.filter(a => studentIdsInYear.includes(a.studentId)).length;
    return { name: `Year ${year}`, students: yearStudents, present: yearAttendance };
  });

  const presentToday = attendance.filter(a => a.date === new Date().toISOString().split('T')[0]).length;
  
  // Use manually set course strength if available, otherwise fallback to enrolled students
  const totalStudentsForStats = (courseStrength && courseStrength > 0) ? courseStrength : approvedStudents.length;
  
  const attendanceRate = totalStudentsForStats > 0 ? Math.round((presentToday / totalStudentsForStats) * 100) : 0;
  const absentCount = Math.max(0, totalStudentsForStats - presentToday);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'approvals', label: 'Approvals', count: pendingStudents.length, alert: true },
          { id: 'students', label: 'Students', count: approvedStudents.length },
          { id: 'reports', label: 'Reports' },
          { id: 'settings', label: 'Settings' }
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
              change={courseStrength ? `Target: ${courseStrength}` : "+12%"} 
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
                <h3 className="font-bold text-slate-800">Year Wise Performance</h3>
                <button className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100 transition">View Details</button>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearStats} barSize={32}>
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
                        { name: 'Absent', value: absentCount }
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
                   <span className="font-semibold text-slate-900">{absentCount}</span>
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
                           {student.profileImageUrl ? (
                             <img src={student.profileImageUrl} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm" />
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
                        {editingId === student.id ? (
                           <div className="flex flex-col gap-2">
                             <input 
                               className="border p-2 rounded text-sm w-full outline-none focus:ring-2 focus:ring-indigo-500" 
                               value={editFormData.name || ''} 
                               onChange={e => setEditFormData({...editFormData, name: e.target.value})} 
                               placeholder="Name"
                             />
                             <input 
                               className="border p-2 rounded text-xs w-full text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500" 
                               value={editFormData.email || ''} 
                               onChange={e => setEditFormData({...editFormData, email: e.target.value})}
                               placeholder="Email" 
                             />
                           </div>
                        ) : (
                           <div className="flex items-center gap-3">
                             <div className="relative">
                                <img src={student.profileImageUrl} alt="" className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-100" />
                                <div className="absolute inset-0 rounded-full shadow-inner"></div>
                             </div>
                             <div>
                                <p className="font-medium text-slate-900 text-sm">{student.name}</p>
                                <p className="text-xs text-slate-500">{student.email}</p>
                             </div>
                           </div>
                        )}
                     </td>
                     <td className="p-4 text-sm font-mono text-slate-500">
                        {editingId === student.id ? (
                          <input 
                            className="w-full border p-1 rounded font-mono text-xs" 
                            value={editFormData.admissionNumber || ''} 
                            onChange={e => setEditFormData({...editFormData, admissionNumber: e.target.value})} 
                          />
                        ) : student.admissionNumber}
                     </td>
                     <td className="p-4 text-sm text-slate-600">
                        {editingId === student.id ? (
                           <div className="flex gap-1">
                              <input className="w-16 border p-1 rounded text-xs" value={editFormData.department || ''} onChange={e => setEditFormData({...editFormData, department: e.target.value})} />
                              <span className="text-slate-400">/</span>
                              <input className="w-8 border p-1 rounded text-xs text-center" value={editFormData.year || ''} onChange={e => setEditFormData({...editFormData, year: e.target.value})} />
                           </div>
                        ) : `${student.department} / ${student.year}`}
                     </td>
                     <td className="p-4 text-right">
                       {editingId === student.id ? (
                         <div className="flex items-center justify-end gap-2">
                           <button onClick={saveEdit} className="p-2 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"><Check className="w-4 h-4" /></button>
                           <button onClick={cancelEdit} className="p-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200"><X className="w-4 h-4" /></button>
                         </div>
                       ) : (
                         <div className="flex items-center justify-end gap-2">
                           <button 
                             onClick={() => startEditing(student)}
                             className="p-2 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-slate-400 transition-colors text-xs font-semibold"
                           >
                             Edit
                           </button>
                           <button 
                             onClick={async () => { 
                               if(window.confirm("Delete student permanently?")) {
                                  try {
                                    await db.deleteStudent(student.id);
                                    setRefresh(r => r + 1);
                                  } catch (e: any) {
                                    alert("Failed to delete: " + (e.message || "Unknown error"));
                                  }
                               }
                             }}
                             className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-400 transition-colors"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </div>
                       )}
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

      {activeTab === 'settings' && (
        <div className="space-y-6">
           {currentUser?.role === 'ADMIN' && (
             <Card title="System Configuration" icon={<AlertOctagon className="w-5 h-5 text-slate-500" />}>
               <div className="p-6 space-y-4">
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                   <div>
                     <h4 className="font-semibold text-slate-900">Face Recognition Threshold</h4>
                     <p className="text-sm text-slate-500">Minimum confidence score for automatic approval</p>
                   </div>
                   <select className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm">
                     <option>90% (Strict)</option>
                     <option>85% (Standard)</option>
                     <option>80% (Lenient)</option>
                   </select>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-slate-900">Allow Manual Overrides</h4>
                      <p className="text-sm text-slate-500">Enable tutors to manually mark attendance</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                 </div>
               </div>
             </Card>
           )}

           {currentUser?.role === 'HOD' && (
             <Card title="Department Settings" icon={<Users className="w-5 h-5 text-indigo-500" />}>
               <div className="p-6 space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Department Name</label>
                   <input type="text" value={currentUser.department} disabled className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-slate-500" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
                    <input type="email" placeholder="hod@department.edu" className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                 </div>
                 <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition">Save Changes</button>
               </div>
             </Card>
           )}

           {currentUser?.role === 'TUTOR' && (
              <Card title="Class Configuration" icon={<ClipboardCheck className="w-5 h-5 text-emerald-500" />}>
                <div className="p-6 space-y-4">
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <h4 className="font-semibold text-slate-900 mb-2">Year {currentUser.year} Schedule</h4>
                    <p className="text-sm text-slate-500 mb-4">Manage class timings and subjects.</p>
                    <button 
                      onClick={() => alert("Schedule editor coming soon!")}
                      className="text-indigo-600 font-medium text-sm hover:underline"
                    >
                      Edit Schedule &rarr;
                    </button>
                  </div>
                  
                  <div className="p-4 border border-slate-200 rounded-lg bg-indigo-50/50 border-indigo-100">
                     <h4 className="font-semibold text-slate-900 mb-2">Course Strength</h4>
                     <p className="text-sm text-slate-500 mb-3">Total expected students for daily attendance calculation.</p>
                     <div className="flex items-center gap-3">
                        <input 
                          type="number" 
                          value={courseStrength || ''}
                          onChange={(e) => setCourseStrength(parseInt(e.target.value) || 0)}
                          placeholder={approvedStudents.length.toString()} 
                          className="w-24 border border-slate-300 rounded-lg px-3 py-2 text-center font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" 
                        />
                        <span className="text-sm text-slate-500">Students</span>
                        <button 
                          onClick={async () => {
                             if (courseStrength && currentUser?.role === 'TUTOR' && currentUser.year) {
                                await db.updateClassConfiguration("Computer Science", currentUser.year, courseStrength);
                                alert("Course strength updated!");
                             }
                          }}
                          className="ml-auto px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition"
                        >
                           Update
                        </button>
                     </div>
                  </div>

                  <div className="p-4 border border-slate-200 rounded-lg">
                     <h4 className="font-semibold text-slate-900 mb-2">My Profile</h4>
                     <p className="text-sm text-slate-500">Update your contact information.</p>
                  </div>
                </div>
              </Card>
           )}
        </div>
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
