# Implementation Plan: Platform Quality Improvements

## Overview

This plan covers three cross-cutting quality improvement tracks for the Savdoon platform: Responsiveness (web + mobile), Internationalization (web frontend, mobile app, backend), and Security hardening. Tasks are organized by track and build incrementally so each step integrates cleanly into the previous one.

## Tasks

---

## Track 1 — Responsiveness

- [ ] 1. Create responsive layout hooks
  - [ ] 1.1 Implement `useMediaQuery` hook in `src/hooks/useMediaQuery.ts`
    - Wrap `window.matchMedia(query).matches` with a `change` event listener
    - Guard with `typeof window !== 'undefined'` for SSR/test safety; return `defaultValue` (default `false`) when unavailable
    - Clean up the listener in the `useEffect` return function
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

  - [ ]* 1.2 Write property test for `useMediaQuery` — Property 1: Sidebar mobile detection
    - **Property 1: Sidebar mobile detection**
    - Use `fc.integer({ min: 0, max: 3000 })` for viewport width
    - Assert `isMobile === (width < 1280)` for all generated widths
    - Tag: `// Feature: platform-quality-improvements, Property 1`
    - **Validates: Requirements 1.1, 1.4**

  - [ ] 1.3 Implement `useSidebar` hook in `src/hooks/useSidebar.ts`
    - Expose `{ sidebarOpen, setSidebarOpen, isMobile, toggleSidebar }`
    - Initialize `isMobile` from `window.innerWidth < breakpoint` (default 1280)
    - Debounce the resize listener at 100 ms
    - Auto-set `sidebarOpen = false` when `isMobile` transitions to `true`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 1.4 Write property test for `useSidebar` — Property 2: Navigation closes sidebar on mobile
    - **Property 2: Navigation item closes sidebar on mobile**
    - Use `fc.string()` for tab id and `fc.integer({ min: 0, max: 1279 })` for width
    - Assert that invoking the tab-click handler sets `sidebarOpen` to `false`
    - Tag: `// Feature: platform-quality-improvements, Property 2`
    - **Validates: Requirements 1.3**

- [ ] 2. Refactor Dashboard navigation for responsiveness
  - [ ] 2.1 Update `src/pages/Dashboard.tsx` to use `useSidebar`
    - Replace inline `isMobile`/`sidebarOpen` state with the `useSidebar()` hook
    - Render sidebar as an off-canvas drawer (hidden by default) when `isMobile` is true
    - Add a hamburger toggle button visible only when `isMobile` is true
    - Add a full-screen overlay behind the drawer; close sidebar on overlay tap
    - Auto-close sidebar when a navigation item is selected on mobile
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ] 2.2 Fix Dashboard top control bar overflow
    - Apply TailwindCSS flex-wrap and min-width-0 classes so action buttons reflow on viewports as narrow as 320 px
    - Ensure the store-selector dropdown renders at full viewport width on viewports < 640 px
    - _Requirements: 1.5, 1.6_

  - [ ]* 2.3 Write snapshot tests for Dashboard navigation at key breakpoints
    - Render at 320 px, 640 px, 768 px, 1024 px, 1280 px with `window.innerWidth` mocked
    - Assert sidebar is hidden/drawer at < 1280 px and persistent at ≥ 1280 px
    - _Requirements: 1.1, 1.4_

