const DB_KEY = 'barberbot_usuarios';
const CFG_KEY = 'barberbot_config';
const app = document.getElementById('app');

let usuarioLogado = null;
let usuarioSelecionado = null;

const BOTOES_MENU = [
    { id: 'produto', label: 'Produto' },
    { id: 'vendas', label: 'Vendas' },
    { id: 'estoque', label: 'Estoque' },
    { id: 'ordem', label: 'Ordem de Chegada' },
    { id: 'config', label: 'Configurações' }
];

const getUsuarios = () => JSON.parse(localStorage.getItem(DB_KEY)) || [];
const saveUsuarios = (usuarios) => localStorage.setItem(DB_KEY, JSON.stringify(usuarios));
const getConfig = () => JSON.parse(localStorage.getItem(CFG_KEY)) || { controlaOrdem: false };
const saveConfig = (cfg) => localStorage.setItem(CFG_KEY, JSON.stringify(cfg));

function navegar(tela, params = null) {
    usuarioSelecionado = null;
    if (tela === 'Login') renderLogin();
    if (tela === 'AdicionaUsuario') renderAdicionaUsuario(params);
    if (tela === 'BarberBotPro') renderBarberBotPro();
    if (tela === 'Configuracoes') renderConfiguracoes(params);
}

// --- TELA LOGIN ---
function renderLogin() {
    usuarioLogado = null;
    app.innerHTML = `
        <div class="view-centered">
            <div class="container">
                <div class="logo-container">
                    <i class="fas fa-scissors"></i>
                    <span class="logo-text">BARBERBOT <b>PRO</b></span>
                </div>
                <div id="loginError" style="color:var(--danger); display:none; text-align:center; margin-bottom:10px; font-size:0.8rem;">Credenciais incorretas ou usuário inativo.</div>
                <div class="form-group"><label>Usuário</label><input type="text" id="l_user"></div>
                <div class="form-group"><label>Senha</label><input type="password" id="l_pass"></div>
                <button class="btn-primary" style="width:100%" onclick="executarLogin()">ENTRAR</button>
                <button class="nav-btn" style="width:100%; margin-top:10px; color:var(--text-dim)" onclick="navegar('AdicionaUsuario')">Esqueci minha senha</button>
                <hr style="border:0; border-top:1px solid var(--border); margin:1.5rem 0;">
                <button class="btn-outline" style="width:100%" onclick="navegar('AdicionaUsuario')">PRIMEIRO ACESSO</button>
            </div>
            <div class="dev-footer">Desenvolvido por 9DEV</div>
        </div>
    `;

    [document.getElementById('l_user'), document.getElementById('l_pass')].forEach(input => {
        input.addEventListener('keypress', (e) => { if (e.key === 'Enter') executarLogin(); });
    });
}

