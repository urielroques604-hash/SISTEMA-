import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  RefreshCw, 
  Inbox, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Users, 
  Sparkles, 
  Search, 
  ExternalLink, 
  LogOut, 
  Clock, 
  Package, 
  Receipt,
  UserCheck
} from 'lucide-react';
import { 
  initAuth, 
  googleSignIn, 
  googleSignOut, 
  getAccessToken, 
  getCurrentGoogleUser 
} from '../services/gmailAuth';
import { 
  enviarCorreoGmail, 
  listarMensajesGmail, 
  CorreoDetalle, 
  generarHtmlFactura, 
  generarHtmlReporteInventario 
} from '../services/gmailService';
import { Cliente, VentaRegistro, Producto } from '../types';

interface GmailViewProps {
  clientes: Cliente[];
  ventas: VentaRegistro[];
  productos: Producto[];
}

export const GmailView: React.FC<GmailViewProps> = ({
  clientes,
  ventas,
  productos
}) => {
  // Estado de Autenticación
  const [estaConectado, setEstaConectado] = useState(false);
  const [usuarioGoogle, setUsuarioGoogle] = useState<{ email: string | null; name: string | null; photo: string | null } | null>(null);
  const [cargandoAuth, setCargandoAuth] = useState(false);
  const [errorAuth, setErrorAuth] = useState<string | null>(null);

  // Pestaña activa: 'redactar' | 'bandeja' | 'clientes'
  const [pestana, setPestana] = useState<'redactar' | 'bandeja' | 'clientes'>('redactar');

  // Formulario de Redacción
  const [destinatario, setDestinatario] = useState('');
  const [asunto, setAsunto] = useState('');
  const [mensajeTexto, setMensajeTexto] = useState('');
  const [mensajeHtml, setMensajeHtml] = useState('');
  const [modoPlantilla, setModoPlantilla] = useState<'personalizado' | 'factura' | 'stock'>('personalizado');
  const [ventaSeleccionadaId, setVentaSeleccionadaId] = useState<string>('');

  // Bandeja de Entrada
  const [mensajes, setMensajes] = useState<CorreoDetalle[]>([]);
  const [cargandoMensajes, setCargandoMensajes] = useState(false);
  const [busquedaBandeja, setBusquedaBandeja] = useState('');
  const [mensajeDetalle, setMensajeDetalle] = useState<CorreoDetalle | null>(null);

  // Estados de Envío y Notificaciones
  const [enviando, setEnviando] = useState(false);
  const [notificacion, setNotificacion] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  // Modal obligatorio de confirmación de envío (Workspace Security Constraint)
  const [mostrarConfirmacionEnvio, setMostrarConfirmacionEnvio] = useState(false);

  // 1. Inicializar Auth al montar
  useEffect(() => {
    const unsub = initAuth(
      (user) => {
        setEstaConectado(true);
        setUsuarioGoogle({
          email: user.email,
          name: user.displayName,
          photo: user.photoURL
        });
      },
      () => {
        setEstaConectado(false);
        setUsuarioGoogle(null);
      }
    );

    // Verificar si ya hay usuario en sesión
    const curr = getCurrentGoogleUser();
    getAccessToken().then(token => {
      if (curr && token) {
        setEstaConectado(true);
        setUsuarioGoogle({
          email: curr.email,
          name: curr.displayName,
          photo: curr.photoURL
        });
      }
    });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // 2. Iniciar sesión con Google OAuth
  const handleConectarGoogle = async () => {
    setCargandoAuth(true);
    setErrorAuth(null);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setEstaConectado(true);
        setUsuarioGoogle({
          email: res.user.email,
          name: res.user.displayName,
          photo: res.user.photoURL
        });
        setNotificacion({
          tipo: 'ok',
          texto: `¡Conectado exitosamente con Gmail como ${res.user.email}!`
        });
        setTimeout(() => setNotificacion(null), 4000);
      }
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' || 
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-closed-by-user')
      ) {
        return;
      }
      if (err?.code === 'auth/popup-blocked') {
        setErrorAuth('La ventana emergente de Google fue bloqueada por el navegador. Habilite las ventanas emergentes.');
        return;
      }
      setErrorAuth(err?.message || 'Error al conectar con Google');
    } finally {
      setCargandoAuth(false);
    }
  };

  // 3. Cerrar sesión
  const handleDesconectar = async () => {
    await googleSignOut();
    setEstaConectado(false);
    setUsuarioGoogle(null);
    setMensajes([]);
  };

  // 4. Cargar correos de la bandeja de entrada
  const cargarCorreos = async (filtro: string = '') => {
    if (!estaConectado) return;
    setCargandoMensajes(true);
    const res = await listarMensajesGmail(15, filtro);
    setCargandoMensajes(false);
    if (res.success && res.mensajes) {
      setMensajes(res.mensajes);
    } else {
      setNotificacion({ tipo: 'err', texto: res.error || 'No se pudieron obtener los correos' });
    }
  };

  // Cargar correos cuando se abre la bandeja
  useEffect(() => {
    if (estaConectado && pestana === 'bandeja' && mensajes.length === 0) {
      cargarCorreos();
    }
  }, [pestana, estaConectado]);

  // 5. Aplicar Plantilla de Factura
  const aplicarPlantillaFactura = (numVenta: string) => {
    const lineas = ventas.filter(v => v.numeroVenta === numVenta);
    if (!lineas.length) return;
    const cabecera = lineas[0];
    const cliente = clientes.find(c => c.id === cabecera.idCliente || c.nombre.toLowerCase() === cabecera.cliente?.toLowerCase());

    setModoPlantilla('factura');
    setVentaSeleccionadaId(numVenta);
    setAsunto(`Comprobante de Venta ${numVenta} - VARIEDADES CS`);
    if (cliente?.direccion && cliente.direccion.includes('@')) {
      setDestinatario(cliente.direccion.trim());
    }
    const html = generarHtmlFactura(numVenta, lineas, cliente);
    setMensajeHtml(html);
    setMensajeTexto(`Adjuntamos el comprobante digital de su compra ${numVenta} en VARIEDADES CS. ¡Muchas gracias por su preferencia!`);
  };

  // 6. Aplicar Plantilla de Stock Bajo
  const aplicarPlantillaStockBajo = () => {
    setModoPlantilla('stock');
    setAsunto(`⚠️ Alerta de Inventario: Fragancias con Existencia Crítica - VARIEDADES CS`);
    setDestinatario(usuarioGoogle?.email || 'variedadescs.online@gmail.com');
    const html = generarHtmlReporteInventario(productos, true);
    setMensajeHtml(html);
    setMensajeTexto(`Reporte automático de perfumes y fragancias con stock mínimo en perfumería VARIEDADES CS.`);
  };

  // 7. Enviar Correo con Confirmación
  const confirmarYEnviarCorreo = async () => {
    setMostrarConfirmacionEnvio(false);
    setEnviando(true);
    setNotificacion(null);

    const cuerpoFinal = mensajeHtml || `
      <div style="font-family: sans-serif; padding: 20px; color: #1e293b; line-height: 1.5;">
        <div style="font-size: 18px; font-weight: bold; color: #db2777; margin-bottom: 12px;">🌸 VARIEDADES CS 🌸</div>
        <div style="white-space: pre-wrap; font-size: 14px;">${mensajeTexto}</div>
        <hr style="margin: 24px 0 12px 0; border: none; border-top: 1px solid #e2e8f0;">
        <p style="font-size: 11px; color: #64748b;">VARIEDADES CS • Perfumería & Fragancias</p>
      </div>
    `;

    const res = await enviarCorreoGmail({
      para: destinatario.trim(),
      asunto: asunto.trim(),
      cuerpoHtml: cuerpoFinal,
      cuerpoTexto: mensajeTexto
    });

    setEnviando(false);
    if (res.success) {
      setNotificacion({
        tipo: 'ok',
        texto: `¡Correo enviado exitosamente a ${destinatario} a través de Gmail!`
      });
      // Limpiar formulario si era personalizado
      if (modoPlantilla === 'personalizado') {
        setDestinatario('');
        setAsunto('');
        setMensajeTexto('');
        setMensajeHtml('');
      }
      setTimeout(() => setNotificacion(null), 5000);
    } else {
      setNotificacion({
        tipo: 'err',
        texto: `No se pudo enviar el correo: ${res.error}`
      });
    }
  };

  // Obtener ventas únicas agrupadas
  const numerosVentas = Array.from(new Set(ventas.map(v => v.numeroVenta))).slice(0, 15);

  return (
    <div className="space-y-4">
      {/* ========================================================= */}
      {/* 1. TARJETA DE CONEXIÓN GMAIL & ESTADO DE CUENTA */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              estaConectado ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-100 text-slate-500'
            }`}>
              <Mail className="w-6 h-6" />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">
                  Gmail para VARIEDADES CS
                </h2>
                {estaConectado ? (
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Conectado
                  </span>
                ) : (
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                    No autenticado
                  </span>
                )}
              </div>
              
              <p className="text-xs text-slate-500 mt-0.5">
                {estaConectado && usuarioGoogle
                  ? `Sesión activa con ${usuarioGoogle.email} (${usuarioGoogle.name || 'Perfumería'})`
                  : 'Inicie sesión con su cuenta Google para enviar facturas y avisos por correo.'}
              </p>
            </div>
          </div>

          {/* Botón de Autenticación con Google Oficial */}
          <div>
            {!estaConectado ? (
              <button
                onClick={handleConectarGoogle}
                disabled={cargandoAuth}
                className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-xs transition active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {cargandoAuth ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-red-600" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                )}
                <span>{cargandoAuth ? 'Conectando...' : 'Iniciar Sesión con Google'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDesconectar}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 font-semibold flex items-center gap-1.5 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Desconectar</span>
                </button>
              </div>
            )}
          </div>

        </div>

        {errorAuth && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorAuth}</span>
          </div>
        )}

        {notificacion && (
          <div className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 ${
            notificacion.tipo === 'ok' 
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}>
            {notificacion.tipo === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{notificacion.texto}</span>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 2. BARRA DE PESTAÑAS (REDACTAR, BANDEJA, CLIENTES) */}
      {/* ========================================================= */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold w-fit">
        <button
          onClick={() => setPestana('redactar')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
            pestana === 'redactar'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Send className="w-3.5 h-3.5 text-blue-600" />
          <span>Redactar y Enviar</span>
        </button>

        <button
          onClick={() => setPestana('bandeja')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
            pestana === 'bandeja'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Inbox className="w-3.5 h-3.5 text-red-600" />
          <span>Bandeja de Entrada</span>
          {mensajes.length > 0 && (
            <span className="bg-red-100 text-red-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {mensajes.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setPestana('clientes')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
            pestana === 'clientes'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-purple-600" />
          <span>Directorio de Correos</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* PESTAÑA 1: REDACTAR Y ENVIAR */}
      {/* ========================================================= */}
      {pestana === 'redactar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Formulario Principal de Redacción */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            
            {/* Barra de Acceso Rápido a Plantillas */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Plantillas y Acciones Rápidas
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (numerosVentas.length > 0) {
                      aplicarPlantillaFactura(numerosVentas[0]);
                    } else {
                      setNotificacion({ tipo: 'err', texto: 'Aún no hay ventas registradas para emitir factura' });
                    }
                  }}
                  className="px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-800 border border-pink-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Receipt className="w-3.5 h-3.5 text-pink-600" />
                  <span>Comprobante de Venta</span>
                </button>

                <button
                  type="button"
                  onClick={aplicarPlantillaStockBajo}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Package className="w-3.5 h-3.5 text-amber-600" />
                  <span>Alerta de Stock Bajo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setModoPlantilla('personalizado');
                    setAsunto('');
                    setMensajeHtml('');
                    setMensajeTexto('');
                  }}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Mensaje en Blanco</span>
                </button>
              </div>
            </div>

            {/* Selector de Venta si la plantilla es Factura */}
            {modoPlantilla === 'factura' && numerosVentas.length > 0 && (
              <div className="p-3 bg-pink-50/60 rounded-xl border border-pink-200 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-pink-600 shrink-0" />
                  <span className="font-bold text-pink-950">Venta a Facturar:</span>
                  <select
                    value={ventaSeleccionadaId}
                    onChange={(e) => aplicarPlantillaFactura(e.target.value)}
                    className="bg-white border border-pink-300 rounded-lg px-2.5 py-1 font-mono font-bold text-slate-800 text-xs"
                  >
                    {numerosVentas.map((nv) => (
                      <option key={nv} value={nv}>{nv}</option>
                    ))}
                  </select>
                </div>
                <span className="text-[11px] text-pink-700 font-medium">Plantilla Oficial VARIEDADES CS</span>
              </div>
            )}

            {/* Campo Destinatario con Selector de Clientes */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Para (Correo electrónico):</label>
                <div className="text-[11px] text-slate-400">
                  Puede seleccionar un cliente o escribir cualquier correo
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="ejemplo@cliente.com"
                  value={destinatario}
                  onChange={(e) => setDestinatario(e.target.value)}
                  className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-medium"
                />

                {/* Desplegable rápido de clientes con email registrado */}
                <select
                  onChange={(e) => {
                    if (e.target.value) setDestinatario(e.target.value);
                  }}
                  defaultValue=""
                  className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-700 cursor-pointer font-medium max-w-[170px]"
                >
                  <option value="" disabled>Seleccionar Cliente</option>
                  {clientes
                    .filter(c => c.direccion && c.direccion.includes('@'))
                    .map(c => (
                      <option key={c.id} value={c.direccion}>
                        {c.nombre} ({c.direccion})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Campo Asunto */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Asunto:</label>
              <input
                type="text"
                placeholder="Asunto del correo"
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden font-medium"
              />
            </div>

            {/* Campo Mensaje / Cuerpo */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Contenido del Mensaje:</label>
                {mensajeHtml && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Diseño HTML Activo
                  </span>
                )}
              </div>
              <textarea
                rows={5}
                placeholder="Escriba su mensaje aquí..."
                value={mensajeTexto}
                onChange={(e) => setMensajeTexto(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
              />
            </div>

            {/* Botón de Envío */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                {estaConectado 
                  ? `Se enviará desde su cuenta oficial de Gmail: ${usuarioGoogle?.email}` 
                  : 'Requiere conectar con Google primero'}
              </span>

              <button
                disabled={!estaConectado || !destinatario || !asunto || enviando}
                onClick={() => setMostrarConfirmacionEnvio(true)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs ${
                  estaConectado && destinatario && asunto && !enviando
                    ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-blue-600/20 shadow-md'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>{enviando ? 'Enviando vía Gmail...' : 'Enviar Correo por Gmail'}</span>
              </button>
            </div>

          </div>

          {/* Columna Lateral: Vista Previa y Sugerencias */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-600" />
              <span>Vista Previa del Formato</span>
            </h3>

            {mensajeHtml ? (
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-[380px] overflow-y-auto">
                <div 
                  className="scale-90 origin-top pointer-events-none"
                  dangerouslySetInnerHTML={{ __html: mensajeHtml }}
                />
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400">
                <Mail className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-500">Sin plantilla HTML activa</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  El correo se enviará como texto formateado con membrete y firma de VARIEDADES CS.
                </p>
              </div>
            )}

            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 space-y-1">
              <p className="font-bold">✨ Ventajas del envío con Gmail:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-blue-800">
                <li>Llega directamente desde su dirección de correo autorizada.</li>
                <li>Los clientes pueden responder directamente a su bandeja.</li>
                <li>Garantiza entrega en bandeja de entrada sin caer en Spam.</li>
              </ul>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 2: BANDEJA DE ENTRADA / MENSAJES */}
      {/* ========================================================= */}
      {pestana === 'bandeja' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Inbox className="w-5 h-5 text-red-600" />
              <h3 className="text-sm font-bold text-slate-800">
                Correos Recientes en Gmail
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar en Gmail..."
                  value={busquedaBandeja}
                  onChange={(e) => setBusquedaBandeja(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && cargarCorreos(busquedaBandeja)}
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                onClick={() => cargarCorreos(busquedaBandeja)}
                disabled={cargandoMensajes || !estaConectado}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${cargandoMensajes ? 'animate-spin text-blue-600' : ''}`} />
                <span>Actualizar</span>
              </button>
            </div>
          </div>

          {!estaConectado ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
              <Mail className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Inicie sesión con Google para consultar la bandeja</p>
              <button
                onClick={handleConectarGoogle}
                className="mt-3 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition"
              >
                Conectar Gmail
              </button>
            </div>
          ) : cargandoMensajes ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
              <p className="text-xs font-medium">Cargando mensajes desde Gmail...</p>
            </div>
          ) : mensajes.length === 0 ? (
            <div className="p-8 text-center text-slate-400 border border-slate-200 rounded-xl">
              <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">No se encontraron mensajes en su bandeja.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Haga clic en Actualizar o verifique su conexión.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {mensajes.map((m) => (
                <div 
                  key={m.id}
                  onClick={() => setMensajeDetalle(m)}
                  className="p-3.5 hover:bg-slate-50 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {m.de}
                      </span>
                      {m.etiquetas && m.etiquetas.includes('UNREAD') && (
                        <span className="bg-blue-100 text-blue-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                          Nuevo
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-800 truncate">{m.asunto}</p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{m.snippet}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 sm:justify-end">
                      <Clock className="w-3 h-3" />
                      {m.fecha || 'Reciente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 3: DIRECTORIO DE CORREOS DE CLIENTES */}
      {/* ========================================================= */}
      {pestana === 'clientes' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span>Clientes y Correos Registrados</span>
              </h3>
              <p className="text-xs text-slate-500">
                Seleccione un cliente para redactar un correo directo con su comprobante o mensaje.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {clientes.map(c => {
              const tieneEmail = c.direccion && c.direccion.includes('@');
              return (
                <div key={c.id} className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{c.nombre}</h4>
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <p className="text-[11px] text-slate-600 truncate">
                      {tieneEmail ? (
                        <span className="text-blue-600 font-semibold">{c.direccion}</span>
                      ) : (
                        <span className="text-slate-400 italic">Sin correo guardado (Dir: {c.direccion || 'N/A'})</span>
                      )}
                    </p>
                    {c.telefono && (
                      <p className="text-[10px] text-slate-400 mt-0.5">Tel: {c.telefono}</p>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">
                      ID: {c.id}
                    </span>
                    <button
                      onClick={() => {
                        setDestinatario(tieneEmail ? c.direccion : '');
                        setAsunto(`Atención al Cliente - VARIEDADES CS`);
                        setPestana('redactar');
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-600 border border-slate-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition shadow-2xs"
                    >
                      <Send className="w-3 h-3" />
                      <span>Escribir</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL OBLIGATORIO DE CONFIRMACIÓN DE ENVÍO DE CORREO */}
      {/* (Requerido por seguridad: Workspace Integration API) */}
      {/* ========================================================= */}
      {mostrarConfirmacionEnvio && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  ¿Confirmar envío de correo?
                </h3>
                <p className="text-xs text-slate-500">
                  Se enviará a través de la cuenta oficial de Gmail
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2">
              <div>
                <span className="font-bold text-slate-700">Destinatario:</span>
                <p className="font-mono text-blue-700">{destinatario}</p>
              </div>
              <div>
                <span className="font-bold text-slate-700">Asunto:</span>
                <p className="text-slate-800">{asunto}</p>
              </div>
              <div>
                <span className="font-bold text-slate-700">Remitente:</span>
                <p className="text-slate-600 font-mono text-[11px]">{usuarioGoogle?.email}</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Esta acción enviará un correo electrónico real con los datos especificados a la bandeja del destinatario.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMostrarConfirmacionEnvio(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarYEnviarCorreo}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-blue-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar y Enviar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalle de Mensaje de Bandeja */}
      {mensajeDetalle && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{mensajeDetalle.asunto}</h4>
                <p className="text-xs text-slate-500 mt-0.5">De: <span className="font-semibold text-slate-700">{mensajeDetalle.de}</span></p>
                <p className="text-[11px] text-slate-400">{mensajeDetalle.fecha}</p>
              </div>
              <button
                onClick={() => setMensajeDetalle(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 max-h-60 overflow-y-auto leading-relaxed whitespace-pre-wrap">
              {mensajeDetalle.snippet}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setDestinatario(mensajeDetalle.de);
                  setAsunto(`Re: ${mensajeDetalle.asunto}`);
                  setMensajeDetalle(null);
                  setPestana('redactar');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Responder por Gmail</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
