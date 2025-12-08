// --- Estado Global ---
let produtos = [];
let produtoSelecionadoId = null;

let filaClientes = [];
let clienteSelecionadoFilaId = null; 
let configControlaFila = false; 
let configTempoMedio = 30; 
let configQtdBarbeiros = 1; 

let configControlaEstoqueMinimo = false;
let configQtdeMinima = 5; 

// NOVO: Estado para Vendas
let vendas = []; 
let itensVenda = []; // Produtos temporários selecionados para a venda atual

let previsaoInterval = null; 

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
    renderizarNavbar();
    navegar('TelaPrincipal');
    iniciarDecrementoPrevisao();
    
    // Adicionar listener para controlar o botão Excluir Selecionados
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('check-produto') || e.target.id === 'checkAll') {
            controlarVisibilidadeBotaoExcluir();
        }
    });
});

// --- Gestão de Dados (LocalStorage) ---
function carregarDados() {
    const dados = localStorage.getItem('estoqueDb');
    
    // Atualiza a estrutura do produto ao carregar, se necessário, garantindo valores default
    produtos = dados ? JSON.parse(dados) : [];
    produtos.forEach(p => {
        p.valorCompra = p.valorCompra !== undefined ? p.valorCompra : 0.00;
        p.markup = p.markup !== undefined ? p.markup : 0;
        p.valorVenda = p.valorVenda !== undefined ? p.valorVenda : (p.valor || 0.00);
        delete p.valor; 
        
        p.descontoAtivo = p.descontoAtivo !== undefined ? p.descontoAtivo : false;
        p.descontoPercentual = p.descontoPercentual !== undefined ? p.descontoPercentual : 0.00;
        
        p.obs = p.obs !== undefined ? p.obs : "";
    });
    
    // Carregar dados de Vendas (NOVO)
    const dadosVendas = localStorage.getItem('historicoVendasDb');
    vendas = dadosVendas ? JSON.parse(dadosVendas) : [];
    
    const fila = localStorage.getItem('filaClientesDb');
    filaClientes = fila ? JSON.parse(fila) : [];
    
    filaClientes.forEach(c => {
        if (c.emAtendimento === undefined) {
            c.emAtendimento = false;
        }
    });
    
    const configFila = localStorage.getItem('configControlaFila');
    configControlaFila = configFila === 'true'; 

    const configTempo = localStorage.getItem('configTempoMedio');
    configTempoMedio = configTempo ? parseInt(configTempo) : 30;
    
    const configBarbeiros = localStorage.getItem('configQtdBarbeiros');
    configQtdBarbeiros = configBarbeiros ? parseInt(configBarbeiros) : 1;
    
    const configEstMin = localStorage.getItem('configControlaEstoqueMinimo');
    configControlaEstoqueMinimo = configEstMin === 'true'; 

    const configQtdeMin = localStorage.getItem('configQtdeMinima');
    configQtdeMinima = configQtdeMin ? parseInt(configQtdeMin) : 5; 
    
    sincronizarConfiguracoesUI();
}

function salvarDados() {
    localStorage.setItem('estoqueDb', JSON.stringify(produtos));
}

function salvarDadosFila() {
    localStorage.setItem('filaClientesDb', JSON.stringify(filaClientes));
    renderizarTabelaFila(); 
}

function salvarDadosVendas() {
    localStorage.setItem('historicoVendasDb', JSON.stringify(vendas));
}

// --- Configurações ---

function salvarTodasConfiguracoes() {
    const tempoMedioInput = document.getElementById('configTempoMedio');
    const qtdBarbeirosInput = document.getElementById('configQtdBarbeiros'); 
    const qtdeMinInput = document.getElementById('configQtdeMinima');
    
    let novoTempoMedio = parseInt(tempoMedioInput.value);
    let novaQtdBarbeiros = parseInt(qtdBarbeirosInput.value);
    let novaQtdeMinima = parseInt(qtdeMinInput.value);

    if (isNaN(novoTempoMedio) || novoTempoMedio < 1) {
        novoTempoMedio = 1; 
        tempoMedioInput.value = 1;
    }
    if (isNaN(novaQtdBarbeiros) || novaQtdBarbeiros < 1) {
        novaQtdBarbeiros = 1; 
        qtdBarbeirosInput.value = 1;
    }
    if (isNaN(novaQtdeMinima) || novaQtdeMinima < 0) {
        novaQtdeMinima = 0; 
        qtdeMinInput.value = 0;
    }
    
    configTempoMedio = novoTempoMedio;
    configQtdBarbeiros = novaQtdBarbeiros;
    configQtdeMinima = novaQtdeMinima;
    
    localStorage.setItem('configTempoMedio', configTempoMedio.toString());
    localStorage.setItem('configQtdBarbeiros', configQtdBarbeiros.toString());
    localStorage.setItem('configQtdeMinima', configQtdeMinima.toString());
    
    sincronizarConfiguracoesUI();
    renderizarTabelaPrincipal(); 
    renderizarTabelaProdutos(); 
    
    showToast(`Configurações de Fila e Estoque salvas com sucesso!`, 'success');
}


function salvarConfigControlaFila(status) {
    configControlaFila = status;
    localStorage.setItem('configControlaFila', status ? 'true' : 'false');
    renderizarNavbar(); 
    sincronizarConfiguracoesUI();
}

function salvarTempoMedioAtendimento() {
    const input = document.getElementById('configTempoMedio');
    let valor = parseInt(input.value);
    if (isNaN(valor) || valor < 1) valor = 1; 
    configTempoMedio = valor;
}

function salvarQtdBarbeiros() {
    const input = document.getElementById('configQtdBarbeiros');
    let valor = parseInt(input.value);
    if (isNaN(valor) || valor < 1) valor = 1; 
    configQtdBarbeiros = valor;
}

function toggleControlaEstoqueMinimo(checked) {
    configControlaEstoqueMinimo = checked;
    localStorage.setItem('configControlaEstoqueMinimo', checked ? 'true' : 'false');
    sincronizarConfiguracoesUI();
    renderizarTabelaPrincipal(); 
    renderizarTabelaProdutos(); 
    showToast(`Controle de Estoque Mínimo ${checked ? 'ATIVADO' : 'DESATIVADO'}!`, checked ? 'success' : 'error');
}

function salvarEstoqueMinimo() {
    const input = document.getElementById('configQtdeMinima');
    let valor = parseInt(input.value);
    if (isNaN(valor) || valor < 0) valor = 0; 
    configQtdeMinima = valor;
}


function sincronizarConfiguracoesUI() {
    const checkboxFila = document.getElementById('configControlaFila');
    const filaContainer = document.getElementById('configFilaContainer');
    const tempoMedioInput = document.getElementById('configTempoMedio');
    const qtdBarbeirosInput = document.getElementById('configQtdBarbeiros'); 
    const displayTempoMedio = document.getElementById('displayTempoMedio');
    const displayQtdBarbeiros = document.getElementById('displayQtdBarbeiros');
    
    const checkboxEstMin = document.getElementById('configControlaEstoqueMinimo');
    const qtdeMinContainer = document.getElementById('configEstoqueMinimoContainer');
    const qtdeMinInput = document.getElementById('configQtdeMinima');
    
    if (checkboxFila) checkboxFila.checked = configControlaFila;
    if (filaContainer) filaContainer.style.display = configControlaFila ? 'block' : 'none';
    if (tempoMedioInput) tempoMedioInput.value = configTempoMedio;
    if (qtdBarbeirosInput) qtdBarbeirosInput.value = configQtdBarbeiros;
    if (displayTempoMedio) displayTempoMedio.textContent = configTempoMedio;
    if (displayQtdBarbeiros) displayQtdBarbeiros.textContent = configQtdBarbeiros;
    
    if (checkboxEstMin) checkboxEstMin.checked = configControlaEstoqueMinimo;
    if (qtdeMinContainer) qtdeMinContainer.style.display = configControlaEstoqueMinimo ? 'block' : 'none';
    if (qtdeMinInput) qtdeMinInput.value = configQtdeMinima;
}

