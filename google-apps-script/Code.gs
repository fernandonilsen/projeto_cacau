/**
 * CACAU DEL SHOW - REVENDA CACAU SHOW
 * API Google Apps Script - Controle de Estoque, Vendedores e Autenticação com Senha
 * 
 * Abas:
 * - Produtos: ID | Nome | Categoria | Preco | Descricao | Imagem | EstoqueBase | Ativo
 * - Vendedores: ID | Nome | Telefone | Senha | Ativo
 * - Retiradas: ID | DataHora | VendedorID | VendedorNome | ProdutoID | ProdutoNome | Quantidade | Observacao
 * - Vendas: ID | DataHora | VendedorID | VendedorNome | ProdutoID | ProdutoNome | Quantidade | ValorUnitario | ValorTotal | FormaPagamento
 * - Configuracoes: Chave | Valor
 */

const ABA_PRODUTOS = 'Produtos';
const ABA_VENDEDORES = 'Vendedores';
const ABA_RETIRADAS = 'Retiradas';
const ABA_VENDAS = 'Vendas';
const ABA_CONFIG = 'Configuracoes';

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

/**
 * Cria e formata todas as abas da planilha com cabeçalhos elegantes
 * e dados da revenda Cacau Show.
 */
function setupPlanilha() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Aba Configurações (Senha Admin)
  const sheetConf = getSheet(ABA_CONFIG);
  if (sheetConf.getLastRow() === 0) {
    const cabecalhoConf = [['Chave', 'Valor']];
    sheetConf.getRange(1, 1, 1, 2).setValues(cabecalhoConf)
      .setBackground('#2D180C').setFontColor('#FFFFFF').setFontWeight('bold');
    sheetConf.appendRow(['ADMIN_SENHA', 'admin123']);
    sheetConf.appendRow(['NOME_LOJA', 'Cacau Del Show - Revenda Cacau Show']);
    sheetConf.setFrozenRows(1);
  }

  // 2. Aba Produtos (Produtos Oficiais Cacau Show)
  const sheetProd = getSheet(ABA_PRODUTOS);
  if (sheetProd.getLastRow() === 0) {
    const cabecalhoProd = [
      ['ID', 'Nome', 'Categoria', 'Preco', 'Descricao', 'Imagem', 'EstoqueBase', 'Ativo']
    ];
    sheetProd.getRange(1, 1, 1, cabecalhoProd[0].length).setValues(cabecalhoProd)
      .setBackground('#4A2E1B').setFontColor('#FFFFFF').setFontWeight('bold');
    sheetProd.setFrozenRows(1);

    const dadosProd = [
      ['PROD-001', 'Trufa Tradicional 30g Cacau Show', 'Trufas', 4.50, 'A clássica e inconfundível trufa tradicional da Cacau Show com casca de chocolate ao leite e recheio cremoso.', 'assets/images/trufa-70.svg', 60, true],
      ['PROD-002', 'Tablete LaCreme ao Leite 100g Cacau Show', 'LaCreme', 16.90, 'Feito com mais leite e textura ultra cremosa que derrete na boca. O maior sucesso da marca.', 'assets/images/barra-avelas.svg', 40, true],
      ['PROD-003', 'Tablete Bendito Cacao 70% 100g Cacau Show', 'Bendito Cacao', 17.90, 'Chocolate amargo 70% cacau selecionado, perfeito para paladares refinados.', 'assets/images/barra-avelas.svg', 35, true],
      ['PROD-004', 'Caixa Bombons Clássicos Sortidos Cacau Show', 'Presentes', 44.90, 'Embalagem presenteável refinada com seleção dos bombons mais pedidos da Cacau Show.', 'assets/images/caixa-presente.svg', 25, true],
      ['PROD-005', 'Montebello Tradicional 3 un Cacau Show', 'Montebello', 14.90, 'Marshmallow macio coberto com chocolate ao leite Cacau Show sobre fina base de wafer.', 'assets/images/bombom-caramelo.svg', 30, true],
      ['PROD-006', 'Trufa LaCreme Gianduia 30g Cacau Show', 'LaCreme', 4.90, 'Recheio cremoso à base de avelã italiana com o toque aveludado do chocolate LaCreme.', 'assets/images/trufa-maracuja.svg', 50, true]
    ];
    sheetProd.getRange(2, 1, dadosProd.length, dadosProd[0].length).setValues(dadosProd);
  }

  // 3. Aba Vendedores (com coluna Senha / PIN)
  const sheetVend = getSheet(ABA_VENDEDORES);
  if (sheetVend.getLastRow() === 0) {
    const cabecalhoVend = [
      ['ID', 'Nome', 'Telefone', 'Senha', 'Ativo']
    ];
    sheetVend.getRange(1, 1, 1, cabecalhoVend[0].length).setValues(cabecalhoVend)
      .setBackground('#6B4423').setFontColor('#FFFFFF').setFontWeight('bold');
    sheetVend.setFrozenRows(1);

    const dadosVend = [
      ['VEND-001', 'Ana Silva', '(11) 98765-4321', '1234', true],
      ['VEND-002', 'Carlos Oliveira', '(11) 91234-5678', '1234', true]
    ];
    sheetVend.getRange(2, 1, dadosVend.length, dadosVend[0].length).setValues(dadosVend);
  }

  // 4. Aba Retiradas
  const sheetRet = getSheet(ABA_RETIRADAS);
  if (sheetRet.getLastRow() === 0) {
    const cabecalhoRet = [
      ['ID', 'DataHora', 'VendedorID', 'VendedorNome', 'ProdutoID', 'ProdutoNome', 'Quantidade', 'Observacao']
    ];
    sheetRet.getRange(1, 1, 1, cabecalhoRet[0].length).setValues(cabecalhoRet)
      .setBackground('#C4823F').setFontColor('#FFFFFF').setFontWeight('bold');
    sheetRet.setFrozenRows(1);
  }

  // 5. Aba Vendas
  const sheetVendas = getSheet(ABA_VENDAS);
  if (sheetVendas.getLastRow() === 0) {
    const cabecalhoVendas = [
      ['ID', 'DataHora', 'VendedorID', 'VendedorNome', 'ProdutoID', 'ProdutoNome', 'Quantidade', 'ValorUnitario', 'ValorTotal', 'FormaPagamento']
    ];
    sheetVendas.getRange(1, 1, 1, cabecalhoVendas[0].length).setValues(cabecalhoVendas)
      .setBackground('#3E6B48').setFontColor('#FFFFFF').setFontWeight('bold');
    sheetVendas.setFrozenRows(1);
  }

  return 'Planilha configurada com sucesso para Cacau Del Show - Revenda Cacau Show!';
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ENDPOINT GET: Leitura pública e privada
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getAll';

    if (action === 'ping') {
      return jsonResponse({ status: 'success', message: 'Conexão ativa com Google Planilhas Cacau Del Show!' });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Produtos
    const sheetProd = getSheet(ABA_PRODUTOS);
    const prodValues = sheetProd.getDataRange().getValues();
    const produtos = [];
    if (prodValues.length > 1) {
      for (let i = 1; i < prodValues.length; i++) {
        const row = prodValues[i];
        if (row[0]) {
          produtos.push({
            id: String(row[0]),
            nome: String(row[1]),
            categoria: String(row[2]),
            preco: Number(row[3]) || 0,
            descricao: String(row[4] || ''),
            imagem: String(row[5] || 'assets/images/trufa-70.svg'),
            estoqueBase: Number(row[6]) || 0,
            ativo: row[7] === true || String(row[7]).toLowerCase() === 'true'
          });
        }
      }
    }

    // 2. Vendedores (Para listagem, omite a senha por segurança no GET geral)
    const sheetVend = getSheet(ABA_VENDEDORES);
    const vendValues = sheetVend.getDataRange().getValues();
    const vendedores = [];
    if (vendValues.length > 1) {
      for (let i = 1; i < vendValues.length; i++) {
        const row = vendValues[i];
        if (row[0]) {
          vendedores.push({
            id: String(row[0]),
            nome: String(row[1]),
            telefone: String(row[2] || ''),
            // row[3] é a Senha
            ativo: row[4] === true || String(row[4]).toLowerCase() === 'true'
          });
        }
      }
    }

    // 3. Retiradas
    const sheetRet = getSheet(ABA_RETIRADAS);
    const retValues = sheetRet.getDataRange().getValues();
    const retiradas = [];
    if (retValues.length > 1) {
      for (let i = 1; i < retValues.length; i++) {
        const row = retValues[i];
        if (row[0]) {
          retiradas.push({
            id: String(row[0]),
            dataHora: String(row[1]),
            vendedorId: String(row[2]),
            vendedorNome: String(row[3]),
            produtoId: String(row[4]),
            produtoNome: String(row[5]),
            quantidade: Number(row[6]) || 0,
            observacao: String(row[7] || '')
          });
        }
      }
    }

    // 4. Vendas
    const sheetVendas = getSheet(ABA_VENDAS);
    const vendasValues = sheetVendas.getDataRange().getValues();
    const vendas = [];
    if (vendasValues.length > 1) {
      for (let i = 1; i < vendasValues.length; i++) {
        const row = vendasValues[i];
        if (row[0]) {
          vendas.push({
            id: String(row[0]),
            dataHora: String(row[1]),
            vendedorId: String(row[2]),
            vendedorNome: String(row[3]),
            produtoId: String(row[4]),
            produtoNome: String(row[5]),
            quantidade: Number(row[6]) || 0,
            valorUnitario: Number(row[7]) || 0,
            valorTotal: Number(row[8]) || 0,
            formaPagamento: String(row[9] || 'Pix')
          });
        }
      }
    }

    return jsonResponse({
      status: 'success',
      produtos: produtos,
      vendedores: vendedores,
      retiradas: retiradas,
      vendas: vendas,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

/**
 * ENDPOINT POST: Autenticação, Alteração de Senha e Gravações
 */
function doPost(e) {
  try {
    let payload;
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    } else {
      throw new Error('Nenhum dado enviado no corpo da requisição.');
    }

    const action = payload.action;

    // AÇÃO 0: AUTENTICAÇÃO COM SENHA (Admin ou Vendedor)
    if (action === 'autenticar') {
      const perfil = String(payload.perfil || '').toLowerCase(); // 'admin' ou 'vendedor'
      const senhaInformada = String(payload.senha || '').trim();

      // Autenticação de Administrador
      if (perfil === 'admin') {
        const sheetConf = getSheet(ABA_CONFIG);
        const dataConf = sheetConf.getDataRange().getValues();
        let senhaAdmin = 'admin123'; // Padrão
        for (let i = 1; i < dataConf.length; i++) {
          if (String(dataConf[i][0]).toUpperCase() === 'ADMIN_SENHA') {
            senhaAdmin = String(dataConf[i][1]).trim();
            break;
          }
        }

        if (senhaInformada === senhaAdmin) {
          return jsonResponse({
            status: 'success',
            usuario: {
              perfil: 'admin',
              nome: 'Administrador Geral',
              id: 'ADMIN'
            }
          });
        } else {
          return jsonResponse({ status: 'error', message: 'Senha de administrador incorreta.' });
        }
      }

      // Autenticação de Vendedor
      if (perfil === 'vendedor') {
        const vendedorId = String(payload.id || '').trim();
        const sheetVend = getSheet(ABA_VENDEDORES);
        const dataVend = sheetVend.getDataRange().getValues();

        for (let i = 1; i < dataVend.length; i++) {
          const vId = String(dataVend[i][0]).trim();
          const vNome = String(dataVend[i][1]);
          const vSenha = String(dataVend[i][3]).trim();
          const vAtivo = dataVend[i][4] === true || String(dataVend[i][4]).toLowerCase() === 'true';

          if (vId === vendedorId) {
            if (!vAtivo) {
              return jsonResponse({ status: 'error', message: 'Vendedor inativo no sistema.' });
            }
            if (vSenha === senhaInformada) {
              return jsonResponse({
                status: 'success',
                usuario: {
                  perfil: 'vendedor',
                  id: vId,
                  nome: vNome
                }
              });
            } else {
              return jsonResponse({ status: 'error', message: 'Senha do vendedor incorreta.' });
            }
          }
        }
        return jsonResponse({ status: 'error', message: 'Vendedor não encontrado.' });
      }

      return jsonResponse({ status: 'error', message: 'Perfil inválido.' });
    }

    // AÇÃO: ALTERAR SENHA
    if (action === 'alterar_senha') {
      const tipo = payload.tipo; // 'admin' ou 'vendedor'
      const novaSenha = String(payload.novaSenha || '').trim();

      if (!novaSenha) {
        return jsonResponse({ status: 'error', message: 'Nova senha não pode ser vazia.' });
      }

      if (tipo === 'admin') {
        const sheetConf = getSheet(ABA_CONFIG);
        const dataConf = sheetConf.getDataRange().getValues();
        let rowIdx = -1;
        for (let i = 1; i < dataConf.length; i++) {
          if (String(dataConf[i][0]).toUpperCase() === 'ADMIN_SENHA') {
            rowIdx = i + 1;
            break;
          }
        }
        if (rowIdx > 0) {
          sheetConf.getRange(rowIdx, 2).setValue(novaSenha);
        } else {
          sheetConf.appendRow(['ADMIN_SENHA', novaSenha]);
        }
        return jsonResponse({ status: 'success', message: 'Senha de administrador alterada com sucesso!' });
      }

      if (tipo === 'vendedor') {
        const vendId = String(payload.vendedorId).trim();
        const sheetVend = getSheet(ABA_VENDEDORES);
        const dataVend = sheetVend.getDataRange().getValues();

        for (let i = 1; i < dataVend.length; i++) {
          if (String(dataVend[i][0]).trim() === vendId) {
            sheetVend.getRange(i + 1, 4).setValue(novaSenha); // Coluna 4 é Senha
            return jsonResponse({ status: 'success', message: 'Senha do vendedor alterada com sucesso!' });
          }
        }
        return jsonResponse({ status: 'error', message: 'Vendedor não encontrado.' });
      }
    }

    // AÇÃO 1: SALVAR PRODUTO
    if (action === 'salvar_produto') {
      const sheetProd = getSheet(ABA_PRODUTOS);
      const data = sheetProd.getDataRange().getValues();
      let prodId = payload.id;
      let rowIndex = -1;

      if (prodId) {
        for (let i = 1; i < data.length; i++) {
          if (String(data[i][0]) === String(prodId)) {
            rowIndex = i + 1;
            break;
          }
        }
      }

      if (!prodId) {
        prodId = 'PROD-' + String(new Date().getTime()).slice(-6);
      }

      const rowValues = [
        prodId,
        payload.nome || 'Novo Chocolate Cacau Show',
        payload.categoria || 'Trufas',
        Number(payload.preco) || 0,
        payload.descricao || '',
        payload.imagem || 'assets/images/trufa-70.svg',
        Number(payload.estoqueBase) || 0,
        payload.ativo !== false
      ];

      if (rowIndex > 0) {
        sheetProd.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
      } else {
        sheetProd.appendRow(rowValues);
      }

      return jsonResponse({ status: 'success', id: prodId, message: 'Produto salvo com sucesso!' });
    }

    // AÇÃO 2: AJUSTAR ESTOQUE BASE DO PRODUTO (Admin)
    if (action === 'ajustar_estoque') {
      const sheetProd = getSheet(ABA_PRODUTOS);
      const data = sheetProd.getDataRange().getValues();
      const prodId = payload.produtoId;
      const novoEstoque = Number(payload.novoEstoque);

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(prodId)) {
          sheetProd.getRange(i + 1, 7).setValue(novoEstoque);
          return jsonResponse({ status: 'success', message: 'Estoque ajustado com sucesso!' });
        }
      }
      return jsonResponse({ status: 'error', message: 'Produto não encontrado.' });
    }

    // AÇÃO 3: EXCLUIR / DESATIVAR PRODUTO
    if (action === 'excluir_produto') {
      const sheetProd = getSheet(ABA_PRODUTOS);
      const data = sheetProd.getDataRange().getValues();
      const prodId = payload.id;

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(prodId)) {
          sheetProd.getRange(i + 1, 8).setValue(false);
          return jsonResponse({ status: 'success', message: 'Produto desativado com sucesso!' });
        }
      }
      return jsonResponse({ status: 'error', message: 'Produto não encontrado.' });
    }

    // AÇÃO 4: REGISTRAR RETIRADA DE ESTOQUE PELO VENDEDOR
    if (action === 'registrar_retirada') {
      const sheetRet = getSheet(ABA_RETIRADAS);
      const sheetProd = getSheet(ABA_PRODUTOS);

      const retId = 'RET-' + String(new Date().getTime()).slice(-6);
      const dataHora = new Date().toLocaleString('pt-BR');
      const qtdRetirada = Number(payload.quantidade) || 0;

      if (qtdRetirada <= 0) {
        return jsonResponse({ status: 'error', message: 'Quantidade deve ser maior que zero.' });
      }

      const prodData = sheetProd.getDataRange().getValues();
      let prodRowIndex = -1;
      let estoqueAtual = 0;
      let nomeProd = payload.produtoNome || '';

      for (let i = 1; i < prodData.length; i++) {
        if (String(prodData[i][0]) === String(payload.produtoId)) {
          prodRowIndex = i + 1;
          estoqueAtual = Number(prodData[i][6]) || 0;
          nomeProd = prodData[i][1];
          break;
        }
      }

      if (prodRowIndex === -1) {
        return jsonResponse({ status: 'error', message: 'Produto não encontrado no estoque base.' });
      }

      if (estoqueAtual < qtdRetirada) {
        return jsonResponse({ status: 'error', message: 'Estoque base insuficiente. Disponível: ' + estoqueAtual });
      }

      const novoEstoque = estoqueAtual - qtdRetirada;
      sheetProd.getRange(prodRowIndex, 7).setValue(novoEstoque);

      const rowRetirada = [
        retId,
        dataHora,
        payload.vendedorId,
        payload.vendedorNome,
        payload.produtoId,
        nomeProd,
        qtdRetirada,
        payload.observacao || 'Retirada para venda externa'
      ];
      sheetRet.appendRow(rowRetirada);

      return jsonResponse({
        status: 'success',
        id: retId,
        novoEstoqueBase: novoEstoque,
        message: 'Retirada registrada e estoque geral atualizado!'
      });
    }

    // AÇÃO 5: REGISTRAR VENDA PELO VENDEDOR
    if (action === 'registrar_venda') {
      const sheetVendas = getSheet(ABA_VENDAS);
      const vendaId = 'VEN-' + String(new Date().getTime()).slice(-6);
      const dataHora = new Date().toLocaleString('pt-BR');
      const qtd = Number(payload.quantidade) || 1;
      const unit = Number(payload.valorUnitario) || 0;
      const total = qtd * unit;

      const rowVenda = [
        vendaId,
        dataHora,
        payload.vendedorId,
        payload.vendedorNome,
        payload.produtoId,
        payload.produtoNome,
        qtd,
        unit,
        total,
        payload.formaPagamento || 'Pix'
      ];
      sheetVendas.appendRow(rowVenda);

      return jsonResponse({
        status: 'success',
        id: vendaId,
        total: total,
        message: 'Venda registrada com sucesso!'
      });
    }

    // AÇÃO 6: DEVOLVER ITEM AO ESTOQUE GERAL
    if (action === 'devolver_estoque') {
      const sheetRet = getSheet(ABA_RETIRADAS);
      const sheetProd = getSheet(ABA_PRODUTOS);

      const retId = 'DEV-' + String(new Date().getTime()).slice(-6);
      const dataHora = new Date().toLocaleString('pt-BR');
      const qtdDevolvida = Number(payload.quantidade) || 0;

      const prodData = sheetProd.getDataRange().getValues();
      let prodRowIndex = -1;
      let estoqueAtual = 0;
      let nomeProd = payload.produtoNome || '';

      for (let i = 1; i < prodData.length; i++) {
        if (String(prodData[i][0]) === String(payload.produtoId)) {
          prodRowIndex = i + 1;
          estoqueAtual = Number(prodData[i][6]) || 0;
          nomeProd = prodData[i][1];
          break;
        }
      }

      if (prodRowIndex > 0) {
        sheetProd.getRange(prodRowIndex, 7).setValue(estoqueAtual + qtdDevolvida);
      }

      const rowDevolucao = [
        retId,
        dataHora,
        payload.vendedorId,
        payload.vendedorNome,
        payload.produtoId,
        nomeProd,
        -qtdDevolvida,
        'Devolução ao estoque geral'
      ];
      sheetRet.appendRow(rowDevolucao);

      return jsonResponse({
        status: 'success',
        message: 'Itens devolvidos ao estoque geral com sucesso!'
      });
    }

    // AÇÃO 7: SALVAR / CADASTRAR VENDEDOR
    if (action === 'salvar_vendedor') {
      const sheetVend = getSheet(ABA_VENDEDORES);
      let vendId = payload.id;
      if (!vendId) {
        vendId = 'VEND-' + String(new Date().getTime()).slice(-4);
      }

      const rowVend = [
        vendId,
        payload.nome || 'Novo Vendedor',
        payload.telefone || '',
        payload.senha || '1234',
        true
      ];
      sheetVend.appendRow(rowVend);

      return jsonResponse({ status: 'success', id: vendId, message: 'Vendedor cadastrado com senha!' });
    }

    return jsonResponse({ status: 'error', message: 'Ação desconhecida: ' + action });

  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}
