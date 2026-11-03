# Checklist de testes da versão final

## Testes automatizados

1. `npm run audit`: executa verificações estáticas e 12 testes unitários/contratos, incluindo recuperação de senha e limitadores (sem banco).
2. `npm run build`: compila o React; exige `npm run install:all` antes.
3. `npm run db:check`: confirma a conexão MySQL e a existência das tabelas.
4. `npm run dev`: iniciar em um terminal.
5. `npm run test:e2e`: **em outro terminal**, cria dados fictícios em MySQL local; verifica cadastro aluno/instrutor/admin (se código configurado), vínculo, ficha, carga, arquivamento, histórico e autorização. Não rodar contra produção.

## Testes manuais — aluno

- [ ] Criar conta sem código de instrutor e entrar.
- [ ] Atualizar o navegador e continuar autenticado.
- [ ] Vincular por código de instrutor e ver o nome.
- [ ] Consultar ficha criada pelo instrutor.
- [ ] Registrar carga e atualizar a página (persistência).
- [ ] Marcar exercício como concluído e ver a barra de progresso.
- [ ] Registrar avaliação peso/altura e consultar IMC.
- [ ] Visualizar evolução semanal no gráfico.
- [ ] Editar dados da própria conta e alterar senha.
- [ ] Sair e entrar novamente com nova senha.

## Testes manuais — instrutor

- [ ] Criar conta de instrutor e entrar.
- [ ] Copiar código e vincular aluno cadastrado por conta própria.
- [ ] Ver aluno na lista, filtrar e buscar.
- [ ] Editar aluno e inativar; conferir bloqueio de login.
- [ ] Criar grupo muscular e exercício.
- [ ] Criar, editar e arquivar fichas de treino.
- [ ] Confirmar que o aluno não visualiza ficha arquivada.
- [ ] Confirmar que a evolução histórica permanece.

## Testes manuais — administrador

- [ ] Confirmar que cadastro admin sem convite válido é bloqueado.
- [ ] Criar admin com convite correto (secret no servidor).
- [ ] Entrar no painel administrativo.
- [ ] Consultar totais e buscar usuário por e-mail.
- [ ] Ativar/desativar conta de teste; confirmar invalidação de sessão.
- [ ] Gerenciar grupos e catálogo.
- [ ] Confirmar que aluno não consegue acessar endpoint /api/usuarios.

## Hospedagem

- [ ] `https://URL_REAL/api/health` responde `{"ok":true,"db":true}`.
- [ ] Rotas internas continuam acessíveis ao atualizar a página.
- [ ] Cookies com `Secure`, `HttpOnly`, `SameSite=Strict` em HTTPS.
- [ ] E-mail real de recuperação chega, código correto funciona e código vencido falha.
- [ ] Nenhuma credencial `.env` ou código de admin aparece nos arquivos públicos.
- [ ] MySQL remoto persiste as alterações após reiniciar o serviço.

> O ambiente que gerou este pacote não conseguiu concluir a instalação das dependências e **não executou testes de integração com um servidor MySQL**. Este checklist é requisito de validação da entrega.
