/// <reference path="../pb_data/types.d.ts" />

/**
 * Rotas dedicadas para a tela Equipe & Usuários (/equipe):
 *   GET  /backend/v1/usuarios-equipe/listar
 *   POST /backend/v1/usuarios-equipe/criar
 *   POST /backend/v1/usuarios-equipe/atualizar
 *   POST /backend/v1/usuarios-equipe/reset-senha
 *
 * A rota "listar" existe porque o CRUD nativo da coleção users oculta o campo
 * email dos registros de auth na API para quem não é o dono do registro (mesmo
 * mecanismo que protege o hash de senha) — com a regra de leitura liberada, o
 * e-mail dos outros usuários chega vazio no frontend. Hooks rodam com
 * privilégio de servidor, então o campo vem preenchido.
 *
 * Motivo: o fluxo nativo de CRUD de auth records do PocketBase devolve erros
 * que confundem o usuário ("passwords don't match", "value must be unique")
 * mesmo quando nada de senha foi enviado. Aqui a validação é própria:
 * - duplicidade de e-mail -> mensagem clara e específica;
 * - nunca se toca em senha na edição;
 * - na criação a conta nasce com senha provisória aleatória (só o servidor
 *   conhece) e o primeiro acesso é pelo e-mail de "definir senha".
 *
 * Toda a lógica fica inline no callback (exigência do JSVM do PocketBase).
 *
 * Formato dos usuários devolvido: { id, email, name, role, distribuidor,
 * cargo, created, updated }.
 */

// Lista todos os usuários da equipe. Existe porque o CRUD nativo da coleção
// users oculta o campo email de registros de auth na API para quem não é o
// dono do registro — hooks rodam com privilégio de servidor, então o campo
// vem preenchido para todos. Somente admin/tsv (mesmo padrão das rotas
// criar/atualizar). Ordenado por name; formato igual ao das outras rotas.
routerAdd(
  'GET',
  '/backend/v1/usuarios-equipe/listar',
  (e) => {
    const auth = e.auth
    if (!auth) return e.unauthorizedError('Faça login para gerenciar usuários.')
    const papelAuth = auth.getString('role')
    if (papelAuth !== 'admin' && papelAuth !== 'tsv') {
      return e.forbiddenError('Somente administradores e TSV podem listar usuários.')
    }

    const usuarios = $app.findRecordsByFilter('users', '', 'name', 0, 0).map((rec) => ({
      id: rec.id,
      email: rec.getString('email'),
      name: rec.getString('name'),
      role: rec.getString('role'),
      distribuidor: rec.getString('distribuidor'),
      cargo: rec.getString('cargo'),
      created: rec.getString('created'),
      updated: rec.getString('updated'),
    }))

    return e.json(200, usuarios)
  },
  $apis.requireAuth(),
)

routerAdd(
  'POST',
  '/backend/v1/usuarios-equipe/criar',
  (e) => {
    const auth = e.auth
    if (!auth) return e.unauthorizedError('Faça login para gerenciar usuários.')
    const papelAuth = auth.getString('role')
    if (papelAuth !== 'admin' && papelAuth !== 'tsv') {
      return e.forbiddenError('Somente administradores e TSV podem criar usuários.')
    }

    const body = e.requestInfo().body || {}
    const nome = String(body.name ?? '').trim()
    const email = String(body.email ?? '')
      .trim()
      .toLowerCase()
    const papel = String(body.role ?? '').trim()
    const distribuidor = String(body.distribuidor ?? '').trim()
    const cargo = String(body.cargo ?? '').trim()

    if (!nome || !email || !papel) {
      return e.badRequestError('Informe nome, e-mail e papel do usuário.')
    }
    if (papel !== 'tsv' && papel !== 'vendedor' && papel !== 'admin' && papel !== 'revisor') {
      return e.badRequestError('Papel inválido: use admin, tsv, revisor ou vendedor.')
    }
    if (email.indexOf('@') < 1 || email.indexOf('.') < 0) {
      return e.badRequestError('E-mail inválido.')
    }

    // Duplicidade de e-mail com mensagem específica (o índice unique do
    // PocketBase devolveria "value must be unique", genérico demais).
    // findAuthRecordByEmail LANÇA ("sql: no rows") quando não encontra —
    // nunca devolve null — então a ausência tem de ser capturada como "livre".
    try {
      const existente = $app.findAuthRecordByEmail('users', email)
      if (existente) {
        return e.badRequestError('Já existe um usuário cadastrado com este e-mail.')
      }
    } catch (_) {
      // E-mail livre: pode cadastrar.
    }

    const col = $app.findCollectionByNameOrId('users')
    const rec = new Record(col)
    rec.set('name', nome)
    rec.set('email', email)
    rec.set('role', papel)
    rec.set('distribuidor', distribuidor)
    rec.set('cargo', cargo)
    // Senha provisória aleatória: ninguém a conhece; o acesso real é pelo
    // e-mail de "definir senha" (ação "Senha" da tela, requestPasswordReset).
    const provisoria = 'Tsv' + Math.random().toString(36).slice(2, 10) + '!Aa1'
    rec.set('password', provisoria)
    rec.set('passwordConfirm', provisoria)
    try {
      $app.save(rec)
    } catch (err) {
      const msg = String(err && err.message ? err.message : err)
      if (msg.indexOf('unique') >= 0 || msg.indexOf('already') >= 0) {
        return e.badRequestError('Já existe um usuário cadastrado com este e-mail.')
      }
      console.warn('[usuarios-equipe] falha ao criar usuário:', msg)
      return e.badRequestError('Não foi possível criar o usuário: ' + msg)
    }

    return e.json(200, {
      id: rec.id,
      email: rec.getString('email'),
      name: rec.getString('name'),
      role: rec.getString('role'),
      distribuidor: rec.getString('distribuidor'),
      cargo: rec.getString('cargo'),
      created: rec.getString('created'),
      updated: rec.getString('updated'),
    })
  },
  $apis.requireAuth(),
)

