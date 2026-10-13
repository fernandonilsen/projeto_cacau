/**
 * CACAU DEL SHOW - REVENDA CACAU SHOW
 * Camada de Dados, Autenticação com Senha & API Google Sheets
 */

const STORAGE_KEY_API_URL = 'cacaudelshow_sheets_api_url';
const STORAGE_KEY_LOCAL_DB = 'cacaudelshow_local_db';
const STORAGE_KEY_AUTH_USER = 'cacaudelshow_auth_user';

// Catálogo Padrão Oficial Cacau Show (com senhas de acesso)
const DEFAULT_INITIAL_DATA = {
  config: {
    adminSenha: 'admin123',
    nomeLoja: 'Cacau Del Show - Revenda Cacau Show'
  },
  produtos: [
    {
      id: 'PROD-001',
      nome: 'Trufa Tradicional 30g Cacau Show',
      categoria: 'Trufas',
      preco: 4.50,
      descricao: 'A clássica e inconfundível trufa tradicional da Cacau Show. Casquinha de chocolate ao leite e recheio cremoso.',
      imagem: 'assets/images/trufa-70.svg',
      estoqueBase: 60,
      ativo: true
    },
    {
      id: 'PROD-002',
      nome: 'Tablete LaCreme ao Leite 100g Cacau Show',
      categoria: 'LaCreme',
      preco: 16.90,
      descricao: 'Feito com mais leite e textura ultra cremosa que derrete imediatamente na boca. O maior sucesso Cacau Show.',
      imagem: 'assets/images/barra-avelas.svg',
      estoqueBase: 40,
      ativo: true
    },
    {
      id: 'PROD-003',
      nome: 'Tablete Bendito Cacao 70% 100g Cacau Show',
      categoria: 'Bendito Cacao',
      preco: 17.90,
      descricao: 'Chocolate amargo 70% cacau selecionado, perfeito para apreciadores de notas intensas.',
      imagem: 'assets/images/barra-avelas.svg',
      estoqueBase: 35,
      ativo: true
    },
    {
      id: 'PROD-004',
      nome: 'Caixa Bombons Clássicos Sortidos Cacau Show',
      categoria: 'Presentes',
      preco: 44.90,
      descricao: 'Embalagem presenteável refinada com a seleção dos bombons mais amados da Cacau Show.',
      imagem: 'assets/images/caixa-presente.svg',
      estoqueBase: 25,
      ativo: true
    },
    {
      id: 'PROD-005',
      nome: 'Montebello Tradicional 3 un Cacau Show',
      categoria: 'Montebello',
      preco: 14.90,
      descricao: 'Marshmallow macio coberto com chocolate ao leite Cacau Show sobre fina base de wafer.',
      imagem: 'assets/images/bombom-caramelo.svg',
      estoqueBase: 30,
      ativo: true
    },
    {
      id: 'PROD-006',
      nome: 'Trufa LaCreme Gianduia 30g Cacau Show',
      categoria: 'LaCreme',
      preco: 4.90,
      descricao: 'Recheio cremoso de avelã italiana com a inigualável cobertura de chocolate LaCreme.',
      imagem: 'assets/images/trufa-maracuja.svg',
      estoqueBase: 50,
      ativo: true
    }
  ],
  vendedores: [
    { id: 'VEND-001', nome: 'Ana Silva', telefone: '(11) 98765-4321', senha: '1234', ativo: true },
    { id: 'VEND-002', Carlos: 'Carlos Oliveira', nome: 'Carlos Oliveira', telefone: '(11) 91234-5678', senha: '1234', ativo: true }
  ],
  retiradas: [
    {
      id: 'RET-001',
      dataHora: new Date(Date.now() - 86400000 * 2).toLocaleString('pt-BR'),
      vendedorId: 'VEND-001',
      vendedorNome: 'Ana Silva',
      produtoId: 'PROD-001',
      produtoNome: 'Trufa Tradicional 30g Cacau Show',
      quantidade: 15,
      observacao: 'Retirada inicial'
    },
    {
      id: 'RET-002',
      dataHora: new Date(Date.now() - 86400000).toLocaleString('pt-BR'),
      vendedorId: 'VEND-001',
      vendedorNome: 'Ana Silva',
      produtoId: 'PROD-002',
      produtoNome: 'Tablete LaCreme ao Leite 100g Cacau Show',
      quantidade: 8,
      observacao: 'Retirada para clientes'
    },
    {
      id: 'RET-003',
      dataHora: new Date(Date.now() - 86400000).toLocaleString('pt-BR'),
      vendedorId: 'VEND-002',
      vendedorNome: 'Carlos Oliveira',
      produtoId: 'PROD-005',
      produtoNome: 'Montebello Tradicional 3 un Cacau Show',
      quantidade: 10,
      observacao: 'Retirada para feira'
    }
  ],
  vendas: [
    {
      id: 'VEN-001',
      dataHora: new Date(Date.now() - 86400000).toLocaleString('pt-BR'),
      vendedorId: 'VEND-001',
      vendedorNome: 'Ana Silva',
      produtoId: 'PROD-001',
      produtoNome: 'Trufa Tradicional 30g Cacau Show',
      quantidade: 10,
      valorUnitario: 4.50,
      valorTotal: 45.00,
      formaPagamento: 'Pix'
    },
    {
      id: 'VEN-002',
      dataHora: new Date(Date.now() - 43200000).toLocaleString('pt-BR'),
      vendedorId: 'VEND-001',
      vendedorNome: 'Ana Silva',
      produtoId: 'PROD-002',
      produtoNome: 'Tablete LaCreme ao Leite 100g Cacau Show',
      quantidade: 4,
      valorUnitario: 16.90,
      valorTotal: 67.60,
      formaPagamento: 'Cartão'
    }
  ]
};

