# Requirements Document

## Introduction

This document covers three cross-cutting quality improvement tracks for the **Bozorchi AI** multi-vendor e-commerce platform. The platform consists of a React 19 + TypeScript + Vite + TailwindCSS web frontend, a Django 6 + DRF + PostgreSQL backend, and a React Native + Expo mobile application.

The three tracks are:

1. **Responsiveness** — Make the web dashboard and storefront fully usable on mobile and tablet viewports, and expand the mobile app's screen coverage.
2. **Internationalization (i18n)** — Eliminate all hardcoded Uzbek strings from the web frontend and mobile app, and add server-side language negotiation to backend error messages.
3. **Security** — Remove committed secrets, harden configuration, enable rate limiting on authentication, eliminate the remote code execution risk posed by the terminal endpoint, and add abuse protection to public-facing flows.

---

## Glossary

- **Dashboard**: The vendor-facing management interface rendered by `src/pages/Dashboard.tsx` and its sub-pages under `src/pages/dashboard/`.
- **Storefront**: The customer-facing shopping interface rendered by `src/pages/Storefront.tsx`.
- **Mobile App**: The React Native + Expo application located in the `mobile/` directory.
- **Translation System**: The custom i18n layer consisting of `src/i18n/translations.ts` and the `t()` function exposed through `AppContext`.
- **t() Function**: The translation lookup function provided by `AppContext` that maps a string key to the active language's value.
- **Hardcoded String**: Any user-visible text literal embedded directly in JSX or TypeScript source code instead of being routed through the `t()` function or an equivalent i18n mechanism.
- **Backend**: The Django 6 + DRF application located in `Bozorchi AI-backend/`.
- **TerminalView**: The Django REST Framework view at `/api/system/terminal/` defined in `Bozorchi AI-backend/bozorchi/terminal_views.py`.
- **Secret**: Any credential, API key, password, or cryptographic key that grants access to a system or service.
- **Rate Limiter**: A mechanism that restricts the number of requests a client can make to an endpoint within a defined time window.
- **django-axes**: The Django package configured in `settings.py` for brute-force login protection (currently commented out of `AUTHENTICATION_BACKENDS`).
- **Breakpoint**: A CSS viewport width threshold at which layout changes are applied. The project uses TailwindCSS breakpoints: `sm` (640 px), `md` (768 px), `lg` (1024 px), `xl` (1280 px).
- **Kanban Board**: The drag-and-drop order management view in `src/pages/dashboard/Orders.tsx`.
- **Slide-over Panel**: A full-height drawer that slides in from the right edge of the screen, used for order detail display.
- **Accept-Language Header**: The HTTP request header that communicates the client's preferred language(s) to the server.
- **DJANGO_SECRET_KEY**: The Django cryptographic signing key read from the `.env` file.
- **DJANGO_DEBUG**: The Django debug flag read from the `.env` file; must be `False` in production.
- **ALLOWED_HOSTS**: The Django setting that restricts which hostnames the backend will serve.

---

## Requirements

---

### Requirement 1: Responsive Dashboard Navigation

**User Story:** As a vendor, I want the dashboard sidebar and top navigation bar to work correctly on mobile and tablet screens, so that I can manage my store from any device without layout breakage.

#### Acceptance Criteria

1. WHEN the viewport width is less than 1280 px, THE Dashboard SHALL render the sidebar as a hidden off-canvas drawer that opens and closes via a hamburger toggle button.
2. WHEN the sidebar drawer is open on a viewport narrower than 1280 px, THE Dashboard SHALL display a full-screen overlay behind the drawer and close the drawer when the overlay is tapped.
3. WHEN a navigation item is selected on a viewport narrower than 1280 px, THE Dashboard SHALL automatically close the sidebar drawer.
4. WHILE the viewport width is 1280 px or wider, THE Dashboard SHALL render the sidebar in its persistent collapsed or expanded state as it does today.
5. THE Dashboard top control bar SHALL reflow its action buttons into a layout that does not overflow or clip on viewports as narrow as 320 px.
6. WHEN the viewport width is less than 640 px, THE Dashboard store-selector dropdown SHALL render at full viewport width and remain fully visible without horizontal scrolling.

