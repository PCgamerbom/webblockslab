# Noelzin Roblox Hub

Site pessoal com integração às APIs públicas do Roblox para o perfil PCgamerbom (User ID 2281180949).

## Estrutura
- `index.html`, `style.css`, `app.js`: página inicial e interface.
- `server.js`: servidor Node.js e endpoints `/api/profile` e `/api/health`.
- `privacy.html`, `terms.html`, `cookies.html`, `refund.html`, `accessibility.html`, `responsible.html`, `legal-notice.html`: páginas legais separadas.
- `legal.css`, `legal.js`: estilos e preferências de privacidade para as páginas legais.

## Executar
Requer Node.js 18+. Na pasta do projeto, rode `npm start` e abra `http://localhost:3000`. Não abra `index.html` com duplo clique (`file://`), porque a página precisa do servidor para consultar `/api/profile`.

## Preferências e cookies
O site não carrega ferramentas de análise, publicidade ou marketing. O painel guarda escolhas em `localStorage`; as opções de análise/marketing são apenas preferências futuras e não ativam serviços que não estejam instalados.

## Observação
Os textos legais são modelos informativos e devem ser revistos conforme a hospedagem, os recursos adicionados e o uso real do site. Não são aconselhamento jurídico nem garantia de conformidade legal.


Versão simplificada: somente `index.html` é mantido como página HTML. Os links de privacidade/termos e o painel de cookies que apontavam para páginas separadas foram removidos. O link rápido do Roblox exibe `@PCgamerbom`.
