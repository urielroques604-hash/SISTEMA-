export interface Producto {
  codigo: string;
  producto: string;
  categoria: string;
  existencia: number;
  precioCompra: number;
  precioVenta: number;
  marca?: string;
  imagen?: string;
  sinImagen?: boolean;
}

export interface ItemCarrito {
  codigo: string;
  producto: string;
  categoria: string;
  cantidad: number;
  precioUnitario: number;
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
  precioUnitario: number;
  total: number;
  formaPago: string;
  cliente?: string;
  idCliente?: string;
  efectivoRecibido?: number;
  cambio?: number;
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
  precioUnitario: number;
  precioCompra?: number;
  total: number;
  proveedor?: string;
  pagadoDesdeCaja?: boolean;
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
  totalCredito: number;
  abonado: number;
  saldo: number;
  vencimiento: string;
  estado: 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'ANULADO';
}

export interface Abono {
  numeroAbono: string;
  fecha: string;
  numeroCredito: string;
  idCliente: string;
  cliente: string;
  montoAbonado: number;
  metodoPago: string;
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
  monto: number;
  usuario: string;
  saldo: number;
}

export interface Usuario {
  usuario: string;
  pass: string;
  rol: string;
}
