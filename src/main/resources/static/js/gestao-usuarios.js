/**
 * Nomos - User and Company Management Logic
 * Handles rendering tables, modals, and organizational structure.
 */

let users = [];
let estrutura = {};
let institutions = []; // loaded from API

/**
 * Custom Tab Switching for Gestão de Usuários
 * Overwrites the default switchTab in common.js to support specific style classes.
 */
function switchTab(tab) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('bg-white', 'text-primary', 'shadow-sm', 'dark:bg-slate-700');
        b.classList.add('text-slate-400');
    });
    document.getElementById('panel-' + tab)?.classList.remove('hidden');
    const btn = document.getElementById('tab-' + tab);
    if (btn) {
        btn.classList.add('bg-white', 'text-primary', 'shadow-sm', 'dark:bg-slate-700');
        btn.classList.remove('text-slate-400');
    }
}

// ====================== EMPRESAS ======================
function renderEmpresas() {
    const tbody = document.getElementById('empresas-tbody');
    const empty = document.getElementById('empresas-empty');
    if (!tbody || !empty) return;
    if (institutions.length === 0) {
        tbody.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }
    empty.classList.add('hidden');
    tbody.innerHTML = institutions.map(inst => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
            <td class="px-8 py-5">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                        <span class="material-symbols-outlined text-primary text-lg">business</span>
                    </div>
                    <span class="font-bold text-slate-900 dark:text-white text-sm">${inst.nome}</span>
                </div>
            </td>
            <td class="px-8 py-5 text-slate-500 font-mono text-xs">${inst.cnpj || '—'}</td>
            <td class="px-8 py-5">
                <span class="text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${inst.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}">${inst.ativo ? 'Ativa' : 'Inativa'}</span>
            </td>
            <td class="px-8 py-5 text-right">
                <button onclick="editEmpresa('${inst.id}')" class="text-primary text-xs font-bold hover:underline">Editar</button>
                <button onclick="deleteEmpresa('${inst.id}')" class="text-red-400 text-xs font-bold hover:underline ml-3">Excluir</button>
            </td>
        </tr>
    `).join('');
}

function openEmpresaModal(inst) {
    document.getElementById('emp-nome').value = inst ? inst.nome : '';
    document.getElementById('emp-cnpj').value = inst ? (inst.cnpj || '') : '';
    document.getElementById('emp-id').value = inst ? inst.id : '';
    const titleEl = document.getElementById('modal-empresa-title');
    if (titleEl) titleEl.textContent = inst ? 'Editar Empresa' : 'Cadastrar Empresa';
    const modal = document.getElementById('modal-empresa');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    }
}

function closeEmpresaModal() {
    const modal = document.getElementById('modal-empresa');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.add('hidden');
    }
}

function editEmpresa(id) {
    const inst = institutions.find(i => i.id === id);
    if (inst) openEmpresaModal(inst);
}

async function deleteEmpresa(id) {
    if (!confirm('Deseja realmente excluir esta empresa? Isso também remove toda a estrutura organizacional vinculada.')) return;
    try {
        await apiFetch(`/organization/institutions/${id}`, { method: 'DELETE' });
        await loadInstitutions();
        renderEmpresas();
        showToast('Empresa excluída.');
    } catch (e) {
        showToast('Erro ao excluir empresa.');
        console.error(e);
    }
}

async function saveEmpresa() {
    const nome = document.getElementById('emp-nome')?.value.trim();
    const cnpj = document.getElementById('emp-cnpj')?.value.trim();
    const id = document.getElementById('emp-id')?.value;
    if (!nome) { alert('Preencha o Nome da Empresa.'); return; }

    try {
        if (id) {
            await apiFetch(`/organization/institutions/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ id, nome, cnpj: cnpj || null, ativo: true })
            });
            showToast('Empresa atualizada!');
        } else {
            await apiFetch('/organization/institutions', {
                method: 'POST',
                body: JSON.stringify({ nome, cnpj: cnpj || null, ativo: true })
            });
            showToast('Empresa cadastrada!');
        }
        closeEmpresaModal();
        await loadInstitutions();
        renderEmpresas();
    } catch (e) {
        showToast('Erro ao salvar empresa.');
        console.error(e);
    }
}

// ====================== ESTRUTURA ORGANIZACIONAL ======================
async function loadInstitutions() {
    try {
        institutions = await apiFetch('/organization/institutions') || [];
        populateEmpresaSelects();
    } catch (e) {
        console.error('Erro ao carregar instituições:', e);
    }
}

