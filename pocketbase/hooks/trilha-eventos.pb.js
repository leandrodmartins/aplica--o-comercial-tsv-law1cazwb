/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook: registra eventos na trilha (coleção eventos_trilha) em cada ação
 * relevante do fluxo comercial — criação de oportunidade, geração de pacote,
 * upload de arquivo e revisão (aprovar/rejeitar/enviar). Assim a trilha cobre
 * também as ações que passam pelos hooks, não só as feitas direto no cliente.
 *
 * Registra apenas ações de registros autenticados; falha de trilha não deve
 * quebrar a operação principal (log silencioso).
 */

const registrarEvento = (e, oportunidadeId, pacoteId, acao, detalhe) => {
  const usuarioId = e.auth?.id
  if (!oportunidadeId || !usuarioId) return
  try {
    const col = e.app.findCollectionByNameOrId('eventos_trilha')
    const ev = new Record(col)
    ev.set('oportunidade', oportunidadeId)
    if (pacoteId) ev.set('pacote', pacoteId)
    ev.set('usuario', usuarioId)
    ev.set('acao', acao)
    if (detalhe) ev.set('detalhe', String(detalhe).slice(0, 2000))
    e.app.save(ev)
  } catch (err) {
    console.warn('[trilha] falha ao registrar evento:', acao, err)
  }
}

// --- Criação de oportunidade (direto no cliente, via createRule) ---
onRecordAfterCreateRequest((e) => {
  registrarEvento(
    e,
    e.record.id,
    '',
    'oportunidade_criada',
    `Oportunidade "${e.record.getString('empresa')}" criada (estado inicial: ${e.record.getString('estado')}).`,
  )
}, 'oportunidades')

// --- Criação de pacote (gerado pelo assistente ou manual) ---
onRecordAfterCreateRequest((e) => {
  registrarEvento(
    e,
    e.record.getString('oportunidade'),
    e.record.id,
    'pacote_criado',
    `Pacote de preparação v${e.record.getInt('versao', 1)} gerado (status: ${e.record.getString('status_revisao')}).`,
  )
}, 'pacotes')

// --- Upload de arquivo no gestor de arquivos do pacote ---
onRecordAfterCreateRequest((e) => {
  // O upload é feito pela TSV/admin em nome de um pacote cuja oportunidade
  // precisa ser buscada para vincular o evento à oportunidade.
  let opId = ''
  try {
    const pacote = e.app.findRecordById('pacotes', e.record.getString('pacote'))
    opId = pacote.getString('oportunidade')
  } catch (_) {}
  registrarEvento(
    e,
    opId,
    e.record.getString('pacote'),
    'arquivo_enviado',
    `Arquivo "${e.record.getString('nome')}" enviado ao pacote.`,
  )
}, 'pacote_arquivos')
