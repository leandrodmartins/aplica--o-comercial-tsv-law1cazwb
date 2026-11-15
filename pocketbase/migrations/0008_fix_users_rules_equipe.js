/// <reference path="../pb_data/types.d.ts" />

/**
 * Migração 0008 — Correção da gestão de usuários (tela /equipe).
 *
 * Problemas corrigidos:
 * 1. O createRule não incluía o papel "admin": criar usuário só funcionava para
 *    quem tinha role 'tsv'. Como o admin logado tem role 'admin', o POST de
 *    criação falhava com 400 ("Values don't match." na resposta ao cliente).
 * 2. O updateRule permitia que QUALQUER autenticado com role admin/tsv
 *    alterasse role/distribuidor/cargo/e-mail de qualquer usuário, inclusive
 *    do próprio perfil (escalada de privilégio). Agora:
 *      - admin pode editar qualquer usuário;
 *      - tsv pode editar somente usuários do mesmo distribuidor;
 *      - o próprio usuário pode alterar apenas o próprio perfil, sem tocar
 *        em role, distribuidor, cargo, e-mail ou verified.
 * 3. O deleteRule liberava remoção para admin E tsv: agora somente admin.
 *
 * Idempotente: cada passo só altera o que já não está no estado desejado.
 */
migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // ---------- create: admin/tsv podem criar usuários ----------
    usersCol.createRule = "@request.auth.role = 'admin' || @request.auth.role = 'tsv'"

    // ---------- update: menor privilégio ----------
    // - admin: qualquer usuário;
    // - tsv: somente usuários do mesmo distribuidor (chave de isolamento);
    // - o próprio usuário: só o próprio perfil e sem tocar em campos sensíveis
    //   (role, distribuidor, cargo, e-mail, verified).
    usersCol.updateRule =
      "@request.auth.role = 'admin' || " +
      "(@request.auth.role = 'tsv' && distribuidor != '' && distribuidor = @request.auth.distribuidor) || " +
      '(id = @request.auth.id && @request.body.role:changed = false && ' +
      '@request.body.distribuidor:changed = false && @request.body.cargo:changed = false && ' +
      '@request.body.email:changed = false && @request.body.verified:changed = false)'

    // ---------- delete: somente admin ----------
    usersCol.deleteRule = "@request.auth.role = 'admin'"

    app.save(usersCol)
  },
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    // Restaura as regras deixadas pela migração 0007.
    usersCol.createRule = "@request.auth.role = 'admin' || @request.auth.role = 'tsv'"
    usersCol.updateRule =
      "(id = @request.auth.id && @request.body.role:changed = false && @request.body.distribuidor:changed = false) || @request.auth.role = 'admin' || @request.auth.role = 'tsv'"
    usersCol.deleteRule = "@request.auth.role = 'admin' || @request.auth.role = 'tsv'"
    app.save(usersCol)
  },
)