function populateEmpresaSelects() {
    // Use API institutions for the estrutura select
    const apiOpts = '<option value="">Escolher Empresa...</option>' +
        institutions.map(i => `<option value="${i.id}">${i.nome}</option>`).join('');
    const estSelect = document.getElementById('estrutura-empresa-select');
    if (estSelect) estSelect.innerHTML = apiOpts;

    // User modal uses API institutions
    const usrSelect = document.getElementById('usr-empresaId');
    if (usrSelect) usrSelect.innerHTML = '<option value="">Escolher Empresa...</option>' +
        institutions.map(i => `<option value="${i.id}">${i.nome}</option>`).join('');
}

async function renderEstrutura() {
    const institutionId = document.getElementById('estrutura-empresa-select')?.value;
    if (!institutionId) {
        ['diretorias', 'areas', 'centrosCusto'].forEach(key => {
            const listEl = document.getElementById('list-' + key);
            if (listEl) {
                listEl.innerHTML = '<p class="text-center py-10 text-slate-300 text-xs font-bold uppercase tracking-widest">Selecione uma empresa</p>';
            }
        });
        return;
    }

    // Diretorias from API
    let loadedDirectorates = [];
    try {
        loadedDirectorates = await apiFetch(`/organization/institutions/${institutionId}/directorates`) || [];
        renderDirectorateList(loadedDirectorates, institutionId);
        // Populate the directorate selector for new area creation
        const dirSel = document.getElementById('new-area-diretoria');
        if (dirSel) {
            dirSel.innerHTML = '<option value="">Selecionar diretoria...</option>' +
                loadedDirectorates.map(d => `<option value="${d.id}">${d.nome}</option>`).join('');
        }
    } catch (e) {
        document.getElementById('list-diretorias').innerHTML =
            '<p class="text-center py-10 text-slate-300 text-xs font-bold uppercase">Erro ao carregar</p>';
    }

    // Áreas from API
    try {
        const areas = await apiFetch(`/organization/institutions/${institutionId}/areas`) || [];
        renderAreaList(areas, loadedDirectorates);
    } catch (e) {
        document.getElementById('list-areas').innerHTML =
            '<p class="text-center py-10 text-slate-300 text-xs font-bold uppercase">Erro ao carregar</p>';
    }

    // Centros de Custo from API
    try {
        const costCenters = await apiFetch(`/organization/institutions/${institutionId}/cost-centers`);
        renderCostCenterList(costCenters || [], institutionId);
    } catch (e) {
        document.getElementById('list-centrosCusto').innerHTML =
            '<p class="text-center py-10 text-slate-300 text-xs font-bold uppercase">Erro ao carregar</p>';
    }
}

function renderDirectorateList(items, institutionId) {
    const container = document.getElementById('list-diretorias');
    if (!container) return;
    if (items.length === 0) {
        container.innerHTML = '<p class="text-center py-10 text-slate-300 text-xs font-bold uppercase">Nenhuma diretoria cadastrada</p>';
        return;
    }
    container.innerHTML = items.map(item => `
        <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl group hover:bg-slate-100 dark:hover:bg-slate-700/30 transition-all">
            <span class="text-xs font-bold text-slate-700 dark:text-slate-300">${item.nome}</span>
        </div>
    `).join('');
}

function renderAreaList(areas, directorates) {
    const container = document.getElementById('list-areas');
    if (!container) return;
    if (areas.length === 0) {
        container.innerHTML = '<p class="text-center py-10 text-slate-300 text-xs font-bold uppercase">Nenhuma área cadastrada</p>';
        return;
    }
    container.innerHTML = areas.map(area => {
        const dir = directorates.find(d => d.id === area.directorateId);
        return `
        <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl group hover:bg-slate-100 dark:hover:bg-slate-700/30 transition-all">
            <div>
                <span class="text-xs font-bold text-slate-700 dark:text-slate-300">${area.nome}</span>
                ${dir ? `<p class="text-[9px] text-slate-400 mt-0.5">${dir.nome}</p>` : ''}
            </div>
            <button onclick="deleteArea('${area.id}')"
                class="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                <span class="material-symbols-outlined text-lg">delete</span>
            </button>
        </div>`;
    }).join('');
}

async function deleteArea(id) {
    if (!confirm('Excluir esta área?')) return;
    try {
        await apiFetch(`/organization/areas/${id}`, { method: 'DELETE' });
        renderEstrutura();
        showToast('Área excluída.');
    } catch (e) {
        showToast('Erro ao excluir área. Verifique se não há escopos vinculados.');
    }
}

