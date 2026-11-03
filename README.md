# Greenmond

Aplicação de consulta em React + TypeScript, Vite, Tailwind e React Router. Dados e imagens migrados do acervo preservado em `old-versions/greenmond`.

## Executar

Use Node.js compatível com a versão do Vite registrada no lockfile (ambiente utilizado: Node 26).

```sh
npm ci
npm run dev
```

## Verificar

```sh
npm run validate:data
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

## Atualizar conteúdo

Os JSONs de `src/data/` são a fonte consumida pela aplicação. Imagens ficam em `public/images/`. Alterações precisam de novo build. Para repetir a extração dos originais, execute `python3 scripts/migrate-content.py`; isso sobrescreve os JSONs migrados. Não edite os originais para atualizar a aplicação nova. Consulte `docs/migracao.md` para procedência e limitações.

Conteúdo novo que deve sobreviver à extração, como história e ficha de Nicholai, fica em `content/overrides/` e é reaplicado pelo script após ler o legado. Atualize esse arquivo de origem ao revisar Nicholai.

O conteúdo é público: não inclua senhas ou dados privados nesses arquivos. Login e feed compartilhado ainda não foram implementados.

## Hospedagem

A saída é `dist/`. A aplicação usa `HashRouter`, compatível com GitHub Pages sem fallback de rotas. Exemplo: `https://wsoubar.github.io/greenmond-new/#/cidade/sunset-garden`. A configuração `base` no Vite define o subdiretório dos assets; não deve ser repetida nas rotas após o `#`.

Links antigos sem `#` precisam ser atualizados: o GitHub Pages continuará retornando 404 para esses caminhos. O workflow publica a pasta `dist/` após push na `main`. Valide abertura direta e recarregamento após o deploy.
