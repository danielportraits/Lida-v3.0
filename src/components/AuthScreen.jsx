import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export default function AuthScreen({ onPreview, onSignedIn }) {
  const [mode, setMode] = useState('signup');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const signUp = mode === 'signup';

  async function submit(e) {
    e.preventDefault(); setError(''); setNotice(''); setBusy(true);
    try {
      if (!isSupabaseConfigured) { setError('Supabase aún no está configurado. Puedes explorar la vista previa o añadir las claves en .env.local.'); return; }
      if (signUp) {
        const clean = username.trim().replace(/^@/, '').toLowerCase();
        if (!/^[a-z0-9_]{3,24}$/.test(clean)) throw new Error('El usuario debe tener entre 3 y 24 caracteres: letras, números o guion bajo.');
        const { data, error: authError } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { username: clean } } });
        if (authError) throw authError;
        if (data.user && !data.session) setNotice('Cuenta creada. Revisa tu correo para verificarla antes de iniciar sesión.');
        else if (data.session) { localStorage.setItem('lida_first_signup', '1'); onSignedIn(data.session); }
      } else {
        const { data, error: loginError } = await supabase.functions.invoke('login-by-username', { body: { username: username.trim().replace(/^@/, '').toLowerCase(), password } });
        if (loginError) throw loginError;
        if (!data?.access_token || !data?.refresh_token) throw new Error(data?.error || 'No se pudo iniciar sesión. Verifica usuario y contraseña.');
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
        if (sessionError) throw sessionError;
        onSignedIn(sessionData.session);
      }
    } catch (err) { setError(err.message || 'Ocurrió un error. Inténtalo de nuevo.'); }
    finally { setBusy(false); }
  }

  return <main className="auth-page">
    <section className="auth-visual"><img src={`${import.meta.env.BASE_URL}lida-logo-original.png`} alt="Logotipo original LIDA" className="auth-logo"/><div className="eyebrow"><span className="live-dot"/> TU ESPACIO, TU COMUNIDAD</div><h1>Conecta.<br/><em>Comparte.</em><br/>Vive LIDA.</h1><p>Un espacio creado para conectar con lo que importa.</p><div className="auth-orbit orbit-one"/><div className="auth-orbit orbit-two"/></section>
    <section className="auth-card glass-panel">
      <div className="auth-switch"><button className={signUp ? 'selected' : ''} onClick={() => {setMode('signup');setError('');setNotice('');}}>Crear cuenta</button><button className={!signUp ? 'selected' : ''} onClick={() => {setMode('login');setError('');setNotice('');}}>Iniciar sesión</button></div>
      <div className="auth-heading"><span className="eyebrow">BIENVENIDO A LIDA</span><h2>{signUp ? 'Empieza tu historia' : 'Qué bueno verte'}</h2><p>{signUp ? 'Crea tu espacio en unos pocos pasos.' : 'Entra a tu comunidad.'}</p></div>
      <form onSubmit={submit} className="auth-form">
        <label className="field"><span>Nombre de usuario</span><div className="field-control"><UserRound size={18}/><span className="at-sign">@</span><input required autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} placeholder="tu_usuario" minLength={3} maxLength={24}/></div></label>
        {signUp && <label className="field"><span>Correo electrónico</span><div className="field-control"><Mail size={18}/><input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@correo.com"/></div></label>}
        <label className="field"><span>Contraseña</span><div className="field-control"><LockKeyhole size={18}/><input required autoComplete={signUp ? 'new-password' : 'current-password'} type={showPassword ? 'text' : 'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" minLength={8}/><button type="button" className="icon-button inline-icon" onClick={()=>setShowPassword(v=>!v)} aria-label="Mostrar u ocultar contraseña">{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>
        {error && <p className="form-alert error">{error}</p>}{notice && <p className="form-alert success">{notice}</p>}
        <button className="primary-button auth-submit" disabled={busy}>{busy ? 'Un momento…' : signUp ? 'Crear mi cuenta' : 'Entrar a LIDA'} <ArrowRight size={18}/></button>
      </form>
      {!isSupabaseConfigured && <div className="preview-note"><span className="live-dot"/> Vista previa disponible · Supabase sin configurar</div>}
      <button className="preview-link" onClick={onPreview}>Explorar la interfaz de muestra <ArrowRight size={15}/></button>
      <p className="auth-legal">Al continuar, aceptas las normas de comunidad y la política de privacidad de LIDA.</p>
    </section>
  </main>;
}
