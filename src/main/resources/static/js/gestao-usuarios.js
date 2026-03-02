/**
 * Nomos - User and Company Management Logic
 * Handles rendering tables, modals, and organizational structure.
 */

let empresas = JSON.parse(localStorage.getItem('nomos_empresas') || '[]');
let users = JSON.parse(localStorage.getItem('nomos_users') || '[]');
let estrutura = JSON.parse(localStorage.getItem('nomos_estrutura') || '{}');

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
    if (empresas.length === 0) {
        tbody.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }
    empty.classList.add('hidden');
    tbody.innerHTML = empresas.map(emp => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
            <td class="px-8 py-5">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                        <span class="material-symbols-outlined text-primary text-lg">business</span>
                    </div>
                    <span class="font-bold text-slate-900 dark:text-white text-sm">${emp.nome}</span>
                </div>
            </td>
            <td class="px-8 py-5 text-slate-500 font-mono text-xs">${emp.cnpj}</td>
            <td class="px-8 py-5 text-slate-400 text-xs">${emp.createdAt}</td>
            <td class="px-8 py-5 text-right">
                <button onclick="editEmpresa('${emp.id}')" class="text-primary text-xs font-bold hover:underline">Editar</button>
                <button onclick="deleteEmpresa('${emp.id}')" class="text-red-400 text-xs font-bold hover:underline ml-3">Excluir</button>
            </td>
        </tr>
    `).join('');
}

function openEmpresaModal(emp) {
    document.getElementById('emp-nome').value = emp ? emp.nome : '';
    document.getElementById('emp-cnpj').value = emp ? emp.cnpj : '';
    document.getElementById('emp-id').value = emp ? emp.id : '';
    const titleEl = document.getElementById('modal-empresa-title');
    if (titleEl) titleEl.textContent = emp ? 'Editar Empresa' : 'Cadastrar Empresa';
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
    const emp = empresas.find(e => e.id === id);
    if (emp) openEmpresaModal(emp);
}

function deleteEmpresa(id) {
    if (!confirm('Deseja realmente excluir esta empresa?')) return;
    empresas = empresas.filter(e => e.id !== id);
    localStorage.setItem('nomos_empresas', JSON.stringify(empresas));
    renderEmpresas();
    populateEmpresaSelects();
    showToast('Empresa excluída.');
}

function saveEmpresa() {
    const nome = document.getElementById('emp-nome')?.value.trim();
    const cnpj = document.getElementById('emp-cnpj')?.value.trim();
    const id = document.getElementById('emp-id')?.value;
    if (!nome || !cnpj) { alert('Preencha Nome e CNPJ.'); return; }

    if (id) {
        empresas = empresas.map(e => e.id === id ? { ...e, nome, cnpj } : e);
    } else {
        empresas.push({
            id: Date.now().toString(),
            nome, cnpj,
            createdAt: new Date().toLocaleDateString('pt-BR')
        });
    }
    localStorage.setItem('nomos_empresas', JSON.stringify(empresas));
    closeEmpresaModal();
    renderEmpresas();
    populateEmpresaSelects();
    showToast(id ? 'Empresa atualizada!' : 'Empresa cadastrada!');
}

// ====================== ESTRUTURA ORGANIZACIONAL ======================
function populateEmpresaSelects() {
    const opts = '<option value="">Escolher Empresa...</option>' +
        empresas.map(e => `<option value="${e.id}">${e.nome}</option>`).join('');
    const estSelect = document.getElementById('estrutura-empresa-select');
    if (estSelect) estSelect.innerHTML = opts;
    const usrSelect = document.getElementById('usr-empresaId');
    if (usrSelect) usrSelect.innerHTML = opts;
}

async function renderEstrutura() {
    const empId = document.getElementById('estrutura-empresa-select')?.value;
    if (!empId) {
        ['diretorias', 'areas', 'centrosCusto'].forEach(key => {
            const listEl = document.getElementById('list-' + key);
            if (listEl) {
                listEl.innerHTML = '<p class="text-center py-10 text-slate-300 text-xs font-bold uppercase tracking-widest">Selecione uma empresa</p>';
            }
        });
        return;
    }
    const org = estrutura[empId] || { diretorias: [], areas: [], centrosCusto: [] };
    renderOrgList('diretorias', org.diretorias, empId);
    renderOrgList('areas', org.areas, empId);

    // Cost centers from API if institutionId available
    if (typeof apiFetch === 'function' && currentUser && currentUser.institutionId) {
        try {
            const apiCostCenters = await apiFetch(`/organization/institutions/${currentUser.institutionId}/cost-centers`);
            renderCostCenterList(apiCostCenters || []);
        } catch (e) {
            renderOrgList('centrosCusto', org.centrosCusto, empId);
        }
    } else {
        renderOrgList('centrosCusto', org.centrosCusto, empId);
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

function renderCostCenterList(items) {
    const container = document.getElementById('list-centrosCusto');
    if (!container) return;
    if (items.length === 0) {
        container.innerHTML = '<p class="text-center py-10 text-slate-300 text-xs font-bold uppercase">Nenhum item cadastrado</p>';
        return;
    }
    container.innerHTML = items.map(item => `
        <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl group hover:bg-slate-100 dark:hover:bg-slate-700/30 transition-all">
            <span class="text-xs font-bold text-slate-700 dark:text-slate-300">${item.nome}${item.codigo ? ' (' + item.codigo + ')' : ''}</span>
        </div>
    `).join('');
}

async function addOrgItem(type) {
    const empId = document.getElementById('estrutura-empresa-select')?.value;
    if (!empId) { alert('Selecione uma empresa primeiro.'); return; }

    // Cost centers use API
    if (type === 'centroCusto') {
        const input = document.getElementById('new-centroCusto');
        if (!input) return;
        const name = input.value.trim();
        if (!name) return;
        if (typeof apiFetch === 'function' && currentUser && currentUser.institutionId) {
            try {
                await apiFetch('/organization/cost-centers', {
                    method: 'POST',
                    body: JSON.stringify({ nome: name, codigo: '', institutionId: currentUser.institutionId })
                });
                input.value = '';
                renderEstrutura();
                showToast('Centro de custo adicionado!');
            } catch (e) {
                showToast('Erro ao adicionar centro de custo.');
            }
        }
        return;
    }

    const key = type === 'diretoria' ? 'diretorias' : type === 'area' ? 'areas' : 'centrosCusto';
    const input = document.getElementById('new-' + type);
    if (!input) return;
    const name = input.value.trim();
    if (!name) return;

    if (!estrutura[empId]) estrutura[empId] = { diretorias: [], areas: [], centrosCusto: [] };
    if (estrutura[empId][key].includes(name)) { alert('Este item já existe.'); return; }

    estrutura[empId][key].push(name);
    localStorage.setItem('nomos_estrutura', JSON.stringify(estrutura));
    input.value = '';
    renderEstrutura();
    showToast('Item adicionado!');
}

function deleteOrgItem(empId, key, name) {
    if (estrutura[empId] && estrutura[empId][key]) {
        estrutura[empId][key] = estrutura[empId][key].filter(i => i !== name);
        localStorage.setItem('nomos_estrutura', JSON.stringify(estrutura));
        renderEstrutura();
    }
}

// ====================== USUÁRIOS ======================
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
        const empName = empresas.find(e => e.id === u.empresaId)?.nome || 'Empresa Removida';
        const initials = u.name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
        const roleColor = u.role === 'Master' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
            u.role === 'Controller' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
        return `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
            <td class="px-8 py-5">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">${initials}</div>
                    <div>
                        <p class="text-sm font-bold text-slate-900 dark:text-white">${u.name}</p>
                        <p class="text-[10px] text-slate-400">${u.email}</p>
                    </div>
                </div>
            </td>
            <td class="px-8 py-5 text-xs font-bold text-blue-600 dark:text-blue-400">${empName}</td>
            <td class="px-8 py-5">
                <p class="text-xs font-bold text-slate-800 dark:text-slate-200">${u.position || '-'}</p>
                <p class="text-[10px] text-slate-400 uppercase">${u.diretoria || ''}${u.area ? ' > ' + u.area : ''}</p>
            </td>
            <td class="px-8 py-5">
                <span class="text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg ${roleColor}">${u.role}</span>
            </td>
            <td class="px-8 py-5 text-right">
                <button onclick="editUser('${u.id}')" class="text-primary text-xs font-bold hover:underline">Editar</button>
                <button onclick="deleteUser('${u.id}')" class="text-red-400 text-xs font-bold hover:underline ml-3">Excluir</button>
            </td>
        </tr>`;
    }).join('');
}

function openUserModal(user) {
    document.getElementById('usr-name').value = user ? user.name : '';
    document.getElementById('usr-email').value = user ? user.email : '';
    document.getElementById('usr-empresaId').value = user ? user.empresaId : '';
    document.getElementById('usr-position').value = user ? user.position || '' : '';
    document.getElementById('usr-role').value = user ? user.role : 'Visualizador';
    document.getElementById('usr-id').value = user ? user.id : '';
    const titleEl = document.getElementById('modal-user-title');
    if (titleEl) titleEl.textContent = user ? 'Editar Usuário' : 'Cadastro de Usuário';
    loadUserOrgOptions();
    if (user) {
        setTimeout(() => {
            const dirEl = document.getElementById('usr-diretoria');
            if (dirEl) dirEl.value = user.diretoria || '';
            const areaEl = document.getElementById('usr-area');
            if (areaEl) areaEl.value = user.area || '';
        }, 50);
    }
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
    const empId = document.getElementById('usr-empresaId')?.value;
    const org = empId ? (estrutura[empId] || { diretorias: [], areas: [] }) : { diretorias: [], areas: [] };
    const dirEl = document.getElementById('usr-diretoria');
    if (dirEl) {
        dirEl.innerHTML = '<option value="">Escolher...</option>' + (org.diretorias || []).map(d => `<option value="${d}">${d}</option>`).join('');
    }
    const areaEl = document.getElementById('usr-area');
    if (areaEl) {
        areaEl.innerHTML = '<option value="">Escolher...</option>' + (org.areas || []).map(a => `<option value="${a}">${a}</option>`).join('');
    }
}

function editUser(id) {
    const user = users.find(u => u.id === id);
    if (user) openUserModal(user);
}

function deleteUser(id) {
    if (!confirm('Deseja realmente excluir este usuário?')) return;
    users = users.filter(u => u.id !== id);
    localStorage.setItem('nomos_users', JSON.stringify(users));
    renderUsers();
    showToast('Usuário excluído.');
}

function saveUser() {
    const name = document.getElementById('usr-name')?.value.trim();
    const email = document.getElementById('usr-email')?.value.trim();
    const empresaId = document.getElementById('usr-empresaId')?.value;
    const role = document.getElementById('usr-role')?.value;
    const position = document.getElementById('usr-position')?.value.trim();
    const diretoria = document.getElementById('usr-diretoria')?.value;
    const area = document.getElementById('usr-area')?.value;
    const id = document.getElementById('usr-id')?.value;

    if (!name || !email || !empresaId) {
        alert('Preencha Nome, E-mail e selecione a Empresa.');
        return;
    }

    const newUser = { id: id || Date.now().toString(), name, email, role, position, diretoria, area, empresaId };

    if (id) {
        users = users.map(u => u.id === id ? newUser : u);
    } else {
        users.push(newUser);
    }
    localStorage.setItem('nomos_users', JSON.stringify(users));
    closeUserModal();
    renderUsers();
    showToast(id ? 'Usuário atualizado!' : 'Usuário cadastrado!');
}

function init() {
    renderEmpresas();
    renderUsers();
    populateEmpresaSelects();
    renderEstrutura();
}

document.addEventListener('DOMContentLoaded', init);
