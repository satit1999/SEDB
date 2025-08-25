
export type Role = 'teacher' | 'admin';

export type Language = 'th' | 'en';

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string; // Should not be sent to client
  role: Role;
}

export type BookingType = 'Booking' | 'Borrow';
export type Program = 'Thai Programme' | 'English Programme' | 'Kindergarten';
export type Status = 'Available' | 'Booked' | 'In Use' | 'Pending Return' | 'Not Used' | 'Returned';

export interface Booking {
  id: string;
  userId: string;
  type: BookingType;
  teacherName: string;
  program: Program;
  classroom: string;
  period: number;
  date: string; // YYYY-MM-DD
  equipment: string[];
  learningPlan: string;
  status: Status;
  createdAt: string; // ISO string
  returnedAt?: string; // ISO string
  returnedBy?: string; // Admin's name
}

export interface ReturnLog {
  id: string;
  bookingId: string;
  returnedByAdmin: string;
  returnTimestamp: string; // ISO string
  notes?: string;
}

export interface Classroom {
  id: string;
  program: Program;
  name_th: string;
  name_en: string;
}

export interface Equipment {
  id: string;
  name_th: string;
  name_en: string;
}

export type Page = 'status' | 'booking' | 'return' | 'reports' | 'users' | 'data';
