// Inicialização de Dados e Configurações
let produtos = JSON.parse(localStorage.getItem('produtos')) || [];
let vendas = JSON.parse(localStorage.getItem('vendas')) || [];
let fila = JSON.parse(localStorage.getItem('fila')) || [];

let config = JSON.parse(localStorage.getItem('config')) || {
    controlaFila: false,
    qtdBarbeiros: 1,
    tempoMedio: 30, // minutos
    controlaEstoqueMinimo: false,
    qtdeMinima: 5
};

let carrinhoVenda = JSON.parse(localStorage.getItem('carrinhoVenda')) || [];
let clienteVenda = localStorage.getItem('clienteVenda') || '';

// IDs de elementos
const toastContainer = document.getElementById('toast-container');

// Funções de Utilidade
function salvarDados() {
    localStorage.setItem('produtos', JSON.stringify(produtos));
    localStorage.setItem('vendas', JSON.stringify(vendas));
    localStorage.setItem('carrinhoVenda', JSON.stringify(carrinhoVenda));
    localStorage.setItem('clienteVenda', clienteVenda);
    localStorage.setItem('fila', JSON.stringify(fila));
    localStorage.setItem('config', JSON.stringify(config));
    
    // Garante que o estado visual é atualizado após salvar
    renderizarTabelaPrincipal();
    renderizarTabelaVendas();
    renderizarTabelaEstoque();
    renderizarTabelaFila();
    checarEstoqueMinimo();
}

function loadData() {
    renderizarTabelaPrincipal();
    renderizarTabelaProdutos();
    renderizarTabelaEstoque();
    renderizarTabelaVendas();
    renderizarTabelaFila();
    carregarConfiguracoes();
    atualizarResumoVenda();
    checarEstoqueMinimo();
}

function mostrarToast(mensagem, tipo = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${tipo} show`;
    toast.innerText = mensagem;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function navegar(telaId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(telaId).classList.add('active');
    const btn = Array.from(document.querySelectorAll('.nav-btn')).find(b => b.getAttribute('onclick').includes(telaId));
    if (btn) btn.classList.add('active');

    // Ao navegar para a venda, limpa se necessário
    if (telaId === 'TelaNovaVenda' && carrinhoVenda.length === 0) {
        iniciarNovaVenda();
    }
}

// --- Funções de Formatação ---
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
}

// --- Gestão de Produtos ---
function calcularValorVenda() {
    const compra = parseFloat(document.getElementById('prodValorCompra').value) || 0;
    const markup = parseFloat(document.getElementById('prodMarkup').value) || 0;
    if (markup > 0) {
        const venda = compra + (compra * (markup / 100));
        document.getElementById('prodValorVenda').value = venda.toFixed(2);
    }
}

function abrirModalProduto(id = null) {
    const modal = document.getElementById('modalProduto');
    const form = document.getElementById('formProduto');
    form.reset();
    document.getElementById('prodId').value = '';
    document.getElementById('modalProdutoTitulo').innerText = 'Novo Produto';

    if (id) {
        const prod = produtos.find(p => p.id === id);
        if (prod) {
            document.getElementById('prodId').value = prod.id;
            document.getElementById('prodDescricao').value = prod.descricao;
            document.getElementById('prodObs').value = prod.observacao || '';
            document.getElementById('prodValorCompra').value = prod.valorCompra;
            document.getElementById('prodMarkup').value = prod.markup;
            document.getElementById('prodValorVenda').value = prod.valorVenda;
            document.getElementById('prodQtde').value = prod.estoque;
            document.getElementById('prodDisponivel').checked = prod.disponivel;
            document.getElementById('modalProdutoTitulo').innerText = 'Editar Produto';
        }
    }
    modal.style.display = 'block';
}

function salvarProduto(event) {
    event.preventDefault();
    const id = document.getElementById('prodId').value;
    const novoProduto = {
        id: id || Date.now().toString(),
        descricao: document.getElementById('prodDescricao').value,
        observacao: document.getElementById('prodObs').value,
        valorCompra: parseFloat(document.getElementById('prodValorCompra').value) || 0,
        markup: parseFloat(document.getElementById('prodMarkup').value) || 0,
        valorVenda: parseFloat(document.getElementById('prodValorVenda').value),
        estoque: parseInt(document.getElementById('prodQtde').value) || 0,
        disponivel: document.getElementById('prodDisponivel').checked,
        desconto: 0,
        descontoAtivo: false
    };

    if (id) {
        const index = produtos.findIndex(p => p.id === id);
        produtos[index] = novoProduto;
        mostrarToast('Produto atualizado!');
    } else {
        produtos.push(novoProduto);
        mostrarToast('Produto cadastrado!', 'success');
    }

    salvarDados();
    renderizarTabelaProdutos();
    fecharModais();
}

function excluirProduto(id) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        produtos = produtos.filter(p => p.id !== id);
        salvarDados();
        renderizarTabelaProdutos();
        mostrarToast('Produto removido', 'error');
    }
}

// --- Renderização de Tabelas ---
function renderizarTabelaPrincipal() {
    const corpo = document.getElementById('tabelaPrincipalCorpo');
    const filtro = document.getElementById('filtroPrincipal').value.toLowerCase();
    corpo.innerHTML = '';

    produtos.filter(p => p.disponivel && p.descricao.toLowerCase().includes(filtro)).forEach(p => {
        const valorFinal = p.descontoAtivo ? p.valorVenda * (1 - p.desconto / 100) : p.valorVenda;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.descricao}</td>
            <td class="text-right">${formatarMoeda(p.valorVenda)}</td>
            <td class="text-right"><strong>${formatarMoeda(valorFinal)}</strong></td>
            <td>${p.estoque}</td>
            <td><button onclick="adicionarAoCarrinho('${p.id}')" class="btn-success-small" ${p.estoque <= 0 ? 'disabled' : ''}><i class="fas fa-cart-plus"></i></button></td>
        `;
        corpo.appendChild(tr);
    });
}

