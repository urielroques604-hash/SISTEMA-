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
  X,
  Coins,
  ArrowRightLeft
} from 'lucide-react';
import { MovimientoCaja } from '../types';
import { formatoUSD, formatoNIO, aCordobas, aDolares } from '../utils/currency';

interface CajaProps {
  movimientos: MovimientoCaja[];
  saldoActual: number;
  usuario: string;
  tasaCambio?: number;
  onAbrirModalTasa?: () => void;
  onRegistrarMovimiento: (datos: {
    tipo: string;
    concepto: string;
    monto: number;
    montoCordobas?: number;
    tasaCambio?: number;
  }) => { success: boolean; mensaje: string };
  onCerrarCaja: (observaciones: string) => { success: boolean; mensaje: string; saldoFinal?: number };
}

export const CajaView: React.FC<CajaProps> = ({
  movimientos,
  saldoActual,
  usuario,
  tasaCambio = 36.62,
  onAbrirModalTasa,
  onRegistrarMovimiento,
  onCerrarCaja
}) => {
  const [modalMovimiento, setModalMovimiento] = useState(false);
  const [modalCierre, setModalCierre] = useState(false);

  // Form Movimiento
  const [tipoMov, setTipoMov] = useState('Ingreso');
  const [monedaRegistro, setMonedaRegistro] = useState<'NIO' | 'USD'>('NIO');
  const [concepto, setConcepto] = useState('');
  const [montoUSD, setMontoUSD] = useState<string>('10.00');
  const [montoNIO, setMontoNIO] = useState<string>((10 * tasaCambio).toFixed(2));
  const [mensaje, setMensaje] = useState<{ tipo: 'error' | 'success'; texto: string } | null>(null);

  // Form Cierre
  const [obsCierre, setObsCierre] = useState('');

  // Sincronización de montos
  const handleUSDChange = (valStr: string) => {
    setMontoUSD(valStr);
    const val = parseFloat(valStr);
    if (!isNaN(val) && val >= 0) {
      setMontoNIO((val * tasaCambio).toFixed(2));
    } else {
      setMontoNIO('');
    }
  };

  const handleNIOChange = (valStr: string) => {
    setMontoNIO(valStr);
    const val = parseFloat(valStr);
    if (!isNaN(val) && val >= 0 && tasaCambio > 0) {
      setMontoUSD((val / tasaCambio).toFixed(2));
    } else {
      setMontoUSD('');
    }
  };

  // Cálculos resumen
  let ingresosTotalesUSD = 0;
  let egresosTotalesUSD = 0;

  movimientos.forEach(m => {
    if (m.monto > 0 && !m.tipo.toLowerCase().includes('inicial')) {
      ingresosTotalesUSD += m.monto;
    } else if (m.monto < 0) {
      egresosTotalesUSD += Math.abs(m.monto);
    }
  });

  const saldoActualNIO = aCordobas(saldoActual, tasaCambio);
  const ingresosTotalesNIO = aCordobas(ingresosTotalesUSD, tasaCambio);
  const egresosTotalesNIO = aCordobas(egresosTotalesUSD, tasaCambio);

  const guardarMovimiento = (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);

    const numMontoUSD = parseFloat(montoUSD) || 0;
    const numMontoNIO = parseFloat(montoNIO) || (numMontoUSD * tasaCambio);

    if (numMontoUSD <= 0) {
      setMensaje({ tipo: 'error', texto: 'El monto debe ser superior a $0.00' });
      return;
    }

    if (!concepto.trim()) {
      setMensaje({ tipo: 'error', texto: 'Debe ingresar un concepto o justificación.' });
      return;
    }

    const res = onRegistrarMovimiento({
      tipo: tipoMov,
      concepto: concepto.trim(),
      monto: numMontoUSD,
      montoCordobas: numMontoNIO,
      tasaCambio
    });

    if (res.success) {
      setMensaje({ tipo: 'success', texto: res.mensaje });
      setConcepto('');
      setMontoUSD('10.00');
      setMontoNIO((10 * tasaCambio).toFixed(2));
      setTimeout(() => setModalMovimiento(false), 1200);
    } else {
      setMensaje({ tipo: 'error', texto: res.mensaje });
    }
  };

  const ejecutarCierre = (e: React.FormEvent) => {
    e.preventDefault();
    const res = onCerrarCaja(obsCierre.trim() || 'Cierre de turno');
    if (res.success) {
      setModalCierre(false);
      setObsCierre('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Resumen de Caja en Dual Currency */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* SALDO ACTUAL PROMINENTE */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Saldo Actual en Caja</p>
            <h3 className="text-3xl font-black text-emerald-400 mt-1">{formatoUSD(saldoActual)}</h3>
            <p className="text-sm font-extrabold text-amber-300 mt-0.5">= {formatoNIO(saldoActualNIO)}</p>
            <p className="text-[10px] text-slate-400 mt-1">Tasa: 1 $ USD = C$ {tasaCambio.toFixed(2)} NIO</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/10 text-emerald-400 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* INGRESOS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ingresos del Día</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">+{formatoUSD(ingresosTotalesUSD)}</h3>
            <p className="text-xs font-bold text-slate-600 mt-0.5">+{formatoNIO(ingresosTotalesNIO)}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        {/* EGRESOS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Egresos / Gastos</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">-{formatoUSD(egresosTotalesUSD)}</h3>
            <p className="text-xs font-bold text-slate-600 mt-0.5">-{formatoNIO(egresosTotalesNIO)}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-emerald-600" />
          <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide">Control de Flujo de Efectivo</h4>
          {onAbrirModalTasa && (
            <button
              onClick={onAbrirModalTasa}
              className="text-[11px] text-blue-600 hover:underline font-bold ml-2"
            >
              (Tasa: C$ {tasaCambio.toFixed(2)})
            </button>
          )}
        </div>
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
          <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide">Libro Diario de Caja</h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">ID Movimiento</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Concepto</th>
                <th className="px-4 py-3 text-right">Monto ($ / C$)</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3 text-right">Saldo Progresivo ($ / C$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movimientos.map((m, idx) => {
                const esIngreso = m.monto >= 0;
                const tc = m.tasaCambio || tasaCambio;
                const mNIO = m.montoCordobas !== undefined ? m.montoCordobas : (Math.abs(m.monto) * tc);
                const sNIO = m.saldoCordobas !== undefined ? m.saldoCordobas : (m.saldo * tc);

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
                    <td className={`px-4 py-3 text-right font-black ${esIngreso ? 'text-emerald-600' : 'text-rose-600'}`}>
                      <span className="block">
                        {esIngreso ? `+${formatoUSD(m.monto)}` : `-${formatoUSD(Math.abs(m.monto))}`}
                      </span>
                      <span className="text-[10px] font-bold block">
                        {esIngreso ? `+${formatoNIO(mNIO)}` : `-${formatoNIO(mNIO)}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{m.usuario}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-black text-slate-900 block">{formatoUSD(m.saldo)}</span>
                      <span className="text-[10px] font-medium text-slate-500 block">{formatoNIO(sNIO)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar Movimiento con Moneda Dual */}
      {modalMovimiento && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-800">Registrar Movimiento de Caja</h3>
              <button onClick={() => setModalMovimiento(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarMovimiento} className="p-5 space-y-4">
              {mensaje && (
                <div className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                  mensaje.tipo === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {mensaje.tipo === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  <span>{mensaje.texto}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Movimiento</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['Ingreso', 'Egreso'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTipoMov(t)}
                      className={`p-2 rounded-lg border font-bold text-center transition ${
                        tipoMov === t
                          ? t === 'Ingreso' 
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs' 
                            : 'bg-rose-600 border-rose-600 text-white shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {t === 'Ingreso' ? '+ Entrada de Efectivo' : '- Salida / Gasto'}
                    </button>
                  ))}
                </div>
              </div>

              {/* SELECTOR DE MONEDA: CÓRDOBA O DÓLAR */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Moneda a Registrar ({tipoMov === 'Ingreso' ? 'Ingreso' : 'Gasto'}) *
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setMonedaRegistro('NIO')}
                    className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      monedaRegistro === 'NIO'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 bg-white/50'
                    }`}
                  >
                    <span>C$ Córdobas (NIO)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonedaRegistro('USD')}
                    className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      monedaRegistro === 'USD'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 bg-white/50'
                    }`}
                  >
                    <span>$ Dólares (USD)</span>
                  </button>
                </div>
              </div>

              {/* INPUTS MULTIMONEDA CON CONVERSIÓN EN TIEMPO REAL */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Monto del {tipoMov === 'Ingreso' ? 'Ingreso' : 'Gasto'}
                  </label>
                  <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                    <ArrowRightLeft className="w-3 h-3 text-slate-400" />
                    1 $ = C$ {tasaCambio.toFixed(2)}
                  </span>
                </div>

                {monedaRegistro === 'NIO' ? (
                  /* ENTRADA PRINCIPAL: CÓRDOBAS */
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[11px] font-bold text-emerald-800">
                          Monto en Córdobas (C$ NIO) - Principal
                        </label>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                          Seleccionada
                        </span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-emerald-600 text-sm">C$</span>
                        <input
                          type="number"
                          min="0.01"
                          step="0.50"
                          required
                          autoFocus
                          value={montoNIO}
                          onChange={e => handleNIOChange(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-9 pr-3 py-2 bg-white border-2 border-emerald-500 rounded-xl font-black text-base text-slate-900 outline-none focus:ring-2 focus:ring-emerald-400 shadow-xs"
                        />
                      </div>
                    </div>

                    <div className="p-2 bg-emerald-50/60 border border-emerald-200 rounded-lg flex items-center justify-between">
                      <span className="text-[11px] text-slate-600 font-medium">Equivalente en Dólares:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-blue-700">$ {montoUSD || '0.00'}</span>
                        <span className="text-[10px] text-slate-400">USD</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ENTRADA PRINCIPAL: DÓLARES */
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[11px] font-bold text-blue-800">
                          Monto en Dólares ($ USD) - Principal
                        </label>
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                          Seleccionada
                        </span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-blue-600 text-sm">$</span>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          required
                          autoFocus
                          value={montoUSD}
                          onChange={e => handleUSDChange(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-8 pr-3 py-2 bg-white border-2 border-blue-500 rounded-xl font-black text-base text-slate-900 outline-none focus:ring-2 focus:ring-blue-400 shadow-xs"
                        />
                      </div>
                    </div>

                    <div className="p-2 bg-blue-50/60 border border-blue-200 rounded-lg flex items-center justify-between">
                      <span className="text-[11px] text-slate-600 font-medium">Equivalente en Córdobas:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-emerald-700">C$ {montoNIO || '0.00'}</span>
                        <span className="text-[10px] text-slate-400">NIO</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Concepto / Motivo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pago de transporte, cambio en monedas, compra de insumos..."
                  value={concepto}
                  onChange={e => setConcepto(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalMovimiento(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Guardar Movimiento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cierre de Caja */}
      {modalCierre && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-800">Confirmar Cierre de Caja</h3>
              <button onClick={() => setModalCierre(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={ejecutarCierre} className="p-5 space-y-4 text-xs">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <span className="font-bold text-amber-900 block">Resumen del Cuadre de Caja:</span>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-600">Saldo en Dólares:</span>
                  <span className="font-black text-base text-slate-900">{formatoUSD(saldoActual)}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-600">Equivalente en Córdobas:</span>
                  <span className="font-black text-sm text-amber-800">{formatoNIO(saldoActualNIO)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 pt-1 border-t border-amber-200">
                  <span>Cajero Responsable:</span>
                  <span className="font-bold text-slate-700">{usuario}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observaciones Finales de Cierre</label>
                <textarea
                  rows={3}
                  value={obsCierre}
                  onChange={e => setObsCierre(e.target.value)}
                  placeholder="Ej: Cuadre perfecto sin faltantes, billetes entregados a administración..."
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalCierre(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Cerrar Turno Oficial</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
