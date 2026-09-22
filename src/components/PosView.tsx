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
  UserCheck,
  User,
  Coins,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Package,
  ImageOff,
  Image as ImageIcon
} from 'lucide-react';
import { Producto, ItemCarrito, Cliente } from '../types';
import { obtenerImagenSugerida } from '../utils/perfumeBrands';

interface PosProps {
  productos: Producto[];
  clientes: Cliente[];
  carrito: ItemCarrito[];
  setCarrito: React.Dispatch<React.SetStateAction<ItemCarrito[]>>;
  modoSinImagenes?: boolean;
  onToggleModoSinImagenes?: () => void;
  onFinalizarVenta: (datosVenta: {
    items: ItemCarrito[];
    formaPago: string;
    descuento: number;
    idCliente?: string;
    nombreCliente?: string;
    efectivoRecibido?: number;
    cambio?: number;
    fechaVencimiento?: string;
  }) => { success: boolean; mensaje: string; numeroVenta?: string };
}

export const PosView: React.FC<PosProps> = ({
  productos,
  clientes,
  carrito,
  setCarrito,
  modoSinImagenes = false,
  onToggleModoSinImagenes,
  onFinalizarVenta
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [formaPago, setFormaPago] = useState('Efectivo');
  const [descuento, setDescuento] = useState(0);
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
    p.categoria.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Agregar al carrito
  const agregarAlCarrito = (prod: Producto) => {
    setAlerta(null);
    if (prod.existencia <= 0) {
      setAlerta({ tipo: 'error', mensaje: `El producto "${prod.producto}" está AGOTADO.` });
      return;
    }

    const itemExistente = carrito.find(item => item.codigo === prod.codigo);
    if (itemExistente) {
      if (itemExistente.cantidad + 1 > prod.existencia) {
        setAlerta({ 
          tipo: 'error', 
          mensaje: `Existencia insuficiente para "${prod.producto}". Stock disponible: ${prod.existencia}` 
        });
        return;
      }
      setCarrito(carrito.map(item => 
        item.codigo === prod.codigo
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      const sinFoto = modoSinImagenes || prod.sinImagen || !prod.imagen;
      setCarrito([...carrito, {
        codigo: prod.codigo,
        producto: prod.producto,
        precioUnitario: prod.precioVenta,
        cantidad: 1,
        categoria: prod.categoria,
        marca: prod.marca,
        imagen: sinFoto ? '' : prod.imagen,
        sinImagen: sinFoto,
        maxStock: prod.existencia
      }]);
    }
  };

  // Modificar cantidad en carrito
  const modificarCantidad = (codigo: string, nuevaCantidad: number) => {
    setAlerta(null);
    const prod = productos.find(p => p.codigo === codigo);
    if (!prod) return;

    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(codigo);
      return;
    }

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
    setDescuento(0);
    setClienteSeleccionado('');
    setEfectivoEntregado('');
  };

  // Totales
  const subtotal = carrito.reduce((acc, item) => acc + (item.precioUnitario * item.cantidad), 0);
  const totalFinal = Math.max(0, subtotal - descuento);
  const totalPrendas = carrito.reduce((acc, item) => acc + item.cantidad, 0);

  // Cambio
  const montoEntregadoNum = Number(efectivoEntregado) || 0;
  const cambio = formaPago === 'Efectivo' && montoEntregadoNum >= totalFinal 
    ? montoEntregadoNum - totalFinal 
    : 0;

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
    if (formaPago === 'Efectivo' && efectivoEntregado !== '' && montoEntregadoNum < totalFinal) {
      setAlerta({ 
        tipo: 'error', 
        mensaje: `El efectivo recibido ($${montoEntregadoNum.toFixed(2)}) es menor al total ($${totalFinal.toFixed(2)}).` 
      });
      return;
    }

    const clienteObj = clientes.find(c => c.id === clienteSeleccionado);

    const resultado = onFinalizarVenta({
      items: carrito,
      formaPago,
      descuento,
      idCliente: clienteSeleccionado || undefined,
      nombreCliente: clienteObj ? clienteObj.nombre : (clienteSeleccionado ? clienteSeleccionado : 'Consumidor Final'),
      efectivoRecibido: formaPago === 'Efectivo' && montoEntregadoNum > 0 ? montoEntregadoNum : totalFinal,
      cambio: formaPago === 'Efectivo' ? cambio : 0,
      fechaVencimiento: formaPago === 'Crédito' ? fechaVencimiento : undefined
    });

    if (resultado.success) {
      setAlerta({ tipo: 'success', mensaje: resultado.mensaje });
      vaciarCarrito();
      setPestanaMovil('catalogo');
    } else {
      setAlerta({ tipo: 'error', mensaje: resultado.mensaje });
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      
      {/* Selector de Pestañas Móvil: Catálogo vs Carrito */}
      <div className="lg:hidden flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={() => setPestanaMovil('catalogo')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
            pestanaMovil === 'catalogo'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Catálogo ({productosFiltrados.length})</span>
        </button>

        <button
          onClick={() => setPestanaMovil('carrito')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition relative ${
            pestanaMovil === 'carrito'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Carrito</span>
          {carrito.length > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              pestanaMovil === 'carrito' ? 'bg-white text-blue-700' : 'bg-amber-500 text-slate-950'
            }`}>
              {totalPrendas} • ${totalFinal.toFixed(2)}
            </span>
          )}
        </button>
      </div>

      {/* Grid Principal Adaptado: En desktop es 2 columnas lado a lado; en móvil se muestra según pestaña activa */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ======================================================== */}
        {/* 1. CATÁLOGO DE PRODUCTOS (Visible en desktop o si pestaña es catalogo) */}
        {/* ======================================================== */}
        <div className={`space-y-4 ${
          pestanaMovil === 'catalogo' ? 'block' : 'hidden lg:block'
        } lg:col-span-7`}>
          
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                id="pos-search-input"
                placeholder="Buscar perfume, crema, bolso, toallas, calzado, ropa, cartera o código..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              />
            </div>
            {onToggleModoSinImagenes && (
              <button
                type="button"
                onClick={onToggleModoSinImagenes}
                title={modoSinImagenes ? "Modo sin fotos activo (Clic para ver fotos)" : "Fotos activas (Clic para ocultar/quitar fotos)"}
                className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                  modoSinImagenes 
                    ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100' 
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {modoSinImagenes ? (
                  <>
                    <ImageOff className="w-4 h-4 text-amber-600" />
                    <span className="hidden sm:inline">Sin Fotos</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 text-slate-500" />
                    <span className="hidden sm:inline">Con Fotos</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Mensaje de alerta */}
          {alerta && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
              alerta.tipo === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {alerta.tipo === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              <span>{alerta.mensaje}</span>
            </div>
          )}

          {/* Cuadrícula de Tarjetas de Productos (Adaptada a teléfono y PC) */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
            {productosFiltrados.map(prod => {
              const esAgotado = prod.existencia <= 0;
              const enCarrito = carrito.find(c => c.codigo === prod.codigo);
              const sinFoto = modoSinImagenes || prod.sinImagen || !prod.imagen;

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
                  {/* Badge de cantidad en carrito si ya fue agregado */}
                  {enCarrito && (
                    <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shadow-xs">
                      {enCarrito.cantidad}
                    </div>
                  )}

                  {/* Imagen del perfume / producto o encabezado en modo sin foto */}
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

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs sm:text-sm font-black text-blue-600">
                        ${prod.precioVenta.toFixed(2)}
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
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
              No se encontraron productos con el filtro "{busqueda}".
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 2. CARRITO Y COBRO (Visible en desktop o si pestaña es carrito) */}
        {/* ======================================================== */}
        <div className={`space-y-4 ${
          pestanaMovil === 'carrito' ? 'block' : 'hidden lg:block'
        } lg:col-span-5`}>
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
            
            {/* Encabezado del Carrito */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                {/* Botón volver a catálogo en teléfono */}
                <button
                  onClick={() => setPestanaMovil('catalogo')}
                  className="lg:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-900 rounded-lg"
                  title="Volver a ver productos"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <Receipt className="w-4 h-4 text-blue-600" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  Carrito ({totalPrendas} productos)
                </h3>
              </div>
              {carrito.length > 0 && (
                <button
                  onClick={vaciarCarrito}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold px-2 py-1 rounded-lg hover:bg-rose-50"
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
                carrito.map(it => (
                  <div key={it.codigo} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2.5">
                    {/* Miniatura del producto en carrito */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                      {!modoSinImagenes && !it.sinImagen && it.imagen ? (
                        <img 
                          src={it.imagen} 
                          alt={it.producto}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Package className="w-4 h-4 text-slate-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h5 className="font-extrabold text-xs text-slate-900 truncate">{it.producto}</h5>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {it.codigo} · ${it.precioUnitario.toFixed(2)} c/u
                      </p>
                    </div>

                    {/* Controles táctiles de cantidad para dedos */}
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

                    <div className="text-right min-w-[55px]">
                      <span className="font-black text-xs text-slate-900">
                        ${(it.cantidad * it.precioUnitario).toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => eliminarDelCarrito(it.codigo)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Resumen numérico */}
            <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({totalPrendas} productos)</span>
                <span className="font-bold text-slate-800">${subtotal.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Descuento ($)</span>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={descuento}
                  onChange={e => setDescuento(Math.max(0, Number(e.target.value) || 0))}
                  className="w-24 text-right px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm">
                <span className="font-black text-slate-900">TOTAL A PAGAR</span>
                <span className="font-black text-blue-600 text-xl">${totalFinal.toFixed(2)}</span>
              </div>
            </div>

            {/* Cliente y Forma de pago */}
            <div className="pt-2 space-y-3">
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
                      className={`py-2.5 px-3 rounded-xl border font-bold transition text-center ${
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

              {/* Opciones cuando es Efectivo (Monto entregado y cambio con botones rápidos) */}
              {formaPago === 'Efectivo' && (
                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-emerald-900 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Cálculo de Cambio / Vuelto</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setEfectivoEntregado(totalFinal.toString())}
                      className="text-[10px] font-black px-2 py-0.5 bg-emerald-200/80 text-emerald-900 rounded-md hover:bg-emerald-300"
                    >
                      Pago Exacto
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-center">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                        Efectivo Recibido ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.50"
                        placeholder={`$${totalFinal.toFixed(2)}`}
                        value={efectivoEntregado}
                        onChange={e => setEfectivoEntregado(e.target.value)}
                        className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                        Cambio a Entregar
                      </label>
                      <div className={`p-2 rounded-lg text-xs font-black border text-center ${
                        montoEntregadoNum >= totalFinal
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300 text-sm'
                          : 'bg-white text-slate-400 border-slate-200'
                      }`}>
                        ${cambio.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Botones de denominaciones rápidas en efectivo */}
                  <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                    {[5, 10, 20, 50, 100].map(den => (
                      <button
                        key={den}
                        type="button"
                        onClick={() => setEfectivoEntregado(den.toString())}
                        className="px-2 py-1 rounded bg-white border border-emerald-300 text-emerald-800 font-bold text-[10px] hover:bg-emerald-100 shrink-0"
                      >
                        ${den}
                      </button>
                    ))}
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

                  {/* MONTO A DEBER PROMINENTE */}
                  <div className="p-3 bg-white border border-rose-200 rounded-xl flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
                        Saldo Pendiente
                      </span>
                      <span className="text-xs font-black text-rose-900 uppercase">
                        CRÉDITO: MONTO A DEBER
                      </span>
                    </div>
                    <div className="text-xl font-black text-rose-600 font-mono">
                      ${totalFinal.toFixed(2)}
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
                    : formaPago === 'Crédito'
                      ? 'bg-rose-600 text-white hover:bg-rose-700 active:scale-[0.99] shadow-rose-600/20'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.99]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {formaPago === 'Crédito'
                    ? `Confirmar Crédito (Monto a Deber: $${totalFinal.toFixed(2)})`
                    : `Confirmar y Cobrar ($${totalFinal.toFixed(2)})`}
                </span>
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* 3. BARRA FLOTANTE DE ACCESO RÁPIDO AL CARRITO EN TELÉFONO */}
      {/* ======================================================== */}
      {pestanaMovil === 'catalogo' && carrito.length > 0 && (
        <div className="lg:hidden fixed bottom-18 left-3 right-3 z-30 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <button
            onClick={() => setPestanaMovil('carrito')}
            className="w-full py-3 px-4 bg-slate-900 text-white rounded-2xl shadow-xl flex items-center justify-between border border-slate-700/80 hover:bg-slate-800"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-pink-500 text-white font-black text-xs flex items-center justify-center">
                {totalPrendas}
              </div>
              <div className="text-left">
                <span className="text-xs font-black block leading-none">Ver Carrito</span>
                <span className="text-[10px] text-slate-300">
                  {carrito.length} {carrito.length === 1 ? 'producto' : 'productos'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-emerald-400">
                ${totalFinal.toFixed(2)}
              </span>
              <ArrowRight className="w-4 h-4 text-slate-300" />
            </div>
          </button>
        </div>
      )}

    </div>
  );
};
