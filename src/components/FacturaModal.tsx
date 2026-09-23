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
  RefreshCw,
  Building2,
  UserCheck,
  FileCheck,
  ShieldCheck,
  MapPin,
  Clock
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
  tasaCambio = 36.62,
  onClose
}) => {
  const lineas = ventas.filter(v => v.numeroVenta === numeroVenta);
  if (!lineas.length) return null;

  const cabecera = lineas[0];
  const tasaVenta = cabecera.tasaCambio || tasaCambio || 36.62;
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

  // Modo de diseño: 'factura' (Factura Empresarial A4), 'telefono' (Comprobante digital móvil) o 'pos' (Ticket térmico)
  const [modoDiseno, setModoDiseno] = useState<'factura' | 'telefono' | 'pos'>(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 'factura' : 'factura';
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
      asunto: `Factura Comercial ${cabecera.numeroVenta} - VARIEDADES CS`,
      cuerpoHtml: html,
      cuerpoTexto: `Adjuntamos la factura comercial de su compra ${cabecera.numeroVenta} en VARIEDADES CS emitida por ${cabecera.usuario}. Total: $${total.toFixed(2)} (C$ ${totalNIO.toFixed(2)}). ¡Muchas gracias por su preferencia!`
    });

    setEnviandoGmail(false);
    if (res.success) {
      setNotifGmail({ tipo: 'ok', texto: `¡Factura enviada exitosamente a ${emailDestinoGmail}!` });
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

  // Conectar maquinita Bluetooth
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

  // Lanzar impresión
  const imprimirFactura = () => {
    const elementoId = modoDiseno === 'factura' 
      ? 'factura-diseno-empresarial' 
      : (modoDiseno === 'telefono' ? 'factura-diseno-telefono' : 'ticket-impresion-termica');
    const ancho = modoDiseno === 'pos' ? anchoTicket : 'auto';
    ThermalPrinterService.imprimirVentanaTermica(elementoId, ancho);
  };

  // Exportar / compartir comprobante como imagen PNG completa
  const handleCompartirComoImagen = async () => {
    setGenerandoImagen(true);
    setNotifImagen(null);
    const elementoId = modoDiseno === 'factura' 
      ? 'factura-diseno-empresarial' 
      : (modoDiseno === 'telefono' ? 'factura-diseno-telefono' : 'ticket-impresion-termica');
    const sufijo = modoDiseno === 'factura' ? 'Factura_Empresarial' : (modoDiseno === 'telefono' ? 'Digital_Movil' : 'Ticket_POS');
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

    return `🌸 *VARIEDADES CS - FACTURA COMERCIAL OFICIAL* 🌸
================================
📄 *FACTURA N°:* ${cabecera.numeroVenta}
📅 *Fecha & Hora:* ${cabecera.fecha}
🧑‍💼 *ATENDIDO POR:* ${cabecera.usuario}
👤 *Cliente:* ${cabecera.cliente || 'Consumidor Final'}
💳 *Forma de Pago:* ${cabecera.formaPago}
💵 *Tasa de Cambio Oficial:* 1 $ USD = C$ ${tasaVenta.toFixed(2)} NIO
${cabecera.numCredito ? `📝 *N° Crédito:* ${cabecera.numCredito}\n` : ''}================================
🛍️ *DETALLE DE ARTÍCULOS:*
${lineasTexto}
================================
📦 *Total Artículos:* ${totalArticulos} unidad(es)
💰 *TOTAL A PAGAR:* *$${total.toFixed(2)} USD* (C$ ${totalNIO.toFixed(2)} Córdobas)${textoEfectivo}
================================
🧑‍💼 *Vendedor Responsable:* ${cabecera.usuario}
✨ ¡Gracias por confiar en VARIEDADES CS!
🚫 *POLÍTICA:* Por higiene y autenticidad en perfumería, cosméticos y artículos personales, no se aceptan devoluciones de producto una vez retirado.
📍 *VARIEDADES CS* • Managua, Nicaragua • Perfumes, Bolsos, Cosméticos, Calzado y Variedades.`;
  };

  // Copiar el texto completo de la factura
  const copiarTextoFactura = () => {
    const texto = generarTextoWhatsApp();
    navigator.clipboard.writeText(texto).then(() => {
      setTextoCopiado(true);
      setTimeout(() => setTextoCopiado(false), 2500);
    });
  };

  // Compartir directamente por WhatsApp
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
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center z-50 p-0 sm:p-4 overflow-y-auto">
      <div className="bg-slate-50 w-full sm:max-w-4xl sm:rounded-3xl border-0 sm:border border-slate-200 overflow-hidden flex flex-col min-h-screen sm:min-h-0 sm:max-h-[96vh] shadow-2xl">
        
        {/* Barra superior de encabezado y selector de diseño */}
        <div className="px-4 py-3 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-pink-300 bg-pink-50 flex items-center justify-center shrink-0 shadow-xs">
                <img 
                  src="/logo.jpg" 
                  alt="Logo" 
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                    Factura Comercial de Venta
                  </h3>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                    {cabecera.numeroVenta}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-emerald-600" />
                    <span>Atendido por: <strong>{cabecera.usuario}</strong></span>
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  {cabecera.fecha} • Venta Corporativa y al Detalle
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

          {/* Pestañas de Selección de Diseño: Factura Empresarial, Digital Móvil, Ticket POS */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold w-full sm:w-auto overflow-x-auto">
              {/* Opción 1: Factura Empresarial A4 / Carta */}
              <button
                onClick={() => setModoDiseno('factura')}
                className={`px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition shrink-0 ${
                  modoDiseno === 'factura'
                    ? 'bg-white text-slate-900 shadow-xs font-black border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Factura Empresarial</span>
                <span className="text-[9px] px-1 py-0.2 bg-indigo-100 text-indigo-800 rounded font-bold ml-0.5">
                  100% Empresa
                </span>
              </button>

              {/* Opción 2: Teléfono Móvil */}
              <button
                onClick={() => setModoDiseno('telefono')}
                className={`px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition shrink-0 ${
                  modoDiseno === 'telefono'
                    ? 'bg-white text-slate-900 shadow-xs font-black border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-pink-600" />
                <span>Digital Móvil</span>
              </button>

              {/* Opción 3: Ticket POS */}
              <button
                onClick={() => setModoDiseno('pos')}
                className={`px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition shrink-0 ${
                  modoDiseno === 'pos'
                    ? 'bg-white text-slate-900 shadow-xs font-black border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Receipt className="w-3.5 h-3.5 text-blue-600" />
                <span>Ticket POS (Térmico)</span>
              </button>
            </div>

            {/* Opciones cuando está en Ticket POS */}
            {modoDiseno === 'pos' && (
              <div className="flex items-center gap-2">
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

        {/* CONTENEDOR PRINCIPAL DE VISUALIZACIÓN */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100 flex justify-center items-start">
          
          {/* ========================================================= */}
          {/* 1. FACTURA COMERCIAL EMPRESARIAL (100% PROFESIONAL A4)   */}
          {/* ========================================================= */}
          {modoDiseno === 'factura' && (
            <div 
              id="factura-diseno-empresarial"
              className="w-full max-w-2xl bg-white rounded-2xl shadow-md border border-slate-300 text-slate-800 p-6 sm:p-8 font-sans transition-all my-2"
            >
              {/* Encabezado Corporativo Formal */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-slate-900">
                <div className="flex items-start gap-3.5">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 bg-pink-50 p-1 shrink-0 shadow-xs">
                    <img 
                      src="/logo.jpg" 
                      alt="VARIEDADES CS" 
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                      VARIEDADES CS
                    </h1>
                    <p className="text-xs font-bold text-pink-700 uppercase tracking-wide">
                      Comercializadora y Distribuidora de Variedades
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Perfumería Fina • Cosméticos • Calzado • Ropa • Accesorios
                    </p>
                    <div className="text-[10px] text-slate-600 mt-1 space-y-0.5">
                      <p className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>Managua, Nicaragua</span>
                      </p>
                      <p className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>WhatsApp / Ventas: +505 8888-8888 • Email: variedadescs.online@gmail.com</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cuadro Oficial de Factura */}
                <div className="bg-slate-900 text-white rounded-2xl p-4 min-w-[210px] border border-slate-800 shadow-sm shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-center">
                    COMPROBANTE FISCAL
                  </span>
                  <h3 className="text-center font-black text-base text-white tracking-wide mt-0.5">
                    FACTURA DE VENTA
                  </h3>
                  <div className="text-center text-rose-400 font-mono font-black text-lg mt-1 tracking-wider">
                    {cabecera.numeroVenta}
                  </div>
                  <div className="border-t border-slate-800 mt-2 pt-2 text-[10px] text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Fecha:</span>
                      <span className="font-bold">{cabecera.fecha}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Condición:</span>
                      <span className="font-extrabold text-amber-300 uppercase">{cabecera.formaPago}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ficha Corporativa: Datos del Cliente y Atendido Por */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-slate-200 text-xs">
                {/* Columna Cliente */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    DATOS DEL CLIENTE / FACTURAR A:
                  </span>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Cliente:</span>
                    <span className="font-black text-slate-900">{cabecera.cliente || 'Consumidor Final'}</span>
                  </div>
                  {clienteInfo?.telefono && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Teléfono:</span>
                      <span className="font-medium text-slate-800">{clienteInfo.telefono}</span>
                    </div>
                  )}
                  {clienteInfo?.cedula && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Cédula / RUC:</span>
                      <span className="font-medium text-slate-800">{clienteInfo.cedula}</span>
                    </div>
                  )}
                  {clienteInfo?.direccion && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Dirección:</span>
                      <span className="font-medium text-slate-800 text-right truncate max-w-[160px]">{clienteInfo.direccion}</span>
                    </div>
                  )}
                </div>

                {/* Columna Datos del Personal & Operación */}
                <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 block mb-1">
                    PERSONAL RESPONSABLE & ATENCIÓN:
                  </span>
                  
                  {/* ATENDIDO POR DESTACADO */}
                  <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-blue-200 shadow-2xs">
                    <span className="text-blue-900 font-extrabold flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      Atendido por:
                    </span>
                    <span className="font-black text-blue-950 text-sm tracking-wide">
                      {cabecera.usuario}
                    </span>
                  </div>

                  <div className="flex justify-between pt-1">
                    <span className="text-slate-600 font-semibold">Puesto:</span>
                    <span className="font-bold text-slate-800">Asesor de Ventas & Caja</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-semibold">Tasa Oficial:</span>
                    <span className="font-bold text-slate-800">1 USD = C$ {tasaVenta.toFixed(2)} NIO</span>
                  </div>
                  {cabecera.numCredito && (
                    <div className="flex justify-between text-rose-700 font-bold">
                      <span>N° Crédito:</span>
                      <span>{cabecera.numCredito}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tabla Empresarial de Productos */}
              <div className="py-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3 rounded-l-lg">#</th>
                      <th className="py-2.5 px-3">Código</th>
                      <th className="py-2.5 px-3">Descripción del Producto</th>
                      <th className="py-2.5 px-2 text-center">Cant.</th>
                      <th className="py-2.5 px-3 text-right">P. Unit ($)</th>
                      <th className="py-2.5 px-3 text-right">Total ($)</th>
                      <th className="py-2.5 px-3 rounded-r-lg text-right">Total (C$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {lineas.map((it, idx) => {
                      const totalItemCordobas = it.total * tasaVenta;
                      const unitItemCordobas = it.precioUnitario * tasaVenta;
                      return (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                          <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700 text-[11px]">{it.codigo}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-900 block leading-tight">{it.producto}</span>
                            {it.marca && <span className="text-[10px] text-slate-500 font-medium">Marca: {it.marca}</span>}
                          </td>
                          <td className="py-2.5 px-2 text-center font-extrabold text-slate-900">{it.cantidad}</td>
                          <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                            ${it.precioUnitario.toFixed(2)}
                            <span className="text-[10px] text-slate-400 block font-normal">C$ {unitItemCordobas.toFixed(2)}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-900">
                            ${it.total.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-slate-800">
                            C$ {totalItemCordobas.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Resumen Financiero y Totales Desglosados */}
              <div className="pt-3 pb-6 border-t-2 border-slate-200 flex flex-col sm:flex-row justify-between items-start gap-4">
                {/* Notas Comerciales */}
                <div className="space-y-1.5 text-[11px] text-slate-600 max-w-sm">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-800 flex items-center gap-1 mb-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Garantía & Política de Empresa:
                    </p>
                    <p className="text-[10px] leading-relaxed text-slate-500">
                      Mercadería revisada a entera satisfacción. Por higiene y autenticidad en perfumería, cosméticos y artículos personales, no se admiten devoluciones una vez retirado el producto.
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Total de artículos entregados: <strong>{totalArticulos} unidades</strong>.
                  </p>
                </div>

                {/* Caja de Totales */}
                <div className="w-full sm:w-72 bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-bold text-slate-800">${total.toFixed(2)} USD</span>
                  </div>
                  {cabecera.descuento !== undefined && cabecera.descuento > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Descuento Comercial:</span>
                      <span>-${cabecera.descuento.toFixed(2)} USD</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Impuestos (Exento):</span>
                    <span>$0.00</span>
                  </div>

                  <div className="border-t border-slate-300 pt-2 mt-2">
                    <div className="flex justify-between items-baseline">
                      <span className="font-black text-slate-900 text-sm">TOTAL USD:</span>
                      <span className="font-black text-xl text-slate-900 tracking-tight">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline mt-0.5">
                      <span className="font-extrabold text-blue-900 text-xs">TOTAL CÓRDOBAS:</span>
                      <span className="font-black text-base text-blue-900">
                        C$ {totalNIO.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {cabecera.efectivoRecibido !== undefined && cabecera.efectivoRecibido > 0 && (
                    <div className="border-t border-dashed border-slate-300 pt-2 text-[11px] space-y-0.5 text-slate-700">
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
              </div>

              {/* Firmas de Responsabilidad Corporativa */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-dashed border-slate-300 text-center text-xs">
                <div>
                  <div className="border-b border-slate-400 pb-1 mx-4"></div>
                  <p className="font-black text-slate-900 mt-1.5 text-xs uppercase">
                    {cabecera.usuario}
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    Atendido por / Firma & Sello de Entrega
                  </p>
                </div>
                <div>
                  <div className="border-b border-slate-400 pb-1 mx-4"></div>
                  <p className="font-black text-slate-900 mt-1.5 text-xs uppercase">
                    {cabecera.cliente || 'Consumidor Final'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    Recibido Conforme / Cliente
                  </p>
                </div>
              </div>

              <div className="mt-6 text-center text-[10px] text-slate-400">
                VARIEDADES CS • Sistema Empresarial de Ventas e Inventario • Documento emitido electrónicamente
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. DISEÑO DE TELÉFONO (COMPROBANTE DIGITAL MÓVIL MODERNO) */}
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
                <div className="mt-2 flex items-center justify-center gap-2 text-xs flex-wrap">
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
                    Fecha:
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

                {/* Atendido por destacado */}
                <div className="flex justify-between items-center p-2 rounded-xl bg-blue-50 border border-blue-200 text-[11px]">
                  <span className="text-blue-900 font-bold flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    Atendido por:
                  </span>
                  <span className="text-blue-950 font-black">{cabecera.usuario}</span>
                </div>

                {cabecera.numCredito && (
                  <div className="flex justify-between items-center text-[11px] p-1.5 bg-blue-50 text-blue-800 rounded-lg font-bold border border-blue-200">
                    <span>Crédito Vinculado:</span>
                    <span>{cabecera.numCredito}</span>
                  </div>
                )}
              </div>

              {/* Lista Desglosada de Productos */}
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
                        <span className="text-[10px] text-slate-400">
                          C$ {(it.total * tasaVenta).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pie con Políticas */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 text-center space-y-1.5">
                <p className="text-[11px] font-bold text-slate-700">
                  ¡Gracias por su compra en VARIEDADES CS!
                </p>
                <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[10px] font-bold leading-tight">
                  🚫 NOTA IMPORTANTE: Por higiene, sellado y autenticidad en cosméticos y artículos de cuidado personal, NO SE ACEPTAN CAMBIOS NI DEVOLUCIONES una vez entregado el producto.
                </div>
                <p className="text-[9px] text-slate-400">
                  Atendido por: {cabecera.usuario} • Comprobante oficial de venta
                </p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. TICKET TÉRMICO PARA IMPRESORA MINI POS (80mm / 58mm)   */}
          {/* ========================================================= */}
          {modoDiseno === 'pos' && (
            <div 
              id="ticket-impresion-termica"
              className={`bg-white text-slate-950 font-mono shadow-sm border border-slate-300 p-4 leading-tight transition-all my-auto mx-auto ${
                anchoTicket === '58mm' ? 'w-[280px] text-[10px]' : 'w-[360px] text-xs'
              }`}
            >
              {/* Encabezado Térmico */}
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-full overflow-hidden mx-auto border border-slate-400">
                  <img 
                    src="/logo.jpg" 
                    alt="Logo" 
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                </div>
                <h2 className="font-extrabold text-sm tracking-wide">
                  VARIEDADES CS
                </h2>
                <p className="text-[10px] font-bold text-slate-600">
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
                <div className="flex justify-between font-bold text-slate-900 bg-slate-100 p-1 rounded">
                  <span>Atendido por:</span>
                  <span>{cabecera.usuario}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Forma Pago:</span>
                  <span className="font-bold">{cabecera.formaPago}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Tasa Oficial:</span>
                  <span>1 USD = C$ {tasaVenta.toFixed(2)}</span>
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

                <div className="divide-y divide-dotted divide-slate-300 py-1">
                  {lineas.map((it, idx) => (
                    <div key={idx} className="py-1 flex justify-between items-start gap-1">
                      <div className="flex-1 min-w-0 pr-1">
                        <p className="font-bold leading-tight truncate">{it.producto}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {it.cantidad}x @ ${it.precioUnitario.toFixed(2)} (C$ {(it.precioUnitario * tasaVenta).toFixed(2)})
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold">${it.total.toFixed(2)}</span>
                        <span className="text-[9px] text-slate-500 block">
                          C$ {(it.total * tasaVenta).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-dashed border-slate-400 my-2"></div>

              {/* Totales Térmico */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Artículos:</span>
                  <span>{totalArticulos} unid.</span>
                </div>

                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Subtotal:</span>
                  <span>${total.toFixed(2)} USD</span>
                </div>

                <div className="flex justify-between font-black text-base border-t border-slate-400 pt-1 mt-1">
                  <span>TOTAL A PAGAR:</span>
                  <span>${total.toFixed(2)} USD</span>
                </div>

                <div className="flex justify-between font-bold text-xs text-slate-800">
                  <span>TOTAL CÓRDOBAS:</span>
                  <span>C$ {totalNIO.toFixed(2)} NIO</span>
                </div>

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
                <p className="text-[9px] text-slate-700 font-semibold">
                  Atendido por: {cabecera.usuario}
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
        {/* BARRA DE ACCIONES INFERIOR (COMPLETA Y PROFESIONAL)        */}
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
                <span>{textoCopiado ? '¡Copiado!' : 'Copiar Factura'}</span>
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
                className="px-2.5 sm:px-3 py-2.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                title="Enviar factura oficial por Gmail"
              >
                <Mail className="w-4 h-4 shrink-0" />
                <span className="truncate">Gmail</span>
              </button>

              {/* Compartir por WhatsApp */}
              <button
                onClick={compartirWhatsAppDirecto}
                className="px-2.5 sm:px-3.5 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                title="Compartir comprobante por WhatsApp"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span className="truncate">WhatsApp</span>
              </button>

              {/* Descargar o Compartir como Imagen PNG completa */}
              <button
                onClick={handleCompartirComoImagen}
                disabled={generandoImagen}
                className="px-2.5 sm:px-3.5 py-2.5 sm:py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                title="Descargar imagen PNG completa de la factura"
              >
                <ImageIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">{generandoImagen ? 'Generando...' : 'Imagen PNG'}</span>
              </button>

              {/* Imprimir Factura Entera */}
              <button
                onClick={imprimirFactura}
                className="px-3 sm:px-4 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                title="Imprimir factura completa"
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span className="truncate">Imprimir Factura</span>
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
                    <p className="text-[11px] text-slate-500">Factura {cabecera.numeroVenta} • Atendido por: {cabecera.usuario}</p>
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
                  value={emailDestinoGmail}
                  onChange={e => setEmailDestinoGmail(e.target.value)}
                  placeholder="cliente@ejemplo.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {notifGmail && (
                <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  notifGmail.tipo === 'ok' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {notifGmail.tipo === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
                  <span>{notifGmail.texto}</span>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setModalGmailAbierto(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={ejecutarEnvioFacturaGmail}
                  disabled={enviandoGmail}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                >
                  {enviandoGmail ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar Factura</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
