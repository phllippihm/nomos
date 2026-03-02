/**
 * Nomos - Home Page Logic
 */

let pendingCache = [];

async function init() {
    if (!currentUser?.institutionId) return;

    document.getElementById('greeting-name').textContent = currentUser.nome || 'Usuário';

    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('kpi-date').textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

    try {
        const data = await apiFetch(`/dashboard/home?institutionId=${currentUser.institutionId}`);
        if (!data) return;

        document.getElementById('kpi-planejados').textContent = data.totalPlanejados;
        document.getElementById('kpi-realizados').textContent = data.totalRealizados;
        document.getElementById('kpi-pendentes').textContent = data.totalPendentes;
        document.getElementById('kpi-conformidade').textContent =
            data.avgConformidade != null ? parseFloat(data.avgConformidade).toFixed(1) : '0.0';

        document.getElementById('kpi-ap-draft').textContent = data.actionPlansDraft;
        document.getElementById('kpi-ap-active').textContent = data.actionPlansActive;
        document.getElementById('kpi-ap-completed').textContent = data.actionPlansCompleted;

        renderPendencias(data.pendingTests);
    } catch (e) {
        console.error('[Nomos] Erro ao carregar home:', e);
    }
}

function renderPendencias(items) {
    pendingCache = items || [];
    const tbody = document.getElementById('pendencias-tbody');
    if (!tbody) return;

    if (pendingCache.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td class="px-10 py-16 text-center" colspan="5">
                    <div class="flex flex-col items-center gap-3 opacity-30">
                        <span class="material-symbols-outlined text-4xl">inventory_2</span>
                        <p class="text-sm font-medium italic">Nenhuma pendência encontrada no momento.</p>
                    </div>
                </td>
            </tr>`;
        return;
    }

    const riskConfig = {
        ALTO:  { label: 'Alto',  color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
        MEDIO: { label: 'Médio', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
        BAIXO: { label: 'Baixo', color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' }
    };

    tbody.innerHTML = pendingCache.map((item, idx) => {
        const risk = riskConfig[item.riskLevel] || { label: item.riskLevel || 'N/A', color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0' };
        return `
        <tr class="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors">
            <td class="px-10 py-5">
                <p class="font-bold text-slate-900 dark:text-white text-sm">${item.testName}</p>
                <p class="text-[10px] text-slate-400 mt-0.5 font-medium uppercase tracking-wide">${item.diretoria}</p>
            </td>
            <td class="px-10 py-5 text-sm text-slate-600 dark:text-slate-400 font-medium">${item.area}</td>
            <td class="px-10 py-5 text-sm text-slate-600 dark:text-slate-400 font-medium">${item.mes} ${item.ano}</td>
            <td class="px-10 py-5">
                <span class="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border"
                    style="color:${risk.color}; border-color:${risk.border}; background:${risk.bg}">${risk.label}</span>
            </td>
            <td class="px-10 py-5 text-right">
                <button onclick="goExecute(${idx})"
                    class="bg-primary text-white text-[10px] font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-all">
                    Executar
                </button>
            </td>
        </tr>`;
    }).join('');
}

function goExecute(idx) {
    const item = pendingCache[idx];
    if (!item) return;
    localStorage.setItem('nomos_test_to_execute', JSON.stringify({
        planningItemId: item.planningItemId,
        scopeItemId: item.scopeItemId,
        testName: item.testName,
        area: item.area,
        diretoria: item.diretoria,
        mes: item.mes,
        ano: item.ano,
        riskLevel: item.riskLevel
    }));
    window.location.href = '/execucao';
}

document.getElementById('logout-button').addEventListener('click', async () => {
    if (confirm('Deseja realmente sair?')) {
        try { await apiFetch('/auth/logout', { method: 'POST' }); } catch (_) {}
        window.location.replace('/login');
    }
});

document.addEventListener('nomos:sessionReady', init);
