# Design Document — Platform Quality Improvements

## Overview

This document describes the technical design for three cross-cutting quality improvement tracks on the **Savdogar** multi-vendor e-commerce platform:

1. **Track 1 — Responsiveness**: Make the web dashboard and storefront fully usable on mobile and tablet viewports.
2. **Track 2 — Internationalization (i18n)**: Eliminate all hardcoded strings from the web frontend and mobile app; add server-side language negotiation.
3. **Track 3 — Security**: Remove committed secrets, harden configuration, enable rate limiting, eliminate the terminal RCE endpoint, and add abuse protection.

The platform stack is:
- **Web frontend**: React 19 + TypeScript + Vite + TailwindCSS (`src/`)
- **Backend**: Django 6 + DRF + PostgreSQL (`Savdogar-backend/`)
- **Mobile**: React Native + Expo (`mobile/`)

---

## Architecture

### Track 1 — Responsiveness

The responsiveness work follows a **hook-driven layout switching** pattern. Viewport-aware logic is centralized in custom React hooks (`useSidebar`, `useMediaQuery`) so that components remain declarative and testable. CSS layout changes are expressed exclusively through TailwindCSS utility classes; no inline styles are added for responsive behavior.

```
┌─────────────────────────────────────────────────────────────┐
│  Component Layer (Dashboard, Orders, Storefront, Modal…)    │
│  Reads: isMobile, sidebarOpen, layoutMode                   │
└────────────────────┬────────────────────────────────────────┘
                     │ consumes
┌────────────────────▼────────────────────────────────────────┐
│  Hook Layer                                                  │
│  useSidebar()  →  { sidebarOpen, setSidebarOpen, isMobile } │
│  useMediaQuery(query) → boolean                             │
└────────────────────┬────────────────────────────────────────┘
                     │ reads
┌────────────────────▼────────────────────────────────────────┐
│  Browser / window.matchMedia                                 │
└─────────────────────────────────────────────────────────────┘
```

### Track 2 — i18n

The web frontend already has a custom `t()` function backed by `src/i18n/translations.ts`. The design extends this system with a `TranslationKey` union type for compile-time safety and completes the key coverage. The mobile app gets a parallel i18n module (`mobile/src/i18n/`) that shares the same key namespace. The backend adds a thin middleware that reads `Accept-Language` and activates the appropriate Django translation catalog.

```
Web Frontend                    Mobile App                  Backend
─────────────────               ──────────────────          ──────────────────────
translations.ts                 mobile/src/i18n/            Django i18n middleware
  ├── en: { ... }                 ├── translations.ts        reads Accept-Language
  ├── uz: { ... }                 ├── en.json               activates translation
  └── ru: { ... }                 ├── uz.json               catalog for request
TranslationKey (union type)       └── ru.json
t(key: TranslationKey)          useTranslation() hook
                                AsyncStorage persistence
```

### Track 3 — Security

Security changes are isolated to the backend and configuration layer. No frontend logic changes are required for security. The design follows a **defense-in-depth** approach:

```
Request → Rate Limiting (DRF throttle) → Authentication (django-axes) → View
                                                                          │
                                                                          ▼
                                                              Logging (SensitiveDataFilter)
```

The terminal endpoint is removed entirely; its utility functions are migrated to Django management commands accessible only via the server CLI.

---

## Components and Interfaces

### Track 1 — Responsiveness

#### `useSidebar` Hook

```typescript
// src/hooks/useSidebar.ts
interface UseSidebarReturn {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
}

function useSidebar(breakpoint: number = 1280): UseSidebarReturn
```

- Initializes `isMobile` from `window.innerWidth < breakpoint` (SSR-safe with `typeof window !== 'undefined'` guard).
- Attaches a `resize` event listener; debounces at 100 ms.
- When `isMobile` transitions to `true`, automatically sets `sidebarOpen = false`.
- Replaces the inline `isMobile` / `sidebarOpen` state currently in `Dashboard.tsx`.

#### `useMediaQuery` Hook

