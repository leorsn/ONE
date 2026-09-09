# ONE — Product Strategy

## Core principle

Capture first. Organize automatically. Recall by asking ONE.

ONE is designed as a personal digital memory, not just a task manager.

## Core V1 capabilities

- Universal inbox for tasks, appointments, reminders, notes, links, ideas, travel and shopping
- Calendar and local reminders
- Saved items and search
- Share to ONE from other apps
- Screenshot and document OCR
- Scan to ONE for receipts, invoices, letters, tickets, reservations and other documents
- Private cloud sync with Supabase
- Semantic recall and Ask ONE
- Automatic light/dark appearance

## Product tiers

### ONE — 2.99 EUR/month

Billing model:

- 7-day free trial for eligible new subscribers
- 2.99 EUR/month after the trial
- auto-renews monthly unless cancelled
- trial is configured as an App Store introductory free-trial offer

A complete non-AI organization product:

- Capture / Inbox
- Calendar
- Reminders
- Saved
- Share to ONE
- Scan to ONE
- Receipt and screenshot OCR
- Basic automatic categorization
- Cloud sync
- Classical search

Possible later annual price: 24.99 EUR/year. Monthly launch pricing remains the priority.

### ONE AI — 4.99 EUR/month

Billing model:

- no free trial
- charged immediately at purchase
- auto-renews monthly unless cancelled
- ranked above ONE in the same App Store subscription group so upgrades take effect immediately

Includes everything in ONE plus:

- Ask ONE
- Natural-language questions over personal memory
- Semantic search
- Answers grounded in saved items
- Summaries across multiple saved items
- Contextual document and receipt analysis
- Cross-item reasoning, for example:
  - "How much did I spend on clothes this month?"
  - "Which gift ideas did I save for Dad?"
  - "Show me all invoices over 500 EUR."
  - "What did I save about Barcelona?"

Possible later annual price: 39.99 EUR/year. Monthly launch pricing remains the priority.

## AI cost principle

Do not call a large language model for every action.

Preferred flow:

1. Parse and classify locally when possible.
2. Run OCR on-device.
3. Use inexpensive semantic retrieval to find the most relevant items.
4. Send only a small relevant context set to an LLM when a generated answer is actually needed.

This keeps ONE AI economically viable at 4.99 EUR/month.

## Scan to ONE

Scan to ONE is a core product capability.

Typical inputs:

- receipts
- invoices
- letters
- contracts
- tickets
- reservations
- business cards
- shipping receipts

The app should extract structured information such as:

- merchant / sender
- date
- total amount
- currency
- category
- location
- URLs
- email addresses
- phone numbers
- relevant text

The Inbox should eventually expose quick actions such as:

- Scan
- Share
- Ask

## Positioning

ONE:
"I save and organize everything for you."

ONE AI:
"Just ask me what you need."

Primary long-term USP:

"Don't remember where you saved something. Ask ONE."
