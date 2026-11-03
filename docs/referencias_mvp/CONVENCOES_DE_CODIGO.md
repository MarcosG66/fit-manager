# Padrões de escrita do FitManager

## Objetivo

O código deve ser compreensível para quem não participou da implementação. Priorize nomes descritivos, funções com responsabilidade clara e comentários que expliquem **motivos**, não a tradução literal de cada instrução.

## Convenções

| Elemento | Padrão | Exemplo |
| --- | --- | --- |
| Componentes React | PascalCase | `CardExercicio`, `StudentDashboard` |
| Hooks e funções JS | camelCase | `useResource`, `signSession`, `renderizarAba` |
| Constantes fixas | UPPER_SNAKE_CASE | `ITENS_MENU`, `SALT_ROUNDS` |
| Variáveis no banco | snake_case | `senha_hash`, `aluno_id` |
| Rotas da API | caminhos em minúsculas | `/api/auth/login`, `/api/fichas` |
| Nome de arquivos de componentes | PascalCase.jsx | `FormFicha.jsx` |

A interface e as regras de negócio usam preferencialmente nomes em português. Algumas bibliotecas e arquivos mantêm nomes convencionais em inglês, como `api`, `router`, `hooks` e `AuthContext`.

## Separação de responsabilidades

- **Página:** decide o layout geral e qual seção está visível.
- **Componente:** renderiza um formulário, cartão, tabela ou seção específica.
- **Contexto:** compartilha o estado global da sessão.
- **Hook:** reaproveita lógica do React, como carregamento de dados.
- **Serviço HTTP:** centraliza a comunicação com o back-end.
- **Rota do Express:** valida a entrada, verifica acesso e chama operações de banco.
- **Middleware:** faz verificações reutilizáveis antes ou depois das rotas.
- **Configuração:** centraliza pool do MySQL e detalhes de infraestrutura.

## Comentários

**Bom:** `// Incrementa a versão do token para invalidar sessões anteriores.`

**Desnecessário:** `// Soma mais um` antes de `contador++`.

**Muito importante:** manter comentários sobre `bcrypt`, JWT, transações e verificação de posse dos recursos. Eles explicam decisões técnicas que serão cobradas na apresentação.

## Formatação

O projeto inclui `.editorconfig`, `.prettierrc.json` e sugestões de extensão do VS Code. Após `npm install`, rode `npm run format` para aplicar o Prettier a todos os arquivos de código. A alteração de formatação deve ser separada de mudanças de comportamento quando possível.
