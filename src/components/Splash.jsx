import { useEffect } from 'react';

export default function Splash({ onDone }) {
  useEffect(() => { const id = window.setTimeout(onDone, 4600); return () => window.clearTimeout(id); }, [onDone]);
  return <div className="splash-screen" aria-label="LIDA cargando"><img className="splash-logo" src={`${import.meta.env.BASE_URL}lida-logo-original.png`} alt="Logotipo original de LIDA" /></div>;
}
