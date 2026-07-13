import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
    return (
        <div
            className='flex min-h-screen'
            style={{ background: 'var(--color-surface)' }}
        >
            <Sidebar />
            <Outlet />
        </div>
    );
}
