/// <reference path="../pb_data/types.d.ts" />

/**
 * Migração 0005: campo apresentacao_upload em pacotes
 * Permite que o vendedor anexe sua própria apresentação (.pptx / .ppt / .pdf)
 * ao pacote de preparação, exibida junto à apresentação gerada pela IA.
 */
migrate(
  (app) => {
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
  },
  (app) => {
    try {
      const pacotes = app.findCollectionByNameOrId('pacotes')
      const f = pacotes.fields.getByName('apresentacao_upload')
      if (f) {
        pacotes.fields.removeByName('apresentacao_upload')
        app.save(pacotes)
      }
    } catch (_) {}
  },
)
