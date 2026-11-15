/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para gerar o Pacote de Preparação Técnico-Comercial utilizando o Agente Nativo Brigade
 * Rota: POST /backend/v1/gerar-pacote
 * Permissões: requer usuário autenticado (TSV ou vendedor responsável)
 */
routerAdd(
  'POST',
  '/backend/v1/gerar-pacote',
  (e) => {
    try {
      const authId = e.auth?.id
      if (!authId) return e.unauthorizedError('Autenticacao necessaria')

      const body = e.requestInfo().body || {}
      const oportunidadeId = body.oportunidade_id
      if (!oportunidadeId) return e.badRequestError('oportunidade_id e obrigatorio')

      // Buscar a oportunidade
      let opRecord
      try {
        opRecord = $app.findRecordById('oportunidades', oportunidadeId)
      } catch (_) {
        return e.notFoundError('Oportunidade nao encontrada')
      }

      const authRole = e.auth?.getString('role') || 'vendedor'
      const responsavelId = opRecord.getString('responsavel')

      if (authRole !== 'tsv' && responsavelId !== authId) {
        return e.forbiddenError(
          'Apenas o responsavel ou a TSV pode gerar pacotes para esta oportunidade',
        )
      }

      const empresa = opRecord.getString('empresa')
      const contatoNome = opRecord.getString('contato_nome')
      const contatoCargo = opRecord.getString('contato_cargo')
      const mensagemOriginal = opRecord.getString('mensagem_original')
      const aplicacao = opRecord.getString('aplicacao')
      const segmento = opRecord.getString('segmento')
      const distribuidora = opRecord.getString('distribuidora') || 'Distribuidor Oficial'

      // Buscar materiais do acervo técnico ativos para citar referências documentais
      let acervoLista = []
      try {
        const acervoRecs = $app.findRecordsByFilter(
          'acervo_tecnico',
          'ativo = true',
          '-created',
          10,
          0,
        )
        acervoLista = acervoRecs.map((doc) => ({
          id: doc.id,
          titulo: doc.getString('titulo'),
          codigo: doc.getString('codigo'),
          categoria: doc.getString('categoria'),
          linha_produto: doc.getString('linha_produto'),
          resumo: doc.getString('resumo'),
        }))
      } catch (err) {
        console.log('Aviso ao buscar acervo:', err)
      }

      const acervoFormatado = acervoLista
        .map((a) => `- [${a.codigo || 'BRIGADE'}] ${a.titulo} (${a.categoria}): ${a.resumo}`)
        .join('\n')

      const promptMensagem = `Gere o pacote completo de preparacao tecnico-comercial para o lead a seguir:

DADOS DO LEAD:
- Empresa: ${empresa}
- Contato: ${contatoNome} (${contatoCargo || 'Responsavel'})
- Segmento de Mercado: ${segmento}
- Aplicacao Operacional: ${aplicacao}
- Distribuidora Responsavel: ${distribuidora}

MENSAGEM ORIGINAL RECEBIDA:
"""
${mensagemOriginal}
"""

CATALOGOS E FICHAS DISPONIVEIS NO ACERVO BRIGADE:
${acervoFormatado}

INSTRUCAO DE RESPOSTA OBRIGATORIA:
Responda EXCLUSIVAMENTE em formato JSON valido (sem markdown de bloco como \`\`\`json, apenas o JSON puro) com a seguinte estrutura exata:
{
  "briefing_contexto": "<p>texto em html com contexto do cliente, analise das condicoes operacionais e necessidades imediatas</p>",
  "briefing_hipoteses": "<p>texto em html com hipoteses tecnicas de seguranca veicular baseadas na aplicacao e no catalogo Brigade</p>",
  "briefing_riscos": "<p>texto em html com riscos e pontos criticos operacionais identificados</p>",
  "perguntas_priorizadas": [
    { "ordem": 1, "pergunta": "texto da pergunta objetiva de discovery", "categoria": "Eletrica/Mecanica/Operacional/Comercial" }
  ],
  "minuta_email_assunto": "Assunto do e-mail comercial formal e atraente",
  "minuta_email_corpo": "<p>Prezado ... corpo do e-mail com sugestao de solucao Brigade citando [Ref: CODIGO-OU-TITULO] e convite para conversa</p>",
  "apresentacao_slides": [
    { "titulo": "Titulo do Slide 1", "conteudo": "Topicos objetivos sobre desafio e aplicacao" },
    { "titulo": "Titulo do Slide 2 - Solucao Brigade Recomendada", "conteudo": "Especificacao com modelos compativeis e referencia ao catalogo" },
    { "titulo": "Titulo do Slide 3 - Beneficios e Proximo Passo", "conteudo": "Reducao de custos, atendimento a normas e proposta de teste piloto" }
  ],
  "pontos_pendentes": [
    { "pendencia": "Descricao do ponto pendente de confirmacao tecnica ou comercial", "resolvido": false }
  ],
  "referencias_brigade": [
    { "codigo": "CODIGO_DOCUMENTO", "titulo": "TITULO_DOCUMENTO_BRIGADE" }
  ]
}`

      // Executa o chat através do Agente Nativo Brigade
      const agentResult = $ai.agent('brigade-comercial').chat({
        user_id: authId,
        message: promptMensagem,
      })

      let pacoteJson = null
      const rawContent = agentResult.content.trim()

      try {
        // Tentar parsing direto
        pacoteJson = JSON.parse(rawContent)
      } catch (_) {
        // Se tiver wrapper markdown ```json ... ```
        const match = rawContent.match(/\{[\s\S]*\}/)
        if (match) {
          try {
            pacoteJson = JSON.parse(match[0])
          } catch (e2) {
            console.log('Falha ao parsear JSON do agente:', e2)
          }
        }
      }

      // Se o agente retornou texto puro ou se o json falhou, montar fallback estruturado inteligente
      if (!pacoteJson || !pacoteJson.briefing_contexto) {
        pacoteJson = {
          briefing_contexto: `<p><strong>Oportunidade: ${empresa}</strong>. Lead com necessidade em <em>${aplicacao}</em>. A operacao exige solucoes homologadas e duraveis para mitigar riscos de manobra e pontos cegos.</p>`,
          briefing_hipoteses: `<p>Recomenda-se a integracao do sistema de visao 360 graus Backeye360 e alarmes de marcha a re com som branco bbs-tek [Ref: FT-BN360-300 / FT-BBS-WHITE-SOUND].</p>`,
          briefing_riscos: `<p>Necessario verificar condicoes de lavagem pressurizada, vibracao no chassi e autonomia de instalacao eletrica.</p>`,
          perguntas_priorizadas: [
            {
              ordem: 1,
              pergunta:
                'Quantos veiculos compoem a frota atual e qual a tensao eletrica nominal (12V ou 24V)?',
              categoria: 'Eletrica',
            },
            {
              ordem: 2,
              pergunta: 'Quais manobras geram mais pontos cegos ou incidentes na operacao?',
              categoria: 'Operacional',
            },
            {
              ordem: 3,
              pergunta: 'Qual o prazo previsto para implementacao do projeto de seguranca?',
              categoria: 'Comercial',
            },
          ],
          minuta_email_assunto: `Solucoes de Seguranca Veicular Brigade para ${empresa} | Parceria TSV`,
          minuta_email_corpo: `<p>Prezado(a) ${contatoNome},</p><p>Recebemos sua solicitacao referente a <strong>${aplicacao}</strong>. A Brigade Electronics e a TSV Grupo lideram em tecnologia de seguranca operacional veicular.</p><p>Recomendamos a avaliacao da linha <strong>Backeye®360</strong> e dos alarmes direcionais de som branco <strong>bbs-tek®</strong> [Ref: Catalogo Geral Brigade Brasil], ideais para operacoes que nao podem tolerar falhas.</p><p>Gostariamos de propor uma reuniao tecnica de 20 minutos para detalhar o dimensionamento adequado para sua frota.</p><p>Atenciosamente,<br>${e.auth?.getString('name') || 'Equipe Comercial'} | Distribuidor Autorizado TSV Brigade</p>`,
          apresentacao_slides: [
            {
              titulo: `Desafio Tecnico: ${empresa}`,
              conteudo: `Necessidade de mitigacao de pontos cegos e protecao em ${aplicacao}.`,
            },
            {
              titulo: 'Solucao Brigade Integrada',
              conteudo:
                'Backeye360 para visao aerea continua + Alarmes de som branco bbs-tek para aviso instantaneo.',
            },
            {
              titulo: 'Proposta de Piloto',
              conteudo:
                'Homologacao em 1 veiculo de teste por 15 dias com acompanhamento tecnico TSV.',
            },
          ],
          pontos_pendentes: [
            {
              pendencia:
                'Confirmar voltagem nominal da frota e disponibilidade de monitor existente',
              resolvido: false,
            },
            {
              pendencia: 'Aprovar tecnicamente a minuta de e-mail e slides antes do envio externo',
              resolvido: false,
            },
          ],
          referencias_brigade: [
            { codigo: 'FT-BN360-300', titulo: 'Ficha Tecnica Backeye360 BN360-300' },
            { codigo: 'FT-BBS-WHITE-SOUND', titulo: 'Ficha Tecnica bbs-tek White Sound' },
            { codigo: 'CAT-BR-2024-V1', titulo: 'Catalogo Geral Brigade Brasil 2024' },
          ],
        }
      }

      // Persistir ou atualizar o pacote da oportunidade
      const pacotesCol = $app.findCollectionByNameOrId('pacotes')
      let pacoteRecord
      const existingPacotes = $app.findRecordsByFilter(
        'pacotes',
        `oportunidade = '${oportunidadeId}'`,
        '-created',
        1,
        0,
      )

      if (existingPacotes.length > 0) {
        pacoteRecord = existingPacotes[0]
        const novaVersao = (pacoteRecord.getInt('versao') || 1) + 1
        pacoteRecord.set('versao', novaVersao)
      } else {
        pacoteRecord = new Record(pacotesCol)
        pacoteRecord.set('oportunidade', oportunidadeId)
        pacoteRecord.set('versao', 1)
      }

      pacoteRecord.set('briefing_contexto', pacoteJson.briefing_contexto || '')
      pacoteRecord.set('briefing_hipoteses', pacoteJson.briefing_hipoteses || '')
      pacoteRecord.set('briefing_riscos', pacoteJson.briefing_riscos || '')
      pacoteRecord.set(
        'perguntas_priorizadas',
        JSON.stringify(pacoteJson.perguntas_priorizadas || []),
      )
      pacoteRecord.set('minuta_email_assunto', pacoteJson.minuta_email_assunto || '')
      pacoteRecord.set('minuta_email_corpo', pacoteJson.minuta_email_corpo || '')
      pacoteRecord.set('apresentacao_slides', JSON.stringify(pacoteJson.apresentacao_slides || []))
      pacoteRecord.set('pontos_pendentes', JSON.stringify(pacoteJson.pontos_pendentes || []))
      pacoteRecord.set('referencias_brigade', JSON.stringify(pacoteJson.referencias_brigade || []))
      pacoteRecord.set('status_revisao', 'em_revisao')

      $app.save(pacoteRecord)

      // Atualizar estado da oportunidade para em_revisao se estava em rascunho
      if (opRecord.getString('estado') === 'rascunho') {
        opRecord.set('estado', 'em_revisao')
        opRecord.set('proxima_acao', 'Revisao tecnica do pacote pela TSV antes de envio ao cliente')
        $app.save(opRecord)
      }

      return e.json(200, {
        sucesso: true,
        pacote_id: pacoteRecord.id,
        versao: pacoteRecord.getInt('versao'),
        status_revisao: 'em_revisao',
        oportunidade_id: oportunidadeId,
      })
    } catch (err) {
      console.log('Erro em /backend/v1/gerar-pacote:', err)
      return e.json(500, { error: err.message || 'Falha ao gerar pacote' })
    }
  },
  $apis.requireAuth(),
)

