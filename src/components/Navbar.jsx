import { NavLink } from 'react-router-dom';

const linkStyle = { marginRight: 16, textDecoration: 'none' };

export default function Navbar() {
  return (
    <nav className="navbar">
      <ul>
        <li>
          <NavLink to="/" style={linkStyle}>
            Accueil
          </NavLink>
        </li>
        <li>
          <NavLink to="/connexion" style={linkStyle}>
            Connexion
          </NavLink>
        </li>
        <li>
          <NavLink to="/inscription" style={linkStyle}>
            Inscription
          </NavLink>
        </li>
        <li>
          <NavLink to="/factures" style={linkStyle}>
            Factures
          </NavLink>
        </li>
        <li>
          <NavLink to="/test" style={linkStyle}>
            Test IAx
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
