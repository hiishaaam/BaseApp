import { Department, Subject } from './types';

export const APP_NAME = "EduFace Attendance";
export const COLLEGE_NAME = "Tech Institute of Science";

export const MOCK_DEPARTMENTS: Department[] = [
  { id: 'cse', name: 'Computer Science' },
  { id: 'ece', name: 'Electronics & Comm' },
  { id: 'mech', name: 'Mechanical Eng' },
  { id: 'civil', name: 'Civil Eng' },
];

export const MOCK_SUBJECTS: Subject[] = [
  { id: 'cs101', name: 'Data Structures', code: 'CS101', department: 'Computer Science', startTime: '09:00', endTime: '10:00' },
  { id: 'cs102', name: 'Algorithms', code: 'CS102', department: 'Computer Science', startTime: '10:00', endTime: '11:00' },
  { id: 'ec201', name: 'Digital Circuits', code: 'EC201', department: 'Electronics & Comm', startTime: '09:00', endTime: '10:00' },
];

export const ADMIN_EMAIL = 'admin@college.edu';
export const ADMIN_PASSWORD = 'admin'; // For demo purposes

export const GEMINI_MODEL = 'gemini-3-flash-preview';