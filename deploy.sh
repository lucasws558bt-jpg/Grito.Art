#!/usr/bin/env bash
# Implanta o Grito.Art no Cloudflare Pages e protege com Cloudflare Access (login por código no e-mail).
# NÃO TESTADO contra a sua conta (foi escrito sem acesso à internet/Cloudflare).
#
# Antes (uma vez): crie um API Token em https://dash.cloudflare.com/profile/api-tokens com as permissões:
#   Account > Cloudflare Pages > Edit
#   Account > Access: Apps and Policies > Edit
# Depois rode:
#   export CLOUDFLARE_API_TOKEN="seu_token"
#   export CLOUDFLARE_ACCOUNT_ID="id_da_conta"      # aparece na URL do painel / Workers & Pages
#   export MEU_EMAIL="voce@exemplo.com"             # único e-mail autorizado
#   ./deploy.sh
set -euo pipefail
: "${CLOUDFLARE_API_TOKEN:?defina CLOUDFLARE_API_TOKEN}" "${CLOUDFLARE_ACCOUNT_ID:?defina CLOUDFLARE_ACCOUNT_ID}" "${MEU_EMAIL:?defina MEU_EMAIL}"
PROJECT="${PROJECT:-grito-art}"
API="https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID"
auth=(-H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json")

echo "1/4  Criando projeto Pages ($PROJECT)…"
curl -sS "${auth[@]}" -X POST "$API/pages/projects" \
  -d "{\"name\":\"$PROJECT\",\"production_branch\":\"main\"}" | python3 -c "import sys,json;r=json.load(sys.stdin);print('   ok' if r.get('success') else '   (já existe ou erro): '+str(r.get('errors')))"

echo "2/4  Enviando arquivos…"
npx --yes wrangler@latest pages deploy public --project-name "$PROJECT" --branch main --commit-dirty=true

echo "3/4  Descobrindo o endereço…"
SUB=$(curl -sS "${auth[@]}" "$API/pages/projects/$PROJECT" | python3 -c "import sys,json;print(json.load(sys.stdin)['result']['subdomain'])")
echo "   https://$SUB"

access_app () {  # $1=nome  $2=domínio
  curl -sS "${auth[@]}" -X POST "$API/access/apps" -d "{
    \"name\":\"$1\",\"domain\":\"$2\",\"type\":\"self_hosted\",\"session_duration\":\"720h\",
    \"policies\":[{\"name\":\"Somente eu\",\"decision\":\"allow\",\"precedence\":1,
                   \"include\":[{\"email\":{\"email\":\"$MEU_EMAIL\"}}]}]}" \
  | python3 -c "import sys,json;r=json.load(sys.stdin);print('   ok' if r.get('success') else '   ERRO: '+str(r.get('errors')))"
}
echo "4/4  Ativando Cloudflare Access (site principal + endereços de cada deploy)…"
access_app "Grito.Art"          "$SUB"
access_app "Grito.Art (deploys)" "*.$SUB"

echo; echo "Pronto. Teste em uma aba anônima: https://$SUB  → deve pedir seu e-mail e enviar um código."
