/**
 * Nomos - Action Plans Page Logic
 * Manages action plans, steps, messages, and conclusions.
 */

let actionPlans = [];
let pendingSteps = [];
let incomingExecution = null;
let activePlanId = null;

async function init() {
    if (!currentUser.institutionId) {
        console.warn('[Nomos] Institution ID not found. Waiting for session...');
        return;
    }

    await loadPlans();

    // Check if viewing specific plan via query param
    const urlParams = new URLSearchParams(window.location.search);
    const planId = urlParams.get('planId');
    if (planId) {
        openPlanDetail(planId);
    }
}

async function loadPlans() {
    try {
        actionPlans = await apiFetch('/action-plans');
        renderActivePlans();
        renderCompletedPlans();
    } catch (e) {
        console.error('Erro ao listar planos de ação:', e);
    }
}

document.addEventListener('nomos:sessionReady', init);

// ====================== CREATION FORM ======================
function showCreationForm() {
    document.getElementById('creation-form')?.classList.remove('hidden');
    const infoEl = document.getElementById('creation-exec-info');
    if (infoEl && incomingExecution) {
        infoEl.textContent =
            `${incomingExecution.testName} — ${incomingExecution.area || ''} — Conformidade: ${(incomingExecution.compliance || 0).toFixed(1)}% — Ação: ${incomingExecution.maintenanceAction || 'N/A'}`;
    }
}

function addStep() {
    const desc = document.getElementById('step-desc')?.value.trim();
    const resp = document.getElementById('step-resp')?.value.trim();
    const deadline = document.getElementById('step-deadline')?.value;
    if (!desc) { alert('Informe a descrição da etapa.'); return; }
    pendingSteps.push({ id: Date.now().toString(), description: desc, responsible: resp, deadline, done: false });
    const descInput = document.getElementById('step-desc');
    if (descInput) descInput.value = '';
    const respInput = document.getElementById('step-resp');
    if (respInput) respInput.value = '';
    const deadlineInput = document.getElementById('step-deadline');
    if (deadlineInput) deadlineInput.value = '';
    renderStepsPreview();
}

function removeStep(id) {
    pendingSteps = pendingSteps.filter(s => s.id !== id);
    renderStepsPreview();
}

function renderStepsPreview() {
    const countEl = document.getElementById('step-count');
    if (countEl) countEl.textContent = pendingSteps.length;
    const previewEl = document.getElementById('steps-preview');
    if (!previewEl) return;
    previewEl.innerHTML = pendingSteps.length === 0
        ? '<p class="text-center text-slate-300 text-xs py-10 font-bold uppercase">Nenhuma etapa adicionada</p>'
        : pendingSteps.map(s => `
            <div class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl group">
                <span class="material-symbols-outlined text-lg text-slate-300">radio_button_unchecked</span>
                <div class="flex-1 min-w-0">
                    <p class="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">${s.description}</p>
                    <p class="text-[9px] text-slate-400">${s.responsible || 'Sem responsável'} ${s.deadline ? '· Prazo: ' + s.deadline : ''}</p>
                </div>
                <button onclick="removeStep('${s.id}')" class="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                    <span class="material-symbols-outlined text-lg">delete</span>
                </button>
            </div>
        `).join('');
}

async function createPlan() {
    const desc = document.getElementById('creation-desc')?.value.trim();
    if (!desc) { alert('Preencha a descrição do plano.'); return; }
    if (pendingSteps.length === 0) { alert('Adicione ao menos uma etapa.'); return; }

    // In the new flow, if we have an incoming execution, the ActionPlan (DRAFT) is likely already created by TestService.
    // If we are creating from scratch without a DRAFT plan, we need a new endpoint.
    // For now, let's assume we are updating a DRAFT plan to ACTIVE if activePlanId is set,
    // OR we are mocking the creation if this form is still used.

    // Simplification for the migration: This generic creation form might need to target a specific /api endpoint.
    // If incomingExecution has an action plan ID (not currently mapped), we would PUT to it.
    // For now, if we are editing a draft, we use openPlanDetail which has its own edit flow.
    // If the creation form is for "standalone" plans, we need POST /api/action-plans (Backend doesn't have it yet).
    // => Workaround: Hide this standalone form since GRC loop auto-generates drafts.

    alert('Por favor, edite os planos de ação gerados automaticamente na lista de planos ativos.');
    document.getElementById('creation-form')?.classList.add('hidden');
    pendingSteps = [];
}

