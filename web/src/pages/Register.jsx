import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { Brand } from '../components/Layout.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setBusy(true);
    try {
      await register(email, password, name);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth__card panel">
        <div className="panel__body">
          <div className="auth__brand"><Brand /></div>
          <h2 className="auth__title">Crea tu cuenta</h2>
          <p className="auth__sub">Empieza a registrar tus ganancias</p>
          <form className="stack" onSubmit={onSubmit}>
            {error && <div className="alert alert--error">{error}</div>}
            <div className="field">
              <label htmlFor="name">Nombre</label>
              <input id="name" className="input" type="text" autoComplete="name"
                value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" className="input" type="email" autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@email.com" />
            </div>
            <div className="field">
              <label htmlFor="pw">Contraseña</label>
              <input id="pw" className="input" type="password" autoComplete="new-password" required
                value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            <button className="btn btn--primary btn--block" disabled={busy}>
              {busy ? 'Creando…' : 'Crear cuenta'}
            </button>
          </form>
          <p className="auth__alt">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
        </div>
      </div>
    </div>
  );
}
