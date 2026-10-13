# 🍫 Guia de Configuração: Google Planilhas para Cacau Del Show - Revenda

Este guia orienta na configuração da sua planilha Google Drive como banco de dados seguro da **Cacau Del Show - Revenda** (Revenda Cacau Show), incluindo controle de senhas de acesso para o Administrador e Vendedores.

---

## 📌 Passo 1: Criar a Planilha no Google Drive

1. Acesse o seu Google Drive: [https://drive.google.com](https://drive.google.com)
2. Clique no botão **+ Novo** > **Planilhas Google** (em branco).
3. Nomeie a planilha como: **"Cacau Del Show - Revenda Cacau Show"**.

---

## 📌 Passo 2: Inserir o Código no Apps Script

1. No menu superior da planilha, clique em:
   **Extensões** > **Apps Script**.
2. Apague todo o conteúdo que estiver no arquivo `Code.gs`.
3. Abra o arquivo [google-apps-script/Code.gs](Code.gs) deste projeto, copie todo o código e cole no editor do Apps Script.
4. Clique no ícone de disquete (**Salvar projeto**) ou aperte `Ctrl + S`.

---

## 📌 Passo 3: Executar a Configuração Inicial Automática

1. No topo do editor do Apps Script, selecione a função **`setupPlanilha`** ao lado do botão Executar.
2. Clique em **Executar**.
3. Na primeira execução, autorize as permissões:
   - Clique em **Revisar permissões**.
   - Escolha sua conta Google.
   - Clique em **Avançado** > **Acessar [Projeto] (não seguro)**.
   - Clique em **Permitir**.
4. Volte para a sua planilha: você verá que as 5 abas foram criadas com cabeçalhos em tons de cacau:
   - **`Configuracoes`**: Contém a chave `ADMIN_SENHA` com a senha do Admin (padrão: `admin123`).
   - **`Produtos`**: Produtos oficiais da Cacau Show (Trufas 30g, LaCreme, Bendito Cacao, Montebello, Presentes) com preços e estoques base.
   - **`Vendedores`**: Vendedores cadastrados com a coluna `Senha` (padrão: `1234`).
   - **`Retiradas`**: Registro de todas as saídas de produtos com vendedores.
   - **`Vendas`**: Registro de vendas realizadas e faturamento.

---

## 📌 Passo 4: Publicar o Web App (Gerar a URL da API)

1. No Apps Script, clique no botão azul no topo direito: **Implantar** > **Nova implantação**.
2. Clique no ícone de engrenagem ao lado de "Selecionar tipo" e escolha **App da Web**.
3. Preencha os campos:
   - **Descrição:** `API Cacau Del Show Revenda`
   - **Executar como:** `Eu (seu-email@gmail.com)`
   - **Quem pode acessar:** `Qualquer pessoa` *(Obrigatório para que o frontend consiga consultar a planilha)*.
4. Clique em **Implantar**.
5. Copie a **URL do app da Web** gerada (começa com `https://script.google.com/macros/s/.../exec`).

---

## 📌 Passo 5: Conectar ao Painel

1. Acesse `login.html` no seu navegador.
2. Entre como Administrador com a senha `admin123`.
3. Acesse a aba **"Integração Google Planilhas & Segurança"** no painel [admin.html](../admin.html).
4. Cole a URL do Web App e clique em **Salvar & Testar Conexão**.
5. Pronto! Todas as retiradas, vendas e estoques ficarão sincronizados em tempo real com a sua conta Google.

---

> 🔒 **Controle de Senhas:**
> - Você pode alterar a senha de qualquer vendedor ou do próprio Administrador diretamente na planilha ou pela aba de Vendedores no Painel Admin!
