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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="section-shell py-20"
    >
      <h2 className="max-w-3xl text-3xl font-semibold tracking-tight md:text-5xl">{headline}</h2>
      {subheadline ? <p className="mt-5 max-w-3xl text-lg text-secondary">{subheadline}</p> : null}
      <div className="mt-10">{children}</div>
    </motion.section>
  );
}
