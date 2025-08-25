
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LocalizationProvider, useLocalization } from './contexts/LocalizationContext';
import LoginPage from './components/pages/LoginPage';
import Sidebar from './components/layout/Sidebar';
import BookingForm from './components/pages/BookingForm';
import StatusView from './components/pages/StatusView';
import ReturnPage from './components/pages/ReturnPage';
import UserManagement from './components/pages/UserManagement';
import DataManagement from './components/pages/DataManagement';
import ReportGenerator from './components/pages/ReportGenerator';
import ConnectionSetupPage from './components/pages/AdminGuide';
import { Page, Booking } from './types';
import Header from './components/layout/Header';

const AppContent: React.FC = () => {
    const { user } = useAuth();
    const [currentPage, setCurrentPage] = useState<Page>('status');
    const [prefillBooking, setPrefillBooking] = useState<Partial<Booking> | null>(null);
    const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
    const { t } = useLocalization();

    useEffect(() => {
        if (user) {
            setCurrentPage('status');
        }
    }, [user]);

    const pageTitles: { [key in Page]: string } = useMemo(() => ({
        'status': t('status_view_title'),
        'booking': editingBooking ? t('edit_booking_title') : t('booking_form_title'),
        'return': t('return_page_title'),
        'reports': t('reports_title'),
        'users': t('user_management_title'),
        'data': t('data_management_title'),
    }), [t, editingBooking]);

    const handleNewBookingClick = useCallback((defaults: Partial<Booking>) => {
        setPrefillBooking(defaults);
        setCurrentPage('booking');
    }, []);
    
    const handleEditBookingClick = useCallback((booking: Booking) => {
        setEditingBooking(booking);
        setCurrentPage('booking');
    }, []);
    
    const handleFormClose = useCallback(() => {
        setPrefillBooking(null);
        setEditingBooking(null);
    }, []);

    const renderPage = useCallback(() => {
        switch (currentPage) {
            case 'status':
                return <StatusView onNewBooking={handleNewBookingClick} />;
            case 'booking':
                return <BookingForm 
                            setCurrentPage={setCurrentPage} 
                            prefillData={prefillBooking}
                            editingData={editingBooking}
                            onFormClose={handleFormClose}
                        />;
            case 'return':
                return <ReturnPage onEdit={handleEditBookingClick} />;
            case 'reports':
                return <ReportGenerator />;
            case 'users':
                return <UserManagement />;
            case 'data':
                return <DataManagement />;
            default:
                return <StatusView onNewBooking={handleNewBookingClick} />;
        }
    }, [currentPage, prefillBooking, editingBooking, handleNewBookingClick, handleEditBookingClick, handleFormClose]);

    if (!user) {
        return <LoginPage />;
    }

    return (
        <div className="flex h-screen">
            <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header title={pageTitles[currentPage]} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8">
                    {renderPage()}
                </main>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const [isUrlSet, setIsUrlSet] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const url = localStorage.getItem('google_script_url');
        if (url) {
            setIsUrlSet(true);
        }
        setIsLoading(false);
    }, []);

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center text-slate-500">{/* Empty loading state */}</div>;
    }

    if (!isUrlSet) {
        return (
            <LocalizationProvider>
                <ConnectionSetupPage />
            </LocalizationProvider>
        );
    }

    return (
        <LocalizationProvider>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </LocalizationProvider>
    );
};

export default App;
