# Registro da migração

## Primeira implementação — 03/11/2026

Fonte: `old-versions/greenmond/www`. Originais preservados.

| Origem | Destino | Situação |
| --- | --- | --- |
| `templates/cidade.html` | `src/data/cidade.json`, `/cidade` e detalhes | 12 seções, blocos na ordem original, 21 referências de imagens |
| `templates/npcs.html` | `src/data/npcs.json`, `/npcs` | 6 grupos e 17 NPCs; textos preservados |
| `templates/criacao.html` | `src/data/criacao.json`, `/criacao` | 2 seções de orientações e regras |
| `personagens.json` | `src/data/personagens.json`, listagem e detalhes | 4 personagens, campo `senha` excluído |
| `templates/planilha.html` | `src/data/fichas.json`, `/fichas/:personagemId` | 4 fichas relacionadas por ID; conteúdo “Em desenvolvimento” preservado onde consta no original |
| `img/` | `public/images/` | 33 imagens copiadas sem transformação |
| `templates/menu.html` | Navegação React Router | Reconstruída para desktop e celular |
| `templates/personagens.html`, `personagem.html` | Listagem e detalhe React | Busca por nome, filtro de clã e URLs por ID |
| `templates/login.html` | Etapa futura de backend | Login legado não reproduzido |
| `templates/feeds.html` | Etapa futura de backend | Nenhum histórico local disponível; Firebase não acessado |

O usuário autorizou nesta conversa publicar histórias, nomes dos jogadores e fichas, exceto senhas. A autorização refere-se à inclusão desses dados na nova implementação; nenhuma publicação externa foi realizada.

A extração é reproduzível com `python3 scripts/migrate-content.py`. Ela remove apenas tags e adapta caminhos de imagens; não reescreve a narrativa. Campos textuais de personagens preservam o conteúdo original. Blocos de cidade/criação preservam a sequência de texto/imagens; headings viram blocos próprios. Os separadores e espaços internos dos textos foram mantidos, incluindo grafia do original.

Pendências: avaliar direção visual com o usuário; decidir backend para login/feed; validar no host final se houver publicação. Links antigos `#/app/...` ainda não possuem redirecionamento. A data narrativa permanece a do cenário, sem atualização automática para o ano atual.

## Validação desta entrega

- Build de produção, verificação TypeScript e lint: passaram.
- Vitest: 5 testes passaram, incluindo busca tolerante a acentos, IDs, URL direta, ficha e resultado vazio.
- Validação dos JSONs: IDs, relações, campos de senha e caminhos de imagem verificados. As 33 cópias de imagens são conferidas por SHA-256.
- Auditoria npm: zero vulnerabilidades em produção; 11 avisos moderados transitivos na cadeia ESLint/minimatch. A correção automática sugeria downgrade incompatível; não foi aplicada.
- Navegador conectado: indisponível nesta sessão; não houve revisão visual, teste manual móvel ou comprovação de paridade visual.
- Não há checkout Git utilizável nesta sessão, portanto não foi possível revisar um diff Git. Os originais não foram editados.

Servidor Vite iniciado com sucesso. Verificação HTTP retornou 200 para a entrada, duas rotas diretas, módulo React e imagem migrada. Isso verifica o servidor e o fallback, não a renderização no navegador. Servidor de verificação encerrado ao final.

## Revisão visual da interface — 03/11/2026

Após avaliação do usuário, a composição inicial foi substituída por navegação horizontal, fundo grafite, acentos vinho e títulos marfim. A home passou a combinar título e fotografia em colunas, cartões fotográficos e seção de símbolos dos clãs. Páginas internas receberam campos, painéis, detalhes e tipografia coerentes com essa direção. Imagens e conteúdo narrativo preservados.

Lint, cinco testes existentes e build passaram. Navegador conectado indisponível: não foi realizada inspeção visual em desktop/celular nesta revisão. A avaliação estética do usuário continua pendente.
