import React, { useState } from 'react';
import { 
  BadgePercent, 
  Search, 
  UserCheck, 
  MessageCircle, 
  Copy, 
  CheckCircle2, 
  Image as ImageIcon, 
  Printer, 
  FileText,
  Coins
} from 'lucide-react';
import { CuentaPorCobrar, Cliente } from '../types';
import { EstadoDeCuentaModal } from './EstadoDeCuentaModal';
import { formatoUSD, formatoNIO, aCordobas } from '../utils/currency';
import { abrirEnlaceSeguro } from '../utils/safeLink';

interface CxcProps {
  cuentasPorCobrar: CuentaPorCobrar[];
  clientes?: Cliente[];
  tasaCambio?: number;
}

export const CxcView: React.FC<CxcProps> = ({ 
  cuentasPorCobrar, 
  clientes = [],
  tasaCambio = 36.62 
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [mensajeCopiado, setMensajeCopiado] = useState<string | null>(null);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<CuentaPorCobrar | null>(null);

  const filtradas = cuentasPorCobrar.filter(c =>
    c.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.idCliente.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalPorCobrarUSD = cuentasPorCobrar.reduce((acc, c) => acc + c.saldoPendiente, 0);
  const totalPorCobrarNIO = aCordobas(totalPorCobrarUSD, tasaCambio);

  const generarTextoEstadoCuenta = (c: CuentaPorCobrar) => {
    const alDia = c.saldoPendiente <= 0.01;
    const clienteMatch = clientes.find(cl => cl.id === c.idCliente || cl.nombre === c.cliente);
    const pendNIO = aCordobas(c.saldoPendiente, tasaCambio);
    const totNIO = aCordobas(c.totalCreditos, tasaCambio);
    const abonNIO = aCordobas(c.totalAbonado, tasaCambio);

    return `🌸 *VARIEDADES CS - ESTADO DE CUENTA* 🌸
-----------------------------------------
👤 *Cliente:* ${c.cliente} (ID: ${c.idCliente})
${clienteMatch?.telefono ? `📞 *Teléfono:* ${clienteMatch.telefono}\n` : ''}💱 *Tasa de Cambio:* 1 $ USD = C$ ${tasaCambio.toFixed(2)} NIO
-----------------------------------------
📊 *RESUMEN DE CUENTAS POR COBRAR:*
• Total Créditos Otorgados: ${formatoUSD(c.totalCreditos)} (${formatoNIO(totNIO)})
• Total Abonado Acumulado: ${formatoUSD(c.totalAbonado)} (${formatoNIO(abonNIO)})
• *SALDO ACTUAL PENDIENTE:* ${formatoUSD(c.saldoPendiente)}
💵 *EQUIVALENTE EN CÓRDOBAS:* ${formatoNIO(pendNIO)}
• Cantidad de Créditos Activos: ${c.creditosPendientes}
• Estado: ${alDia ? '✅ AL DÍA' : '🔴 PENDIENTE DE PAGO'}
-----------------------------------------
Agradecemos su preferencia y pago puntual en VARIEDADES CS. ¡Estamos a su orden! 💕`;
  };

  const compartirWhatsApp = (c: CuentaPorCobrar) => {
    const texto = generarTextoEstadoCuenta(c);
    const clienteMatch = clientes.find(cl => cl.id === c.idCliente || cl.nombre === c.cliente);
    const encoded = encodeURIComponent(texto);
    let url = `https://api.whatsapp.com/send?text=${encoded}`;
    if (clienteMatch?.telefono) {
      const limpio = clienteMatch.telefono.replace(/[^0-9]/g, '');
      if (limpio.length >= 7) {
        url = `https://api.whatsapp.com/send?phone=${limpio}&text=${encoded}`;
      }
    }
    abrirEnlaceSeguro(url);
  };

  const copiarTexto = (c: CuentaPorCobrar) => {
    const texto = generarTextoEstadoCuenta(c);
    navigator.clipboard.writeText(texto).then(() => {
      setMensajeCopiado(`Estado de cuenta de "${c.cliente}" copiado.`);
      setTimeout(() => setMensajeCopiado(null), 2500);
    });
  };

  return (
    <div className="space-y-4">
      {/* Toast de confirmación de copiado */}
      {mensajeCopiado && (
        <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg animate-fade-in border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{mensajeCopiado}</span>
        </div>
      )}

      {/* Resumen Header Dual Currency */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">Cuentas por Cobrar de Clientes</h3>
          <p className="text-xs text-slate-500">Consolidado general de deudas, abonos y saldos pendientes en Dólares y Córdobas.</p>
        </div>

        <div className="bg-rose-50 border border-rose-200 px-4 py-2.5 rounded-xl text-right">
          <span className="text-[11px] font-semibold text-rose-700 block">Deuda Total Consolidada</span>
          <span className="text-xl font-black text-rose-800 block">{formatoUSD(totalPorCobrarUSD)}</span>
          <span className="text-xs font-bold text-rose-600 block">{formatoNIO(totalPorCobrarNIO)}</span>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente o ID..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 shrink-0">
          Tasa: 1 $ = C$ {tasaCambio.toFixed(2)}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">ID Cliente</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3 text-right">Total Créditos ($ / C$)</th>
                <th className="px-4 py-3 text-right">Total Abonado ($ / C$)</th>
                <th className="px-4 py-3 text-right">Saldo Pendiente ($ / C$)</th>
                <th className="px-4 py-3 text-center">Créditos</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Estado de Cuenta Oficial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtradas.map(c => {
                const alDia = c.saldoPendiente <= 0.01;
                const totNIO = aCordobas(c.totalCreditos, tasaCambio);
                const abonNIO = aCordobas(c.totalAbonado, tasaCambio);
                const saldNIO = aCordobas(c.saldoPendiente, tasaCambio);

                return (
                  <tr key={c.idCliente} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-700">{c.idCliente}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{c.cliente}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-slate-700 block">{formatoUSD(c.totalCreditos)}</span>
                      <span className="text-[10px] text-slate-500 block">{formatoNIO(totNIO)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-emerald-600 block">{formatoUSD(c.totalAbonado)}</span>
                      <span className="text-[10px] text-emerald-600 block">{formatoNIO(abonNIO)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-black text-rose-600 block">{formatoUSD(c.saldoPendiente)}</span>
                      <span className="text-[10px] font-bold text-rose-700 block">{formatoNIO(saldNIO)}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-800">{c.creditosPendientes}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        alDia ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {alDia ? 'AL DÍA' : 'PENDIENTE'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {/* Botón Principal: Enviar como Imagen o Imprimir solo el estado */}
                        <button
                          onClick={() => setCuentaSeleccionada(c)}
                          className="px-2.5 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
                          title="Enviar Estado de Cuenta como Imagen o Imprimir únicamente el estado de cuenta"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Como Imagen / Imprimir</span>
                        </button>

                        <button
                          onClick={() => compartirWhatsApp(c)}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition"
                          title="Enviar texto por WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => copiarTexto(c)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition"
                          title="Copiar texto de estado de cuenta"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No hay cuentas por cobrar registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Estado de Cuenta Oficial (Exportar Imagen / Imprimir únicamente el estado) */}
      {cuentaSeleccionada && (
        <EstadoDeCuentaModal
          cuenta={cuentaSeleccionada}
          clienteInfo={clientes.find(cl => cl.id === cuentaSeleccionada.idCliente || cl.nombre === cuentaSeleccionada.cliente)}
          tasaCambio={tasaCambio}
          onClose={() => setCuentaSeleccionada(null)}
        />
      )}
    </div>
  );
};