// Dispara o e-mail nativo de redefinição de senha do PocketBase para o usuário
// da equipe. Existe porque o requestPasswordReset nativo feito pelo NAVEGADOR
// nunca chegava a registrar chamada no servidor; por hook, com o mesmo
// mecanismo do PocketBase, o envio acontece de fato. O template/link enviado
// é o do hook reset-senha-email.pb.js (onMailerRecordPasswordResetSend), que
// aponta para a página /redefinir-senha do app. Somente admin/tsv.
routerAdd(
  'POST',
  '/backend/v1/usuarios-equipe/reset-senha',
  (e) => {
    const auth = e.auth
    if (!auth) return e.unauthorizedError('Faça login para gerenciar usuários.')
    const papelAuth = auth.getString('role')
    if (papelAuth !== 'admin' && papelAuth !== 'tsv') {
      return e.forbiddenError('Somente administradores e TSV podem enviar o e-mail de senha.')
    }

    const body = e.requestInfo().body || {}
    let email = String(body.email ?? '')
      .trim()
      .toLowerCase()
    const id = String(body.id ?? '').trim()

    if (!email && !id) {
      return e.badRequestError('Informe o e-mail do usuário.')
    }

    // Localiza o registro: por e-mail, ou por id (e pega o e-mail dele).
    // ATENÇÃO: findAuthRecordByEmail/findRecordById LANÇAM ("sql: no rows")
    // quando não encontram — nunca devolvem null — então a busca é try/catch.
    let rec = null
    if (email) {
      if (email.indexOf('@') < 1 || email.indexOf('.') < 0) {
        return e.badRequestError('E-mail inválido.')
      }
      try {
        rec = $app.findAuthRecordByEmail('users', email)
      } catch (_) {
        return e.notFoundError('Usuário não encontrado para este e-mail.')
      }
    } else {
      try {
        rec = $app.findRecordById('users', id)
      } catch (_) {
        return e.notFoundError('Usuário não encontrado.')
      }
      email = rec.getString('email')
      if (!email) {
        return e.badRequestError(
          'Este usuário está sem e-mail cadastrado — edite o cadastro e informe um e-mail antes de enviar o link de senha.',
        )
      }
    }

    if (!rec.getString('email')) {
      return e.badRequestError(
        'Este usuário está sem e-mail cadastrado — edite o cadastro e informe um e-mail antes de enviar o link de senha.',
      )
    }

    // Envia pelo mecanismo nativo do PocketBase (mesmo fluxo do
    // requestPasswordReset) — passa pelo onMailerRecordPasswordResetSend,
    // que aplica o template/link do app (/redefinir-senha).
    // Erros nunca são devolvidos crus ao frontend: são traduzidos em
    // mensagens legíveis em português.
    try {
      $mails.sendRecordPasswordReset($app, rec)
    } catch (err) {
      const cru = String((err && err.message) || err || '')
      console.warn('[usuarios-equipe] falha ao enviar e-mail de senha:', cru)
      let amigavel = cru
      if (cru.indexOf('no member') >= 0) {
        amigavel = 'erro interno no envio (template do e-mail) — entre em contato com o suporte.'
      } else if (
        cru.indexOf('connect') >= 0 ||
        cru.indexOf('dial') >= 0 ||
        cru.indexOf('timeout') >= 0 ||
        cru.indexOf('refused') >= 0
      ) {
        amigavel =
          'o servidor de e-mail não respondeu — verifique a configuração SMTP e tente de novo.'
      } else if (cru.indexOf('smtp') >= 0 || cru.indexOf('535') >= 0 || cru.indexOf('auth') >= 0) {
        amigavel =
          'o servidor de e-mail recusou as credenciais — verifique a configuração SMTP no painel.'
      }
      return e.badRequestError(
        'Não foi possível enviar o e-mail de definição de senha: ' + amigavel,
      )
    }

    return e.json(200, { ok: true, email: rec.getString('email') })
  },
  $apis.requireAuth(),
)