```typescript
// src/hooks/useMediaQuery.ts
function useMediaQuery(query: string): boolean
```

- Wraps `window.matchMedia(query).matches` with a `change` event listener.
- Used by `Orders.tsx` to switch between Kanban and tab-based layout at 768 px.
- Used by `Storefront.tsx` for nav collapse at 768 px and grid column count.

#### `ResponsiveTable` Component

```typescript
// src/components/ResponsiveTable.tsx
interface Column<T> {
  key: string;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  isAction?: boolean;
}

interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
}

function ResponsiveTable<T>(props: ResponsiveTableProps<T>): JSX.Element
```

- Uses `useMediaQuery('(max-width: 767px)')` to switch between `<table>` and card list.
- At 768–1024 px: wraps `<table>` in a `div` with `overflow-x: auto` and a scroll-shadow affordance.
- Card layout: renders each row as a `<div>` with label–value pairs stacked vertically; action columns render as a full-width button row at the bottom.

#### `MobileKanban` Component (Orders)

```typescript
// src/components/MobileKanban.tsx
interface MobileKanbanProps {
  statuses: readonly string[];
  orders: Order[];
  activeStatus: string;
  onStatusChange: (status: string) => void;
  onOrderClick: (order: Order) => void;
  renderCard: (order: Order) => React.ReactNode;
}
```

- Renders a horizontal tab bar of status labels.
- Shows only the orders for `activeStatus`.
- Used by `Orders.tsx` when `useMediaQuery('(max-width: 767px)')` is true.

#### `BottomSheet` Component

```typescript
// src/components/BottomSheet.tsx
interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoint?: '90vh' | '100vh';
}
```

- Renders as a fixed panel anchored to the bottom of the viewport at full width.
- Used by `Orders.tsx` for the order detail panel on mobile.
- Used by `Storefront.tsx` for modals/drawers on mobile.
- Animated with `framer-motion` (`y: '100%'` → `y: 0`).

#### `Modal` Component Updates

The existing modal pattern is updated to:
- Apply `w-full max-h-[90vh] overflow-y-auto` on viewports < 640 px.
- Keep the close button in a `sticky top-0` header so it is always reachable.

### Track 2 — i18n

#### `TranslationKey` Type

```typescript
// src/i18n/translations.ts (addition)
export type TranslationKey = keyof typeof translations['uz'];
```

The `uz` object is the canonical source of truth for key names (it is the most complete). The `t()` function signature is updated:

```typescript
// src/context/AppContext.tsx
t: (key: TranslationKey) => string
```

TypeScript will now produce a compile error for any `t()` call with an unknown key.

#### Fallback Chain

```
t(key) → translations[activeLanguage][key]
       ?? translations['uz'][key]
       ?? key   // raw key as last resort
```

#### Mobile i18n Module

```typescript
// mobile/src/i18n/index.ts
export type Language = 'en' | 'uz' | 'ru';
export type TranslationKey = keyof typeof translations['uz'];

export function t(key: TranslationKey, lang: Language): string;
export function useTranslation(): { t: (key: TranslationKey) => string; language: Language; setLanguage: (lang: Language) => void };
```

- `setLanguage` persists the selection to `AsyncStorage` under the key `'@savdogar_language'`.
- On app start, the stored language is loaded before the first render (via `useEffect` in `AuthProvider` or a dedicated `I18nProvider`).
- Translation files (`en.json`, `uz.json`, `ru.json`) share the same key namespace as the web `translations.ts`.

#### Backend Language Middleware

```python
# Savdogar-backend/savdogar/middleware.py (new class)
class AcceptLanguageMiddleware:
    SUPPORTED = {'uz', 'ru', 'en'}
    DEFAULT = 'uz'

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        lang = self._parse(request.META.get('HTTP_ACCEPT_LANGUAGE', ''))
        translation.activate(lang)
        request.LANGUAGE_CODE = lang
        response = self.get_response(request)
        translation.deactivate()
        return response

    def _parse(self, header: str) -> str:
        # Parse RFC 5646 language tags, return first supported match
        ...
```

