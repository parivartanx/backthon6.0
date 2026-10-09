# ROLE & OBJECTIVE

Act as a Senior UI/UX Engineer, Product Designer, and Senior Frontend Engineer specializing in healthcare SaaS, clinical decision-support systems, and premium enterprise dashboards.

Build **Phase 1 — Prescription Intelligence** for AMR-Guard, an antimicrobial resistance (AMR) prescription auditing platform for doctors working in high-volume outpatient departments in India.

This phase must deliver a complete, interactive frontend workflow:

1. Doctor Dashboard
2. New Prescription workspace
3. Prescription image upload : We will do this proper functional in Phase 2 , 
4. Manual prescription text entry : IN Phase 1 we will just create a form to do manual entry . 
5. Patient context form
6. Extracted medicine details
7. Editable clinical verification screen
8. Confirmation before proceeding to Phase 2 — Clinical Audit

Do not build Phase 2 or Phase 3 themselves. Build the Phase 1 handoff cleanly so the next development phase can integrate without redesigning the application.

The result must look like a professionally designed, production-quality medical SaaS product, not a generic admin template.

# 1. TECHNOLOGY STACK

Use the existing project configuration and follow these requirements:

* Framework: Next.js with App Router
* Language: TypeScript with strict typing
* Styling: Tailwind CSS
* UI components: shadcn/ui
* Icons: Lucide React
* Animation: Framer Motion (`motion` package if the project uses the current Motion API; otherwise use the installed Framer Motion package)
* Forms: React Hook Form with Zod validation, if already installed or straightforward to add
* Notifications: shadcn/ui Sonner or the existing toast system
* File handling: Browser-side image preview using object URLs
* State: React state or the existing state-management solution

Before coding:

1. Inspect the existing project structure and package.json.
2. Reuse existing components, dependencies, conventions and design tokens.
3. Do not replace or reinitialize a working Next.js project.
4. Install additional packages only when necessary.
5. Keep components reusable and TypeScript types explicit.

Use Server Components by default and add `"use client"` only to interactive components.

# 2. PRODUCT DESIGN & BRAND IDENTITY

Product name: AMR-Guard

Product descriptor: Clinical Prescription Intelligence

Primary users: Doctors, clinicians and outpatient healthcare professionals.

Product personality:

* Trustworthy
* Clinically precise
* Calm
* Intelligent
* Modern
* Evidence-oriented
* Efficient under time pressure

Avoid:

* Generic AI dashboards
* Excessive gradients
* Glassmorphism everywhere
* Neon colors
* Oversized rounded cards
* Excessive shadows
* Decorative charts with no clinical purpose
* Emoji in place of interface icons
* Unnecessary animations
* Purple-heavy AI aesthetics

## Exact color palette

Use these supplied brand colors as design tokens. Do not replace them with another palette.

* Mint Green: #E2FAD9
* Teal Green: #169781
* Clinical Blue: #0D607B
* Pale Aqua: #C9E9EB
* Icy Blue: #F1F8FC

Recommended semantic usage:

* App background: #F1F8FC
* Main content surfaces: #FFFFFF
* Primary action: #169781
* Primary action hover: a slightly darker shade of #169781
* Page titles and important clinical headings: #0D607B
* Secondary information panels: #C9E9EB, used sparingly
* Positive or completed states: #E2FAD9 with a readable dark foreground
* Borders: subtle blue-gray neutrals
* Main text: dark charcoal or deep blue-gray
* Secondary text: muted slate

Use neutral red and amber semantic colors only when representing real error, warning or attention states. Never use green to imply that a prescription is clinically safe before an actual audit.

Maintain sufficient text contrast. Do not place white text on Mint Green or Pale Aqua.

Define these colors as reusable CSS variables and integrate them with the project's Tailwind and shadcn theme.

# 3. TYPOGRAPHY

**Use Montserrat  and Inter as the preferred interface font. Use Inter if the project already uses it consistently.**

Typography requirements:

* Page title: 26–30px, semibold
* Section headings: 16–20px, semibold
* Body text: 14–15px
* Supporting labels: 12–13px
* Table text: 13–14px
* Form labels: 13–14px, medium weight
* Medicine names and important patient fields: medium or semibold

Use a consistent type scale and comfortable line height.

Avoid oversized marketing-style typography. This is a working clinical application, not a landing page.

# 4. APPLICATION SHELL

Build a desktop-first application with responsive behavior.

## Left sidebar

