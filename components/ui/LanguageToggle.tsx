
import React from 'react';
import { useLocalization } from '../../contexts/LocalizationContext';

interface LanguageToggleProps {
    variant?: 'default' | 'minimal';
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ variant = 'default' }) => {
    const { language, setLanguage } = useLocalization();

    if (variant === 'minimal') {
        return (
            <div className="flex justify-center items-center space-x-2 text-sm">
                <button
                    onClick={() => setLanguage('th')}
                    className={`font-medium transition-colors duration-200 ${language === 'th' ? 'text-accent font-bold' : 'text-text-secondary hover:text-text-primary'}`}
                >
                    ไทย
                </button>
                <span className="text-slate-400">|</span>
                <button
                    onClick={() => setLanguage('en')}
                    className={`font-medium transition-colors duration-200 ${language === 'en' ? 'text-accent font-bold' : 'text-text-secondary hover:text-text-primary'}`}
                >
                    English
                </button>
            </div>
        );
    }

    // Default variant (for sidebar)
    return (
        <div className="w-full relative flex items-center p-1 rounded-lg bg-primary-dark">
            <button
                onClick={() => setLanguage('th')}
                className={`w-1/2 p-2 rounded-md text-sm font-bold transition-all duration-300 ${language === 'th' ? 'bg-accent text-white shadow-sm' : 'text-slate-300 hover:bg-primary-soft'}`}
            >
                TH
            </button>
            <button
                onClick={() => setLanguage('en')}
                className={`w-1/2 p-2 rounded-md text-sm font-bold transition-all duration-300 ${language === 'en' ? 'bg-accent text-white shadow-sm' : 'text-slate-300 hover:bg-primary-soft'}`}
            >
                EN
            </button>
        </div>
    );
};

export default LanguageToggle;
