/**
 * Nomos - Dashboards Page Logic
 * Extracted from dashboards.html inline script.
 * Depends on: nomos-common.js (MESES, currentUser, resolveEmpresaId)
 */

let executions = [];
let actionPlans = [];
let matrixConfig = null;
let currentView = 'compliance';

function init() {
    resolveEmpresaId();

    executions = JSON.parse(localStorage.getItem('nomos_execution_history') || '[]')
        .filter(e => e.empresaId === currentUser.empresaId);
    actionPlans = JSON.parse(localStorage.getItem('nomos_action_plans') || '[]')
        .filter(p => p.empresaId === currentUser.empresaId);

    const mc = localStorage.getItem('nomos_matrix_config_' + currentUser.empresaId);
    if (mc) matrixConfig = JSON.parse(mc);

    populateFilters();
    renderDashboard();
}

function populateFilters() {
    const dirs = [...new Set(executions.map(e => e.diretoria).filter(Boolean))];
    const areas = [...new Set(executions.map(e => e.area).filter(Boolean))];
    document.getElementById('filter-diretoria').innerHTML = '<option value="">Todas Diretorias</option>' + dirs.map(d => `<option value="${d}">${d}</option>`).join('');
    document.getElementById('filter-area').innerHTML = '<option value="">Todas Áreas</option>' + areas.map(a => `<option value="${a}">${a}</option>`).join('');
}

function clearFilters() {
    document.getElementById('filter-diretoria').value = '';
    document.getElementById('filter-area').value = '';
    renderDashboard();
}

function switchView(view) {
    currentView = view;
    document.querySelectorAll('.view-btn').forEach(b => {
        b.classList.remove('bg-white', 'text-primary', 'shadow-sm');
        b.classList.add('text-slate-400');
    });
    const btn = document.getElementById('view-' + view);
    btn.classList.add('bg-white', 'text-primary', 'shadow-sm');
    btn.classList.remove('text-slate-400');

    document.getElementById('dashboard-compliance').classList.toggle('hidden', view !== 'compliance');
    document.getElementById('dashboard-plans').classList.toggle('hidden', view !== 'plans');
    renderDashboard();
}

function renderDashboard() {
    const dir = document.getElementById('filter-diretoria').value;
    const area = document.getElementById('filter-area').value;

    const filteredExecs = executions.filter(e => {
        if (dir && e.diretoria !== dir) return false;
        if (area && e.area !== area) return false;
        return true;
    });

    const filteredPlans = actionPlans.filter(p => {
        if (dir && p.diretoria !== dir) return false;
        if (area && p.area !== area) return false;
        return true;
    });

    if (currentView === 'compliance') {
        renderComplianceDashboard(filteredExecs);
    } else {
        renderPlansDashboard(filteredPlans);
    }
}

function renderComplianceDashboard(execs) {
    const avg = execs.length > 0 ? (execs.reduce((sum, e) => sum + e.compliance, 0) / execs.length) : 0;
    document.getElementById('kpi-avg-compliance').textContent = execs.length > 0 ? avg.toFixed(1) + '%' : '-';
    document.getElementById('kpi-volume').textContent = execs.length;
    const metaStatus = document.getElementById('kpi-meta-status');
    if (execs.length > 0 && avg >= 90) {
        metaStatus.textContent = 'Atingida';
        metaStatus.className = 'text-[10px] font-bold uppercase px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700';
    } else if (execs.length > 0) {
        metaStatus.textContent = 'Abaixo';
        metaStatus.className = 'text-[10px] font-bold uppercase px-2 py-1 rounded-lg bg-red-100 text-red-700';
    } else {
        metaStatus.textContent = '';
    }

    renderGroupedBars('compliance-by-area', execs, 'area');
    renderGroupedBars('compliance-by-diretoria', execs, 'diretoria');
    renderRiskComplianceMatrix(execs);
}

function renderGroupedBars(containerId, execs, groupKey) {
    const container = document.getElementById(containerId);
    const groups = {};
    execs.forEach(e => {
        const key = e[groupKey] || 'Sem ' + groupKey;
        if (!groups[key]) groups[key] = [];
        groups[key].push(e.compliance);
    });

    if (Object.keys(groups).length === 0) {
        container.innerHTML = '<p class="text-center text-slate-300 text-xs py-10 font-bold uppercase">Sem dados disponíveis</p>';
        return;
    }

    container.innerHTML = Object.entries(groups).map(([key, values]) => {
        const avg = values.reduce((s, v) => s + v, 0) / values.length;
        const color = avg >= 90 ? '#22c55e' : avg >= 70 ? '#f59e0b' : '#ef4444';
        return `
            <div class="space-y-1.5">
                <div class="flex justify-between text-xs">
                    <span class="font-bold text-slate-700 dark:text-slate-300">${key}</span>
                    <span class="font-extrabold" style="color:${color}">${avg.toFixed(1)}%</span>
                </div>
                <div class="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <div class="h-2.5 rounded-full transition-all" style="width:${avg}%; background:${color}"></div>
                </div>
                <p class="text-[9px] text-slate-400">${values.length} teste(s)</p>
            </div>
        `;
    }).join('');
}

