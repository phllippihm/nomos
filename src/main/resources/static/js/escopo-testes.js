/**
 * Nomos - Escopo de Testes Page Logic
 * Extracted from escopo-testes.html inline script.
 * Depends on: nomos-common.js (MESES, currentUser, resolveEmpresaId, showToast, switchTab)
 */

let matrixState = null;
let scopes = [];
let empEstrutura = { diretorias: [], areas: [], centrosCusto: [] };
let editingId = null;
let selectedMonths = [];
let riskValues = {};

let internalDirectorates = [];
let internalAreas = [];
let costCenters = [];

async function init() {
    if (!currentUser.institutionId) {
        console.warn('[Nomos] Institution ID not found. Waiting for session...');
        return;
    }

    try {
        try {
            const data = await apiFetch(`/matrix-config/${currentUser.institutionId}`);
            if (data && typeof data === 'object') matrixState = data;
        } catch (matrixErr) {
            console.warn('[Nomos] Não foi possível carregar configuração da matriz:', matrixErr);
        }

        // Load Escopos from Backend
        const backendScopes = await apiFetch('/test/scope');
        scopes = backendScopes || [];

        // Load Organizational Structure
        internalDirectorates = await apiFetch(`/organization/institutions/${currentUser.institutionId}/directorates`);
        costCenters = await apiFetch(`/organization/institutions/${currentUser.institutionId}/cost-centers`) || [];

        // Populate selects
        populateOrgSelects();
        populateCostCenterSelect();
        populateMonthSelects();
        renderRiskSliders();
        renderScopesList();
        renderMonthsGrid();
    } catch (e) {
        showToast('Erro ao carregar dados do servidor.');
        console.error(e);
    }
}

async function populateOrgSelects() {
    const dirSelect = document.getElementById('frm-diretoria');
    dirSelect.innerHTML = '<option value="">Escolher...</option>' +
        internalDirectorates.map(d => `<option value="${d.id}">${d.nome}</option>`).join('');

    // Areas will be populated based on selected directorate (improving UI logic)
    dirSelect.onchange = async () => {
        const dirId = dirSelect.value;
        const areaSelect = document.getElementById('frm-area');
        if (!dirId) {
            areaSelect.innerHTML = '<option value="">Escolher...</option>';
            return;
        }
        try {
            const areas = await apiFetch(`/organization/directorates/${dirId}/areas`);
            areaSelect.innerHTML = '<option value="">Escolher...</option>' +
                areas.map(a => `<option value="${a.id}">${a.nome}</option>`).join('');
        } catch (e) {
            console.error('Error fetching areas:', e);
        }
    };
}

function populateCostCenterSelect() {
    const ccSelect = document.getElementById('frm-centroCusto');
    if (!ccSelect) return;
    ccSelect.innerHTML = '<option value="">Nenhum</option>' +
        costCenters.map(c => `<option value="${c.id}">${c.nome}${c.codigo ? ' (' + c.codigo + ')' : ''}</option>`).join('');
}

// Ensure init runs only after session is ready
document.addEventListener('nomos:sessionReady', init);
if (currentUser.institutionId) init(); // In case it's already ready

function populateMonthSelects() {
    document.getElementById('frm-mesInicio').innerHTML = '<option value="">Selecione...</option>' +
        MESES.map(m => `<option value="${m}">${m}</option>`).join('');
}

function togglePeriodicidade() {
    const per = document.getElementById('frm-periodicidade').value;
    document.getElementById('mesInicio-group').classList.toggle('hidden', per === 'Irregular');
    document.getElementById('irregular-months').classList.toggle('hidden', per !== 'Irregular');
}

function renderMonthsGrid() {
    document.getElementById('months-grid').innerHTML = MESES.map(m => {
        const active = selectedMonths.includes(m);
        return `<button onclick="toggleMonth('${m}')" class="px-2 py-1.5 rounded-lg text-[9px] font-bold border transition-all ${active ? 'bg-primary text-white border-blue-600 shadow-sm' : 'bg-white text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-600'}">${m.substring(0, 3)}</button>`;
    }).join('');
}

function toggleMonth(m) {
    if (selectedMonths.includes(m)) {
        selectedMonths = selectedMonths.filter(x => x !== m);
    } else {
        selectedMonths.push(m);
    }
    renderMonthsGrid();
}

