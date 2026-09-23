import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Receipt, 
  RotateCcw, 
  FileText, 
  ShoppingBasket, 
  Users, 
  Truck, 
  CreditCard, 
  BadgePercent, 
  Wallet, 
  BarChart3, 
  FileSpreadsheet,
  Upload,
  LogOut,
  Mail,
  X,
  KeyRound,
  Sparkles,
  UserCheck
} from 'lucide-react';

interface SidebarProps {
  vistaActual: string;
  setVistaActual: (v: string) => void;
  usuario: string;
  rol: string;
  onLogout: () => void;
  carritoCount: number;
  onExportarExcel: () => void;
  onImportarExcel?: () => void;
  menuAbiertoMovil?: boolean;
  onCerrarMenuMovil?: () => void;
  modoSinImagenes?: boolean;
  onAbrirCambiarPassword?: () => void;
  onCambiarCajero?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  vistaActual,
  setVistaActual,
  usuario,
  rol,
  onLogout,
  carritoCount,
  onExportarExcel,
  onImportarExcel,
  menuAbiertoMovil = false,
  onCerrarMenuMovil,
  modoSinImagenes = false,
  onAbrirCambiarPassword,
  onCambiarCajero
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'Punto de Venta', icon: ShoppingBag, badge: carritoCount > 0 ? `${carritoCount}` : null },
    { id: 'productos', label: 'Productos', icon: Package },
    { id: 'ventas', label: 'Ventas', icon: Receipt },
    { id: 'anular', label: 'Anular Venta', icon: RotateCcw, color: 'text-rose-400' },
    { id: 'facturas', label: 'Facturas / Notas', icon: FileText },
    { id: 'compras', label: 'Compras', icon: ShoppingBasket },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'proveedores', label: 'Proveedores', icon: Truck },
    { id: 'creditos', label: 'Créditos y Abonos', icon: CreditCard },
    { id: 'cxc', label: 'Cuentas por Cobrar', icon: BadgePercent },
    { id: 'caja', label: 'Caja & Arqueo', icon: Wallet },
    { id: 'inventario', label: 'Inventario', icon: BarChart3 },
    { id: 'gmail', label: 'Gmail', icon: Mail, color: 'text-red-400' }
  ];

  const handleSeleccionar = (id: string) => {
    setVistaActual(id);
    if (onCerrarMenuMovil) {
      onCerrarMenuMovil();
    }
  };

  const contenidoSidebar = (
    <div className="w-72 md:w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 select-none">
      {/* Brand Header con el Logo Oficial o Emblema sin imagen */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-pink-100 flex-shrink-0 border border-pink-300/40 shadow-xs flex items-center justify-center">
            <img
              src="/logo.jpg"
              alt="VARIEDADES CS"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs font-black text-white tracking-widest uppercase truncate">
              VARIEDADES CS
            </h1>
            <span className="text-[10px] text-pink-300 font-semibold block truncate">
              Perfumería & De Todo Un Poco
            </span>
          </div>
        </div>

        {/* Botón cerrar en móvil */}
        {onCerrarMenuMovil && (
          <button
            onClick={onCerrarMenuMovil}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1 text-xs">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = vistaActual === item.id;
          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => handleSeleccionar(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all font-medium text-left ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.color || 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full text-[10px]">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Botones de Excel: Importar y Exportar */}
        <div className="pt-3 pb-1 space-y-2 border-t border-slate-800/80 my-2">
          {onImportarExcel && (
            <button
              onClick={() => {
                onImportarExcel();
                if (onCerrarMenuMovil) onCerrarMenuMovil();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all font-semibold text-teal-400 hover:bg-teal-950/40 border border-teal-800/40 text-left text-xs"
              title="Cargar datos de productos, clientes o proveedores desde Excel"
            >
              <Upload className="w-4 h-4 text-teal-400 flex-shrink-0" />
              <span>Importar de Excel</span>
            </button>
          )}

          <button
            onClick={() => {
              onExportarExcel();
              if (onCerrarMenuMovil) onCerrarMenuMovil();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all font-semibold text-emerald-400 hover:bg-emerald-950/40 border border-emerald-800/40 text-left text-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Exportar a Excel</span>
          </button>
        </div>
      </nav>

      {/* User info & Atendido por */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between">
          <div 
            onClick={onCambiarCajero}
            className="truncate pr-2 cursor-pointer group"
            title="Clic para cambiar vendedor o persona que atiende"
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <p className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors truncate">
                {usuario}
              </p>
            </div>
            <p className="text-[10px] text-slate-400">Atendido por • {rol}</p>
          </div>
          <div className="flex items-center gap-1">
            {onCambiarCajero && (
              <button
                type="button"
                onClick={onCambiarCajero}
                title="Cambiar personal que atiende"
                className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/30 rounded-xl transition-colors shrink-0 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
              </button>
            )}
            {onAbrirCambiarPassword && (
              <button
                onClick={onAbrirCambiarPassword}
                title="Seguridad & Contraseña"
                className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-950/30 rounded-xl transition-colors shrink-0 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. SIDEBAR DE ESCRITORIO (Visible en md y superiores) */}
      <aside id="sidebar-desktop" className="hidden md:flex md:w-64 flex-shrink-0 h-full">
        {contenidoSidebar}
      </aside>

      {/* 2. DRAWER MÓVIL (Slide-over con fondo oscuro para teléfonos) */}
      {menuAbiertoMovil && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Overlay oscuro de fondo */}
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onCerrarMenuMovil}
          />
          
          {/* Panel deslizante */}
          <div className="relative z-10 flex h-full max-w-[85vw] shadow-2xl animate-in slide-in-from-left duration-200">
            {contenidoSidebar}
          </div>
        </div>
      )}
    </>
  );
};
