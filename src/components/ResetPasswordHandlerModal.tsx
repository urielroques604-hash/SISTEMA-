import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Lock, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { 
  verificarCodigoRestablecimiento, 
  restablecerPasswordConCodigo, 
  enviarEnlaceRecuperacion 
} from '../services/firebase';

interface ResetPasswordHandlerModalProps {
  onSuccess: () => void;
}

export const ResetPasswordHandlerModal: React.FC<ResetPasswordHandlerModalProps> = ({ onSuccess }) => {
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [emailAsociado, setEmailAsociado] = useState<string>('');
  const [verificando, setVerificando] = useState<boolean>(true);
  const [errorCodigo, setErrorCodigo] = useState<string | null>(null);

  const [nuevaPassword, setNuevaPassword] = useState<string>('');
  const [confirmarPassword, setConfirmarPassword] = useState<string>('');
  const [mostrarPassword, setMostrarPassword] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [exito, setExito] = useState<boolean>(false);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);

  const [reenviando, setReenviando] = useState<boolean>(false);
  const [mensajeReenvio, setMensajeReenvio] = useState<string | null>(null);

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const mode = urlParams.get('mode');
      const code = urlParams.get('oobCode') || urlParams.get('localToken');
      const emailParam = urlParams.get('email');

      if (mode === 'resetPassword' && code) {
        setOobCode(code);
        if (emailParam) {
          setEmailAsociado(emailParam);
        }
        verificarCodigo(code, emailParam || undefined);
      } else {
        setVerificando(false);
      }
    } catch {
      setVerificando(false);
    }
  }, []);

  const verificarCodigo = async (code: string, fallbackEmail?: string) => {
    setVerificando(true);
    setErrorCodigo(null);
    const res = await verificarCodigoRestablecimiento(code);
    setVerificando(false);
    if (res.success) {
      if (res.email) setEmailAsociado(res.email);
      else if (fallbackEmail) setEmailAsociado(fallbackEmail);
    } else {
      setErrorCodigo(res.error || 'El enlace de restablecimiento ha expirado o ya fue utilizado.');
    }
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode) return;
    setErrorGuardado(null);

    if (nuevaPassword.length < 6) {
      setErrorGuardado('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setErrorGuardado('Las contraseñas ingresadas no coinciden.');
      return;
    }

    setGuardando(true);
    const res = await restablecerPasswordConCodigo(oobCode, nuevaPassword);
    setGuardando(false);

    if (res.success) {
      setExito(true);
      // Limpiar parámetros de la URL de forma limpia
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('mode');
        url.searchParams.delete('oobCode');
        url.searchParams.delete('localToken');
        url.searchParams.delete('email');
        url.searchParams.delete('apiKey');
        window.history.replaceState({}, document.title, url.pathname);
      } catch {
        // Ignorar
      }
    } else {
      setErrorGuardado(res.error || 'No se pudo restablecer la contraseña. Intente nuevamente.');
    }
  };

  const handleSolicitarNuevoEnlace = async () => {
    if (!emailAsociado && !localStorage.getItem('variedades_cs_remembered_gmail')) {
      setErrorCodigo('Por favor solicite un nuevo enlace desde la pantalla de inicio de sesión.');
      return;
    }
    const correo = emailAsociado || localStorage.getItem('variedades_cs_remembered_gmail') || '';
    setReenviando(true);
    setMensajeReenvio(null);
    try {
      const res = await enviarEnlaceRecuperacion(correo);
      if (res.tipo === 'ok') {
        setMensajeReenvio(`Hemos enviado un nuevo enlace de restablecimiento a ${correo}. Revisa tu correo.`);
      } else {
        setErrorCodigo(res.mensaje);
      }
    } catch {
      setErrorCodigo('Error al enviar el enlace. Intente nuevamente.');
    } finally {
      setReenviando(false);
    }
  };

  if (!oobCode) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden text-center p-7 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Icono Principal */}
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200 shadow-sm">
          {exito ? <CheckCircle2 className="w-7 h-7" /> : <KeyRound className="w-7 h-7" />}
        </div>

        {/* Verificando estado inicial */}
        {verificando ? (
          <div className="py-6 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-sm">Verificando enlace de restablecimiento...</h3>
            <p className="text-xs text-slate-500">Un momento por favor mientras validamos el token de seguridad.</p>
          </div>
        ) : errorCodigo ? (
          /* Error en el token (caducado o ya utilizado) */
          <div className="space-y-4 text-left">
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900">Enlace no válido o expirado</p>
                <p className="text-rose-700 text-[11px] mt-0.5">{errorCodigo}</p>
              </div>
            </div>

            {mensajeReenvio && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{mensajeReenvio}</span>
              </div>
            )}

            <p className="text-xs text-slate-500 leading-relaxed text-center">
              Por razones de seguridad, los enlaces para cambiar contraseña tienen un tiempo de validez limitado y solo pueden utilizarse una vez.
            </p>

            <button
              type="button"
              onClick={handleSolicitarNuevoEnlace}
              disabled={reenviando}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-60"
            >
              {reenviando ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enviando nuevo enlace...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Solicitar un nuevo enlace de restablecimiento</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setOobCode(null);
                try {
                  const url = new URL(window.location.href);
                  url.searchParams.delete('mode');
                  url.searchParams.delete('oobCode');
                  url.searchParams.delete('localToken');
                  url.searchParams.delete('email');
                  url.searchParams.delete('apiKey');
                  window.history.replaceState({}, document.title, url.pathname);
                } catch {}
              }}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              Ir al inicio de sesión
            </button>
          </div>
        ) : exito ? (
          /* Éxito total */
          <div className="space-y-4 text-center">
            <h3 className="font-black text-slate-900 text-lg">¡Contraseña restablecida!</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              La contraseña de tu cuenta ha sido actualizada con éxito. Ya puedes iniciar sesión con tu nueva clave.
            </p>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Acceso seguro restablecido</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setOobCode(null);
                onSuccess();
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <span>Iniciar Sesión Ahora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Formulario para ingresar la nueva contraseña (estilo ChatGPT) */
          <form onSubmit={handleGuardar} className="space-y-4 text-left">
            <div className="text-center">
              <h3 className="font-black text-slate-900 text-lg">Restablece tu contraseña</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ingresa una nueva contraseña para {emailAsociado ? <strong className="text-slate-700">{emailAsociado}</strong> : 'tu cuenta'}.
              </p>
            </div>

            {errorGuardado && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorGuardado}</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 text-xs mb-1">Nueva Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={mostrarPassword ? "text" : "password"}
                  required
                  autoFocus
                  value={nuevaPassword}
                  onChange={e => setNuevaPassword(e.target.value)}
                  placeholder="Al menos 6 caracteres"
                  className="w-full pl-9 pr-10 py-2.5 border border-slate-300 rounded-xl font-medium text-slate-900 text-xs outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
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

            <div>
              <label className="block font-bold text-slate-700 text-xs mb-1">Repite la Nueva Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={mostrarPassword ? "text" : "password"}
                  required
                  value={confirmarPassword}
                  onChange={e => setConfirmarPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
                  className="w-full pl-9 pr-10 py-2.5 border border-slate-300 rounded-xl font-medium text-slate-900 text-xs outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-60"
            >
              {guardando ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Guardando contraseña...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Restablecer contraseña</span>
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
