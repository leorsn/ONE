"use client";

import { useRef, useState, type ReactNode } from "react";
import { Icon, type IconName } from "./icons";

const steps: { id: string; label: string; icon: IconName; title: string; body: string; points: string[]; plan: string }[] = [
  { id: "capture", label: "Capture", icon: "capture", title: "Save it while it matters.", body: "Share a link or screenshot from another app, scan a document, or write a quick thought. Add context, review the details and keep the original source attached.", points: ["Scan receipts, invoices, tickets and letters", "Extract text from screenshots and documents", "Review dates, amounts and useful details"], plan: "Included in NEVER & NEVER AI" },
  { id: "today", label: "Today", icon: "home", title: "Start with what is relevant.", body: "Today brings your recent captures, upcoming plans and reminders into one view. Open a memory and return to the details you saved with it.", points: ["Recent captures in one place", "Upcoming dates and reminders", "Quick access to Scan, Link and Share"], plan: "Included in NEVER & NEVER AI" },
  { id: "saved", label: "Saved", icon: "organize", title: "A library you can actually use.", body: "Browse your documents, images, links and ideas. Search by text or filter by type to get back to the thing you need.", points: ["Filters for documents, images, links and ideas", "Receipt, invoice and ticket views", "Original content and context stay together"], plan: "Included in NEVER & NEVER AI" },
  { id: "calendar", label: "Calendar", icon: "calendar", title: "Give your plans a place.", body: "Dates captured from your memories belong alongside your plans. Switch between day, week and month, review the details and set local reminders.", points: ["Day, week and month views", "Plans linked to their saved context", "Reminders for the dates that matter"], plan: "Included in NEVER & NEVER AI" },
  { id: "ask", label: "Ask", icon: "recall", title: "Ask the way you think.", body: "With NEVER AI, ask a question across your saved memories. Semantic search finds relevant content, and answers point back to the saved items they use.", points: ["Natural-language questions", "Semantic search and cross-item summaries", "Answers grounded in your saved sources"], plan: "Included in NEVER AI" },
];

export function AppTour({ screens }: { screens: ReactNode[] }) {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  return (
    <section id="experience" className="app-tour shell" aria-labelledby="tour-heading">
      <div className="tour-heading"><p className="kicker kicker-dark">Inside NEVER</p><h2 id="tour-heading">From one capture<br />to your everyday.</h2><p>A closer look at how your memories move through the app.</p></div>
      <div className="tour-tabs" role="tablist" aria-label="Explore the NEVER app">
        {steps.map((step, index) => <button type="button" key={step.id} ref={(element) => { tabs.current[index] = element; }} id={`tour-tab-${step.id}`} role="tab" aria-selected={active === index} aria-controls={`tour-panel-${step.id}`} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={(event) => {
          let next: number;
          if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % steps.length;
          else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index + steps.length - 1) % steps.length;
          else if (event.key === "Home") next = 0;
          else if (event.key === "End") next = steps.length - 1;
          else return;
          event.preventDefault(); setActive(next); tabs.current[next]?.focus();
        }}><Icon name={step.icon} /><span>{step.label}</span>{step.id === "ask" ? <small>AI</small> : null}</button>)}
      </div>
      {steps.map((step, index) => <div className="tour-panel" key={step.id} id={`tour-panel-${step.id}`} role="tabpanel" aria-labelledby={`tour-tab-${step.id}`} tabIndex={0} hidden={active !== index}>
        <div className="tour-copy"><span className="tour-plan">{step.plan}</span><h3>{step.title}</h3><p>{step.body}</p><ul>{step.points.map((point) => <li key={point}><Icon name="check" />{point}</li>)}</ul><a className="text-link" href="#pricing">Compare the plans <span aria-hidden="true">↗</span></a></div>
        <div className="tour-preview"><div className="tour-phone" aria-hidden="true">{screens[index]}</div><span className="preview-caption">Illustrative preview · sample memories</span></div>
      </div>)}
    </section>
  );
}
