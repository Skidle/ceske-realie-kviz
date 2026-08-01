import { Link, Outlet } from 'react-router-dom';
import { Mail, Instagram } from 'lucide-react';

/**
 * The nav and footer both routes share. Previously only the landing page had them, so the
 * quiz read as a separate site.
 */
function SiteLayout() {
  return (
    <div className="min-h-screen bg-violet-200 flex flex-col">
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm fixed w-full z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/">
            <img src="/transparentLogo.png" alt="Průvodce občanstvím" className="w-20 h-20" />
          </Link>
          <a
            href="mailto:cz.citizenship.guide@gmail.com"
            className="text-fuchsia-600 hover:text-fuchsia-700 flex items-center gap-2"
          >
            <Mail className="w-5 h-5" />
            Kontaktovat
          </a>
        </div>
      </nav>

      <Outlet />

      <footer className="bg-white/80 backdrop-blur-sm py-6 shadow mt-auto">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-zinc-700">
            ©
            {' '}
            {new Date().getFullYear()}
            {' '}
            Průvodce občanstvím
          </p>
          <a
            href="https://www.instagram.com/czech_citizenship/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-fuchsia-600 hover:text-fuchsia-700 flex items-center gap-2"
          >
            <Instagram className="w-5 h-5" />
            Sledujte nás na Instagramu
          </a>
        </div>
      </footer>
    </div>
  );
}

export default SiteLayout;
