/// <reference path="../pb_data/types.d.ts" />

/**
 * Migração 0006: coleção pacote_arquivos — gestor de arquivos estilo Drive
 * para a aba de Apresentação do pacote. Cada registro é um arquivo (pptx, ppt,
 * pdf, docx, xlsx ou imagem) vinculado a um pacote, com nome, tipo, tamanho,
 * quem enviou e data. Regras por papel: TSV lê/escreve; vendedor só lê
 * arquivos dos pacotes em que é o responsável pela oportunidade.
 */
migrate(
  (app) => {
    if (app.hasTable('pacote_arquivos')) return // já aplicada em alguma cópia

    const pacotesId = app.findCollectionByNameOrId('pacotes').id
    const oportunidadeId = app.findCollectionByNameOrId('oportunidades').id

    const colecao = new Collection({
      name: 'pacote_arquivos',
      type: 'base',
      // Leitura: TSV vê tudo; vendedor vê arquivos do seu pacote.
      listRule:
        "@request.auth.id != '' && (@request.auth.role = 'tsv' || pacote.oportunidade.responsavel = @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (@request.auth.role = 'tsv' || pacote.oportunidade.responsavel = @request.auth.id)",
      // Escrita: somente TSV (gestor envia, vendedor só baixa).
      createRule:
        "@request.auth.id != '' && @request.auth.role = 'tsv' && pacote.oportunidade.responsavel != ''",
      updateRule:
        "@request.auth.id != '' && @request.auth.role = 'tsv' && pacote.oportunidade.responsavel != ''",
      deleteRule: "@request.auth.id != '' && @request.auth.role = 'tsv'",
      fields: [
        { name: 'pacote', type: 'relation', required: true, collectionId: pacotesId, maxSelect: 1 },
        {
          name: 'enviado_por',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'nome', type: 'text', required: true, max: 255 },
        { name: 'tipo', type: 'text', max: 120 },
        { name: 'tamanho', type: 'number', onlyInt: true, min: 0 },
        {
          name: 'arquivo',
          type: 'file',
          required: true,
          maxSelect: 1,
          maxSize: 52428800, // 50 MB
          mimeTypes: [
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.ms-powerpoint',
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/msword',
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
          ],
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_pacote_arquivos_pacote ON pacote_arquivos (pacote)',
        'CREATE INDEX idx_pacote_arquivos_enviado_por ON pacote_arquivos (enviado_por)',
      ],
    })
    app.save(colecao)
  },
  (app) => {
    try {
      const colecao = app.findCollectionByNameOrId('pacote_arquivos')
      app.delete(colecao)
    } catch (_) {}
  },
)
