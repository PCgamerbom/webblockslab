# Noelzin Roblox Hub

Site pessoal com integração às APIs públicas do Roblox para o perfil PCgamerbom (User ID 2281180949). A página principal é `index.html`; `app.js` e `style.css` são arquivos de suporte.

## Executar localmente

Requer Node.js 18 ou superior. Na pasta do projeto, execute `npm start` e abra `http://localhost:3000`. Não abra o `index.html` diretamente nem publique apenas os arquivos estáticos: os dados do Roblox são carregados pelo endpoint `/api/profile`, servido por `server.js`.

## Publicar online

O GitHub Pages hospeda arquivos estáticos e **não executa `server.js`**. Para que os dados do Roblox carreguem, publique este repositório em um serviço que execute Node.js (por exemplo, Render) usando o arquivo `render.yaml` incluído. Depois da implantação, use a URL fornecida pelo serviço.

Se o erro `Unexpected token '<'` aparecer, significa que o navegador recebeu uma página HTML (normalmente uma página 404) onde esperava JSON; confira se a hospedagem está executando o servidor e se `/api/profile` está disponível.