function executarLogin() {
    const u = document.getElementById('l_user').value;
    const p = document.getElementById('l_pass').value;
    const user = getUsuarios().find(x => x.usuario === u && x.senha === p && x.ativo);
    if (user) {
        usuarioLogado = user;
        navegar('BarberBotPro');
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
}

// --- TELA PRINCIPAL ---
function renderBarberBotPro() {
    const cfg = getConfig();
    const perms = usuarioLogado.permissoes || [];
    const deveMostrar = (id) => (id === 'ordem' && !cfg.controlaOrdem) ? false : perms.includes(id);

    app.innerHTML = `
        <header class="main-header">
            <div class="logo-area">
                <i class="fas fa-scissors"></i>
                <span style="letter-spacing:1px">BARBERBOT <b>PRO</b></span>
            </div>
            <nav class="nav-menu">
                ${deveMostrar('produto') ? `<button class="nav-btn">Produto</button>` : ''}
                ${deveMostrar('vendas') ? `<button class="nav-btn">Vendas</button>` : ''}
                ${deveMostrar('estoque') ? `<button class="nav-btn">Estoque</button>` : ''}
                ${deveMostrar('ordem') ? `<button class="nav-btn">Ordem de Chegada</button>` : ''}
                ${deveMostrar('config') ? `<button class="nav-btn" onclick="navegar('Configuracoes')">Configurações</button>` : ''}
            </nav>
            <div class="user-info">
                <span style="font-size:0.7rem; color:var(--primary); margin-right:8px; border:1px solid; padding:2px 5px; border-radius:4px">${usuarioLogado.tipo.toUpperCase()}</span>
                <span>Olá, <strong>${usuarioLogado.nomeCompleto.split(' ')[0]}</strong></span>
                <button onclick="navegar('Login')" style="background:none; color:var(--danger); border:none; cursor:pointer"><i class="fas fa-power-off"></i></button>
            </div>
        </header>
        <main style="padding: 4rem; text-align: center;">
            <h1 style="color: var(--primary); font-size: 2.5rem;">Dashboard</h1>
        </main>
    `;
}

// --- CONFIGURAÇÕES ---
function renderConfiguracoes(aba = 'gerais', sub = 'gerais') {
    const isAdmin = usuarioLogado.tipo === 'Administrador';

    app.innerHTML = `
        <header class="main-header">
            <div class="logo-area" onclick="navegar('BarberBotPro')" style="cursor:pointer">
                <i class="fas fa-scissors"></i> <span>BARBERBOT <b>PRO</b></span>
            </div>
            <button class="btn-outline" style="width:auto" onclick="navegar('BarberBotPro')">Voltar</button>
        </header>
        <div class="container wide">
            <h2>Configurações</h2>
            <div class="tabs-container">
                <button class="tab-btn ${aba === 'gerais' ? 'active' : ''}" onclick="renderConfiguracoes('gerais', 'gerais')">Gerais</button>
                <button class="tab-btn ${aba === 'usuarios' ? 'active' : ''}" onclick="renderConfiguracoes('usuarios', 'cadastros')">Usuários</button>
                <button class="tab-btn ${aba === 'backup' ? 'active' : ''}" onclick="renderConfiguracoes('backup')">Backup</button>
            </div>
            
            <div id="configContent">
                ${aba === 'gerais' ? `
                    <div class="sub-tabs"><button class="sub-tab-btn active">Gerais</button></div>
                    ${renderConfigGeralUI()}
                ` : ''}

                ${aba === 'usuarios' ? `
                    <div class="sub-tabs">
                        <button class="sub-tab-btn ${sub === 'cadastros' ? 'active' : ''}" onclick="renderConfiguracoes('usuarios', 'cadastros')">Cadastros</button>
                        ${isAdmin ? `<button class="sub-tab-btn ${sub === 'perfis' ? 'active' : ''}" onclick="renderConfiguracoes('usuarios', 'perfis')">Perfis</button>` : ''}
                    </div>
                    ${sub === 'cadastros' ? renderTabelaUsuarios() : renderModuloPerfis()}
                ` : ''}
            </div>
        </div>
    `;
    if(aba === 'usuarios' && sub === 'cadastros') atualizarTabela(getUsuarios());
}

function renderConfigGeralUI() {
    const cfg = getConfig();
    return `
        <div style="background:#222; padding:20px; border-radius:8px; border:1px solid var(--border)">
            <h3 style="margin-top:0; font-size:1rem; color:var(--primary)">Preferências</h3>
            <div style="display:flex; align-items:center;">
                <input type="checkbox" id="checkOrdem" style="width:18px; height:18px; accent-color:var(--primary)" 
                    ${cfg.controlaOrdem ? 'checked' : ''} onchange="saveConfig({controlaOrdem: this.checked})">
                <label for="checkOrdem" style="display:inline; text-transform:none; margin:0 0 0 10px; cursor:pointer">Controla ordem de chegada</label>
                <i class="fas fa-info-circle info-icon" title="Quando marcada, habilitará o controle por ordem de chegada."></i>
            </div>
        </div>
    `;
}

function renderTabelaUsuarios() {
    const isAdmin = usuarioLogado.tipo === 'Administrador';
    return `
        <div style="display:flex; justify-content:space-between; margin-bottom:15px">
            <div style="display:flex; gap:10px">
                <button id="btnEdit" class="btn-outline" disabled onclick="tentarEditar()">Editar</button>
                <button id="btnStatus" class="btn-outline" disabled onclick="toggleStatusUser()">Ativar/Desativar</button>
                <button id="btnDelete" class="btn-outline" style="color:var(--danger)" disabled onclick="excluirUser()">Excluir</button>
            </div>
            ${isAdmin ? `<button class="btn-primary" onclick="navegar('AdicionaUsuario')">+ Novo Usuário</button>` : ''}
        </div>
        <table>
            <colgroup><col style="width:30%"><col style="width:25%"><col style="width:20%"><col style="width:15%"><col style="width:10%"></colgroup>
            <thead><tr><th>NOME COMPLETO</th><th>E-MAIL</th><th>USUÁRIO</th><th>TIPO</th><th>STATUS</th></tr></thead>
            <tbody id="listaCorpo"></tbody>
        </table>
    `;
}

function atualizarTabela(lista) {
    const corpo = document.getElementById('listaCorpo');
    if(!corpo) return;
    corpo.innerHTML = lista.map(u => `
        <tr onclick="selecionarUser(${u.id}, this)" style="cursor:pointer" id="row_${u.id}">
            <td>${u.nomeCompleto}</td><td>${u.email}</td><td>@${u.usuario}</td><td>${u.tipo}</td>
            <td style="color:${u.ativo ? 'var(--success)' : 'var(--danger)'}">${u.ativo ? 'Ativo' : 'Inativo'}</td>
        </tr>
    `).join('');
    
    if(usuarioSelecionado) {
        const row = document.getElementById(`row_${usuarioSelecionado.id}`);
        if(row) row.classList.add('selected');
    }
}

function selecionarUser(id, el) {
    const isAdmin = usuarioLogado.tipo === 'Administrador';
    document.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
    el.classList.add('selected');
    usuarioSelecionado = getUsuarios().find(u => u.id == id);
    
    document.getElementById('btnEdit').disabled = false;
    
    // Apenas Admin vê e usa Status/Delete
    const sBtn = document.getElementById('btnStatus');
    const dBtn = document.getElementById('btnDelete');
    
    if(isAdmin) {
        sBtn.style.display = 'inline-block';
        dBtn.style.display = 'inline-block';
        sBtn.disabled = false;
        dBtn.disabled = usuarioSelecionado.ativo; // Não deleta ativos
    } else {
        sBtn.style.display = 'none';
        dBtn.style.display = 'none';
    }
}

function toggleStatusUser() {
    if(!usuarioSelecionado) return;
    const lista = getUsuarios();
    const novaLista = lista.map(u => {
        if(u.id === usuarioSelecionado.id) {
            u.ativo = !u.ativo;
            usuarioSelecionado = {...u}; // Atualiza o objeto global
        }
        return u;
    });
    saveUsuarios(novaLista);
    
    // Re-renderiza a tabela e atualiza os botões
    atualizarTabela(novaLista);
    document.getElementById('btnDelete').disabled = usuarioSelecionado.ativo;
}

function tentarEditar() {
    if(usuarioLogado.tipo === 'Normal' && usuarioSelecionado.tipo === 'Administrador') {
        alert("Erro hierárquico: Um usuário Normal não pode alterar dados de um Administrador.");
        return;
    }
    navegar('AdicionaUsuario', usuarioSelecionado.id);
}

function renderModuloPerfis() {
    const usuarios = getUsuarios();
    return `
        <div class="perfis-grid">
            <div style="border-right:1px solid var(--border); padding-right:20px">
                <h4 style="margin-top:0">Selecione o Usuário</h4>
                <div style="display:flex; flex-direction:column; gap:8px">
                    ${usuarios.map(u => `
                        <button class="btn-outline" style="text-align:left; padding:12px; font-size:0.8rem; border-color:${usuarioSelecionado?.id === u.id ? 'var(--primary)' : 'var(--border)'}" onclick="carregarPerfilUser(${u.id})">
                            ${u.nomeCompleto} <br>
                            <small style="color:${u.tipo === 'Administrador' ? 'var(--primary)' : 'var(--text-dim)'}; text-transform:uppercase; font-size:0.65rem; font-weight:700">
                                ${u.tipo} • @${u.usuario}
                            </small>
                        </button>
                    `).join('')}
                </div>
            </div>
            <div id="permEditor"><p style="color:var(--text-dim); text-align:center; padding-top:50px">Escolha um usuário para gerenciar acessos.</p></div>
        </div>
    `;
}

function carregarPerfilUser(id) {
    const user = getUsuarios().find(u => u.id == id);
    usuarioSelecionado = user;
    const perms = user.permissoes || [];
    
    document.querySelectorAll('.perfis-grid .btn-outline').forEach(btn => btn.style.borderColor = 'var(--border)');
    
    document.getElementById('permEditor').innerHTML = `
        <div class="permissions-card">
            <h3 style="margin-top:0; color:var(--primary); font-size:1.1rem">Acessos: ${user.nomeCompleto}</h3>
            <p style="font-size:0.75rem; color:var(--text-dim); margin-bottom:20px">Os botões marcados abaixo ficarão visíveis para este usuário.</p>
            <form id="formPerms" onsubmit="salvarPerfil(event, ${user.id})">
                <div class="perm-list">
                    ${BOTOES_MENU.map(btn => `
                        <div class="perm-item">
                            <input type="checkbox" id="p_${btn.id}" value="${btn.id}" ${perms.includes(btn.id) ? 'checked' : ''}>
                            <label for="p_${btn.id}">${btn.label}</label>
                        </div>
                    `).join('')}
                </div>
                <button type="submit" class="btn-primary" style="padding:12px 30px; font-size:0.85rem">GRAVAR ACESSOS</button>
            </form>
        </div>
    `;
}

function salvarPerfil(e, userId) {
    e.preventDefault();
    const userTarget = getUsuarios().find(u => u.id === userId);
    if(usuarioLogado.tipo === 'Normal' && userTarget.tipo === 'Administrador') {
        alert("Ação negada: Usuários normais não podem alterar perfis de administradores.");
        return;
    }
    const selecionados = Array.from(document.querySelectorAll('#formPerms input:checked')).map(i => i.value);
    const list = getUsuarios().map(u => u.id === userId ? {...u, permissoes: selecionados} : u);
    saveUsuarios(list);
    if(usuarioLogado.id === userId) usuarioLogado.permissoes = selecionados;
    alert("Permissões atualizadas!");
    renderConfiguracoes('usuarios', 'perfis');
}

function renderAdicionaUsuario(id = null) {
    const userEdit = id ? getUsuarios().find(u => u.id == id) : null;
    const isEditing = !!userEdit;
    const isRecoveryMode = !usuarioLogado;

    app.innerHTML = `
        <div class="view-centered">
            <div class="container" style="max-width:550px">
                <h2>${isEditing ? 'EDITAR' : 'NOVO'} USUÁRIO</h2>
                <form onsubmit="salvarUser(event)">
                    <input type="hidden" id="userId" value="${isEditing ? userEdit.id : ''}">
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px">
                        <div class="form-group"><label>Nome Completo</label><input type="text" id="nome" value="${userEdit?.nomeCompleto || ''}" required></div>
                        <div class="form-group"><label>E-mail</label><input type="email" id="email" value="${userEdit?.email || ''}" required></div>
                        <div class="form-group"><label>Usuário</label><input type="text" id="user" value="${userEdit?.usuario || ''}" required></div>
                        <div class="form-group">
                            <label>Tipo</label>
                            <select id="tipo" ${isRecoveryMode || (isEditing && usuarioLogado.tipo === 'Normal') ? 'disabled' : ''}>
                                <option value="Normal" ${userEdit?.tipo === 'Normal' ? 'selected' : ''}>Normal</option>
                                <option value="Administrador" ${userEdit?.tipo === 'Administrador' ? 'selected' : ''}>Administrador</option>
                            </select>
                        </div>
                        <div class="form-group"><label>Senha</label><input type="password" id="pass" required></div>
                        <div class="form-group"><label>Confirmação</label><input type="password" id="passC" required></div>
                    </div>
                    <button type="submit" class="btn-primary" style="width:100%; margin-top:10px">GRAVAR</button>
                    <button type="button" class="btn-outline" style="width:100%; margin-top:10px" 
                        onclick="${usuarioLogado ? "navegar('Configuracoes', 'usuarios', 'cadastros')" : "navegar('Login')" }">
                        CANCELAR
                    </button>
                </form>
            </div>
        </div>
    `;
}

function salvarUser(e) {
    e.preventDefault();
    if(document.getElementById('pass').value !== document.getElementById('passC').value) return alert("Senhas não conferem!");
    const id = document.getElementById('userId').value;
    const list = getUsuarios();
    const userTarget = id ? list.find(u => u.id == id) : null;

    if(usuarioLogado && usuarioLogado.tipo === 'Normal' && userTarget?.tipo === 'Administrador') {
        alert("Erro de permissão: Você não pode alterar dados de um administrador.");
        return;
    }

    const dados = {
        id: userTarget ? userTarget.id : Date.now(),
        nomeCompleto: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        usuario: document.getElementById('user').value,
        tipo: document.getElementById('tipo').value,
        senha: document.getElementById('pass').value,
        permissoes: userTarget ? userTarget.permissoes : (document.getElementById('tipo').value === 'Administrador' ? BOTOES_MENU.map(b => b.id) : []),
        ativo: userTarget ? userTarget.ativo : true
    };
    
    saveUsuarios(userTarget ? list.map(u => u.id == userTarget.id ? dados : u) : [...list, dados]);
    alert("Dados salvos!");
    usuarioLogado ? navegar('Configuracoes', 'usuarios', 'cadastros') : navegar('Login');
}

function excluirUser() {
    if(!usuarioSelecionado) return;
    if(confirm('Excluir definitivamente?')) {
        saveUsuarios(getUsuarios().filter(u => u.id != usuarioSelecionado.id));
        usuarioSelecionado = null;
        renderConfiguracoes('usuarios', 'cadastros');
    }
}

navegar('Login');