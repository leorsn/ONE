import { Icon, type IconName } from "./icons";
import { Navigation } from "./navigation";
import { AppTour } from "./app-tour";
import { Pricing } from "./pricing";
import { WorldGallery } from "./world-gallery";
import { worlds, type WorldId } from "./worlds";

const memoryFlow = [
  ["01", "Capture", "Send NEVER a screenshot, link, thought, document or plan."],
  ["02", "Understand", "Source, subject and useful context stay attached to what you saved."],
  ["03", "Organize", "NEVER gives information structure without asking you to maintain folders."],
  ["04", "Recall", "Search or ask naturally instead of remembering where you put something."],
  ["05", "Resurface", "Today brings useful memories back when they matter again."],
];

function NeverMark() {
  return <span className="wordmark">NEVER</span>;
}

function PhoneFrame({ variant = "aurora", screen = "home", className = "" }: { variant?: WorldId; screen?: "home" | "search" | "saved" | "capture" | "calendar"; className?: string }) {
  return (
    <div className={`phone-frame phone-${variant} ${className}`} aria-label={`NEVER ${screen} preview`}>
      <div className="phone-metal" aria-hidden="true" />
      <div className="phone-bezel">
        <div className="dynamic-island" />
        <div className="phone-screen">
          <div className="phone-wallpaper" />
          <div className="phone-glass" aria-hidden="true" />
          <div className="phone-ui">
            <div className="phone-status"><span>9:41</span><span className="phone-indicators"><i className="signal-bars" /><i className="battery" /></span></div>
            {screen === "home" && (
              <>
                <div className="phone-brand">NEVER</div>
                <div className="phone-greeting"><small>YOUR MEMORY</small><h4>Good morning.</h4><p>What do you want to remember?</p></div>
                <div className="phone-ask"><small>NEVER AI · ASK</small><strong>Ask anything you saved.</strong><span>Search your memory →</span></div>
                <div className="phone-capture">Capture something <b>＋</b></div>
                <div className="phone-shortcuts"><span>Scan</span><span>Link</span><span>Share</span></div>
                <div className="phone-list"><small>TODAY</small><div><b>Flight confirmation</b><span>Tomorrow · 08:10</span></div><div><b>Gift idea for Dad</b><span>Saved from Safari</span></div></div>
              </>
            )}
            {screen === "search" && (
              <>
                <div className="phone-title">Ask NEVER</div>
                <div className="phone-search">Ask your memory</div>
                <div className="search-question">“What were the ideas I saved for Dad’s birthday?”<i className="cursor" /></div>
                <div className="search-answer"><small>FROM YOUR MEMORY</small><b>Three ideas saved</b><p>Leather weekender, vinyl reissue, dinner at the place near the Elbe.</p></div>
                <div className="phone-list compact"><small>SOURCES</small><div><b>Gift idea for Dad</b><span>Safari · 4 days ago</span></div><div><b>Restaurant note</b><span>Captured yesterday</span></div></div>
              </>
            )}
            {screen === "saved" && (
              <>
                <div className="phone-title">Saved</div>
                <div className="phone-filters"><span>All</span><span>Ideas</span><span>Travel</span></div>
                <div className="saved-grid"><div><span>TRAVEL</span><b>Lisbon weekend</b></div><div><span>IDEA</span><b>Dad’s birthday</b></div><div><span>DOC</span><b>Contract notes</b></div><div><span>LINK</span><b>Restaurant list</b></div></div>
              </>
            )}
            {screen === "capture" && (
              <>
                <div className="phone-title">Capture.</div>
                <p className="phone-subtitle">One small thing. All its context.</p>
                <div className="phone-capture-types"><span><Icon name="capture" />Scan</span><span><Icon name="phone" />Share</span><span><Icon name="plus" />Note</span></div>
                <div className="phone-review"><small>SCANNED DOCUMENT</small><div className="receipt-preview"><span>NEVER EXAMPLE</span><b>Café receipt</b><i /><p>2 × Coffee <span>€7.00</span></p><p>1 × Croissant <span>€3.50</span></p><strong>Total <span>€10.50</span></strong></div><div className="review-field"><span>Category</span><b>Food & drink</b></div><div className="review-field"><span>Source</span><b>Document scan</b></div><div className="phone-save">Review & save <Icon name="check" /></div></div>
              </>
            )}
            {screen === "calendar" && (
              <>
                <div className="phone-title">Calendar.</div>
                <p className="phone-subtitle">Dates, reminders and plans.</p>
                <div className="phone-calendar"><div className="calendar-date"><strong>9</strong><div><small>FRIDAY</small><b>October</b><span>2026</span></div></div><div className="calendar-days">{["T 8", "F 9", "S 10", "S 11", "M 12", "T 13", "W 14"].map((day, index) => <span className={index === 1 ? "selected" : ""} key={day}><small>{day.split(" ")[0]}</small><b>{day.split(" ")[1]}</b></span>)}</div><div className="calendar-modes"><span>Day</span><span>Week</span><span>Month</span></div></div>
                <div className="phone-list calendar-agenda"><small>TODAY</small><div><b>Flight confirmation</b><span>08:10 · Airport</span></div><div><b>Book Dad’s dinner</b><span>18:00 · Reminder</span></div></div>
                <div className="calendar-note"><Icon name="calendar" /><p>Your plans, connected to<br />the memories behind them.</p></div>
              </>
            )}
            <div className="phone-tabs"><span><Icon name="home" /><small>Today</small></span><span><Icon name="recall" /><small>Ask</small></span><span><Icon name="organize" /><small>Saved</small></span><span><Icon name="calendar" /><small>Calendar</small></span><span><Icon name="settings" /><small>More</small></span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlowCard({ item }: { item: string[] }) {
  return <article className="flow-card"><span className="flow-number">{item[0]}</span><span className="flow-icon"><Icon name={item[1].toLowerCase() as IconName} /></span><h3>{item[1]}</h3><p>{item[2]}</p></article>;
}

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
          <p className="hero-copy">Capture what matters once. NEVER keeps the context, makes it searchable and brings it back when it becomes useful again.</p>
          <div className="hero-actions"><a className="button button-light" href="#download">Coming to iPhone</a><a className="text-link" href="#product">Enter NEVER <span>↓</span></a></div>
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
        <div className="chapter-line shell"><span>01 / Product</span><span>A second memory for your life.</span></div>
        <div className="shell product-intro reveal">
          <p className="kicker">One quiet system.</p>
          <h2>Save it once.<br />Find it forever.</h2>
          <p className="lede">NEVER is built around the full life of a memory — from the instant you capture it to the moment it becomes useful again.</p>
        </div>
        <div className="flow-shell shell">
          <div className="flow-grid">{memoryFlow.map((item) => <FlowCard key={item[1]} item={item} />)}</div>
        </div>
        <div className="shell capture-scene">
          <div className="capture-copy reveal"><span className="sequence-label">CAPTURE → UNDERSTAND → RECALL</span><h3>“Gift idea for Dad”</h3><p>You share one small thing. NEVER keeps the useful context attached, then lets you retrieve it later in ordinary language.</p></div>
          <div className="capture-stage" aria-hidden="true">
            <div className="share-sheet glass-surface"><small>SHARE TO</small><div><span className="mini-mark">N</span><b>NEVER</b><em>Save</em></div><p>Gift idea for Dad</p></div>
            <div className="context-card glass-surface"><small>UNDERSTOOD</small><b>Gift idea</b><p>Dad · birthday · product reference</p></div>
            <div className="answer-card glass-surface"><small>ASK NEVER</small><p>What were my ideas for Dad?</p><b>3 memories found →</b></div>
          </div>
        </div>
      </section>

      <section className="everything-section">
        <div className="everything-light" aria-hidden="true" />
        <div className="chapter-line shell chapter-dark"><span>02 / Recall</span><span>Today · Ask · Saved</span></div>
        <div className="shell everything-grid">
          <div className="everything-copy reveal"><p className="kicker kicker-dark">Everything comes back.</p><h2>Not another archive.<br />A usable memory.</h2><p>Today, Ask and Saved are three views of the same memory system. Different moments. The same context underneath.</p></div>
          <div className="phone-stack" aria-hidden="true">
            <PhoneFrame variant="monolith" screen="saved" className="stack-phone stack-back" />
            <PhoneFrame variant="platinum" screen="search" className="stack-phone stack-mid" />
            <PhoneFrame variant="aurora" screen="home" className="stack-phone stack-front" />
          </div>
        </div>
      </section>

      <AppTour screens={[
        <PhoneFrame variant="aurora" screen="capture" key="capture" />,
        <PhoneFrame variant="aurora" screen="home" key="today" />,
        <PhoneFrame variant="platinum" screen="saved" key="saved" />,
        <PhoneFrame variant="tidal" screen="calendar" key="calendar" />,
        <PhoneFrame variant="monolith" screen="search" key="ask" />,
      ]} />

      <section id="worlds" className="worlds-section">
        <div className="chapter-line shell chapter-dark"><span>03 / Material Worlds</span><span>One product. Six environments.</span></div>
        <div className="worlds-intro shell reveal"><p className="kicker kicker-dark">Material Worlds</p><h2>Not wallpapers.<br />Environments.</h2><p>Each world changes light, density and atmosphere while the product remains unmistakably NEVER.</p></div>
        <WorldGallery panels={worlds.map((world) => (
            <article className={`world-panel world-${world.id}`} key={world.id} aria-label={`${world.name} Material World`}>
              <div className="world-image" aria-hidden="true" />
              <div className="world-scrim" aria-hidden="true" />
              <div className="world-content shell"><span>{world.index} / 06</span><div><h3>{world.name}</h3><p>{world.label}</p></div><small>{world.descriptor}</small></div>
              <div className="world-phone" aria-hidden="true"><PhoneFrame variant={world.id} screen={world.screen} /></div>
            </article>
          ))} />
      </section>

      <section id="privacy" className="privacy-section">
        <div className="privacy-metal" aria-hidden="true" />
        <div className="chapter-line shell chapter-dark"><span>04 / Privacy</span><span>Your memory stays yours.</span></div>
        <div className="shell privacy-grid reveal">
          <div><p className="kicker kicker-dark">Privacy</p><h2>Your memory<br />stays yours.</h2></div>
          <div className="privacy-copy"><p>NEVER is designed around explicit capture and clear control of what you store. You can manage your account, export your data and use deletion controls without turning privacy into a hidden settings exercise.</p><div className="privacy-points"><span><i>01</i> Clear account controls</span><span><i>02</i> Exportable data</span><span><i>03</i> Deletion controls</span><span><i>04</i> Grounded answers from saved content</span></div></div>
        </div>
      </section>

      <Pricing />

      <section id="download" className="download-section">
        <div className="download-bg" aria-hidden="true" />
        <div className="download-vignette" aria-hidden="true" />
        <div className="download-inner shell reveal"><NeverMark /><h2>Keep what matters.</h2><p>Remember less. Keep more.</p><div className="store-pill" aria-label="App Store coming soon"><Icon name="phone" /><span><small>COMING SOON ON THE</small><b>App Store</b></span></div></div>
      </section>

      <footer className="footer"><div className="footer-inner shell"><a href="#top" aria-label="Back to top"><NeverMark /></a><div className="footer-links"><a href="#product">Product</a><a href="#worlds">Worlds</a><a href="#pricing">Pricing</a><a href="#privacy">Privacy</a></div><span className="copyright">© 2026 NEVER</span></div></footer>
    </main>
  );
}
