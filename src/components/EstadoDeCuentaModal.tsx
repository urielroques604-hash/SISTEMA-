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

interface EstadoDeCuentaModalProps {
  cuenta: CuentaPorCobrar;
  clienteInfo?: Cliente;
  onClose: () => void;
}

export const EstadoDeCuentaModal: React.FC<EstadoDeCuentaModalProps> = ({
  cuenta,
  clienteInfo,
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
================================
📊 *DETALLE FINANCIERO:*
• Total Créditos Otorgados: $${cuenta.totalCreditos.toFixed(2)}
• Total Abonado Acumulado: $${cuenta.totalAbonado.toFixed(2)}
🔴 *CRÉDITO: MONTO A DEBER:* *$${cuenta.saldoPendiente.toFixed(2)}*
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
    window.open(url, '_blank', 'noopener,noreferrer');
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
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
        
        {/* Barra superior de control */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-pink-400" />
            <div>
              <h3 className="font-bold text-sm">Estado de Cuenta de Cliente</h3>
              <p className="text-[10px] text-slate-400">Listo para enviar como imagen o imprimir únicamente el comprobante</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificación flotante de estado de imagen */}
        {notif && (
          <div className="px-4 py-2 bg-emerald-50 text-emerald-800 border-b border-emerald-200 text-xs font-bold flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notif}</span>
          </div>
        )}

        {/* Área imprimible / exportable como imagen */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 flex justify-center">
          
          <div 
            id="estado-cuenta-documento"
            className="w-full max-w-md bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4 text-slate-800"
          >
            {/* Encabezado con Logo y Marca */}
            <div className="text-center pb-3 border-b border-slate-200 space-y-1">
              <div className="w-14 h-14 rounded-full overflow-hidden mx-auto border-2 border-pink-300 bg-pink-50 p-0.5 shadow-2xs">
                <img 
                  src="/logo.jpg" 
                  alt="Logo VARIEDADES CS"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              </div>
              <h2 className="font-black text-lg text-slate-900 tracking-tight">
                VARIEDADES CS
              </h2>
              <p className="text-[11px] font-bold text-pink-700">
                Perfumes • Cremas • Bolsos • Calzado • Ropa • Variedades
              </p>
              <div className="inline-block px-3 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-black tracking-wider uppercase mt-1">
                ESTADO DE CUENTA OFICIAL
              </div>
            </div>

            {/* Datos del Cliente y Emisión */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Cliente:
                </span>
                <span className="font-black text-slate-900 text-right">{cuenta.cliente}</span>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 font-medium">ID Cliente:</span>
                <span className="font-mono font-bold text-slate-700">{cuenta.idCliente}</span>
              </div>

              {clienteInfo?.telefono && (
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Teléfono:
                  </span>
                  <span className="font-bold text-slate-700">{clienteInfo.telefono}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Fecha de Emisión:
                </span>
                <span className="font-semibold text-slate-700">{fechaHoy} - {horaHoy}</span>
              </div>
            </div>

            {/* BLOQUE DESTACADO: CRÉDITO - MONTO A DEBER */}
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
                ${cuenta.saldoPendiente.toFixed(2)}
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
              <div className="flex justify-between text-slate-600">
                <span>Total de Créditos Otorgados:</span>
                <span className="font-bold text-slate-900">${cuenta.totalCreditos.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-emerald-700">
                <span>Total Abonado Acumulado:</span>
                <span className="font-bold text-emerald-800">${cuenta.totalAbonado.toFixed(2)}</span>
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
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                  textoCopiado 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {textoCopiado ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                <span>{textoCopiado ? '¡Copiado!' : 'Copiar Texto'}</span>
              </button>

              <button
                onClick={onClose}
                className="hidden sm:inline-flex px-3.5 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition"
              >
                Cerrar
              </button>
            </div>

            {/* Acciones principales: WhatsApp, Imagen e Imprimir */}
            <div className="grid grid-cols-3 gap-2">
              
              {/* WhatsApp */}
              <button
                onClick={handleWhatsApp}
                className="px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                title="Compartir texto por WhatsApp"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span className="truncate">WhatsApp</span>
              </button>

              {/* Enviar / Descargar como Imagen */}
              <button
                id="btn-enviar-estado-imagen"
                onClick={handleExportarComoImagen}
                disabled={generandoImagen}
                className="px-3 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                title="Descargar o compartir como imagen PNG completa"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span className="truncate">{generandoImagen ? 'Generando...' : 'Como Imagen'}</span>
              </button>

              {/* Imprimir solo estado de cuenta */}
              <button
                id="btn-imprimir-estado-cuenta"
                onClick={handleImprimirSoloEstado}
                className="px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                title="Imprimir únicamente el estado de cuenta limpio"
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span className="truncate">Imprimir</span>
              </button>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
