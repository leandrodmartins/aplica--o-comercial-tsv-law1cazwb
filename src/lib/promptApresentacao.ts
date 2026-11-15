import { Oportunidade, PacotePreparacao, SlideApresentacao } from '@/types/tsv'

/** Segmentos em texto legível (mesmos valores do select da oportunidade). */
const ROTULO_SEGMENTO: Record<string, string> = {
  mineracao: 'Mineração',
  construcao: 'Construção',
  logistica_rodoviaria: 'Logística Rodoviária',
  onibus_urbano: 'Ônibus Urbano',
  agricola: 'Agrícola',
  portuario: 'Portuário',
  frotas_leves: 'Frotas Leves',
  outro: 'Outro',
}

/** Converte o HTML (editor rich text) dos campos de briefing em texto puro. */
function htmlParaTexto(html: string): string {
  if (!html) return ''
  const comQuebras = html
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li>/gi, '• ')
  const div = document.createElement('div')
  div.innerHTML = comQuebras
  return (div.textContent || div.innerText || '').replace(/[ \t]+/g, ' ').trim()
}

/** Bullets de um slide: uma linha por tópico (o campo conteudo é texto corrido). */
function linhasSlide(slide: SlideApresentacao): string[] {
  return String(slide?.conteudo || '')
    .split(/[\n•]/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => `- ${l}`)
}

/**
 * Monta o prompt pronto para colar num chat de IA externo (ChatGPT, Gemini,
 * Claude...) e gerar a apresentação ao cliente. Usa somente o que o pacote já
 * tem: lead, aplicação, segmento, briefing, perguntas e slides da IA Brigade.
 */
export function montarPromptApresentacao(
  oportunidade: Oportunidade,
  pacote: PacotePreparacao,
): string {
  const empresa = oportunidade.empresa || 'Cliente'
  const contato = oportunidade.contato_nome || 'não informado'
  const cargo = oportunidade.contato_cargo || 'não informado'
  const aplicacao = oportunidade.aplicacao || 'não informada'
  const segmento =
    ROTULO_SEGMENTO[oportunidade.segmento || ''] || oportunidade.segmento || 'não informado'
  const distribuidora = oportunidade.distribuidora || 'Distribuidor Oficial TSV'

  const contexto = htmlParaTexto(pacote.briefing_contexto || '')
  const hipoteses = htmlParaTexto(pacote.briefing_hipoteses || '')
  const riscos = htmlParaTexto(pacote.briefing_riscos || '')

  const perguntas = (pacote.perguntas_priorizadas || [])
    .slice(0, 8)
    .map((p) => `${p.ordem || '-'}. ${p.pergunta}`)
    .join('\n')

  const slides = (pacote.apresentacao_slides || [])
    .map((s, i) => {
      const topicos = linhasSlide(s)
      return `Slide ${i + 1} — ${s.titulo}\n${topicos.length ? topicos.join('\n') : '- (sem tópicos)'}`
    })
    .join('\n\n')

  const referencia = (pacote.referencias_brigade || [])
    .map((r) => `- ${r.codigo ? `[${r.codigo}] ` : ''}${r.titulo}`)
    .join('\n')

  const pendencias = (pacote.pontos_pendentes || [])
    .filter((p) => !p.resolvido)
    .map((p) => `- ${p.pendencia}`)
    .join('\n')

  return `Você é um especialista em apresentações técnico-comerciais da Brigade Electronics Brasil, distribuída pela ${distribuidora} (TSV), especializada em segurança veicular (câmeras de ré, visão 360°, alarmes de manobra bbs-tek, radares e sensores).

Gere a estrutura de uma apresentação em PowerPoint (.pptx) para o vendedor levar ao cliente ${empresa}. Ela deve ser objetiva, executiva e pronta para uma reunião de 20 a 30 minutos.

## Contexto do lead
- Empresa: ${empresa}
- Contato: ${contato}${cargo && cargo !== 'não informado' ? ` (${cargo})` : ''}
- Segmento: ${segmento}
- Aplicação operacional: ${aplicacao}

## Briefing de discovery (gerado pela IA Brigade)
${contexto || '(sem contexto informado)'}

## Hipóteses técnicas
${hipoteses || '(sem hipóteses informadas)'}

## Riscos e pontos de atenção
${riscos || '(sem riscos informados)'}

## Perguntas de discovery ainda abertas
${perguntas || '(sem perguntas registradas)'}

## Roteiro base sugerido pela IA Brigade
${slides || '(sem roteiro base)'}

## Referências oficiais Brigade a citar
${referencia || '(sem referências)'}

${pendencias ? `## Pendências a esclarecer com o cliente antes de fechar\n${pendencias}\n` : ''}
## Instruções de saída
1. Devolva a apresentação em de 8 a 12 slides, um por vez, com: título do slide, 3 a 5 bullets curtos por slide e, quando útil, uma sugestão de imagem ou diagrama.
2. Linguagem executiva, em português do Brasil, sem jargão interno da TSV.
3. Cite os produtos Brigade pelos nomes comerciais e relacione cada recomendação técnica à aplicação "${aplicacao}" da ${empresa}.
4. O slide final deve propor o próximo passo comercial (visita técnica, teste piloto ou proposta).
5. Se algum dado do contexto acima estiver incompleto, sinalize ao final o que precisa ser confirmado com o cliente.`
}
