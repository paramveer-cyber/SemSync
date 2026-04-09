import { Link } from 'react-router-dom';
import icon from "/favicon.ico";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}

      <nav className="border-b border-[var(--color-glass-border)] px-6 py-4 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md" style={{ background: "var(--color-sidebar-bg)" }}>
        <Link to="/">
          <div className="flex justify-center items-center">

            <img src={icon} width={40} height={40} />
            <div className="text-xl font-extrabold tracking-widest font-headline uppercase" style={{ color: "var(--color-text)" }}>SEMSYNC</div>
          </div>
        </Link>
        <div className="hidden md:flex space-x-8">
          <a href="#features" className="text-[11px] font-bold text-[var(--color-text-muted)] hover:text-[var(--color-brand)] tracking-widest transition-colors">FEATURES</a>
          <a href="about" className="text-[11px] font-bold text-[var(--color-text-muted)] hover:text-[var(--color-brand)] tracking-widest transition-colors">ABOUT</a>
        </div>
        <Link to="/login" className="px-6 py-2 bg-white text-black  text-[11px] font-bold tracking-widest hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] border border-white transition-all">
          LOGIN
        </Link>
      </nav>

      <main className="grow">
        {/* Hero */}
        <section className="relative min-h-[80vh] flex flex-col justify-center items-center px-6 border-b border-[var(--color-glass-border)] overflow-hidden">
          <div 
            className="absolute inset-0 opacity-20 grayscale contrast-125 pointer-events-none"
            style={{ 
              backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          <div className="relative z-10 max-w-5xl text-center">
            <h1 className="text-7xl text-center font-extrabold tracking-tighter leading-none mb-8 uppercase" style={{ color: "var(--color-text)" }}>
              The Blueprint For Your Academic Success.
            </h1>
            <p className="text-lg md:text-2xl text-[var(--color-text-muted)] max-w-2xl mx-auto mb-12 font-medium">
              A streamlined, minimalist tracker for college students to manage courses, deadlines, and deep-work sessions.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link to="/login" className="px-10 py-4 bg-[var(--color-brand)]  font-bold text-sm tracking-widest hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] border border-[var(--color-brand)] transition-all">
                GET STARTED
              </Link>
            </div>
          </div>
          <div className="absolute bottom-12 left-6 flex items-center space-x-3">
            <div className="w-2 h-2 bg-[var(--color-brand)] animate-pulse"></div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-text-faint)]">SYSTEM STATUS: OPTIMAL</span>
          </div>
        </section>

        {/* Features Bento */}
        <section id="features" className="grid grid-cols-1 md:grid-cols-3 border-b border-[var(--color-glass-border)]">
          <div className="p-12 border-r border-[var(--color-glass-border)] transition-colors group rounded-lg m-2" style={{ background: "var(--color-surface-1)" }}>
            <span className="text-[var(--color-brand)] text-xs font-bold tracking-widest">01</span>
            <h3 className="text-3xl font-bold mt-4 mb-6 uppercase tracking-tight" style={{ color: "var(--color-text)" }}>Weekly Dashboard</h3>
            <p className="text-[var(--color-text-muted)] leading-relaxed text-sm">
              A high-level overview of your academic velocity. Monitor study streaks and upcoming milestones in a single, clinical view.
            </p>
          </div>
          <div className="p-12 border-r border-[var(--color-glass-border)] transition-colors group rounded-lg m-2" style={{ background: "var(--color-surface-1)" }}>
            <span className="text-[var(--color-brand)] text-xs font-bold tracking-widest">02</span>
            <h3 className="text-3xl font-bold mt-4 mb-6 uppercase tracking-tight" style={{ color: "var(--color-text)" }}>Course Management</h3>
            <p className="text-[var(--color-text-muted)] leading-relaxed text-sm">
              Centralize every syllabus, lecture note, and grade. Designed for rigorous information architecture and rapid retrieval.
            </p>
          </div>
          <div className="p-12 transition-colors group rounded-lg m-2" style={{ background: "var(--color-surface-1)" }}>
            <span className="text-[var(--color-brand)] text-xs font-bold tracking-widest">03</span>
            <h3 className="text-3xl font-bold mt-4 mb-6 uppercase tracking-tight" style={{ color: "var(--color-text)" }}>Academic Calendar</h3>
            <p className="text-[var(--color-text-muted)] leading-relaxed text-sm">
              Precision scheduling that eliminates friction. Map out your semester with mathematical certainty and zero clutter.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 text-center px-6" style={{ background: "var(--color-brand)", color: "var(--color-surface)" }}>
          <h2 className="text-5xl md:text-7xl font-extrabold tracking-tighter uppercase mb-8">Begin the Protocol.</h2>
          <p className="text-lg max-w-lg mx-auto mb-12 opacity-80">
            Transform your academic output from chaotic to synchronized. Access the system today.
          </p>
          <Link to="/login" className="px-12 py-4 bg-[var(--color-surface)] text-[var(--color-text)] font-bold tracking-[0.2em] hover:opacity-80 transition-all">
            INITIALIZE SETUP
          </Link>
        </section>
      </main>

      <footer className="border-t border-[var(--color-glass-border)] bg-[var(--color-surface)] px-6 py-8 flex justify-between items-center">
        <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-faint)]">© 2026 SEMSYNC</span>
        <div className="flex space-x-8">
          <a href="/legal" className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-faint)] hover:text-[var(--color-text)]">TERMS</a>
          <a href="/legal" className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-faint)] hover:text-[var(--color-text)]">PRIVACY</a>
          <a href="/legal" className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-faint)] hover:text-[var(--color-text)]">LEGAL</a>
        </div>
      </footer>
    </div>
  );
}
