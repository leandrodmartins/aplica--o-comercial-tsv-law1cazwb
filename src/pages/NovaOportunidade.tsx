import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { oportunidadeService } from '@/services/oportunidades'
import { authService } from '@/services/auth'
import { pacoteService } from '@/services/pacotes'
import { AppUser, OportunidadeSegmento } from '@/types/tsv'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sparkles,
  Building,
  User,
  Mail,
  Phone,
  Briefcase,
  Layers,
  Calendar,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react'

export default function NovaOportunidade() {
  const { user, isTSV } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [loadingEquipe, setLoadingEquipe] = useState(false)
  const [equipe, setEquipe] = useState<AppUser[]>([])
  const [error, setError] = useState<string | null>(null)

  // Campos do formulário
  const [empresa, setEmpresa] = useState('')
  const [contatoNome, setContatoNome] = useState('')
  const [contatoEmail, setContatoEmail] = useState('')
  const [contatoTelefone, setContatoTelefone] = useState('')
  const [contatoCargo, setContatoCargo] = useState('')
  const [mensagemOriginal, setMensagemOriginal] = useState('')
  const [aplicacao, setAplicacao] = useState('')
  const [segmento, setSegmento] = useState<OportunidadeSegmento>('logistica_rodoviaria')
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
        const usuarios = await authService.listarEquipe()
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
  }, [user])

  // Exemplo de preenchimento rápido para testar
  const handlePreencherExemplo = () => {
    setEmpresa('Cimento Planalto & Agregados')
    setContatoNome('Marcelo Guimarães')
    setContatoEmail('marcelo.guimaraes@cimentoplanalto.com.br')
    setContatoTelefone('(19) 98112-9988')
    setContatoCargo('Gerente de Frotas e Segurança Viária')
    setMensagemOriginal(
      'Olá equipe Brigade, precisamos de uma solução para equipar 28 caminhões betoneira e cavalos mecânicos de transporte de cimento a granel. Temos muitos pontos cegos na lateral direita ao manobrar em canteiros de obras apertados e já tivemos pequenos abalroamentos com pedestres e postes. Queremos saber sobre as câmeras 360 e se o alarme sonoro de ré é aceito em áreas residenciais onde entregamos concreto de madrugada.',
    )
    setAplicacao(
      'Caminhões betoneira e carretas tanque de cimento operando em obras urbanas e manobras em locais residenciais',
    )
    setSegmento('construcao')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!empresa.trim() || !contatoNome.trim() || !mensagemOriginal.trim() || !aplicacao.trim()) {
      setError('Preencha os campos obrigatórios (Empresa, Contato, Mensagem Original e Aplicação)')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const novaOp = await oportunidadeService.criar({
        empresa: empresa.trim(),
        contato_nome: contatoNome.trim(),
        contato_email: contatoEmail.trim() || undefined,
        contato_telefone: contatoTelefone.trim() || undefined,
        contato_cargo: contatoCargo.trim() || undefined,
        mensagem_original: mensagemOriginal.trim(),
        aplicacao: aplicacao.trim(),
        segmento,
        responsavel: responsavelId || user?.id || '',
        proxima_acao: proximaAcao.trim(),
        distribuidora: user?.distribuidora || 'Distribuidor Parceiro',
      })

      // Se optou por gerar pacote na hora com o Agente Brigade:
      if (gerarImediatamente) {
        try {
          await pacoteService.gerarComIA(novaOp.id)
        } catch (iaErr) {
          console.warn('Aviso: O pacote foi criado mas a IA gerou fallback:', iaErr)
        }
      }

      // Redireciona direto para o pacote de preparação
      navigate(`/pacote/${novaOp.id}`)
    } catch (err: any) {
      setError(err?.message || 'Falha ao cadastrar oportunidade')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" /> Cadastrar Nova Oportunidade
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Cole as informações brutas do lead (mensagem, aplicação e contato). A IA Brigade gerará
            o briefing, perguntas de discovery e minuta de resposta.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePreencherExemplo}
          className="border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800 text-xs shrink-0"
        >
          Preencher com Exemplo Real
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="bg-slate-900/60 border-slate-800 text-slate-100">
          <CardHeader>
            <CardTitle className="text-lg text-white">Dados do Lead e Mensagem Original</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Mantenha o texto integral enviado pelo cliente para que o modelo capture nuances de
              aplicação e riscos.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="bg-red-950/50 border-red-800 text-red-200">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Linha 1: Empresa & Segmento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="empresa" className="text-xs text-slate-300 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-blue-400" /> Empresa ou Grupo *
                </Label>
                <Input
                  id="empresa"
                  placeholder="Ex: Mineração Serra Verde, Rodoviário São José..."
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  className="bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="segmento"
                  className="text-xs text-slate-300 flex items-center gap-1"
                >
                  <Briefcase className="w-3.5 h-3.5 text-blue-400" /> Segmento de Operação
                </Label>
                <Select
                  value={segmento}
                  onValueChange={(val) => setSegmento(val as OportunidadeSegmento)}
                >
                  <SelectTrigger className="bg-slate-950/70 border-slate-800 text-slate-200 text-xs">
                    <SelectValue placeholder="Selecione o segmento" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                    <SelectItem value="mineracao">Mineração e Extração</SelectItem>
                    <SelectItem value="construcao">Construção Civil e Pesada</SelectItem>
                    <SelectItem value="logistica_rodoviaria">
                      Logística Rodoviária e Cargas
                    </SelectItem>
                    <SelectItem value="onibus_urbano">Ônibus Urbano e Rodoviário</SelectItem>
                    <SelectItem value="agricola">Agrícola e Silvicultura</SelectItem>
                    <SelectItem value="portuario">Portuário e Terminais Intermodais</SelectItem>
                    <SelectItem value="frotas_leves">Frotas Comerciais Leves</SelectItem>
                    <SelectItem value="outro">Outro Segmento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Linha 2: Contato Principal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="contatoNome"
                  className="text-xs text-slate-300 flex items-center gap-1"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" /> Nome do Contato *
                </Label>
                <Input
                  id="contatoNome"
                  placeholder="Ex: Carlos Andrade"
                  value={contatoNome}
                  onChange={(e) => setContatoNome(e.target.value)}
                  className="bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="contatoCargo"
                  className="text-xs text-slate-300 flex items-center gap-1"
                >
                  Cargo / Área
                </Label>
                <Input
                  id="contatoCargo"
                  placeholder="Ex: Gerente de Operações / Frota"
                  value={contatoCargo}
                  onChange={(e) => setContatoCargo(e.target.value)}
                  className="bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="contatoEmail"
                  className="text-xs text-slate-300 flex items-center gap-1"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> E-mail
                </Label>
                <Input
                  id="contatoEmail"
                  type="email"
                  placeholder="contato@empresa.com.br"
                  value={contatoEmail}
                  onChange={(e) => setContatoEmail(e.target.value)}
                  className="bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Linha 3: Telefone / WhatsApp */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="contatoTelefone"
                  className="text-xs text-slate-300 flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Telefone / WhatsApp
                </Label>
                <Input
                  id="contatoTelefone"
                  placeholder="(00) 90000-0000"
                  value={contatoTelefone}
                  onChange={(e) => setContatoTelefone(e.target.value)}
                  className="bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-600"
                />
              </div>

              {/* Responsável (só TSV pode atribuir a outros vendedores) */}
              <div className="space-y-2">
                <Label
                  htmlFor="responsavel"
                  className="text-xs text-slate-300 flex items-center gap-1"
                >
                  <User className="w-3.5 h-3.5 text-amber-400" /> Vendedor / Responsável *
                </Label>
                {isTSV && equipe.length > 0 ? (
                  <Select value={responsavelId} onValueChange={setResponsavelId}>
                    <SelectTrigger className="bg-slate-950/70 border-slate-800 text-slate-200 text-xs">
                      <SelectValue placeholder="Selecione o vendedor" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                      {equipe.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.role === 'tsv' ? 'TSV' : u.distribuidora || 'Distribuidor'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    disabled
                    value={`${user?.name} (${user?.distribuidora || 'Minha Distribuidora'})`}
                    className="bg-slate-950/50 border-slate-800 text-slate-400 text-xs"
                  />
                )}
              </div>
            </div>

            {/* Aplicação Operacional */}
            <div className="space-y-2">
              <Label htmlFor="aplicacao" className="text-xs text-slate-300 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-400" /> Aplicação e Tipo de Veículo *
              </Label>
              <Input
                id="aplicacao"
                placeholder="Ex: Caminhões fora-de-estrada em mina aberta, carretas baú em rodovia, ônibus urbanos..."
                value={aplicacao}
                onChange={(e) => setAplicacao(e.target.value)}
                className="bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-600"
                required
              />
              <p className="text-[11px] text-slate-500">
                Descreva sucintamente o ambiente de operação, veículos envolvidos e condições de
                manobra.
              </p>
            </div>

            {/* Mensagem Original Completa */}
            <div className="space-y-2">
              <Label
                htmlFor="mensagemOriginal"
                className="text-xs text-slate-300 flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Mensagem Original Recebida do
                Lead *
              </Label>
              <Textarea
                id="mensagemOriginal"
                rows={6}
                placeholder="Cole aqui o e-mail, formulário do site Brigade ou mensagem de WhatsApp que deu origem ao contato..."
                value={mensagemOriginal}
                onChange={(e) => setMensagemOriginal(e.target.value)}
                className="bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-600 text-sm leading-relaxed"
                required
              />
            </div>

            {/* Próxima Ação */}
            <div className="space-y-2">
              <Label
                htmlFor="proximaAcao"
                className="text-xs text-slate-300 flex items-center gap-1"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-400" /> Próxima Ação Imediata
              </Label>
              <Input
                id="proximaAcao"
                value={proximaAcao}
                onChange={(e) => setProximaAcao(e.target.value)}
                className="bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-600 text-xs"
              />
            </div>

            {/* Opção de Geração Automática */}
            <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-900/40 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-blue-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Gerar Pacote Técnico com IA Brigade na criação
                </p>
                <p className="text-[11px] text-slate-400">
                  O assistente consultará o acervo técnico Brigade para produzir o briefing de
                  discovery, perguntas, minuta de e-mail e apresentação.
                </p>
              </div>
              <input
                type="checkbox"
                checked={gerarImediatamente}
                onChange={(e) => setGerarImediatamente(e.target.checked)}
                className="h-4 w-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500"
              />
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t border-slate-800 pt-5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-slate-400 hover:text-white"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-600/20"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processando com IA Brigade...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Salvar e Gerar Pacote <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
