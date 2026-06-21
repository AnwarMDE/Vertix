import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import {
  IconDashboard, IconCalculator, IconList, IconCalendar, IconLogout, IconPlus,
} from './icons.jsx';
import { useNavigate } from 'react-router-dom';

const NAV = [
  { to: '/', label: 'Dashboard', icon: IconDashboard, end: true, sub: 'Resumen de tu rendimiento' },
  { to: '/calculadora', label: 'Calculadora', icon: IconCalculator, sub: 'Calcula stakes y surebets' },
  { to: '/apuestas', label: 'Apuestas', icon: IconList, sub: 'Registro de tus operaciones' },
  { to: '/calendario', label: 'Calendario', icon: IconCalendar, sub: 'Ganancias por día' },
];

export function Brand() {
  return (
    <div className="brand">
      <span className="brand__mark" aria-hidden="true">
        <svg viewBox="0 0 100 100" width="30" height="30">
          <path d="M50 16 L50 32 L30 50 L20 40 Z" fill="#17a374" />
          <path d="M50 16 L80 40 L70 50 L50 32 Z" fill="#2bbd8c" />
          <path d="M50 54 L50 70 L30 88 L20 78 Z" fill="#0e7355" />
          <path d="M50 54 L80 78 L70 88 L50 70 Z" fill="#17a374" />
        </svg>
      </span>
      <div className="brand__name"><span>V</span>ertix</div>
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const current = NAV.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to))) || NAV[0];
  const initials = (user?.name || user?.email || '?').trim().slice(0, 1).toUpperCase();

  return (
    <div className="app">
      <aside className="sidebar">
        <Brand />
        <nav className="nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className="nav__link">
              <n.icon /> <span className="label-extra">{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__foot">
          <div className="userchip">
            <div className="userchip__avatar">{initials}</div>
            <div className="userchip__meta grow">
              <div className="userchip__name">{user?.name || 'Mi cuenta'}</div>
              <div className="userchip__email">{user?.email}</div>
            </div>
            <button className="btn btn--icon btn--ghost" title="Cerrar sesión" onClick={logout}>
              <IconLogout size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar__title">
            <h1>{current.label}</h1>
            <small>{current.sub}</small>
          </div>
          {location.pathname !== '/calculadora' && (
            <button className="btn btn--primary" onClick={() => navigate('/calculadora')}>
              <IconPlus size={16} /> Nueva surebet
            </button>
          )}
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
