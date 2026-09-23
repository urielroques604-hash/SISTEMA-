import React, { useState } from 'react';
import { X, UserCheck, Check, Sparkles, UserPlus } from 'lucide-react';

interface ModalCambiarCajeroProps {
  isOpen: boolean;
  cajeroActual: string;
  onGuardar: (nuevoNombre: string) => void;
  onClose: () => void;
}

export const CAJEROS_PREDEFINIDOS = [
  { nombre: 'JENIFER SANCHEZ', rol: 'Administradora / Ventas' },
  { nombre: 'URIEL ROQUES', rol: 'Administrador / Ventas' },
  { nombre: 'CARLOS ROQUES', rol: 'Gerencia / Ventas' }
];

export const ModalCambiarCajero: React.FC<ModalCambiarCajeroProps> = ({
  isOpen,
  cajeroActual,
  onGuardar,
  onClose
}) => {
  if (!isOpen) return null;

  const [nombre, setNombre] = useState(cajeroActual || 'JENIFER SANCHEZ');
  const [personalizado, setPersonalizado] = useState('');

  const handleSeleccionar = (nombreSeleccionado: string) => {
    onGuardar(nombreSeleccionado.toUpperCase().trim());
    onClose();
  };

  const handleGuardarPersonalizado = (e: React.FormEvent) => {
    e.preventDefault();
    if (personalizado.trim()) {
      onGuardar(personalizado.toUpperCase().trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white">Vendedor / Atendido por</h3>
              <p className="text-[11px] text-slate-300">Este nombre aparecerá en todas las facturas y ventas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Selecciona el personal que atiende:
            </label>
            <div className="space-y-2">
              {CAJEROS_PREDEFINIDOS.map(c => {
                const esActivo = cajeroActual.toUpperCase() === c.nombre.toUpperCase();
                return (
                  <button
                    key={c.nombre}
                    type="button"
                    onClick={() => handleSeleccionar(c.nombre)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                      esActivo 
                        ? 'border-blue-600 bg-blue-50/70 text-blue-950 shadow-xs ring-1 ring-blue-500' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                        esActivo ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {c.nombre.charAt(0)}
                      </div>
                      <div>
                        <p className="font-extrabold text-xs">{c.nombre}</p>
                        <p className="text-[10px] text-slate-500">{c.rol}</p>
                      </div>
                    </div>
                    {esActivo && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-blue-600">
                        <Check className="w-4 h-4" />
                        <span>Activo</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opción personalizada */}
          <form onSubmit={handleGuardarPersonalizado} className="pt-2 border-t border-slate-100 space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              O escribe otro nombre de vendedor:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={personalizado}
                onChange={e => setPersonalizado(e.target.value)}
                placeholder="Ej: MARÍA LÓPEZ"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold uppercase outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!personalizado.trim()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                Aplicar
              </button>
            </div>
          </form>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
          >
            Listo
          </button>
        </div>

      </div>
    </div>
  );
};
