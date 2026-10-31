> **Superseded platform specification:** This document predates the agreed standalone React/Vite + Express/Prisma/Supabase stack. Its Odoo technical contracts and implementation roadmap are historical and must not be implemented. Use [backend/INTEGRATION.md](backend/INTEGRATION.md), [backend/openapi.json](backend/openapi.json), and [backend/src/contracts.ts](backend/src/contracts.ts) for Phase 1. Existing visual design references below remain available to Antigravity.

# 🎨 The Royal Knot — Frontend Architecture & UI/UX Plan
### *Phase 0: Frontend Repository Audit & System UI Specification*

---

## 1. Repository Audit Findings

### 1.1 Current Repository Status
* **Repository URL**: `https://github.com/pavankarthikeyaatchyuta-lab/ODOO_Finals`
* **Current Branch**: `main` (clean working tree, up to date with `origin/main` at commit `e71b693`).
* **Existing Files Inspected**:
  * `README.md`: Consolidated technical specification, 4-tier architecture, data model ERD, 8 core modules, and tech stack details.
  * `.git`: Standard Git tracking structures.
* **Findings**:
  * The repository currently contains no pre-existing Odoo custom module code, views, XML files, JavaScript/OWL components, or SCSS stylesheets.
  * There are no obsolete files or broken assets to delete or clean up.
  * The codebase is ready for clean, standards-compliant module scaffolding without risk of overwriting existing functionality.

### 1.2 Target Platform & Frontend Framework
* **Target ERP Platform**: Odoo 17.0 / 18.0 (Community & Enterprise compatible).
* **Frontend Web Framework**: Odoo Web Client with **OWL (Odoo Web Library 2.0)**.
* **Templating Engine**: QWeb (XML-based semantic views and client-side templates).
* **Asset Bundling**: Modern Odoo asset system (`web.assets_backend`).
* **Styling Foundation**: Bootstrap 5.3+ (native to Odoo 17/18) extended with custom SCSS design tokens.
* **Standard View Types Utilized**:
  * `kanban`: Visual pipeline management (Enquiries, Weddings, Tasks, Incidents).
  * `form`: Detailed record management with status bars, smart buttons, and tabbed notebooks.
  * `tree` / `list`: High-density operational overviews (Run Sheet, Guest List, Vendor Bills).
  * `calendar`: Event timelines, function dates, and consultation schedules.
  * `search`: Granular filtering (by wedding, function, package, late status, payment status).
  * `dashboard` / `graph` / `pivot`: Founder executive intelligence and financial rollups.

---

## 2. Luxury Wedding Operations UI/UX Direction

### 2.1 Aesthetic & Design Philosophy
**The Royal Knot** operates in Jaipur and Udaipur, producing multi-crore royal heritage weddings. The UI must balance **regal luxury aesthetics** with **high-density, mission-critical operational clarity**:
* **Atmosphere**: Sophisticated, premium, and calm under operational pressure.
* **Clarity**: High-contrast, unambiguous color codes for event-day execution (a coordinator in the field must spot a late vendor or delay in 0.5 seconds).

### 2.2 Color Tokens & Semantic Palette

```scss
// Royal Knot Brand & Theme Tokens
$rk-royal-navy:    #0D1B2A; // Deep Palace Navy (Primary Headers & Dark Mode accents)
$rk-royal-blue:    #1B3B6F; // Regal Indigo (Action Buttons, Selected States)
$rk-jaipur-gold:   #C5A059; // Heritage Muted Gold (Accents, VIP Badges, Dividers)
$rk-gold-light:    #F7F3E9; // Soft Cream / Champagne (Card backgrounds, active tabs)
$rk-ivory-bg:      #FDFBF7; // Workspace background (Warm, premium off-white)

// Operational Status Tokens
$rk-status-on-time:      #198754; // Emerald Green (On Time, Checked In, Acknowledged)
$rk-status-late-alert:  #DC3545; // Crimson Alert (Late Vendor, Critical Incident, Payment Overdue)
$rk-status-waiting:     #FD7E14; // Marigold / Amber (Waiting for Vendor Ack, Pending Approval)
$rk-status-planning:    #0D6EFD; // Royal Blue (In Planning, Active, Draft)
$rk-status-muted:       #6C757D; // Neutral Grey (Closed, Rejected, Historical)
```

