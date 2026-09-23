// Utilidades para manejo de Córdobas (C$ / NIO) y Dólares ($ / USD)

// Tasas de cambio bancarias de Nicaragua (BCN y principales bancos comerciales)
export const TASA_BANCO_OFICIAL_BCN = 36.6241; // Banco Central de Nicaragua (Fijada en 36.6241 con deslizamiento 0%)
export const TASA_BANCO_COMERCIAL_VENTA = 37.15; // Promedio bancario comercial de venta (BAC 37.15, Banpro 37.14, Lafise 37.18)
export const TASA_BANCO_COMERCIAL_COMPRA = 36.30; // Promedio bancario comercial de compra
export const TASA_BANCO_COMERCIAL_REDONDEO = 37.00; // Tasa comercial sugerida para comercios y boutiques

export const TASA_CAMBIO_DEFAULT = 36.62; // Tasa oficial bancaria del Banco Central de Nicaragua
export const LOCAL_STORAGE_TASA_KEY = 'cs_tasa_cambio';

/**
 * Entidades bancarias de referencia con sus tasas actuales
 */
export const BANCOS_REFERENCIA = [
  {
    id: 'bcn',
    nombre: 'Banco Central de Nicaragua (BCN)',
    etiqueta: 'Oficial BCN',
    tasa: 36.62,
    tasaExacta: 36.6241,
    tipo: 'Oficial del Estado',
    color: 'emerald',
    descripcion: 'Tipo de cambio oficial fijado por el BCN (Deslizamiento 0%).'
  },
  {
    id: 'bac',
    nombre: 'BAC Credomatic Nicaragua',
    etiqueta: 'BAC Venta',
    tasa: 37.15,
    tipo: 'Bancario Comercial',
    color: 'red',
    descripcion: 'Tasa bancaria comercial aplicada por BAC en ventanilla y cobros.'
  },
  {
    id: 'banpro',
    nombre: 'Banpro Grupo Promerica',
    etiqueta: 'Banpro Venta',
    tasa: 37.14,
    tipo: 'Bancario Comercial',
    color: 'blue',
    descripcion: 'Tasa bancaria comercial de venta en ventanilla Banpro.'
  },
  {
    id: 'lafise',
    nombre: 'Banco Lafise Bancentro',
    etiqueta: 'Lafise Venta',
    tasa: 37.18,
    tipo: 'Bancario Comercial',
    color: 'green',
    descripcion: 'Tasa bancaria comercial de venta Lafise Bancentro.'
  },
  {
    id: 'comercial',
    nombre: 'Comercial Estándar',
    etiqueta: 'Comercio C$ 37',
    tasa: 37.00,
    tipo: 'Comercial Puntos de Venta',
    color: 'amber',
    descripcion: 'Redondeo estándar comúnmente usado en comercios de Managua.'
  }
];

/**
 * Obtiene la tasa de cambio actual desde localStorage o retorna el valor bancario oficial
 */
export function obtenerTasaCambio(): number {
  if (typeof window === 'undefined') return TASA_CAMBIO_DEFAULT;
  const guardada = localStorage.getItem(LOCAL_STORAGE_TASA_KEY);
  if (!guardada) return TASA_CAMBIO_DEFAULT;
  const num = parseFloat(guardada);
  
  // Si estaba guardado el valor anterior genérico (36.65), migrar automáticamente al tipo de cambio bancario oficial (36.62)
  if (num === 36.65) {
    localStorage.setItem(LOCAL_STORAGE_TASA_KEY, String(TASA_CAMBIO_DEFAULT));
    return TASA_CAMBIO_DEFAULT;
  }
  
  return isNaN(num) || num <= 0 ? TASA_CAMBIO_DEFAULT : num;
}

/**
 * Guarda la tasa de cambio en localStorage y emite un evento para sincronizar todos los componentes
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
 * Formatea un número en córdobas: C$ 366.20
 */
export function formatoNIO(monto: number): string {
  const n = isNaN(monto) ? 0 : monto;
  return `C$ ${n.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Formato Dual: "$10.00 (C$ 366.20)" o "C$ 366.20 ($10.00)"
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
