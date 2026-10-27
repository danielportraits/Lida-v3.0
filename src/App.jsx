import { useCallback, useEffect, useState } from 'react';
import { Bell, Gamepad2, MessageCircle, Search, Users, UserRound, X } from 'lucide-react';
import Splash from './components/Splash.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import Tour from './components/Tour.jsx';
import { CommunityView, GamesView, MessagesView, ProfileView, WelcomeChat } from './components/Views.jsx';
import { isSupabaseConfigured, supabase } from './lib/supabase.js';

const tabs = [
  { id: 'community', label: 'Comunidad', Icon: Users },
  { id: 'messages', label: 'Mensajes', Icon: MessageCircle },
  { id: 'games', label: 'Games', Icon: Gamepad2 },
  { id: 'profile', label: 'Perfil', Icon: UserRound }
];

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('messages');
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [welcomeExists, setWelcomeExists] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [toast, setToast] = useState('');

  const completeSplash = useCallback(() => setShowSplash(false), []);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) hydrateUser(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) hydrateUser(nextSession);
      else { setUser(null); setWelcomeExists(false); }
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  async function hydrateUser(nextSession) {
    const meta = nextSession?.user?.user_metadata || {};
    let username = meta.username || '';
    if (supabase && nextSession?.user?.id) {
      const { data } = await supabase.from('profiles').select('username,has_seen_tour').eq('id', nextSession.user.id).maybeSingle();
      if (data?.username) username = data.username;
      // Idempotent server-side creation: one welcome conversation per registered user.
      await supabase.rpc('ensure_lida_welcome');
      setWelcomeExists(true);
      if (!data?.has_seen_tour && !localStorage.getItem(`lida_tour_${nextSession.user.id}`)) setShowTour(true);
    }
    setUser({ id: nextSession.user.id, username: username || 'usuario' });
  }

  function enterPreview() {
    setIsPreview(true); setUser({ id: 'preview-user', username: 'tu_usuario' });
    setWelcomeExists(false); setActiveTab('messages');
    setToast('Vista previa: los datos no se sincronizan con Supabase.');
    window.setTimeout(() => setToast(''), 4200);
  }

  function startPreviewTour() { setShowTour(true); }
  function finishTour() {
    setShowTour(false);
    if (user?.id && user.id !== 'preview-user') {
      localStorage.setItem(`lida_tour_${user.id}`, '1');
      supabase?.from('profiles').update({ has_seen_tour: true }).eq('id', user.id).then(() => {});
    }
  }

  async function logout() {
    if (isSupabaseConfigured && !isPreview) await supabase.auth.signOut();
    setSession(null); setUser(null); setIsPreview(false); setWelcomeOpen(false); setWelcomeExists(false); setShowTour(false);
  }

  if (showSplash) return <Splash onDone={completeSplash}/>;
  if (!session && !isPreview) return <AuthScreen onPreview={enterPreview} onSignedIn={s => { setSession(s); setIsPreview(false); setUser({ id: s.user.id, username: s.user.user_metadata?.username || 'usuario' }); setWelcomeExists(true); setShowTour(!localStorage.getItem(`lida_tour_${s.user.id}`)); }} />;

  return <div className="app-shell">
    <header className="app-header"><div className="header-brand"><img src={`${import.meta.env.BASE_URL}lida-logo-original.png`} alt="Logotipo original de LIDA"/><span>LIDA</span><i className="live-dot"/></div><div className="header-actions"><button className="icon-button" aria-label="Buscar" onClick={()=>setToast('La búsqueda global se conecta en la siguiente fase.')}><Search size={20}/></button><button className="icon-button" aria-label="Notificaciones" onClick={()=>setToast('No tienes notificaciones nuevas.')}><Bell size={20}/></button><button className="header-user" onClick={()=>setActiveTab('profile')} aria-label="Abrir perfil"><img src={`${import.meta.env.BASE_URL}lida-logo-original.png`} alt=""/></button></div></header>
    {isPreview && <div className="preview-banner"><span>Vista previa de diseño</span><button onClick={logout}>Salir <X size={13}/></button></div>}
    <main className="app-main">
      {welcomeOpen ? <WelcomeChat user={user} onBack={()=>setWelcomeOpen(false)}/> : <>
        {activeTab==='community' && <CommunityView onGoStories={()=>setToast('Historias y Reels se abrirán desde Comunidad en su etapa de contenido.')}/>}
        {activeTab==='messages' && <MessagesView user={user} welcomeExists={welcomeExists} onOpenWelcome={()=>setWelcomeOpen(true)} onStartTour={startPreviewTour}/>}
        {activeTab==='games' && <GamesView/>}
        {activeTab==='profile' && <ProfileView user={user} onLogout={logout} onStartTour={startPreviewTour}/>}
      </>}
    </main>
    {!welcomeOpen && <nav className="bottom-nav" aria-label="Navegación principal">{tabs.map(({id,label,Icon})=><button key={id} className={activeTab===id?'active':''} data-tour={id} onClick={()=>setActiveTab(id)}><span className="nav-icon"><Icon size={21}/>{id==='messages'&&welcomeExists&&<i className="nav-dot"/>}</span><small>{label}</small></button>)}</nav>}
    {showTour && <Tour onClose={finishTour} onStep={target => setActiveTab(target === 'stories' ? 'community' : target)}/>}
    {toast && <div className="toast" role="status">{toast}<button onClick={()=>setToast('')} aria-label="Cerrar aviso"><X size={14}/></button></div>}
  </div>;
}
