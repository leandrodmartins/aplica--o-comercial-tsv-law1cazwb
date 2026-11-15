/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook: POST /backend/v1/analisar-documento
 * Recebe multipart/form-data com o campo "arquivo" (PDF/DOCX/PPTX),
 * converte o conteúdo para Markdown com $documents.toMarkdown e usa o
 * Agente Nativo Brigade para extrair tema (título), resumo executivo,
 * sugestão de categoria e linha de produto Brigade — preenchendo
 * automaticamente o formulário do acervo técnico para revisão.
 * Resposta JSON: { titulo, codigo, categoria, linha_produto, resumo, conteudo_texto, resumo_ia }
 */
routerAdd(
  'POST',
  '/backend/v1/analisar-documento',
  (e) => {
    try {
      const authId = e.auth?.id
      if (!authId) return e.unauthorizedError('Autenticacao necessaria')

      const authRole = e.auth?.getString('role') || 'vendedor'
      if (authRole !== 'tsv') {
        return e.forbiddenError('Apenas a TSV pode cadastrar documentos no acervo tecnico')
      }

      const uploaded = e.findUploadedFiles('arquivo')
      if (!uploaded || !uploaded.length) {
        return e.badRequestError('Envie o arquivo do documento no campo "arquivo"')
      }
      const arquivo = uploaded[0]

      try {
        const tamanho = Number(arquivo.size?.() ?? arquivo.size ?? 0)
        if (tamanho > 30 * 1024 * 1024) {
          return e.badRequestError('Arquivo muito grande (maximo 30 MB)')
        }
      } catch (_) {
        // tamanho indisponivel no runtime: segue a conversao
      }

      let markdown = ''
      try {
        const res = $documents.toMarkdown(arquivo)
        markdown = String(res?.markdown || res || '')
      } catch (docErr) {
        console.log('analisar-documento: falha ao converter documento:', docErr)
        return e.badRequestError(
          'Nao foi possivel ler o conteudo deste arquivo. Formatos aceitos: PDF, DOCX, PPTX.',
        )
      }

      markdown = markdown.trim()
      if (!markdown) {
        return e.badRequestError(
          'O arquivo nao tem texto extraivel (pode ser um scan/imagem). Preencha os dados manualmente.',
        )
      }
      // Limita o contexto enviado ao agente
      if (markdown.length > 40000) markdown = markdown.substring(0, 40000)

      const categorias = ['catalogo', 'ficha_tecnica', 'apresentacao', 'manual', 'guia_aplicacao']
      const linhas = [
        'radar_bsis',
        'cameras_360_backeye',
        'alarmes_bbs_som_branco',
        'sensores_ultrassonicos',
        'mdvr_gravadores',
        'ia_deteccao_pedestres',
        'geral_portfolio',
      ]

      const prompt = [
        'Voce e o assistente de curadoria do acervo tecnico Brigade/TSV. Recebe o texto extraido de um documento (catalogo, ficha tecnica, manual, apresentacao ou guia) e devolve os metadados para pre-preencher o cadastro no acervo.',
        'Responda EXCLUSIVAMENTE com um objeto JSON valido (sem markdown de bloco como ```json, apenas o JSON puro) com a estrutura exata:',
        '{"titulo": string, "codigo": string, "categoria": "catalogo|ficha_tecnica|apresentacao|manual|guia_aplicacao", "linha_produto": "radar_bsis|cameras_360_backeye|alarmes_bbs_som_branco|sensores_ultrassonicos|mdvr_gravadores|ia_deteccao_pedestres|geral_portfolio", "resumo": string, "conteudo_texto": string}',
        'Regras:',
        '- titulo: nome oficial/comercial do documento, curto (ex: "Ficha Tecnica Radar Predict BSIS").',
        '- codigo: referencia interna do documento se houver no texto (ex: FT-RADAR-2024); senao "".',
        '- categoria: a mais aderente ao tipo do documento.',
        '- linha_produto: a linha Brigade predominante no conteudo; "geral_portfolio" se cobrir varias.',
        '- resumo: resumo executivo em 1 a 3 frases com os beneficios e especificacoes chave.',
        '- conteudo_texto: principais especificacoes tecnicas, normas atendidas (ex: IP69K, UNECE R151), modelos citados e diretrizes, em texto corrido com quebras de linha. Use apenas informacoes presentes no documento; nao invente.',
        '',
        'TEXTO DO DOCUMENTO:',
        markdown,
      ].join('\n')

      const agentResult = $ai.agent('brigade-comercial').chat({
        user_id: authId,
        message: prompt,
      })

      let dados = null
      const rawContent = String(agentResult?.content || '').trim()
      const match = rawContent.match(/\{[\s\S]*\}/)
      if (match) {
        try {
          dados = JSON.parse(match[0])
        } catch (e2) {
          console.log('analisar-documento: JSON invalido do agente:', e2)
        }
      }

      if (!dados) {
        return e.json(502, {
          error:
            'A IA nao conseguiu classificar este documento. Revise o texto extraido ou preencha manualmente.',
          texto_extraido: markdown.substring(0, 2000),
        })
      }

      const categoria =
        categorias.indexOf(String(dados.categoria || '')) !== -1
          ? String(dados.categoria)
          : 'guia_aplicacao'
      const linha =
        linhas.indexOf(String(dados.linha_produto || '')) !== -1
          ? String(dados.linha_produto)
          : 'geral_portfolio'

      return e.json(200, {
        titulo: String(dados.titulo || ''),
        codigo: String(dados.codigo || ''),
        categoria: categoria,
        linha_produto: linha,
        resumo: String(dados.resumo || ''),
        conteudo_texto: String(dados.conteudo_texto || ''),
      })
    } catch (err) {
      console.log('Erro em /backend/v1/analisar-documento:', err)
      return e.json(500, { error: err.message || 'Falha ao analisar o documento' })
    }
  },
  $apis.requireAuth(),
)
