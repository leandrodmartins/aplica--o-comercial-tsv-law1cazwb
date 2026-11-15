/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook: users-create — saneia o payload de criação/atualização de usuários
 * (tela /equipe) no servidor, evitando erros de validação de senha do
 * PocketBase quando o cliente não envia (ou envia vazio) password/passwordConfirm.
 *
 * - Em CRIAÇÃO: se password/passwordConfirm vierem vazios, usa a senha
 *   provisória padrão (a mesma do frontend) para que a conta nasça válida.
 * - Em ATUALIZAÇÃO: remove qualquer password/passwordConfirm VAZIO — editar
 *   nome, e-mail, papel, distribuidor e cargo não pode exigir senha.
 *
 * Toda a lógica fica inline no callback (exigência do JSVM do PocketBase).
 */
onRecordCreateRequest((e) => {
  const body = e.requestInfo().body || {}
  const senha = typeof body.password === 'string' ? body.password : ''
  const confirm = typeof body.passwordConfirm === 'string' ? body.passwordConfirm : ''
  if (!senha && !confirm) {
    const provisoria = 'Mudar@2026'
    body.password = provisoria
    body.passwordConfirm = provisoria
    e.requestInfo().body = body
  }
  e.next()
}, 'users')

onRecordUpdateRequest((e) => {
  const body = e.requestInfo().body || {}
  if ('password' in body && String(body.password ?? '') === '') delete body.password
  if ('passwordConfirm' in body && String(body.passwordConfirm ?? '') === '') {
    delete body.passwordConfirm
  }
  e.requestInfo().body = body
  e.next()
}, 'users')