### 2.3 Typography & Information Hierarchy
* **UI & Data Displays**: Clean, modern, highly legible sans-serif font stack (`Inter`, `-apple-system`, `Segoe UI`, `Roboto`).
* **Display Accents & Headings**: Elegant serif accents (`Cinzel` or high-contrast display serif) for the main application banner and milestone headers.
* **Density Rules**:
  * *Day-of Operations (Run Sheet & Check-In)*: Compact, high-density table views optimized for fast scanning on tablets and mobile screens.
  * *Client & Founder Screens*: Spacious, card-based layouts with rich KPIs, progress meters, and visual cards.

---

## 3. Navigation Structure & Page Hierarchy

The application will be anchored under the top-level Odoo App: **The Royal Knot** (`menu_royal_knot_root`).

```
👑 The Royal Knot (Root Menu)
├── 📊 Dashboard
│   ├── Founder Executive Overview (action_rk_dashboard_founder)
│   ├── Season Financials & Margin Rollup (action_rk_dashboard_financials)
│   └── 30/60-Day Cashflow Timeline (action_rk_dashboard_cashflow)
│
├── 💌 Clients & Enquiries
│   ├── All Enquiries (Pipeline Kanban & List)
│   ├── Consultation Calendar (Schedule & Appointments)
│   └── Digital Service Agreements (Agreement Gate & Signed PDFs)
│
├── 🏰 Weddings
│   ├── All Weddings (Kanban by Stage: New -> Confirmed -> Planning -> Day-Of -> Settlement)
│   ├── Full-Service Weddings (Filtered)
│   ├── Partial / Day-Of Weddings (Filtered)
│   └── Wedding Functions (Mehendi, Sangeet, Haldi, Varmala, Reception)
│
├── 🤝 Vendors & Procurement
│   ├── Vendor Directory (Contacts by Category: Caterers, DJs, Decorators, etc.)
│   ├── Requests for Quotation (RFQs)
│   └── 3-Way Quote Comparison Matrix (Side-by-side decision board)
│
├── 📋 Planning & Tasks
│   ├── Wedding Task Board (Kanban by Stage: To Plan -> In Progress -> Done)
│   ├── Guest List & Dietary Matrix (Jain, Pure Veg, Vegan, RSVPs)
│   ├── Venue Layouts & Floorplans (Floor plan attachments & spatial allocations)
│   └── Ceremony Rehearsal (Practice-run schedule & cue notes)
│
├── ⏱️ Live Operations (Command Centre)
│   ├── Minute-by-Minute Run Sheet (Live timeline with current/next cues)
│   ├── Vendor Arrival Cockpit (Check-in status with Red Late Alerts)
│   ├── Timeline Delay & Vendor Acknowledgements (Impact board: Waiting vs Ack)
│   ├── Incidents & Issues (Live tickets: DJ delayed, extra generator, bride car)
│   └── Family Movement Protocols (VIP coordination cues)
│
├── 💳 Finance & Settlement
│   ├── Client Payment Milestones (Booking, Advance, Final settlement)
│   ├── Change Orders / Extras (+60 guests, +1 DJ hour, approval records)
│   ├── Vendor Advances & Final Bills (Ledger per vendor)
│   └── Vendor Final Reconciliation (Anti-duplicate settlement engine)
│
└── 📈 Reports
    ├── Wedding Profit & Loss Summary (Tabular exportable report)
    ├── Vendor Reliability & Punctuality Scorecard
    └── Season-to-Date Review
```

---