---

### Requirement 2: Responsive Dashboard Data Tables

**User Story:** As a vendor, I want data tables in the dashboard to be readable on mobile, so that I can review products, customers, and other tabular data without horizontal overflow.

#### Acceptance Criteria

1. WHEN a data table is rendered on a viewport narrower than 768 px, THE Dashboard SHALL replace the table layout with a card-based list layout where each row becomes a stacked card.
2. WHILE a data table is rendered on a viewport between 768 px and 1024 px, THE Dashboard SHALL make the table container horizontally scrollable with visible scroll affordance rather than clipping content.
3. THE Dashboard table card layout SHALL display all columns that were visible in the desktop table layout, reordered vertically with labels.
4. IF a table row contains an action button group, THEN THE Dashboard SHALL render those actions as a full-width button row at the bottom of the corresponding card on mobile.

---

### Requirement 3: Responsive Orders Kanban Board

**User Story:** As a vendor, I want the Orders Kanban board to be usable on mobile and tablet, so that I can update order statuses while away from a desktop.

#### Acceptance Criteria

1. WHEN the viewport width is less than 768 px, THE Orders page SHALL replace the horizontal Kanban column layout with a vertically stacked, tab-based status view where one status column is visible at a time.
2. THE Orders page status tab bar SHALL allow the vendor to switch between status columns by tapping a tab label.
3. WHEN the viewport width is 768 px or wider, THE Orders page SHALL retain the existing horizontal Kanban layout with horizontal scroll.
4. WHEN the Orders slide-over detail panel is opened on a viewport narrower than 768 px, THE Orders page SHALL render the panel as a full-screen bottom sheet that occupies 100% of the viewport width and at least 90% of the viewport height.
5. THE Orders slide-over detail panel footer action buttons SHALL remain sticky at the bottom of the panel on all viewport sizes.

---

### Requirement 4: Responsive Storefront Product Grid and Checkout

**User Story:** As a customer, I want the storefront product grid and checkout flow to be fully usable on a mobile browser, so that I can browse and purchase products from my phone.

#### Acceptance Criteria

1. WHEN the viewport width is less than 640 px, THE Storefront product grid SHALL render in a single-column layout.
2. WHILE the viewport width is between 640 px and 1024 px, THE Storefront product grid SHALL render in a two-column layout.
3. WHEN the viewport width is 1024 px or wider, THE Storefront product grid SHALL render in a layout of three or more columns.
4. THE Storefront checkout form SHALL stack all input fields vertically on viewports narrower than 640 px with no horizontal overflow.
5. WHEN a modal or drawer is opened on a viewport narrower than 640 px, THE Storefront SHALL render it at full viewport width and constrain its height to the visible viewport area with internal scrolling.
6. THE Storefront navigation menu SHALL collapse into a hamburger-triggered dropdown on viewports narrower than 768 px.

---

### Requirement 5: Responsive Modal and Drawer Components

**User Story:** As a user, I want all modal dialogs and drawer panels across the platform to adapt to small viewports, so that I can interact with them without content being cut off or inaccessible.

#### Acceptance Criteria

1. WHEN a modal is displayed on a viewport narrower than 640 px, THE Modal component SHALL render at 100% viewport width with a maximum height of 90% of the viewport height and internal vertical scrolling.
2. WHEN a drawer panel is displayed on a viewport narrower than 640 px, THE Drawer component SHALL render as a bottom sheet anchored to the bottom of the viewport at full width.
3. THE Modal component close button SHALL always be visible and reachable without scrolling on all viewport sizes.
4. IF a modal or drawer contains a form, THEN THE component SHALL ensure all form fields are reachable via normal vertical scrolling on viewports narrower than 640 px.

---

### Requirement 6: Mobile App Screen Expansion

**User Story:** As a vendor using the mobile app, I want access to more management screens, so that I can perform common tasks without switching to the web dashboard.