// ====================== PLAN DETAIL ======================
function openPlanDetail(planId) {
    const plan = actionPlans.find(p => p.id === planId);
    if (!plan) return;
    activePlanId = planId;

    // Hide tabs and panels, show detail view
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
    document.querySelector('.tab-btn').parentElement.classList.add('hidden');
    document.getElementById('plan-detail')?.classList.remove('hidden');

    const descEl = document.getElementById('detail-desc');
    // If DRAFT and description empty, show input field or "Sem descrição"
    if (descEl) {
        if (!plan.description && plan.status === 'DRAFT') {
            descEl.innerHTML = `<input type="text" id="draft-desc-input" class="w-full text-sm bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 focus:outline-none focus:border-primary placeholder-slate-300" placeholder="Digite o objetivo do plano para ativá-lo..." onblur="updatePlanDescription('${plan.id}')">`;
        } else {
            descEl.textContent = plan.description || 'Descrição não informada';
        }
    }

    // Exec info
    const execInfo = document.getElementById('detail-exec-info');
    if (execInfo) {
        if (plan.detalhamento || plan.testName) {
            execInfo.classList.remove('hidden');
            execInfo.innerHTML = `
                <p class="font-bold text-primary mb-1">${plan.testName} — ${plan.area || ''}</p>
                ${plan.detalhamento ? `<p class="text-slate-500 mt-1">${plan.detalhamento}</p>` : ''}
                ${plan.status === 'DRAFT' ? '<span class="inline-block mt-2 px-2 py-1 text-[10px] font-bold uppercase rounded bg-amber-100 text-amber-700">Rascunho Automático</span>' : ''}
            `;
        } else {
            execInfo.classList.add('hidden');
        }
    }

    // Setup generic step add button in detail view
    const detailFormContainer = document.getElementById('detail-step-form');
    // If not exists we can inject one or reuse the logic
    // For now, assuming UI logic allows adding steps inside detail or we reuse showCreationForm logic
    // We will inject a lightweight step adder at the bottom of steps list.
    const stepsContainer = document.getElementById('detail-steps').parentElement;
    if (!document.getElementById('inline-step-adder')) {
        const adder = document.createElement('div');
        adder.id = 'inline-step-adder';
        adder.className = 'mt-4 flex gap-2 items-end';
        adder.innerHTML = `
            <div class="flex-1">
                <input type="text" id="inline-step-desc" placeholder="Nova etapa (O que fazer)" class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-1 focus:ring-primary focus:border-primary transition-all">
            </div>
            <div class="w-24">
                <input type="text" id="inline-step-resp" placeholder="Resp." class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-1 focus:ring-primary focus:border-primary transition-all">
            </div>
            <div class="w-28">
                <input type="date" id="inline-step-deadline" class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-1 focus:ring-primary focus:border-primary transition-all">
            </div>
            <button onclick="addStepAPI('${plan.id}')" class="bg-primary text-white p-2 rounded-lg hover:bg-blue-600 transition-colors">
                <span class="material-symbols-outlined text-sm">add</span>
            </button>
        `;
        stepsContainer.appendChild(adder);
    }

    // Toggle adder visibility based on plan status
    const adder = document.getElementById('inline-step-adder');
    if (adder) {
        if (plan.status === 'COMPLETED') {
            adder.classList.add('hidden');
        } else {
            adder.classList.remove('hidden');
        }
    }

    renderDetailSteps(plan);
    renderDetailMessages(plan);

    // Show finalize button if all steps done
    const allDone = plan.steps.length > 0 && plan.steps.every(s => s.done);
    const finalizeBtn = document.getElementById('btn-finalize');
    if (finalizeBtn) {
        finalizeBtn.classList.toggle('hidden', !allDone || plan.status === 'COMPLETED');
    }
}

