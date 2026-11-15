/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook: POST /backend/v1/gerar-pptx
 * Gera um arquivo PowerPoint (.pptx) real a partir dos slides do pacote
 * (campo apresentacao_slides), montando o OOXML mínimo manualmente — sem
 * bibliotecas externas. O zip é gravado no modo STORED (PPTX aceita), com
 * CRC32 calculado em JS. Resposta: JSON { sucesso, filename, base64 } — o
 * frontend decodifica e oferece o download como Blob.
 */
routerAdd(
  'POST',
  '/backend/v1/gerar-pptx',
  (e) => {
    try {
      const authId = e.auth?.id
      if (!authId) return e.unauthorizedError('Autenticacao necessaria')

      const body = e.requestInfo().body || {}
      const pacoteId = String(body.pacote_id || '')
      if (!pacoteId) return e.badRequestError('pacote_id e obrigatorio')

      const pacote = $app.findRecordById('pacotes', pacoteId)
      const oportunidade = $app.findRecordById('oportunidades', pacote.getString('oportunidade'))

      const authRole = e.auth?.getString('role') || 'vendedor'
      const papelInterno = authRole === 'tsv' || authRole === 'admin' || authRole === 'revisor'
      const mesmoDistribuidor =
        authRole === 'vendedor' &&
        oportunidade.getString('distribuidor') !== '' &&
        oportunidade.getString('distribuidor') === e.auth?.getString('distribuidor')
      if (!papelInterno && oportunidade.getString('responsavel') !== authId && !mesmoDistribuidor) {
        return e.forbiddenError(
          'Apenas o responsavel ou membros do mesmo distribuidor podem baixar a apresentacao',
        )
      }

      const empresa = oportunidade.getString('empresa') || 'Cliente'
      const aplicacao = oportunidade.getString('aplicacao') || 'aplicacao operacional'

      let slides = []
      try {
        const raw = pacote.get('apresentacao_slides')
        if (typeof raw === 'string') {
          slides = JSON.parse(raw)
        } else if (raw && typeof raw.length === 'number') {
          // no JSVM, record.get() num campo json devolve os bytes crus — converte
          let texto = ''
          for (let i = 0; i < raw.length; i++) texto += String.fromCharCode(raw[i])
          slides = JSON.parse(texto)
        }
      } catch (err) {
        console.log('Falha ao ler apresentacao_slides do pacote ' + pacoteId + ':', err)
        slides = []
      }
      if (!Array.isArray(slides)) slides = []

      // Normaliza os slides (titulo + conteudo em texto)
      slides = slides
        .map((s) => ({
          titulo: String(s?.titulo || ''),
          conteudo: String(s?.conteudo || ''),
        }))
        .filter((s) => s.titulo || s.conteudo)

      // Fallback: quando o pacote ainda nao tem slides, monta um roteiro minimo
      // a partir do briefing e das perguntas do pacote — o vendedor nunca fica
      // sem apresentacao para baixar.
      if (slides.length === 0) {
        const limparHtml = (html) =>
          String(html || '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
        const contexto = limparHtml(pacote.getString('briefing_contexto')).slice(0, 600)
        const hipoteses = limparHtml(pacote.getString('briefing_hipoteses')).slice(0, 600)
        const riscos = limparHtml(pacote.getString('briefing_riscos')).slice(0, 400)
        slides = [
          { titulo: 'Desafio Tecnico: ' + empresa, conteudo: contexto || aplicacao },
          {
            titulo: 'Solucao Brigade Recomendada',
            conteudo: hipoteses || 'Solucoes de seguranca veicular Brigade para ' + aplicacao,
          },
          {
            titulo: 'Riscos Mitigados e Proximo Passo',
            conteudo: riscos || 'Proposta de teste piloto com acompanhamento tecnico TSV',
          },
        ]
      }

      // Enriquece com perguntas do pacote como bullests no slide correspondente
      try {
        let perguntas = []
        const rawP = pacote.get('perguntas_priorizadas')
        if (typeof rawP === 'string') {
          perguntas = JSON.parse(rawP)
        } else if (rawP && typeof rawP.length === 'number') {
          let texto = ''
          for (let i = 0; i < rawP.length; i++) texto += String.fromCharCode(rawP[i])
          perguntas = JSON.parse(texto)
        }
        if (Array.isArray(perguntas) && perguntas.length > 0 && slides.length > 0) {
          const lista = perguntas
            .slice(0, 5)
            .map((p) => '• ' + String(p?.pergunta || '').trim())
            .filter((l) => l !== '• ')
            .join('\n')
          if (lista) {
            slides[slides.length - 1].conteudo =
              (slides[slides.length - 1].conteudo
                ? slides[slides.length - 1].conteudo + '\n'
                : '') +
              'Perguntas de discovery a cobrir:\n' +
              lista
          }
        }
      } catch (_) {
        // perguntas são opcionais no slide
      }

      // ---------- Helpers ----------
      const esc = (s) =>
        String(s || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')

      // Divide o conteúdo em linhas de slide (limpa HTML, mantém marcadores)
      const linhasDe = (texto) => {
        const bruto = String(texto || '').replace(/<[^>]+>/g, '\n')
        const partes = []
        bruto.split('\n').forEach((linha) => {
          const l = linha.trim().replace(/^[-•*]\s*/, '• ')
          if (!l) return
          if (l.length <= 130) {
            partes.push(l)
          } else {
            for (let i = 0; i < l.length; i += 130) partes.push(l.slice(i, i + 130))
          }
        })
        return partes.length ? partes : ['']
      }

      const paragrafo = (txt, size, bold, color) =>
        '<a:p><a:r><a:rPr lang="pt-BR" sz="' +
        size +
        '"' +
        (bold ? ' b="1"' : '') +
        ' dirty="0"><a:solidFill><a:srgbClr val="' +
        color +
        '"/></a:solidFill>' +
        '<a:latin typeface="Calibri"/></a:rPr><a:t>' +
        esc(txt) +
        '</a:t></a:r></a:p>'

      const A = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"'
      const R = 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
      const P = 'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"'

      // ---------- Slides (capa + um por item) ----------
      const capa = {
        titulo: 'Brigade Segurança Veicular — ' + empresa,
        conteudo:
          'Apresentação técnico-comercial preparada pela IA Brigade / TSV\n' +
          new Date().toLocaleDateString('pt-BR'),
      }
      const todos = [capa].concat(slides)
      const n = todos.length
      const coresFaixa = ['1D4ED8', 'B45309', '047857', '6D28D9', 'BE123C', '0E7490']

      const slideXml = (s, idx) => {
        const faixa = coresFaixa[idx % coresFaixa.length]
        const linhas = linhasDe(s.conteudo)
        const corpo = linhas.map((l) => paragrafo(l, 1600, false, '1E293B')).join('')
        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld ${A} ${R} ${P}><p:cSld><p:spTree>
<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
<p:sp><p:nvSpPr><p:cNvPr id="2" name="Faixa"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
<p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="12192000" cy="1200000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="${faixa}"/></a:solidFill><a:ln><a:noFill/></a:ln></p:spPr>
<p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody></p:sp>
<p:sp><p:nvSpPr><p:cNvPr id="3" name="Titulo"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
<p:spPr><a:xfrm><a:off x="457200" y="300000"/><a:ext cx="11277600" cy="700000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>
<p:txBody><a:bodyPr wrap="square"/><a:lstStyle/>${paragrafo(s.titulo, 2800, true, 'FFFFFF')}</p:txBody></p:sp>
<p:sp><p:nvSpPr><p:cNvPr id="4" name="Conteudo"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
<p:spPr><a:xfrm><a:off x="457200" y="1400000"/><a:ext cx="11277600" cy="5100000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>
<p:txBody><a:bodyPr wrap="square"/><a:lstStyle/>${corpo}</p:txBody></p:sp>
<p:sp><p:nvSpPr><p:cNvPr id="5" name="Rodape"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
<p:spPr><a:xfrm><a:off x="457200" y="6500000"/><a:ext cx="11277600" cy="300000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>
<p:txBody><a:bodyPr/><a:lstStyle/>${paragrafo('Brigade Electronics Brasil • Distribuição TSV — Slide ' + (idx + 1) + '/' + n, 1000, false, '94A3B8')}</p:txBody></p:sp>
</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`
      }

      const RELS = 'http://schemas.openxmlformats.org/package/2006/relationships'
      const SLIDE_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide'
      const LAYOUT_REL =
        'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout'
      const MASTER_REL =
        'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster'
      const THEME_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme'

      const arquivos = {}

      arquivos['[Content_Types].xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
${todos
  .map(
    (_, i) =>
      `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`,
  )
  .join('\n')}
<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
</Types>`

      arquivos['_rels/.rels'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="${RELS}">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`

      arquivos['ppt/presentation.xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation ${A} ${R} ${P}>
<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
<p:sldIdLst>
${todos.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`).join('\n')}
</p:sldIdLst>
<p:sldSz cx="12192000" cy="6858000"/>
<p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`

      arquivos['ppt/_rels/presentation.xml.rels'] =
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="${RELS}">
<Relationship Id="rId1" Type="${MASTER_REL}" Target="slideMasters/slideMaster1.xml"/>
${todos
  .map(
    (_, i) =>
      `<Relationship Id="rId${i + 2}" Type="${SLIDE_REL}" Target="slides/slide${i + 1}.xml"/>`,
  )
  .join('\n')}
</Relationships>`

      todos.forEach((s, i) => {
        arquivos['ppt/slides/slide' + (i + 1) + '.xml'] = slideXml(s, i)
        arquivos['ppt/slides/_rels/slide' + (i + 1) + '.xml.rels'] =
          `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="${RELS}">\n<Relationship Id="rId1" Type="${LAYOUT_REL}" Target="../slideLayouts/slideLayout1.xml"/>\n</Relationships>`
      })

      arquivos['ppt/slideLayouts/slideLayout1.xml'] =
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout ${A} ${R} ${P} type="blank">
<p:cSld name="Em Branco"><p:spTree>
<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
</p:spTree></p:cSld>
<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`

      arquivos['ppt/slideLayouts/_rels/slideLayout1.xml.rels'] =
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="${RELS}">\n<Relationship Id="rId1" Type="${MASTER_REL}" Target="../slideMasters/slideMaster1.xml"/>\n</Relationships>`

      arquivos['ppt/slideMasters/slideMaster1.xml'] =
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster ${A} ${R} ${P}>
<p:cSld><p:spTree>
<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
</p:spTree></p:cSld>
<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>`

      arquivos['ppt/slideMasters/_rels/slideMaster1.xml.rels'] =
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="${RELS}">\n<Relationship Id="rId1" Type="${LAYOUT_REL}" Target="../slideLayouts/slideLayout1.xml"/>\n<Relationship Id="rId2" Type="${THEME_REL}" Target="../theme/theme1.xml"/>\n</Relationships>`

      arquivos['ppt/theme/theme1.xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme ${A} name="TSV"><a:themeElements>
<a:clrScheme name="TSV"><a:dk1><a:srgbClr val="1E293B"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="475569"/></a:dk2><a:lt2><a:srgbClr val="F1F5F9"/></a:lt2><a:accent1><a:srgbClr val="1D4ED8"/></a:accent1><a:accent2><a:srgbClr val="B45309"/></a:accent2><a:accent3><a:srgbClr val="047857"/></a:accent3><a:accent4><a:srgbClr val="6D28D9"/></a:accent4><a:accent5><a:srgbClr val="BE123C"/></a:accent5><a:accent6><a:srgbClr val="0E7490"/></a:accent6><a:hlink><a:srgbClr val="1D4ED8"/></a:hlink><a:folHlink><a:srgbClr val="6D28D9"/></a:folHlink></a:clrScheme>
<a:fontScheme name="TSV"><a:majorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme>
<a:fmtScheme name="TSV">
<a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>
<a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="28575"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>
<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>
</a:fmtScheme>
</a:themeElements></a:theme>`

      // ---------- Zip STORED (sem compressão) ----------
      // Trabalhamos com strings binárias (latin1) para evitar dependências do runtime.
      const crcTable = []
      for (let t = 0; t < 256; t++) {
        let c = t
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
        crcTable[t] = c >>> 0
      }
      const bin = (str) => unescape(encodeURIComponent(str)) // UTF-8 -> binário latin1
      const crc32 = (s) => {
        let c = 0xffffffff
        for (let i = 0; i < s.length; i++) c = crcTable[(c ^ s.charCodeAt(i)) & 0xff] ^ (c >>> 8)
        return (c ^ 0xffffffff) >>> 0
      }
      const u16 = (v) => String.fromCharCode(v & 0xff, (v >> 8) & 0xff)
      const u32 = (v) =>
        String.fromCharCode(v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, (v >>> 24) & 0xff)

      let zipBody = ''
      const central = []
      let offset = 0

      const DOS_TIME = u16(0) // 00:00
      const DOS_DATE = u16(0x5999) // 2024-12-25 (fixo, suficiente para teste)

      Object.keys(arquivos).forEach((nome) => {
        const dados = bin(arquivos[nome])
        const crc = crc32(dados)
        central.push({ nome: nome, crc: crc, tam: dados.length, off: offset })
        const local =
          u32(0x04034b50) +
          u16(20) + // versão
          u16(0) + // flags
          u16(0) + // method 0 = stored
          DOS_TIME +
          DOS_DATE +
          u32(crc) +
          u32(dados.length) +
          u32(dados.length) +
          u16(nome.length) +
          u16(0) +
          nome +
          dados
        zipBody += local
        offset += local.length
      })

      let centralDir = ''
      central.forEach((c) => {
        centralDir +=
          u32(0x02014b50) +
          u16(20) +
          u16(20) +
          u16(0) +
          u16(0) +
          DOS_TIME +
          DOS_DATE +
          u32(c.crc) +
          u32(c.tam) +
          u32(c.tam) +
          u16(c.nome.length) +
          u16(0) + // extra len
          u16(0) + // comment len
          u16(0) + // disk start
          u16(0) + // internal attrs
          u32(0) + // external attrs
          u32(c.off) +
          c.nome
      })

      const eocd =
        u32(0x06054b50) +
        u16(0) +
        u16(0) +
        u16(central.length) +
        u16(central.length) +
        u32(centralDir.length) +
        u32(offset) +
        u16(0)

      const zipBin = zipBody + centralDir + eocd

      // Converte a string binária (latin1) em array de bytes
      const bytes = new Uint8Array(zipBin.length)
      for (let i = 0; i < zipBin.length; i++) bytes[i] = zipBin.charCodeAt(i) & 0xff

      const nomeArquivo =
        'Apresentacao-Brigade-' +
        empresa.replace(/[^\w\-]+/g, '-').replace(/^-+|-+$/g, '') +
        '.pptx'

      // Registra o arquivo gerado no gestor de arquivos do pacote (colecao
      // pacote_arquivos). Feito server-side para nao depender de um PATCH do
      // proprio cliente (o PATCH 400 visto nos logs). O mimetype detectado de
      // um zip (pptx) e application/zip, fora da lista de mimeTypes do campo —
      // por isso saveNoValidate, que salva o registro e o arquivo.
      try {
        const autor = e.auth
        const registroArquivo = new Record($app.findCollectionByNameOrId('pacote_arquivos'))
        registroArquivo.set('pacote', pacoteId)
        registroArquivo.set('enviado_por', authId)
        registroArquivo.set('nome', nomeArquivo)
        registroArquivo.set(
          'tipo',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        )
        registroArquivo.set('tamanho', bytes.length)
        registroArquivo.set('arquivo', $filesystem.fileFromBytes(bytes, nomeArquivo))
        $app.saveNoValidate(registroArquivo)
      } catch (errArquivo) {
        // Falha ao registrar NAO pode impedir o download pelo cliente
        console.log('Aviso: nao foi possivel registrar o pptx em pacote_arquivos:', errArquivo)
      }

      e.response.header().set('Content-Disposition', 'attachment; filename="' + nomeArquivo + '"')
      return e.blob(
        200,
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        bytes,
      )
    } catch (err) {
      console.log('Erro em /backend/v1/gerar-pptx:', err)
      return e.json(500, { error: err.message || 'Falha ao gerar o arquivo PPTX' })
    }
  },
  $apis.requireAuth(),
)