- [ ] 3. Implement `ResponsiveTable` component
  - [ ] 3.1 Create `src/components/ResponsiveTable.tsx`
    - Define `Column<T>` and `ResponsiveTableProps<T>` interfaces as specified in the design
    - Use `useMediaQuery('(max-width: 767px)')` to switch between table and card layout
    - At 768–1024 px: wrap `<table>` in a `div` with `overflow-x: auto` and a scroll-shadow affordance
    - Card layout: render each row as a `<div>` with label–value pairs stacked vertically
    - Action columns render as a full-width button row at the bottom of each card
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 3.2 Write property test for `ResponsiveTable` — Property 3: Layout mode
    - **Property 3: ResponsiveTable layout mode**
    - Use `fc.integer({ min: 0, max: 3000 })` for viewport width
    - Assert card layout when width < 768 and table layout when width ≥ 768
    - Tag: `// Feature: platform-quality-improvements, Property 3`
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 3.3 Write property test for `ResponsiveTable` — Property 4: Card column completeness
    - **Property 4: Card layout column completeness**
    - Use `fc.array(fc.record({ key: fc.string(), label: fc.string() }))` for columns
    - Assert every column label and value appears in the rendered card
    - Tag: `// Feature: platform-quality-improvements, Property 4`
    - **Validates: Requirements 2.3**

  - [ ] 3.4 Replace existing table implementations in dashboard pages with `ResponsiveTable`
    - Update Products, Customers, and any other dashboard pages that render `<table>` elements
    - Pass existing column definitions and data arrays as props
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 4. Make Orders Kanban board responsive
  - [ ] 4.1 Create `src/components/MobileKanban.tsx`
    - Implement `MobileKanbanProps` interface as specified in the design
    - Render a horizontal tab bar of status labels
    - Show only orders for the `activeStatus` prop
    - _Requirements: 3.1, 3.2_

  - [ ]* 4.2 Write property test for Orders layout — Property 5: Kanban layout switching
    - **Property 5: Orders Kanban layout switching**
    - Use `fc.integer({ min: 0, max: 3000 })` for viewport width
    - Assert tab-based layout when width < 768 and Kanban layout when width ≥ 768
    - Tag: `// Feature: platform-quality-improvements, Property 5`
    - **Validates: Requirements 3.1, 3.3**

  - [ ]* 4.3 Write property test for Orders tab selection — Property 6
    - **Property 6: Orders tab selection**
    - Use `fc.constantFrom(...statuses)` for status values
    - Assert clicking a tab sets active status and filters displayed orders
    - Tag: `// Feature: platform-quality-improvements, Property 6`
    - **Validates: Requirements 3.2**

  - [ ] 4.4 Create `src/components/BottomSheet.tsx`
    - Implement `BottomSheetProps` interface as specified in the design
    - Render as a fixed panel anchored to the bottom at full width
    - Animate with `framer-motion` (`y: '100%'` → `y: 0`)
    - _Requirements: 3.4, 5.2_

  - [ ] 4.5 Update `src/pages/dashboard/Orders.tsx` to use responsive components
    - Use `useMediaQuery('(max-width: 767px)')` to switch between `MobileKanban` and existing Kanban
    - Replace the slide-over detail panel with `BottomSheet` on mobile (< 768 px)
    - Keep sticky footer action buttons on all viewport sizes
    - _Requirements: 3.1, 3.3, 3.4, 3.5_

- [ ] 5. Make Storefront responsive
  - [ ] 5.1 Update `src/pages/Storefront.tsx` product grid
    - Apply TailwindCSS responsive grid classes: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
    - Collapse navigation menu into a hamburger-triggered dropdown on viewports < 768 px using `useMediaQuery`
    - _Requirements: 4.1, 4.2, 4.3, 4.6_

  - [ ]* 5.2 Write property test for Storefront grid — Property 7: Column count
    - **Property 7: Storefront product grid column count**
    - Use `fc.integer({ min: 0, max: 3000 })` for viewport width
    - Assert 1 column < 640 px, 2 columns 640–1023 px, ≥ 3 columns ≥ 1024 px
    - Tag: `// Feature: platform-quality-improvements, Property 7`
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [ ] 5.3 Update Storefront checkout form and modals
    - Stack all checkout form fields vertically on viewports < 640 px with no horizontal overflow
    - Render modals/drawers at full viewport width on viewports < 640 px using `BottomSheet`
    - _Requirements: 4.4, 4.5_

