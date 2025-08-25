import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocalization } from '../../contexts/LocalizationContext';
import { sheetService } from '../../services/googleSheetService';
import { BookingType, Classroom, Program, Equipment, Page, Booking } from '../../types';
import { PERIOD_TIMES } from '../../constants';
// @ts-ignore
import Swal from 'sweetalert2';

interface BookingFormProps {
    setCurrentPage: (page: Page) => void;
    prefillData?: Partial<Booking> | null;
    editingData?: Booking | null;
    onFormClose: () => void;
}

const inputStyle = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none";
const labelStyle = "block text-sm font-medium text-text-secondary";


const BookingForm: React.FC<BookingFormProps> = ({ setCurrentPage, prefillData, editingData, onFormClose }) => {
    const { user } = useAuth();
    const { t, language } = useLocalization();

    const isEditMode = !!editingData;
    
    const [bookingType, setBookingType] = useState<BookingType>('Booking');
    const [teacherName, setTeacherName] = useState(user?.name || '');
    const [program, setProgram] = useState<Program | ''>('');
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [selectedClassroom, setSelectedClassroom] = useState('');
    const [period, setPeriod] = useState<number | ''>('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
    const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
    const [learningPlan, setLearningPlan] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        sheetService.getEquipment().then(setEquipmentList);
        
        return () => {
            onFormClose();
        };
    }, [onFormClose]);

    useEffect(() => {
        if (isEditMode && editingData) {
            setBookingType(editingData.type);
            setTeacherName(editingData.teacherName);
            setProgram(editingData.program);
            setSelectedClassroom(editingData.classroom);
            setPeriod(editingData.period);
            setDate(editingData.date);
            setSelectedEquipment(editingData.equipment);
            setLearningPlan(editingData.learningPlan);
        } else if (prefillData) {
            if (prefillData.date) setDate(prefillData.date);
            if (prefillData.program) setProgram(prefillData.program);
            if (prefillData.classroom) setSelectedClassroom(prefillData.classroom);
            if (prefillData.period) setPeriod(prefillData.period);
        }
    }, [isEditMode, editingData, prefillData]);


    useEffect(() => {
        if (program) {
            sheetService.getClassrooms(program).then(setClassrooms);
            if(!prefillData || prefillData.program !== program) {
               if(!isEditMode) setSelectedClassroom('');
            }
        } else {
            setClassrooms([]);
        }
    }, [program, prefillData, isEditMode]);
    
    const handleEquipmentCheckboxChange = (equipmentId: string) => {
        setSelectedEquipment(prev => {
            if (prev.includes(equipmentId)) {
                return prev.filter(id => id !== equipmentId);
            } else {
                return [...prev, equipmentId];
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !teacherName || !program || !selectedClassroom || !period || !date || selectedEquipment.length === 0 || !learningPlan) {
            Swal.fire({ icon: 'warning', title: t('form_incomplete') });
            return;
        }

        setLoading(true);

        const bookingPayload = {
            userId: editingData?.userId || user.id,
            type: bookingType,
            teacherName,
            program,
            classroom: selectedClassroom,
            period: Number(period),
            date,
            equipment: selectedEquipment,
            learningPlan,
        };
        
        let result;
        if(isEditMode && editingData){
            result = await sheetService.updateBooking(editingData.id, bookingPayload);
        } else {
            result = await sheetService.addBooking(bookingPayload);
        }

        setLoading(false);

        if (result.success) {
            Swal.fire({
                icon: 'success',
                title: isEditMode ? t('booking_update_success') : t('booking_success'),
                showConfirmButton: false,
                timer: 1500,
            });
            setCurrentPage(isEditMode ? 'return' : 'status');
        } else {
            Swal.fire({
                icon: 'error',
                title: t('booking_conflict'),
                text: t('booking_conflict_message'),
            });
        }
    };

    return (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-md max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelStyle}>{t('booking_type')}</label>
                        <select value={bookingType} onChange={(e) => setBookingType(e.target.value as BookingType)} className={inputStyle}>
                            <option value="Booking">{t('book')}</option>
                            <option value="Borrow">{t('borrow')}</option>
                        </select>
                    </div>
                     <div>
                        <label className={labelStyle}>{t('teacher_name')}</label>
                        <input type="text" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} className={inputStyle} readOnly={!isEditMode && user?.role !== 'admin'} />
                    </div>
                     <div>
                        <label className={labelStyle}>{t('program')}</label>
                        <select value={program} onChange={(e) => setProgram(e.target.value as Program)} className={inputStyle}>
                            <option value="">{t('select_program')}</option>
                            <option value="Kindergarten">{t('kindergarten')}</option>
                            <option value="Thai Programme">Thai Programme</option>
                            <option value="English Programme">English Programme</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>{t('classroom')}</label>
                        <select value={selectedClassroom} onChange={(e) => setSelectedClassroom(e.target.value)} disabled={!program} className={inputStyle}>
                            <option value="">{t('select_classroom')}</option>
                            {classrooms.map(c => <option key={c.id} value={c.id}>{language === 'th' ? c.name_th : c.name_en}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className={labelStyle}>{t('period')}</label>
                        <select value={period} onChange={(e) => setPeriod(Number(e.target.value))} className={inputStyle}>
                            <option value="">{t('select_period')}</option>
                            {Object.entries(PERIOD_TIMES).map(([num, time]) => <option key={num} value={num}>{t('period')} {num} ({time})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelStyle}>{t('date')}</label>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={!isEditMode ? new Date().toISOString().split('T')[0] : undefined} className={inputStyle} />
                    </div>
                    <div className="md:col-span-2">
                        <label className={labelStyle}>{t('equipment_list')}</label>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
                            {equipmentList.map(eq => (
                                <label key={eq.id} className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                                    <input
                                        type="checkbox"
                                        value={eq.id}
                                        checked={selectedEquipment.includes(eq.id)}
                                        onChange={() => handleEquipmentCheckboxChange(eq.id)}
                                        className="h-4 w-4 text-accent focus:ring-accent border-slate-300 rounded"
                                    />
                                    <span className="text-text-secondary select-none">{language === 'th' ? eq.name_th : eq.name_en}</span>
                                 </label>
                            ))}
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <label className={labelStyle}>{t('learning_plan')}</label>
                        <input type="text" value={learningPlan} onChange={(e) => setLearningPlan(e.target.value)} className={inputStyle} />
                    </div>
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
                     <button type="button" onClick={() => setCurrentPage(isEditMode ? 'return' : 'status')} className="py-2 px-6 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-all">
                        {t('cancel')}
                    </button>
                    <button type="submit" disabled={loading} className="py-2 px-6 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:bg-slate-400 disabled:shadow-none disabled:cursor-not-allowed transition-all">
                        {loading ? t('loading') : (isEditMode ? t('save') : t('submit'))}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BookingForm;