function renderRiskComplianceMatrix(execs) {
    const container = document.getElementById('risk-compliance-matrix');
    if (!matrixConfig || !matrixConfig.riskRanges || !matrixConfig.complianceRanges || execs.length === 0) {
        container.innerHTML = '<p class="text-center text-slate-300 text-xs py-10 font-bold uppercase">Configure as Matrizes para visualizar a correlação.</p>';
        return;
    }

    const riskLabels = matrixConfig.riskRanges.map(r => r.label);
    const compLabels = matrixConfig.complianceRanges.map(r => r.label);

    const counts = {};
    riskLabels.forEach(rl => {
        compLabels.forEach(cl => { counts[rl + '-' + cl] = 0; });
    });
    execs.forEach(e => {
        const rl = e.riskLevel || '';
        const cl = e.complianceLevel || '';
        const key = rl + '-' + cl;
        if (counts[key] !== undefined) counts[key]++;
    });

    const maxCount = Math.max(1, ...Object.values(counts));

    let html = '<table class="w-full text-center"><thead><tr><th class="p-2"></th>';
    compLabels.forEach(cl => { html += `<th class="p-2 text-[9px] font-bold text-slate-400 uppercase">${cl}</th>`; });
    html += '</tr></thead><tbody>';
    riskLabels.forEach(rl => {
        html += `<tr><td class="p-2 text-[9px] font-bold text-slate-400 uppercase whitespace-nowrap">${rl}</td>`;
        compLabels.forEach(cl => {
            const count = counts[rl + '-' + cl];
            const intensity = count / maxCount;
            const bg = count > 0 ? `rgba(30, 64, 175, ${0.1 + intensity * 0.6})` : 'rgba(0,0,0,0.02)';
            const textColor = intensity > 0.4 ? 'white' : '#64748b';
            html += `<td class="p-2"><div class="w-12 h-12 rounded-xl flex items-center justify-center mx-auto font-extrabold text-sm transition-all" style="background:${bg}; color:${textColor}">${count}</div></td>`;
        });
        html += '</tr>';
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

function renderPlansDashboard(plans) {
    const total = plans.length;
    const completed = plans.filter(p => p.status === 'completed').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const now = new Date();
    let overdueSteps = 0;
    plans.filter(p => p.status === 'active').forEach(p => {
        p.steps.forEach(s => {
            if (!s.done && s.deadline && new Date(s.deadline) < now) overdueSteps++;
        });
    });

    document.getElementById('kpi-plans-total').textContent = total;
    document.getElementById('kpi-plans-done').textContent = completed;
    document.getElementById('kpi-plans-rate').textContent = total > 0 ? rate + '%' : '-';
    document.getElementById('kpi-plans-overdue').textContent = overdueSteps;

    const areaGroups = {};
    plans.forEach(p => {
        const key = p.area || 'Sem Área';
        if (!areaGroups[key]) areaGroups[key] = { total: 0, done: 0 };
        areaGroups[key].total++;
        if (p.status === 'completed') areaGroups[key].done++;
    });

    const resContainer = document.getElementById('resolution-by-area');
    if (Object.keys(areaGroups).length === 0) {
        resContainer.innerHTML = '<p class="text-center text-slate-300 text-xs py-10 font-bold uppercase">Sem dados</p>';
    } else {
        resContainer.innerHTML = Object.entries(areaGroups).map(([key, data]) => {
            const pct = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0;
            const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
            return `
                <div class="space-y-1.5">
                    <div class="flex justify-between text-xs">
                        <span class="font-bold text-slate-700 dark:text-slate-300">${key}</span>
                        <span class="font-extrabold" style="color:${color}">${pct}% (${data.done}/${data.total})</span>
                    </div>
                    <div class="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                        <div class="h-2.5 rounded-full transition-all" style="width:${pct}%; background:${color}"></div>
                    </div>
                </div>`;
        }).join('');
    }

    const activePlans = plans.filter(p => p.status === 'active');
    const statusContainer = document.getElementById('active-plans-status');
    if (activePlans.length === 0) {
        statusContainer.innerHTML = '<p class="text-center text-slate-500 text-xs py-10 font-bold uppercase">Nenhum plano ativo</p>';
    } else {
        statusContainer.innerHTML = activePlans.map(p => {
            const done = p.steps.filter(s => s.done).length;
            const tot = p.steps.length;
            const pct = tot > 0 ? Math.round((done / tot) * 100) : 0;
            return `
            <div class="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                <div class="flex justify-between items-center mb-2">
                    <p class="text-xs font-bold text-white truncate flex-1 mr-4">${p.testName || 'Plano Manual'}</p>
                    <span class="text-[9px] font-bold text-amber-400 uppercase">Ativo</span>
                </div>
                <div class="flex items-center gap-3">
                    <div class="flex-1 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div class="bg-blue-500 h-1.5 rounded-full" style="width:${pct}%"></div>
                    </div>
                    <span class="text-[9px] font-bold text-slate-500">${done}/${tot}</span>
                </div>
            </div>`;
        }).join('');
    }

    const sorted = [...plans].sort((a, b) => (b.id || '').localeCompare(a.id || '')).slice(0, 10);
    const tableBody = document.getElementById('plans-table-tbody');
    tableBody.innerHTML = sorted.map(p => {
        const done = p.steps.filter(s => s.done).length;
        const tot = p.steps.length;
        const statusBadge = p.status === 'completed'
            ? '<span class="text-[10px] font-bold uppercase px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700">Concluído</span>'
            : '<span class="text-[10px] font-bold uppercase px-2 py-1 rounded-lg bg-amber-100 text-amber-700">Ativo</span>';
        return `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
            <td class="px-8 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">${p.testName || 'Manual'}</td>
            <td class="px-8 py-4 text-xs text-slate-500">${p.area || '-'}</td>
            <td class="px-8 py-4 text-xs text-slate-500">${done}/${tot}</td>
            <td class="px-8 py-4">${statusBadge}</td>
            <td class="px-8 py-4 text-xs text-slate-400">${p.createdAt || '-'}</td>
        </tr>`;
    }).join('');
}

init();
