/**
 * Nomos - Matrix Configuration Logic
 * Manages risk and compliance matrices, heatmaps, and maintenance rules.
 * This page is mostly autonomous and does not use nomos-common.js utilities.
 */

const STORAGE_KEY = 'nomos_matrix_config_global';
const MAINTENANCE_ACTIONS = [
    'Em manutenção sem acompanhamento',
    'Em manutenção com acompanhamento',
    'Necessita plano de ação'
];

let state = loadState();

function defaultState() {
    return {
        empresaId: 'global',
        riskDimensions: [
            { id: '1', name: 'Impacto' },
            { id: '2', name: 'Probabilidade' }
        ],
        riskRanges: [
            { id: '1', min: 1, max: 5, label: 'Baixo', color: '#10b981' },
            { id: '2', min: 6, max: 15, label: 'Médio', color: '#f59e0b' },
            { id: '3', min: 16, max: 25, label: 'Alto', color: '#ef4444' }
        ],
        complianceRanges: [
            { id: 'c1', min: 0, max: 49, label: 'Crítico', color: '#ef4444' },
            { id: 'c2', min: 50, max: 74, label: 'Regular', color: '#f59e0b' },
            { id: 'c3', min: 75, max: 89, label: 'Bom', color: '#3b82f6' },
            { id: 'c4', min: 90, max: 100, label: 'Excelente', color: '#10b981' }
        ],
        notificationThresholdId: 'c3',
        maintenanceMatrix: {}
    };
}

function loadState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch (e) { console.warn('Failed to load state', e); }
    return defaultState();
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem('nomos_matrix_config', JSON.stringify(state));
}

function showToast(msg) {
    const t = document.getElementById('toast');
    const msgEl = document.getElementById('toastMessage');
    if (msgEl) msgEl.textContent = msg;
    if (t) {
        t.classList.remove('opacity-0', 'pointer-events-none', 'translate-x-4');
        setTimeout(() => t.classList.add('opacity-0', 'pointer-events-none', 'translate-x-4'), 3000);
    }
}

// =====================================================================
// TAB SWITCHING
// =====================================================================
function switchMatrixTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.className = 'tab-btn px-5 py-2.5 text-sm font-bold rounded-lg transition-all text-slate-500 hover:text-slate-700 dark:text-slate-400';
    });
    document.querySelectorAll('.tab-content').forEach(c => { c.classList.add('hidden'); });

    const btn = document.getElementById('tab-' + tabId);
    if (btn) {
        btn.className = 'tab-btn px-5 py-2.5 text-sm font-bold rounded-lg transition-all bg-white dark:bg-slate-700 text-primary dark:text-blue-400 shadow-sm';
    }
    document.getElementById('content-' + tabId)?.classList.remove('hidden');

    // Re-render active tab
    if (tabId === 'risk') renderRisk();
    else if (tabId === 'compliance') renderCompliance();
    else if (tabId === 'maintenance') renderMaintenance();
}

// =====================================================================
// RISK MATRIX EDITOR
// =====================================================================
function renderRisk() {
    renderDimensions();
    renderRiskRanges();
    renderHeatmap();
}

function renderDimensions() {
    const container = document.getElementById('dimensionsList');
    if (!container) return;
    container.innerHTML = '';
    state.riskDimensions.forEach((dim, i) => {
        const axisLabel = i < 2 ? ` (Eixo ${i === 0 ? 'Y' : 'X'})` : ' (Fator Mult.)';
        const canDelete = state.riskDimensions.length > 2;
        const div = document.createElement('div');
        div.className = 'group';
        div.innerHTML = `
        <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Dimensão ${i + 1}${axisLabel}</label>
        <div class="flex items-center space-x-2">
            <input type="text" value="${dim.name}" data-dim-id="${dim.id}"
                class="flex-1 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                oninput="updateDimensionName('${dim.id}', this.value)">
            ${canDelete ? `
            <button onclick="removeDimension('${dim.id}')" class="p-2 text-slate-300 hover:text-red-500 transition-colors" title="Remover">
                <span class="material-symbols-outlined text-xl">delete</span>
            </button>` : ''}
        </div>
    `;
        container.appendChild(div);
    });
    const maxVal = state.riskRanges.length > 0 ? Math.max(...state.riskRanges.map(r => r.max)) : 25;
    const axisLimit = Math.min(22, Math.max(5, Math.ceil(Math.sqrt(maxVal))));
    const maxScore = Math.pow(axisLimit, state.riskDimensions.length);
    const scoreInfo = document.getElementById('riskScoreInfo');
    if (scoreInfo) scoreInfo.textContent = `SCORE MÁX (Escala ${axisLimit}): ${maxScore}`;
}

