import { Link, Outlet } from 'react-router-dom';
import { Mail, Instagram } from 'lucide-react';

/** Nav and footer for both routes; the quiz used to read as a separate site. */
function SiteLayout() {
  return (
    <div className="min-h-screen bg-flag-50 flex flex-col">
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm fixed w-full z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/">
            <img src="/transparentLogo.png" alt="Průvodce občanstvím" className="w-12 h-12 sm:w-16 sm:h-16" />
          </Link>
          <a
            href="mailto:cz.citizenship.guide@gmail.com"
            className="text-flag-600 hover:text-flag-700 flex items-center gap-2 text-sm sm:text-base"
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
            className="text-flag-600 hover:text-flag-700 flex items-center gap-2 text-sm sm:text-base"
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
