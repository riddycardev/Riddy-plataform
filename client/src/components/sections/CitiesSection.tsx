/**
 * RIDDY Cities Section - Available Locations
 * Design: Grid of Brazilian cities where RIDDY operates - Mobile Optimized
 */

import { motion } from "framer-motion";
import { MapPin, ArrowRight } from "lucide-react";

const cities = [
  { name: "São Paulo", state: "SP", image: "https://images.unsplash.com/photo-1543059080-f9b1272213d5?w=400&h=300&fit=crop" },
  { name: "Rio de Janeiro", state: "RJ", image: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=400&h=300&fit=crop" },
  { name: "Belo Horizonte", state: "MG", image: "https://images.unsplash.com/photo-1598128558393-70ff21433be0?w=400&h=300&fit=crop" },
  { name: "Brasília", state: "DF", image: "https://images.unsplash.com/photo-1593995863951-57c27e518295?w=400&h=300&fit=crop" },
  { name: "Curitiba", state: "PR", image: "https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=400&h=300&fit=crop" },
  { name: "Porto Alegre", state: "RS", image: "https://images.unsplash.com/photo-1619546952812-520e98064a52?w=400&h=300&fit=crop" },
  { name: "Salvador", state: "BA", image: "https://images.unsplash.com/photo-1548963670-aaaa8f73a5e3?w=400&h=300&fit=crop" },
  { name: "Florianópolis", state: "SC", image: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400&h=300&fit=crop" },
];

export default function CitiesSection() {
  return (
    <section id="cidades" className="py-12 sm:py-16 md:py-20 lg:py-28 bg-[#0A0F1C]">
      <div className="container px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 sm:mb-10 md:mb-12"
        >
          <span className="text-cyan-400 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-3 sm:mb-4 block">
            Onde Estamos
          </span>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
            Carros disponíveis em todo Brasil
          </h2>
          <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-2">
            Presente nas principais cidades brasileiras e expandindo rapidamente.
          </p>
        </motion.div>

        {/* Cities Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {cities.map((city, index) => (
            <motion.a
              key={city.name}
              href="#"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="group relative rounded-xl sm:rounded-2xl overflow-hidden aspect-[4/3] cursor-pointer"
            >
              {/* Background Image */}
              <img
                src={city.image}
                alt={city.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-5">
                <div className="flex items-center gap-1 text-cyan-400 text-[10px] sm:text-xs md:text-sm mb-0.5 sm:mb-1">
                  <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
                  <span>{city.state}</span>
                </div>
                <h3 className="font-display font-semibold text-white text-sm sm:text-base md:text-lg lg:text-xl truncate">
                  {city.name}
                </h3>
              </div>

              {/* Hover Arrow - Hidden on mobile */}
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white" />
              </div>
            </motion.a>
          ))}
        </div>

        {/* Coming Soon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 sm:mt-8 text-center"
        >
          <p className="text-gray-500 text-xs sm:text-sm">
            Em breve: Recife, Fortaleza, Campinas, Goiânia e mais...
          </p>
        </motion.div>
      </div>
    </section>
  );
}
