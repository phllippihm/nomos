/**
 * Nomos - Planning Page Logic
 * Manages the planning calendar, filtering, and status calculations.
 */

let plans = [];
let allPlans = [];
let executions = [];

async function init() {
    if (!currentUser.institutionId) {
        console.warn('[Nomos] Institution ID not found. Waiting for session...');
        return;
    }

    try {
        // Load Planning from Backend
        plans = await apiFetch('/test/planning');

        // executions array is no longer needed as compliance is in the plan object
        executions = [];

        // ===== OVERDUE CALCULATION =====
        const now = new Date();
        const currentMonth = now.getMonth(); // 0-indexed
        const currentYear = now.getFullYear();

        plans.forEach(p => {
            if (p.status === 'Pendente' || p.status === 'Planejado') {
                const planMonthIdx = MESES.indexOf(p.mes);
                const planYear = parseInt(p.ano);
                if (planYear < currentYear || (planYear === currentYear && planMonthIdx < currentMonth)) {
                    p.status = 'Vencido';
                }
            }
        });

        populateFilters();
        renderPlanning();
    } catch (e) {
        showToast('Erro ao carregar planejamento.');
        console.error(e);
    }
}

document.addEventListener('nomos:sessionReady', init);
if (currentUser.institutionId) init();

function populateFilters() {
    const yearsSet = new Set();
    const curY = new Date().getFullYear().toString();
    yearsSet.add(curY);
    plans.forEach(p => yearsSet.add(p.ano));
    const years = Array.from(yearsSet).sort().reverse();
    const filterYear = document.getElementById('filter-year');
    if (filterYear) {
        filterYear.innerHTML = years.map(y => `<option value="${y}" ${y === curY ? 'selected' : ''}>${y}</option>`).join('');
    }

    const filterMonth = document.getElementById('filter-month');
    if (filterMonth) {
        filterMonth.innerHTML = '<option value="">Todos</option>' +
            MESES.map(m => `<option value="${m}">${m}</option>`).join('');
    }

    const diretorias = [...new Set(plans.map(p => p.diretoria).filter(Boolean))].sort();
    const filterDiretoria = document.getElementById('filter-diretoria');
    if (filterDiretoria) {
        filterDiretoria.innerHTML = '<option value="">Todas</option>' +
            diretorias.map(d => `<option value="${d}">${d}</option>`).join('');
    }

    const areas = [...new Set(plans.map(p => p.area).filter(Boolean))].sort();
    const filterArea = document.getElementById('filter-area');
    if (filterArea) {
        filterArea.innerHTML = '<option value="">Todas</option>' +
            areas.map(a => `<option value="${a}">${a}</option>`).join('');
    }
}

