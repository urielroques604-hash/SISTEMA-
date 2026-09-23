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
  Clock,
  Coins,
  ArrowRightLeft
} from 'lucide-react';
import { Credito, Abono, Cliente } from '../types';
import { ComprobanteCreditoModal } from './ComprobanteCreditoModal';
import { formatoUSD, formatoNIO, aCordobas, aDolares } from '../utils/currency';

interface CreditosProps {
  creditos: Credito[];
  abonos: Abono[];
  clientes?: Cliente[];
  tasaCambio?: number;
  onAbrirModalTasa?: () => void;
  onRegistrarAbono: (datos: {
    numeroCredito: string;
    montoAbonado: number;
    montoAbonadoCordobas?: number;
    tasaCambio?: number;
    metodoPago: string;
    observaciones: string;
  }) => { success: boolean; mensaje: string; abono?: Abono; credito?: Credito };
}

export const CreditosView: React.FC<CreditosProps> = ({
  creditos,
  abonos,
  clientes = [],
  tasaCambio = 36.62,
  onAbrirModalTasa,
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

  const [monedaAbono, setMonedaAbono] = useState<'NIO' | 'USD'>('NIO');
  const [montoAbonoUSD, setMontoAbonoUSD] = useState<string>('0');
  const [montoAbonoNIO, setMontoAbonoNIO] = useState<string>('0');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [observaciones, setObservaciones] = useState('');
  const [errorAbono, setErrorAbono] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const creditosFiltrados = creditos.filter(c =>
    c.numeroCredito.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.numeroVenta.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Sincronización de abono entre USD y NIO
  const handleAbonoUSDChange = (valStr: string) => {
    setMontoAbonoUSD(valStr);
    const val = parseFloat(valStr);
    if (!isNaN(val) && val >= 0) {
      setMontoAbonoNIO((val * tasaCambio).toFixed(2));
    } else {
      setMontoAbonoNIO('');
    }
  };

  const handleAbonoNIOChange = (valStr: string) => {
    setMontoAbonoNIO(valStr);
    const val = parseFloat(valStr);
    if (!isNaN(val) && val >= 0 && tasaCambio > 0) {
      setMontoAbonoUSD((val / tasaCambio).toFixed(2));
    } else {
      setMontoAbonoUSD('');
    }
  };

  const abrirAbono = (cred: Credito) => {
    setCreditoSeleccionado(cred);
    setMontoAbonoUSD(cred.saldo.toFixed(2));
    setMontoAbonoNIO((cred.saldo * tasaCambio).toFixed(2));
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
    const cred = creditos.find(c => c.numeroCredito === ab.numeroCredito);
    if (!cred) return;
    setComprobanteActivo({
      credito: cred,
      abono: ab
    });
  };

  const procesarAbono = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorAbono('');
    if (!creditoSeleccionado) return;

    const montoUSD = parseFloat(montoAbonoUSD) || 0;
    const montoNIO = parseFloat(montoAbonoNIO) || (montoUSD * tasaCambio);

    if (montoUSD <= 0) {
      setErrorAbono('El monto abonado debe ser mayor a $0.00.');
      return;
    }

    if (montoUSD > creditoSeleccionado.saldo + 0.05) {
      setErrorAbono(`No se puede abonar $${montoUSD.toFixed(2)}. El saldo pendiente es solo $${creditoSeleccionado.saldo.toFixed(2)}.`);
      return;
    }

    const res = onRegistrarAbono({
      numeroCredito: creditoSeleccionado.numeroCredito,
      montoAbonado: Number(montoUSD.toFixed(2)),
      montoAbonadoCordobas: Number(montoNIO.toFixed(2)),
      tasaCambio,
      metodoPago,
      observaciones: observaciones.trim() || 'Abono a cuenta'
    });

    if (res.success) {
      setSuccessMsg(res.mensaje);
      setModalAbono(false);
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

  // Cálculos globales
  const totalCarteraUSD = creditos.reduce((acc, c) => acc + c.saldo, 0);
  const totalCarteraNIO = totalCarteraUSD * tasaCambio;

  return (
    <div className="space-y-6">
      {/* Banner de Cartera y Tasa de Cambio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wide block">
              Cartera Total por Cobrar (Saldos Pendientes)
            </span>
            <div className="text-2xl font-black text-rose-600 mt-0.5">
              {formatoUSD(totalCarteraUSD)}
            </div>
            <div className="text-xs font-black text-rose-900 mt-0.5">
              = {formatoNIO(totalCarteraNIO)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
              Tasa Oficial Aplicada a Créditos
            </span>
            <div className="text-xl font-black text-slate-900 mt-0.5 font-mono">
              1 $ USD = C$ {tasaCambio.toFixed(2)} NIO
            </div>
            <span className="text-xs text-slate-500">
              Conversión automática para cobro en córdobas
            </span>
          </div>
          {onAbrirModalTasa && (
            <button
              onClick={onAbrirModalTasa}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Cambiar Tasa</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra superior */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por N° Crédito, cliente o venta..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="text-xs text-slate-500 font-semibold">
          Mostrando {creditosFiltrados.length} de {creditos.length} cuentas registradas
        </div>
      </div>

      {/* Tabla de Créditos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-700" />
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
              Cuentas por Cobrar & Créditos Activos
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">N° Crédito</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">N° Venta</th>
                <th className="px-4 py-3 text-right">Total ($ / C$)</th>
                <th className="px-4 py-3 text-right">Abonado ($ / C$)</th>
                <th className="px-4 py-3 text-right">Saldo ($ / C$)</th>
                <th className="px-4 py-3">Vence</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {creditosFiltrados.map(c => {
                const pagado = c.estado === 'PAGADO' || c.saldo <= 0.01;
                const anulado = c.estado === 'ANULADO';
                const tc = c.tasaCambio || tasaCambio;
                const totNIO = c.totalCreditoCordobas || (c.totalCredito * tc);
                const abonNIO = c.abonadoCordobas || (c.abonado * tc);
                const saldNIO = c.saldoCordobas || (c.saldo * tc);

                return (
                  <tr key={c.numeroCredito} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">{c.numeroCredito}</td>
                    <td className="px-4 py-3 text-slate-500">{c.fecha}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{c.cliente}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{c.numeroVenta}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-slate-700 block">{formatoUSD(c.totalCredito)}</span>
                      <span className="text-[10px] text-slate-500">{formatoNIO(totNIO)}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600">
                      <span className="font-bold block">{formatoUSD(c.abonado)}</span>
                      <span className="text-[10px]">{formatoNIO(abonNIO)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-black block ${pagado ? 'text-slate-400' : 'text-rose-600'}`}>
                        {formatoUSD(c.saldo)}
                      </span>
                      <span className={`text-[10px] font-bold block ${pagado ? 'text-slate-400' : 'text-rose-700'}`}>
                        {formatoNIO(saldNIO)}
                      </span>
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
                          <Printer className="w-4 h-4" />
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
                  <th className="px-4 py-3">N° Abono</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">N° Crédito</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3 text-right">Monto Abonado ($ / C$)</th>
                  <th className="px-4 py-3 text-right">Saldo Restante ($ / C$)</th>
                  <th className="px-4 py-3">Método Pago</th>
                  <th className="px-4 py-3">Concepto / Nota</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {abonos.map(ab => {
                  const cred = creditos.find(c => c.numeroCredito === ab.numeroCredito);
                  const tc = ab.tasaCambio || cred?.tasaCambio || tasaCambio;
                  const abNIO = ab.montoAbonadoCordobas || (ab.montoAbonado * tc);
                  const saldNIO = (ab.saldoRestante !== undefined ? ab.saldoRestante : (cred?.saldo || 0)) * tc;

                  return (
                    <tr key={ab.id || ab.numeroAbono} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-mono font-bold text-emerald-700">{ab.numeroAbono}</td>
                      <td className="px-4 py-3 text-slate-500">{ab.fecha}</td>
                      <td className="px-4 py-3 font-mono text-slate-700">{ab.numeroCredito}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{cred?.cliente || 'Cliente'}</td>
                      <td className="px-4 py-3 text-right font-black text-emerald-600">
                        <span className="block">{formatoUSD(ab.montoAbonado)}</span>
                        <span className="text-[10px] text-emerald-800 block">{formatoNIO(abNIO)}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-700">
                        <span className="block">
                          {ab.saldoRestante !== undefined ? formatoUSD(ab.saldoRestante) : (cred ? formatoUSD(cred.saldo) : '-')}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {formatoNIO(saldNIO)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {ab.metodoPago}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 truncate max-w-xs">{ab.observaciones}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => verComprobanteAbono(ab)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition text-xs font-bold flex items-center gap-1 mx-auto"
                          title="Ver recibo de abono"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Recibo</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Registrar Abono con Moneda Dual */}
      {modalAbono && creditoSeleccionado && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Registrar Abono a Crédito</h3>
                <span className="text-xs text-slate-500 font-mono">
                  {creditoSeleccionado.numeroCredito} • {creditoSeleccionado.cliente}
                </span>
              </div>
              <button
                onClick={() => setModalAbono(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={procesarAbono} className="p-5 space-y-4">
              {errorAbono && (
                <div className="p-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg flex items-center gap-1.5 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorAbono}</span>
                </div>
              )}

              {/* Detalle del Saldo Pendiente en Ambas Monedas */}
              <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Total Original Crédito:</span>
                  <span className="font-bold text-slate-800">
                    {formatoUSD(creditoSeleccionado.totalCredito)} / {formatoNIO(creditoSeleccionado.totalCredito * tasaCambio)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-1 border-t border-rose-200">
                  <span className="text-rose-950 font-extrabold uppercase text-[11px]">SALDO A DEBER:</span>
                  <div className="text-right">
                    <span className="font-black text-rose-600 text-base font-mono block">
                      {formatoUSD(creditoSeleccionado.saldo)}
                    </span>
                    <span className="text-xs font-extrabold text-rose-800 block">
                      = {formatoNIO(creditoSeleccionado.saldo * tasaCambio)}
                    </span>
                  </div>
                </div>
              </div>

              {/* SELECTOR DE MONEDA DEL ABONO */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Moneda para Registrar el Abono:
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setMonedaAbono('NIO')}
                    className={`py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      monedaAbono === 'NIO'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 bg-white/50'
                    }`}
                  >
                    <span>C$ Córdobas (NIO)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonedaAbono('USD')}
                    className={`py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      monedaAbono === 'USD'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 bg-white/50'
                    }`}
                  >
                    <span>$ Dólares (USD)</span>
                  </button>
                </div>
              </div>

              {/* INPUTS MULTIMONEDA CON CONVERSIÓN EN VIVO */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 text-xs">
                    Monto a Abonar *
                  </label>
                  <span className="text-[10px] text-slate-600 flex items-center gap-1 font-semibold">
                    <ArrowRightLeft className="w-3 h-3 text-blue-600" />
                    Tasa: 1 $ = C$ {tasaCambio.toFixed(2)}
                  </span>
                </div>

                {monedaAbono === 'NIO' ? (
                  <div className="space-y-1.5">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-800 mb-0.5">
                        Monto Recibido en Córdobas (C$ NIO)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-black text-emerald-600 text-xs">C$</span>
                        <input
                          type="number"
                          min="0.01"
                          max={creditoSeleccionado.saldo * tasaCambio}
                          step="0.50"
                          required
                          value={montoAbonoNIO}
                          onChange={e => handleAbonoNIOChange(e.target.value)}
                          className="w-full pl-8 pr-2 py-2 bg-white border-2 border-emerald-500 rounded-lg font-black text-base text-slate-900 outline-none focus:ring-2 focus:ring-emerald-400 shadow-2xs"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs">
                      <span className="text-[11px] text-slate-500 font-semibold">Equivalente en Dólares ($):</span>
                      <div className="flex items-center gap-1 font-bold text-slate-800">
                        <span>$</span>
                        <input
                          type="number"
                          min="0.01"
                          max={creditoSeleccionado.saldo}
                          step="0.01"
                          value={montoAbonoUSD}
                          onChange={e => handleAbonoUSDChange(e.target.value)}
                          className="w-24 text-right p-0.5 font-bold outline-none text-blue-700 bg-transparent"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div>
                      <label className="block text-[11px] font-bold text-blue-800 mb-0.5">
                        Monto Recibido en Dólares ($ USD)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-black text-blue-600 text-xs">$</span>
                        <input
                          type="number"
                          min="0.01"
                          max={creditoSeleccionado.saldo}
                          step="0.01"
                          required
                          value={montoAbonoUSD}
                          onChange={e => handleAbonoUSDChange(e.target.value)}
                          className="w-full pl-7 pr-2 py-2 bg-white border-2 border-blue-500 rounded-lg font-black text-base text-slate-900 outline-none focus:ring-2 focus:ring-blue-400 shadow-2xs"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs">
                      <span className="text-[11px] text-slate-500 font-semibold">Equivalente en Córdobas (C$):</span>
                      <div className="flex items-center gap-1 font-bold text-slate-800">
                        <span>C$</span>
                        <input
                          type="number"
                          min="0.01"
                          max={creditoSeleccionado.saldo * tasaCambio}
                          step="0.50"
                          value={montoAbonoNIO}
                          onChange={e => handleAbonoNIOChange(e.target.value)}
                          className="w-28 text-right p-0.5 font-bold outline-none text-emerald-700 bg-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMontoAbonoUSD(creditoSeleccionado.saldo.toFixed(2));
                      setMontoAbonoNIO((creditoSeleccionado.saldo * tasaCambio).toFixed(2));
                    }}
                    className="text-[11px] font-bold text-blue-700 underline hover:text-blue-900"
                  >
                    Abonar Saldo Total (Liquidar Deuda)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-xs">Método de Pago</label>
                <select
                  value={metodoPago}
                  onChange={e => setMetodoPago(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white outline-none text-xs"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Tarjeta">Tarjeta</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-xs">Observaciones / Concepto</label>
                <input
                  type="text"
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  placeholder="Ej: Abono quincenal, pago cuota 1..."
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalAbono(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs text-xs"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Registrar Abono y Generar Recibo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Comprobante / Recibo con Maquinita Térmica y WhatsApp */}
      {comprobanteActivo && (
        <ComprobanteCreditoModal
          credito={comprobanteActivo.credito}
          abono={comprobanteActivo.abono}
          clienteInfo={clienteInfoActual}
          tasaCambio={tasaCambio}
          onClose={() => setComprobanteActivo(null)}
        />
      )}
    </div>
  );
};
