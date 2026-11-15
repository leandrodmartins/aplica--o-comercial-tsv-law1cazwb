migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Usuário Administrador TSV (Flávio Zanotta / TSV Grupo)
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'flavio.zanotta@brigade-electronics.com')
    } catch (_) {
      const tsvUser = new Record(users)
      tsvUser.setEmail('flavio.zanotta@brigade-electronics.com')
      tsvUser.setPassword('Skip@Pass')
      tsvUser.setVerified(true)
      tsvUser.set('name', 'Flavio Zanotta (TSV)')
      tsvUser.set('role', 'tsv')
      tsvUser.set('cargo', 'Gestor Comercial e Tecnico TSV')
      tsvUser.set('distribuidora', 'TSV Grupo Brasil')
      app.save(tsvUser)
    }

    // 2. Usuário Vendedor Distribuidor 1 (Carlos Distribuidor)
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'carlos.vendedor@distribuidor.com.br')
    } catch (_) {
      const vendUser = new Record(users)
      vendUser.setEmail('carlos.vendedor@distribuidor.com.br')
      vendUser.setPassword('Skip@Pass')
      vendUser.setVerified(true)
      vendUser.set('name', 'Carlos Oliveira (Distribuidor)')
      vendUser.set('role', 'vendedor')
      vendUser.set('cargo', 'Consultor Comercial de Seguranca')
      vendUser.set('distribuidora', 'MegaDist Seguranca Veicular')
      app.save(vendUser)
    }

    // 3. Usuário Vendedor Distribuidor 2 (Mariana Vendedora)
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'mariana.vendas@autoseg.com.br')
    } catch (_) {
      const vendUser2 = new Record(users)
      vendUser2.setEmail('mariana.vendas@autoseg.com.br')
      vendUser2.setPassword('Skip@Pass')
      vendUser2.setVerified(true)
      vendUser2.set('name', 'Mariana Santos (AutoSeg)')
      vendUser2.set('role', 'vendedor')
      vendUser2.set('cargo', 'Especialista em Frotas')
      vendUser2.set('distribuidora', 'AutoSeg Solucoes')
      app.save(vendUser2)
    }

    // 4. Acervo Técnico inicial com materiais chave Brigade
    const acervoCol = app.findCollectionByNameOrId('acervo_tecnico')
    const materiaisIniciais = [
      {
        titulo: 'Catalogo Geral Brigade Brasil 2024 - Solucoes de Seguranca Veicular',
        codigo: 'CAT-BR-2024-V1',
        categoria: 'catalogo',
        linha_produto: 'geral_portfolio',
        resumo:
          'Visao geral das 5 linhas de seguranca ativa Brigade: cameras 360, radares BSIS, alarmes som branco, sensores ultrassonicos e gravadores MDVR.',
        conteudo_texto:
          'Documento oficial Brigade com especificacoes completas de todos os sistemas, tabelas de aplicabilidade por tipo de veiculo (pesados, mineração, construção, logística rodoviária e ônibus), normas atendidas (ECE R151 BSIS, ECE R46, ISO 13766) e certificacoes de protecao ambiental IP68/IP69K.',
        ativo: true,
      },
      {
        titulo: 'Ficha Tecnica Backeye360 BN360-300 - Sistema de Visao Panoramica em 360 Graus',
        codigo: 'FT-BN360-300',
        categoria: 'ficha_tecnica',
        linha_produto: 'cameras_360_backeye',
        resumo:
          'Eliminacao total de pontos cegos com 4 cameras ultragrande-angulares de 187 graus e processamento de imagem em tempo real em monitor unico de 7 ou 10 polegadas.',
        conteudo_texto:
          'Sistema de 4 câmeras calibradas com software inteligente Brigade que sintetiza em tempo real uma vista superior aérea panorâmica em torno do chassi. Elimina riscos de atropelamento e batidas em manobras estreitas de carga e descarga.',
        ativo: true,
      },
      {
        titulo: 'Ficha Tecnica bbs-tek White Sound - Alarmes Inteligentes de Marcha a Re',
        codigo: 'FT-BBS-WHITE-SOUND',
        categoria: 'ficha_tecnica',
        linha_produto: 'alarmes_bbs_som_branco',
        resumo:
          'Alarme patenteado Brigade com emissao de som multifrequencial direcional instantaneo. Nao causa poluicao sonora e alerta com precisao a posicao de perigo.',
        conteudo_texto:
          'Ao contrario dos alarmes tonais que criam eco e desorientacao, o som branco bbs-tek da Brigade e localizavel na hora pelo ouvido humano. Frequencias selecionadas dissipam-se fora da zona critica, atendendo legislacoes de ruido noturno e reduzindo queixas comunitarias.',
        ativo: true,
      },
      {
        titulo: 'Guia de Aplicacao Radar Predict - Deteccao Ativa BSIS UNECE R151',
        codigo: 'GA-RADAR-PREDICT-2024',
        categoria: 'guia_aplicacao',
        linha_produto: 'radar_bsis',
        resumo:
          'Radar inteligente lateral com IA para calculo de trajetorias de ciclistas e pedestres, eliminando falsos alarmes em curvas e manobras urbanas.',
        conteudo_texto:
          'Compativel com veiculos comerciais N2/N3 e onibus M2/M3. Algoritmo diferencial que so ativa alertas luminosos e sonoros caso haja risco iminente de colisao com usuario vulneravel da via (VRU).',
        ativo: true,
      },
      {
        titulo: 'Manual de Engenharia: Sensores Ultrassonicos Sidescan e Backscan',
        codigo: 'MAN-SIDESCAN-SS001',
        categoria: 'manual',
        linha_produto: 'sensores_ultrassonicos',
        resumo:
          'Montagem de modulos laterais e traseiros de deteccao por ultrassom com 4 estagios de aviso sonoro graduado conforme aproximacao.',
        conteudo_texto:
          'Diretrizes para instalacao em carrocerias furgão, baú, caçambas basculantes e articulados. Alcance configuravel de 0.6m a 2.5m com compensacao de desnivel.',
        ativo: true,
      },
    ]

    for (const mat of materiaisIniciais) {
      const recs = app.findRecordsByFilter('acervo_tecnico', `codigo = '${mat.codigo}'`, '', 1, 0)
      if (recs.length === 0) {
        const doc = new Record(acervoCol)
        for (const [k, v] of Object.entries(mat)) {
          doc.set(k, v)
        }
        app.save(doc)
      }
    }

    // 5. Oportunidades iniciais para demonstrar visibilidade e fluxo
    const oportCol = app.findCollectionByNameOrId('oportunidades')
    const pacotesCol = app.findCollectionByNameOrId('pacotes')

    const carlosUser = app.findAuthRecordByEmail(
      '_pb_users_auth_',
      'carlos.vendedor@distribuidor.com.br',
    )
    const tsvUser = app.findAuthRecordByEmail(
      '_pb_users_auth_',
      'flavio.zanotta@brigade-electronics.com',
    )

    const op1Filter = app.findRecordsByFilter(
      'oportunidades',
      "empresa = 'TransVale Mineracao e Logistica'",
      '',
      1,
      0,
    )
    if (op1Filter.length === 0) {
      const op1 = new Record(oportCol)
      op1.set('empresa', 'TransVale Mineracao e Logistica')
      op1.set('contato_nome', 'Eng. Roberto Albuquerque')
      op1.set('contato_email', 'roberto.albuquerque@transvalemin.com.br')
      op1.set('contato_telefone', '(31) 98765-4321')
      op1.set('contato_cargo', 'Gerente Corporativo de Saude e Seguranca Operacional')
      op1.set(
        'mensagem_original',
        'Recebemos recomendacao de auditoria para reforcar a eliminacao de pontos cegos na nossa frota de 42 caminhoes fora-de-estrada e 15 pás carregadeiras em Congonhas/MG. O ambiente tem muita poeira e lama, e tivemos quase-acidentes em manobras de re nos patios de britagem. Queremos entender solucao robusta de cameras 360 e alarmes que os operadores realmente respeitem.',
      )
      op1.set(
        'aplicacao',
        'Mineracao pesada a ceu aberto - caminhoes fora-de-estrada e pas carregadeiras em patio de britagem e basculamento',
      )
      op1.set('segmento', 'mineracao')
      op1.set('estado', 'em_revisao')
      op1.set(
        'proxima_acao',
        'Revisao tecnica do pacote pela TSV e agendamento de apresentacao com Eng. Roberto',
      )
      op1.set('responsavel', carlosUser.id)
      op1.set('criado_por', carlosUser.id)
      op1.set('distribuidora', 'MegaDist Seguranca Veicular')
      app.save(op1)

      // Criar pacote de preparação da Oportunidade 1
      const pac1 = new Record(pacotesCol)
      pac1.set('oportunidade', op1.id)
      pac1.set('versao', 1)
      pac1.set(
        'briefing_contexto',
        `<h3>Contexto Operacional</h3><p>A TransVale opera 42 caminhões basculantes e 15 pás em regime 24/7 sob poeira severa de minério de ferro e lama. Houve quase-acidentes em manobra de marcha à ré no britador primário.</p><h3>Hipóteses de Engenharia</h3><p>Câmeras comuns sofrerão acúmulo rápido de sujidade. O alarme convencional de marcha a ré já é ignorado por saturação sonora na mina.</p><h3>Riscos Identificados</h3><p>Necessidade de proteção IP69K, lavagem pressurizada e redundância entre visão 360° e radar de micro-ondas para quando a lente estiver temporariamente suja.</p>`,
      )
      pac1.set(
        'briefing_hipoteses',
        `Ambiente agressivo exige equipamento com homologacao para vibracao severa (norma ISO 13766 de maquinas de construcao e mineracao). A combinacao de Backeye360 com radares Backsense e o caminho correto.`,
      )
      pac1.set(
        'briefing_riscos',
        `1. Ignorancia de alertas sonoros devido a protetores auriculares (som branco bbs-tek resolve).\n2. Câmeras traseiras cobertas por lama durante basculamento.`,
      )
      pac1.set(
        'perguntas_priorizadas',
        JSON.stringify([
          {
            ordem: 1,
            pergunta:
              'Qual a voltagem eletrica do sistema dos caminhoes e pás (12V ou 24V isolado)?',
            categoria: 'Eletrica',
          },
          {
            ordem: 2,
            pergunta:
              'Existe monitor de telemetria ja instalado na cabine com entrada de video compativel ou sera fornecido monitor Brigade dedicado de 7 ou 10 polegadas?',
            categoria: 'Cabine',
          },
          {
            ordem: 3,
            pergunta:
              'A empresa pretende realizar teste piloto em quantos veiculos antes da expansao para as 57 maquinas?',
            categoria: 'Comercial',
          },
        ]),
      )
      pac1.set(
        'minuta_email_assunto',
        'Solucoes Brigade para Pontos Cegos e Manobra Segura - Frota TransVale Mineracao',
      )
      pac1.set(
        'minuta_email_corpo',
        `<p>Prezado Eng. Roberto,</p><p>Agradecemos o contato referente a seguranca operacional da frota TransVale. Diante do desafio de operacao continua em patio de britagem com poeira e lama, preparamos uma configuracao com tecnologia Brigade comprovada em mineradoras globais:</p><ul><li><strong>Sistema Backeye®360:</strong> Visao aerea continua ao redor de toda a maquina em monitor de alta definicao na cabine [Ref: FT-BN360-300].</li><li><strong>Radares de Obstaculos Backsense®:</strong> Deteccao confiavel por ondas milimetricas mesmo com lama e poeira cobrindo a lataria.</li><li><strong>Alarmes bbs-tek® Som Branco:</strong> Localizacao auditiva instantanea sem poluir a vizinhanca [Ref: FT-BBS-WHITE-SOUND].</li></ul><p>Gostariamos de alinhar uma breve videoconferencia de 25 minutos nesta quinta ou sexta-feira para calibrarmos o escopo de um teste piloto sem custo operacional.</p><p>Atenciosamente,<br>Carlos Oliveira | MegaDist / Parceiro Oficial TSV - Brigade Brasil</p>`,
      )
      pac1.set(
        'apresentacao_slides',
        JSON.stringify([
          {
            titulo: 'Desafio de Seguranca: TransVale Mineracao',
            conteudo:
              'Operacao 24/7 com quase-acidentes de marcha a re e pontos cegos em 57 veiculos pesados.',
          },
          {
            titulo: 'Solucao Brigade 1: Backeye®360',
            conteudo:
              'Vista panoramica aerea do veiculo sintetizada em tela unica de alta durabilidade (IP69K).',
          },
          {
            titulo: 'Solucao Brigade 2: Alarmes bbs-tek Som Branco',
            conteudo:
              'Som direcional instantaneo audivel sob protetor auricular, sem poluicao sonora.',
          },
          {
            titulo: 'Plano Piloto Sugerido',
            conteudo:
              'Instalacao piloto em 2 caminhoes fora-de-estrada para validacao com operadores em 15 dias.',
          },
        ]),
      )
      pac1.set(
        'pontos_pendentes',
        JSON.stringify([
          {
            pendencia:
              'Confirmar voltagem exata e se ha espaco para monitor adicional no painel da cabine',
            resolvido: false,
          },
          {
            pendencia:
              'Confirmar se o Eng. Roberto tem autonomia direta de compra ou se depende de comite corporativo',
            resolvido: false,
          },
        ]),
      )
      pac1.set(
        'referencias_brigade',
        JSON.stringify([
          { codigo: 'FT-BN360-300', titulo: 'Ficha Tecnica Backeye360 BN360-300' },
          { codigo: 'FT-BBS-WHITE-SOUND', titulo: 'Ficha Tecnica bbs-tek White Sound' },
          { codigo: 'CAT-BR-2024-V1', titulo: 'Catalogo Geral Brigade Brasil 2024' },
        ]),
      )
      pac1.set('status_revisao', 'em_revisao')
      pac1.set(
        'notas_revisor',
        'Pacote inicial montado pelo assistente com base no catalogo Brigade. Aguardando aprovacao da revisao tecnica TSV.',
      )
      app.save(pac1)
    }

    const op2Filter = app.findRecordsByFilter(
      'oportunidades',
      "empresa = 'Expresso Metropole Onibus'",
      '',
      1,
      0,
    )
    if (op2Filter.length === 0) {
      const op2 = new Record(oportCol)
      op2.set('empresa', 'Expresso Metropole Onibus')
      op2.set('contato_nome', 'Juliana Rezende')
      op2.set('contato_email', 'juliana.rezende@expressometropole.com.br')
      op2.set('contato_telefone', '(11) 99887-1122')
      op2.set('contato_cargo', 'Supervisora de Operacoes Urbanas')
      op2.set(
        'mensagem_original',
        'Nossa frota de 120 onibus articulados e padron no corredor urbano tem enfrentado situacoes criticas de risco com ciclistas e motos no lado direito durante curvas. Precisamos nos adequar as melhores praticas de deteccao de pontos cegos urbanos.',
      )
      op2.set(
        'aplicacao',
        'Transporte coletivo urbano - 120 onibus articulados e padron em corredores de alta densidade',
      )
      op2.set('segmento', 'onibus_urbano')
      op2.set('estado', 'aprovado')
      op2.set(
        'proxima_acao',
        'Enviar minuta de e-mail aprovada e apresentacao PDF para Juliana Rezende',
      )
      op2.set('responsavel', tsvUser.id)
      op2.set('criado_por', tsvUser.id)
      op2.set('distribuidora', 'TSV Grupo Brasil')
      app.save(op2)

      const pac2 = new Record(pacotesCol)
      pac2.set('oportunidade', op2.id)
      pac2.set('versao', 1)
      pac2.set(
        'briefing_contexto',
        `<h3>Contexto Urbano</h3><p>Linhas centrais com alta concentracao de ciclistas em faixas compartilhadas. Manobras de conversao a direita sao o ponto mais critico de colisoes.</p><h3>Recomendacao Tecnica</h3><p>Instalacao do Brigade Radar Predict (BSIS - R151) na lateral direita dos articulados com alerta sonoro e luminoso na coluna da cabine.</p>`,
      )
      pac2.set(
        'briefing_hipoteses',
        `Veiculos ja possuem sistema de bilhetagem e telemetria, cabine compacta. O Radar Predict opera de forma autonoma com IA de predicao de trajeto.`,
      )
      pac2.set(
        'briefing_riscos',
        `Falsos alarmes em semaforos podem estressar os motoristas; por isso o radar comum deve ser descartado em prol do Radar Predict que so alerta se houver colisao calculada.`,
      )
      pac2.set(
        'perguntas_priorizadas',
        JSON.stringify([
          {
            ordem: 1,
            pergunta:
              'Quantos onibus articulados de 23m e quantos padron de 14m compoem os 120 veiculos?',
            categoria: 'Frota',
          },
          {
            ordem: 2,
            pergunta: 'A instalacao sera feita em garagem central nos finais de semana?',
            categoria: 'Operacao',
          },
        ]),
      )
      pac2.set(
        'minuta_email_assunto',
        'Protecao Ativa de Ciclistas e Pedestres em Curvas - Expresso Metropole & Brigade TSV',
      )
      pac2.set(
        'minuta_email_corpo',
        `<p>Prezada Juliana,</p><p>Analisamos a operacao dos 120 onibus da Expresso Metropole. Para conversao a direita sem risco e sem falsos alarmes, indicamos o Brigade Radar Predict [Ref: GA-RADAR-PREDICT-2024], sistema com homologacao internacional BSIS R151 que calcula a trajetoria dos ciclistas.</p><p>O pacote tecnico completo e a apresentacao resumida estao anexos para analise da diretoria.</p><p>Cordialmente,<br>Flavio Zanotta | TSV Grupo</p>`,
      )
      pac2.set(
        'apresentacao_slides',
        JSON.stringify([
          {
            titulo: 'Seguranca Urbana de Onibus: Expresso Metropole',
            conteudo:
              'Protecao ativa para ciclistas e pedestres em corredores viarios movimentados.',
          },
          {
            titulo: 'Tecnologia Brigade Radar Predict (BSIS R151)',
            conteudo: 'IA preditiva de colisao que elimina falsos alarmes em curvas e semaforos.',
          },
          {
            titulo: 'Beneficios de Gestao e Seguranca',
            conteudo: 'Zero colisoes laterais, reducao de custos juridicos e protecao da vida.',
          },
        ]),
      )
      pac2.set(
        'pontos_pendentes',
        JSON.stringify([
          {
            pendencia:
              'Confirmado modelo de chassi e espelho retrovisor com suporte para sensor lateral',
            resolvido: true,
          },
        ]),
      )
      pac2.set(
        'referencias_brigade',
        JSON.stringify([
          {
            codigo: 'GA-RADAR-PREDICT-2024',
            titulo: 'Guia de Aplicacao Radar Predict - Deteccao Ativa BSIS',
          },
          { codigo: 'CAT-BR-2024-V1', titulo: 'Catalogo Geral Brigade Brasil 2024' },
        ]),
      )
      pac2.set('status_revisao', 'aprovado')
      pac2.set(
        'notas_revisor',
        'Aprovado tecnicamente por Flavio Zanotta. Todas as pendencias tecnicas foram sanadas.',
      )
      pac2.set('revisor', tsvUser.id)
      pac2.set('aprovado_em', '2026-03-28 14:00:00.000Z')
      app.save(pac2)
    }
  },
  (app) => {
    // down migration
  },
)
