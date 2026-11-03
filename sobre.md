# Greenmond — modernização

## Objetivo

Trazer a aplicação de `old-versions/greenmond` para os dias de hoje, preservando o cenário, o conteúdo e a identidade visual o mais próximo possível do original.

Reaproveitar todas as imagens, JSONs e qualquer informação útil à nova implementação. Parte do conteúdo está diretamente nos templates HTML: a migração deve abranger também textos da cidade, locais, NPCs, histórias, regras de criação e fichas, não apenas arquivos JSON.

O usuário solicitou expressamente reutilizar as imagens existentes, inclusive aquelas potencialmente protegidas por direitos autorais, para manter a identidade visual. Ele resolverá posteriormente a questão das permissões. Essa orientação não comprova a existência de licenças; preservar a origem dos arquivos reutilizados.

## Arquitetura identificada

A aplicação original é uma SPA híbrida com Ionic 1 e AngularJS 1.x, empacotada com Apache Cordova. A organização utiliza módulos AngularJS, controllers, templates e uma factory de acesso ao feed. Não foi identificado servidor próprio de aplicação nessa estrutura; o cliente acessa o Firebase diretamente.

| Área | Tecnologia e localização |
| --- | --- |
| Interface | Ionic `1.0.0`, declarado em `bower.json`; componentes móveis, cartões e menu lateral. |
| Aplicação | AngularJS 1.x; módulos `starter` e `starter.controllers`, em `www/js/app.js` e `www/js/controllers.js`. |
| Navegação | UI-Router com `$stateProvider`, estado abstrato `app` e templates em `www/templates/`. |
| Plataforma móvel | Cordova com Android declarado em `package.json` e configuração em `config.xml`; integração ngCordova e plugins de dispositivo, teclado, console e splash screen. |
| Dados locais | `www/personagens.json`, carregado por `$http` para `$rootScope.personagens`; conteúdo adicional incorporado nos templates. |
| Dados remotos | Firebase SDK `~2.2.7` e AngularFire `~1.1.2`, conforme `bower.json`. A factory `Feeds` usa Realtime Database, coleção `/feeds` e consulta aos últimos 40 registros. |
| Sessão | ngStorage, com usuário em `$localStorage.user` e `$rootScope.user`. |
| Estilos | CSS do Ionic, Ionicons, `www/css/style.css` e Sass em `scss/ionic.app.scss`. |
| Ferramentas | npm, Bower e Gulp 3; tarefas de compilação/minificação Sass em `gulpfile.js`. |

As versões listadas são declarações dos manifestos, não confirmação das versões de todas as bibliotecas instaladas.

## Funcionalidades existentes

- Feed da história, com leitura remota e envio de mensagens identificadas pelo personagem.
- Consulta da cidade e seus locais.
- Listagem e detalhes dos personagens.
- Consulta de NPCs por clã.
- Orientações de criação de personagens.
- Consulta de planilhas/fichas incorporadas aos templates.
- Login por modal e logout.

## Fontes para a migração

| Caminho relativo a `old-versions/greenmond` | Conteúdo a aproveitar |
| --- | --- |
| `www/img/cidade/` | Imagens do cenário e dos locais. |
| `www/img/clanlogos/` | Símbolos dos clãs. |
| `www/personagens.json` | Personagens, identificadores, histórias, referências de imagens e demais dados narrativos. |
| `www/templates/` | Ambientação, NPCs, regras, fichas e estrutura das telas. |
| `www/js/` | Comportamentos, navegação e integração do feed. |
| `www/css/` e `scss/` | Referências de apresentação. |
| `resources/` | Ícones e telas de abertura. |

Manter os arquivos originais preservados. Ao extrair conteúdo para novos JSONs, manter IDs e relações e registrar a procedência. Não alterar fatos narrativos ou regras sem consultar o usuário.

## Limitações e cuidados técnicos

O login legado compara apelido e senha diretamente no navegador usando o JSON dos personagens. Isso não fornece autenticação segura. Senhas não devem ser copiadas para dados públicos da nova aplicação; preservar o conteúdo narrativo não significa reproduzir esse mecanismo de acesso.

JSONs e imagens locais podem continuar como fonte de uma aplicação de consulta. Login real, dados privados e feed com gravação compartilhada exigem autenticação, autorização e persistência apropriadas. Um guard no frontend não protege arquivos JSON públicos.

A plataforma escolhida para a nova implementação é React + TypeScript, Vite, Tailwind e React Router, conforme `plan.md`. A primeira versão de consulta já foi implementada; detalhes e limitações estão em `docs/migracao.md`. O usuário autorizou incluir histórias, nomes de jogadores e fichas, excluindo senhas.

Esta identificação foi realizada por inspeção estática dos manifestos e do código. Não foram executados build, testes ou acesso ao Firebase remoto; funcionamento atual, regras de segurança e disponibilidade do histórico não foram confirmados.

## Dúvidas para decisão

1. A primeira entrega será web responsiva, PWA instalável ou também aplicativo Android/iOS?
2. Devemos começar com consulta de JSONs e imagens ou incluir login e feed multiusuário desde o início?
3. Quais histórias, fichas e informações de jogadores podem ser públicas?
4. O layout deve reproduzir de perto as telas antigas ou ser modernizado preservando imagens, símbolos e atmosfera?
5. Existe acesso ao Firebase antigo e interesse em recuperar o histórico do feed?
