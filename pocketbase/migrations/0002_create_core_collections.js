migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Acervo Técnico (materiais Brigade para envio e consulta da IA)
    const acervo = new Collection({
      name: 'acervo_tecnico',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'tsv'",
      updateRule: "@request.auth.role = 'tsv'",
      deleteRule: "@request.auth.role = 'tsv'",
      fields: [
        { name: 'titulo', type: 'text', required: true },
        { name: 'codigo', type: 'text', required: false },
        {
          name: 'categoria',
          type: 'select',
          required: true,
          values: ['catalogo', 'ficha_tecnica', 'apresentacao', 'manual', 'guia_aplicacao'],
          maxSelect: 1,
        },
        {
          name: 'linha_produto',
          type: 'select',
          required: true,
          values: [
            'radar_bsis',
            'cameras_360_backeye',
            'alarmes_bbs_som_branco',
            'sensores_ultrassonicos',
            'mdvr_gravadores',
            'ia_deteccao_pedestres',
            'geral_portfolio',
          ],
          maxSelect: 1,
        },
        { name: 'resumo', type: 'text', required: false },
        { name: 'conteudo_texto', type: 'editor', required: false },
        {
          name: 'arquivo',
          type: 'file',
          required: false,
          maxSelect: 1,
          maxSize: 20971520, // 20 MB
          mimeTypes: [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
          ],
        },
        { name: 'ativo', type: 'bool', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_acervo_categoria ON acervo_tecnico (categoria)',
        'CREATE INDEX idx_acervo_linha ON acervo_tecnico (linha_produto)',
      ],
    })
    app.save(acervo)

    // 2. Oportunidades: contato, empresa, mensagem original, aplicação, responsável, estado, próxima ação
    const oportunidades = new Collection({
      name: 'oportunidades',
      type: 'base',
      // TSV vê todas as oportunidades; vendedor vê somente as suas
      listRule:
        "@request.auth.id != '' && (@request.auth.role = 'tsv' || responsavel = @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (@request.auth.role = 'tsv' || responsavel = @request.auth.id)",
      createRule: "@request.auth.id != ''",
      updateRule:
        "@request.auth.id != '' && (@request.auth.role = 'tsv' || responsavel = @request.auth.id)",
      deleteRule: "@request.auth.role = 'tsv'",
      fields: [
        { name: 'empresa', type: 'text', required: true },
        { name: 'contato_nome', type: 'text', required: true },
        { name: 'contato_email', type: 'email', required: false },
        { name: 'contato_telefone', type: 'text', required: false },
        { name: 'contato_cargo', type: 'text', required: false },
        { name: 'mensagem_original', type: 'editor', required: true },
        { name: 'aplicacao', type: 'text', required: true },
        {
          name: 'segmento',
          type: 'select',
          required: false,
          values: [
            'mineracao',
            'construcao',
            'logistica_rodoviaria',
            'onibus_urbano',
            'agricola',
            'portuario',
            'frotas_leves',
            'outro',
          ],
          maxSelect: 1,
        },
        {
          name: 'estado',
          type: 'select',
          required: true,
          values: ['rascunho', 'em_revisao', 'aprovado', 'enviado'],
          maxSelect: 1,
        },
        { name: 'proxima_acao', type: 'text', required: true },
        { name: 'proxima_acao_data', type: 'date', required: false },
        {
          name: 'responsavel',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'criado_por',
          type: 'relation',
          required: false,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'distribuidora', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_oportunidades_responsavel ON oportunidades (responsavel)',
        'CREATE INDEX idx_oportunidades_estado ON oportunidades (estado)',
      ],
    })
    app.save(oportunidades)

    // 3. Pacotes: briefing, perguntas, minuta de e-mail, apresentação, status de revisão
    const pacotes = new Collection({
      name: 'pacotes',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.role = 'tsv' || oportunidade.responsavel = @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (@request.auth.role = 'tsv' || oportunidade.responsavel = @request.auth.id)",
      createRule: "@request.auth.id != ''",
      updateRule:
        "@request.auth.id != '' && (@request.auth.role = 'tsv' || oportunidade.responsavel = @request.auth.id)",
      deleteRule: "@request.auth.role = 'tsv'",
      fields: [
        {
          name: 'oportunidade',
          type: 'relation',
          required: true,
          collectionId: oportunidades.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'versao', type: 'number', required: false, onlyInt: true },
        { name: 'briefing_contexto', type: 'editor', required: false },
        { name: 'briefing_hipoteses', type: 'editor', required: false },
        { name: 'briefing_riscos', type: 'editor', required: false },
        { name: 'perguntas_priorizadas', type: 'json', required: false },
        { name: 'minuta_email_assunto', type: 'text', required: false },
        { name: 'minuta_email_corpo', type: 'editor', required: false },
        { name: 'apresentacao_slides', type: 'json', required: false },
        { name: 'pontos_pendentes', type: 'json', required: false },
        { name: 'referencias_brigade', type: 'json', required: false },
        {
          name: 'status_revisao',
          type: 'select',
          required: true,
          values: ['rascunho', 'em_revisao', 'aprovado', 'rejeitado', 'enviado'],
          maxSelect: 1,
        },
        { name: 'notas_revisor', type: 'editor', required: false },
        {
          name: 'revisor',
          type: 'relation',
          required: false,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'aprovado_em', type: 'date', required: false },
        { name: 'enviado_em', type: 'date', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_pacotes_oportunidade ON pacotes (oportunidade)',
        'CREATE INDEX idx_pacotes_status ON pacotes (status_revisao)',
      ],
    })
    app.save(pacotes)
  },
  (app) => {
    try {
      const pacotes = app.findCollectionByNameOrId('pacotes')
      app.delete(pacotes)
    } catch (_) {}
    try {
      const oportunidades = app.findCollectionByNameOrId('oportunidades')
      app.delete(oportunidades)
    } catch (_) {}
    try {
      const acervo = app.findCollectionByNameOrId('acervo_tecnico')
      app.delete(acervo)
    } catch (_) {}
  },
)
