/// <reference path="../pb_data/types.d.ts" />

/**
 * Migração 0010: remove o campo órfão apresentacao_upload da coleção pacotes.
 *
 * O upload real de apresentação/arquivos usa a coleção pacote_arquivos e o
 * campo apresentacao_arquivo (ver GerenciadorArquivos); apresentacao_upload
 * (criada na migração 0005) nunca recebeu uso no app e fica como campo órfão.
 * Idempotente: se o campo não existir, a migração é um no-op.
 */
migrate(
  (app) => {
    try {
      const pacotes = app.findCollectionByNameOrId('pacotes')
      if (pacotes.fields.getByName('apresentacao_upload')) {
        pacotes.fields.removeByName('apresentacao_upload')
        app.save(pacotes)
      }
    } catch (_) {
      // Coleção não existe nesta cópia: nada a fazer.
    }
  },
  (app) => {
    // Down: recria o campo (mesma forma da 0005) apenas se ele não existir.
    try {
      const pacotes = app.findCollectionByNameOrId('pacotes')
      if (!pacotes.fields.getByName('apresentacao_upload')) {
        pacotes.fields.add(
          new Field({
            name: 'apresentacao_upload',
            type: 'file',
            required: false,
            maxSelect: 1,
            maxSize: 52428800, // 50 MB
            mimeTypes: [
              'application/vnd.openxmlformats-officedocument.presentationml.presentation',
              'application/vnd.ms-powerpoint',
              'application/pdf',
            ],
          }),
        )
        app.save(pacotes)
      }
    } catch (_) {}
  },
)
