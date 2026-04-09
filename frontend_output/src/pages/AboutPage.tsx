import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function AboutPage() {
    return (
        <div className="flex min-h-screen" style={{ background: 'var(--color-surface)' }}>
            <Sidebar />
            <main className="grow flex flex-col overflow-hidden">
                <Header title="About" subtitle="Project Origins" />
                <div className="grow overflow-y-auto p-8 max-w-3xl">
                    <div className="p-8 rounded-lg text-[var(--color-text-muted)] space-y-6" style={{ border: "1px solid var(--color-glass-border)", background: "var(--color-surface-1)", color: "var(--color-text-muted)" }}>
                        <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--color-text)" }}>About Architect</h2>
                        <p>
                            Hi I am <strong>Paramveer</strong>, the creator of this website. It started as a frustration with existing academic tracking tools that lacked precision and structure. I wanted a clinical, structural environment to manage my courses, deadlines, and deep-work sessions without the clutter of modern productivity apps.
                        </p>
                        <p>
                            This system was built to eliminate friction and provide mathematical certainty to your semester planning. I hope you enjoy using it as much as I enjoyed building it.
                        </p>

                        <div className="mt-8 pt-6 border-t border-[var(--color-glass-border)]">
                            <h3 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: "var(--color-text)" }}>Tech Stack</h3>
                            <div className="flex flex-wrap gap-2">
                                {['TypeScript', 'React', 'NPM', 'Drizzle ORM', 'PostgreSQL', 'Neon', 'JavaScript'].map(t => (
                                    <span key={t} className="px-3 py-1 text-xs font-mono rounded-md" style={{ border: "1px solid var(--color-brand)", color: "var(--color-brand)", background: "var(--color-active-bg)" }}>
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-[var(--color-glass-border)]">
                            <h3 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: "var(--color-text)" }}>Links</h3>
                            <ul className="list-disc list-inside space-y-2 text-sm">
                                <li><a href="https://www.linkedin.com/in/paramveer-oberoi-1a930328b/" target='_blank' className="text-blue-400 hover:underline">Linkedin</a></li>
                                <li><a href="https://x.com/Paramveer504" className="text-blue-400 hover:underline" target='_blank'>Twitter / X</a></li>
                                <li><a target='_blank' href="mailto:paramveer25356@iiitd.ac.in" className="text-blue-400 hover:underline">Mail</a></li>
                            </ul>
                        </div>

                        <div className="mt-8 pt-6 border-t border-[var(--color-glass-border)]">
                            <h3 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: "var(--color-text)" }}>Contributors</h3>
                            <ol className="list-disc list-inside space-y-2 text-sm">
                                Tarun:
                                
                                    <li className='pt-4'>
                                        <a target='_blank' href="https://www.linkedin.com/in/tarun-16b46836b/" className="text-blue-400 hover:underline">Linkedin</a>
                                    </li>
                                    <li><a target='_blank' href="mailto:tarun25512@iiitd.ac.in" className="text-blue-400 hover:underline">Mail</a></li>
                                    
                            </ol>
                        </div>
                        <div className='mt-8 pt-6 border-t border-[var(--color-glass-border)]'>
                            If you spot a bug or have a feature request, feel free to reach out to either of us through the provided links, if it's good and doable, we'll consider implementing it :)
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}