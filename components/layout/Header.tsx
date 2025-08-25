
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocalization } from '../../contexts/LocalizationContext';

interface HeaderProps {
    title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
    const { user } = useAuth();
    const { t } = useLocalization();

    return (
        <header className="bg-white p-4 flex justify-between items-center z-10 border-b border-slate-200 shadow-sm">
            <h1 className="text-xl md:text-2xl font-bold text-primary-dark tracking-wider">{title}</h1>
            <div className="flex items-center space-x-4">
                <span className="hidden md:inline text-text-secondary">{t('welcome')}, <span className="font-semibold text-text-primary">{user?.name}</span></span>
            </div>
        </header>
    );
};

export default Header;