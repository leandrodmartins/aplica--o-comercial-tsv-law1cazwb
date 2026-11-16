import { ReactNode } from 'react'
import {
  User,
  ShieldCheck,
  UserCheck,
  Users,
  Route,
  Sparkles,
  FileText,
  Send,
  CheckCircle2,
  XCircle,
  Layers,
  BookOpen,
  ClipboardList,
  Mail,
  FolderArchive,
  Star,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

/**
 * Tela "Manual" (/manual): manual rápido do app com papéis, fluxo início ao fim
 * (fluxograma visual), regras de ouro e passo a passo. Conteúdo aprovado pelo
 * usuário na versão 0.0.27. Componentes React/CSS — sem imagem.
 */

const PAPEIS = [
  {
    icone: User,
    nome: 'Admin (TSV)',
    cor: 'text-red-400',
    borda: 'border-red-900/40',
    ve: 'Vê todas as oportunidades e todos os usuários.',
    faz: [
      'Gerencia a equipe na tela Equipe (criar, editar, enviar link de senha).',
      'Acompanha todo o funil e pode atuar como responsável em qualquer oportunidade.',
      'Aprova pacotes de preparação (revisão técnica).',
    ],
  },
  {
    icone: ShieldCheck,
    nome: 'TSV / Gestor',
    cor: 'text-blue-400',
    borda: 'border-blue-900/40',
    ve: 'Vê todas as oportunidades de todos os distribuidores.',
    faz: [
      'Cria oportunidades e escolhe o vendedor responsável.',
      'Gera o pacote de preparação com IA e ajusta briefing, perguntas e minuta.',
      'Revisa e aprova pacotes antes do envio ao cliente.',
    ],
  },
  {
    icone: UserCheck,
    nome: 'Revisor Técnico',
    cor: 'text-emerald-400',
    borda: 'border-emerald-900/40',
    ve: 'Vê tudo (mesma visão do TSV).',
    faz: [
      'Aprova ou rejeita pacotes na tela Revisão Técnica.',
      'Registra notas de revisão e solicita ajustes quando necessário.',
      'Sem o visto, nenhum pacote chega ao cliente.',
    ],
  },
  {
    icone: Users,
    nome: 'Vendedor',
    cor: 'text-amber-400',
    borda: 'border-amber-900/40',
    ve: 'Vê apenas as suas próprias oportunidades.',
    faz: [
      'Cadastra leads (colando o e-mail do cliente ou manualmente).',
      'Acompanha o pacote de preparação gerado pela IA.',
      'Envia a minuta de e-mail ao cliente após a aprovação técnica.',
    ],
  },
]

const ETAPAS = [
  {
    icone: Mail,
    titulo: 'Nova oportunidade',
    detalhe: 'Cole o e-mail do lead (a IA extrai os dados) ou cadastre manualmente.',
    cor: 'text-blue-400',
    fundo: 'bg-blue-950/30 border-blue-900/40',
  },
  {
    icone: Sparkles,
    titulo: 'Dados extraídos',
    detalhe:
      'A IA Brigade preenche empresa, contato, aplicação e segmento — revise antes de salvar.',
    cor: 'text-amber-400',
    fundo: 'bg-amber-950/30 border-amber-900/40',
  },
  {
    icone: ClipboardList,
    titulo: 'Pacote de preparação (rascunho)',
    detalhe:
      'Briefing, perguntas priorizadas, minuta de e-mail e apresentação, alimentados pelo acervo técnico.',
    cor: 'text-slate-300',
    fundo: 'bg-slate-900/60 border-slate-800',
  },
  {
    icone: FileText,
    titulo: 'Revisão técnica',
    detalhe: 'O revisor técnico aprova ou rejeita o pacote. Rejeitado volta para ajuste.',
    cor: 'text-purple-400',
    fundo: 'bg-purple-950/30 border-purple-900/40',
  },
  {
    icone: Send,
    titulo: 'Envio ao cliente',
    detalhe: 'Só pacote aprovado pode ser enviado. A trilha de eventos registra cada passo.',
    cor: 'text-emerald-400',
    fundo: 'bg-emerald-950/30 border-emerald-900/40',
  },
]

const REGRAS = [
  'Todo pacote nasce como rascunho e só chega ao cliente após aprovação técnica.',
  'A IA Brigade usa o acervo técnico Brigade como fonte — cadastre e mantenha o acervo em dia.',
  'Nenhum e-mail é enviado ao cliente automaticamente: a minuta é sempre revisada por pessoas.',
  'A trilha de eventos registra quem fez o quê e quando — use o histórico em caso de dúvida.',
  'Senhas não são repassadas manualmente: o acesso novo é pelo link "definir senha" por e-mail.',
]

const PASSOS = [
  {
    titulo: '1. Cadastrar o lead',
    icone: Mail,
    texto:
      'Nova Oportunidade → cole o e-mail do cliente e clique em "Extrair com IA" (ou escolha "Incluir manualmente"). Confira os dados extraídos e salve.',
  },
  {
    titulo: '2. Gerar o pacote de preparação',
    icone: Sparkles,
    texto:
      'Ao salvar, a IA gera o pacote com briefing, perguntas priorizadas, minuta de e-mail e apresentação — tudo com base no acervo técnico.',
  },
  {
    titulo: '3. Revisar e aprovar',
    icone: FileText,
    texto:
      'Na tela Revisão Técnica, o revisor lê o pacote, resolve as pendências e clica em Aprovar (ou Rejeitar com motivo). ',
  },
  {
    titulo: '4. Enviar ao cliente',
    icone: Send,
    texto:
      'Com o pacote aprovado, use a minuta de e-mail e o material de apresentação para o contato final. O estado da oportunidade passa a "enviado".',
  },
  {
    titulo: '5. Alimentar o acervo',
    icone: FolderArchive,
    texto:
      'Novos catálogos, fichas técnicas e materiais Brigade entram no Acervo Técnico para melhorar as próximas gerações de pacote.',
  },
]

/** Etapa do fluxo com seta conectora entre os cartões (fluxograma visual). */
function EtapaFluxo({ etapa, icone }: { etapa: (typeof ETAPAS)[number]; icone: typeof Mail }) {
  const Icon = icone
  return (
    <div className="flex items-start gap-3">
      {/* Cartão da etapa */}
      <div className={`flex-1 p-4 rounded-xl border ${etapa.fundo}`}>
        <div className="flex items-center gap-2 mb-1.5">
          <div className={`p-1.5 rounded-lg bg-slate-950/60 border border-slate-800`}>
            <Icon className={`w-4 h-4 ${etapa.cor}`} />
          </div>
          <p className="text-sm font-semibold text-white">{etapa.titulo}</p>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">{etapa.detalhe}</p>
      </div>
      {/* Seta conectora */}
      <div className="hidden sm:flex flex-col items-center justify-center self-stretch pr-1">
        <div className="h-px w-6 bg-slate-700 mt-8 relative">
          <span className="absolute -right-1 -top-[3px] text-slate-500 text-[10px]">▶</span>
        </div>
      </div>
    </div>
  )
}

export default function Manual() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
      {/* Cabeçalho */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-amber-400" /> Manual Rápido
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Como o assistente comercial TSV funciona, papel a papel, do lead ao envio ao cliente.
        </p>
      </div>

      {/* Papéis */}
      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" /> Papéis e o que cada um faz
          </CardTitle>
          <CardDescription className="text-xs">
            Cada perfil vê e pode fazer coisas diferentes. O isolamento é aplicado no servidor.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PAPEIS.map((p) => {
            const Icon = p.icone
            return (
              <div key={p.nome} className={`p-4 rounded-xl border ${p.borda} bg-slate-950/40`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4.5 h-4.5 ${p.cor}`} />
                  <p className={`text-sm font-semibold ${p.cor}`}>{p.nome}</p>
                </div>
                <p className="text-xs text-slate-400 mb-2">{p.ve}</p>
                <ul className="space-y-1">
                  {p.faz.map((item, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                      <CheckCircle2 className={`w-3 h-3 mt-0.5 shrink-0 ${p.cor}`} /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Fluxo início ao fim (fluxograma) */}
      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Route className="w-5 h-5 text-amber-400" /> Fluxo do início ao fim
          </CardTitle>
          <CardDescription className="text-xs">
            Da mensagem do cliente ao envio — a revisão técnica é obrigatória antes de qualquer
            contato externo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {ETAPAS.map((etapa, i) => (
            <EtapaFluxo key={i} etapa={etapa} icone={etapa.icone} />
          ))}
          <div className="flex items-center gap-2 pt-2 text-xs text-slate-400">
            <FolderArchive className="w-4 h-4 text-amber-400" />O{' '}
            <span className="font-medium text-slate-200">Acervo Técnico</span> alimenta a IA em
            todas as etapas: quanto melhor o acervo, melhor o pacote.
          </div>
        </CardContent>
      </Card>

      {/* Regras de ouro */}
      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400" /> Regras de ouro
          </CardTitle>
          <CardDescription className="text-xs">
            Princípios que valem para todos os papéis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {REGRAS.map((regra, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px] h-4 px-1.5">
                  {i + 1}
                </Badge>
                {regra}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Passo a passo */}
      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" /> Passo a passo
          </CardTitle>
          <CardDescription className="text-xs">
            Na ordem, o caminho de uma oportunidade dentro do app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {PASSOS.map((passo) => {
            const Icon = passo.icone
            return (
              <div key={passo.titulo} className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 shrink-0">
                  <Icon className="w-4 h-4 text-slate-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{passo.titulo}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{passo.texto}</p>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Aviso de governança */}
      <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-900/40 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-200">Aprovação técnica obrigatória</p>
          <p className="text-xs text-amber-200/70 mt-0.5">
            Nenhum material chega ao cliente sem o visto do revisor técnico. Rejeitado volta para
            ajuste com o motivo registrado — nunca é enviado por fora do app.
          </p>
          <p className="text-xs text-amber-200/70 mt-1 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Dúvidas sobre permissões? Fale com o administrador da
            sua conta.
          </p>
        </div>
      </div>
    </div>
  )
}
