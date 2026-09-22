import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Send, 
  KeyRound,
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  RefreshCw, 
  ImageOff,
  Image as ImageIcon
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

  const [emailDestino, setEmailDestino] = useState(emailActual);
  const [enviandoEnlace, setEnviandoEnlace] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  // 1. Enviar enlace oficial por correo electrónico
  const handleEnviarEnlace = async () => {
    const correo = emailDestino.trim().toLowerCase();
    if (!correo || !correo.includes('@')) {
      setMensaje({
        tipo: 'err',
        texto: 'Por favor proporcione un correo o Gmail válido.'
      });
      return;
    }

    setEnviandoEnlace(true);
    setMensaje(null);
    try {
      const res = await enviarEnlaceRecuperacion(correo);
      setMensaje({
        tipo: res.tipo,
        texto: res.mensaje
      });
    } catch (err: any) {
      setMensaje({
        tipo: 'err',
        texto: err?.message || 'Error al solicitar el enlace de restablecimiento.'
      });
    } finally {
      setEnviandoEnlace(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800">Seguridad & Contraseña</h3>
              <p className="text-[11px] text-slate-500">Enviar enlace oficial para cambiar o restablecer contraseña</p>
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

          {/* Opción 1: Enviar enlace para cambiar la contraseña por correo */}
          <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-blue-900 font-bold">
              <Mail className="w-4 h-4 text-blue-600" />
              <span>Enviar enlace para cambiar contraseña a mi correo</span>
            </div>
            <p className="text-[11px] text-blue-700 leading-snug">
              Te enviaremos un enlace oficial a tu Gmail para que puedas cambiar o restablecer tu contraseña con total seguridad.
            </p>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Correo / Gmail de destino:</label>
              <input
                type="email"
                value={emailDestino}
                onChange={e => setEmailDestino(e.target.value)}
                placeholder="ejemplo@gmail.com"
                className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={handleEnviarEnlace}
              disabled={enviandoEnlace}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-60"
            >
              {enviandoEnlace ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enviando enlace a tu correo...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar enlace ahora por correo</span>
                </>
              )}
            </button>

            {mensaje?.tipo === 'ok' && (
              <div className="space-y-2">
                <a
                  href="https://mail.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition text-center shadow-xs"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Abrir Gmail y ver el correo más reciente</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-snug text-left">
                  <p className="font-bold mb-0.5">⚠️ ¿Te aparece "expired or link has already been used"?</p>
                  <p className="text-amber-800">
                    Abre únicamente el <strong>correo más nuevo</strong> que acaba de llegar a tu Gmail (el último al fondo de la conversación). Si abres un correo anterior, Firebase lo rechaza porque ya caducó.
                  </p>
                </div>
              </div>
            )}
          </div>

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

          {/* Opción Adicional: Quitar imágenes o Modo sin imágenes */}
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
