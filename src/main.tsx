/* Main entry point for the application - renders the root React component */
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './main.css'
import { aplicarTema, temaSalvo } from '@/lib/theme'

// Aplica o tema salvo antes da primeira renderização (padrão: escuro)
aplicarTema(temaSalvo())

// @skip-protected: Do not remove. Required for React rendering.
createRoot(document.getElementById('root')!).render(<App />)