/**
 * Hook para aprovação/revisão técnica de pacotes
 * Regra do produto: Somente revisores TSV podem aprovar o pacote.
 * Rota: POST /backend/v1/revisar-pacote
 */
routerAdd(
  'POST',
  '/backend/v1/revisar-pacote',
  (e) => {
    try {
      const authId = e.auth?.id
      if (!authId) return e.unauthorizedError('Autenticacao necessaria')

      const authRole = e.auth?.getString('role')
      const body = e.requestInfo().body || {}
      const pacoteId = body.pacote_id
      const acao = body.acao // 'aprovar' | 'rejeitar' | 'salvar_edicao'
      const notasRevisor = body.notas_revisor || ''
      const pontosPendentes = body.pontos_pendentes // array atualizado
      const minutaEmailCorpo = body.minuta_email_corpo
      const minutaEmailAssunto = body.minuta_email_assunto

      if (!pacoteId) return e.badRequestError('pacote_id e obrigatorio')

      const pacote = $app.findRecordById('pacotes', pacoteId)
      const oportunidadeId = pacote.getString('oportunidade')
      const oportunidade = $app.findRecordById('oportunidades', oportunidadeId)

      // Somente TSV pode aprovar ou rejeitar formalmente
      if ((acao === 'aprovar' || acao === 'rejeitar') && authRole !== 'tsv') {
        return e.forbiddenError(
          'Apenas aprovadores da TSV podem aprovar ou rejeitar o pacote de preparacao',
        )
      }

      if (minutaEmailAssunto !== undefined) pacote.set('minuta_email_assunto', minutaEmailAssunto)
      if (minutaEmailCorpo !== undefined) pacote.set('minuta_email_corpo', minutaEmailCorpo)
      if (pontosPendentes !== undefined)
        pacote.set('pontos_pendentes', JSON.stringify(pontosPendentes))
      if (notasRevisor !== undefined) pacote.set('notas_revisor', notasRevisor)

      if (acao === 'aprovar') {
        pacote.set('status_revisao', 'aprovado')
        pacote.set('revisor', authId)
        pacote.set('aprovado_em', new Date().toISOString().replace('T', ' ').substring(0, 19))
        $app.save(pacote)

        oportunidade.set('estado', 'aprovado')
        oportunidade.set(
          'proxima_acao',
          'Vendedor autorizado a enviar minuta e apresentacao aprovadas ao cliente',
        )
        $app.save(oportunidade)
      } else if (acao === 'rejeitar') {
        pacote.set('status_revisao', 'rejeitado')
        pacote.set('revisor', authId)
        $app.save(pacote)

        oportunidade.set('estado', 'em_revisao')
        oportunidade.set('proxima_acao', 'Ajustar pontos tecnicos pendentes solicitados pela TSV')
        $app.save(oportunidade)
      } else if (acao === 'marcar_enviado') {
        // Vendedor ou TSV marca como enviado após envio externo
        pacote.set('status_revisao', 'enviado')
        pacote.set('enviado_em', new Date().toISOString().replace('T', ' ').substring(0, 19))
        $app.save(pacote)

        oportunidade.set('estado', 'enviado')
        oportunidade.set(
          'proxima_acao',
          'Acompanhar retorno do lead sobre discovery e agendar reuniao',
        )
        $app.save(oportunidade)
      } else {
        // salvar edição simples
        $app.save(pacote)
      }

      return e.json(200, {
        sucesso: true,
        pacote_id: pacote.id,
        status_revisao: pacote.getString('status_revisao'),
        estado_oportunidade: oportunidade.getString('estado'),
      })
    } catch (err) {
      console.log('Erro em /backend/v1/revisar-pacote:', err)
      return e.json(500, { error: err.message || 'Falha ao revisar pacote' })
    }
  },
  $apis.requireAuth(),
)
