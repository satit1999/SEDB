
import React, { useState, useCallback, useRef } from 'react';
import { useLocalization } from '../../contexts/LocalizationContext';
import { codeString } from './CodeGsContent';
// @ts-ignore
import Swal from 'sweetalert2';
import LanguageToggle from '../ui/LanguageToggle';

const GuideSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary-dark mb-4 border-b-2 border-primary-soft pb-2">{title}</h2>
        <div className="space-y-4 text-text-secondary leading-relaxed">
            {children}
        </div>
    </div>
);

const Step: React.FC<{ num: number, title: string, children: React.ReactNode }> = ({ num, title, children }) => (
     <div className="mb-6 pl-4 border-l-4 border-accent">
        <h3 className="text-xl font-semibold text-primary mb-2">
            <span className="bg-accent text-white rounded-full h-8 w-8 inline-flex items-center justify-center mr-3 font-bold">{num}</span>
            {title}
        </h3>
        <div className="pl-11 text-base">
            {children}
        </div>
    </div>
)

const ConnectionSetupPage: React.FC = () => {
    const { t, language } = useLocalization();
    const [copyButtonText, setCopyButtonText] = useState(language === 'th' ? 'คัดลอกโค้ด' : 'Copy Code');
    const [scriptUrl, setScriptUrl] = useState('');
    const codeRef = useRef<HTMLPreElement>(null);

    const handleCopyCode = useCallback(() => {
        if (codeRef.current) {
            navigator.clipboard.writeText(codeRef.current.textContent || '').then(() => {
                setCopyButtonText(language === 'th' ? 'คัดลอกแล้ว!' : 'Copied!');
                setTimeout(() => {
                    setCopyButtonText(language === 'th' ? 'คัดลอกโค้ด' : 'Copy Code');
                }, 2000);
            });
        }
    }, [language]);
    
    const handleSaveUrl = () => {
        if (scriptUrl && scriptUrl.startsWith('https://script.google.com/macros/s/')) {
            localStorage.setItem('google_script_url', scriptUrl);
            Swal.fire({
                icon: 'success',
                title: 'Connection Successful!',
                text: 'The application will now reload.',
                timer: 2000,
                showConfirmButton: false,
                willClose: () => {
                    window.location.reload();
                }
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Invalid URL',
                text: 'Please paste the correct "Web app URL" from the Google Apps Script deployment dialog. It should start with "https://script.google.com/macros/s/".'
            });
        }
    };

    const thGuide = (
        <>
        <GuideSection title="ยินดีต้อนรับ! มาเริ่มตั้งค่าการเชื่อมต่อกัน">
            <p>คู่มือนี้จะแนะนำขั้นตอนการติดตั้งสคริปต์หลังบ้าน (Backend) เพื่อให้แอปพลิเคชันของคุณสามารถจัดเก็บและจัดการข้อมูลทั้งหมดบน Google Sheets ได้โดยตรง <strong>กรุณาทำตามขั้นตอนต่อไปนี้เพียงครั้งเดียว</strong> เพื่อตั้งค่าระบบให้พร้อมใช้งานครับ</p>
        </GuideSection>
        
        <GuideSection title="ขั้นตอนการติดตั้ง">
             <Step num={1} title="สร้างโปรเจกต์ Google Apps Script">
                <ol className="list-decimal list-inside space-y-2">
                    <li>ไปที่เว็บไซต์ <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-semibold">script.google.com</a> และล็อกอินด้วยบัญชี Google ของคุณ</li>
                    <li>คลิกที่ปุ่ม <strong>"New project"</strong> (โปรเจกต์ใหม่) ที่มุมบนซ้าย</li>
                </ol>
            </Step>
            <Step num={2} title="ติดตั้งโค้ด Backend">
                 <ol className="list-decimal list-inside space-y-2">
                    <li><strong>ลบโค้ดตัวอย่าง</strong> ที่มีอยู่ในหน้าจอทั้งหมดออก</li>
                    <li><strong>คัดลอกโค้ดทั้งหมด</strong> จากกล่องด้านล่าง ไปวางในหน้าจอแก้ไขโค้ด</li>
                    <li>คลิกที่ไอคอนรูปแผ่นดิสก์ (💾) เพื่อ <strong>"Save project"</strong> (บันทึกโปรเจกต์) และตั้งชื่อโปรเจกต์ (เช่น `School Equipment API`)</li>
                </ol>
            </Step>
             <Step num={3} title="Deploy สคริปต์เป็น Web App">
                 <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>ที่มุมบนขวา, คลิกที่ปุ่มสีน้ำเงิน <strong>"Deploy"</strong> และเลือก <strong>"New deployment"</strong></li>
                    <li>คลิกที่ <strong>ไอคอนรูปเฟือง (⚙️)</strong> ข้างๆ "Select type" และเลือก <strong>"Web app"</strong></li>
                    <li>ตั้งค่าตามนี้:
                        <ul className="list-disc list-inside ml-4 mt-2">
                            <li><strong>Description:</strong> (ไม่บังคับ) ใส่คำอธิบาย เช่น `Version 1`</li>
                            <li><strong>Execute as:</strong> เลือกเป็น <strong>"Me"</strong> (ตัวคุณเอง)</li>
                            <li><strong>Who has access:</strong> <strong>ต้องเลือกเป็น "Anyone" เท่านั้น</strong></li>
                        </ul>
                    </li>
                    <li>คลิก <strong>"Deploy"</strong></li>
                </ol>
            </Step>
             <Step num={4} title="ให้สิทธิ์การเข้าถึง และคัดลอก URL">
                 <ol className="list-decimal list-inside space-y-2">
                    <li>ระบบจะขอสิทธิ์, ให้คลิก <strong>"Authorize access"</strong> และทำตามขั้นตอนเพื่ออนุญาต (อาจต้องกด Advanced {'>'} Go to...unsafe)</li>
                    <li>หลังจาก Deploy สำเร็จ, คุณจะเห็นหน้าต่าง "Deployment successfully" พร้อมกับ <strong>"Web app URL"</strong></li>
                    <li><strong>คัดลอก URL นี้</strong> โดยการกดปุ่ม "Copy"</li>
                </ol>
            </Step>
        </GuideSection>
        </>
    );

    const enGuide = (
        <>
        <GuideSection title="Welcome! Let's Set Up Your Connection">
            <p>This guide will walk you through setting up the backend script, enabling your application to store and manage all data directly on Google Sheets. <strong>Please follow these steps once</strong> to get the system ready.</p>
        </GuideSection>

        <GuideSection title="Installation Steps">
            <Step num={1} title="Create a Google Apps Script Project">
                <ol className="list-decimal list-inside space-y-2">
                    <li>Go to <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-semibold">script.google.com</a> and log in with your Google account.</li>
                    <li>Click the <strong>"New project"</strong> button in the top-left corner.</li>
                </ol>
            </Step>
             <Step num={2} title="Install the Backend Code">
                <ol className="list-decimal list-inside space-y-2">
                    <li><strong>Delete all the sample code</strong> in the editor.</li>
                    <li><strong>Copy the entire code</strong> from the box below and paste it into the editor.</li>
                    <li>Click the save icon (💾) to <strong>"Save project"</strong> and give it a name (e.g., `School Equipment API`).</li>
                </ol>
            </Step>
            <Step num={3} title="Deploy the Script as a Web App">
                <ol className="list-decimal list-inside space-y-2 mt-2">
                    <li>In the top-right corner, click the blue <strong>"Deploy"</strong> button and select <strong>"New deployment"</strong>.</li>
                    <li>Click the <strong>gear icon (⚙️)</strong> next to "Select type" and choose <strong>"Web app"</strong>.</li>
                    <li>Configure the settings as follows:
                        <ul className="list-disc list-inside ml-4 mt-2">
                            <li><strong>Description:</strong> (Optional) Enter a description like `Version 1`.</li>
                            <li><strong>Execute as:</strong> Select <strong>"Me"</strong>.</li>
                            <li><strong>Who has access:</strong> <strong>You must select "Anyone"</strong>.</li>
                        </ul>
                    </li>
                    <li>Click <strong>"Deploy"</strong>.</li>
                </ol>
            </Step>
            <Step num={4} title="Authorize Access and Copy the URL">
                <ol className="list-decimal list-inside space-y-2">
                    <li>An authorization prompt will appear. Click <strong>"Authorize access"</strong> and follow the steps to grant permissions (you may need to click Advanced {'>'} Go to...unsafe).</li>
                    <li>After a successful deployment, you will see a "Deployment successfully" dialog with the <strong>"Web app URL"</strong>.</li>
                    <li><strong>Copy this URL</strong> by clicking the "Copy" button.</li>
                </ol>
            </Step>
        </GuideSection>
        </>
    );

    return (
        <div className="min-h-screen bg-background text-text-primary p-4 sm:p-6 md:p-8 flex items-center justify-center">
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg max-w-5xl mx-auto w-full">
                <div className="flex justify-between items-start mb-4">
                    <h1 className="text-3xl font-bold text-primary-dark">{t('app_title')}</h1>
                    <LanguageToggle variant='minimal'/>
                </div>
                
                {language === 'th' ? thGuide : enGuide}

                <GuideSection title={language === 'th' ? "ขั้นตอนที่ 5: เชื่อมต่อแอปพลิเคชันของคุณ" : "Step 5: Connect Your Application"}>
                    <p>{language === 'th' ? "นำ 'Web app URL' ที่คุณคัดลอกมา ไปวางในช่องด้านล่างแล้วกด 'บันทึกและเชื่อมต่อ'" : "Paste the 'Web app URL' you copied from the Google Apps Script deployment dialog into the field below and click 'Save & Connect'."}</p>
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <input 
                            type="text" 
                            value={scriptUrl}
                            onChange={(e) => setScriptUrl(e.target.value)}
                            placeholder={language === 'th' ? "วาง Web App URL ของคุณที่นี่" : "Paste your Web App URL here"}
                            className="flex-grow appearance-none block w-full px-4 py-3 bg-slate-50 border border-slate-300 placeholder-slate-400 text-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent sm:text-sm transition-all"
                            aria-label="Google Apps Script Web App URL"
                        />
                        <button 
                            onClick={handleSaveUrl} 
                            className="w-full sm:w-auto justify-center py-3 px-6 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:bg-slate-400 transition-all"
                        >
                            {language === 'th' ? 'บันทึกและเชื่อมต่อ' : 'Save & Connect'}
                        </button>
                    </div>
                </GuideSection>

                <GuideSection title="Google Apps Script Code (Code.gs)">
                    <div className="relative">
                        <button
                            onClick={handleCopyCode}
                            className="absolute top-2 right-2 bg-slate-700 text-white text-xs font-semibold py-1 px-3 rounded-md hover:bg-slate-600 transition-all z-10"
                        >
                            {copyButtonText}
                        </button>
                        <pre ref={codeRef} className="bg-slate-800 text-slate-200 p-4 rounded-lg overflow-x-auto text-sm max-h-96">
                            <code>
                                {codeString}
                            </code>
                        </pre>
                    </div>
                </GuideSection>
            </div>
        </div>
    );
};

export default ConnectionSetupPage;
