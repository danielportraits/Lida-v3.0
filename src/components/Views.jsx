import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase.js';
import { Bell, Bookmark, Camera, Check, ChevronRight, CircleHelp, Gamepad2, Globe, ImagePlus, LockKeyhole, MessageCircle, MoreHorizontal, Plus, Search, Send, Settings, ShieldCheck, Sparkles, Users, Video, Volume2, X } from 'lucide-react';

export function CommunityView({ onGoStories }) {
  const [tab,setTab]=useState('Todos');
  return <div className="page-content community-view" data-view="community"><div className="page-heading"><div><div className="eyebrow">TU ESPACIO</div><h1>Comunidad</h1><p>Conecta. Comparte. Vive LIDA.</p></div><button className="icon-button green-square" aria-label="Crear publicación"><Plus size={22}/></button></div>
    <div className="search-box"><Search size={18}/><input placeholder="Buscar en la comunidad…"/><button aria-label="Filtros"><Settings size={17}/></button></div>
    <div className="story-strip" data-tour="stories"><button className="story-avatar create-story" onClick={onGoStories}><span className="story-ring"><ImagePlus size={22}/></span><small>Tu historia</small></button><button className="story-avatar" onClick={onGoStories}><span className="story-ring story-empty"><Sparkles size={21}/></span><small>Descubrir</small></button><button className="story-avatar" onClick={onGoStories}><span className="story-ring story-empty"><Video size={21}/></span><small>Reels</small></button><button className="story-avatar" onClick={onGoStories}><span className="story-ring story-empty"><Plus size={21}/></span><small>Crear</small></button></div>
    <div className="segmented">{['Todos','Grupos','Canales'].map(t=><button key={t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t}</button>)}</div>
    <section className="empty-community glass-panel"><div className="empty-icon"><Users size={28}/></div><h2>Tu comunidad empieza aquí</h2><p>Cuando sigas grupos o se publiquen contenidos disponibles para ti, aparecerán en este espacio.</p><button className="secondary-button" onClick={()=>setTab('Grupos')}>Explorar {tab==='Grupos'?'grupos':'comunidad'} <ChevronRight size={16}/></button></section>
    <div className="section-heading"><h2>Explora LIDA</h2><span>Tu espacio, a tu ritmo</span></div><div className="discovery-grid"><button className="discovery-card" onClick={onGoStories}><span><Camera size={20}/></span><strong>Historias</strong><small>Momentos que duran 24 h</small></button><button className="discovery-card" onClick={onGoStories}><span><Video size={20}/></span><strong>Reels</strong><small>Vídeos para descubrir</small></button></div>
  </div>;
}

export function MessagesView({ user, welcomeExists, onOpenWelcome, onStartTour }) {
  const [filter,setFilter]=useState('Todos'); const [query,setQuery]=useState('');
  return <div className="page-content messages-view" data-view="messages"><div className="page-heading"><div><div className="eyebrow">TU ESPACIO</div><h1>Mensajes</h1><p>Conecta. Comparte. Vive LIDA.</p></div><button className="icon-button green-square" aria-label="Nueva conversación" onClick={onStartTour}><MessageCircle size={21}/><Plus className="tiny-plus" size={12}/></button></div>
    <div className="search-box"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar conversaciones…"/><button aria-label="Buscar"><MoreHorizontal size={18}/></button></div>
    <div className="filter-row">{['Todos','No leídos','Favoritos','Grupos'].map(t=><button key={t} className={filter===t?'active':''} onClick={()=>setFilter(t)}>{t}</button>)}</div>
    {welcomeExists ? <button className="conversation-row" onClick={onOpenWelcome}><span className="avatar logo-avatar"><img src={`${import.meta.env.BASE_URL}lida-logo-original.png`} alt=""/></span><span className="conversation-main"><strong>Lida <i className="verified-dot"/></strong><small>¡Bienvenido a LIDA! Este es tu espacio para conectar…</small></span><span className="conversation-time">Ahora</span></button> : <div className="empty-chat"><div className="empty-icon"><MessageCircle size={29}/></div><h2>Tu bandeja está tranquila</h2><p>Cuando agregues a alguien o empieces una conversación, tus chats aparecerán aquí.</p><button className="primary-button" onClick={onStartTour}><Plus size={17}/> Iniciar una conversación</button></div>}
    <div className="subtle-rule"/><div className="privacy-hint"><ShieldCheck size={17}/><span>Tus conversaciones pertenecen a tu cuenta. No mostramos chats de otras personas.</span></div>
  </div>;
}

