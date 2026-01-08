/**
 * BARBERBOT PRO - V 3.4 (CÓDIGO INTEGRAL ATUALIZADO)
 */

const DB_KEY = 'barberbot_usuarios';
const CFG_KEY = 'barberbot_config';
const PROD_KEY = 'barberbot_produtos';
const app = document.getElementById('app');

let usuarioLogado = null;
let itemSelecionado = null;

const BOTOES_MENU = [
    { id: 'produto', label: 'Produto', tela: 'Produto' },
    { id: 'vendas', label: 'Vendas', tela: 'Vendas' },
    { id: 'estoque', label: 'Estoque', tela: 'Estoque' },
    { id: 'ordem', label: 'Ordem de Chegada', tela: 'Ordem' },
    { id: 'config', label: 'Configurações', tela: 'Configuracoes' }
];

// --- STORAGE ---
const getData = (key) => JSON.parse(localStorage.getItem(key)) || [];
const setData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// --- INIT ---
const init = () => {
    let users = getData(DB_KEY);
    if (!users.some(u => u.usuario === 'admin')) {
        users.push({
            id: 9999, nomeCompleto: 'Administrador Mestre', email: 'admin@barberbot.pro',
            usuario: 'admin', senha: 'admin', tipo: 'Administrador',
            permissoes: BOTOES_MENU.map(b => b.id), ativo: true
        });
        setData(DB_KEY, users);
    }
};
init();

// --- NAVEGAÇÃO ---
function navegar(tela, params = null) {
    itemSelecionado = null;
    if (tela === 'Login') renderLogin();
    if (tela === 'BarberBotPro') renderDashboard();
    if (tela === 'Configuracoes') renderConfiguracoes(params || 'gerais');
    if (tela === 'AdicionaUsuario') renderFormUsuario(params);
    if (tela === 'Produto') renderTelaProduto();
    if (tela === 'NovoProduto') renderFormProduto(params);
}

function renderHeader() {
    return `
        <header class="main-header">
            <div class="logo-area" onclick="navegar('BarberBotPro')">
                <i class="fas fa-scissors"></i>
                <span class="logo-text">BARBERBOT <b>PRO</b></span>
            </div>
            <div style="display:flex; align-items:center; gap:15px">
                <div style="text-align:right">
                    <div style="font-size:0.8rem; font-weight:600">${usuarioLogado.nomeCompleto.split(' ')[0]}</div>
                    <div style="font-size:0.6rem; color:var(--primary); text-transform:uppercase">${usuarioLogado.tipo}</div>
                </div>
                <button onclick="navegar('Login')" style="background:none; color:var(--danger); border:none; font-size:1.2rem"><i class="fas fa-power-off"></i></button>
            </div>
        </header>
    `;
}

// --- LOGIN ---
function renderLogin() {
    usuarioLogado = null;
    app.innerHTML = `
        <div class="view-centered">
            <div class="container">
                <div style="text-align:center; margin-bottom:2rem; color:var(--primary)">
                    <i class="fas fa-scissors fa-3x"></i>
                    <h2 class="logo-text" style="margin-top:10px">BARBERBOT <b>PRO</b></h2>
                </div>
                <div id="loginErr" style="display:none; color:var(--danger); font-size:0.8rem; text-align:center; margin-bottom:10px">Usuário/Senha inválidos ou conta inativa.</div>
                <div class="form-group"><label>Usuário</label><input type="text" id="l_user"></div>
                <div class="form-group"><label>Senha</label><input type="password" id="l_pass"></div>
                <button class="btn-primary" style="width:100%" onclick="login()">ENTRAR</button>
            </div>
        </div>
    `;
    const inputs = [document.getElementById('l_user'), document.getElementById('l_pass')];
    inputs.forEach(input => {
        input.addEventListener('keypress', (e) => { if (e.key === 'Enter') login(); });
    });
}

function login() {
    const u = document.getElementById('l_user').value;
    const p = document.getElementById('l_pass').value;
    const user = getData(DB_KEY).find(x => x.usuario === u && x.senha === p && x.ativo);
    if (user) { usuarioLogado = user; navegar('BarberBotPro'); }
    else { document.getElementById('loginErr').style.display = 'block'; }
}

