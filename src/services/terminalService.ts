import api from './api';

export interface TerminalLine {
    type: 'input' | 'output' | 'error' | 'success';
    content: string;
}

export const terminalService = {
    parseCommand: async (input: string, t: (key: string) => string): Promise<TerminalLine[]> => {
        const args = input.trim().split(' ');
        const command = args[0].toLowerCase();

        // Standard local commands
        if (command === 'help') {
            return [
                { type: 'output', content: t('terminal_header') || 'SAVDOON OS - SYSTEM CONSOLE' },
                { type: 'output', content: t('terminal_logistics') || '--- LOGISTICS & DELIVERY ---' },
                { type: 'output', content: `  sim_order      - ${t('terminal_sim_order_desc') || 'Simulate test order & courier assignment'}` },
                { type: 'output', content: `  couriers       - [active] ${t('terminal_couriers_desc') || 'View online couriers'}` },
                { type: 'output', content: t('terminal_security') || '--- SECURITY & USERS ---' },
                { type: 'output', content: `  users ban      - [email] ${t('terminal_users_ban_desc') || 'Deactivate suspicious account'}` },
                { type: 'output', content: `  auth sessions  - ${t('terminal_auth_sessions_desc') || 'View active IP sessions'}` },
                { type: 'output', content: `  reset_pwd      - [email] ${t('terminal_reset_pwd_desc') || 'Quick password recovery link'}` },
                { type: 'output', content: t('terminal_system') || '--- SYSTEM ADMINISTRATION ---' },
                { type: 'output', content: `  backup create  - ${t('terminal_backup_create_desc') || 'Create full DB backup'}` },
                { type: 'output', content: `  clear_cache    - ${t('terminal_clear_cache_desc') || 'Flush Redis & file cache'}` },
                { type: 'output', content: `  db_stats       - ${t('terminal_db_stats_desc') || 'Database physical analysis'}` },
                { type: 'output', content: t('terminal_ai_marketing') || '--- AI & MARKETING ---' },
                { type: 'output', content: `  ai_usage       - ${t('terminal_ai_usage_desc') || 'Resource consumption stats'}` },
                { type: 'output', content: `  ai_test        - [query] ${t('terminal_ai_test_desc') || 'Direct AI core diagnostic'}` },
                { type: 'output', content: `  broadcast      - [msg] ${t('terminal_broadcast_desc') || 'Send global toast to admins'}` },
                { type: 'output', content: `  promo create   - [code] [discount] ${t('terminal_promo_create_desc') || 'Generate unique promo code'}` },
                { type: 'output', content: t('terminal_general') || '--- GENERAL ---' },
                { type: 'output', content: '  whoami, stats, sys_check, clear, help' }
            ];
        }

        if (command === 'clear') return [];

        if (command === 'whoami') {
            return [
                { type: 'output', content: `${t('terminal_user_label') || 'User'}: superadmin@savdogar.vercel.app` },
                { type: 'output', content: `${t('terminal_role_label') || 'Role'}: ROOT_ACCESS` },
                { type: 'output', content: `${t('terminal_permissions_label') || 'Permissions'}: ALL_MODULES` }
            ];
        }

        if (command === 'stats') {
            return [
                { type: 'success', content: t('terminal_stats_title') || 'SYSTEM DIAGNOSTIC STATS' },
                { type: 'output', content: `${t('terminal_cpu_load') || 'CPU Load'}:    ${(Math.random() * 8 + 1).toFixed(1)}% | [||-------] (${t('terminal_idle') || 'idle'})` },
                { type: 'output', content: `${t('terminal_ram_usage') || 'RAM Usage'}:   ${(Math.random() * 150 + 320).toFixed(0)}MB / 2 GB` },
                { type: 'output', content: `${t('terminal_api_latency') || 'API Latency'}: ${(Math.random() * 25 + 12).toFixed(0)}ms (${t('terminal_stable') || 'stable'})` },
                { type: 'output', content: `${t('terminal_connections') || 'Active Socket'}: ${Math.floor(Math.random() * 50 + 10)} ${t('terminal_active_sockets') || 'connected'}` },
                { type: 'output', content: `${t('terminal_uptime') || 'System Uptime'}:      14d 3h 48m 12s` }
            ];
        }

        // Advanced commands handled by Backend
        const backendCommands = [
            'backup', 'users', 'auth', 'reset_pwd', 'sim_order',
            'couriers', 'clear_cache', 'db_stats', 'ai_usage',
            'ai_test', 'broadcast', 'promo'
        ];

        if (backendCommands.includes(command)) {
            try {
                const response = await api.post('/system/terminal/', { command: input });
                return response.data.lines;
            } catch (error: any) {
                return [{
                    type: 'error',
                    content: `SERVER ERROR: ${error.response?.data?.error || error.message || 'Connection failed'}`
                }];
            }
        }

        return [
            { type: 'error', content: t('terminal_cmd_not_found', { command }) || `Command not found: ${command}` },
            { type: 'output', content: t('terminal_type_help') || "Type 'help' for available commands." }
        ];
    }
};
