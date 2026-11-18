# Tutorial de uso — nova funcionalidade

## Acesso

- **Rota:** `/tutorial` (pública; não requer login).
- **Links:** tela de login e cadastro por meio de `AuthLayout.jsx`; cabeçalho e menu lateral de instrutor e administrador; cabeçalho do aluno.
- **Fluxo:** `App.jsx` monta `TutorialPage.jsx`, que apresenta um guia por perfil, com seis etapas por tipo de usuário e dúvidas frequentes.
- **Perfil inicial:** o tutorial usa o perfil autenticado, quando houver. Visitantes começam no guia do aluno e podem alternar pelos três botões.
- **Segurança:** nenhuma credencial ou permissão administrativa é exibida; o tutorial é apenas conteúdo informativo.
- **Banco/API:** nenhuma tabela nem endpoint foram adicionados.

## Como validar localmente

```bash
npm run install:all
npm run dev
```

Abra `http://localhost:5173/tutorial` e confirme os links a partir dos painéis. Para testar em produção, envie os novos arquivos ao GitHub e aguarde um novo deploy do Render.

## Arquivos alterados

- `client/src/pages/TutorialPage.jsx` — página e conteúdo dos três perfis.
- `client/src/App.jsx` — rota pública.
- `client/src/components/AuthLayout.jsx` — link para visitantes.
- `client/src/components/PainelLayout.jsx` e `BarraLateral.jsx` — acesso nos painéis desktop.
- `client/src/pages/StudentDashboard.jsx` — acesso no painel do aluno.
- `client/src/styles/global.css` — layout responsivo.
- `server/tests/project-contract.test.js` — verificação estrutural de acesso.

## Limites

O tutorial descreve os fluxos existentes; não oferece vídeos, visitas guiadas interativas nem execução automática de tarefas. A recuperação de senha por e-mail depende de um provedor configurado na hospedagem.
