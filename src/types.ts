export interface Producto {
  codigo: string;
  producto: string;
  categoria: string;
  existencia: number;
  precioCompra: number; // en USD
  precioVenta: number; // en USD
  precioCompraCordobas?: number; // en C$
  precioVentaCordobas?: number; // en C$
  marca?: string;
  imagen?: string;
  sinImagen?: boolean;
}

export interface ItemCarrito {
  codigo: string;
  producto: string;
  categoria: string;
  cantidad: number;
  precioUnitario: number; // en USD
  precioUnitarioCordobas?: number; // en C$
  maxStock: number;
  marca?: string;
  imagen?: string;
  sinImagen?: boolean;
}

export interface VentaRegistro {
  numeroVenta: string;
  fecha: string;
  codigo: string;
  producto: string;
  categoria: string;
  cantidad: number;
  precioUnitario: number; // en USD
  precioUnitarioCordobas?: number; // en C$
  total: number; // en USD
  totalCordobas?: number; // en C$
  tasaCambio?: number;
  formaPago: string;
  monedaPago?: 'USD' | 'NIO';
  cliente?: string;
  idCliente?: string;
  efectivoRecibido?: number;
  cambio?: number;
  efectivoRecibidoCordobas?: number;
  cambioCordobas?: number;
  fechaVencimiento?: string;
  numCredito?: string;
  usuario: string;
  estado: 'COMPLETADA' | 'ANULADA';
  fechaAnulacion?: string;
  motivo?: string;
}

export interface CompraRegistro {
  numeroCompra: string;
  fecha: string;
  codigo: string;
  producto: string;
  categoria: string;
  cantidad: number;
  precioUnitario: number; // en USD
  precioUnitarioCordobas?: number; // en C$
  precioCompra?: number;
  precioCompraCordobas?: number; // en C$
  precioVenta?: number;
  precioVentaCordobas?: number; // en C$
  total: number; // en USD
  totalCordobas?: number; // en C$
  tasaCambio?: number;
  monedaRegistro?: 'USD' | 'NIO';
  proveedor?: string;
  pagadoDesdeCaja?: boolean;
  monedaCaja?: 'USD' | 'NIO';
}

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  direccion: string;
  observaciones: string;
}

export interface Proveedor {
  id: string;
  nombre: string;
  telefono: string;
  direccion: string;
  observaciones: string;
}

export interface Credito {
  numeroCredito: string;
  fecha: string;
  idCliente: string;
  cliente: string;
  numeroVenta: string;
  totalCredito: number; // en USD
  totalCreditoCordobas?: number; // en C$
  abonado: number; // en USD
  abonadoCordobas?: number; // en C$
  saldo: number; // en USD
  saldoCordobas?: number; // en C$
  tasaCambio?: number;
  vencimiento: string;
  estado: 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'ANULADO';
}

export interface Abono {
  id?: string;
  numeroAbono: string;
  fecha: string;
  numeroCredito: string;
  idCliente: string;
  cliente: string;
  montoAbonado: number; // en USD
  montoAbonadoCordobas?: number; // en C$
  saldoRestante?: number; // en USD
  saldoRestanteCordobas?: number; // en C$
  tasaCambio?: number;
  metodoPago: string;
  monedaAbono?: 'USD' | 'NIO';
  observaciones: string;
}

export interface CuentaPorCobrar {
  idCliente: string;
  cliente: string;
  totalCreditos: number;
  totalAbonado: number;
  saldoPendiente: number;
  creditosPendientes: number;
  estado: string;
}

export interface MovimientoCaja {
  id: string;
  fecha: string;
  tipo: string;
  concepto: string;
  monto: number; // en USD
  montoCordobas?: number; // en C$
  tasaCambio?: number;
  monedaMovimiento?: 'USD' | 'NIO';
  usuario: string;
  saldo: number; // en USD
  saldoCordobas?: number; // en C$
}

export interface Usuario {
  usuario: string;
  pass: string;
  rol: string;
}