Added to `MIDDLEWARE` in `settings.py` after `CommonMiddleware`.

### Track 3 — Security

#### Secret Key Validator (`settings.py`)

```python
KNOWN_WEAK_KEYS = {
    'savdogar-vibrant-premium-ai-secure-key-2026-unique-production-ready',
    'django-insecure',  # prefix check
}

def _validate_secret_key(key: str) -> None:
    if not key:
        raise ImproperlyConfigured('DJANGO_SECRET_KEY must not be empty')
    if len(key) < 50:
        raise ImproperlyConfigured('DJANGO_SECRET_KEY must be at least 50 characters')
    if key in KNOWN_WEAK_KEYS or key.startswith('django-insecure'):
        raise ImproperlyConfigured('DJANGO_SECRET_KEY matches a known weak value')
```

#### Production Config Validator (`settings.py`)

```python
def _validate_production_config(debug: bool, allowed_hosts: list[str]) -> None:
    if debug and '*' in allowed_hosts:
        raise ImproperlyConfigured(
            'DJANGO_DEBUG=True with ALLOWED_HOSTS=["*"] is not permitted'
        )
    if debug:
        import warnings
        warnings.warn('DEBUG mode is active — do not use in production', RuntimeWarning)
```

#### Review Throttle Classes

```python
# Savdogar-backend/orders/throttles.py (new file)
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle

class ReviewUserThrottle(UserRateThrottle):
    scope = 'review_user'   # 5/hour in DEFAULT_THROTTLE_RATES

class ReviewAnonThrottle(AnonRateThrottle):
    scope = 'review_anon'   # 3/hour in DEFAULT_THROTTLE_RATES
```

Applied to the review `ViewSet` via `throttle_classes = [ReviewUserThrottle, ReviewAnonThrottle]`.

#### Management Commands (replacing TerminalView)

```
Savdogar-backend/
  savdogar/
    management/
      commands/
        backup_db.py       # dumpdata with --confirm flag
        db_stats.py        # prints model counts
        clear_cache.py     # cache.clear()
        auth_sessions.py   # lists active sessions
```

`backup_db.py` prompts `"Type 'yes' to confirm backup: "` and aborts if the response is not `yes`.

#### `SensitiveDataFilter` Extension

The existing `SensitiveDataFilter` in `savdogar/logging_filters.py` is extended to mask any `LogRecord` attribute or `args` dict key matching: `password`, `token`, `secret`, `key`, `credential` (case-insensitive). The `accounts` logger is added to `LOGGING['loggers']` with the `mask_sensitive_data` filter.

---

## Data Models

No new database models are introduced by this work. The changes are:

| Track | Data change |
|-------|-------------|
| Responsiveness | None — pure UI/hook changes |
| i18n (web) | None — `translations.ts` is a static file |
| i18n (mobile) | `AsyncStorage` key `'@savdogar_language'` stores a `Language` string |
| i18n (backend) | No model changes; Django's built-in i18n catalog is used |
| Security — secrets | `.env` values replaced with placeholders; no model changes |
| Security — axes | `django-axes` already installed; `AxesStandaloneBackend` uncommented |
| Security — terminal | `TerminalView` removed; management commands added (no DB schema change) |
| Security — reviews | `throttle_classes` added to existing viewset; no model changes |
| Security — password reset | Token expiry enforced via `PASSWORD_RESET_TIMEOUT` setting; JWT blacklist already enabled |
| Security — logging | `SensitiveDataFilter` extended; no model changes |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Sidebar mobile detection

*For any* viewport width, `useSidebar()` SHALL return `isMobile = true` if and only if the width is strictly less than 1280 px, and SHALL initialize `sidebarOpen = false` when `isMobile` is true.

**Validates: Requirements 1.1, 1.4**

---

### Property 2: Navigation item closes sidebar on mobile

*For any* tab identifier and any mobile viewport (width < 1280 px), invoking the tab-click handler SHALL set `sidebarOpen` to `false`.

**Validates: Requirements 1.3**

---

### Property 3: ResponsiveTable layout mode

