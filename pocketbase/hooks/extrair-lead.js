/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook: POST /backend/v1/extrair-lead
 * Recebe o texto bruto de um e-mail de lead e usa o Agente Nativo Brigade
 * (mesmo agente do gerar-pacote) para extrair contato, empresa e aplicação.
 * O agente é instruído a responder EXCLUSIVAMENTE em JSON.
 */
routerAdd(
  'POST',
  '/backend/v1/extrair-lead',
  (e) => {
    try {
      const authId = e.auth?.id
      if (!authId) return e.unauthorizedError('Autenticacao necessaria')

      const body = e.requestInfo().body || {}
      const texto = String(body.email_texto || '').trim()
      if (!texto) return e.badRequestError('Informe o texto do e-mail do lead (email_texto)')
      if (texto.length > 20000)
        return e.badRequestError('Texto do e-mail muito longo (max 20.000 caracteres)')

      const prompt = [
        'Voce e o assistente de triagem comercial da Brigade/TSV. Recebe o texto bruto de um e-mail (ou formulario de site / WhatsApp) enviado por um lead e devolve os dados estruturados para pre-preencher o cadastro da oportunidade.',
        'Responda EXCLUSIVAMENTE com um objeto JSON valido (sem markdown de bloco como ```json, apenas o JSON puro) com a seguinte estrutura exata:',
        '{"contato_nome": string, "contato_email": string, "contato_telefone": string, "contato_cargo": string, "empresa": string, "mensagem_original": string, "aplicacao": string, "segmento": "mineracao|construcao|logistica_rodoviaria|onibus_urbano|agricola|portuario|frotas_leves|outro"}',
        'Regras:',
        '- contato_nome: nome do remetente/signatario; se nao constar, derive um nome plausivel do prefixo do e-mail ou use "".',
        '- contato_email: e-mail do remetente (campo From, Reply-To ou assinatura do texto).',
        '- contato_telefone: telefone/WhatsApp que constar no texto ("" se nao houver).',
        '- contato_cargo: cargo/area declarado ("" se nao houver).',
        '- empresa: nome da empresa do lead (o dominio do e-mail ajuda a inferir). Nunca use brigadebrasil.com.br ou tsv como empresa.',
        '- mensagem_original: a mensagem do cliente em texto corrido, limpa de cabecalhos de e-mail, assinaturas repetidas e threads (Re:/Fwd:). Nao invente conteudo.',
        '- aplicacao: descricao sucinta (1 frase) da aplicacao: tipo de veiculo/equipamento, ambiente de operacao e dor principal.',
        '- segmento: o mais aderente da lista; use "outro" se nenhum encaixar.',
        '',
        'TEXTO DO LEAD:',
        texto,
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
          console.log('extrair-lead: JSON invalido do agente:', e2)
        }
      }

      if (!dados) {
        return e.json(502, {
          error:
            'A IA nao conseguiu extrair os dados deste e-mail. Revise o texto ou preencha manualmente.',
        })
      }

      const segmentos = [
        'mineracao',
        'construcao',
        'logistica_rodoviaria',
        'onibus_urbano',
        'agricola',
        'portuario',
        'frotas_leves',
        'outro',
      ]
      const segmento =
        segmentos.indexOf(String(dados.segmento || '')) !== -1 ? String(dados.segmento) : 'outro'

      return e.json(200, {
        contato_nome: String(dados.contato_nome || ''),
        contato_email: String(dados.contato_email || ''),
        contato_telefone: String(dados.contato_telefone || ''),
        contato_cargo: String(dados.contato_cargo || ''),
        empresa: String(dados.empresa || ''),
        mensagem_original: String(dados.mensagem_original || ''),
        aplicacao: String(dados.aplicacao || ''),
        segmento: segmento,
      })
    } catch (err) {
      console.log('Erro em /backend/v1/extrair-lead:', err)
      return e.json(500, { error: err.message || 'Falha ao extrair dados do e-mail' })
    }
  },
  $apis.requireAuth(),
)
