
import {
  User,
  Booking,
  Classroom,
  Program,
  Equipment,
  Status
} from '../types';

class GoogleSheetService {
    private getScriptUrl(): string {
        const url = localStorage.getItem('https://script.google.com/macros/s/AKfycbwWPYD-ZtPi61mPOZtMPlJl-elP1tFIRVbrNtGRusqCIBE0bSRZt3BMd0NyL5Yf0OI8/exec');
        if (!url) {
            throw new Error('Google Apps Script URL is not configured. Please complete the setup.');
        }
        return url;
    }

    private async apiRequest(method: 'GET' | 'POST', action: string, paramsOrPayload: any = {}) {
        let url: string;
        try {
            url = this.getScriptUrl();
        } catch(e) {
             console.error(`Failed to execute action "${action}":`, e);
            throw e;
        }

        const options: RequestInit = {
            method: method,
            redirect: 'follow',
        };

        if (method === 'GET') {
            const queryParams = new URLSearchParams({ action, ...paramsOrPayload });
            url += `?${queryParams.toString()}`;
        } else { // POST
            options.body = JSON.stringify({ action, payload: paramsOrPayload });
            options.headers = {
                'Content-Type': 'text/plain;charset=utf-8', // Required for Apps Script
            };
        }
        
        try {
            const response = await fetch(url, options);
            const result = await response.json();

            if (!result.success) {
                console.error('API Error:', result.message, result.stack);
                // For user-facing errors, use result.message
                throw new Error(result.message || 'An unknown API error occurred.');
            }
            return result.data;
        } catch (error) {
            console.error(`Failed to execute action "${action}":`, error);
            // Re-throw the error to be caught by the calling function
            throw error;
        }
    }

    // --- Authentication ---
    async authenticate(username: string, password: string): Promise<User | null> {
        return this.apiRequest('POST', 'authenticate', { username, password });
    }

    // --- Data Fetching ---
    async getEquipment(): Promise<Equipment[]> {
        return this.apiRequest('GET', 'getEquipment');
    }

    async getClassrooms(program: Program): Promise<Classroom[]> {
        return this.apiRequest('GET', 'getClassroomsByProgram', { program });
    }
    
    async getAllClassrooms(): Promise<Classroom[]> {
        return this.apiRequest('GET', 'getAllClassrooms');
    }

    // --- Booking Logic ---
    async addBooking(data: Omit<Booking, 'id' | 'status' | 'createdAt'>): Promise<{ success: boolean }> {
        try {
            await this.apiRequest('POST', 'addBooking', data);
            return { success: true };
        } catch (error) {
            return { success: false };
        }
    }
    
    async updateBooking(bookingId: string, data: Partial<Omit<Booking, 'id' | 'createdAt' | 'status'>>): Promise<{ success: boolean }> {
        try {
            await this.apiRequest('POST', 'updateBooking', { id: bookingId, data });
            return { success: true };
        } catch (error) {
            return { success: false };
        }
    }

    async deleteBooking(bookingId: string): Promise<{ success: boolean }> {
        try {
            await this.apiRequest('POST', 'deleteBooking', { id: bookingId });
            return { success: true };
        } catch (error) {
            return { success: false };
        }
    }
    
    async cancelBooking(bookingId: string, userId: string): Promise<{ success: boolean; message?: string; }> {
         try {
            await this.apiRequest('POST', 'cancelBooking', { bookingId, userId });
            return { success: true };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }
    
    async getBookingsWithStatus(): Promise<Booking[]> {
        return this.apiRequest('GET', 'getBookingsWithStatus');
    }
    
    async getBookingsByDate(date: string): Promise<Booking[]> {
        return this.apiRequest('GET', 'getBookingsByDate', { date });
    }

    async confirmReturn(bookingId: string, adminName: string): Promise<void> {
        return this.apiRequest('POST', 'confirmReturn', { bookingId, adminName });
    }
    
    // --- Report Generation ---
    async getReportData(filters: {
        startDate?: string;
        endDate?: string;
        program?: Program | '';
        teacherId?: string;
        equipmentId?: string;
    }): Promise<Booking[]> {
       return this.apiRequest('POST', 'getReportData', filters);
    }
    
    // --- User Management ---
    async getUsers(): Promise<User[]> {
        return this.apiRequest('GET', 'getUsers');
    }

    async addUser(userData: Omit<User, 'id'>): Promise<User> {
        return this.apiRequest('POST', 'addUser', userData);
    }

    async updateUser(userId: string, userData: Partial<Omit<User, 'id'>>): Promise<User | null> {
        return this.apiRequest('POST', 'updateUser', { id: userId, data: userData });
    }

    async deleteUser(userId: string): Promise<{ success: boolean }> {
        await this.apiRequest('POST', 'deleteUser', { id: userId });
        return { success: true };
    }

    // --- Classroom Management ---
    async addClassroom(classroomData: Omit<Classroom, 'id'>): Promise<Classroom> {
        return this.apiRequest('POST', 'addClassroom', classroomData);
    }

    async updateClassroom(classroomId: string, classroomData: Partial<Omit<Classroom, 'id'>>): Promise<Classroom | null> {
        return this.apiRequest('POST', 'updateClassroom', { id: classroomId, data: classroomData });
    }

    async deleteClassroom(classroomId: string): Promise<{ success: boolean }> {
        await this.apiRequest('POST', 'deleteClassroom', { id: classroomId });
        return { success: true };
    }

    // --- Equipment Management ---
    async addEquipment(equipmentData: Omit<Equipment, 'id'>): Promise<Equipment> {
        return this.apiRequest('POST', 'addEquipment', equipmentData);
    }

    async updateEquipment(equipmentId: string, equipmentData: Partial<Omit<Equipment, 'id'>>): Promise<Equipment | null> {
        return this.apiRequest('POST', 'updateEquipment', { id: equipmentId, data: equipmentData });
    }

    async deleteEquipment(equipmentId: string): Promise<{ success: boolean }> {
        await this.apiRequest('POST', 'deleteEquipment', { id: equipmentId });
        return { success: true };
    }
}

export const sheetService = new GoogleSheetService();
