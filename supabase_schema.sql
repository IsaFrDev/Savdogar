-- Savdoon Supabase Schema Initialization
-- Run this in your Supabase SQL Editor to create missing tables.

-- 1. Profiles (Extends Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    username TEXT UNIQUE,
    avatar TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Stores
CREATE TABLE IF NOT EXISTS public.stores (
    id BIGSERIAL PRIMARY KEY,
    owner_id UUID REFERENCES auth.users ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    business_type TEXT,
    description TEXT,
    logo TEXT,
    banner TEXT,
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected, draft
    rejection_reason TEXT,
    ui_schema JSONB DEFAULT '{}',
    store_files JSONB DEFAULT '{}',
    subscription_expiry TIMESTAMPTZ,
    contract_signed BOOLEAN DEFAULT FALSE,
    signature_data TEXT,
    telegram_username TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Categories
CREATE TABLE IF NOT EXISTS public.categories (
    id BIGSERIAL PRIMARY KEY,
    store_id BIGINT REFERENCES public.stores ON DELETE CASCADE,
    name TEXT NOT NULL,
    name_uz TEXT,
    name_ru TEXT,
    slug TEXT,
    image TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Products
CREATE TABLE IF NOT EXISTS public.products (
    id BIGSERIAL PRIMARY KEY,
    store_id BIGINT REFERENCES public.stores ON DELETE CASCADE,
    category_id BIGINT REFERENCES public.categories ON DELETE SET NULL,
    name TEXT NOT NULL,
    name_uz TEXT,
    name_ru TEXT,
    slug TEXT,
    description TEXT,
    description_uz TEXT,
    description_ru TEXT,
    price DECIMAL(15,2) DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    sku TEXT,
    image TEXT,
    unit TEXT DEFAULT 'dona',
    active BOOLEAN DEFAULT TRUE,
    seo_tags TEXT,
    seo_tags_uz TEXT,
    seo_tags_ru TEXT,
    variants JSONB DEFAULT '[]',
    product_attributes JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Orders (The missing table causing errors)
CREATE TABLE IF NOT EXISTS public.orders (
    id BIGSERIAL PRIMARY KEY,
    store_id BIGINT REFERENCES public.stores ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users ON DELETE SET NULL,
    customer_name TEXT,
    customer_phone TEXT,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'pending', -- pending, confirmed, out_for_delivery, completed, cancelled
    payment_status TEXT DEFAULT 'pending',
    payment_method TEXT,
    delivery_address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    courier_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES public.orders ON DELETE CASCADE,
    product_id BIGINT REFERENCES public.products ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(15,2) NOT NULL DEFAULT 0,
    variant_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Staff
CREATE TABLE IF NOT EXISTS public.staff (
    id BIGSERIAL PRIMARY KEY,
    store_id BIGINT REFERENCES public.stores ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    name TEXT,
    role TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for basic tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Allow read/write for now to restore functionality)
-- Note: These are very permissive for debugging purposes.
DROP POLICY IF EXISTS "Public read for profiles" ON public.profiles;
CREATE POLICY "Public read for profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read for stores" ON public.stores;
CREATE POLICY "Public read for stores" ON public.stores FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read for categories" ON public.categories;
CREATE POLICY "Public read for categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read for products" ON public.products;
CREATE POLICY "Public read for products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read for orders" ON public.orders;
CREATE POLICY "Public read for orders" ON public.orders FOR SELECT USING (true);

-- Ensure authenticated users can insert/update/delete (simplified for debugging)
DROP POLICY IF EXISTS "Authenticated users can insert stores" ON public.stores;
CREATE POLICY "Authenticated users can insert stores" ON public.stores FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update stores" ON public.stores;
CREATE POLICY "Authenticated users can update stores" ON public.stores FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete stores" ON public.stores;
CREATE POLICY "Authenticated users can delete stores" ON public.stores FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.categories;
CREATE POLICY "Authenticated users can insert categories" ON public.categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update categories" ON public.categories;
CREATE POLICY "Authenticated users can update categories" ON public.categories FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete categories" ON public.categories;
CREATE POLICY "Authenticated users can delete categories" ON public.categories FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
CREATE POLICY "Authenticated users can insert products" ON public.products FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
CREATE POLICY "Authenticated users can update products" ON public.products FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;
CREATE POLICY "Authenticated users can delete products" ON public.products FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert orders" ON public.orders;
CREATE POLICY "Authenticated users can insert orders" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;
CREATE POLICY "Authenticated users can update orders" ON public.orders FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete orders" ON public.orders;
CREATE POLICY "Authenticated users can delete orders" ON public.orders FOR DELETE USING (auth.role() = 'authenticated');

-- Order Items Policies
DROP POLICY IF EXISTS "Public read for order_items" ON public.order_items;
CREATE POLICY "Public read for order_items" ON public.order_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert for order_items" ON public.order_items;
CREATE POLICY "Public insert for order_items" ON public.order_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update order_items" ON public.order_items;
CREATE POLICY "Authenticated users can update order_items" ON public.order_items FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete order_items" ON public.order_items;
CREATE POLICY "Authenticated users can delete order_items" ON public.order_items FOR DELETE USING (auth.role() = 'authenticated');

-- Staff Policies
DROP POLICY IF EXISTS "Public read for staff" ON public.staff;
CREATE POLICY "Public read for staff" ON public.staff FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage staff" ON public.staff;
CREATE POLICY "Authenticated users can manage staff" ON public.staff FOR ALL USING (auth.role() = 'authenticated');

-- 8. Club Zones
CREATE TABLE IF NOT EXISTS public.club_zones (
    id BIGSERIAL PRIMARY KEY,
    store_id BIGINT REFERENCES public.stores ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., 'Obshiy zal', 'VIP'
    description TEXT,
    hourly_price DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Club Devices (PCs/Consoles)
CREATE TABLE IF NOT EXISTS public.club_devices (
    id BIGSERIAL PRIMARY KEY,
    store_id BIGINT REFERENCES public.stores ON DELETE CASCADE,
    zone_id BIGINT REFERENCES public.club_zones ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., 'PC-01', 'PS5-02'
    status TEXT DEFAULT 'available', -- available, busy, maintenance, booked
    specifications JSONB DEFAULT '{}', -- CPU, GPU, RAM etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Club Tariffs (Packages)
CREATE TABLE IF NOT EXISTS public.club_tariffs (
    id BIGSERIAL PRIMARY KEY,
    store_id BIGINT REFERENCES public.stores ON DELETE CASCADE,
    zone_id BIGINT REFERENCES public.club_zones ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., 'Night Package', '3 Hour Special'
    start_time TIME, -- For time-based packages
    end_time TIME,
    duration_minutes INTEGER, -- For duration_minutes-based packages
    price DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Club Bookings
CREATE TABLE IF NOT EXISTS public.club_bookings (
    id BIGSERIAL PRIMARY KEY,
    store_id BIGINT REFERENCES public.stores ON DELETE CASCADE,
    device_id BIGINT REFERENCES public.club_devices ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users ON DELETE SET NULL,
    customer_name TEXT,
    customer_phone TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, confirmed, cancelled, completed
    total_price DECIMAL(15,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Club Sessions (Real-time tracking)
CREATE TABLE IF NOT EXISTS public.club_sessions (
    id BIGSERIAL PRIMARY KEY,
    store_id BIGINT REFERENCES public.stores ON DELETE CASCADE,
    device_id BIGINT REFERENCES public.club_devices ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users ON DELETE SET NULL,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    status TEXT DEFAULT 'active', -- active, completed
    tariff_id BIGINT REFERENCES public.club_tariffs ON DELETE SET NULL,
    total_amount DECIMAL(15,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for club tables
ALTER TABLE public.club_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_sessions ENABLE ROW LEVEL SECURITY;

-- Basic Policies for club tables
DROP POLICY IF EXISTS "Public read for club_zones" ON public.club_zones;
CREATE POLICY "Public read for club_zones" ON public.club_zones FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read for club_devices" ON public.club_devices;
CREATE POLICY "Public read for club_devices" ON public.club_devices FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read for club_tariffs" ON public.club_tariffs;
CREATE POLICY "Public read for club_tariffs" ON public.club_tariffs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read for club_bookings" ON public.club_bookings;
CREATE POLICY "Public read for club_bookings" ON public.club_bookings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read for club_sessions" ON public.club_sessions;
CREATE POLICY "Public read for club_sessions" ON public.club_sessions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage club data" ON public.club_zones;
CREATE POLICY "Authenticated users can manage club data" ON public.club_zones FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage club devices" ON public.club_devices;
CREATE POLICY "Authenticated users can manage club devices" ON public.club_devices FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage club tariffs" ON public.club_tariffs;
CREATE POLICY "Authenticated users can manage club tariffs" ON public.club_tariffs FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage club bookings" ON public.club_bookings;
CREATE POLICY "Authenticated users can manage club bookings" ON public.club_bookings FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage club sessions" ON public.club_sessions;
CREATE POLICY "Authenticated users can manage club sessions" ON public.club_sessions FOR ALL USING (auth.role() = 'authenticated');

-- 13. Club Management Triggers & Helpers
-- Automatically sync device status when session starts/ends
CREATE OR REPLACE FUNCTION public.handle_club_session_status()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Mark device as busy when a new active session starts
        IF (NEW.status = 'active') THEN
            UPDATE public.club_devices 
            SET status = 'busy' 
            WHERE id = NEW.device_id;
        END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Mark device as available when session completes
        IF (NEW.status = 'completed' AND OLD.status = 'active') THEN
            UPDATE public.club_devices 
            SET status = 'available' 
            WHERE id = NEW.device_id;
        ELSIF (NEW.status = 'active' AND OLD.status = 'completed') THEN
             UPDATE public.club_devices 
             SET status = 'busy' 
             WHERE id = NEW.device_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_club_session_status_change ON public.club_sessions;
CREATE TRIGGER on_club_session_status_change
    AFTER INSERT OR UPDATE ON public.club_sessions
    FOR EACH ROW EXECUTE FUNCTION public.handle_club_session_status();

-- View for reporting
CREATE OR REPLACE VIEW public.club_daily_stats WITH (security_invoker = true) AS
SELECT 
    store_id,
    COUNT(id) as total_sessions,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_session_price,
    DATE(created_at) as report_date
FROM public.club_sessions
GROUP BY store_id, DATE(created_at);

-- 14. Customers & Loyalty (CRM)
CREATE TABLE IF NOT EXISTS public.customers (
    id BIGSERIAL PRIMARY KEY,
    store_id BIGINT REFERENCES public.stores ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    telegram_id TEXT,
    birth_date DATE,
    balance DECIMAL(15,2) DEFAULT 0,
    cashback_balance DECIMAL(15,2) DEFAULT 0,
    tier TEXT DEFAULT 'regular', -- regular, silver, gold, vip
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth users manage customers" ON public.customers;
CREATE POLICY "Auth users manage customers" ON public.customers FOR ALL USING (auth.role() = 'authenticated');

-- Update club_sessions to link to customers and track cancellations
ALTER TABLE public.club_sessions ADD COLUMN IF NOT EXISTS customer_id BIGINT REFERENCES public.customers ON DELETE SET NULL;
ALTER TABLE public.club_sessions ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
ALTER TABLE public.club_sessions ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users ON DELETE SET NULL;

-- Update stores table to hold feature toggles
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"loyalty_enabled": false, "happy_hours_enabled": false}'::jsonb;

-- 15. Mini-Bar & POS (Session Orders)
CREATE TABLE IF NOT EXISTS public.club_session_orders (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT REFERENCES public.club_sessions ON DELETE CASCADE,
    product_id BIGINT REFERENCES public.products ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(15,2) NOT NULL,
    total DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.club_session_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth users manage session orders" ON public.club_session_orders;
CREATE POLICY "Auth users manage session orders" ON public.club_session_orders FOR ALL USING (auth.role() = 'authenticated');

-- 16. Shift Management
CREATE TABLE IF NOT EXISTS public.shifts (
    id BIGSERIAL PRIMARY KEY,
    store_id BIGINT REFERENCES public.stores ON DELETE CASCADE,
    staff_id UUID REFERENCES auth.users ON DELETE CASCADE,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    cash_expected DECIMAL(15,2) DEFAULT 0,
    cash_actual DECIMAL(15,2) DEFAULT 0,
    card_expected DECIMAL(15,2) DEFAULT 0,
    card_actual DECIMAL(15,2) DEFAULT 0,
    status TEXT DEFAULT 'open', -- open, closed
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth users manage shifts" ON public.shifts;
CREATE POLICY "Auth users manage shifts" ON public.shifts FOR ALL USING (auth.role() = 'authenticated');

-- 17. Happy Hours & Dynamic Pricing
CREATE TABLE IF NOT EXISTS public.club_happy_hours (
    id BIGSERIAL PRIMARY KEY,
    store_id BIGINT REFERENCES public.stores ON DELETE CASCADE,
    zone_id BIGINT REFERENCES public.club_zones ON DELETE CASCADE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    discount_percentage INTEGER NOT NULL DEFAULT 0,
    days_of_week INTEGER[] DEFAULT '{1,2,3,4,5,6,0}', -- 0=Sun, 1=Mon...
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.club_happy_hours ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth users manage happy hours" ON public.club_happy_hours;
CREATE POLICY "Auth users manage happy hours" ON public.club_happy_hours FOR ALL USING (auth.role() = 'authenticated');

-- 18. Expense Tracking
CREATE TABLE IF NOT EXISTS public.expenses (
    id BIGSERIAL PRIMARY KEY,
    store_id BIGINT REFERENCES public.stores ON DELETE CASCADE,
    category TEXT NOT NULL, -- rent, utilities, salary, inventory, other
    amount DECIMAL(15,2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    description TEXT,
    recorded_by UUID REFERENCES auth.users ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth users manage expenses" ON public.expenses;
CREATE POLICY "Auth users manage expenses" ON public.expenses FOR ALL USING (auth.role() = 'authenticated');
