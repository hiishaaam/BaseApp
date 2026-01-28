import { Department, Subject } from './types';

export const APP_NAME = "EduFace Attendance";
export const COLLEGE_NAME = "Tech Institute of Science";

export const MOCK_DEPARTMENTS: Department[] = [
  { id: 'cse', name: 'Computer Science', hodEmail: 'hod.cse@college.edu', hodPassword: 'cse' },
  { id: 'ece', name: 'Electronics & Comm', hodEmail: 'hod.ece@college.edu', hodPassword: 'ece' },
  { id: 'mech', name: 'Mechanical Eng', hodEmail: 'hod.mech@college.edu', hodPassword: 'mech' },
  { id: 'civil', name: 'Civil Eng', hodEmail: 'hod.civil@college.edu', hodPassword: 'civil' },
];

export const MOCK_TUTORS = [
  { year: '1', email: 'tutor.year1@college.edu', password: 'year1' },
  { year: '2', email: 'tutor.year2@college.edu', password: 'year2' },
  { year: '3', email: 'tutor.year3@college.edu', password: 'year3' },
  { year: '4', email: 'tutor.year4@college.edu', password: 'year4' },
];

export const MOCK_SUBJECTS: Subject[] = [
  { id: 'cs101', name: 'Data Structures', code: 'CS101', department: 'Computer Science', startTime: '09:00', endTime: '10:00' },
  { id: 'cs102', name: 'Algorithms', code: 'CS102', department: 'Computer Science', startTime: '10:00', endTime: '11:00' },
  { id: 'ec201', name: 'Digital Circuits', code: 'EC201', department: 'Electronics & Comm', startTime: '09:00', endTime: '10:00' },
];

export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@college.edu';
export const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin';

export const GEMINI_MODEL = 'gemini-3-flash-preview';