#### Acceptance Criteria

1. THE Mobile App SHALL provide a Store Settings screen that allows the vendor to update store name, description, and contact information.
2. THE Mobile App SHALL provide an Analytics Overview screen that displays total revenue, order count, and top products for the current day and current month.
3. THE Mobile App SHALL provide a Customers screen that lists customers with their name, phone number, and total order count.
4. THE Mobile App SHALL provide a Notifications screen that displays recent system and order notifications.
5. WHEN a vendor navigates to the Orders screen and taps an order, THE Mobile App SHALL display the Order Detail screen with full order information and a status-update control.
6. THE Mobile App bottom tab navigator SHALL include navigation entries for all screens listed in criteria 1 through 4 in addition to the existing tabs.

---

### Requirement 7: Web Frontend i18n Coverage — Dashboard Pages

**User Story:** As a vendor who uses the Russian or English interface, I want all dashboard text to appear in my selected language, so that I can operate the platform without encountering untranslated Uzbek strings.

#### Acceptance Criteria

1. THE Translation System SHALL contain translation keys for every user-visible string currently hardcoded in Uzbek across all dashboard pages, including but not limited to: order status labels, section headings, button labels, placeholder text, and inline descriptive text.
2. WHEN the active language is changed, THE Dashboard SHALL re-render all previously hardcoded strings using the updated translation without requiring a page reload.
3. THE Orders page SHALL route all user-visible strings through the `t()` function, including the strings currently hardcoded as `"ta buyurtma mavjud"`, `"Hozirgi holat"`, `"Mijoz ma'lumotlari"`, `"Yetkazib berish"`, `"Buyurtma Tarkibi"`, `"Yakuniy Summa"`, and `"Tasdiqlash"`.
4. THE Analytics page SHALL route all user-visible strings through the `t()` function, including AI insight text currently hardcoded in Uzbek.
5. THE DeliverySettings page SHALL route all user-visible strings through the `t()` function, replacing all inline `language === 'uz' ? '...' : '...'` ternary patterns with `t()` calls.
6. THE DeliveryTracking component SHALL route all status label strings through the `t()` function instead of using per-language object literals.
7. THE OrderTracking component SHALL route all status label strings through the `t()` function.
8. THE Storefront SHALL route all user-visible strings through the `t()` function, replacing all inline language-ternary patterns.

---

### Requirement 8: Web Frontend i18n Coverage — Translation Key Completeness

**User Story:** As a developer, I want the translation file to be complete for all three supported languages, so that no key falls back to its raw key string in any language.

#### Acceptance Criteria

1. THE Translation System `translations.ts` file SHALL contain entries for every translation key used by any `t()` call in the codebase under the `en`, `uz`, and `ru` language objects.
2. IF a `t()` call is made with a key that does not exist in the active language's translation object, THEN THE Translation System SHALL return the key's value from the `uz` language object as a fallback before returning the raw key string.
3. THE Translation System SHALL export a TypeScript type that enumerates all valid translation keys, so that missing keys produce a compile-time error.

---

### Requirement 9: Mobile App i18n

**User Story:** As a vendor using the mobile app in Russian or English, I want all app text to appear in my selected language, so that I can use the app without encountering hardcoded Uzbek strings.

#### Acceptance Criteria

1. THE Mobile App SHALL implement an i18n system that supports Uzbek (`uz`), Russian (`ru`), and English (`en`) languages.
2. THE Mobile App SHALL persist the selected language across app restarts using device storage.
3. THE Mobile App SHALL route all user-visible strings through the i18n system, replacing all hardcoded Uzbek strings including tab labels (`"Bosh sahifa"`, `"Buyurtmalar"`, `"Mahsulotlar"`, `"Profil"`), status labels (`"Kutilmoqda"`, `"Tasdiqlangan"`, `"Yakunlangan"`), and filter labels (`"Barchasi"`).
4. WHEN the vendor changes the language setting in the mobile app, THE Mobile App SHALL re-render all screens with the updated language without requiring an app restart.
5. THE Mobile App i18n translation files SHALL share the same key namespace as the web frontend `translations.ts` file for keys that represent the same concepts, to allow future consolidation.

