import Link from 'next/link'
import { Fraunces, DM_Sans } from 'next/font/google'

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-clinic-display',
})

const sans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-clinic-sans',
})

const features = [
  {
    title: 'Book in minutes',
    body: 'Choose a doctor, pick a time, and confirm — without phone queues or paper forms.',
  },
  {
    title: 'Role-aware consoles',
    body: 'Patients, doctors, and admins each get a focused workspace with the right controls.',
  },
  {
    title: 'Secure by design',
    body: 'Supabase Auth, Row Level Security, and hardened API routes protect clinical data.',
  },
  {
    title: 'Live appointment status',
    body: 'Track pending, confirmed, completed, or cancelled visits from any device.',
  },
]

const team = [
  { name: 'Gold Hoang', role: 'Product & Full-stack', note: 'Architecture, Auth, and delivery' },
  { name: 'Clinic Ops', role: 'Domain partner', note: 'Workflows for real appointment desks' },
  { name: 'Care Team', role: 'Pilot users', note: 'Feedback from doctors and front desk' },
]

export default function LandingPage() {
  return (
    <div className={`${display.variable} ${sans.variable} clinic-landing min-h-screen text-slate-900`}>
      <header className="clinic-nav">
        <div className="clinic-shell clinic-nav-inner">
          <Link href="/" className="clinic-brand">
            <span className="clinic-brand-mark" aria-hidden>
              C
            </span>
            <span className="clinic-brand-text">Clinic Booking</span>
          </Link>
          <nav className="clinic-nav-links" aria-label="Primary">
            <a href="#features">Features</a>
            <a href="#product">Product</a>
            <a href="#team">Team</a>
          </nav>
          <div className="clinic-nav-actions">
            <Link href="/login" className="clinic-btn clinic-btn-ghost">
              Sign in
            </Link>
            <Link href="/register" className="clinic-btn clinic-btn-solid">
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <section className="clinic-hero" aria-label="Introduction">
        <div className="clinic-hero-media" aria-hidden>
          <div className="clinic-hero-gradient" />
          <div className="clinic-hero-pattern" />
        </div>
        <div className="clinic-hero-veil" aria-hidden />
        <div className="clinic-shell clinic-hero-copy">
          <p className="clinic-hero-eyebrow">Clinic Booking System</p>
          <h1>Care scheduling, built for clarity.</h1>
          <p className="clinic-hero-lede">
            A modern appointment platform for patients, doctors, and clinic admins — fast to book,
            easy to manage, secure end to end.
          </p>
          <div className="clinic-hero-cta">
            <Link href="/register" className="clinic-btn clinic-btn-solid clinic-btn-lg">
              Get started
            </Link>
            <Link href="/login" className="clinic-btn clinic-btn-light clinic-btn-lg">
              Sign in to console
            </Link>
          </div>
        </div>
      </section>

      <section id="features" className="clinic-section">
        <div className="clinic-shell">
          <h2 className="clinic-h2">Everything a busy clinic needs</h2>
          <p className="clinic-lede">
            One product surface for booking, clinical follow-through, and administrative control.
          </p>
          <div className="clinic-feature-grid">
            {features.map((f) => (
              <article key={f.title} className="clinic-feature">
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="product" className="clinic-band">
        <div className="clinic-shell clinic-band-inner">
          <div>
            <h2 className="clinic-h2 clinic-h2-light">From first visit to follow-up</h2>
            <p className="clinic-band-copy">
              Patients self-serve appointments. Doctors update status in one place. Admins oversee
              users and the full schedule — without spreadsheet chaos.
            </p>
          </div>
          <div className="clinic-band-actions">
            <Link href="/register" className="clinic-btn clinic-btn-solid">
              Create account
            </Link>
            <Link href="/login" className="clinic-btn clinic-btn-light">
              Open console
            </Link>
          </div>
        </div>
      </section>

      <section id="team" className="clinic-section">
        <div className="clinic-shell">
          <h2 className="clinic-h2">Built with operators in mind</h2>
          <p className="clinic-lede">
            Shaped by real clinic workflows — not a generic dashboard template.
          </p>
          <div className="clinic-team-grid">
            {team.map((m) => (
              <article key={m.name} className="clinic-team-card">
                <div className="clinic-avatar" aria-hidden>
                  {m.name.slice(0, 1)}
                </div>
                <h3>{m.name}</h3>
                <p className="clinic-team-role">{m.role}</p>
                <p>{m.note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="clinic-footer">
        <div className="clinic-shell clinic-footer-grid">
          <div>
            <div className="clinic-brand clinic-brand-footer">
              <span className="clinic-brand-mark">C</span>
              <span className="clinic-brand-text">Clinic Booking</span>
            </div>
            <p className="clinic-footer-blurb">
              Appointment software for modern clinics — secure, role-aware, and ready to grow.
            </p>
          </div>
          <div>
            <h4>Explore</h4>
            <ul>
              <li>
                <a href="#features">Features</a>
              </li>
              <li>
                <Link href="/login">Sign in</Link>
              </li>
              <li>
                <Link href="/register">Sign up</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Connect</h4>
            <div className="clinic-socials" aria-label="Social links">
              <a href="https://github.com/goldhoang" target="_blank" rel="noreferrer" aria-label="GitHub" title="GitHub">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.1-.75.08-.74.08-.74 1.22.09 1.86 1.25 1.86 1.25 1.08 1.85 2.83 1.32 3.52 1.01.11-.78.42-1.32.77-1.62-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.62-2.81 5.64-5.49 5.94.43.37.82 1.1.82 2.22 0 1.6-.01 2.89-.01 3.28 0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z"/></svg>
              </a>
              <a href="mailto:goldhoang.work@gmail.com" aria-label="Email" title="Email">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5L4 8V6l8 5 8-5v2z"/></svg>
              </a>
              <a href="https://www.linkedin.com/in/goldhoang" target="_blank" rel="noreferrer" aria-label="LinkedIn" title="LinkedIn">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.73V1.73C24 .77 23.21 0 22.23 0z"/></svg>
              </a>
              <a href="https://www.facebook.com/goldhoang.me" target="_blank" rel="noreferrer" aria-label="Facebook" title="Facebook">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M22.68 0H1.32C.59 0 0 .6 0 1.33v21.34C0 23.4.59 24 1.32 24h11.5v-9.29H9.69V11.1h3.13V8.41c0-3.1 1.89-4.79 4.66-4.79 1.33 0 2.47.1 2.8.14v3.24h-1.92c-1.5 0-1.8.72-1.8 1.77v2.32h3.59l-.47 3.61h-3.12V24h6.12c.73 0 1.32-.6 1.32-1.33V1.33C24 .6 23.41 0 22.68 0z"/></svg>
              </a>
              <a href="https://goldhoang.dev" target="_blank" rel="noreferrer" aria-label="Portfolio" title="Portfolio">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm7.9 9h-3.17a15.5 15.5 0 0 0-1.35-5.3A8.03 8.03 0 0 1 19.9 11zM12 4.06c.9 1.23 1.6 2.95 1.98 4.94H10.02C10.4 7.01 11.1 5.29 12 4.06zM4.1 13h3.17c.2 1.9.7 3.68 1.35 5.3A8.03 8.03 0 0 1 4.1 13zm3.17-2H4.1a8.03 8.03 0 0 1 4.52-5.3A15.5 15.5 0 0 0 7.27 11zM12 19.94c-.9-1.23-1.6-2.95-1.98-4.94h3.96c-.38 1.99-1.08 3.71-1.98 4.94zM14.38 13H9.62a13.9 13.9 0 0 1-1.3-5h7.36a13.9 13.9 0 0 1-1.3 5zm1.18 5.3A15.5 15.5 0 0 0 16.73 13h3.17a8.03 8.03 0 0 1-4.34 5.3z"/></svg>
              </a>
            </div>
          </div>
        </div>
        <div className="clinic-shell clinic-footer-copy">
          <p className="text-center">© {new Date().getFullYear()} Clinic Booking · <a href="https://goldhoang.dev"><strong>Gold Hoang</strong></a> · MIT License</p>
        </div>
      </footer>
    </div>
  )
}
