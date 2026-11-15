import pb from '@/lib/pocketbase/client'
import { AcervoCategoria, AcervoTecnicoItem, LinhaProdutoBrigade } from '@/types/tsv'

export const acervoService = {
  async listar(filtros?: {
    categoria?: AcervoCategoria
    linha_produto?: LinhaProdutoBrigade
    busca?: string
  }): Promise<AcervoTecnicoItem[]> {
    const filterParts: string[] = ['ativo = true']

    if (filtros?.categoria) {
      filterParts.push(`categoria = '${filtros.categoria}'`)
    }

    if (filtros?.linha_produto) {
      filterParts.push(`linha_produto = '${filtros.linha_produto}'`)
    }

    if (filtros?.busca) {
      const q = filtros.busca.replace(/'/g, "\\'")
      filterParts.push(`(titulo ~ '${q}' || codigo ~ '${q}' || resumo ~ '${q}')`)
    }

    const records = await pb.collection('acervo_tecnico').getFullList({
      filter: filterParts.join(' && '),
      sort: '-created',
    })

    return records.map((rec) => ({
      id: rec.id,
      titulo: rec.titulo as string,
      codigo: rec.codigo as string | undefined,
      categoria: rec.categoria as AcervoCategoria,
      linha_produto: rec.linha_produto as LinhaProdutoBrigade,
      resumo: rec.resumo as string | undefined,
      conteudo_texto: rec.conteudo_texto as string | undefined,
      arquivo: rec.arquivo ? pb.files.getURL(rec, rec.arquivo as string) : undefined,
      ativo: Boolean(rec.ativo),
      created: rec.created as string,
      updated: rec.updated as string,
    }))
  },

  async criar(dados: {
    titulo: string
    codigo?: string
    categoria: AcervoCategoria
    linha_produto: LinhaProdutoBrigade
    resumo?: string
    conteudo_texto?: string
    arquivo?: File
  }): Promise<AcervoTecnicoItem> {
    const formData = new FormData()
    formData.append('titulo', dados.titulo)
    if (dados.codigo) formData.append('codigo', dados.codigo)
    formData.append('categoria', dados.categoria)
    formData.append('linha_produto', dados.linha_produto)
    if (dados.resumo) formData.append('resumo', dados.resumo)
    if (dados.conteudo_texto) formData.append('conteudo_texto', dados.conteudo_texto)
    formData.append('ativo', 'true')

    if (dados.arquivo) {
      formData.append('arquivo', dados.arquivo)
    }

    const rec = await pb.collection('acervo_tecnico').create(formData)

    return {
      id: rec.id,
      titulo: rec.titulo as string,
      codigo: rec.codigo as string | undefined,
      categoria: rec.categoria as AcervoCategoria,
      linha_produto: rec.linha_produto as LinhaProdutoBrigade,
      resumo: rec.resumo as string | undefined,
      conteudo_texto: rec.conteudo_texto as string | undefined,
      arquivo: rec.arquivo ? pb.files.getURL(rec, rec.arquivo as string) : undefined,
      ativo: Boolean(rec.ativo),
      created: rec.created as string,
      updated: rec.updated as string,
    }
  },

  async excluir(id: string): Promise<void> {
    await pb.collection('acervo_tecnico').delete(id)
  },
}
