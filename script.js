const DB_KEY = 'barberbot_usuarios';
const app = document.getElementById('app');

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
                <h2 style="text-align: center;">BARBERBOT PRO</h2>
                <div id="loginError" style="color:var(--danger); display:none; text-align:center; margin-bottom:10px; font-size:0.8rem;">Usuário e/ou senha incorreto(s)</div>
                <div class="form-group"><label>Usuário</label><input type="text" id="l_user"></div>
                <div class="form-group"><label>Senha</label><input type="password" id="l_pass"></div>
                <button class="btn-primary" onclick="executarLogin()">ENTRAR</button>
                <button class="btn-outline" style="margin-top:10px; border:none; color:var(--text-dim)" onclick="navegar('AdicionaUsuario')">Esqueci minha senha</button>
                <hr style="border:0; border-top:1px solid var(--border); margin:1.5rem 0;">
                <button class="btn-outline" onclick="navegar('AdicionaUsuario')">PRIMEIRO ACESSO</button>
            </div>
            <div class="dev-footer">Desenvolvido por 9DEV</div>
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

// --- TELA ADICIONA/EDITA USUARIO ---
function renderAdicionaUsuario(id = null) {
    const userEdit = id ? getUsuarios().find(u => u.id == id) : null;

    app.innerHTML = `
        <div class="view-centered">
            <div class="container">
                <h2>${userEdit ? 'EDITAR USUÁRIO' : 'CADASTRO / RECUPERAÇÃO'}</h2>
                <form onsubmit="salvarUser(event)">
                    <input type="hidden" id="userId" value="${userEdit ? userEdit.id : ''}">
                    <div class="form-group">
                        <label>Nome Completo</label>
                        <input type="text" id="nome" value="${userEdit?.nomeCompleto || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>E-mail *</label>
                        <input type="email" id="email" value="${userEdit?.email || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Usuário *</label>
                        <input type="text" id="user" value="${userEdit?.usuario || ''}" required>
                    </div>
                    <div class="form-group"><label>Senha *</label><input type="password" id="pass" required></div>
                    <div class="form-group"><label>Confirme sua senha *</label><input type="password" id="passC" required></div>
                    <button type="submit" class="btn-primary">GRAVAR</button>
                    <button type="button" class="btn-outline" style="margin-top:10px;" onclick="navegar('Login')">CANCELAR</button>
                </form>
            </div>
        </div>
    `;
}

function salvarUser(e) {
    e.preventDefault();
    if(document.getElementById('pass').value !== document.getElementById('passC').value) {
        return alert("Os valores inseridos não coincidem. Verifique!");
    }
    
    const id = document.getElementById('userId').value;
    const usuarios = getUsuarios();
    const inputUser = document.getElementById('user').value;

    // Lógica para salvar: Se id existe, atualiza. Se não, verifica se é uma recuperação pelo username
    let userExistente = id ? usuarios.find(u => u.id == id) : usuarios.find(u => u.usuario === inputUser);

    const dados = {
        id: userExistente ? userExistente.id : Date.now(),
        nomeCompleto: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        usuario: inputUser,
        senha: document.getElementById('pass').value,
        ativo: userExistente ? userExistente.ativo : true
    };

    let list;
    if (userExistente) {
        list = usuarios.map(u => u.id == userExistente.id ? dados : u);
    } else {
        list = [...usuarios, dados];
    }
    
    saveUsuarios(list);
    alert("Informações gravadas com sucesso!");
    navegar('Login');
}