## 4. Reusable Frontend Components

To avoid monolithic or repetitive code, the frontend will leverage 6 core modular UI patterns:

### 4.1 Side-by-Side 3-Way Quote Comparison Matrix (`rk_quote_comparison_widget`)
* **Role**: Solves Scenario 2 (Three caterers, one decision).
* **Behavior**: Renders up to 3 competing quotations side-by-side in distinct vertical columns.
* **Attributes Displayed**:
  * Total Price & Calculated Price per Plate.
  * Inclusions & Exclusions list.
  * Extra-Hour Charges & Equipment Rates.
  * Tasting feedback & regional menu tags.
* **Interactive Control**: Dedicated `Select Winning Quote` button that highlights the winner in gold, updates the state to `Selected`, and auto-closes losing bids with animated rejection status.

### 4.2 Live Run Sheet & Execution Cockpit (`rk_run_sheet_cockpit`)
* **Role**: Solves Scenario 4 (Wedding day minute-by-minute execution).
* **Behavior**: Chronological list of events with visual indicator badges:
  * Current active event highlighted with pulsing border.
  * Next upcoming event with countdown timer.
  * Responsible planner badge with instant phone/call trigger.
  * Linked vendors and functional spaces tagged.

### 4.3 Vendor Arrival & Late Alert Badge Component
* **Role**: Instant visual feedback for vendor punctuality.
* **Logic**:
  * `Checked In`: Solid Emerald Green badge with timestamp.
  * `Pending (Within Window)`: Slate Grey badge.
  * `Late (Current Time > Expected Time)`: Flashing Red Alert badge with audio/visual notification.

### 4.4 Timeline Delay & Vendor Acknowledgement Board (`rk_timeline_ack_board`)
* **Role**: Solves Module 5 (Core hackathon differentiator).
* **Behavior**: When an event is delayed (e.g. *Varmala delayed by 25 mins*):
  * Renders a delay banner with revised time.
  * Lists all impacted vendors (Photographer, DJ, Caterer, Family Coordinator) with their specific revised instruction.
  * Displays real-time acknowledgement status pills:
    * 🟢 **Acknowledged** (Received & confirmed).
    * 🟠 **Waiting** (Urgent follow-up needed).

### 4.5 Change Order Authorization Card (`rk_change_order_card`)
* **Role**: Solves Scenario 5 (+60 unexpected guests, +1 extended DJ hour).
* **Behavior**: Shows dual impact on client billing vs. vendor payable in a side-by-side summary box with digital authorization stamp (`Authorized by Family Contact`).

### 4.6 Reconciliation & Anti-Duplicate Shield Widget
* **Role**: Visual financial safety check on final vendor settlement.
* **Behavior**: Visual formula representation:
  $$\text{Contracted} + \text{Approved Extras} - \text{Advance Disbursed} = \mathbf{Net\ Balance\ Payable}$$
  Disables the "Disburse Payment" button and displays a warning banner if the bill exceeds agreed limits or if an advance was already cleared.

---

## 5. Screen-by-Screen Breakdown & Backend Data Contracts Required from Codex

Before developing the XML views and frontend components, the following exact model names, fields, and action methods must be provided by Codex:

### 5.1 Enquiries & Agreement Gating (`crm.lead` / `rk.wedding`)
* **Required Backend Fields**:
  * `partner_id` (Many2one `res.partner`)
  * `wedding_date` (Date)
  * `guest_count` (Integer, default=400)
  * `preferred_theme` (Selection: `royal_heritage`, `palace_luxury`, `beach_chic`, `modern_minimalist`)
  * `budget_max` (Monetary)
  * `package_type` (Selection: `full_service`, `day_of`)
  * `agreement_signed` (Boolean) — **Critical for gating**
  * `agreement_signed_file` (Binary / Attachment)
  * `agreement_signed_date` (Datetime)
