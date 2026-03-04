"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

type SectionBlockProps = {
  id?: string;
  headline: string;
  subheadline?: string;
  children: ReactNode;
};

export function SectionBlock({ id, headline, subheadline, children }: SectionBlockProps) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="section-shell relative py-28 md:py-32"
    >
      <h2 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">{headline}</h2>
      {subheadline ? <p className="mt-5 max-w-3xl text-lg leading-relaxed text-secondary">{subheadline}</p> : null}
      <div className="mt-10">{children}</div>
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-permit/20 to-transparent"
      />
    </motion.section>
  );
}
