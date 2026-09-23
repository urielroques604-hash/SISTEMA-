import React from 'react';
import { 
  DollarSign, 
  Package, 
  Layers, 
  TrendingUp, 
  CreditCard, 
  Wallet, 
  Receipt,
  ArrowUpRight,
  Coins
} from 'lucide-react';
import { Producto, VentaRegistro, Credito } from '../types';
import { formatoUSD, formatoNIO, aCordobas } from '../utils/currency';

interface DashboardProps {
  productos: Producto[];
  ventas: VentaRegistro[];
  creditos: Credito[];
  saldoCaja: number;
  tasaCambio?: number;
  onNavigate: (vista: string) => void;
}

export const DashboardView: React.FC<DashboardProps> = ({
  productos,
  ventas,
  creditos,
  saldoCaja,
  tasaCambio = 36.62,
  onNavigate
}) => {
  // Cálculos métricas
  const hoyStr = new Date().toISOString().slice(0, 10);
  const ventasValidas = ventas.filter(v => v.estado !== 'ANULADA');
  
  const ventasHoyUSD = ventasValidas
    .filter(v => v.fecha.startsWith(hoyStr))
    .reduce((acc, v) => acc + v.total, 0);
  const ventasHoyNIO = aCordobas(ventasHoyUSD, tasaCambio);

  const existenciaTotal = productos.reduce((acc, p) => acc + p.existencia, 0);
  const valorInventarioUSD = productos.reduce((acc, p) => acc + (p.existencia * p.precioCompra), 0);
  const valorInventarioNIO = aCordobas(valorInventarioUSD, tasaCambio);

  // Ganancia acumulada
  const costMap: Record<string, number> = {};
  productos.forEach(p => { costMap[p.codigo] = p.precioCompra; });
  const gananciaTotalUSD = ventasValidas.reduce((acc, v) => {
    const costo = costMap[v.codigo] || (v.precioUnitario * 0.6);
    return acc + (v.total - (costo * v.cantidad));
  }, 0);
  const gananciaTotalNIO = aCordobas(gananciaTotalUSD, tasaCambio);

  const creditosPendientesUSD = creditos
    .filter(c => c.estado === 'PENDIENTE' || c.estado === 'VENCIDO')
    .reduce((acc, c) => acc + c.saldo, 0);
  const creditosPendientesNIO = aCordobas(creditosPendientesUSD, tasaCambio);

  const saldoCajaNIO = aCordobas(saldoCaja, tasaCambio);

  const metricas = [
    { 
      label: 'Ventas del Día', 
      valorUSD: formatoUSD(ventasHoyUSD), 
      valorNIO: formatoNIO(ventasHoyNIO), 
      icon: DollarSign, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50' 
    },
    { 
      label: 'Productos Registrados', 
      valorUSD: `${productos.length}`, 
      valorNIO: 'Artículos en catálogo', 
      icon: Package, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50' 
    },
    { 
      label: 'Existencia Total', 
      valorUSD: `${existenciaTotal} unid.`, 
      valorNIO: 'Unidades en stock', 
      icon: Layers, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50' 
    },
    { 
      label: 'Valor del Inventario', 
      valorUSD: formatoUSD(valorInventarioUSD), 
      valorNIO: formatoNIO(valorInventarioNIO), 
      icon: TrendingUp, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50' 
    },
    { 
      label: 'Ganancia Estimada', 
      valorUSD: formatoUSD(gananciaTotalUSD), 
      valorNIO: formatoNIO(gananciaTotalNIO), 
      icon: TrendingUp, 
      color: 'text-teal-600', 
      bg: 'bg-teal-50' 
    },
    { 
      label: 'Créditos Pendientes', 
      valorUSD: formatoUSD(creditosPendientesUSD), 
      valorNIO: formatoNIO(creditosPendientesNIO), 
      icon: CreditCard, 
      color: 'text-rose-600', 
      bg: 'bg-rose-50' 
    },
    { 
      label: 'Dinero en Caja', 
      valorUSD: formatoUSD(saldoCaja), 
      valorNIO: formatoNIO(saldoCajaNIO), 
      icon: Wallet, 
      color: 'text-cyan-600', 
      bg: 'bg-cyan-50' 
    }
  ];

  return (
    <div className="space-y-6">
      {/* Metric cards con Moneda Dual */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricas.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-0.5 uppercase tracking-wider">{m.label}</p>
                <h3 className="text-xl font-black text-slate-900">{m.valorUSD}</h3>
                <p className="text-xs font-bold text-slate-600 mt-0.5">{m.valorNIO}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl ${m.bg} flex items-center justify-center ${m.color} shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate('pos')}
          className="p-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition flex items-center justify-between text-left shadow-sm"
        >
          <div>
            <h4 className="font-bold text-sm">Nueva Venta (POS)</h4>
            <p className="text-xs text-blue-100 mt-0.5">Cobro en Dólares y Córdobas (Efectivo/Crédito)</p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-blue-200" />
        </button>

        <button
          onClick={() => onNavigate('compras')}
          className="p-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition flex items-center justify-between text-left shadow-sm"
        >
          <div>
            <h4 className="font-bold text-sm">Registro de Compras</h4>
            <p className="text-xs text-slate-300 mt-0.5">Entrada de mercadería en Dólares y Córdobas</p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-slate-400" />
        </button>

        <button
          onClick={() => onNavigate('creditos')}
          className="p-4 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center justify-between text-left shadow-sm"
        >
          <div>
            <h4 className="font-bold text-sm">Cobranza y Abonos</h4>
            <p className="text-xs text-emerald-100 mt-0.5">Recibir pagos a créditos con tasa en vivo</p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-emerald-200" />
        </button>
      </div>

      {/* Ventas recientes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide">Últimas Ventas Registradas</h3>
          </div>
          <button
            onClick={() => onNavigate('ventas')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            Ver historial completo &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">N° Venta</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3 text-center">Cant.</th>
                <th className="px-4 py-3">Forma Pago</th>
                <th className="px-4 py-3 text-right">Total ($ / C$)</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ventas.slice(0, 6).map((v, i) => {
                const tc = v.tasaCambio || tasaCambio;
                const totNIO = v.totalCordobas || (v.total * tc);

                return (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">{v.numeroVenta}</td>
                    <td className="px-4 py-3 text-slate-500">{v.fecha}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{v.producto}</td>
                    <td className="px-4 py-3 text-center font-semibold">{v.cantidad}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {v.formaPago}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-slate-900 block">{formatoUSD(v.total)}</span>
                      <span className="text-[10px] font-medium text-slate-500 block">{formatoNIO(totNIO)}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{v.usuario}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        v.estado === 'COMPLETADA' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {v.estado}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {ventas.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No hay ventas registradas aún.
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
