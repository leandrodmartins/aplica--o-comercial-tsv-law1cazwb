/// <reference path="../pb_data/types.d.ts" />

/**
 * Migração 0007 — PRD "Assistente Comercial Brigade (MVP)", escopo essencial.
 *
 * Defensiva e idempotente: cada passo checa se o campo/coleção/índice já existe
 * antes de criar (a migração pode rodar sobre um banco já parcialmente migrado),
 * e cada coleção é acessada dentro de try/catch para não abortar o lote inteiro.
 *
 * 1. Papel "revisor" no campo role de users (papeis: admin, tsv, revisor, vendedor).
 * 2. Campo "distribuidor" em users e oportunidades + regras de isolamento:
 *    vendedor vê só registros do próprio distribuidor; tsv/admin/revisor veem tudo.
 * 3. Coleção eventos_trilha: quem fez o quê e quando, por oportunidade/pacote.
 * 4. Update/create em users somente para role admin/tsv.
 * 5. Contas iniciais: admin e revisor de exemplo (idempotente por e-mail).
 */
migrate(
  (app) => {
    const ROL =
      "@request.auth.role = 'tsv' || @request.auth.role = 'admin' || @request.auth.role = 'revisor'"

    // ---------- users: papel revisor + campo distribuidor + regras ----------
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    const roleField = usersCol.fields.getByName('role')
    if (roleField) {
      const valores = ['admin', 'tsv', 'revisor', 'vendedor']
      for (const v of valores) {
        if (roleField.values.indexOf(v) === -1) roleField.values.push(v)
      }
    }

    if (!usersCol.fields.getByName('distribuidor')) {
      usersCol.fields.add(new TextField({ name: 'distribuidor', required: false }))
    }

    // Gestão de usuários (create) somente para admin/tsv; update libera o
    // próprio perfil (sem alterar papel/distribuidor) e admin/tsv sem restrição.
    usersCol.listRule = "@request.auth.id != ''"
    usersCol.viewRule = "@request.auth.id != ''"
    usersCol.createRule = "@request.auth.role = 'admin' || @request.auth.role = 'tsv'"
    usersCol.updateRule =
      "(id = @request.auth.id && @request.body.role:changed = false && @request.body.distribuidor:changed = false) || @request.auth.role = 'admin' || @request.auth.role = 'tsv'"
    usersCol.deleteRule = "@request.auth.role = 'admin' || @request.auth.role = 'tsv'"
    app.save(usersCol)

    // Backfill: preenche distribuidor dos usuários a partir do campo legado
    try {
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
    } catch (err) {
      console.warn('[0007] backfill distribuidor de users falhou (seguindo):', err)
    }

    // ---------- oportunidades: campo distribuidor + regras + índice ----------
    let opsColId = ''
    try {
      const opsCol = app.findCollectionByNameOrId('oportunidades')
      opsColId = opsCol.id

      if (!opsCol.fields.getByName('distribuidor')) {
        opsCol.fields.add(new TextField({ name: 'distribuidor', required: false }))
      }

      const visivelVendedor =
        "(@request.auth.role = 'vendedor' && distribuidor != '' && distribuidor = @request.auth.distribuidor)"
      const regraLeitura = `@request.auth.id != '' && (${ROL} || ${visivelVendedor})`
      opsCol.listRule = regraLeitura
      opsCol.viewRule = regraLeitura
      opsCol.createRule = `@request.auth.id != '' && (${ROL} || @request.auth.role = 'vendedor')`
      opsCol.updateRule = regraLeitura
      opsCol.deleteRule = "@request.auth.role = 'admin' || @request.auth.role = 'tsv'"

      // Idempotente: col.addIndex não duplica índice existente.
      opsCol.addIndex('idx_oportunidades_distribuidor', false, 'distribuidor', '')

      app.save(opsCol)

      // Backfill: herda o distribuidor do responsável quando o campo veio vazio
      try {
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
      } catch (err) {
        console.warn('[0007] backfill distribuidor de oportunidades falhou (seguindo):', err)
      }
    } catch (err) {
      console.warn('[0007] ajuste de oportunidades falhou (seguindo):', err)
    }

    // ---------- pacotes: regras seguem o distribuidor da oportunidade ----------
    let pacColId = ''
    try {
      const pacCol = app.findCollectionByNameOrId('pacotes')
      pacColId = pacCol.id

      const visivelVendedor =
        "(@request.auth.role = 'vendedor' && oportunidade.distribuidor != '' && oportunidade.distribuidor = @request.auth.distribuidor)"
      const regraLeitura = `@request.auth.id != '' && (${ROL} || ${visivelVendedor})`
      pacCol.listRule = regraLeitura
      pacCol.viewRule = regraLeitura
      pacCol.createRule = `@request.auth.id != '' && (${ROL} || @request.auth.role = 'vendedor')`
      pacCol.updateRule = regraLeitura
      pacCol.deleteRule = "@request.auth.role = 'admin' || @request.auth.role = 'tsv'"
      app.save(pacCol)
    } catch (err) {
      console.warn('[0007] ajuste de pacotes falhou (seguindo):', err)
    }

    // ---------- pacote_arquivos: regras via pacote.oportunidade.distribuidor ----------
    try {
      const arqCol = app.findCollectionByNameOrId('pacote_arquivos')
      const visivelVendedor =
        "(@request.auth.role = 'vendedor' && pacote.oportunidade.distribuidor != '' && pacote.oportunidade.distribuidor = @request.auth.distribuidor)"
      const regraLeitura = `@request.auth.id != '' && (${ROL} || ${visivelVendedor})`
      arqCol.listRule = regraLeitura
      arqCol.viewRule = regraLeitura
      arqCol.createRule = `@request.auth.id != '' && (${ROL} || @request.auth.role = 'vendedor')`
      arqCol.updateRule = regraLeitura
      arqCol.deleteRule = "@request.auth.role = 'admin' || @request.auth.role = 'tsv'"
      app.save(arqCol)
    } catch (err) {
      console.warn('[0007] ajuste de pacote_arquivos falhou (seguindo):', err)
    }

    // ---------- eventos_trilha: coleção nova (só se ainda não existir) ----------
    if (!app.hasTable('eventos_trilha')) {
      const eventos = new Collection({
        name: 'eventos_trilha',
        type: 'base',
        listRule: `@request.auth.id != '' && (${ROL} || oportunidade.distribuidor = @request.auth.distribuidor)`,
        viewRule: `@request.auth.id != '' && (${ROL} || oportunidade.distribuidor = @request.auth.distribuidor)`,
        createRule: "@request.auth.id != ''",
        updateRule: null,
        deleteRule: null,
        fields: [
          {
            name: 'oportunidade',
            type: 'relation',
            required: true,
            collectionId: opsColId || app.findCollectionByNameOrId('oportunidades').id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          {
            name: 'pacote',
            type: 'relation',
            required: false,
            collectionId: pacColId || app.findCollectionByNameOrId('pacotes').id,
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

    // ---------- Contas iniciais: admin e revisor (idempotente por e-mail) ----------
    const garantirUsuario = (email, senha, nome, role, distribuidor, cargo) => {
      let rec = null
      try {
        rec = app.findAuthRecordByEmail('_pb_users_auth_', email)
      } catch (_) {}
      if (!rec) {
        rec = new Record(app.findCollectionByNameOrId('_pb_users_auth_'))
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