function renderDashboard() {
    const perms = usuarioLogado.permissoes || [];
    const cfg = getData(CFG_KEY);
    app.innerHTML = `
        ${renderHeader()}
        <nav class="nav-menu" style="background:#151515; border-bottom:1px solid var(--border); padding:0 2rem; justify-content:center">
            ${BOTOES_MENU.map(item => {
                if (item.id === 'ordem' && !cfg.controlaOrdem) return '';
                if (!perms.includes(item.id)) return '';
                return `<button class="nav-btn" onclick="navegar('${item.tela}')">${item.label}</button>`;
            }).join('')}
        </nav>
        <main style="padding:5rem 2rem; text-align:center">
            <h1 style="font-weight:300; font-size:2.5rem">Painel de <b style="color:var(--primary)">Gestão</b></h1>
            <p style="color:var(--text-dim)">Selecione um módulo acima para começar.</p>
        </main>
    `;
}

// --- PRODUTOS ---
function renderTelaProduto() {
    app.innerHTML = `
        ${renderHeader()}
        <div class="container wide">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px">
                <h2>Produtos</h2>
                <div style="display:flex; gap:10px">
                    <input type="text" id="p_filter" placeholder="Buscar por nome, categoria ou marca..." oninput="filtrarProds()" style="width:300px">
                    <button class="btn-primary" onclick="navegar('NovoProduto')">NOVO</button>
                </div>
            </div>
            <div style="margin-bottom:15px; display:flex; gap:10px">
                <button id="p_edit" class="btn-outline" disabled onclick="editarProd()">Editar</button>
                <button id="p_status" class="btn-outline" disabled onclick="toggleStatusProd()">Ativar/Desativar</button>
            </div>
            <table>
                <thead><tr><th>Descrição</th><th>Categoria</th><th>Marca</th><th>Qtd</th><th>Venda</th><th>Status</th></tr></thead>
                <tbody id="p_lista"></tbody>
            </table>
        </div>
    `;
    atualizarTabelaProd(getData(PROD_KEY));
}

function atualizarTabelaProd(lista) {
    const tbody = document.getElementById('p_lista');
    if(!tbody) return;
    tbody.innerHTML = lista.map(p => `
        <tr onclick="selecionarProd(${p.id}, this)" style="cursor:pointer">
            <td>${p.descricao}</td>
            <td style="color:var(--text-dim)">${p.categoria || '-'}</td>
            <td style="color:var(--text-dim)">${p.marca || '-'}</td>
            <td>${p.quantidade}</td>
            <td style="color:var(--primary); font-weight:700">R$ ${parseFloat(p.valorVenda).toFixed(2)}</td>
            <td><span class="status-tag ${p.ativo ? 'active-tag' : 'inactive-tag'}">${p.ativo ? 'Ativo' : 'Inativo'}</span></td>
        </tr>
    `).join('');
}

function filtrarProds() {
    const val = document.getElementById('p_filter').value.toLowerCase();
    const filtrados = getData(PROD_KEY).filter(p => 
        p.descricao.toLowerCase().includes(val) || 
        (p.categoria && p.categoria.toLowerCase().includes(val)) || 
        (p.marca && p.marca.toLowerCase().includes(val))
    );
    atualizarTabelaProd(filtrados);
}

function selecionarProd(id, el) {
    document.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
    el.classList.add('selected');
    itemSelecionado = getData(PROD_KEY).find(p => p.id === id);
    document.getElementById('p_edit').disabled = !itemSelecionado.ativo;
    document.getElementById('p_status').disabled = false;
}

function toggleStatusProd() {
    const list = getData(PROD_KEY).map(p => { if(p.id === itemSelecionado.id) p.ativo = !p.ativo; return p; });
    setData(PROD_KEY, list); renderTelaProduto();
}

function editarProd() { if(itemSelecionado?.ativo) navegar('NovoProduto', itemSelecionado.id); }