function renderOrgList(key, items, empId) {
    const container = document.getElementById('list-' + key);
    if (!container) return;
    if (items.length === 0) {
        container.innerHTML = '<p class="text-center py-10 text-slate-300 text-xs font-bold uppercase">Nenhum item cadastrado</p>';
        return;
    }
    container.innerHTML = items.map(item => `
        <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl group hover:bg-slate-100 dark:hover:bg-slate-700/30 transition-all">
            <span class="text-xs font-bold text-slate-700 dark:text-slate-300">${item}</span>
            <button onclick="deleteOrgItem('${empId}','${key}','${item}')"
                class="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                <span class="material-symbols-outlined text-lg">delete</span>
            </button>
        </div>
    `).join('');
}

function renderCostCenterList(items, institutionId) {
    const container = document.getElementById('list-centrosCusto');
    if (!container) return;
    if (items.length === 0) {
        container.innerHTML = '<p class="text-center py-10 text-slate-300 text-xs font-bold uppercase">Nenhum centro de custo cadastrado</p>';
        return;
    }
    container.innerHTML = items.map(item => `
        <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl group hover:bg-slate-100 dark:hover:bg-slate-700/30 transition-all">
            <span class="text-xs font-bold text-slate-700 dark:text-slate-300">${item.nome}${item.codigo ? ' (' + item.codigo + ')' : ''}</span>
            <button onclick="deleteCostCenter('${item.id}', '${institutionId}')"
                class="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                <span class="material-symbols-outlined text-lg">delete</span>
            </button>
        </div>
    `).join('');
}

async function addOrgItem(type) {
    const institutionId = document.getElementById('estrutura-empresa-select')?.value;
    if (!institutionId) { alert('Selecione uma empresa primeiro.'); return; }

    if (type === 'centroCusto') {
        const input = document.getElementById('new-centroCusto');
        if (!input) return;
        const name = input.value.trim();
        if (!name) return;
        try {
            await apiFetch('/organization/cost-centers', {
                method: 'POST',
                body: JSON.stringify({ nome: name, codigo: '', institutionId })
            });
            input.value = '';
            renderEstrutura();
            showToast('Centro de custo adicionado!');
        } catch (e) {
            showToast('Erro ao adicionar centro de custo.');
        }
        return;
    }

    if (type === 'diretoria') {
        const input = document.getElementById('new-diretoria');
        if (!input) return;
        const name = input.value.trim();
        if (!name) return;
        try {
            await apiFetch('/organization/directorates', {
                method: 'POST',
                body: JSON.stringify({ nome: name, institutionId })
            });
            input.value = '';
            renderEstrutura();
            showToast('Diretoria adicionada!');
        } catch (e) {
            showToast('Erro ao adicionar diretoria.');
        }
        return;
    }

    // Areas via API (require directorate selection)
    const input = document.getElementById('new-area');
    const dirSelect = document.getElementById('new-area-diretoria');
    if (!input) return;
    const name = input.value.trim();
    const directorateId = dirSelect?.value;
    if (!name) return;
    if (!directorateId) { alert('Selecione a Diretoria da área.'); return; }
    try {
        await apiFetch('/organization/areas', {
            method: 'POST',
            body: JSON.stringify({ nome: name, directorateId })
        });
        input.value = '';
        if (dirSelect) dirSelect.value = '';
        renderEstrutura();
        showToast('Área adicionada!');
    } catch (e) {
        showToast('Erro ao adicionar área.');
    }
}

async function deleteCostCenter(id, institutionId) {
    if (!confirm('Excluir este centro de custo?')) return;
    try {
        await apiFetch(`/organization/cost-centers/${id}`, { method: 'DELETE' });
        renderEstrutura();
        showToast('Centro de custo excluído.');
    } catch (e) {
        showToast('Erro ao excluir. Verifique se não está vinculado a algum escopo.');
    }
}

function deleteOrgItem(empId, key, name) {
    if (estrutura[empId] && estrutura[empId][key]) {
        estrutura[empId][key] = estrutura[empId][key].filter(i => i !== name);
        localStorage.setItem('nomos_estrutura', JSON.stringify(estrutura));
        renderEstrutura();
    }
}

// ====================== USUÁRIOS ======================
const roleLabels = { ADMIN: 'Master', CONTROLLER: 'Controller', USER: 'Visualizador' };
const roleColors = {
    ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    CONTROLLER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    USER: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
};

async function loadUsers() {
    if (!currentUser.institutionId) return;
    try {
        users = await apiFetch(`/users?institutionId=${currentUser.institutionId}&all=true`) || [];
        renderUsers();
    } catch (e) {
        console.error('Erro ao carregar usuários:', e);
    }
}

