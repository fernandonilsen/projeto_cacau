/**
 * CACAU DEL SHOW - REVENDA CACAU SHOW
 * Catálogo Público de Produtos (Sem exposição do estoque interno para o público)
 */

document.addEventListener('DOMContentLoaded', async () => {
  let todosProdutos = [];
  let categoriaAtiva = 'todos';
  let termoBusca = '';
  let apenasProntaEntrega = false;
  let produtoSelecionadoModal = null;
  let modalQuantidade = 1;

  let sacolaCliente = JSON.parse(localStorage.getItem('cacaudelshow_sacola') || '[]');

  const gridProdutos = document.getElementById('product-grid');
  const inputBusca = document.getElementById('input-search');
  const checkApenasEstoque = document.getElementById('check-only-stock');
  const pillsContainer = document.getElementById('category-pills');
  const contadorResultados = document.getElementById('results-count');

  const modalDetalhes = document.getElementById('modal-product-detail');
  const modalTitle = document.getElementById('modal-detail-title');
  const modalImg = document.getElementById('modal-detail-img');
  const modalDesc = document.getElementById('modal-detail-desc');
  const modalStock = document.getElementById('modal-detail-stock');
  const modalPrice = document.getElementById('modal-detail-price');
  const modalQtyInput = document.getElementById('modal-detail-qty');
  const modalBtnMinus = document.getElementById('modal-detail-minus');
  const modalBtnPlus = document.getElementById('modal-detail-plus');
  const modalBtnAdd = document.getElementById('modal-detail-add');
  const modalBtnClose = document.getElementById('modal-detail-close');
  const modalBtnCancel = document.getElementById('modal-detail-cancel');

  const cartDrawer = document.getElementById('cart-drawer');
  const cartBackdrop = document.getElementById('cart-backdrop');
  const btnOpenCart = document.getElementById('btn-open-cart');
  const heroBtnCart = document.getElementById('hero-btn-cart');
  const btnCloseCart = document.getElementById('cart-close-btn');
  const cartItemsContainer = document.getElementById('cart-items-container');
  const cartTotalAmount = document.getElementById('cart-total-amount');
  const cartBadgeCount = document.getElementById('cart-badge-count');
  const mobileCartCount = document.getElementById('mobile-cart-count');
  const mobileBtnCart = document.getElementById('mobile-btn-cart');
  const btnClearCart = document.getElementById('btn-clear-cart');
  const btnWhatsappOrder = document.getElementById('btn-whatsapp-order');

  async function carregarProdutos() {
    try {
      const data = await sheetsDB.getAllData();
      todosProdutos = (data.produtos || []).filter(p => p.ativo !== false);
      renderizarCatalogo();
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      showToast('Erro ao carregar produtos do catálogo.', 'danger');
    }
  }

  function renderizarCatalogo() {
    const produtosFiltrados = todosProdutos.filter(prod => {
      const matchCategoria = categoriaAtiva === 'todos' ||
        (prod.categoria && prod.categoria.toLowerCase() === categoriaAtiva.toLowerCase());

      const matchBusca = !termoBusca ||
        prod.nome.toLowerCase().includes(termoBusca) ||
        (prod.descricao && prod.descricao.toLowerCase().includes(termoBusca)) ||
        (prod.categoria && prod.categoria.toLowerCase().includes(termoBusca));

      const estoque = Number(prod.estoqueBase) || 0;
      const matchProntaEntrega = !apenasProntaEntrega || (estoque > 0);

      return matchCategoria && matchBusca && matchProntaEntrega;
    });

    contadorResultados.textContent = `${produtosFiltrados.length} produto${produtosFiltrados.length === 1 ? '' : 's'} encontrado${produtosFiltrados.length === 1 ? '' : 's'}`;

    if (produtosFiltrados.length === 0) {
      gridProdutos.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; background: var(--surface-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-light);">
          <div style="font-size: 3rem; margin-bottom: 0.5rem;">🍫</div>
          <h3 style="margin-bottom: 0.5rem; color: var(--cacao-dark);">Nenhum chocolate encontrado</h3>
          <p style="margin-bottom: 1.25rem;">Tente pesquisar por outro nome ou selecione outra categoria da Cacau Show.</p>
          <button type="button" class="btn btn-primary btn-sm" id="btn-reset-filters">Ver Todos os Produtos</button>
        </div>
      `;
      document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
        categoriaAtiva = 'todos';
        termoBusca = '';
        apenasProntaEntrega = false;
        inputBusca.value = '';
        checkApenasEstoque.checked = false;
        pillsContainer.querySelectorAll('.pill-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.category === 'todos');
        });
        renderizarCatalogo();
      });
      return;
    }

    // Renderiza cards sem expor números brutos do estoque interno ao público
    gridProdutos.innerHTML = produtosFiltrados.map(prod => {
      const estoque = Number(prod.estoqueBase) || 0;
      let badgeClass = 'stock-in';
      let badgeText = 'Pronta Entrega';

      if (estoque <= 0) {
        badgeClass = 'stock-low';
        badgeText = 'Sob Encomenda';
      }

      return `
        <article class="product-card" data-id="${prod.id}">
          <div class="product-img-holder">
            <span class="category-tag">${prod.categoria || 'Cacau Show'}</span>
            <span class="stock-badge ${badgeClass}">${badgeText}</span>
            <img src="${prod.imagem || 'assets/images/trufa-70.svg'}" alt="${prod.nome}" loading="lazy" onerror="this.src='assets/images/trufa-70.svg'">
          </div>
          <div class="product-body">
            <h3 class="product-title">${prod.nome}</h3>
            <p class="product-desc">${prod.descricao || 'Produto oficial da marca Cacau Show.'}</p>
            <div class="product-footer">
              <div class="product-price">
                ${formatarMoeda(prod.preco)}
              </div>
              <div style="display: flex; gap: 0.4rem;">
                <button type="button" class="btn btn-outline btn-sm btn-ver-detalhes" data-id="${prod.id}" title="Ver detalhes">
                  Detalhes
                </button>
                <button type="button" class="btn btn-secondary btn-sm btn-add-sacola" data-id="${prod.id}">
                  + Sacola
                </button>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');

    document.querySelectorAll('.btn-ver-detalhes').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prodId = e.currentTarget.dataset.id;
        abrirModalDetalhes(prodId);
      });
    });

    document.querySelectorAll('.btn-add-sacola').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prodId = e.currentTarget.dataset.id;
        const prod = todosProdutos.find(p => String(p.id) === String(prodId));
        if (prod) {
          adicionarItemSacola(prod, 1);
        }
      });
    });
  }

  inputBusca.addEventListener('input', (e) => {
    termoBusca = e.target.value.toLowerCase().trim();
    renderizarCatalogo();
  });

  checkApenasEstoque.addEventListener('change', (e) => {
    apenasProntaEntrega = e.target.checked;
    renderizarCatalogo();
  });

  pillsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.pill-btn');
    if (!btn) return;

    pillsContainer.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    categoriaAtiva = btn.dataset.category;
    renderizarCatalogo();
  });

  function abrirModalDetalhes(prodId) {
    const prod = todosProdutos.find(p => String(p.id) === String(prodId));
    if (!prod) return;

    produtoSelecionadoModal = prod;
    modalQuantidade = 1;

    modalTitle.textContent = prod.nome;
    modalImg.src = prod.imagem || 'assets/images/trufa-70.svg';
    modalDesc.textContent = prod.descricao || 'Produto original Cacau Show com qualidade e sabor inconfundíveis.';
    modalPrice.textContent = formatarMoeda(prod.preco);
    modalQtyInput.value = modalQuantidade;

    const estoque = Number(prod.estoqueBase) || 0;
    if (estoque > 0) {
      modalStock.textContent = 'Pronta Entrega Disponível';
      modalStock.style.color = 'var(--status-success)';
    } else {
      modalStock.textContent = 'Disponível sob Encomenda';
      modalStock.style.color = 'var(--caramel-gold)';
    }

    modalDetalhes.showModal();
  }

  modalBtnMinus.addEventListener('click', () => {
    if (modalQuantidade > 1) {
      modalQuantidade--;
      modalQtyInput.value = modalQuantidade;
    }
  });

  modalBtnPlus.addEventListener('click', () => {
    modalQuantidade++;
    modalQtyInput.value = modalQuantidade;
  });

  modalBtnAdd.addEventListener('click', () => {
    if (produtoSelecionadoModal) {
      adicionarItemSacola(produtoSelecionadoModal, modalQuantidade);
      modalDetalhes.close();
    }
  });

  modalBtnClose.addEventListener('click', () => modalDetalhes.close());
  modalBtnCancel.addEventListener('click', () => modalDetalhes.close());

  modalDetalhes.addEventListener('click', (e) => {
    const rect = modalDetalhes.getBoundingClientRect();
    const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
    if (!isInDialog) {
      modalDetalhes.close();
    }
  });

  function salvarSacola() {
    localStorage.setItem('cacaudelshow_sacola', JSON.stringify(sacolaCliente));
    atualizarBadgeSacola();
    renderizarSacola();
  }

  function atualizarBadgeSacola() {
    const totalItens = sacolaCliente.reduce((sum, item) => sum + item.quantidade, 0);
    cartBadgeCount.textContent = totalItens;
    mobileCartCount.textContent = totalItens;
  }

  function adicionarItemSacola(produto, quantidade = 1) {
    const itemExistente = sacolaCliente.find(item => String(item.id) === String(produto.id));
    if (itemExistente) {
      itemExistente.quantidade += quantidade;
    } else {
      sacolaCliente.push({
        id: produto.id,
        nome: produto.nome,
        preco: Number(produto.preco) || 0,
        imagem: produto.imagem || 'assets/images/trufa-70.svg',
        quantidade: quantidade
      });
    }

    salvarSacola();
    showToast(`Adicionado: ${quantidade}x ${produto.nome}`, 'success');
  }

  function renderizarSacola() {
    if (sacolaCliente.length === 0) {
      cartItemsContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🛍️</div>
          <p style="font-weight: 600; color: var(--cacao-dark);">Sua sacola está vazia</p>
          <p style="font-size: 0.85rem;">Adicione delícias da Cacau Show do nosso catálogo!</p>
        </div>
      `;
      cartTotalAmount.textContent = formatarMoeda(0);
      return;
    }

    let totalGeral = 0;

    cartItemsContainer.innerHTML = sacolaCliente.map((item, index) => {
      const subtotal = item.preco * item.quantidade;
      totalGeral += subtotal;

      return `
        <div class="cart-item">
          <img src="${item.imagem}" alt="${item.nome}" onerror="this.src='assets/images/trufa-70.svg'">
          <div class="cart-item-details">
            <h4 style="font-size: 0.92rem; font-weight: 600; color: var(--cacao-dark);">${item.nome}</h4>
            <div style="font-size: 0.82rem; color: var(--text-muted);">${formatarMoeda(item.preco)} cada</div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 0.4rem;">
              <div class="quantity-picker" style="transform: scale(0.85); transform-origin: left center;">
                <button type="button" class="qty-btn btn-cart-minus" data-index="${index}">-</button>
                <input type="text" class="qty-input" value="${item.quantidade}" readonly>
                <button type="button" class="qty-btn btn-cart-plus" data-index="${index}">+</button>
              </div>
              <span style="font-weight: 700; color: var(--cacao-deep); font-size: 0.95rem;">${formatarMoeda(subtotal)}</span>
            </div>
          </div>
          <button type="button" class="btn-cart-remove" data-index="${index}" style="background: none; border: none; color: var(--status-danger); cursor: pointer; padding: 0.2rem;" title="Remover item">
            🗑️
          </button>
        </div>
      `;
    }).join('');

    cartTotalAmount.textContent = formatarMoeda(totalGeral);

    cartItemsContainer.querySelectorAll('.btn-cart-minus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = Number(e.currentTarget.dataset.index);
        if (sacolaCliente[idx].quantidade > 1) {
          sacolaCliente[idx].quantidade--;
        } else {
          sacolaCliente.splice(idx, 1);
        }
        salvarSacola();
      });
    });

    cartItemsContainer.querySelectorAll('.btn-cart-plus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = Number(e.currentTarget.dataset.index);
        sacolaCliente[idx].quantidade++;
        salvarSacola();
      });
    });

    cartItemsContainer.querySelectorAll('.btn-cart-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = Number(e.currentTarget.dataset.index);
        sacolaCliente.splice(idx, 1);
        salvarSacola();
      });
    });
  }

  function abrirDrawerSacola() {
    renderizarSacola();
    cartDrawer.classList.add('open');
    cartBackdrop.classList.add('open');
  }

  function fecharDrawerSacola() {
    cartDrawer.classList.remove('open');
    cartBackdrop.classList.remove('open');
  }

  btnOpenCart.addEventListener('click', abrirDrawerSacola);
  heroBtnCart?.addEventListener('click', abrirDrawerSacola);
  mobileBtnCart.addEventListener('click', abrirDrawerSacola);
  btnCloseCart.addEventListener('click', fecharDrawerSacola);
  cartBackdrop.addEventListener('click', fecharDrawerSacola);

  btnClearCart.addEventListener('click', () => {
    if (sacolaCliente.length === 0) return;
    if (confirm('Deseja realmente esvaziar sua sacola?')) {
      sacolaCliente = [];
      salvarSacola();
      showToast('Sacola esvaziada.', 'info');
    }
  });

  // Encomenda via WhatsApp
  btnWhatsappOrder.addEventListener('click', () => {
    if (sacolaCliente.length === 0) {
      showToast('Sua sacola está vazia!', 'warning');
      return;
    }

    let mensagem = '*🍫 OLÁ, CACAU DEL SHOW (REVENDA CACAU SHOW)!*\n';
    mensagem += 'Gostaria de fazer o seguinte pedido de produtos:\n\n';
    let total = 0;

    sacolaCliente.forEach((item, index) => {
      const subtotal = item.preco * item.quantidade;
      total += subtotal;
      mensagem += `${index + 1}. *${item.quantidade}x* ${item.nome} (${formatarMoeda(item.preco)} un) -> _${formatarMoeda(subtotal)}_\n`;
    });

    mensagem += `\n*VALOR TOTAL:* ${formatarMoeda(total)}`;
    mensagem += '\n\nPor favor, confirmem a disponibilidade para entrega/retirada. Muito obrigado(a)!';

    const encoded = encodeURIComponent(mensagem);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  });

  atualizarBadgeSacola();
  await carregarProdutos();
});