function addDimension() {
    state.riskDimensions.push({ id: Date.now().toString(), name: 'Nova Dimensão' });
    renderRisk();
}

function removeDimension(id) {
    if (state.riskDimensions.length <= 2) {
        alert('A matriz de risco deve ter no mínimo 2 dimensões.');
        return;
    }
    state.riskDimensions = state.riskDimensions.filter(d => d.id !== id);
    renderRisk();
}

function updateDimensionName(id, name) {
    state.riskDimensions = state.riskDimensions.map(d => d.id === id ? { ...d, name } : d);
    // Update axis labels without full re-render
    const yAxis = document.getElementById('yAxisLabel');
    if (yAxis) yAxis.textContent = state.riskDimensions[0]?.name || '';
    const xAxis = document.getElementById('xAxisLabel');
    if (xAxis) xAxis.textContent = state.riskDimensions[1]?.name || '';
}

function renderRiskRanges() {
    const container = document.getElementById('riskRangesList');
    if (!container) return;
    container.innerHTML = '';
    state.riskRanges.forEach(range => {
        const div = document.createElement('div');
        div.className = 'flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl group hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors';
        div.innerHTML = `
        <div class="relative w-7 h-7 flex-shrink-0">
            <input type="color" value="${range.color}" class="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                oninput="updateRiskRange('${range.id}','color',this.value); this.nextElementSibling.style.backgroundColor=this.value">
            <div class="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm" style="background-color:${range.color}"></div>
        </div>
        <input type="text" value="${range.label}" class="bg-transparent font-medium text-sm flex-1 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
            oninput="updateRiskRange('${range.id}','label',this.value)">
        <div class="flex items-center space-x-1.5">
            <input type="number" value="${range.min}" class="w-14 text-center p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                oninput="updateRiskRange('${range.id}','min',parseInt(this.value)||0)">
            <span class="text-slate-400 text-xs">-</span>
            <input type="number" value="${range.max}" class="w-14 text-center p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                oninput="updateRiskRange('${range.id}','max',parseInt(this.value)||0)">
        </div>
        <button onclick="removeRiskRange('${range.id}')" class="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
            <span class="material-symbols-outlined text-lg">delete</span>
        </button>
    `;
        container.appendChild(div);
    });
}

function addRiskRange() {
    const lastMax = state.riskRanges.length > 0 ? Math.max(...state.riskRanges.map(r => r.max)) : 0;
    state.riskRanges.push({ id: Date.now().toString(), min: lastMax + 1, max: lastMax + 5, label: 'Novo Nível', color: '#3b82f6' });
    renderRisk();
}

function removeRiskRange(id) {
    state.riskRanges = state.riskRanges.filter(r => r.id !== id);
    renderRisk();
}

function updateRiskRange(id, field, value) {
    state.riskRanges = state.riskRanges.map(r => r.id === id ? { ...r, [field]: value } : r);
    if (field !== 'label') renderHeatmap();
}

