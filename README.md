# Sur-Realista

> **Territorial Real Estate OS**

Sur-Realista is an operating system for territorial real-estate work. It connects property records, geospatial context, CRM, communications, tasks, documents and market intelligence around the same canonical property objects.

It began with valuation and property-intelligence workflows and evolved into a broader operating model for field and commercial real-estate operations.

<p align="center"><strong>Property → Territory → Contact → Task → Evidence → Decision</strong></p>

---

## What the system connects

| Layer | Purpose |
|---|---|
| **Property** | Canonical property identity and commercial context |
| **Territory** | Coordinates, polygons, neighborhoods and geospatial relationships |
| **Market** | Live listings, comparables and supply context |
| **CRM** | Owners, prospects, contacts and relationship history |
| **Work** | Tasks, follow-up, assignments and field activity |
| **Documents** | Evidence, files and property context |
| **Communications** | Operational outreach tied to the right property/contact |
| **Intelligence** | Valuation, trends, anomalies and decision support |

The objective is to avoid a common failure mode in real-estate software: the same property existing as unrelated records across CRM, maps, listings, documents and valuation tools.

---

## Operating model

```text
TERRITORY / MARKET
        │
        ▼
Canonical property
        │
        ├────► owner / contact
        ├────► live listing
        ├────► neighborhood / polygon
        ├────► documents / evidence
        └────► tasks / communications
                 │
                 ▼
          operational decision
```

---

## Core capabilities

- canonical property and location records;
- geospatial search and territory context;
- property/listing reconciliation;
- market/comparable analysis;
- valuation workflows;
- CRM and contact context;
- operational tasks and follow-up;
- documents and evidence;
- administrative review for ambiguous or duplicate records;
- intelligence views built on canonical data rather than disconnected scraping output.

---

## Product principles

1. **A property should have one canonical identity.**
2. **Location is evidence.** Coordinates, polygons and neighborhood definitions must remain traceable.
3. **A live listing is not automatically a canonical property.** Reconciliation is explicit.
4. **Missing data stays missing.** It is not silently converted to zero or false certainty.
5. **Automation enriches; it does not overwrite source truth without a controlled rule.**
6. **Human review is reserved for ambiguity and consequential decisions.**

---

## Architecture

The current implementation uses Next.js/React/TypeScript with PostgreSQL/Supabase, geospatial data, server-side workflows and cloud deployment.

Private property data, customer information and production credentials are intentionally excluded from public documentation.

---

## Direction

Sur-Realista is best understood as a **territorial real-estate operating system**, not only an automated valuation tool.
