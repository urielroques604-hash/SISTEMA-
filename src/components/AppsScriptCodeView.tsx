import React, { useState } from 'react';
import { 
  FileCode, 
  Copy, 
  Check, 
  Download, 
  BookOpen, 
  ExternalLink,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import codigoGsRaw from '../apps-script/Codigo.gs?raw';
import indexHtmlRaw from '../apps-script/Index.html?raw';
import guiaInstalacionRaw from '../apps-script/GUIA_INSTALACION.md?raw';

export const AppsScriptCodeView: React.FC = () => {
  const [tab, setTab] = useState<'guia' | 'codigo-gs' | 'index-html'>('guia');
  const [copiadoGs, setCopiadoGs] = useState(false);
  const [copiadoHtml, setCopiadoHtml] = useState(false);

  const copiarAlPortapapeles = (texto: string, tipo: 'gs' | 'html') => {
    navigator.clipboard.writeText(texto);
    if (tipo === 'gs') {
      setCopiadoGs(true);
      setTimeout(() => setCopiadoGs(false), 2500);
    } else {
      setCopiadoHtml(true);
      setTimeout(() => setCopiadoHtml(false), 2500);
    }
  };

  const descargarArchivo = (contenido: string, nombreArchivo: string, mime: string) => {
    const blob = new Blob([contenido], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const pasos = [
    {
      num: 1,
      titulo: 'Cómo crear el proyecto de Apps Script',
      desc: 'Crea una hoja de cálculo en Google Sheets llamada "VARIEDADES CS - Base de Datos". Ve al menú superior "Extensiones" > "Apps Script".'
    },
    {
      num: 2,
      titulo: 'Cómo crear las hojas',
      desc: '¡No las crees manualmente! La función configurarSistema() de Código.gs las crea automáticamente con todos sus encabezados, colores y formatos.'
    },
    {
      num: 3,
      titulo: 'Dónde pegar Código.gs',
      desc: 'En el editor de Apps Script, abre el archivo Código.gs, borra lo que haya y pega el código completo de la pestaña Código.gs. Guarda con Ctrl + S.'
    },
    {
      num: 4,
      titulo: 'Dónde crear Index.html',
      desc: 'En Apps Script, haz clic en el botón "+" junto a Archivos, selecciona "HTML", escribe el nombre "Index" (con I mayúscula) y pega el contenido de Index.html.'
    },
    {
      num: 5,
      titulo: 'Cómo ejecutar la función de configuración inicial',
      desc: 'En la barra superior de Apps Script, selecciona del desplegable de funciones "configurarSistema" y presiona "Ejecutar". Esto creará todas las hojas en tu Sheet.'
    },
    {
      num: 6,
      titulo: 'Cómo implementar como aplicación web',
      desc: 'Haz clic en el botón azul "Implementar" (arriba a la derecha) > "Nueva implementación" > tipo "Aplicación web". Ejecutar como: "Yo". Quién tiene acceso: "Cualquier usuario".'
    },
    {
      num: 7,
      titulo: 'Qué permisos aceptar',
      desc: 'Cuando Google pida autorizar, haz clic en "Revisar permisos" > Selecciona tu cuenta > "Configuración avanzada" > "Ir a VARIEDADES CS - Backend (no seguro)" > "Permitir".'
    },
    {
      num: 8,
      titulo: 'Cómo abrir la aplicación',
      desc: 'Copia la URL web generada (termina en /exec). Ábrela en tu navegador o celular e ingresa con: JENIFER SANCHEZ (12345) o URIEL ROQUES (12345).'
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Selector de pestañas */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-2">
        <button
          onClick={() => setTab('guia')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            tab === 'guia' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Guía Paso a Paso (PASO 1 al 8)</span>
        </button>

        <button
          onClick={() => setTab('codigo-gs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            tab === 'codigo-gs' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Código.gs ({codigoGsRaw.split('\n').length} líneas)</span>
        </button>

        <button
          onClick={() => setTab('index-html')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            tab === 'index-html' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Index.html ({indexHtmlRaw.split('\n').length} líneas)</span>
        </button>
      </div>

      {/* PESTAÑA: GUÍA PASO A PASO */}
      {tab === 'guia' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-2xl shadow-sm">
            <h3 className="text-xl font-extrabold mb-1">Guía Oficial de Despliegue en Google Apps Script</h3>
            <p className="text-xs text-blue-200">
              Sigue estos 8 pasos para tener VARIEDADES CS 100% operativo en tu propio Google Drive y Google Sheets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pasos.map(p => (
              <div key={p.num} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex gap-3.5">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0">
                  {p.num}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 mb-1">{p.titulo}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Usuarios y credenciales de acceso */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-3">
              Credenciales Oficiales de Acceso Inicial
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 font-semibold block">Usuario 1:</span>
                <span className="font-bold text-slate-800 text-sm">JENIFER SANCHEZ</span>
                <span className="text-slate-500 block mt-0.5">Contraseña: <strong className="text-blue-600">12345</strong></span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 font-semibold block">Usuario 2:</span>
                <span className="font-bold text-slate-800 text-sm">URIEL ROQUES</span>
                <span className="text-slate-500 block mt-0.5">Contraseña: <strong className="text-blue-600">12345</strong></span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              * Puedes cambiar estas contraseñas o agregar más usuarios directamente en la hoja "Usuarios" de tu Google Sheet.
            </p>
          </div>
        </div>
      )}

      {/* PESTAÑA: CÓDIGO.GS */}
      {tab === 'codigo-gs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-xs text-slate-800">Código.gs</span>
              <span className="text-[11px] text-slate-400">(Backend Google Apps Script)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copiarAlPortapapeles(codigoGsRaw, 'gs')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
              >
                {copiadoGs ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiadoGs ? '¡Copiado!' : 'Copiar Código'}</span>
              </button>

              <button
                onClick={() => descargarArchivo(codigoGsRaw, 'Código.gs', 'text/javascript')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar .gs</span>
              </button>
            </div>
          </div>

          <pre className="p-4 text-[11px] font-mono leading-relaxed bg-slate-950 text-slate-200 max-h-[550px] overflow-y-auto select-all">
            {codigoGsRaw}
          </pre>
        </div>
      )}

      {/* PESTAÑA: INDEX.HTML */}
      {tab === 'index-html' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-xs text-slate-800">Index.html</span>
              <span className="text-[11px] text-slate-400">(Frontend Responsive con CSS & JS)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copiarAlPortapapeles(indexHtmlRaw, 'html')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
              >
                {copiadoHtml ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiadoHtml ? '¡Copiado!' : 'Copiar Index.html'}</span>
              </button>

              <button
                onClick={() => descargarArchivo(indexHtmlRaw, 'Index.html', 'text/html')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar .html</span>
              </button>
            </div>
          </div>

          <pre className="p-4 text-[11px] font-mono leading-relaxed bg-slate-950 text-slate-200 max-h-[550px] overflow-y-auto select-all">
            {indexHtmlRaw}
          </pre>
        </div>
      )}
    </div>
  );
};
