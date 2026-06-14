import { THEME_COOKIE } from "@/lib/i18n";

// Blocking inline script that runs before first paint to prevent a theme flash.
// When the `theme` cookie exists the server has already set <html class>, so this
// is a confirming no-op. When it is absent (first visit) we upgrade to the system
// preference here, since the server cannot read prefers-color-scheme. <html> has
// suppressHydrationWarning, so mutating the class before hydration is safe.
export function ThemeScript() {
  const js = `(function(){try{var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=([^;]+)/);var t=m?decodeURIComponent(m[1]):(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.classList.toggle('dark',t==='dark');}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
