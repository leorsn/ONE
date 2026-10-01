const worlds = [
  { name: "Aurora", className: "world world-aurora" },
  { name: "Monolith", className: "world world-monolith" },
  { name: "Platinum", className: "world world-platinum" },
];

function NeverMark() {
  return <span className="wordmark">NEVER</span>;
}

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

export default function Home() {
  return (
    <main>
      <header className="nav shell">
        <a className="brand" href="#top" aria-label="NEVER home"><NeverMark /></a>
        <nav className="nav-links" aria-label="Primary navigation">
          <a href="#product">Product</a>
          <a href="#worlds">Material Worlds</a>
          <a href="#privacy">Privacy</a>
        </nav>
        <a className="nav-cta" href="#download">Get NEVER <Arrow /></a>
      </header>

      <section id="top" className="hero">
        <div className="hero-wallpaper" aria-hidden="true" />
        <div className="hero-vignette" aria-hidden="true" />
        <div className="hero-content shell">
          <p className="eyebrow">A second memory for your life.</p>
          <h1>Remember less.<br />Keep more.</h1>
          <p className="hero-copy">
            Send NEVER a screenshot, link, thought, document or plan. It quietly turns what you save
            into something you can find, understand and use again.
          </p>
          <div className="hero-actions">
            <a className="button button-light" href="#download">Coming to iPhone</a>
            <a className="text-link" href="#product">Discover NEVER <span>↓</span></a>
          </div>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <div className="glass-card memory-card">
            <span className="micro">YOUR MEMORY</span>
            <strong>Everything you meant to keep.</strong>
            <p>One place for the things that would otherwise disappear.</p>
          </div>
          <div className="glass-card ask-card">
            <span className="micro">ASK NEVER</span>
            <p>“What were the ideas I saved for Dad’s birthday?”</p>
            <span className="answer">NEVER remembers the context.</span>
          </div>
        </div>
      </section>

      <section id="product" className="section section-light">
        <div className="shell product-intro">
          <p className="kicker">Built around memory, not folders.</p>
          <h2>Capture first.<br />Organize later.</h2>
          <p className="lede">
            NEVER is designed for the moment before information gets lost. Share almost anything into
            the app, let it understand the context, then return to it through Today, Search, Saved or Ask.
          </p>
        </div>

        <div className="shell feature-grid">
          <article className="feature feature-capture">
            <div className="feature-copy">
              <span className="feature-index">01</span>
              <h3>Capture anything.</h3>
              <p>Screenshots, links, notes, documents and the small things you usually promise yourself you will remember.</p>
            </div>
            <div className="capture-demo" aria-hidden="true">
              <span>Share to</span><b>NEVER</b><i>Saved</i>
            </div>
          </article>

          <article className="feature feature-ask">
            <div className="feature-copy">
              <span className="feature-index">02</span>
              <h3>Ask naturally.</h3>
              <p>Search is useful. Context is better. Ask NEVER about the things you previously saved and get grounded answers from your own memory.</p>
            </div>
            <div className="ask-demo" aria-hidden="true">
              <span className="ask-label">ASK NEVER</span>
              <p>When was that appointment I saved?</p>
              <div className="ask-response">Tuesday, 13 October · 14:30<br/><small>From your saved appointment confirmation</small></div>
            </div>
          </article>

          <article className="feature feature-today">
            <div className="feature-copy">
              <span className="feature-index">03</span>
              <h3>See what matters now.</h3>
              <p>NEVER brings relevant memories back into view instead of turning your life into another archive you have to maintain.</p>
            </div>
            <div className="today-demo" aria-hidden="true">
              <span>TODAY</span>
              <div><b>Flight confirmation</b><small>Tomorrow · 08:10</small></div>
              <div><b>Gift idea</b><small>Dad’s birthday</small></div>
            </div>
          </article>
        </div>
      </section>

      <section id="worlds" className="section worlds-section">
        <div className="shell worlds-heading">
          <div>
            <p className="kicker kicker-dark">Material Worlds</p>
            <h2>Your memory.<br />Your atmosphere.</h2>
          </div>
          <p>
            NEVER is not skinned with themes. Each Material World changes the atmosphere while preserving the same restrained interface, legibility and hierarchy.
          </p>
        </div>
        <div className="world-strip">
          {worlds.map((world) => (
            <article className={world.className} key={world.name}>
              <div className="world-shade" />
              <span>{world.name}</span>
            </article>
          ))}
        </div>
      </section>

      <section id="privacy" className="section privacy-section">
        <div className="privacy-glow" aria-hidden="true" />
        <div className="shell privacy-grid">
          <div>
            <p className="kicker kicker-dark">Private by design</p>
            <h2>Your memory should still feel like yours.</h2>
          </div>
          <div className="privacy-copy">
            <p>
              NEVER is built around explicit capture, transparent account controls and the ability to manage your own stored information. Privacy is treated as product architecture, not footer copy.
            </p>
            <div className="privacy-points">
              <span>Clear account controls</span>
              <span>Export and deletion flows</span>
              <span>Grounded recall from your saved content</span>
            </div>
          </div>
        </div>
      </section>

      <section id="download" className="download-section">
        <div className="download-bg" aria-hidden="true" />
        <div className="download-inner shell">
          <NeverMark />
          <h2>Keep what matters.<br />Find it when it matters.</h2>
          <p>NEVER is being prepared for iPhone.</p>
          <div className="store-pill" aria-label="App Store coming soon">
            <span className="apple"></span>
            <span><small>COMING SOON ON THE</small><b>App Store</b></span>
          </div>
        </div>
      </section>

      <footer className="footer shell">
        <NeverMark />
        <div className="footer-links">
          <a href="#product">Product</a>
          <a href="#privacy">Privacy</a>
          <span>© 2026 NEVER</span>
        </div>
      </footer>
    </main>
  );
}
