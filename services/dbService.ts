
import { supabase } from './supabase';
import { Student, AttendanceRecord, Subject, Department, ClassConfig } from '../types';
import { MOCK_DEPARTMENTS, MOCK_SUBJECTS } from '../constants';

class DBService {
  
  // Students
  async getStudents(): Promise<Student[]> {
    const { data, error } = await supabase
      .from('students')
      .select('*');
    
    if (error) {
      console.error('Error fetching students:', error);
      return [];
    }
    return data || [];
  }

  async getStudentById(id: string): Promise<Student | undefined> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return undefined;
    return data;
  }

  async getStudentByAdmission(admission: string): Promise<Student | undefined> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('admissionNumber', admission)
      .single();
      
    if (error) return undefined;
    return data;
  }

  async addStudent(student: any): Promise<void> {
    // Expects student object to have faceEmbeddings (base64) from the legacy form
    // We will upload it and save as profileImageUrl
    
    let profileImageUrl = '';
    
    if (student.faceEmbeddings && student.faceEmbeddings.startsWith('data:image')) {
       // It's a base64 string, upload it
       const fileName = `${student.admissionNumber}_${Date.now()}.jpg`;
       const blob = this.base64ToBlob(student.faceEmbeddings);
       
       const { error: uploadError } = await supabase.storage
        .from('face-images')
        .upload(fileName, blob, { contentType: 'image/jpeg' });
        
       if (uploadError) {
         console.error('Error uploading image:', uploadError);
         throw uploadError;
       }
       
       const { data } = supabase.storage.from('face-images').getPublicUrl(fileName);
       profileImageUrl = data.publicUrl;
    }

    // Prepare record for DB
    // Remove faceEmbeddings (not in DB schema) and add profileImageUrl
    const { faceEmbeddings, ...studentData } = student;
    const record = {
      ...studentData,
      profileImageUrl: profileImageUrl
    };

    const { error } = await supabase.from('students').insert(record);
    if (error) {
      console.error('Error adding student:', error);
      throw error;
    }
  }

  async updateStudent(updatedStudent: Student): Promise<void> {
    const { error } = await supabase
      .from('students')
      .update(updatedStudent)
      .eq('id', updatedStudent.id);
      
    if (error) console.error('Error updating student:', error);
  }

  async deleteStudent(id: string): Promise<void> {
    // First delete related attendance records to satisfy foreign key constraints
    const { error: attendanceError } = await supabase
        .from('attendance')
        .delete()
        .eq('studentId', id);

    if (attendanceError) {
        console.error('Error deleting student attendance:', attendanceError);
        // We might want to throw here, or continue if proper cascading is expected but failed
        throw attendanceError;
    }

    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);
    
    if (error) {
        console.error('Error deleting student:', error);
        throw error;
    }
  }

  // Attendance
  async getAttendance(): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase
      .from('attendance')
      .select('*');
      
    if (error) {
      console.error('Error fetching attendance:', error);
      return [];
    }
    return data || [];
  }

  async addAttendance(record: AttendanceRecord): Promise<void> {
    const { error } = await supabase
      .from('attendance')
      .insert(record);
      
    if (error) console.error('Error adding attendance:', error);
  }

  async hasMarkedAttendance(studentId: string, subjectCode: string, date: string): Promise<boolean> {
    // Check if a record exists
    const { data, error } = await supabase
      .from('attendance')
      .select('id')
      .eq('studentId', studentId)
      .eq('subject', subjectCode)
      .eq('date', date)
      .limit(1);
      
    if (error) return false;
    return data && data.length > 0;
  }

  // Subjects (Timetable)
  async getSubjectsAsync(department?: string, year?: string, semester?: string): Promise<Subject[]> {
    let query = supabase.from('subjects').select('*');
    if (department) query = query.eq('department', department);
    if (year) query = query.eq('year', year);
    if (semester) query = query.eq('semester', semester);
    
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching subjects:', error);
      return [];
    }
    
    // Fallback for empty database/timetable so users can always mark attendance
    if (!data || data.length === 0) {
      const currentDay = new Date().getDay();
      return [{
        id: 'gen-attendance',
        name: 'General Attendance',
        code: 'GEN101',
        department: department || 'Any',
        year: year || '1',
        semester: semester || '1',
        dayOfWeek: currentDay,
        startTime: '00:00',
        endTime: '23:59'
      }];
    }
    
    return data || [];
  }

  async addSubject(subject: Subject): Promise<void> {
    const { error } = await supabase.from('subjects').insert(subject);
    if (error) throw error;
  }

  async updateSubject(subject: Subject): Promise<void> {
    const { error } = await supabase.from('subjects').update(subject).eq('id', subject.id);
    if (error) throw error;
  }

  async deleteSubject(id: string): Promise<void> {
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) throw error;
  }

  // Helpers
  // For static data, we can keep them sync if they are just constants, 
  // but for consistency with DB service patterns, let's allow them to be "used" as is,
  // or return them directly. Since the codebase expects these to be available immediately 
  // in some places, we might need to handle that.
  // But given standard web app patterns, these should probably be fetched too if dynamic.
  // For now, return the MOCK constants.
  
  getSubjects(): Subject[] {
    return MOCK_SUBJECTS;
  }

  getDepartments(): Department[] {
    return MOCK_DEPARTMENTS;
  }
  
  async getClassConfiguration(department: string, year: string, semester?: string): Promise<ClassConfig | null> {
    let query = supabase.from('class_configurations').select('*').eq('department', department).eq('year', year);
    if (semester) query = query.eq('semester', semester);

    const { data, error } = await query.single();
    if (error) {
         if (error.code !== 'PGRST116') console.error("getClassConfig:", error);
         return null;
    }
    return data;
  }

  async updateClassConfiguration(config: ClassConfig): Promise<void> {
    const existing = await this.getClassConfiguration(config.department, config.year, config.semester);
    
    if (existing) {
       const { error } = await supabase
        .from('class_configurations')
        .update(config)
        .eq('department', config.department)
        .eq('year', config.year)
        .eq('semester', config.semester || existing.semester);
       if (error) throw error;
    } else {
       const { error } = await supabase
        .from('class_configurations')
        .insert(config);
       if (error) throw error;
    }
  }

  async clearData() {
      // Admin only function - dangerous!
      // This might not be supported via client API depending on RLS
      console.warn("clearData not implemented for Supabase backend");
  }

  private base64ToBlob(base64: string): Blob {
    const parts = base64.split(';base64,');
    const contentType = parts[0].split(':')[1] || 'image/jpeg';
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  }
}

export const db = new DBService();