function renderUsers() {
    const tbody = document.getElementById('usuarios-tbody');
    const empty = document.getElementById('usuarios-empty');
    if (!tbody || !empty) return;
    if (users.length === 0) {
        tbody.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }
    empty.classList.add('hidden');
    tbody.innerHTML = users.map(u => {
        const instName = institutions.find(i => i.id === u.institutionId)?.nome || '—';
        const initials = u.nome.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
        const roleLabel = roleLabels[u.role] || u.role;
        const roleColor = roleColors[u.role] || roleColors.USER;
        const isInativo = u.status === 'INATIVO';
        return `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${isInativo ? 'opacity-50' : ''}">
            <td class="px-8 py-5">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">${initials}</div>
                    <div>
                        <p class="text-sm font-bold text-slate-900 dark:text-white">${u.nome} ${isInativo ? '<span class="text-[9px] text-slate-400 font-normal">(inativo)</span>' : ''}</p>
                        <p class="text-[10px] text-slate-400">${u.email}</p>
                    </div>
                </div>
            </td>
            <td class="px-8 py-5 text-xs font-bold text-blue-600 dark:text-blue-400">${instName}</td>
            <td class="px-8 py-5">
                <p class="text-xs font-bold text-slate-800 dark:text-slate-200">${u.cargo || '—'}</p>
            </td>
            <td class="px-8 py-5">
                <span class="text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg ${roleColor}">${roleLabel}</span>
            </td>
            <td class="px-8 py-5 text-right">
                <button onclick="editUser('${u.id}')" class="text-primary text-xs font-bold hover:underline">Editar</button>
                ${!isInativo ? `<button onclick="deleteUser('${u.id}')" class="text-red-400 text-xs font-bold hover:underline ml-3">Desativar</button>` : ''}
            </td>
        </tr>`;
    }).join('');
}

function openUserModal(user) {
    document.getElementById('usr-name').value = user ? user.nome : '';
    document.getElementById('usr-email').value = user ? user.email : '';
    document.getElementById('usr-empresaId').value = user ? (user.institutionId || '') : '';
    document.getElementById('usr-position').value = user ? (user.cargo || '') : '';
    document.getElementById('usr-role').value = user ? user.role : 'USER';
    document.getElementById('usr-id').value = user ? user.id : '';
    const titleEl = document.getElementById('modal-user-title');
    if (titleEl) titleEl.textContent = user ? 'Editar Usuário' : 'Cadastro de Usuário';
    // Show/hide password hint
    const pwHint = document.getElementById('usr-senha-hint');
    if (pwHint) pwHint.classList.toggle('hidden', !!user);
    const modal = document.getElementById('modal-usuario');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    }
}

function closeUserModal() {
    const modal = document.getElementById('modal-usuario');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.add('hidden');
    }
}

function loadUserOrgOptions() {
    // No-op: directorate/area in user modal removed (not stored in User entity)
}

function editUser(id) {
    const user = users.find(u => u.id === id);
    if (user) openUserModal(user);
}

async function deleteUser(id) {
    if (!confirm('Desativar este usuário? Ele perderá acesso ao sistema.')) return;
    try {
        await apiFetch(`/users/${id}`, { method: 'DELETE' });
        await loadUsers();
        showToast('Usuário desativado.');
    } catch (e) {
        showToast('Erro ao desativar usuário.');
    }
}

async function saveUser() {
    const nome = document.getElementById('usr-name')?.value.trim();
    const email = document.getElementById('usr-email')?.value.trim();
    const institutionId = document.getElementById('usr-empresaId')?.value || currentUser.institutionId;
    const role = document.getElementById('usr-role')?.value;
    const cargo = document.getElementById('usr-position')?.value.trim();
    const id = document.getElementById('usr-id')?.value;

    if (!nome || !email) { alert('Preencha Nome e E-mail.'); return; }

    try {
        if (id) {
            await apiFetch(`/users/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ nome, email, role, cargo, status: 'ATIVO' })
            });
            showToast('Usuário atualizado!');
        } else {
            await apiFetch('/users', {
                method: 'POST',
                body: JSON.stringify({ nome, email, role, cargo, institutionId })
            });
            showToast('Usuário criado! Senha padrão: Nomos@2024');
        }
        closeUserModal();
        await loadUsers();
    } catch (e) {
        const msg = e.message || '';
        showToast(msg.includes('E-mail já cadastrado') ? 'E-mail já cadastrado.' : 'Erro ao salvar usuário.');
        console.error(e);
    }
}

async function init() {
    await loadInstitutions();
    renderEmpresas();
    await loadUsers();
    renderEstrutura();
}

document.addEventListener('nomos:sessionReady', init);
