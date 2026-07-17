import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div
            className='flex h-screen overflow-hidden'
            style={{ background: 'var(--color-surface)' }}
        >
            <a
                href='#main-content'
                className='sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg'
                style={{
                    background: 'var(--color-surface-2)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-brand)',
                }}
            >
                Skip to main content
            </a>
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
            {isSidebarOpen && (
                <div
                    className='fixed inset-0 z-30 lg:hidden'
                    style={{ background: 'rgba(0,0,0,0.6)' }}
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
            <main
                id='main-content'
                className='grow flex flex-col min-w-0 min-h-0 overflow-y-auto'
            >
                <button
                    type='button'
                    onClick={() => setIsSidebarOpen(true)}
                    aria-label='Open navigation menu'
                    className='lg:hidden flex items-center gap-2 px-4 py-4 shrink-0'
                    style={{
                        color: 'var(--color-text)',
                        borderBottom: '1px solid var(--color-glass-border)',
                    }}
                >
                    <Menu className='w-6 h-6' />
                    <span className='text-base font-semibold font-headline'>
                        SEMSYNC
                    </span>
                </button>
                <Outlet />
            </main>
        </div>
    );
}