function renderDetailSteps(plan) {
    const container = document.getElementById('detail-steps');
    if (!container) return;

    const isCompleted = plan.status === 'COMPLETED';

    container.innerHTML = plan.steps.map(s => `
        <div style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem;border-radius:0.75rem;transition:all 0.2s;${s.done ? 'background:#ecfdf5;' : 'background:#f8fafc;'}">
            <span class="material-symbols-outlined" style="font-size:1.125rem;${isCompleted ? 'color:#cbd5e1;' : 'cursor:pointer;' + (s.done ? 'color:#10b981;' : 'color:#cbd5e1;')}" 
                ${!isCompleted ? `onclick="toggleStep('${plan.id}', '${s.id}')"` : ''}>${s.done ? 'check_circle' : 'radio_button_unchecked'}</span>
            <div style="flex:1;min-width:0;${!isCompleted ? 'cursor:pointer;' : ''}" ${!isCompleted ? `onclick="toggleStep('${plan.id}', '${s.id}')"` : ''}>
                <p style="font-size:0.75rem;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;${s.done ? 'color:#047857;text-decoration:line-through;' : 'color:#334155;'}">${s.description}</p>
                <p style="font-size:9px;color:#94a3b8;">${s.responsible || ''} ${s.deadline ? '· ' + s.deadline : ''}</p>
            </div>
            ${!isCompleted ? `
            <button onclick="removeStepAPI(event, '${plan.id}', '${s.id}')" style="color:#ef4444;background:none;border:1px solid #fecaca;border-radius:0.5rem;padding:0.25rem 0.5rem;cursor:pointer;display:flex;align-items:center;gap:0.25rem;font-size:0.7rem;font-weight:600;transition:all 0.2s;" onmouseover="this.style.background='#fef2f2';this.style.borderColor='#ef4444'" onmouseout="this.style.background='none';this.style.borderColor='#fecaca'">
                <span class="material-symbols-outlined" style="font-size:14px;">delete</span> Excluir
            </button>
            ` : ''}
        </div>
    `).join('');

    const doneCount = plan.steps.filter(s => s.done).length;
    const pct = plan.steps.length > 0 ? Math.round((doneCount / plan.steps.length) * 100) : 0;
    const progressBar = document.getElementById('detail-progress-bar');
    if (progressBar) progressBar.style.width = pct + '%';
    const progressPct = document.getElementById('detail-progress-pct');
    if (progressPct) progressPct.textContent = pct + '%';
}

async function toggleStep(planId, stepId) {
    try {
        await apiFetch(`/action-plans/${planId}/steps/${stepId}/toggle`, { method: 'PUT' });
        await refreshPlanDetail(planId);
    } catch (e) {
        showToast('Erro ao atualizar etapa.');
    }
}

async function addStepAPI(planId) {
    const descInput = document.getElementById('inline-step-desc');
    const respInput = document.getElementById('inline-step-resp');
    const deadlineInput = document.getElementById('inline-step-deadline');

    const desc = descInput?.value.trim();
    if (!desc) { showToast('Informe a descrição da etapa.'); return; }

    const dto = {
        description: desc,
        responsible: respInput?.value.trim() || '',
        deadline: deadlineInput?.value || ''
    };

    try {
        await apiFetch(`/action-plans/${planId}/steps`, {
            method: 'POST',
            body: JSON.stringify(dto)
        });

        if (descInput) descInput.value = '';
        if (respInput) respInput.value = '';
        if (deadlineInput) deadlineInput.value = '';

        await refreshPlanDetail(planId);
    } catch (e) {
        showToast('Erro ao adicionar etapa.');
    }
}

async function removeStepAPI(e, planId, stepId) {
    if (e) e.stopPropagation();
    if (!confirm('Excluir esta etapa?')) return;
    try {
        await apiFetch(`/action-plans/${planId}/steps/${stepId}`, { method: 'DELETE' });
        await refreshPlanDetail(planId);
    } catch (e) {
        showToast('Erro ao excluir etapa.');
    }
}

async function updatePlanDescription(planId) {
    const input = document.getElementById('draft-desc-input');
    if (!input || !input.value.trim()) return;

    try {
        await apiFetch(`/action-plans/${planId}`, {
            method: 'PUT',
            body: JSON.stringify({ description: input.value.trim() })
        });
        showToast('Descrição atualizada. Plano está ATIVO.');
        await refreshPlanDetail(planId);
    } catch (e) {
        showToast('Erro ao atualizar descrição.');
    }
}

async function refreshPlanDetail(planId) {
    await loadPlans();
    openPlanDetail(planId);
}

