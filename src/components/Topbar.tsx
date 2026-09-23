import React from 'react';
import { Menu, Trash2, FileSpreadsheet, Upload, KeyRound, ImageOff, Image as ImageIcon, Coins, UserCheck } from 'lucide-react';
import { formatoUSD, formatoNIO, aCordobas } from '../utils/currency';

interface TopbarProps {
  titulo: string;
  usuario: string;
  saldoCaja: number;
  tasaCambio: number;
  onAbrirModalTasa: () => void;
  onExportarExcel: () => void;
  onImportarExcel: () => void;
  onLimpiarTodo: () => void;
  onAbrirMenuMovil?: () => void;
  modoSinImagenes: boolean;
  onToggleModoSinImagenes: () => void;
  onAbrirCambiarPassword: () => void;
  onCambiarCajero?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  titulo,
  usuario,
  saldoCaja,
  tasaCambio,
  onAbrirModalTasa,
  onExportarExcel,
  onImportarExcel,
  onLimpiarTodo,
  onAbrirMenuMovil,
  modoSinImagenes,
  onToggleModoSinImagenes,
  onAbrirCambiarPassword,
  onCambiarCajero
}) => {
  const saldoCordobas = aCordobas(saldoCaja, tasaCambio);

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
        {/* Botón Configurar Tasa de Cambio (Dólares / Córdobas) */}
        <button
          onClick={onAbrirModalTasa}
          title="Tasa de Cambio Oficial (Clic para modificar)"
          className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black transition cursor-pointer shadow-2xs group"
        >
          <Coins className="w-3.5 h-3.5 text-emerald-600 group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">Tasa:</span>
          <span>1$ = C${tasaCambio.toFixed(2)}</span>
        </button>

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

        {/* Botón: Cambiar Contraseña */}
        <button
          onClick={onAbrirCambiarPassword}
          title="Cambiar contraseña o enviar enlace oficial a mi correo"
          className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition cursor-pointer"
        >
          <KeyRound className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden lg:inline">Contraseña</span>
        </button>

        {/* Saldo de Caja en Dólar y Córdoba */}
        <div 
          className="flex items-center gap-1 bg-slate-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs"
          title={`Saldo Caja: ${formatoUSD(saldoCaja)} = ${formatoNIO(saldoCordobas)}`}
        >
          <span className="text-slate-500 font-medium hidden sm:inline">Caja:</span>
          <span className="font-extrabold text-emerald-600">{formatoUSD(saldoCaja)}</span>
          <span className="text-[10px] text-slate-400 font-semibold hidden xl:inline">
            / {formatoNIO(saldoCordobas)}
          </span>
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

        {/* Usuario conectado con botón de cambio de personal */}
        <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2 sm:pl-3 ml-1">
          <button
            type="button"
            onClick={onCambiarCajero}
            title="Clic para cambiar vendedor o persona que atiende"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold transition cursor-pointer group"
          >
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-[10px] shrink-0">
              {usuario.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden lg:block">
              <span className="text-[9px] text-blue-500 font-semibold block leading-tight">Atendido por:</span>
              <span className="truncate max-w-[130px] block leading-tight">{usuario}</span>
            </div>
            <span className="lg:hidden text-xs font-bold truncate max-w-[90px]">{usuario}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
