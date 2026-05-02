import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FinTrack — Controle Financeiro Inteligente",
  description:
    "Controle gastos, receitas e metas com clareza. Uma landing page premium para o app FinTrack.",
  openGraph: {
    title: "FinTrack — Controle Financeiro Inteligente",
    description:
      "Pare de perder dinheiro sem saber por quê. Controle financeiro simples, visual e inteligente.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
