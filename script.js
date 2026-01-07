const DB_KEY = 'barberbot_usuarios';
const app = document.getElementById('app');

// Estado da Aplicação
let usuarioLogado = null;
let usuarioSelecionado = null;

const getUsuarios = () => JSON.parse(localStorage.getItem(DB_KEY)) || [];
const saveUsuarios = (usuarios) => localStorage.setItem(DB_KEY, JSON.stringify(usuarios));

function navegar(tela, params = null) {
    usuarioSelecionado = null;
    if (tela === 'Login') renderLogin();
    if (tela === 'AdicionaUsuario') renderAdicionaUsuario(params);
    if (tela === 'BarberBotPro') renderBarberBotPro();
    if (tela === 'Configuracoes') renderConfiguracoes(params);
}

// --- TELA LOGIN ---
function renderLogin() {
    app.innerHTML = `
        <div class="view-centered">
            <div class="container">
                <h2 style="text-align: center; letter-spacing: 2px;">BARBERBOT PRO</h2>
                <div id="loginError" style="color:var(--danger); display:none; text-align:center; margin-bottom:10px;">Usuário e/ou senha incorreto(s)</div>
                <div class="form-group"><label>Usuário</label><input type="text" id="l_user"></div>
                <div class="form-group"><label>Senha</label><input type="password" id="l_pass"></div>
                <button class="btn-primary" style="width:100%" onclick="executarLogin()">ENTRAR</button>
                <button class="btn-outline" style="width:100%; margin-top:10px;" onclick="navegar('AdicionaUsuario')">PRIMEIRO ACESSO</button>
            </div>
        </div>
    `;
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
    app.innerHTML = `
        <header class="main-header">
            <div class="logo-area"><i class="fas fa-scissors"></i> <span>BARBERBOT PRO</span></div>
            <div class="nav-menu">
                <button class="btn-outline" style="border:none">Produto</button>
                <button class="btn-outline" style="border:none">Vendas</button>
                <button class="btn-outline" style="border:none">Estoque</button>
                <button class="btn-outline" style="border:none" onclick="navegar('Configuracoes')">Configurações</button>
            </div>
            <div class="user-info">
                <i class="fas fa-user-circle"></i> <span>Olá, <strong>${usuarioLogado.nomeCompleto.split(' ')[0]}</strong></span>
                <button onclick="navegar('Login')" style="background:none; color:var(--danger); margin-left:10px;"><i class="fas fa-power-off"></i></button>
            </div>
        </header>
        <main style="padding: 4rem; text-align: center;">
            <h1 style="color: var(--primary); font-size: 3rem;">BarberBot Pro</h1>
            <p style="color: var(--text-dim)">Gerenciamento premium para sua barbearia.</p>
        </main>
    `;
}

// --- TELA CONFIGURAÇÕES (ABAS) ---
function renderConfiguracoes(abaAtiva = 'gerais', subAbaAtiva = 'usuario') {
    app.innerHTML = `
        <header class="main-header">
            <div class="logo-area" onclick="navegar('BarberBotPro')" style="cursor:pointer">
                <i class="fas fa-scissors"></i> <span>BARBERBOT PRO</span>
            </div>
            <button class="btn-outline" onclick="navegar('BarberBotPro')">Voltar ao Início</button>
        </header>
        
        <div class="container wide">
            <h2>Configurações</h2>
            
            <div class="tabs-container">
                <button class="tab-btn ${abaAtiva === 'gerais' ? 'active' : ''}" onclick="renderConfiguracoes('gerais')">Gerais</button>
                <button class="tab-btn ${abaAtiva === 'backup' ? 'active' : ''}" onclick="renderConfiguracoes('backup')">Backup</button>
            </div>

            <div id="tabContent">
                ${abaAtiva === 'gerais' ? `
                    <div class="sub-tabs">
                        <button class="sub-tab-btn ${subAbaAtiva === 'usuario' ? 'active' : ''}" onclick="renderConfiguracoes('gerais', 'usuario')">Usuário</button>
                        <button class="sub-tab-btn" onclick="alert('Em breve')">Empresa</button>
                    </div>
                    <div id="subTabContent">
                        ${subAbaAtiva === 'usuario' ? renderGestaoUsuariosUI() : ''}
                    </div>
                ` : `<p style="color:var(--text-dim)">Módulo de Backup em desenvolvimento...</p>`}
            </div>
        </div>
    `;
    if(abaAtiva === 'gerais' && subAbaAtiva === 'usuario') atualizarTabela(getUsuarios());
}