Create a clean, persistent sidebar approximately 240–260px wide on desktop.

Header:

* AMR-Guard wordmark
* Small shield or activity icon
* Small subtitle: Clinical Intelligence

Navigation:

* Dashboard
* New Prescription
* Audit History
* Guideline Library

For Phase 1:

* Dashboard is the home screen.
* New Prescription is the primary workflow.
* Audit History and Guideline Library may show clearly labelled placeholder states if their functionality is not implemented.

Include a subtle bottom section:

* Current demo user: Dr. Ananya Sharma
* Role: Clinician
* Small avatar or initials

Use Lucide icons, clear active-navigation indicators, keyboard-accessible controls and restrained transitions.

## Top header

Include:

* Current page title or breadcrumb
* Small environment indicator: Demo Workspace
* Optional help icon
* User profile menu

Do not include fake notifications or fabricated real-time clinical system status.

## Main content

* Center the main content in a wide container.
* Use a consistent spacing system.
* Keep medicine tables readable.
* Avoid unnecessary horizontal scrolling at common laptop resolutions.
* Maintain strong visual hierarchy between patient context, prescription details and actions.

# 5. SCREEN 1 — DOCTOR DASHBOARD

Route: `/dashboard`

Build a polished dashboard for a busy outpatient clinician.

## Header

Title: Good morning, Dr. Sharma

Subtitle: Review prescriptions and prepare them for clinical auditing.

Primary CTA:
`+ New Prescription`

The greeting can be static demo content. It does not need to use the real clock.

## Summary cards

Display four compact cards:

1. Prescriptions Processed
2. Awaiting Verification
3. Audits Ready
4. Average Processing Time

Use clearly labelled synthetic demo values.

Mark sample analytics as demo data. Do not imply that these values represent real hospital performance.

Use Lucide icons and restrained accent colors. Avoid large decorative charts.

## Recent prescription activity

Create a table with columns:

* Patient / Case ID
* Prescription Source
* Medicines Detected
* Last Updated
* Status
* Action

Possible statuses:

* Draft
* Extraction Complete
* Needs Verification
* Ready for Audit

Use synthetic patient names or anonymized case IDs.

Add:

* Search input
* Status filter
* Empty state
* Row hover state
* Open action

Clicking a case should open its workflow when the required data exists.

## Quick-start section

Add two entry cards:

A. Upload Prescription
Description: Extract medicine details from a prescription image.

B. Enter Prescription Manually
Description: Enter prescription details directly.

Both must open the same prescription workspace with the appropriate input tab selected.

# 6. SCREEN 2 — NEW PRESCRIPTION WORKSPACE

Route: `/prescriptions/new`

This is the most important screen in Phase 1.

Build a single workspace with clear sections or tabs:

* Upload Image
* Enter Text

Do not build two unrelated pages for these input methods.

At the top, include a workflow progress indicator:

1. Input
2. Verify Details
3. Ready for Audit

The first step is active initially.

## A. Upload Image tab

Build a professional drag-and-drop upload area.

Requirements:

* Drag and drop support
* Browse files button
* Accept JPEG, JPG, PNG and WebP
* Show the selected filename and file size
* Image preview
* Remove or replace image
* Clear unsupported-file and upload errors
* Display a processing state when extraction starts

Keep the upload panel compact and practical.

Include this helper text:

"Upload a clear prescription image. Review all extracted information before clinical auditing."

If an image is selected, show a preview beside or above the patient context section depending on viewport width.

Use browser-side preview only. Revoke generated object URLs when they are no longer needed.

Do not upload patient data to an external service unless a real, explicitly configured backend integration exists.

## B. Enter Text tab

Provide a large multiline text area.

Placeholder:

"Example: Patient presents with fever and cough for 3 days. Prescribed: [medicine name], [dose], [frequency], [duration]..."

Include:

* Character counter
* Clear text action
* Example text button
* Input validation
* Continue to verification button

Example data must be synthetic.

Do not automatically invent missing dosage, diagnosis or patient details.

# 7. PATIENT CONTEXT FORM

Place patient context in a structured form below or beside the input section.

Use responsive cards and grouped fields.

Required fields:

* Patient ID or anonymized case ID
* Age
* Sex, with appropriate options and a prefer-not-to-specify option

Additional fields:

* Pregnancy status: Not applicable, Pregnant, Not pregnant, Unknown
* Known drug allergies
* Relevant medical history
* Presenting symptoms
* Suspected diagnosis, if supplied by the clinician