* **Required Methods / Actions**:
  * `action_schedule_consultation()`: Opens calendar event creation wizard.
  * `action_generate_agreement()`: Pre-fills and renders the service agreement.
  * `action_sign_agreement()`: Simulates/records digital signature and flips `agreement_signed = True`.

### 5.2 Vendor Quote Comparison (`rk.vendor.quote` & `rk.quote.line`)
* **Required Backend Fields**:
  * `wedding_id` (Many2one `rk.wedding`)
  * `vendor_id` (Many2one `res.partner`)
  * `service_type` (Selection: `catering`, `decor`, `dj_sound`, `photography`, etc.)
  * `state` (Selection: `draft`, `submitted`, `selected`, `rejected`)
  * `price_per_plate` (Monetary)
  * `total_quote_amount` (Monetary, computed)
  * `extra_hour_rate` (Monetary)
  * `menu_inclusions` (Text)
  * `line_ids` (One2many `rk.quote.line`)
* **Required Methods / Actions**:
  * `action_select_winner()`: Sets this quote to `selected`, auto-closes competing quotes for the same service to `rejected`, and creates an `rk.wedding.vendor` record.

### 5.3 Automated Task Generation (`rk.wedding` & `project.task`)
* **Required Backend Fields**:
  * `project_id` (Many2one `project.project`)
  * `tasks_count` (Integer, computed)
  * `task_template_applied` (Boolean)
* **Required Methods / Actions**:
  * `action_generate_wedding_plan()`: Idempotently creates 25+ tasks dynamically anchored to `wedding_date` based on `package_type`.

### 5.4 Live Run Sheet & Arrival Monitor (`rk.run_sheet` & `rk.vendor.arrival`)
* **Required Backend Fields**:
  * `wedding_id` (Many2one `rk.wedding`)
  * `function_id` (Many2one `rk.wedding.function`)
  * `activity_name` (Char)
  * `planned_start_time` (Datetime)
  * `actual_start_time` (Datetime)
  * `state` (Selection: `upcoming`, `in_progress`, `completed`, `delayed`)
  * `vendor_id` (Many2one `res.partner`)
  * `expected_arrival_time` (Datetime)
  * `actual_arrival_time` (Datetime)
  * `is_late` (Boolean, computed: `actual > expected` or `now > expected and not actual`)
* **Required Methods / Actions**:
  * `action_checkin_vendor()`: Records current timestamp as `actual_arrival_time`.

### 5.5 Timeline Delay & Vendor Acknowledgements (`rk.timeline.change` & `rk.vendor.ack`)
* **Required Backend Fields**:
  * `run_sheet_id` (Many2one `rk.run_sheet`)
  * `delay_minutes` (Integer)
  * `revised_time` (Datetime)
  * `affected_vendor_ids` (Many2many `res.partner`)
  * `ack_ids` (One2many `rk.vendor.ack`)
  * `ack_status` (Selection: `waiting`, `all_acknowledged`, computed)
* **Required Methods / Actions**:
  * `action_broadcast_change()`: Dispatches notifications and initializes `Waiting` acknowledgement records.
  * `action_acknowledge_change()`: Flips vendor state from `waiting` to `acknowledged`.

### 5.6 Change Orders & Financial Reconciliation (`rk.wedding.change.order` & `rk.wedding.vendor`)
* **Required Backend Fields**:
  * `wedding_id` (Many2one `rk.wedding`)
  * `vendor_id` (Many2one `res.partner`)
  * `change_description` (Char, e.g. "60 Extra Banquet Guests")
  * `unit_price` (Monetary)
  * `quantity` (Float)
  * `total_change_amount` (Monetary, computed)
  * `approval_state` (Selection: `draft`, `approved`, `rejected`)
  * `approved_by_client` (Boolean)
  * `contracted_amount` (Monetary)
  * `advances_paid` (Monetary)
  * `extras_approved_amount` (Monetary)
  * `final_bill_amount` (Monetary)
  * `balance_due` (Monetary, computed: `contracted + extras - advances_paid`)
