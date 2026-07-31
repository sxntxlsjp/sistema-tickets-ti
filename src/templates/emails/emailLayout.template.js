// Layout corporativo común para todos los correos transaccionales (Sprint 22).
// Reglas de compatibilidad de clientes de correo (Gmail/Outlook/Apple Mail):
// tablas para layout, CSS inline, sin fuentes externas, sin imágenes remotas
// esenciales, sin JavaScript. No consulta Prisma ni accede a process.env.
const buildEmailLayout = ({ title = 'MasterDiv Desk', preheader = '', bodyHtml = '', ctaLabel = '', ctaUrl = '' }) => {
    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${title}</title>
</head>
<body style="margin:0; padding:0; background-color:#F1F5F9;">
<span style="display:none; font-size:1px; color:#F1F5F9; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">${preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F1F5F9;">
  <tr>
    <td align="center" style="padding:24px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background-color:#FFFFFF; border-radius:12px; border:1px solid #E2E8F0;">
        <tr>
          <td style="background-color:#0D1B2A; padding:24px 32px; border-radius:12px 12px 0 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-family: Arial, Helvetica, sans-serif; font-size:20px; font-weight:bold; color:#FFFFFF;">
                  MasterDiv&nbsp;Desk
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px; font-family: Arial, Helvetica, sans-serif; font-size:14px; line-height:1.6; color:#0F172A;">
            ${bodyHtml}
            ${ctaUrl ? `
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;">
              <tr>
                <td align="center" bgcolor="#2563EB" style="border-radius:8px;">
                  <a href="${ctaUrl}" target="_blank" style="display:inline-block; padding:13px 28px; font-family: Arial, Helvetica, sans-serif; font-size:14px; font-weight:bold; color:#FFFFFF; text-decoration:none; border-radius:8px;">
                    ${ctaLabel}
                  </a>
                </td>
              </tr>
            </table>
            ` : ''}
          </td>
        </tr>
        <tr>
          <td style="background-color:#F8FAFC; padding:20px 32px; border-top:1px solid #E2E8F0; border-radius:0 0 12px 12px;">
            <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size:12px; color:#64748B;">
              MasterDiv Desk &mdash; Plataforma de soporte multiempresa
            </p>
            <p style="margin:6px 0 0; font-family: Arial, Helvetica, sans-serif; font-size:12px; color:#94A3B8;">
              Este es un mensaje automático generado por el sistema de tickets.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
};

// Tabla de pares etiqueta/valor reutilizada por las 3 plantillas de notificación.
// Los valores ya deben venir escapados por quien llama — esta función solo maqueta.
const buildInfoTable = (rows) => {
    const rowsHtml = rows
        .filter(row => row.value !== null && row.value !== undefined && row.value !== '')
        .map(row => `
            <tr>
                <td style="padding:6px 12px 6px 0; font-family: Arial, Helvetica, sans-serif; font-size:13px; color:#64748B; white-space:nowrap; vertical-align:top;">
                    ${row.label}
                </td>
                <td style="padding:6px 0; font-family: Arial, Helvetica, sans-serif; font-size:13px; color:#0F172A; vertical-align:top;">
                    ${row.value}
                </td>
            </tr>
        `)
        .join('');

    return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0; border-top:1px solid #E2E8F0; border-bottom:1px solid #E2E8F0;">
            ${rowsHtml}
        </table>
    `;
};

module.exports = { buildEmailLayout, buildInfoTable };