- [ ] 6. Update Modal component for responsiveness
  - [ ] 6.1 Update the existing Modal component(s) in `src/components/`
    - Apply `w-full max-h-[90vh] overflow-y-auto` on viewports < 640 px
    - Keep the close button in a `sticky top-0` header so it is always reachable
    - Ensure all form fields inside a modal are reachable via normal vertical scrolling
    - _Requirements: 5.1, 5.3, 5.4_

  - [ ]* 6.2 Write property test for Modal — Property 8: Responsive rendering
    - **Property 8: Modal responsive rendering**
    - Use `fc.integer({ min: 0, max: 3000 })` for viewport width
    - Assert full-width + max-height-90vh classes applied when width < 640, desktop classes when ≥ 640
    - Tag: `// Feature: platform-quality-improvements, Property 8`
    - **Validates: Requirements 5.1**

  - [ ] 6.3 Update Drawer component(s) in `src/components/`
    - Render as a bottom sheet (anchored to bottom, full width) on viewports < 640 px
    - Render as a side panel on viewports ≥ 640 px
    - _Requirements: 5.2_

  - [ ]* 6.4 Write property test for Drawer — Property 9: Bottom-sheet rendering
    - **Property 9: Drawer bottom-sheet rendering**
    - Use `fc.integer({ min: 0, max: 3000 })` for viewport width
    - Assert bottom-sheet rendering when width < 640 and side-panel rendering when ≥ 640
    - Tag: `// Feature: platform-quality-improvements, Property 9`
    - **Validates: Requirements 5.2**

- [ ] 7. Add Mobile App screens
  - [ ] 7.1 Create `mobile/src/screens/StoreSettingsScreen.tsx`
    - Implement a form allowing the vendor to update store name, description, and contact information
    - Wire to the appropriate backend API endpoint
    - _Requirements: 6.1_

  - [ ] 7.2 Create `mobile/src/screens/AnalyticsOverviewScreen.tsx`
    - Display total revenue, order count, and top products for the current day and current month
    - Fetch data from the backend analytics endpoint
    - _Requirements: 6.2_

  - [ ] 7.3 Create `mobile/src/screens/CustomersScreen.tsx`
    - List customers with name, phone number, and total order count
    - Fetch data from the backend customers endpoint
    - _Requirements: 6.3_

  - [ ] 7.4 Create `mobile/src/screens/NotificationsScreen.tsx`
    - Display recent system and order notifications
    - Fetch data from the backend notifications endpoint
    - _Requirements: 6.4_

  - [ ] 7.5 Create `mobile/src/screens/OrderDetailScreen.tsx`
    - Display full order information and a status-update control
    - Navigate to this screen when an order is tapped in the Orders screen
    - _Requirements: 6.5_

  - [ ] 7.6 Update the bottom tab navigator in `mobile/src/navigation/`
    - Add navigation entries for StoreSettings, AnalyticsOverview, Customers, and Notifications
    - Retain existing tabs
    - _Requirements: 6.6_

- [ ] 8. Checkpoint — Track 1 Responsiveness
  - Ensure all tests pass, ask the user if questions arise.

---

## Track 2 — Internationalization (i18n)

- [ ] 9. Extend the web frontend Translation System
  - [ ] 9.1 Add `TranslationKey` union type to `src/i18n/translations.ts`
    - Export `TranslationKey = keyof typeof translations['uz']` so the `uz` object is the canonical key source
    - Update the `t()` function signature in `src/context/AppContext.tsx` to accept `key: TranslationKey`
    - TypeScript will now produce a compile error for any `t()` call with an unknown key
    - _Requirements: 8.3_

  - [ ] 9.2 Implement the fallback chain in the `t()` function
    - `t(key)` → `translations[activeLanguage][key]` ?? `translations['uz'][key]` ?? `key`
    - _Requirements: 8.2_

  - [ ]* 9.3 Write property test for translation key completeness — Property 10
    - **Property 10: Translation key completeness**
    - Use `fc.constantFrom(...Object.keys(translations.uz))` for keys
    - Assert `translations.en[key]`, `translations.uz[key]`, and `translations.ru[key]` are all defined non-empty strings
    - Tag: `// Feature: platform-quality-improvements, Property 10`
    - **Validates: Requirements 7.1, 8.1**

  - [ ]* 9.4 Write property test for translation fallback chain — Property 11
    - **Property 11: Translation fallback chain**
    - Use `fc.constantFrom(...Object.keys(translations.uz))` for keys
    - For any active language where the key is absent, assert `t(key)` returns `translations['uz'][key]`
    - Tag: `// Feature: platform-quality-improvements, Property 11`
    - **Validates: Requirements 8.2**

