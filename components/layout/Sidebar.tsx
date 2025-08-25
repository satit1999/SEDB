
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocalization } from '../../contexts/LocalizationContext';
import { Page } from '../../types';
import LanguageToggle from '../ui/LanguageToggle';

interface SidebarProps {
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
    const { user, logout } = useAuth();
    const { t } = useLocalization();

    const navItems = [
        { page: 'status', label: t('status_view'), icon: 'M4 6h16M4 12h16M4 18h7', roles: ['teacher', 'admin'] },
        { page: 'booking', label: t('booking_form'), icon: 'M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z', roles: ['teacher', 'admin'] },
    ];
    
    const adminNavItems = [
        { page: 'return', label: t('return_page'), icon: 'M3 10h10a8 8 0 018 8v2M3 10l6-6m-6 6l6 6', roles: ['admin'] },
        { page: 'reports', label: t('reports'), icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', roles: ['admin'] },
        { page: 'users', label: t('user_management'), icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', roles: ['admin'] },
        { page: 'data', label: t('data_management'), icon: 'M4 7v10m0 0h16M4 17l6-6-6-6m16 12l-6-6 6-6', roles: ['admin'] },
    ];

    const allNavItems = user?.role === 'admin' ? [...navItems, ...adminNavItems] : navItems;

    return (
        <nav className="w-64 bg-primary text-slate-100 flex flex-col h-full shadow-lg">
            <div className="p-4 border-b border-primary-soft">
                <h2 className="text-xl font-bold text-center tracking-wider text-white">
                  {t('app_title')}
                </h2>
            </div>
            <ul className="flex-1 p-2 space-y-1">
                {allNavItems.map(item => (
                     <li key={item.page}>
                        <button
                            onClick={() => setCurrentPage(item.page as Page)}
                            className={`flex items-center w-full text-left p-3 my-1 rounded-lg transition-all duration-200 group relative ${
                                currentPage === item.page
                                    ? 'bg-primary-soft text-white font-semibold'
                                    : 'text-slate-200 hover:bg-primary-soft hover:text-white'
                            }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                            </svg>
                            <span className="font-medium">{item.label}</span>
                             {currentPage === item.page && <div className="absolute bottom-0 left-3 right-3 h-1 bg-accent rounded-t-full"></div>}
                        </button>
                    </li>
                ))}
            </ul>
            <div className="p-4 border-t border-primary-soft space-y-3">
                <LanguageToggle />
                <button
                    onClick={logout}
                    className="flex items-center w-full text-left p-3 rounded-lg transition-colors duration-200 bg-danger text-white hover:opacity-90"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">{t('logout')}</span>
                </button>
            </div>
        </nav>
    );
};

export default Sidebar;
