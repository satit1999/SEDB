
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { Language } from '../types';
import { LOCALIZATION } from '../constants';

type LocalizationKey = keyof typeof LOCALIZATION['en'];

interface LocalizationContextType {
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: LocalizationKey) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('th');

    const t = useCallback((key: LocalizationKey): string => {
        return LOCALIZATION[language][key] || key;
    }, [language]);

    return (
        <LocalizationContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LocalizationContext.Provider>
    );
};

export const useLocalization = (): LocalizationContextType => {
    const context = useContext(LocalizationContext);
    if (context === undefined) {
        throw new Error('useLocalization must be used within a LocalizationProvider');
    }
    return context;
};
