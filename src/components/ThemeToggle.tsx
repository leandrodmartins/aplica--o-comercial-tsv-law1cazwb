import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'
import { salvarTema, type Tema } from '@/lib/theme'

/* Alterna o tema claro/escuro da aplicação inteira e persiste a escolha */
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [tema, setTema] = useState<Tema>(() =>
    document.documentElement.classList.contains('dark') ? 'escuro' : 'claro',
  )

  const alternar = () => {
    const proximo: Tema = tema === 'escuro' ? 'claro' : 'escuro'
    salvarTema(proximo)
    setTema(proximo)
  }

  const rotulo = tema === 'escuro' ? 'Ativar tema claro' : 'Ativar tema escuro'

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={alternar}
      title={rotulo}
      aria-label={rotulo}
      className={`h-8 w-8 text-muted-foreground hover:text-foreground ${className}`}
    >
      {tema === 'escuro' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
