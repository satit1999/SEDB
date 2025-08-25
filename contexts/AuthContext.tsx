import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { sheetService } from '../services/googleSheetService';

interface AuthContextType {
    user: User | null;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    const login = useCallback(async (username: string, password: string): Promise<boolean> => {
        const authenticatedUser = await sheetService.authenticate(username, password);
        if (authenticatedUser) {
            setUser(authenticatedUser);
            return true;
        }
        return false;
    }, []);

    const logout = useCallback(() => {
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};