- [ ] 10. Add missing translation keys to `translations.ts`
  - [ ] 10.1 Audit all dashboard pages for hardcoded Uzbek strings
    - Scan `src/pages/dashboard/` for string literals not routed through `t()`
    - Identify all strings including order status labels, section headings, button labels, placeholder text, and inline descriptive text
    - _Requirements: 7.1_

  - [ ] 10.2 Add all identified keys to `translations.ts` under `en`, `uz`, and `ru`
    - Include at minimum: `"ta buyurtma mavjud"`, `"Hozirgi holat"`, `"Mijoz ma'lumotlari"`, `"Yetkazib berish"`, `"Buyurtma Tarkibi"`, `"Yakuniy Summa"`, `"Tasdiqlash"`, and all AI insight strings from the Analytics page
    - _Requirements: 7.1, 7.3, 7.4_

- [ ] 11. Replace hardcoded strings in dashboard pages
  - [ ] 11.1 Update `src/pages/dashboard/Orders.tsx`
    - Replace all hardcoded Uzbek strings with `t()` calls using the new keys
    - _Requirements: 7.2, 7.3_

  - [ ] 11.2 Update `src/pages/dashboard/Analytics.tsx`
    - Replace all hardcoded Uzbek strings (including AI insight text) with `t()` calls
    - _Requirements: 7.2, 7.4_

  - [ ] 11.3 Update `src/pages/dashboard/DeliverySettings.tsx`
    - Replace all inline `language === 'uz' ? '...' : '...'` ternary patterns with `t()` calls
    - _Requirements: 7.5_

  - [ ] 11.4 Update `src/components/DeliveryTracking.tsx`
    - Replace per-language object literals for status labels with `t()` calls
    - _Requirements: 7.6_

  - [ ] 11.5 Update `src/components/OrderTracking.tsx`
    - Replace per-language object literals for status labels with `t()` calls
    - _Requirements: 7.7_

  - [ ] 11.6 Update `src/pages/Storefront.tsx`
    - Replace all inline language-ternary patterns with `t()` calls
    - _Requirements: 7.8_

  - [ ]* 11.7 Write static analysis test for hardcoded Uzbek strings
    - Import all dashboard page components and assert no string literal matches known Uzbek patterns (e.g., `"ta buyurtma mavjud"`, `"Hozirgi holat"`)
    - _Requirements: 7.1, 7.2_

- [ ] 12. Implement Mobile App i18n system
  - [ ] 12.1 Create `mobile/src/i18n/index.ts` with `useTranslation` hook
    - Export `Language` type (`'en' | 'uz' | 'ru'`) and `TranslationKey` type
    - Implement `t(key, lang)` function and `useTranslation()` hook
    - `setLanguage` persists selection to `AsyncStorage` under key `'@savdoon_language'`
    - On app start, load stored language before first render (in `AuthProvider` or a dedicated `I18nProvider`)
    - Fall back to `'uz'` if `AsyncStorage` read fails; log the error
    - _Requirements: 9.1, 9.2, 9.4_

  - [ ] 12.2 Create `mobile/src/i18n/uz.json`, `en.json`, and `ru.json`
    - Share the same key namespace as the web `translations.ts` for overlapping concepts
    - Include all tab labels (`"Bosh sahifa"`, `"Buyurtmalar"`, `"Mahsulotlar"`, `"Profil"`), status labels (`"Kutilmoqda"`, `"Tasdiqlangan"`, `"Yakunlangan"`), and filter labels (`"Barchasi"`)
    - _Requirements: 9.3, 9.5_

  - [ ] 12.3 Replace hardcoded Uzbek strings throughout the mobile app
    - Update all tab labels, status labels, filter labels, and any other hardcoded strings to use `useTranslation()`
    - _Requirements: 9.3_

  - [ ]* 12.4 Write unit tests for the mobile i18n module
    - Test language persistence via `AsyncStorage`
    - Test fallback behavior when `AsyncStorage` read fails
    - Test that `setLanguage` triggers a re-render with the new language
    - _Requirements: 9.2, 9.4_

