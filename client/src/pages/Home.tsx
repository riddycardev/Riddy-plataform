import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/sections/HeroSection";
import CategoriesSection from "@/components/sections/CategoriesSection";
import FeaturedCarsSection from "@/components/sections/FeaturedCarsSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import WhyRiddySection from "@/components/sections/WhyRiddySection";
import HostSection from "@/components/sections/HostSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import FAQSection from "@/components/sections/FAQSection";
import CTASection from "@/components/sections/CTASection";
import HeroMotorcycles from "@/components/sections/HeroMotorcycles";
import FeaturedMotorcyclesSection from "@/components/sections/FeaturedMotorcyclesSection";
import HowItWorksMotorcyclesSection from "@/components/sections/HowItWorksMotorcyclesSection";
import WhyRiddyMotorcyclesSection from "@/components/sections/WhyRiddyMotorcyclesSection";
import CalculadoraMotoSection from "@/components/sections/CalculadoraMotoSection";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { useCategory } from "@/contexts/CategoryContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLoginWelcome } from "@/hooks/useLoginWelcome";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { activeCategory, setActiveCategory } = useCategory();

  // Show welcome toast after OAuth login
  useLoginWelcome();

  // Reset to cars when visiting home
  useEffect(() => {
    setActiveCategory("cars");
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0F1C] pb-20 lg:pb-0">
      <Header />
      <main>
        {/* Content - Carros */}
        {activeCategory === "cars" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <HeroSection activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
            <CategoriesSection />
            <FeaturedCarsSection />
            <HowItWorksSection />
            <WhyRiddySection />
            <HostSection />
            <TestimonialsSection />
            <FAQSection />
            <CTASection />
          </motion.div>
        )}

        {/* Content - Motos */}
        {activeCategory === "motorcycles" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <HeroMotorcycles activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
            <FeaturedMotorcyclesSection />
            <HowItWorksMotorcyclesSection />
            <WhyRiddyMotorcyclesSection />
            <CalculadoraMotoSection />
            <TestimonialsSection />
            <FAQSection />
            <CTASection />
          </motion.div>
        )}
      </main>
      <Footer />
    </div>
  );
}
