import React, { useState } from 'react';
import { 
  Printer, 
  X, 
  Bluetooth, 
  CheckCircle2, 
  AlertCircle, 
  Share2, 
  Copy, 
  DollarSign, 
  Calendar, 
  User, 
  CreditCard,
  MessageCircle,
  Image as ImageIcon
} from 'lucide-react';
import { Credito, Abono, Cliente } from '../types';
import { ThermalPrinterService } from '../utils/thermalPrinter';
import { compartirODescargarImagen } from '../utils/imageExport';
import { abrirEnlaceSeguro } from '../utils/safeLink';

interface ComprobanteCreditoModalProps {
  credito: Credito;
  abono?: Abono | null;
  clienteInfo?: Cliente | null;
  tasaCambio?: number;
  onClose: () => void;
}

export const ComprobanteCreditoModal: React.FC<ComprobanteCreditoModalProps> = ({
  credito,
  abono,
  clienteInfo,
  tasaCambio = 36.65,
  onClose
}) => {
  const tc = credito.tasaCambio || abono?.tasaCambio || tasaCambio || 36.65;
  const [anchoTicket, setAnchoTicket] = useState<'80mm' | '58mm'>('80mm');
  const [maquinitaConectada, setMaquinitaConectada] = useState<string | null>(null);
  const [mensajeMaquinita, setMensajeMaquinita] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);
  const [conectando, setConectando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [generandoImagen, setGenerandoImagen] = useState(false);
  const [notifImagen, setNotifImagen] = useState<string | null>(null);

  // Conectar maquinita bluetooth
  const conectarMaquinita = async () => {
    setConectando(true);
    setMensajeMaquinita(null);
    const res = await ThermalPrinterService.conectarBluetooth();
    setConectando(false);
    if (res.success) {
      setMaquinitaConectada(res.deviceName || 'Impresora Térmica');
      setMensajeMaquinita({ tipo: 'ok', texto: res.mensaje });
    } else {
      setMensajeMaquinita({ tipo: 'err', texto: res.mensaje });
    }
  };

  // Lanzar impresión térmica optimizada para la maquinita
  const imprimirTicket = () => {
    ThermalPrinterService.imprimirVentanaTermica('ticket-abono-termica', anchoTicket);
  };

  // Exportar / compartir comprobante como imagen PNG para WhatsApp
  const handleCompartirComoImagen = async () => {
    setGenerandoImagen(true);
    setNotifImagen(null);
    const prefijo = abono ? `Comprobante_Abono_${abono.numeroAbono}` : `Estado_Credito_${credito.numeroCredito}`;
    const nombreArchivo = `${prefijo}_VariedadesCS.png`;
    const res = await compartirODescargarImagen(
      'ticket-abono-termica',
      nombreArchivo,
      abono ? `Comprobante de Abono ${abono.numeroAbono}` : `Crédito ${credito.numeroCredito}`
    );
    setGenerandoImagen(false);
    if (res.success) {
      setNotifImagen(res.mensaje);
      setTimeout(() => setNotifImagen(null), 4000);
    } else {
      setMensajeMaquinita({ tipo: 'err', texto: res.mensaje });
    }
  };

  // Generar texto para compartir por WhatsApp
  const generarTextoRecibo = () => {
    const esAbonoEspecifico = !!abono;
    const titulo = esAbonoEspecifico ? 'COMPROBANTE DE ABONO A CRÉDITO' : 'ESTADO DE CUENTA DE CRÉDITO';
    const fecha = abono ? abono.fecha : credito.fecha;
    const abonoUSD = abono ? abono.montoAbonado : credito.abonado;
    const abonoNIO = abono ? (abono.montoAbonadoCordobas || (abono.montoAbonado * tc)) : (credito.abonadoCordobas || (credito.abonado * tc));
    const montoAbonadoStr = `$${abonoUSD.toFixed(2)} USD (C$ ${abonoNIO.toFixed(2)} NIO)`;
    const metodoPagoStr = abono ? abono.metodoPago : 'Varios';
    const observacionesStr = abono ? abono.observaciones : 'Crédito en cuenta';

    const totCredNIO = (credito.totalCredito * tc).toFixed(2);
    const totAbonNIO = (credito.abonado * tc).toFixed(2);
    const saldoNIO = (credito.saldo * tc).toFixed(2);

    return `🌸 *VARIEDADES CS - BOUTIQUE & ACCESORIOS* 🌸
------------------------------------------------
📄 *${titulo}*
${abono ? `🔖 *N° Abono:* ${abono.numeroAbono}\n` : ''}💳 *N° Crédito:* ${credito.numeroCredito}
🛒 *Venta Asociada:* ${credito.numeroVenta}
📅 *Fecha:* ${fecha}
👤 *Cliente:* ${credito.cliente}
💵 *Tasa Oficial:* 1 $ USD = C$ ${tc.toFixed(2)} NIO
${clienteInfo?.telefono ? `📞 *Teléfono:* ${clienteInfo.telefono}\n` : ''}------------------------------------------------
${esAbonoEspecifico ? `💵 *MONTO ABONADO HOY:* ${montoAbonadoStr}\n💳 *Forma de Pago:* ${metodoPagoStr}\n📝 *Detalle:* ${observacionesStr}\n------------------------------------------------\n` : ''}📊 *RESUMEN DE CUENTA:*
• Total Original Crédito: $${credito.totalCredito.toFixed(2)} (C$ ${totCredNIO})
• Total Abonado a la Fecha: $${credito.abonado.toFixed(2)} (C$ ${totAbonNIO})
• *SALDO PENDIENTE:* *$${credito.saldo.toFixed(2)} USD* (C$ ${saldoNIO} NIO)
• *Estado:* ${credito.saldo <= 0.01 ? '✅ PAGADO TOTALMENTE' : '🟡 PENDIENTE DE PAGO'}
• *Vencimiento:* ${credito.vencimiento}
------------------------------------------------
¡Muchas gracias por su preferencia y puntualidad! 💕`;
  };

  const copiarAlPortapapeles = () => {
    const texto = generarTextoRecibo();
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  const compartirWhatsApp = () => {
    const texto = generarTextoRecibo();
    const encoded = encodeURIComponent(texto);
    let url = `https://api.whatsapp.com/send?text=${encoded}`;
    
    if (clienteInfo?.telefono) {
      const limpio = clienteInfo.telefono.replace(/[^0-9]/g, '');
      if (limpio.length >= 7) {
        url = `https://api.whatsapp.com/send?phone=${limpio}&text=${encoded}`;
      }
    }

    abrirEnlaceSeguro(url);
  };

  const esPagado = credito.saldo <= 0.01;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Barra superior de control */}
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <span className="text-xs font-bold text-slate-800">
              {abono ? 'Comprobante Oficial de Abono' : 'Estado de Cuenta de Crédito'}
            </span>
            <span className="text-[10px] text-slate-500 block">
              Crédito: {credito.numeroCredito} {abono ? `| Abono: ${abono.numeroAbono}` : ''}
            </span>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Panel de Conexión y Acciones de Maquinita */}
        <div className="p-3 bg-pink-50/60 border-b border-pink-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={conectarMaquinita}
              disabled={conectando}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition text-xs shadow-xs ${
                maquinitaConectada
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              <Bluetooth className="w-3.5 h-3.5" />
              <span>
                {conectando 
                  ? 'Buscando...' 
                  : maquinitaConectada 
                  ? `Conectado: ${maquinitaConectada}` 
                  : 'Conectar Maquinita'}
              </span>
            </button>

            <select
              value={anchoTicket}
              onChange={e => setAnchoTicket(e.target.value as '80mm' | '58mm')}
              className="p-1.5 border border-slate-200 rounded text-[11px] bg-white text-slate-700 font-semibold outline-none"
            >
              <option value="80mm">Papel 80 mm (Estándar)</option>
              <option value="58mm">Papel 58 mm (Mini POS)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCompartirComoImagen}
              disabled={generandoImagen}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
              title="Compartir o descargar comprobante como imagen (PNG) para WhatsApp"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{generandoImagen ? 'Generando...' : 'Compartir como Imagen'}</span>
            </button>

            <button
              onClick={compartirWhatsApp}
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition"
              title="Compartir texto por WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Texto</span>
            </button>

            <button
              onClick={imprimirTicket}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {notifImagen && (
          <div className="px-4 py-2 text-xs flex items-center gap-2 bg-emerald-50 text-emerald-800 border-b border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{notifImagen}</span>
          </div>
        )}

        {/* Mensajes de estado de Bluetooth si hubiere */}
        {mensajeMaquinita && (
          <div className={`px-4 py-2 text-xs flex items-center gap-2 border-b ${
            mensajeMaquinita.tipo === 'ok' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            {mensajeMaquinita.tipo === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="flex-1 text-[11px]">{mensajeMaquinita.texto}</span>
          </div>
        )}

        {/* Vista previa del Comprobante / Ticket Térmico */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100 flex justify-center">
          <div 
            id="ticket-abono-termica"
            className={`bg-white p-5 border border-slate-300 shadow-md font-mono text-slate-800 ${
              anchoTicket === '58mm' ? 'w-[280px] text-[11px]' : 'w-[360px] text-xs'
            }`}
            style={{ fontFamily: 'monospace' }}
          >
            {/* Header con Logo de VARIEDADES CS */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300 mb-3">
              <div className="flex justify-center mb-2">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-pink-400 p-0.5 shadow-xs bg-white">
                  <img 
                    src="/logo.jpg" 
                    alt="Logo VARIEDADES CS" 
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              <h2 className="font-extrabold text-sm tracking-wider text-slate-900 uppercase">
                VARIEDADES CS
              </h2>
              <p className="text-[10px] text-slate-600 font-sans font-medium">Perfumería & Fragancias Originales</p>
              <p className="text-[10px] text-slate-500">Comprobante de Crédito & Cobranza</p>

              <div className="mt-2 pt-1 border-t border-dotted border-slate-200 text-center">
                <span className="inline-block px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded">
                  {abono ? 'COMPROBANTE DE ABONO' : 'ESTADO DE CUENTA CRÉDITO'}
                </span>
              </div>
            </div>

            {/* Metadatos del Comprobante */}
            <div className="space-y-1 mb-3 text-[11px] border-b border-dashed border-slate-300 pb-2">
              {abono && (
                <div className="flex justify-between font-bold text-slate-900">
                  <span>N° Abono:</span>
                  <span>{abono.numeroAbono}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>N° Crédito:</span>
                <span className="font-bold text-blue-700">{credito.numeroCredito}</span>
              </div>
              <div className="flex justify-between">
                <span>Venta Asociada:</span>
                <span className="font-mono">{credito.numeroVenta}</span>
              </div>
              <div className="flex justify-between">
                <span>Fecha / Hora:</span>
                <span>{abono ? abono.fecha : credito.fecha}</span>
              </div>
              <div className="flex justify-between">
                <span>Cliente:</span>
                <span className="font-bold text-right">{credito.cliente}</span>
              </div>
              {clienteInfo?.telefono && (
                <div className="flex justify-between">
                  <span>Teléfono:</span>
                  <span>{clienteInfo.telefono}</span>
                </div>
              )}
            </div>

            {/* Cuadro destacado de abono si aplica */}
            {abono && (
              <div className="my-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
                <div className="text-[10px] uppercase font-bold text-emerald-700 mb-0.5">Abono Aplicado:</div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-semibold">Monto Pagado:</span>
                  <span className="text-base font-extrabold text-emerald-800">
                    +${abono.montoAbonado.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-emerald-700 mt-1">
                  <span>Método de Pago:</span>
                  <span className="font-bold">{abono.metodoPago}</span>
                </div>
                {abono.observaciones && (
                  <div className="text-[10px] text-emerald-600 mt-1 border-t border-emerald-200 pt-1 italic">
                    "{abono.observaciones}"
                  </div>
                )}
              </div>
            )}

            {/* Resumen Financiero Completo */}
            <div className="space-y-1.5 py-2 border-b border-dashed border-slate-300 text-[11px]">
              <div className="flex justify-between">
                <span>Total Crédito Otorgado:</span>
                <span className="font-semibold">${credito.totalCredito.toFixed(2)} (C$ {(credito.totalCredito * tc).toFixed(2)})</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Total Abonado Acumulado:</span>
                <span className="font-semibold">${credito.abonado.toFixed(2)} (C$ {(credito.abonado * tc).toFixed(2)})</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-xs font-bold text-slate-900">
                <span className="text-rose-900 font-extrabold uppercase">CRÉDITO: MONTO A DEBER:</span>
                <div className="text-right">
                  <span className={`text-base font-black font-mono block ${esPagado ? 'text-emerald-600' : 'text-rose-600'}`}>
                    ${credito.saldo.toFixed(2)}
                  </span>
                  <span className="text-xs font-black text-rose-800 block">
                    = C$ {(credito.saldo * tc).toFixed(2)} NIO
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
                <span>Tasa Oficial Aplicada:</span>
                <span className="font-mono font-bold">1 $ USD = C$ {tc.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-[10px] pt-1">
                <span>Estado Actual:</span>
                <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${
                  esPagado 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {esPagado ? 'PAGADO TOTALMENTE' : 'PENDIENTE DE PAGO'}
                </span>
              </div>

              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Fecha Límite / Vencimiento:</span>
                <span>{credito.vencimiento}</span>
              </div>
            </div>

            {/* Footer Ticket */}
            <div className="text-center pt-3 space-y-1">
              <p className="font-bold text-[11px] text-slate-800">¡GRACIAS POR SU PAGO PUNTUAL!</p>
              <p className="text-[9px] text-slate-500">
                Conserve este comprobante para cualquier aclaración sobre su cuenta.
              </p>
              <p className="text-[8px] text-slate-400 font-sans">
                VARIEDADES CS • Tu estilo, nuestra pasión
              </p>
              <div className="pt-2 text-[8px] text-slate-400 font-mono tracking-widest">
                * * * * * * * * * * * * * * * * * *
              </div>
            </div>
          </div>
        </div>

        {/* Barra inferior con acciones rápidas */}
        <div className="p-4 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={copiarAlPortapapeles}
            className={`px-3 py-2 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              copiado 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700' 
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {copiado ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            <span>{copiado ? '¡Copiado al Portapapeles!' : 'Copiar Comprobante'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCompartirComoImagen}
              disabled={generandoImagen}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              title="Descargar o compartir comprobante en formato imagen PNG"
            >
              <ImageIcon className="w-4 h-4" />
              <span>{generandoImagen ? 'Generando...' : 'Comprobante Imagen (PNG)'}</span>
            </button>

            <button
              onClick={compartirWhatsApp}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Texto</span>
            </button>

            <button
              onClick={imprimirTicket}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir en Maquinita</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