Use a text area for allergies and relevant medical history if a more complex multi-select would consume too much time.

Validation rules:

* Age must be valid and non-negative.
* Require age, sex and a case identifier before verification.
* Allow uncertain clinical details to remain unknown.
* Do not infer pregnancy status.
* Do not invent a diagnosis from incomplete symptoms.
* Highlight missing fields without inventing values.

Include an explicit unknown option where relevant.

The interface must communicate that patient context is necessary for safe interpretation.

# 8. EXTRACTION INTERACTION

Primary action:
`Extract Prescription Details`

For the prototype, use a deterministic mock extraction adapter if no extraction API is configured.

Implement a clean interface such as:

`extractPrescription(input)`

It should return a typed result object. Keep the extraction implementation separate from UI components so an OCR or multimodal API can be integrated later.

For the demo:

* Use a small set of predefined synthetic prescription examples.
* Parse only fields the mock extractor can reliably recognize.
* Do not pretend that an LLM or OCR API has been called.
* Do not report actual extraction confidence unless a real model provides a calibrated or otherwise documented confidence measure.

When extraction starts:

* Disable duplicate submission.
* Show a compact processing indicator.
* Use short, restrained animations.
* Present success, partial extraction and failure states.
* Handle empty or unreadable inputs.

If extraction fails, preserve the original input and let the user retry or enter details manually.

If an extraction result is partial, label the unresolved fields as "Needs verification."

# 9. SCREEN 3 — EXTRACTED DATA VERIFICATION

Route: `/prescriptions/[id]/verify`

This screen must allow clinicians to verify and edit all extracted fields before the data proceeds to the audit stage.

## Screen header

Title: Verify Prescription Details

Subtitle: Confirm the extracted information before clinical auditing.

Show a case ID and a status badge:
`Awaiting Verification`

Include the workflow progress indicator with step 2 active.

## A. Patient information card

Display editable patient fields:

* Case ID
* Age
* Sex
* Pregnancy status
* Allergies
* Presenting symptoms
* Relevant history
* Suspected diagnosis, if provided

Keep this information compact and easy to scan.

## B. Extracted medicine table

Create a fully editable table with these columns:

* Medicine Name / Brand Name
* Generic Name, if known
* Strength
* Dose
* Route
* Frequency
* Duration
* Verification Status
* Actions

Support:

* Inline editing or an edit dialog
* Add medicine row
* Delete medicine row with confirmation
* Save changes
* Cancel editing
* Empty medicine state
* Field-level validation
* Keyboard accessibility

For the hackathon, a responsive table on desktop and stacked editable cards on mobile is acceptable.

Use realistic synthetic examples, such as a medicine entered by brand name with a separate generic-name field. Never assume brand-to-generic mappings that are not present in the mock dataset or a verified source.

Do not fabricate missing doses or durations.

## C. Verification indicators

Each extracted field may be marked:

* Verified
* Needs Verification
* Missing

These statuses describe data completeness, not clinical safety.

A clinically risky medicine must not be marked safe simply because its details were extracted successfully.

Highlight:

* Missing dose
* Unclear medicine name
* Missing duration
* Unknown route
* Unresolved patient information

Do not block the entire workflow for every unknown optional field. Block confirmation only when required information for the next step is absent, and explain exactly what needs to be corrected.

## D. Prescription source

Keep the original prescription image or entered text accessible through a collapsible panel or side-by-side preview.

The clinician must be able to compare extracted details with the original input.

## E. Bottom action bar

Provide:

Secondary action: `Back to Input`

Primary action: `Confirm & Continue to Audit`

On confirmation:

1. Validate the patient and medicine data.
2. Show a clear validation summary if something required is missing.
3. Save the verified data in application state or the existing data layer.
4. Set the workflow status to `Ready for Audit`.
5. Navigate to a Phase 2 handoff route or a clearly labelled audit-ready state.

Do not implement clinical audit logic in this phase.

# 10. DATA MODEL & COMPONENT ARCHITECTURE

Use reusable TypeScript interfaces.

Suggested data model:

PatientContext:

* caseId
* age
* sex
* pregnancyStatus
* allergies
* symptoms
* medicalHistory
* suspectedDiagnosis

MedicineEntry:

* id
* brandName
* genericName
* strength
* dose
* route
* frequency
* duration
* verificationStatus

PrescriptionCase:

* id
* sourceType
* sourceText
* imagePreviewUrl, if applicable
* patient
* medicines
* workflowStatus
* createdAt
* updatedAt

