# Alteração da versão final — Tutorial

## Escopo

Criada a página pública `TutorialPage.jsx` acessível em `/tutorial`, com guias específicos para aluno, instrutor e administrador, seis passos por perfil, respostas a dúvidas frequentes e caminhos para retornar ao site. Foi adicionado acesso a essa página nas telas de autenticação e nos painéis existentes. Não há novas dependências nem alterações de banco de dados.

## Arquivos principais alterados

- `client/src/App.jsx`
- `client/src/pages/TutorialPage.jsx` (novo)
- `client/src/components/AuthLayout.jsx`
- `client/src/components/BarraLateral.jsx`
- `client/src/components/PainelLayout.jsx`
- `client/src/pages/StudentDashboard.jsx`
- `client/src/styles/global.css`
- `server/tests/project-contract.test.js`
- `scripts/audit-static.mjs` (compatibilidade com ZIP sem diretório Git)

## Testes realizados nesta revisão

- **13 testes unitários e de contrato aprovados**, incluindo nova verificação estrutural da rota e dos links.
- **Auditoria estática aprovada:** 32 arquivos JavaScript/MJS e 161 referências de imports locais verificados; as 11 tabelas do esquema foram detectadas.
- **Não foi possível executar `npm run build` nesta sessão** por ausência das dependências npm já instaladas e falta de acesso ao registro para instalá-las. Validar compilação e interface no computador local antes do deploy.
- **Não houve novo teste E2E com MySQL** nesta atualização, pois não foram alteradas rotas, regras de negócio ou estrutura do banco.

## Segurança e documentação

O `README.md` do ZIP original continha um convite administrativo privado. O arquivo foi substituído por uma versão pública sem credenciais. O convite do professor não foi incluído no novo pacote para evitar sua publicação acidental no GitHub. Recomenda-se trocar o código administrativo exposto anteriormente após a avaliação.

## Para publicar

1. Faça backup do repositório anterior e preserve `.git` e os arquivos `.env`.
2. Copie os arquivos atualizados para a raiz do repositório local.
3. Execute `npm run audit` e `npm run build`.
4. Execute `git add -A`, `git commit` e `git push origin main`.
5. Verifique o auto-deploy no Render e abra `/tutorial` em computador e celular.
