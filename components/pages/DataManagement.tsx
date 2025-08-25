import React, { useState, useEffect, useCallback } from 'react';
import { useLocalization } from '../../contexts/LocalizationContext';
import { sheetService } from '../../services/googleSheetService';
import { Equipment } from '../../types';
// @ts-ignore
import Swal from 'sweetalert2';

const tableHeaderStyle = "px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider";
const tableCellStyle = "px-6 py-4 whitespace-nowrap text-sm";
const actionButtonStyle = "font-medium hover:underline";
const inputStyle = "swal2-input";

const DataManagement: React.FC = () => {
    const { t } = useLocalization();
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEquipment = useCallback(async () => {
        setLoading(true);
        try {
            const data = await sheetService.getEquipment();
            setEquipment(data);
        } catch (error) {
            console.error("Failed to fetch equipment", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEquipment();
    }, [fetchEquipment]);

    const handleAddOrEditEquipment = (item: Equipment | null = null) => {
        Swal.fire({
            title: item ? t('edit_equipment') : t('add_equipment'),
            html: `
                <input id="name_th" class="${inputStyle}" placeholder="${t('equipment_name_th')}" value="${item?.name_th || ''}">
                <input id="name_en" class="${inputStyle}" placeholder="${t('equipment_name_en')}" value="${item?.name_en || ''}">
            `,
            confirmButtonText: t('save'),
            showCancelButton: true,
            cancelButtonText: t('cancel'),
            focusConfirm: false,
            preConfirm: () => {
                const name_th = (document.getElementById('name_th') as HTMLInputElement).value;
                const name_en = (document.getElementById('name_en') as HTMLInputElement).value;
                if (!name_th || !name_en) {
                    Swal.showValidationMessage(t('form_incomplete'));
                    return false;
                }
                return { name_th, name_en };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                const equipmentData = result.value;
                const promise = item
                    ? sheetService.updateEquipment(item.id, equipmentData)
                    : sheetService.addEquipment(equipmentData as Omit<Equipment, 'id'>);
                
                await promise;
                Swal.fire({ icon: 'success', title: item ? t('equipment_updated') : t('equipment_added'), timer: 1500, showConfirmButton: false });
                fetchEquipment();
            }
        });
    };
    
    const handleDeleteEquipment = (item: Equipment) => {
        Swal.fire({
            title: t('confirm'),
            text: t('confirm_delete_equipment'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DC3545',
            confirmButtonText: t('delete'),
            cancelButtonText: t('cancel'),
        }).then(async (result) => {
            if (result.isConfirmed) {
                await sheetService.deleteEquipment(item.id);
                Swal.fire({ icon: 'success', title: t('equipment_deleted'), timer: 1500, showConfirmButton: false });
                fetchEquipment();
            }
        });
    };

    return (
        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-primary-dark tracking-wider">{t('data_management_title')}</h2>
                <button
                    onClick={() => handleAddOrEditEquipment()}
                    className="py-2 px-4 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-all"
                >
                    {t('add_equipment')}
                </button>
            </div>

            <div className="overflow-x-auto">
                 {loading ? <div className="text-center p-8">{t('loading')}</div> : (
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className={tableHeaderStyle}>{t('equipment_name_th')}</th>
                                <th className={tableHeaderStyle}>{t('equipment_name_en')}</th>
                                <th className={tableHeaderStyle}>{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {equipment.map(item => (
                                <tr key={item.id}>
                                    <td className={`${tableCellStyle} text-text-primary font-medium`}>{item.name_th}</td>
                                    <td className={`${tableCellStyle} text-text-secondary`}>{item.name_en}</td>
                                    <td className={`${tableCellStyle} space-x-4`}>
                                        <button onClick={() => handleAddOrEditEquipment(item)} className={`${actionButtonStyle} text-accent`}>{t('edit')}</button>
                                        <button onClick={() => handleDeleteEquipment(item)} className={`${actionButtonStyle} text-danger`}>{t('delete')}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default DataManagement;