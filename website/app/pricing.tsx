import { Icon } from "./icons";

const included = ["Capture, Inbox, Today & Saved", "Share links, screenshots and ideas", "Document scanning & text recognition", "Calendar & local reminders", "Automatic categorization & text search", "Cloud sync", "Six Material Worlds & System appearance"];
const aiIncluded = ["Ask NEVER in natural language", "Semantic search across your memories", "Answers with saved-item sources", "Summaries across multiple memories", "Contextual document & receipt analysis"];

export function Pricing() {
  return (
    <section id="pricing" className="pricing-section" aria-labelledby="pricing-heading">
      <div className="chapter-line shell"><span>05 / Membership</span><span>NEVER · NEVER AI</span></div>
      <div className="pricing-intro shell"><div><p className="kicker">Planned launch pricing</p><h2 id="pricing-heading">One memory.<br />Choose how you use it.</h2></div><p>Keep everything organized with NEVER. Add natural-language recall and deeper understanding with NEVER AI.</p></div>
      <div className="pricing-grid shell">
        <article className="price-card" aria-labelledby="plan-never"><span className="plan-label">Your everyday memory</span><h3 id="plan-never">NEVER</h3><p className="plan-description">Save, organize and find what matters.</p><p className="plan-price"><strong>€2.99</strong><span>/ month</span></p><p className="plan-offer">7-day free trial for eligible new subscribers.<br />Then €2.99 per month.</p><a className="button price-button" href="#download">Coming to iPhone <span aria-hidden="true">↗</span></a><span className="included-label">Included</span><ul>{included.map((feature) => <li key={feature}><Icon name="check" />{feature}</li>)}</ul><p className="plan-boundary">Classical search is included. Ask NEVER and AI features are available with NEVER AI.</p></article>
        <article className="price-card price-card-ai" aria-labelledby="plan-never-ai"><span className="plan-label">Your memory, with AI</span><h3 id="plan-never-ai">NEVER <span>AI</span></h3><p className="plan-description">Everything in NEVER. Just ask for more.</p><p className="plan-price"><strong>€4.99</strong><span>/ month</span></p><p className="plan-offer">No free trial.<br />€4.99 per month from purchase.</p><a className="button price-button" href="#download">Coming to iPhone <span aria-hidden="true">↗</span></a><span className="included-label">Everything in NEVER, plus</span><ul>{aiIncluded.map((feature) => <li key={feature}><Icon name="check" />{feature}</li>)}</ul><div className="ai-question"><span>ASK NEVER</span><p>“Which gift ideas did I save for Dad?”</p><small>Recall the ideas — and the context behind them.</small></div></article>
      </div>
      <p className="pricing-note shell">Planned monthly prices for Germany. Final local pricing, availability and trial eligibility are shown in the App Store. Subscriptions renew monthly unless cancelled. Manage or cancel your subscription through your Apple account.</p>
      <div className="faq shell"><div><p className="kicker">A few things to know</p><h3>Before you begin.</h3></div><div className="faq-list">
        <details><summary>Do I need AI to use NEVER?<Icon name="plus" /></summary><p>No. NEVER includes capture, organization, scanning, calendar, reminders, cloud sync and classical search. NEVER AI adds natural-language questions, semantic search and AI analysis.</p></details>
        <details><summary>What can I save?<Icon name="plus" /></summary><p>Notes, ideas, links, screenshots and documents such as receipts, invoices, tickets, reservations and letters. Share from another app, scan a document or capture directly in NEVER.</p></details>
        <details><summary>What is the difference between search and Ask?<Icon name="plus" /></summary><p>Classical search finds saved content by text and filters. Ask NEVER, included in NEVER AI, lets you ask a natural-language question across your memories and receive an answer grounded in your saved sources.</p></details>
        <details><summary>Can I try it before subscribing?<Icon name="plus" /></summary><p>The planned NEVER offer includes a seven-day free trial for eligible new subscribers, followed by €2.99 per month. Apple determines eligibility. NEVER AI has no planned free trial and costs €4.99 per month from purchase.</p></details>
        <details><summary>Is NEVER available yet?<Icon name="plus" /></summary><p>NEVER is coming to iPhone. App Store availability will be announced here. The previews on this page use illustrative memories to explain the experience.</p></details>
      </div></div>
    </section>
  );
}
