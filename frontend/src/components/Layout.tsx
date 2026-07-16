import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
    return (
        <div
            className='flex min-h-screen'
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
            <Sidebar />
            <main id='main-content' className='grow flex flex-col'>
                <Outlet />
            </main>
        </div>
    );
}
