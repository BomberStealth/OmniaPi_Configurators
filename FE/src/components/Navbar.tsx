import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getSession, logout } from '../auth';
import './Navbar.css';

interface NavItem {
  label: string;
  to?: string;
  href?: string;
  isActive: (path: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Home',
    href: '/',
    isActive: () => false,
  },
  {
    label: 'Configuratori',
    to: '/',
    isActive: (p) => p !== '/info',
  },
  {
    label: 'Info',
    to: '/info',
    isActive: (p) => p === '/info',
  },
];

// Breadcrumb per le pagine di configuratore specifico
const TOOL_CRUMBS: Record<string, string> = {
  '/fotovoltaico': 'Struttura FTV',
  '/western': 'Western Energy',
  '/prese-interbloccate': 'Prese Interbloccate',
  '/ajax': 'Preventivi AJAX',
  '/canale': 'Canale in Metallo',
};

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = getSession();
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, opacity: 0 });
  const [mobileOpen, setMobileOpen] = useState(false);

  const toolCrumb = TOOL_CRUMBS[location.pathname] ?? null;

  const slide = (el: HTMLElement) => {
    setIndicator({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 });
  };

  const slideToActive = () => {
    if (!containerRef.current) return;
    const active = containerRef.current.querySelector('.cfg-nav-link.active') as HTMLElement | null;
    if (active) slide(active);
    else setIndicator(prev => ({ ...prev, opacity: 0 }));
  };

  useEffect(() => {
    const id = requestAnimationFrame(slideToActive);
    return () => cancelAnimationFrame(id);
  }, [location.pathname]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); setMobileOpen(false); };
  const handleMobileNav = () => setMobileOpen(false);

  const renderLabel = (item: NavItem) => {
    if (item.label === 'Configuratori' && toolCrumb) {
      return (
        <span className="cfg-nav-crumb-stack">
          <span className="cfg-nav-crumb-parent">Configuratori</span>
          <span className="cfg-nav-crumb-child">{toolCrumb}</span>
        </span>
      );
    }
    return item.label;
  };

  return (
    <header className="cfg-navbar">
      <div className="cfg-navbar-inner">
        <Link to="/" className="cfg-navbar-logo">
          <span className="cfg-navbar-logo-icon">⚙</span>
          <span className="cfg-navbar-logo-text">
            OmniaPi <strong>Configuratori</strong>
          </span>
        </Link>

        <div
          className="cfg-navbar-links"
          ref={containerRef}
          onMouseLeave={slideToActive}
        >
          <div
            className="cfg-nav-indicator"
            style={{ left: indicator.left, width: indicator.width, opacity: indicator.opacity }}
          />
          {NAV_ITEMS.map(item => {
            const isActive = item.isActive(location.pathname);
            const cls = `cfg-nav-link${isActive ? ' active' : ''}`;
            if (item.href) {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={cls}
                  onMouseEnter={e => slide(e.currentTarget)}
                >
                  {renderLabel(item)}
                </a>
              );
            }
            return (
              <Link
                key={item.label}
                to={item.to!}
                className={cls}
                onMouseEnter={e => slide(e.currentTarget)}
              >
                {renderLabel(item)}
              </Link>
            );
          })}
        </div>

        <div className="cfg-navbar-right">
          {session ? (
            <div className="cfg-navbar-user">
              <div className="cfg-navbar-avatar">{session.name.charAt(0).toUpperCase()}</div>
              <span className="cfg-navbar-username">{session.name}</span>
              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Esci</button>
            </div>
          ) : (
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/login')}>
              Accedi
            </button>
          )}
        </div>

        <button
          className={`cfg-navbar-burger${mobileOpen ? ' open' : ''}`}
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Apri menu"
          aria-expanded={mobileOpen}
        >
          <span /><span /><span />
        </button>
      </div>

      {mobileOpen && (
        <div className="cfg-navbar-mobile">
          {NAV_ITEMS.map(item => {
            const isActive = item.isActive(location.pathname);
            const cls = `cfg-navbar-mobile-link${isActive ? ' active' : ''}`;
            if (item.href) {
              return <a key={item.label} href={item.href} className={cls} onClick={handleMobileNav}>{item.label}</a>;
            }
            return <Link key={item.label} to={item.to!} className={cls} onClick={handleMobileNav}>{item.label}</Link>;
          })}
          {toolCrumb && <div className="cfg-navbar-mobile-crumb">↳ {toolCrumb}</div>}

          <div className="cfg-navbar-mobile-user">
            {session ? (
              <>
                <div className="cfg-navbar-user">
                  <div className="cfg-navbar-avatar">{session.name.charAt(0).toUpperCase()}</div>
                  <span className="cfg-navbar-username">{session.name}</span>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Esci</button>
              </>
            ) : (
              <button className="btn btn-secondary btn-sm" onClick={() => { navigate('/login'); setMobileOpen(false); }}>
                Accedi
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
