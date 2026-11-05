import './panel.css';
import './mesa.css';

export const metadata = {
  title: 'Panel Editorial | Jujuy247',
  robots: { index: false, follow: false },
};

// Se ejecuta antes de pintar para que el tema oscuro no parpadee al cargar.
const THEME_BOOT = `(function(){var el=document.currentScript.parentElement;var theme='light';try{var saved=localStorage.getItem('panel-theme');if(saved==='dark'||saved==='light'){theme=saved}else if(window.matchMedia('(prefers-color-scheme: dark)').matches){theme='dark'}}catch(e){}el.setAttribute('data-theme',theme)})();`;

export default function PanelRootLayout({ children }) {
  return (
    <div className="panel-body-wrapper" data-theme="light" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      {children}
    </div>
  );
}
