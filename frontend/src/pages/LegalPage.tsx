import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function LegalPage() {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-surface)' }}>
      <Sidebar />
      <main className="grow flex flex-col overflow-hidden">
        <Header title="Legal & Privacy" subtitle="The fine print" />
        <div className="grow overflow-y-auto p-8 max-w-3xl">
          <div className="p-8 rounded-lg space-y-8 text-sm leading-relaxed" style={{ border: "1px solid var(--color-glass-border)", background: "var(--color-surface-1)", color: "var(--color-text-muted)" }}>
            
            <section>
              <h2 className="text-xl font-bold mb-3" style={{ color: "var(--color-text)" }}>1. Terms of Service & Disclaimer</h2>
              <p>
                Welcome to this project! By using this website, you agree to these totally generic terms. 
                <strong> Crucially, you agree that you cannot sue me (Paramveer) or any contributors under any condition.</strong> 
                This is purely a fun, personal project built out of frustration with existing tools. 
                No earnings are being made from this platform as of this moment, and it is provided "AS IS" without any warranties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3" style={{ color: "var(--color-text)" }}>2. Privacy Policy</h2>
              <p>
                We respect your privacy. We use Google OAuth solely to authenticate you and create your session. 
                We store basic profile information (like your name and email) to ensure the application works. 
                Your data is never sold, traded, or used for targeted advertising. Since this is a fun side project, 
                I have absolutely no interest in your personal data beyond making sure your courses and timers save correctly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3" style={{ color: "var(--color-text)" }}>3. Data Ownership</h2>
              <p>
                You own the data you input. If you want it deleted, just let me know. 
                Again, don't sue me if a server crashes and your task list disappears. I recommend keeping a backup of anything mission-critical.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-3" style={{ color: "var(--color-text)" }}>4. Copyright Infringement</h2>
              <p>
                This tool is built for personal academic tracking. Do not use it to store, distribute, or upload copyrighted material that you do not have the right to use. If you believe any content on this site infringes upon your copyright, please reach out so it can be promptly removed. However, given the private nature of the dashboard, you are solely responsible for the data you input.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3" style={{ color: "var(--color-text)" }}>5. Updates to Terms</h2>
              <p>
                I reserve the right to modify, update, or completely rewrite these terms at any time without prior notice. Continued use of the platform after any changes indicates your acceptance of the new terms. Since this is a fun project, I probably won't send out a newsletter when I fix a typo in paragraph two.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}