---

### Requirement 10: Backend i18n — Language Negotiation

**User Story:** As a frontend developer, I want the backend to return error messages in the language the client requests, so that users see error messages in their own language.

#### Acceptance Criteria

1. WHEN the Backend receives a request with an `Accept-Language` header value of `uz`, `ru`, or `en`, THE Backend SHALL return all user-facing error messages and validation errors in the requested language.
2. IF the `Accept-Language` header is absent or specifies an unsupported language, THEN THE Backend SHALL return error messages in Uzbek (`uz`) as the default language.
3. THE Backend SHALL provide translated error messages for at minimum: authentication failures, validation errors on order creation, and validation errors on user registration.
4. THE Backend SHALL not change the structure of existing API response bodies; only the human-readable message strings SHALL be translated.

---

### Requirement 11: Secret Management — Remove Committed Secrets

**User Story:** As a security engineer, I want all real credentials removed from the committed `.env` file, so that secrets are not exposed in version control.

#### Acceptance Criteria

1. THE `.env` file committed to the repository SHALL contain only placeholder values (e.g., `your-secret-key-here`) for all secrets, including `DJANGO_SECRET_KEY`, `EMAIL_HOST_PASSWORD`, `GEMINI_API_KEY`, and `DATABASE_URL`.
2. THE repository SHALL include a `.env.example` file that documents every required environment variable with a descriptive placeholder and a comment explaining its purpose.
3. THE `.gitignore` file SHALL include an entry that prevents `.env` files containing real values from being committed.
4. THE Backend `settings.py` SHALL raise `ImproperlyConfigured` at startup if `DJANGO_SECRET_KEY` is absent, empty, or matches any known weak placeholder value.

---

### Requirement 12: Secret Management — Strong Secret Key Enforcement

**User Story:** As a security engineer, I want the Django secret key to meet minimum entropy requirements, so that cryptographic operations cannot be compromised by a guessable key.

#### Acceptance Criteria

1. THE Backend `settings.py` SHALL validate that `DJANGO_SECRET_KEY` is at least 50 characters long at application startup.
2. IF `DJANGO_SECRET_KEY` is shorter than 50 characters or matches the known weak value `"bozorchi-vibrant-premium-ai-secure-key-2026-unique-production-ready"`, THEN THE Backend SHALL raise `ImproperlyConfigured` and refuse to start.
3. THE `.env.example` file SHALL include a command or instruction for generating a cryptographically strong secret key (e.g., using `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`).

---

### Requirement 13: Production Configuration Hardening

**User Story:** As a DevOps engineer, I want the production environment to enforce safe Django configuration defaults, so that debug information and overly permissive host settings cannot be exploited.

#### Acceptance Criteria

1. THE `.env` file committed to the repository SHALL set `DJANGO_DEBUG=False`.
2. THE `.env` file committed to the repository SHALL NOT include the `*` wildcard in `ALLOWED_HOSTS`.
3. THE Backend `settings.py` SHALL raise `ImproperlyConfigured` at startup if `DJANGO_DEBUG=True` and `ALLOWED_HOSTS` contains the `*` wildcard simultaneously.
4. THE Backend `settings.py` SHALL log a startup warning if `DJANGO_DEBUG=True` is detected, indicating that debug mode must not be used in production.
5. THE `.env.example` file SHALL document that `ALLOWED_HOSTS` must be set to the actual production domain(s) and must not include `*`.

---

### Requirement 14: Authentication Rate Limiting

**User Story:** As a security engineer, I want the login endpoint to enforce rate limiting, so that brute-force credential attacks are blocked.

#### Acceptance Criteria

