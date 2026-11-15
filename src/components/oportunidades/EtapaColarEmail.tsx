import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Sparkles, MailQuestion } from 'lucide-react'

export function EtapaColarEmail({
  emailTexto,
  setEmailTexto,
  onExtrair,
  onManual,
  extraindo,
  error,
}: {
  emailTexto: string
  setEmailTexto: (v: string) => void
  onExtrair: () => void
  onManual: () => void
  extraindo: boolean
  error: string | null
}) {
  return (
    <Card className="bg-slate-900/60 border-slate-800 text-slate-100">
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <MailQuestion className="w-5 h-5 text-amber-400" /> Passo 1 — Cole o e-mail do lead
        </CardTitle>
        <CardDescription className="text-slate-400 text-xs">
          Cole o e-mail (ou mensagem de site/WhatsApp) e a IA Brigade extrai contato, empresa,
          mensagem original e aplicação para você revisar antes de salvar.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {error && (
          <Alert variant="destructive" className="bg-red-950/50 border-red-800 text-red-200">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="emailTexto" className="text-xs text-slate-300">
            Texto bruto do e-mail / mensagem do lead
          </Label>
          <Textarea
            id="emailTexto"
            rows={12}
            placeholder={
              'De: marcelo@cimentoplanalto.com.br\n\nOlá, precisamos de uma solução para equipar 28 caminhões betoneira...\n\nMarcelo Guimarães\nGerente de Frotas\n(19) 98112-9988'
            }
            value={emailTexto}
            onChange={(e) => setEmailTexto(e.target.value)}
            className="bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-600 text-sm leading-relaxed font-mono"
          />
          <p className="text-[11px] text-slate-500">
            Dica: cole o e-mail completo, com cabeçalho e assinatura — a IA limpa o texto e separa
            os dados de contato da mensagem do cliente.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <Button
            type="button"
            variant="ghost"
            onClick={onManual}
            className="text-slate-400 hover:text-white text-xs"
          >
            A oportunidade não veio por e-mail? Incluir manualmente
          </Button>

          <Button
            type="button"
            onClick={onExtrair}
            disabled={extraindo || !emailTexto.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-600/20"
          >
            {extraindo ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Extraindo dados com IA Brigade...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" /> Extrair dados com IA
              </span>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
