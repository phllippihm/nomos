/**
 * Nomos - Dashboards Page Logic
 * Refactored to use Backend API for analytics.
 * Depends on: nomos-common.js (currentUser, apiFetch)
 */

let internalDirectorates = [];
let internalAreas = [];
let currentView = 'compliance';

async function init() {
    console.log('[Dashboard] Initializing. Session state:', !!currentUser.institutionId);
    // Wait for session initialization if necessary
    if (!currentUser.institutionId) {
        document.addEventListener('nomos:sessionReady', (e) => {
            console.log('[Dashboard] Session ready event received.');
            loadInitialData();
        }, { once: true });

        // Safety check: if session finished between the check and listener
        setTimeout(() => {
            if (currentUser.institutionId && internalDirectorates.length === 0) {
                console.log('[Dashboard] Session found after timeout, forcing load.');
                loadInitialData();
            }
        }, 1000);
    } else {
        loadInitialData();
    }
}

async function loadInitialData() {
    try {
        internalDirectorates = await apiFetch(`/organization/institutions/${currentUser.institutionId}/directorates`);
        populateFilters();
        renderDashboard();
    } catch (e) {
        console.error('Erro ao carregar dados iniciais:', e);
    }
}

function populateFilters() {
    const dirSelect = document.getElementById('filter-diretoria');
    dirSelect.innerHTML = '<option value="">Todas Diretorias</option>' +
        internalDirectorates.map(d => `<option value="${d.id}">${d.nome}</option>`).join('');

    dirSelect.onchange = async () => {
        const dirId = dirSelect.value;
        const areaSelect = document.getElementById('filter-area');

        if (!dirId) {
            areaSelect.innerHTML = '<option value="">Todas Áreas</option>';
            internalAreas = [];
            renderDashboard();
            return;
        }

        try {
            internalAreas = await apiFetch(`/organization/directorates/${dirId}/areas`);
            areaSelect.innerHTML = '<option value="">Todas Áreas</option>' +
                internalAreas.map(a => `<option value="${a.id}">${a.nome}</option>`).join('');
            renderDashboard();
        } catch (e) {
            console.error('Error fetching areas:', e);
        }
    };
}

function clearFilters() {
    document.getElementById('filter-diretoria').value = '';
    const areaSelect = document.getElementById('filter-area');
    areaSelect.innerHTML = '<option value="">Todas Áreas</option>';
    internalAreas = [];
    renderDashboard();
}

function switchView(view) {
    currentView = view;
    document.querySelectorAll('.view-btn').forEach(b => {
        b.classList.remove('bg-white', 'text-primary', 'shadow-sm');
        b.classList.add('text-slate-400');
    });
    const btn = document.getElementById('view-' + view);
    if (btn) {
        btn.classList.add('bg-white', 'text-primary', 'shadow-sm');
        btn.classList.remove('text-slate-400');
    }

    document.getElementById('dashboard-compliance').classList.toggle('hidden', view !== 'compliance');
    document.getElementById('dashboard-plans').classList.toggle('hidden', view !== 'plans');
    renderDashboard();
}

async function renderDashboard() {
    const dirId = document.getElementById('filter-diretoria').value;
    const areaId = document.getElementById('filter-area').value;

    const params = new URLSearchParams({
        institutionId: currentUser.institutionId
    });
    if (dirId) params.append('directorateId', dirId);
    if (areaId) params.append('areaId', areaId);

    try {
        if (currentView === 'compliance') {
            const data = await apiFetch(`/dashboard/compliance?${params.toString()}`);
            renderComplianceDashboard(data);
        } else {
            const data = await apiFetch(`/dashboard/action-plans?${params.toString()}`);
            renderPlansDashboard(data);
        }
    } catch (e) {
        console.error('Erro ao buscar dados do dashboard:', e);
    }
}

function renderComplianceDashboard(data) {
    document.getElementById('kpi-avg-compliance').textContent = data.testsPerformed > 0 ? data.conformityAverage.toFixed(1) + '%' : '-';
    document.getElementById('kpi-volume').textContent = data.testsPerformed;

    const metaStatus = document.getElementById('kpi-meta-status');
    if (data.testsPerformed > 0 && data.conformityAverage >= 90) {
        metaStatus.textContent = 'Atingida';
        metaStatus.className = 'text-[10px] font-bold uppercase px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700';
    } else if (data.testsPerformed > 0) {
        metaStatus.textContent = 'Abaixo';
        metaStatus.className = 'text-[10px] font-bold uppercase px-2 py-1 rounded-lg bg-red-100 text-red-700';
    } else {
        metaStatus.textContent = '';
    }

    renderStatsBars('compliance-by-area', data.areaStats);
    renderStatsBars('compliance-by-diretoria', data.directorateStats);

    renderRiskComplianceMatrix(data.riskMatrix);
}

