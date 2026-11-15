/// <reference path="../pb_data/types.d.ts" />

/**
 * Migração 0009 — Conta de demonstração do revisor técnico (idempotente).
 *
 * A migração 0007 já criou um usuário com papel 'revisor', mas na base atual
 * esse registro foi renomeado para um e-mail pessoal (leandrodmartins@…),
 * deixando de ser conta de demonstração. Esta migração garante (no-op se já
 * existir) a conta revisor@tsvgrupo.com.br, coerente com os dados do piloto.
 */
migrate(
  (app) => {
    const EMAIL = 'revisor@tsvgrupo.com.br'
    const SENHA = 'Skip@Pass' // mesma senha de demonstração dos outros perfis

    let rec = null
    try {
      rec = app.findAuthRecordByEmail('_pb_users_auth_', EMAIL)
    } catch (_) {}

    if (!rec) {
      rec = new Record(app.findCollectionByNameOrId('_pb_users_auth_'))
      rec.setEmail(EMAIL)
      rec.setPassword(SENHA)
      rec.setVerified(true)
      rec.set('name', 'Revisor Tecnico TSV')
      rec.set('role', 'revisor')
      rec.set('distribuidor', 'TSV Grupo Brasil')
      rec.set('cargo', 'Revisor Tecnico de Pacotes')
      app.save(rec)
    } else if (rec.getString('role') !== 'revisor') {
      // Criação tardia da coleção/role: alinha o papel sem sobrescrever o resto
      rec.set('role', 'revisor')
      app.save(rec)
    }
  },
  (app) => {
    try {
      const rec = app.findAuthRecordByEmail('_pb_users_auth_', 'revisor@tsvgrupo.com.br')
      app.delete(rec)
    } catch (_) {}
  },
)
