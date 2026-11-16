# Contato com os narradores

## Fluxo

O rodapé leva a `#/contato`, disponível sem login. Nome, contato para retorno, assunto e mensagem são obrigatórios. Apenas narradores ativos podem ler as mensagens em **Escrita e revisão → Contatos**, marcar como lidas/resolvidas ou reabrir o atendimento. Abrir uma mensagem não muda seu estado automaticamente. As respostas acontecem fora do site, pelo canal informado pelo visitante; não há envio automático de e-mail nem exposição do endereço dos narradores.

As mensagens não são entradas do diário, não podem ser publicadas e não entram na busca pública. O contador de novas é consultado ao entrar na área; a caixa tem atualização manual e páginas de 20 mensagens. Não há notificações por e-mail ou push.

## Configurar o Turnstile

A Site Key pública `0x4AAAAAAGELTKD-nGKO0s3h`, fornecida pelo responsável, já está configurada no código. Pode ser substituída por `VITE_TURNSTILE_SITE_KEY` no build. Se usar essa substituição no GitHub Actions, passe também a variável ao passo de build; o valor padrão funciona sem modificar o workflow.

No widget da Cloudflare, autorizar `wsoubar.github.io` para o endereço atual do GitHub Pages. Se o site usar outro domínio, autorizar também esse hostname. Para testes locais, autorizar explicitamente o hostname utilizado ou configurar as chaves oficiais de teste em um ambiente separado. Não habilitar chaves de teste em produção.

O frontend carrega o script oficial somente ao abrir o formulário e usa renderização explícita, apropriada à SPA. Expiração invalida o token; erros mostram opção de nova verificação. Após cada tentativa de envio, o widget é recriado. A mensagem digitada é preservada em caso de falha.

## Configurar o Supabase

O usuário informou que já executou a migração de contatos. **Não execute novamente o SQL original. Nenhuma nova migração é necessária para esta adaptação ao Turnstile.**

1. Abra o projeto Supabase usado pelo Greenmond e acesse **Edge Functions → Secrets**.
2. Cadastre:
   - `GREENMOND_TURNSTILE_SECRET_KEY`: a **Secret Key** do mesmo widget da Cloudflare. Nunca enviar pelo chat ou colocar no frontend/repositório.
   - `GREENMOND_CONTACT_ORIGINS`: `https://wsoubar.github.io` para o endereço atual. Se necessário, informar outras origens separadas por vírgula, sem caminho e sem barra final. Exemplos de desenvolvimento: `http://localhost:5173` ou `http://127.0.0.1:5173`.
3. Implante/atualize a função **greenmond-contact**, incluindo **index.ts e handler.ts**, disponíveis em `supabase/functions/greenmond-contact/`.
4. Configure a função pública, sem verificação de JWT: `verify_jwt = false`, conforme `supabase/config.toml`. No painel, desative a exigência de JWT dessa função; isso permite contato sem login. A função exige validação Turnstile antes de gravar.
5. O runtime deve fornecer `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` exclusivamente no servidor. São variáveis padrão do ambiente hospedado; não copiar credenciais privilegiadas para variáveis `VITE_`.
6. Execute o frontend local atualizado ou gere e publique o novo build pelo processo existente. A implementação local não publica o site nem implanta a função remotamente.

A versão anterior exigia `GREENMOND_CONTACT_IP_HEADER` e `GREENMOND_CONTACT_HASH_SECRET`: a função atual não usa essas variáveis. Não é preciso cadastrá-las. A tabela `greenmond_contact_limits` e a função `greenmond_receive_contact` do SQL original ficam preservadas, mas não participam do novo fluxo; a execução dessa RPC continua restrita ao servidor.

Se operar por CLI, confira a versão e a ajuda dos comandos instalados antes de selecionar o ambiente remoto. Inventarie o projeto antes de alterações: o Supabase pode ser compartilhado com outros aplicativos.

## Proteção

O servidor aceita somente POST JSON, até 32 KiB. Nome tem até 100 caracteres; contato, 200; assunto, 150; mensagem, 5.000. O corpo é texto simples e há honeypot.

Antes de salvar, a função chama Siteverify da Cloudflare, com timeout de dez segundos, e verifica `success`, hostname correspondente à origem e action `greenmond_contact`. Token ausente, inválido ou expirado impede a gravação. Falha da Cloudflare bloqueia o envio, mantendo os campos para nova tentativa.

O identificador da mensagem é derivado por SHA-256 do token. A chave primária do banco impede gravação duplicada do mesmo token mesmo em requisições concorrentes; o token bruto não é armazenado. Isso complementa a verificação de uso único da Cloudflare, cuja propagação não é instantânea. A lista de origens CORS não autentica clientes: a validação no servidor é obrigatória.

A proteção desta versão é Turnstile + honeypot + deduplicação; não há mais cota de cinco mensagens por IP. Não é necessário identificar ou armazenar IP no código da aplicação. Um atacante que obtenha diversos tokens válidos ainda pode enviar várias mensagens; se houver abuso observado, avaliar limitação adicional. Não há exclusão automática de mensagens nesta versão. Não registrar mensagens, contatos, tokens ou secrets nos logs; revisar separadamente a retenção de logs da infraestrutura.

Referências: [renderização do widget](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/) e [validação no servidor](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

## Verificação

- `npm test -- src/features/contact`: formulário, falhas, expiração, widget, deduplicação e validação no handler HTTP com Siteverify simulado.
- `npm run test:contact-db`: PostgreSQL/PGlite com privilégios adversos herdados, leitura privada, bloqueio de escrita direta, estados, rejeição de IDs duplicados e compatibilidade com os objetos do SQL original.
- `npm run lint`, `npm run typecheck`, `npm run build` e testes existentes para regressões.

Antes de liberar: testar verificação Turnstile real, envio público, persistência, recebimento com narrador ativo, negativa para jogador e narrador inativo e atualização de estados. Conferir que tokens de outro hostname/action são negados e que o mesmo token não duplica mensagens. Testes locais não comprovam as chaves do widget, configuração da Data API, secrets ou implantação remota.
