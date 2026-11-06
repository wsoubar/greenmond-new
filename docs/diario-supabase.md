# Configuração do diário Greenmond

## O que foi implementado

Relatos de personagem e resumos de sessão, login por e-mail e senha, rascunhos privados, revisão com orientações, publicação pública, edição posterior exclusiva do narrador, arquivamento e restauração. Lista e busca usam páginas de 20 registros. Escrita usa texto simples, sem HTML ou anexos. A referência de sessão é um texto livre, não um cadastro de sessões.

O acervo continua em JSON; apenas IDs e nomes dos quatro personagens são registrados no banco para validar atribuições. Novos personagens precisam ser adicionados a `greenmond_characters` por migração, com o mesmo ID do JSON. Nenhuma senha do legado é reutilizada.

## 1. Preparar o banco

No projeto Supabase escolhido, abra o SQL Editor e execute uma única vez o conteúdo completo de `supabase/migrations/202611030001_greenmond_diary.sql`. A transação cria exclusivamente objetos `greenmond_` no schema `public`; não altera tabelas de outros aplicativos, configuração de Auth, templates de e-mail ou cadastro público do projeto.

Se algum desses nomes já existir, a transação falha sem substituir dados. Não remova tabelas para repetir a instalação. Migrações futuras devem ser incrementais.

São cinco tabelas com RLS; o frontend tem leitura autorizada e só escreve pelas funções `greenmond_save_diary` e `greenmond_transition_diary`. A busca `greenmond_search_diary` retorna exclusivamente publicações. Observações de revisão estão em tabela separada e nunca são incluídas na resposta pública.

## 2. Habilitar participantes

Crie as contas em **Authentication → Users** pelo painel do Supabase ou use contas existentes desse mesmo projeto. Use o UUID do usuário, não seu e-mail, nos comandos abaixo. Defina a senha pelo procedimento administrativo do projeto; não registre senhas no SQL ou no repositório. Não é necessário alterar o Site URL, habilitar cadastro público ou mudar redirecionamentos para o login por senha.

Execute no SQL Editor, substituindo os UUIDs e nomes de exemplo antes de executar:

```sql
-- Habilitar o narrador (nome público, sem e-mail).
insert into public.greenmond_profiles (user_id, display_name, role)
values ('UUID_DO_NARRADOR', 'Nome público do narrador', 'narrator');

-- Habilitar um jogador.
insert into public.greenmond_profiles (user_id, display_name, role)
values ('UUID_DO_JOGADOR', 'Nome público do jogador', 'player');

-- Atribuir Jason ao jogador. IDs: 1 Jason; 2 Hannibal; 3 0DOZ3; 4 Nicholai.
insert into public.greenmond_character_assignments (user_id, character_id)
values ('UUID_DO_JOGADOR', '1');
```

Uma conta pode receber mais de um personagem. O narrador pode escrever com qualquer personagem cadastrado. Qualquer jogador ativo pode escrever resumos de sessão, sujeitos à mesma aprovação.

Para desabilitar apenas o acesso editorial ao Greenmond, preservando a conta dos outros aplicativos:

```sql
update public.greenmond_profiles set active = false
where user_id = 'UUID_DO_JOGADOR';
```

Isso bloqueia novas operações privadas mesmo com sessão válida. As publicações existentes continuam públicas. Reativar usa `active = true`. A interface não permite atribuir personagens ou elevar papéis; esses comandos são administrativos.

## 3. Variáveis locais e GitHub Pages

Copie `.env.example` para `.env.local` e preencha:

```dotenv
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
```

A chave pode ser a publishable atual ou a anon legada. **Nunca use `service_role` ou secret key no Vite**: todas as variáveis `VITE_` entram no bundle público. O arquivo local está ignorado pelo Git. Reinicie o Vite após editar as variáveis.

No GitHub, configure em **Settings → Secrets and variables → Actions → Variables** as duas variáveis com esses mesmos nomes. O workflow existente já as injeta no passo de build. Depois de configurá-las, é necessário novo build/deploy. Esta entrega não publicou alterações.

Sem as variáveis, o site continua funcionando como acervo e informa que o diário está indisponível. Não há dados de diário fictícios nem fallback privado em localStorage; o armazenamento local contém apenas a sessão Auth sob `greenmond-auth-v1`. Logout usa escopo local para não encerrar sessões em outros aplicativos.

### Recuperação de senha por aplicativo