function renderRiskSliders() {
    const container = document.getElementById('risk-sliders');
    if (!matrixState || !matrixState.riskDimensions || matrixState.riskDimensions.length === 0) {
        container.innerHTML = '<p class="text-center text-slate-400 text-xs py-6">Configure a Matriz de Risco primeiro em <strong>Parametrizar Matrizes</strong>.</p>';
        return;
    }
    container.innerHTML = matrixState.riskDimensions.map(dim => {
        const val = riskValues[dim.id] || 1;
        return `
        <div class="space-y-2">
            <div class="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                <span>${dim.name}</span>
                <span class="text-primary bg-blue-50 px-2 py-0.5 rounded">Nota: <span id="val-${dim.id}">${val}</span></span>
            </div>
            <input type="range" min="1" max="5" step="1" value="${val}"
                oninput="updateRiskValue('${dim.id}', this.value)"
                class="w-full" />
        </div>`;
    }).join('');
    updateRiskDisplay();
}

function updateRiskValue(dimId, val) {
    riskValues[dimId] = parseInt(val);
    document.getElementById('val-' + dimId).textContent = val;
    updateRiskDisplay();
}

function calculateRisk() {
    if (!matrixState || !matrixState.riskDimensions) return { score: 0, level: 'N/A', color: '#e2e8f0' };
    const score = matrixState.riskDimensions.reduce((acc, dim) => acc * (riskValues[dim.id] || 1), 1);
    const range = matrixState.riskRanges.find(r => score >= r.min && score <= r.max);
    return { score, level: range?.label || 'Nível Indefinido', color: range?.color || '#e2e8f0' };
}

function updateRiskDisplay() {
    const r = calculateRisk();
    document.getElementById('risk-score').textContent = r.score;
    document.getElementById('risk-label').textContent = 'Risco ' + r.level;
    document.getElementById('risk-label').style.color = r.color;
    const box = document.getElementById('risk-result');
    box.style.borderColor = r.color;
    box.style.backgroundColor = r.color + '15';
}

function renderScopesList() {
    const tbody = document.getElementById('scopes-tbody');
    const empty = document.getElementById('scopes-empty');
    if (!tbody) return;
    if (scopes.length === 0) { tbody.innerHTML = ''; empty.classList.remove('hidden'); return; }
    empty.classList.add('hidden');

    tbody.innerHTML = scopes.map(s => {
        const riskDisplay = {
            'BAIXO': { label: 'Baixo', color: '#10b981' },
            'MEDIO': { label: 'Médio', color: '#f59e0b' },
            'ALTO': { label: 'Alto', color: '#ef4444' }
        }[s.riskLevel] || { label: 'N/A', color: '#94a3b8' };

        return `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
            <td class="px-8 py-5">
                <p class="font-bold text-slate-900 dark:text-white text-sm">${s.nome}</p>
                <p class="text-[10px] text-slate-400 font-bold uppercase mt-0.5">${s.tagArea || ''}</p>
            </td>
            <td class="px-8 py-5 text-xs text-slate-500 font-medium">${s.periodicidade || '-'}</td>
            <td class="px-8 py-5">
                <span class="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border" style="color:${riskDisplay.color}; border-color:${riskDisplay.color}40; background:${riskDisplay.color}10">${riskDisplay.label}</span>
            </td>
            <td class="px-6 py-5 text-right">
                <button type="button" onclick="editScope('${s.id}')" class="text-primary text-xs font-bold hover:underline">Editar</button>
                <button type="button" onclick="deleteScope('${s.id}')" class="text-red-400 text-xs font-bold hover:underline ml-3">Excluir</button>
            </td>
        </tr>`;
    }).join('');
}

function editScope(id) {
    const s = scopes.find(x => x.id === id);
    if (!s) return;
    editingId = s.id;

    // Note: In a full implementation, we would need to find the diretoriaId from the areaId
    // For now, we set the name as it was, but this needs cleanup.
    document.getElementById('frm-teste').value = s.nome || '';
    document.getElementById('frm-descricao').value = s.tagArea || '';
    document.getElementById('frm-finalidade').value = s.finalidade || '';
    document.getElementById('frm-periodicidade').value = s.periodicidade || 'Mensal';
    document.getElementById('frm-mesInicio').value = s.mesInicio || '';
    document.getElementById('frm-baseNormativa').value = s.baseNormativa || '';
    document.getElementById('frm-procedimentos').value = s.procedimentos || '';
    const ccSelect = document.getElementById('frm-centroCusto');
    if (ccSelect) ccSelect.value = s.costCenterId || '';

    const riskDims = matrixState && matrixState.riskDimensions ? matrixState.riskDimensions : [];
    if (riskDims.length > 0) {
        riskValues[riskDims[0].id] = s.probabilidade || 1;
    }
    if (riskDims.length > 1) {
        riskValues[riskDims[1].id] = s.impacto || 1;
    }

    renderRiskSliders();
    switchTab('form');
}