// --- GESTÃO DE USUÁRIOS (INTEGRADA) ---
function renderGestaoUsuariosUI() {
    return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <div style="display: flex; gap: 10px;">
                <button id="btnEdit" class="btn-outline" disabled onclick="navegar('AdicionaUsuario', usuarioSelecionado.id)">Editar</button>
                <button id="btnStatus" class="btn-outline" disabled onclick="toggleStatus()">Ativar/Desativar</button>
                <button id="btnDelete" class="btn-outline" style="color:var(--danger)" disabled onclick="excluirUser()">Excluir</button>
            </div>
            <button class="btn-primary" onclick="navegar('AdicionaUsuario')">+ Novo Usuário</button>
        </div>
        <table>
            <thead><tr><th>NOME</th><th>E-MAIL</th><th>USUÁRIO</th><th>STATUS</th></tr></thead>
            <tbody id="listaCorpo"></tbody>
        </table>
    `;
}

function atualizarTabela(lista) {
    const corpo = document.getElementById('listaCorpo');
    if(!corpo) return;
    corpo.innerHTML = lista.map(u => `
        <tr onclick="selecionarUser(${u.id}, this)" style="cursor:pointer">
            <td>${u.nomeCompleto}</td>
            <td style="color:var(--text-dim)">${u.email}</td>
            <td>@${u.usuario}</td>
            <td><span style="color:${u.ativo ? 'var(--success)' : 'var(--danger)'}">${u.ativo ? '● Ativo' : '○ Inativo'}</span></td>
        </tr>
    `).join('');
}

function selecionarUser(id, el) {
    document.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
    el.classList.add('selected');
    usuarioSelecionado = getUsuarios().find(u => u.id == id);
    document.getElementById('btnEdit').disabled = false;
    document.getElementById('btnStatus').disabled = false;
    document.getElementById('btnDelete').disabled = usuarioSelecionado.ativo;
}

function toggleStatus() {
    const list = getUsuarios().map(u => u.id == usuarioSelecionado.id ? {...u, ativo: !u.ativo} : u);
    saveUsuarios(list);
    renderConfiguracoes('gerais', 'usuario');
}

function excluirUser() {
    if(confirm('Excluir permanentemente?')) {
        saveUsuarios(getUsuarios().filter(u => u.id != usuarioSelecionado.id));
        renderConfiguracoes('gerais', 'usuario');
    }
}

// --- TELA ADICIONA USUARIO ---
function renderAdicionaUsuario(id = null) {
    const userEdit = id ? getUsuarios().find(u => u.id == id) : null;
    app.innerHTML = `
        <div class="view-centered">
            <div class="container">
                <h2>${userEdit ? 'EDITAR' : 'NOVO'} USUÁRIO</h2>
                <form onsubmit="salvarUser(event)">
                    <input type="hidden" id="userId" value="${userEdit ? userEdit.id : ''}">
                    <div class="form-group"><label>Nome Completo</label><input type="text" id="nome" value="${userEdit?.nomeCompleto || ''}" required></div>
                    <div class="form-group"><label>E-mail</label><input type="email" id="email" value="${userEdit?.email || ''}" required></div>
                    <div class="form-group"><label>Usuário</label><input type="text" id="user" value="${userEdit?.usuario || ''}" required></div>
                    <div class="form-group"><label>Senha</label><input type="password" id="pass" required></div>
                    <div class="form-group"><label>Confirmar Senha</label><input type="password" id="passC" required></div>
                    <button type="submit" class="btn-primary" style="width:100%">GRAVAR</button>
                    <button type="button" class="btn-outline" style="width:100%; margin-top:10px;" onclick="navegar('Configuracoes')">VOLTAR</button>
                </form>
            </div>
        </div>
    `;
}

function salvarUser(e) {
    e.preventDefault();
    if(document.getElementById('pass').value !== document.getElementById('passC').value) return alert("Senhas não coincidem!");
    const id = document.getElementById('userId').value;
    const novo = {
        id: id ? parseInt(id) : Date.now(),
        nomeCompleto: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        usuario: document.getElementById('user').value,
        senha: document.getElementById('pass').value,
        ativo: true
    };
    let list = getUsuarios();
    list = id ? list.map(u => u.id == id ? novo : u) : [...list, novo];
    saveUsuarios(list);
    navegar('Configuracoes', 'gerais');
}

navegar('Login');