*For any* viewport width, `ResponsiveTable` SHALL render the card layout when width < 768 px and the table layout when width ≥ 768 px.

**Validates: Requirements 2.1, 2.2**

---

### Property 4: Card layout column completeness

*For any* array of column definitions and any data row, the card rendered by `ResponsiveTable` SHALL contain every column label and its corresponding value.

**Validates: Requirements 2.3**

---

### Property 5: Orders Kanban layout switching

*For any* viewport width, the Orders page SHALL render the tab-based layout when width < 768 px and the Kanban layout when width ≥ 768 px.

**Validates: Requirements 3.1, 3.3**

---

### Property 6: Orders tab selection

*For any* status value in the statuses array, clicking that status tab SHALL set the active status to that value, causing only orders with that status to be displayed.

**Validates: Requirements 3.2**

---

### Property 7: Storefront product grid column count

*For any* viewport width, the Storefront product grid SHALL use 1 column when width < 640 px, 2 columns when 640 px ≤ width < 1024 px, and 3 or more columns when width ≥ 1024 px.

**Validates: Requirements 4.1, 4.2, 4.3**

---

### Property 8: Modal responsive rendering

*For any* viewport width less than 640 px, the Modal component SHALL apply full-width and max-height-90vh CSS classes; for widths ≥ 640 px it SHALL apply its standard desktop sizing classes.

**Validates: Requirements 5.1**

---

### Property 9: Drawer bottom-sheet rendering

*For any* viewport width less than 640 px, the Drawer component SHALL render as a bottom sheet (anchored to the bottom, full width); for widths ≥ 640 px it SHALL render as a side panel.

**Validates: Requirements 5.2**

---

### Property 10: Translation key completeness

*For any* key in `TranslationKey`, `translations.en[key]`, `translations.uz[key]`, and `translations.ru[key]` SHALL all be defined non-empty strings.

**Validates: Requirements 7.1, 8.1**

---

### Property 11: Translation fallback chain

*For any* `TranslationKey` and any active language where the key is absent from that language's object, `t(key)` SHALL return `translations['uz'][key]` rather than the raw key string.

**Validates: Requirements 8.2**

---

### Property 12: Backend language negotiation

*For any* language code in `{uz, ru, en}` sent as the `Accept-Language` header, the backend SHALL return user-facing error messages in that language; for any unsupported or absent language code, the backend SHALL return messages in Uzbek.

**Validates: Requirements 10.1, 10.2**

---

### Property 13: API response structure invariance under language change

*For any* API endpoint and any two language codes, the JSON response body structure (set of top-level keys) SHALL be identical regardless of the `Accept-Language` header value.

**Validates: Requirements 10.4**

---

### Property 14: Secret key validation rejects weak keys

*For any* string that is empty, shorter than 50 characters, or matches a known weak placeholder value, `_validate_secret_key()` SHALL raise `ImproperlyConfigured`.

**Validates: Requirements 11.4, 12.1, 12.2**

---

### Property 15: Production config guard

*For any* combination of `DEBUG=True` and `ALLOWED_HOSTS` containing `'*'`, `_validate_production_config()` SHALL raise `ImproperlyConfigured`.

**Validates: Requirements 13.3**

---

### Property 16: Review body whitespace rejection

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines), submitting it as a review body SHALL return HTTP 400.

**Validates: Requirements 16.4**

---

### Property 17: Review rating range validation

*For any* integer value outside the inclusive range [1, 5], submitting it as a review rating SHALL return HTTP 400; for any integer in [1, 5], the rating SHALL pass validation.

**Validates: Requirements 16.5**

---

### Property 18: Password reset user enumeration prevention

*For any* email address (whether or not it exists in the system), a password reset request SHALL return HTTP 200 with an identical response body structure.

**Validates: Requirements 17.1**

---

### Property 19: Password reset token one-time use

*For any* valid password reset token, using it successfully to set a new password SHALL invalidate the token such that a second use of the same token returns HTTP 400 or HTTP 403.

**Validates: Requirements 17.3**

---

### Property 20: Password reset token expiry

