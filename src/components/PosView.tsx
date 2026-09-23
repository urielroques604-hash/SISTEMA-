import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  CreditCard, 
  Receipt, 
  User, 
  Coins, 
  ShoppingBag, 
  ArrowRight, 
  ArrowLeft, 
  Package, 
  ImageOff, 
  Image as ImageIcon,
  ArrowRightLeft,
  UserCheck
} from 'lucide-react';
import { Producto, ItemCarrito, Cliente } from '../types';
import { formatoUSD, formatoNIO, aCordobas, aDolares } from '../utils/currency';

interface PosProps {
  productos: Producto[];
  clientes: Cliente[];
  carrito: ItemCarrito[];
  setCarrito: React.Dispatch<React.SetStateAction<ItemCarrito[]>>;
  modoSinImagenes?: boolean;
  onToggleModoSinImagenes?: () => void;
  tasaCambio?: number;
  onAbrirModalTasa?: () => void;
  usuarioActual?: string;
  onCambiarUsuario?: () => void;
  onFinalizarVenta: (datosVenta: {
    items: ItemCarrito[];
    formaPago: string;
    descuento: number;
    idCliente?: string;
    nombreCliente?: string;
    efectivoRecibido?: number;
    cambio?: number;
    efectivoRecibidoCordobas?: number;
    cambioCordobas?: number;
    monedaPago?: 'USD' | 'NIO';
    tasaCambio?: number;
    fechaVencimiento?: string;
    atendidoPor?: string;
  }) => { success: boolean; mensaje: string; numeroVenta?: string };
}