- [ ] 13. Implement Backend language negotiation middleware
  - [ ] 13.1 Create `AcceptLanguageMiddleware` in `Savdoon-backend/savdoon/middleware.py`
    - Implement `_parse()` to parse RFC 5646 language tags and return the first supported match from `{'uz', 'ru', 'en'}`
    - Default to `'uz'` for absent, unsupported, or malformed `Accept-Language` headers
    - Call `translation.activate(lang)` and set `request.LANGUAGE_CODE`; call `translation.deactivate()` after the response
    - _Requirements: 10.1, 10.2_

  - [ ] 13.2 Register `AcceptLanguageMiddleware` in `settings.py`
    - Add after `CommonMiddleware` in the `MIDDLEWARE` list
    - _Requirements: 10.1_

  - [ ] 13.3 Add Django translation catalog entries for authentication failures, order creation errors, and user registration errors
    - Create or update `.po`/`.mo` files for `uz`, `ru`, and `en` locales
    - Wrap the relevant error message strings with `_()` (gettext) in the view/serializer code
    - _Requirements: 10.3, 10.4_

  - [ ]* 13.4 Write property test for backend language negotiation — Property 12
    - **Property 12: Backend language negotiation**
    - Use `st.sampled_from(['uz', 'ru', 'en'])` and `st.text()` for unsupported codes
    - Assert error messages are returned in the requested language; unsupported codes return Uzbek
    - Tag: `# Feature: platform-quality-improvements, Property 12`
    - **Validates: Requirements 10.1, 10.2**

  - [ ]* 13.5 Write property test for API structure invariance — Property 13
    - **Property 13: API response structure invariance under language change**
    - Use `st.sampled_from(['uz', 'ru', 'en'])` for language codes
    - Assert the JSON response body structure (set of top-level keys) is identical regardless of `Accept-Language`
    - Tag: `# Feature: platform-quality-improvements, Property 13`
    - **Validates: Requirements 10.4**

- [ ] 14. Checkpoint — Track 2 i18n
  - Ensure all tests pass, ask the user if questions arise.

---

## Track 3 — Security

- [-] 15. Remove committed secrets and harden `.env`
  - [-] 15.1 Replace all real secret values in the committed `.env` file with placeholders
    - Set `DJANGO_SECRET_KEY=your-secret-key-here`, `EMAIL_HOST_PASSWORD=your-email-password-here`, `GEMINI_API_KEY=your-gemini-api-key-here`, `DATABASE_URL=your-database-url-here`
    - Set `DJANGO_DEBUG=False` and remove `*` from `ALLOWED_HOSTS`
    - _Requirements: 11.1, 13.1, 13.2_

  - [ ] 15.2 Create `.env.example` documenting all required environment variables
    - Include a descriptive placeholder and comment for each variable
    - Include the command `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` for generating a strong secret key
    - Document that `ALLOWED_HOSTS` must be set to actual production domain(s) and must not include `*`
    - _Requirements: 11.2, 12.3, 13.5_

  - [ ] 15.3 Update `.gitignore` to prevent real `.env` files from being committed
    - Add entries for `.env`, `.env.local`, `.env.production`, and similar patterns
    - _Requirements: 11.3_

