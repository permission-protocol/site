"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { motion } from "framer-motion";

const reveal = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.3, ease: "easeOut" }
};

type FormState = {
  name: string;
  email: string;
  company: string;
  useCase: string;
  environment: string;
  message: string;
};

const defaultState: FormState = {
  name: "",
  email: "",
  company: "",
  useCase: "CI/CD Deploys",
  environment: "AWS",
  message: ""
};

const inputClass =
  "mt-2 w-full rounded-lg border border-border bg-ash px-3 py-2.5 text-signal placeholder:text-secondary focus:border-permit focus:outline-none focus:ring-2 focus:ring-permit/40";

export function ContactPageClient() {
  const [form, setForm] = useState<FormState>(defaultState);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <section className="bg-void pb-24 pt-28">
      <div className="mx-auto w-full max-w-[600px] px-6">
        <motion.header {...reveal}>
          <p className="text-xs uppercase tracking-[0.22em] text-permit">Contact</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-signal">Let&apos;s map your enforcement points.</h1>
          <p className="mt-4 text-lg text-secondary">
            Tell us what your agents do. We&apos;ll show you where authority receipts fit.
          </p>
        </motion.header>

        <motion.section {...reveal} className="mt-10 rounded-2xl border border-border bg-card p-6">
          {submitted ? (
            <div className="rounded-xl border border-permit/50 bg-permit/10 p-4 text-sm font-semibold text-permit">
              Thanks! We&apos;ll be in touch within 24 hours.
            </div>
          ) : null}

          <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
            <label className="text-sm text-secondary" htmlFor="name">
              Name
              <input
                id="name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className={inputClass}
                type="text"
                required
              />
            </label>

            <label className="text-sm text-secondary" htmlFor="email">
              Email
              <input
                id="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                className={inputClass}
                type="email"
                required
              />
            </label>

            <label className="text-sm text-secondary" htmlFor="company">
              Company
              <input
                id="company"
                value={form.company}
                onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))}
                className={inputClass}
                type="text"
              />
            </label>

            <label className="text-sm text-secondary" htmlFor="use-case">
              Use Case
              <select
                id="use-case"
                value={form.useCase}
                onChange={(event) => setForm((prev) => ({ ...prev, useCase: event.target.value }))}
                className={inputClass}
              >
                <option>CI/CD Deploys</option>
                <option>Database Operations</option>
                <option>Financial Transactions</option>
                <option>Data Access</option>
                <option>API Security</option>
                <option>Multi-Agent Orchestration</option>
                <option>Other</option>
              </select>
            </label>

            <label className="text-sm text-secondary" htmlFor="environment">
              Environment
              <select
                id="environment"
                value={form.environment}
                onChange={(event) => setForm((prev) => ({ ...prev, environment: event.target.value }))}
                className={inputClass}
              >
                <option>AWS</option>
                <option>GCP</option>
                <option>Azure</option>
                <option>Multi-cloud</option>
                <option>On-premise</option>
                <option>Other</option>
              </select>
            </label>

            <label className="text-sm text-secondary" htmlFor="message">
              Message
              <textarea
                id="message"
                value={form.message}
                onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                className={inputClass}
                rows={5}
                placeholder="Tell us about your agent infrastructure..."
              />
            </label>

            <button type="submit" className="mt-2 w-full rounded-xl bg-permit px-4 py-3 font-semibold text-void hover:brightness-110">
              Send
            </button>
          </form>
        </motion.section>

        <motion.section {...reveal} className="mt-10">
          <h2 className="text-xl font-semibold text-signal">What Happens Next</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              {
                title: "We review",
                body: "We'll review your enforcement points and agent architecture."
              },
              {
                title: "We map",
                body: "We'll map where receipt verification adds the most value."
              },
              {
                title: "We pilot",
                body: "We'll propose a pilot with measurable outcomes."
              }
            ].map((item, index) => (
              <article key={item.title} className="rounded-lg border border-border bg-ash p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-permit">Step {index + 1}</p>
                <p className="mt-2 text-sm font-semibold text-signal">{item.title}</p>
                <p className="mt-2 text-xs leading-relaxed text-secondary">{item.body}</p>
              </article>
            ))}
          </div>
        </motion.section>

        <motion.div {...reveal} className="mt-8">
          <Link href="/developers/quickstart" className="text-base font-semibold text-permit hover:text-[#6ac9b7]">
            Prefer to start on your own? Read the Quickstart -&gt;
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
