import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Share2, 
  Download, 
  MessageCircle, 
  Copy, 
  CheckCircle2, 
  Calendar, 
  User, 
  CreditCard, 
  Phone,
  Clock,
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';
import { CuentaPorCobrar, Cliente } from '../types';
import { compartirODescargarImagen } from '../utils/imageExport';
import { ThermalPrinterService } from '../utils/thermalPrinter';
import { formatoUSD, formatoNIO, aCordobas } from '../utils/currency';
import { abrirEnlaceSeguro } from '../utils/safeLink';

interface EstadoDeCuentaModalProps {
  cuenta: CuentaPorCobrar;
  clienteInfo?: Cliente;
  tasaCambio?: number;
  onClose: () => void;
}

export const EstadoDeCuentaModal: React.FC<EstadoDeCuentaModalProps> = ({
  cuenta,
  clienteInfo,
  tasaCambio = 36.65,
  onClose
}) => {
  const [generandoImagen, setGenerandoImagen] = useState(false);
  const [notif, setNotif] = useState<string | null>(null);
  const [textoCopiado, setTextoCopiado] = useState(false);

  const fechaHoy = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const horaHoy = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const esAlDia = cuenta.saldoPendiente <= 0.01;

  const saldoPendienteNIO = aCordobas(cuenta.saldoPendiente, tasaCambio);
  const totalCreditosNIO = aCordobas(cuenta.totalCreditos, tasaCambio);
  const totalAbonadoNIO = aCordobas(cuenta.totalAbonado, tasaCambio);

  // 1. Exportar y enviar como imagen PNG completa
  const handleExportarComoImagen = async () => {
    setGenerandoImagen(true);
    setNotif(null);
    const nombreArchivo = `EstadoDeCuenta_${cuenta.cliente.replace(/\s+/g, '_')}_VariedadesCS.png`;
    
    const res = await compartirODescargarImagen(
      'estado-cuenta-documento',
      nombreArchivo,
      `Estado de Cuenta - ${cuenta.cliente} (VARIEDADES CS)`
    );

    setGenerandoImagen(false);
    if (res.success) {
      setNotif(res.mensaje);
      setTimeout(() => setNotif(null), 4000);
    } else {
      setNotif(res.mensaje);
    }
  };

  // 2. Imprimir solo el estado de cuenta
  const handleImprimirSoloEstado = () => {
    ThermalPrinterService.imprimirVentanaTermica('estado-cuenta-documento', 'auto');
  };

  // 3. Generar texto para WhatsApp
  const generarTextoWhatsApp = () => {
    return `🌸 *VARIEDADES CS - ESTADO DE CUENTA OFICIAL* 🌸
================================
👤 *Cliente:* ${cuenta.cliente}
🆔 *ID Cliente:* ${cuenta.idCliente}
${clienteInfo?.telefono ? `📞 *Teléfono:* ${clienteInfo.telefono}\n` : ''}📅 *Fecha de Emisión:* ${fechaHoy} - ${horaHoy}
💱 *Tasa de Cambio:* 1 $ USD = C$ ${tasaCambio.toFixed(2)} NIO
================================
📊 *DETALLE FINANCIERO MULTI-MONEDA:*
• Total Créditos Otorgados: ${formatoUSD(cuenta.totalCreditos)} (${formatoNIO(totalCreditosNIO)})
• Total Abonado Acumulado: ${formatoUSD(cuenta.totalAbonado)} (${formatoNIO(totalAbonadoNIO)})
🔴 *CRÉDITO: MONTO A DEBER:* *${formatoUSD(cuenta.saldoPendiente)}*
💵 *EQUIVALENTE EN CÓRDOBAS:* *${formatoNIO(saldoPendienteNIO)}*
• Créditos Activos: ${cuenta.creditosPendientes}
• Estado: ${esAlDia ? '✅ AL DÍA (SIN DEUDA)' : '🔴 PENDIENTE DE PAGO'}
================================
✨ *VARIEDADES CS* • Perfumes, Cremas, Bolsos, Ropa y Variedades.
Agradecemos su pago puntual. ¡Estamos a su orden! 💕`;
  };

  // 4. Compartir por WhatsApp directo
  const handleWhatsApp = () => {
    const texto = generarTextoWhatsApp();
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

  // 5. Copiar texto
  const handleCopiarTexto = () => {
    const texto = generarTextoWhatsApp();
    navigator.clipboard.writeText(texto).then(() => {
      setTextoCopiado(true);
      setTimeout(() => setTextoCopiado(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-scale-in my-auto flex flex-col max-h-[95vh]">
        
        {/* Cabecera del modal */}
        <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-pink-100" />
            <div>
              <h3 className="font-bold text-sm">Estado de Cuenta Oficial</h3>
              <p className="text-[11px] text-pink-100">Documento imprimible y compartible en imagen</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificación flotante interna */}
        {notif && (
          <div className="bg-slate-900 text-white px-4 py-2 text-xs flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notif}</span>
          </div>
        )}

        {/* CONTENEDOR DOCUMENTO: Este contenedor con ID es el que se captura en imagen */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100 flex-1 flex justify-center items-start">
          
          <div 
            id="estado-cuenta-documento" 
            className="w-full max-w-[420px] bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4 font-sans text-slate-800"
          >
            {/* Header del Negocio */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-md mb-2">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="font-black text-xl tracking-tight text-slate-900">VARIEDADES CS</h2>
              <p className="text-[11px] font-semibold text-pink-600 uppercase tracking-widest">
                Boutique & Perfumería Exclusiva
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                Comprobante de Estado de Cuenta y Cobranza
              </p>
            </div>

            {/* Datos del Cliente */}
            <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 border border-slate-200">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Cliente:
                </span>
                <span className="font-extrabold text-slate-900">{cuenta.cliente}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">ID Cliente:</span>
                <span className="font-mono font-bold text-slate-700">{cuenta.idCliente}</span>
              </div>

              {clienteInfo?.telefono && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Teléfono:
                  </span>
                  <span className="font-mono text-slate-700">{clienteInfo.telefono}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Fecha de Emisión:
                </span>
                <span className="font-semibold text-slate-700">{fechaHoy} - {horaHoy}</span>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 font-medium">Tasa Oficial:</span>
                <span className="font-bold text-blue-600">1 $ USD = C$ {tasaCambio.toFixed(2)} NIO</span>
              </div>
            </div>

            {/* BLOQUE DESTACADO: CRÉDITO - MONTO A DEBER (MULTI-MONEDA) */}
            <div className={`p-4 rounded-2xl border-2 text-center shadow-xs ${
              esAlDia 
                ? 'bg-emerald-50 border-emerald-300' 
                : 'bg-rose-50 border-rose-300'
            }`}>
              <span className={`text-[11px] font-black uppercase tracking-wider block ${
                esAlDia ? 'text-emerald-800' : 'text-rose-800'
              }`}>
                {esAlDia ? 'ESTADO FINANCIERO' : 'CRÉDITO: MONTO A DEBER'}
              </span>

              <div className={`text-3xl sm:text-4xl font-black font-mono tracking-tight my-1 ${
                esAlDia ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {formatoUSD(cuenta.saldoPendiente)}
              </div>

              <div className={`text-base font-extrabold font-mono ${
                esAlDia ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                = {formatoNIO(saldoPendienteNIO)}
              </div>

              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide mt-1">
                {esAlDia ? (
                  <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                    ✓ CUENTA AL DÍA - SIN DEUDA PENDIENTE
                  </span>
                ) : (
                  <span className="bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full">
                    🔴 PENDIENTE DE COBRO / {cuenta.creditosPendientes} CRÉDITO(S)
                  </span>
                )}
              </div>
            </div>

            {/* Desglose de Totales */}
            <div className="space-y-2 py-1 text-xs">
              <div className="flex justify-between items-baseline text-slate-600">
                <span>Total de Créditos Otorgados:</span>
                <span className="font-bold text-slate-900 text-right">
                  {formatoUSD(cuenta.totalCreditos)}
                  <span className="text-[10px] text-slate-500 block font-normal">{formatoNIO(totalCreditosNIO)}</span>
                </span>
              </div>

              <div className="flex justify-between items-baseline text-emerald-700">
                <span>Total Abonado Acumulado:</span>
                <span className="font-bold text-emerald-800 text-right">
                  {formatoUSD(cuenta.totalAbonado)}
                  <span className="text-[10px] text-emerald-600 block font-normal">{formatoNIO(totalAbonadoNIO)}</span>
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Créditos Activos Registrados:</span>
                <span className="font-bold text-slate-900">{cuenta.creditosPendientes} cuenta(s)</span>
              </div>
            </div>

            {/* Política y Saludo */}
            <div className="pt-3 border-t border-dashed border-slate-300 text-center space-y-1.5 text-[10px] text-slate-500">
              <p className="font-bold text-slate-800 text-[11px]">
                ¡Gracias por su preferencia y pago puntual!
              </p>
              <p className="leading-snug">
                Por higiene y autenticidad en perfumería, cosméticos y artículos de uso personal, no se aceptan devoluciones.
              </p>
              <p className="text-[9px] text-slate-400 font-mono pt-1">
                VARIEDADES CS • Comprobante Digital Oficial
              </p>
            </div>

          </div>

        </div>

        {/* Barra de Acciones Inferior */}
        <div className="p-3 sm:px-5 sm:py-3.5 bg-white border-t border-slate-200 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            
            {/* Copiar texto y cerrar */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopiarTexto}
                className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition"
              >
                {textoCopiado ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{textoCopiado ? '¡Copiado!' : 'Copiar Texto'}</span>
              </button>

              <button
                onClick={handleWhatsApp}
                className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>

            {/* Botones de Exportar Imagen e Imprimir solo estado */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleImprimirSoloEstado}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Imprimir únicamente este comprobante de estado de cuenta"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Imprimir</span>
              </button>

              <button
                onClick={handleExportarComoImagen}
                disabled={generandoImagen}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Generar imagen PNG para enviar a clientes por WhatsApp o descargar"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{generandoImagen ? 'Generando...' : 'Enviar Imagen'}</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
