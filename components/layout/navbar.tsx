"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, Search, User, Heart, ShoppingBag, X } from "lucide-react";
import { mainNav, siteConfig } from "@/config/site";
import { useCart } from "@/components/cart/cart-context";
import { cn } from "@/lib/utils/cn";

const navListVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const navItemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
};

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { cart, openDrawer } = useCart();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-transparent bg-ivory/95 transition-shadow",
        !mobileOpen && "backdrop-blur",
        scrolled && "border-border shadow-sm"
      )}
    >
      <div className="container-brand flex h-16 items-center justify-between md:h-20">
        <button
          className="p-2 -ml-2 md:hidden"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={22} />
        </button>

        <Link href="/" className="font-display text-xl tracking-tight md:text-2xl">
          {siteConfig.name}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {mainNav.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm tracking-wide text-charcoal-soft transition-colors hover:text-charcoal">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link href="/search" aria-label="Search" className="hidden p-2 hover:opacity-60 sm:block">
            <Search size={20} />
          </Link>
          <Link href="/account" aria-label="Account" className="hidden p-2 hover:opacity-60 sm:block">
            <User size={20} />
          </Link>
          <Link href="/account/wishlist" aria-label="Wishlist" className="hidden p-2 hover:opacity-60 sm:block">
            <Heart size={20} />
          </Link>
          <button onClick={openDrawer} aria-label="Open cart" className="relative p-2 hover:opacity-60">
            <ShoppingBag size={20} />
            {cart && cart.totalQuantity > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-sand text-[10px] text-ivory">
                {cart.totalQuantity}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              className="absolute inset-0 bg-charcoal/40"
              onClick={() => setMobileOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            />
            <motion.div
              className="absolute left-0 top-0 h-full w-full max-w-xs bg-ivory p-6 shadow-xl"
              initial={{ x: prefersReducedMotion ? 0 : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: prefersReducedMotion ? 0 : "-100%" }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: "easeOut" }}
            >
              <div className="mb-8 flex items-center justify-between">
                <span className="font-display text-lg">{siteConfig.name}</span>
                <button aria-label="Close menu" onClick={() => setMobileOpen(false)} className="p-1">
                  <X size={22} />
                </button>
              </div>
              <motion.nav
                className="flex flex-col gap-5"
                variants={navListVariants}
                initial="hidden"
                animate="visible"
                transition={prefersReducedMotion ? { staggerChildren: 0 } : undefined}
              >
                {mainNav.map((item) => (
                  <motion.div
                    key={item.href}
                    variants={navItemVariants}
                    transition={prefersReducedMotion ? { duration: 0 } : undefined}
                  >
                    <Link href={item.href} onClick={() => setMobileOpen(false)} className="text-lg">
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  variants={navItemVariants}
                  transition={prefersReducedMotion ? { duration: 0 } : undefined}
                  className="mt-4 flex flex-col gap-5 border-t border-border pt-5 text-charcoal-soft"
                >
                  <Link href="/search" onClick={() => setMobileOpen(false)}>Search</Link>
                  <Link href="/account" onClick={() => setMobileOpen(false)}>Account</Link>
                  <Link href="/account/wishlist" onClick={() => setMobileOpen(false)}>Wishlist</Link>
                </motion.div>
              </motion.nav>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
