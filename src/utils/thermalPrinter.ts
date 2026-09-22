// Utilidad para conexión a Maquinita Impresora Térmica (Bluetooth, USB/Serial y Diálogo Directo 58mm/80mm)

export interface PrinterDevice {
  tipo: 'bluetooth' | 'usb' | 'sistema';
  nombre: string;
  conectado: boolean;
}

export class ThermalPrinterService {
  private static bluetoothDevice: any = null;
  private static bluetoothCharacteristic: any = null;

  // Verificar si el navegador soporta Web Bluetooth
  public static soportaBluetooth(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  // Verificar si soporta Web Serial (USB)
  public static soportaSerial(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  // Conectar maquinita por Bluetooth
  public static async conectarBluetooth(): Promise<{ success: boolean; mensaje: string; deviceName?: string }> {
    if (!this.soportaBluetooth()) {
      return {
        success: false,
        mensaje: 'Tu navegador actual no soporta Web Bluetooth directo. Recomendamos usar Google Chrome, Edge o imprimir directamente con el botón de Impresión Térmica.'
      };
    }

    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb', // Servicio de impresión común
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455'
        ]
      });

      this.bluetoothDevice = device;
      return {
        success: true,
        mensaje: `¡Maquinita "${device.name || 'Impresora POS'}" conectada exitosamente!`,
        deviceName: device.name || 'Impresora Bluetooth'
      };
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        return { success: false, mensaje: 'Búsqueda de maquinita cancelada.' };
      }
      return {
        success: false,
        mensaje: `No se pudo conectar a la maquinita: ${error.message || 'Verifique que la impresora esté encendida con Bluetooth activado.'}`
      };
    }
  }

  // Imprimir comando nativo o lanzar ventana térmica garantizando impresión completa ("entera")
  public static imprimirVentanaTermica(elementoId: string = 'ticket-impresion-termica', anchoPapel: '80mm' | '58mm' | 'auto' = 'auto') {
    const elemento = document.getElementById(elementoId);
    if (!elemento) {
      window.print();
      return;
    }

    // Recoger todos los estilos CSS del documento actual (incluyendo Tailwind)
    const estilosDocumento = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('\n');

    // Crear iframe limpio exclusivo para la impresión
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html lang="es">
          <head>
            <meta charset="UTF-8" />
            <title>Factura - VARIEDADES CS</title>
            ${estilosDocumento}
            <style>
              * {
                box-sizing: border-box !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              @page {
                size: ${anchoPapel === '58mm' ? '58mm auto' : anchoPapel === '80mm' ? '80mm auto' : 'auto'};
                margin: 2mm 3mm;
              }
              html, body {
                width: 100% !important;
                min-height: 100% !important;
                margin: 0 !important;
                padding: 4px 6px !important;
                background: #ffffff !important;
                color: #000000 !important;
                font-size: 11px;
                line-height: 1.35;
                overflow: visible !important;
              }
              .flex { display: flex !important; }
              .justify-between { justify-content: space-between !important; }
              .justify-center { justify-content: center !important; }
              .items-center { align-items: center !important; }
              .items-baseline { align-items: baseline !important; }
              .font-bold { font-weight: 700 !important; }
              .font-extrabold { font-weight: 800 !important; }
              .text-center { text-align: center !important; }
              .text-right { text-align: right !important; }
              .text-left { text-align: left !important; }
              .no-print { display: none !important; }
              .page-break-avoid { page-break-inside: avoid !important; break-inside: avoid !important; }
              img { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>
            <div style="width: 100%; max-width: 100%; overflow: visible;">
              ${elemento.outerHTML}
            </div>
          </body>
        </html>
      `);
      doc.close();

      // Esperar a que las imágenes carguen antes de imprimir para no cortar el encabezado
      const imagenes = Array.from(doc.images);
      const esperarImagenes = imagenes.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      });

      Promise.all(esperarImagenes).then(() => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (e) {
            console.error('Error al imprimir:', e);
          } finally {
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            }, 1200);
          }
        }, 250);
      });
    }
  }
}