function renderFormProduto(id = null) {
    const prod = id ? getData(PROD_KEY).find(p => p.id == id) : null;
    app.innerHTML = `
        ${renderHeader()}
        <div class="view-centered">
            <div class="container" style="max-width:600px">
                <h3>${prod ? 'EDITAR' : 'NOVO'} PRODUTO</h3>
                <form onsubmit="gravarProduto(event)">
                    <input type="hidden" id="fp_id" value="${prod?.id || ''}">
                    
                    <div class="form-group">
                        <label>Descrição</label>
                        <input type="text" id="fp_desc" value="${prod?.descricao || ''}" required>
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px">
                        <div class="form-group">
                            <label>Quantidade</label>
                            <input type="number" id="fp_qtd" value="${prod?.quantidade || 0}" required>
                        </div>
                        <div class="form-group">
                            <label>Valor Compra (R$)</label>
                            <input type="number" step="0.01" id="fp_vcompra" value="${prod?.valorCompra || ''}" required oninput="calcVenda()">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Categoria</label>
                        <select id="fp_cat">
                            <option value="Cabelo" ${prod?.categoria === 'Cabelo' ? 'selected' : ''}>Cabelo</option>
                            <option value="Barba" ${prod?.categoria === 'Barba' ? 'selected' : ''}>Barba</option>
                            <option value="Outros" ${prod?.categoria === 'Outros' ? 'selected' : ''}>Outros</option>
                        </select>
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px">
                        <div class="form-group">
                            <label>Markup (%)</label>
                            <input type="number" id="fp_markup" value="${prod?.markup || 0}" required oninput="calcVenda()">
                        </div>
                        <div class="form-group">
                            <label>Valor Venda (R$)</label>
                            <input type="number" step="0.01" id="fp_vvenda" value="${prod?.valorVenda || ''}" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Marca / Fornecedor</label>
                        <input type="text" id="fp_marca" value="${prod?.marca || ''}">
                    </div>

                    <div class="form-group">
                        <label>Observações</label>
                        <textarea id="fp_obs">${prod?.obs || ''}</textarea>
                    </div>

                    <div style="display:flex; gap:20px; margin-bottom:20px">
                        <label style="display:flex; align-items:center; gap:8px; text-transform:none"><input type="checkbox" id="fp_disp" ${prod?.disponivel !== false ? 'checked' : ''} style="width:16px"> Disponível</label>
                        <label style="display:flex; align-items:center; gap:8px; text-transform:none"><input type="checkbox" id="fp_ativo" ${prod?.ativo !== false ? 'checked' : ''} style="width:16px"> Ativo</label>
                    </div>

                    <button type="submit" class="btn-primary" style="width:100%">GRAVAR PRODUTO</button>
                    <button type="button" class="btn-outline" style="width:100%; margin-top:10px" onclick="navegar('Produto')">CANCELAR</button>
                </form>
            </div>
        </div>
    `;
}

function calcVenda() {
    const c = parseFloat(document.getElementById('fp_vcompra').value) || 0;
    const m = parseFloat(document.getElementById('fp_markup').value) || 0;
    document.getElementById('fp_vvenda').value = (c * (1 + (m / 100))).toFixed(2);
}

function gravarProduto(e) {
    e.preventDefault();
    const id = document.getElementById('fp_id').value;
    const list = getData(PROD_KEY);
    const dados = {
        id: id ? parseInt(id) : Date.now(),
        descricao: document.getElementById('fp_desc').value,
        quantidade: document.getElementById('fp_qtd').value,
        valorCompra: document.getElementById('fp_vcompra').value,
        categoria: document.getElementById('fp_cat').value,
        markup: document.getElementById('fp_markup').value,
        valorVenda: document.getElementById('fp_vvenda').value,
        marca: document.getElementById('fp_marca').value,
        obs: document.getElementById('fp_obs').value,
        disponivel: document.getElementById('fp_disp').checked,
        ativo: document.getElementById('fp_ativo').checked
    };
    if(id) { const idx = list.findIndex(p => p.id == id); list[idx] = dados; } else { list.push(dados); }
    setData(PROD_KEY, list); navegar('Produto');
}

