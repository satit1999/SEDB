import React, { useState, useEffect, useCallback } from 'react';
import { useLocalization } from '../../contexts/LocalizationContext';
import { sheetService } from '../../services/googleSheetService';
import { Booking, Program, User, Equipment, Classroom, Status } from '../../types';

const ReportGenerator: React.FC = () => {
    const { t, language } = useLocalization();

    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        program: '',
        teacherId: '',
        equipmentId: '',
    });
    const [reportData, setReportData] = useState<Booking[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [masterData, setMasterData] = useState<{
        users: User[];
        equipment: Equipment[];
        classrooms: Classroom[];
    }>({ users: [], equipment: [], classrooms: [] });
    
    const inputStyle = "w-full p-3 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent";

    useEffect(() => {
        Promise.all([
            sheetService.getUsers(),
            sheetService.getEquipment(),
            sheetService.getAllClassrooms(),
        ]).then(([users, equipment, classrooms]) => {
            setMasterData({ users, equipment, classrooms });
        });
    }, []);
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleGenerateReport = async () => {
        setLoading(true);
        setReportData(null);
        const data = await sheetService.getReportData({
            ...filters,
            program: filters.program as Program | '',
        });
        setReportData(data);
        setLoading(false);
    };

    const handleExport = () => {
        if (!reportData || reportData.length === 0) return;

        const headers = [
            t('teacher_name'), t('program'), t('classroom'), t('learning_plan'),
            t('date'), t('period'), t('equipment_list'), t('status')
        ];

        const csvRows = [headers.join(',')];
        
        reportData.forEach(booking => {
            const classroomName = masterData.classrooms.find(c => c.id === booking.classroom)?.[language === 'th' ? 'name_th' : 'name_en'] || booking.classroom;
            const equipmentNames = booking.equipment.map(eqId => 
                masterData.equipment.find(e => e.id === eqId)?.[language === 'th' ? 'name_th' : 'name_en'] || eqId
            ).join('; ');
            
            const row = [
                booking.teacherName, booking.program, classroomName, booking.learningPlan,
                booking.date, `P${booking.period}`, `"${equipmentNames}"`, booking.status
            ];
            
            csvRows.push(row.join(','));
        });
        
        const csvString = csvRows.join('\n');
        const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'report.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
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
    };

    return (
        <div className="space-y-6">
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-md space-y-4">
                <h3 className="font-bold text-lg text-text-primary">{t('filter')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className={inputStyle} placeholder={t('start_date')} />
                    <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className={inputStyle} placeholder={t('end_date')} />
                    <select name="program" value={filters.program} onChange={handleFilterChange} className={inputStyle}>
                        <option value="">{t('all_programs')}</option>
                        <option value="Kindergarten">{t('kindergarten')}</option>
                        <option value="Thai Programme">Thai Programme</option>
                        <option value="English Programme">English Programme</option>
                    </select>
                    <select name="teacherId" value={filters.teacherId} onChange={handleFilterChange} className={inputStyle}>
                        <option value="">{t('all_teachers')}</option>
                        {masterData.users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                    </select>
                    <select name="equipmentId" value={filters.equipmentId} onChange={handleFilterChange} className={inputStyle}>
                        <option value="">{t('all_equipment')}</option>
                        {masterData.equipment.map(eq => <option key={eq.id} value={eq.id}>{language === 'th' ? eq.name_th : eq.name_en}</option>)}
                    </select>
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
                    <button onClick={handleGenerateReport} disabled={loading} className="py-2 px-6 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:bg-slate-400">
                        {loading ? t('loading') : t('generate_report')}
                    </button>
                    <button onClick={handleExport} disabled={!reportData || reportData.length === 0} className="py-2 px-6 bg-success text-white font-semibold rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-slate-400 disabled:cursor-not-allowed">
                        {t('export_to_excel')}
                    </button>
                </div>
            </div>

            {reportData && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden">
                    <h3 className="font-bold text-lg text-text-primary p-4 border-b">{t('report_results')} ({reportData.length})</h3>
                    {reportData.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-100">
                                    <tr>
                                        {[t('teacher_name'), t('classroom'), t('learning_plan'), t('date'), t('period'), t('equipment_list'), t('status')].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">{h}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {reportData.map(b => (
                                        <tr key={b.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{b.teacherName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{masterData.classrooms.find(c => c.id === b.classroom)?.[language === 'th' ? 'name_th' : 'name_en'] || b.classroom}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{b.learningPlan}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{b.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{b.period}</td>
                                            <td className="px-6 py-4 text-xs max-w-xs">{b.equipment.map(id => masterData.equipment.find(e => e.id === id)?.[language === 'th' ? 'name_th' : 'name_en'] || id).join(', ')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusTag(b.status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-center py-10 text-slate-500">{t('no_report_data')}</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReportGenerator;
