"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Icon } from "./icons";

const links = [
  ["Story", "#experience"],
  ["Explore", "/explore"],
  ["Worlds", "/explore#worlds"],
  ["Pricing", "/explore#pricing"],
] as const;

export function Navigation() {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  return (
    <header className="nav shell" data-open={open} onKeyDown={(event) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        menuButton.current?.focus();
      }
    }}>
      <a className="brand" href="#top" aria-label="NEVER home" onClick={() => setOpen(false)}><span className="wordmark">NEVER</span></a>
      <nav className="nav-links" aria-label="Primary navigation">
        {links.map(([label, href]) => href.startsWith("/") ? <Link href={href} key={href}>{label}</Link> : <a href={href} key={href}>{label}</a>)}
      </nav>
      <div className="nav-actions">
        <Link className="nav-cta" href="/explore" onClick={() => setOpen(false)}>Explore NEVER <span aria-hidden="true">↗</span></Link>
        <button ref={menuButton} className="mobile-toggle" type="button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}><Icon name={open ? "close" : "menu"} /></button>
      </div>
      <nav id="mobile-navigation" className="mobile-links" aria-label="Mobile navigation" hidden={!open}>
        {links.map(([label, href], index) => href.startsWith("/") ? <Link href={href} key={href} onClick={() => setOpen(false)}><span>0{index + 1}</span>{label}<span aria-hidden="true">↗</span></Link> : <a href={href} key={href} onClick={() => setOpen(false)}><span>0{index + 1}</span>{label}<span aria-hidden="true">↓</span></a>)}
      </nav>
    </header>
  );
}