document.getElementById('filtroPrincipal').addEventListener('input', renderizarTabelaPrincipal);

function renderizarTabelaProdutos() {
    const corpo = document.getElementById('tabelaProdutosCorpo');
    corpo.innerHTML = '';

    produtos.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="checkbox" class="prod-check" value="${p.id}"></td>
            <td>${p.descricao}</td>
            <td>${p.observacao || '-'}</td>
            <td class="text-right">${formatarMoeda(p.valorCompra)}</td>
            <td class="text-right">${p.markup}%</td>
            <td class="text-right">${formatarMoeda(p.valorVenda)}</td>
            <td class="text-right">${p.estoque}</td>
            <td>${p.disponivel ? '<span class="tag-success">Sim</span>' : '<span class="tag-danger">Não</span>'}</td>
            <td><button onclick="abrirModalDesconto('${p.id}')" class="btn-secondary-small">${p.descontoAtivo ? p.desconto + '%' : 'Add'}</button></td>
            <td>
                <button onclick="abrirModalProduto('${p.id}')" class="btn-primary-small"><i class="fas fa-edit"></i></button>
                <button onclick="excluirProduto('${p.id}')" class="btn-danger-small"><i class="fas fa-trash"></i></button>
            </td>
        `;
        corpo.appendChild(tr);
    });
}

// --- Gestão de Descontos ---
function abrirModalDesconto(id) {
    const prod = produtos.find(p => p.id === id);
    if (!prod) return;
    document.getElementById('descontoProdId').value = prod.id;
    document.getElementById('descontoNome').innerText = prod.descricao;
    document.getElementById('descontoAtivo').checked = prod.descontoAtivo;
    document.getElementById('descontoPercentual').value = prod.desconto;
    document.getElementById('modalDesconto').style.display = 'block';
}

function aplicarDesconto(event) {
    event.preventDefault();
    const id = document.getElementById('descontoProdId').value;
    const index = produtos.findIndex(p => p.id === id);
    if (index !== -1) {
        produtos[index].descontoAtivo = document.getElementById('descontoAtivo').checked;
        produtos[index].desconto = parseFloat(document.getElementById('descontoPercentual').value) || 0;
        salvarDados();
        renderizarTabelaProdutos();
        fecharModais();
        mostrarToast('Desconto configurado!');
    }
}

// --- Gestão de Estoque ---
let produtoSelecionadoEstoque = null;

function renderizarTabelaEstoque() {
    const corpo = document.getElementById('tabelaEstoqueCorpo');
    const filtro = document.getElementById('filtroEstoque').value.toLowerCase();
    const apenasMinimo = document.getElementById('filtroEstoqueMinimo').checked;
    corpo.innerHTML = '';

    produtos.filter(p => {
        const matchesFiltro = p.descricao.toLowerCase().includes(filtro);
        const matchesMinimo = !apenasMinimo || p.estoque < config.qtdeMinima;
        return matchesFiltro && matchesMinimo;
    }).forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.descricao}</td>
            <td>${p.observacao || '-'}</td>
            <td class="text-right">${p.estoque}</td>
            <td class="text-right">${formatarMoeda(p.valorCompra)}</td>
            <td class="text-right">${formatarMoeda(p.estoque * p.valorCompra)}</td>
            <td>${p.disponivel ? 'Sim' : 'Não'}</td>
            <td><button onclick="selecionarParaMovimento('${p.id}')" class="btn-primary-small">Selecionar</button></td>
        `;
        corpo.appendChild(tr);
    });
}

