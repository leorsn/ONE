"use client";

import { useRef, useState } from "react";
import { Icon } from "./icons";

const links = [
  ["Product", "#product"],
  ["Worlds", "#worlds"],
  ["Privacy", "#privacy"],
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
      <nav className="nav-links" aria-label="Primary navigation">{links.map(([label, href]) => <a href={href} key={href}>{label}</a>)}</nav>
      <div className="nav-actions">
        <a className="nav-cta" href="#download" onClick={() => setOpen(false)}>Get NEVER <span aria-hidden="true">↗</span></a>
        <button ref={menuButton} className="mobile-toggle" type="button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}><Icon name={open ? "close" : "menu"} /></button>
      </div>
      <nav id="mobile-navigation" className="mobile-links" aria-label="Mobile navigation" hidden={!open}>{links.map(([label, href], index) => <a href={href} key={href} onClick={() => setOpen(false)}><span>0{index + 1}</span>{label}<span aria-hidden="true">↗</span></a>)}</nav>
    </header>
  );
}