*For any* password reset token that was issued more than 3600 seconds ago, attempting to use it SHALL return HTTP 400 or HTTP 403.

**Validates: Requirements 17.2**

---

### Property 21: JWT invalidation after password reset

*For any* JWT refresh token issued before a successful password reset, attempting to use that refresh token after the reset SHALL return HTTP 401.

**Validates: Requirements 17.5**

---

### Property 22: Sensitive data log masking

*For any* log record whose message or `args` dict contains a field with a key matching `password`, `token`, `secret`, `key`, or `credential` (case-insensitive), `SensitiveDataFilter` SHALL replace the field's value with a redacted placeholder string.

**Validates: Requirements 18.3**

---

### Property 23: Blocked login response uniformity

*For any* username (whether or not it exists in the system), when a login attempt is blocked by django-axes, the response SHALL have the same HTTP status code and the same response body structure as for any other blocked attempt.

**Validates: Requirements 14.4**

---

## Error Handling

### Track 1 — Responsiveness

| Scenario | Handling |
|----------|----------|
| `window.matchMedia` not available (SSR / test environment) | `useMediaQuery` returns the `defaultValue` parameter (defaults to `false`) |
| Resize event fires during component unmount | Listener is removed in the `useEffect` cleanup function |
| `useSidebar` called before DOM is ready | Guarded with `typeof window !== 'undefined'`; falls back to `isMobile = true` |

### Track 2 — i18n

| Scenario | Handling |
|----------|----------|
| `t()` called with a key missing from the active language | Falls back to `uz` value, then to the raw key string |
| `AsyncStorage` read fails on mobile app start | Falls back to `'uz'` as the default language; error is logged |
| `Accept-Language` header contains an unsupported language | Backend defaults to `'uz'` |
| `Accept-Language` header is malformed | `_parse()` catches `ValueError`; defaults to `'uz'` |

### Track 3 — Security

| Scenario | Handling |
|----------|----------|
| `DJANGO_SECRET_KEY` is absent at startup | `ImproperlyConfigured` raised immediately; server does not start |
| `DJANGO_SECRET_KEY` is too short or matches a weak value | `ImproperlyConfigured` raised; server does not start |
| `DEBUG=True` with `ALLOWED_HOSTS=['*']` | `ImproperlyConfigured` raised; server does not start |
| Rate limit exceeded on login endpoint | HTTP 429 with `Retry-After` header; response body does not reveal username existence |
| Rate limit exceeded on review endpoint | HTTP 429 |
| Review body is empty or whitespace-only | HTTP 400 with field-level validation error |
| Review rating is out of range | HTTP 400 with field-level validation error |
| Password reset token is expired | HTTP 400 |
| Password reset token is already used | HTTP 400 |
| `backup_db` management command run without confirmation | Command prints a warning and exits without writing any file |
| Request to `/api/system/terminal/` | HTTP 404 (route removed) |

---

## Testing Strategy

### Dual Testing Approach

Both unit/example-based tests and property-based tests are used. Unit tests cover specific examples, integration points, and edge cases. Property-based tests verify universal invariants across a wide input space.

### Property-Based Testing

