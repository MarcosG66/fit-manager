# Atualização — Catálogo unificado de exercícios

## Alteração visual

A navegação do instrutor não contém mais **Banco de Exercícios**, pois era uma duplicação do mesmo catálogo em modo somente leitura. Agora existe apenas **Catálogo de Exercícios**, com o ícone `bi-journal-text` (antigo ícone do Banco de Exercícios), igual ao painel administrativo.

## Funcionalidades centralizadas

Na única seção de catálogo, instrutores e administradores podem:

- consultar exercícios; buscar por nome e filtrar por grupo muscular;
- adicionar, editar e excluir exercícios, respeitando os relacionamentos com as fichas;
- abrir **Gerenciar grupos** para criar, renomear ou excluir grupos musculares sem exercícios vinculados.

O cadastro de exercícios exige ao menos um grupo muscular. A exclusão de grupos vinculados a exercícios é protegida pela chave estrangeira do MySQL e retorna erro HTTP 409, mostrado na interface.

## Compatibilidade

- **Banco MySQL:** inalterado; mantém as 11 tabelas e os dados existentes.
- **Back-end:** inalterado; preserva `/api/grupos`, `/api/grupos/:id`, `/api/exercicios` e `/api/exercicios/:id`.
- **Montagem de fichas:** `FormFicha.jsx` continua carregando exercícios por `/api/exercicios`.
- **Tutorial:** o guia do instrutor e do administrador agora menciona apenas o catálogo.

## Verificação local antes do deploy

```bash
npm run audit
npm run build
npm run dev
```

Entre como instrutor e administrador e confirme o ícone no menu e os fluxos de cadastro, edição e exclusão dos grupos e exercícios. Verifique que a lista de exercícios do formulário de ficha continua funcionando. Na hospedagem, a atualização é somente de código: não exige nova migração MySQL.