class SheetsDatabase {
  constructor() {
    this.apiUrl = localStorage.getItem(STORAGE_KEY_API_URL) || '';
    this.initLocalDb();
  }

  initLocalDb() {
    const existing = localStorage.getItem(STORAGE_KEY_LOCAL_DB);
    if (!existing) {
      localStorage.setItem(STORAGE_KEY_LOCAL_DB, JSON.stringify(DEFAULT_INITIAL_DATA));
    }
  }

  getLocalDb() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LOCAL_DB);
      return raw ? JSON.parse(raw) : DEFAULT_INITIAL_DATA;
    } catch (e) {
      return DEFAULT_INITIAL_DATA;
    }
  }

  saveLocalDb(data) {
    localStorage.setItem(STORAGE_KEY_LOCAL_DB, JSON.stringify(data));
  }

  getApiUrl() {
    return localStorage.getItem(STORAGE_KEY_API_URL) || '';
  }

  setApiUrl(url) {
    this.apiUrl = (url || '').trim();
    if (this.apiUrl) {
      localStorage.setItem(STORAGE_KEY_API_URL, this.apiUrl);
    } else {
      localStorage.removeItem(STORAGE_KEY_API_URL);
    }
  }

  isConnectedToSheets() {
    return !!this.getApiUrl();
  }

  /**
   * AUTENTICAÇÃO COM SENHA (Admin ou Vendedor)
   */
  async autenticar(perfil, id, senha) {
    perfil = String(perfil).toLowerCase();
    senha = String(senha).trim();

    if (this.isConnectedToSheets()) {
      try {
        const res = await fetch(this.apiUrl, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'autenticar',
            perfil: perfil,
            id: id,
            senha: senha
          })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.status === 'success') {
            this.salvarSessao(json.usuario);
            return { success: true, usuario: json.usuario };
          }
          return { success: false, message: json.message || 'Senha incorreta.' };
        }
      } catch (err) {
        console.warn('Erro ao autenticar online. Validando localmente.', err);
      }
    }

    // Validação Local (Offline)
    const db = this.getLocalDb();

    if (perfil === 'admin') {
      const adminSenha = (db.config && db.config.adminSenha) || 'admin123';
      if (senha === adminSenha) {
        const usuario = { perfil: 'admin', nome: 'Administrador Geral', id: 'ADMIN' };
        this.salvarSessao(usuario);
        return { success: true, usuario };
      }
      return { success: false, message: 'Senha de administrador incorreta.' };
    }

    if (perfil === 'vendedor') {
      const vendedor = (db.vendedores || []).find(v => String(v.id) === String(id));
      if (!vendedor) {
        return { success: false, message: 'Vendedor não encontrado.' };
      }
      const senhaCorreta = String(vendedor.senha || '1234').trim();
      if (senha === senhaCorreta) {
        const usuario = { perfil: 'vendedor', id: vendedor.id, nome: vendedor.nome };
        this.salvarSessao(usuario);
        return { success: true, usuario };
      }
      return { success: false, message: 'Senha do vendedor incorreta.' };
    }

    return { success: false, message: 'Perfil não reconhecido.' };
  }

  salvarSessao(usuario) {
    sessionStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(usuario));
  }

  getUsuarioLogado() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY_AUTH_USER);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  fazerLogout() {
    sessionStorage.removeItem(STORAGE_KEY_AUTH_USER);
    window.location.href = 'login.html';
  }

  /**
   * Guarda de rota: exige que o usuário esteja autenticado com o perfil correto.
   * Se não estiver, redireciona para login.html.
   */
  exigirAutenticacao(perfilExigido = null) {
    const usuario = this.getUsuarioLogado();
    if (!usuario) {
      window.location.href = 'login.html';
      return null;
    }
    if (perfilExigido && usuario.perfil !== perfilExigido && usuario.perfil !== 'admin') {
      window.location.href = 'login.html';
      return null;
    }
    return usuario;
  }

  /**
   * Altera a senha do Admin ou de um Vendedor
   */
  async alterarSenha(tipo, vendedorId, novaSenha) {
    const payload = {
      action: 'alterar_senha',
      tipo: tipo,
      vendedorId: vendedorId,
      novaSenha: novaSenha
    };

    if (this.isConnectedToSheets()) {
      try {
        const res = await fetch(this.apiUrl, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const json = await res.json();
          if (json.status === 'success') {
            this.aplicarAlteracaoSenhaLocal(tipo, vendedorId, novaSenha);
            return { success: true, message: json.message };
          }
        }
      } catch (e) {
        console.warn('Erro ao atualizar senha no Sheets:', e);
      }
    }

    this.aplicarAlteracaoSenhaLocal(tipo, vendedorId, novaSenha);
    return { success: true, message: 'Senha atualizada com sucesso localmente!' };
  }

  aplicarAlteracaoSenhaLocal(tipo, vendedorId, novaSenha) {
    const db = this.getLocalDb();
    if (tipo === 'admin') {
      if (!db.config) db.config = {};
      db.config.adminSenha = novaSenha;
    } else if (tipo === 'vendedor') {
      const vend = (db.vendedores || []).find(v => String(v.id) === String(vendedorId));
      if (vend) vend.senha = novaSenha;
    }
    this.saveLocalDb(db);
  }

  /**
   * Testa a conectividade com o Web App do Google Apps Script
   */
  async testConnection(url) {
    const targetUrl = (url || this.getApiUrl()).trim();
    if (!targetUrl) {
      return { success: false, message: 'URL do Google Apps Script não foi informada.' };
    }

    try {
      const testUrl = targetUrl.includes('?') ? `${targetUrl}&action=ping` : `${targetUrl}?action=ping`;
      const response = await fetch(testUrl, { method: 'GET', mode: 'cors' });
      if (!response.ok) {
        throw new Error(`Servidor respondeu com status ${response.status}`);
      }
      const data = await response.json();
      if (data.status === 'success') {
        return { success: true, message: 'Conectado com sucesso ao Google Planilhas!' };
      }
      return { success: false, message: data.message || 'Resposta inesperada do Apps Script.' };
    } catch (err) {
      return {
        success: false,
        message: `Não foi possível conectar ao Google Sheets: ${err.message}. Verifique as permissões da implantação (deve estar como "Qualquer pessoa").`
      };
    }
  }

  /**
   * Carrega todos os dados: Produtos, Vendedores, Retiradas, Vendas
   */
  async getAllData() {
    if (this.isConnectedToSheets()) {
      try {
        const fetchUrl = this.apiUrl.includes('?') ? `${this.apiUrl}&action=getAll` : `${this.apiUrl}?action=getAll`;
        const res = await fetch(fetchUrl, { method: 'GET', mode: 'cors' });
        if (res.ok) {
          const json = await res.json();
          if (json.status === 'success') {
            const dbAntigo = this.getLocalDb();
            const localData = {
              config: dbAntigo.config || DEFAULT_INITIAL_DATA.config,
              produtos: json.produtos || [],
              vendedores: json.vendedores || [],
              retiradas: json.retiradas || [],
              vendas: json.vendas || []
            };
            this.saveLocalDb(localData);
            return { ...localData, fromSheets: true };
          }
        }
      } catch (err) {
        console.warn('Falha ao conectar com Google Sheets. Utilizando dados locais.', err);
      }
    }
    return { ...this.getLocalDb(), fromSheets: false };
  }

  /**
   * Envia comando POST para o Google Apps Script ou grava localmente
   */
  async postAction(payload) {
    if (this.isConnectedToSheets()) {
      try {
        const res = await fetch(this.apiUrl, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const json = await res.json();
          if (json.status === 'success') {
            this.applyActionLocally(payload, json);
            return { success: true, ...json, fromSheets: true };
          } else {
            throw new Error(json.message || 'Erro ao processar na planilha.');
          }
        }
      } catch (err) {
        console.warn('Erro ao sincronizar com Google Sheets via POST:', err);
        this.applyActionLocally(payload);
        return {
          success: true,
          message: `${payload.action} registrado localmente.`,
          fromSheets: false
        };
      }
    }

    const localResult = this.applyActionLocally(payload);
    return { success: true, ...localResult, fromSheets: false };
  }

  applyActionLocally(payload, serverResult = {}) {
    const db = this.getLocalDb();

    // 1. Salvar Produto
    if (payload.action === 'salvar_produto') {
      const prodId = payload.id || serverResult.id || 'PROD-' + String(Date.now()).slice(-4);
      const existingIdx = db.produtos.findIndex(p => String(p.id) === String(prodId));

      const prodObj = {
        id: prodId,
        nome: payload.nome,
        categoria: payload.categoria || 'Trufas',
        preco: Number(payload.preco) || 0,
        descricao: payload.descricao || '',
        imagem: payload.imagem || 'assets/images/trufa-70.svg',
        estoqueBase: Number(payload.estoqueBase) || 0,
        ativo: payload.ativo !== false
      };

      if (existingIdx >= 0) {
        db.produtos[existingIdx] = prodObj;
      } else {
        db.produtos.push(prodObj);
      }
      this.saveLocalDb(db);
      return { id: prodId, message: 'Produto salvo com sucesso!' };
    }

    // 2. Ajustar Estoque
    if (payload.action === 'ajustar_estoque') {
      const prod = db.produtos.find(p => String(p.id) === String(payload.produtoId));
      if (prod) {
        prod.estoqueBase = Number(payload.novoEstoque);
        this.saveLocalDb(db);
      }
      return { message: 'Estoque ajustado!' };
    }

    // 3. Excluir Produto
    if (payload.action === 'excluir_produto') {
      const prod = db.produtos.find(p => String(p.id) === String(payload.id));
      if (prod) {
        prod.ativo = false;
        this.saveLocalDb(db);
      }
      return { message: 'Produto desativado!' };
    }

    // 4. Registrar Retirada
    if (payload.action === 'registrar_retirada') {
      const retId = serverResult.id || 'RET-' + String(Date.now()).slice(-4);
      const qtd = Number(payload.quantidade) || 0;
      const prod = db.produtos.find(p => String(p.id) === String(payload.produtoId));

      if (prod) {
        prod.estoqueBase = Math.max(0, prod.estoqueBase - qtd);
      }

      db.retiradas.push({
        id: retId,
        dataHora: new Date().toLocaleString('pt-BR'),
        vendedorId: payload.vendedorId,
        vendedorNome: payload.vendedorNome,
        produtoId: payload.produtoId,
        produtoNome: payload.produtoNome || (prod ? prod.nome : ''),
        quantidade: qtd,
        observacao: payload.observacao || 'Retirada para venda'
      });

      this.saveLocalDb(db);
      return { id: retId, message: 'Retirada registrada!' };
    }

    // 5. Registrar Venda
    if (payload.action === 'registrar_venda') {
      const venId = serverResult.id || 'VEN-' + String(Date.now()).slice(-4);
      const qtd = Number(payload.quantidade) || 1;
      const unit = Number(payload.valorUnitario) || 0;
      const total = qtd * unit;

      db.vendas.push({
        id: venId,
        dataHora: new Date().toLocaleString('pt-BR'),
        vendedorId: payload.vendedorId,
        vendedorNome: payload.vendedorNome,
        produtoId: payload.produtoId,
        produtoNome: payload.produtoNome,
        quantidade: qtd,
        valorUnitario: unit,
        valorTotal: total,
        formaPagamento: payload.formaPagamento || 'Pix'
      });

      this.saveLocalDb(db);
      return { id: venId, total: total, message: 'Venda lançada com sucesso!' };
    }

    // 6. Devolver Estoque
    if (payload.action === 'devolver_estoque') {
      const retId = 'DEV-' + String(Date.now()).slice(-4);
      const qtd = Number(payload.quantidade) || 0;
      const prod = db.produtos.find(p => String(p.id) === String(payload.produtoId));

      if (prod) {
        prod.estoqueBase += qtd;
      }

      db.retiradas.push({
        id: retId,
        dataHora: new Date().toLocaleString('pt-BR'),
        vendedorId: payload.vendedorId,
        vendedorNome: payload.vendedorNome,
        produtoId: payload.produtoId,
        produtoNome: payload.produtoNome || (prod ? prod.nome : ''),
        quantidade: -qtd,
        observacao: 'Devolução ao estoque geral'
      });

      this.saveLocalDb(db);
      return { message: 'Itens devolvidos ao estoque geral!' };
    }

    // 7. Salvar Vendedor
    if (payload.action === 'salvar_vendedor') {
      const vendId = payload.id || 'VEND-' + String(Date.now()).slice(-3);
      db.vendedores.push({
        id: vendId,
        nome: payload.nome,
        telefone: payload.telefone || '',
        senha: payload.senha || '1234',
        ativo: true
      });
      this.saveLocalDb(db);
      return { id: vendId, message: 'Vendedor cadastrado!' };
    }

    return {};
  }

  calcularSacolaVendedor(vendedorId, data = null) {
    const db = data || this.getLocalDb();
    const retiradasDoVendedor = (db.retiradas || []).filter(r => String(r.vendedorId) === String(vendedorId));
    const vendasDoVendedor = (db.vendas || []).filter(v => String(v.vendedorId) === String(vendedorId));

    const sacolaPorProduto = {};

    retiradasDoVendedor.forEach(r => {
      const pId = String(r.produtoId);
      if (!sacolaPorProduto[pId]) {
        const prod = (db.produtos || []).find(p => String(p.id) === pId);
        sacolaPorProduto[pId] = {
          produtoId: pId,
          nome: r.produtoNome || (prod ? prod.nome : 'Produto'),
          imagem: prod ? prod.imagem : 'assets/images/trufa-70.svg',
          preco: prod ? prod.preco : 0,
          categoria: prod ? prod.categoria : 'Cacau Show',
          retirado: 0,
          vendido: 0,
          saldo: 0
        };
      }
      sacolaPorProduto[pId].retirado += Number(r.quantidade) || 0;
    });

    vendasDoVendedor.forEach(v => {
      const pId = String(v.produtoId);
      if (!sacolaPorProduto[pId]) {
        const prod = (db.produtos || []).find(p => String(p.id) === pId);
        sacolaPorProduto[pId] = {
          produtoId: pId,
          nome: v.produtoNome || (prod ? prod.nome : 'Produto'),
          imagem: prod ? prod.imagem : 'assets/images/trufa-70.svg',
          preco: v.valorUnitario || (prod ? prod.preco : 0),
          categoria: prod ? prod.categoria : 'Cacau Show',
          retirado: 0,
          vendido: 0,
          saldo: 0
        };
      }
      sacolaPorProduto[pId].vendido += Number(v.quantidade) || 0;
    });

    return Object.values(sacolaPorProduto).map(item => {
      item.saldo = item.retirado - item.vendido;
      return item;
    });
  }

  calcularMetricas(data = null) {
    const db = data || this.getLocalDb();
    const produtos = db.produtos || [];
    const retiradas = db.retiradas || [];
    const vendas = db.vendas || [];
    const vendedores = db.vendedores || [];

    const totalEstoqueBase = produtos
      .filter(p => p.ativo !== false)
      .reduce((sum, p) => sum + (Number(p.estoqueBase) || 0), 0);

    const totalRetiradas = retiradas.reduce((sum, r) => sum + (Number(r.quantidade) || 0), 0);
    const totalVendidoQtd = vendas.reduce((sum, v) => sum + (Number(v.quantidade) || 0), 0);
    const totalVendidoFaturamento = vendas.reduce((sum, v) => sum + (Number(v.valorTotal) || 0), 0);
    const totalComVendedores = Math.max(0, totalRetiradas - totalVendidoQtd);

    const resumoVendedores = vendedores.map(vend => {
      const vId = String(vend.id);
      const rets = retiradas.filter(r => String(r.vendedorId) === vId);
      const vens = vendas.filter(v => String(v.vendedorId) === vId);

      const qtdRetirada = rets.reduce((acc, r) => acc + (Number(r.quantidade) || 0), 0);
      const qtdVendida = vens.reduce((acc, v) => acc + (Number(v.quantidade) || 0), 0);
      const faturamento = vens.reduce((acc, v) => acc + (Number(v.valorTotal) || 0), 0);
      const saldoEmMaos = Math.max(0, qtdRetirada - qtdVendida);

      return {
        id: vend.id,
        nome: vend.nome,
        telefone: vend.telefone,
        ativo: vend.ativo,
        qtdRetirada,
        qtdVendida,
        faturamento,
        saldoEmMaos
      };
    });

    return {
      totalEstoqueBase,
      totalComVendedores,
      totalVendidoQtd,
      totalVendidoFaturamento,
      totalProdutosAtivos: produtos.filter(p => p.ativo !== false).length,
      resumoVendedores
    };
  }
}

const sheetsDB = new SheetsDatabase();

function showToast(mensagem, tipo = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.innerHTML = `
    <span>${tipo === 'success' ? '✓' : tipo === 'danger' ? '✕' : 'ℹ'}</span>
    <span>${mensagem}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}
