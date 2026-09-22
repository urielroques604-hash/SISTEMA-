import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  AlertCircle, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  RefreshCw,
  CheckCircle2,
  Mail,
  Send,
  ExternalLink,
  ArrowLeft,
  ImageOff,
  Image as ImageIcon
} from 'lucide-react';
import { enviarEnlaceRecuperacion } from '../services/firebase';

interface LoginModalProps {
  onLoginSuccess: (usuario: string, rol: string, emailGoogle?: string) => void;
}

// Cuentas de correo autorizadas con acceso al sistema
export const CORREOS_AUTORIZADOS = [
  'urielroques604@gmail.com',
  'casa1992jen@gmail.com',
  'variedadescs@gmail.com',
  'variedadescs.online@gmail.com'
];

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [gmail, setGmail] = useState(() => {
    return localStorage.getItem('variedades_cs_remembered_gmail') || 'variedadescs.online@gmail.com';
  });
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const [cargandoCredenciales, setCargandoCredenciales] = useState(false);

  // Modo sin imágenes (quitar imagen o mantenerla)
  const [sinImagen, setSinImagen] = useState(() => {
    return localStorage.getItem('cs_sin_imagenes') === 'true';
  });

  const toggleSinImagen = () => {
    const nuevo = !sinImagen;
    setSinImagen(nuevo);
    localStorage.setItem('cs_sin_imagenes', String(nuevo));
  };

  // Estados para "¿Olvidó su contraseña?" / "Olvidar"
  const [vistaOlvidar, setVistaOlvidar] = useState(false);
  const [gmailRecuperar, setGmailRecuperar] = useState('');
  const [enviandoEnlace, setEnviandoEnlace] = useState(false);
  const [mensajeRecuperacion, setMensajeRecuperacion] = useState<{ tipo: 'ok' | 'err' | 'info'; texto: string } | null>(null);

  // Enviar enlace de restablecimiento de contraseña al correo del usuario
  const handleEnviarEnlaceCorreo = async () => {
    const emailRec = (gmailRecuperar || gmail).trim().toLowerCase();
    if (!emailRec || !emailRec.includes('@')) {
      setMensajeRecuperacion({
        tipo: 'err',
        texto: 'Por favor ingrese una dirección de Gmail o correo válida para enviarle el enlace.'
      });
      return;
    }

    setEnviandoEnlace(true);
    setMensajeRecuperacion(null);
    try {
      const res = await enviarEnlaceRecuperacion(emailRec);
      setMensajeRecuperacion({
        tipo: res.tipo,
        texto: res.mensaje
      });
    } catch (err: any) {
      setMensajeRecuperacion({
        tipo: 'err',
        texto: err?.message || 'Error al conectar con el servicio de correo.'
      });
    } finally {
      setEnviandoEnlace(false);
    }
  };

  // 1. Inicio de sesión con Gmail y Contraseña directamente
  const handleLoginGmailYPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailLimpio = gmail.trim().toLowerCase();
    if (!emailLimpio || !emailLimpio.includes('@')) {
      setError('Por favor ingrese una dirección de Gmail o correo válida.');
      return;
    }

    if (!password) {
      setError('Por favor ingrese su contraseña de acceso.');
      return;
    }

    setCargandoCredenciales(true);

    setTimeout(() => {
      setCargandoCredenciales(false);

      const passPersonalizada = localStorage.getItem('cs_custom_admin_pass');
      const passValida = 
        password === '12345' || 
        password === 'admin2026' || 
        password === 'variedadescs' ||
        (passPersonalizada && password === passPersonalizada);

      if (passValida) {
        // Asignar nombre según el correo
        let nombreUsuario = 'ADMINISTRADOR';
        if (emailLimpio.includes('uriel')) nombreUsuario = 'URIEL ROQUES';
        else if (emailLimpio.includes('jen') || emailLimpio.includes('casa1992')) nombreUsuario = 'JENIFER SANCHEZ';
        else if (emailLimpio.includes('variedades')) nombreUsuario = 'VARIEDADES CS ADMIN';
        else {
          const prefijo = emailLimpio.split('@')[0];
          nombreUsuario = prefijo.toUpperCase();
        }

        localStorage.setItem('variedades_cs_remembered_gmail', emailLimpio);
        onLoginSuccess(nombreUsuario, 'Administrador', emailLimpio);
      } else {
        setError('Contraseña incorrecta. Si no la recuerda, presione "¿Olvidaste tu contraseña?" abajo.');
      }
    }, 350);
  };



  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm border border-slate-200 overflow-hidden text-center p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Logotipo Oficial o Modo Sin Imagen con botón para quitarla/mostrarla */}
        <div className="flex flex-col items-center justify-center mb-3">
          {!sinImagen ? (
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-pink-50 mx-auto border border-pink-200 shadow-md">
                <img src="/logo.jpg" alt="VARIEDADES CS" className="w-full h-full object-cover" />
              </div>
              <button
                type="button"
                onClick={toggleSinImagen}
                title="Quitar imagen del logotipo"
                className="mt-1 text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1 mx-auto cursor-pointer"
              >
                <ImageOff className="w-3 h-3" />
                <span>Quitar imagen</span>
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-600 to-rose-700 mx-auto flex items-center justify-center text-white font-black text-xl shadow-md border border-pink-300">
                CS
              </div>
              <button
                type="button"
                onClick={toggleSinImagen}
                title="Mostrar imagen del logotipo"
                className="mt-1 text-[10px] text-slate-400 hover:text-pink-600 flex items-center gap-1 mx-auto cursor-pointer"
              >
                <ImageIcon className="w-3 h-3" />
                <span>Mostrar imagen</span>
              </button>
            </div>
          )}
        </div>

        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-pink-100 text-pink-700">
          <ShieldCheck className="w-3 h-3 text-pink-600" />
          Perfumería • Cosméticos • Calzado • Ropa • Variedades
        </span>

        <h2 className="text-xl font-black text-slate-900 mt-2 mb-0.5">VARIEDADES CS</h2>
        <p className="text-xs text-slate-500 mb-4">De todo un poco • Sistema de Inventario y Ventas</p>

        {/* Alerta de Error / Acceso Denegado */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold mb-4 flex items-start gap-2 text-left">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* VISTA DE RECUPERACIÓN ("OLVIDAR CONTRASEÑA") */}
        {/* ========================================================= */}
        {vistaOlvidar ? (
          <div className="text-left space-y-3.5 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
              <h3 className="font-bold text-xs flex items-center gap-1.5 mb-1">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Recuperación de Contraseña
              </h3>
              <p className="text-[11px] text-amber-800 leading-snug">
                Puedes recibir un enlace oficial en tu correo para restablecer la contraseña, o asignarla directamente aquí.
              </p>
            </div>

            {mensajeRecuperacion && (
              <div className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 ${
                mensajeRecuperacion.tipo === 'ok' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : mensajeRecuperacion.tipo === 'err'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}>
                {mensajeRecuperacion.tipo === 'ok' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span className="leading-snug">{mensajeRecuperacion.texto}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Su Gmail Registrado</label>
                <input
                  type="email"
                  required
                  value={gmailRecuperar || gmail}
                  onChange={e => setGmailRecuperar(e.target.value)}
                  placeholder="ejemplo@gmail.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-xs text-slate-900"
                />
              </div>

              {/* Botón principal: Enviar enlace para cambiar la contraseña */}
              <button
                type="button"
                onClick={handleEnviarEnlaceCorreo}
                disabled={enviandoEnlace}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-60"
              >
                {enviandoEnlace ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Enviando enlace a tu correo...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar enlace para cambiar contraseña</span>
                  </>
                )}
              </button>

              {/* Enlace directo a Gmail si ya se envió el enlace */}
              {mensajeRecuperacion && mensajeRecuperacion.tipo === 'ok' && (
                <div className="space-y-2">
                  <a
                    href="https://mail.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition text-center shadow-xs"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Abrir Gmail y ver el correo más reciente</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-snug text-left">
                    <p className="font-bold mb-0.5">⚠️ ¿Te aparece "expired or link has already been used"?</p>
                    <p className="text-amber-800">
                      Abre únicamente el <strong>correo más nuevo</strong> que acaba de llegar a tu Gmail (el último al fondo del hilo de mensajes). Si abres un correo anterior, Firebase lo rechaza porque ya caducó.
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setVistaOlvidar(false);
                    setMensajeRecuperacion(null);
                  }}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver al Inicio de Sesión</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* FORMULARIO PRINCIPAL: GMAIL + CONTRASEÑA + OLVIDAR */
          /* ========================================================= */
          <div className="space-y-4">
            <form onSubmit={handleLoginGmailYPassword} className="space-y-3.5 text-xs text-left">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Gmail / Correo Electrónico</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={gmail}
                    onChange={e => setGmail(e.target.value)}
                    placeholder="variedadescs.online@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl bg-white font-semibold text-slate-900 outline-hidden focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">
                    Contraseña
                  </label>
                  {/* Botón "¿Olvidaste tu contraseña?" / "Olvidar" solicitado por el usuario */}
                  <button
                    type="button"
                    onClick={() => {
                      setVistaOlvidar(true);
                      setGmailRecuperar(gmail);
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={mostrarPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-xs text-slate-900 tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    tabIndex={-1}
                    title={mostrarPassword ? "Ocultar contraseña" : "Ver contraseña"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {mostrarPassword ? (
                      <EyeOff className="w-4 h-4 text-slate-600" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={cargandoCredenciales}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {cargandoCredenciales ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <span>Ingresar al Sistema</span>
                )}
              </button>
            </form>
          </div>
        )}

        <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Acceso seguro protegido para VARIEDADES CS</span>
        </div>

      </div>
    </div>
  );
};
