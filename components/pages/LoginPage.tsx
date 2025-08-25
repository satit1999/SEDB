
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocalization } from '../../contexts/LocalizationContext';
// @ts-ignore
import Swal from 'sweetalert2';
import LanguageToggle from '../ui/LanguageToggle';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const { t } = useLocalization();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const success = await login(username, password);
        setLoading(false);
        if (!success) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: t('login_failed'),
            });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-md">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-primary-dark">
                        {t('app_title')}
                    </h2>
                    <p className="mt-2 text-sm text-text-secondary">{t('login_title')}</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                required
                                className="appearance-none relative block w-full px-4 py-3 bg-slate-50 border border-slate-300 placeholder-slate-400 text-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent focus:z-10 sm:text-sm transition-all"
                                placeholder={t('username')}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none relative block w-full px-4 py-3 bg-slate-50 border border-slate-300 placeholder-slate-400 text-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent focus:z-10 sm:text-sm transition-all"
                                placeholder={t('password')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-300"
                        >
                            {loading ? t('loading') : t('login')}
                        </button>
                    </div>
                    <div className="text-center">
                        <LanguageToggle variant="minimal" />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
