import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowLeft, 
  ImageOff, 
  Image as ImageIcon,
  Mail,
  RefreshCw,
  ExternalLink,
  ArrowRight
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

  // Modo sin imágenes
  const [sinImagen, setSinImagen] = useState(() => {
    return localStorage.getItem('cs_sin_imagenes') === 'true';
  });

  const toggleSinImagen = () => {
    const nuevo = !sinImagen;
    setSinImagen(nuevo);
    localStorage.setItem('cs_sin_imagenes', String(nuevo));
  };

  // Estados estilo ChatGPT para restablecer contraseña con enlace enviado al correo
  const [vistaOlvidar, setVistaOlvidar] = useState(false);
  const [gmailRecuperar, setGmailRecuperar] = useState('');
  const [enviandoEnlace, setEnviandoEnlace] = useState(false);
  const [enlaceEnviado, setEnlaceEnviado] = useState(false);
  const [enlaceDirectoGenerado, setEnlaceDirectoGenerado] = useState<string | null>(null);
  const [enlaceCopiado, setEnlaceCopiado] = useState(false);
  const [errorRecuperacion, setErrorRecuperacion] = useState<string | null>(null);

  // Enviar enlace al correo del usuario estilo ChatGPT
  const handleEnviarEnlace = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorRecuperacion(null);
    setEnlaceDirectoGenerado(null);
    setEnlaceCopiado(false);

    const emailDestino = (gmailRecuperar || gmail).trim().toLowerCase();
    if (!emailDestino || !emailDestino.includes('@')) {
      setErrorRecuperacion('Introduce una dirección de correo electrónico válida.');
      return;
    }

    setEnviandoEnlace(true);
    try {
      const res = await enviarEnlaceRecuperacion(emailDestino);
      if (res.tipo === 'ok') {
        setEnlaceEnviado(true);
        if (res.enlaceDirecto) {
          setEnlaceDirectoGenerado(res.enlaceDirecto);
        }
        localStorage.setItem('variedades_cs_remembered_gmail', emailDestino);
      } else {
        setErrorRecuperacion(res.mensaje);
      }
    } catch (err: any) {
      setErrorRecuperacion(err?.message || 'Ocurrió un error al procesar la solicitud.');
    } finally {
      setEnviandoEnlace(false);
    }
  };

  // Inicio de sesión con Gmail y Contraseña directamente
  const handleLoginGmailYPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailLimpio = gmail.trim().toLowerCase();
    if (!emailLimpio || !emailLimpio.includes('@')) {
      setError('Por favor ingrese una dirección de correo electrónico válida.');
      return;
    }

    if (!password) {
      setError('Por favor ingrese su contraseña.');
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
        setError('Contraseña incorrecta. Haz clic en "¿Has olvidado la contraseña?" para restablecerla por correo.');
      }
    }, 200);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm border border-slate-200 overflow-hidden text-center p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-200 max-h-[95vh] overflow-y-auto">
        
        {/* Logotipo Oficial o Modo Sin Imagen */}
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

        {/* Alerta de Error de Inicio de Sesión */}
        {error && !vistaOlvidar && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold mb-4 flex items-start gap-2 text-left">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* VISTA ESTILO CHATGPT: RECUPERACIÓN CON ENLACE POR CORREO */}
        {/* ========================================================= */}
        {vistaOlvidar ? (
          enlaceEnviado ? (
            /* Pantalla 2: Enlace Enviado - "Revisa tu correo" */
            <div className="text-left space-y-4 text-xs animate-in fade-in duration-150">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="font-extrabold text-base text-slate-900">Revisa tu correo</h3>
                <p className="text-slate-500 leading-relaxed">
                  Hemos enviado un enlace para restablecer la contraseña a:
                </p>
                <p className="font-bold text-slate-800 break-all">
                  {gmailRecuperar || gmail}
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-600 leading-relaxed">
                Haz clic en el enlace del correo electrónico para crear una nueva contraseña. Si no lo ves en unos minutos, comprueba tu carpeta de spam.
              </div>

              {/* Botón de Restablecimiento Directo Instantáneo */}
              {enlaceDirectoGenerado && (
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = enlaceDirectoGenerado;
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition text-center"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Restablecer Contraseña Directamente Ahora</span>
                </button>
              )}

              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer transition text-center"
              >
                <Mail className="w-4 h-4" />
                <span>Abrir Gmail</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleEnviarEnlace}
                  disabled={enviandoEnlace}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {enviandoEnlace ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Reenviando enlace...</span>
                    </>
                  ) : (
                    <span>¿No te llegó? Reenviar enlace</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVistaOlvidar(false);
                    setEnlaceEnviado(false);
                    setErrorRecuperacion(null);
                  }}
                  className="w-full py-2 text-slate-500 hover:text-slate-800 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver a iniciar sesión</span>
                </button>
              </div>
            </div>
          ) : (
            /* Pantalla 1: Formulario estilo ChatGPT "¿Has olvidado tu contraseña?" */
            <div className="text-left space-y-4 text-xs animate-in fade-in duration-150">
              <div className="text-center space-y-1">
                <h3 className="font-extrabold text-base text-slate-900">¿Has olvidado la contraseña?</h3>
                <p className="text-slate-500 leading-relaxed">
                  Introduce tu dirección de correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                </p>
              </div>

              {errorRecuperacion && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{errorRecuperacion}</span>
                </div>
              )}

              <form onSubmit={handleEnviarEnlace} className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dirección de correo electrónico</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={gmailRecuperar || gmail}
                      onChange={e => setGmailRecuperar(e.target.value)}
                      placeholder="nombre@ejemplo.com"
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-xs text-slate-900 bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={enviandoEnlace}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md shadow-slate-900/10 flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-60 mt-2"
                >
                  {enviandoEnlace ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Enviando enlace...</span>
                    </>
                  ) : (
                    <>
                      <span>Continuar</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVistaOlvidar(false);
                    setErrorRecuperacion(null);
                  }}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver al inicio de sesión</span>
                </button>
              </form>
            </div>
          )
        ) : (
          /* ========================================================= */
          /* FORMULARIO PRINCIPAL: GMAIL + CONTRASEÑA */
          /* ========================================================= */
          <div className="space-y-4">
            <form onSubmit={handleLoginGmailYPassword} className="space-y-3.5 text-xs text-left">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Correo Electrónico</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={gmail}
                    onChange={e => setGmail(e.target.value)}
                    placeholder="variedadescs.online@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl bg-white font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">Contraseña</label>
                  <button
                    type="button"
                    onClick={() => {
                      setVistaOlvidar(true);
                      setEnlaceEnviado(false);
                      setErrorRecuperacion(null);
                      setGmailRecuperar(gmail);
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition cursor-pointer"
                  >
                    ¿Has olvidado la contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={mostrarPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Tu contraseña"
                    className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl bg-white font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={cargandoCredenciales}
                className="w-full py-3 bg-gradient-to-r from-pink-600 via-rose-600 to-pink-700 hover:from-pink-700 hover:to-rose-800 text-white rounded-xl font-bold text-xs shadow-md shadow-pink-500/20 cursor-pointer transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{cargandoCredenciales ? 'Verificando...' : 'Iniciar Sesión'}</span>
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
