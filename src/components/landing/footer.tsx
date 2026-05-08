import Link from 'next/link'
import { Separator } from '@/components/ui/separator'

const footerLinks = {
  Platform: [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Trusted By', href: '#trusted-by' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'Pricing', href: '#pricing' },
  ],
  Company: [
    { label: 'About', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Contact', href: '#contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
  ],
}

export function Footer() {
  return (
    <footer className="bg-[#0F0F0F] text-white">
      {/* CTA Banner */}
      <div className="border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16 md:py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-4">
            Start planning your next event
          </h2>
          <p className="text-white/50 max-w-md mx-auto mb-8">
            Join hundreds of event professionals in Addis Ababa who trust our platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-white text-black font-medium text-sm hover:bg-white/90 transition-colors">
              Get started for free
            </Link>
            <a href="#contact" className="inline-flex items-center justify-center px-8 py-3 rounded-lg border border-white/20 text-white/80 font-medium text-sm hover:bg-white/5 transition-colors">
              Talk to sales
            </a>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="font-heading text-lg font-semibold tracking-tight">
              Addis<span className="text-primary">Events</span>
            </Link>
            <p className="text-sm text-white/40 mt-3 leading-relaxed max-w-xs">
              Premium event management for Addis Ababa&apos;s finest occasions.
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-medium mb-4 text-white/70">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-white/40 hover:text-white/80 transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="bg-white/[0.06] mb-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} Addis Events. All rights reserved.
          </p>
          <p className="text-xs text-white/30">
            Made with ♥ in Addis Ababa, Ethiopia
          </p>
        </div>
      </div>
    </footer>
  )
}