// --- CONFIGURAÇÕES ---
function renderConfiguracoes(aba, sub = 'cadastros') {
    app.innerHTML = `
        ${renderHeader()}
        <div class="container wide">
            <h2>Configurações</h2>
            <div class="tabs-container">
                <button class="tab-btn ${aba === 'gerais' ? 'active' : ''}" onclick="navegar('Configuracoes', 'gerais')">Gerais</button>
                <button class="tab-btn ${aba === 'usuarios' ? 'active' : ''}" onclick="navegar('Configuracoes', 'usuarios')">Usuários</button>
            </div>
            <div id="cfg_content">
                ${aba === 'gerais' ? `
                    <div class="sub-tabs"><button class="sub-tab-btn active">Gerais</button></div>
                    <div style="background:#222; padding:25px; border-radius:8px; border:1px solid var(--border)">
                        <h3 style="margin-top:0; font-size:1rem; color:var(--primary)">Preferências</h3>
                        <div style="display:flex; align-items:center; gap:12px">
                            <input type="checkbox" id="c_ordem" ${getData(CFG_KEY).controlaOrdem ? 'checked' : ''} onchange="setData(CFG_KEY, {controlaOrdem: this.checked})" style="width:18px; height:18px; cursor:pointer">
                            <label for="c_ordem" style="text-transform:none; margin:0; cursor:pointer; font-size:0.9rem">Controla ordem de chegada</label>
                            <i class="fas fa-info-circle info-icon" title="Habilita módulo de fila"></i>
                        </div>
                    </div>
                ` : ''}
                ${aba === 'usuarios' ? `
                    <div class="sub-tabs">
                        <button class="sub-tab-btn ${sub === 'cadastros' ? 'active' : ''}" onclick="renderConfiguracoes('usuarios', 'cadastros')">Cadastros</button>
                        ${usuarioLogado.tipo === 'Administrador' ? `<button class="sub-tab-btn ${sub === 'perfis' ? 'active' : ''}" onclick="renderConfiguracoes('usuarios', 'perfis')">Perfis</button>` : ''}
                    </div>
                    ${sub === 'cadastros' ? renderTabelaUsers() : renderPerfis()}
                ` : ''}
            </div>
        </div>
    `;
    if(aba === 'usuarios' && sub === 'cadastros') atualizarTabelaUsers(getData(DB_KEY));
}

function renderTabelaUsers() {
    return `
        <div style="display:flex; gap:10px; margin-bottom:15px">
            <button id="u_edit" class="btn-outline" disabled onclick="editarUser()">Editar</button>
            <button id="u_status" class="btn-outline" disabled onclick="toggleStatusUser()">Ativar/Desativar</button>
            ${usuarioLogado.tipo === 'Administrador' ? `<button class="btn-primary" onclick="navegar('AdicionaUsuario')" style="margin-left:auto">+ NOVO</button>` : ''}
        </div>
        <table>
            <thead><tr><th>Nome</th><th>Usuário</th><th>Tipo</th><th>Status</th></tr></thead>
            <tbody id="u_lista"></tbody>
        </table>
    `;
}

function atualizarTabelaUsers(lista) {
    const tbody = document.getElementById('u_lista');
    if(!tbody) return;
    tbody.innerHTML = lista.map(u => `
        <tr onclick="selecionarUser(${u.id}, this)" style="cursor:pointer">
            <td>${u.nomeCompleto}</td><td>@${u.usuario}</td><td>${u.tipo}</td>
            <td style="color:${u.ativo ? 'var(--success)' : 'var(--danger)'}">${u.ativo ? 'Ativo' : 'Inativo'}</td>
        </tr>
    `).join('');
}

function selecionarUser(id, el) {
    document.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
    el.classList.add('selected');
    itemSelecionado = getData(DB_KEY).find(u => u.id === id);
    document.getElementById('u_edit').disabled = false;
    if(usuarioLogado.tipo === 'Administrador') document.getElementById('u_status').disabled = false;
}

function toggleStatusUser() {
    const list = getData(DB_KEY).map(u => { if(u.id === itemSelecionado.id) u.ativo = !u.ativo; return u; });
    setData(DB_KEY, list); renderConfiguracoes('usuarios', 'cadastros');
}

function editarUser() {
    if(usuarioLogado.tipo === 'Normal' && itemSelecionado.tipo === 'Administrador') return alert("Ação negada.");
    navegar('AdicionaUsuario', itemSelecionado.id);
}

