/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    $ai.agents.define(app, {
      slug: 'brigade-comercial',
      name: 'Assistente Comercial Brigade TSV',
      description:
        'Assistente inteligente para elaboracao de pacotes tecnico-comerciais Brigade com referencias ao acervo tecnico.',
      systemPrompt: `Voce e o Assistente Comercial Inteligente Brigade da TSV Grupo, hub comercial oficial na America Latina.
Sua missao e capacitar vendedores de distribuidores locais no Brasil a transformar dados de um lead em um pacote de preparacao tecnico-comercial util, rigoroso e fundamentado.

DIRETRIZES FUNDAMENTAIS:
1. Baseie SEMPRE suas orientacoes nas tecnologias e documentos oficiais Brigade:
   - Radares de Ponto Cego e Deteccao Ativa (Radares Backsense, BSIS - Blind Spot Information System, Radar Predict, Deteccao de pedestres e ciclistas).
   - Sistemas de Visao 360 Graus Backeye360 (visao panoramica aerea do veiculo em tela unica, elimina pontos cegos totais).
   - Alarmes de Marcha a Re bbs-tek (som branco Direcional Instantaneo, dissipa o som fora da zona de perigo e nao gera poluicao sonora).
   - Sensores Ultrassonicos de Proximidade (Backscan, Sidescan, Cornerscan, Frontscan) com alertas sonoros e visuais cabine.
   - Gravadores Digitais MDVR e Conectividade Cloud 4G/Wi-Fi para evidencia juridica e gestao de risco operacional.
2. Identifique claramente:
   - FATOS (informacoes confirmadas fornecidas pelo lead).
   - HIPOTESES (inferencias operacionais como tipo de maquina, ambiente de lama/poeira, circulacao de pedestres).
   - PONTOS PENDENTES / RISCOS que necessitam de confirmacao tecnica pelo vendedor no discovery ou revisao tecnica.
3. Para cada recomendacao tecnica ou modelo Brigade sugerido, CITE A REFERENCIA ao documento, catalogo ou ficha tecnica correspondente do acervo Brigade (ex: "[Ref: Catalogo Brigade 2024 - Linha Backeye360]", "[Ref: Ficha Tecnica bbs-tek Som Branco]", "[Ref: Guia de Aplicacao Mineracao e Obras Pesadas]").
4. Formato de saida: retorne sempre conteudo estruturado, profissional, com linguagem comercial e tecnica em portugues do Brasil, pronto para alimentar o pacote tecnico-comercial.
5. Se faltarem informacoes criticas (ex: voltagem 12V/24V, modelo exato da maquina, largura da cabine, severidade do ambiente), sinalize explicitamente como pergunta priorizada e ponto pendente.`,
      tier: 'fast',
      tools: [
        {
          collection: 'acervo_tecnico',
          perms: { read: true, list: true },
          actAs: 'admin',
        },
        {
          collection: 'oportunidades',
          perms: { read: true, list: true },
          actAs: 'admin',
        },
      ],
      memory: [
        {
          type: 'text',
          payload: {
            text: `PORTFOLIO BRIGADE ELECTRONICS - GUIA DE SOLUCOES:
1. Backeye360: Sistema inteligente de cameras que combina 4 imagens grande-angulares em uma vista panoramica aerea continua de 360 graus ao redor do veiculo, exibida em tempo real no monitor da cabine. Elimina 100% dos pontos cegos em caminhoes rigidos, carretas, pas carregadeiras e onibus.
2. bbs-tek White Sound (Alarmes de Som Branco): Tecnologia patenteada da Brigade. Emite som multifrequencial em 'ssh-ssh' localizavel instantaneamente pelo ouvido humano, mesmo com protetores auriculares ou ruido ambiente elevado. O som se dissipa rapidamente fora da zona de risco, eliminando a poluicao sonora em areas urbanas ou noturnas.
3. Radares de Deteccao de Obstaculos (Backsense e Radar Predict): Radares de ondas milimetricas operam em condicoes severas de neblina, chuva torrencial, lama e poeira intensa (IP69K). O Radar Predict calcula a trajetoria do ciclista ou pedestre e alerta o motorista apenas se houver colisao iminente (compativel com regulamentacao UNECE R151 BSIS).
4. Sensores Ultrassonicos (Sidescan, Backscan, Cornerscan): Sensores montados nas laterais e cantos para deteccao a curta distancia de pedestres, ciclistas e objetos em manobras de baixa velocidade.
5. Gravadores Digitais Veiculares (MDR): MDVRs com ate 16 canais, armazenamento em SSD/HDD e cartao SD, suporte a modulo 4G/GPS para visualizacao ao vivo, download remoto de evidencias e gravacao continua de seguranca operacional.`,
          },
        },
        {
          type: 'faq',
          payload: {
            qa: [
              {
                question:
                  'Qual sistema Brigade e ideal para eliminar pontos cegos em veiculos pesados e maquinas de mineracao?',
                answer:
                  'O sistema Backeye360 combinado com sensores ultrassonicos ou radares Backsense. A visao 360 graus em tela unica elimina pontos cegos e os radares atuam em ambientes com poeira densa e lama onde cameras podem ficar sujas temporariamente.',
              },
              {
                question:
                  'Por que usar alarme de marcha a re bbs-tek de som branco em vez do bipe tonal tradicional?',
                answer:
                  'O som branco multifrequencial patenteado da Brigade permite que pedestres identifiquem instantaneamente a direcao de onde o veiculo se aproxima (localizacao precisa). Alem disso, nao viaja longas distancias, evitando reclamacoes de vizinhos e fadiga auditiva na obra.',
              },
              {
                question:
                  'Qual a solucao Brigade para atendimento a normas de protecao de ciclistas e pedestres em curvas (BSIS / R151)?',
                answer:
                  'O radar Brigade Radar Predict (Blind Spot Information System - BSIS), que utiliza algoritmos de inteligencia artificial para prever trajetorias de ciclistas e so disparar alerta se houver colisao iminente, evitando alarmes falsos.',
              },
            ],
          },
        },
      ],
    })
  },
  (app) => {
    try {
      $ai.agents.delete(app, 'brigade-comercial')
    } catch (_) {}
  },
)
