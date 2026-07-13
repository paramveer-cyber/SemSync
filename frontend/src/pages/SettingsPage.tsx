import { useEffect, useState } from 'react';
import { Database, Info, Palette, SlidersHorizontal } from 'lucide-react';
import Header from '../components/Header';
import AppearanceTab from '../components/settings/AppearanceTab';
import PreferencesTab from '../components/settings/PreferencesTab';
import InfoTab from '../components/settings/InfoTab';
import DataTab from '../components/settings/DataTab';

type SettingsTabId = 'appearance' | 'preferences' | 'info' | 'data';

const SETTINGS_TABS: {
    id: SettingsTabId;
    label: string;
    icon: typeof Palette;
}[] = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
    { id: 'info', label: 'Info', icon: Info },
    { id: 'data', label: 'Data', icon: Database },
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTabId>('appearance');

    useEffect(() => {
        import('../lib/api').then(({ trackPageVisit }) =>
            trackPageVisit('settings').catch(() => {}),
        );
    }, []);

    return (
        <main className='grow flex flex-col'>
            <Header title='Settings' subtitle='Preferences & Configuration' />

            <div
                className='flex items-center gap-1 px-6 pt-4'
                style={{ borderBottom: '1px solid var(--color-glass-border)' }}
            >
                {SETTINGS_TABS.map((tab) => {
                    const isActive = tab.id === activeTab;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className='flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wide cursor-pointer transition-all duration-150'
                            style={{
                                color: isActive
                                    ? 'var(--color-brand)'
                                    : 'var(--color-text-muted)',
                                borderBottom: isActive
                                    ? '2px solid var(--color-brand)'
                                    : '2px solid transparent',
                                marginBottom: '-1px',
                                background: 'transparent',
                            }}
                        >
                            <tab.icon
                                style={{
                                    width: '0.9375rem',
                                    height: '0.9375rem',
                                }}
                            />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {activeTab === 'appearance' && <AppearanceTab />}
            {activeTab === 'preferences' && <PreferencesTab />}
            {activeTab === 'info' && <InfoTab />}
            {activeTab === 'data' && <DataTab />}
        </main>
    );
}
