// Utilidades para manejo de Córdobas (C$ / NIO) y Dólares ($ / USD)

export const TASA_CAMBIO_DEFAULT = 36.65;
export const LOCAL_STORAGE_TASA_KEY = 'cs_tasa_cambio';

/**
 * Obtiene la tasa de cambio actual desde localStorage o retorna el valor predeterminado
 */
export function obtenerTasaCambio(): number {
  if (typeof window === 'undefined') return TASA_CAMBIO_DEFAULT;
  const guardada = localStorage.getItem(LOCAL_STORAGE_TASA_KEY);
  if (!guardada) return TASA_CAMBIO_DEFAULT;
  const num = parseFloat(guardada);
  return isNaN(num) || num <= 0 ? TASA_CAMBIO_DEFAULT : num;
}

/**
 * Guarda la tasa de cambio en localStorage y emite un evento para actualizar componentes
 */
export function guardarTasaCambio(tasa: number): void {
  if (typeof window === 'undefined') return;
  const tasaSegura = isNaN(tasa) || tasa <= 0 ? TASA_CAMBIO_DEFAULT : Number(tasa.toFixed(4));
  localStorage.setItem(LOCAL_STORAGE_TASA_KEY, String(tasaSegura));
  window.dispatchEvent(new CustomEvent('cs_tasa_cambio_actualizada', { detail: { tasa: tasaSegura } }));
}

/**
 * Convierte un monto en Dólares ($) a Córdobas (C$)
 */
export function aCordobas(montoUSD: number, tasa: number = obtenerTasaCambio()): number {
  if (isNaN(montoUSD) || montoUSD === 0) return 0;
  return Number((montoUSD * tasa).toFixed(2));
}

/**
 * Convierte un monto en Córdobas (C$) a Dólares ($)
 */
export function aDolares(montoCordobas: number, tasa: number = obtenerTasaCambio()): number {
  if (isNaN(montoCordobas) || montoCordobas === 0 || tasa <= 0) return 0;
  return Number((montoCordobas / tasa).toFixed(2));
}

/**
 * Formatea un número en dólares: $10.00
 */
export function formatoUSD(monto: number): string {
  const n = isNaN(monto) ? 0 : monto;
  return `$${n.toFixed(2)}`;
}

/**
 * Formatea un número en córdobas: C$ 366.50
 */
export function formatoNIO(monto: number): string {
  const n = isNaN(monto) ? 0 : monto;
  return `C$ ${n.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Formato Dual: "$10.00 (C$ 366.50)" o "C$ 366.50 ($10.00)"
 */
export function formatoDual(
  montoUSD: number, 
  tasa: number = obtenerTasaCambio(),
  monedaPrincipal: 'USD' | 'NIO' = 'USD'
): string {
  const usd = formatoUSD(montoUSD);
  const nio = formatoNIO(aCordobas(montoUSD, tasa));
  if (monedaPrincipal === 'NIO') {
    return `${nio} (${usd})`;
  }
  return `${usd} (${nio})`;
}

/**
 * Retorna un objeto con ambos valores formateados
 */
export function valoresDuales(montoUSD: number, tasa: number = obtenerTasaCambio()) {
  const cordobas = aCordobas(montoUSD, tasa);
  return {
    usdNumero: montoUSD,
    cordobasNumero: cordobas,
    usdTexto: formatoUSD(montoUSD),
    cordobasTexto: formatoNIO(cordobas),
    tasa
  };
}