function renderFormUsuario(id = null) {
    const user = id ? getData(DB_KEY).find(u => u.id == id) : null;
    const isFirst = !usuarioLogado;
    app.innerHTML = `
        <div class="view-centered">
            <div class="container" style="max-width:550px">
                <h2>${user ? 'EDITAR' : 'NOVO'} USUÁRIO</h2>
                <form onsubmit="salvarUser(event)">
                    <input type="hidden" id="fu_id" value="${user?.id || ''}">
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px">
                        <div class="form-group"><label>Nome</label><input type="text" id="fu_nome" value="${user?.nomeCompleto || ''}" required></div>
                        <div class="form-group"><label>Email</label><input type="email" id="fu_email" value="${user?.email || ''}" required></div>
                        <div class="form-group"><label>Usuário</label><input type="text" id="fu_user" value="${user?.usuario || ''}" required></div>
                        <div class="form-group">
                            <label>Tipo</label>
                            <select id="fu_tipo" ${isFirst || (user && usuarioLogado.tipo === 'Normal') ? 'disabled' : ''}>
                                <option value="Normal" ${user?.tipo === 'Normal' ? 'selected' : ''}>Normal</option>
                                <option value="Administrador" ${user?.tipo === 'Administrador' ? 'selected' : ''}>Administrador</option>
                            </select>
                        </div>
                        <div class="form-group"><label>Senha</label><input type="password" id="fu_pass" required></div>
                        <div class="form-group"><label>Confirmar</label><input type="password" id="fu_passc" required></div>
                    </div>
                    <button type="submit" class="btn-primary" style="width:100%; margin-top:10px">GRAVAR</button>
                    <button type="button" class="btn-outline" style="width:100%; margin-top:10px" onclick="${isFirst ? "navegar('Login')" : "navegar('Configuracoes', 'usuarios')" }">CANCELAR</button>
                </form>
            </div>
        </div>
    `;
}

function salvarUser(e) {
    e.preventDefault();
    if(document.getElementById('fu_pass').value !== document.getElementById('fu_passc').value) return alert("Senhas não conferem");
    const id = document.getElementById('fu_id').value;
    const list = getData(DB_KEY);
    const dados = {
        id: id ? parseInt(id) : Date.now(),
        nomeCompleto: document.getElementById('fu_nome').value,
        email: document.getElementById('fu_email').value,
        usuario: document.getElementById('fu_user').value,
        tipo: document.getElementById('fu_tipo').value,
        senha: document.getElementById('fu_pass').value,
        permissoes: id ? list.find(u => u.id == id).permissoes : (document.getElementById('fu_tipo').value === 'Administrador' ? BOTOES_MENU.map(b => b.id) : []),
        ativo: id ? list.find(u => u.id == id).ativo : true
    };
    setData(DB_KEY, id ? list.map(u => u.id == id ? dados : u) : [...list, dados]);
    usuarioLogado ? navegar('Configuracoes', 'usuarios') : navegar('Login');
}

function renderPerfis() {
    const users = getData(DB_KEY);
    return `
        <div style="display:grid; grid-template-columns: 300px 1fr; gap:30px">
            <div style="display:flex; flex-direction:column; gap:8px">
                ${users.map(u => `<button class="btn-outline" style="width:100%; text-align:left; justify-content:flex-start" onclick="carregarPerfil(${u.id})">${u.nomeCompleto}</button>`).join('')}
            </div>
            <div id="perfil_editor" style="background:#222; padding:20px; border-radius:8px">Selecione um usuário.</div>
        </div>
    `;
}

function carregarPerfil(id) {
    const u = getData(DB_KEY).find(x => x.id === id);
    const perms = u.permissoes || [];
    document.getElementById('perfil_editor').innerHTML = `
        <h3 style="margin-top:0">${u.nomeCompleto}</h3>
        <div style="display:flex; flex-direction:column; gap:12px; margin-top:15px">
            ${BOTOES_MENU.map(b => `
                <label style="display:flex; align-items:center; gap:10px; text-transform:none">
                    <input type="checkbox" value="${b.id}" ${perms.includes(b.id) ? 'checked' : ''} style="width:18px; height:18px"> ${b.label}
                </label>
            `).join('')}
        </div>
        <button class="btn-primary" style="margin-top:20px; width:100%" onclick="salvarPerms(${id})">Gravar Acessos</button>
    `;
}

function salvarPerms(id) {
    const checks = Array.from(document.querySelectorAll('#perfil_editor input:checked')).map(i => i.value);
    const list = getData(DB_KEY).map(u => u.id === id ? {...u, permissoes: checks} : u);
    setData(DB_KEY, list); alert("Permissões Atualizadas!"); renderConfiguracoes('usuarios', 'perfis');
}

navegar('Login');