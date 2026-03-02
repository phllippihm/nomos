/**
 * Nomos - Test Execution Page Logic
 * Handles test execution, compliance calculation, file attachments, and history.
 */

let matrixConfig = null;
let testToExecute = null;
let attachments = [];
let history = [];

async function init() {
    if (!currentUser.institutionId) {
        console.warn('[Nomos] Institution ID not found. Waiting for session...');
        return;
    }

    // Load matrix config from API
    try {
        const data = await apiFetch(`/matrix-config/${currentUser.institutionId}`);
        if (data && typeof data === 'object') matrixConfig = data;
    } catch (matrixErr) {
        console.warn('[Nomos] Não foi possível carregar configuração da matriz:', matrixErr);
    }

    // Check if incoming test from Planejamento
    const incoming = localStorage.getItem('nomos_test_to_execute');
    if (incoming) {
        testToExecute = JSON.parse(incoming);
        localStorage.removeItem('nomos_test_to_execute');
        showTestForm();
    }

    await loadHistory(testToExecute?.scopeItemId);
}

async function loadHistory(scopeId) {
    try {
        const sid = scopeId || testToExecute?.scopeItemId;
        if (sid) {
            history = await apiFetch(`/test/scope/${sid}/executions`);
            renderHistory();
        }
    } catch (e) {
        console.error('Erro ao carregar histórico:', e);
    }
}

document.addEventListener('nomos:sessionReady', init);

function showTestForm() {
    if (!testToExecute) return;
    document.getElementById('no-test-selected')?.classList.add('hidden');
    document.getElementById('test-form-area')?.classList.remove('hidden');
    const nameEl = document.getElementById('exec-test-name');
    if (nameEl) nameEl.textContent = testToExecute.testName;
    const metaEl = document.getElementById('exec-test-meta');
    if (metaEl) metaEl.textContent = `${testToExecute.area || ''} · ${testToExecute.mes} ${testToExecute.ano} · ${testToExecute.diretoria || ''}`;
    const badge = document.getElementById('exec-risk-badge');
    if (badge) badge.textContent = testToExecute.riskLevel || 'N/A';
}

// ====================== COMPLIANCE CALCULATION ======================
function calculateCompliance() {
    const amostras = parseInt(document.getElementById('exec-amostras')?.value) || 0;
    const inconformes = parseInt(document.getElementById('exec-inconformes')?.value) || 0;

    if (amostras <= 0) {
        updateComplianceUI(null);
        return;
    }

    const compliance = Math.round(((amostras - inconformes) / amostras) * 10000) / 100;
    updateComplianceUI(Math.max(0, Math.min(100, compliance)));
}

function updateComplianceUI(compliance) {
    const pctEl = document.getElementById('compliance-pct');
    const levelEl = document.getElementById('compliance-level');
    const actionEl = document.getElementById('maintenance-action');
    const gauge = document.getElementById('compliance-gauge');

    if (!pctEl || !levelEl || !actionEl || !gauge) return;

    if (compliance === null) {
        pctEl.textContent = '-';
        levelEl.textContent = '-';
        actionEl.textContent = '-';
        gauge.style.borderColor = '#e2e8f0';
        return;
    }

    pctEl.textContent = compliance.toFixed(1) + '%';

    // Find compliance level from matrix
    let complianceLevel = null;
    if (matrixConfig && matrixConfig.complianceRanges) {
        complianceLevel = matrixConfig.complianceRanges.find(r => compliance >= r.min && compliance <= r.max);
    }

    const levelLabel = complianceLevel ? complianceLevel.label : 'Nível Indefinido';
    const levelColor = complianceLevel ? complianceLevel.color : '#94a3b8';
    levelEl.textContent = levelLabel;
    levelEl.style.color = levelColor;
    gauge.style.borderColor = levelColor;

    // Find maintenance action
    if (matrixConfig && matrixConfig.maintenanceMatrix && testToExecute) {
        const riskLevel = testToExecute.riskLevel || '';
        const key = riskLevel + '-' + levelLabel;
        const action = matrixConfig.maintenanceMatrix[key];
        actionEl.textContent = action || 'Ação não definida';
        actionEl.style.color = action === 'Nenhuma' ? '#22c55e' :
            action === 'Preventiva' ? '#3b82f6' :
                action === 'Corretiva' ? '#f59e0b' :
                    action === 'Emergencial' ? '#ef4444' : '#94a3b8';
    } else {
        actionEl.textContent = 'Config. de Matrizes ausente';
    }
}

