import React, { useState } from 'react';
import { BarChart3, Search, Layers, TrendingUp, FileSpreadsheet } from 'lucide-react';
import { Producto } from '../types';

interface InventarioProps {
  productos: Producto[];
  onExportarExcel?: () => void;
}

export const InventarioView: React.FC<InventarioProps> = ({ productos, onExportarExcel }) => {
  const [busqueda, setBusqueda] = useState('');

  const filtrados = productos.filter(p =>
    p.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.producto.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.categoria.toLowerCase().includes(busqueda.toLowerCase())
  );

  const valorCostoTotal = productos.reduce((acc, p) => acc + (p.existencia * p.precioCompra), 0);
  const valorVentaTotal = productos.reduce((acc, p) => acc + (p.existencia * p.precioVenta), 0);
  const margenEstimado = valorVentaTotal - valorCostoTotal;

  return (
    <div className="space-y-6">
      {/* Resumen Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold">Valoración a Costo (Inversión)</span>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">${valorCostoTotal.toFixed(2)}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold">Valoración Proyectada a Venta</span>
          <h3 className="text-xl font-extrabold text-blue-600 mt-1">${valorVentaTotal.toFixed(2)}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold">Margen Bruto Proyectado</span>
          <h3 className="text-xl font-extrabold text-emerald-600 mt-1">+${margenEstimado.toFixed(2)}</h3>
        </div>
      </div>

      {/* Buscador y Exportación */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar en el inventario valorizado..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {onExportarExcel && (
          <button
            onClick={onExportarExcel}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Exportar Inventario</span>
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3 text-center">Existencia</th>
                <th className="px-4 py-3 text-right">P. Compra</th>
                <th className="px-4 py-3 text-right">P. Venta</th>
                <th className="px-4 py-3 text-right">Valor Total (Costo)</th>
                <th className="px-4 py-3 text-center">Disponibilidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.map(p => {
                const esAgotado = p.existencia <= 0;
                const valorTot = p.existencia * p.precioCompra;
                return (
                  <tr key={p.codigo} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">{p.codigo}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{p.producto}</td>
                    <td className="px-4 py-3 text-slate-500">{p.categoria}</td>
                    <td className="px-4 py-3 text-center font-bold">
                      {esAgotado ? (
                        <span className="text-rose-600">0</span>
                      ) : (
                        <span className="text-slate-800">{p.existencia}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">${p.precioCompra.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-blue-600 font-semibold">${p.precioVenta.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">${valorTot.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      {esAgotado ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                          AGOTADO
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                          En Stock
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
