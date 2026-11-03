# Diário da crônica com Supabase

## Experiência e fluxo

Adicionar dois tipos de entrada: **relato de personagem** e **resumo de sessão**.

- Jogadores criam e editam seus rascunhos e os enviam para revisão.
- O narrador pode editar, solicitar ajustes e publicar.
- Após a publicação, somente o narrador pode alterar ou retirar a entrada do ar.
- Visitantes leem as entradas publicadas sem login.
- Jogadores acessam apenas seus textos não publicados; o narrador acessa todos.

Estados: **rascunho → em revisão → publicado**. Solicitar ajustes devolve a entrada ao rascunho com uma observação privada. Retirar uma publicação a deixa arquivada, disponível apenas ao autor e ao narrador.

## Interface

- `/diario`: listagem pública, mais recentes primeiro, com filtro por tipo e paginação de 20 entradas.
- `/diario/:id`: leitura da publicação, com título, tipo, referência da sessão, data de publicação e autoria.
- `/entrar`: login por e-mail e senha.
- `/meu-diario`: textos do jogador; para o narrador, todas as entradas e fila de revisão.
- Editor com título, texto, referência opcional da sessão e personagem obrigatório nos relatos. Resumos não exigem personagem.
- Usar texto simples com parágrafos, sem HTML, imagens ou anexos nesta versão.
- Exibir estados de carregamento, lista vazia, erro e acesso negado; preservar o texto digitado se o salvamento falhar e avisar antes de sair com alterações não salvas.
- Acrescentar publicações à busca global em um grupo próprio. O acervo local continua pesquisável mesmo se o Supabase estiver indisponível.

## Dados e autorização

Usar tabelas no schema `public`, todas com prefixo **`greenmond_`**:

- `greenmond_profiles`: conta autorizada, nome público, papel de jogador ou narrador e situação ativa.
- `greenmond_characters`: registro mínimo dos IDs e nomes dos personagens existentes, usado para validar atribuições; histórias e fichas continuam nos JSONs.
- `greenmond_character_assignments`: personagens que cada jogador pode representar.
- `greenmond_diary_entries`: conteúdo, tipo, autor, personagem, sessão, estado e datas.
- `greenmond_diary_reviews`: observações de revisão, acessíveis apenas ao autor e ao narrador.

Aplicar permissões no banco com [Supabase Auth e RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), incluindo:

- Leitura anônima apenas de entradas publicadas; perfis, atribuições e revisões permanecem restritos.
- Nenhum acesso editorial para contas sem perfil Greenmond ativo, mesmo que pertençam a outro aplicativo do projeto Supabase.
- Jogadores não podem escolher outro autor, alterar papéis, publicar ou usar personagens não atribuídos.
- Narradores podem usar qualquer personagem cadastrado.
- Funções de gravação com prefixo `greenmond_` validam transições e permissões, sem permitir contorná-las por gravação direta nas tabelas.
- Salvar com verificação de versão para impedir que duas abas sobrescrevam alterações silenciosamente.
- Exibir apenas o nome público escolhido para autoria; nunca publicar e-mails.

## Integração e configuração

- Adicionar o cliente oficial Supabase, mantendo React, Vite, HashRouter e GitHub Pages.
- Configurar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` localmente e no build do GitHub Actions. Nenhuma chave administrativa entra no frontend.
- Usar armazenamento de sessão específico do Greenmond.
- Entregar migrações SQL, arquivo de exemplo das variáveis e instruções de configuração.
- Contas serão provisionadas pelo responsável no painel Supabase; perfis, papéis e personagens serão atribuídos por SQL documentado. Sem cadastro público ou painel de administração de usuários nesta etapa.
- Não alterar tabelas existentes, configurações globais de autenticação ou templates de e-mail dos outros projetos.
- Sem variáveis configuradas, manter o acervo funcionando e indicar indisponibilidade do diário.
- Aplicação das migrações no projeto remoto e configuração das variáveis serão verificadas separadamente; não declarar integração concluída apenas com mocks ou build.

## Validação e limites

- Testar anonimamente a impossibilidade de ler rascunhos e observações privadas.
- Testar dois jogadores, narrador e conta de outro aplicativo, incluindo tentativas diretas de burlar autoria, atribuições e publicação.
- Validar edição, envio, devolução com ajustes, publicação, arquivamento, conflito de versões e falhas de rede.
- Testar login, restauração de sessão, logout, URLs diretas com hash, paginação e busca de publicações.
- Executar testes, lint, tipos, validação do acervo e build; validar as permissões em banco de teste.
- A revisão visual ampla continua adiada. Não inclui comentários, notificações, colaboração simultânea, histórico de versões ou recuperação de senha pela interface; recuperação será administrada pelo responsável nesta primeira versão.
- Sem commit, push ou publicação automática.

## Registro da implementação

Implementação local disponível, com migração SQL versionada, testes de interface e testes de permissões em PostgreSQL embutido. Configuração e limites estão em `docs/diario-supabase.md`. Aplicação remota, contas, variáveis do Supabase/GitHub Actions e validação real de Auth/PostgREST permanecem pendentes de configuração externa. Revisão visual ampla adiada conforme solicitado.
