/**
 * BARBERBOT PRO - CÓDIGO FONTE COMPLETO
 * BASE OFICIAL + USUÁRIO MESTRE IMUTÁVEL
 */

const DB_KEY = 'barberbot_usuarios';
const CFG_KEY = 'barberbot_config';
const app = document.getElementById('app');

let usuarioLogado = null;
let usuarioSelecionado = null;

const BOTOES_MENU = [
    { id: 'produto', label: 'Produto', icone: 'fa-box-open' },
    { id: 'vendas', label: 'Vendas', icone: 'fa-receipt' },
    { id: 'estoque', label: 'Estoque', icone: 'fa-boxes-stacked' },
    { id: 'ordem', label: 'Ordem de Chegada', icone: 'fa-clock' },
    { id: 'config', label: 'Configurações', icone: 'fa-gear' }
];

// --- GESTÃO DE USUÁRIOS E SEGURANÇA ---
const getUsuarios = () => {
    let users = JSON.parse(localStorage.getItem(DB_KEY)) || [];
    
    // REGRA MASTER: Garante usuário 'administrador' com senha 'Vdabrasil@1234'
    const adminMaster = users.find(u => u.usuario === 'administrador');
    if (!adminMaster) {
        const master = {
            id: 9999,
            nomeCompleto: 'Administrador Master',
            email: 'admin@barberbot.pro',
            usuario: 'administrador',
            senha: 'Vdabrasil@1234',
            tipo: 'Administrador',
            permissoes: BOTOES_MENU.map(b => b.id),
            ativo: true
        };
        users.push(master);
        localStorage.setItem(DB_KEY, JSON.stringify(users));
    }
    return users;
};

const saveUsuarios = (usuarios) => localStorage.setItem(DB_KEY, JSON.stringify(usuarios));
const getConfig = () => JSON.parse(localStorage.getItem(CFG_KEY)) || { controlaOrdem: false };
const saveConfig = (cfg) => localStorage.setItem(CFG_KEY, JSON.stringify(cfg));

// --- NAVEGAÇÃO ---
function navegar(tela, params = null, subParams = null) {
    usuarioSelecionado = null;
    if (tela === 'Login') renderLogin();
    else if (tela === 'BarberBotPro') renderDashboard();
    else if (tela === 'Configuracoes') renderConfiguracoes(params || 'gerais', subParams || 'gerais');
    else if (tela === 'FormUsuario') renderFormUsuario(params);
}

// --- TELAS ---
function renderLogin() {
    usuarioLogado = null;
    app.innerHTML = `
        <div class="view-centered">
            <div class="container">
                <div class="logo-container">
                    <i class="fas fa-scissors"></i>
                    <div class="logo-text">BARBERBOT <b>PRO</b></div>
                </div>
                <div id="loginError" style="color:var(--danger); display:none; text-align:center; margin-bottom:15px; font-size:0.85rem">Acesso negado. Verifique os dados.</div>
                <div class="form-group"><label>Usuário</label><input type="text" id="l_user" autofocus></div>
                <div class="form-group"><label>Senha</label><input type="password" id="l_pass"></div>
                <button class="btn-primary" onclick="executarLogin()">ENTRAR NO SISTEMA</button>
                <div style="text-align:center; margin-top:20px">
                    <button class="btn-outline" style="width:100%" onclick="navegar('FormUsuario')">PRIMEIRO ACESSO</button>
                </div>
            </div>
            <div style="margin-top:2rem; font-size:0.7rem; color:var(--text-dim); letter-spacing:2px">PRODUZIDO POR 9DEV</div>
        </div>
    `;
    document.getElementById('l_pass').addEventListener('keypress', (e) => { if(e.key === 'Enter') executarLogin(); });
}

