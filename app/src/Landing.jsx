import React from 'react';
import { Mail, Instagram, ArrowRight, FileText, CheckSquare, BookOpen, Clock, Download } from 'lucide-react';
import './globals.css';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-violet-200 flex flex-col">
            <nav className="bg-white/80 backdrop-blur-sm shadow-sm fixed w-full z-10">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <img src="./transparentLogo.png" alt="Průvodce občanstvím" className="w-20 h-20"/>
                    <a href="mailto:cz.citizenship.guide@gmail.com"
                       className="text-fuchsia-600 hover:text-fuchsia-700 flex items-center gap-2">
                        <Mail className="w-5 h-5"/>
                        Kontaktovat
                    </a>
                </div>
            </nav>

            <header className="pt-40 pb-16">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl md:text-5xl font-serif mb-4 text-zinc-800">
                        Průvodce českým občanstvím
                    </h1>
                    <p className="text-xl md:text-2xl mb-8 text-zinc-700">
                        Získejte české občanství s přehledným průvodcem krok za krokem
                    </p>
                    <a href="https://buymeacoffee.com/cz.citizenship.guide/e/302955"
                       target="_blank"
                       className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors inline-flex items-center">
                        Koupit průvodce
                        <ArrowRight className="ml-2 w-5 h-5"/>
                    </a>
                </div>
            </header>

            <main className="container mx-auto px-4 py-16 flex-grow">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="bg-white/60 p-8 rounded-2xl shadow backdrop-blur-sm">
                        <FileText className="w-12 h-12 text-indigo-600 mb-4"/>
                        <h2 className="text-2xl font-serif mb-4 text-zinc-800">Co najdete v průvodci?</h2>
                        <ul className="space-y-3 text-zinc-700">
                            <li className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-600"/>
                                Kompletní postup žádosti
                            </li>
                            <li className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-600"/>
                                Seznam potřebných dokumentů
                            </li>
                            <li className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-indigo-600"/>
                                Tipy pro zkoušku
                            </li>
                        </ul>
                    </div>

                    <div className="bg-white/60 p-8 rounded-2xl shadow backdrop-blur-sm">
                        <CheckSquare className="w-12 h-12 text-indigo-600 mb-4"/>
                        <h2 className="text-2xl font-serif mb-4 text-zinc-800">Připravte se na zkoušku</h2>
                        <p className="text-zinc-700 mb-4">
                            Vyzkoušejte si kvíz z českých reálií zdarma.
                        </p>
                        <a href="/kviz"
                           className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors inline-flex items-center">
                            Spustit kvíz
                            <ArrowRight className="ml-2 w-4 h-4"/>
                        </a>
                    </div>

                    <div className="bg-white/60 p-8 rounded-2xl shadow backdrop-blur-sm">
                        <Download className="w-12 h-12 text-indigo-600 mb-4"/>
                        <h2 className="text-2xl font-serif mb-4 text-zinc-800">Formuláře</h2>
                        <p className="text-zinc-700 mb-4">
                            Stáhněte si potřebné dokumenty.
                        </p>
                        <a href="/sssz-formular.pdf"
                           target="_blank"
                           className="text-fuchsia-600 hover:text-fuchsia-700 inline-flex items-center">
                            Stáhnout SSSZ formulář
                            <ArrowRight className="ml-1 w-4 h-4"/>
                        </a>
                    </div>
                </div>
            </main>

            <div id="buildhype-widget" data-widget-id="61f33690-9565-410e-9021-4921c03bda86" className="mb-16"/>

            <footer className="bg-white/80 backdrop-blur-sm py-6 shadow mt-auto">
                <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-zinc-700">
                        © {new Date().getFullYear()} Průvodce občanstvím
                    </p>
                    <a href="https://instagram.com"
                       target="_blank"
                       className="text-fuchsia-600 hover:text-fuchsia-700 flex items-center gap-2">
                        <Instagram className="w-5 h-5"/>
                        Sledujte nás na Instagramu
                    </a>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;