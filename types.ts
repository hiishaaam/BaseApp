export enum UserRole {
  ADMIN = 'ADMIN',
  HOD = 'HOD',
  TUTOR = 'TUTOR',
  STUDENT = 'STUDENT',
  GUEST = 'GUEST',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
}

export interface Student {
  id: string;
  admissionNumber: string;
  name: string;
  email: string;
  department: string;
  year: string;
  section: string;
  profileImageUrl?: string; // URL to the image in Supabase Storage
  isApproved: boolean;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  department: string;
  subject: string;
  date: string; // ISO Date string YYYY-MM-DD
  timestamp: string; // ISO String
  status: AttendanceStatus;
  verificationConfidence: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  department: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

export interface Department {
  id: string;
  name: string;
  hodEmail?: string;
  hodPassword?: string;
}

export interface UserSession {
  role: UserRole;
  studentId?: string; // If student
  email?: string;
  department?: string; // If HOD
  year?: string; // If TUTOR
}

export type ViewState = 
  | 'LANDING' 
  | 'STUDENT_LOGIN' 
  | 'STUDENT_SIGNUP' 
  | 'ADMIN_LOGIN' 
  | 'ADMIN_DASHBOARD' 
  | 'STUDENT_DASHBOARD';
