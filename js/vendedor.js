/**
 * CACAU DEL SHOW - REVENDA CACAU SHOW
 * Portal do Vendedor (PDV Mobile) com Autenticação Individual
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Verificação de Acesso / Guarda de Rota
  const usuarioLogado = sheetsDB.exigirAutenticacao(); // Aceita 'vendedor' ou 'admin'
  if (!usuarioLogado) return; // Redirecionado para login.html

  // Identificação do Vendedor Atual
  let vendedorAtivoId = usuarioLogado.id;
  if (usuarioLogado.perfil === 'admin') {
    // Se o admin entrar na tela do vendedor para testar, usa o vendedor salvo ou o primeiro
    vendedorAtivoId = localStorage.getItem('cacaudelshow_current_vendor') || 'VEND-001';
  }

  // Elementos do DOM
  const vendedorNomeDisplay = document.getElementById('vendedor-nome-display');
  const statSaldoMaos = document.getElementById('stat-saldo-maos');
  const statTotalRetirado = document.getElementById('stat-total-retirado');
  const statTotalVendido = document.getElementById('stat-total-vendido');
  const statFaturamento = document.getElementById('stat-faturamento');

  const vendedorStatusDot = document.getElementById('vendedor-status-dot');
  const vendedorStatusText = document.getElementById('vendedor-status-text');
  const btnSyncVendedor = document.getElementById('btn-sync-vendedor');
  const btnVendedorLogout = document.getElementById('btn-vendedor-logout');
  const btnTrocarVendedor = document.getElementById('btn-trocar-vendedor');

  // Abas
  const tabBtns = document.querySelectorAll('.seller-tab-btn');
  const sections = document.querySelectorAll('.seller-section');

  // Aba Sacola
  const listaSacola = document.getElementById('lista-sacola-vendedor');
  const btnAtalhoPegarEstoque = document.getElementById('btn-atalho-pegar-estoque');

  // Aba Retirar do Estoque
  const tbodyRetiradaEstoque = document.getElementById('tbody-retirada-estoque');
  const inputSearchEstoque = document.getElementById('vendedor-search-estoque');

  // Aba Venda Rápida
  const formVendaRapida = document.getElementById('form-venda-rapida');
  const vendaSelectProduto = document.getElementById('venda-select-produto');
  const vendaSaldoAviso = document.getElementById('venda-saldo-aviso');
  const vendaInputQtd = document.getElementById('venda-input-qtd');
  const vendaInputUnitario = document.getElementById('venda-input-unitario');
  const vendaSelectPgto = document.getElementById('venda-select-pgto');
  const vendaTotalCalculado = document.getElementById('venda-total-calculado');

  // Aba Histórico
  const tbodyMeuHistorico = document.getElementById('tbody-meu-historico');

  // Modal Devolução
  const modalDevolver = document.getElementById('modal-devolver');
  const devProdutoNome = document.getElementById('dev-produto-nome');
  const devInputQtd = document.getElementById('dev-input-qtd');
  const devMaxAviso = document.getElementById('dev-max-aviso');
  const modalDevConfirmar = document.getElementById('modal-dev-confirmar');
  const modalDevFechar = document.getElementById('modal-dev-fechar');
  const modalDevCancelar = document.getElementById('modal-dev-cancelar');

  let produtoDevolucao = null;
  let appData = { produtos: [], vendedores: [], retiradas: [], vendas: [] };

  // Logout
  function encerrarSessao() {
    if (confirm('Deseja realmente sair?')) {
      sheetsDB.fazerLogout();
    }
  }

  btnVendedorLogout?.addEventListener('click', encerrarSessao);
  btnTrocarVendedor?.addEventListener('click', encerrarSessao);

  // -------------------------------------------------------------
  // CARREGAR DADOS & INICIALIZAR VENDEDOR
  // -------------------------------------------------------------
  async function carregarDados(notificar = false) {
    atualizarStatusHeader();
    try {
      const data = await sheetsDB.getAllData();
      appData = data;

      atualizarPainelVendedor();
      atualizarStatusHeader(data.fromSheets);

      if (notificar) {
        showToast('Dados sincronizados com sucesso!', 'success');
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      showToast('Falha na comunicação de dados.', 'danger');
    }
  }

  function atualizarStatusHeader(conectadoGoogle = null) {
    const hasUrl = sheetsDB.isConnectedToSheets();
    if (conectadoGoogle === true) {
      vendedorStatusDot.className = 'status-dot connected';
      vendedorStatusText.textContent = 'Planilha Conectada';
    } else if (hasUrl) {
      vendedorStatusDot.className = 'status-dot connected';
      vendedorStatusText.textContent = 'Google Planilhas';
    } else {
      vendedorStatusDot.className = 'status-dot';
      vendedorStatusText.textContent = 'Modo Local';
    }
  }

  function obterVendedorAtual() {
    return (appData.vendedores || []).find(v => String(v.id) === String(vendedorAtivoId)) || {
      id: vendedorAtivoId,
      nome: usuarioLogado.nome || 'Vendedor'
    };
  }

  function atualizarPainelVendedor() {
    const vendedor = obterVendedorAtual();
    vendedorNomeDisplay.textContent = `Vendedor(a): ${vendedor.nome}`;

    const sacola = sheetsDB.calcularSacolaVendedor(vendedorAtivoId, appData);

    const retiradasVend = (appData.retiradas || []).filter(r => String(r.vendedorId) === String(vendedorAtivoId));
    const vendasVend = (appData.vendas || []).filter(v => String(v.vendedorId) === String(vendedorAtivoId));

    const totalRetirado = retiradasVend.reduce((sum, r) => sum + (Number(r.quantidade) || 0), 0);
    const totalVendido = vendasVend.reduce((sum, v) => sum + (Number(v.quantidade) || 0), 0);
    const totalFaturamento = vendasVend.reduce((sum, v) => sum + (Number(v.valorTotal) || 0), 0);
    const saldoEmMaos = Math.max(0, totalRetirado - totalVendido);

    statSaldoMaos.textContent = `${saldoEmMaos} un`;
    statTotalRetirado.textContent = `${totalRetirado} un`;
    statTotalVendido.textContent = `${totalVendido} un`;
    statFaturamento.textContent = formatarMoeda(totalFaturamento);

    renderizarSacola(sacola);
    renderizarTabelaRetiradaEstoque();
    popularSelectProdutoVenda(sacola);
    renderizarMeuHistorico(retiradasVend, vendasVend);
  }

  // -------------------------------------------------------------
  // ABA 1: MINHA SACOLA (ESTOQUE EM MÃOS)
  // -------------------------------------------------------------
  function renderizarSacola(sacola) {
    const itensComSaldo = sacola.filter(item => item.saldo > 0);

    if (itensComSaldo.length === 0) {
      listaSacola.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem; background: var(--surface-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-light);">
          <div style="font-size: 3rem; margin-bottom: 0.5rem;">🛍️</div>
          <h3 style="color: var(--cacao-dark); margin-bottom: 0.5rem;">Sua sacola está vazia</h3>
          <p style="margin-bottom: 1.5rem; font-size: 0.9rem;">Você não possui nenhum chocolate retirado do estoque geral no momento.</p>
          <button type="button" class="btn btn-primary" id="btn-pegar-agora">
            📦 Pegar Chocolates Cacau Show
          </button>
        </div>
      `;
      document.getElementById('btn-pegar-agora')?.addEventListener('click', () => {
        ativarAba('vtab-retirar');
      });
      return;
    }

    listaSacola.innerHTML = itensComSaldo.map(item => {
      return `
        <article class="bag-item-card">
          <div class="bag-item-info">
            <img src="${item.imagem}" alt="${item.nome}" onerror="this.src='assets/images/trufa-70.svg'">
            <div>
              <h4 style="font-size: 1.05rem; color: var(--cacao-dark); margin-bottom: 0.2rem;">${item.nome}</h4>
              <div style="font-size: 0.85rem; color: var(--text-muted);">Preço de venda: ${formatarMoeda(item.preco)}</div>
              <div style="font-size: 0.78rem; color: var(--cacao-warm); margin-top: 0.2rem;">
                Retirados: ${item.retirado} un | Vendidos: ${item.vendido} un
              </div>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.6rem;">
            <div class="bag-stock-counter">
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">Disponível com você</span>
              <span class="qty-number">${item.saldo} un</span>
            </div>

            <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; justify-content: flex-end;">
              <button type="button" class="btn btn-success btn-sm btn-vender-1un" data-id="${item.produtoId}" data-nome="${item.nome}" data-preco="${item.preco}" title="Venda rápida de 1 unidade">
                ⚡ Vender 1 un
              </button>
              <button type="button" class="btn btn-outline btn-sm btn-abrir-venda-custom" data-id="${item.produtoId}">
                Vender +
              </button>
              <button type="button" class="btn btn-outline btn-sm btn-devolver-item" data-id="${item.produtoId}" data-nome="${item.nome}" data-saldo="${item.saldo}" title="Devolver sobra ao depósito">
                ↩️ Devolver
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    listaSacola.querySelectorAll('.btn-vender-1un').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const prodId = e.currentTarget.dataset.id;
        const prodNome = e.currentTarget.dataset.nome;
        const prodPreco = Number(e.currentTarget.dataset.preco) || 0;
        const vendedor = obterVendedorAtual();

        btn.disabled = true;
        btn.textContent = 'Gravando...';

        const res = await sheetsDB.postAction({
          action: 'registrar_venda',
          vendedorId: vendedor.id,
          vendedorNome: vendedor.nome,
          produtoId: prodId,
          produtoNome: prodNome,
          quantidade: 1,
          valorUnitario: prodPreco,
          formaPagamento: 'Pix'
        });

        if (res.success) {
          showToast(`Venda de 1x ${prodNome} registrada! (${formatarMoeda(prodPreco)})`, 'success');
          await carregarDados();
        } else {
          showToast('Erro ao registrar venda.', 'danger');
          btn.disabled = false;
          btn.textContent = '⚡ Vender 1 un';
        }
      });
    });

    listaSacola.querySelectorAll('.btn-abrir-venda-custom').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prodId = e.currentTarget.dataset.id;
        vendaSelectProduto.value = prodId;
        atualizarCamposFormVenda();
        ativarAba('vtab-venda');
      });
    });

    listaSacola.querySelectorAll('.btn-devolver-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prodId = e.currentTarget.dataset.id;
        const prodNome = e.currentTarget.dataset.nome;
        const saldo = Number(e.currentTarget.dataset.saldo);

        produtoDevolucao = { id: prodId, nome: prodNome, saldo };
        devProdutoNome.textContent = `Devolver: ${prodNome}`;
        devInputQtd.value = 1;
        devInputQtd.max = saldo;
        devMaxAviso.textContent = `Máximo em suas mãos: ${saldo} un`;
        modalDevolver.showModal();
      });
    });
  }

  btnAtalhoPegarEstoque?.addEventListener('click', () => ativarAba('vtab-retirar'));

  // -------------------------------------------------------------
  // ABA 2: RETIRAR DO ESTOQUE GERAL
  // -------------------------------------------------------------
  function renderizarTabelaRetiradaEstoque() {
    const termo = (inputSearchEstoque.value || '').toLowerCase().trim();
    const produtos = (appData.produtos || []).filter(p => p.ativo !== false);

    const filtrados = produtos.filter(p =>
      !termo ||
      p.nome.toLowerCase().includes(termo) ||
      (p.categoria && p.categoria.toLowerCase().includes(termo))
    );

    if (filtrados.length === 0) {
      tbodyRetiradaEstoque.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            Nenhum produto encontrado no estoque geral.
          </td>
        </tr>
      `;
      return;
    }

    tbodyRetiradaEstoque.innerHTML = filtrados.map(prod => {
      const estoqueGeral = Number(prod.estoqueBase) || 0;
      const desabilitado = estoqueGeral <= 0;

      return `
        <tr>
          <td>
            <img src="${prod.imagem || 'assets/images/trufa-70.svg'}" alt="${prod.nome}" class="table-thumb" style="width: 40px; height: 40px;" onerror="this.src='assets/images/trufa-70.svg'">
          </td>
          <td>
            <strong style="color: var(--cacao-dark);">${prod.nome}</strong>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${prod.categoria || 'Cacau Show'}</div>
          </td>
          <td style="font-weight: 600;">${formatarMoeda(prod.preco)}</td>
          <td style="text-align: center;">
            <span class="stock-badge ${estoqueGeral > 5 ? 'stock-in' : estoqueGeral > 0 ? 'stock-low' : 'stock-out'}">
              ${estoqueGeral} un na loja
            </span>
          </td>
          <td style="text-align: center;">
            <div class="quantity-picker" style="transform: scale(0.9);">
              <button type="button" class="qty-btn btn-ret-minus" data-id="${prod.id}" ${desabilitado ? 'disabled' : ''}>-</button>
              <input type="number" class="qty-input input-ret-qtd" id="ret-input-${prod.id}" value="${desabilitado ? 0 : 5}" min="1" max="${estoqueGeral}" ${desabilitado ? 'disabled' : ''}>
              <button type="button" class="qty-btn btn-ret-plus" data-id="${prod.id}" ${desabilitado ? 'disabled' : ''}>+</button>
            </div>
          </td>
          <td style="text-align: center;">
            <button type="button" class="btn btn-secondary btn-sm btn-confirmar-retirada" data-id="${prod.id}" data-nome="${prod.nome}" ${desabilitado ? 'disabled' : ''}>
              Pegar p/ Venda
            </button>
          </td>
        </tr>
      `;
    }).join('');

    tbodyRetiradaEstoque.querySelectorAll('.btn-ret-minus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const input = document.getElementById(`ret-input-${id}`);
        if (input && Number(input.value) > 1) {
          input.value = Number(input.value) - 1;
        }
      });
    });

    tbodyRetiradaEstoque.querySelectorAll('.btn-ret-plus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const input = document.getElementById(`ret-input-${id}`);
        const max = Number(input.max) || 999;
        if (input && Number(input.value) < max) {
          input.value = Number(input.value) + 1;
        }
      });
    });

    tbodyRetiradaEstoque.querySelectorAll('.btn-confirmar-retirada').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const prodId = e.currentTarget.dataset.id;
        const prodNome = e.currentTarget.dataset.nome;
        const input = document.getElementById(`ret-input-${prodId}`);
        const qtd = Number(input ? input.value : 1);
        const vendedor = obterVendedorAtual();

        if (qtd <= 0) {
          showToast('Informe uma quantidade válida.', 'warning');
          return;
        }

        btn.disabled = true;
        btn.textContent = 'Retirando...';

        const res = await sheetsDB.postAction({
          action: 'registrar_retirada',
          vendedorId: vendedor.id,
          vendedorNome: vendedor.nome,
          produtoId: prodId,
          produtoNome: prodNome,
          quantidade: qtd,
          observacao: 'Retirada para venda'
        });

        if (res.success) {
          showToast(`Sucesso! ${qtd}x ${prodNome} adicionados à sua sacola.`, 'success');
          await carregarDados();
          ativarAba('vtab-sacola');
        } else {
          showToast('Erro ao retirar estoque.', 'danger');
          btn.disabled = false;
          btn.textContent = 'Pegar p/ Venda';
        }
      });
    });
  }

  inputSearchEstoque.addEventListener('input', renderizarTabelaRetiradaEstoque);

  // -------------------------------------------------------------
  // ABA 3: LANÇAR VENDA RÁPIDA
  // -------------------------------------------------------------
  function popularSelectProdutoVenda(sacola) {
    const itensDisponiveis = sacola.filter(i => i.saldo > 0);

    if (itensDisponiveis.length === 0) {
      vendaSelectProduto.innerHTML = '<option value="">Você não possui itens na sacola no momento</option>';
      vendaSaldoAviso.textContent = 'Retire itens do estoque geral antes de lançar vendas.';
      vendaInputUnitario.value = '';
      calcularTotalFormVenda();
      return;
    }

    const valorSelecionado = vendaSelectProduto.value;
    vendaSelectProduto.innerHTML = itensDisponiveis.map(item => `
      <option value="${item.produtoId}" data-preco="${item.preco}" data-saldo="${item.saldo}" ${item.produtoId === valorSelecionado ? 'selected' : ''}>
        ${item.nome} (${item.saldo} em mãos)
      </option>
    `).join('');

    atualizarCamposFormVenda();
  }

  function atualizarCamposFormVenda() {
    const opt = vendaSelectProduto.selectedOptions[0];
    if (opt && opt.dataset.saldo) {
      const saldo = Number(opt.dataset.saldo);
      const preco = Number(opt.dataset.preco) || 0;
      vendaSaldoAviso.textContent = `Você tem ${saldo} unidade(s) deste chocolate em mãos.`;
      vendaInputQtd.max = saldo;
      vendaInputUnitario.value = preco.toFixed(2);
      calcularTotalFormVenda();
    }
  }

  function calcularTotalFormVenda() {
    const qtd = Number(vendaInputQtd.value) || 0;
    const unit = Number(vendaInputUnitario.value) || 0;
    const total = qtd * unit;
    vendaTotalCalculado.textContent = formatarMoeda(total);
  }

  vendaSelectProduto.addEventListener('change', atualizarCamposFormVenda);
  vendaInputQtd.addEventListener('input', calcularTotalFormVenda);
  vendaInputUnitario.addEventListener('input', calcularTotalFormVenda);

  formVendaRapida.addEventListener('submit', async (e) => {
    e.preventDefault();
    const vendedor = obterVendedorAtual();
    const prodId = vendaSelectProduto.value;
    const opt = vendaSelectProduto.selectedOptions[0];
    const saldo = Number(opt?.dataset?.saldo || 0);

    const qtd = Number(vendaInputQtd.value);
    const unit = Number(vendaInputUnitario.value);
    const pgto = vendaSelectPgto.value;

    if (!prodId) {
      showToast('Selecione um produto da sua sacola.', 'warning');
      return;
    }

    if (qtd > saldo) {
      showToast(`Você só tem ${saldo} un em mãos para vender.`, 'warning');
      return;
    }

    const prod = appData.produtos.find(p => String(p.id) === String(prodId));
    const prodNome = prod ? prod.nome : opt.textContent.split('(')[0].trim();

    showToast('Lançando venda...', 'info');

    const res = await sheetsDB.postAction({
      action: 'registrar_venda',
      vendedorId: vendedor.id,
      vendedorNome: vendedor.nome,
      produtoId: prodId,
      produtoNome: prodNome,
      quantidade: qtd,
      valorUnitario: unit,
      formaPagamento: pgto
    });

    if (res.success) {
      showToast(`Venda confirmada: ${qtd}x ${prodNome} (${formatarMoeda(qtd * unit)})!`, 'success');
      formVendaRapida.reset();
      vendaInputQtd.value = 1;
      await carregarDados();
      ativarAba('vtab-sacola');
    } else {
      showToast('Erro ao confirmar venda.', 'danger');
    }
  });

  // -------------------------------------------------------------
  // ABA 4: HISTÓRICO DO VENDEDOR
  // -------------------------------------------------------------
  function renderizarMeuHistorico(retiradas, vendas) {
    const historico = [];

    retiradas.forEach(r => {
      const isDevolucao = Number(r.quantidade) < 0;
      historico.push({
        dataHora: r.dataHora,
        tipo: isDevolucao ? 'Devolução' : 'Retirada de Estoque',
        tipoBadge: isDevolucao ? 'stock-in' : 'stock-low',
        produto: r.produtoNome,
        quantidade: Math.abs(Number(r.quantidade)),
        total: '-',
        detalhe: r.observacao || 'Retirada para venda'
      });
    });

    vendas.forEach(v => {
      historico.push({
        dataHora: v.dataHora,
        tipo: 'Venda Realizada',
        tipoBadge: 'stock-in',
        produto: v.produtoNome,
        quantidade: Number(v.quantidade),
        total: formatarMoeda(v.valorTotal),
        detalhe: `Pgto: ${v.formaPagamento || 'Pix'}`
      });
    });

    historico.reverse();

    if (historico.length === 0) {
      tbodyMeuHistorico.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            Você ainda não possui movimentações registradas.
          </td>
        </tr>
      `;
      return;
    }

    tbodyMeuHistorico.innerHTML = historico.map(h => `
      <tr>
        <td style="font-size: 0.82rem; color: var(--text-muted);">${h.dataHora}</td>
        <td><span class="stock-badge ${h.tipoBadge}">${h.tipo}</span></td>
        <td><strong>${h.produto}</strong></td>
        <td style="text-align: center; font-weight: 600;">${h.quantidade} un</td>
        <td style="text-align: right; font-weight: 700; color: var(--status-success);">${h.total}</td>
        <td style="font-size: 0.82rem; color: var(--text-secondary);">${h.detalhe}</td>
      </tr>
    `).join('');
  }

  // -------------------------------------------------------------
  // MODAL DE DEVOLUÇÃO AO ESTOQUE
  // -------------------------------------------------------------
  modalDevConfirmar.addEventListener('click', async () => {
    if (!produtoDevolucao) return;

    const qtd = Number(devInputQtd.value);
    if (qtd <= 0 || qtd > produtoDevolucao.saldo) {
      showToast(`Quantidade inválida. Máximo: ${produtoDevolucao.saldo} un.`, 'warning');
      return;
    }

    const vendedor = obterVendedorAtual();
    modalDevolver.close();
    showToast('Devolvendo itens ao depósito...', 'info');

    const res = await sheetsDB.postAction({
      action: 'devolver_estoque',
      vendedorId: vendedor.id,
      vendedorNome: vendedor.nome,
      produtoId: produtoDevolucao.id,
      produtoNome: produtoDevolucao.nome,
      quantidade: qtd
    });

    if (res.success) {
      showToast(`${qtd}x ${produtoDevolucao.nome} devolvidos com sucesso!`, 'success');
      await carregarDados();
    } else {
      showToast('Erro ao devolver itens.', 'danger');
    }
  });

  modalDevFechar.addEventListener('click', () => modalDevolver.close());
  modalDevCancelar.addEventListener('click', () => modalDevolver.close());

  function ativarAba(tabId) {
    tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.vtab === tabId);
    });
    sections.forEach(sec => {
      sec.style.display = (sec.id === tabId) ? 'block' : 'none';
    });
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      ativarAba(btn.dataset.vtab);
    });
  });

  btnSyncVendedor.addEventListener('click', async () => {
    btnSyncVendedor.textContent = '🔄 Atualizando...';
    btnSyncVendedor.disabled = true;
    await carregarDados(true);
    btnSyncVendedor.textContent = '🔄 Atualizar';
    btnSyncVendedor.disabled = false;
  });

  await carregarDados();
});