// --- TELA PRINCIPAL ---
function renderBarberBotPro() {
    app.innerHTML = `
        <header class="main-header">
            <div class="logo-area"><i class="fas fa-scissors"></i> <span>BARBERBOT PRO</span></div>
            <div class="nav-menu">
                <button class="btn-outline" style="border:none; width:auto">Produto</button>
                <button class="btn-outline" style="border:none; width:auto">Vendas</button>
                <button class="btn-outline" style="border:none; width:auto">Estoque</button>
                <button class="btn-outline" style="border:none; width:auto" onclick="navegar('Configuracoes')">Configurações</button>
            </div>
            <div class="user-info">
                <span>Olá, <strong>${usuarioLogado.nomeCompleto.split(' ')[0]}</strong></span>
                <button onclick="navegar('Login')" style="background:none; color:var(--danger); cursor:pointer"><i class="fas fa-power-off"></i></button>
            </div>
        </header>
        <main style="padding: 4rem; text-align: center;">
            <h1 style="color: var(--primary); font-size: 2.5rem;">Painel BarberBot</h1>
            <p style="color: var(--text-dim)">Selecione uma opção no menu superior.</p>
        </main>
    `;
}

// --- TELA CONFIGURAÇÕES ---
function renderConfiguracoes(aba = 'gerais', sub = 'usuario') {
    app.innerHTML = `
        <header class="main-header">
            <div class="logo-area" onclick="navegar('BarberBotPro')" style="cursor:pointer"><i class="fas fa-scissors"></i> <span>BARBERBOT PRO</span></div>
            <button class="btn-outline" style="width:auto" onclick="navegar('BarberBotPro')">Voltar</button>
        </header>
        <div class="container wide">
            <h2>Configurações</h2>
            <div class="tabs-container">
                <button class="tab-btn ${aba === 'gerais' ? 'active' : ''}" onclick="renderConfiguracoes('gerais')">Gerais</button>
                <button class="tab-btn ${aba === 'backup' ? 'active' : ''}" onclick="renderConfiguracoes('backup')">Backup</button>
            </div>
            ${aba === 'gerais' ? `
                <div class="sub-tabs" style="display:flex; gap:15px; margin-bottom:20px; background:#222; padding:10px; border-radius:8px;">
                    <button class="tab-btn active" style="font-size:0.8rem">Usuário</button>
                </div>
                <div id="gestao">
                    <div style="display:flex; justify-content:space-between; margin-bottom:15px">
                         <div style="display:flex; gap:10px">
                            <button id="btnEdit" class="btn-outline" disabled onclick="navegar('AdicionaUsuario', usuarioSelecionado.id)" style="width:auto">Editar</button>
                            <button id="btnDelete" class="btn-outline" style="color:var(--danger); width:auto" disabled onclick="excluirUser()">Excluir</button>
                         </div>
                         <button class="btn-primary" style="width:auto" onclick="navegar('AdicionaUsuario')">+ Adicionar Novo</button>
                    </div>
                    <table>
                        <thead><tr><th>NOME</th><th>E-MAIL</th><th>USUÁRIO</th><th>STATUS</th></tr></thead>
                        <tbody id="listaCorpo"></tbody>
                    </table>
                </div>
            ` : `<p>Backup em breve...</p>`}
        </div>
    `;
    if(aba === 'gerais' && sub === 'usuario') atualizarTabela(getUsuarios());
}

function atualizarTabela(lista) {
    const corpo = document.getElementById('listaCorpo');
    if(!corpo) return;
    corpo.innerHTML = lista.map(u => `
        <tr onclick="selecionarUser(${u.id}, this)" style="cursor:pointer">
            <td>${u.nomeCompleto}</td><td>${u.email}</td><td>@${u.usuario}</td>
            <td style="color:${u.ativo ? 'var(--success)' : 'var(--danger)'}">${u.ativo ? '● Ativo' : '○ Inativo'}</td>
        </tr>
    `).join('');
}

function selecionarUser(id, el) {
    document.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
    el.classList.add('selected');
    usuarioSelecionado = getUsuarios().find(u => u.id == id);
    document.getElementById('btnEdit').disabled = false;
    document.getElementById('btnDelete').disabled = usuarioSelecionado.ativo;
}

function excluirUser() {
    if(confirm('Excluir permanentemente?')) {
        saveUsuarios(getUsuarios().filter(u => u.id != usuarioSelecionado.id));
        renderConfiguracoes('gerais', 'usuario');
    }
}

navegar('Login');