- [ ] 16. Implement secret key and production config validators in `settings.py`
  - [ ] 16.1 Add `_validate_secret_key()` function to `Savdoon-backend/savdoon/settings.py`
    - Raise `ImproperlyConfigured` if `DJANGO_SECRET_KEY` is absent, empty, shorter than 50 characters, or matches a known weak value (including the `"savdoon-vibrant-premium-ai-secure-key-2026-unique-production-ready"` placeholder and any key starting with `"django-insecure"`)
    - Call this function immediately after reading `DJANGO_SECRET_KEY` from the environment
    - _Requirements: 11.4, 12.1, 12.2_

  - [ ] 16.2 Add `_validate_production_config()` function to `settings.py`
    - Raise `ImproperlyConfigured` if `DEBUG=True` and `ALLOWED_HOSTS` contains `'*'` simultaneously
    - Log a `RuntimeWarning` if `DEBUG=True` is detected
    - Call this function after `DEBUG` and `ALLOWED_HOSTS` are set
    - _Requirements: 13.3, 13.4_

  - [ ]* 16.3 Write property test for secret key validation — Property 14
    - **Property 14: Secret key validation rejects weak keys**
    - Use `st.text(max_size=49)` for short keys and `st.just('')` for empty
    - Assert `_validate_secret_key()` raises `ImproperlyConfigured` for all weak inputs
    - Tag: `# Feature: platform-quality-improvements, Property 14`
    - **Validates: Requirements 11.4, 12.1, 12.2**

  - [ ]* 16.4 Write property test for production config guard — Property 15
    - **Property 15: Production config guard**
    - Use `st.booleans()` for DEBUG and `st.lists(st.text())` for ALLOWED_HOSTS
    - Assert `_validate_production_config()` raises `ImproperlyConfigured` when `DEBUG=True` and `'*'` in `ALLOWED_HOSTS`
    - Tag: `# Feature: platform-quality-improvements, Property 15`
    - **Validates: Requirements 13.3**

- [ ] 17. Enable authentication rate limiting with django-axes
  - [ ] 17.1 Uncomment `axes.backends.AxesStandaloneBackend` in `AUTHENTICATION_BACKENDS` in `settings.py`
    - Verify `AXES_FAILURE_LIMIT = 5` and `AXES_COOLOFF_TIME` is set to 15 minutes
    - _Requirements: 14.3, 14.5_

  - [ ] 17.2 Add DRF throttle configuration for the login endpoint
    - Add `DEFAULT_THROTTLE_RATES` entry for login: `'10/15min'` (10 attempts per IP per 15-minute window)
    - Apply the throttle class to the login view
    - Ensure the 429 response body indicates the lockout duration and does not reveal whether the username exists
    - _Requirements: 14.1, 14.2, 14.4_

  - [ ]* 17.3 Write property test for blocked login response uniformity — Property 23
    - **Property 23: Blocked login response uniformity**
    - Use `st.text()` for username values (existing and non-existing)
    - Assert that when a login attempt is blocked by django-axes, the response has the same HTTP status code and body structure regardless of whether the username exists
    - Tag: `# Feature: platform-quality-improvements, Property 23`
    - **Validates: Requirements 14.4**

  - [ ]* 17.4 Write integration tests for login rate limiting
    - Use Django's `APIClient` to send 11 requests and assert the 11th returns HTTP 429
    - Assert the 429 response body includes a lockout duration indicator
    - _Requirements: 14.1, 14.2_

