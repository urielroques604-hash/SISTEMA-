import React, { useState } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Lock, 
  Plus, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle,
  X 
} from 'lucide-react';
import { MovimientoCaja } from '../types';

interface CajaProps {
  movimientos: MovimientoCaja[];
  saldoActual: number;
  usuario: string;
  onRegistrarMovimiento: (datos: {
    tipo: string;
    concepto: string;
    monto: number;
  }) => { success: boolean; mensaje: string };
  onCerrarCaja: (observaciones: string) => { success: boolean; mensaje: string; saldoFinal?: number };
}

export const CajaView: React.FC<CajaProps> = ({
  movimientos,
  saldoActual,
  usuario,
  onRegistrarMovimiento,
  onCerrarCaja
}) => {
  const [modalMovimiento, setModalMovimiento] = useState(false);
  const [modalCierre, setModalCierre] = useState(false);

  // Form Movimiento
  const [tipoMov, setTipoMov] = useState('Ingreso');
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState(10);
  const [mensaje, setMensaje] = useState<{ tipo: 'error' | 'success'; texto: string } | null>(null);

  // Form Cierre
  const [obsCierre, setObsCierre] = useState('');

  // Cálculos resumen
  let ingresosTotales = 0;
  let egresosTotales = 0;

  movimientos.forEach(m => {
    if (m.monto > 0 && !m.tipo.toLowerCase().includes('inicial')) {
      ingresosTotales += m.monto;
    } else if (m.monto < 0) {
      egresosTotales += Math.abs(m.monto);
    }
  });

  const guardarMovimiento = (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);

    if (monto <= 0) {
      setMensaje({ tipo: 'error', texto: 'El monto debe ser superior a $0.00' });
      return;
    }

    if (!concepto.trim()) {
      setMensaje({ tipo: 'error', texto: 'Debe especificar el concepto del movimiento.' });
      return;
    }

    const res = onRegistrarMovimiento({
      tipo: tipoMov,
      concepto: concepto.trim(),
      monto: Number(monto)
    });

    if (res.success) {
      setMensaje({ tipo: 'success', texto: res.mensaje });
      setConcepto('');
      setMonto(10);
      setTimeout(() => setModalMovimiento(false), 800);
    } else {
      setMensaje({ tipo: 'error', texto: res.mensaje });
    }
  };

  const ejecutarCierre = (e: React.FormEvent) => {
    e.preventDefault();
    const res = onCerrarCaja(obsCierre);
    if (res.success) {
      alert(`Caja cerrada correctamente con un arqueo final de $${saldoActual.toFixed(2)}.`);
      setModalCierre(false);
      setObsCierre('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Cards de Métricas de Caja */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Saldo Actual en Caja</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">${saldoActual.toFixed(2)}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Ingresos</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">+${ingresosTotales.toFixed(2)}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Egresos</p>
            <h3 className="text-2xl font-extrabold text-rose-600 mt-1">-${egresosTotales.toFixed(2)}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <h4 className="font-bold text-sm text-slate-800">Control de Flujo de Efectivo</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setMensaje(null);
              setModalMovimiento(true);
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Movimiento Manual</span>
          </button>

          <button
            onClick={() => setModalCierre(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
          >
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Cierre de Caja</span>
          </button>
        </div>
      </div>

      {/* Tabla de Movimientos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200">
          <h4 className="font-bold text-sm text-slate-800">Libro Diario de Caja</h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">ID Movimiento</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Concepto</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3 text-right">Saldo Progresivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movimientos.map((m, idx) => {
                const esIngreso = m.monto >= 0;
                return (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-700">{m.id}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{m.fecha}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.tipo.includes('Cierre') 
                          ? 'bg-purple-100 text-purple-700'
                          : esIngreso 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                        {m.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{m.concepto}</td>
                    <td className={`px-4 py-3 text-right font-extrabold ${esIngreso ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {esIngreso ? `+$${m.monto.toFixed(2)}` : `-$${Math.abs(m.monto).toFixed(2)}`}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{m.usuario}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">${m.saldo.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Movimiento Manual */}
      {modalMovimiento && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800">Registrar Movimiento de Caja</h3>
              <button onClick={() => setModalMovimiento(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={guardarMovimiento} className="p-5 space-y-3 text-xs">
              {mensaje && (
                <div className={`p-2.5 rounded-lg flex items-center gap-1.5 ${
                  mensaje.tipo === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {mensaje.tipo === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{mensaje.texto}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipo de Movimiento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoMov('Ingreso')}
                    className={`p-2 rounded font-bold border transition ${
                      tipoMov === 'Ingreso' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    + Ingreso (Entrada)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoMov('Egreso')}
                    className={`p-2 rounded font-bold border transition ${
                      tipoMov === 'Egreso' ? 'bg-rose-50 border-rose-500 text-rose-700' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    - Egreso (Salida)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Concepto / Motivo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pago de flete, compra de papelería, ajuste de sencillo..."
                  value={concepto}
                  onChange={e => setConcepto(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Monto ($) *</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={monto}
                  onChange={e => setMonto(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded font-bold text-sm outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalMovimiento(false)}
                  className="px-3 py-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Confirmar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cierre de Caja */}
      {modalCierre && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800">Cierre de Caja y Arqueo</h3>
              <button onClick={() => setModalCierre(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={ejecutarCierre} className="p-5 space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
                <span className="text-slate-500 block mb-1">Saldo Final por Arqueo:</span>
                <span className="text-2xl font-extrabold text-slate-900">${saldoActual.toFixed(2)}</span>
                <p className="text-[10px] text-slate-400 mt-1">Responsable: {usuario}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observaciones del Cierre</label>
                <textarea
                  rows={2}
                  value={obsCierre}
                  onChange={e => setObsCierre(e.target.value)}
                  placeholder="Ej: Cierre conforme de turno matutino, billetes contados..."
                  className="w-full p-2 border border-slate-200 rounded outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalCierre(false)}
                  className="px-3 py-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Confirmar y Cerrar Caja</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
