# Project Compass: A Complete Walkthrough 🧭

This guide explains the project from top to bottom so any new contributor can understand how it works quickly.
No treasure map required, but this is close.

## 1. What This Project Is 🏗️

This repository is a schema-driven form system built with Next.js.

Instead of hardcoding each form in JSX, you define form behavior in schema files. The app reads those schemas and renders:

- form fields
- validation rules
- conditional visibility rules
- submit behavior

## 2. How The App Flows ⚙️

At runtime, the flow is:

1. The app loads available schemas from `src/form-schemas`.
2. A user selects one schema in the home page.
3. `DynamicForm` renders fields from that schema.
4. Validation is generated dynamically using Zod.
5. Rules control whether conditional fields should appear.
6. On submit:
   - success data is stored in session storage
   - toast feedback is shown

## 3. Main Files You Should Know 📁

### App Entry

- `src/app/page.tsx`
  - Home page
  - Schema picker
  - Submit handlers and toast feedback
  - Session storage integration

- `src/app/layout.tsx`
  - Global app shell for App Router

- `src/app/globals.css`
  - Global styles and platform-specific fixes (including iPhone form control behavior)

### Form Engine

- `src/components/dynamic-form/index.tsx`
  - Main form renderer
  - Connects React Hook Form + Zod resolver

- `src/components/dynamic-form/field-factory.tsx`
  - Chooses which input component to render by field type
  - Applies conditional visibility rules

- `src/components/dynamic-form/fields/*`
  - Concrete input components (`text`, `select`, `radio`, etc.)
  - Error state and accessibility wiring

- `src/components/ui/form-field-wrapper.tsx`
  - Shared label/description/error wrapper for form controls

### Schema + Validation Core

- `src/lib/schema-types.ts`
  - Type system for fields, forms, and rule structures

- `src/lib/zod-schema-generator.ts`
  - Converts field schemas into a runtime Zod schema
  - Handles requiredness, patterns, option constraints, and conditional validation

- `src/lib/rule-evaluator.ts`
  - Evaluates field visibility/activation rules
  - Supports both:
    - legacy condition arrays (`AND` behavior)
    - nested JSON rule groups (`all`, `any`, `not`)

### Form Definitions

- `src/form-schemas/*.json`
  - Real form definitions (contact, registration, checkout, etc.)
  - Include field-level messages and form-level success messages

- `src/form-schemas/index.ts`
  - Exposes schema list and lookup map

## 4. Rule System (Important) 🧠

Fields can be conditionally shown/validated based on other fields.

Supported styles:

1. Legacy array style:

```json
[
  { "field": "role", "operator": "eq", "value": "admin" }
]
```

2. Nested JSON style:

```json
{
  "all": [
    { "field": "isLoggedIn", "operator": "eq", "value": true },
    {
      "any": [
        { "field": "role", "operator": "eq", "value": "admin" },
        { "field": "role", "operator": "eq", "value": "support" }
      ]
    }
  ]
}
```

This is evaluated consistently in both rendering and validation.
In short: one source of truth, fewer surprise bugs.

## 5. Validation Behavior ✅

Validation is schema-driven and user-friendly:

- required fields
- min/max and length checks
- regex patterns
- select/radio option safety
- conditional required fields

Errors are shown inline under inputs and also surfaced via a top-level toast summary.
So users get helpful guidance, not cryptic error poetry.

## 6. Submission Behavior 📬

On valid submit:

- data is saved to `sessionStorage` for the current browser session
- user sees success toast text driven by schema `successMessage`

On invalid submit:

- field-level inline messages appear
- a concise global error toast is shown

## 7. Testing Strategy 🧪

Tests are intentionally split by responsibility:

- field component tests
- field factory logic tests
- schema validation generator tests
- rule evaluator tests
- schema integrity tests

Run all tests with:

```bash
npm test -- --run
```

Run lint checks with:

```bash
npm run lint
```

## 8. How To Add A New Form 🛠️

1. Create a JSON file in `src/form-schemas/`.
2. Include `id`, `title`, `successMessage`, and `fields`.
3. Add the import/export in `src/form-schemas/index.ts`.
4. Add/adjust tests if you introduce new behavior.

## 9. Contribution Tips 🤝

- Keep validation messages user-facing, not technical.
- Prefer declarative schema and rule updates over component-level hardcoding.
- Keep UI behavior and Zod behavior aligned (same rules, same expectations).
- If a future-you can understand it in 30 seconds, you did it right.
