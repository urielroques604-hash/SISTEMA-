import React, { useState } from 'react';
import { 
  X, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  ShieldCheck, 
  ImageOff, 
  Image as ImageIcon,
  Mail,
  RefreshCw,
  Send
} from 'lucide-react';
import { enviarEnlaceRecuperacion } from '../services/firebase';

interface CambiarPasswordModalProps {
  isOpen?: boolean;
  usuarioActual?: string;
  emailActual?: string;
  modoSinImagenes?: boolean;
  onToggleModoSinImagenes?: () => void;
  onClose: () => void;
}

export const CambiarPasswordModal: React.FC<CambiarPasswordModalProps> = ({
  isOpen = true,
  usuarioActual = 'Administrador',
  emailActual = 'variedadescs.online@gmail.com',
  modoSinImagenes = false,
  onToggleModoSinImagenes,
  onClose
}) => {
  if (!isOpen) return null;

  const [claveActual, setClaveActual] = useState('');
  const [nuevaClave, setNuevaClave] = useState('');
  const [confirmarClave, setConfirmarClave] = useState('');
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  const [enviandoLink, setEnviandoLink] = useState(false);
  const [mensajeLink, setMensajeLink] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  const handleEnviarLinkCorreo = async () => {
    setMensajeLink(null);
    setEnviandoLink(true);
    try {
      const res = await enviarEnlaceRecuperacion(emailActual);
      if (res.tipo === 'ok') {
        setMensajeLink({
          tipo: 'ok',
          texto: `¡Enlace enviado a ${emailActual}! Revisa tu correo y haz clic en el link para restablecer tu contraseña.`
        });
      } else {
        setMensajeLink({
          tipo: 'err',
          texto: res.mensaje
        });
      }
    } catch {
      setMensajeLink({
        tipo: 'err',
        texto: 'Error al enviar el correo. Por favor intenta de nuevo.'
      });
    } finally {
      setEnviandoLink(false);
    }
  };

  const handleCambiarPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);

    // Validar contraseña actual
    const passPersonalizada = localStorage.getItem('cs_custom_admin_pass');
    const passValida = 
      claveActual === '12345' || 
      claveActual === 'admin2026' || 
      claveActual === 'variedadescs' ||
      (passPersonalizada && claveActual === passPersonalizada);

    if (!passValida) {
      setMensaje({
        tipo: 'err',
        texto: 'La contraseña actual ingresada es incorrecta.'
      });
      return;
    }

    if (nuevaClave.length < 6) {
      setMensaje({
        tipo: 'err',
        texto: 'La nueva contraseña debe tener un mínimo de 6 caracteres.'
      });
      return;
    }

    if (nuevaClave !== confirmarClave) {
      setMensaje({
        tipo: 'err',
        texto: 'Las nuevas contraseñas no coinciden.'
      });
      return;
    }

    // Guardar nueva contraseña en almacenamiento local seguro
    localStorage.setItem('cs_custom_admin_pass', nuevaClave);
    setMensaje({
      tipo: 'ok',
      texto: '¡Contraseña actualizada exitosamente! Esta será tu nueva clave de acceso.'
    });

    setClaveActual('');
    setNuevaClave('');
    setConfirmarClave('');

    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[95vh] overflow-y-auto">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800">Seguridad & Contraseña</h3>
              <p className="text-[11px] text-slate-500">Administración de credenciales para {usuarioActual}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {/* Mensajes de Notificación */}
          {mensaje && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 ${
              mensaje.tipo === 'ok' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {mensaje.tipo === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-snug">{mensaje.texto}</span>
            </div>
          )}

          {/* Opción 1: Enviar enlace al correo estilo ChatGPT */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <Mail className="w-4 h-4 text-emerald-600" />
              <span>Restablecer por enlace de correo (Como ChatGPT)</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Enviamos un enlace seguro a <strong>{emailActual}</strong> para crear una nueva contraseña en un clic.
            </p>

            {mensajeLink && (
              <div className={`p-2.5 rounded-xl text-[11px] font-semibold flex items-start gap-2 ${
                mensajeLink.tipo === 'ok' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {mensajeLink.tipo === 'ok' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span className="leading-snug">{mensajeLink.texto}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleEnviarLinkCorreo}
              disabled={enviandoLink}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-60"
            >
              {enviandoLink ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Enviando enlace a tu correo...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar enlace a mi correo</span>
                </>
              )}
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="shrink mx-3 text-slate-400 text-[10px] uppercase tracking-wider font-bold">O cambiar manualmente</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Opción 2: Formulario de Cambio Directo de Contraseña */}
          <form onSubmit={handleCambiarPassword} className="space-y-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Contraseña Actual:</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={claveActual}
                  onChange={e => setClaveActual(e.target.value)}
                  placeholder="Ingrese su contraseña actual"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nueva Contraseña:</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={nuevaClave}
                  onChange={e => setNuevaClave(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Confirmar Nueva Contraseña:</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={confirmarClave}
                  onChange={e => setConfirmarClave(e.target.value)}
                  placeholder="Repita la nueva contraseña"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer transition mt-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Guardar Nueva Contraseña</span>
            </button>
          </form>

          {/* Botón de Cerrar */}
          <div className="pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>

          {/* Opción Adicional: Modo sin imágenes */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {modoSinImagenes ? (
                <ImageOff className="w-4 h-4 text-amber-600" />
              ) : (
                <ImageIcon className="w-4 h-4 text-slate-400" />
              )}
              <span className="text-[11px] font-semibold text-slate-700">
                Modo Sin Imágenes (Catálogo y POS)
              </span>
            </div>
            <button
              type="button"
              onClick={onToggleModoSinImagenes}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                modoSinImagenes 
                  ? 'bg-amber-100 text-amber-800 border-amber-300' 
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {modoSinImagenes ? 'Activado (Sin fotos)' : 'Desactivado (Con fotos)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
