import React, { useState } from 'react';
import { ShoppingBasket, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { Producto, Proveedor, CompraRegistro } from '../types';

interface ComprasProps {
  productos: Producto[];
  proveedores: Proveedor[];
  compras: CompraRegistro[];
  onRegistrarCompra: (datos: {
    codigo: string;
    producto: string;
    categoria: string;
    cantidad: number;
    precioCompra: number;
    precioVenta: number;
    proveedor: string;
    pagarDesdeCaja: boolean;
  }) => { success: boolean; mensaje: string };
}

export const ComprasView: React.FC<ComprasProps> = ({
  productos,
  proveedores,
  compras,
  onRegistrarCompra
}) => {
  const [codigo, setCodigo] = useState('');
  const [producto, setProducto] = useState('');
  const [categoria, setCategoria] = useState('General');
  const [cantidad, setCantidad] = useState(10);
  const [precioCompra, setPrecioCompra] = useState(5.00);
  const [precioVenta, setPrecioVenta] = useState(10.00);
  const [proveedor, setProveedor] = useState('');
  const [pagarDesdeCaja, setPagarDesdeCaja] = useState(true);
  const [mensaje, setMensaje] = useState<{ tipo: 'error' | 'success'; texto: string } | null>(null);

  // Al seleccionar código si existe
  const seleccionarProductoExistente = (cod: string) => {
    setCodigo(cod);
    const encontrado = productos.find(p => p.codigo === cod);
    if (encontrado) {
      setProducto(encontrado.producto);
      setCategoria(encontrado.categoria);
      setPrecioCompra(encontrado.precioCompra);
      setPrecioVenta(encontrado.precioVenta);
    }
  };

  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);

    if (!codigo.trim() || !producto.trim()) {
      setMensaje({ tipo: 'error', texto: 'Código y producto son obligatorios.' });
      return;
    }

    if (cantidad <= 0 || precioCompra <= 0) {
      setMensaje({ tipo: 'error', texto: 'Cantidad y precio de compra deben ser mayores a 0.' });
      return;
    }

    const res = onRegistrarCompra({
      codigo: codigo.trim().toUpperCase(),
      producto: producto.trim(),
      categoria: categoria.trim() || 'General',
      cantidad: Number(cantidad),
      precioCompra: Number(precioCompra),
      precioVenta: Number(precioVenta),
      proveedor: proveedor.trim(),
      pagarDesdeCaja
    });

    if (res.success) {
      setMensaje({ tipo: 'success', texto: res.mensaje });
      setCodigo('');
      setProducto('');
      setCantidad(10);
      setPrecioCompra(5.00);
      setPrecioVenta(10.00);
    } else {
      setMensaje({ tipo: 'error', texto: res.mensaje });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Formulario Nueva Compra (5 cols) */}
      <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
          <ShoppingBasket className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-sm text-slate-800">Registrar Entrada de Mercadería</h3>
        </div>

        {mensaje && (
          <div className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
            mensaje.tipo === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {mensaje.tipo === 'error' ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
            <span>{mensaje.texto}</span>
          </div>
        )}

        <form onSubmit={guardar} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Proveedor</label>
            <select
              value={proveedor}
              onChange={e => setProveedor(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded text-xs bg-white outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">-- Seleccionar Proveedor --</option>
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
                className="w-full p-2 border border-slate-200 rounded font-mono uppercase outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Categoría</label>
              <input
                type="text"
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nombre del Producto *</label>
            <input
              type="text"
              required
              value={producto}
              onChange={e => setProducto(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cantidad *</label>
              <input
                type="number"
                min="1"
                required
                value={cantidad}
                onChange={e => setCantidad(Number(e.target.value) || 0)}
                className="w-full p-2 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">P. Compra ($)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={precioCompra}
                onChange={e => setPrecioCompra(Number(e.target.value) || 0)}
                className="w-full p-2 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">P. Venta ($)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={precioVenta}
                onChange={e => setPrecioVenta(Number(e.target.value) || 0)}
                className="w-full p-2 border border-slate-200 rounded text-blue-600 font-bold outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
            <span className="font-semibold text-slate-600">Total a Pagar por Compra:</span>
            <span className="font-extrabold text-sm text-slate-900">${(cantidad * precioCompra).toFixed(2)}</span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={pagarDesdeCaja}
              onChange={e => setPagarDesdeCaja(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium text-slate-700">Registrar egreso de dinero en Caja</span>
          </label>

          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Ingresar Compra al Inventario</span>
          </button>
        </form>
      </div>

      {/* Historial de Compras (7 cols) */}
      <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h4 className="font-bold text-sm text-slate-800">Historial de Compras Registradas</h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">N° Compra</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3 text-center">Cant.</th>
                <th className="px-4 py-3 text-right">P. Compra</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {compras.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold text-slate-700">{c.numeroCompra}</td>
                  <td className="px-4 py-3 text-slate-500">{c.fecha}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{c.producto}</td>
                  <td className="px-4 py-3 text-center font-bold text-emerald-600">+{c.cantidad}</td>
                  <td className="px-4 py-3 text-right text-slate-600">${c.precioUnitario.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">${c.total.toFixed(2)}</td>
                </tr>
              ))}
              {compras.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No se han registrado compras recientemente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