function renderHeatmap() {
    const maxVal = state.riskRanges.length > 0 ? Math.max(...state.riskRanges.map(r => r.max)) : 25;
    const axisLimit = Math.min(22, Math.max(5, Math.ceil(Math.sqrt(maxVal))));
    const grid = document.getElementById('heatmapGrid');
    if (!grid) return;
    grid.style.gridTemplateColumns = `repeat(${axisLimit}, minmax(0, 1fr))`;
    grid.innerHTML = '';

    const getColor = (score) => {
        const range = state.riskRanges.find(r => score >= r.min && score <= r.max);
        return range ? range.color : '#e5e7eb';
    };

    const fontSize = axisLimit > 15 ? '7px' : axisLimit > 10 ? '9px' : '10px';

    for (let y = axisLimit; y >= 1; y--) {
        for (let x = 1; x <= axisLimit; x++) {
            const score = x * y;
            const cell = document.createElement('div');
            cell.className = 'aspect-square flex items-center justify-center text-white font-bold rounded-sm transition-all hover:scale-110 cursor-pointer shadow-sm border border-white/10';
            cell.style.backgroundColor = getColor(score);
            cell.style.fontSize = fontSize;
            cell.textContent = axisLimit > 12 && score > 99 ? '++' : score;
            cell.title = `Score (X:${x} × Y:${y}) = ${score}`;
            grid.appendChild(cell);
        }
    }

    const yAxis = document.getElementById('yAxisLabel');
    if (yAxis) yAxis.textContent = state.riskDimensions[0]?.name || '';
    const xAxis = document.getElementById('xAxisLabel');
    if (xAxis) xAxis.textContent = state.riskDimensions[1]?.name || '';
    const heatmapInfo = document.getElementById('heatmapInfo');
    if (heatmapInfo) {
        heatmapInfo.textContent = `Grade ${axisLimit}×${axisLimit} (${axisLimit * axisLimit} blocos) — ${state.riskDimensions[0]?.name} vs ${state.riskDimensions[1]?.name}`;
    }
}

function saveRisk() {
    saveState();
    showToast('Parametrização de Risco salva com sucesso!');
}

// =====================================================================
// COMPLIANCE MATRIX EDITOR
// =====================================================================
function renderCompliance() {
    const tbody = document.getElementById('complianceTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    state.complianceRanges.forEach(range => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group';
        tr.innerHTML = `
        <td class="px-5 py-3.5">
            <div class="flex items-center space-x-1.5">
                <input type="number" value="${range.min}" class="w-14 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-center focus:ring-2 focus:ring-primary/50 outline-none"
                    oninput="updateComplianceRange('${range.id}','min',parseInt(this.value)||0)">
                <span class="text-slate-400">-</span>
                <input type="number" value="${range.max}" class="w-14 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-center focus:ring-2 focus:ring-primary/50 outline-none"
                    oninput="updateComplianceRange('${range.id}','max',parseInt(this.value)||0)">
            </div>
        </td>
        <td class="px-5 py-3.5">
            <input type="text" value="${range.label}" class="w-full p-1.5 rounded-lg border border-transparent hover:border-slate-200 focus:border-slate-200 bg-transparent text-sm font-medium focus:ring-2 focus:ring-primary/50 outline-none"
                oninput="updateComplianceRange('${range.id}','label',this.value)">
        </td>
        <td class="px-5 py-3.5">
            <div class="relative w-8 h-8">
                <input type="color" value="${range.color}" class="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                    oninput="updateComplianceRange('${range.id}','color',this.value); this.nextElementSibling.style.backgroundColor=this.value">
                <div class="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm hover:scale-110 transition-transform" style="background-color:${range.color}"></div>
            </div>
        </td>
        <td class="px-5 py-3.5 text-center">
            <input type="radio" name="complianceThreshold" ${state.notificationThresholdId === range.id ? 'checked' : ''}
                class="form-radio text-primary focus:ring-primary w-5 h-5 border-slate-300 dark:border-slate-600 cursor-pointer"
                onchange="state.notificationThresholdId='${range.id}'; updateComplianceThresholdLabel()">
        </td>
        <td class="px-5 py-3.5 text-right">
            <button onclick="removeComplianceRange('${range.id}')" class="text-slate-300 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50">
                <span class="material-symbols-outlined text-xl">delete</span>
            </button>
        </td>
    `;
        tbody.appendChild(tr);
    });
    renderComplianceViz();
    updateComplianceThresholdLabel();
}

function renderComplianceViz() {
    const bar = document.getElementById('complianceVizBar');
    if (!bar) return;
    bar.innerHTML = '';
    state.complianceRanges.forEach(range => {
        const width = Math.max(range.max - range.min + 1, 0);
        if (width <= 0) return;
        const seg = document.createElement('div');
        seg.className = 'h-full flex items-center justify-center text-[10px] text-white font-bold transition-all hover:brightness-110 cursor-help relative group/tip';
        seg.style.width = width + '%';
        seg.style.backgroundColor = range.color;
        if (width > 8) seg.textContent = range.label;
        const tip = document.createElement('div');
        tip.className = 'absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg';
        tip.textContent = `${range.label}: ${range.min}% - ${range.max}%`;
        seg.appendChild(tip);
        bar.appendChild(seg);
    });
}