document.getElementById('filtroEstoque').addEventListener('input', renderizarTabelaEstoque);
document.getElementById('filtroEstoqueMinimo').addEventListener('change', renderizarTabelaEstoque);

function selecionarParaMovimento(id) {
    produtoSelecionadoEstoque = produtos.find(p => p.id === id);
    document.getElementById('estoqueProdutoSelecionado').innerText = produtoSelecionadoEstoque.descricao;
    document.getElementById('btnEntrada').disabled = false;
    document.getElementById('btnSaida').disabled = false;
}

function abrirModalMovimentacao(tipo) {
    if (!produtoSelecionadoEstoque) return;
    document.getElementById('movimentoTipo').value = tipo;
    document.getElementById('movimentoProdutoNome').innerText = produtoSelecionadoEstoque.descricao;
    document.getElementById('movimentoEstoqueAtual').innerText = produtoSelecionadoEstoque.estoque;
    document.getElementById('modalMovimentoTitulo').innerText = tipo === 'entrada' ? 'Entrada de Estoque' : 'Saída de Estoque';
    document.getElementById('modalMovimentacao').style.display = 'block';
}

function salvarMovimentacao(event) {
    event.preventDefault();
    const qtd = parseInt(document.getElementById('movimentoQtd').value);
    const tipo = document.getElementById('movimentoTipo').value;
    
    if (tipo === 'saida' && qtd > produtoSelecionadoEstoque.estoque) {
        alert('Quantidade de saída maior que o estoque atual!');
        return;
    }

    const index = produtos.findIndex(p => p.id === produtoSelecionadoEstoque.id);
    produtos[index].estoque += (tipo === 'entrada' ? qtd : -qtd);
    
    salvarDados();
    renderizarTabelaEstoque();
    fecharModais();
    mostrarToast(`Movimentação de ${tipo} realizada!`);
}

// --- Sistema de Vendas ---
function adicionarAoCarrinho(id) {
    const prod = produtos.find(p => p.id === id);
    if (!prod || prod.estoque <= 0) {
        mostrarToast('Produto sem estoque!', 'error');
        return;
    }

    const itemExistente = carrinhoVenda.find(item => item.id === id);
    const valorFinal = prod.descontoAtivo ? prod.valorVenda * (1 - prod.desconto / 100) : prod.valorVenda;

    if (itemExistente) {
        if (itemExistente.qtde < prod.estoque) {
            itemExistente.qtde++;
        } else {
            mostrarToast('Limite de estoque atingido no carrinho!', 'warning');
            return;
        }
    } else {
        carrinhoVenda.push({
            id: prod.id,
            descricao: prod.descricao,
            valorUnitario: valorFinal,
            qtde: 1
        });
    }

    salvarDados();
    mostrarToast('Adicionado ao carrinho');
    if (document.getElementById('TelaNovaVenda').classList.contains('active')) {
        atualizarResumoVenda();
    } else {
        navegar('TelaNovaVenda');
    }
}

