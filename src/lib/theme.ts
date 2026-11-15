/* Tema claro/escuro: aplica a classe `dark` no <html> (darkMode: 'class' do Tailwind) e persiste a escolha */
export type Tema = 'claro' | 'escuro'

const CHAVE = 'tsv-tema'

export function temaSalvo(): Tema {
  try {
    const valor = localStorage.getItem(CHAVE)
    return valor === 'claro' ? 'claro' : 'escuro'
  } catch {
    return 'escuro'
  }
}

export function aplicarTema(tema: Tema) {
  document.documentElement.classList.toggle('dark', tema === 'escuro')
  document.documentElement.style.colorScheme = tema === 'escuro' ? 'dark' : 'light'
}

export function salvarTema(tema: Tema) {
  try {
    localStorage.setItem(CHAVE, tema)
  } catch {
    // armazenamento indisponível: o tema vale só para esta sessão
  }
  aplicarTema(tema)
}
