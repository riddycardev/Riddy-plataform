/**
 * RIDDY Footer Component - Mega Footer Style
 * Design: Comprehensive footer with links, social, and legal info - Mobile Optimized
 */

import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { Link } from "wouter";

const footerLinks = {
  explore: [
    { label: "Como Funciona", href: "#como-funciona" },
    { label: "Por que RIDDY", href: "#seguranca" },
    { label: "Cidades", href: "#cidades" },
    { label: "Preços", href: "#" },
  ],
  hosts: [
    { label: "Liste seu Carro", href: "#proprietarios" },
    { label: "Calculadora de Ganhos", href: "#proprietarios" },
    { label: "Requisitos", href: "#" },
    { label: "Seguro para Anfitriões", href: "#" },
  ],
  vehicles: [
    { label: "Todos os Carros", href: "/cars" },
    { label: "SUVs", href: "/cars?category=suv" },
    { label: "Luxo", href: "/cars?category=luxury" },
    { label: "Motos", href: "/motorcycles" },
  ],
  company: [
    { label: "Sobre Nós", href: "#" },
    { label: "Carreiras", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Imprensa", href: "#" },
  ],
  support: [
    { label: "Central de Ajuda", href: "#" },
    { label: "Contato", href: "#" },
    { label: "Políticas", href: "#" },
    { label: "Termos de Uso", href: "#" },
    { label: "Privacidade", href: "/privacy" },
  ],
};

const socialLinks = [
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Youtube, href: "#", label: "Youtube" },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#070B14] border-t border-white/5">
      {/* Main Footer */}
      <div className="container px-4 sm:px-6 py-10 sm:py-12 md:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8">
          {/* Brand Column */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1 mb-4 sm:mb-0">
            <a href="#" className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-lg flex items-center justify-center">
                <span className="text-[#0A0F1C] font-display font-bold text-base sm:text-lg">R</span>
              </div>
              <span className="font-display font-bold text-lg sm:text-xl text-white">RIDDY</span>
            </a>
            <p className="text-gray-500 text-xs sm:text-sm mb-4 sm:mb-6 leading-relaxed">
              O marketplace de aluguel de carros entre pessoas do Brasil. 
              Conectando proprietários e locatários de forma segura.
            </p>
            {/* Social Links */}
            <div className="flex gap-2 sm:gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-cyan-500/20 hover:text-cyan-400 transition-colors"
                >
                  <social.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-semibold text-white text-sm sm:text-base mb-3 sm:mb-4">Explorar</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.explore.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-gray-500 hover:text-white text-xs sm:text-sm transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm sm:text-base mb-3 sm:mb-4">Proprietários</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.hosts.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-gray-500 hover:text-white text-xs sm:text-sm transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm sm:text-base mb-3 sm:mb-4">Veículos</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.vehicles.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-gray-500 hover:text-white text-xs sm:text-sm transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden sm:block">
            <h4 className="font-semibold text-white text-sm sm:text-base mb-3 sm:mb-4">Empresa</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-gray-500 hover:text-white text-xs sm:text-sm transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden sm:block">
            <h4 className="font-semibold text-white text-sm sm:text-base mb-3 sm:mb-4">Suporte</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-gray-500 hover:text-white text-xs sm:text-sm transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Mobile-only collapsed links */}
        <div className="sm:hidden mt-6 pt-6 border-t border-white/5">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {[...footerLinks.company, ...footerLinks.support].map((link) => (
              <a key={link.label} href={link.href} className="text-gray-500 hover:text-white text-xs transition-colors">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5">
        <div className="container px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <p className="text-gray-600 text-[10px] sm:text-xs md:text-sm text-center sm:text-left">
              © {currentYear} RIDDY Tecnologia Ltda. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4 sm:gap-6">
              <Link href="/privacy" className="text-gray-600 hover:text-white text-[10px] sm:text-xs md:text-sm transition-colors">
                Privacidade
              </Link>
              <a href="#" className="text-gray-600 hover:text-white text-[10px] sm:text-xs md:text-sm transition-colors">
                Termos
              </a>
              <a href="#" className="text-gray-600 hover:text-white text-[10px] sm:text-xs md:text-sm transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
