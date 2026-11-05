# Grito.Art – app pessoal instalável (PWA)

## O que tem aqui
- `public/` → tudo que vai para o ar (index.html original + manifest.json, sw.js, ícones, _headers)
- `deploy.sh` → publica no Cloudflare Pages e liga o Cloudflare Access (login por e-mail)

O `index.html` é o seu arquivo original; só foram acrescentadas as tags do PWA no `<head>` e o registro do service worker no fim. Nada do design/código foi alterado.

## Publicar (uma vez, ~5 min)
1. Crie conta grátis em cloudflare.com e abra **Zero Trust** uma vez (escolha um nome de equipe, plano Free).
2. Gere um API Token com: *Cloudflare Pages: Edit* e *Access: Apps and Policies: Edit*.
3. No terminal (Node instalado):
   ```
   export CLOUDFLARE_API_TOKEN="..."  CLOUDFLARE_ACCOUNT_ID="..."  MEU_EMAIL="voce@exemplo.com"
   ./deploy.sh
   ```
4. Abra o endereço em aba anônima: tem que pedir seu e-mail e mandar um código. Se abrir direto, o Access não ficou ativo.

Sem terminal: Workers & Pages → Create → Pages → Upload assets (pasta `public`); depois Zero Trust → Access → Applications → Add → Self-hosted, domínio `NOME.pages.dev` **e** `*.NOME.pages.dev`, política Allow → Emails → o seu.

## Instalar
- **Xiaomi 14:** abra o endereço no **Chrome** (não no navegador Mi) → faça login → menu ⋮ → **Instalar app**. Abra o app 2 vezes com internet (guarda fontes e deixa funcionar offline).
- **iPhone:** abra no **Safari** → Compartilhar → **Adicionar à Tela de Início**. O login será pedido de novo dentro do app (o iOS separa o armazenamento).

## Atualizar o app
Publique de novo (`./deploy.sh`). A versão nova aparece na abertura seguinte. Para forçar limpeza de cache, mude `VERSION` em `public/sw.js`.