async function deleteScope(id) {
    if (!confirm('Excluir este escopo? Isso também removerá todos os agendamentos no Planejamento e registros de execução associados.')) return;
    try {
        await apiFetch(`/test/scope/${id}`, { method: 'DELETE' });
        scopes = scopes.filter(s => s.id !== id);
        renderScopesList();
        showToast('Escopo excluído.');
    } catch (e) {
        showToast('Erro ao excluir escopo.');
    }
}

async function handleSave(generateCalendar) {
    const teste = document.getElementById('frm-teste').value.trim();
    const diretoria = document.getElementById('frm-diretoria').value;
    const areaId = document.getElementById('frm-area').value;
    if (!teste || !diretoria || !areaId) { alert('Preencha Nome do Teste, Diretoria e Área.'); return; }

    const riskDims = matrixState && matrixState.riskDimensions ? matrixState.riskDimensions : [];
    const probabilidade = riskDims.length > 0 ? (riskValues[riskDims[0].id] || 1) : 1;
    const impacto = riskDims.length > 1 ? (riskValues[riskDims[1].id] || 1) : 1;

    const costCenterId = document.getElementById('frm-centroCusto')?.value || null;

    const scopeData = {
        nome: teste,
        finalidade: document.getElementById('frm-finalidade').value,
        tagArea: document.getElementById('frm-descricao').value,
        periodicidade: document.getElementById('frm-periodicidade').value || 'Mensal',
        mesInicio: document.getElementById('frm-mesInicio').value || 'Janeiro',
        baseNormativa: document.getElementById('frm-baseNormativa').value || '',
        probabilidade: parseInt(probabilidade),
        impacto: parseInt(impacto),
        areaId: areaId,
        procedimentos: document.getElementById('frm-procedimentos')?.value || '',
        costCenterId: costCenterId || null
    };

    try {
        let savedScope;
        if (editingId) {
            savedScope = await apiFetch(`/test/scope/${editingId}`, {
                method: 'PUT',
                body: JSON.stringify(scopeData)
            });
            scopes = scopes.map(s => s.id === editingId ? savedScope : s);
        } else {
            savedScope = await apiFetch('/test/scope', {
                method: 'POST',
                body: JSON.stringify(scopeData)
            });
            scopes.push(savedScope);
        }

        showToast('Escopo salvo com sucesso!');

        if (generateCalendar) {
            try {
                await apiFetch(`/test/scope/${savedScope.id}/generate-planning`, { method: 'POST' });
                showToast('Calendário gerado com sucesso!');
            } catch (planningError) {
                console.error('Erro ao gerar calendário:', planningError);
                showToast('Escopo salvo, mas erro ao gerar calendário.');
            }
        }

        resetForm();
        renderScopesList();
        switchTab('list');
    } catch (e) {
        showToast('Erro ao salvar escopo.');
        console.error(e);
    }
}

function resetForm() {
    editingId = null;
    riskValues = {};
    selectedMonths = [];
    document.getElementById('frm-teste').value = '';
    document.getElementById('frm-descricao').value = '';
    document.getElementById('frm-periodicidade').value = 'Mensal';
    document.getElementById('frm-mesInicio').value = '';
    document.getElementById('frm-finalidade').value = '';
    document.getElementById('frm-baseNormativa').value = '';
    document.getElementById('frm-procedimentos').value = '';
    const ccSelect = document.getElementById('frm-centroCusto');
    if (ccSelect) ccSelect.value = '';
    renderRiskSliders();
    renderMonthsGrid();
}

/**
 * Local calendar generation (Legacy Support)
 * Note: Will be replaced by backend logic in Phase 8.
 */
function generatePlanningItems(scope) {
    // Legacy logic for local simulation if needed
}
