/**
 * RIDDY Categories Section - Vehicle Type Filters
 * Design: Horizontal pills/tabs for filtering vehicles by category
 * Similar to Turo's category navigation - Mobile Optimized
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Car, Truck, Sparkles, Zap, DollarSign, Plane } from "lucide-react";

const categories = [
  { id: "all", label: "Todos", icon: Car },
  { id: "suv", label: "SUVs", icon: Truck },
  { id: "luxury", label: "Luxo", icon: Sparkles },
  { id: "electric", label: "Elétricos", icon: Zap },
  { id: "economy", label: "Econômicos", icon: DollarSign },
  { id: "airport", label: "Aeroportos", icon: Plane },
];

export default function CategoriesSection() {
  const [activeCategory, setActiveCategory] = useState("all");

  return (
    <section className="py-4 sm:py-6 md:py-8 border-b border-white/5 bg-[#0A0F1C] sticky top-14 sm:top-16 lg:top-20 z-40">
      <div className="container px-3 sm:px-4 md:px-6">
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3 sm:-mx-0 sm:px-0">
          {categories.map((category) => {
            const isActive = activeCategory === category.id;
            return (
              <motion.button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-full whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                  isActive
                    ? "bg-cyan-500 text-[#0A0F1C] font-semibold"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10"
                }`}
              >
                <category.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">{category.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