function updateComplianceThresholdLabel() {
    const r = state.complianceRanges.find(r => r.id === state.notificationThresholdId);
    const thresholdLabel = document.getElementById('complianceThresholdLabel');
    if (thresholdLabel) thresholdLabel.textContent = r ? `"${r.label}"` : '"Nível Selecionado"';
}

function addComplianceRange() {
    const lastMax = state.complianceRanges.length > 0 ? Math.max(...state.complianceRanges.map(r => r.max)) : 0;
    state.complianceRanges.push({ id: Date.now().toString(), min: Math.min(lastMax + 1, 100), max: Math.min(lastMax + 10, 100), label: 'Novo Nível', color: '#94a3b8' });
    renderCompliance();
}

function removeComplianceRange(id) {
    state.complianceRanges = state.complianceRanges.filter(r => r.id !== id);
    if (state.notificationThresholdId === id && state.complianceRanges.length > 0) {
        state.notificationThresholdId = state.complianceRanges[0].id;
    }
    renderCompliance();
}

function updateComplianceRange(id, field, value) {
    state.complianceRanges = state.complianceRanges.map(r => r.id === id ? { ...r, [field]: value } : r);
    renderComplianceViz();
    if (field === 'label') updateComplianceThresholdLabel();
}

function saveCompliance() {
    saveState();
    showToast('Parametrização de Conformidade salva com sucesso!');
}

// =====================================================================
// MAINTENANCE MATRIX EDITOR
// =====================================================================
function renderMaintenance() {
    const riskLabels = state.riskRanges.map(r => r.label);
    const compLabels = state.complianceRanges.map(c => c.label);

    // Ensure all combos exist in state
    riskLabels.forEach(r => {
        compLabels.forEach(c => {
            const key = `${r}-${c}`;
            if (!state.maintenanceMatrix[key]) {
                state.maintenanceMatrix[key] = 'Em manutenção sem acompanhamento';
            }
        });
    });

    const table = document.getElementById('maintenanceTable');
    if (!table) return;
    table.innerHTML = '';

    // Header
    const thead = document.createElement('thead');
    let headerRow = '<tr><th class="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left w-48">Risco \\ Conformidade</th>';
    compLabels.forEach(c => {
        headerRow += `<th class="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300 text-center">${c}</th>`;
    });
    headerRow += '</tr>';
    thead.innerHTML = headerRow;
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    riskLabels.forEach(r => {
        let row = document.createElement('tr');
        let html = `<td class="p-4 border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 font-bold text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">Risco ${r}</td>`;
        compLabels.forEach(c => {
            const key = `${r}-${c}`;
            const action = state.maintenanceMatrix[key] || MAINTENANCE_ACTIONS[0];
            const colorClass = getMaintenanceColor(action);
            html += `<td class="p-3 border border-slate-100 dark:border-slate-700 cursor-pointer transition-all hover:brightness-95 active:scale-95"
                    onclick="cycleMaintenanceCell('${r}','${c}')">
                    <div class="text-[10px] font-bold uppercase p-2.5 rounded-lg border text-center ${colorClass} transition-colors">${action}</div>
                </td>`;
        });
        row.innerHTML = html;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
}

function getMaintenanceColor(action) {
    switch (action) {
        case 'Necessita plano de ação': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
        case 'Em manutenção com acompanhamento': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
        default: return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
    }
}

function cycleMaintenanceCell(risk, compliance) {
    const key = `${risk}-${compliance}`;
    const current = state.maintenanceMatrix[key] || MAINTENANCE_ACTIONS[0];
    const nextIdx = (MAINTENANCE_ACTIONS.indexOf(current) + 1) % MAINTENANCE_ACTIONS.length;
    state.maintenanceMatrix[key] = MAINTENANCE_ACTIONS[nextIdx];
    renderMaintenance();
}

function saveMaintenance() {
    saveState();
    showToast('Matriz de Manutenção salva com sucesso!');
}

document.addEventListener('DOMContentLoaded', () => {
    switchMatrixTab('risk');
});
