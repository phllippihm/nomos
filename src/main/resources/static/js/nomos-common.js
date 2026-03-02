/**
 * Nomos - Common Utilities
 * Shared constants, user session, and UI helpers used across multiple pages.
 */

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

/**
 * Safely retrieves and parses an item from localStorage.
 * @param {string} key - The key to retrieve.
 * @param {*} defaultValue - The default value if not found or invalid.
 */
function getStorageItem(key, defaultValue) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.warn(`[Nomos] Error parsing localStorage key "${key}":`, e);
        return defaultValue;
    }
}

let currentUser = {
    id: '', name: 'Carregando...', email: '',
    role: '', position: '', institutionId: ''
};

/**
 * Initializes the user session from the backend.
 */
async function initSession() {
    // Skip session init on login page (user is not authenticated yet)
    if (window.location.pathname === '/login') return;

    try {
        const userData = await apiFetch('/auth/me');
        if (userData) {
            currentUser = {
                id: userData.id,
                name: userData.nome,
                email: userData.email,
                role: userData.role,
                institutionId: userData.institutionId,
                institutionName: userData.institutionName
            };
            console.log('[Nomos] Session initialized:', currentUser);
            document.dispatchEvent(new CustomEvent('nomos:sessionReady', { detail: currentUser }));
        }
    } catch (e) {
        console.warn('[Nomos] No active session found.');
    }
}

// Start session initialization when DOM is ready
initSession();

/**
 * Resolves the empresaId for the current user session.
 * Falls back to the first available empresa if none is set.
 */
function resolveEmpresaId() {
    if (!currentUser.empresaId) {
        const empresas = getStorageItem('nomos_empresas', []);
        if (empresas.length > 0) currentUser.empresaId = empresas[0].id;
    }
}

/**
 * Displays a toast notification.
 * @param {string} msg - The message to display.
 * @param {number} [duration=3000] - Duration in ms.
 */
function showToast(msg, duration = 3000) {
    const t = document.getElementById('toast');
    if (!t) return;
    const msgEl = document.getElementById('toast-msg');
    if (msgEl) msgEl.textContent = msg;
    t.classList.remove('opacity-0', 'translate-y-4');
    t.classList.add('opacity-100', 'translate-y-0');
    setTimeout(() => {
        t.classList.add('opacity-0', 'translate-y-4');
        t.classList.remove('opacity-100', 'translate-y-0');
    }, duration);
}

/**
 * Generic tab-switching logic used by escopo-testes, execucao, etc.
 * @param {string} tab - The tab identifier (matches panel-{tab} and tab-{tab}).
 */
function switchTab(tab) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('border-primary', 'text-primary');
        b.classList.add('border-transparent', 'text-slate-400');
    });
    document.getElementById('panel-' + tab)?.classList.remove('hidden');
    const btn = document.getElementById('tab-' + tab);
    if (btn) {
        btn.classList.add('border-primary', 'text-primary');
        btn.classList.remove('border-transparent', 'text-slate-400');
    }
}

/**
 * Enhanced fetch to handle backend API calls with unified error handling.
 * @param {string} endpoint - The API endpoint (e.g., '/organization/institutions').
 * @param {Object} [options={}] - Fetch options.
 */
async function apiFetch(endpoint, options = {}) {
    const API_BASE = '/api';
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    // Prevenir cache agressivo de navegadores forçando requisições GET frescas
    if (!options.method || options.method.toUpperCase() === 'GET') {
        endpoint += (endpoint.includes('?') ? '&' : '?') + '_=' + new Date().getTime();
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            credentials: 'include',
            ...options,
            headers
        });

        if (response.status === 401 || response.status === 403) {
            // Don't redirect if already on the login page
            if (window.location.pathname !== '/login') {
                console.warn('[Nomos] Session expired or unauthorized. Redirecting to login.');
                window.location.href = '/login';
            }
            return;
        }

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || `Erro na API: ${response.status}`);
        }

        // Handle empty responses (204 No Content or deletions)
        if (response.status === 204) return null;

        return await response.json();
    } catch (error) {
        console.error(`[Nomos] API Fetch Error (${endpoint}):`, error);
        throw error;
    }
}

/**
 * Upload files via multipart/form-data (no Content-Type header — browser sets boundary).
 */
async function apiUpload(endpoint, formData) {
    const API_BASE = '/api';
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        if (response.status === 401 || response.status === 403) {
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
            return;
        }
        if (!response.ok) throw new Error(`Erro: ${response.status}`);
        if (response.status === 204) return null;
        return await response.json();
    } catch (error) {
        console.error(`[Nomos] API Upload Error (${endpoint}):`, error);
        throw error;
    }
}
