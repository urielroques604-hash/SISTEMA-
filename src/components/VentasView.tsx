import React, { useState } from 'react';
import { 
  Receipt, 
  Search, 
  RotateCcw, 
  FileText, 
  Calendar,
  AlertTriangle,
  FileSpreadsheet,
  Coins,
  TrendingUp,
  ShoppingBag
} from 'lucide-react';
import { VentaRegistro } from '../types';
import { formatoUSD, formatoNIO } from '../utils/currency';

interface VentasProps {
  ventas: VentaRegistro[];
  tasaCambio?: number;
  onVerFactura: (numeroVenta: string) => void;
  onIrAnular: (numeroVenta: string) => void;
  onExportarExcel?: () => void;
}

export const VentasView: React.FC<VentasProps> = ({
  ventas,
  tasaCambio = 36.65,
  onVerFactura,
  onIrAnular,
  onExportarExcel
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const ventasFiltradas = ventas.filter(v => {
    const matchText = v.numeroVenta.toLowerCase().includes(busqueda.toLowerCase()) ||
                      v.producto.toLowerCase().includes(busqueda.toLowerCase()) ||
                      (v.cliente && v.cliente.toLowerCase().includes(busqueda.toLowerCase())) ||
                      v.usuario.toLowerCase().includes(busqueda.toLowerCase());
    const matchEstado = filtroEstado ? v.estado === filtroEstado : true;
    return matchText && matchEstado;
  });

  // Métricas rápidas
  const ventasCompletadas = ventasFiltradas.filter(v => v.estado !== 'ANULADA');
  const totalRecaudadoUSD = ventasCompletadas.reduce((acc, v) => acc + v.total, 0);
  const totalRecaudadoNIO = ventasCompletadas.reduce((acc, v) => acc + (v.totalCordobas || (v.total * (v.tasaCambio || tasaCambio))), 0);
  const totalArticulos = ventasCompletadas.reduce((acc, v) => acc + v.cantidad, 0);

  return (
    <div className="space-y-4">
      {/* Tarjetas de Métricas en Ambas Monedas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Total Ventas (Completadas)
            </span>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {formatoUSD(totalRecaudadoUSD)}
            </div>
            <div className="text-xs font-black text-emerald-700">
              = {formatoNIO(totalRecaudadoNIO)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Artículos Vendidos
            </span>
            <div className="text-xl font-black text-blue-600 mt-0.5">
              {totalArticulos} unidades
            </div>
            <div className="text-xs text-slate-400">
              En {ventasCompletadas.length} líneas registradas
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Tasa Activa
            </span>
            <div className="text-base font-black text-slate-900 mt-0.5 font-mono">
              1 $ = C$ {tasaCambio.toFixed(2)}
            </div>
            <div className="text-xs text-slate-400">
              Conversión oficial en tiempo real
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por N° Venta, producto, cliente o cajero..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
            className="p-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 w-full sm:w-auto font-medium"
          >
            <option value="">Todos los Estados</option>
            <option value="COMPLETADA">Completadas</option>
            <option value="ANULADA">Anuladas</option>
          </select>

          {onExportarExcel && (
            <button
              onClick={onExportarExcel}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs whitespace-nowrap"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Exportar Ventas</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Ventas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">N° Venta</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3 text-center">Cant.</th>
                <th className="px-4 py-3 text-right">P. Unit ($ / C$)</th>
                <th className="px-4 py-3 text-right">Total ($ / C$)</th>
                <th className="px-4 py-3">Forma Pago</th>
                <th className="px-4 py-3">Atendido por</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ventasFiltradas.map((v, idx) => {
                const esAnulada = v.estado === 'ANULADA';
                const tc = v.tasaCambio || tasaCambio;
                const unitNIO = v.precioUnitarioCordobas || (v.precioUnitario * tc);
                const totNIO = v.totalCordobas || (v.total * tc);

                return (
                  <tr key={idx} className={esAnulada ? 'bg-rose-50/40 text-slate-500' : 'hover:bg-slate-50'}>
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">{v.numeroVenta}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{v.fecha}</td>
                    <td className="px-4 py-3 font-mono text-slate-700">{v.codigo}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div>{v.producto}</div>
                      {v.cliente && (
                        <div className="text-[10px] text-slate-400">Cliente: {v.cliente}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-bold">{v.cantidad}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-slate-700 block">{formatoUSD(v.precioUnitario)}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{formatoNIO(unitNIO)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-black text-slate-900 block">{formatoUSD(v.total)}</span>
                      <span className="text-[10px] font-bold text-emerald-700 block">{formatoNIO(totNIO)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {v.formaPago}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-[11px] border border-slate-200">
                        {v.usuario}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        esAnulada ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {v.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onVerFactura(v.numeroVenta)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Ver Factura / Imprimir"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        {!esAnulada && (
                          <button
                            onClick={() => onIrAnular(v.numeroVenta)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Anular Venta"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {ventasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-slate-400">
                    No hay ventas que coincidan con la búsqueda.
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
