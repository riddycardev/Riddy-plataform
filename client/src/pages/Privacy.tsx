import Markdown from "react-markdown";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import PrivacyPolicyContent from "./PrivacyPolicy.md?raw";

export default function Privacy() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between py-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>
          <h1 className="text-xl font-bold">Política de Privacidade</h1>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>
      </div>

      {/* Content */}
      <div className="container py-12">
        <div className="max-w-3xl mx-auto prose prose-invert dark:prose-invert">
          <article className="space-y-6 text-sm leading-relaxed">
            {/* Render Markdown */}
            <Markdown
              components={{
                h1: ({ ...props }: any) => (
                  <h1 className="text-3xl font-bold mt-8 mb-4" {...props} />
                ),
                h2: ({ ...props }: any) => (
                  <h2 className="text-2xl font-bold mt-6 mb-3" {...props} />
                ),
                h3: ({ ...props }: any) => (
                  <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />
                ),
                p: ({ ...props }: any) => (
                  <p className="text-base leading-relaxed mb-4" {...props} />
                ),
                table: ({ ...props }: any) => (
                  <div className="overflow-x-auto my-6">
                    <table
                      className="w-full border-collapse border border-border"
                      {...props}
                    />
                  </div>
                ),
                th: ({ ...props }: any) => (
                  <th
                    className="border border-border bg-muted px-4 py-2 text-left font-semibold"
                    {...props}
                  />
                ),
                td: ({ ...props }: any) => (
                  <td className="border border-border px-4 py-2" {...props} />
                ),
                ul: ({ ...props }: any) => (
                  <ul className="list-disc list-inside space-y-2 mb-4" {...props} />
                ),
                li: ({ ...props }: any) => (
                  <li className="ml-2" {...props} />
                ),
                blockquote: ({ ...props }: any) => (
                  <blockquote
                    className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground"
                    {...props}
                  />
                ),
                a: ({ ...props }: any) => (
                  <a className="text-primary hover:underline" {...props} />
                ),
              }}
            >
              {PrivacyPolicyContent}
            </Markdown>
          </article>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="border-t border-border bg-muted/30 py-8 mt-12">
        <div className="container max-w-3xl mx-auto text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Dúvidas sobre privacidade?
          </p>
          <a
            href="mailto:privacy@riddy.com.br"
            className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Contate-nos
          </a>
        </div>
      </div>
    </div>
  );
}
