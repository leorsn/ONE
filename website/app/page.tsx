import Link from "next/link";
import { Navigation } from "./navigation";
import { PhoneFrame } from "./phone-frame";
import { ScrollStory } from "./scroll-story";

export default function Home() {
  return (
    <main>
      <Navigation />

      <section id="top" className="hero">
        <div className="hero-wallpaper" aria-hidden="true" />
        <div className="hero-light hero-light-a" aria-hidden="true" />
        <div className="hero-light hero-light-b" aria-hidden="true" />
        <div className="hero-vignette" aria-hidden="true" />
        <div className="hero-grid" aria-hidden="true" />

        <div id="main-content" tabIndex={-1} className="hero-content shell">
          <p className="eyebrow">A second memory for your life.</p>
          <h1>Your memory,<br /><span>without the maintenance.</span></h1>
          <p className="hero-copy">Capture what matters. Keep its context. Ask for it naturally when you need it again.</p>
          <div className="hero-actions">
            <a className="button button-light" href="#experience">Enter NEVER <span aria-hidden="true">↓</span></a>
            <Link className="text-link" href="/explore">Explore NEVER <span aria-hidden="true">↗</span></Link>
          </div>
          <p className="hero-availability">Made for iPhone <span aria-hidden="true">·</span> App Store launch coming soon</p>
          <div className="hero-note"><span>Capture</span><i /><span>Understand</span><i /><span>Recall</span></div>
        </div>

        <div className="hero-word" aria-hidden="true">NEVER</div>
        <div className="hero-pedestal" aria-hidden="true" />
        <div className="hero-phone-stage" aria-hidden="true"><PhoneFrame variant="aurora" screen="home" /></div>
        <div className="hero-orbit" aria-hidden="true">
          <div className="glass-card memory-card"><span className="micro">CAPTURED</span><strong>Gift idea for Dad</strong><p>Safari · product page · saved with context</p></div>
          <div className="glass-card ask-card"><span className="micro">ASK NEVER</span><p>“What did I save for Dad?”</p><span className="answer">Three memories found.</span></div>
        </div>
        <div className="hero-caption" aria-hidden="true"><span className="world-dot" /><span>Aurora</span><small>Material World 01</small></div>
        <div className="scroll-cue" aria-hidden="true"><span>SCROLL</span><i /></div>
      </section>

      <section id="product" className="section product-section">
        <div className="chapter-line shell"><span>01 / Product</span><span>One continuous memory system.</span></div>
        <div className="shell product-intro reveal">
          <p className="kicker">How NEVER works</p>
          <h2>One scroll.<br />The whole product.</h2>
          <p className="lede">Move through the app as a story. Each section explains one part of the system while the interface changes with you.</p>
        </div>
      </section>

      <ScrollStory />

      <section className="download-section" style={{ minHeight: "100vh" }}>
        <div className="download-bg" aria-hidden="true" />
        <div className="download-vignette" aria-hidden="true" />
        <div className="download-inner shell reveal">
          <span className="wordmark">NEVER</span>
          <p className="kicker kicker-dark">The product story ends here.</p>
          <h2>Now explore the world around it.</h2>
          <p>Material Worlds, memberships, privacy and the deeper product details live in a separate NEVER hub.</p>
          <div className="hero-actions" style={{ justifyContent: "center", marginTop: "34px" }}>
            <Link className="button button-light" href="/explore">Explore NEVER <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="launch-actions">
            <Link href="/explore#worlds">Material Worlds <span aria-hidden="true">↗</span></Link>
            <Link href="/explore#pricing">Pricing <span aria-hidden="true">↗</span></Link>
            <Link href="/explore#privacy">Privacy <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-inner shell">
          <a href="#top" aria-label="Back to top"><span className="wordmark">NEVER</span></a>
          <div className="footer-links"><a href="#experience">Story</a><Link href="/explore">Explore</Link><Link href="/explore#pricing">Pricing</Link></div>
          <span className="copyright">© 2026 NEVER</span>
        </div>
      </footer>
    </main>
  );
}
