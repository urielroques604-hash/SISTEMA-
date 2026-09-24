import { getAccessToken } from './gmailAuth';
import { VentaRegistro, Cliente, Producto } from '../types';

export interface CorreoDetalle {
  id: string;
  threadId: string;
  snippet: string;
  asunto: string;
  de: string;
  para: string;
  fecha: string;
  etiquetas?: string[];
}

// Codificador a Base64URL según RFC 4648 sección 5 (requerido por Gmail API)
function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Enviar un correo electrónico a través de Gmail API
 */
export async function enviarCorreoGmail(opciones: {
  para: string;
  asunto: string;
  cuerpoHtml: string;
  cuerpoTexto?: string;
  cc?: string;
  bcc?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { 
      success: false, 
      error: 'No hay una sesión activa de Google. Por favor, inicie sesión con Gmail.' 
    };
  }

  try {
    const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(opciones.asunto)))}?=`;
    const messageParts = [
      `To: ${opciones.para}`,
      opciones.cc ? `Cc: ${opciones.cc}` : '',
      opciones.bcc ? `Bcc: ${opciones.bcc}` : '',
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      opciones.cuerpoHtml
    ].filter(Boolean);

    const rawMessage = messageParts.join('\r\n');
    const encodedMessage = toBase64Url(rawMessage);

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: encodedMessage
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errorMsg = errData?.error?.message || `Error ${response.status}: ${response.statusText}`;
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return { success: true, id: data.id };
  } catch (err: any) {
    console.error('Error al enviar correo mediante Gmail API:', err);
    return { success: false, error: err.message || 'Error desconocido al enviar correo' };
  }
}

/**
 * Obtener lista de mensajes recientes de Gmail
 */
export async function listarMensajesGmail(
  maxResults: number = 10,
  filtro: string = ''
): Promise<{ success: boolean; mensajes?: CorreoDetalle[]; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: 'Inicie sesión con Google para ver los correos.' };
  }

  try {
    const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
    url.searchParams.set('maxResults', maxResults.toString());
    if (filtro) {
      url.searchParams.set('q', filtro);
    }

    const response = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || 'Error al obtener mensajes');
    }

    const data = await response.json();
    const listaIds: { id: string; threadId: string }[] = data.messages || [];

    // Cargar detalles de cada correo en paralelo (metadatos)
    const rawDetalles = await Promise.all(
      listaIds.map(async (item): Promise<CorreoDetalle | null> => {
        try {
          const msgRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          if (!msgRes.ok) return null;
          const msgData = await msgRes.json();

          const headers: Array<{ name: string; value: string }> = msgData.payload?.headers || [];
          const getHeader = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

          return {
            id: msgData.id,
            threadId: msgData.threadId,
            snippet: msgData.snippet || '',
            asunto: getHeader('Subject') || '(Sin Asunto)',
            de: getHeader('From') || '(Remitente desconocido)',
            para: getHeader('To') || '',
            fecha: getHeader('Date') ? new Date(getHeader('Date')).toLocaleString('es-ES') : '',
            etiquetas: msgData.labelIds || []
          };
        } catch {
          return null;
        }
      })
    );

    const detalles: CorreoDetalle[] = rawDetalles.filter((m): m is CorreoDetalle => m !== null);

    return { success: true, mensajes: detalles };
  } catch (err: any) {
    console.error('Error al listar correos de Gmail:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Genera el cuerpo HTML premium para enviar una factura/comprobante de venta por Gmail
 */
export function generarHtmlFactura(
  numeroVenta: string,
  lineas: VentaRegistro[],
  cliente?: Cliente | null
): string {
  if (!lineas.length) return '';
  const cabecera = lineas[0];
  const total = lineas.reduce((acc, it) => acc + it.total, 0);
  const articulos = lineas.reduce((acc, it) => acc + it.cantidad, 0);

  const filasProductos = lineas.map((it, idx) => `
    <tr style="border-bottom: 1px solid #f1f5f9; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
      <td style="padding: 10px 12px; font-weight: bold; color: #1e293b; font-size: 13px;">
        ${it.producto}${it.mililitros ? ` <span style="font-size: 11px; color: #4338ca; background: #e0e7ff; padding: 2px 6px; border-radius: 4px; font-weight: 800;">${it.mililitros} ml</span>` : ''}
      </td>
      <td style="padding: 10px 12px; text-align: center; color: #475569; font-size: 13px;">${it.cantidad}</td>
      <td style="padding: 10px 12px; text-align: right; color: #475569; font-size: 13px;">$${it.precioUnitario.toFixed(2)}</td>
      <td style="padding: 10px 12px; text-align: right; font-weight: bold; color: #0f172a; font-size: 13px;">$${it.total.toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Comprobante de Venta - VARIEDADES CS</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 24px; background-color: #f8fafc; color: #1e293b;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
        <!-- Encabezado Variedades CS -->
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
          <div style="font-size: 20px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #f472b6; margin-bottom: 4px;">
            🌸 VARIEDADES CS 🌸
          </div>
          <div style="font-size: 12px; color: #cbd5e1; letter-spacing: 1px; margin-bottom: 12px;">
            PERFUMERÍA • COSMÉTICOS • BOLSOS • CALZADO • ROPA • VARIEDADES
          </div>
          <div style="display: inline-block; background-color: rgba(244, 114, 182, 0.15); border: 1px solid #f472b6; color: #fbcfe8; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: bold;">
            COMPROBANTE DE COMPRA: ${numeroVenta}
          </div>
        </div>

        <div style="padding: 24px;">
          <!-- Información de la Venta -->
          <div style="background-color: #f1f5f9; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px; font-size: 12px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 3px 0; color: #64748b;"><strong>Fecha:</strong> ${cabecera.fecha}</td>
                <td style="padding: 3px 0; color: #64748b; text-align: right;"><strong>Atendido por:</strong> ${cabecera.usuario}</td>
              </tr>
              <tr>
                <td style="padding: 3px 0; color: #64748b;"><strong>Cliente:</strong> ${cabecera.cliente || cliente?.nombre || 'Consumidor Final'}</td>
                <td style="padding: 3px 0; color: #64748b; text-align: right;"><strong>Método:</strong> ${cabecera.formaPago}</td>
              </tr>
              ${cliente?.telefono ? `
              <tr>
                <td style="padding: 3px 0; color: #64748b;" colspan="2"><strong>Teléfono:</strong> ${cliente.telefono}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <!-- Tabla de Productos -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
            <thead>
              <tr style="background-color: #0f172a; color: #ffffff;">
                <th style="padding: 10px 12px; text-align: left; border-top-left-radius: 8px;">Perfume / Fragancia / Producto</th>
                <th style="padding: 10px 12px; text-align: center;">Cant.</th>
                <th style="padding: 10px 12px; text-align: right;">Precio</th>
                <th style="padding: 10px 12px; text-align: right; border-top-right-radius: 8px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${filasProductos}
            </tbody>
          </table>

          <!-- Resumen de Totales -->
          <div style="border-top: 2px dashed #cbd5e1; padding-top: 14px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 4px 0; color: #64748b;">Total Artículos:</td>
                <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #1e293b;">${articulos} unid.</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b;">Subtotal:</td>
                <td style="padding: 4px 0; text-align: right; color: #1e293b;">$${total.toFixed(2)}</td>
              </tr>
              <tr style="font-size: 16px;">
                <td style="padding: 8px 0; font-weight: 900; color: #0f172a;">TOTAL PAGADO:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 900; color: #059669;">$${total.toFixed(2)}</td>
              </tr>
              ${cabecera.efectivoRecibido ? `
              <tr style="font-size: 12px; color: #475569;">
                <td style="padding: 2px 0;">Efectivo Recibido:</td>
                <td style="padding: 2px 0; text-align: right;">$${cabecera.efectivoRecibido.toFixed(2)}</td>
              </tr>
              <tr style="font-size: 12px; color: #059669; font-weight: bold;">
                <td style="padding: 2px 0;">Cambio / Vuelto:</td>
                <td style="padding: 2px 0; text-align: right;">$${(cabecera.cambio || 0).toFixed(2)}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <!-- Política Estricta de Higiene y Agradecimiento -->
          <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 14px; text-align: center; font-size: 12px; color: #9f1239;">
            <div style="font-weight: bold; margin-bottom: 4px; font-size: 13px;">¡Muchas gracias por su compra! ✨</div>
            <p style="margin: 0; color: #be123c; font-size: 11px; font-weight: bold;">
              POLÍTICA: Por higiene, sellado y autenticidad en perfumería, cosméticos y artículos de uso personal, NO SE ACEPTAN CAMBIOS NI DEVOLUCIONES una vez retirado el producto.
            </p>
          </div>
        </div>

        <!-- Pie de Correo -->
        <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
          <p style="margin: 0;">VARIEDADES CS • De todo un poco con la mejor atención.</p>
          <p style="margin: 4px 0 0 0;">Este comprobante fue emitido y enviado automáticamente a través del sistema POS con Gmail.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Genera el cuerpo HTML para un reporte de inventario o alerta de stock bajo
 */
export function generarHtmlReporteInventario(productos: Producto[], filtroStockBajo: boolean = true): string {
  const filtrados = filtroStockBajo 
    ? productos.filter(p => p.existencia <= 3)
    : productos;

  const filas = filtrados.map(p => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 8px 10px; font-family: monospace; font-size: 12px; color: #2563eb;">${p.codigo}</td>
      <td style="padding: 8px 10px; font-size: 13px; font-weight: bold; color: #1e293b;">${p.producto}</td>
      <td style="padding: 8px 10px; font-size: 12px; color: #64748b;">${p.categoria || 'General'}</td>
      <td style="padding: 8px 10px; text-align: center; font-weight: bold; color: ${p.existencia <= 3 ? '#e11d48' : '#059669'};">
        ${p.existencia}
      </td>
      <td style="padding: 8px 10px; text-align: right; font-size: 12px; font-weight: bold;">$${p.precioVenta.toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: sans-serif; padding: 20px; background-color: #f8fafc; color: #1e293b;">
      <div style="max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #cbd5e1; overflow: hidden;">
        <div style="background-color: #0f172a; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0; color: #f472b6;">VARIEDADES CS - Reporte de Perfumería</h2>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #94a3b8;">
            ${filtroStockBajo ? '⚠️ Alerta de Fragancias con Existencia Crítica' : '📋 Resumen de Catálogo'}
          </p>
        </div>
        <div style="padding: 20px;">
          <p style="font-size: 13px; color: #475569;">
            Total de productos en este reporte: <strong>${filtrados.length}</strong>
          </p>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #f1f5f9; text-align: left;">
                <th style="padding: 8px 10px;">Código</th>
                <th style="padding: 8px 10px;">Perfume / Fragancia</th>
                <th style="padding: 8px 10px;">Categoría</th>
                <th style="padding: 8px 10px; text-align: center;">Stock</th>
                <th style="padding: 8px 10px; text-align: right;">PVP</th>
              </tr>
            </thead>
            <tbody>
              ${filas}
            </tbody>
          </table>
        </div>
      </div>
    </body>
    </html>
  `;
}
