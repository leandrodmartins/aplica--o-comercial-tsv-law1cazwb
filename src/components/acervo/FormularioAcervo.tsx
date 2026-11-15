import { useRef } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileUp, Sparkles } from 'lucide-react'
import { AcervoCategoria, LinhaProdutoBrigade } from '@/types/tsv'

export interface FormAcervo {
  titulo: string
  codigo: string
  categoria: AcervoCategoria
  linha_produto: LinhaProdutoBrigade
  resumo: string
  conteudo_texto: string
}

const INPUT_CLS = 'bg-slate-950/70 border-slate-800 text-white text-xs'
const FILE_CLS =
  'bg-slate-950/70 border-slate-800 text-slate-400 text-xs file:bg-slate-800 file:text-slate-200 file:border-0 file:rounded file:px-2 file:py-1 file:mr-2 file:text-xs'

/**
 * Formulário do acervo técnico. O campo de upload vem primeiro: após enviar o
 * documento, o hook `analisar-documento` pré-preenche tema, resumo e
 * classificação (categoria/linha) para revisão antes de salvar.
 */
export default function FormularioAcervo({
  form,
  setField,
  arquivo,
  setArquivo,
  analisando,
  erroAnalise,
  onAnalisar,
  salvando,
  onSubmit,
  onCancelar,
}: {
  form: FormAcervo
  setField: <K extends keyof FormAcervo>(campo: K, valor: FormAcervo[K]) => void
  arquivo: File | null
  setArquivo: (f: File | null) => void
  analisando: boolean
  erroAnalise: string | null
  onAnalisar: () => void
  salvando: boolean
  onSubmit: (e: React.FormEvent) => void
  onCancelar: () => void
}) {
  const inputArquivoRef = useRef<HTMLInputElement>(null)

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Passo 1: upload do documento */}
      <div className="space-y-2">
        <Label htmlFor="acervoArquivo" className="text-xs text-slate-300 flex items-center gap-1.5">
          <FileUp className="w-3.5 h-3.5 text-blue-400" />
          Documento (PDF, DOCX, PPTX)
        </Label>
        <Input
          ref={inputArquivoRef}
          id="acervoArquivo"
          type="file"
          accept=".pdf,.docx,.doc,.pptx,.ppt"
          onChange={(e) => setArquivo(e.target.files?.[0] || null)}
          className={FILE_CLS}
        />
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button
            type="button"
            onClick={onAnalisar}
            disabled={analisando || !arquivo}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
          >
            {analisando ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analisando documento...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" /> Analisar com IA Brigade
              </span>
            )}
          </Button>
          {arquivo && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setArquivo(null)
                if (inputArquivoRef.current) inputArquivoRef.current.value = ''
              }}
              className="text-slate-400 hover:text-white text-xs"
            >
              Remover arquivo
            </Button>
          )}
        </div>
        {erroAnalise && <p className="text-[11px] text-red-400">{erroAnalise}</p>}
        <p className="text-[11px] text-slate-500">
          A IA Brigade lê o documento e sugere tema, resumo e classificação. Revise os campos antes
          de salvar no acervo.
        </p>
      </div>

      {/* Tema / título */}
      <div className="space-y-2">
        <Label htmlFor="acervoTitulo" className="text-xs text-slate-300">
          Tema / Título *
        </Label>
        <Input
          id="acervoTitulo"
          value={form.titulo}
          onChange={(e) => setField('titulo', e.target.value)}
          className={INPUT_CLS}
          placeholder="Ex: Ficha Técnica Radar Predict BSIS 2024"
          required
        />
      </div>

      {/* Código e categoria */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="acervoCodigo" className="text-xs text-slate-300">
            Código / Referência
          </Label>
          <Input
            id="acervoCodigo"
            value={form.codigo}
            onChange={(e) => setField('codigo', e.target.value)}
            className={INPUT_CLS + ' font-mono'}
            placeholder="Ex: FT-RADAR-2024"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-slate-300">Categoria *</Label>
          <Select
            value={form.categoria}
            onValueChange={(v) => setField('categoria', v as AcervoCategoria)}
          >
            <SelectTrigger className={INPUT_CLS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
              <SelectItem value="catalogo">Catálogo Comercial</SelectItem>
              <SelectItem value="ficha_tecnica">Ficha Técnica</SelectItem>
              <SelectItem value="apresentacao">Apresentação</SelectItem>
              <SelectItem value="manual">Manual de Instalação</SelectItem>
              <SelectItem value="guia_aplicacao">Guia de Aplicação</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Linha de produto */}
      <div className="space-y-2">
        <Label className="text-xs text-slate-300">Linha de Solução Brigade</Label>
        <Select
          value={form.linha_produto}
          onValueChange={(v) => setField('linha_produto', v as LinhaProdutoBrigade)}
        >
          <SelectTrigger className={INPUT_CLS}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
            <SelectItem value="geral_portfolio">Portfólio Geral Brigade</SelectItem>
            <SelectItem value="cameras_360_backeye">Backeye®360 (Câmeras Panorâmicas)</SelectItem>
            <SelectItem value="radar_bsis">Radares Ativos BSIS &amp; Predict</SelectItem>
            <SelectItem value="alarmes_bbs_som_branco">bbs-tek® (Alarmes de Som Branco)</SelectItem>
            <SelectItem value="sensores_ultrassonicos">Sensores Ultrassônicos</SelectItem>
            <SelectItem value="mdvr_gravadores">Gravadores Digitais MDVR</SelectItem>
            <SelectItem value="ia_deteccao_pedestres">IA Detecção Ativa de Pedestres</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Resumo */}
      <div className="space-y-2">
        <Label htmlFor="acervoResumo" className="text-xs text-slate-300">
          Resumo Executivo para a IA
        </Label>
        <Textarea
          id="acervoResumo"
          rows={4}
          value={form.resumo}
          onChange={(e) => setField('resumo', e.target.value)}
          className={INPUT_CLS}
          placeholder="Preenchido automaticamente pela análise IA — revise e ajuste."
        />
      </div>

      {/* Conteúdo textual */}
      <div className="space-y-2">
        <Label htmlFor="acervoConteudo" className="text-xs text-slate-300">
          Conteúdo Textual / Notas Técnicas
        </Label>
        <Textarea
          id="acervoConteudo"
          rows={5}
          value={form.conteudo_texto}
          onChange={(e) => setField('conteudo_texto', e.target.value)}
          className={INPUT_CLS + ' font-mono'}
          placeholder="Especificações, normas atendidas (IP69K, UNECE R151) e diretrizes..."
        />
      </div>

      <div className="flex items-center justify-between border-t border-slate-800 pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancelar}
          className="text-slate-400 hover:text-white text-xs"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={salvando}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
        >
          {salvando ? 'Salvando...' : 'Adicionar ao Acervo'}
        </Button>
      </div>
    </form>
  )
}
