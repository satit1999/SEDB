
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { sheetService } from '../../services/googleSheetService';
import { Booking, Classroom, Program, Status } from '../../types';
import { useLocalization } from '../../contexts/LocalizationContext';
import { useAuth } from '../../contexts/AuthContext';
import { PERIOD_TIMES } from '../../constants';
// @ts-ignore
import Swal from 'sweetalert2';

interface StatusViewProps {
    onNewBooking: (defaults: Partial<Booking>) => void;
}

const programOrder: Program[] = ['Kindergarten', 'Thai Programme', 'English Programme'];

const StatusView: React.FC<StatusViewProps> = ({ onNewBooking }) => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [allClassrooms, setAllClassrooms] = useState<Classroom[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
    const [programFilter, setProgramFilter] = useState<Program | ''>('');
    const { t, language } = useLocalization();
    const inputStyle = "w-full p-3 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent";

    const fetchAllData = useCallback(() => {
        setLoading(true);
        Promise.all([
            sheetService.getBookingsByDate(dateFilter),
            sheetService.getAllClassrooms()
        ]).then(([bookingData, classroomData]) => {
            setBookings(bookingData);
            setAllClassrooms(classroomData);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [dateFilter]);

    useEffect(() => {
        fetchAllData();
        const interval = setInterval(fetchAllData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchAllData]);

    const handleCancelBooking = useCallback(async (bookingId: string) => {
        if (!user) return;
        
        const result = await Swal.fire({
            title: t('confirm'),
            text: t('confirm_cancel_prompt'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0F2A53',
            cancelButtonColor: '#DC3545',
            confirmButtonText: t('confirm'),
            cancelButtonText: t('cancel'),
        });

        if (result.isConfirmed) {
            const res = await sheetService.cancelBooking(bookingId, user.id);
            if (res.success) {
                Swal.fire({ icon: 'success', title: t('cancellation_success'), timer: 1500, showConfirmButton: false });
                fetchAllData();
            } else {
                Swal.fire({ icon: 'error', title: t('cancellation_failed'), text: res.message });
            }
        }
    }, [user, fetchAllData, t]);

    const groupedClassrooms = useMemo(() => {
        return allClassrooms.reduce((acc, classroom) => {
            if (programFilter && classroom.program !== programFilter) {
                return acc;
            }
            if (!acc[classroom.program]) {
                acc[classroom.program] = [];
            }
            acc[classroom.program].push(classroom);
            return acc;
        }, {} as Record<Program, Classroom[]>);
    }, [allClassrooms, programFilter]);

    const getStatusTag = (status: Status): React.ReactNode => {
        const styles: { [key in Status]: string } = {
            'Booked': 'bg-warning/20 text-yellow-800',
            'In Use': 'bg-info/20 text-cyan-800',
            'Pending Return': 'bg-danger/20 text-danger',
            'Not Used': 'bg-secondary/20 text-secondary',
            'Returned': 'bg-success/20 text-success',
            'Available': '',
        };
        return <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status]}`}>{t(status.toLowerCase().replace(' ', '_') as any)}</span>;
    };

    const getProgramName = (program: Program) => {
        if (program === 'Kindergarten') return t('kindergarten');
        if (program === 'Thai Programme') return 'Thai Programme';
        return 'English Programme';
    };

    return (
        <div className="space-y-6">
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-md">
                <h3 className="font-bold text-lg text-text-primary mb-4">{t('filter')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className={inputStyle} />
                    <select value={programFilter} onChange={e => setProgramFilter(e.target.value as Program)} className={inputStyle}>
                        <option value="">{t('program')} (All)</option>
                        <option value="Kindergarten">{t('kindergarten')}</option>
                        <option value="Thai Programme">Thai Programme</option>
                        <option value="English Programme">English Programme</option>
                    </select>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">{t('loading')}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse">
                            <thead className="bg-slate-100 border-b border-slate-200">
                                <tr>
                                    <th className="sticky left-0 bg-slate-100 z-10 px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider w-48">{t('classroom')}</th>
                                    {Object.keys(PERIOD_TIMES).map(p => (
                                        <th key={p} className="px-3 py-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider w-40">
                                            {t('period')} {p}<br/><span className="font-normal normal-case text-slate-500">{PERIOD_TIMES[Number(p)]}</span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {programOrder.map(program => (
                                    groupedClassrooms[program] && (
                                        <React.Fragment key={program}>
                                            <tr>
                                                <td colSpan={Object.keys(PERIOD_TIMES).length + 1} className="bg-primary-soft/10 px-4 py-2 text-sm font-bold text-primary tracking-wider">
                                                    {getProgramName(program)}
                                                </td>
                                            </tr>
                                            {groupedClassrooms[program].map((classroom, index) => (
                                                <tr key={classroom.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                                    <th className="sticky left-0 px-4 py-4 whitespace-nowrap text-sm font-semibold text-text-primary text-left w-48 border-r border-slate-200" style={{backgroundColor: 'inherit'}}>
                                                        {language === 'th' ? classroom.name_th : classroom.name_en}
                                                    </th>
                                                    {Object.keys(PERIOD_TIMES).map(p => {
                                                        const periodNum = Number(p);
                                                        const booking = bookings.find(b => b.classroom === classroom.id && b.period === periodNum);
                                                        
                                                        if (booking) {
                                                            const isOwner = user?.id === booking.userId;
                                                            const isAdmin = user?.role === 'admin';
                                                            return (
                                                                <td key={p} className={`border-x border-slate-200 p-2 text-center text-xs transition-all duration-300`}>
                                                                    <div className="font-bold text-text-primary">{booking.teacherName}</div>
                                                                    <div className="text-xs my-1">{getStatusTag(booking.status)}</div>
                                                                    {(isAdmin || isOwner) && booking.status === 'Booked' && (
                                                                        <button onClick={() => handleCancelBooking(booking.id)} className="text-danger hover:underline text-xs font-semibold">{t('cancel')}</button>
                                                                    )}
                                                                </td>
                                                            );
                                                        }
                                                        
                                                        return (
                                                            <td key={p} className="border-x border-slate-200 p-2 text-center align-middle hover:bg-accent/10 cursor-pointer transition-all duration-300 group" onClick={() => onNewBooking({ date: dateFilter, period: periodNum, classroom: classroom.id, program: classroom.program })}>
                                                                <span className="text-accent font-semibold text-sm">{t('book_now')}</span>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    )
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatusView;