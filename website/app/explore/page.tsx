import Link from "next/link";
import type { Metadata } from "next";
import { Navigation } from "../navigation";
import { Icon } from "../icons";
import { MaterialWorldPhone } from "../material-world-phone";
import { Pricing } from "../pricing";
import { WorldGallery } from "../world-gallery";
import { worlds } from "../worlds";

export const metadata: Metadata = { title: "Explore NEVER — Worlds & Membership", alternates: { canonical: "/explore" }, openGraph: { url: "/explore", title: "Explore NEVER — Worlds & Membership" } };

export default function ExplorePage() {
  return (
    <main>
      <Navigation explore />

      <section className="section product-section" style={{ paddingTop: "180px", minHeight: "72vh" }}>
        <div id="main-content" tabIndex={-1} className="shell product-intro explore-intro reveal">
          <p className="kicker">Explore NEVER</p>
          <h1 style={{ fontSize: "clamp(44px, 9vw, 128px)", lineHeight: ".9", letterSpacing: "-.065em", margin: 0 }}>
            One memory.<br /><span style={{ opacity: .55 }}>Your environment.</span>
          </h1>
          <p className="lede" style={{ marginTop: "32px" }}>
            Choose your environment. Compare memberships. Get to know the controls behind your personal memory.
          </p>
          <div className="hero-actions" style={{ marginTop: "36px" }}>
            <a className="button button-light" href="#worlds">Explore Material Worlds <span aria-hidden="true">↓</span></a>
            <a className="text-link" href="#pricing">Compare plans <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </section>

      <section id="worlds" className="worlds-section">
        <div className="chapter-line shell chapter-dark"><span>01 / Material Worlds</span><span>One product. Six environments.</span></div>
        <div className="worlds-intro shell reveal"><p className="kicker kicker-dark">Material Worlds</p><h2>Not wallpapers.<br />Environments.</h2><p>Each world changes light, density and atmosphere while the product remains unmistakably NEVER.</p></div>
        <WorldGallery panels={worlds.map((world) => (
          <article className={`world-panel world-${world.id}`} key={world.id} aria-label={`${world.name} Material World`}>
            <div className="world-image" aria-hidden="true" />
            <div className="world-scrim" aria-hidden="true" />
            <div className="world-content shell"><span>{world.index} / 06</span><div><h3>{world.name}</h3><p>{world.label}</p></div><small>{world.descriptor}</small></div>
            <div className="world-phone" aria-hidden="true"><MaterialWorldPhone world={world.id} /></div>
          </article>
        ))} />
      </section>

      <Pricing />

      <section id="privacy" className="privacy-section">
        <div className="privacy-metal" aria-hidden="true" />
        <div className="chapter-line shell chapter-dark"><span>03 / Privacy</span><span>Your memory stays yours.</span></div>
        <div className="shell privacy-grid reveal">
          <div><p className="kicker kicker-dark">Privacy</p><h2>Your memory<br />stays yours.</h2></div>
          <div className="privacy-copy"><p>NEVER is designed around explicit capture and clear control of what you store. Account, export and deletion controls remain visible parts of the product.</p><div className="privacy-points"><span><i>01</i> Clear account controls</span><span><i>02</i> Exportable data</span><span><i>03</i> Deletion controls</span><span><i>04</i> Grounded answers from saved content</span></div></div>
        </div>
      </section>

      <section id="download" className="download-section">
        <div className="download-bg" aria-hidden="true" />
        <div className="download-vignette" aria-hidden="true" />
        <div className="download-inner shell reveal">
          <span className="wordmark">NEVER</span>
          <h2>Keep what matters.</h2>
          <p>Your everyday memory. In a world of your own.</p>
          <div className="store-pill" aria-label="App Store coming soon"><Icon name="phone" /><span><small>COMING SOON ON THE</small><b>App Store</b></span></div>
          <p className="launch-note">NEVER is in development. The download link will appear here at launch.</p>
          <div className="launch-actions"><Link href="/">Replay the story <span aria-hidden="true">↗</span></Link><a href="#pricing">Compare memberships <span aria-hidden="true">↗</span></a></div>
        </div>
      </section>

      <footer className="footer"><div className="footer-inner shell"><Link href="/"><span className="wordmark">NEVER</span></Link><div className="footer-links"><a href="#worlds">Worlds</a><a href="#pricing">Pricing</a><a href="#privacy">Privacy</a></div><span className="copyright">© 2026 NEVER</span></div></footer>
    </main>
  );
}