// ====================== FILE HANDLING ======================
function handleFileSelect() {
    const fi = document.getElementById('exec-file');
    if (!fi) return;
    for (let f of fi.files) {
        if (!attachments.includes(f.name)) attachments.push(f.name);
    }
    renderFileList();
}

function renderFileList() {
    const listEl = document.getElementById('file-list');
    if (!listEl) return;
    listEl.innerHTML = attachments.map(name => `
        <div class="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg">
            <span class="material-symbols-outlined text-sm text-slate-400">description</span>
            ${name}
            <button onclick="removeAttachment('${name}')" class="ml-auto text-slate-300 hover:text-red-500"><span class="material-symbols-outlined text-sm">close</span></button>
        </div>
    `).join('');
}

function removeAttachment(name) {
    attachments = attachments.filter(a => a !== name);
    renderFileList();
}

// ====================== CONCLUDE ======================
async function concludeExecution() {
    if (!testToExecute) return;
    const amostras = parseFloat(document.getElementById('exec-amostras')?.value) || 0;
    const inconformes = parseFloat(document.getElementById('exec-inconformes')?.value) || 0;
    if (amostras <= 0) { showToast('Informe a quantidade de amostras.'); return; }

    const dto = {
        planningItemId: testToExecute.id,
        scopeItemId: testToExecute.scopeItemId,
        sampleSize: amostras,
        nonConforming: inconformes,
        nonConformities: document.getElementById('exec-detalhamento')?.value || '',
        actionTaken: document.getElementById('maintenance-action')?.textContent || ''
    };

    try {
        showToast('Salvando execução...');
        await apiFetch('/test/execution', {
            method: 'POST',
            body: JSON.stringify(dto)
        });

        showToast('Execução concluída com sucesso!');
        const finishedScopeId = testToExecute.scopeItemId;

        // Reset and show history
        testToExecute = null;
        attachments = [];
        document.getElementById('test-form-area')?.classList.add('hidden');
        document.getElementById('no-test-selected')?.classList.remove('hidden');

        await loadHistory(finishedScopeId);
        switchTab('history');
    } catch (e) {
        showToast('Erro ao salvar execução.');
        console.error(e);
    }
}

// ====================== HISTORY ======================
function renderHistory() {
    const tbody = document.getElementById('history-tbody');
    const empty = document.getElementById('history-empty');
    if (!tbody || !empty) return;
    if (history.length === 0) { tbody.innerHTML = ''; empty.classList.remove('hidden'); return; }
    empty.classList.add('hidden');

    const actionPlans = JSON.parse(localStorage.getItem('nomos_action_plans') || '[]');

    tbody.innerHTML = history.map(h => {
        const comp = h.conformityPercentage || 0;
        // Use backend-provided conformity color if available, otherwise fallback to hardcoded
        const compColorStyle = h.conformityColor ? `color:${h.conformityColor}` : '';
        const compColorClass = !h.conformityColor ? (comp >= 90 ? 'text-emerald-600' : comp >= 70 ? 'text-amber-500' : 'text-red-500') : '';
        const dateStr = h.testDate ? new Date(h.testDate).toLocaleDateString('pt-BR') : '-';
        const levelLabel = h.conformityLevel || '';
        const actionLabel = h.priorityAction || h.actionTaken || '-';

        return `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
            <td class="px-8 py-5 text-xs font-medium text-slate-500">${dateStr}</td>
            <td class="px-8 py-5">
                <p class="font-bold text-sm text-slate-900 dark:text-white">Execução de Teste</p>
                <p class="text-[10px] text-slate-400 uppercase font-bold">Responsável: ${h.responsible || '-'}</p>
            </td>
            <td class="px-8 py-5 text-xs text-slate-500">${h.sampleSize} / ${h.nonConforming} NC</td>
            <td class="px-8 py-5 font-extrabold text-sm ${compColorClass}" style="${compColorStyle}">
                ${comp.toFixed(1)}%${levelLabel ? ` <span class="text-[10px] font-bold uppercase">${levelLabel}</span>` : ''}
            </td>
            <td class="px-8 py-5 text-xs font-bold text-slate-500">${actionLabel}</td>
            <td class="px-6 py-5 text-right space-x-2">
                <button class="text-primary text-[10px] font-bold hover:underline">Ver Detalhes</button>
            </td>
        </tr>`;
    }).join('');
}

function goCreatePlan(execId) {
    const exec = history.find(h => h.id === execId);
    if (!exec) return;
    localStorage.setItem('nomos_execution_for_plan', JSON.stringify(exec));
    window.location.href = '/planos-acao';
}

function goViewPlan(planId) {
    window.location.href = '/planos-acao?planId=' + planId;
}

document.addEventListener('DOMContentLoaded', init);