O Greenmond oferece recuperação de senha na tela de entrada usando `resetPasswordForEmail`, com `redirectTo` igual à URL de produção `https://wsoubar.github.io/greenmond-new/?recovery=1`. O retorno usa a origem e o base path publicados mais a query `recovery=1`, sem fragmento (`#`). A aplicação processa o retorno antes de iniciar o roteador e permite definir uma nova senha.

Para autorizar esse retorno, incluir `https://wsoubar.github.io/greenmond-new/?recovery=1` na allowlist de **Authentication → URL Configuration → Redirect URLs** do projeto Supabase usado pelo Greenmond. Essa entrada autoriza o callback desta aplicação. Não alterar **Site URL** nem outras opções globais de Auth para habilitar a recuperação: o projeto pode servir outros aplicativos, e essas opções são compartilhadas. Se o painel exigir uma URL base, manter a configuração global existente e solicitar ao administrador apenas a inclusão da URL do Greenmond na allowlist.

O fluxo está implementado localmente; a configuração da allowlist e o funcionamento no ambiente publicado ainda precisam ser confirmados.

## 4. Fluxo de uso

- Visitante: abre `#/diario`, filtra por tipo e lê entradas publicadas.
- Participante: entra em `#/entrar`, acessa `#/meu-diario` e cria uma entrada. Relatos exigem personagem atribuído; resumos não usam personagem.
- Autor: salva o rascunho e envia para revisão. Enquanto está em revisão, só o narrador edita.
- Narrador: filtra por **Em revisão**, abre a entrada e publica ou devolve ao rascunho com orientação obrigatória.
- Depois da primeira publicação, somente o narrador pode editar, inclusive se a entrada for arquivada e restaurada. Arquivamento retira o texto da lista pública, da busca e do acesso direto público.
- Restaurar deixa a entrada como rascunho; o narrador pode editar, enviar para revisão e publicar novamente.
- O editor detecta gravações concorrentes por `version`: em conflito, copie as alterações e reabra a entrada. Não há sobrescrita silenciosa ou histórico de versões.
- Falha ao salvar mantém o formulário na tela. Navegar, usar voltar/avançar ou fechar a aba com alterações não salvas solicita confirmação. Não existe recuperação automática após descarte ou fechamento confirmado.

## 5. Validação e publicação

```sh
npm test
npm run test:db
npm run lint
npm run validate:data
npm run build
```

`test:db` aplica a migração em uma instância PostgreSQL embutida via PGlite, com papéis `anon`/`authenticated` e `auth.uid()` simulando o UUID da sessão. Valida RLS, chamadas diretas não autorizadas, autoria, atribuição, estados, conflitos, busca e retirada de publicações. Não usa o banco remoto e não substitui a integração real com Supabase Auth/PostgREST.

Os testes de interface usam serviços simulados para verificar sessão, edição, falhas, revisão e navegação. Eles não exercitam envio ou recebimento real de e-mail, callback de recuperação, Supabase Auth/PostgREST remoto ou a configuração da allowlist. A revisão visual ampla permanece adiada, conforme solicitado.

Antes de liberar no projeto real, verificar com uma conta de narrador, duas contas de jogadores e uma conta do mesmo projeto sem perfil Greenmond: login, rascunho, negativa de acesso cruzado, revisão, publicação pública, arquivamento e pesquisa. Conferir também os links diretos com `#` e os assets no GitHub Pages. Para recuperação, testar o pedido de e-mail, o retorno a `https://wsoubar.github.io/greenmond-new/?recovery=1` sem fragmento em `redirectTo`, a definição da nova senha e o login posterior; confirmar que essa URL está na allowlist e que as opções globais compartilhadas permanecem adequadas aos demais aplicativos. As políticas do banco devem negar escrita direta nas tabelas mesmo para usuários autenticados.

Não alterar configurações globais de Auth para corrigir problemas específicos do Greenmond. Pedidos iniciados diretamente pelo painel podem continuar usando a Site URL padrão compartilhada; a recuperação iniciada pelo Greenmond utiliza seu próprio retorno.

## Situação desta entrega

Implementação e testes locais disponíveis. A configuração remota do banco, contas, variáveis e GitHub Actions não foi confirmada nesta verificação. Continuam pendentes a inclusão do callback na allowlist, o teste real do fluxo de recuperação e a publicação das alterações. Os testes locais não comprovam publicação nem integração real.
