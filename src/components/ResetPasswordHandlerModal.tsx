import React, { useState, useEffect } from 'react';
import { KeyRound, CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff, Lock, ArrowRight } from 'lucide-react';
import { verificarCodigoRestablecimiento, restablecerPasswordConCodigo, enviarEnlaceRecuperacion } from '../services/firebase';

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
      const code = urlParams.get('oobCode');

      if (mode === 'resetPassword' && code) {
        setOobCode(code);
        verificarCodigo(code);
      } else {
        setVerificando(false);
      }
    } catch {
      setVerificando(false);
    }
  }, []);

  const verificarCodigo = async (code: string) => {
    setVerificando(true);
    setErrorCodigo(null);
    const res = await verificarCodigoRestablecimiento(code);
    setVerificando(false);
    if (res.success && res.email) {
      setEmailAsociado(res.email);
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
      setErrorGuardado('Las contraseñas no coinciden. Por favor verifica.');
      return;
    }

    setGuardando(true);
    const res = await restablecerPasswordConCodigo(oobCode, nuevaPassword);
    setGuardando(false);

    if (res.success) {
      setExito(true);
      // Guardar también en localStorage para acceso inmediato sin internet
      localStorage.setItem('cs_custom_admin_pass', nuevaPassword);
      // Limpiar parámetros de la URL
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch {}

      setTimeout(() => {
        onSuccess();
      }, 2500);
    } else {
      setErrorGuardado(res.mensaje);
    }
  };

  const handleReenviarNuevoEnlace = async () => {
    const email = emailAsociado || localStorage.getItem('variedades_cs_remembered_gmail') || 'variedadescs.online@gmail.com';
    setReenviando(true);
    setMensajeReenvio(null);
    const res = await enviarEnlaceRecuperacion(email);
    setReenviando(false);
    setMensajeReenvio(res.mensaje);
  };

  const limpiarUrlYCerrar = () => {
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch {}
    setOobCode(null);
  };

  // Si no hay código en la URL, no renderizar nada
  if (!oobCode) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden text-center p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabecera */}
        <div className="flex flex-col items-center justify-center mb-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mb-2 shadow-xs">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Restablecer Contraseña</h2>
          {emailAsociado && (
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Cuenta: <span className="text-slate-800 font-bold">{emailAsociado}</span>
            </p>
          )}
        </div>

        {verificando ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
            <p className="text-xs font-semibold text-slate-600">Verificando enlace de restablecimiento...</p>
          </div>
        ) : errorCodigo ? (
          <div className="space-y-4 text-left">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-rose-900">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>El enlace ha expirado o ya fue utilizado</span>
              </div>
              <p className="text-[11px] leading-relaxed text-rose-700">
                Los enlaces de restablecimiento de contraseña de Firebase son de un solo uso y caducan rápidamente por motivos de seguridad. Además, si se generó una nueva solicitud, los enlaces anteriores quedan automáticamente invalidados.
              </p>
            </div>

            {mensajeReenvio && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{mensajeReenvio}</span>
              </div>
            )}

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleReenviarNuevoEnlace}
                disabled={reenviando}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
              >
                {reenviando ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Enviando nuevo enlace...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Enviar un nuevo enlace a mi Gmail ahora</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={limpiarUrlYCerrar}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Volver a la aplicación
              </button>
            </div>
          </div>
        ) : exito ? (
          <div className="py-6 space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">¡Contraseña Cambiada con Éxito!</h3>
            <p className="text-xs text-slate-600">
              Tu contraseña ha sido actualizada en Firebase. Redirigiendo al sistema...
            </p>
          </div>
        ) : (
          <form onSubmit={handleGuardar} className="space-y-3.5 text-left">
            {errorGuardado && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorGuardado}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Escribe tu Nueva Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  required
                  value={nuevaPassword}
                  onChange={e => setNuevaPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirma tu Nueva Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  required
                  value={confirmarPassword}
                  onChange={e => setConfirmarPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
            >
              {guardando ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Guardando contraseña...</span>
                </>
              ) : (
                <>
                  <span>Guardar y Entrar al Sistema</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
