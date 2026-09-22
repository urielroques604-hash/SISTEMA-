import React, { useState, useEffect } from 'react';
import { 
  ShoppingBasket, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Coins, 
  ArrowRightLeft, 
  Search, 
  TrendingUp, 
  Package, 
  Wallet,
  Building2
} from 'lucide-react';
import { Producto, Proveedor, CompraRegistro } from '../types';
import { formatoUSD, formatoNIO, aCordobas, aDolares } from '../utils/currency';

interface ComprasProps {
  productos: Producto[];
  proveedores: Proveedor[];
  compras: CompraRegistro[];
  tasaCambio: number;
  onAbrirModalTasa?: () => void;
  onRegistrarCompra: (datos: {
    codigo: string;
    producto: string;
    categoria: string;
    cantidad: number;
    precioCompra: number;
    precioCompraCordobas?: number;
    precioVenta: number;
    precioVentaCordobas?: number;
    proveedor: string;
    pagarDesdeCaja: boolean;
    monedaCaja?: 'USD' | 'NIO';
    tasaCambio?: number;
  }) => { success: boolean; mensaje: string };
}

export const ComprasView: React.FC<ComprasProps> = ({
  productos,
  proveedores,
  compras,
  tasaCambio,
  onAbrirModalTasa,
  onRegistrarCompra
}) => {
  const [codigo, setCodigo] = useState('');
  const [producto, setProducto] = useState('');
  const [categoria, setCategoria] = useState('General');
  const [cantidad, setCantidad] = useState(10);
  
  // Precios en ambas monedas con sincronización bidireccional
  const [monedaRegistroCompra, setMonedaRegistroCompra] = useState<'NIO' | 'USD'>('NIO');
  const [precioCompraUSD, setPrecioCompraUSD] = useState<string>('5.00');
  const [precioCompraNIO, setPrecioCompraNIO] = useState<string>(() => (5.00 * tasaCambio).toFixed(2));
  
  const [precioVentaUSD, setPrecioVentaUSD] = useState<string>('10.00');
  const [precioVentaNIO, setPrecioVentaNIO] = useState<string>(() => (10.00 * tasaCambio).toFixed(2));

  const [proveedor, setProveedor] = useState('');
  const [pagarDesdeCaja, setPagarDesdeCaja] = useState(true);
  const [monedaCaja, setMonedaCaja] = useState<'USD' | 'NIO'>('USD');
  const [mensaje, setMensaje] = useState<{ tipo: 'error' | 'success'; texto: string } | null>(null);
  const [busquedaHistorial, setBusquedaHistorial] = useState('');

  // Actualizar córdobas cuando cambia la tasa si el usuario no los está editando
  useEffect(() => {
    const pCompUSD = parseFloat(precioCompraUSD);
    if (!isNaN(pCompUSD) && pCompUSD > 0) {
      setPrecioCompraNIO((pCompUSD * tasaCambio).toFixed(2));
    }
    const pVentUSD = parseFloat(precioVentaUSD);
    if (!isNaN(pVentUSD) && pVentUSD > 0) {
      setPrecioVentaNIO((pVentUSD * tasaCambio).toFixed(2));
    }
  }, [tasaCambio]);

  // Manejadores sincronizados de Precio de Compra
  const handleCompraUSDChange = (valStr: string) => {
    setPrecioCompraUSD(valStr);
    const val = parseFloat(valStr);
    if (!isNaN(val) && val >= 0) {
      setPrecioCompraNIO((val * tasaCambio).toFixed(2));
    } else {
      setPrecioCompraNIO('');
    }
  };

  const handleCompraNIOChange = (valStr: string) => {
    setPrecioCompraNIO(valStr);
    const val = parseFloat(valStr);
    if (!isNaN(val) && val >= 0 && tasaCambio > 0) {
      setPrecioCompraUSD((val / tasaCambio).toFixed(2));
    } else {
      setPrecioCompraUSD('');
    }
  };

  // Manejadores sincronizados de Precio de Venta
  const handleVentaUSDChange = (valStr: string) => {
    setPrecioVentaUSD(valStr);
    const val = parseFloat(valStr);
    if (!isNaN(val) && val >= 0) {
      setPrecioVentaNIO((val * tasaCambio).toFixed(2));
    } else {
      setPrecioVentaNIO('');
    }
  };

  const handleVentaNIOChange = (valStr: string) => {
    setPrecioVentaNIO(valStr);
    const val = parseFloat(valStr);
    if (!isNaN(val) && val >= 0 && tasaCambio > 0) {
      setPrecioVentaUSD((val / tasaCambio).toFixed(2));
    } else {
      setPrecioVentaUSD('');
    }
  };

  // Al seleccionar código si existe en inventario
  const seleccionarProductoExistente = (cod: string) => {
    setCodigo(cod);
    const encontrado = productos.find(p => p.codigo.toLowerCase().trim() === cod.toLowerCase().trim());
    if (encontrado) {
      setProducto(encontrado.producto);
      setCategoria(encontrado.categoria);
      
      const compUSD = encontrado.precioCompra;
      setPrecioCompraUSD(compUSD.toFixed(2));
      const compNIO = encontrado.precioCompraCordobas || (compUSD * tasaCambio);
      setPrecioCompraNIO(compNIO.toFixed(2));

      const ventUSD = encontrado.precioVenta;
      setPrecioVentaUSD(ventUSD.toFixed(2));
      const ventNIO = encontrado.precioVentaCordobas || (ventUSD * tasaCambio);
      setPrecioVentaNIO(ventNIO.toFixed(2));
    }
  };

  // Cálculos de totales
  const pCompUSDNum = parseFloat(precioCompraUSD) || 0;
  const pCompNIONum = parseFloat(precioCompraNIO) || (pCompUSDNum * tasaCambio);
  const pVentUSDNum = parseFloat(precioVentaUSD) || 0;
  const pVentNIONum = parseFloat(precioVentaNIO) || (pVentUSDNum * tasaCambio);

  const cantNum = Math.max(1, Number(cantidad) || 0);
  const totalCompraUSD = cantNum * pCompUSDNum;
  const totalCompraNIO = cantNum * pCompNIONum;

  const margenUSD = pVentUSDNum - pCompUSDNum;
  const margenNIO = pVentNIONum - pCompNIONum;

  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);

    if (!codigo.trim() || !producto.trim()) {
      setMensaje({ tipo: 'error', texto: 'Código y producto son obligatorios.' });
      return;
    }

    if (cantNum <= 0 || pCompUSDNum <= 0) {
      setMensaje({ tipo: 'error', texto: 'Cantidad y precio de compra deben ser mayores a 0.' });
      return;
    }

    const res = onRegistrarCompra({
      codigo: codigo.trim().toUpperCase(),
      producto: producto.trim(),
      categoria: categoria.trim() || 'General',
      cantidad: cantNum,
      precioCompra: pCompUSDNum,
      precioCompraCordobas: pCompNIONum,
      precioVenta: pVentUSDNum,
      precioVentaCordobas: pVentNIONum,
      proveedor: proveedor.trim(),
      pagarDesdeCaja,
      monedaCaja,
      tasaCambio
    });

    if (res.success) {
      setMensaje({ tipo: 'success', texto: res.mensaje });
      setCodigo('');
      setProducto('');
      setCantidad(10);
      setPrecioCompraUSD('5.00');
      setPrecioCompraNIO((5.00 * tasaCambio).toFixed(2));
      setPrecioVentaUSD('10.00');
      setPrecioVentaNIO((10.00 * tasaCambio).toFixed(2));
    } else {
      setMensaje({ tipo: 'error', texto: res.mensaje });
    }
  };

  // Filtro de historial de compras
  const comprasFiltradas = compras.filter(c => 
    c.numeroCompra.toLowerCase().includes(busquedaHistorial.toLowerCase()) ||
    c.producto.toLowerCase().includes(busquedaHistorial.toLowerCase()) ||
    c.codigo.toLowerCase().includes(busquedaHistorial.toLowerCase()) ||
    (c.proveedor && c.proveedor.toLowerCase().includes(busquedaHistorial.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Banner de Tasa de Cambio */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-3.5 rounded-xl text-white shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-xs shrink-0">
            <Coins className="w-5 h-5 text-emerald-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-wide">Registro de Compras Multimoneda</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white text-emerald-800">
                Dólar ($) y Córdoba (C$)
              </span>
            </div>
            <p className="text-[11px] text-emerald-100">
              Ingresa precios en cualquiera de las dos monedas y el sistema convertirá automáticamente.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg border border-white/20">
          <div className="text-right">
            <span className="text-[10px] text-emerald-200 block uppercase font-bold">Tasa de Cambio:</span>
            <span className="font-mono font-black text-sm text-white">1 $ USD = C$ {tasaCambio.toFixed(2)}</span>
          </div>
          {onAbrirModalTasa && (
            <button
              onClick={onAbrirModalTasa}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs rounded-md shadow-xs transition cursor-pointer"
              title="Cambiar la tasa de cambio oficial"
            >
              Modificar Tasa
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulario Nueva Compra (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <ShoppingBasket className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-800">Registrar Entrada de Mercadería</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Dólar ($) y Córdobas (C$)
            </span>
          </div>

          {mensaje && (
            <div className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
              mensaje.tipo === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {mensaje.tipo === 'error' ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
              <span>{mensaje.texto}</span>
            </div>
          )}

          <form onSubmit={guardar} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Proveedor</span>
              </label>
              <select
                value={proveedor}
                onChange={e => setProveedor(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded text-xs bg-white outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                <option value="">-- Seleccionar Proveedor (Opcional) --</option>
                {proveedores.map(prov => (
                  <option key={prov.id} value={prov.nombre}>{prov.nombre} ({prov.id})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Código *</label>
                <input
                  type="text"
                  required
                  value={codigo}
                  onChange={e => seleccionarProductoExistente(e.target.value.toUpperCase())}
                  placeholder="Ej: P001"
                  className="w-full p-2 border border-slate-200 rounded font-mono uppercase outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Categoría</label>
                <input
                  type="text"
                  value={categoria}
                  onChange={e => setCategoria(e.target.value)}
                  placeholder="Perfumes, Cremas, Bolsos..."
                  className="w-full p-2 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nombre del Producto / Artículo *</label>
              <input
                type="text"
                required
                value={producto}
                onChange={e => setProducto(e.target.value)}
                placeholder="Nombre descriptivo de la mercadería"
                className="w-full p-2 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>

            {/* Cantidad */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Cantidad a Ingresar al Stock *
              </label>
              <input
                type="number"
                min="1"
                required
                value={cantidad}
                onChange={e => setCantidad(Number(e.target.value) || 0)}
                className="w-full p-2 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-blue-500 font-bold text-slate-900"
              />
            </div>

            {/* SELECTOR DE MONEDA DE REGISTRO DE COMPRA */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Moneda para Fijar Costo y Precios de la Compra:
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setMonedaRegistroCompra('NIO');
                    setMonedaCaja('NIO');
                  }}
                  className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                    monedaRegistroCompra === 'NIO'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 bg-white/50'
                  }`}
                >
                  <span>C$ Córdobas (NIO)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMonedaRegistroCompra('USD');
                    setMonedaCaja('USD');
                  }}
                  className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                    monedaRegistroCompra === 'USD'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 bg-white/50'
                  }`}
                >
                  <span>$ Dólares (USD)</span>
                </button>
              </div>
            </div>

            {/* PRECIO DE COMPRA (COSTO) EN DÓLAR Y CÓRDOBA */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                  <span>Precio de Compra (Costo Unitario) *</span>
                </span>
                <span className="text-[10px] text-blue-700 bg-white px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-1 font-semibold">
                  <ArrowRightLeft className="w-3 h-3 text-blue-600" />
                  Sincronizado
                </span>
              </div>

              {monedaRegistroCompra === 'NIO' ? (
                <div className="space-y-1.5">
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-800 mb-0.5">
                      En Córdobas (C$ NIO) - Principal
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-black text-emerald-600 text-xs">C$</span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.50"
                        required
                        value={precioCompraNIO}
                        onChange={e => handleCompraNIOChange(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-8 pr-2 py-2 bg-white border-2 border-emerald-500 rounded-lg font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-400 text-sm shadow-2xs"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs">
                    <span className="text-[11px] text-slate-500">Equivalente en Dólares ($):</span>
                    <div className="flex items-center gap-1 font-bold text-slate-800">
                      <span>$</span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={precioCompraUSD}
                        onChange={e => handleCompraUSDChange(e.target.value)}
                        className="w-20 text-right p-0.5 font-bold outline-none text-blue-700 bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div>
                    <label className="block text-[11px] font-bold text-blue-800 mb-0.5">
                      En Dólares ($ USD) - Principal
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-black text-blue-600 text-xs">$</span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        value={precioCompraUSD}
                        onChange={e => handleCompraUSDChange(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-7 pr-2 py-2 bg-white border-2 border-blue-500 rounded-lg font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-400 text-sm shadow-2xs"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs">
                    <span className="text-[11px] text-slate-500">Equivalente en Córdobas (C$):</span>
                    <div className="flex items-center gap-1 font-bold text-slate-800">
                      <span>C$</span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.50"
                        value={precioCompraNIO}
                        onChange={e => handleCompraNIOChange(e.target.value)}
                        className="w-24 text-right p-0.5 font-bold outline-none text-emerald-700 bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PRECIO DE VENTA EN DÓLAR Y CÓRDOBA */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900 text-xs flex items-center gap-1">
                  <span>Precio de Venta al Público *</span>
                </span>
                <span className="text-[10px] text-emerald-800 bg-white px-1.5 py-0.5 rounded border border-emerald-300 font-semibold">
                  Ganancia: {formatoUSD(margenUSD)} / {formatoNIO(margenNIO)}
                </span>
              </div>

              {monedaRegistroCompra === 'NIO' ? (
                <div className="space-y-1.5">
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-800 mb-0.5">
                      En Córdobas (C$ NIO) - Principal
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-black text-emerald-600 text-xs">C$</span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.50"
                        required
                        value={precioVentaNIO}
                        onChange={e => handleVentaNIOChange(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-8 pr-2 py-2 bg-white border-2 border-emerald-500 rounded-lg font-black text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-400 text-base shadow-2xs"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 bg-white border border-blue-200 rounded-lg text-xs">
                    <span className="text-[11px] text-slate-500">Equivalente en Dólares ($):</span>
                    <div className="flex items-center gap-1 font-bold text-slate-800">
                      <span>$</span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={precioVentaUSD}
                        onChange={e => handleVentaUSDChange(e.target.value)}
                        className="w-20 text-right p-0.5 font-bold outline-none text-blue-700 bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div>
                    <label className="block text-[11px] font-bold text-blue-800 mb-0.5">
                      En Dólares ($ USD) - Principal
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-black text-blue-600 text-xs">$</span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        value={precioVentaUSD}
                        onChange={e => handleVentaUSDChange(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-7 pr-2 py-2 bg-white border-2 border-blue-500 rounded-lg font-black text-blue-600 outline-none focus:ring-2 focus:ring-blue-400 text-base shadow-2xs"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 bg-white border border-blue-200 rounded-lg text-xs">
                    <span className="text-[11px] text-slate-500">Equivalente en Córdobas (C$):</span>
                    <div className="flex items-center gap-1 font-bold text-slate-800">
                      <span>C$</span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.50"
                        value={precioVentaNIO}
                        onChange={e => handleVentaNIOChange(e.target.value)}
                        className="w-24 text-right p-0.5 font-bold outline-none text-emerald-700 bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* TOTAL A PAGAR POR ESTA COMPRA EN AMBAS MONEDAS */}
            <div className="p-3.5 bg-slate-900 text-white rounded-xl shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 block">Total a Pagar por esta Compra:</span>
              <div className="flex items-baseline justify-between flex-wrap gap-1">
                <span className="text-xl font-black text-emerald-400">
                  {formatoUSD(totalCompraUSD)}
                </span>
                <span className="text-base font-extrabold text-amber-300">
                  = {formatoNIO(totalCompraNIO)}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Calculado para {cantNum} unidades a {formatoUSD(pCompUSDNum)} ({formatoNIO(pCompNIONum)}) c/u.
              </p>
            </div>

            {/* Pago desde Caja Chica */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pagarDesdeCaja}
                  onChange={e => setPagarDesdeCaja(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="font-semibold text-slate-800">Registrar egreso de dinero en Caja Chica</span>
              </label>

              {pagarDesdeCaja && (
                <div className="pl-6 pt-1 flex items-center gap-3">
                  <span className="text-slate-600 text-[11px]">Efectivo deducido en:</span>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="monedaCaja"
                      checked={monedaCaja === 'USD'}
                      onChange={() => setMonedaCaja('USD')}
                      className="text-blue-600"
                    />
                    <span className="font-bold text-slate-700">Dólares ({formatoUSD(totalCompraUSD)})</span>
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="monedaCaja"
                      checked={monedaCaja === 'NIO'}
                      onChange={() => setMonedaCaja('NIO')}
                      className="text-blue-600"
                    />
                    <span className="font-bold text-slate-700">Córdobas ({formatoNIO(totalCompraNIO)})</span>
                  </label>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Ingresar Compra al Inventario</span>
            </button>
          </form>
        </div>

        {/* Historial de Compras (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h4 className="font-bold text-sm text-slate-800">Historial de Compras Registradas</h4>
              <p className="text-[11px] text-slate-500">Muestra precios en Dólares ($) y Córdobas (C$)</p>
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por N° compra, producto..."
                value={busquedaHistorial}
                onChange={e => setBusquedaHistorial(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3.5 py-3">N° Compra</th>
                  <th className="px-3.5 py-3">Fecha</th>
                  <th className="px-3.5 py-3">Producto / Cód</th>
                  <th className="px-3 py-3 text-center">Cant.</th>
                  <th className="px-3.5 py-3 text-right">P. Compra ($ / C$)</th>
                  <th className="px-3.5 py-3 text-right">Total ($ / C$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comprasFiltradas.map((c, i) => {
                  const pUnitUSD = c.precioUnitario ?? c.precioCompra ?? 0;
                  const tasaReg = c.tasaCambio || tasaCambio;
                  const pUnitNIO = c.precioUnitarioCordobas ?? (pUnitUSD * tasaReg);
                  const totUSD = c.total;
                  const totNIO = c.totalCordobas ?? (totUSD * tasaReg);

                  return (
                    <tr key={i} className="hover:bg-slate-50/80 transition">
                      <td className="px-3.5 py-3 font-mono font-bold text-slate-700">
                        {c.numeroCompra}
                        {c.proveedor && (
                          <span className="block text-[10px] text-slate-400 font-normal truncate max-w-[110px]">
                            {c.proveedor}
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-3 text-slate-500 whitespace-nowrap text-[11px]">{c.fecha}</td>
                      <td className="px-3.5 py-3">
                        <span className="font-bold text-slate-900 block">{c.producto}</span>
                        <span className="font-mono text-[10px] text-slate-500">{c.codigo} • {c.categoria}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                          +{c.cantidad}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-right">
                        <span className="font-bold text-slate-800 block">{formatoUSD(pUnitUSD)}</span>
                        <span className="text-[11px] text-slate-500">{formatoNIO(pUnitNIO)}</span>
                      </td>
                      <td className="px-3.5 py-3 text-right">
                        <span className="font-black text-slate-900 block">{formatoUSD(totUSD)}</span>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 inline-block">
                          {formatoNIO(totNIO)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {comprasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                      <ShoppingBasket className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-500">No hay compras registradas en el historial.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Ingresa nuevas entradas con el formulario a la izquierda.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
