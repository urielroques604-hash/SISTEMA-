import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  X, 
  Bluetooth, 
  CheckCircle2, 
  AlertCircle, 
  Download,
  Share2, 
  Image as ImageIcon,
  MessageCircle,
  Copy,
  Smartphone,
  Receipt,
  Sparkles,
  ShoppingBag,
  Calendar,
  User,
  CreditCard,
  Phone,
  Check,
  Mail,
  Send,
  RefreshCw
} from 'lucide-react';
import { VentaRegistro, Cliente } from '../types';
import { ThermalPrinterService } from '../utils/thermalPrinter';
import { compartirODescargarImagen } from '../utils/imageExport';
import { getAccessToken, googleSignIn } from '../services/gmailAuth';
import { enviarCorreoGmail, generarHtmlFactura } from '../services/gmailService';
import { abrirEnlaceSeguro } from '../utils/safeLink';

interface FacturaModalProps {
  numeroVenta: string;
  ventas: VentaRegistro[];
  clientes?: Cliente[];
  tasaCambio?: number;
  onClose: () => void;
}

export const FacturaModal: React.FC<FacturaModalProps> = ({
  numeroVenta,
  ventas,
  clientes = [],
  tasaCambio = 36.65,
  onClose
}) => {
  const lineas = ventas.filter(v => v.numeroVenta === numeroVenta);
  if (!lineas.length) return null;

  const cabecera = lineas[0];
  const tasaVenta = cabecera.tasaCambio || tasaCambio || 36.65;
  const total = lineas.reduce((acc, it) => acc + it.total, 0);
  const totalNIO = total * tasaVenta;
  const totalArticulos = lineas.reduce((acc, it) => acc + it.cantidad, 0);

  // Buscar información adicional del cliente si existe
  const clienteInfo = clientes.find(c => 
    (cabecera.idCliente && c.id === cabecera.idCliente) || 
    (cabecera.cliente && c.nombre.toLowerCase().trim() === cabecera.cliente.toLowerCase().trim())
  );

  // Detectar si la pantalla es móvil para seleccionar diseño por defecto
  const [esPantallaMovil, setEsPantallaMovil] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });

  // Modo de diseño: 'telefono' (Comprobante digital móvil) o 'pos' (Ticket térmico para maquinita)
  const [modoDiseno, setModoDiseno] = useState<'telefono' | 'pos'>(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 'telefono' : 'telefono';
  });

  const [anchoTicket, setAnchoTicket] = useState<'80mm' | '58mm'>('80mm');
  const [maquinitaConectada, setMaquinitaConectada] = useState<string | null>(null);
  const [mensajeMaquinita, setMensajeMaquinita] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);
  const [conectando, setConectando] = useState(false);
  const [generandoImagen, setGenerandoImagen] = useState(false);
  const [notifImagen, setNotifImagen] = useState<string | null>(null);
  const [textoCopiado, setTextoCopiado] = useState(false);

  // Estados de integración con Gmail
  const [modalGmailAbierto, setModalGmailAbierto] = useState(false);
  const [emailDestinoGmail, setEmailDestinoGmail] = useState(() => {
    return clienteInfo?.direccion && clienteInfo.direccion.includes('@') ? clienteInfo.direccion.trim() : '';
  });
  const [enviandoGmail, setEnviandoGmail] = useState(false);
  const [notifGmail, setNotifGmail] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  const abrirModalGmail = async () => {
    setNotifGmail(null);
    const token = await getAccessToken();
    if (!token) {
      try {
        await googleSignIn();
      } catch (err: any) {
        setNotifGmail({ tipo: 'err', texto: 'Requiere iniciar sesión con Google para enviar por Gmail.' });
        return;
      }
    }
    setModalGmailAbierto(true);
  };

  const ejecutarEnvioFacturaGmail = async () => {
    if (!emailDestinoGmail || !emailDestinoGmail.includes('@')) {
      setNotifGmail({ tipo: 'err', texto: 'Por favor ingrese un correo electrónico válido.' });
      return;
    }

    setEnviandoGmail(true);
    setNotifGmail(null);

    const html = generarHtmlFactura(cabecera.numeroVenta, lineas, clienteInfo);
    const res = await enviarCorreoGmail({
      para: emailDestinoGmail.trim(),
      asunto: `Comprobante de Venta ${cabecera.numeroVenta} - VARIEDADES CS`,
      cuerpoHtml: html,
      cuerpoTexto: `Adjuntamos el comprobante digital de su compra ${cabecera.numeroVenta} en VARIEDADES CS. Total: $${total.toFixed(2)}. ¡Muchas gracias por su preferencia!`
    });

    setEnviandoGmail(false);
    if (res.success) {
      setNotifGmail({ tipo: 'ok', texto: `¡Comprobante enviado exitosamente a ${emailDestinoGmail}!` });
      setTimeout(() => {
        setModalGmailAbierto(false);
        setNotifGmail(null);
      }, 2500);
    } else {
      setNotifGmail({ tipo: 'err', texto: res.error || 'Error al enviar por Gmail' });
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const movil = window.innerWidth < 768;
      setEsPantallaMovil(movil);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Lanzar impresión garantizando la factura entera sin recortes
  const imprimirFactura = () => {
    const elementoId = modoDiseno === 'telefono' ? 'factura-diseno-telefono' : 'ticket-impresion-termica';
    const ancho = modoDiseno === 'pos' ? anchoTicket : 'auto';
    ThermalPrinterService.imprimirVentanaTermica(elementoId, ancho);
  };

  // Exportar / compartir comprobante como imagen PNG completa
  const handleCompartirComoImagen = async () => {
    setGenerandoImagen(true);
    setNotifImagen(null);
    const elementoId = modoDiseno === 'telefono' ? 'factura-diseno-telefono' : 'ticket-impresion-termica';
    const sufijo = modoDiseno === 'telefono' ? 'Digital_Movil' : 'Ticket_POS';
    const nombreArchivo = `Factura_${cabecera.numeroVenta}_${sufijo}_VariedadesCS.png`;
    
    const res = await compartirODescargarImagen(
      elementoId,
      nombreArchivo,
      `Factura ${cabecera.numeroVenta} - VARIEDADES CS`
    );
    setGenerandoImagen(false);
    if (res.success) {
      setNotifImagen(res.mensaje);
      setTimeout(() => setNotifImagen(null), 4000);
    } else {
      setMensajeMaquinita({ tipo: 'err', texto: res.mensaje });
    }
  };

  // Generar texto estructurado para WhatsApp
  const generarTextoWhatsApp = () => {
    const lineasTexto = lineas.map(it => {
      const itNIO = (it.total * tasaVenta).toFixed(2);
      const itUnitNIO = (it.precioUnitario * tasaVenta).toFixed(2);
      return `• ${it.cantidad}x ${it.producto} ($${it.precioUnitario.toFixed(2)} / C$ ${itUnitNIO}) = *$${it.total.toFixed(2)}* (C$ ${itNIO})`;
    }).join('\n');

    let textoEfectivo = '';
    if (cabecera.efectivoRecibido && cabecera.efectivoRecibido > 0) {
      const recNIO = (cabecera.efectivoRecibido * tasaVenta).toFixed(2);
      const camNIO = ((cabecera.cambio || 0) * tasaVenta).toFixed(2);
      textoEfectivo = `\n💵 *Efectivo Recibido:* $${cabecera.efectivoRecibido.toFixed(2)} (C$ ${recNIO})\n🪙 *Cambio / Vuelto:* $${(cabecera.cambio || 0).toFixed(2)} (C$ ${camNIO})`;
    }

    return `🌸 *VARIEDADES CS - DE TODO UN POCO* 🌸
================================
📄 *COMPROBANTE OFICIAL DE COMPRA*
🔖 *Factura N°:* ${cabecera.numeroVenta}
📅 *Fecha:* ${cabecera.fecha}
👤 *Cliente:* ${cabecera.cliente || 'Consumidor Final'}
🧑‍💼 *Atendido por:* ${cabecera.usuario}
💳 *Forma de Pago:* ${cabecera.formaPago}
💵 *Tasa Oficial:* 1 $ USD = C$ ${tasaVenta.toFixed(2)} NIO
${cabecera.numCredito ? `📝 *N° Crédito:* ${cabecera.numCredito}\n` : ''}================================
🛍️ *DETALLE DE COMPRA:*
${lineasTexto}
================================
📦 *Total Artículos:* ${totalArticulos} unidad(es)
💰 *TOTAL A PAGAR:* *$${total.toFixed(2)} USD* (C$ ${totalNIO.toFixed(2)} Córdobas)${textoEfectivo}
================================
✨ ¡Muchas gracias por su preferencia! ✨
🚫 *POLÍTICA:* Por higiene, sellado y autenticidad en perfumería, cosméticos y artículos de uso personal, NO SE ACEPTAN CAMBIOS NI DEVOLUCIONES de producto una vez retirado.
📍 *VARIEDADES CS* • Perfumes, Cremas, Bolsos, Calzado, Ropa y Variedades.`;
  };

  // Copiar el texto completo de la factura
  const copiarTextoFactura = () => {
    const texto = generarTextoWhatsApp();
    navigator.clipboard.writeText(texto).then(() => {
      setTextoCopiado(true);
      setTimeout(() => setTextoCopiado(false), 2500);
    });
  };

  // Compartir directamente por WhatsApp (si el cliente tiene teléfono, abre su chat)
  const compartirWhatsAppDirecto = () => {
    const texto = generarTextoWhatsApp();
    const encoded = encodeURIComponent(texto);
    let url = `https://api.whatsapp.com/send?text=${encoded}`;

    const tel = clienteInfo?.telefono;
    if (tel) {
      const limpio = tel.replace(/[^0-9]/g, '');
      if (limpio.length >= 7) {
        url = `https://api.whatsapp.com/send?phone=${limpio}&text=${encoded}`;
      }
    }

    abrirEnlaceSeguro(url);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-0 sm:p-4 overflow-y-auto">
      <div className="bg-slate-50 w-full sm:max-w-2xl sm:rounded-2xl border-0 sm:border border-slate-200 overflow-hidden flex flex-col min-h-screen sm:min-h-0 sm:max-h-[94vh] shadow-2xl">
        
        {/* Barra superior de encabezado y selector de diseño */}
        <div className="px-4 py-3 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-pink-300 bg-pink-50 flex items-center justify-center shrink-0 shadow-xs">
                <img 
                  src="/logo.jpg" 
                  alt="Logo" 
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
                    Factura de Venta
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                    {cabecera.numeroVenta}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  {cabecera.fecha} • {cabecera.usuario}
                </p>
              </div>
            </div>

            <button 
              onClick={onClose} 
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Pestañas de Selección de Diseño: Teléfono Móvil vs Ticket POS */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold w-full sm:w-auto">
              <button
                onClick={() => setModoDiseno('telefono')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
                  modoDiseno === 'telefono'
                    ? 'bg-white text-slate-900 shadow-xs font-extrabold border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-pink-600" />
                <span>Diseño Teléfono</span>
                <span className="text-[9px] px-1 py-0.2 bg-pink-100 text-pink-800 rounded font-semibold ml-0.5">
                  Digital
                </span>
              </button>

              <button
                onClick={() => setModoDiseno('pos')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
                  modoDiseno === 'pos'
                    ? 'bg-white text-slate-900 shadow-xs font-extrabold border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Receipt className="w-3.5 h-3.5 text-blue-600" />
                <span>Ticket POS</span>
                <span className="text-[9px] px-1 py-0.2 bg-slate-200 text-slate-700 rounded font-semibold ml-0.5">
                  Papel
                </span>
              </button>
            </div>

            {/* Opciones cuando está en Ticket POS */}
            {modoDiseno === 'pos' && (
              <div className="hidden sm:flex items-center gap-2">
                <select
                  value={anchoTicket}
                  onChange={e => setAnchoTicket(e.target.value as '80mm' | '58mm')}
                  className="p-1 border border-slate-200 rounded text-xs bg-white text-slate-700 font-semibold outline-none"
                >
                  <option value="80mm">Papel 80 mm (Estándar)</option>
                  <option value="58mm">Papel 58 mm (Mini POS)</option>
                </select>
                <button
                  onClick={conectarMaquinita}
                  disabled={conectando}
                  className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition ${
                    maquinitaConectada
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-white hover:bg-slate-700'
                  }`}
                  title="Conectar a impresora bluetooth"
                >
                  <Bluetooth className="w-3 h-3" />
                  <span>{maquinitaConectada ? 'Conectado' : 'Maquinita'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Notificaciones flotantes en el modal */}
        {notifImagen && (
          <div className="px-4 py-2 text-xs flex items-center gap-2 bg-emerald-50 text-emerald-800 border-b border-emerald-200 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{notifImagen}</span>
          </div>
        )}

        {mensajeMaquinita && (
          <div className={`px-4 py-2 text-xs flex items-center gap-2 border-b shrink-0 ${
            mensajeMaquinita.tipo === 'ok' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            {mensajeMaquinita.tipo === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{mensajeMaquinita.texto}</span>
          </div>
        )}

        {/* CONTENEDOR PRINCIPAL DE VISUALIZACIÓN COMPLETA (ENTERA) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100 flex justify-center items-start">
          
          {/* ========================================================= */}
          {/* 1. DISEÑO DE TELÉFONO (COMPROBANTE DIGITAL MÓVIL MODERNO) */}
          {/* ========================================================= */}
          {modoDiseno === 'telefono' && (
            <div 
              id="factura-diseno-telefono"
              className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 text-slate-800 overflow-hidden transition-all my-auto"
            >
              {/* Encabezado Chic de la Boutique */}
              <div className="bg-gradient-to-b from-pink-50/90 to-white p-5 border-b border-pink-100 text-center relative">
                <div className="inline-flex p-1 rounded-full bg-white shadow-xs border-2 border-pink-300 mb-2">
                  <img 
                    src="/logo.jpg" 
                    alt="VARIEDADES CS" 
                    className="w-16 h-16 object-cover rounded-full"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                </div>

                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-wider uppercase">
                  VARIEDADES CS
                </h2>
                <p className="text-[11px] font-bold text-pink-700">
                  Perfumes • Cremas • Bolsos • Calzado • Ropa • Variedades
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Comprobante Oficial de Compra
                </p>

                <div className="mt-2.5 flex items-center justify-center gap-1.5 flex-wrap">
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    cabecera.estado === 'ANULADA' 
                      ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {cabecera.estado === 'ANULADA' ? '● VENTA ANULADA' : '✓ VENTA COMPLETADA'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                    N° {cabecera.numeroVenta}
                  </span>
                </div>
              </div>

              {/* Bloque Destacado de Monto Total y Pago */}
              <div className="p-4 bg-slate-900 text-white text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Monto Total Facturado
                </span>
                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  ${total.toFixed(2)}
                </div>
                <div className="text-sm font-extrabold text-amber-300 mt-0.5">
                  = C$ {totalNIO.toFixed(2)} NIO
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Tasa Oficial: 1 $ USD = C$ {tasaVenta.toFixed(2)}
                </div>
                <div className="mt-2 flex items-center justify-center gap-2 text-xs">
                  <span className="px-2 py-0.5 bg-slate-800 rounded-md text-pink-300 font-semibold border border-slate-700">
                    Forma: {cabecera.formaPago}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-800 rounded-md text-slate-300">
                    {totalArticulos} {totalArticulos === 1 ? 'artículo' : 'artículos'}
                  </span>
                </div>

                {cabecera.formaPago === 'Crédito' && (
                  <div className="mt-3 p-2.5 bg-rose-600 text-white rounded-xl font-black text-center text-xs tracking-wider uppercase flex flex-col items-center justify-center gap-0.5 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4" />
                      <span>CRÉDITO: MONTO A DEBER: ${total.toFixed(2)}</span>
                    </div>
                    <span className="text-amber-200 text-[11px] font-extrabold">
                      = C$ {totalNIO.toFixed(2)} CÓRDOBAS
                    </span>
                  </div>
                )}
              </div>

              {/* Ficha de Detalles de la Transacción */}
              <div className="p-4 bg-slate-50/70 border-b border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Fecha y Hora:
                  </span>
                  <span className="font-semibold text-slate-800">{cabecera.fecha}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Cliente:
                  </span>
                  <span className="font-bold text-slate-900 text-right">
                    {cabecera.cliente || 'Consumidor Final'}
                  </span>
                </div>

                {clienteInfo?.telefono && (
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      Teléfono:
                    </span>
                    <span className="font-semibold text-slate-700">{clienteInfo.telefono}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 font-medium">Cajero(a):</span>
                  <span className="text-slate-700 font-semibold">{cabecera.usuario}</span>
                </div>

                {cabecera.numCredito && (
                  <div className="flex justify-between items-center text-[11px] p-1.5 bg-blue-50 text-blue-800 rounded-lg font-bold border border-blue-200">
                    <span>Crédito Vinculado:</span>
                    <span>{cabecera.numCredito}</span>
                  </div>
                )}
              </div>

              {/* Lista Desglosada de Productos (Diseño Móvil Cómodo y Legible) */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                  <span>Productos Comprados ({lineas.length})</span>
                  <span>Subtotal</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {lineas.map((it, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center shrink-0 border border-blue-100">
                          {it.cantidad}x
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-slate-900 leading-snug">
                            {it.producto}
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            ${it.precioUnitario.toFixed(2)} c/u • <span className="font-mono">{it.codigo}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-black text-xs text-slate-900 block">
                          ${it.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumen Financiero Completo */}
              <div className="p-4 bg-slate-50 border-t border-dashed border-slate-300 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-medium">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Prendas / Artículos:</span>
                  <span className="font-bold">{totalArticulos} unidades</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>TOTAL A PAGAR:</span>
                  <span className="text-blue-600 text-base">${total.toFixed(2)}</span>
                </div>

                {cabecera.efectivoRecibido !== undefined && cabecera.efectivoRecibido > 0 && (
                  <div className="pt-2 mt-1 border-t border-slate-200 grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Efectivo Recibido</span>
                      <span className="font-bold text-slate-800">${cabecera.efectivoRecibido.toFixed(2)}</span>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                      <span className="text-[10px] text-emerald-700 font-bold block">Cambio / Vuelto</span>
                      <span className="font-black text-emerald-800 text-sm">
                        ${(cabecera.cambio || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Pie de Comprobante Móvil con Políticas de Perfumería */}
              <div className="p-4 bg-white border-t border-slate-100 text-center space-y-1.5">
                <p className="font-bold text-xs text-slate-800">
                  ¡Gracias por su compra en VARIEDADES CS! ✨
                </p>
                <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-center">
                  <p className="text-[10px] font-black text-rose-700 uppercase tracking-wide">
                    POLÍTICA: NO SE ACEPTAN CAMBIOS NI DEVOLUCIONES
                  </p>
                  <p className="text-[9px] text-slate-600 mt-0.5">
                    Por higiene, sellado y autenticidad en perfumería, cosméticos y artículos personales, no se realizan cambios ni devoluciones una vez retirado el producto.
                  </p>
                </div>
                <div className="pt-1 text-[9px] font-mono text-slate-400 tracking-wider uppercase">
                  ID DIGITAL: {cabecera.numeroVenta}-{Math.abs(total * 100).toFixed(0)}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. DISEÑO TICKET TÉRMICO POS (PAPEL 80mm / 58mm MAQUINITA) */}
          {/* ========================================================= */}
          {modoDiseno === 'pos' && (
            <div
              id="ticket-impresion-termica"
              style={{ width: anchoTicket === '58mm' ? '260px' : '330px' }}
              className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-slate-300 text-slate-900 font-mono text-xs transition-all my-auto"
            >
              {/* Logo y Encabezado Térmico */}
              <div className="text-center pb-2">
                <img
                  src="/logo.jpg"
                  alt="Logo VARIEDADES CS"
                  className="w-20 h-20 mx-auto object-contain rounded-lg mb-2 shadow-xs"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
                <h3 className="font-extrabold text-sm sm:text-base tracking-wider text-slate-900 uppercase">
                  VARIEDADES CS
                </h3>
                <p className="text-[10px] text-slate-700 font-sans font-bold mt-0.5">
                  Perfumería, Bolsos, Calzado & Ropa
                </p>
                <p className="text-[9px] text-slate-500">
                  De Todo Un Poco • Venta Oficial
                </p>
              </div>

              <div className="border-t border-dashed border-slate-400 my-2"></div>

              {/* Metadatos Ticket */}
              <div className="space-y-1 text-[11px] leading-tight">
                <div className="flex justify-between">
                  <span className="text-slate-600">Ticket N°:</span>
                  <span className="font-bold">{cabecera.numeroVenta}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Fecha:</span>
                  <span>{cabecera.fecha}</span>
                </div>
                {cabecera.cliente && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Cliente:</span>
                    <span className="font-semibold text-slate-800">{cabecera.cliente}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-600">Atendido por:</span>
                  <span>{cabecera.usuario}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Forma Pago:</span>
                  <span className="font-bold">{cabecera.formaPago}</span>
                </div>
                {cabecera.numCredito && (
                  <div className="flex justify-between text-blue-600 font-bold">
                    <span>N° Crédito:</span>
                    <span>{cabecera.numCredito}</span>
                  </div>
                )}
                {cabecera.estado === 'ANULADA' && (
                  <div className="my-1 p-1 bg-rose-100 text-rose-800 font-black text-center rounded text-[10px]">
                    *** VENTA ANULADA ***
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-slate-400 my-2"></div>

              {/* Detalle de Productos Térmico */}
              <div className="text-[11px]">
                <div className="flex justify-between font-bold text-slate-700 pb-1 border-b border-slate-200 text-[10px] uppercase">
                  <span>Cant. / Producto</span>
                  <span>Total</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {lineas.map((it, idx) => (
                    <div key={idx} className="py-1.5">
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-900 leading-snug">
                          <strong className="text-blue-600 mr-1">{it.cantidad}x</strong>
                          {it.producto}
                        </span>
                        <span className="font-bold text-slate-900 ml-2">
                          ${it.total.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 pl-4">
                        (${it.precioUnitario.toFixed(2)} c/u) • {it.codigo}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-dashed border-slate-400 my-2"></div>

              {/* Totales Térmicos */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Artículos totales:</span>
                  <span className="font-bold">{totalArticulos} unid.</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Subtotal:</span>
                  <span>${total.toFixed(2)} (C$ {totalNIO.toFixed(2)})</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base font-black text-slate-900 border-t border-slate-400 pt-1">
                  <span>TOTAL A PAGAR:</span>
                  <div className="text-right">
                    <span className="text-blue-600 block">${total.toFixed(2)}</span>
                    <span className="text-emerald-700 text-xs block font-bold">C$ {totalNIO.toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-right text-[9px] text-slate-500 font-mono">
                  Tasa: 1 $ USD = C$ {tasaVenta.toFixed(2)} NIO
                </div>

                {cabecera.formaPago === 'Crédito' && (
                  <div className="mt-2 p-2 bg-rose-50 border-2 border-rose-500 rounded-lg text-rose-950 font-black text-center text-xs uppercase tracking-wide">
                    🔴 CRÉDITO: MONTO A DEBER: ${total.toFixed(2)}
                    {cabecera.fechaVencimiento && (
                      <div className="text-[10px] font-semibold text-slate-600 mt-0.5 normal-case">
                        Fecha límite de pago: {cabecera.fechaVencimiento}
                      </div>
                    )}
                  </div>
                )}

                {cabecera.efectivoRecibido !== undefined && cabecera.efectivoRecibido > 0 && (
                  <div className="pt-1.5 border-t border-dashed border-slate-300 text-[11px] space-y-0.5 text-slate-700">
                    <div className="flex justify-between">
                      <span>Efectivo Recibido:</span>
                      <span className="font-bold">${cabecera.efectivoRecibido.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-emerald-800">
                      <span>Cambio / Vuelto:</span>
                      <span>${(cabecera.cambio || 0).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-slate-400 my-2.5"></div>

              {/* Pie de Ticket Térmico */}
              <div className="text-center space-y-1 text-[10px] text-slate-600 font-sans">
                <p className="font-bold text-slate-900 text-[11px]">
                  ¡Gracias por su compra en VARIEDADES CS!
                </p>
                <p className="text-[9px] text-rose-700 font-extrabold uppercase">
                  *** NO SE ACEPTAN CAMBIOS NI DEVOLUCIONES ***
                </p>
                <p className="text-[8px] text-slate-500">
                  Por higiene y autenticidad de artículos personales.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* ========================================================= */}
        {/* BARRA DE ACCIONES INFERIOR (OPTIMIZADA PARA TELÉFONO Y PC) */}
        {/* ========================================================= */}
        <div className="p-3 sm:px-5 sm:py-3.5 bg-white border-t border-slate-200 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            
            {/* Botón copiar texto y cierre en PC */}
            <div className="flex items-center gap-2">
              <button
                onClick={copiarTextoFactura}
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

            {/* Acciones Principales: WhatsApp, Gmail, Descargar Imagen e Imprimir */}
            <div className="grid grid-cols-2 sm:flex items-center gap-2">
              
              {/* Enviar por Gmail */}
              <button
                onClick={abrirModalGmail}
                className="px-2.5 sm:px-3 py-2.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                title="Enviar comprobante digital por Gmail"
              >
                <Mail className="w-4 h-4 shrink-0" />
                <span className="truncate">Gmail</span>
              </button>

              {/* Compartir por WhatsApp */}
              <button
                onClick={compartirWhatsAppDirecto}
                className="px-2.5 sm:px-3.5 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                title="Compartir comprobante por WhatsApp"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span className="truncate">WhatsApp</span>
              </button>

              {/* Descargar o Compartir como Imagen PNG completa */}
              <button
                onClick={handleCompartirComoImagen}
                disabled={generandoImagen}
                className="px-2.5 sm:px-3.5 py-2.5 sm:py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                title="Descargar imagen PNG completa de la factura"
              >
                <ImageIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">{generandoImagen ? 'Generando...' : 'Imagen PNG'}</span>
              </button>

              {/* Imprimir Factura Entera */}
              <button
                onClick={imprimirFactura}
                className="px-3 sm:px-4 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                title="Imprimir factura completa"
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span className="truncate">Imprimir</span>
              </button>
            </div>

            {/* Botón Cerrar en móvil al pie */}
            <button
              onClick={onClose}
              className="sm:hidden w-full py-2 text-center text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Cerrar ventana
            </button>

          </div>
        </div>

        {/* Modal de Envío directo por Gmail con Confirmación Obligatoria */}
        {modalGmailAbierto && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Enviar Factura por Gmail</h3>
                    <p className="text-[11px] text-slate-500">Venta {cabecera.numeroVenta} • Total: ${total.toFixed(2)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setModalGmailAbierto(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correo Electrónico del Cliente:
                </label>
                <input
                  type="email"
                  placeholder="cliente@ejemplo.com"
                  value={emailDestinoGmail}
                  onChange={(e) => setEmailDestinoGmail(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500 outline-hidden font-medium"
                />
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs text-slate-600 space-y-1">
                <p><strong>Asunto:</strong> Comprobante de Venta {cabecera.numeroVenta} - VARIEDADES CS</p>
                <p><strong>Contenido:</strong> Formato digital HTML con membrete oficial, desglose de {totalArticulos} producto(s) y políticas de perfumería.</p>
              </div>

              {notifGmail && (
                <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  notifGmail.tipo === 'ok' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {notifGmail.tipo === 'ok' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                  <span>{notifGmail.texto}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalGmailAbierto(false)}
                  disabled={enviandoGmail}
                  className="px-3.5 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={ejecutarEnvioFacturaGmail}
                  disabled={enviandoGmail || !emailDestinoGmail}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {enviandoGmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{enviandoGmail ? 'Enviando...' : 'Confirmar y Enviar'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