Use explicit types and a consistent set of enums or union types for statuses.

Suggested reusable components:

* AppSidebar
* AppHeader
* WorkflowStepper
* SummaryStatCard
* PrescriptionUpload
* PrescriptionTextInput
* PatientContextForm
* MedicineTable
* MedicineEditDialog
* VerificationBadge
* EmptyState
* LoadingState
* ValidationSummary
* ConfirmContinueBar

Keep business logic separate from presentation components.

Use a shared prescription-case state or the existing data layer so data survives navigation during the demo.

Do not introduce a large state-management library for a small prototype.

# 11. INTERACTION & ANIMATION

Use Framer Motion only where it improves usability.

Recommended:

* Subtle page transitions
* Fade and slight vertical movement when workflow sections appear
* Tab-content transitions
* Short processing animation
* Small hover transitions on interactive cards
* Animated workflow-step changes

Animation guidelines:

* Typical duration: 150–250ms
* Avoid long transitions that slow down doctors.
* Do not animate every table row.
* Respect `prefers-reduced-motion`.
* Never use animation as the only indicator of status.

Use shadcn/ui components for buttons, inputs, cards, tabs, dialogs, tables, badges, progress indicators and toasts.

All controls must perform real actions. Avoid decorative buttons with no behavior.

# 12. ACCESSIBILITY & CLINICAL USABILITY

* Use semantic HTML and accessible labels.
* Ensure keyboard navigation.
* Provide visible focus indicators.
* Do not rely on color alone for warnings or statuses.
* Use clear validation messages next to the relevant field.
* Ensure text contrast against all brand colors.
* Prevent accidental loss of edited prescription data.
* Ask for confirmation before deleting a medicine.
* Preserve user input when validation or extraction fails.
* Do not display real patient data in seeded demo records.

# 13. RESPONSIVE DESIGN

Prioritize desktop widths around 1366px and 1440px because the application is designed for outpatient clinical workflows.

Also support:

* 1024px tablet/laptop widths
* 768px tablet widths
* 390px mobile widths

At smaller widths:

* Collapse the sidebar into a drawer.
* Stack patient context and prescription panels.
* Convert medicine tables into editable cards.
* Keep primary actions easy to reach.
* Avoid horizontal page overflow.

Do not sacrifice desktop table usability to optimize the mobile layout first.

# 14. ENGINEERING QUALITY

* Use strict TypeScript.
* Avoid `any` unless absolutely unavoidable.
* Avoid duplicated components.
* Keep components reasonably small and readable.
* Add loading, error, empty and success states.
* Do not hardcode mock clinical results throughout the component tree.
* Store synthetic demo cases in a separate fixture or data module.
* Keep routes predictable and navigation functional.
* Ensure forms work, fields are editable and buttons trigger real actions.
* Use consistent design tokens rather than scattered hex values.
* Do not add a fake backend or pretend data is persisted remotely.
* If no backend exists, use a clearly identified client-side demo store and explain its limitations in the README or implementation notes.

# 15. DEFINITION OF DONE

Phase 1 is complete only when all the following work:

1. The dashboard renders correctly.
2. The user can start a new prescription from the dashboard.
3. The user can switch between image upload and text entry.
4. Image selection, preview, removal and file validation work.
5. Patient context can be entered and validated.
6. A synthetic example can be used to demonstrate extraction.
7. Extracted medicine details are displayed in a verification screen.
8. The clinician can edit, add and delete medicine rows.
9. Missing or uncertain fields are clearly identified.
10. The original prescription input remains accessible for comparison.
11. Required validation occurs before confirmation.
12. Confirming the prescription produces an audit-ready state.
13. The workflow works end-to-end without a real OCR or clinical audit API.
14. The design uses the supplied color palette and typography.
15. The interface is responsive, accessible and free from critical console errors.

# FINAL EXECUTION INSTRUCTIONS

First inspect the existing codebase. Then implement the complete Phase 1 workflow in the current project.

Build the shared design system and application shell first, then the dashboard, prescription input, and verification screens.

Prioritize a working end-to-end experience over decorative complexity.

Do not stop after generating a design proposal or static mockup. Implement the actual pages, reusable components, state transitions, forms and interactions.

At completion, provide a concise summary of:

* Screens and routes implemented
* Components created
* Functional interactions
* Mocked functionality versus real integrations
* Any remaining blockers

Do not claim that OCR, medical validation, backend persistence or clinical decision support is operational unless the relevant integration actually exists.