- [ ] 18. Remove the terminal endpoint and migrate to management commands
  - [ ] 18.1 Remove the `TerminalView` URL route from `Savdoon-backend/savdoon/urls.py`
    - Delete the URL pattern that maps to `TerminalView`
    - _Requirements: 15.1_

  - [ ] 18.2 Disable `TerminalView` in `Savdoon-backend/savdoon/terminal_views.py`
    - Remove or comment out the class body so it cannot be re-registered accidentally
    - _Requirements: 15.2_

  - [ ] 18.3 Create `Savdoon-backend/savdoon/management/commands/backup_db.py`
    - Implement `dumpdata` with a `--confirm` flag
    - Prompt `"Type 'yes' to confirm backup: "` and abort without writing any file if the response is not `yes`
    - _Requirements: 15.4, 15.5_

  - [ ] 18.4 Create `Savdoon-backend/savdoon/management/commands/db_stats.py`
    - Print model counts for key models
    - _Requirements: 15.4_

  - [ ] 18.5 Create `Savdoon-backend/savdoon/management/commands/clear_cache.py`
    - Call `cache.clear()` and print a confirmation message
    - _Requirements: 15.4_

  - [ ] 18.6 Create `Savdoon-backend/savdoon/management/commands/auth_sessions.py`
    - List active sessions
    - _Requirements: 15.4_

  - [ ]* 18.7 Write integration test asserting `/api/system/terminal/` returns HTTP 404
    - Use `APIClient` to POST to `/api/system/terminal/` and assert 404
    - _Requirements: 15.3_

  - [ ]* 18.8 Write unit tests for management commands using `call_command()` with mocked stdin
    - Test `backup_db` with confirmation `'yes'` (should write file) and `'no'` (should abort)
    - _Requirements: 15.5_

- [ ] 19. Add review spam and abuse protection
  - [ ] 19.1 Create `Savdoon-backend/orders/throttles.py` with review throttle classes
    - Implement `ReviewUserThrottle(UserRateThrottle)` with `scope = 'review_user'`
    - Implement `ReviewAnonThrottle(AnonRateThrottle)` with `scope = 'review_anon'`
    - _Requirements: 16.1, 16.2_

  - [ ] 19.2 Register throttle rates in `settings.py` and apply to the review ViewSet
    - Add `'review_user': '5/hour'` and `'review_anon': '3/hour'` to `DEFAULT_THROTTLE_RATES`
    - Set `throttle_classes = [ReviewUserThrottle, ReviewAnonThrottle]` on the review ViewSet
    - _Requirements: 16.1, 16.2, 16.3_

  - [ ] 19.3 Add review body and rating validation to the review serializer
    - Validate that the review body is non-empty and non-whitespace-only; return HTTP 400 if invalid
    - Validate that the rating is an integer between 1 and 5 inclusive; return HTTP 400 if out of range
    - _Requirements: 16.4, 16.5_

  - [ ]* 19.4 Write property test for review body whitespace rejection — Property 16
    - **Property 16: Review body whitespace rejection**
    - Use `st.text(alphabet=st.characters(whitelist_categories=('Zs', 'Cc')))` for whitespace-only bodies
    - Assert HTTP 400 is returned for all whitespace-only inputs
    - Tag: `# Feature: platform-quality-improvements, Property 16`
    - **Validates: Requirements 16.4**

  - [ ]* 19.5 Write property test for review rating range validation — Property 17
    - **Property 17: Review rating range validation**
    - Use `st.integers()` for rating values
    - Assert HTTP 400 for values outside [1, 5] and validation passes for values in [1, 5]
    - Tag: `# Feature: platform-quality-improvements, Property 17`
    - **Validates: Requirements 16.5**

  - [ ]* 19.6 Write integration tests for review rate limiting
    - Use `APIClient` to send 6 authenticated requests and assert the 6th returns HTTP 429
    - _Requirements: 16.1, 16.3_

