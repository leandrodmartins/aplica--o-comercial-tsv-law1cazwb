import { useState, useEffect } from 'react'
import { trilhaService, formatarQuando } from '@/services/trilha'
import { EventoTrilha } from '@/types/tsv'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { History, User as UserIcon } from 'lucide-react'

interface Props {
  oportunidadeId: string
  pacoteId?: string
  titulo?: string
}

/** Trilha de eventos: quem fez o quê e quando (PRD MVP). */
export function TrilhaEventos({ oportunidadeId, pacoteId, titulo }: Props) {
  const [eventos, setEventos] = useState<EventoTrilha[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let vivo = true
    setCarregando(true)
    trilhaService
      .listarPorOportunidade(oportunidadeId, pacoteId)
      .then((evs) => {
        if (vivo) setEventos(evs)
      })
      .catch(() => {
        if (vivo) setEventos([])
      })
      .finally(() => {
        if (vivo) setCarregando(false)
      })
    return () => {
      vivo = false
    }
  }, [oportunidadeId, pacoteId])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          {titulo || 'Trilha de Eventos'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {carregando ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : eventos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum evento registrado ainda para esta oportunidade.
          </p>
        ) : (
          <ScrollArea className="max-h-72">
            <ol className="relative space-y-4 border-l border-border pl-5">
              {eventos.map((ev) => (
                <li key={ev.id} className="relative">
                  <span className="absolute -left-[27px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
                  <p className="text-sm font-medium">{ev.acao}</p>
                  {ev.detalhe && <p className="text-sm text-muted-foreground">{ev.detalhe}</p>}
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <UserIcon className="h-3 w-3" />
                    {ev.expand?.usuario?.name || ev.expand?.usuario?.email || 'Usuário'}
                    <Badge variant="outline" className="font-normal">
                      {formatarQuando(ev.created)}
                    </Badge>
                  </p>
                </li>
              ))}
            </ol>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

export default TrilhaEventos