function toggleControlaFila(checked) {
    salvarConfigControlaFila(checked);
    showToast(`Controle de Fila ${checked ? 'ATIVADO' : 'DESATIVADO'}!`, checked ? 'success' : 'error');
}


// --- UI: Notificações (Toasts) ---
function showToast(mensagem, tipo = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    const icon = tipo === 'success' ? '<i class="fa-solid fa-circle-check"></i>' : (tipo === 'error' ? '<i class="fa-solid fa-circle-xmark"></i>' : '<i class="fa-solid fa-circle-info"></i>');
    
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `${icon} <span>${mensagem}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)'; 
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- Navegação ---
function renderizarNavbar() {
    const navContainer = document.getElementById('navbar-nav-buttons');
    
    let filaBtn = document.getElementById('btnFilaChegada');
    if (filaBtn) filaBtn.remove();
    
    const configBtn = navContainer.querySelector('[onclick="navegar(\'TelaConfiguracoes\')"]');

    if (configControlaFila) {
        filaBtn = document.createElement('button');
        filaBtn.id = 'btnFilaChegada';
        filaBtn.className = 'nav-btn'; 
        filaBtn.setAttribute('onclick', "navegar('TelaFilaChegada')");
        filaBtn.innerHTML = '<i class="fa-solid fa-people-arrows"></i> Fila de chegada';

        navContainer.insertBefore(filaBtn, configBtn);
    }
    
    // Manter o botão ativo correto
    const currentScreen = document.querySelector('.screen.active')?.id;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    const activeBtn = Array.from(document.querySelectorAll('.nav-btn')).find(btn => 
        btn.getAttribute('onclick').includes(`('${currentScreen}')`)
    );
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

function navegar(telaId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(telaId).classList.add('active');
    
    const activeBtn = Array.from(document.querySelectorAll('.nav-btn')).find(btn => 
        btn.getAttribute('onclick').includes(`('${telaId}')`)
    );
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    if (telaId === 'TelaPrincipal') renderizarTabelaPrincipal();
    if (telaId === 'TelaVendas') renderizarTabelaVendas(); // NOVO
    if (telaId === 'TelaNovaVenda') iniciarNovaVenda(); // NOVO
    if (telaId === 'TelaProdutos') renderizarTabelaProdutos();
    if (telaId === 'TelaEstoque') {
        renderizarTabelaEstoque();
        resetarSelecaoEstoque();
    }
    if (telaId === 'TelaFilaChegada') {
        renderizarTabelaFila();
        resetarSelecaoFila();
    }
    if (telaId === 'TelaConfiguracoes') {
        sincronizarConfiguracoesUI();
    }
}

// --- Funções de Venda (NOVAS) ---

function iniciarNovaVenda() {
    // Reseta o estado temporário da venda
    itensVenda = [];
    document.getElementById('vendaCliente').value = '';
    document.getElementById('vendaFormaPagamento').value = '';
    document.getElementById('vendaAplicaDesconto').checked = false;
    document.getElementById('vendaDescontoInput').value = '0.00';
    document.getElementById('vendaDescontoInput').disabled = true;
    
    renderizarItensVenda();
    calcularTotalVenda();
}

function abrirModalSelecaoProduto() {
    // Renderiza a tabela de produtos disponíveis no modal
    renderizarTabelaSelecaoProduto();
    document.getElementById('modalSelecaoProduto').style.display = 'flex';
    document.getElementById('filtroModalProduto').focus();
}

function renderizarTabelaSelecaoProduto() {
    const tbody = document.querySelector('#tabelaSelecaoProduto tbody');
    const filtro = document.getElementById('filtroModalProduto').value.toLowerCase();
    tbody.innerHTML = '';

    const produtosDisponiveis = produtos.filter(p => 
        p.disponivel && p.qtde > 0 && p.descricao.toLowerCase().includes(filtro)
    );

    if (produtosDisponiveis.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#9ca3af;">Nenhum produto disponível em estoque ou encontrado.</td></tr>';
        return;
    }

    produtosDisponiveis.forEach(p => {
        const tr = document.createElement('tr');
        
        // Verifica se o produto já está na lista temporária para preencher a quantidade
        const itemVendaExistente = itensVenda.find(item => item.id === p.id);
        const qtdeInicial = itemVendaExistente ? itemVendaExistente.quantidade : 1;
        const precoAplicado = getPrecoVendaAplicado(p);

        tr.innerHTML = `
            <td>
                <input type="checkbox" class="check-produto-venda" value="${p.id}" ${itemVendaExistente ? 'checked' : ''}>
            </td>
            <td>${p.descricao}</td>
            <td>${formatarMoeda(precoAplicado)}</td>
            <td>${p.qtde}</td>
            <td>
                <input type="number" 
                       data-prod-id="${p.id}"
                       class="input-qtde-venda" 
                       min="1" 
                       max="${p.qtde}" 
                       value="${qtdeInicial}"
                       oninput="validarQtdeInput(this, ${p.qtde})">
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function validarQtdeInput(input, max) {
    let valor = parseInt(input.value);
    if (isNaN(valor) || valor < 1) {
        input.value = 1;
    } else if (valor > max) {
        input.value = max;
        showToast(`Quantidade máxima em estoque é ${max} para este item.`, 'error');
    }
}

function adicionarProdutosSelecionados() {
    const checkboxes = document.querySelectorAll('.check-produto-venda');
    const novosItens = [];
    let produtosAdicionados = 0;

    checkboxes.forEach(cb => {
        const prodId = parseInt(cb.value);
        const produtoOriginal = produtos.find(p => p.id === prodId);
        const qtdeInput = document.querySelector(`.input-qtde-venda[data-prod-id="${prodId}"]`);
        const quantidade = parseInt(qtdeInput.value);

        if (cb.checked) {
            if (produtoOriginal && quantidade > 0 && quantidade <= produtoOriginal.qtde) {
                const precoAplicado = getPrecoVendaAplicado(produtoOriginal);
                
                novosItens.push({
                    id: prodId,
                    descricao: produtoOriginal.descricao,
                    precoUnitario: precoAplicado, 
                    quantidade: quantidade,
                    // Guarda o percentual de desconto no momento da venda
                    descontoPercentualBase: produtoOriginal.descontoAtivo ? produtoOriginal.descontoPercentual : 0
                });
                produtosAdicionados++;
            } else if (produtoOriginal && quantidade > produtoOriginal.qtde) {
                showToast(`Falha ao adicionar ${produtoOriginal.descricao}: Quantidade excede o estoque.`, 'error');
            }
        }
    });

    // Substitui a lista de itensVenda pela nova lista construída
    itensVenda = novosItens; 
    
    if (produtosAdicionados > 0) {
        showToast(`${produtosAdicionados} produto(s) adicionado(s) à venda!`, 'primary');
    } else {
        showToast("Nenhum produto selecionado ou disponível.", 'error');
    }

    fecharModais();
    renderizarItensVenda();
    calcularTotalVenda();
}

function renderizarItensVenda() {
    const container = document.getElementById('itensVendaContainer');
    container.innerHTML = '';

    if (itensVenda.length === 0) {
        container.innerHTML = `
            <div class="empty-state-venda">
                <i class="fa-solid fa-basket-shopping"></i>
                <p>Nenhum produto adicionado.</p>
            </div>`;
        return;
    }
    
    itensVenda.forEach((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'item-venda';
        
        let infoDesconto = '';
        if (item.descontoPercentualBase > 0) {
            infoDesconto = `<span style="color:var(--btn-desconto-active);">(-${item.descontoPercentualBase.toFixed(2)}% base)</span>`;
        }

        itemEl.innerHTML = `
            <div class="item-venda-info">
                <span>${item.descricao} ${infoDesconto}</span>
                <span>${formatarMoeda(item.precoUnitario)} por unidade</span>
            </div>
            <div class="item-venda-actions">
                <input type="number" 
                       id="qtdeItemVenda-${index}" 
                       min="1" 
                       value="${item.quantidade}" 
                       oninput="atualizarQtdeItem(${index}, this.value)">
                <button class="btn-remover-item" onclick="removerItemVenda(${index})"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `;
        container.appendChild(itemEl);
    });
}

function atualizarQtdeItem(index, novaQtdeStr) {
    let novaQtde = parseInt(novaQtdeStr);
    const item = itensVenda[index];
    const produtoOriginal = produtos.find(p => p.id === item.id);
    
    if (!produtoOriginal) {
        removerItemVenda(index);
        return;
    }
    
    if (isNaN(novaQtde) || novaQtde < 1) {
        novaQtde = 1;
        document.getElementById(`qtdeItemVenda-${index}`).value = 1;
    } else if (novaQtde > produtoOriginal.qtde) {
        novaQtde = produtoOriginal.qtde;
        document.getElementById(`qtdeItemVenda-${index}`).value = produtoOriginal.qtde;
        showToast(`Estoque máximo atingido (${produtoOriginal.qtde}).`, 'error');
    }
    
    item.quantidade = novaQtde;
    calcularTotalVenda();
}

function removerItemVenda(index) {
    if (confirm(`Remover o item ${itensVenda[index].descricao} da venda?`)) {
        itensVenda.splice(index, 1);
        renderizarItensVenda();
        calcularTotalVenda();
        showToast("Produto removido da lista.", 'error');
    }
}

function toggleDescontoVenda(checked) {
    const input = document.getElementById('vendaDescontoInput');
    input.disabled = !checked;
    if (!checked) {
        input.value = '0.00';
    } else {
        input.focus();
    }
    calcularTotalVenda();
}

function calcularTotalVenda() {
    let subtotal = 0;
    itensVenda.forEach(item => {
        subtotal += item.precoUnitario * item.quantidade;
    });

    document.getElementById('vendaSubtotalDisplay').textContent = formatarMoeda(subtotal);
    
    const aplicaDesconto = document.getElementById('vendaAplicaDesconto').checked;
    let descontoPercentual = 0;
    
    if (aplicaDesconto) {
        descontoPercentual = parseFloat(document.getElementById('vendaDescontoInput').value) || 0;
        
        if (descontoPercentual < 0 || descontoPercentual > 100) {
            showToast("Desconto deve ser entre 0% e 100%.", 'error');
            descontoPercentual = 0;
            document.getElementById('vendaDescontoInput').value = '0.00';
        }
    }
    
    const valorDesconto = subtotal * (descontoPercentual / 100);
    const valorTotal = subtotal - valorDesconto;
    
    document.getElementById('vendaTotalDisplay').textContent = formatarMoeda(valorTotal);
    
    return { subtotal, valorDesconto, valorTotal, descontoPercentual };
}

function faturarVenda() {
    if (itensVenda.length === 0) {
        return showToast("Adicione pelo menos um produto para faturar a venda.", 'error');
    }

    const cliente = document.getElementById('vendaCliente').value.trim() || 'Cliente Não Identificado';
    const formaPagamento = document.getElementById('vendaFormaPagamento').value;

    if (!formaPagamento) {
        return showToast("Selecione a Forma de Pagamento.", 'error');
    }
    
    const { subtotal, valorDesconto, valorTotal, descontoPercentual } = calcularTotalVenda();

    // 1. Confirmação
    abrirModalConfirmacao(`Confirmar venda no valor total de **${formatarMoeda(valorTotal)}** para **${cliente}**?`, () => {
        
        // 2. Cria o registro de venda
        const novaVenda = {
            id: Date.now(),
            data: new Date().toISOString(),
            cliente: cliente,
            formaPagamento: formaPagamento,
            subtotal: subtotal,
            descontoPercentual: descontoPercentual,
            valorDesconto: valorDesconto,
            valorTotal: valorTotal,
            itens: itensVenda.map(item => ({
                id: item.id,
                descricao: item.descricao,
                quantidade: item.quantidade,
                precoUnitario: item.precoUnitario,
                descontoPercentualBase: item.descontoPercentualBase
            }))
        };
        
        vendas.unshift(novaVenda); // Adiciona no início (mais recente)
        salvarDadosVendas();

        // 3. Debita o estoque
        itensVenda.forEach(itemVenda => {
            const indexProduto = produtos.findIndex(p => p.id === itemVenda.id);
            if (indexProduto !== -1) {
                produtos[indexProduto].qtde -= itemVenda.quantidade;
            }
        });
        salvarDados(); // Salva o estoque atualizado

        // 4. Limpa e navega
        showToast(`Venda de ${formatarMoeda(valorTotal)} faturada com sucesso!`, 'success');
        navegar('TelaVendas');
    });
}

function renderizarTabelaVendas() {
    const tbody = document.querySelector('#tabelaVendas tbody');
    const msgVazio = document.getElementById('msgVazioVendas');
    tbody.innerHTML = '';
    
    const fCliente = document.getElementById('filtroVendasCliente').value.toLowerCase();
    const fPagamento = document.getElementById('filtroVendasPagamento').value.toLowerCase();
    
    const vendasFiltradas = vendas.filter(v => {
        const matchCliente = v.cliente.toLowerCase().includes(fCliente);
        const matchPagamento = v.formaPagamento.toLowerCase().includes(fPagamento);
        return matchCliente && matchPagamento;
    });

    if (vendasFiltradas.length === 0) {
        msgVazio.style.display = 'block';
    } else {
        msgVazio.style.display = 'none';
        
        vendasFiltradas.forEach(v => {
            const tr = document.createElement('tr');
            
            // Permite clicar na linha para ver detalhes
            tr.onclick = () => detalharVenda(v.id);
            tr.classList.add('selectable-row');
            
            // Formatando a data
            const dataVenda = new Date(v.data);
            const dataFormatada = dataVenda.toLocaleDateString('pt-BR') + ' ' + dataVenda.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            const itensDisplay = v.itens.map(i => `${i.quantidade}x ${i.descricao}`).join(', ');

            tr.innerHTML = `
                <td>${dataFormatada}</td>
                <td>${v.cliente}</td>
                <td>${itensDisplay}</td>
                <td>${v.formaPagamento}</td>
                <td><strong style="color: var(--success-color);">${formatarMoeda(v.valorTotal)}</strong></td>
                <td>
                    <button class="btn btn-secondary" style="padding: 5px 10px;" onclick="event.stopPropagation(); detalharVenda(${v.id})">
                        <i class="fa-solid fa-eye"></i> Detalhes
                    </button>
                    <button class="btn btn-warning" style="padding: 5px 10px;" onclick="event.stopPropagation(); abrirModalEdicaoVenda(${v.id})">
                        <i class="fa-solid fa-edit"></i> Editar
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

function detalharVenda(id) {
    const venda = vendas.find(v => v.id === id);
    if (!venda) return showToast("Venda não encontrada.", 'error');

    // Montar detalhes para o modal de confirmação genérico
    let detalhesHTML = `
        <h3 style="margin-top: 0; color: var(--primary-color);">Detalhes da Venda #${id}</h3>
        <p><strong>Cliente:</strong> ${venda.cliente}</p>
        <p><strong>Data:</strong> ${new Date(venda.data).toLocaleString('pt-BR')}</p>
        <p><strong>Pagamento:</strong> ${venda.formaPagamento}</p>
        <hr style="margin: 10px 0;">
        <p><strong>Subtotal:</strong> ${formatarMoeda(venda.subtotal)}</p>
        <p><strong>Desconto:</strong> ${venda.descontoPercentual.toFixed(2)}% (${formatarMoeda(venda.valorDesconto)})</p>
        <p style="font-size: 1.2rem; font-weight: 700; color: var(--success-color);">
            Valor Total: ${formatarMoeda(venda.valorTotal)}
        </p>
        <hr style="margin: 10px 0;">
        <p style="font-weight: 600;">Itens Vendidos:</p>
        <ul style="list-style-type: none; padding: 0; margin-top: 5px; text-align: left; max-height: 150px; overflow-y: auto; background-color: #f9fafb; padding: 10px; border-radius: 6px;">
    `;
    venda.itens.forEach(item => {
        detalhesHTML += `<li style="font-size: 0.95rem;">${item.quantidade}x ${item.descricao} (${formatarMoeda(item.precoUnitario)})</li>`;
    });
    detalhesHTML += `</ul>`;

    // Adiciona o botão de edição ao final dos detalhes
    detalhesHTML += `<button type="button" class="btn btn-warning full-width" style="margin-top: 15px;" onclick="fecharModais(); abrirModalEdicaoVenda(${venda.id})"><i class="fa-solid fa-edit"></i> Editar Cliente/Pagamento</button>`;


    // Reutiliza o modal de confirmação como modal de detalhes
    abrirModalConfirmacao(detalhesHTML, () => fecharModais()); 
    // Altera a ação do botão 'Sim' para 'Fechar' e muda o estilo
    document.getElementById('btnConfirmarAcao').innerHTML = '<i class="fa-solid fa-check"></i> Fechar';
    document.getElementById('btnConfirmarAcao').classList.remove('btn-danger');
    document.getElementById('btnConfirmarAcao').classList.add('btn-primary');
    
    // Esconde o botão de Cancelar (o botão de Edição faz a navegação)
    document.querySelector('#modalConfirmacao .confirm-actions button.btn-secondary').style.display = 'none';
}

function abrirModalEdicaoVenda(id) {
    const venda = vendas.find(v => v.id === id);
    if (!venda) return showToast("Venda não encontrada.", 'error');

    document.getElementById('edicaoVendaId').value = id;
    document.getElementById('edicaoVendaCliente').value = venda.cliente;
    document.getElementById('edicaoVendaFormaPagamento').value = venda.formaPagamento;
    document.getElementById('edicaoVendaTotalDisplay').textContent = formatarMoeda(venda.valorTotal);
    
    // Título do modal
    document.getElementById('modalEdicaoVendaTitle').innerHTML = `<i class="fa-solid fa-edit"></i> Editar Venda #${venda.id}`;

    document.getElementById('modalEdicaoVenda').style.display = 'flex';
}

function salvarEdicaoVenda(e) {
    e.preventDefault();
    
    const id = parseInt(document.getElementById('edicaoVendaId').value);
    const novoCliente = document.getElementById('edicaoVendaCliente').value.trim() || 'Cliente Não Identificado';
    const novaFormaPagamento = document.getElementById('edicaoVendaFormaPagamento').value;
    
    if (!novaFormaPagamento) {
        return showToast("Selecione uma Forma de Pagamento válida.", 'error');
    }
    
    const index = vendas.findIndex(v => v.id === id);
    if (index === -1) return showToast("Venda não encontrada para salvar.", 'error');
    
    vendas[index].cliente = novoCliente;
    vendas[index].formaPagamento = novaFormaPagamento;
    
    salvarDadosVendas();
    fecharModais();
    renderizarTabelaVendas();
    showToast(`Venda #${id} atualizada: Cliente e Forma de Pagamento alterados.`, 'success');
}


// --- Controle de Fila de Clientes ---

function registrarEntradaCliente() {
    const horaEntrada = new Date();
    const novoCliente = {
        id: Date.now(), 
        entrada: horaEntrada.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        timestamp: horaEntrada.getTime(),
        emAtendimento: false 
    };
    filaClientes.push(novoCliente);
    salvarDadosFila();
    resetarSelecaoFila();
    showToast(`Cliente #${filaClientes.length} entrou.`, 'success');
}

function registrarSaidaClienteSelecionado() {
    if (!clienteSelecionadoFilaId) {
        return showToast("Selecione um cliente na tabela para registrar a saída.", 'error');
    }
    
    const idParaRemover = clienteSelecionadoFilaId;
    const index = filaClientes.findIndex(c => c.id === idParaRemover);

    if (index !== -1) {
        filaClientes.splice(index, 1); 
        salvarDadosFila();
        resetarSelecaoFila(); 
        showToast(`Cliente removido da fila.`, 'success');
    } else {
        showToast("Erro: Cliente não encontrado.", 'error');
    }
}

function marcarEmAtendimento() {
    if (!clienteSelecionadoFilaId) {
        return showToast("Selecione um cliente na tabela para marcar.", 'error');
    }

    const cliente = filaClientes.find(c => c.id === clienteSelecionadoFilaId);
    
    if (cliente) {
        cliente.emAtendimento = !cliente.emAtendimento;
        salvarDadosFila();
        
        if (cliente.emAtendimento) {
            showToast(`Cliente #${filaClientes.findIndex(c => c.id === cliente.id) + 1} marcado como "Em atendimento".`, 'warning');
        } else {
            showToast(`Cliente #${filaClientes.findIndex(c => c.id === cliente.id) + 1} voltou para a fila.`, 'primary');
        }
        
        resetarSelecaoFila();
    }
}


function selecionarClienteFila(id, trElement) {
    document.querySelectorAll('#tabelaFila tbody tr').forEach(r => r.classList.remove('selected', 'atendimento'));
    
    trElement.classList.add('selected');
    clienteSelecionadoFilaId = id;
    
    document.getElementById('btnSaidaCliente').disabled = false;
    document.getElementById('btnEmAtendimento').disabled = false;
    
    const cliente = filaClientes.find(c => c.id === id);
    if (cliente && cliente.emAtendimento) {
        trElement.classList.add('atendimento'); 
        document.getElementById('btnEmAtendimento').innerHTML = '<i class="fa-solid fa-rotate-left"></i> Voltar à Fila';
    } else {
        document.getElementById('btnEmAtendimento').innerHTML = '<i class="fa-solid fa-handshake"></i> Em atendimento';
    }
}

function resetarSelecaoFila() {
    clienteSelecionadoFilaId = null;
    document.querySelectorAll('#tabelaFila tbody tr').forEach(r => r.classList.remove('selected', 'atendimento'));
    document.getElementById('btnSaidaCliente').disabled = true;
    document.getElementById('btnEmAtendimento').disabled = true;
    document.getElementById('btnEmAtendimento').innerHTML = '<i class="fa-solid fa-handshake"></i> Em atendimento';
}

function calcularPrevisao(clienteIndex, timestampEntrada, emAtendimento) {
    if (emAtendimento) {
        return 'Em atendimento';
    }
    
    const clientesEmEspera = filaClientes.filter(c => !c.emAtendimento);
    const posicaoNaFila = clientesEmEspera.findIndex(c => c.timestamp === timestampEntrada);

    if (posicaoNaFila === -1) {
        return '-'; 
    }
    
    const tempoMedioPorBarbeiroMs = (configTempoMedio * 60 * 1000) / configQtdBarbeiros;
    
    const totalTempoMs = (posicaoNaFila) * tempoMedioPorBarbeiroMs;
    
    const previsaoFimMs = new Date().getTime() + totalTempoMs;
    
    const dataPrevisao = new Date(previsaoFimMs);
    const hora = dataPrevisao.getHours().toString().padStart(2, '0');
    const minuto = dataPrevisao.getMinutes().toString().padStart(2, '0');

    if (totalTempoMs < 60000) {
        return 'Agora / Próximo';
    }

    return `${hora}:${minuto}`;
}

function renderizarTabelaFila() {
    const tbody = document.querySelector('#tabelaFila tbody');
    const msgFilaVazia = document.getElementById('msgFilaVazia');
    const contador = document.getElementById('contadorClientesAtual');
    const btnSaida = document.getElementById('btnSaidaCliente');
    const btnAtendimento = document.getElementById('btnEmAtendimento');
    
    sincronizarConfiguracoesUI(); 

    tbody.innerHTML = '';
    
    if (filaClientes.length === 0) {
        msgFilaVazia.style.display = 'block';
        btnSaida.disabled = true;
        btnAtendimento.disabled = true;
    } else {
        msgFilaVazia.style.display = 'none';
        
        filaClientes.forEach((c, index) => {
            const tr = document.createElement('tr');
            tr.onclick = () => selecionarClienteFila(c.id, tr); 
            
            if (c.id === clienteSelecionadoFilaId) {
                tr.classList.add('selected');
                btnSaida.disabled = false;
                btnAtendimento.disabled = false;
            }
            if (c.emAtendimento) {
                tr.classList.add('atendimento'); 
            }
            
            const previsao = calcularPrevisao(index, c.timestamp, c.emAtendimento);
            
            const iconeSelecao = c.id === clienteSelecionadoFilaId ? '<i class="fa-solid fa-check" style="color:var(--primary-color)"></i>' : '';
            
            tr.innerHTML = `
                <td>${iconeSelecao}</td> 
                <td>Cliente ${index + 1}</td>
                <td>${c.entrada}</td>
                <td>${previsao}</td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    contador.textContent = filaClientes.length;
}

function iniciarDecrementoPrevisao() {
    if (previsaoInterval) {
        clearInterval(previsaoInterval);
    }

    previsaoInterval = setInterval(() => {
        if (document.getElementById('TelaFilaChegada').classList.contains('active')) {
            renderizarTabelaFila();
        }
    }, 60000); 
}


// --- Funções de Estoque e Produtos ---

function getPrecoVendaAplicado(produto) {
    if (produto.descontoAtivo && produto.descontoPercentual > 0) {
        const desconto = produto.valorVenda * (produto.descontoPercentual / 100);
        return produto.valorVenda - desconto;
    }
    return produto.valorVenda;
}

function filtrarProdutosPrincipal() {
    const fDesc = document.getElementById('filtroPrincipalDescricao').value.toLowerCase();
    const fObs = document.getElementById('filtroPrincipalObs').value.toLowerCase();
    const fQtd = document.getElementById('filtroPrincipalQtd').value;
    
    return produtos.filter(p => {
        const matchDisponivel = p.disponivel === true; 
        const matchDesc = p.descricao.toLowerCase().includes(fDesc);
        const matchObs = p.obs.toLowerCase().includes(fObs);
        const matchQtd = fQtd ? p.qtde >= fQtd : true;
        
        return matchDisponivel && matchDesc && matchObs && matchQtd;
    });
}

function renderizarTabelaPrincipal() {
    const tbody = document.querySelector('#tabelaPrincipal tbody');
    const msgVazio = document.getElementById('msgVazioPrincipal');
    tbody.innerHTML = '';

    const filtrados = filtrarProdutosPrincipal();

    if (filtrados.length === 0) {
        msgVazio.style.display = 'block';
    } else {
        msgVazio.style.display = 'none';
        filtrados.forEach(p => {
            
            let iconeEstoqueMinimo = '';
            let iconeDesconto = '';
            const precoAplicado = getPrecoVendaAplicado(p);
            
            if (configControlaEstoqueMinimo && p.qtde <= configQtdeMinima) {
                const mensagem = `Atenção! Estoque baixo. A quantidade mínima configurada é ${configQtdeMinima}. Estoque atual: ${p.qtde}.`;
                iconeEstoqueMinimo = `
                    <span class="status-icon estoque-alerta">
                        <i class="fa-solid fa-exclamation-circle"></i>
                        <span class="tooltip-text">${mensagem}</span>
                    </span>
                `;
            }
            
            if (p.descontoAtivo && p.descontoPercentual > 0) {
                const descMsg = `Desconto de ${p.descontoPercentual.toFixed(2)}% ativo. Preço base: ${formatarMoeda(p.valorVenda)}`;
                iconeDesconto = `
                    <span class="status-icon desconto-ativo">
                        <i class="fa-solid fa-dollar-sign"></i>
                        <span class="tooltip-text">${descMsg}</span>
                    </span>
                `;
            }
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${p.qtde}</strong></td>
                <td>
                    ${p.descricao} 
                    ${iconeEstoqueMinimo} 
                    ${iconeDesconto}
                </td>
                <td>${p.obs}</td>
                <td>${formatarMoeda(precoAplicado)}</td>
                <td>
                    <button class="btn-venda-rapida" onclick="realizarVendaRapida(${p.id})">
                        <i class="fa-solid fa-cart-shopping"></i> Venda
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

function realizarVendaRapida(id) {
    const produto = produtos.find(p => p.id === id);
    if (produto) {
        if (produto.qtde > 0) {
            
            // 1. Cria o registro de venda
            const precoAplicado = getPrecoVendaAplicado(produto);
            const novaVenda = {
                id: Date.now(),
                data: new Date().toISOString(),
                cliente: 'Venda Rápida',
                formaPagamento: 'Dinheiro',
                subtotal: precoAplicado,
                descontoPercentual: produto.descontoAtivo ? produto.descontoPercentual : 0,
                valorDesconto: produto.descontoAtivo ? produto.valorVenda * (produto.descontoPercentual / 100) : 0,
                valorTotal: precoAplicado,
                itens: [{
                    id: produto.id,
                    descricao: produto.descricao,
                    quantidade: 1,
                    precoUnitario: precoAplicado,
                    descontoPercentualBase: produto.descontoAtivo ? produto.descontoPercentual : 0
                }]
            };
            
            vendas.unshift(novaVenda);
            salvarDadosVendas();
            
            // 2. Debita o estoque
            produto.qtde--;
            salvarDados(); 
            
            renderizarTabelaPrincipal();
            renderizarTabelaEstoque(); 
            showToast(`Venda rápida registrada: 1x ${produto.descricao}`, 'success');
        } else {
            showToast("Erro: Estoque insuficiente!", 'error');
        }
    }
}

function filtrarProdutosCadastro() {
    const fDesc = document.getElementById('filtroProdutosDescricao').value.toLowerCase();
    const fObs = document.getElementById('filtroProdutosObs').value.toLowerCase();
    
    const fEstoqueMinimoChecked = document.getElementById('filtroEstoqueMinimo').checked;

    return produtos.filter(p => {
        const matchDesc = p.descricao.toLowerCase().includes(fDesc);
        const matchObs = p.obs.toLowerCase().includes(fObs);
        
        let matchEstoqueMinimo = true;

        if (configControlaEstoqueMinimo && fEstoqueMinimoChecked) {
            matchEstoqueMinimo = (p.qtde <= configQtdeMinima);
        }
        
        return matchDesc && matchObs && matchEstoqueMinimo;
    });
}

function calcularValorVenda() {
    const valorCompraInput = document.getElementById('prodValorCompra');
    const markupInput = document.getElementById('prodMarkup');
    const valorVendaInput = document.getElementById('prodValorVenda');

    const valorCompra = parseFloat(valorCompraInput.value) || 0;
    const markup = parseFloat(markupInput.value) || 0;
    
    if (valorCompra <= 0 && markup <= 0) {
        valorVendaInput.value = '0.00';
        return; 
    }

    const valorSugerido = valorCompra * (1 + (markup / 100));
    
    valorVendaInput.value = valorSugerido.toFixed(2);
}

function abrirModalProduto(id) {
    const modal = document.getElementById('modalProduto');
    const titulo = document.getElementById('modalProdutoTitle');
    
    document.getElementById('prodId').value = ''; 
    document.getElementById('prodDescricao').value = '';
    document.getElementById('prodObs').value = '';
    document.getElementById('prodQtde').value = '0'; 
    document.getElementById('prodQtde').disabled = false;
    document.getElementById('prodDisponivel').checked = true;
    
    document.getElementById('prodValorCompra').value = '0.00';
    document.getElementById('prodMarkup').value = '0';
    document.getElementById('prodValorVenda').value = '0.00'; 
    
    titulo.innerText = "Novo Produto";

    if (id) {
        const produto = produtos.find(p => p.id === id);
        if (!produto) return showToast('Produto não encontrado para edição.', 'error');

        titulo.innerText = `Editar Produto: ${produto.descricao}`;
        document.getElementById('prodId').value = id;
        document.getElementById('prodDescricao').value = produto.descricao;
        document.getElementById('prodObs').value = produto.obs;
        document.getElementById('prodQtde').value = produto.qtde;
        document.getElementById('prodQtde').disabled = true;
        document.getElementById('prodDisponivel').checked = produto.disponivel;
        
        document.getElementById('prodValorCompra').value = produto.valorCompra.toFixed(2);
        document.getElementById('prodMarkup').value = produto.markup.toFixed(2);
        document.getElementById('prodValorVenda').value = produto.valorVenda.toFixed(2);
        
        showToast("Editando: A quantidade deve ser alterada na aba 'Estoque'.", 'error');

    }

    modal.style.display = 'flex';
    setTimeout(() => document.getElementById('prodDescricao').focus(), 100);
}

function salvarProduto(e) {
    e.preventDefault();
    
    const id = document.getElementById('prodId').value;
    const descricao = document.getElementById('prodDescricao').value;
    const disponivel = document.getElementById('prodDisponivel').checked;

    const valorCompra = parseFloat(document.getElementById('prodValorCompra').value) || 0.00;
    const markup = parseFloat(document.getElementById('prodMarkup').value) || 0;
    const valorVenda = parseFloat(document.getElementById('prodValorVenda').value);

    if (isNaN(valorVenda)) {
         return showToast("Valor de Venda inválido.", "error");
    }
    
    const dadosComuns = {
        descricao: descricao,
        obs: document.getElementById('prodObs').value,
        valorCompra: valorCompra,
        markup: markup,
        valorVenda: valorVenda,
        disponivel: disponivel
    };


    if (id) {
        const index = produtos.findIndex(p => p.id === parseInt(id));
        if (index !== -1) {
            Object.assign(produtos[index], dadosComuns);
            showToast("Produto atualizado com sucesso!", 'success');
        }
    } else {
        const quantidade = parseInt(document.getElementById('prodQtde').value) || 0;
        const novoProduto = {
            id: Date.now(),
            qtde: quantidade,
            descontoAtivo: false,
            descontoPercentual: 0.00,
            ...dadosComuns
        };
        produtos.push(novoProduto);
        showToast("Produto adicionado com sucesso!", 'success');
    }

    salvarDados(); 
    fecharModais();
    renderizarTabelaProdutos();
    renderizarTabelaPrincipal(); 
    renderizarTabelaEstoque(); 
}

function abrirModalDescontoProduto(id) {
    const produto = produtos.find(p => p.id === id);
    if (!produto) return showToast('Produto não encontrado.', 'error');

    document.getElementById('descontoProdId').value = id;
    document.getElementById('descontoProdutoNome').innerText = `Produto: ${produto.descricao}`;
    document.getElementById('descontoAtivo').checked = produto.descontoAtivo;
    document.getElementById('descontoPercentual').value = produto.descontoPercentual.toFixed(2);
    document.getElementById('valorVendaBase').innerText = formatarMoeda(produto.valorVenda);

    document.getElementById('descontoPercentual').disabled = !produto.descontoAtivo;

    document.getElementById('modalDescontoProduto').style.display = 'flex';
}

function aplicarDesconto(e) {
    e.preventDefault();
    
    const id = parseInt(document.getElementById('descontoProdId').value);
    const ativo = document.getElementById('descontoAtivo').checked;
    const percentualInput = document.getElementById('descontoPercentual');
    let percentual = parseFloat(percentualInput.value) || 0;
    
    const produto = produtos.find(p => p.id === id);
    if (!produto) return;

    if (ativo && (percentual < 0 || percentual > 100)) {
        return showToast("O percentual deve estar entre 0 e 100.", "error");
    }
    
    produto.descontoAtivo = ativo;
    produto.descontoPercentual = ativo ? percentual : 0.00; 

    salvarDados();
    fecharModais();
    renderizarTabelaProdutos();
    renderizarTabelaPrincipal();
    renderizarTabelaEstoque(); 
    
    if (ativo && percentual > 0) {
        showToast(`Desconto de ${percentual.toFixed(2)}% ATIVADO para ${produto.descricao}`, 'success');
    } else {
        showToast(`Desconto DESATIVADO para ${produto.descricao}`, 'error');
    }
}

function controlarVisibilidadeBotaoExcluir() {
    const numSelecionados = document.querySelectorAll('.check-produto:checked').length;
    const btnExcluir = document.getElementById('btnExcluirMassa');
    
    if (numSelecionados > 0) {
        btnExcluir.style.display = 'inline-flex';
    } else {
        btnExcluir.style.display = 'none';
    }
}

function renderizarTabelaProdutos() {
    const tbody = document.querySelector('#tabelaProdutosLista tbody');
    const msgVazio = document.getElementById('msgVazioProdutos');
    const tableEl = document.getElementById('tabelaProdutosLista');
    const containerFiltro = document.getElementById('containerFiltroEstoqueMinimo');

    tbody.innerHTML = '';
    
    if (containerFiltro) {
        if (configControlaEstoqueMinimo) {
            containerFiltro.style.display = 'flex';
        } else {
            containerFiltro.style.display = 'none';
            document.getElementById('filtroEstoqueMinimo').checked = false; 
        }
    }

    const produtosFiltrados = filtrarProdutosCadastro();

    if (produtosFiltrados.length === 0) {
        msgVazio.style.display = 'block';
        tableEl.style.display = 'none';
        document.getElementById('btnExcluirMassa').style.display = 'none';
    } else {
        msgVazio.style.display = 'none';
        tableEl.style.display = 'table';
        controlarVisibilidadeBotaoExcluir();

        produtosFiltrados.forEach(p => {
            const tr = document.createElement('tr');
            tr.classList.add('selectable-row'); 
            
            tr.onclick = (e) => {
                if (e.target.type !== 'checkbox' && !e.target.closest('button')) {
                    abrirModalProduto(p.id);
                }
            };
            
            const btnClass = p.descontoAtivo && p.descontoPercentual > 0 ? 'btn-warning-desconto' : 'btn-warning';
            const btnIcon = p.descontoAtivo && p.descontoPercentual > 0 ? '<i class="fa-solid fa-tag"></i>' : '<i class="fa-solid fa-percent"></i>';
            const btnDesconto = `
                <button class="btn ${btnClass}" style="padding: 5px 10px;" onclick="event.stopPropagation(); abrirModalDescontoProduto(${p.id})">
                    ${btnIcon}
                </button>
            `;
            
            const precoAplicado = getPrecoVendaAplicado(p);
            let precoDisplay = formatarMoeda(precoAplicado);
            if (p.descontoAtivo && p.descontoPercentual > 0) {
                precoDisplay = `<span style="font-weight: 700; color: var(--btn-desconto-active);">${precoDisplay}</span>`;
            }

            tr.innerHTML = `
                <td style="text-align:center;">
                    <input type="checkbox" class="check-produto" value="${p.id}" onchange="event.stopPropagation(); controlarVisibilidadeBotaoExcluir()">
                </td>
                <td>${p.descricao}</td>
                <td>${p.obs}</td>
                <td>${precoDisplay}</td>
                <td>${p.disponivel ? '<span style="color:var(--success-color)">Sim</span>' : '<span style="color:var(--danger-color)">Não</span>'}</td>
                <td style="display: flex; gap: 5px; justify-content: flex-end;">
                    ${btnDesconto}
                    <button class="btn btn-danger" style="padding: 5px 10px;" onclick="event.stopPropagation(); confirmarExclusaoUnica(${p.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

function toggleSelecionarTodos() {
    const master = document.getElementById('checkAll');
    document.querySelectorAll('.check-produto').forEach(c => c.checked = master.checked);
    controlarVisibilidadeBotaoExcluir();
}

function confirmarExclusaoUnica(id) {
    const produto = produtos.find(p => p.id === id);
    if (!produto) return;
    
    abrirModalConfirmacao(`Deseja realmente excluir o produto **${produto.descricao}**?`, () => {
        produtos = produtos.filter(p => p.id !== id);
        salvarDados(); 
        renderizarTabelaProdutos();
        renderizarTabelaPrincipal();
        renderizarTabelaEstoque(); 
        showToast("Produto excluído.");
    });
}

function confirmarExclusaoMassa() {
    const checkboxes = document.querySelectorAll('.check-produto:checked');
    const idsParaExcluir = Array.from(checkboxes).map(c => parseInt(c.value));

    if (idsParaExcluir.length === 0) {
        return showToast("Selecione pelo menos um produto.", "error");
    }

    abrirModalConfirmacao(`Excluir **${idsParaExcluir.length}** produto(s) selecionado(s)?`, () => {
        produtos = produtos.filter(p => !idsParaExcluir.includes(p.id));
        salvarDados(); 
        renderizarTabelaProdutos();
        renderizarTabelaPrincipal();
        renderizarTabelaEstoque(); 
        showToast(`${idsParaExcluir.length} produtos removidos.`);
    });
}

function exportarCSV() {
    if (produtos.length === 0) return showToast("Nada para exportar.", "error");
    
    let csv = "ID,Descricao,Observacao,ValorCompra,Markup,ValorVenda(Base),ValorVenda(Final),Qtde,Disponivel,DescontoAtivo,DescontoPercentual\n";
    produtos.forEach(p => {
        const precoVendaFinal = getPrecoVendaAplicado(p);
        
        csv += `${p.id},"${p.descricao}","${p.obs}",${p.valorCompra.toFixed(2)},${p.markup.toFixed(2)},${p.valorVenda.toFixed(2)},${precoVendaFinal.toFixed(2)},${p.qtde},${p.disponivel ? 'Sim' : 'Não'},${p.descontoAtivo ? 'Sim' : 'Não'},${p.descontoPercentual.toFixed(2)}\n`;
    });
    
    const link = document.createElement("a");
    link.href = "data:text/csv;charset=utf-8," + encodeURI(csv);
    link.download = `estoque_${new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')}.csv`;
    link.click();
    showToast("Download do CSV iniciado!");
}

function exportarPDF() {
    if (produtos.length === 0) return showToast("Nada para exportar.", "error");
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.text("Relatório de Estoque", 14, 15);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 22);
    
    const linhas = produtos.map(p => {
        const precoVendaFinal = getPrecoVendaAplicado(p);
        const precoStr = p.descontoAtivo && p.descontoPercentual > 0 
            ? `${formatarMoeda(precoVendaFinal)} (-${p.descontoPercentual.toFixed(2)}%)` 
            : formatarMoeda(precoVendaFinal);
        
        return [
            p.descricao,
            p.obs,
            formatarMoeda(p.valorCompra),
            p.markup.toFixed(2) + '%',
            precoStr,
            p.qtde,
            p.disponivel ? 'Sim' : 'Não'
        ];
    });
    
    doc.autoTable({
        head: [["Descrição", "Obs", "V. Compra", "Markup", "V. Venda", "Qtd", "Disp."]],
        body: linhas,
        startY: 28,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] }
    });
    
    doc.save("relatorio_estoque.pdf");
    showToast("PDF gerado com sucesso!");
}

function renderizarTabelaEstoque() {
    const tbody = document.querySelector('#tabelaEstoque tbody');
    const msg = document.getElementById('msgVazioEstoque');
    tbody.innerHTML = '';
    
    if (produtos.length === 0) {
        msg.style.display = 'block';
    } else {
        msg.style.display = 'none';
        produtos.forEach(p => {
            
            const precoUnitario = getPrecoVendaAplicado(p);
            const valorTotalEstoque = p.qtde * precoUnitario;
            
            const tr = document.createElement('tr');
            tr.onclick = () => selecionarProdutoEstoque(p.id, tr);
            tr.classList.toggle('selected', p.id === produtoSelecionadoId); 

            tr.innerHTML = `
                <td>#${p.id}</td>
                <td>${p.descricao}</td>
                <td><strong>${p.qtde}</strong></td>
                <td><strong>${formatarMoeda(valorTotalEstoque)}</strong></td>
                <td>${p.qtde > 0 ? '<span style="color:var(--success-color)">Disponível</span>' : '<span style="color:var(--danger-color)">Esgotado</span>'}</td>
            `;
            tbody.appendChild(tr);
        });
    }
}

function selecionarProdutoEstoque(id, tr) {
    document.querySelectorAll('#tabelaEstoque tr').forEach(r => r.classList.remove('selected'));
    
    tr.classList.add('selected');
    produtoSelecionadoId = id;
    
    document.getElementById('btnEntrada').disabled = false;
    document.getElementById('btnSaida').disabled = false;
}

function resetarSelecaoEstoque() {
    produtoSelecionadoId = null;
    document.getElementById('btnEntrada').disabled = true;
    document.getElementById('btnSaida').disabled = true;
    document.querySelectorAll('#tabelaEstoque tr').forEach(r => r.classList.remove('selected'));
}

function abrirModalMovimentacao(tipo) {
    if (!produtoSelecionadoId) return;
    
    const p = produtos.find(x => x.id === produtoSelecionadoId);
    const modal = document.getElementById('modalMovimento');
    const titulo = document.getElementById('tituloMovimento');
    const inputTipo = document.getElementById('movimentoTipo');
    
    modal.style.display = 'flex';
    document.getElementById('produtoMovimentoNome').innerText = `${p.descricao} (Atual: ${p.qtde})`;
    inputTipo.value = tipo;
    
    const qtdInput = document.getElementById('movimentoQtd');
    qtdInput.value = '';
    
    if (tipo === 'entrada') {
        titulo.innerText = "Registrar Entrada";
        titulo.style.color = "var(--success-color)";
    } else {
        titulo.innerText = "Registrar Saída";
        titulo.style.color = "var(--danger-color)";
    }
    
    setTimeout(() => qtdInput.focus(), 100);
}

function salvarMovimentacao(e) {
    e.preventDefault();
    const tipo = document.getElementById('movimentoTipo').value;
    const qtd = parseInt(document.getElementById('movimentoQtd').value);
    const p = produtos.find(x => x.id === produtoSelecionadoId);
    
    if (isNaN(qtd) || qtd <= 0) return showToast("Quantidade inválida.", "error");

    if (tipo === 'entrada') {
        p.qtde += qtd;
        showToast("Entrada registrada!");
    } else {
        if (p.qtde < qtd) return showToast("Estoque insuficiente para essa saída.", "error");
        p.qtde -= qtd;
        showToast("Saída registrada!");
    }

    salvarDados(); 
    fecharModais();
    renderizarTabelaEstoque();
    renderizarTabelaPrincipal(); 
    resetarSelecaoEstoque(); 
}


// --- Funções de Backup e Restauração ---

function exportarBackupJson() {
    const backupData = {
        estoqueDb: localStorage.getItem('estoqueDb'),
        filaClientesDb: localStorage.getItem('filaClientesDb'),
        historicoVendasDb: localStorage.getItem('historicoVendasDb'), // NOVO
        
        configControlaFila: localStorage.getItem('configControlaFila'),
        configTempoMedio: localStorage.getItem('configTempoMedio'),
        configQtdBarbeiros: localStorage.getItem('configQtdBarbeiros'),
        
        configControlaEstoqueMinimo: localStorage.getItem('configControlaEstoqueMinimo'),
        configQtdeMinima: localStorage.getItem('configQtdeMinima')
    };

    const jsonString = JSON.stringify(backupData, null, 2); 
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.download = `backup_estoquePro_${timestamp}.json`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a); 
    URL.revokeObjectURL(url);
    
    showToast("Backup (JSON) exportado com sucesso!", 'success');
}

function confirmarImportacaoDados() {
    const fileInput = document.getElementById('importFileInput');
    const file = fileInput.files[0];

    if (!file) {
        return showToast("Selecione um arquivo .json de backup para importar.", "error");
    }
    
    abrirModalConfirmacao("A importação irá **SOBRESCREVER** todos os dados atuais do sistema. Continuar?", () => {
        importarBackupJson(file);
    });
}

function importarBackupJson(file) {
    const reader = new FileReader();

    reader.onload = function(event) {
        try {
            const data = JSON.parse(event.target.result);

            if (!data.estoqueDb) {
                return showToast("Arquivo de backup inválido ou incompleto.", "error");
            }
            
            localStorage.clear(); 
            
            for (const key in data) {
                if (data[key] !== null) {
                    localStorage.setItem(key, data[key]);
                }
            }
            
            showToast("Dados importados com sucesso! Recarregando sistema...", "success");
            setTimeout(() => {
                location.reload(); 
            }, 1000);

        } catch (e) {
            console.error(e);
            showToast("Erro ao processar o arquivo JSON. Verifique o formato.", "error");
        }
    };

    reader.onerror = function() {
        showToast("Erro ao ler o arquivo.", "error");
    };

    reader.readAsText(file);
}


// --- Utils & Modal Genérico ---
let acaoConfirmacaoAtual = null;

function abrirModalConfirmacao(texto, callback) {
    document.getElementById('textoConfirmacao').innerHTML = texto;
    document.getElementById('modalConfirmacao').style.display = 'flex';
    acaoConfirmacaoAtual = callback;
    
    const btnSim = document.getElementById('btnConfirmarAcao');
    btnSim.classList.remove('btn-primary');
    btnSim.classList.add('btn-danger');
    btnSim.innerHTML = '<i class="fa-solid fa-check"></i> Sim, Confirmar';
    
    // Mostra o botão de Cancelar (pode ter sido escondido pela função detalharVenda)
    document.querySelector('#modalConfirmacao .confirm-actions button.btn-secondary').style.display = 'inline-flex';

    btnSim.onclick = function() {
        if (acaoConfirmacaoAtual) acaoConfirmacaoAtual();
        fecharModais();
    };
}

function fecharModais() {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
}

function confirmarLimpezaDados() {
    abrirModalConfirmacao("Atenção: Isso apagará TODOS os produtos, estoque, a fila de clientes, histórico de vendas e configurações. Continuar?", () => {
        localStorage.clear(); 
        
        produtos = [];
        vendas = []; // NOVO
        filaClientes = [];
        configControlaFila = false;
        configTempoMedio = 30; 
        configQtdBarbeiros = 1; 
        configControlaEstoqueMinimo = false; 
        configQtdeMinima = 5; 
        location.reload();
    });
}

function formatarMoeda(val) {
    if (typeof val !== 'number') return 'R$ 0,00';
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

window.onclick = function(e) {
    if (e.target.classList.contains('modal')) fecharModais();
}