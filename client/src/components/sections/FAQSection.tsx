/**
 * RIDDY FAQ Section
 * Design: Expandable FAQ accordion
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    category: "Locatários",
    questions: [
      {
        q: "Como funciona o processo de aluguel?",
        a: "É simples: busque o carro ideal, escolha as datas, faça a reserva e combine a retirada com o anfitrião. O pagamento é processado de forma segura pela RIDDY.",
      },
      {
        q: "Preciso de cartão de crédito?",
        a: "Sim, é necessário um cartão de crédito válido em seu nome para fazer reservas. Isso garante a segurança tanto para você quanto para o proprietário.",
      },
      {
        q: "O que está incluso no seguro?",
        a: "Nosso seguro cobre danos ao veículo, roubo e responsabilidade civil para terceiros. Você pode escolher entre diferentes níveis de proteção conforme sua necessidade.",
      },
      {
        q: "Posso cancelar minha reserva?",
        a: "Sim, cancelamentos com mais de 24 horas de antecedência têm reembolso integral. Cancelamentos tardios podem ter taxas conforme a política do anfitrião.",
      },
    ],
  },
  {
    category: "Proprietários",
    questions: [
      {
        q: "Quanto posso ganhar com meu carro?",
        a: "Os ganhos variam conforme o tipo de veículo e frequência de aluguel. Em média, proprietários ganham entre R$ 1.500 e R$ 4.000 por mês.",
      },
      {
        q: "Meu carro está protegido?",
        a: "Sim, todos os veículos são cobertos pelo nosso seguro durante as viagens. Além disso, verificamos todos os locatários antes de aprovar reservas.",
      },
      {
        q: "Quando recebo o pagamento?",
        a: "Os pagamentos são processados em até 3 dias úteis após o término de cada viagem, diretamente na sua conta bancária cadastrada.",
      },
      {
        q: "Posso recusar uma reserva?",
        a: "Sim, você tem controle total. Pode aprovar ou recusar reservas, definir regras específicas e bloquear datas quando precisar do carro.",
      },
    ],
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left"
      >
        <span className="font-medium text-white pr-8">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-gray-400 text-sm leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQSection() {
  const [activeCategory, setActiveCategory] = useState("Locatários");

  return (
    <section className="py-20 md:py-28 bg-[#0A0F1C]">
      <div className="container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-cyan-400 text-sm font-semibold uppercase tracking-wider mb-4 block">
            Dúvidas Frequentes
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Perguntas e Respostas
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Encontre respostas para as dúvidas mais comuns sobre a RIDDY.
          </p>
        </motion.div>

        {/* Category Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          {faqs.map((category) => (
            <button
              key={category.category}
              onClick={() => setActiveCategory(category.category)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === category.category
                  ? "bg-cyan-500 text-[#0A0F1C]"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {category.category}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto bg-white/5 rounded-2xl p-6 md:p-8 border border-white/5"
        >
          {faqs
            .find((f) => f.category === activeCategory)
            ?.questions.map((faq, index) => (
              <FAQItem key={index} question={faq.q} answer={faq.a} />
            ))}
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 text-center"
        >
          <p className="text-gray-400 text-sm">
            Não encontrou sua resposta?{" "}
            <a href="#" className="text-cyan-400 hover:underline">
              Entre em contato com nosso suporte
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
