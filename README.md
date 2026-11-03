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

O conteúdo é público: não inclua senhas ou dados privados nesses arquivos. Login e feed compartilhado ainda não foram implementados.

## Hospedagem

A saída é `dist/`. O host deve servir `index.html` como fallback das rotas React. Para hospedar em subdiretório, ajuste `base` no `vite.config.ts` antes do build e valide os assets. Nenhum deploy foi executado.
