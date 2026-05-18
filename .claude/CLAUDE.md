# Claude Instructions — pushit-backend

## Rodar testes

**NUNCA usar `rtk vitest run`** — o rtk não parseia o output do vitest e trunca o resultado.

Sempre usar o binário direto com Node 24:

```bash
# Suite completa
nvm use 24 && node_modules/.bin/vitest run 2>&1 | tail -10

# Arquivo específico (preferir isso quando possível)
nvm use 24 && node_modules/.bin/vitest run tests/subscription.test.ts 2>&1 | tail -20

# Ver só falhas
nvm use 24 && node_modules/.bin/vitest run 2>&1 | grep -E "FAIL|×|✓|Tests " | tail -20
```

**Regra:** sempre rodar apenas o arquivo de teste relevante à mudança. Só rodar a suite completa no final para confirmar que não há regressões.

## Deploy

Após `git push`, o hook em `.claude/settings.json` inicia automaticamente um polling no `/status` a cada 20s e acorda o modelo quando a versão mudar em prod.

## Checklist antes de considerar mudança pronta

1. Rodar teste do arquivo afetado — zero falhas
2. Rodar suite completa — zero regressões
3. Atualizar `postman-group-collection.json` se mudou rota ou contrato
