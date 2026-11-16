import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { useAuth } from '@/context/AuthContext'
import { oportunidadeService, usuarioService } from '@/services/oportunidades'
import { authService } from '@/services/auth'
import { pacoteService } from '@/services/pacotes'
import { iaService } from '@/services/ia'
import { AppUser, OportunidadeSegmento } from '@/types/tsv'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EtapaColarEmail } from '@/components/oportunidades/EtapaColarEmail'
import { FormularioOportunidade, FormLead } from '@/components/oportunidades/FormularioOportunidade'
import { Sparkles } from 'lucide-react'

/** Mensagem clara em PT-BR para falha no salvamento (o detalhe técnico vai no toast). */
const MSG_FALHA_SALVAR =
  'Não foi possível salvar a oportunidade. Verifique os campos e tente novamente.'

const FORM_INICIAL: FormLead = {
  empresa: '',
  contatoNome: '',
  contatoEmail: '',
  contatoTelefone: '',
  contatoCargo: '',
  mensagemOriginal: '',
  aplicacao: '',
  segmento: 'logistica_rodoviaria',
}

export default function NovaOportunidade() {
  const { user, isTSV } = useAuth()
  const navigate = useNavigate()

  const [etapa, setEtapa] = useState<'email' | 'manual' | 'formulario'>('email')
  const [emailTexto, setEmailTexto] = useState('')
  const [extraindo, setExtraindo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [loadingEquipe, setLoadingEquipe] = useState(false)
  const [equipe, setEquipe] = useState<AppUser[]>([])
  const [form, setForm] = useState<FormLead>(FORM_INICIAL)
  const [responsavelId, setResponsavelId] = useState<string>(user?.id || '')
  const [proximaAcao, setProximaAcao] = useState(
    'Gerar pacote de preparação técnico-comercial com o Assistente Brigade e agendar discovery',
  )
  const [gerarImediatamente, setGerarImediatamente] = useState(true)

  // Carregar lista de vendedores / equipe se for TSV
  useEffect(() => {
    async function carregar() {
      try {
        setLoadingEquipe(true)
        const usuarios = await usuarioService.listarEquipe()
        setEquipe(usuarios)
        if (!responsavelId && user?.id) {
          setResponsavelId(user.id)
        }
      } catch (e) {
        console.error('Erro ao carregar equipe:', e)
      } finally {
        setLoadingEquipe(false)
      }
    }
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const setField = <K extends keyof FormLead>(campo: K, valor: FormLead[K]) =>
    setForm((f) => ({ ...f, [campo]: valor }))

  /** Chama o hook extrair-lead e pré-preenche o formulário com o resultado. */
  const handleExtrair = async () => {
    if (!emailTexto.trim()) {
      setError('Cole o texto do e-mail do lead antes de extrair.')
      return
    }
    try {
      setExtraindo(true)
      setError(null)
      const lead = await iaService.extrairLead(emailTexto)
      setForm({
        empresa: lead.empresa || '',
        contatoNome: lead.contato_nome || '',
        contatoEmail: lead.contato_email || '',
        contatoTelefone: lead.contato_telefone || '',
        contatoCargo: lead.contato_cargo || '',
        mensagemOriginal: lead.mensagem_original || emailTexto,
        aplicacao: lead.aplicacao || '',
        segmento: lead.segmento || 'outro',
      })
      setEtapa('formulario')
    } catch (err: any) {
      setError(err?.message || 'Falha ao extrair os dados do e-mail com a IA Brigade')
    } finally {
      setExtraindo(false)
    }
  }

  const handleManual = () => {
    setEtapa('manual')
    setForm(FORM_INICIAL)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !form.empresa.trim() ||
      !form.contatoNome.trim() ||
      !form.mensagemOriginal.trim() ||
      !form.aplicacao.trim()
    ) {
      setError('Preencha os campos obrigatórios (Empresa, Contato, Mensagem Original e Aplicação)')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const novaOp = await oportunidadeService.criar({
        empresa: form.empresa.trim(),
        contato_nome: form.contatoNome.trim(),
        contato_email: form.contatoEmail.trim() || undefined,
        contato_telefone: form.contatoTelefone.trim() || undefined,
        contato_cargo: form.contatoCargo.trim() || undefined,
        mensagem_original: form.mensagemOriginal.trim(),
        aplicacao: form.aplicacao.trim(),
        segmento: form.segmento,
        responsavel: responsavelId || user?.id || '',
        proxima_acao: proximaAcao.trim(),
        distribuidor: user?.distribuidor || undefined,
      })

      if (gerarImediatamente) {
        try {
          await pacoteService.gerarComIA(novaOp.id)
        } catch (iaErr) {
          console.warn('Aviso: O pacote foi criado mas a IA gerou fallback:', iaErr)
        }
      }

      navigate(`/pacote/${novaOp.id}`)
    } catch (err) {
      // O PocketBase devolve o erro cru em inglês ("Failed to create record.");
      // exibimos a mensagem clara em PT-BR, com o detalhe técnico entre parênteses.
      toast({
        title: 'Falha ao criar oportunidade manualmente',
        description: `${MSG_FALHA_SALVAR} (${getErrorMessage(err)})`,
        variant: 'destructive',
      })
      setError(MSG_FALHA_SALVAR)
    } finally {
      setLoading(false)
    }
  }

  // Etapa 2: formulário completo (após extração ou em modo manual)
  if (etapa !== 'email') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-400" />
              {etapa === 'manual'
                ? 'Cadastrar Oportunidade Manualmente'
                : 'Revise os Dados Extraídos'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {etapa === 'manual'
                ? 'Preencha os dados do lead e a IA Brigade gerará o pacote de preparação.'
                : 'Confira os campos extraídos pelo assistente e corrija o que for preciso.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-xs text-red-200">
            {error}
          </div>
        )}

        <Card className="bg-slate-900/60 border-slate-800 text-slate-100">
          <CardHeader>
            <CardTitle className="text-lg text-white">Dados do Lead e Mensagem Original</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Mantenha o texto integral enviado pelo cliente para que o modelo capture nuances de
              aplicação e riscos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FormularioOportunidade
                form={form}
                setField={setField}
                isTSV={isTSV}
                equipe={equipe}
                responsavelId={responsavelId}
                setResponsavelId={setResponsavelId}
                proximaAcao={proximaAcao}
                setProximaAcao={setProximaAcao}
                gerarImediatamente={gerarImediatamente}
                setGerarImediatamente={setGerarImediatamente}
                loading={loading}
                onSubmit={handleSubmit}
                onVoltar={() => setEtapa('email')}
                veioDeEmail={etapa === 'formulario'}
              />
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Etapa 1: colar e-mail do lead (ou caminho manual)
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" /> Cadastrar Nova Oportunidade
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Cole o e-mail do lead e deixe a IA Brigade preencher os dados; ou inclua manualmente.
          </p>
        </div>
      </div>

      <EtapaColarEmail
        emailTexto={emailTexto}
        setEmailTexto={setEmailTexto}
        onExtrair={handleExtrair}
        onManual={handleManual}
        extraindo={extraindo}
        error={error}
      />
    </div>
  )
}