export const PosView: React.FC<PosProps> = ({
  productos,
  clientes,
  carrito,
  setCarrito,
  modoSinImagenes = false,
  onToggleModoSinImagenes,
  tasaCambio = 36.65,
  onAbrirModalTasa,
  usuarioActual = 'JENIFER SANCHEZ',
  onCambiarUsuario,
  onFinalizarVenta
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [formaPago, setFormaPago] = useState('Efectivo');
  const [monedaVenta, setMonedaVenta] = useState<'NIO' | 'USD'>('NIO');
  const [monedaPagoEfectivo, setMonedaPagoEfectivo] = useState<'NIO' | 'USD'>('NIO');
  const [descuentoMoneda, setDescuentoMoneda] = useState<'NIO' | 'USD'>('NIO');
  const [descuentoValor, setDescuentoValor] = useState<number>(0);
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [efectivoEntregado, setEfectivoEntregado] = useState<string>('');
  const [pestanaMovil, setPestanaMovil] = useState<'catalogo' | 'carrito'>('catalogo');
  const [fechaVencimiento, setFechaVencimiento] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [alerta, setAlerta] = useState<{ tipo: 'error' | 'success'; mensaje: string } | null>(null);

  // Filtro de productos
  const productosFiltrados = productos.filter(p => 
    p.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.producto.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.categoria.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.marca && p.marca.toLowerCase().includes(busqueda.toLowerCase()))
  );

  // Totales
  const subtotalUSD = carrito.reduce((acc, item) => acc + (item.precioUnitario * item.cantidad), 0);
  const subtotalNIO = aCordobas(subtotalUSD, tasaCambio);
  const descuentoUSD = descuentoMoneda === 'USD' 
    ? descuentoValor 
    : (tasaCambio > 0 ? (descuentoValor / tasaCambio) : 0);
  const descuentoNIO = descuentoMoneda === 'NIO'
    ? descuentoValor
    : (descuentoValor * tasaCambio);

  const totalFinalUSD = Math.max(0, subtotalUSD - descuentoUSD);
  const totalFinalNIO = aCordobas(totalFinalUSD, tasaCambio);
  const totalPrendas = carrito.reduce((acc, item) => acc + item.cantidad, 0);

  // Agregar al carrito
  const agregarAlCarrito = (prod: Producto) => {
    setAlerta(null);
    if (prod.existencia <= 0) {
      setAlerta({ tipo: 'error', mensaje: `El producto "${prod.producto}" está agotado.` });
      return;
    }

    const itemExistente = carrito.find(item => item.codigo === prod.codigo);
    if (itemExistente) {
      if (itemExistente.cantidad >= prod.existencia) {
        setAlerta({ 
          tipo: 'error', 
          mensaje: `No hay más existencias disponibles de "${prod.producto}" (Stock: ${prod.existencia}).` 
        });
        return;
      }
      setCarrito(carrito.map(item => 
        item.codigo === prod.codigo 
          ? { ...item, cantidad: item.cantidad + 1 } 
          : item
      ));
    } else {
      setCarrito([
        ...carrito,
        {
          codigo: prod.codigo,
          producto: prod.producto,
          categoria: prod.categoria,
          cantidad: 1,
          precioUnitario: prod.precioVenta,
          precioUnitarioCordobas: prod.precioVentaCordobas || (prod.precioVenta * tasaCambio),
          maxStock: prod.existencia,
          marca: prod.marca,
          imagen: prod.imagen,
          sinImagen: prod.sinImagen
        }
      ]);
    }
  };

  // Modificar cantidad en carrito
  const modificarCantidad = (codigo: string, nuevaCantidad: number) => {
    setAlerta(null);
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(codigo);
      return;
    }

    const prod = productos.find(p => p.codigo === codigo);
    if (!prod) return;

    if (nuevaCantidad > prod.existencia) {
      setAlerta({ 
        tipo: 'error', 
        mensaje: `Solo hay ${prod.existencia} unidades disponibles de "${prod.producto}".` 
      });
      return;
    }

    setCarrito(carrito.map(item => 
      item.codigo === codigo 
        ? { ...item, cantidad: nuevaCantidad } 
        : item
    ));
  };

  // Eliminar del carrito
  const eliminarDelCarrito = (codigo: string) => {
    setCarrito(carrito.filter(item => item.codigo !== codigo));
  };

  // Vaciar carrito
  const vaciarCarrito = () => {
    setCarrito([]);
    setDescuentoValor(0);
    setClienteSeleccionado('');
    setEfectivoEntregado('');
  };

  // Cálculos de cambio / vuelto según la moneda en que paga el cliente
  const montoEntregadoNum = Number(efectivoEntregado) || 0;
  
  let cambioUSD = 0;
  let cambioNIO = 0;
  let efectivoRecibidoUSD = 0;
  let efectivoRecibidoNIO = 0;

  if (formaPago === 'Efectivo') {
    if (monedaPagoEfectivo === 'NIO') {
      efectivoRecibidoNIO = montoEntregadoNum;
      efectivoRecibidoUSD = aDolares(montoEntregadoNum, tasaCambio);
      if (montoEntregadoNum >= totalFinalNIO) {
        cambioNIO = montoEntregadoNum - totalFinalNIO;
        cambioUSD = aDolares(cambioNIO, tasaCambio);
      }
    } else {
      efectivoRecibidoUSD = montoEntregadoNum;
      efectivoRecibidoNIO = aCordobas(montoEntregadoNum, tasaCambio);
      if (montoEntregadoNum >= totalFinalUSD) {
        cambioUSD = montoEntregadoNum - totalFinalUSD;
        cambioNIO = aCordobas(cambioUSD, tasaCambio);
      }
    }
  }

  // Procesar Cobro
  const procesarCobro = () => {
    setAlerta(null);

    if (carrito.length === 0) {
      setAlerta({ tipo: 'error', mensaje: 'El carrito está vacío.' });
      return;
    }

    // Validar crédito
    if (formaPago === 'Crédito' && !clienteSeleccionado) {
      setAlerta({ 
        tipo: 'error', 
        mensaje: 'Debe seleccionar un cliente registrado para realizar una venta a Crédito.' 
      });
      return;
    }

    // Validar efectivo
    if (formaPago === 'Efectivo' && efectivoEntregado !== '') {
      if (monedaPagoEfectivo === 'NIO' && montoEntregadoNum < totalFinalNIO) {
        setAlerta({ 
          tipo: 'error', 
          mensaje: `El monto entregado en Córdobas (C$ ${montoEntregadoNum.toFixed(2)}) es menor que el total (C$ ${totalFinalNIO.toFixed(2)}).` 
        });
        return;
      } else if (monedaPagoEfectivo === 'USD' && montoEntregadoNum < totalFinalUSD) {
        setAlerta({ 
          tipo: 'error', 
          mensaje: `El monto entregado en Dólares ($${montoEntregadoNum.toFixed(2)}) es menor que el total ($${totalFinalUSD.toFixed(2)}).` 
        });
        return;
      }
    }

    const clienteObj = clientes.find(c => c.id === clienteSeleccionado);

    const res = onFinalizarVenta({
      items: carrito,
      formaPago,
      descuento: descuentoUSD,
      idCliente: clienteSeleccionado || undefined,
      nombreCliente: clienteObj ? clienteObj.nombre : (clienteSeleccionado ? undefined : 'Consumidor Final'),
      efectivoRecibido: efectivoRecibidoUSD > 0 ? efectivoRecibidoUSD : totalFinalUSD,
      cambio: cambioUSD,
      efectivoRecibidoCordobas: efectivoRecibidoNIO > 0 ? efectivoRecibidoNIO : totalFinalNIO,
      cambioCordobas: cambioNIO,
      monedaPago: formaPago === 'Efectivo' ? monedaPagoEfectivo : monedaVenta,
      tasaCambio,
      fechaVencimiento: formaPago === 'Crédito' ? fechaVencimiento : undefined,
      atendidoPor: usuarioActual
    });

    if (res.success) {
      setAlerta({ tipo: 'success', mensaje: res.mensaje });
      vaciarCarrito();
      setPestanaMovil('catalogo');
    } else {
      setAlerta({ tipo: 'error', mensaje: res.mensaje });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Barra de Tasa y Navegación Móvil */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-slate-900 to-slate-800 p-2.5 sm:p-3 rounded-2xl text-white shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-black block leading-tight">Precios en Dólar ($) y Córdoba (C$)</span>
            <span className="text-[10px] text-slate-300">Tasa Oficial: 1 $ USD = C$ {tasaCambio.toFixed(2)} NIO</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Badge Atendido por en POS */}
          <button
            type="button"
            onClick={onCambiarUsuario}
            title="Cambiar personal que atiende"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/30 text-xs font-bold transition cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline text-[11px] text-slate-300">Atendido por:</span>
            <span className="text-white font-extrabold">{usuarioActual}</span>
          </button>

          {onAbrirModalTasa && (
            <button
              onClick={onAbrirModalTasa}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-300 text-xs font-bold transition flex items-center gap-1 border border-white/15"
              title="Cambiar Tasa de Cambio"
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span className="hidden sm:inline">Cambiar Tasa</span>
            </button>
          )}

          {/* Selector de pestañas para móviles */}
          <div className="flex lg:hidden bg-slate-800 p-0.5 rounded-xl border border-slate-700">
            <button
              onClick={() => setPestanaMovil('catalogo')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                pestanaMovil === 'catalogo' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              Catálogo ({productosFiltrados.length})
            </button>
            <button
              onClick={() => setPestanaMovil('carrito')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition relative ${
                pestanaMovil === 'carrito' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              Carrito ({totalPrendas})
              {totalPrendas > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-emerald-400 text-slate-900 rounded-full text-[10px] font-black">
                  {formatoUSD(totalFinalUSD)}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* COLUMNA CATÁLOGO DE PRODUCTOS (7 cols) */}
        <div className={`lg:col-span-7 space-y-3 sm:space-y-4 ${pestanaMovil === 'carrito' ? 'hidden lg:block' : 'block'}`}>
          {/* Barra de búsqueda */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, código, marca, categoría..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
            <span className="text-xs text-slate-500 font-bold whitespace-nowrap hidden sm:inline">
              {productosFiltrados.length} artículos
            </span>
          </div>

          {/* Mensajes de alerta */}
          {alerta && (
            <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in ${
              alerta.tipo === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {alerta.tipo === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              <span>{alerta.mensaje}</span>
            </div>
          )}

          {/* Cuadrícula de Tarjetas de Productos */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
            {productosFiltrados.map(prod => {
              const esAgotado = prod.existencia <= 0;
              const enCarrito = carrito.find(c => c.codigo === prod.codigo);
              const sinFoto = modoSinImagenes || prod.sinImagen || !prod.imagen;
              const pVentaNIO = prod.precioVentaCordobas || (prod.precioVenta * tasaCambio);

              return (
                <div
                  key={prod.codigo}
                  className={`p-3 rounded-2xl border transition-all flex flex-col justify-between relative select-none ${
                    esAgotado
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : enCarrito 
                        ? 'bg-blue-50/40 border-blue-300 shadow-2xs' 
                        : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-xs active:scale-[0.98]'
                  }`}
                  onClick={() => !esAgotado && agregarAlCarrito(prod)}
                >
                  {/* Badge de cantidad en carrito */}
                  {enCarrito && (
                    <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shadow-xs">
                      {enCarrito.cantidad}
                    </div>
                  )}

                  {/* Foto o encabezado */}
                  {sinFoto ? (
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono truncate">
                        {prod.codigo}
                      </span>
                      {prod.marca ? (
                        <span className="bg-pink-100 text-pink-800 text-[9px] font-bold px-1.5 py-0.5 rounded-md truncate max-w-[110px]">
                          {prod.marca}
                        </span>
                      ) : (
                        <Package className="w-3.5 h-3.5 text-slate-300" />
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-24 mb-2 rounded-xl overflow-hidden bg-pink-50/40 border border-slate-100 flex items-center justify-center relative">
                      <img 
                        src={prod.imagen} 
                        alt={prod.producto}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      {prod.marca && (
                        <span className="absolute bottom-1 left-1 bg-black/75 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                          {prod.marca}
                        </span>
                      )}
                    </div>
                  )}

                  <div>
                    {!sinFoto && (
                      <div className="flex items-center gap-1 mb-1 pr-6">
                        <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono truncate">
                          {prod.codigo}
                        </span>
                      </div>
                    )}
                    <h4 className="font-extrabold text-xs text-slate-900 line-clamp-2 leading-snug">
                      {prod.producto}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{prod.categoria}</p>
                  </div>

                  {/* PRECIOS EN DÓLAR Y CÓRDOBA */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs sm:text-sm font-black text-blue-600 block leading-tight">
                        {formatoUSD(prod.precioVenta)}
                      </span>
                      <span className="text-[10px] font-black text-emerald-700 block">
                        {formatoNIO(pVentaNIO)}
                      </span>
                      <span className="block text-[9px] text-slate-400">
                        Stock: {prod.existencia}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={esAgotado}
                      className={`w-8 h-8 rounded-xl text-xs font-bold flex items-center justify-center transition shadow-2xs ${
                        esAgotado 
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                          : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {productosFiltrados.length === 0 && (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              No se encontraron productos coincidentes con "{busqueda}".
            </div>
          )}
        </div>

        {/* COLUMNA CARRITO Y COBRO (5 cols) */}
        <div className={`lg:col-span-5 ${pestanaMovil === 'catalogo' ? 'hidden lg:block' : 'block'}`}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4 sticky top-4">
            {/* Encabezado del carrito */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                <h3 className="font-extrabold text-sm text-slate-800">Canasta de Venta</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {totalPrendas} items
                </span>
              </div>
              {carrito.length > 0 && (
                <button
                  type="button"
                  onClick={vaciarCarrito}
                  className="text-xs text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1 hover:underline"
                >
                  Vaciar
                </button>
              )}
            </div>

            {/* Lista de items en el carrito */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {carrito.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                  <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                  <p className="font-medium">El carrito está vacío.</p>
                  <button
                    onClick={() => setPestanaMovil('catalogo')}
                    className="lg:hidden px-3 py-1.5 bg-blue-600 text-white font-bold rounded-xl text-xs"
                  >
                    Seleccionar productos del catálogo
                  </button>
                </div>
              ) : (
                carrito.map(it => {
                  const unitNIO = it.precioUnitarioCordobas || (it.precioUnitario * tasaCambio);
                  const totLineUSD = it.cantidad * it.precioUnitario;
                  const totLineNIO = it.cantidad * unitNIO;

                  return (
                    <div key={it.codigo} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2.5">
                      <div className="min-w-0 flex-1">
                        <h5 className="font-extrabold text-xs text-slate-900 truncate">{it.producto}</h5>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span className="font-mono">{it.codigo}</span>
                          <span>·</span>
                          <span className="font-bold text-slate-700">{formatoUSD(it.precioUnitario)}</span>
                          <span>/</span>
                          <span className="text-emerald-700 font-bold">{formatoNIO(unitNIO)}</span>
                        </div>
                      </div>

                      {/* Controles táctiles de cantidad */}
                      <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                        <button
                          onClick={() => modificarCantidad(it.codigo, it.cantidad - 1)}
                          className="w-7 h-7 rounded-md text-slate-700 flex items-center justify-center hover:bg-slate-100 active:bg-slate-200"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-black text-xs text-slate-900">
                          {it.cantidad}
                        </span>
                        <button
                          onClick={() => modificarCantidad(it.codigo, it.cantidad + 1)}
                          className="w-7 h-7 rounded-md text-slate-700 flex items-center justify-center hover:bg-slate-100 active:bg-slate-200"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right min-w-[70px]">
                        <span className="font-black text-xs text-slate-900 block">
                          {formatoUSD(totLineUSD)}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 block">
                          {formatoNIO(totLineNIO)}
                        </span>
                      </div>

                      <button
                        onClick={() => eliminarDelCarrito(it.codigo)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* SELECTOR DE MONEDA DE LA VENTA */}
            <div className="pt-2">
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                Moneda de Cobro / Registro:
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setMonedaVenta('NIO');
                    setMonedaPagoEfectivo('NIO');
                    if (efectivoEntregado) {
                      setEfectivoEntregado(totalFinalNIO.toFixed(2));
                    }
                  }}
                  className={`py-1.5 px-2 rounded-lg font-black text-xs flex items-center justify-center gap-1 transition ${
                    monedaVenta === 'NIO'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 bg-white/60'
                  }`}
                >
                  <span>C$ Córdobas (NIO)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMonedaVenta('USD');
                    setMonedaPagoEfectivo('USD');
                    if (efectivoEntregado) {
                      setEfectivoEntregado(totalFinalUSD.toFixed(2));
                    }
                  }}
                  className={`py-1.5 px-2 rounded-lg font-black text-xs flex items-center justify-center gap-1 transition ${
                    monedaVenta === 'USD'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 bg-white/60'
                  }`}
                >
                  <span>$ Dólares (USD)</span>
                </button>
              </div>
            </div>

            {/* Resumen numérico Dual Currency */}
            <div className="pt-2 border-t border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({totalPrendas} productos)</span>
                <div className="text-right">
                  <span className="font-bold text-slate-800">
                    {monedaVenta === 'NIO' ? formatoNIO(subtotalNIO) : formatoUSD(subtotalUSD)}
                  </span>
                  <span className="text-slate-400 ml-1 text-[11px]">
                    / {monedaVenta === 'NIO' ? formatoUSD(subtotalUSD) : formatoNIO(subtotalNIO)}
                  </span>
                </div>
              </div>

              {/* Descuento con selector de moneda */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600 font-medium">Descuento</span>
                <div className="flex items-center gap-1.5">
                  <div className="flex bg-slate-200 rounded-lg p-0.5 border border-slate-300">
                    <button
                      type="button"
                      onClick={() => setDescuentoMoneda('NIO')}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-black transition ${
                        descuentoMoneda === 'NIO' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      C$
                    </button>
                    <button
                      type="button"
                      onClick={() => setDescuentoMoneda('USD')}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-black transition ${
                        descuentoMoneda === 'USD' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      $
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step={descuentoMoneda === 'NIO' ? '5' : '0.50'}
                    value={descuentoValor || ''}
                    onChange={e => setDescuentoValor(Math.max(0, Number(e.target.value) || 0))}
                    placeholder="0"
                    className="w-20 text-right px-2 py-1 rounded-lg border border-slate-200 text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              {/* TOTAL A PAGAR PROMINENTE EN AMBAS MONEDAS */}
              <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xs space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-extrabold uppercase text-slate-300">TOTAL A PAGAR:</span>
                  <div className="text-right">
                    {monedaVenta === 'NIO' ? (
                      <>
                        <span className="font-black text-xl text-emerald-400 block">{formatoNIO(totalFinalNIO)}</span>
                        <span className="text-xs font-bold text-slate-300">= {formatoUSD(totalFinalUSD)}</span>
                      </>
                    ) : (
                      <>
                        <span className="font-black text-xl text-emerald-400 block">{formatoUSD(totalFinalUSD)}</span>
                        <span className="text-sm font-extrabold text-amber-300">= {formatoNIO(totalFinalNIO)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Cliente y Forma de pago */}
            <div className="pt-1 space-y-3">
              {/* Selector de Cliente */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Cliente {formaPago === 'Crédito' ? '*' : '(Opcional)'}</span>
                  </label>
                  {clienteSeleccionado && (
                    <button
                      type="button"
                      onClick={() => setClienteSeleccionado('')}
                      className="text-[10px] text-blue-600 hover:underline font-bold"
                    >
                      Consumidor Final
                    </button>
                  )}
                </div>
                <select
                  value={clienteSeleccionado}
                  onChange={e => setClienteSeleccionado(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Consumidor Final / Venta Rápida</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.id}) {c.telefono ? `- Tel: ${c.telefono}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botones de Selección de Forma de Pago */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                  Forma de Pago
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['Efectivo', 'Tarjeta', 'Transferencia', 'Crédito'].map(fp => (
                    <button
                      key={fp}
                      type="button"
                      onClick={() => setFormaPago(fp)}
                      className={`py-2 px-3 rounded-xl border font-bold transition text-center ${
                        formaPago === fp
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {fp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Opciones cuando es Efectivo con Conmutador Córdobas / Dólares */}
              {formaPago === 'Efectivo' && (
                <div className="p-3.5 bg-emerald-50/90 border border-emerald-300 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center justify-between text-emerald-950 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-emerald-700" />
                      <span>Cobro en Efectivo</span>
                    </span>

                    {/* Selector de Moneda de Cobro */}
                    <div className="flex bg-white rounded-lg p-0.5 border border-emerald-300">
                      <button
                        type="button"
                        onClick={() => {
                          setMonedaPagoEfectivo('NIO');
                          setEfectivoEntregado(totalFinalNIO.toFixed(2));
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-black transition ${
                          monedaPagoEfectivo === 'NIO' 
                            ? 'bg-emerald-600 text-white shadow-2xs' 
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Córdobas (C$)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMonedaPagoEfectivo('USD');
                          setEfectivoEntregado(totalFinalUSD.toFixed(2));
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-black transition ${
                          monedaPagoEfectivo === 'USD' 
                            ? 'bg-emerald-600 text-white shadow-2xs' 
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Dólares ($)
                      </button>
                    </div>
                  </div>

                  {/* Detalle del Monto a Pagar en la moneda seleccionada */}
                  <div className="flex items-center justify-between bg-white/80 p-2 rounded-lg border border-emerald-200">
                    <span className="text-[11px] font-bold text-slate-700">Monto Requerido:</span>
                    <span className="text-sm font-black text-emerald-800">
                      {monedaPagoEfectivo === 'NIO' ? formatoNIO(totalFinalNIO) : formatoUSD(totalFinalUSD)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-center">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                        Recibido ({monedaPagoEfectivo === 'NIO' ? 'C$ Córdobas' : '$ USD'})
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                          {monedaPagoEfectivo === 'NIO' ? 'C$' : '$'}
                        </span>
                        <input
                          type="number"
                          min="0"
                          step={monedaPagoEfectivo === 'NIO' ? '10' : '1'}
                          placeholder={monedaPagoEfectivo === 'NIO' ? totalFinalNIO.toFixed(2) : totalFinalUSD.toFixed(2)}
                          value={efectivoEntregado}
                          onChange={e => setEfectivoEntregado(e.target.value)}
                          className="w-full pl-8 pr-2 py-2 bg-white border border-emerald-300 rounded-lg text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                        Cambio / Vuelto
                      </label>
                      <div className={`p-2 rounded-lg text-xs font-black border text-center ${
                        (monedaPagoEfectivo === 'NIO' ? montoEntregadoNum >= totalFinalNIO : montoEntregadoNum >= totalFinalUSD)
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-white text-slate-400 border-slate-200'
                      }`}>
                        <span className="block text-sm">
                          {monedaPagoEfectivo === 'NIO' ? formatoNIO(cambioNIO) : formatoUSD(cambioUSD)}
                        </span>
                        <span className="block text-[9px] text-slate-500 font-semibold">
                          = {monedaPagoEfectivo === 'NIO' ? formatoUSD(cambioUSD) : formatoNIO(cambioNIO)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botones de denominaciones rápidas */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-slate-500">Billetes Rápidos:</span>
                      <button
                        type="button"
                        onClick={() => setEfectivoEntregado(monedaPagoEfectivo === 'NIO' ? totalFinalNIO.toString() : totalFinalUSD.toString())}
                        className="text-[10px] font-black text-emerald-800 underline"
                      >
                        Pago Exacto
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                      {monedaPagoEfectivo === 'NIO' ? (
                        [50, 100, 200, 500, 1000, 2000].map(den => (
                          <button
                            key={den}
                            type="button"
                            onClick={() => setEfectivoEntregado(den.toString())}
                            className="px-2 py-1 rounded-md bg-white border border-emerald-300 text-emerald-900 font-black text-[10px] hover:bg-emerald-100 shrink-0 shadow-2xs"
                          >
                            C$ {den}
                          </button>
                        ))
                      ) : (
                        [5, 10, 20, 50, 100].map(den => (
                          <button
                            key={den}
                            type="button"
                            onClick={() => setEfectivoEntregado(den.toString())}
                            className="px-2.5 py-1 rounded-md bg-white border border-emerald-300 text-emerald-900 font-black text-[10px] hover:bg-emerald-100 shrink-0 shadow-2xs"
                          >
                            ${den}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Opciones cuando es Tarjeta o Transferencia */}
              {(formaPago === 'Tarjeta' || formaPago === 'Transferencia') && (
                <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between text-blue-950 font-bold">
                    <span>Cobro por {formaPago}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-200 text-blue-900">
                      {monedaVenta === 'NIO' ? 'En Córdobas (C$)' : 'En Dólares ($)'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white border border-blue-100 rounded-lg flex items-center justify-between">
                    <span className="text-slate-600 font-semibold text-[11px]">Monto a cobrar al cliente:</span>
                    <div className="text-right">
                      <span className="text-base font-black text-blue-700 block">
                        {monedaVenta === 'NIO' ? formatoNIO(totalFinalNIO) : formatoUSD(totalFinalUSD)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold block">
                        = {monedaVenta === 'NIO' ? formatoUSD(totalFinalUSD) : formatoNIO(totalFinalNIO)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Opciones cuando es crédito */}
              {formaPago === 'Crédito' && (
                <div className="p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-rose-950 font-black">
                    <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <CreditCard className="w-4 h-4 text-rose-600" />
                      <span>Venta a Crédito</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-200/90 text-rose-900 text-[10px] font-black uppercase">
                      Por Cobrar
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-rose-200 rounded-xl flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
                        Saldo Pendiente
                      </span>
                      <span className="text-xs font-black text-rose-900 uppercase">
                        CRÉDITO: MONTO A DEBER
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-rose-600 font-mono block">
                        {formatoUSD(totalFinalUSD)}
                      </span>
                      <span className="text-xs font-bold text-slate-600 block">
                        {formatoNIO(totalFinalNIO)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      Fecha Límite de Pago *
                    </label>
                    <input
                      type="date"
                      value={fechaVencimiento}
                      onChange={e => setFechaVencimiento(e.target.value)}
                      className="w-full p-2 bg-white border border-rose-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                  </div>

                  {!clienteSeleccionado && (
                    <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1.5 bg-white p-2 rounded-lg border border-rose-200">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>Seleccione un cliente arriba para autorizar la deuda a crédito.</span>
                    </p>
                  )}
                </div>
              )}

              {/* Botón Cobrar */}
              <button
                id="btn-pos-cobrar"
                onClick={procesarCobro}
                disabled={carrito.length === 0}
                className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-sm ${
                  carrito.length === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-[0.99]'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Cobrar {formatoUSD(totalFinalUSD)} / {formatoNIO(totalFinalNIO)}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
