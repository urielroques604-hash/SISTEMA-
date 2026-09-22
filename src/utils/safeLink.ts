/**
 * Abre enlaces externos (como WhatsApp) de forma segura dentro de entornos iframe
 * evitando el uso directo de window.open que puede ser bloqueado por políticas de sandbox.
 */
export function abrirEnlaceSeguro(url: string): void {
  try {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 100);
  } catch (e) {
    console.warn('Error al abrir enlace:', e);
  }
}
