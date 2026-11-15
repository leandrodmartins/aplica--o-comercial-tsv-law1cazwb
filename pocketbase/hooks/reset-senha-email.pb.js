/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook: personaliza o e-mail nativo de redefinição de senha do PocketBase
 * (requestPasswordReset) para apontar para a página do app (/redefinir-senha)
 * e escrever em PT-BR na identidade TSV.
 *
 * Toda a lógica fica inline no callback (exigência do JSVM do PocketBase).
 */
onMailerUserAuthResetRequest((e) => {
  const appUrl = ($os.getenv('SITE_URL') || $os.getenv('PB_INSTANCE_URL') || '').replace(/\/$/, '')
  const token = e.token || ''
  const link = appUrl ? appUrl + '/redefinir-senha/' + encodeURIComponent(token) : e.url // fallback: URL de confirmação nativa do PocketBase

  const nome = e.user.name() || e.user.email()
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#0f172a;">
      <h2 style="margin:0 0 4px;">Olá, ${nome}!</h2>
      <p style="margin:0 0 16px;">Você solicitou a definição de senha da plataforma comercial do <strong>TSV Grupo</strong>.</p>
      <p style="margin:0 0 24px;">
        <a href="${link}"
           style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Definir minha senha
        </a>
      </p>
      <p style="margin:0 0 8px;">Se o botão não funcionar, copie e cole este endereço no navegador:</p>
      <p style="margin:0 0 16px;word-break:break-all;color:#2563eb;">${link}</p>
      <p style="margin:0;color:#64748b;font-size:12px;">Se você não solicitou este e-mail, ignore esta mensagem. O link expira em 30 minutos.</p>
    </div>`

  const subject = 'TSV Grupo — Defina sua senha de acesso'
  e.message.subject = subject
  e.message.html = html
  e.message.text = `Olá, ${nome}! Use este link para definir sua senha da plataforma TSV Grupo: ${link} (expira em 30 minutos). Se você não solicitou, ignore este e-mail.`

  e.next()
}, 'users')