function renderDetailMessages(plan) {
    const container = document.getElementById('detail-messages');
    if (!container) return;
    container.innerHTML = plan.messages.map(m => {
        if (m.type === 'system') {
            return `<div class="text-center"><span class="text-[9px] text-slate-400 bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-full">${m.text} · ${m.date}</span></div>`;
        }
        const isMe = m.userId === currentUser.id;
        return `
            <div class="flex ${isMe ? 'justify-end' : 'justify-start'}">
                <div class="${isMe ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'} px-4 py-2.5 rounded-2xl max-w-[80%]">
                    <p class="text-[9px] font-bold ${isMe ? 'text-blue-200' : 'text-slate-400'} mb-0.5">${m.userName}</p>
                    <p class="text-xs">${m.text}</p>
                    <p class="text-[8px] ${isMe ? 'text-blue-300' : 'text-slate-400'} mt-1">${m.date}</p>
                </div>
            </div>`;
    }).join('');
    container.scrollTop = container.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById('msg-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text || !activePlanId) return;

    try {
        await apiFetch(`/action-plans/${activePlanId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ text })
        });
        input.value = '';
        await refreshPlanDetail(activePlanId);
    } catch (e) {
        showToast('Erro ao enviar mensagem.');
    }
}

async function finalizePlan() {
    if (!activePlanId) return;
    if (!confirm('Deseja concluir este plano de ação?')) return;

    try {
        await apiFetch(`/action-plans/${activePlanId}/finalize`, { method: 'PUT' });
        showToast('Plano de ação concluído com sucesso!');

        // Fetch new state first
        await loadPlans();

        // Then close and force show the completed tab
        activePlanId = null;
        document.getElementById('plan-detail')?.classList.add('hidden');
        document.querySelector('.tab-btn')?.parentElement?.classList.remove('hidden');
        switchTab('completed');
    } catch (e) {
        showToast('Erro ao concluir plano.');
        console.error('Finalize error:', e);
    }
}

function closePlanDetail() {
    activePlanId = null;
    document.getElementById('plan-detail')?.classList.add('hidden');
    document.querySelector('.tab-btn').parentElement.classList.remove('hidden');

    // Restore currently active tab
    if (document.getElementById('tab-completed')?.classList.contains('text-primary')) {
        switchTab('completed');
    } else {
        switchTab('active');
    }
}

async function deletePlanAPI(planId) {
    if (!confirm('Tem certeza que deseja excluir este plano de ação? Esta ação não pode ser desfeita.')) return;
    try {
        await apiFetch(`/action-plans/${planId}`, { method: 'DELETE' });
        showToast('Plano excluído com sucesso!');
        if (activePlanId === planId) {
            closePlanDetail();
        }
        await loadPlans();
    } catch (e) {
        showToast('Erro ao excluir plano.');
    }
}

// ====================== PLAN LISTS ======================
function renderActivePlans() {
    const active = actionPlans.filter(p => p.status === 'ACTIVE' || p.status === 'DRAFT');
    renderPlanTable('active', active);
}

function renderCompletedPlans() {
    const completed = actionPlans.filter(p => p.status === 'COMPLETED');
    renderPlanTable('completed', completed);
}

function renderPlanTable(type, plans) {
    const tbody = document.getElementById(type + '-tbody');
    const empty = document.getElementById(type + '-empty');
    if (!tbody || !empty) return;
    if (plans.length === 0) { tbody.innerHTML = ''; empty.classList.remove('hidden'); return; }
    empty.classList.add('hidden');
    tbody.innerHTML = plans.map(p => {
        const doneCount = p.steps.filter(s => s.done).length;
        const total = p.steps.length;
        const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
        const isCompleted = p.status === 'COMPLETED';
        return `
        <tr style="transition:background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
            <td class="px-8 py-5 text-xs text-slate-500">
                ${new Date(p.createdAt).toLocaleDateString('pt-BR')} 
                ${p.status === 'DRAFT' ? '<br><span style="font-size:9px;color:#f59e0b;font-weight:700;">RASCUNHO</span>' : ''}
            </td>
            <td class="px-8 py-5">
                <p class="font-bold text-sm text-slate-900 dark:text-white">${p.testName || 'Manual'}</p>
                <p style="font-size:10px;color:#94a3b8;">${p.area || ''}</p>
            </td>
            <td class="px-8 py-5 text-xs text-slate-500" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.description || ''}</td>
            <td class="px-8 py-5">
                <div style="display:flex;align-items:center;gap:0.75rem;">
                    <div style="flex:1;background:#f1f5f9;border-radius:9999px;height:0.5rem;overflow:hidden;width:6rem;">
                        <div style="background:var(--color-primary, #3b82f6);height:0.5rem;border-radius:9999px;width:${pct}%"></div>
                    </div>
                    <span style="font-size:10px;font-weight:700;color:#94a3b8;">${doneCount}/${total}</span>
                </div>
            </td>
            <td class="px-6 py-5 text-right" style="white-space:nowrap;">
                <button onclick="openPlanDetail('${p.id}')" style="color:var(--color-primary, #3b82f6);font-size:0.75rem;font-weight:700;background:none;border:none;cursor:pointer;text-decoration:underline;">Abrir</button>
                ${!isCompleted ? `
                <button onclick="deletePlanAPI('${p.id}')" style="color:#ef4444;font-size:0.7rem;font-weight:600;background:none;border:1px solid #fecaca;border-radius:0.5rem;padding:0.25rem 0.5rem;cursor:pointer;margin-left:0.5rem;transition:all 0.2s;display:inline-flex;align-items:center;gap:0.25rem;" onmouseover="this.style.background='#fef2f2';this.style.borderColor='#ef4444'" onmouseout="this.style.background='none';this.style.borderColor='#fecaca'">
                    <span class="material-symbols-outlined" style="font-size:14px;">delete</span> Excluir
                </button>
                ` : ''}
            </td>
        </tr>`;
    }).join('');
}

document.addEventListener('DOMContentLoaded', init);
