/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook: registra eventos na trilha (coleção eventos_trilha) em cada criação
 * relevante feita pelo cliente — oportunidade, pacote e upload de arquivo.
 *
 * Usa onRecordCreateRequest (PocketBase v0.23+): dispara em requisições HTTP
 * reais, onde e.auth é o usuário autenticado que fez a ação. Toda a lógica fica
 * inline no callback (exigência do JSVM do PocketBase: funções de topo não são
 * visíveis dentro dos callbacks). Falha de trilha não quebra a operação.
 */

// --- Criação de oportunidade (requisição HTTP do cliente) ---
onRecordCreateRequest((e) => {
  e.next()
  try {
    const oportunidadeId = e.record.id
    const usuarioId = e.auth?.id
    if (!oportunidadeId || !usuarioId) return
    const col = e.app.findCollectionByNameOrId('eventos_trilha')
    const ev = new Record(col)
    ev.set('oportunidade', oportunidadeId)
    ev.set('usuario', usuarioId)
    ev.set('acao', 'oportunidade_criada')
    ev.set(
      'detalhe',
      `Oportunidade "${e.record.getString('empresa')}" criada (estado inicial: ${e.record.getString('estado')}).`,
    )
    e.app.save(ev)
  } catch (err) {
    console.warn('[trilha] falha ao registrar oportunidade_criada:', err)
  }
}, 'oportunidades')

// --- Criação de pacote (gerado pelo assistente ou manual) ---
onRecordCreateRequest((e) => {
  e.next()
  try {
    const oportunidadeId = e.record.getString('oportunidade')
    const usuarioId = e.auth?.id
    if (!oportunidadeId || !usuarioId) return
    const col = e.app.findCollectionByNameOrId('eventos_trilha')
    const ev = new Record(col)
    ev.set('oportunidade', oportunidadeId)
    ev.set('pacote', e.record.id)
    ev.set('usuario', usuarioId)
    ev.set('acao', 'pacote_criado')
    ev.set(
      'detalhe',
      `Pacote de preparação v${e.record.getInt('versao', 1)} gerado (status: ${e.record.getString('status_revisao')}).`,
    )
    e.app.save(ev)
  } catch (err) {
    console.warn('[trilha] falha ao registrar pacote_criado:', err)
  }
}, 'pacotes')

// --- Upload de arquivo no gestor de arquivos do pacote ---
onRecordCreateRequest((e) => {
  e.next()
  try {
    const usuarioId = e.auth?.id
    if (!usuarioId) return
    // O upload é feito em nome de um pacote cuja oportunidade precisa ser
    // buscada para vincular o evento à oportunidade.
    let opId = ''
    try {
      const pacote = e.app.findRecordById('pacotes', e.record.getString('pacote'))
      opId = pacote.getString('oportunidade')
    } catch (_) {}
    if (!opId) return
    const col = e.app.findCollectionByNameOrId('eventos_trilha')
    const ev = new Record(col)
    ev.set('oportunidade', opId)
    ev.set('pacote', e.record.getString('pacote'))
    ev.set('usuario', usuarioId)
    ev.set('acao', 'arquivo_enviado')
    ev.set('detalhe', `Arquivo "${e.record.getString('nome')}" enviado ao pacote.`)
    e.app.save(ev)
  } catch (err) {
    console.warn('[trilha] falha ao registrar arquivo_enviado:', err)
  }
}, 'pacote_arquivos')
