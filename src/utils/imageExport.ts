import { toPng, toBlob } from 'html-to-image';

export interface CompartirImagenResult {
  success: boolean;
  mensaje: string;
  blob?: Blob;
  dataUrl?: string;
  metodo?: 'share' | 'download' | 'clipboard';
}

/**
 * Convierte un elemento DOM (ticket o comprobante) en imagen PNG de alta calidad.
 * Soporta descarga directa, portapapeles y Compartir nativo (WhatsApp, etc.).
 */
export async function exportarElementoComoImagen(
  elementId: string,
  nombreArchivo: string = 'Comprobante_VariedadesCS.png'
): Promise<CompartirImagenResult> {
  const elemento = document.getElementById(elementId);
  if (!elemento) {
    return {
      success: false,
      mensaje: `No se encontró el comprobante para generar la imagen (ID: ${elementId}).`
    };
  }

  try {
    // Medir dimensiones completas del elemento para no cortar nada (darla entera)
    const alturaTotal = Math.max(elemento.scrollHeight, elemento.offsetHeight, 400);
    const anchoTotal = Math.max(elemento.scrollWidth, elemento.offsetWidth, 300);

    const opciones = {
      backgroundColor: '#ffffff',
      pixelRatio: 2.5, // Alta resolución para lectura perfecta en WhatsApp e impresión
      cacheBust: true,
      width: anchoTotal,
      height: alturaTotal,
      style: {
        height: `${alturaTotal}px`,
        maxHeight: 'none',
        overflow: 'visible',
        transform: 'none',
        margin: '0',
        padding: window.getComputedStyle(elemento).padding
      },
      filter: (node: Node) => {
        // Excluir elementos marcados como no exportables
        if (node instanceof HTMLElement && node.classList.contains('no-export-img')) {
          return false;
        }
        return true;
      }
    };

    // Generar imagen con fondo blanco nítido y buena resolución completa
    const dataUrl = await toPng(elemento, opciones);

    const blob = await toBlob(elemento, opciones);

    return {
      success: true,
      mensaje: 'Imagen generada correctamente.',
      dataUrl,
      blob: blob || undefined
    };
  } catch (err) {
    console.error('Error al generar imagen del comprobante:', err);
    return {
      success: false,
      mensaje: 'No fue posible generar la imagen del comprobante: ' + (err as Error).message
    };
  }
}

/**
 * Descarga directamente la imagen generada en el dispositivo
 */
export function descargarImagen(dataUrl: string, nombreArchivo: string = 'Ticket_VariedadesCS.png') {
  const link = document.createElement('a');
  link.download = nombreArchivo;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Intenta compartir la imagen usando la Web Share API (WhatsApp, etc.) o la descarga como respaldo
 */
export async function compartirODescargarImagen(
  elementId: string,
  nombreArchivo: string = 'Comprobante_VariedadesCS.png',
  titulo: string = 'Comprobante VARIEDADES CS'
): Promise<CompartirImagenResult> {
  const resultado = await exportarElementoComoImagen(elementId, nombreArchivo);
  if (!resultado.success || !resultado.dataUrl) {
    return resultado;
  }

  // 1. Intentar Web Share API con archivo (teléfonos móviles y navegadores compatibles)
  if (navigator.canShare && resultado.blob) {
    try {
      const file = new File([resultado.blob], nombreArchivo, { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: titulo,
          text: `${titulo} - VARIEDADES CS Perfumería`
        });
        return {
          success: true,
          mensaje: '¡Comprobante compartido como imagen exitosamente!',
          metodo: 'share'
        };
      }
    } catch (shareErr) {
      // Si el usuario canceló la ventana de compartir, no es un error crítico
      if ((shareErr as Error).name === 'AbortError') {
        return {
          success: true,
          mensaje: 'Compartición cancelada por el usuario.',
          metodo: 'share'
        };
      }
      console.warn('Web Share no disponible o denegado, descargando archivo...', shareErr);
    }
  }

  // 2. Intentar copiar al portapapeles si está soportado
  if (navigator.clipboard && window.ClipboardItem && resultado.blob) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': resultado.blob })
      ]);
    } catch (clipErr) {
      console.warn('No se pudo copiar imagen al portapapeles:', clipErr);
    }
  }

  // 3. Descarga directa del archivo de imagen
  descargarImagen(resultado.dataUrl, nombreArchivo);

  return {
    success: true,
    mensaje: '¡Imagen descargada exitosamente! Lista para enviar por WhatsApp o guardar.',
    metodo: 'download',
    dataUrl: resultado.dataUrl
  };
}
