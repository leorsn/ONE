const worlds = [
  { name: "Aurora", className: "world world-aurora", label: "Luminous depth" },
  { name: "Monolith", className: "world world-monolith", label: "Graphite restraint" },
  { name: "Platinum", className: "world world-platinum", label: "Quiet clarity" },
];

function NeverMark() {
  return <span className="wordmark">NEVER</span>;
}

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

function PhoneFrame({ variant = "aurora", screen = "home" }: { variant?: "aurora" | "monolith" | "platinum"; screen?: "home" | "search" | "saved" }) {
  return (
    <div className={`phone-frame phone-${variant}`} aria-label={`NEVER ${screen} preview`}>
      <div className="phone-bezel">
        <div className="dynamic-island" />
        <div className="phone-screen">
          <div className="phone-wallpaper" />
          <div className="phone-ui">
            <div className="phone-status"><span>9:41</span><span>••• ᯤ ▰</span></div>
            {screen === "home" && (
              <>
                <div className="phone-brand">NEVER</div>
                <div className="phone-greeting"><small>YOUR MEMORY</small><h4>Good morning.</h4><p>What do you want to remember?</p></div>
                <div className="phone-ask"><small>ASK NEVER</small><strong>Ask anything you saved.</strong><span>Search your memory →</span></div>
                <div className="phone-capture">Capture something <b>＋</b></div>
                <div className="phone-shortcuts"><span>Scan</span><span>Link</span><span>Share</span></div>
                <div className="phone-list"><small>TODAY</small><div><b>Flight confirmation</b><span>Tomorrow · 08:10</span></div><div><b>Gift idea for Dad</b><span>Saved from Safari</span></div></div>
              </>
            )}
            {screen === "search" && (
              <>
                <div className="phone-title">Search</div>
                <div className="phone-search">Search your memory</div>
                <div className="phone-filters"><span>All</span><span>Links</span><span>Documents</span></div>
                <div className="search-question">“When was the dentist appointment?”</div>
                <div className="search-answer"><small>FROM YOUR MEMORY</small><b>13 October · 14:30</b><p>Appointment confirmation saved from Mail.</p></div>
                <div className="phone-list compact"><small>RELATED</small><div><b>Dental clinic address</b><span>Saved 2 weeks ago</span></div><div><b>Insurance card</b><span>Document</span></div></div>
              </>
            )}
            {screen === "saved" && (
              <>
                <div className="phone-title">Saved</div>
                <div className="phone-filters"><span>All</span><span>Ideas</span><span>Travel</span></div>
                <div className="saved-grid"><div><span>TRAVEL</span><b>Lisbon weekend</b></div><div><span>IDEA</span><b>Dad’s birthday</b></div><div><span>DOC</span><b>Contract notes</b></div><div><span>LINK</span><b>Restaurant list</b></div></div>
              </>
            )}
            <div className="phone-tabs"><span>⌂<small>Home</small></span><span>⌕<small>Search</small></span><span>◇<small>Saved</small></span><span>▦<small>Calendar</small></span><span>⚙<small>Settings</small></span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main>
      <header className="nav shell">
        <a className="brand" href="#top" aria-label="NEVER home"><NeverMark /></a>
        <nav className="nav-links" aria-label="Primary navigation">
          <a href="#product">Product</a>
          <a href="#experience">Experience</a>
          <a href="#worlds">Material Worlds</a>
          <a href="#privacy">Privacy</a>
        </nav>
        <a className="nav-cta" href="#download">Get NEVER <Arrow /></a>
      </header>

      <section id="top" className="hero">
        <div className="hero-wallpaper" aria-hidden="true" />
        <div className="hero-vignette" aria-hidden="true" />
        <div className="hero-content shell reveal">
          <p className="eyebrow">A second memory for your life.</p>
          <h1>Remember less.<br />Keep more.</h1>
          <p className="hero-copy">Send NEVER a screenshot, link, thought, document or plan. It quietly turns what you save into something you can find, understand and use again.</p>
          <div className="hero-actions">
            <a className="button button-light" href="#download">Coming to iPhone</a>
            <a className="text-link" href="#product">Discover NEVER <span>↓</span></a>
          </div>
        </div>
        <div className="hero-phone-stage" aria-hidden="true"><PhoneFrame variant="aurora" screen="home" /></div>
        <div className="hero-orbit" aria-hidden="true">
          <div className="glass-card memory-card"><span className="micro">YOUR MEMORY</span><strong>Everything you meant to keep.</strong><p>One place for the things that would otherwise disappear.</p></div>
          <div className="glass-card ask-card"><span className="micro">ASK NEVER</span><p>“What were the ideas I saved for Dad’s birthday?”</p><span className="answer">NEVER remembers the context.</span></div>
        </div>
      </section>

      <section id="product" className="section section-light">
        <div className="shell product-intro reveal">
          <p className="kicker">Built around memory, not folders.</p>
          <h2>Capture first.<br />Organize later.</h2>
          <p className="lede">NEVER is designed for the moment before information gets lost. Share almost anything into the app, let it understand the context, then return to it through Today, Search, Saved or Ask.</p>
        </div>
        <div className="shell feature-grid">
          <article className="feature feature-capture reveal"><div className="feature-copy"><span className="feature-index">01</span><h3>Capture anything.</h3><p>Screenshots, links, notes, documents and the small things you usually promise yourself you will remember.</p></div><div className="capture-demo" aria-hidden="true"><span>Share to</span><b>NEVER</b><i>Saved</i></div></article>
          <article className="feature feature-ask reveal"><div className="feature-copy"><span className="feature-index">02</span><h3>Ask naturally.</h3><p>Search is useful. Context is better. Ask NEVER about the things you previously saved and get grounded answers from your own memory.</p></div><div className="ask-demo" aria-hidden="true"><span className="ask-label">ASK NEVER</span><p>When was that appointment I saved?</p><div className="ask-response">Tuesday, 13 October · 14:30<br/><small>From your saved appointment confirmation</small></div></div></article>
          <article className="feature feature-today reveal"><div className="feature-copy"><span className="feature-index">03</span><h3>See what matters now.</h3><p>NEVER brings relevant memories back into view instead of turning your life into another archive you have to maintain.</p></div><div className="today-demo" aria-hidden="true"><span>TODAY</span><div><b>Flight confirmation</b><small>Tomorrow · 08:10</small></div><div><b>Gift idea</b><small>Dad’s birthday</small></div></div></article>
        </div>
      </section>

      <section id="experience" className="experience-section">
        <div className="experience-backdrop" aria-hidden="true" />
        <div className="shell experience-head reveal"><p className="kicker kicker-dark">The NEVER experience</p><h2>Designed to disappear<br/>into your day.</h2></div>
        <div className="shell phone-story">
          <div className="story-copy reveal"><span>01 / CAPTURE</span><h3>Save it in seconds.</h3><p>Use the share sheet, scan something physical or capture a thought directly. NEVER keeps the source and context attached.</p></div>
          <div className="story-phone story-phone-a"><PhoneFrame variant="aurora" screen="home" /></div>
          <div className="story-phone story-phone-b"><PhoneFrame variant="monolith" screen="search" /></div>
          <div className="story-copy story-copy-right reveal"><span>02 / RECALL</span><h3>Ask instead of digging.</h3><p>NEVER searches what you actually saved, then answers with the source still visible. No folder archaeology required.</p></div>
          <div className="story-copy reveal"><span>03 / RETURN</span><h3>Your memory, surfaced.</h3><p>Saved ideas, documents and plans stay quiet until they are relevant again — then Today and Saved bring them back into focus.</p></div>
          <div className="story-phone story-phone-c"><PhoneFrame variant="platinum" screen="saved" /></div>
        </div>
      </section>

      <section id="worlds" className="section worlds-section">
        <div className="shell worlds-heading reveal"><div><p className="kicker kicker-dark">Material Worlds</p><h2>Your memory.<br />Your atmosphere.</h2></div><p>NEVER is not skinned with themes. Each Material World changes the atmosphere while preserving the same restrained interface, legibility and hierarchy.</p></div>
        <div className="world-strip">
          {worlds.map((world) => <article className={world.className} key={world.name}><div className="world-shade" /><div className="world-meta"><span>{world.name}</span><small>{world.label}</small></div></article>)}
        </div>
      </section>

      <section id="privacy" className="section privacy-section">
        <div className="privacy-glow" aria-hidden="true" />
        <div className="shell privacy-grid reveal"><div><p className="kicker kicker-dark">Private by design</p><h2>Your memory should still feel like yours.</h2></div><div className="privacy-copy"><p>NEVER is built around explicit capture, transparent account controls and the ability to manage your own stored information. Privacy is treated as product architecture, not footer copy.</p><div className="privacy-points"><span>Clear account controls</span><span>Export and deletion flows</span><span>Grounded recall from your saved content</span></div></div></div>
      </section>

      <section id="download" className="download-section">
        <div className="download-bg" aria-hidden="true" />
        <div className="download-inner shell reveal"><NeverMark /><h2>Keep what matters.<br />Find it when it matters.</h2><p>NEVER is being prepared for iPhone.</p><div className="store-pill" aria-label="App Store coming soon"><span className="apple"></span><span><small>COMING SOON ON THE</small><b>App Store</b></span></div></div>
      </section>

      <footer className="footer shell"><NeverMark /><div className="footer-links"><a href="#product">Product</a><a href="#privacy">Privacy</a><span>© 2026 NEVER</span></div></footer>
    </main>
  );
}
