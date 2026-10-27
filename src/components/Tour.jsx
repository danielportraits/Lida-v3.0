import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
const steps = [
  { target: 'community', title: 'Tu comunidad', body: 'Descubre grupos, publicaciones y espacios para compartir intereses.' },
  { target: 'messages', title: 'Mensajes privados', body: 'Encuentra conversaciones, inicia un chat y mantén tus mensajes organizados.' },
  { target: 'games', title: 'Juega con otras personas', body: 'Explora los juegos disponibles y reta a alguien cuando el modo multijugador esté habilitado.' },
  { target: 'profile', title: 'Tu perfil y ajustes', body: 'Personaliza tu perfil, controla tu privacidad y configura las notificaciones.' },
  { target: 'stories', title: 'Historias y Reels', body: 'Desde Comunidad podrás acceder a historias y vídeos cortos cuando quieras descubrir contenido.' }
];
export default function Tour({ onClose, onStep }) {
  const [index, setIndex] = useState(0); const step = steps[index];
  useEffect(() => {
    onStep?.(step.target);
    const target = document.querySelector(`[data-tour=\"${step.target}\"]`);
    if (target) target.classList.add('tour-highlight');
    return () => { if (target) target.classList.remove('tour-highlight'); };
  }, [step.target, onStep]);
  return <div className="tour-overlay"><div className="tour-focus-ring" data-tour-focus={step.target}/><section className="tour-card glass-panel" role="dialog" aria-modal="true" aria-labelledby="tour-title"><div className="tour-top"><span className="eyebrow">PRIMEROS PASOS · {String(index+1).padStart(2,'0')} / {String(steps.length).padStart(2,'0')}</span><button className="icon-button" onClick={onClose} aria-label="Omitir recorrido"><X size={18}/></button></div><div className="tour-progress">{steps.map((s,i)=><span key={s.target} className={i<=index?'done':''}/>)}</div><div className="tour-kicker">DESCUBRE LIDA</div><div className="tour-target-label">ENFOQUE · {step.target === 'community' ? 'Comunidad' : step.target === 'messages' ? 'Mensajes' : step.target === 'games' ? 'Games' : step.target === 'profile' ? 'Perfil' : 'Historias y Reels'}</div><h2 id="tour-title">{step.title}</h2><p>{step.body}</p><div className="tour-actions">{index>0 ? <button className="secondary-button" onClick={()=>setIndex(i=>i-1)}><ArrowLeft size={16}/> Atrás</button> : <button className="secondary-button" onClick={onClose}>Omitir</button>}{index<steps.length-1 ? <button className="primary-button" onClick={()=>setIndex(i=>i+1)}>Siguiente <ArrowRight size={16}/></button> : <button className="primary-button" onClick={onClose}>¡Empezar! <Check size={16}/></button>}</div><div className="tour-pointer"/></section></div>;
}
