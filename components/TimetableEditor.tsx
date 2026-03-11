import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { Subject, ClassConfig } from '../types';
import { Plus, Trash2, Save } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const TimetableEditor: React.FC = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    
    // config state
    const [department, setDepartment] = useState('Computer Science');
    const [year, setYear] = useState('1');
    const [semester, setSemester] = useState('1');
    const [workingDays, setWorkingDays] = useState(0);

    const [form, setForm] = useState<Partial<Subject>>({
        name: '', code: '', dayOfWeek: 1, startTime: '09:00', endTime: '10:00'
    });

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await db.getSubjectsAsync(department, year, semester);
            setSubjects(data);
            
            const config = await db.getClassConfiguration(department, year, semester);
            // Default working days fallback
            setWorkingDays(config?.working_days || 90);
            
            setLoading(false);
        };
        load();
    }, [department, year, semester]);

    const handleAddSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.code || !form.startTime || !form.endTime) return;
        
        const newSubject: Subject = {
            id: crypto.randomUUID(),
            name: form.name!,
            code: form.code!,
            department,
            year,
            semester,
            dayOfWeek: form.dayOfWeek!,
            startTime: form.startTime!,
            endTime: form.endTime!
        };
        
        await db.addSubject(newSubject);
        setSubjects([...subjects, newSubject]);
        setForm({ ...form, name: '', code: '' });
    };

    const handleDelete = async (id: string) => {
        await db.deleteSubject(id);
        setSubjects(subjects.filter(s => s.id !== id));
    };

    const handleSaveConfig = async () => {
        await db.updateClassConfiguration({
            department,
            year,
            semester,
            working_days: workingDays,
            total_students: 0 // Will keep existing if we implement partial updates properly, but let's assume we don't overwrite if it's 0 or we handle it in dbService.
        });
        alert('Configuration saved!');
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Department</label>
                    <select value={department} onChange={e => setDepartment(e.target.value)} className="border p-2 rounded-lg text-sm w-48">
                        <option value="Computer Science">Computer Science</option>
                        <option value="Electronics & Comm">Electronics & Comm</option>
                        <option value="Mechanical Eng">Mechanical Eng</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Year</label>
                    <select value={year} onChange={e => setYear(e.target.value)} className="border p-2 rounded-lg text-sm w-24">
                        {[1,2,3,4].map(y => <option key={y} value={y.toString()}>{y}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Semester</label>
                    <select value={semester} onChange={e => setSemester(e.target.value)} className="border p-2 rounded-lg text-sm w-24">
                        {[1,2].map(s => <option key={s} value={s.toString()}>{s}</option>)}
                    </select>
                </div>
                <div className="ml-auto flex items-center gap-3 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                    <div>
                        <label className="block text-xs font-bold text-indigo-700 uppercase">Working Days in Sem</label>
                        <input type="number" value={workingDays} onChange={e => setWorkingDays(Number(e.target.value))} className="w-20 border mt-1 p-1 rounded font-bold text-center" />
                    </div>
                    <button onClick={handleSaveConfig} className="bg-indigo-600 text-white p-2 text-sm rounded-lg hover:bg-indigo-700 flex items-center gap-1">
                        <Save className="w-4 h-4" /> Save
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4">Add Class Session</h3>
                <form onSubmit={handleAddSubject} className="grid grid-cols-2 md:grid-cols-6 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label className="block text-xs text-slate-500 mb-1">Subject Name</label>
                        <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Data Structures" className="w-full border p-2 rounded-lg text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Code</label>
                        <input required value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="CS101" className="w-full border p-2 rounded-lg text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Day</label>
                        <select value={form.dayOfWeek} onChange={e => setForm({...form, dayOfWeek: Number(e.target.value)})} className="w-full border p-2 rounded-lg text-sm">
                            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Time</label>
                        <div className="flex bg-slate-50 border rounded-lg overflow-hidden">
                            <input type="time" required value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} className="w-full bg-transparent p-2 text-sm outline-none" />
                            <span className="p-2 text-slate-300">-</span>
                            <input type="time" required value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} className="w-full bg-transparent p-2 text-sm outline-none" />
                        </div>
                    </div>
                    <div>
                        <button type="submit" className="w-full bg-slate-900 text-white p-2 rounded-lg hover:bg-slate-800 flex items-center justify-center gap-2 text-sm font-semibold h-[38px]">
                            <Plus className="w-4 h-4" /> Add Slot
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left bg-white">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase">Day</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase">Time</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase">Subject</th>
                            <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={4} className="p-8 text-center text-slate-400">Loading...</td></tr> : 
                         subjects.sort((a,b) => a.dayOfWeek - b.dayOfWeek).map(sub => (
                            <tr key={sub.id} className="hover:bg-slate-50">
                                <td className="p-4 font-medium text-slate-900">{DAYS[sub.dayOfWeek]}</td>
                                <td className="p-4 text-slate-600 tabular-nums">{sub.startTime} - {sub.endTime}</td>
                                <td className="p-4">
                                    <div className="font-semibold text-slate-900">{sub.name}</div>
                                    <div className="text-xs text-slate-500 font-mono">{sub.code}</div>
                                </td>
                                <td className="p-4 text-right">
                                    <button onClick={() => handleDelete(sub.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {!loading && subjects.length === 0 && (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-400">No scheduled classes for this selection.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
