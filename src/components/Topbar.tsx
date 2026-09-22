import React from 'react';
import { Menu, Trash2, FileSpreadsheet, Upload, KeyRound, ImageOff, Image as ImageIcon } from 'lucide-react';

interface TopbarProps {
  titulo: string;
  usuario: string;
  saldoCaja: number;
  onExportarExcel: () => void;
  onImportarExcel: () => void;
  onLimpiarTodo: () => void;
  onAbrirMenuMovil?: () => void;
  modoSinImagenes: boolean;
  onToggleModoSinImagenes: () => void;
  onAbrirCambiarPassword: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  titulo,
  usuario,
  saldoCaja,
  onExportarExcel,
  onImportarExcel,
  onLimpiarTodo,
  onAbrirMenuMovil,
  modoSinImagenes,
  onToggleModoSinImagenes,
  onAbrirCambiarPassword
}) => {
  return (
    <header className="h-14 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between flex-shrink-0 z-10">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Botón de Menú Hamburguesa para Móvil */}
        {onAbrirMenuMovil && (
          <button
            onClick={onAbrirMenuMovil}
            className="md:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="w-8 h-8 rounded-lg overflow-hidden border border-pink-200 shadow-xs flex-shrink-0 md:hidden flex items-center justify-center bg-pink-100">
          {!modoSinImagenes ? (
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-black text-pink-700">CS</span>
          )}
        </div>

        <h2 className="text-sm sm:text-base font-extrabold text-slate-800 truncate">
          {titulo}
        </h2>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Conmutador: Modo Sin Fotos / Con Fotos */}
        <button
          onClick={onToggleModoSinImagenes}
          title={modoSinImagenes ? "Modo sin fotos activado (Clic para mostrar fotos)" : "Fotos activadas (Clic para quitar/ocultar fotos)"}
          className={`flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
            modoSinImagenes 
              ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100' 
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          {modoSinImagenes ? (
            <>
              <ImageOff className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden md:inline">Sin Fotos</span>
            </>
          ) : (
            <>
              <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">Con Fotos</span>
            </>
          )}
        </button>

        {/* Botón: Cambiar Contraseña / Enviar Enlace */}
        <button
          onClick={onAbrirCambiarPassword}
          title="Cambiar contraseña o enviar enlace oficial a mi correo"
          className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition cursor-pointer"
        >
          <KeyRound className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden lg:inline">Contraseña</span>
        </button>

        {/* Saldo de Caja visible en móvil y desktop */}
        <div className="flex items-center gap-1 bg-slate-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs">
          <span className="text-slate-500 font-medium hidden sm:inline">Caja:</span>
          <span className="font-extrabold text-emerald-600">${saldoCaja.toFixed(2)}</span>
        </div>

        {/* Botón Importar Hoja de Excel */}
        <button
          onClick={onImportarExcel}
          title="Importar catálogo o datos desde un archivo Excel (.xlsx, .csv)"
          className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition shadow-2xs cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-teal-600" />
          <span className="hidden sm:inline">Importar</span>
        </button>

        {/* Botón Exportar Hoja de Cálculo */}
        <button
          onClick={onExportarExcel}
          title="Descargar todos los datos en archivo Excel (.xlsx)"
          className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Excel</span>
        </button>

        {/* Botón Vaciar Base de Datos */}
        <button
          onClick={onLimpiarTodo}
          title="Vaciar o reiniciar base de datos"
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 text-xs font-semibold transition-all cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
          <span className="hidden xl:inline ml-1 text-rose-600">Eliminar</span>
        </button>

        {/* Usuario conectado con avatar */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-2 sm:pl-3 ml-1">
          <div className="w-7 h-7 rounded-full bg-pink-100 text-pink-700 border border-pink-200 flex items-center justify-center font-bold text-xs">
            {usuario.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-medium text-slate-700 hidden lg:inline">{usuario}</span>
        </div>
      </div>
    </header>
  );
};
