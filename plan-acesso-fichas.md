# Controle de acesso às fichas dos personagens

## Situação

**Implementação adiada por solicitação do usuário.** Este documento registra o escopo e o esforço estimado; não autoriza executar a migração ou alterar o acesso atual.

## Regra solicitada

| Acesso | Histórias | Fichas |
| --- | --- | --- |
| Jogador ativo | Todos os personagens | Apenas personagens atribuídos à sua conta |
| Narrador ativo | Todas | Todas |
| Visitante sem login | Manter visibilidade atual, como premissa a confirmar | Nenhuma |

Um jogador com mais de um personagem atribuído pode consultar as fichas desses personagens. Reutilizar `greenmond_profiles` e `greenmond_character_assignments`, existentes no diário, sem criar uma segunda fonte de permissões.

As histórias permanecem públicas como premissa deste plano. Restringi-las aos participantes exige decisão adicional antes da implementação.

## Diagnóstico atual

As fichas são importadas de `src/data/fichas.json` e incluídas no JavaScript público. Esconder o link ou proteger apenas a rota não restringe o acesso aos dados.

A migração atual também gera esse JSON, e há conteúdo de ficha em arquivos de autoria e documentação. Conferir essas fontes ao implementar para evitar que a extração ou uma nova publicação exponha novamente os dados.

## Trabalho necessário e esforço

| Etapa | Entrega | Estimativa |
| --- | --- | --- |
| Banco | Criar `greenmond_character_sheets`, com RLS baseada nos personagens atribuídos à conta e no papel de narrador | 1–2 h |
| Migração | Transferir as fichas existentes, preservar cópia local privada e ajustar a extração do legado para não republicá-las | 1–2 h |
| Interface | Consultar fichas mediante autenticação; exibir a ação apenas para usuários autorizados; tratar links diretos, sessão expirada e erros | 1–2 h |
| Testes | Validar isolamento entre jogadores, narrador, visitante, conta desativada e requisições diretas à API; conferir ausência das fichas no build | 1,5–2,5 h |
| Configuração real | Aplicar a migração e conferir atribuições das contas no Supabase | 0,5–1 h |

**Total estimado: 5–9,5 horas**, incluindo validação. Estimativa de engenharia, não prazo garantido; depende da configuração e do acesso ao projeto Supabase.

## Critérios de aceite

- Jogador ativo consulta somente as fichas dos personagens atribuídos à sua conta.
- Narrador ativo consulta todas as fichas.
- Visitantes, contas sem perfil Greenmond ativo e jogadores sem atribuição não obtêm fichas, inclusive por URL direta ou API.
- O conteúdo das fichas não integra o bundle, arquivos estáticos, busca pública ou novas cópias públicas do repositório.
- Reexecutar a extração do legado não reintroduz fichas no conjunto público.
- Histórias, fichas e relações narrativas são preservadas, sem mudanças de conteúdo.
- Testes locais e validação remota são relatados separadamente.

## Limites e cuidados

- Nesta etapa, fichas são apenas para consulta. Edição de atributos, disciplinas e demais campos não está incluída.
- Preservar os originais em `old-versions/greenmond` e o trabalho preexistente.
- Cópias locais privadas e arquivos de importação contendo fichas devem ficar fora do build e de novos arquivos públicos versionados.
- Retirar fichas das próximas publicações não apaga cópias já publicadas ou presentes no histórico de um repositório público.
- Identificar referências existentes sem reescrever o histórico Git ou remover os originais do legado.
- Não alterar configurações ou dados dos outros aplicativos do projeto Supabase.
- Não fazer commit, push ou publicação sem autorização explícita.
