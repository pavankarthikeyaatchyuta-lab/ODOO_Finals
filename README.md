# The Royal Knot — Wedding Operations & Intelligence Platform
### *Enterprise Operations and Financial Management System for Luxury Wedding Agencies*

[![Odoo Version](https://img.shields.io/badge/Odoo-17.0%20%7C%2018.0-714B67?logo=odoo&logoColor=white)](https://www.odoo.com/)
[![License](https://img.shields.io/badge/License-LGPL--3-blue.svg)](LICENSE)
[![Architecture](https://img.shields.io/badge/Architecture-Odoo%20Native%20Add--on-green.svg)]()
[![Database](https://img.shields.io/badge/Database-PostgreSQL-336791?logo=postgresql&logoColor=white)]()

---

## 1. System Overview

**The Royal Knot** is an enterprise management platform built specifically for high-end destination wedding agencies operating in destinations like Jaipur and Udaipur. Planning ~25 luxury multi-day weddings annually—each hosting 400+ guests, coordinating ~18 vendor categories, and managing multi-crore budgets—requires strict operational control and real-time financial tracking.

Rather than a disjointed checklist tool, the platform acts as the core operational and financial backbone, providing unified visibility from initial client enquiry through contract execution, day-of operations, change order approvals, and final vendor reconciliation to season-level profitability analysis.

```
Enquiry ──► Digital Agreement ──► Quote Comparison ──► Auto-Planning ──► Command Centre ──► Reconciliation ──► Season Profit
```

---

## 2. System Architecture

The solution is implemented as a native Odoo add-on module (`royal_knot_wedding`), extending standard Odoo core applications rather than maintaining duplicate subsystems.

### 2.1 High-Level Tiered Architecture

```mermaid
flowchart TD
    subgraph Presentation_Layer["1. Presentation Layer (Odoo Web Client)"]
        UI_Kanban["Kanban Pipelines (Enquiries, Tasks, Vendors)"]
        UI_Matrix["Side-by-Side Quote Comparison Matrix"]
        UI_Command["Live Event Command Centre (Run Sheet)"]
        UI_Dashboard["Founder Season Intelligence Dashboard"]
    end

    subgraph Custom_Module["2. Custom Business Layer (royal_knot_wedding)"]
        M_Wedding["rk.wedding (Master Record & State Machine)"]
        M_Quotes["rk.vendor.quote & rk.quote.line (Procurement)"]
        M_PlanGen["rk.task.generator (25+ Template Engine)"]
        M_RunSheet["rk.run_sheet & rk.vendor.arrival (Operations)"]
        M_Issues["rk.wedding.issue (Incident Management)"]
        M_ChangeOrder["rk.wedding.change.order (Extras Engine)"]
        M_Reconcile["rk.vendor.reconciliation (Financial Control)"]
    end

    subgraph Odoo_Core["3. Odoo Standard Applications Layer"]
        App_CRM["crm.lead (Lead Ingestion & Follow-ups)"]
        App_Contacts["res.partner (Couples, Guests & Vendors)"]
        App_Project["project.project & project.task (Execution)"]
        App_Account["account.move (Invoices, Bills & Payments)"]
        App_Analytic["account.analytic.account (Cost Centers)"]
        App_Timesheet["hr.timesheet (Planner Labor Tracking)"]
        App_Sign["sign.request / Document Gating"]
    end

    subgraph Persistence_Layer["4. Data & Document Persistence Layer"]
        DB[(PostgreSQL Database)]
        DocStore["ir.attachment (Signed Agreements, Floorplans, Bills)"]
    end

    Presentation_Layer --> Custom_Module
    Presentation_Layer --> Odoo_Core
    Custom_Module <--> Odoo_Core
    Custom_Module --> Persistence_Layer
    Odoo_Core --> Persistence_Layer
```

---

### 2.2 Data Architecture & Entity Relationships

The data model unifies operational events and financial obligations under the central `rk.wedding` record, which binds to Odoo's native CRM, Project, and Accounting models.

```mermaid
erDiagram
    RES_PARTNER ||--o{ CRM_LEAD : "submits"
    CRM_LEAD ||--|| RK_WEDDING : "converts_to"
    RK_WEDDING ||--|{ RK_WEDDING_FUNCTION : "has_functions"
    RK_WEDDING ||--|{ RK_GUEST : "manages_guests"
    RK_WEDDING ||--|{ PROJECT_TASK : "spawns_tasks"
    RK_WEDDING ||--|{ RK_VENDOR_QUOTE : "solicits_quotes"
    RK_VENDOR_QUOTE ||--|{ RK_QUOTE_LINE : "itemizes"
    RK_WEDDING ||--|{ RK_WEDDING_VENDOR : "contracts"
    RK_WEDDING ||--|{ RK_RUN_SHEET : "schedules_timeline"
    RK_WEDDING ||--|{ RK_VENDOR_ARRIVAL : "tracks_arrivals"
    RK_WEDDING ||--|{ RK_WEDDING_ISSUE : "logs_incidents"
    RK_WEDDING ||--|{ RK_CHANGE_ORDER : "records_extras"
    RK_WEDDING ||--|{ RK_PAYMENT_MILESTONE : "stages_billing"
    RK_WEDDING ||--|{ ACCOUNT_ANALYTIC_LINE : "posts_costs_and_labor"
```

### 2.3 Model Definitions & Responsibilities

| Model Identifier | Primary Responsibility | Native Odoo Integration |
| :--- | :--- | :--- |
| `rk.wedding` | Master wedding lifecycle, package type, budget, dates, state transitions, financial rollup | Linked to `crm.lead`, `account.analytic.account` |
| `rk.wedding.function` | Multi-day sub-events (Mehendi, Sangeet, Haldi, Varmala, Reception) | Categorizes tasks, vendors, and run sheets |
| `rk.vendor.quote` | Header for multi-vendor proposals with status tracking (`draft`, `submitted`, `selected`, `rejected`) | Inherits from or links to `res.partner` (vendor) |
| `rk.quote.line` | Granular quotation line items (price per plate, extra-hour rates, inclusions) | Standardized unit metrics for side-by-side comparison |
| `rk.wedding.vendor` | Contracted vendors per function; tracks baseline cost, advances disbursed, and remaining dues | Generates `account.move` (vendor bills) |
| `rk.guest` | Guest list tracking: RSVP, dietary requirements (Jain, Vegan, Non-Veg), and function attendance | Links to `res.partner` |
| `rk.venue.layout` | Spatial zone management, seating arrangements, and floor plan file attachments | Integrated with `ir.attachment` |
| `rk.run_sheet` | Chronological minute-by-minute execution run sheet | Grouped by function; references assigned planners |
| `rk.vendor.arrival` | Live vendor check-in monitor (expected vs. actual arrival) with late detection logic | Generates real-time alerts in `rk.wedding` |
| `rk.wedding.issue` | Event-day incident logging, priority scoring, planner assignment, and resolution tracking | Mail thread & chatter enabled |
| `rk.family.movement` | VIP and family coordination protocols (movement between suites, mandap, dining) | Operational cues linked to run sheet timeline |
| `rk.wedding.change.order`| Scope additions (+guests, +DJ hours, +generators) with client approval workflow | Feeds customer invoices and vendor payable adjustments |
| `rk.payment.milestone` | 3-stage payment plan (Booking Deposit, Advance, Final Balance) | Synchronized with `account.move` customer invoices |

---

## 3. Core System Workflows

### 3.1 Enquiry Capture & Agreement Gating Workflow

Guarantees that high-intent leads are captured with complete event specifications and enforces legal compliance before releasing confidential vendor lists or layout designs.

```mermaid
sequenceDiagram
    autonumber
    actor Couple
    actor Planner
    participant CRM as CRM / Enquiry (crm.lead)
    participant Wedding as Wedding Record (rk.wedding)
    participant Sign as Digital Agreement (sign.request)
    participant Catalog as Vendor Directory & Layouts

    Couple->>CRM: Submit enquiry (Date, Jaipur, 400 Guests, Budget, Heritage Theme)
    CRM->>Planner: Auto-assign lead & schedule first consultation
    Planner->>Wedding: Convert qualified Lead to Wedding record
    Wedding->>Sign: Generate standard Service Agreement with payment terms
    Sign->>Couple: Deliver agreement via mobile/email link for digital signature
    Couple->>Sign: E-signs agreement
    Sign->>Wedding: Attach signed PDF; set agreement_signed = True
    Note over Wedding,Catalog: Security Gate: Catalog & Layouts unlocked only when agreement_signed = True
    Planner->>Catalog: Access vendor shortlists and floor plan designer
```

---

### 3.2 3-Way Vendor Procurement & Quote Comparison Workflow

Standardizes inconsistent vendor proposals into an itemized comparison matrix, with automated closure of non-selected bids.

```mermaid
flowchart TD
    A["Wedding Planner creates Catering Requirement (400 Guests)"] --> B["Solicit Proposals from Caterers A, B, and C"]
    B --> C["Enter itemized lines: Price/Plate, Extra Hours, Menu Inclusions"]
    C --> D["Odoo generates Side-by-Side Comparison Matrix"]
    D --> E{"Couple & Planner evaluate options"}
    E -->|"Select Caterer A"| F["Caterer A status updated to 'Selected'"]
    F --> G["Caterer A bound to Wedding as Official Vendor"]
    F --> H["Agreed contract amount locked in Wedding Ledger"]
    E -->|"Auto-Rejection"| I["Caterer B marked 'Rejected / Closed'"]
    E -->|"Auto-Rejection"| J["Caterer C marked 'Rejected / Closed'"]
    I --> K["Automated notification sent to losing vendors"]
    J --> K
```

---

### 3.3 Instant Automated Wedding Planning Workflow

Eliminates manual checklist re-creation by generating package-specific task trees upon confirmed booking deposit payment.

```mermaid
flowchart TD
    A["Client Confirms Proposal"] --> B["Odoo generates Booking Deposit Invoice (e.g. ₹5,00,000)"]
    B --> C["Client completes payment; Invoice marked as 'Paid'"]
    C --> D{"Check Wedding Package Type"}
    
    D -->|"Full-Service Package"| E["Instantiate Full-Service Project Template"]
    E --> F["Generate 25+ Specific Tasks across all stages:"]
    F --> F1["Venue & Decor Selection & Contracting"]
    F --> F2["Theme & Moodboard Design"]
    F --> F3["Catering Menu Finalization & Tasting"]
    F --> F4["Guest List, Invites & Dietary Tracking"]
    F --> F5["Rehearsal (Practice Run) Coordination"]
    F --> F6["Day-Of Logistics & Cleanup"]

    D -->|"Partial / Day-Of Package"| G["Instantiate Day-Of Project Template"]
    G --> H["Generate Execution Tasks:"]
    H --> H1["Schedule & Run Sheet Finalization"]
    H --> H2["Vendor Arrival Coordination"]
    H --> H3["Family Movement Briefing"]
    H --> H4["Event Execution & Cleanup"]

    F --> I["Dynamically anchor task due dates to Wedding Date"]
    H --> I
    I --> J["Assign responsible planner and set Idempotency flag (tasks_generated = True)"]
```

---

### 3.4 Wedding-Day Command Centre & Live Incident Workflow

Provides field coordinators with real-time operational execution tools, monitoring vendor punctuality and tracking live issue resolutions.

```mermaid
sequenceDiagram
    autonumber
    actor Coordinator as Field Coordinator
    participant RunSheet as Minute-by-Minute Run Sheet
    participant Arrival as Vendor Check-In Monitor
    participant IssueLog as Incident Response (rk.wedding.issue)
    actor Planner as Lead Planner

    Coordinator->>RunSheet: Monitor execution timeline (Baraat, Varmala, Pheras, Banquet)
    Coordinator->>Arrival: Log Caterer arrival (On Time) -> Status = Checked In
    Coordinator->>Arrival: DJ fails to check in at scheduled 16:00 -> System flags RED: LATE ALERT
    Coordinator->>IssueLog: Create Incident: 'DJ delayed in transit' (Priority: High)
    IssueLog->>Planner: Alert dispatched to Lead Planner
    Planner->>IssueLog: Contact backup sound vendor, confirm DJ ETA, resequence background audio
    Planner->>IssueLog: DJ arrives -> Mark Incident as 'Resolved'
    Coordinator->>IssueLog: Florist requests extra generator -> Requisition logged & approved for billing
```

---

### 3.5 Change Order, Vendor Settlement & Anti-Duplicate Reconciliation Workflow

Maintains financial integrity when on-site event scopes change, ensuring clients are billed fairly and vendor disbursements are netted accurately against advances.

```mermaid
flowchart TD
    subgraph Day_Of_Scope_Change["1. On-Site Scope Changes"]
        E1["+60 Unexpected Guests at Banquet"]
        E2["+1 Extended DJ Performance Hour"]
        E1 --> CO["rk.wedding.change.order created with unit pricing"]
        E2 --> CO
        CO --> Appr["Client Digital Approval / Authorization"]
    end

    subgraph Dual_Sided_Ledger["2. Dual-Sided Ledger Update"]
        Appr --> Rev["Client Receivables increased by ₹1,65,000"]
        Appr --> Cost["Vendor Payables increased accordingly"]
    end

    subgraph Final_Reconciliation["3. Final Vendor Reconciliation"]
        Cost --> Rec["Match Final Vendor Invoices against Agreed Scope + Extras"]
        Rec --> Net["Calculate: Final Payable = (Agreed Quote + Approved Extras) - Advances Paid"]
        Net --> DupCheck{"Duplicate Payment Check"}
        DupCheck -->|"Advance already cleared"| Safe["Prevent double payout; issue payment for net balance only"]
        DupCheck -->|"Mismatch detected"| Flag["Flag variance for Founder approval"]
    end
```

---

### 3.6 Founder Season Profitability & Intelligence Workflow

Calculates actual accounting profit per wedding by combining client revenue, direct vendor expenses, event-day extras, and internal planner labor timesheets.

$$\mathbf{True\ Wedding\ Profit} = \mathbf{Invoiced\ Revenue} - \left(\mathbf{Vendor\ Final\ Bills} + \mathbf{Approved\ Direct\ Extras} + \mathbf{Planner\ Timesheet\ Labor}\right)$$

```mermaid
flowchart LR
    subgraph Revenue_Streams["Revenues"]
        R1["Package Fixed Fee"]
        R2["Change Orders (+Guests/Hours)"]
    end

    subgraph Cost_Streams["Operational Costs"]
        C1["Contracted Vendor Bills"]
        C2["Approved Incident Extras"]
        C3["Planner Working Hours × Hourly Rate"]
    end

    subgraph Analytic_Engine["Odoo Analytic Engine"]
        R1 & R2 --> RevTotal["Total Client Revenue"]
        C1 & C2 & C3 --> CostTotal["Total Direct & Labor Costs"]
        RevTotal & CostTotal --> Calc["Net Margin Calculation"]
    end

    subgraph Founder_Dashboard["Founder Season Intelligence"]
        Calc --> D1["Wedding-wise Margin & Profit %"]
        Calc --> D2["25-Wedding Season Rollup"]
        Calc --> D3["Vendor Punctuality & Scorecard"]
        Calc --> D4["30/60-Day Cash Flow Forecast"]
    end
```

---

## 4. Package Differentiation: Full-Service vs. Partial / Day-Of

The platform treats Full-Service and Day-Of packages as distinct operational lifecycles sharing a unified data model:

```mermaid
flowchart TD
    subgraph Full_Service_Workflow["Full-Service Wedding Lifecycle (End-to-End Planning)"]
        FS1["Enquiry & Consultation"] --> FS2["Digital Service Agreement"]
        FS2 --> FS3["Theme, Moodboard & Spatial Design"]
        FS3 --> FS4["Venue Booking & Layout Planning"]
        FS4 --> FS5["Multi-Vendor Procurement & Selection"]
        FS5 --> FS6["Guest List, Invitations & Dietary Matrix"]
        FS6 --> FS7["Ceremony Rehearsal (Practice Run)"]
        FS7 --> FS8["Day-Of Command Centre Execution"]
        FS8 --> FS9["Site Clearance & Cleanup Coordination"]
        FS9 --> FS10["Final Vendor Settlement & Season Profit Analysis"]
    end

    subgraph Day_Of_Workflow["Partial / Day-Of Lifecycle (Event Coordination)"]
        DO1["Enquiry & Consultation"] --> DO2["Day-Of Service Agreement"]
        DO2 --> DO3["Client-Provided Schedule Intake"]
        DO3 --> DO4["Vendor Contact & Arrival Briefing"]
        DO4 --> DO5["Minute-by-Minute Run Sheet Finalization"]
        DO5 --> DO6["Family & VIP Movement Protocol Assignment"]
        DO6 --> DO7["Day-Of Command Centre & Incident Resolution"]
        DO7 --> DO8["Site Clearance & Cleanup Verification"]
        DO8 --> DO9["Final Scope Adjustment & Financial Reconciliation"]
    end
```

---

## 5. Technology Stack

| Layer | Component | Specification | Description & Role |
| :--- | :--- | :--- | :--- |
| **Platform** | **Odoo ERP** | Version 17.0 / 18.0 (CE & EE) | Modular ERP backbone providing user management, ORM, and base apps |
| **Backend** | **Python** | Python 3.10+ | Business logic, state machines, automated actions, and reconciliation algorithms |
| **Database** | **PostgreSQL** | PostgreSQL 14+ | Relational data persistence, foreign key integrity, and transactional indexing |
| **ORM** | **Odoo ORM** | Native Python ORM | High-level data models, computed fields, domain filtering, and record constraints |
| **Frontend** | **Odoo Web Client** | XML, QWeb, Jinja2, SCSS | Responsive Forms, Lists, Kanbans, Calendars, and Pivot Views |
| **Interactive UI**| **OWL** | Odoo Web Library (OWL 2.0) | Custom reactive components (Side-by-side Quote Matrix, Run Sheet Cockpit) |
| **Security** | **Odoo Access Rules**| `ir.model.access.csv` + Record Rules | Role-Based Access Control (Planner, Field Coordinator, Finance, Founder) |
| **Documents** | **Attachment Engine**| `ir.attachment` | Storage for signed PDFs, floorplans, vendor invoices, and photo records |
| **Audit & Log** | **Mail Thread** | `mail.thread`, `mail.activity.mixin` | Full audit trail and chatter logging on all quote, contract, and financial changes |
| **Tax Engine** | **Indian Accounting**| GST (18%) / CGST, SGST, IGST | Standard tax structures for catering and event management services |

---

## 6. Custom Module Layout (`royal_knot_wedding`)

```text
royal_knot_wedding/
├── __init__.py
├── __manifest__.py
├── models/
│   ├── __init__.py
│   ├── rk_wedding.py             # Wedding lifecycle master & state engine
│   ├── rk_wedding_function.py    # Sub-events (Mehendi, Sangeet, Haldi, etc.)
│   ├── rk_vendor_quote.py        # RFQ comparison engine & auto-closure
│   ├── rk_quote_line.py          # Line-item pricing, plate costs, extras
│   ├── rk_wedding_vendor.py      # Contracted vendor records & accounts
│   ├── rk_guest.py               # Guest list, RSVP & dietary matrices
│   ├── rk_venue_layout.py        # Spatial layouts & floorplan attachments
│   ├── rk_rehearsal.py           # Practice-run coordination & cue notes
│   ├── rk_run_sheet.py           # Minute-by-minute execution timeline
│   ├── rk_vendor_arrival.py      # Vendor check-in & late detection logic
│   ├── rk_wedding_issue.py       # Live event incident tracking & resolution
│   ├── rk_family_movement.py     # Family & VIP movement instructions
│   ├── rk_change_order.py        # Extras engine (+60 guests, extra hours)
│   ├── rk_payment_milestone.py   # 3-stage billing (Deposit, Advance, Final)
│   └── rk_team_timesheet.py      # Planner labor tracking & cost allocation
├── views/
│   ├── wedding_views.xml         # Master form, tree, kanban, and search views
│   ├── vendor_views.xml          # Vendor directory & Quote Comparison Matrix
│   ├── planning_views.xml        # Guest, Layout, and Rehearsal views
│   ├── operations_views.xml      # Run Sheet, Check-in monitor, Incident board
│   ├── finance_views.xml         # Change orders, bills, milestones & reconciliation
│   ├── dashboard_views.xml       # Founder Season Intelligence dashboard
│   └── menus.xml                 # Hierarchical navigation menu structure
├── security/
│   ├── security.xml              # User groups (Planner, Coordinator, Finance, Founder)
│   └── ir.model.access.csv       # Access permissions per role
├── data/
│   ├── task_templates.xml        # 25+ automated task templates (Full vs Day-Of)
│   └── sequence.xml              # Sequence identifiers (WED/2026/001, etc.)
└── demo/
    └── demo_data.xml             # Complete demo dataset (400-guest Jaipur wedding)
```

---

## 7. Installation & Deployment

### 7.1 Clone into Odoo Add-ons Directory
```bash
cd /path/to/odoo/custom_addons
git clone https://github.com/pavankarthikeyaatchyuta-lab/ODOO_Finals.git royal_knot_wedding
```

### 7.2 Update Configuration
Add the custom addons path to your `odoo.conf`:
```ini
addons_path = /path/to/odoo/addons,/path/to/odoo/custom_addons
```

### 7.3 Install Module
1. Restart the Odoo service:
   ```bash
   python3 odoo-bin -c odoo.conf -u royal_knot_wedding -d royal_knot_db
   ```
2. In the Odoo Web Client, activate **Developer Mode**.
3. Navigate to **Apps** $\rightarrow$ **Update Apps List**.
4. Search for `The Royal Knot` and click **Activate**.
