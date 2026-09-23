import React, { useState } from 'react';
import { 
  Coins, 
  Check, 
  X, 
  RefreshCw, 
  Sparkles, 
  TrendingUp, 
  Building2, 
  CheckCircle2, 
  Info,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { 
  formatoUSD, 
  formatoNIO, 
  TASA_CAMBIO_DEFAULT, 
  BANCOS_REFERENCIA,
  TASA_BANCO_OFICIAL_BCN,
  TASA_BANCO_COMERCIAL_VENTA
} from '../utils/currency';

interface ModalTasaCambioProps {
  tasaActual: number;
  onGuardarTasa: (nuevaTasa: number) => void;
  onClose: () => void;
}

export const ModalTasaCambio: React.FC<ModalTasaCambioProps> = ({
  tasaActual,
  onGuardarTasa,
  onClose
}) => {
  const [tasaInput, setTasaInput] = useState<string>(String(tasaActual));
  const [error, setError] = useState<string | null>(null);

  const tasaNumero = parseFloat(tasaInput) || 0;

  // Identificar si la tasa actual o seleccionada coincide con algún banco
  const bancoSeleccionado = BANCOS_REFERENCIA.find(b => Math.abs(b.tasa - tasaNumero) < 0.009);

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (tasaNumero <= 0 || isNaN(tasaNumero)) {
      setError('La tasa de cambio debe ser un número mayor a 0 (ej: 36.62 o 37.15).');
      return;
    }
    onGuardarTasa(tasaNumero);
    onClose();
  };

  const seleccionarBanco = (tasa: number) => {
    setTasaInput(String(tasa));
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden animate-scale-in my-auto">
        
        {/* Header Corporativo Bancario */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-4 sm:p-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white tracking-tight">
                  Tipo de Cambio Bancario
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Nicaragua (NIO / USD)
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Ajustado con la tasa de los bancos (BCN y bancos comerciales)
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Estado actual activo */}
        <div className="p-4 sm:p-5 space-y-4 text-xs">
          
          <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-blue-950 block text-xs">
                  Tasa Activa en el Sistema:
                </span>
                <span className="text-[11px] text-blue-800">
                  {bancoSeleccionado ? `${bancoSeleccionado.nombre} (${bancoSeleccionado.tipo})` : 'Tasa personalizada'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono font-black text-base text-blue-900 bg-white px-2.5 py-1 rounded-xl border border-blue-200 shadow-2xs inline-block">
                1 $ = C$ {tasaActual.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Opciones directas por Banco (1-Clic) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                Selecciona la tasa de tu Banco de preferencia:
              </span>
              <span className="text-[10px] text-slate-500">Un solo clic</span>
            </div>

            <div className="space-y-2">
              {BANCOS_REFERENCIA.map((banco) => {
                const esActivo = Math.abs(tasaNumero - banco.tasa) < 0.009;
                return (
                  <button
                    key={banco.id}
                    type="button"
                    onClick={() => seleccionarBanco(banco.tasa)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                      esActivo
                        ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-400/20 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                        banco.id === 'bcn' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : banco.id === 'bac' 
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : banco.id === 'banpro'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-teal-100 text-teal-800 border border-teal-200'
                      }`}>
                        {banco.id.toUpperCase().slice(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-xs">
                            {banco.nombre}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white text-slate-600 border border-slate-200">
                            {banco.tipo}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                          {banco.descripcion}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <div className={`font-mono font-black text-sm ${esActivo ? 'text-blue-700' : 'text-slate-800'}`}>
                        C$ {banco.tasa.toFixed(2)}
                      </div>
                      <span className="text-[9px] text-slate-400">por 1 $ USD</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Formulario de Guardado & Edición Manual */}
          <form onSubmit={handleGuardar} className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block font-bold text-slate-800 mb-1 text-xs">
                O ingresa manualmente el tipo de cambio deseado:
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-xs">
                  1 $ USD = C$
                </span>
                <input
                  type="number"
                  step="0.0001"
                  min="0.01"
                  required
                  value={tasaInput}
                  onChange={e => {
                    setError(null);
                    setTasaInput(e.target.value);
                  }}
                  className="w-full pl-24 pr-4 py-2.5 bg-white border-2 border-slate-300 focus:border-blue-600 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Ej: 36.62 o 37.15"
                />
              </div>
              {error && <p className="text-rose-600 font-semibold mt-1 text-[11px]">{error}</p>}
            </div>

            {/* Simulación en Vivo con la Tasa Seleccionada */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
              <span className="font-extrabold text-slate-800 block text-[11px] flex items-center justify-between">
                <span>Conversión en tiempo real (1 $ = C$ {tasaNumero > 0 ? tasaNumero.toFixed(2) : '0.00'}):</span>
                <span className="text-[10px] text-emerald-700 font-bold">Automático</span>
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
                  <span className="text-slate-400 block text-[10px]">$1.00 USD</span>
                  <span className="font-black text-slate-900 text-xs">C$ {(1 * tasaNumero).toFixed(2)}</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
                  <span className="text-slate-400 block text-[10px]">$10.00 USD</span>
                  <span className="font-black text-slate-900 text-xs">C$ {(10 * tasaNumero).toFixed(2)}</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
                  <span className="text-slate-400 block text-[10px]">$50.00 USD</span>
                  <span className="font-black text-slate-900 text-xs">C$ {(50 * tasaNumero).toFixed(2)}</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
                  <span className="text-slate-400 block text-[10px]">$100.00 USD</span>
                  <span className="font-black text-slate-900 text-xs">C$ {(100 * tasaNumero).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Botones de Confirmación */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Aplicar Tasa de Cambio</span>
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};
