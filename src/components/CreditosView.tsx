import React, { useState } from 'react';
import { 
  CreditCard, 
  PlusCircle, 
  Search, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Printer,
  Share2,
  FileText,
  MessageCircle,
  Clock
} from 'lucide-react';
import { Credito, Abono, Cliente } from '../types';
import { ComprobanteCreditoModal } from './ComprobanteCreditoModal';

interface CreditosProps {
  creditos: Credito[];
  abonos: Abono[];
  clientes?: Cliente[];
  onRegistrarAbono: (datos: {
    numeroCredito: string;
    montoAbonado: number;
    metodoPago: string;
    observaciones: string;
  }) => { success: boolean; mensaje: string; abono?: Abono; credito?: Credito };
}

export const CreditosView: React.FC<CreditosProps> = ({
  creditos,
  abonos,
  clientes = [],
  onRegistrarAbono
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [modalAbono, setModalAbono] = useState(false);
  const [creditoSeleccionado, setCreditoSeleccionado] = useState<Credito | null>(null);

  // Estado para el modal de comprobante de crédito o abono
  const [comprobanteActivo, setComprobanteActivo] = useState<{
    credito: Credito;
    abono?: Abono | null;
  } | null>(null);

  const [montoAbono, setMontoAbono] = useState<number>(0);
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [observaciones, setObservaciones] = useState('');
  const [errorAbono, setErrorAbono] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const creditosFiltrados = creditos.filter(c =>
    c.numeroCredito.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.numeroVenta.toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirAbono = (cred: Credito) => {
    setCreditoSeleccionado(cred);
    setMontoAbono(cred.saldo);
    setMetodoPago('Efectivo');
    setObservaciones('');
    setErrorAbono('');
    setSuccessMsg('');
    setModalAbono(true);
  };

  const verComprobanteCredito = (cred: Credito) => {
    setComprobanteActivo({
      credito: cred,
      abono: null
    });
  };

  const verComprobanteAbono = (ab: Abono) => {
    const cred = creditos.find(c => c.numeroCredito === ab.numeroCredito) || {
      numeroCredito: ab.numeroCredito,
      fecha: ab.fecha,
      idCliente: ab.idCliente,
      cliente: ab.cliente,
      numeroVenta: 'Venta',
      totalCredito: ab.montoAbonado,
      abonado: ab.montoAbonado,
      saldo: 0,
      vencimiento: 'Al día',
      estado: 'PAGADO'
    } as Credito;

    setComprobanteActivo({
      credito: cred,
      abono: ab
    });
  };

  const procesarAbono = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorAbono('');
    if (!creditoSeleccionado) return;

    if (montoAbono <= 0) {
      setErrorAbono('El monto abonado debe ser mayor a $0.00.');
      return;
    }

    if (montoAbono > creditoSeleccionado.saldo) {
      setErrorAbono(`No se puede abonar $${montoAbono.toFixed(2)}. El saldo pendiente es solo $${creditoSeleccionado.saldo.toFixed(2)}.`);
      return;
    }

    const res = onRegistrarAbono({
      numeroCredito: creditoSeleccionado.numeroCredito,
      montoAbonado: Number(montoAbono),
      metodoPago,
      observaciones: observaciones.trim() || 'Abono a cuenta'
    });

    if (res.success) {
      setSuccessMsg(res.mensaje);
      setModalAbono(false);
      // Abrir inmediatamente el comprobante para que el usuario pueda imprimir en maquinita o compartir por WhatsApp
      if (res.abono && (res.credito || creditoSeleccionado)) {
        setComprobanteActivo({
          credito: res.credito || creditoSeleccionado,
          abono: res.abono
        });
      }
    } else {
      setErrorAbono(res.mensaje);
    }
  };

  // Buscar información de cliente actual para el comprobante
  const clienteInfoActual = comprobanteActivo
    ? clientes.find(cl => cl.id === comprobanteActivo.credito.idCliente || cl.nombre === comprobanteActivo.credito.cliente)
    : null;

  return (
    <div className="space-y-6">
      {/* Barra superior */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por N° Crédito, cliente o venta..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">
            {creditos.length} créditos registrados
          </span>
        </div>
      </div>

      {/* Tabla de Créditos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-700" />
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide">Cuentas de Crédito Otorgadas</h4>
          </div>
          <span className="text-[11px] text-slate-500">
            Haga clic en el ícono de recibo para imprimir o compartir el comprobante
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">N° Crédito</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Venta</th>
                <th className="px-4 py-3 text-right">Total Crédito</th>
                <th className="px-4 py-3 text-right">Abonado</th>
                <th className="px-4 py-3 text-right">Crédito (Monto a Deber)</th>
                <th className="px-4 py-3">Vencimiento</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {creditosFiltrados.map(c => {
                const pagado = c.estado === 'PAGADO' || c.saldo <= 0.01;
                const anulado = c.estado === 'ANULADO';
                return (
                  <tr key={c.numeroCredito} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">{c.numeroCredito}</td>
                    <td className="px-4 py-3 text-slate-500">{c.fecha}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{c.cliente}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{c.numeroVenta}</td>
                    <td className="px-4 py-3 text-right font-semibold">${c.totalCredito.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-semibold">${c.abonado.toFixed(2)}</td>
                    <td className={`px-4 py-3 text-right font-extrabold ${pagado ? 'text-slate-400' : 'text-rose-600'}`}>
                      ${c.saldo.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.vencimiento}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        pagado 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : anulado
                          ? 'bg-slate-100 text-slate-500'
                          : c.estado === 'VENCIDO'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {pagado ? 'PAGADO' : c.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {!pagado && !anulado && (
                          <button
                            onClick={() => abrirAbono(c)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                            title="Registrar nuevo abono"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Abonar</span>
                          </button>
                        )}

                        <button
                          onClick={() => verComprobanteCredito(c)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition"
                          title="Imprimir / Compartir Estado de Cuenta y Comprobante"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {creditosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                    No se encontraron créditos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historial de Abonos */}
      {abonos.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-700" />
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                Historial de Abonos Registrados ({abonos.length})
              </h4>
            </div>
            <span className="text-[11px] text-slate-500">
              Imprima en maquinita o comparta por WhatsApp el recibo de cada abono
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">N° Abono</th>
                  <th className="px-4 py-2.5">Fecha</th>
                  <th className="px-4 py-2.5">N° Crédito</th>
                  <th className="px-4 py-2.5">Cliente</th>
                  <th className="px-4 py-2.5 text-right">Monto Abonado</th>
                  <th className="px-4 py-2.5">Método</th>
                  <th className="px-4 py-2.5">Observaciones</th>
                  <th className="px-4 py-2.5 text-center">Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {abonos.map(ab => (
                  <tr key={ab.numeroAbono} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-800">{ab.numeroAbono}</td>
                    <td className="px-4 py-2.5 text-slate-500">{ab.fecha}</td>
                    <td className="px-4 py-2.5 font-mono text-blue-600">{ab.numeroCredito}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{ab.cliente}</td>
                    <td className="px-4 py-2.5 text-right font-extrabold text-emerald-600">
                      ${ab.montoAbonado.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{ab.metodoPago}</td>
                    <td className="px-4 py-2.5 text-slate-500">{ab.observaciones}</td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => verComprobanteAbono(ab)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-bold text-[11px] transition inline-flex items-center gap-1 shadow-2xs"
                        title="Imprimir o compartir recibo de este abono"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Recibo</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Abonar */}
      {modalAbono && creditoSeleccionado && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Registrar Abono a Crédito</h3>
                <span className="text-[11px] text-slate-500 font-mono">
                  {creditoSeleccionado.numeroCredito} • {creditoSeleccionado.cliente}
                </span>
              </div>
              <button onClick={() => setModalAbono(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={procesarAbono} className="p-5 space-y-4 text-xs">
              {errorAbono && (
                <div className="p-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorAbono}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Total Crédito:</span>
                  <span className="font-bold text-slate-800">${creditoSeleccionado.totalCredito.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-rose-600 block text-[10px] font-bold uppercase">Crédito: Monto a Deber:</span>
                  <span className="font-extrabold text-rose-600 text-sm font-mono">${creditoSeleccionado.saldo.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Monto a Abonar ($) *
                </label>
                <input
                  type="number"
                  min="0.01"
                  max={creditoSeleccionado.saldo}
                  step="0.01"
                  required
                  value={montoAbono}
                  onChange={e => setMontoAbono(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-base text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  El monto no puede exceder el saldo actual (${creditoSeleccionado.saldo.toFixed(2)}).
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Método de Pago</label>
                <select
                  value={metodoPago}
                  onChange={e => setMetodoPago(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white outline-none"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Tarjeta">Tarjeta</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observaciones / Concepto</label>
                <input
                  type="text"
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  placeholder="Ej: Abono quincenal, pago cuota 1..."
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalAbono(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Registrar y Ver Comprobante</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Oficial de Comprobante / Recibo de Crédito o Abono */}
      {comprobanteActivo && (
        <ComprobanteCreditoModal
          credito={comprobanteActivo.credito}
          abono={comprobanteActivo.abono}
          clienteInfo={clienteInfoActual}
          onClose={() => setComprobanteActivo(null)}
        />
      )}
    </div>
  );
};