function atualizarResumoVenda() {
    const corpo = document.getElementById('tabelaNovaVendaCorpo');
    corpo.innerHTML = '';
    let subtotal = 0;

    carrinhoVenda.forEach((item, index) => {
        const totalItem = item.valorUnitario * item.qtde;
        subtotal += totalItem;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.descricao}</td>
            <td class="text-right">${formatarMoeda(item.valorUnitario)}</td>
            <td>
                <input type="number" value="${item.qtde}" min="1" style="width: 50px" onchange="alterarQuantidadeCarrinho(${index}, this.value)">
            </td>
            <td class="text-right">${formatarMoeda(totalItem)}</td>
            <td><button onclick="removerDoCarrinho(${index})" class="btn-danger-small"><i class="fas fa-times"></i></button></td>
        `;
        corpo.appendChild(tr);
    });

    const aplicaDesconto = document.getElementById('vendaAplicaDesconto').checked;
    const percDesconto = parseFloat(document.getElementById('vendaDescontoInput').value) || 0;
    const valorDesconto = aplicaDesconto ? subtotal * (percDesconto / 100) : 0;
    const total = subtotal - valorDesconto;

    document.getElementById('vendaSubtotal').innerText = formatarMoeda(subtotal);
    document.getElementById('vendaDescontoValor').innerText = formatarMoeda(valorDesconto);
    document.getElementById('vendaTotal').innerText = formatarMoeda(total);
    document.getElementById('btnFaturarVenda').disabled = carrinhoVenda.length === 0;
}

function alterarQuantidadeCarrinho(index, novaQtde) {
    const item = carrinhoVenda[index];
    const prod = produtos.find(p => p.id === item.id);
    const qtde = parseInt(novaQtde);

    if (qtde > prod.estoque) {
        alert('Estoque insuficiente!');
        item.qtde = prod.estoque;
    } else if (qtde < 1) {
        item.qtde = 1;
    } else {
        item.qtde = qtde;
    }
    salvarDados();
    atualizarResumoVenda();
}

function removerDoCarrinho(index) {
    carrinhoVenda.splice(index, 1);
    salvarDados();
    atualizarResumoVenda();
}

function toggleDescontoVenda() {
    const container = document.getElementById('vendaDescontoContainer');
    container.style.display = document.getElementById('vendaAplicaDesconto').checked ? 'block' : 'none';
    atualizarResumoVenda();
}

document.getElementById('vendaDescontoInput').addEventListener('input', atualizarResumoVenda);

function iniciarNovaVenda() {
    carrinhoVenda = [];
    document.getElementById('vendaCliente').value = '';
    document.getElementById('vendaFormaPagamento').value = '';
    document.getElementById('vendaAplicaDesconto').checked = false;
    document.getElementById('vendaDescontoInput').value = 0;
    toggleDescontoVenda();
    salvarDados();
    atualizarResumoVenda();
}

function faturarVenda() {
    const cliente = document.getElementById('vendaCliente').value || 'Consumidor';
    const formaPagamento = document.getElementById('vendaFormaPagamento').value;
    
    if (!formaPagamento) {
        alert('Selecione a forma de pagamento!');
        return;
    }

    const subtotal = carrinhoVenda.reduce((acc, item) => acc + (item.valorUnitario * item.qtde), 0);
    const percDesconto = document.getElementById('vendaAplicaDesconto').checked ? parseFloat(document.getElementById('vendaDescontoInput').value) || 0 : 0;
    const total = subtotal * (1 - percDesconto/100);

    const novaVenda = {
        id: Date.now().toString(),
        data: new Date().toLocaleString(),
        cliente: cliente,
        formaPagamento: formaPagamento,
        itens: [...carrinhoVenda],
        subtotal: subtotal,
        descontoPerc: percDesconto,
        total: total
    };

    // Baixa estoque
    novaVenda.itens.forEach(item => {
        const prod = produtos.find(p => p.id === item.id);
        if (prod) prod.estoque -= item.qtde;
    });

    vendas.unshift(novaVenda);
    mostrarToast('Venda faturada com sucesso!', 'success');
    iniciarNovaVenda();
    salvarDados();
    navegar('TelaVendas');
}

// --- Histórico de Vendas ---
function renderizarTabelaVendas() {
    const corpo = document.getElementById('tabelaVendasCorpo');
    corpo.innerHTML = '';

    vendas.forEach(v => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${v.data}</td>
            <td>${v.cliente}</td>
            <td>${v.formaPagamento}</td>
            <td class="text-right"><strong>${formatarMoeda(v.total)}</strong></td>
            <td>
                <button onclick="verDetalhesVenda('${v.id}')" class="btn-primary-small"><i class="fas fa-eye"></i></button>
                <button onclick="abrirModalEdicaoVenda('${v.id}')" class="btn-secondary-small"><i class="fas fa-edit"></i></button>
                <button onclick="estornarVenda('${v.id}')" class="btn-danger-small"><i class="fas fa-undo"></i></button>
            </td>
        `;
        corpo.appendChild(tr);
    });
}

