/// <reference path="../pb_data/types.d.ts" />

/**
 * Migração 0007 — PRD "Assistente Comercial Brigade (MVP)", escopo essencial:
 * 1. Papel "revisor" separado + papel "admin" (papeis: admin, tsv, revisor, vendedor).
 * 2. Distribuidor como chave de isolamento: campo "distribuidor" em users e
 *    oportunidades; vendedor só vê dados do próprio distribuidor, TSV/admin/revisor veem tudo.
 * 3. Coleção eventos_trilha: trilha de eventos (quem fez o quê e quando) por oportunidade/pacote.
 * 4. Conta admin inicial provisionada (admin@tsvgrupo.com.br / Admin@Brigade2026)
 *    e conta de revisor de exemplo (revisor@tsvgrupo.com.br / Revisor@Brigade2026).
 */
migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // Papéis com papel de admin (gestão de usuários) e revisor independente
    const roleField = usersCol.fields.getByName('role')
    if (roleField) {
      roleField.values = ['admin', 'tsv', 'revisor', 'vendedor']
    }

    // Campo distribuidor no usuário (chave de isolamento; "distribuidora" texto livre legado permanece)
    if (!usersCol.fields.getByName('distribuidor')) {
      usersCol.fields.add(new TextField({ name: 'distribuidor', required: false }))
    }

    // Apenas admin (e TSV legado) gerencia usuários
    usersCol.listRule = "@request.auth.id != ''"
    usersCol.viewRule = "@request.auth.id != ''"
    usersCol.createRule = "@request.auth.role = 'admin' || @request.auth.role = 'tsv'"
    usersCol.updateRule =
      "id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'tsv'"
    usersCol.deleteRule = "@request.auth.role = 'admin' || @request.auth.role = 'tsv'"
    app.save(usersCol)

    // Preenche distribuidor dos usuários a partir do campo legado distribuidora
    const usersLegado = app.findRecordsByFilter(
      '_pb_users_auth_',
      "distribuidor = '' && distribuidora != ''",
      '',
      0,
      0,
    )
    for (const u of usersLegado) {
      u.set('distribuidor', u.getString('distribuidora'))
      app.save(u)
    }

    // Papéis com acesso total (não sofrem isolamento por distribuidor)
    const ROLE_SEM_ISOLAMENTO = [
      "@request.auth.role = 'tsv'",
      "@request.auth.role = 'admin'",
      "@request.auth.role = 'revisor'",
    ].join(' || ')

    // ---- Oportunidades: campo distribuidor + regras por distribuidor ----
    const opsCol = app.findCollectionByNameOrId('oportunidades')
    if (!opsCol.fields.getByName('distribuidor')) {
      opsCol.fields.add(new TextField({ name: 'distribuidor', required: false }))
    }
    const visivelVendedorOp =
      "(@request.auth.role = 'vendedor' && distribuidor != '' && distribuidor = @request.auth.distribuidor)"
    const regraLeituraOp = `@request.auth.id != '' && (${ROLE_SEM_ISOLAMENTO} || ${visivelVendedorOp})`
    opsCol.listRule = regraLeituraOp
    opsCol.viewRule = regraLeituraOp
    opsCol.createRule = `@request.auth.id != '' && (${ROLE_SEM_ISOLAMENTO} || @request.auth.role = 'vendedor')`
    opsCol.updateRule = regraLeituraOp
    opsCol.deleteRule = "@request.auth.role = 'admin' || @request.auth.role = 'tsv'"
    // Em v0.23 collection.indexes é um array de strings SQL (sem getByName):
    // verifica presença pelo texto do índice.
    let temIdxDistribuidor = false
    for (let i = 0; i < opsCol.indexes.size(); i++) {
      if (String(opsCol.indexes.get(i)).indexOf('idx_oportunidades_distribuidor') !== -1) {
        temIdxDistribuidor = true
      }
    }
    if (!temIdxDistribuidor) {
      opsCol.indexes.add(
        'CREATE INDEX idx_oportunidades_distribuidor ON oportunidades (distribuidor)',
      )
    }
    app.save(opsCol)

    // Backfill: herda o distribuidor do responsável quando o campo veio vazio
    const opsSemDistribuidor = app.findRecordsByFilter(
      'oportunidades',
      "distribuidor = '' && responsavel != ''",
      '',
      0,
      0,
    )
    for (const op of opsSemDistribuidor) {
      try {
        const resp = app.findRecordById('_pb_users_auth_', op.getString('responsavel'))
        const dist = resp.getString('distribuidor')
        if (dist) {
          op.set('distribuidor', dist)
          app.save(op)
        }
      } catch (_) {}
    }

    // ---- Pacotes: regras seguem o distribuidor da oportunidade ----
    const pacCol = app.findCollectionByNameOrId('pacotes')
    const visivelVendedorPac =
      "(@request.auth.role = 'vendedor' && oportunidade.distribuidor != '' && oportunidade.distribuidor = @request.auth.distribuidor)"
    const regraLeituraPac = `@request.auth.id != '' && (${ROLE_SEM_ISOLAMENTO} || ${visivelVendedorPac})`
    pacCol.listRule = regraLeituraPac
    pacCol.viewRule = regraLeituraPac
    pacCol.createRule = `@request.auth.id != '' && (${ROLE_SEM_ISOLAMENTO} || @request.auth.role = 'vendedor')`
    pacCol.updateRule = regraLeituraPac
    pacCol.deleteRule = "@request.auth.role = 'admin' || @request.auth.role = 'tsv'"
    app.save(pacCol)

    // ---- Pacote_arquivos: regras seguem o distribuidor da oportunidade ----
    try {
      const arqCol = app.findCollectionByNameOrId('pacote_arquivos')
      const visivelVendedorArq =
        "(@request.auth.role = 'vendedor' && pacote.oportunidade.distribuidor != '' && pacote.oportunidade.distribuidor = @request.auth.distribuidor)"
      const regraLeituraArq = `@request.auth.id != '' && (${ROLE_SEM_ISOLAMENTO} || ${visivelVendedorArq})`
      arqCol.listRule = regraLeituraArq
      arqCol.viewRule = regraLeituraArq
      arqCol.createRule = `@request.auth.id != '' && (${ROLE_SEM_ISOLAMENTO} || @request.auth.role = 'vendedor')`
      arqCol.updateRule = regraLeituraArq
      arqCol.deleteRule = "@request.auth.role = 'admin' || @request.auth.role = 'tsv'"
      app.save(arqCol)
    } catch (_) {}

    // ---- Trilha de eventos (quem fez o quê e quando) ----
    if (!app.hasTable('eventos_trilha')) {
      const eventos = new Collection({
        name: 'eventos_trilha',
        type: 'base',
        listRule: `@request.auth.id != '' && (${ROLE_SEM_ISOLAMENTO} || oportunidade.distribuidor = @request.auth.distribuidor)`,
        viewRule: `@request.auth.id != '' && (${ROLE_SEM_ISOLAMENTO} || oportunidade.distribuidor = @request.auth.distribuidor)`,
        createRule: "@request.auth.id != ''",
        updateRule: null,
        deleteRule: null,
        fields: [
          {
            name: 'oportunidade',
            type: 'relation',
            required: true,
            collectionId: opsCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          {
            name: 'pacote',
            type: 'relation',
            required: false,
            collectionId: pacCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          {
            name: 'usuario',
            type: 'relation',
            required: true,
            collectionId: '_pb_users_auth_',
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'acao', type: 'text', required: true, max: 255 },
          { name: 'detalhe', type: 'text', required: false, max: 2000 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_eventos_trilha_oportunidade ON eventos_trilha (oportunidade)',
          'CREATE INDEX idx_eventos_trilha_pacote ON eventos_trilha (pacote)',
        ],
      })
      app.save(eventos)
    }

    // ---- Contas iniciais: admin e revisor ----
    const garantirUsuario = (email, senha, nome, role, distribuidor, cargo) => {
      let rec = null
      try {
        rec = app.findAuthRecordByEmail('_pb_users_auth_', email)
      } catch (_) {}
      if (!rec) {
        rec = new Record(usersCol)
        rec.setEmail(email)
        rec.setPassword(senha)
        rec.setVerified(true)
        rec.set('name', nome)
        rec.set('role', role)
        rec.set('distribuidor', distribuidor)
        rec.set('cargo', cargo)
        app.save(rec)
      } else if (role === 'admin' && rec.getString('role') !== 'admin') {
        rec.set('role', 'admin')
        if (rec.getString('distribuidor') === '') rec.set('distribuidor', distribuidor)
        app.save(rec)
      }
      return rec
    }

    // Admin principal: usuário existente da TSV promovido a admin
    garantirUsuario(
      'flavio.zanotta@brigade-electronics.com',
      'Skip@Pass',
      'Flavio Zanotta (Admin TSV)',
      'admin',
      'TSV Grupo Brasil',
      'Gestor Comercial e Tecnico TSV',
    )
    // Conta admin reserva, com credenciais para o usuário trocar no primeiro acesso
    garantirUsuario(
      'admin@tsvgrupo.com.br',
      'Admin@Brigade2026',
      'Administrador TSV',
      'admin',
      'TSV Grupo Brasil',
      'Administrador do Sistema',
    )
    // Revisor técnico de exemplo
    garantirUsuario(
      'revisor@tsvgrupo.com.br',
      'Revisor@Brigade2026',
      'Revisor Tecnico TSV',
      'revisor',
      'TSV Grupo Brasil',
      'Revisor Tecnico de Pacotes',
    )
  },
  (app) => {
    try {
      const eventos = app.findCollectionByNameOrId('eventos_trilha')
      app.delete(eventos)
    } catch (_) {}
    try {
      const opsCol = app.findCollectionByNameOrId('oportunidades')
      if (opsCol.fields.getByName('distribuidor')) opsCol.fields.removeByName('distribuidor')
      opsCol.listRule =
        "@request.auth.id != '' && (@request.auth.role = 'tsv' || responsavel = @request.auth.id)"
      opsCol.viewRule = opsCol.listRule
      opsCol.updateRule = opsCol.listRule
      app.save(opsCol)
    } catch (_) {}
    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      const roleField = usersCol.fields.getByName('role')
      if (roleField) roleField.values = ['tsv', 'vendedor']
      if (usersCol.fields.getByName('distribuidor')) {
        usersCol.fields.removeByName('distribuidor')
      }
      app.save(usersCol)
    } catch (_) {}
  },
)
