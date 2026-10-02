import { Icon } from "./icons";

export function EverydayMemories() {
  return (
    <section className="everyday-section" aria-labelledby="everyday-heading">
      <div className="shell">
        <div className="everyday-heading"><div><p className="kicker">Made for the small things.</p><h2 id="everyday-heading">The receipt. The trip.<br />The idea you almost lost.</h2></div><p>A memory is useful when you can get back to it. Keep the original, the details and the next step together.</p></div>
        <div className="everyday-grid">
          <article className="everyday-story story-receipt">
            <div className="story-object receipt-object" aria-hidden="true"><small>CAPTURED DOCUMENT</small><strong>A little coffee break.</strong><div><span>2 × Coffee</span><b>€7.00</b></div><div><span>1 × Croissant</span><b>€3.50</b></div><div className="receipt-total"><span>Total</span><b>€10.50</b></div><p><Icon name="check" /> Original scan attached</p></div>
            <span className="story-number">01 / Documents</span><h3>Less paper.<br />More context.</h3><p>Scan a receipt or invoice, review its extracted text and find the original again in Saved.</p><a href="#experience">Explore Capture <span aria-hidden="true">↗</span></a>
          </article>
          <article className="everyday-story story-travel">
            <div className="story-object travel-object" aria-hidden="true"><small>SAVED PLAN</small><div className="travel-route"><strong>HAM</strong><Icon name="resurface" /><strong>LIS</strong></div><div className="travel-details"><span>DEPARTURE<b>08:10</b></span><span>CONTEXT<b>Flight confirmation</b></span></div><p><Icon name="calendar" /> A plan with its source.</p></div>
            <span className="story-number">02 / Plans</span><h3>The date.<br />And what is behind it.</h3><p>Keep a confirmation, review its date and set a reminder. Your calendar leads back to the saved details.</p><a href="#experience">Explore Calendar <span aria-hidden="true">↗</span></a>
          </article>
          <article className="everyday-story story-ideas">
            <div className="story-object idea-object" aria-hidden="true"><small>ASK NEVER · NEVER AI</small><strong>“What did I save<br />for Dad’s birthday?”</strong><p>Three ideas, with their sources.</p><div><span>Leather weekender</span><span>Vinyl reissue</span><span>Dinner by the Elbe</span></div></div>
            <span className="story-number">03 / Ideas · NEVER AI</span><h3>Remember the thought.<br />Find the source.</h3><p>Save ideas as they happen. With NEVER AI, ask across your memories and follow the sources behind the answer.</p><a href="#pricing">Explore NEVER AI <span aria-hidden="true">↗</span></a>
          </article>
        </div>
        <p className="everyday-note">Illustrative examples with sample content. You review captured details before using them.</p>
      </div>
    </section>
  );
}