1. THE Backend login endpoint SHALL enforce a rate limit of no more than 10 authentication attempts per IP address within any 15-minute window.
2. WHEN the rate limit is exceeded, THE Backend login endpoint SHALL return HTTP 429 with a response body indicating the lockout duration.
3. THE Backend `settings.py` SHALL enable `axes.backends.AxesStandaloneBackend` in `AUTHENTICATION_BACKENDS` so that django-axes lockout enforcement is active.
4. WHEN a login attempt is blocked by django-axes, THE Backend SHALL return a response that does not reveal whether the username exists.
5. THE Backend `settings.py` SHALL configure django-axes with a failure limit of 5 attempts and a cooldown period of 15 minutes, matching the existing `AXES_FAILURE_LIMIT` and `AXES_COOLOFF_TIME` values.

---

### Requirement 15: Terminal Endpoint Removal

**User Story:** As a security engineer, I want the shell-accessible terminal endpoint removed from the API, so that the remote code execution risk it represents is eliminated.

#### Acceptance Criteria

1. THE Backend SHALL remove the URL route that maps to `TerminalView` from `bozorchi/urls.py`.
2. THE Backend SHALL remove or disable the `TerminalView` class in `bozorchi/terminal_views.py` so that it cannot be re-registered accidentally.
3. WHEN a request is made to `/api/system/terminal/`, THE Backend SHALL return HTTP 404.
4. THE Backend SHALL retain the administrative utility functions previously provided by `TerminalView` (database backup, cache clearing, DB stats) as Django management commands accessible only via the server's command line, not via HTTP.
5. THE Backend management command for database backup SHALL require explicit confirmation before writing a backup file, to prevent accidental execution.

---

### Requirement 16: Review Spam and Abuse Protection

**User Story:** As a platform operator, I want the product review submission endpoint to include abuse protection, so that spam reviews and review-bombing attacks are mitigated.

#### Acceptance Criteria

1. THE Backend review submission endpoint SHALL enforce a rate limit of no more than 5 review submissions per authenticated user per hour.
2. THE Backend review submission endpoint SHALL enforce a rate limit of no more than 3 review submissions per IP address per hour for unauthenticated requests.
3. WHEN a review submission rate limit is exceeded, THE Backend SHALL return HTTP 429.
4. THE Backend SHALL validate that a review submission contains a non-empty, non-whitespace-only body before persisting it.
5. THE Backend SHALL validate that the rating field in a review submission is an integer between 1 and 5 inclusive; IF the value is outside this range, THEN THE Backend SHALL return HTTP 400.

---

### Requirement 17: Password Reset Flow Verification

**User Story:** As a security engineer, I want the password reset flow to be verified as complete and secure, so that accounts cannot be taken over through the reset mechanism.

#### Acceptance Criteria

1. WHEN a password reset is requested for an email address that does not exist in the system, THE Backend SHALL return the same HTTP 200 response as for a valid email address, to prevent user enumeration.
2. THE Backend password reset token SHALL expire no later than 1 hour after issuance.
3. WHEN a password reset token is used to set a new password, THE Backend SHALL immediately invalidate the token so that it cannot be reused.
4. THE Backend SHALL enforce the existing `AUTH_PASSWORD_VALIDATORS` rules on the new password submitted during a reset; IF the new password fails validation, THEN THE Backend SHALL return HTTP 400 with a descriptive error.
5. WHEN a password reset is completed successfully, THE Backend SHALL invalidate all existing JWT refresh tokens for that user account.

---

### Requirement 18: Superadmin Login Credential Logging Removal

**User Story:** As a security engineer, I want all debug print statements that log credentials in plaintext to be removed from the superadmin login flow, so that credentials are never written to logs.

#### Acceptance Criteria

1. THE Backend superadmin authentication code SHALL contain no `print()` statements or log calls that output a user's password, token, or any other credential in plaintext.
2. THE Backend logging configuration SHALL apply the existing `SensitiveDataFilter` to all loggers that handle authentication events.
3. WHEN an authentication event is logged, THE Backend SHALL mask any field whose key matches `password`, `token`, `secret`, `key`, or `credential` with a redacted placeholder string.
4. THE Backend `settings.py` `LOGGING` configuration SHALL route all `accounts` and `bozorchi` logger output through the `mask_sensitive_data` filter.
