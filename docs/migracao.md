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

## Nicholai Itchenko — conteúdo novo autorizado

O usuário solicitou criar história e ficha para substituir os placeholders do personagem 4. Conteúdo autoral registrado em `content/overrides/nicholai.json` e aplicado aos JSONs de personagens e fichas. O extrator reaplica esse conteúdo após a migração para impedir perda em uma nova execução. Os arquivos originais permanecem preservados; os outros três personagens não foram alterados.

Nicholai permanece Gangrel e jogador Wagner Barbosa. Idade adotada: 175 anos totais, 150 desde o Abraço, 25 aparentes. Não há dados para calcular média exata: Jason não informa nascimento/Abraço, Hannibal referencia a Guerra Civil e 0DOZ3 descreve computadores nos anos 1980. Usou-se o ponto médio da faixa 150–200 das regras da aplicação, sem estabelecer ano civil. A história vincula sua presença na cidade à season 4, sem atribuir novos cargos ou alterar NPCs existentes.

Ficha orientada a sobrevivência e combate: 8ª geração, Metamorfose 5, Fortitude 4, Animalismo 1, Força de Vontade 9 e Humanidade 7. Atributos 8/6/4 além dos pontos iniciais; Habilidades 15/11/6; Disciplinas 7; Antecedentes 10, incluindo Status 1; Virtudes 7 além dos pontos iniciais. Bônus: 5 + 16 + 21 + 6 + 2 + 5 = 55. Sem Qualidades, Defeitos ou experiência extra. Comparabilidade de poder é avaliação por especialização, não equivalência comprovada das fichas antigas, cujas contagens divergem.

A edição não está declarada no projeto. Custos por ponto assumidos e explicitados na ficha: atributo 5, habilidade 2, disciplina 7, antecedente 1, humanidade 2, vontade 1. Não foram inventados poderes de nível superior a 5, rituais ou regras de equipamento. Efeitos das Disciplinas e fraqueza de clã dependem da edição escolhida pelo narrador. A consulta externa ao livro V20 não pôde ser concluída devido ao limite de tamanho do PDF; as convenções acima são premissas explícitas, não validação editorial da edição.

## Ampliação dos territórios

Os cinco locais com associação de clã no acervo receberam dois parágrafos de atmosfera e influência, preservando os blocos originais. A autoria nova está em `content/cidade-descricoes.json`; a migração insere os textos após a primeira descrição, por ID, sem editar o legado. Universidades mantém presença Tremere, sem estabelecer domínio exclusivo. Os demais locais permanecem inalterados.

### Palácio das Águas — escolha aprovada

Aprovada a opção B: sede da corte de Lucius Wilber Smith, segurança coordenada pelo xerife Norman Brown e acompanhamento político de Frank Baker por intermédio dele. Descrição adicionada à fonte autoral e aos dados gerados; não estabelece propriedade Ventrue nem condição de Elísio.

### Gran Cassino — escolha aprovada

Aprovada a opção A: Hannibal Trautmam frequenta as mesas e busca investidores e parceiros, sem propriedade ou domínio de clã atribuídos. Locais sem texto legado recebem as ampliações após os blocos existentes.

### Sunset Garden — escolha aprovada

Aprovada a opção A: Sunset Garden identifica a boate de Jason P. Adams e o Elísio já descritos em sua história. Os vínculos com prestígio, informação, alimentação, auxiliares e refúgio em troca de favores vêm do acervo existente. Não estabelece domínio territorial Tremere nem novas regras de Elísio.

### The Skull Pub — escolha aprovada

Aprovada a opção A: The Skull Pub identifica o bar de rock de Alice Monteir. Preservada a ajuda de um vampiro rico e influente de identidade desconhecida e a suspeita de que pertença a outro clã. Não atribui domínio territorial Brujah nem condição de Elísio.

### Bairro Francês — escolha aprovada

Aprovada a opção B: Muriel Schürer frequenta pequenos palcos e casas noturnas, mantendo a ligação com sua ambição de ser atriz. Não estabelece carreira atual, propriedade de estabelecimentos ou domínio Malkavian.

### Holly Shelter Game Land — escolha aprovada

Aprovada a opção A: Nicholai conhece as trilhas e utiliza a região em reconhecimento e condução, sem domínio territorial ou regras novas de caça e alimentação. Concluídas as ampliações dos seis locais submetidos à escolha do usuário.

### Apresentação geral — ampliação autorizada

Acrescentados três parágrafos sobre economia rural e tecnológica, memória histórica e contraste entre rotina mortal e presença dos Membros. Preservados integralmente o texto-base, as imagens, os mortais notáveis e a observação sobre Malkavianos e Gangrel. Não foram criados eventos ou vínculos políticos. As referências históricas permanecem como premissas do cenário legado, sem revisão historiográfica nesta alteração.

## Navegação entre locais e pessoas

`src/data/relacoes-locais.json` registra os oito vínculos aprovados nos seis locais. Os cartões levam às histórias dos personagens ou às novas páginas `/npcs/:npcId`, com tratamento de ID inexistente. O arquivo de relações é independente da extração do legado. Não foram inferidos vínculos adicionais por clã.
