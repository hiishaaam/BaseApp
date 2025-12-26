import { Student, AttendanceRecord, Subject, Department } from '../types';
import { MOCK_DEPARTMENTS, MOCK_SUBJECTS } from '../constants';

const STORAGE_KEYS = {
  STUDENTS: 'eduface_students',
  ATTENDANCE: 'eduface_attendance',
  SUBJECTS: 'eduface_subjects',
  DEPARTMENTS: 'eduface_departments',
};

class DBService {
  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem(STORAGE_KEYS.DEPARTMENTS)) {
      localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(MOCK_DEPARTMENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SUBJECTS)) {
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(MOCK_SUBJECTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
    }
  }

  // Students
  getStudents(): Student[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
  }

  getStudentById(id: string): Student | undefined {
    return this.getStudents().find(s => s.id === id);
  }

  getStudentByAdmission(admission: string): Student | undefined {
    return this.getStudents().find(s => s.admissionNumber === admission);
  }

  addStudent(student: Student): void {
    const students = this.getStudents();
    students.push(student);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }

  updateStudent(updatedStudent: Student): void {
    const students = this.getStudents().map(s => s.id === updatedStudent.id ? updatedStudent : s);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }

  // Attendance
  getAttendance(): AttendanceRecord[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || '[]');
  }

  addAttendance(record: AttendanceRecord): void {
    const records = this.getAttendance();
    records.push(record);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
  }

  hasMarkedAttendance(studentId: string, subjectCode: string, date: string): boolean {
    const records = this.getAttendance();
    return records.some(r => r.studentId === studentId && r.subject === subjectCode && r.date === date);
  }

  // Helpers
  getSubjects(): Subject[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBJECTS) || '[]');
  }

  getDepartments(): Department[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.DEPARTMENTS) || '[]');
  }
  
  clearData() {
      localStorage.clear();
      this.init();
  }
}

export const db = new DBService();