export function WelcomeChat({ onBack, user }) {
  const storageKey = `lida_welcome_messages_${user?.id || 'preview-user'}`;
  const initialMessages = [{id:1,body:'¡Bienvenido a LIDA! 💚',time:'Ahora',incoming:true},{id:2,body:'Este es tu espacio para conectar, compartir y descubrir. Explora la aplicación a tu ritmo; te acompañaremos en tus primeros pasos.',time:'Ahora',incoming:true}];
  const [text,setText]=useState('');
  const [messages,setMessages]=useState(()=>{try{return JSON.parse(localStorage.getItem(storageKey)) || initialMessages;}catch{return initialMessages;}});
  const [conversationId,setConversationId]=useState(null);
  const realAccount = isSupabaseConfigured && user?.id && user.id !== 'preview-user';
  const formatTime = value => value ? new Date(value).toLocaleTimeString('es-DO',{hour:'numeric',minute:'2-digit'}) : 'Ahora';
  const mapRows = rows => rows.map(row=>({id:row.id,body:row.body,time:formatTime(row.created_at),incoming:row.sender_id !== user?.id}));

  useEffect(()=>{
    if (!realAccount) { localStorage.setItem(storageKey,JSON.stringify(messages)); return; }
    let alive = true; let channel;
    (async()=>{
      const {data:rpcId,error:rpcError}=await supabase.rpc('ensure_lida_welcome');
      if(rpcError || !rpcId) return;
      if(!alive)return;
      setConversationId(rpcId);
      const {data:rows}=await supabase.from('messages').select('id,body,sender_id,created_at').eq('conversation_id',rpcId).order('created_at',{ascending:true});
      if(alive && rows) setMessages(mapRows(rows));
      channel=supabase.channel(`welcome-${rpcId}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:`conversation_id=eq.${rpcId}`},payload=>{
        if(!alive)return;
        setMessages(current=>current.some(m=>m.id===payload.new.id)?current:[...current,{id:payload.new.id,body:payload.new.body,time:formatTime(payload.new.created_at),incoming:payload.new.sender_id!==user?.id}]);
      }).subscribe();
    })();
    return ()=>{alive=false;if(channel)supabase.removeChannel(channel);};
  },[realAccount,storageKey,user?.id]);

  useEffect(()=>{ if(!realAccount) localStorage.setItem(storageKey,JSON.stringify(messages)); },[messages,realAccount,storageKey]);

  async function send(e){
    e.preventDefault(); const body=text.trim(); if(!body)return;
    if(realAccount && conversationId){
      const {error}=await supabase.from('messages').insert({conversation_id:conversationId,sender_id:user.id,body});
      if(error)return;
      setText('');
      const {data:rows}=await supabase.from('messages').select('id,body,sender_id,created_at').eq('conversation_id',conversationId).order('created_at',{ascending:true});
      if(rows)setMessages(mapRows(rows));
      return;
    }
    setMessages(m=>[...m,{id:Date.now(),body,time:new Date().toLocaleTimeString('es-DO',{hour:'numeric',minute:'2-digit'}),incoming:false}]);setText('');
  }
  return <div className="chat-room"><header className="chat-header"><button className="icon-button back-button" onClick={onBack} aria-label="Volver"><ChevronRight className="back-chevron" size={22}/></button><span className="avatar logo-avatar"><img src={`${import.meta.env.BASE_URL}lida-logo-original.png`} alt=""/></span><div className="chat-person"><strong>Lida <i className="verified-dot"/></strong><small>Tu bienvenida a la comunidad</small></div><ShieldCheck size={20} className="neon-icon"/></header><div className="chat-date">HOY</div><div className="message-stack">{messages.map(m=><div key={m.id} className={`message-bubble ${m.incoming?'incoming':'outgoing'}`}>{m.body}<small>{m.time}{!m.incoming?' · ✓✓':''}</small></div>)}</div><form className="message-composer" onSubmit={send}><button type="button" className="icon-button" aria-label="Adjuntar"><Plus size={20}/></button><input value={text} onChange={e=>setText(e.target.value)} placeholder="Escribe un mensaje…"/><button className="send-button" aria-label="Enviar"><Send size={18}/></button></form></div>;
}

export function GamesView() {
  const [game,setGame]=useState(null); const [round,setRound]=useState(0); const [board,setBoard]=useState(Array(9).fill('')); const [turn,setTurn]=useState('X');
  function choose(i){if(board[i]||winner(board))return;const b=[...board];b[i]=turn;setBoard(b);setTurn(turn==='X'?'O':'X');}
  function winner(b){for(const [a,c,d] of [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]])if(b[a]&&b[a]===b[c]&&b[a]===b[d])return b[a];return b.every(Boolean)?'draw':null;}
  function reset(){setBoard(Array(9).fill(''));setTurn('X');setRound(r=>r+1);}
  return <div className="page-content games-view" data-view="games"><div className="page-heading"><div><div className="eyebrow">LIDA ARCADE</div><h1>Games</h1><p>Una pausa, un reto, una partida.</p></div><span className="games-badge"><Gamepad2 size={18}/></span></div>{game==='ttt'?<section className="minigame glass-panel"><button className="text-back" onClick={()=>setGame(null)}><ChevronRight className="back-chevron" size={17}/> Todos los juegos</button><h2>Tres en línea</h2><p>{winner(board)?winner(board)==='draw'?'Empate. ¡Otra partida!':`¡Ganó ${winner(board)}!`:`Turno de ${turn}`}</p><div className="tic-board">{board.map((v,i)=><button key={i} onClick={()=>choose(i)} className={v?'filled':''}>{v}</button>)}</div><button className="primary-button" onClick={reset}>Nueva partida <ArrowLoopIcon/></button></section>:<><div className="games-feature glass-panel"><div className="game-art"><div className="game-orbit"/><Gamepad2 size={48}/><span>1V1</span></div><div><span className="eyebrow">RETO DESTACADO</span><h2>Tres en línea</h2><p>Un clásico rápido para dos turnos en el mismo dispositivo. El emparejamiento online llegará con el backend multijugador.</p><button className="primary-button" onClick={()=>setGame('ttt')}>Jugar ahora <ChevronRight size={16}/></button></div></div><div className="section-heading"><h2>Arcade</h2><span>Selección inicial</span></div><div className="game-list"><div className="game-row"><span className="game-tile"><Sparkles size={22}/></span><div><strong>Próximamente: Duelo de reflejos</strong><small>Reto rápido 1 contra 1</small></div><span className="coming-soon">Próximo</span></div><div className="game-row"><span className="game-tile"><LockKeyhole size={22}/></span><div><strong>Emparejamiento online</strong><small>Partidas en tiempo real</small></div><span className="coming-soon">Próximo</span></div></div></>}</div>;
}
function ArrowLoopIcon(){return <Check size={16}/>}

export function ProfileView({ user, onLogout, onStartTour }) {
  const [section,setSection]=useState('');
  const rows=[['Mi cuenta','Privacidad, seguridad, número',LockKeyhole],['Notificaciones','Tonos, mensajes, grupos',Bell],['Almacenamiento y datos','Uso de red y descarga automática',Bookmark],['Idioma','Español',Globe],['Ayuda','Centro de ayuda y tutorial',CircleHelp]];
  return <div className="page-content profile-view" data-view="profile"><div className="page-heading"><div className="brand-inline"><img src={`${import.meta.env.BASE_URL}lida-logo-original.png`} alt=""/><div><div className="eyebrow">TU ESPACIO</div><h1>Perfil</h1></div></div><button className="icon-button" onClick={()=>setSection('Configuración')} aria-label="Configuración"><Settings size={20}/></button></div><section className="profile-hero glass-panel"><div className="profile-avatar"><img src={`${import.meta.env.BASE_URL}lida-logo-original.png`} alt="Avatar de LIDA"/></div><h2>{user?.username ? `@${user.username}` : 'Tu perfil'}</h2><p>La vida es mejor en comunidad.</p><button className="secondary-button" onClick={()=>setSection('Editar perfil')}>Editar perfil</button><div className="profile-stats"><div><strong>—</strong><small>Publicaciones</small></div><div><strong>—</strong><small>Seguidores</small></div><div><strong>—</strong><small>Siguiendo</small></div></div></section><div className="settings-list">{rows.map(([title,desc,Icon])=><button className="settings-row" key={title} onClick={()=>title==='Ayuda'?onStartTour():setSection(title)}><Icon size={21}/><span><strong>{title}</strong><small>{desc}</small></span><ChevronRight size={17}/></button>)}</div><button className="logout-button" onClick={onLogout}>Cerrar sesión</button>{section&&<div className="modal-backdrop" onClick={()=>setSection('')}><section className="small-modal glass-panel" onClick={e=>e.stopPropagation()}><button className="icon-button modal-close" onClick={()=>setSection('')}><X size={18}/></button><div className="empty-icon"><Settings size={23}/></div><h2>{section}</h2><p>Esta pantalla forma parte de la estructura de LIDA. Sus controles se conectarán a la configuración real en la siguiente fase.</p><button className="primary-button" onClick={()=>setSection('')}>Entendido <Check size={16}/></button></section></div>}</div>;
}
