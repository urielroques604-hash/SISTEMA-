import React, { useState } from 'react';
import { 
  RotateCcw, 
  AlertTriangle, 
  Search, 
  CheckCircle2, 
  Receipt,
  ArrowRight
} from 'lucide-react';
import { VentaRegistro } from '../types';

interface AnularVentaProps {
  ventas: VentaRegistro[];
  ventaInicial?: string;
  onAnularVenta: (numeroVenta: string, motivo: string) => { success: boolean; mensaje: string };
}

export const AnularVentaView: React.FC<AnularVentaProps> = ({
  ventas,
  ventaInicial = '',
  onAnularVenta
}) => {
  const [numVenta, setNumVenta] = useState(ventaInicial);
  const [motivo, setMotivo] = useState('');
  const [confirmarCheck, setConfirmarCheck] = useState(false);
  const [resultado, setResultado] = useState<{ tipo: 'error' | 'success'; mensaje: string } | null>(null);

  // Buscar todas las líneas de esa venta
  const lineasVenta = ventas.filter(v => v.numeroVenta.trim().toUpperCase() === numVenta.trim().toUpperCase());
  const ventaInfo = lineasVenta[0];
  const yaAnulada = lineasVenta.some(v => v.estado === 'ANULADA');
  const totalVenta = lineasVenta.reduce((sum, v) => sum + v.total, 0);

  const ejecutarAnulacion = (e: React.FormEvent) => {
    e.preventDefault();
    setResultado(null);

    if (!numVenta.trim()) {
      setResultado({ tipo: 'error', mensaje: 'Ingrese el número de venta a anular.' });
      return;
    }

    if (!motivo.trim()) {
      setResultado({ tipo: 'error', mensaje: 'Debe ingresar un motivo obligatorio para la anulación.' });
      return;
    }

    if (!confirmarCheck) {
      setResultado({ tipo: 'error', mensaje: 'Debe marcar la casilla de confirmación.' });
      return;
    }

    const res = onAnularVenta(numVenta.trim().toUpperCase(), motivo.trim());
    if (res.success) {
      setResultado({ tipo: 'success', mensaje: res.mensaje });
      setMotivo('');
      setConfirmarCheck(false);
    } else {
      setResultado({ tipo: 'error', mensaje: res.mensaje });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Módulo de Anulación de Ventas</h3>
            <p className="text-xs text-slate-500">
              Devuelve el stock a bodega, revierte fondos de caja y marca el registro como ANULADO sin borrar el historial.
            </p>
          </div>
        </div>

        {/* Input de número de venta */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Ej: V-00001"
              value={numVenta}
              onChange={e => {
                setNumVenta(e.target.value.toUpperCase());
                setResultado(null);
              }}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs font-mono uppercase focus:ring-2 focus:ring-rose-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Resultados y Alertas */}
      {resultado && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
          resultado.tipo === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          {resultado.tipo === 'error' ? <AlertTriangle className="w-5 h-5 flex-shrink-0" /> : <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
          <span>{resultado.mensaje}</span>
        </div>
      )}

      {/* Detalle de la venta encontrada */}
      {ventaInfo && (
        <div className={`bg-white rounded-xl border p-5 space-y-4 shadow-xs ${yaAnulada ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[11px] text-slate-400 font-mono">Detalle de Transacción</span>
              <h4 className="text-sm font-bold text-slate-900 font-mono">{ventaInfo.numeroVenta}</h4>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              yaAnulada ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {ventaInfo.estado}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Fecha Emisión</span>
              <span className="font-semibold text-slate-700">{ventaInfo.fecha}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Forma de Pago</span>
              <span className="font-semibold text-slate-700">{ventaInfo.formaPago}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Cajero / Usuario</span>
              <span className="font-semibold text-slate-700">{ventaInfo.usuario}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Total de Venta</span>
              <span className="font-extrabold text-blue-600">${totalVenta.toFixed(2)}</span>
            </div>
          </div>

          {/* Lista de productos en la venta */}
          <div className="border border-slate-100 rounded-lg overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold">
                <tr>
                  <th className="p-2">Producto</th>
                  <th className="p-2 text-center">Cant. a Reintegrar</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lineasVenta.map((l, i) => (
                  <tr key={i}>
                    <td className="p-2 font-medium text-slate-800">{l.producto} ({l.codigo})</td>
                    <td className="p-2 text-center font-bold text-emerald-600">+{l.cantidad} unid.</td>
                    <td className="p-2 text-right font-semibold text-slate-700">${l.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {yaAnulada ? (
            <div className="p-3 bg-rose-50 text-rose-800 rounded-lg text-xs">
              <strong>Venta ya anulada previamente.</strong>
              {ventaInfo.motivo && <p className="mt-1">Motivo: {ventaInfo.motivo}</p>}
              {ventaInfo.fechaAnulacion && <p className="text-[10px] text-rose-600">Fecha: {ventaInfo.fechaAnulacion}</p>}
            </div>
          ) : (
            <form onSubmit={ejecutarAnulacion} className="pt-2 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Motivo de Anulación (Obligatorio) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                  placeholder="Ej: Error en digitación de cantidad, producto devuelto por cliente, cobro duplicado..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={confirmarCheck}
                  onChange={e => setConfirmarCheck(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <span>Confirmo que deseo anular esta venta y reintegrar los productos al inventario.</span>
              </label>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition flex items-center justify-center gap-2 shadow-xs"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Ejecutar Anulación y Reversión</span>
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
