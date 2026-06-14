import { THEME_COOKIE } from "@/lib/i18n";

// Blocking inline script that runs before first paint to prevent a theme flash.
// When the `theme` cookie exists the server has already set <html class>, so this
// is a confirming no-op. When it is absent (first visit) we resolve the system
// preference here (the server cannot read prefers-color-scheme) AND persist it to
// the cookie. Persisting is essential: a later router.refresh() (e.g. from the
// language toggle) re-renders <html> from the server, which would otherwise see no
// theme cookie and drop the .dark class, flipping a system-dark user to light.
// <html> has suppressHydrationWarning, so mutating the class before hydration is safe.
export function ThemeScript() {
  const js = `(function(){try{var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=([^;]+)/);var t=m?decodeURIComponent(m[1]):null;if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.cookie='${THEME_COOKIE}='+t+'; path=/; max-age=31536000; samesite=lax';}document.documentElement.classList.toggle('dark',t==='dark');}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
