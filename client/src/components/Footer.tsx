import type { ReactNode } from "react";
import { RESUME_URL } from "../config";

type FooterLink = { label: string };

const resumeLinkProps = {
  href: RESUME_URL,
  target: "_blank",
  rel: "noopener noreferrer" as const,
};

function FooterButton({ children }: { children: ReactNode }) {
  return (
    <a
      {...resumeLinkProps}
      className="inline-flex items-center justify-center rounded-lg bg-magenta px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(209,0,209,0.4)] transition hover:bg-magenta-bright"
    >
      {children}
    </a>
  );
}

function FooterTextLink({ children }: { children: ReactNode }) {
  return (
    <a {...resumeLinkProps} className="block text-sm text-zinc-400 transition hover:text-white">
      {children}
    </a>
  );
}

function Column({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</p>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <FooterTextLink>{l.label}</FooterTextLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <p className="text-lg font-medium text-magenta sm:text-xl">Ethara.AI is where intelligence gets trained.</p>
        <p className="mt-2 text-sm text-zinc-400">Let&apos;s shape the future of intelligence together.</p>
        <div className="mt-8 flex justify-center">
          <FooterButton>
            Get in Touch <span aria-hidden className="ml-1">→</span>
          </FooterButton>
        </div>
      </div>

      <div className="border-t border-white/10 bg-void">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <a {...resumeLinkProps} className="inline-flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5">
                <span className="text-xs font-bold text-magenta">E</span>
              </span>
              <span className="text-sm font-semibold text-white">
                Ethara<span className="text-zinc-500">.AI</span>
              </span>
            </a>
            <p className="mt-3 text-xs leading-relaxed text-zinc-500">
              Team Task Manager — projects, roles, and delivery in one place.
            </p>
          </div>
          <Column title="Products" links={[{ label: "RLaaS" }]} />
          <Column
            title="Company"
            links={[
              { label: "Careers" },
              { label: "OTS" },
              { label: "Privacy Policy" },
              { label: "Terms of Service" },
              { label: "Cookies Policy" },
            ]}
          />
          <Column title="Resources" links={[{ label: "Research" }, { label: "Contact Us" }]} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Follow us</p>
            <div className="mt-3 flex gap-3">
              <a
                {...resumeLinkProps}
                className="rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-zinc-300 hover:border-magenta/50 hover:text-white"
              >
                LinkedIn
              </a>
              <a
                {...resumeLinkProps}
                className="rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-zinc-300 hover:border-magenta/50 hover:text-white"
              >
                Instagram
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 py-6 text-center text-xs text-zinc-600">
          <a {...resumeLinkProps} className="hover:text-zinc-400">
            © {new Date().getFullYear()} Ethara.AI · Resume / portfolio
          </a>
        </div>
      </div>
    </footer>
  );
}