routerAdd(
  'POST',
  '/backend/v1/usuarios-equipe/atualizar',
  (e) => {
    const auth = e.auth
    if (!auth) return e.unauthorizedError('Faça login para gerenciar usuários.')
    const papelAuth = auth.getString('role')
    if (papelAuth !== 'admin' && papelAuth !== 'tsv') {
      return e.forbiddenError('Somente administradores e TSV podem editar usuários.')
    }

    const body = e.requestInfo().body || {}
    const id = String(body.id ?? '').trim()
    if (!id) return e.badRequestError('Identificador do usuário ausente.')

    let rec
    try {
      rec = $app.findRecordById('users', id)
    } catch (_) {
      return e.notFoundError('Usuário não encontrado.')
    }

    const nome = String(body.name ?? '').trim()
    const email = String(body.email ?? '')
      .trim()
      .toLowerCase()
    const papel = String(body.role ?? '').trim()
    const distribuidor = String(body.distribuidor ?? '').trim()
    const cargo = String(body.cargo ?? '').trim()

    const emailAntigo = rec.getString('email').trim().toLowerCase()
    if (!nome || !email || !papel) {
      return e.badRequestError('Informe nome, e-mail e papel do usuário.')
    }
    if (papel !== 'tsv' && papel !== 'vendedor' && papel !== 'admin' && papel !== 'revisor') {
      return e.badRequestError('Papel inválido: use admin, tsv, revisor ou vendedor.')
    }
    if (email.indexOf('@') < 1 || email.indexOf('.') < 0) {
      return e.badRequestError('E-mail inválido.')
    }

    // Duplicidade: o e-mail novo não pode pertencer a OUTRO usuário. Um registro
    // com e-mail VAZIO (caso "Leandro": edições antigas via PATCH nativo falharam
    // no meio e deixaram o campo em branco) é tratado como preenchimento novo —
    // o e-mail informado conta como mudança e não como "igual ao atual".
    // ATENÇÃO: findAuthRecordByEmail LANÇA ("sql: no rows") quando não encontra —
    // nunca devolve null. Sem try/catch, um e-mail livre estoura 500 antes de
    // qualquer mensagem clara; por isso a ausência é capturada como "livre".
    if (email !== emailAntigo) {
      try {
        const existente = $app.findAuthRecordByEmail('users', email)
        if (existente && existente.id !== id) {
          return e.badRequestError('Já existe um usuário cadastrado com este e-mail.')
        }
      } catch (_) {
        // E-mail livre: pode usar.
      }
      rec.set('email', email)
    }

    rec.set('name', nome)
    rec.set('role', papel)
    rec.set('distribuidor', distribuidor)
    rec.set('cargo', cargo)

    try {
      $app.save(rec)
    } catch (err) {
      const msg = String(err && err.message ? err.message : err)
      if (msg.indexOf('unique') >= 0 || msg.indexOf('already') >= 0) {
        return e.badRequestError('Já existe um usuário cadastrado com este e-mail.')
      }
      console.warn('[usuarios-equipe] falha ao atualizar usuário:', msg)
      return e.badRequestError('Não foi possível salvar o usuário: ' + msg)
    }

    return e.json(200, {
      id: rec.id,
      email: rec.getString('email'),
      name: rec.getString('name'),
      role: rec.getString('role'),
      distribuidor: rec.getString('distribuidor'),
      cargo: rec.getString('cargo'),
      created: rec.getString('created'),
      updated: rec.getString('updated'),
    })
  },
  $apis.requireAuth(),
)
