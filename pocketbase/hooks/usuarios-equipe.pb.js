/// <reference path="../pb_data/types.d.ts" />

/**
 * Rotas dedicadas para a tela Equipe & Usuários (/equipe):
 *   POST /backend/v1/usuarios-equipe/criar
 *   POST /backend/v1/usuarios-equipe/atualizar
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
    const existente = $app.findAuthRecordByEmail('users', email)
    if (existente) {
      return e.badRequestError('Já existe um usuário cadastrado com este e-mail.')
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

    if (!nome || !email || !papel) {
      return e.badRequestError('Informe nome, e-mail e papel do usuário.')
    }
    if (papel !== 'tsv' && papel !== 'vendedor' && papel !== 'admin' && papel !== 'revisor') {
      return e.badRequestError('Papel inválido: use admin, tsv, revisor ou vendedor.')
    }
    if (email.indexOf('@') < 1 || email.indexOf('.') < 0) {
      return e.badRequestError('E-mail inválido.')
    }

    // Duplicidade: o e-mail novo não pode pertencer a OUTRO usuário.
    if (email !== rec.getString('email')) {
      const existente = $app.findAuthRecordByEmail('users', email)
      if (existente && existente.id !== id) {
        return e.badRequestError('Já existe um usuário cadastrado com este e-mail.')
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