function renderStatsBars(containerId, stats) {
    const container = document.getElementById(containerId);
    if (!stats || stats.length === 0) {
        container.innerHTML = '<p class="text-center text-slate-300 text-xs py-10 font-bold uppercase">Sem dados disponíveis</p>';
        return;
    }

    container.innerHTML = stats.map(s => {
        const val = s.value;
        const color = val >= 90 ? '#22c55e' : val >= 70 ? '#f59e0b' : '#ef4444';
        return `
            <div class="space-y-1.5">
                <div class="flex justify-between text-xs">
                    <span class="font-bold text-slate-700 dark:text-slate-300">${s.name}</span>
                    <span class="font-extrabold" style="color:${color}">${val.toFixed(1)}%</span>
                </div>
                <div class="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <div class="h-2.5 rounded-full transition-all" style="width:${val}%; background:${color}"></div>
                </div>
                <p class="text-[9px] text-slate-400">${s.count} registro(s)</p>
            </div>
        `;
    }).join('');
}

function renderRiskComplianceMatrix(matrixData) {
    const container = document.getElementById('risk-compliance-matrix');
    if (!matrixData || matrixData.length === 0) {
        container.innerHTML = '<p class="text-center text-slate-300 text-xs py-10 font-bold uppercase">Sem dados de risco.</p>';
        return;
    }

    // Fixed levels based on RiskLevel enum
    const probLevels = [1, 2, 3, 4, 5];
    const impLevels = [1, 2, 3, 4, 5];

    let html = '<table class="w-full text-center"><thead><tr><th class="p-2 text-[9px] text-slate-400">Prob/Imp</th>';
    impLevels.forEach(cl => { html += `<th class="p-2 text-[9px] font-bold text-slate-400 uppercase">${cl}</th>`; });
    html += '</tr></thead><tbody>';

    const maxCount = Math.max(1, ...matrixData.map(d => d.count));

    probLevels.forEach(p => {
        html += `<tr><td class="p-2 text-[9px] font-bold text-slate-400 uppercase whitespace-nowrap">${p}</td>`;
        impLevels.forEach(i => {
            const cell = matrixData.find(d => d.probability === p && d.impact === i);
            const count = cell ? cell.count : 0;
            const intensity = count / maxCount;
            const bg = count > 0 ? `rgba(30, 64, 175, ${0.1 + intensity * 0.6})` : 'rgba(0,0,0,0.02)';
            const textColor = intensity > 0.4 ? 'white' : '#64748b';
            html += `<td class="p-2"><div class="w-10 h-10 rounded-xl flex items-center justify-center mx-auto font-extrabold text-xs transition-all" style="background:${bg}; color:${textColor}">${count}</div></td>`;
        });
        html += '</tr>';
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

function renderPlansDashboard(data) {
    document.getElementById('kpi-plans-total').textContent = data.totalPlans;
    document.getElementById('kpi-plans-done').textContent = Math.round((data.totalPlans * data.completionRate) / 100); // Approximation if needed, but we should add 'completedCount' to DTO ideally.
    // For now, let's just show the rate
    document.getElementById('kpi-plans-rate').textContent = data.totalPlans > 0 ? data.completionRate.toFixed(0) + '%' : '-';
    document.getElementById('kpi-plans-overdue').textContent = '-'; // Needs logic for overdue if backend supports it

    renderStatsBars('resolution-by-area', data.areaStats);

    // Check if we have a container for directorate resolution too
    const resDirContainer = document.getElementById('resolution-by-diretoria');
    if (resDirContainer) {
        renderStatsBars('resolution-by-diretoria', data.directorateStats);
    }

    // Backend currently doesn't provide the list of active plans in the overview for simplicity.
    // I will mock this or add it to DTO if needed. For now, let's keep it simple.
    document.getElementById('active-plans-status').innerHTML = '<p class="text-center text-slate-500 text-[10px] py-4 uppercase">Consulte lista abaixo</p>';

    // We need to fetch the actual list of plans to populate the table, or use the existing /api/action-plans
    loadPlansTable();
}

async function loadPlansTable() {
    try {
        const plans = await apiFetch('/action-plans');
        const sorted = plans.slice(0, 10);
        const tableBody = document.getElementById('plans-table-tbody');
        if (!tableBody) return;

        tableBody.innerHTML = sorted.map(p => {
            const done = p.steps ? p.steps.filter(s => s.done).length : 0;
            const tot = p.steps ? p.steps.length : 0;
            const statusBadge = p.status === 'COMPLETED'
                ? '<span class="text-[10px] font-bold uppercase px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700">Concluído</span>'
                : '<span class="text-[10px] font-bold uppercase px-2 py-1 rounded-lg bg-amber-100 text-amber-700">Ativo</span>';

            const dateStr = p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-';

            return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                <td class="px-8 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">${p.testName || 'Manual'}</td>
                <td class="px-8 py-4 text-xs text-slate-500">${p.area || '-'}</td>
                <td class="px-8 py-4 text-xs text-slate-500">${done}/${tot}</td>
                <td class="px-8 py-4">${statusBadge}</td>
                <td class="px-8 py-4 text-xs text-slate-400">${dateStr}</td>
            </tr>`;
        }).join('');
    } catch (e) {
        console.error('Erro ao carregar tabela de planos:', e);
    }
}

init();
