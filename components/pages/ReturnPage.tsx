
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { sheetService } from '../../services/googleSheetService';
import { Booking, Classroom, Equipment, Status } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useLocalization } from '../../contexts/LocalizationContext';
// @ts-ignore
import Swal from 'sweetalert2';

interface ReturnPageProps {
    onEdit: (booking: Booking) => void;
}

const ReturnPage: React.FC<ReturnPageProps> = ({ onEdit }) => {
    const { user } = useAuth();
    const { t, language } = useLocalization();
    const [allBookings, setAllBookings] = useState<Booking[]>([]);
    const [masterData, setMasterData] = useState<{ classrooms: Classroom[], equipment: Equipment[] }>({ classrooms: [], equipment: []});
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<Status | ''>('');
    const inputStyle = "w-full p-3 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent";


    const fetchAllBookings = useCallback(() => {
        setLoading(true);
        sheetService.getBookingsWithStatus().then(data => {
            setAllBookings(data);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        fetchAllBookings();
        Promise.all([sheetService.getAllClassrooms(), sheetService.getEquipment()])
            .then(([classrooms, equipment]) => setMasterData({ classrooms, equipment }));
    }, [fetchAllBookings]);
    
    const filteredBookings = useMemo(() => {
        return allBookings.filter(b => {
            const dateMatch = !dateFilter || b.date === dateFilter;
            const statusMatch = !statusFilter || b.status === statusFilter;
            return dateMatch && statusMatch;
        });
    }, [allBookings, dateFilter, statusFilter]);

    const handleReturn = (bookingId: string) => {
        Swal.fire({
            title: t('confirm'),
            text: t('confirm_return_prompt'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#198754',
            cancelButtonColor: '#6C757D',
            confirmButtonText: t('confirm'),
            cancelButtonText: t('cancel'),
        }).then(async (result) => {
            if (result.isConfirmed) {
                if(user) {
                    await sheetService.confirmReturn(bookingId, user.name);
                    Swal.fire({
                        title: t('return_success'),
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false,
                    });
                    fetchAllBookings();
                }
            }
        });
    };
    
    const handleCancelBooking = (bookingId: string) => {
        Swal.fire({
            title: t('confirm'),
            text: t('confirm_cancel_prompt'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DC3545',
            cancelButtonColor: '#6C757D',
            confirmButtonText: t('cancel_booking'),
            cancelButtonText: t('cancel'),
        }).then(async (result) => {
            if (result.isConfirmed) {
                const res = await sheetService.deleteBooking(bookingId);
                if (res.success) {
                    Swal.fire({
                        title: t('cancellation_success'),
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false,
                    });
                    fetchAllBookings();
                }
            }
        });
    }

    const getEquipmentNames = (ids: string[]): string => {
        return ids.map(id => {
            const eq = masterData.equipment.find(e => e.id === id);
            if (!eq) return id;
            return language === 'th' ? eq.name_th : eq.name_en;
        }).join(', ');
    }

    const getClassroomName = (id: string): string => {
        const classroom = masterData.classrooms.find(c => c.id === id);
        if(!classroom) return id;
        return language === 'th' ? classroom.name_th : classroom.name_en;
    }
    
    const getStatusTag = (status: Status) => {
        const styles: { [key in Status]: string } = {
            'Booked': 'bg-warning/20 text-yellow-800',
            'In Use': 'bg-info/20 text-cyan-800',
            'Pending Return': 'bg-danger/20 text-danger',
            'Not Used': 'bg-secondary/20 text-secondary',
            'Returned': 'bg-success/20 text-success',
            'Available': '',
        };
        return <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status]}`}>{t(status.toLowerCase().replace(' ', '_') as any)}</span>;
    }

    if (loading) return <div className="text-center p-8 text-slate-500">{t('loading')}</div>;

    return (
        <div className="space-y-6">
             <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-md">
                <h3 className="font-bold text-lg text-text-primary mb-4">{t('filter')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className={inputStyle} />
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as Status)} className={inputStyle}>
                        <option value="">{t('all_statuses')}</option>
                        {(Object.keys({
                            'Booked':1, 'In Use':1, 'Pending Return':1, 'Not Used':1, 'Returned':1
                        }) as Status[]).map(s => <option key={s} value={s}>{t(s.toLowerCase().replace(' ', '_') as any)}</option>)}
                    </select>
                </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                     <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">{t('date')} / {t('period')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">{t('classroom')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">{t('teacher_name')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">{t('equipment')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">{t('status')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredBookings.length > 0 ? (
                                filteredBookings.map(b => (
                                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{b.date} / P{b.period}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{getClassroomName(b.classroom)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{b.teacherName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-text-secondary max-w-xs truncate">{getEquipmentNames(b.equipment)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusTag(b.status)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                                            {(b.status === 'In Use' || b.status === 'Pending Return') && (
                                                <button onClick={() => handleReturn(b.id)} className="text-success hover:underline font-semibold">{t('return_confirmation')}</button>
                                            )}
                                            <button onClick={() => onEdit(b)} className="text-accent hover:underline font-semibold">{t('edit')}</button>
                                            <button onClick={() => handleCancelBooking(b.id)} className="text-danger hover:underline font-semibold">{t('cancel_booking')}</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-slate-500">{t('no_items_to_return')}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReturnPage;