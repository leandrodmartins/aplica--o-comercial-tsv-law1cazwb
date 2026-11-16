import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Building,
  User,
  Mail,
  Phone,
  Briefcase,
  Layers,
  Calendar,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { AppUser, OportunidadeSegmento } from '@/types/tsv'

export interface FormLead {
  empresa: string
  contatoNome: string
  contatoEmail: string
  contatoTelefone: string
  contatoCargo: string
  mensagemOriginal: string
  aplicacao: string
  segmento: OportunidadeSegmento
}

const LABEL_CLS = 'text-xs text-slate-300 flex items-center gap-1'
const INPUT_CLS = 'bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-600'

export function FormularioOportunidade({
  form,
  setField,
  isTSV,
  equipe,
  responsavelId,
  setResponsavelId,
  proximaAcao,
  setProximaAcao,
  gerarImediatamente,
  setGerarImediatamente,
  loading,
  onSubmit,
  onVoltar,
  veioDeEmail,
}: {
  form: FormLead
  setField: <K extends keyof FormLead>(campo: K, valor: FormLead[K]) => void
  isTSV: boolean
  equipe: AppUser[]
  responsavelId: string
  setResponsavelId: (v: string) => void
  proximaAcao: string
  setProximaAcao: (v: string) => void
  gerarImediatamente: boolean
  setGerarImediatamente: (v: boolean) => void
  loading: boolean
  onSubmit: (e: React.FormEvent) => void
  onVoltar: () => void
  veioDeEmail: boolean
}) {
  return (
    <div className="space-y-6">
      {veioDeEmail && (
        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-900/40 text-xs text-emerald-200 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          Dados extraídos da IA Brigade. Revise, edite o que for preciso e salve a oportunidade.
        </div>
      )}

      {/* Linha 1: Empresa & Segmento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="empresa" className={LABEL_CLS}>
            <Building className="w-3.5 h-3.5 text-blue-400" /> Empresa ou Grupo *
          </Label>
          <Input
            id="empresa"
            placeholder="Ex: Mineração Serra Verde, Rodoviário São José..."
            value={form.empresa}
            onChange={(e) => setField('empresa', e.target.value)}
            className={INPUT_CLS}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="segmento" className={LABEL_CLS}>
            <Briefcase className="w-3.5 h-3.5 text-blue-400" /> Segmento de Operação
          </Label>
          <Select
            value={form.segmento}
            onValueChange={(val) => setField('segmento', val as OportunidadeSegmento)}
          >
            <SelectTrigger className="bg-slate-950/70 border-slate-800 text-slate-200 text-xs">
              <SelectValue placeholder="Selecione o segmento" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
              <SelectItem value="mineracao">Mineração e Extração</SelectItem>
              <SelectItem value="construcao">Construção Civil e Pesada</SelectItem>
              <SelectItem value="logistica_rodoviaria">Logística Rodoviária e Cargas</SelectItem>
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
          <Label htmlFor="contatoNome" className={LABEL_CLS}>
            <User className="w-3.5 h-3.5 text-slate-400" /> Nome do Contato *
          </Label>
          <Input
            id="contatoNome"
            placeholder="Ex: Carlos Andrade"
            value={form.contatoNome}
            onChange={(e) => setField('contatoNome', e.target.value)}
            className={INPUT_CLS}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contatoCargo" className={LABEL_CLS}>
            Cargo / Área
          </Label>
          <Input
            id="contatoCargo"
            placeholder="Ex: Gerente de Operações / Frota"
            value={form.contatoCargo}
            onChange={(e) => setField('contatoCargo', e.target.value)}
            className={INPUT_CLS}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contatoEmail" className={LABEL_CLS}>
            <Mail className="w-3.5 h-3.5 text-slate-400" /> E-mail
          </Label>
          <Input
            id="contatoEmail"
            type="email"
            placeholder="contato@empresa.com.br"
            value={form.contatoEmail}
            onChange={(e) => setField('contatoEmail', e.target.value)}
            className={INPUT_CLS}
          />
        </div>
      </div>

      {/* Linha 3: Telefone / Responsável */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contatoTelefone" className={LABEL_CLS}>
            <Phone className="w-3.5 h-3.5 text-slate-400" /> Telefone / WhatsApp
          </Label>
          <Input
            id="contatoTelefone"
            placeholder="(00) 90000-0000"
            value={form.contatoTelefone}
            onChange={(e) => setField('contatoTelefone', e.target.value)}
            className={INPUT_CLS}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="responsavel" className={LABEL_CLS}>
            <User className="w-3.5 h-3.5 text-amber-400" /> Vendedor / Responsável *
          </Label>
          {isTSV && equipe.length > 0 ? (
            // isTSV aqui significa "gestor da operação" (chega como isAdmin da página:
            // admin e tsv escolhem o responsável; vendedor vê o campo travado).
            <Select value={responsavelId} onValueChange={setResponsavelId}>
              <SelectTrigger className="bg-slate-950/70 border-slate-800 text-slate-200 text-xs">
                <SelectValue placeholder="Selecione o vendedor" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                {equipe.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} — {u.email} (
                    {u.role === 'tsv'
                      ? 'TSV'
                      : u.role === 'admin'
                        ? 'Admin'
                        : u.role === 'revisor'
                          ? 'Revisor'
                          : u.distribuidor || 'Distribuidor'}
                    )
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <InputVendedorSomenteLeitura />
          )}
        </div>
      </div>

      {/* Aplicação Operacional */}
      <div className="space-y-2">
        <Label htmlFor="aplicacao" className={LABEL_CLS}>
          <Layers className="w-3.5 h-3.5 text-blue-400" /> Aplicação e Tipo de Veículo *
        </Label>
        <Input
          id="aplicacao"
          placeholder="Ex: Caminhões fora-de-estrada em mina aberta, carretas baú em rodovia, ônibus urbanos..."
          value={form.aplicacao}
          onChange={(e) => setField('aplicacao', e.target.value)}
          className={INPUT_CLS}
          required
        />
        <p className="text-[11px] text-slate-500">
          Descreva sucintamente o ambiente de operação, veículos envolvidos e condições de manobra.
        </p>
      </div>

      {/* Mensagem Original Completa */}
      <div className="space-y-2">
        <Label htmlFor="mensagemOriginal" className={LABEL_CLS}>
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Mensagem Original Recebida do Lead *
        </Label>
        <Textarea
          id="mensagemOriginal"
          rows={6}
          placeholder="Cole aqui o e-mail, formulário do site Brigade ou mensagem de WhatsApp que deu origem ao contato..."
          value={form.mensagemOriginal}
          onChange={(e) => setField('mensagemOriginal', e.target.value)}
          className="bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-600 text-sm leading-relaxed"
          required
        />
      </div>

      {/* Próxima Ação */}
      <div className="space-y-2">
        <Label htmlFor="proximaAcao" className={LABEL_CLS}>
          <Calendar className="w-3.5 h-3.5 text-amber-400" /> Próxima Ação Imediata
        </Label>
        <Input
          id="proximaAcao"
          value={proximaAcao}
          onChange={(e) => setProximaAcao(e.target.value)}
          className={INPUT_CLS + ' text-xs'}
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
            O assistente consultará o acervo técnico Brigade para produzir o briefing de discovery,
            perguntas, minuta de e-mail e apresentação.
          </p>
        </div>
        <input
          type="checkbox"
          checked={gerarImediatamente}
          onChange={(e) => setGerarImediatamente(e.target.checked)}
          className="h-4 w-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500"
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-5">
        <Button
          type="button"
          variant="ghost"
          onClick={onVoltar}
          className="text-slate-400 hover:text-white"
        >
          {veioDeEmail ? 'Voltar para o e-mail' : 'Cancelar'}
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
      </div>
    </div>
  )
}

/** Fallback exibido quando o usuário não pode escolher o responsável. */
function InputVendedorSomenteLeitura() {
  return (
    <Input
      disabled
      value="Usuário atual"
      className="bg-slate-950/50 border-slate-800 text-slate-400 text-xs"
    />
  )
}