* **Required Methods / Actions**:
  * `action_approve_change_order()`: Approves extras, adjusting expected billing and vendor payable.
  * `action_disburse_settlement()`: Verifies anti-duplicate payment constraint and posts final payment.

### 5.7 Founder Season Intelligence (`rk.wedding`)
* **Required Backend Fields**:
  * `total_client_revenue` (Monetary, computed)
  * `total_vendor_cost` (Monetary, computed)
  * `total_labor_cost` (Monetary, computed via timesheets)
  * `net_profit` (Monetary, computed: `revenue - vendor_cost - labor_cost`)
  * `profit_margin_percent` (Float, computed)
  * `vendor_reliability_score` (Float, computed: based on punctuality and incidents)

---

## 6. Frontend Implementation Plan (Phased Roadmap)

| Phase | Frontend Deliverables | Key Views & Files | Dependencies |
| :---: | :--- | :--- | :--- |
| **Phase 0** *(Current)* | Repository audit, UI architecture plan, navigation hierarchy, component definitions, and backend data contracts. | `FRONTEND_ARCHITECTURE_PLAN.md` | None (Audit phase) |
| **Phase 1** | App base structure, top-level menus, brand styling tokens, action definitions, and placeholder views. | `views/menus.xml`, `static/src/scss/theme.scss`, `__manifest__.py` | Module scaffold from Codex |
| **Phase 2** | Client Enquiry pipeline (Kanban/Form), First Consultation Calendar, and Digital Agreement Gate UI with locked states. | `views/crm_lead_views.xml`, `views/agreement_views.xml` | `crm.lead` extensions & agreement fields |
| **Phase 3** | 3-Way Quote Comparison Matrix view, itemized line tables, and interactive "Select Winner" button. | `views/vendor_quote_views.xml` | `rk.vendor.quote` & `action_select_winner` |
| **Phase 4** | Wedding Master Record form with Smart Buttons, Package Switcher, and 25+ Task Kanban with function tags. | `views/wedding_views.xml`, `views/task_views.xml` | `rk.wedding` & `action_generate_wedding_plan` |
| **Phase 5** | Live Command Centre: Minute-by-Minute Run Sheet table, Vendor Arrival Cockpit, Late Alert Badges, Incident Tracker. | `views/run_sheet_views.xml`, `views/issue_views.xml` | `rk.run_sheet`, `rk.vendor.arrival`, `rk.wedding.issue` |
| **Phase 6** | Timeline Delay & Vendor Acknowledgement Dashboard (delay calculation, affected vendor list, `Waiting` vs `Ack` pills). | `views/timeline_change_views.xml` | `rk.timeline.change`, `rk.vendor.ack` |
| **Phase 7** | Change Order Entry Form (+60 guests, +DJ hours), Client/Vendor dual-sided ledger view, and Final Reconciliation shield. | `views/change_order_views.xml`, `views/finance_views.xml` | `rk.wedding.change.order`, `account.move` |
| **Phase 8** | Founder Season Intelligence Dashboard: Profit KPI cards, 25-wedding performance matrix, cashflow forecast timeline. | `views/dashboard_views.xml` | Computed profit & season aggregation methods |

---

## 7. Quality & Verification Standards

To uphold the project's quality instructions:
1. **Zero Fake Functionality**: No buttons that trigger empty handlers. Every action will bind to a verified backend method.
2. **Dynamic UI Gating**: The Agreement Gate will programmatically evaluate `agreement_signed` to show/hide sensitive vendor tabs using standard Odoo `<field name="agreement_signed" invisible="1"/>` and `invisible="not agreement_signed"` attributes.
3. **Responsive Operations**: High-density layouts will be optimized for tablet and desktop viewports to ensure seamless on-site usability during fast-moving events.
4. **Non-Destructive Git Discipline**: All frontend code will be added iteratively to `main` without modifying or deleting backend work.
