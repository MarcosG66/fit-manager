# Validação realizada ao gerar a entrega

Esta seção distingue **o que foi efetivamente verificado** do que precisa ser testado após instalar as dependências:

| Verificação | Resultado |
|---|---|
| Sintaxe dos arquivos JS/MJS do servidor e scripts | Aprovada pelo `node --check` |
| Resolução de imports locais (`.js`, `.jsx`, `.mjs`) | Sem caminhos ausentes |
| Leitura de todos os `package.json` | JSON válido |
| Testes unitários (`npm run test`) | 3 aprovados: códigos de vínculo e fuso horário |
| Instalação de pacotes npm neste ambiente | Não concluída (tentativa excedeu tempo limite) |
| Build React com Vite | **Não executado com sucesso** neste ambiente |
| API integrada a MySQL real | **Não testada** neste ambiente |
| Teste E2E com cadastros/fichas/cargas | Script entregue; **pendente de execução** no computador do usuário |
| Deploy no Render ou outra hospedagem | Configuração entregue; **não publicado** |

## Comandos para validar na sua máquina

```bash
npm run setup
npm install
npm run install:all
docker compose up -d --wait
npm run db:init
npm run db:check
npm run test
npm run build
npm run dev
```

Em um **segundo terminal**, com o banco de desenvolvimento e a API em execução:

```bash
npm run test:e2e
```

Após os testes, navegue pelos três perfis. No caso de falha, revise `docs/TESTES_FINAIS.md` antes de publicar.
