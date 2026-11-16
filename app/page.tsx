"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { products } from "@/lib/products";

type FormStatus = {
  message: string;
  tone: "success" | "error";
};

/** How long each product stays on screen while nobody is using the kiosk. */
const SLIDE_INTERVAL_MS = 6500;
/** How long after a customer last touches the showcase before it scrolls on its own again. */
const IDLE_RESUME_MS = 10000;

export default function Home() {
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [status, setStatus] = useState<FormStatus | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const successButtonRef = useRef<HTMLButtonElement>(null);
  const trackRef = useRef<HTMLElement>(null);
  // The slide in view. A ref, not state: it changes on every swipe and nothing re-renders from it.
  const currentSlideRef = useRef(0);

  useEffect(() => {
    if (formOpen) return;
    const track = trackRef.current;
    if (!track) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scrollToSlide = (index: number, behavior: ScrollBehavior) =>
      track.scrollTo({ left: index * track.clientWidth, behavior });

    // Coming back from the form: land on the product the customer asked about.
    scrollToSlide(currentSlideRef.current, "instant");

    let timer = 0;
    const schedule = (delay: number) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(advance, delay);
    };
    const advance = () => {
      const next = (currentSlideRef.current + 1) % products.length;
      scrollToSlide(next, reduceMotion.matches ? "instant" : "smooth");
      schedule(SLIDE_INTERVAL_MS);
    };
    // Any touch, swipe, wheel or key press hands control to the customer until they go idle.
    const pause = () => schedule(IDLE_RESUME_MS);
    const trackSlide = () => {
      if (track.clientWidth === 0) return;
      const index = Math.round(track.scrollLeft / track.clientWidth);
      currentSlideRef.current = Math.min(Math.max(index, 0), products.length - 1);
    };
    const realign = () => scrollToSlide(currentSlideRef.current, "instant");

    const interactions = ["pointerdown", "wheel", "keydown", "focusin"] as const;
    interactions.forEach((type) => track.addEventListener(type, pause, { passive: true }));
    track.addEventListener("scroll", trackSlide, { passive: true });
    window.addEventListener("resize", realign);
    schedule(SLIDE_INTERVAL_MS);

    return () => {
      window.clearTimeout(timer);
      interactions.forEach((type) => track.removeEventListener(type, pause));
      track.removeEventListener("scroll", trackSlide);
      window.removeEventListener("resize", realign);
    };
  }, [formOpen]);

  useEffect(() => {
    if (!formOpen) return;

    nameInputRef.current?.focus();
    if (isSubmitting) return;

    let timer = window.setTimeout(() => {
      setStatus(null);
      setSelectedInterests([]);
      setFormOpen(false);
    }, 60000);
    const resetTimer = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        setStatus(null);
        setSelectedInterests([]);
        setFormOpen(false);
      }, 60000);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") returnToShowcase();
    };
    const panel = panelRef.current;
    panel?.addEventListener("pointerdown", resetTimer);
    panel?.addEventListener("keydown", resetTimer);
    panel?.addEventListener("input", resetTimer);
    panel?.addEventListener("change", resetTimer);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      window.clearTimeout(timer);
      panel?.removeEventListener("pointerdown", resetTimer);
      panel?.removeEventListener("keydown", resetTimer);
      panel?.removeEventListener("input", resetTimer);
      panel?.removeEventListener("change", resetTimer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [formOpen, isSubmitting]);

  useEffect(() => {
    if (status?.tone === "success") successButtonRef.current?.focus();
  }, [status]);

  function openForm(index: number) {
    currentSlideRef.current = index;
    setStatus(null);
    setSelectedInterests([products[index].interest]);
    setFormOpen(true);
  }

  function returnToShowcase() {
    formRef.current?.reset();
    setSelectedInterests([]);
    setStatus(null);
    setFormOpen(false);
  }

  async function submitLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current?.reportValidity()) return;

    const values = new FormData(event.currentTarget);
    const interests = values.getAll("interests").map(String);
    if (interests.length === 0) {
      setStatus({ message: "Please choose at least one product.", tone: "error" });
      return;
    }

    const payload = {
      name: String(values.get("name") ?? "").trim(),
      email: String(values.get("email") ?? "").trim(),
      phone: String(values.get("phone") ?? "").trim(),
      interests,
      consent: values.get("consent") === "on",
      submittedAt: new Date().toISOString()
    };

    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch("/api/customer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 400) {
        const { error } = (await response.json().catch(() => ({}))) as { error?: string };
        setStatus({ message: error ?? "Please check your details and try again.", tone: "error" });
        return;
      }

      if (!response.ok) {
        throw new Error(`The server returned ${response.status}.`);
      }

      formRef.current?.reset();
      setSelectedInterests([]);
      setStatus({
        message: "Thank you — the Jay Fanks team has received your details.",
        tone: "success"
      });
    } catch (error) {
      console.error("Could not submit customer details:", error);
      setStatus({
        message: "We couldn't send your details. Please check the connection and try again.",
        tone: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={formOpen ? "shell" : "shell kiosk"}>
      <header className="topbar">
        <a className="brand-link" href="https://jayfanks.com" aria-label="Jay Fanks home">
          <Image
            className="wordmark"
            src="/jayfanks-logo.png"
            alt="Jay Fanks"
            width={145}
            height={93}
            style={{ width: "145px", height: "auto" }}
            preload
          />
        </a>
      </header>

      <main>
        {!formOpen ? (
          <section
            className="showcase"
            ref={trackRef}
            aria-roledescription="carousel"
            aria-label="Jay Fanks products"
          >
            {products.map((item, index) => (
              <article
                className="slide"
                key={item.interest}
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${products.length}`}
              >
                {/* Tapping the photo is a shortcut for touch users; the button below is the accessible control. */}
                <div className="slide-photo" onClick={() => openForm(index)}>
                  <Image
                    className="slide-backdrop"
                    src={item.image}
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes="64px"
                    loading="eager"
                  />
                  <Image
                    className="slide-image"
                    src={item.image}
                    alt={`${item.name} ${item.size}`}
                    fill
                    sizes="100vw"
                    loading="eager"
                    preload={index === 0}
                  />
                </div>
                <div className="slide-caption">
                  <h2 className="slide-name">
                    {item.name} <span className="slide-size">{item.size}</span>
                  </h2>
                  <button className="primary-button" type="button" onClick={() => openForm(index)}>
                    Ask about this product <span className="button-arrow" aria-hidden="true">→</span>
                  </button>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="form-panel" aria-labelledby="form-title" ref={panelRef}>
            <div className="form-heading">
              <div>
                <p className="eyebrow">Stay in the know</p>
                <h2 id="form-title">Let&apos;s keep in touch.</h2>
              </div>
            </div>
            <p className="form-intro">
              Leave your details and the Jay Fanks team can tell you more about the products you love.
            </p>

            <form ref={formRef} onSubmit={submitLead}>
              <div className="fields">
                <div className="field">
                  <label htmlFor="name">Your name <span aria-hidden="true">*</span></label>
                  <input
                    ref={nameInputRef}
                    id="name"
                    name="name"
                    autoComplete="name"
                    placeholder="Alex Morgan"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="email">Email address <span aria-hidden="true">*</span></label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="alex@example.com"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="phone">Phone number <span aria-hidden="true">*</span></label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+233 24 037 1188"
                    required
                  />
                </div>
              </div>
              <fieldset className="product-selection">
                <legend>Products you&apos;re interested in <span aria-hidden="true">*</span></legend>
                <p className="selection-hint">
                  {selectedInterests.length} selected · Choose one or more products.
                </p>
                <div className="product-choice-list">
                  {products.map((item) => (
                    <label className="product-choice" key={item.interest}>
                      <input
                        type="checkbox"
                        name="interests"
                        value={item.interest}
                        checked={selectedInterests.includes(item.interest)}
                        onChange={(event) => {
                          setSelectedInterests((current) =>
                            event.target.checked
                              ? [...current, item.interest]
                              : current.filter((interest) => interest !== item.interest)
                          );
                        }}
                      />
                      <span className="product-choice-copy">
                        <strong>{item.name}</strong>
                        <span>{item.size}{item.price ? ` · ${item.price}` : ""}</span>
                      </span>
                      <span className="product-choice-category">{item.category}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="consent" htmlFor="consent">
                <input id="consent" name="consent" type="checkbox" />
                <span>
                  I agree to be contacted by Jay Fanks about its products. I can ask to stop at any time.
                </span>
              </label>
              <div className="form-actions">
                <button className="primary-button" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Sending…" : "Send my details"}
                  {!isSubmitting && <span className="button-arrow" aria-hidden="true">→</span>}
                </button>
                <button className="text-button" type="button" onClick={returnToShowcase}>
                  Back to the showcase
                </button>
              </div>
              <p className={`status ${status?.tone === "success" ? "success" : ""}`} role="status" aria-live="polite">
                {status?.message ?? ""}
              </p>
              <p className="privacy-note">
                Your details are sent to our server for follow-up. Please add your privacy notice before publishing this page.
              </p>
            </form>
          </section>
        )}
      </main>

      <footer className="footer">
        <div className="footer-contact">
          <a href="tel:+233240371188">+233 2403 711 88</a>
          <a href="mailto:customercare@jayfanks.com">customercare@jayfanks.com</a>
          <a href="https://wa.me/c/233240371188" target="_blank" rel="noreferrer">WhatsApp</a>
        </div>
        <a
          className="footer-address"
          href="https://maps.google.com/?q=CX-059-6102+MV484+Neptune+Street+Kasoa+Adom+Estates"
          target="_blank"
          rel="noreferrer"
        >
          CX-059-6102, MV484 Neptune Street, Kasoa Adom Estates
        </a>
        <a className="admin-link" href="/admin">Admin</a>
      </footer>

      {status?.tone === "success" && (
        <div
          className="success-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) returnToShowcase();
          }}
        >
          <section
            className="success-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="success-title"
            aria-describedby="success-description"
            onKeyDown={(event) => {
              if (event.key === "Tab") {
                event.preventDefault();
                successButtonRef.current?.focus();
              }
            }}
          >
            <div className="success-mark" aria-hidden="true">✓</div>
            <p className="eyebrow">Submission received</p>
            <h2 id="success-title">Thank you!</h2>
            <p id="success-description">
              Your details have been sent successfully. The Jay Fanks team will be in touch.
            </p>
            <button
              ref={successButtonRef}
              className="primary-button"
              type="button"
              onClick={returnToShowcase}
            >
              Back to the product showcase
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
