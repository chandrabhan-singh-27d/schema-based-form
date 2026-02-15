# Changelog

All notable changes to this project are documented here.

## 2026-02-15

### Major Architecture
- Refactored forms into clean architecture layers under `src/features/forms`:
  - `domain` (core types, rule evaluation)
  - `application` (ports, use-cases, schema/validation service)
  - `infrastructure` (session storage repository, Sonner notifier, schema normalization)
  - `presentation` (hydration-safe submission count hook)
- Added architectural import boundaries in `eslint.config.mjs` to reduce invalid cross-layer dependencies.
- Kept backward compatibility by preserving existing public imports via wrappers:
  - `src/lib/schema-types.ts`
  - `src/lib/rule-evaluator.ts`
  - `src/lib/zod-schema-generator.ts`
  - `src/form-schemas/index.ts`

### Forms, Schema, and Rules
- Moved inline demo schema out of page code into JSON files under `src/form-schemas`.
- Added multiple consumer-style schemas:
  - `user-registration.json`
  - `contact-us.json`
  - `newsletter-preferences.json`
  - `checkout-shipping.json`
- Added schema registry and ID map for centralized schema access.
- Added schema normalization/validation at load time (Zod-based) to ensure schema integrity.
- Upgraded conditional logic to support nested JSON rule groups:
  - legacy array rules (implicit `AND`) still supported
  - new `all` / `any` / `not` rule groups supported
- Unified rule evaluation usage across render path and validation path.

### Validation and Error Handling
- Improved Zod generation for user-friendly validation output.
- Fixed required-field edge cases that surfaced technical messages like
  `Invalid input: expected string, received undefined`.
- Added explicit field-level validation messages across schema files for better end-user guidance.

### UX and Submission Flow
- Replaced custom toast implementation with `sonner` (modern, typed, Next.js compatible).
- Added schema-driven success messaging (`successMessage`) per form.
- Persisted successful submissions to session storage and surfaced session response count.
- Removed raw submitted JSON panel from UI (less noisy for end users).
- Improved mobile-first layout spacing and responsiveness.
- Improved input/label contrast and iPhone form control rendering behavior.

### Hydration and Mobile Fixes
- Fixed hydration mismatch for session response count by switching to hydration-safe subscription semantics.
- Addressed mobile select hydration mismatches with safer select hydration handling.
- Added iPhone dark-mode control rendering safeguards (select/input/textarea readability).

### Testing
- Expanded test coverage for:
  - schema registry integrity
  - rule evaluator behavior (legacy + nested rules)
  - Zod generator required/conditional behavior
  - submit use-case and schema normalization
  - dynamic form submission path for Contact Us schema
- Stabilized slower tests with adjusted per-test timeouts where needed.
- Current suite status: lint green, tests green (`58` tests passing).

### Documentation
- Added `PROJECT_COMPASS.md` with a full project walkthrough.
- Added a prominent README jump link to Project Compass.
- Refined README and Project Compass tone for readability and approachability.
- Improved focused JSDoc/comments for non-obvious logic.

### Dependencies
- Updated compatible dependencies and verified health.
- Reverted incompatible `eslint@10` back to `eslint@9.x` due toolchain compatibility with current setup.