function verDetalhesVenda(id) {
    const venda = vendas.find(v => v.id === id);
    if (!venda) return;

    document.getElementById('detalhesVendaId').innerText = venda.id;
    document.getElementById('detalhesVendaData').innerText = venda.data;
    document.getElementById('detalhesVendaCliente').innerText = venda.cliente;
    document.getElementById('detalhesVendaPagamento').innerText = venda.formaPagamento;
    document.getElementById('detalhesVendaSubtotal').innerText = formatarMoeda(venda.subtotal);
    document.getElementById('detalhesVendaDesconto').innerText = venda.descontoPerc + '%';
    document.getElementById('detalhesVendaTotal').innerText = formatarMoeda(venda.total);

    const corpoItens = document.getElementById('detalhesVendaItensCorpo');
    corpoItens.innerHTML = '';
    venda.itens.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.descricao}</td>
            <td class="text-right">${formatarMoeda(item.valorUnitario)}</td>
            <td>${item.qtde}</td>
            <td class="text-right">${formatarMoeda(item.valorUnitario * item.qtde)}</td>
        `;
        corpoItens.appendChild(tr);
    });

    document.getElementById('modalDetalhesVenda').style.display = 'block';
}

function abrirModalEdicaoVenda(id) {
    const venda = vendas.find(v => v.id === id);
    if (!venda) return;
    document.getElementById('edicaoVendaId').value = venda.id;
    document.getElementById('edicaoVendaCliente').value = venda.cliente;
    document.getElementById('edicaoVendaFormaPagamento').value = venda.formaPagamento;
    document.getElementById('edicaoVendaTotal').innerText = formatarMoeda(venda.total);
    document.getElementById('modalEdicaoVenda').style.display = 'block';
}

function salvarEdicaoVenda(event) {
    event.preventDefault();
    const id = document.getElementById('edicaoVendaId').value;
    const index = vendas.findIndex(v => v.id === id);
    if (index !== -1) {
        vendas[index].cliente = document.getElementById('edicaoVendaCliente').value;
        vendas[index].formaPagamento = document.getElementById('edicaoVendaFormaPagamento').value;
        salvarDados();
        renderizarTabelaVendas();
        fecharModais();
        mostrarToast('Venda atualizada!');
    }
}

function estornarVenda(id) {
    if (confirm('Deseja estornar esta venda? O estoque será devolvido.')) {
        const index = vendas.findIndex(v => v.id === id);
        const venda = vendas[index];
        
        venda.itens.forEach(item => {
            const prod = produtos.find(p => p.id === item.id);
            if (prod) prod.estoque += item.qtde;
        });

        vendas.splice(index, 1);
        salvarDados();
        renderizarTabelaVendas();
        mostrarToast('Venda estornada e estoque devolvido.', 'warning');
    }
}

// --- Controle de Fila ---
function renderizarTabelaFila() {
    const container = document.getElementById('filaContainer');
    const desativada = document.getElementById('filaDesativada');
    
    if (!config.controlaFila) {
        container.style.display = 'none';
        desativada.style.display = 'block';
        return;
    }

    container.style.display = 'block';
    desativada.style.display = 'none';

    const corpo = document.getElementById('tabelaFilaCorpo');
    corpo.innerHTML = '';

    const aguardando = fila.filter(c => c.status === 'Aguardando').length;
    const atendendo = fila.filter(c => c.status === 'Em Atendimento').length;

    document.getElementById('filaBarbeiros').innerText = config.qtdBarbeiros;
    document.getElementById('filaAtendimentos').innerText = atendendo;
    document.getElementById('filaAguardando').innerText = aguardando;

    fila.forEach((cliente, index) => {
        const tr = document.createElement('tr');
        if (cliente.status === 'Em Atendimento') tr.className = 'atendimento-ativo';
        
        // Cálculo tempo estimado
        let tempoEstimado = '-';
        if (cliente.status === 'Aguardando') {
            const posicaoNaEspera = fila.filter((c, i) => c.status === 'Aguardando' && i <= index).length;
            const minutos = Math.ceil(posicaoNaEspera / config.qtdBarbeiros) * config.tempoMedio;
            tempoEstimado = `~${minutos} min`;
        }

        tr.innerHTML = `
            <td><input type="radio" name="selectFila" value="${cliente.id}" onchange="atualizarBotoesFila()"></td>
            <td>${cliente.nome}</td>
            <td>${cliente.horaChegada}</td>
            <td><span class="tag-${cliente.status === 'Em Atendimento' ? 'info' : 'warning'}">${cliente.status}</span></td>
            <td>${tempoEstimado}</td>
            <td>
                <button onclick="abrirModalEdicaoFila('${cliente.id}')" class="btn-secondary-small"><i class="fas fa-edit"></i></button>
                <button onclick="removerDaFila('${cliente.id}')" class="btn-danger-small"><i class="fas fa-user-minus"></i></button>
            </td>
        `;
        corpo.appendChild(tr);
    });
    atualizarBotoesFila();
}

function registrarEntradaCliente() {
    const nome = prompt('Nome do Cliente:');
    if (nome) {
        const novoCliente = {
            id: Date.now().toString(),
            nome: nome,
            horaChegada: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'Aguardando'
        };
        fila.push(novoCliente);
        salvarDados();
        mostrarToast('Cliente adicionado à fila!');
    }
}

function atualizarBotoesFila() {
    const selecionado = document.querySelector('input[name="selectFila"]:checked');
    const btnIniciar = document.getElementById('btnIniciarAtendimento');
    const btnSaida = document.getElementById('btnSaidaAtendimento');

    if (selecionado) {
        const cliente = fila.find(c => c.id === selecionado.value);
        btnIniciar.disabled = cliente.status !== 'Aguardando';
        btnSaida.disabled = false;
    } else {
        btnIniciar.disabled = true;
        btnSaida.disabled = true;
    }
}

function marcarEmAtendimento() {
    const selecionado = document.querySelector('input[name="selectFila"]:checked');
    if (selecionado) {
        const cliente = fila.find(c => c.id === selecionado.value);
        cliente.status = 'Em Atendimento';
        salvarDados();
        mostrarToast('Atendimento iniciado!');
    }
}

function registrarSaidaClienteSelecionado() {
    const selecionado = document.querySelector('input[name="selectFila"]:checked');
    if (selecionado) {
        const cliente = fila.find(c => c.id === selecionado.value);
        if (confirm(`Registrar saída de ${cliente.nome}?`)) {
            fila = fila.filter(c => c.id !== selecionado.value);
            salvarDados();
            mostrarToast('Saída registrada!');
        }
    }
}

function removerDaFila(id) {
    if (confirm('Remover cliente da fila?')) {
        fila = fila.filter(c => c.id !== id);
        salvarDados();
    }
}

function abrirModalEdicaoFila(id) {
    const cliente = fila.find(c => c.id === id);
    if (!cliente) return;
    document.getElementById('edicaoFilaId').value = cliente.id;
    document.getElementById('edicaoFilaNome').value = cliente.nome;
    document.getElementById('edicaoFilaStatus').value = cliente.status;
    document.getElementById('modalEdicaoFila').style.display = 'block';
}

function salvarEdicaoFila(event) {
    event.preventDefault();
    const id = document.getElementById('edicaoFilaId').value;
    const cliente = fila.find(c => c.id === id);
    if (cliente) {
        cliente.nome = document.getElementById('edicaoFilaNome').value;
        cliente.status = document.getElementById('edicaoFilaStatus').value;
        salvarDados();
        fecharModais();
        mostrarToast('Dados da fila atualizados!');
    }
}

// --- Configurações ---
function carregarConfiguracoes() {
    document.getElementById('configControlaFila').checked = config.controlaFila;
    document.getElementById('configFilaContainer').style.display = config.controlaFila ? 'block' : 'none';
    document.getElementById('configQtdBarbeiros').value = config.qtdBarbeiros;
    document.getElementById('configTempoMedio').value = config.tempoMedio;

    document.getElementById('configControlaEstoqueMinimo').checked = config.controlaEstoqueMinimo;
    document.getElementById('configEstoqueMinimoContainer').style.display = config.controlaEstoqueMinimo ? 'block' : 'none';
    document.getElementById('containerFiltroEstoqueMinimo').style.display = config.controlaEstoqueMinimo ? 'block' : 'none';
    document.getElementById('configQtdeMinima').value = config.qtdeMinima;
}

function toggleControlaFila(valor) {
    config.controlaFila = valor;
    salvarDados();
    carregarConfiguracoes();
}

function salvarQtdBarbeiros() {
    config.qtdBarbeiros = parseInt(document.getElementById('configQtdBarbeiros').value) || 1;
    salvarDados();
    mostrarToast('Configuração de barbeiros salva!');
}

function salvarTempoMedioAtendimento() {
    config.tempoMedio = parseInt(document.getElementById('configTempoMedio').value) || 30;
    salvarDados();
    mostrarToast('Tempo médio atualizado!');
}

function toggleControlaEstoqueMinimo(valor) {
    config.controlaEstoqueMinimo = valor;
    salvarDados();
    carregarConfiguracoes();
}

function salvarEstoqueMinimo() {
    config.qtdeMinima = parseInt(document.getElementById('configQtdeMinima').value) || 0;
    salvarDados();
    mostrarToast('Alerta de estoque configurado!');
}

function checarEstoqueMinimo() {
    const aviso = document.getElementById('avisosEstoqueMinimo');
    if (!config.controlaEstoqueMinimo) {
        aviso.innerHTML = '';
        return;
    }

    const baixos = produtos.filter(p => p.estoque < config.qtdeMinima);
    if (baixos.length > 0) {
        aviso.innerHTML = `
            <div class="alerta-estoque">
                <i class="fas fa-exclamation-triangle"></i> 
                <strong>Atenção!</strong> ${baixos.length} produto(s) com estoque abaixo do mínimo.
                <button onclick="navegar('TelaEstoque')" class="btn-primary-small">Ver Estoque</button>
            </div>
        `;
    } else {
        aviso.innerHTML = '';
    }
}

// --- Exclusão em Massa ---
function toggleCheckAll(source) {
    document.querySelectorAll('.prod-check').forEach(c => c.checked = source.checked);
}

function abrirModalExclusaoMassa() {
    const selecionados = document.querySelectorAll('.prod-check:checked');
    if (selecionados.length === 0) {
        mostrarToast('Nenhum produto selecionado!', 'warning');
        return;
    }
    document.getElementById('exclusaoMassaQtde').innerText = selecionados.length;
    document.getElementById('modalExclusaoMassa').style.display = 'block';
}

function executarExclusaoMassa() {
    const selecionados = Array.from(document.querySelectorAll('.prod-check:checked')).map(c => c.value);
    produtos = produtos.filter(p => !selecionados.includes(p.id));
    salvarDados();
    renderizarTabelaProdutos();
    fecharModais();
    mostrarToast(`${selecionados.length} produtos removidos.`, 'error');
}

// --- Backup e Importação ---
function exportarBackupJson() {
    const dados = { produtos, vendas, fila, config };
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estoquepro_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
}

function abrirModalImportacao() {
    document.getElementById('modalImportacao').style.display = 'block';
}

function importarDados(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const dadosImportados = JSON.parse(e.target.result);
            if (confirm('Confirmar importação? Isso substituirá todos os dados atuais.')) {
                if (dadosImportados.produtos) produtos = dadosImportados.produtos;
                if (dadosImportados.vendas) vendas = dadosImportados.vendas;
                if (dadosImportados.fila) fila = dadosImportados.fila;
                if (dadosImportados.config) config = dadosImportados.config;

                salvarDados();
                fecharModais();
                loadData();
                mostrarToast('Dados importados com sucesso!', 'success');
            }
        } catch (error) {
            mostrarToast('Erro ao ler ou parsear o arquivo JSON.', 'error');
            console.error('Erro de importação:', error);
        } finally {
             document.getElementById('fileInput').value = ''; // Limpa o input file
        }
    };
    reader.readAsText(file);
}


function limparTodosOsDados() {
    if (confirm('ATENÇÃO: Isso irá APAGAR PERMANENTEMENTE TODOS OS DADOS SALVOS (Produtos, Vendas, Fila, Configurações). Tem certeza?')) {
        produtos = [];
        vendas = [];
        fila = [];
        config = { controlaFila: false, qtdBarbeiros: 1, tempoMedio: 30, controlaEstoqueMinimo: false, qtdeMinima: 5 };
        carrinhoVenda = [];
        clienteVenda = '';
        
        localStorage.clear();
        salvarDados(); // Salva os arrays vazios (opcional, mas limpa o localStorage)
        loadData();
        mostrarToast('Todos os dados foram apagados. Sistema reiniciado.', 'error');
    }
}

// --- Funções de Modal ---
function fecharModais() {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
}

window.onclick = function(event) {
    if (event.target.className === 'modal') {
        fecharModais();
    }
};

// Inicialização
document.addEventListener('DOMContentLoaded', loadData);