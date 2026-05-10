import { supabase } from '../supabase';


export const supabaseApi = {
    // Stores
    stores: {
        list: async () => {
            const { data, error } = await supabase.from('stores')
                .select('*');
            if (error) throw error;
            return { data };
        },
        get: async (id: string | number) => {
            const { data, error } = await supabase.from('stores').select('*, profiles(*)').eq('id', id).single();
            if (error) throw error;
            return data;
        },
        update: async (id: number, updateData: any) => {
            const { data, error } = await supabase.from('stores').update(updateData).eq('id', id).select();
            if (error) throw error;
            return data[0];
        },
        create: async (storeData: any) => {
            const { data, error } = await supabase.from('stores')
                .insert([storeData])
                .select();
            if (error) throw error;
            return data[0];
        },
        testTelegram: async (id: number, config: any) => {
            console.log('Testing Telegram Bot with config:', config);
            return { success: true };
        },
        getMarketplace: async () => {
            const { data, error } = await supabase.from('stores')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return { data };
        },
        getNearby: async (lat: number, lon: number) => {
            // In a real Supabase setup, you'd use PostGIS or a RPC function for radius search
            // For now, we'll return all stores as a fallback
            const { data, error } = await supabase.from('stores').select('*');
            if (error) throw error;
            return { data };
        },
        getPendingStores: async () => {
            const { data, error } = await supabase.from('stores')
                .select('*, owner_details:profiles(*)')
                .in('status', ['pending', 'draft']);
            if (error) throw error;
            return { data };
        },
        approveStore: async (id: number) => {
            const { data, error } = await supabase.from('stores').update({ status: 'approved' }).eq('id', id).select();
            if (error) throw error;
            return data[0];
        },
        rejectStore: async (id: number, reason_uz: string, reason_ru: string, reason_en: string) => {
            const { data, error } = await supabase.from('stores').update({ status: 'rejected', rejection_reason: reason_uz }).eq('id', id).select();
            if (error) throw error;
            return data[0];
        },
        downloadContract: async (id: number) => {
            const { data, error } = await supabase.from('stores').select('signature_data, name').eq('id', id).single();
            if (error) throw error;
            // Returning a mock blob content
            return { data: `Contract for ${data.name}\nSignature: ${data.signature_data}` };
        },
        delete: async (id: number) => {
            const { error } = await supabase.from('stores').delete().eq('id', id);
            if (error) throw error;
            return true;
        }
    },
    
    // Builder (No-code Storefront)
    builder: {
        saveSchema: async (storeId: number, ui_schema: any) => {
            const { data, error } = await supabase.from('stores').update({ ui_schema }).eq('id', storeId).select();
            if (error) throw error;
            return data[0];
        },
        saveFiles: async (storeId: number, store_files: any) => {
            const { data, error } = await supabase.from('stores').update({ store_files }).eq('id', storeId).select();
            if (error) throw error;
            return data[0];
        }
    },
    
    // Categories
    categories: {
        list: async (storeId: number) => {
            const { data, error } = await supabase.from('categories').select('*').eq('store_id', storeId);
            if (error) throw error;
            return data;
        },
        create: async (catData: any) => {
            const { data, error } = await supabase.from('categories').insert([catData]).select();
            if (error) throw error;
            return data;
        },
        update: async (id: number, updateData: any) => {
            const { data, error } = await supabase.from('categories').update(updateData).eq('id', id).select();
            if (error) throw error;
            return data;
        },
        delete: async (id: number) => {
            const { error } = await supabase.from('categories').delete().eq('id', id);
            if (error) throw error;
        }
    },

    // Products
    products: {
        list: async (params?: any) => {
            let query = supabase.from('products').select('*, categories(*)');
            if (params?.store) query = query.eq('store_id', params.store);
            const { data, error } = await query;
            if (error) throw error;
            return { data };
        },
        create: async (productData: any) => {
            const { data, error } = await supabase.from('products').insert([productData]).select();
            if (error) throw error;
            return data;
        },
        update: async (id: number, updateData: any) => {
            const { data, error } = await supabase.from('products').update(updateData).eq('id', id).select();
            if (error) throw error;
            return data;
        },
        delete: async (id: number) => {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
        },
        getAiAnalytics: async (storeId: string | number) => {
            // Mocking for now
            return {
                data: {
                    forecast: JSON.stringify({
                        confidence_score: 0.85,
                        forecast_data: [
                            { day: 'Mon', revenue: 1200000, pred: 1300000 },
                            { day: 'Tue', revenue: 1500000, pred: 1400000 },
                            { day: 'Wed', revenue: 1100000, pred: 1250000 },
                            { day: 'Thu', revenue: 1800000, pred: 1750000 },
                            { day: 'Fri', revenue: 2200000, pred: 2100000 }
                        ],
                        forecast_summary: "Kelasi hafta davomida sotuvlar 15% ga oshishi kutilmoqda. Ayniqsa juma kuni eng yuqori ko'rsatkich qayd etilishi mumkin.",
                        trending_products: ['Smartphone X', 'Wireless Buds', 'Leather Wallet']
                    })
                }
            };
        },
        getAiDynamicPricing: async (storeId: string | number) => {
            // Mocking for now
            return {
                data: {
                    suggestions: JSON.stringify([
                        { product_id: 1, name: 'Red T-Shirt', original: 150000, suggested: 125000, reason: 'High stock for 2 months' },
                        { product_id: 2, name: 'Blue Jeans', original: 450000, suggested: 420000, reason: 'Seasonal clearance' }
                    ])
                }
            };
        },
        getAiCustomerInsights: async (storeId: string | number) => {
            // Mocking for now
            return {
                data: {
                    insights: JSON.stringify({
                        segments: {
                            'Loyal': 'Top 10% spenders. Offer VIP membership.',
                            'At Risk': 'Have not ordered in 30 days. Send "We miss you" promo.'
                        }
                    })
                }
            };
        }
    },

    // Orders
    orders: {
        list: async (storeId: number) => {
            const { data, error } = await supabase.from('orders')
                .select('*, order_items(*, products(*))')
                .eq('store_id', storeId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        },
        listAll: async (filters?: any) => {
            let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
            if (filters?.status) query = query.eq('status', filters.status);
            const { data, error } = await query;
            if (error) throw error;
            return { data };
        },
        updateStatus: async (id: number, status: string) => {
            const { data, error } = await supabase.from('orders').update({ status }).eq('id', id).select();
            if (error) throw error;
            return data;
        },
        getStats: async (storeId: number, period: string = '7d') => {
            const { data, error } = await supabase.from('orders').select('*, order_items(*, products(category_id))').eq('store_id', storeId);
            if (error) throw error;
            
            // Basic aggregations
            const total_revenue = data.reduce((acc, curr) => acc + (curr.total || 0), 0);
            const total_orders = data.length;
            
            // History mapping (grouped by day/month based on period)
            const history = data.slice(-10).map(o => ({
                month: new Date(o.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                revenue: o.total,
                orders: 1
            }));

            // Category stats calculation
            const catMap: Record<number, number> = {};
            data.forEach(order => {
                order.order_items?.forEach((item: any) => {
                    const catId = item.products?.category_id || 0;
                    catMap[catId] = (catMap[catId] || 0) + (item.price * item.quantity);
                });
            });

            const category_stats = Object.entries(catMap).map(([id, val]) => ({
                name: `Category ${id}`,
                value: Math.round((val / (total_revenue || 1)) * 100)
            }));

            return {
                total_revenue,
                total_orders,
                pending: data.filter(o => o.status === 'pending').length,
                completed: data.filter(o => o.status === 'completed').length,
                history,
                category_stats
            };
        },
        create: async (orderData: any) => {
            const { data, error } = await supabase.from('orders').insert([orderData]).select();
            if (error) throw error;
            return data[0];
        },
        assignCourier: async (id: number, courierData: { courier_id: number }) => {
            const { data, error } = await supabase.from('orders').update({ courier_id: courierData.courier_id }).eq('id', id).select();
            if (error) throw error;
            return data[0];
        },
        listUserOrders: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');
            const { data, error } = await supabase.from('orders')
                .select('*, order_items(*, products(*))')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        }
    },


    // Employees / Staff
    staff: {
        list: async (storeId: number) => {
            const { data, error } = await supabase.from('staff').select('*').eq('store_id', storeId);
            if (error) throw error;
            return data;
        },
        create: async (storeId: number, staffData: any) => {
            const { data, error } = await supabase.from('staff').insert([{ ...staffData, store_id: storeId }]).select();
            if (error) throw error;
            return data[0];
        },
        delete: async (storeId: number, id: number) => {
            const { error } = await supabase.from('staff').delete().eq('id', id).eq('store_id', storeId);
            if (error) throw error;
            return true;
        }
    },
    staffRoles: {
        list: async (storeId: number) => {
            const { data, error } = await supabase.from('staff_roles').select('*').eq('store_id', storeId);
            if (error) throw error;
            return data;
        },
        create: async (storeId: number, roleData: any) => {
            const { data, error } = await supabase.from('staff_roles').insert([{ ...roleData, store_id: storeId }]).select();
            if (error) throw error;
            return data[0];
        }
    },
    banners: {
        list: async (storeId: number) => {
            const { data, error } = await supabase.from('banners').select('*').eq('store_id', storeId).order('order', { ascending: true });
            if (error) throw error;
            return data;
        },
        create: async (storeId: number, bannerData: any) => {
            const { data, error } = await supabase.from('banners').insert([{ ...bannerData, store_id: storeId }]).select();
            if (error) throw error;
            return data[0];
        },
        update: async (storeId: number, id: number, updateData: any) => {
            const { data, error } = await supabase.from('banners').update(updateData).eq('id', id).eq('store_id', storeId).select();
            if (error) throw error;
            return data[0];
        },
        delete: async (storeId: number, id: number) => {
            const { error } = await supabase.from('banners').delete().eq('id', id).eq('store_id', storeId);
            if (error) throw error;
            return true;
        }
    },
    storage: {
        upload: async (bucket: string, path: string, file: File) => {
            const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
            if (error) throw error;
            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
            return publicUrl;
        }
    },
    pos: {
        listRegisters: async (storeId: number) => {
            const { data, error } = await supabase.from('cash_registers').select('*').eq('store_id', storeId);
            if (error) throw error;
            return data;
        },
        openRegister: async (id: number, startingCash: number) => {
            const { data, error } = await supabase.from('cash_registers').update({ is_active: true, current_balance: startingCash }).eq('id', id).select();
            if (error) throw error;
            return data[0];
        },
        closeRegister: async (id: number, closingBalance: number) => {
            const { data, error } = await supabase.from('cash_registers').update({ is_active: false, current_balance: closingBalance }).eq('id', id).select();
            if (error) throw error;
            return data[0];
        },
        listTransactions: async (storeId: number) => {
            const { data, error } = await supabase.from('transactions').select('*').eq('store_id', storeId).order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        },
        createSale: async (saleData: any) => {
            const { data, error } = await supabase.from('transactions').insert([saleData]).select();
            if (error) throw error;
            return data[0];
        }
    },
    warehouses: {
        list: async (storeId: number) => {
            const { data, error } = await supabase.from('warehouses').select('*').eq('store_id', storeId);
            if (error) throw error;
            return data;
        },
        getAlerts: async (warehouseId: number) => {
            const { data, error } = await supabase.from('warehouse_alerts').select('*').eq('warehouse_id', warehouseId);
            if (error) throw error;
            return data;
        }
    },
    transfers: {
        list: async (storeId: number) => {
            const { data, error } = await supabase.from('transfers').select('*').eq('store_id', storeId);
            if (error) throw error;
            return data;
        }
    },
    marketing: {
        listCampaigns: async (storeId: number) => {
            const { data, error } = await supabase.from('marketing_campaigns').select('*').eq('store_id', storeId).order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        },
        listWorkflows: async (storeId: number) => {
            const { data, error } = await supabase.from('marketing_workflows').select('*').eq('store_id', storeId);
            if (error) throw error;
            return data;
        },
        listEmailTemplates: async (storeId: number) => {
            const { data, error } = await supabase.from('email_templates').select('*').eq('store_id', storeId);
            if (error) throw error;
            return data;
        },
        listSmsTemplates: async (storeId: number) => {
            const { data, error } = await supabase.from('sms_templates').select('*').eq('store_id', storeId);
            if (error) throw error;
            return data;
        },
        getAiStrategy: async (storeId: number) => {
            // Mocking for now, would call Edge Function
            return {
                data: {
                    strategy: "Mijozlaringiz kechki soat 20:00 da eng faol. Ushbu vaqtda 'Tungi chegirma' kampaniyasini yuborishni tavsiya qilamiz."
                }
            };
        },
        generateSMMContent: async (data: any) => {
            // Mocking for now
            return {
                data: {
                    headline: "Super Chegirma!",
                    content: "Shoshiling! Bizda barcha mahsulotlarga 20% gacha chegirmalar boshlandi. Sifat va hamyonbop narx faqat bizda!",
                    hashtags: ["#savdoon", "#chegirma", "#uzbekistan"],
                    best_time_to_post: "20:00"
                }
            };
        },
        listPromotions: async () => {
            const { data, error } = await supabase.from('discounts').select('*');
            if (error) throw error;
            return data;
        }
    },
    discounts: {
        list: async (storeId: number) => {
            const { data, error } = await supabase.from('discounts').select('*').eq('store_id', storeId);
            if (error) throw error;
            return data;
        },
        create: async (storeId: number, discountData: any) => {
            const { data, error } = await supabase.from('discounts').insert([{ ...discountData, store_id: storeId }]).select();
            if (error) throw error;
            return data[0];
        },
        update: async (id: number, updateData: any) => {
            const { data, error } = await supabase.from('discounts').update(updateData).eq('id', id).select();
            if (error) throw error;
            return data[0];
        },
        delete: async (id: number) => {
            const { error } = await supabase.from('discounts').delete().eq('id', id);
            if (error) throw error;
            return true;
        }
    },
    promoCodes: {
        list: async (storeId: number) => {
            const { data, error } = await supabase.from('promo_codes').select('*').eq('store_id', storeId);
            if (error) throw error;
            return data;
        },
        create: async (storeId: number, promoData: any) => {
            const { data, error } = await supabase.from('promo_codes').insert([{ ...promoData, store_id: storeId }]).select();
            if (error) throw error;
            return data[0];
        },
        update: async (id: number, updateData: any) => {
            const { data, error } = await supabase.from('promo_codes').update(updateData).eq('id', id).select();
            if (error) throw error;
            return data[0];
        },
        delete: async (id: number) => {
            const { error } = await supabase.from('promo_codes').delete().eq('id', id);
            if (error) throw error;
            return true;
        },
        apply: async (data: { code: string; store_id: number; order_total: number }) => {
            const { data: promo, error } = await supabase.from('promo_codes')
                .select('*')
                .eq('code', data.code)
                .eq('store_id', data.store_id)
                .single();
            
            if (error || !promo) throw new Error('Promo code not found');
            // Basic validation logic
            if (new Date(promo.expiry_date) < new Date()) throw new Error('Promo code expired');
            if (data.order_total < promo.min_purchase) throw new Error(`Minimum purchase of ${promo.min_purchase} required`);
            
            return { data: { promo } };
        }
    },
    accounts: {
        getAddresses: async () => {
            const { data, error } = await supabase.from('addresses').select('*').order('is_default', { ascending: false });
            if (error) throw error;
            return data;
        },
        addAddress: async (addressData: any) => {
            const { data, error } = await supabase.from('addresses').insert([addressData]).select();
            if (error) throw error;
            return data[0];
        },
        deleteAddress: async (id: number) => {
            const { error } = await supabase.from('addresses').delete().eq('id', id);
            if (error) throw error;
            return true;
        }
    },
    loyalty: {
        getPoints: async () => {
            const { data, error } = await supabase.from('loyalty_points').select('*');
            if (error) throw error;
            return { data };
        },
        getTransactions: async (storeId?: number) => {
            let query = supabase.from('loyalty_transactions').select('*');
            if (storeId) query = query.eq('store_id', storeId);
            const { data, error } = await query;
            if (error) throw error;
            return data;
        }
    },
    reviews: {
        list: async (params: { product?: number; store?: number }) => {
            let query = supabase.from('reviews').select('*, profiles(first_name, last_name, avatar)');
            if (params.product) query = query.eq('product_id', params.product);
            if (params.store) query = query.eq('store_id', params.store);
            const { data, error } = await query;
            if (error) throw error;
            return { data };
        },
        create: async (reviewData: any) => {
            const { data, error } = await supabase.from('reviews').insert([reviewData]).select();
            if (error) throw error;
            return data[0];
        }
    },

    branches: {
        list: async (storeId: number) => {
            const { data, error } = await supabase.from('branches').select('*').eq('store_id', storeId);
            if (error) throw error;
            return data;
        },
        create: async (storeId: number, branchData: any) => {
            const { data, error } = await supabase.from('branches').insert([{ ...branchData, store_id: storeId }]).select();
            if (error) throw error;
            return data[0];
        },
        update: async (storeId: number, id: number, updateData: any) => {
            const { data, error } = await supabase.from('branches').update(updateData).eq('id', id).eq('store_id', storeId).select();
            if (error) throw error;
            return data[0];
        },
        delete: async (storeId: number, id: number) => {
            const { error } = await supabase.from('branches').delete().eq('id', id).eq('store_id', storeId);
            if (error) throw error;
            return true;
        }
    },
    delivery: {
        getProfile: async () => {
            const { data, error } = await supabase.from('courier_profiles').select('*').single();
            if (error) throw error;
            return data;
        },
        updateStatus: async (status: string) => {
            const { data, error } = await supabase.from('courier_profiles').update({ status }).eq('user_id', (await supabase.auth.getUser()).data.user?.id).select();
            if (error) throw error;
            return data[0];
        },
        updateLocation: async (latitude: number, longitude: number) => {
            const { error } = await supabase.from('courier_locations').upsert({
                user_id: (await supabase.auth.getUser()).data.user?.id,
                latitude,
                longitude,
                updated_at: new Date().toISOString()
            });
            if (error) throw error;
            return true;
        }
    },
    ikpu: {
        list: async (storeId: number) => {
            const { data, error } = await supabase.from('ikpu').select('*').eq('store_id', storeId);
            if (error) throw error;
            return data;
        },
        create: async (storeId: number, ikpuData: any) => {
            const { data, error } = await supabase.from('ikpu').insert([{ ...ikpuData, store_id: storeId }]).select();
            if (error) throw error;
            return data[0];
        },
        delete: async (id: number) => {
            const { error } = await supabase.from('ikpu').delete().eq('id', id);
            if (error) throw error;
            return true;
        }
    },
    erp: {
        listVendors: async (storeId: number) => {
            const { data, error } = await supabase.from('vendors').select('*').eq('store_id', storeId);
            if (error) throw error;
            return data;
        },
        listPOs: async (storeId: number) => {
            const { data, error } = await supabase.from('purchase_orders').select('*').eq('store_id', storeId).order('order_date', { ascending: false });
            if (error) throw error;
            return data;
        },
        listExpenses: async (storeId: number) => {
            const { data, error } = await supabase.from('expenses').select('*').eq('store_id', storeId).order('expense_date', { ascending: false });
            if (error) throw error;
            return data;
        },
        listReorderRules: async (storeId: number) => {
            const { data, error } = await supabase.from('reorder_rules').select('*').eq('store_id', storeId);
            if (error) throw error;
            return data;
        }
    },
    gamification: {
        listBadges: async (storeId: number) => {
            const { data, error } = await supabase.from('loyalty_badges').select('*').eq('store_id', storeId);
            if (error) throw error;
            return data;
        },
        listChallenges: async (storeId: number) => {
            const { data, error } = await supabase.from('loyalty_challenges').select('*').eq('store_id', storeId);
            if (error) throw error;
            return data;
        }
    },
    debts: {
        list: async (storeId: number) => {
            const { data, error } = await supabase.from('debts').select('*, transactions:debt_transactions(*)').eq('store_id', storeId);
            if (error) throw error;
            return data;
        },
        create: async (storeId: number, debtData: any) => {
            const { data, error } = await supabase.from('debts').insert([{ ...debtData, store_id: storeId }]).select();
            if (error) throw error;
            return data[0];
        },
        createTransaction: async (transactionData: any) => {
            const { data, error } = await supabase.from('debt_transactions').insert([transactionData]).select();
            if (error) throw error;
            return data[0];
        }
    },
    chat: {
        getConversations: async (storeId: number) => {
            const { data, error } = await supabase.from('conversations').select('*, last_message:messages(content, sender_type, created_at)').eq('store_id', storeId).order('updated_at', { ascending: false });
            if (error) throw error;
            return data;
        },
        getConversationDetail: async (conversationId: number) => {
            const { data, error } = await supabase.from('conversations').select('*, messages(*)').eq('id', conversationId).single();
            if (error) throw error;
            return data;
        },
        sendMessage: async (conversationId: number, content: string, senderType: 'store' | 'customer') => {
            const { data, error } = await supabase.from('messages').insert([{ conversation_id: conversationId, content, sender_type: senderType }]).select();
            if (error) throw error;
            // Update conversation updated_at
            await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);
            return data[0];
        },
        markAsRead: async (conversationId: number) => {
            const { error } = await supabase.from('messages').update({ is_read: true }).eq('conversation_id', conversationId).eq('is_read', false);
            if (error) throw error;
            return true;
        },
        deleteConversation: async (id: number) => {
            const { error } = await supabase.from('conversations').delete().eq('id', id);
            if (error) throw error;
            return true;
        },
        subscribeToMessages: (conversationId: number, callback: (message: any) => void) => {
            return supabase
                .channel(`room-${conversationId}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, payload => {
                    callback(payload.new);
                })
                .subscribe();
        },
        subscribeToStoreConversations: (storeId: number, callback: (payload: any) => void) => {
            return supabase
                .channel(`store-conv-${storeId}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `store_id=eq.${storeId}` }, callback)
                .subscribe();
        }
    },
    ai: {
        analyzeBusiness: async (data: { description: string, business_type: string, language: string }) => {
            const { data: result, error } = await supabase.functions.invoke('analyze-business', {
                body: data
            });
            if (error) throw error;
            return result;
        },
        translateText: async (data: { text: string, target_lang: string }) => {
            // Mocking for now, would call Edge Function
            return { data: { translated_text: `${data.text} [Translated to ${data.target_lang}]` } };
        },
        generateDescription: async (name: string, category?: string, lang: string = 'uz') => {
            // Mocking for now
            return { data: { description: `${name} is a high-quality product from the ${category || 'general'} category. Perfect for your needs.` } };
        },
        generateSeoTags: async (data: { name: string, description: string, language: string }) => {
            // Mocking for now
            return { data: { seo_tags: `${data.name}, premium quality, ${data.language}` } };
        },
        translateProduct: async (data: { name: string, description: string, source_lang: string }) => {
            // Mocking for now
            return {
                data: {
                    name_uz: data.name,
                    name_ru: data.name + ' (RU)',
                    description_uz: data.description,
                    description_ru: data.description + ' (RU translation)'
                }
            };
        },
        enhanceImage: async (data: any) => {
            // Mocking for now
            return {
                data: {
                    enhanced_image: data.image // Return same image for mock
                }
            };
        },
        virtualTryOn: async (data: any) => {
            // Mocking for now
            return {
                data: {
                    result_image: data.person_image
                }
            };
        }
    },
    wishlist: {
        list: async () => {
            const { data, error } = await supabase.from('wishlist').select('*, product_details:products(*)');
            if (error) throw error;
            return { data };
        },
        toggle: async (productId: number) => {
            // Check if exists
            const { data: existing } = await supabase.from('wishlist').select('*').eq('product_id', productId).single();
            if (existing) {
                await supabase.from('wishlist').delete().eq('product_id', productId);
            } else {
                await supabase.from('wishlist').insert([{ product_id: productId }]);
            }
        }
    },
    recentlyViewed: {
        list: async () => {
            const { data, error } = await supabase.from('recently_viewed').select('*, product_details:products(*)').order('created_at', { ascending: false }).limit(10);
            if (error) throw error;
            return { data };
        }
    },
    inventory: {
        updateStock: async (productId: number, quantity: number, type: 'add' | 'subtract' | 'set') => {
            const { data: product } = await supabase.from('products').select('stock_quantity').eq('id', productId).single();
            let newQty = quantity;
            if (type === 'add') newQty = (product?.stock_quantity || 0) + quantity;
            if (type === 'subtract') newQty = (product?.stock_quantity || 0) - quantity;
            
            const { data, error } = await supabase.from('products').update({ stock_quantity: newQty }).eq('id', productId).select();
            if (error) throw error;
            return data;
        }
    },
    admin: {
        listUsers: async () => {
            const { data, error } = await supabase.from('profiles').select('*');
            if (error) throw error;
            return { data };
        },
        updateUser: async (id: string | number, updateData: any) => {
            const { data, error } = await supabase.from('profiles').update(updateData).eq('id', id).select();
            if (error) throw error;
            return { data: data[0] };
        },
        deleteUser: async (id: string | number) => {
            const { error } = await supabase.from('profiles').delete().eq('id', id);
            if (error) throw error;
            return true;
        }
    }
}
;
