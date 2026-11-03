# Plano de migração do Greenmond para React

## Objetivo e decisões técnicas

Reconstruir a aplicação de `old-versions/greenmond` como uma aplicação web responsiva, preservando personagens, histórias, regras, locais, imagens e identidade visual. Este plano substitui a proposta anterior de Angular para a nova implementação; a arquitetura do legado continua documentada em `sobre.md`.

Stack proposta:

- **React + TypeScript**, criado pelo template `react-ts` do **Vite**.
- **Tailwind CSS**, integrado pelo plugin oficial `@tailwindcss/vite`.
- **React Router**, em modo declarativo com `BrowserRouter`, rotas aninhadas e parâmetros de URL. É suficiente para a navegação de uma aplicação de consulta sem backend.
- **JSONs locais** como fonte dos dados e **imagens antigas** como arquivos estáticos.
- Estado local do React para busca, filtros e navegação; sem biblioteca global de estado ou camada de consulta remota nesta primeira entrega.
- Vitest e React Testing Library para comportamentos relevantes; validação dos dados por script e revisão da aplicação no navegador.

Selecionar versões estáveis compatíveis no início da implementação, conferir a versão exigida do Node.js e registrar as dependências no lockfile.

Referências oficiais consultadas em 03/11/2026: [Vite](https://vite.dev/guide/), [Tailwind com Vite](https://tailwindcss.com/docs/installation/using-vite) e [React Router declarativo](https://reactrouter.com/start/declarative/installation).

## Premissas de escopo

A primeira entrega será uma aplicação de consulta: cidade, personagens, NPCs, orientações de criação e fichas cuja exposição seja aprovada. Orientações de criação não implicam implementar editor de personagens.

Usar as imagens antigas conforme solicitado, sem condicionar a migração à análise de direitos autorais. Preservar os originais e registrar a origem dos arquivos para facilitar manutenção futura.

Os JSONs antigos serão a fonte de origem, com uma cópia adaptada para consumo pela nova aplicação. Não alterar os arquivos do legado. Remover senhas da cópia publicada, preservar IDs e conteúdo narrativo e documentar transformações de campos e caminhos. Textos que hoje existem apenas em HTML também serão extraídos para JSON.

Arquivos estáticos publicados são acessíveis aos visitantes. Definir a visibilidade de histórias, jogadores e fichas antes de incluí-los no pacote público. Login, conteúdo privado e feed multiusuário não são resolvidos por JSONs nem por esconder rotas; exigem uma etapa própria com backend.

## Etapa 1 — Inventariar e mapear o acervo

- Conferir `personagens.json`, templates, imagens, regras e fichas existentes.
- Criar um inventário com caminho de origem, entidade/tela de destino e situação da migração.
- Identificar dados sensíveis, referências de imagens e campos inconsistentes.
- Se outras versões antigas estiverem disponíveis, comparar seu conteúdo sem substituir automaticamente a fonte principal. Perguntar sobre divergências narrativas.

**Entrega:** mapa de conteúdo e lista objetiva de dúvidas. **Aceite:** toda tela original tem um destino previsto; nenhum conteúdo é descartado silenciosamente.

**Esforço estimado:** 4–6 horas.

## Etapa 2 — Preparar a base React

- Criar o projeto na raiz atual, mantendo `old-versions/` preservada e fora da saída pública.
- Configurar Vite, React, TypeScript, Tailwind e React Router.
- Criar layout compartilhado, navegação inicial e página de rota inexistente.
- Configurar scripts de desenvolvimento, build, lint, verificação de tipos e testes.
- Definir estilos básicos, componentes semânticos e organização por funcionalidades, sem transportar Ionic, AngularJS, Cordova ou Bootstrap para a nova base.

**Entrega:** aplicação mínima navegável. **Aceite:** desenvolvimento e build funcionam; Tailwind está aplicado e as rotas de exemplo respondem.

**Esforço estimado:** 3–5 horas.

## Etapa 3 — Migrar JSONs e imagens

- Copiar os dados dos personagens para `src/data/`, retirando senhas e normalizando apenas o necessário.
- Extrair cidade, locais, NPCs, regras e fichas dos templates para JSONs separados, preservando parágrafos, listas e relações.
- Criar tipos TypeScript e funções simples de leitura/consulta. Importar os JSONs no build evita requisições adicionais e mantém a primeira versão simples.
- Copiar as imagens relevantes para `public/images/`, preservando nomes e subpastas quando possível. Não trocar imagens por alternativas genéricas.
- Registrar caminhos de origem/destino, verificar referências e preservar originais antes de qualquer otimização.
- Criar verificações para IDs duplicados, referências inexistentes, campos obrigatórios e ausência de senhas no conjunto publicado. Tipos TypeScript sozinhos não validam todo o conteúdo.
- Renderizar texto como texto e blocos estruturados, evitando importar HTML legado arbitrário com `dangerouslySetInnerHTML`.

**Entrega:** acervo consumível pelo React. **Aceite:** registros conciliados com a origem, imagens referenciadas existentes e conteúdo restrito ausente dos dados públicos.

**Esforço estimado:** 8–14 horas.

## Etapa 4 — Construir a identidade visual e navegação

- Definir cores, tipografia e espaçamentos coerentes com o cenário e as imagens antigas.
- Modernizar a composição, preservando símbolos, imagens e hierarquia do conteúdo; apresentar uma tela representativa para avaliar a direção visual antes de expandir.
- Implementar navegação adaptada a celular e desktop, cartões, títulos, filtros e estados vazios.
- Garantir foco visível, contraste, navegação por teclado e textos alternativos adequados às imagens.

**Entrega:** layout compartilhado e uma tela com acabamento completo. **Aceite:** composição utilizável em telas pequenas e grandes, sem perda de ações ou conteúdo.

**Esforço estimado:** 6–10 horas.

## Etapa 5 — Migrar as telas por funcionalidade

| Ordem | Rota proposta | Conteúdo e comportamento |
| --- | --- | --- |
| 1 | `/` | Entrada para o cenário e atalhos às seções. |
| 2 | `/cidade` e `/cidade/:localId` | Ambientação, locais e respectivas imagens; criar detalhes separados quando o conteúdo justificar. |
| 3 | `/personagens` | Lista com busca por nome e filtro por clã. |
| 4 | `/personagens/:personagemId` | História e detalhes, resolvidos pelo ID da URL, inclusive após recarregar a página. |
| 5 | `/npcs` | NPCs organizados por clã, com busca e acesso às suas descrições. |
| 6 | `/criacao` | Orientações e regras existentes. |
| 7 | `/fichas/:personagemId` | Fichas aprovadas para consulta pública; omitir do build dados que devam permanecer privados. |

- Migrar e conferir uma seção por vez contra o inventário.
- Usar `Link`/`NavLink` e parâmetros de rota, sem depender de objetos mantidos apenas na memória da navegação.
- Tratar ID inexistente, busca sem resultados e imagem ausente. Não exibir telas vazias como funcionalidades concluídas.
- Avaliar redirecionamento das URLs antigas `#/app/...` se houver links que precisem continuar funcionando.

**Entrega:** aplicação de consulta completa. **Aceite:** todas as seções previstas exibem conteúdo real, com links diretos e histórico do navegador funcionando.

**Esforço estimado:** 12–20 horas.

## Etapa 6 — Validar conteúdo e comportamento

- Executar lint, verificação de tipos, validação dos dados e build de produção.
- Testar busca/filtros, resolução de personagens por ID, IDs inválidos e relações dos dados.
- Conferir no navegador as rotas, recarregamento, voltar/avançar, teclado e apresentações móvel/desktop.
- Comparar textos, registros e imagens com o inventário; registrar qualquer diferença intencional.
- Verificar a saída pública para garantir que arquivos legados e senhas não foram incluídos.
- Corrigir quebras de layout e dimensionamento de imagens; aplicar carregamento tardio quando adequado.

**Entrega:** versão revisada com relatório de validação. **Aceite:** verificações passam e pendências são explicitadas; build sozinho não comprova paridade funcional ou qualidade visual.

**Esforço estimado:** 6–10 horas.

## Etapa 7 — Preparar a entrega e a hospedagem

- Documentar instalação, execução, build e atualização dos JSONs/imagens.
- Preparar hospedagem estática da pasta `dist/` e configurar fallback para `index.html`, necessário para acesso direto às rotas do `BrowserRouter`.
- Se o host final não suportar fallback, avaliar `HashRouter` como ajuste pontual.
- Conferir caminhos dos assets e `base` do Vite caso a aplicação seja servida em subdiretório.
- Preparar instruções de deploy e retorno à versão anterior. Publicar somente com autorização explícita.

**Entrega:** artefato de produção e instruções reproduzíveis. **Aceite:** aplicação funciona pelo preview do build; a validação no host final depende da publicação autorizada.

**Esforço estimado:** 2–3 horas.

## Estrutura sugerida

```text
old-versions/                 # originais preservados; fora da saída pública
public/images/
  cidade/
  clanlogos/
src/
  app/                       # entrada, layout e rotas
  components/                # componentes compartilhados
  data/                      # JSONs adaptados para publicação
  features/
    cidade/
    personagens/
    npcs/
    criacao/
    fichas/
  lib/                       # consultas e normalização simples
  types/
scripts/                     # validação dos dados migrados
docs/                        # inventário e registro de migração
```

Atualizações do conteúdo serão feitas nos JSONs do projeto, seguidas de novo build/deploy. Importá-los no bundle não os torna privados. Não criar gravação fictícia nos arquivos hospedados nem apresentar localStorage como persistência compartilhada.

## Esforço total e dependências

| Escopo | Estimativa |
| --- | --- |
| Etapas 1 a 7, aplicação de consulta | 41–68 horas |
| Planejamento com aproximadamente 20% de margem | 50–82 horas |
| Equivalência aproximada para uma pessoa, 8 h/dia | 7–11 dias úteis |

São estimativas de engenharia, não prazo garantido. Consideram uma pessoa familiarizada com React, sem espera por decisões ou acessos externos. Extração e conferência dos textos e fichas são a principal incerteza. As etapas seguem a ordem proposta; cada uma termina com uma entrega verificável.

## Etapas opcionais após a base

| Incremento | Esforço adicional preliminar | Condição |
| --- | --- | --- |
| Feed histórico de consulta | 3–6 h | Exportação disponível; não inclui recuperar banco inacessível. |
| Login e acesso privado | 12–20 h | Definir provedor, papéis e backend; retirar conteúdo privado dos arquivos estáticos. |
| Feed compartilhado com envio de mensagens | 12–20 h | Login pronto, backend definido e testes de autorização. |
| PWA e leitura offline | 4–8 h | Política de cache e atualização para conteúdo público. |

Não estão incluídos editor de fichas, painel administrativo, empacotamento Android/iOS, recuperação do Firebase antigo ou migração de senhas. Refinar essas estimativas quando houver escopo próprio.

## Decisões pendentes e limites

- Confirmar a visibilidade dos dados antes de publicá-los; até lá, manter conteúdo duvidoso fora do conjunto público.
- Definir a direção visual pela primeira tela completa, mantendo as imagens antigas.
- Definir se login/feed devem antecipar uma etapa de backend; na ausência dessa decisão, o plano base é somente leitura.

Plano baseado na inspeção estática documentada em `sobre.md` e nos arquivos legados disponíveis. A execução foi iniciada conforme o registro abaixo.


## Andamento da execução — 03/11/2026

- Etapa 1: inventário registrado em `docs/migracao.md`; fonte disponível é `old-versions/greenmond`. Visibilidade resolvida: usuário autorizou histórias, jogadores e fichas públicas, exceto senhas.
- Etapa 2: base React/Vite/Tailwind/React Router instalada e build validado.
- Etapa 3: migrados 12 locais, 17 NPCs, 2 seções de regras, 4 personagens, 4 fichas e 33 imagens. Senhas excluídas; script de extração e validação disponíveis.
- Etapas 4 e 5: primeira direção visual e telas de consulta implementadas. Revisão visual/aceite pendente; navegador conectado indisponível nesta sessão.
- Etapa 6: validação de dados, tipos, lint, 5 testes e build passaram. Revisão manual móvel/desktop e histórico do navegador ainda pendentes. Auditoria: zero avisos em produção; 11 moderados nas ferramentas de desenvolvimento.
- Etapa 7: README e saída estática preparados. Validação no host e publicação não realizadas.
- Login, feed remoto, PWA e compatibilidade com URLs legadas permanecem fora desta entrega.