- [ ] 20. Verify and harden the password reset flow
  - [ ] 20.1 Ensure password reset returns HTTP 200 for both existing and non-existing emails
    - Audit the password reset request view; update it to always return HTTP 200 with an identical response body
    - _Requirements: 17.1_

  - [ ] 20.2 Set `PASSWORD_RESET_TIMEOUT` to 3600 seconds in `settings.py`
    - Verify the setting is applied and tokens expire after 1 hour
    - _Requirements: 17.2_

  - [ ] 20.3 Verify token one-time use and JWT invalidation after password reset
    - Confirm the password reset confirm view invalidates the token after use
    - Confirm all existing JWT refresh tokens for the user are blacklisted after a successful reset (using the existing JWT blacklist)
    - _Requirements: 17.3, 17.5_

  - [ ] 20.4 Verify `AUTH_PASSWORD_VALIDATORS` are enforced during password reset
    - Confirm the password reset confirm view runs validators and returns HTTP 400 with descriptive errors on failure
    - _Requirements: 17.4_

  - [ ]* 20.5 Write property test for password reset user enumeration prevention — Property 18
    - **Property 18: Password reset user enumeration prevention**
    - Use `st.emails()` for email addresses (existing and non-existing)
    - Assert HTTP 200 with identical response body structure for all inputs
    - Tag: `# Feature: platform-quality-improvements, Property 18`
    - **Validates: Requirements 17.1**

  - [ ]* 20.6 Write property test for token one-time use — Property 19
    - **Property 19: Password reset token one-time use**
    - Use `st.text()` for token values
    - Assert a second use of the same token returns HTTP 400 or HTTP 403
    - Tag: `# Feature: platform-quality-improvements, Property 19`
    - **Validates: Requirements 17.3**

  - [ ]* 20.7 Write property test for token expiry — Property 20
    - **Property 20: Password reset token expiry**
    - Use `st.integers(min_value=3601)` for seconds elapsed since token issuance
    - Assert HTTP 400 or HTTP 403 for expired tokens
    - Tag: `# Feature: platform-quality-improvements, Property 20`
    - **Validates: Requirements 17.2**

  - [ ]* 20.8 Write property test for JWT invalidation after password reset — Property 21
    - **Property 21: JWT invalidation after password reset**
    - Use `st.text()` for user data
    - Assert that a JWT refresh token issued before a successful password reset returns HTTP 401 after the reset
    - Tag: `# Feature: platform-quality-improvements, Property 21`
    - **Validates: Requirements 17.5**

- [ ] 21. Remove credential logging and extend `SensitiveDataFilter`
  - [ ] 21.1 Remove all `print()` statements from `Savdoon-backend/accounts/views.py` `SuperAdminLoginView`
    - Audit the superadmin authentication code for any `print()` or log calls that output passwords, tokens, or credentials in plaintext
    - _Requirements: 18.1_

  - [ ] 21.2 Extend `SensitiveDataFilter` in `Savdoon-backend/savdoon/logging_filters.py`
    - Mask any `LogRecord` attribute or `args` dict key matching `password`, `token`, `secret`, `key`, or `credential` (case-insensitive) with a redacted placeholder string
    - _Requirements: 18.3_

  - [ ] 21.3 Update `LOGGING` configuration in `settings.py`
    - Add the `accounts` logger to `LOGGING['loggers']` with the `mask_sensitive_data` filter
    - Ensure the `savdoon` logger also routes through `mask_sensitive_data`
    - _Requirements: 18.2, 18.4_

  - [ ]* 21.4 Write property test for sensitive data log masking — Property 22
    - **Property 22: Sensitive data log masking**
    - Use `st.fixed_dictionaries({'password': st.text(), 'token': st.text()})` for log record args
    - Assert `SensitiveDataFilter` replaces all matching field values with a redacted placeholder
    - Tag: `# Feature: platform-quality-improvements, Property 22`
    - **Validates: Requirements 18.3**

  - [ ]* 21.5 Write static analysis test asserting no `print(` calls remain in `accounts/views.py` `SuperAdminLoginView`
    - _Requirements: 18.1_

- [ ] 22. Final Checkpoint — All Tracks
  - Ensure all tests pass across Track 1 (Responsiveness), Track 2 (i18n), and Track 3 (Security). Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use **fast-check** (TypeScript/React) and **Hypothesis** (Python/Django)
- Checkpoints at tasks 8, 14, and 22 ensure incremental validation across tracks
- The design document's Correctness Properties section defines 23 properties; all are covered by property test sub-tasks above
- Management commands (task 18) replace the removed `TerminalView` and are accessible only via the server CLI
