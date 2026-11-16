/// <reference path="../pb_data/types.d.ts" />

/**
 * Migração 0011 — Alinha a semântica dos papéis: "gestor da operação" = admin + tsv.
 *
 * A varredura de isTSV no frontend liberou enviar/excluir documentos do acervo para
 * o admin; as regras da coleção acervo_tecnico (0002) eram estritas em role = 'tsv'
 * e o admin veria o botão e tomaria um erro de autorização. Esta migração alinha
 * create/update/delete de acervo_tecnico com o padrão das demais coleções (0007):
 * admin e tsv gerem, vendedor/revisor só leem. Idempotente: reaplica as mesmas regras.
 */
migrate(
  (app) => {
    try {
      const acervo = app.findCollectionByNameOrId('acervo_tecnico')
      acervo.createRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'tsv')"
      acervo.updateRule = acervo.createRule
      acervo.deleteRule = acervo.createRule
      app.save(acervo)
    } catch (err) {
      console.warn('[0011] ajuste de regras de acervo_tecnico falhou (seguindo):', err)
    }
  },
  (app) => {
    try {
      const acervo = app.findCollectionByNameOrId('acervo_tecnico')
      acervo.createRule = "@request.auth.role = 'tsv'"
      acervo.updateRule = acervo.createRule
      acervo.deleteRule = acervo.createRule
      app.save(acervo)
    } catch (_) {}
  },
)
