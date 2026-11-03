# AGENTS.md — Greenmond

## Objetivo e escopo

Modernizar a aplicação de `old-versions/greenmond`, preservando o cenário e a identidade visual. Consultar `sobre.md` para o diagnóstico e as decisões pendentes. Este arquivo fica na raiz de `/home/wagner/code/greenmond` e se aplica aos seus descendentes.

## Arquitetura do legado

- SPA híbrida com Ionic 1 e AngularJS 1.x, empacotada com Apache Cordova para Android.
- Módulos `starter` e `starter.controllers`; navegação UI-Router em `www/js/app.js`.
- Controllers e factory `Feeds` em `www/js/controllers.js`; templates Ionic em `www/templates/`.
- Personagens carregados de `www/personagens.json` por `$http` para `$rootScope`; cidade, NPCs, orientações e fichas também contêm dados diretamente no HTML.
- Feed acessa Firebase Realtime Database diretamente pelo cliente, com Firebase SDK 2 e AngularFire 1; consulta os últimos 40 registros.
- Login compara apelido/senha no cliente; sessão em ngStorage/localStorage. Substituir esse mecanismo na modernização.
- Dependências de cliente via Bower, ferramentas via npm/Gulp 3, apresentação com CSS/Sass e Ionicons.

## Preservação do acervo

- Aproveitar todas as imagens, JSONs e informações úteis à reconstrução. Inspecionar também HTML e JavaScript para evitar perda de conteúdo.
- Manter os originais em `old-versions/greenmond`; implementar a nova aplicação fora dessa pasta, salvo orientação explícita.
- O usuário autorizou reutilizar as imagens existentes, inclusive as potencialmente protegidas por direitos autorais, e resolverá posteriormente as permissões. Preservar sua procedência e não afirmar que licenças foram verificadas.
- Não substituir imagens ou símbolos por alternativas genéricas por iniciativa própria.
- Preservar nomes, histórias, regras, relações e ambientação. Perguntar antes de mudanças narrativas relevantes.
- Não copiar senhas legadas para arquivos públicos, logs, documentação ou fixtures da nova aplicação.
- Dados privados não podem ser protegidos apenas por guards ou ocultação de interface se os JSONs estiverem públicos.

## Trabalho e validação

- Trabalhar em português brasileiro, inspecionar o código antes de alterar e preservar trabalho preexistente.
- A nova plataforma usa React + TypeScript, Vite, Tailwind e React Router, conforme `plan.md`. A proposta anterior de Angular foi substituída. Não confundir a nova stack com a arquitetura original.
- Esclarecer dúvidas relevantes sobre plataforma, visibilidade de dados, login, feed e fidelidade visual; resolver decisões técnicas triviais com autonomia.
- Validar as alterações proporcionalmente e distinguir inspeção estática, testes, build, revisão no navegador e integrações externas.
- Não presumir funcionamento do legado ou disponibilidade do Firebase com base apenas nas referências do código.
- Não fazer commit, push, publicação ou operações destrutivas sem autorização explícita.
