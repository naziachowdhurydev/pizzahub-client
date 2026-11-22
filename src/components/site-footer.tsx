import Link from "next/link";
import { Camera, Globe, MapPin, Mail, Phone, Pizza, Play } from "lucide-react";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/cart", label: "Cart" },
  { href: "/profile", label: "My Profile" },
];

const socials = [
  { label: "Facebook", href: "https://facebook.com", icon: Globe },
  { label: "Instagram", href: "https://instagram.com", icon: Camera },
  { label: "YouTube", href: "https://youtube.com", icon: Play },
];

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-border bg-muted/30 text-foreground">
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2 text-lg font-black">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F26B4F] text-white">
                <Pizza size={22} />
              </span>
              PIZZA
              <span className="text-[#F26B4F]">HUB</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
              Fresh pizza, simple ordering and fast delivery. Good times are pizza times —
              your next favourite slice is only a few clicks away.
            </p>
            <div className="mt-5 flex gap-2">
              {socials.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-[#F26B4F] hover:text-[#F26B4F]"
                >
                  <Icon size={17} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-black uppercase tracking-widest">Explore</h2>
            <ul className="mt-5 grid gap-3 text-sm text-muted-foreground">
              {navigation.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition hover:text-[#F26B4F]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-black uppercase tracking-widest">Contact</h2>
            <ul className="mt-5 grid gap-4 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <MapPin size={17} className="mt-0.5 shrink-0 text-[#F26B4F]" />
                <span>123 Pizza Street, Food District, Dhaka</span>
              </li>
              <li className="flex gap-3">
                <Phone size={17} className="shrink-0 text-[#F26B4F]" />
                <a href="tel:+8801234567890" className="transition hover:text-[#F26B4F]">
                  +880 1234-567890
                </a>
              </li>
              <li className="flex gap-3">
                <Mail size={17} className="shrink-0 text-[#F26B4F]" />
                <a
                  href="mailto:hello@pizzahub.example"
                  className="transition hover:text-[#F26B4F]"
                >
                  hello@pizzahub.example
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-black uppercase tracking-widest">Opening hours</h2>
            <div className="mt-5 grid gap-2 text-sm text-muted-foreground">
              <p>Every day</p>
              <p className="font-bold text-foreground">11:00 AM – 11:00 PM</p>
              <p className="mt-3">Fresh batches all day. Order before closing time.</p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} PizzaHub. All rights reserved.</p>
          <p>Made for pizza lovers, served with care.</p>
        </div>
      </div>
    </footer>
  );
}
