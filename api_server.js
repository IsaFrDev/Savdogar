/**
 * 🚀 SAVDOGAR STANDALONE INTEGRATION API SERVER
 * This server acts as a clean REST API bridge between Savdogar's Supabase backend and any external application.
 * 
 * How to run:
 * 1. Install dependencies: npm install express @supabase/supabase-js cors dotenv
 * 2. Run the server: node api_server.js
 */
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS so external apps (like mobile or other websites) can make requests
app.use(cors());
app.use(express.json());

// Supabase configuration - automatically fallback to your exact keys
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bylfcmpkmlzfnzhlnqpk.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5bGZjbXBrbWx6Zm56aGxucXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODQxMzMsImV4cCI6MjA5MzY2MDEzM30.bYIbhftJoSPfg5UVW35Di40On_DLyOSFalXjUpUcyD4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('⚡ Savdogar Supabase API Client connected to:', SUPABASE_URL);

// --- MIDDLWARE TO PROTECT ENDPOINTS USING SUPABASE JWT ---
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Access token kiritilishi shart (Authorization: Bearer <token>)" });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        return res.status(403).json({ error: "Yaroqsiz yoki muddati o'tgan API token" });
    }

    req.user = user;
    next();
};

// ==================== API ENDPOINTS ====================

// 1. Health check / Ping
app.get('/api/ping', (req, res) => {
    res.json({ status: 'ok', message: 'Savdogar API Server is running successfully!' });
});

// 2. USER LOGIN (Returns User details and JWT Access Token)
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email va parolni kiritish shart" });
    }

    // Standardize local login formats
    const authEmail = email.includes('@') ? email : `${email}@savdogar.local`;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: authEmail,
            password
        });

        if (error) throw error;

        res.json({
            success: true,
            message: "Muvaffaqiyatli kirildi",
            token: data.session.access_token,
            expires_in: data.session.expires_in,
            user: {
                id: data.user.id,
                email: data.user.email,
                role: data.user.user_metadata?.role || 'store_admin'
            }
        });
    } catch (error) {
        res.status(401).json({ error: error.message || "Login yoki parol noto'g'ri" });
    }
});

// 3. GET ALL STORES (Public or filterable)
app.get('/api/stores', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('stores')
            .select('*')
            .eq('status', 'approved');

        if (error) throw error;
        res.json({ success: true, count: data.length, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. GET PRODUCTS (For a specific store)
app.get('/api/products', async (req, res) => {
    const { store_id } = req.query;

    try {
        let query = supabase.from('products').select('*');
        
        if (store_id) {
            query = query.eq('store_id', store_id);
        }

        const { data, error } = await query;
        if (error) throw error;

        res.json({ success: true, count: data.length, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. GET ORDERS (Protected: Only authenticated user can view)
app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, count: data.length, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 6. CREATE ORDER (Can be public for customers or protected)
app.post('/api/orders', async (req, res) => {
    const { store_id, items, total_amount, customer_name, customer_phone } = req.body;

    if (!store_id || !total_amount) {
        return res.status(400).json({ error: "store_id va total_amount yuborilishi shart" });
    }

    try {
        const { data, error } = await supabase
            .from('orders')
            .insert([{
                store_id,
                items,
                total_amount,
                customer_name,
                customer_phone,
                status: 'pending',
                created_at: new Date().toISOString()
            }])
            .select();

        if (error) throw error;
        res.status(201).json({ success: true, message: "Buyurtma yaratildi", order: data[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start listening
app.listen(PORT, () => {
    console.log(`🚀 Savdogar API Server running on http://localhost:${PORT}`);
    console.log(`📌 Endpoints available:`);
    console.log(`   - GET  http://localhost:${PORT}/api/ping`);
    console.log(`   - POST http://localhost:${PORT}/api/login`);
    console.log(`   - GET  http://localhost:${PORT}/api/stores`);
    console.log(`   - GET  http://localhost:${PORT}/api/products`);
    console.log(`   - GET  http://localhost:${PORT}/api/orders (Protected)`);
    console.log(`   - POST http://localhost:${PORT}/api/orders`);
});