function executarLogin() {
    const u = document.getElementById('l_user').value;
    const p = document.getElementById('l_pass').value;
    const users = getUsuarios();
    const user = users.find(x => x.usuario === u && x.senha === p && x.ativo);
    
    if (user) {
        usuarioLogado = user;
        navegar('BarberBotPro');
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
}

function renderHeader() {
    const cfg = getConfig();
    const perms = usuarioLogado.permissoes || [];
    return `
        <header class="main-header">
            <div class="logo-area" onclick="navegar('BarberBotPro')" style="cursor:pointer; color:var(--primary)">
                <i class="fas fa-scissors"></i> <span style="font-weight:800">BARBERBOT PRO</span>
            </div>
            <nav class="navbar-nav">
                ${BOTOES_MENU.filter(b => perms.includes(b.id)).map(b => {
                    if(b.id === 'ordem' && !cfg.controlaOrdem) return '';
                    return `<button class="nav-btn" onclick="navegar('${b.id}')"><i class="fas ${b.icone}"></i> ${b.label}</button>`;
                }).join('')}
                <button class="nav-btn" onclick="navegar('Configuracoes')"><i class="fas fa-gear"></i> Config</button>
            </nav>
            <div style="display:flex; align-items:center; gap:15px">
                <div style="text-align:right">
                    <div style="font-size:0.85rem; font-weight:700">${usuarioLogado.nomeCompleto}</div>
                    <div style="font-size:0.65rem; color:var(--primary); text-transform:uppercase">${usuarioLogado.tipo}</div>
                </div>
                <button onclick="navegar('Login')" style="background:none; color:var(--danger); font-size:1.2rem"><i class="fas fa-power-off"></i></button>
            </div>
        </header>
    `;
}

function renderDashboard() {
    app.innerHTML = `
        ${renderHeader()}
        <main style="padding:4rem 2rem; text-align:center">
            <h1 style="font-size:3rem; font-weight:300">Seja bem-vindo, <b style="color:var(--primary)">${usuarioLogado.nomeCompleto.split(' ')[0]}</b></h1>
            <p style="color:var(--text-dim)">Selecione um módulo no menu superior para gerenciar sua barbearia.</p>
        </main>
    `;
}

// --- CONFIGURAÇÕES E GESTÃO DE USUÁRIOS ---
function renderConfiguracoes(aba, sub) {
    app.innerHTML = `
        ${renderHeader()}
        <div class="container wide">
            <h2>Configurações do Sistema</h2>
            <div class="tabs-container">
                <button class="tab-btn ${aba === 'gerais' ? 'active' : ''}" onclick="navegar('Configuracoes', 'gerais')">Gerais</button>
                <button class="tab-btn ${aba === 'usuarios' ? 'active' : ''}" onclick="navegar('Configuracoes', 'usuarios', 'cadastros')">Usuários</button>
            </div>
            <div id="configBody">
                ${aba === 'gerais' ? renderAbaGeral() : renderAbaUsuarios(sub)}
            </div>
        </div>
    `;
    if(aba === 'usuarios' && sub === 'cadastros') atualizarTabelaUsuarios();
}

function renderAbaGeral() {
    return `
        <div style="background:#222; padding:2rem; border-radius:8px">
            <div style="display:flex; align-items:center; gap:15px">
                <input type="checkbox" id="checkOrdem" style="width:20px; height:20px" ${getConfig().controlaOrdem ? 'checked' : ''} onchange="atualizarCfgOrdem(this.checked)">
                <label for="checkOrdem" style="margin:0; text-transform:none; font-size:1rem">Ativar módulo de Ordem de Chegada (Fila)</label>
            </div>
        </div>
    `;
}

function atualizarCfgOrdem(val) {
    const cfg = getConfig();
    cfg.controlaOrdem = val;
    saveConfig(cfg);
}

function renderAbaUsuarios(sub) {
    const isAdmin = usuarioLogado.tipo === 'Administrador';
    return `
        <div class="tabs-container" style="border:none; margin-bottom:15px">
            <button class="nav-btn ${sub === 'cadastros' ? 'active' : ''}" onclick="navegar('Configuracoes', 'usuarios', 'cadastros')">Cadastros</button>
            ${isAdmin ? `<button class="nav-btn ${sub === 'perfis' ? 'active' : ''}" onclick="navegar('Configuracoes', 'usuarios', 'perfis')">Perfis de Acesso</button>` : ''}
        </div>
        <div id="usuarioContent">
            ${sub === 'cadastros' ? `
                <div style="display:flex; gap:10px; margin-bottom:15px">
                    <button id="uEdit" class="btn-outline" disabled onclick="editarUser()">Editar</button>
                    <button id="uStatus" class="btn-outline" disabled onclick="toggleStatus()">Ativar/Desativar</button>
                    <button id="uDel" class="btn-outline" style="color:var(--danger)" disabled onclick="deletarUser()">Excluir</button>
                    <button class="btn-primary" style="width:auto; margin-left:auto" onclick="navegar('FormUsuario')">+ NOVO USUÁRIO</button>
                </div>
                <table>
                    <thead><tr><th>Nome</th><th>Usuário</th><th>Tipo</th><th>Status</th></tr></thead>
                    <tbody id="listaUsuarios"></tbody>
                </table>
            ` : 'Módulo de Perfis em desenvolvimento...'}
        </div>
    `;
}

function atualizarTabelaUsuarios() {
    const lista = getUsuarios();
    const tbody = document.getElementById('listaUsuarios');
    if(!tbody) return;
    tbody.innerHTML = lista.map(u => `
        <tr onclick="selecionarUser(${u.id}, this)" style="cursor:pointer">
            <td>${u.nomeCompleto}</td>
            <td>@${u.usuario}</td>
            <td>${u.tipo}</td>
            <td style="color:${u.ativo ? 'var(--success)' : 'var(--danger)'}">${u.ativo ? 'Ativo' : 'Inativo'}</td>
        </tr>
    `).join('');
}

function selecionarUser(id, el) {
    document.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
    el.classList.add('selected');
    usuarioSelecionado = getUsuarios().find(u => u.id == id);
    
    document.getElementById('uEdit').disabled = false;
    
    if(usuarioLogado.tipo === 'Administrador') {
        // Bloqueio do Master administrador (ID 9999)
        const isMaster = usuarioSelecionado.id === 9999;
        document.getElementById('uStatus').disabled = isMaster;
        document.getElementById('uDel').disabled = (isMaster || usuarioSelecionado.ativo);
    }
}

function renderFormUsuario(id = null) {
    const edit = id ? getUsuarios().find(u => u.id == id) : null;
    const isFirst = !usuarioLogado;
    app.innerHTML = `
        <div class="view-centered">
            <div class="container">
                <h2>${edit ? 'EDITAR' : 'NOVO'} USUÁRIO</h2>
                <form onsubmit="salvarUsuario(event)">
                    <input type="hidden" id="f_id" value="${id || ''}">
                    <div class="form-group"><label>Nome Completo</label><input type="text" id="f_nome" value="${edit?.nomeCompleto || ''}" required></div>
                    <div class="form-group"><label>Usuário Login</label><input type="text" id="f_user" value="${edit?.usuario || ''}" required></div>
                    <div class="form-group"><label>Senha</label><input type="password" id="f_pass" required></div>
                    <div class="form-group"><label>Confirmar Senha</label><input type="password" id="f_passc" required></div>
                    <div class="form-group">
                        <label>Tipo de Conta</label>
                        <select id="f_tipo" ${isFirst ? 'disabled' : ''}>
                            <option value="Administrador">Administrador</option>
                            <option value="Normal" ${edit?.tipo === 'Normal' ? 'selected' : ''}>Normal</option>
                        </select>
                    </div>
                    <button type="submit" class="btn-primary">GRAVAR DADOS</button>
                    <button type="button" class="btn-outline" style="width:100%; margin-top:10px" onclick="${usuarioLogado ? "navegar('Configuracoes', 'usuarios', 'cadastros')" : "navegar('Login')" }">CANCELAR</button>
                </form>
            </div>
        </div>
    `;
}

function salvarUsuario(e) {
    e.preventDefault();
    if(document.getElementById('f_pass').value !== document.getElementById('f_passc').value) return alert("As senhas não coincidem!");
    
    const id = document.getElementById('f_id').value;
    const users = getUsuarios();
    const dados = {
        id: id ? parseInt(id) : Date.now(),
        nomeCompleto: document.getElementById('f_nome').value,
        usuario: document.getElementById('f_user').value,
        senha: document.getElementById('f_pass').value,
        tipo: document.getElementById('f_tipo').value,
        permissoes: id ? users.find(u => u.id == id).permissoes : (document.getElementById('f_tipo').value === 'Administrador' ? BOTOES_MENU.map(b => b.id) : []),
        ativo: true
    };
    
    saveUsuarios(id ? users.map(u => u.id == id ? dados : u) : [...users, dados]);
    usuarioLogado ? navegar('Configuracoes', 'usuarios', 'cadastros') : navegar('Login');
}

function deletarUser() {
    if(!usuarioSelecionado || usuarioSelecionado.id === 9999) return;
    if(confirm('Deseja realmente excluir este usuário?')) {
        saveUsuarios(getUsuarios().filter(u => u.id != usuarioSelecionado.id));
        navegar('Configuracoes', 'usuarios', 'cadastros');
    }
}

function editarUser() {
    navegar('FormUsuario', usuarioSelecionado.id);
}

function toggleStatus() {
    if(usuarioSelecionado.id === 9999) return;
    const lista = getUsuarios().map(u => {
        if(u.id === usuarioSelecionado.id) u.ativo = !u.ativo;
        return u;
    });
    saveUsuarios(lista);
    atualizarTabelaUsuarios();
}

// Inicia
getUsuarios();
navegar('Login');