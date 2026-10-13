/**
 * CACAU DEL SHOW - REVENDA CACAU SHOW
 * Painel Administrativo com Autenticação e Gestão de Senhas
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Verificação de Acesso / Guarda de Rota
  const usuarioLogado = sheetsDB.exigirAutenticacao('admin');
  if (!usuarioLogado) return; // Redirecionado para login.html

  // Logout
  document.getElementById('btn-admin-logout')?.addEventListener('click', () => {
    if (confirm('Deseja realmente sair do painel administrativo?')) {
      sheetsDB.fazerLogout();
    }
  });

  // Estado local
  let appData = {
    produtos: [],
    vendedores: [],
    retiradas: [],
    vendas: []
  };

  let produtoEmEdicao = null;
  let produtoParaAjuste = null;

  // Elementos KPIs
  const kpiEstoqueBase = document.getElementById('kpi-estoque-base');
  const kpiComVendedores = document.getElementById('kpi-com-vendedores');
  const kpiFaturamentoTotal = document.getElementById('kpi-faturamento-total');
  const kpiVendasQtd = document.getElementById('kpi-vendas-qtd');
  const kpiProdutosAtivos = document.getElementById('kpi-produtos-ativos');

  // Elementos do Cabeçalho
  const adminStatusDot = document.getElementById('admin-status-dot');
  const adminStatusText = document.getElementById('admin-status-text');
  const btnSyncSheets = document.getElementById('btn-sync-sheets');
  const btnAdminSheetsStatus = document.getElementById('btn-admin-sheets-status');

  // Abas
  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  const sections = document.querySelectorAll('.admin-section');

  // Tabela Produtos
  const tbodyProdutos = document.getElementById('tbody-produtos');
  const inputSearchProd = document.getElementById('admin-search-prod');
  const adminProdCount = document.getElementById('admin-prod-count');
  const btnNovoProduto = document.getElementById('btn-novo-produto');

  // Tabela Vendedores
  const tbodyVendedores = document.getElementById('tbody-vendedores');
  const btnNovoVendedor = document.getElementById('btn-novo-vendedor');
  const btnAddVendedorSec = document.getElementById('btn-add-vendedor-sec');
  const sellerDrilldownBox = document.getElementById('seller-drilldown-box');
  const sellerDrilldownTitle = document.getElementById('seller-drilldown-title');
  const tbodySellerItems = document.getElementById('tbody-seller-items');
  const btnFecharDrilldown = document.getElementById('btn-fechar-drilldown');

  // Tabela Histórico
  const tbodyHistorico = document.getElementById('tbody-historico');
  const selectFiltroHistorico = document.getElementById('select-filtro-historico');

  // Aba Planilha & Segurança
  const adminSheetsUrl = document.getElementById('admin-sheets-url');
  const btnTestarSalvarPlanilha = document.getElementById('btn-testar-salvar-planilha');
  const btnDesconectarPlanilha = document.getElementById('btn-desconectar-planilha');
  const adminSheetsFeedback = document.getElementById('admin-sheets-feedback');
  const formAlterarSenhaAdmin = document.getElementById('form-alterar-senha-admin');
  const inputNovaSenhaAdmin = document.getElementById('input-nova-senha-admin');
  const inputConfirmaSenhaAdmin = document.getElementById('input-confirma-senha-admin');

  // Modais
  const modalProduto = document.getElementById('modal-produto');
  const formProduto = document.getElementById('form-produto');
  const modalProdTitulo = document.getElementById('modal-prod-titulo');
  const prodFormId = document.getElementById('prod-form-id');
  const prodFormNome = document.getElementById('prod-form-nome');
  const prodFormCategoria = document.getElementById('prod-form-categoria');
  const prodFormPreco = document.getElementById('prod-form-preco');
  const prodFormEstoque = document.getElementById('prod-form-estoque');
  const prodFormDescricao = document.getElementById('prod-form-descricao');
  const prodFormImagem = document.getElementById('prod-form-imagem');
  const modalProdFechar = document.getElementById('modal-prod-fechar');
  const modalProdCancelar = document.getElementById('modal-prod-cancelar');

  const modalVendedor = document.getElementById('modal-vendedor');
  const formVendedor = document.getElementById('form-vendedor');
  const vendFormNome = document.getElementById('vend-form-nome');
  const vendFormTelefone = document.getElementById('vend-form-telefone');
  const vendFormSenha = document.getElementById('vend-form-senha');
  const modalVendFechar = document.getElementById('modal-vend-fechar');
  const modalVendCancelar = document.getElementById('modal-vend-cancelar');

  const modalSenhaVendedor = document.getElementById('modal-senha-vendedor');
  const senhaVendNome = document.getElementById('senha-vend-nome');
  const senhaVendId = document.getElementById('senha-vend-id');
  const senhaVendNova = document.getElementById('senha-vend-nova');
  const modalSenhaVendSalvar = document.getElementById('modal-senha-vend-salvar');
  const modalSenhaVendFechar = document.getElementById('modal-senha-vend-fechar');
  const modalSenhaVendCancelar = document.getElementById('modal-senha-vend-cancelar');

  const modalAjusteEstoque = document.getElementById('modal-ajuste-estoque');
  const ajusteProdNome = document.getElementById('ajuste-prod-nome');
  const ajusteNovoEstoque = document.getElementById('ajuste-novo-estoque');
  const modalAjusteConfirmar = document.getElementById('modal-ajuste-confirmar');
  const modalAjusteFechar = document.getElementById('modal-ajuste-fechar');
  const modalAjusteCancelar = document.getElementById('modal-ajuste-cancelar');

  // -------------------------------------------------------------
  // CARREGAR DADOS & MÉTRICAS
  // -------------------------------------------------------------
  async function carregarTodosDados(forcarNotificacao = false) {
    atualizarStatusHeader();
    try {
      const data = await sheetsDB.getAllData();
      appData = data;

      renderizarKPIs();
      renderizarTabelaProdutos();
      renderizarTabelaVendedores();
      renderizarTabelaHistorico();

      atualizarStatusHeader(data.fromSheets);

      if (forcarNotificacao) {
        showToast('Dados sincronizados com sucesso!', 'success');
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      showToast('Falha ao carregar dados do sistema.', 'danger');
    }
  }

  function atualizarStatusHeader(conectadoGoogle = null) {
    const hasUrl = sheetsDB.isConnectedToSheets();
    if (conectadoGoogle === true) {
      adminStatusDot.className = 'status-dot connected';
      adminStatusText.textContent = 'Planilha Conectada';
    } else if (hasUrl) {
      adminStatusDot.className = 'status-dot connected';
      adminStatusText.textContent = 'Google Planilhas';
    } else {
      adminStatusDot.className = 'status-dot';
      adminStatusText.textContent = 'Modo Local (Offline)';
    }
    adminSheetsUrl.value = sheetsDB.getApiUrl();
  }

  function renderizarKPIs() {
    const metricas = sheetsDB.calcularMetricas(appData);

    kpiEstoqueBase.textContent = metricas.totalEstoqueBase;
    kpiComVendedores.textContent = metricas.totalComVendedores;
    kpiFaturamentoTotal.textContent = formatarMoeda(metricas.totalVendidoFaturamento);
    kpiVendasQtd.textContent = `${metricas.totalVendidoQtd} itens vendidos`;
    kpiProdutosAtivos.textContent = metricas.totalProdutosAtivos;
  }

  // Abas
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.dataset.tab;
      document.getElementById(targetId)?.classList.add('active');
    });
  });

  // -------------------------------------------------------------
  // TABELA DE PRODUTOS & ESTOQUE BASE
  // -------------------------------------------------------------
  function renderizarTabelaProdutos() {
    const termo = (inputSearchProd.value || '').toLowerCase().trim();
    const produtos = (appData.produtos || []).filter(p => p.ativo !== false);

    const filtrados = produtos.filter(p =>
      !termo ||
      p.nome.toLowerCase().includes(termo) ||
      (p.categoria && p.categoria.toLowerCase().includes(termo))
    );

    adminProdCount.textContent = `${filtrados.length} produto${filtrados.length === 1 ? '' : 's'} cadastrado${filtrados.length === 1 ? '' : 's'}`;

    if (filtrados.length === 0) {
      tbodyProdutos.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            Nenhum produto encontrado. Clique em "+ Novo Produto" para cadastrar.
          </td>
        </tr>
      `;
      return;
    }

    tbodyProdutos.innerHTML = filtrados.map(prod => {
      const estoque = Number(prod.estoqueBase) || 0;
      let badgeEstoque = `<span class="stock-badge stock-in">${estoque} un</span>`;
      if (estoque === 0) badgeEstoque = `<span class="stock-badge stock-out">0 un (Esgotado)</span>`;
      else if (estoque <= 5) badgeEstoque = `<span class="stock-badge stock-low">${estoque} un (Baixo)</span>`;

      return `
        <tr data-id="${prod.id}">
          <td>
            <img src="${prod.imagem || 'assets/images/trufa-70.svg'}" alt="${prod.nome}" class="table-thumb" onerror="this.src='assets/images/trufa-70.svg'">
          </td>
          <td>
            <strong style="color: var(--cacao-dark);">${prod.nome}</strong>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${prod.id}</div>
          </td>
          <td>
            <span class="category-tag" style="position: static; font-size: 0.7rem;">${prod.categoria || 'Cacau Show'}</span>
          </td>
          <td style="font-weight: 600; color: var(--cacao-deep);">
            ${formatarMoeda(prod.preco)}
          </td>
          <td style="text-align: center;">
            <div style="display: inline-flex; align-items: center; gap: 0.4rem;">
              <button type="button" class="btn btn-outline btn-sm btn-ajuste-menos" data-id="${prod.id}" title="Diminuir 1 un" style="padding: 0.2rem 0.55rem;">-</button>
              <button type="button" class="btn btn-outline btn-sm btn-abrir-ajuste" data-id="${prod.id}" title="Definir estoque exato" style="padding: 0.2rem 0.7rem; font-weight: 700;">
                ${estoque}
              </button>
              <button type="button" class="btn btn-outline btn-sm btn-ajuste-mais" data-id="${prod.id}" title="Aumentar 1 un" style="padding: 0.2rem 0.55rem;">+</button>
            </div>
            <div style="margin-top: 0.25rem;">${badgeEstoque}</div>
          </td>
          <td style="text-align: center;">
            <div class="actions-cell" style="justify-content: center;">
              <button type="button" class="btn btn-outline btn-sm btn-editar-prod" data-id="${prod.id}" title="Editar informações">
                ✏️ Editar
              </button>
              <button type="button" class="btn btn-outline btn-sm btn-excluir-prod" data-id="${prod.id}" title="Desativar item" style="color: var(--status-danger);">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbodyProdutos.querySelectorAll('.btn-ajuste-menos').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        const prod = appData.produtos.find(p => String(p.id) === String(id));
        if (prod && Number(prod.estoqueBase) > 0) {
          const novo = Number(prod.estoqueBase) - 1;
          await ajustarEstoque(id, novo);
        }
      });
    });

    tbodyProdutos.querySelectorAll('.btn-ajuste-mais').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        const prod = appData.produtos.find(p => String(p.id) === String(id));
        if (prod) {
          const novo = Number(prod.estoqueBase) + 1;
          await ajustarEstoque(id, novo);
        }
      });
    });

    tbodyProdutos.querySelectorAll('.btn-abrir-ajuste').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const prod = appData.produtos.find(p => String(p.id) === String(id));
        if (prod) {
          produtoParaAjuste = prod;
          ajusteProdNome.textContent = `Ajustar estoque de: ${prod.nome}`;
          ajusteNovoEstoque.value = prod.estoqueBase;
          modalAjusteEstoque.showModal();
        }
      });
    });

    tbodyProdutos.querySelectorAll('.btn-editar-prod').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const prod = appData.produtos.find(p => String(p.id) === String(id));
        if (prod) {
          abrirModalProduto(prod);
        }
      });
    });

    tbodyProdutos.querySelectorAll('.btn-excluir-prod').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        const prod = appData.produtos.find(p => String(p.id) === String(id));
        if (prod && confirm(`Deseja desativar o produto "${prod.nome}"?`)) {
          await sheetsDB.postAction({ action: 'excluir_produto', id });
          showToast(`Produto desativado.`, 'info');
          await carregarTodosDados();
        }
      });
    });
  }

  inputSearchProd.addEventListener('input', renderizarTabelaProdutos);

  async function ajustarEstoque(id, novoEstoque) {
    await sheetsDB.postAction({
      action: 'ajustar_estoque',
      produtoId: id,
      novoEstoque: Number(novoEstoque)
    });
    showToast('Estoque atualizado!', 'success');
    await carregarTodosDados();
  }

  modalAjusteConfirmar.addEventListener('click', async () => {
    if (produtoParaAjuste) {
      const novo = Number(ajusteNovoEstoque.value);
      if (novo >= 0) {
        await ajustarEstoque(produtoParaAjuste.id, novo);
        modalAjusteEstoque.close();
      } else {
        showToast('Quantidade não pode ser negativa.', 'warning');
      }
    }
  });

  modalAjusteFechar.addEventListener('click', () => modalAjusteEstoque.close());
  modalAjusteCancelar.addEventListener('click', () => modalAjusteEstoque.close());

  // MODAL PRODUTO
  function abrirModalProduto(prod = null) {
    produtoEmEdicao = prod;
    if (prod) {
      modalProdTitulo.textContent = 'Editar Produto Cacau Show';
      prodFormId.value = prod.id;
      prodFormNome.value = prod.nome;
      prodFormCategoria.value = prod.categoria || 'Trufas';
      prodFormPreco.value = prod.preco;
      prodFormEstoque.value = prod.estoqueBase;
      prodFormDescricao.value = prod.descricao || '';
      prodFormImagem.value = prod.imagem || 'assets/images/trufa-70.svg';
    } else {
      modalProdTitulo.textContent = 'Cadastrar Novo Produto';
      formProduto.reset();
      prodFormId.value = '';
      prodFormEstoque.value = 30;
      prodFormPreco.value = 4.50;
      prodFormImagem.value = 'assets/images/trufa-70.svg';
    }
    modalProduto.showModal();
  }

  btnNovoProduto.addEventListener('click', () => abrirModalProduto());
  modalProdFechar.addEventListener('click', () => modalProduto.close());
  modalProdCancelar.addEventListener('click', () => modalProduto.close());

  document.querySelectorAll('.btn-preset-img').forEach(btn => {
    btn.addEventListener('click', (e) => {
      prodFormImagem.value = e.currentTarget.dataset.img;
    });
  });

  formProduto.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      action: 'salvar_produto',
      id: prodFormId.value || null,
      nome: prodFormNome.value.trim(),
      categoria: prodFormCategoria.value,
      preco: Number(prodFormPreco.value) || 0,
      estoqueBase: Number(prodFormEstoque.value) || 0,
      descricao: prodFormDescricao.value.trim(),
      imagem: prodFormImagem.value.trim() || 'assets/images/trufa-70.svg',
      ativo: true
    };

    modalProduto.close();
    showToast('Salvando produto...', 'info');

    const res = await sheetsDB.postAction(payload);
    if (res.success) {
      showToast('Produto salvo com sucesso!', 'success');
      await carregarTodosDados();
    } else {
      showToast('Erro ao salvar produto.', 'danger');
    }
  });

  // -------------------------------------------------------------
  // GESTÃO DE VENDEDORES & CONTROLE DE SENHAS
  // -------------------------------------------------------------
  function renderizarTabelaVendedores() {
    const metricas = sheetsDB.calcularMetricas(appData);
    const vendedores = metricas.resumoVendedores || [];

    if (vendedores.length === 0) {
      tbodyVendedores.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            Nenhum vendedor cadastrado ainda.
          </td>
        </tr>
      `;
      return;
    }

    tbodyVendedores.innerHTML = vendedores.map(v => {
      return `
        <tr>
          <td>
            <strong style="color: var(--cacao-dark);">${v.nome}</strong>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${v.id}</div>
          </td>
          <td>${v.telefone || '-'}</td>
          <td style="text-align: center; font-weight: 600;">${v.qtdRetirada} un</td>
          <td style="text-align: center; font-weight: 600; color: var(--status-success);">${v.qtdVendida} un</td>
          <td style="text-align: center;">
            <span class="stock-badge ${v.saldoEmMaos > 0 ? 'stock-low' : 'stock-in'}" style="font-size: 0.82rem; padding: 0.3rem 0.75rem;">
              ${v.saldoEmMaos} un na sacola
            </span>
          </td>
          <td style="text-align: right; font-weight: 700; color: var(--cacao-deep);">
            ${formatarMoeda(v.faturamento)}
          </td>
          <td style="text-align: center;">
            <div style="display: flex; gap: 0.35rem; justify-content: center;">
              <button type="button" class="btn btn-outline btn-sm btn-ver-sacola-vendedor" data-id="${v.id}" data-nome="${v.nome}" title="Ver itens em mãos">
                🔍 Itens
              </button>
              <button type="button" class="btn btn-outline btn-sm btn-alterar-senha-vendedor" data-id="${v.id}" data-nome="${v.nome}" title="Alterar senha do vendedor">
                🔑 Senha
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbodyVendedores.querySelectorAll('.btn-ver-sacola-vendedor').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const vId = e.currentTarget.dataset.id;
        const vNome = e.currentTarget.dataset.nome;
        abrirDrilldownVendedor(vId, vNome);
      });
    });

    tbodyVendedores.querySelectorAll('.btn-alterar-senha-vendedor').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const vId = e.currentTarget.dataset.id;
        const vNome = e.currentTarget.dataset.nome;
        senhaVendId.value = vId;
        senhaVendNome.textContent = `Vendedor: ${vNome}`;
        senhaVendNova.value = '';
        modalSenhaVendedor.showModal();
      });
    });
  }

  function abrirDrilldownVendedor(vId, vNome) {
    const sacola = sheetsDB.calcularSacolaVendedor(vId, appData);
    sellerDrilldownTitle.textContent = `Chocolates com ${vNome} (Saldo em Mãos)`;

    if (sacola.length === 0) {
      tbodySellerItems.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 1.5rem; color: var(--text-muted);">
            Este vendedor não possui registros de retirada.
          </td>
        </tr>
      `;
    } else {
      tbodySellerItems.innerHTML = sacola.map(item => {
        return `
          <tr>
            <td>
              <div style="display: flex; align-items: center; gap: 0.6rem;">
                <img src="${item.imagem}" class="table-thumb" style="width: 34px; height: 34px;">
                <strong>${item.nome}</strong>
              </div>
            </td>
            <td>${item.retirado} un</td>
            <td style="color: var(--status-success);">${item.vendido} un</td>
            <td>
              <strong style="color: ${item.saldo > 0 ? 'var(--caramel-gold)' : 'var(--text-muted)'}; font-size: 1rem;">
                ${item.saldo} un
              </strong>
            </td>
            <td>${formatarMoeda(item.preco * item.saldo)}</td>
          </tr>
        `;
      }).join('');
    }

    sellerDrilldownBox.style.display = 'block';
    sellerDrilldownBox.scrollIntoView({ behavior: 'smooth' });
  }

  btnFecharDrilldown?.addEventListener('click', () => {
    sellerDrilldownBox.style.display = 'none';
  });

  // Modal Alterar Senha Vendedor
  modalSenhaVendSalvar.addEventListener('click', async () => {
    const vId = senhaVendId.value;
    const nova = senhaVendNova.value.trim();
    if (!nova) {
      showToast('Digite a nova senha.', 'warning');
      return;
    }
    modalSenhaVendedor.close();
    showToast('Atualizando senha do vendedor...', 'info');
    const res = await sheetsDB.alterarSenha('vendedor', vId, nova);
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast('Erro ao alterar senha.', 'danger');
    }
  });

  modalSenhaVendFechar.addEventListener('click', () => modalSenhaVendedor.close());
  modalSenhaVendCancelar.addEventListener('click', () => modalSenhaVendedor.close());

  // Modal Novo Vendedor
  function abrirModalVendedor() {
    formVendedor.reset();
    vendFormSenha.value = '1234';
    modalVendedor.showModal();
  }

  btnNovoVendedor.addEventListener('click', abrirModalVendedor);
  btnAddVendedorSec.addEventListener('click', abrirModalVendedor);
  modalVendFechar.addEventListener('click', () => modalVendedor.close());
  modalVendCancelar.addEventListener('click', () => modalVendedor.close());

  formVendedor.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      action: 'salvar_vendedor',
      nome: vendFormNome.value.trim(),
      telefone: vendFormTelefone.value.trim(),
      senha: vendFormSenha.value.trim() || '1234'
    };
    modalVendedor.close();
    showToast('Cadastrando vendedor...', 'info');

    const res = await sheetsDB.postAction(payload);
    if (res.success) {
      showToast('Vendedor cadastrado com sucesso!', 'success');
      await carregarTodosDados();
    } else {
      showToast('Erro ao cadastrar vendedor.', 'danger');
    }
  });

  // Alterar Senha de Administrador
  formAlterarSenhaAdmin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nova = inputNovaSenhaAdmin.value.trim();
    const confirma = inputConfirmaSenhaAdmin.value.trim();

    if (!nova) {
      showToast('Digite a nova senha.', 'warning');
      return;
    }
    if (nova !== confirma) {
      showToast('As senhas digitadas não coincidem.', 'warning');
      return;
    }

    showToast('Alterando senha de administrador...', 'info');
    const res = await sheetsDB.alterarSenha('admin', null, nova);
    if (res.success) {
      showToast(res.message, 'success');
      formAlterarSenhaAdmin.reset();
    } else {
      showToast('Erro ao atualizar senha.', 'danger');
    }
  });

  // -------------------------------------------------------------
  // HISTÓRICO DE MOVIMENTAÇÕES
  // -------------------------------------------------------------
  function renderizarTabelaHistorico() {
    const filtro = selectFiltroHistorico.value;
    const lista = [];

    if (filtro === 'todos' || filtro === 'retiradas') {
      (appData.retiradas || []).forEach(r => {
        lista.push({
          dataHora: r.dataHora,
          tipo: Number(r.quantidade) < 0 ? 'Devolução' : 'Retirada',
          tipoBadge: Number(r.quantidade) < 0 ? 'stock-in' : 'stock-low',
          vendedor: r.vendedorNome,
          produto: r.produtoNome,
          quantidade: Math.abs(Number(r.quantidade) || 0),
          valor: '-',
          detalhe: r.observacao || 'Retirada para venda'
        });
      });
    }

    if (filtro === 'todos' || filtro === 'vendas') {
      (appData.vendas || []).forEach(v => {
        lista.push({
          dataHora: v.dataHora,
          tipo: 'Venda Realizada',
          tipoBadge: 'stock-in',
          vendedor: v.vendedorNome,
          produto: v.produtoNome,
          quantidade: Number(v.quantidade) || 0,
          valor: formatarMoeda(v.valorTotal),
          detalhe: `Pagamento: ${v.formaPagamento || 'Pix'}`
        });
      });
    }

    lista.reverse();

    if (lista.length === 0) {
      tbodyHistorico.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            Nenhuma movimentação registrada até o momento.
          </td>
        </tr>
      `;
      return;
    }

    tbodyHistorico.innerHTML = lista.map(item => {
      return `
        <tr>
          <td style="font-size: 0.82rem; color: var(--text-muted);">${item.dataHora}</td>
          <td>
            <span class="stock-badge ${item.tipoBadge}" style="font-size: 0.75rem;">${item.tipo}</span>
          </td>
          <td><strong>${item.vendedor}</strong></td>
          <td>${item.produto}</td>
          <td style="text-align: center; font-weight: 600;">${item.quantidade} un</td>
          <td style="text-align: right; font-weight: 700; color: var(--status-success);">${item.valor}</td>
          <td style="font-size: 0.82rem; color: var(--text-secondary);">${item.detalhe}</td>
        </tr>
      `;
    }).join('');
  }

  selectFiltroHistorico.addEventListener('change', renderizarTabelaHistorico);

  // -------------------------------------------------------------
  // CONFIGURAÇÃO GOOGLE PLANILHAS
  // -------------------------------------------------------------
  btnTestarSalvarPlanilha.addEventListener('click', async () => {
    const url = adminSheetsUrl.value.trim();
    adminSheetsFeedback.style.display = 'block';
    adminSheetsFeedback.style.background = 'var(--caramel-bg)';
    adminSheetsFeedback.style.color = 'var(--cacao-dark)';
    adminSheetsFeedback.textContent = 'Testando conexão com o Google Apps Script...';

    if (!url) {
      sheetsDB.setApiUrl('');
      adminSheetsFeedback.textContent = 'URL apagada. Sistema operando em modo Local.';
      atualizarStatusHeader(false);
      showToast('Modo local ativado.', 'info');
      return;
    }

    const test = await sheetsDB.testConnection(url);
    if (test.success) {
      sheetsDB.setApiUrl(url);
      adminSheetsFeedback.style.background = 'var(--status-success-bg)';
      adminSheetsFeedback.style.color = 'var(--status-success)';
      adminSheetsFeedback.textContent = '✓ Conexão validada com sucesso! Sincronizando dados...';
      showToast('Google Planilhas Conectado!', 'success');
      await carregarTodosDados();
    } else {
      adminSheetsFeedback.style.background = 'var(--status-danger-bg)';
      adminSheetsFeedback.style.color = 'var(--status-danger)';
      adminSheetsFeedback.textContent = `✕ Falha na conexão: ${test.message}`;
    }
  });

  btnDesconectarPlanilha.addEventListener('click', () => {
    if (confirm('Deseja desconectar a planilha e usar apenas o modo local?')) {
      sheetsDB.setApiUrl('');
      adminSheetsUrl.value = '';
      adminSheetsFeedback.style.display = 'none';
      atualizarStatusHeader(false);
      showToast('Planilha desconectada.', 'info');
    }
  });

  btnSyncSheets.addEventListener('click', async () => {
    btnSyncSheets.textContent = '🔄 Sincronizando...';
    btnSyncSheets.disabled = true;
    await carregarTodosDados(true);
    btnSyncSheets.textContent = '🔄 Sincronizar';
    btnSyncSheets.disabled = false;
  });

  btnAdminSheetsStatus.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    sections.forEach(s => s.classList.remove('active'));
    const tabPlanilhaBtn = document.querySelector('[data-tab="tab-planilha"]');
    tabPlanilhaBtn?.classList.add('active');
    document.getElementById('tab-planilha')?.classList.add('active');
  });

  await carregarTodosDados();
});