function renderPlanning() {
    const search = document.getElementById('filter-search')?.value.toLowerCase() || '';
    const year = document.getElementById('filter-year')?.value;
    const month = document.getElementById('filter-month')?.value;
    const diretoria = document.getElementById('filter-diretoria')?.value;
    const area = document.getElementById('filter-area')?.value;
    const status = document.getElementById('filter-status')?.value;

    let filtered = plans.filter(p => {
        if (year && String(p.ano) !== String(year)) return false;
        if (month && p.mes !== month) return false;
        if (diretoria && p.diretoria !== diretoria) return false;
        if (area && p.area !== area) return false;
        if (status && p.status !== status) return false;
        if (search && !(p.testName.toLowerCase().includes(search) || (p.area || '').toLowerCase().includes(search))) return false;
        return true;
    });

    filtered.sort((a, b) => MESES.indexOf(a.mes) - MESES.indexOf(b.mes));

    const total = filtered.length;
    const done = filtered.filter(p => p.status === 'Realizado').length;
    const pending = filtered.filter(p => p.status === 'Pendente').length;
    const overdue = filtered.filter(p => p.status === 'Vencido').length;

    const statTotal = document.getElementById('stat-total');
    if (statTotal) statTotal.textContent = total;
    const statDone = document.getElementById('stat-done');
    if (statDone) statDone.textContent = done;
    const statPending = document.getElementById('stat-pending');
    if (statPending) statPending.textContent = pending;
    const statOverdue = document.getElementById('stat-overdue');
    if (statOverdue) statOverdue.textContent = overdue;

    const overdueCard = document.getElementById('stat-overdue-card');
    if (overdueCard) {
        if (overdue > 0) {
            overdueCard.classList.add('pulse-overdue', 'border-red-200');
        } else {
            overdueCard.classList.remove('pulse-overdue', 'border-red-200');
        }
    }

    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) progressBar.style.width = pct + '%';
    const progressPct = document.getElementById('progress-pct');
    if (progressPct) progressPct.textContent = pct + '%';
    const progressLabelDone = document.getElementById('progress-label-done');
    if (progressLabelDone) progressLabelDone.textContent = done + ' realizados';
    const progressLabelTotal = document.getElementById('progress-label-total');
    if (progressLabelTotal) progressLabelTotal.textContent = 'de ' + total + ' planejados';

    const tbody = document.getElementById('planning-tbody');
    const empty = document.getElementById('planning-empty');

    if (!tbody || !empty) return;

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }
    empty.classList.add('hidden');

    tbody.innerHTML = filtered.map((p, idx) => {
        const statusClass =
            p.status === 'Realizado' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                p.status === 'Vencido' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-slate-100 text-slate-500 dark:bg-slate-700/40 dark:text-slate-400';

        const statusIcon =
            p.status === 'Realizado' ? 'check_circle' :
                p.status === 'Vencido' ? 'error' : 'schedule';

        const riskColor =
            (p.riskLevel || '').toLowerCase().includes('alto') ? 'text-red-600 bg-red-50 border-red-100' :
                (p.riskLevel || '').toLowerCase().includes('médio') ? 'text-amber-600 bg-amber-50 border-amber-100' :
                    (p.riskLevel || '').toLowerCase().includes('baixo') ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                        (p.riskLevel || '').toLowerCase().includes('crític') ? 'text-purple-600 bg-purple-50 border-purple-100' :
                            'text-slate-500 bg-slate-50 border-slate-200';

        const complianceText = p.compliance !== null ? p.compliance.toFixed(1) + '%' : '';

        const rowAccent =
            p.status === 'Vencido' ? 'border-l-4 border-l-red-400' :
                p.status === 'Realizado' ? 'border-l-4 border-l-emerald-400' :
                    'border-l-4 border-l-transparent';

        const canExecute = p.status !== 'Realizado';

        return `
        <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-700/20 transition-colors ${rowAccent} animate-row" style="animation-delay:${idx * 30}ms">
            <td class="px-8 py-5">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl ${p.status === 'Vencido' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-blue-50 dark:bg-blue-900/20'} flex items-center justify-center">
                        <span class="material-symbols-outlined ${p.status === 'Vencido' ? 'text-red-400' : 'text-primary'} text-lg">calendar_month</span>
                    </div>
                    <div>
                        <p class="font-black text-slate-900 dark:text-white text-sm leading-none">${p.mes}</p>
                        <p class="text-[10px] font-bold text-slate-400 mt-1">${p.ano}</p>
                    </div>
                </div>
            </td>
            <td class="px-8 py-5">
                <p class="font-bold text-sm text-slate-900 dark:text-white">${p.testName}</p>
                <p class="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-widest">${p.area || ''} ${p.diretoria ? '· ' + p.diretoria : ''}</p>
            </td>
            <td class="px-6 py-5">
                ${p.riskLevel ? `<span class="text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${riskColor}">${p.riskLevel}</span>` : '<span class="text-slate-300 text-xs">-</span>'}
            </td>
            <td class="px-6 py-5">
                <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400">${p.responsavel || '-'}</span>
            </td>
            <td class="px-6 py-5">
                <div class="flex flex-col space-y-1.5">
                    <span class="flex items-center gap-1.5 text-[9px] w-fit font-black uppercase px-2.5 py-1 rounded-full ${statusClass}">
                        <span class="material-symbols-outlined text-[13px]">${statusIcon}</span>
                        ${p.status}
                    </span>
                    ${complianceText ? `<span class="text-[10px] font-bold text-emerald-600">Conformidade: ${complianceText}</span>` : ''}
                </div>
            </td>
            <td class="px-8 py-5 text-right">
                ${canExecute
                ? `<button onclick="goExecute('${p.id}')" class="px-5 py-2.5 bg-primary text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/10 active:scale-95 transition-all">Executar</button>`
                : `<span class="flex items-center gap-1 justify-end text-emerald-500 text-[10px] font-black uppercase"><span class="material-symbols-outlined text-sm">verified</span> Concluído</span>`
            }
            </td>
        </tr>`;
    }).join('');
}

function goExecute(planId) {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    localStorage.setItem('nomos_test_to_execute', JSON.stringify(plan));
    showToast('Carregando teste para execução...');
    setTimeout(() => { window.location.href = '/execucao'; }, 400);
}

document.addEventListener('DOMContentLoaded', init);