The project uses **[fast-check](https://github.com/dubzzz/fast-check)** for TypeScript/React property tests and **[Hypothesis](https://hypothesis.readthedocs.io/)** for Python/Django property tests.

Each property test runs a minimum of **100 iterations**.

Tag format: `// Feature: platform-quality-improvements, Property N: <property_text>`

#### Frontend Property Tests (`src/__tests__/`)

| Property | Test file | Arbitraries |
|----------|-----------|-------------|
| P1 — Sidebar mobile detection | `useSidebar.property.test.ts` | `fc.integer({ min: 0, max: 3000 })` for viewport width |
| P2 — Nav closes sidebar on mobile | `useSidebar.property.test.ts` | `fc.string()` for tab id, `fc.integer({ min: 0, max: 1279 })` for width |
| P3 — ResponsiveTable layout mode | `ResponsiveTable.property.test.tsx` | `fc.integer({ min: 0, max: 3000 })` for width |
| P4 — Card column completeness | `ResponsiveTable.property.test.tsx` | `fc.array(fc.record({ key: fc.string(), label: fc.string() }))` |
| P5 — Orders layout switching | `Orders.property.test.tsx` | `fc.integer({ min: 0, max: 3000 })` for width |
| P6 — Orders tab selection | `Orders.property.test.tsx` | `fc.constantFrom(...statuses)` |
| P7 — Storefront grid columns | `Storefront.property.test.tsx` | `fc.integer({ min: 0, max: 3000 })` for width |
| P8 — Modal responsive rendering | `Modal.property.test.tsx` | `fc.integer({ min: 0, max: 3000 })` for width |
| P9 — Drawer bottom-sheet | `Drawer.property.test.tsx` | `fc.integer({ min: 0, max: 3000 })` for width |
| P10 — Translation key completeness | `translations.property.test.ts` | `fc.constantFrom(...Object.keys(translations.uz))` |
| P11 — Translation fallback chain | `translations.property.test.ts` | `fc.constantFrom(...Object.keys(translations.uz))` |

#### Backend Property Tests (`Savdogar-backend/tests/`)

| Property | Test file | Hypothesis strategy |
|----------|-----------|---------------------|
| P12 — Backend language negotiation | `test_i18n_middleware.py` | `st.sampled_from(['uz', 'ru', 'en'])` and `st.text()` for unsupported codes |
| P13 — API structure invariance | `test_i18n_middleware.py` | `st.sampled_from(['uz', 'ru', 'en'])` |
| P14 — Secret key validation | `test_settings_validators.py` | `st.text(max_size=49)` for short keys, `st.just('')` for empty |
| P15 — Production config guard | `test_settings_validators.py` | `st.booleans()` for DEBUG, `st.lists(st.text())` for ALLOWED_HOSTS |
| P16 — Review body whitespace rejection | `test_review_validation.py` | `st.text(alphabet=st.characters(whitelist_categories=('Zs', 'Cc')))` |
| P17 — Review rating range | `test_review_validation.py` | `st.integers()` |
| P18 — Password reset enumeration prevention | `test_password_reset.py` | `st.emails()` |
| P19 — Token one-time use | `test_password_reset.py` | `st.text()` for token values |
| P20 — Token expiry | `test_password_reset.py` | `st.integers(min_value=3601)` for seconds elapsed |
| P21 — JWT invalidation after reset | `test_password_reset.py` | `st.text()` for user data |
| P22 — Sensitive data masking | `test_logging_filters.py` | `st.fixed_dictionaries({'password': st.text(), 'token': st.text()})` |
| P23 — Blocked login uniformity | `test_auth_rate_limiting.py` | `st.text()` for username |

### Unit and Integration Tests

- **Responsiveness**: Snapshot tests at 320 px, 640 px, 768 px, 1024 px, 1280 px viewports using `@testing-library/react` with `window.innerWidth` mocked.
- **i18n coverage**: A static analysis test that imports all dashboard page components and asserts no string literal matches known Uzbek patterns (e.g., `"ta buyurtma mavjud"`, `"Hozirgi holat"`).
- **Rate limiting**: Integration tests using Django's `APIClient` to send N+1 requests and assert the last returns 429.
- **Terminal endpoint removal**: Integration test asserting `POST /api/system/terminal/` returns 404.
- **Management commands**: Unit tests using `call_command()` with `stdin` mocked to simulate confirmation/rejection.
- **Superadmin print removal**: Static analysis test (grep) asserting no `print(` calls remain in `accounts/views.py` `SuperAdminLoginView`.

### Test Configuration

```python
# Hypothesis settings (conftest.py)
from hypothesis import settings
settings.register_profile('ci', max_examples=200)
settings.register_profile('dev', max_examples=50)
settings.load_profile(os.getenv('HYPOTHESIS_PROFILE', 'dev'))
```

```typescript
// fast-check configuration (vitest.config.ts)
// Each fc.assert() call uses { numRuns: 100 } minimum
```
