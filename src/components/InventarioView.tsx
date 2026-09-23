import React, { useState } from 'react';
import { BarChart3, Search, Layers, TrendingUp, FileSpreadsheet, Coins } from 'lucide-react';
import { Producto } from '../types';
import { formatoUSD, formatoNIO, aCordobas } from '../utils/currency';

interface InventarioProps {
  productos: Producto[];
  tasaCambio?: number;
  onExportarExcel?: () => void;
}

export const InventarioView: React.FC<InventarioProps> = ({ 
  productos, 
  tasaCambio = 36.62,
  onExportarExcel 
}) => {
  const [busqueda, setBusqueda] = useState('');

  const filtrados = productos.filter(p =>
    p.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.producto.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.categoria.toLowerCase().includes(busqueda.toLowerCase())
  );

  const valorCostoTotal = productos.reduce((acc, p) => acc + (p.existencia * p.precioCompra), 0);
  const valorVentaTotal = productos.reduce((acc, p) => acc + (p.existencia * p.precioVenta), 0);
  const margenEstimado = valorVentaTotal - valorCostoTotal;

  const valorCostoTotalNIO = aCordobas(valorCostoTotal, tasaCambio);
  const valorVentaTotalNIO = aCordobas(valorVentaTotal, tasaCambio);
  const margenEstimadoNIO = aCordobas(margenEstimado, tasaCambio);

  return (
    <div className="space-y-6">
      {/* Resumen Header Dual Currency */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Valoración a Costo (Inversión)</span>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">{formatoUSD(valorCostoTotal)}</h3>
          <p className="text-xs font-bold text-amber-600 mt-0.5">{formatoNIO(valorCostoTotalNIO)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Valoración Proyectada a Venta</span>
          <h3 className="text-xl font-extrabold text-blue-600 mt-1">{formatoUSD(valorVentaTotal)}</h3>
          <p className="text-xs font-bold text-blue-500 mt-0.5">{formatoNIO(valorVentaTotalNIO)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Margen Bruto Proyectado</span>
          <h3 className="text-xl font-extrabold text-emerald-600 mt-1">+{formatoUSD(margenEstimado)}</h3>
          <p className="text-xs font-bold text-emerald-500 mt-0.5">+{formatoNIO(margenEstimadoNIO)}</p>
        </div>
      </div>

      {/* Buscador y Exportación */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar en el inventario valorizado por código o producto..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
            Tasa: 1 $ = C$ {tasaCambio.toFixed(2)}
          </span>
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
                <th className="px-4 py-3 text-right">P. Compra ($ / C$)</th>
                <th className="px-4 py-3 text-right">P. Venta ($ / C$)</th>
                <th className="px-4 py-3 text-right">Valor Total Inversión</th>
                <th className="px-4 py-3 text-center">Disponibilidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.map(p => {
                const esAgotado = p.existencia <= 0;
                const pCompraNIO = p.precioCompraCordobas || (p.precioCompra * tasaCambio);
                const pVentaNIO = p.precioVentaCordobas || (p.precioVenta * tasaCambio);
                const valorTotUSD = p.existencia * p.precioCompra;
                const valorTotNIO = p.existencia * pCompraNIO;

                return (
                  <tr key={p.codigo} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">{p.codigo}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{p.producto}</td>
                    <td className="px-4 py-3 text-slate-500">{p.categoria}</td>
                    <td className="px-4 py-3 text-center font-bold">
                      {esAgotado ? (
                        <span className="text-rose-600 font-black">0</span>
                      ) : (
                        <span className="text-slate-800 font-black">{p.existencia}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-slate-800 block">{formatoUSD(p.precioCompra)}</span>
                      <span className="text-[10px] text-amber-700 font-bold block">{formatoNIO(pCompraNIO)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-blue-600 block">{formatoUSD(p.precioVenta)}</span>
                      <span className="text-[10px] text-blue-500 font-bold block">{formatoNIO(pVentaNIO)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-black text-slate-900 block">{formatoUSD(valorTotUSD)}</span>
                      <span className="text-[10px] text-slate-500 font-medium block">{formatoNIO(valorTotNIO)}</span>
                    </td>
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
