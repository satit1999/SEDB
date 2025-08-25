import React, { useState, useEffect, useCallback } from 'react';
import { useLocalization } from '../../contexts/LocalizationContext';
import { sheetService } from '../../services/googleSheetService';
import { User, Classroom, Role, Program } from '../../types';
// @ts-ignore
import Swal from 'sweetalert2';

const tableHeaderStyle = "px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider";
const tableCellStyle = "px-6 py-4 whitespace-nowrap text-sm";
const actionButtonStyle = "font-medium hover:underline";
const inputStyle = "swal2-input";
const selectStyle = "swal2-select";

const UserManagement: React.FC = () => {
    const { t } = useLocalization();
    const [activeTab, setActiveTab] = useState<'users' | 'classrooms'>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (activeTab === 'users') {
                const fetchedUsers = await sheetService.getUsers();
                setUsers(fetchedUsers);
            } else {
                const fetchedClassrooms = await sheetService.getAllClassrooms();
                setClassrooms(fetchedClassrooms);
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- User Management Handlers ---
    const handleAddOrEditUser = (user: User | null = null) => {
        Swal.fire({
            title: user ? t('edit_user') : t('add_user'),
            html: `
                <input id="name" class="${inputStyle}" placeholder="${t('user_name')}" value="${user?.name || ''}">
                <input id="username" class="${inputStyle}" placeholder="${t('username')}" value="${user?.username || ''}">
                <input id="password" type="password" class="${inputStyle}" placeholder="${t('password')}" value="">
                <select id="role" class="${selectStyle}">
                    <option value="teacher" ${user?.role === 'teacher' ? 'selected' : ''}>${t('teacher')}</option>
                    <option value="admin" ${user?.role === 'admin' ? 'selected' : ''}>${t('admin')}</option>
                </select>
            `,
            confirmButtonText: t('save'),
            showCancelButton: true,
            cancelButtonText: t('cancel'),
            focusConfirm: false,
            preConfirm: () => {
                const name = (document.getElementById('name') as HTMLInputElement).value;
                const username = (document.getElementById('username') as HTMLInputElement).value;
                const password = (document.getElementById('password') as HTMLInputElement).value;
                const role = (document.getElementById('role') as HTMLSelectElement).value as Role;

                if (!name || !username || (!user && !password)) {
                    Swal.showValidationMessage(t('form_incomplete'));
                    return false;
                }
                
                const payload: Partial<User> = { name, username, role };
                if (password) {
                    payload.password = password;
                }
                
                return payload;
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                const userData = result.value;
                const promise = user 
                    ? sheetService.updateUser(user.id, userData)
                    : sheetService.addUser(userData as Omit<User, 'id'>);
                
                await promise;
                Swal.fire({ icon: 'success', title: user ? t('user_updated') : t('user_added'), timer: 1500, showConfirmButton: false });
                fetchData();
            }
        });
    };

    const handleDeleteUser = (user: User) => {
        Swal.fire({
            title: t('confirm'),
            text: t('confirm_delete_user'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DC3545',
            confirmButtonText: t('delete'),
            cancelButtonText: t('cancel'),
        }).then(async (result) => {
            if (result.isConfirmed) {
                await sheetService.deleteUser(user.id);
                Swal.fire({ icon: 'success', title: t('user_deleted'), timer: 1500, showConfirmButton: false });
                fetchData();
            }
        });
    };
    
    // --- Classroom Management Handlers ---
    const handleAddOrEditClassroom = (classroom: Classroom | null = null) => {
        Swal.fire({
            title: classroom ? t('edit_classroom') : t('add_classroom'),
            html: `
                <input id="name_th" class="${inputStyle}" placeholder="${t('classroom_name_th')}" value="${classroom?.name_th || ''}">
                <input id="name_en" class="${inputStyle}" placeholder="${t('classroom_name_en')}" value="${classroom?.name_en || ''}">
                <select id="program" class="${selectStyle}">
                    <option value="Kindergarten" ${classroom?.program === 'Kindergarten' ? 'selected' : ''}>${t('kindergarten')}</option>
                    <option value="Thai Programme" ${classroom?.program === 'Thai Programme' ? 'selected' : ''}>Thai Programme</option>
                    <option value="English Programme" ${classroom?.program === 'English Programme' ? 'selected' : ''}>English Programme</option>
                </select>
            `,
            confirmButtonText: t('save'),
            showCancelButton: true,
            cancelButtonText: t('cancel'),
            focusConfirm: false,
            preConfirm: () => {
                const name_th = (document.getElementById('name_th') as HTMLInputElement).value;
                const name_en = (document.getElementById('name_en') as HTMLInputElement).value;
                const program = (document.getElementById('program') as HTMLSelectElement).value as Program;
                if (!name_th || !name_en || !program) {
                    Swal.showValidationMessage(t('form_incomplete'));
                    return false;
                }
                return { name_th, name_en, program };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                const classroomData = result.value;
                const promise = classroom
                    ? sheetService.updateClassroom(classroom.id, classroomData)
                    : sheetService.addClassroom(classroomData as Omit<Classroom, 'id'>);
                
                await promise;
                Swal.fire({ icon: 'success', title: classroom ? t('classroom_updated') : t('classroom_added'), timer: 1500, showConfirmButton: false });
                fetchData();
            }
        });
    };

    const handleDeleteClassroom = (classroom: Classroom) => {
        Swal.fire({
            title: t('confirm'),
            text: t('confirm_delete_classroom'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DC3545',
            confirmButtonText: t('delete'),
            cancelButtonText: t('cancel'),
        }).then(async (result) => {
            if (result.isConfirmed) {
                await sheetService.deleteClassroom(classroom.id);
                Swal.fire({ icon: 'success', title: t('classroom_deleted'), timer: 1500, showConfirmButton: false });
                fetchData();
            }
        });
    };


    const TabButton = ({ tabName, label }: { tabName: 'users' | 'classrooms', label: string }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 focus:outline-none ${
                activeTab === tabName
                    ? 'border-accent text-accent'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-md">
            <div className="sm:flex sm:items-baseline sm:justify-between">
                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <TabButton tabName="users" label={t('users')} />
                        <TabButton tabName="classrooms" label={t('classrooms')} />
                    </nav>
                </div>
                <div className="mt-4 sm:mt-0">
                    <button
                        onClick={() => activeTab === 'users' ? handleAddOrEditUser() : handleAddOrEditClassroom()}
                        className="py-2 px-4 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-all"
                    >
                        {activeTab === 'users' ? t('add_user') : t('add_classroom')}
                    </button>
                </div>
            </div>

            <div className="mt-6 overflow-x-auto">
                {loading ? <div className="text-center p-8">{t('loading')}</div> : (
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            {activeTab === 'users' ? (
                                <tr>
                                    <th className={tableHeaderStyle}>{t('user_name')}</th>
                                    <th className={tableHeaderStyle}>{t('username')}</th>
                                    <th className={tableHeaderStyle}>{t('role')}</th>
                                    <th className={tableHeaderStyle}>{t('actions')}</th>
                                </tr>
                            ) : (
                                <tr>
                                    <th className={tableHeaderStyle}>{t('classroom_name_th')}</th>
                                    <th className={tableHeaderStyle}>{t('classroom_name_en')}</th>
                                    <th className={tableHeaderStyle}>{t('program')}</th>
                                    <th className={tableHeaderStyle}>{t('actions')}</th>
                                </tr>
                            )}
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {activeTab === 'users' ? (
                                users.map(user => (
                                    <tr key={user.id}>
                                        <td className={`${tableCellStyle} text-text-primary font-medium`}>{user.name}</td>
                                        <td className={`${tableCellStyle} text-text-secondary`}>{user.username}</td>
                                        <td className={`${tableCellStyle} text-text-secondary`}>{t(user.role)}</td>
                                        <td className={`${tableCellStyle} space-x-4`}>
                                            <button onClick={() => handleAddOrEditUser(user)} className={`${actionButtonStyle} text-accent`}>{t('edit')}</button>
                                            <button onClick={() => handleDeleteUser(user)} className={`${actionButtonStyle} text-danger`}>{t('delete')}</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                classrooms.map(classroom => (
                                    <tr key={classroom.id}>
                                        <td className={`${tableCellStyle} text-text-primary font-medium`}>{classroom.name_th}</td>
                                        <td className={`${tableCellStyle} text-text-secondary`}>{classroom.name_en}</td>
                                        <td className={`${tableCellStyle} text-text-secondary`}>{classroom.program === 'Kindergarten' ? t('kindergarten') : classroom.program}</td>
                                        <td className={`${tableCellStyle} space-x-4`}>
                                            <button onClick={() => handleAddOrEditClassroom(classroom)} className={`${actionButtonStyle} text-accent`}>{t('edit')}</button>
                                            <button onClick={() => handleDeleteClassroom(classroom)} className={`${actionButtonStyle} text-danger`}>{t('delete')}</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default UserManagement;