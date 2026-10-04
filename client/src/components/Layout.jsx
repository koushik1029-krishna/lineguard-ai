import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="layout">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <div className="brand">
            <p className="brand-kicker">Northline Fabrication</p>
            <NavLink to="/" className="brand-name">
              LineGuard
            </NavLink>
          </div>
          <nav className="site-nav" aria-label="Primary">
            <NavLink to="/" end>
              Dashboard
            </NavLink>
            <NavLink to="/incidents">Incidents</NavLink>
            <NavLink to="/incidents/new" className="nav-report">
              Report incident
            </NavLink>
          </nav>
        </div>
      </header>
      <main id="main" className="layout-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>Fictional training application for Northline Fabrication. Sample records only.</p>
      </footer>
    </div>
  );
}
