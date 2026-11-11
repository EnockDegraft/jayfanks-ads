"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const products = [
  {
    category: "Hair care",
    name: "Mmofra Leave-In Detangler",
    size: "250ml",
    price: "GH₵40.00",
    description:
      "A leave-in detangler from the Jay Fanks Mmofra hair-care range.",
    image: "/products/mmofra-leave-in-detangler.png",
    productUrl: "https://jayfanks.com/product/jay-fanks-mmofra-leave-in-detangler-250ml/",
    interest: "mmofra-leave-in-detangler"
  },
  {
    category: "Skin care",
    name: "Jay Fanks Body Butter",
    size: "300ml",
    price: "",
    description:
      "A 300ml Body Butter from the Jay Fanks skin-care collection.",
    image: "/products/body-butter.png",
    productUrl: "https://jayfanks.com/product/jay-fanks-body-butter-300ml/",
    interest: "body-butter"
  },
  {
    category: "Hair care",
    name: "Mmofra Hair Growth Oil",
    size: "100ml",
    price: "GH₵60.00",
    description:
      "A 100ml hair oil from the Jay Fanks Mmofra collection.",
    image: "/products/mmofra-hair-growth-oil.jpg",
    productUrl: "https://jayfanks.com/product/mmofra-hair-growth-oil-100ml/",
    interest: "mmofra-hair-growth-oil"
  },
  {
    category: "Skin care",
    name: "Body Butter",
    size: "200ml",
    price: "GH₵50.00",
    description: "A 200ml Body Butter from the Jay Fanks skin-care collection.",
    image: "/products/body-butter-200ml.jpg",
    productUrl: "https://jayfanks.com/product/body-butter-200ml/",
    interest: "body-butter-200ml"
  },
  {
    category: "Skin care",
    name: "Body Butter",
    size: "500ml",
    price: "GH₵100.00",
    description: "A 500ml Body Butter from the Jay Fanks skin-care collection.",
    image: "/products/body-butter-500ml.jpg",
    productUrl: "https://jayfanks.com/product/body-butter-500ml/",
    interest: "body-butter-500ml"
  },
  {
    category: "Hair care",
    name: "Conditioner",
    size: "500ml",
    price: "GH₵70.00",
    description: "A 500ml conditioner from the Jay Fanks hair-care collection.",
    image: "/products/conditioner-500ml.jpg",
    productUrl: "https://jayfanks.com/product/conditioner-500ml/",
    interest: "conditioner-500ml"
  },
  {
    category: "Hair care",
    name: "Hair Butter",
    size: "250ml",
    price: "GH₵60.00",
    description: "A 250ml Hair Butter from the Jay Fanks hair-care collection.",
    image: "/products/hair-butter-250ml.jpg",
    productUrl: "https://jayfanks.com/product/hair-butter-250ml/",
    interest: "hair-butter-250ml"
  },
  {
    category: "Hair care",
    name: "Hair Butter",
    size: "300ml",
    price: "GH₵60.00",
    description: "A 300ml Hair Butter from the Jay Fanks hair-care collection.",
    image: "/products/hair-butter-300ml.jpg",
    productUrl: "https://jayfanks.com/product/hair-butter-300ml/",
    interest: "hair-butter-300ml"
  },
  {
    category: "Hair care",
    name: "Hair Growth Oil",
    size: "100ml",
    price: "GH₵60.00",
    description: "A 100ml Hair Growth Oil from the Jay Fanks hair-care collection.",
    image: "/products/hair-growth-oil-100ml.jpg",
    productUrl: "https://jayfanks.com/product/hair-growth-oil-100ml/",
    interest: "hair-growth-oil-100ml"
  },
  {
    category: "Skin care",
    name: "Body Butter for Men",
    size: "250ml",
    price: "GH₵60.00",
    description: "A 250ml Body Butter for Men from the Jay Fanks skin-care collection.",
    image: "/products/body-butter-men.png",
    productUrl: "https://jayfanks.com/product/body-butter-for-men/",
    interest: "body-butter-men"
  },
  {
    category: "Hair care",
    name: "Hair Butter",
    size: "150ml",
    price: "GH₵35.00",
    description: "A 150ml Hair Butter from the Jay Fanks hair-care collection.",
    image: "/products/hair-butter-150ml.jpg",
    productUrl: "https://jayfanks.com/product/hair-butter-150ml/",
    interest: "hair-butter-150ml"
  },
  {
    category: "Hair care",
    name: "Hair Butter for Men",
    size: "150ml",
    price: "GH₵35.00",
    description: "A 150ml Hair Butter for Men from the Jay Fanks hair-care collection.",
    image: "/products/hair-butter-men.png",
    productUrl: "https://jayfanks.com/product/jay-fanks-hair-butter-for-men/",
    interest: "hair-butter-men"
  },
  {
    category: "Hair care",
    name: "Hair Growth Shampoo",
    size: "250ml",
    price: "GH₵40.00",
    description: "A 250ml Hair Growth Shampoo from the Jay Fanks hair-care collection.",
    image: "/products/hair-growth-shampoo-250ml.jpg",
    productUrl: "https://jayfanks.com/product/jay-fanks-hair-growth-shampoo-250ml/",
    interest: "hair-growth-shampoo-250ml"
  },
  {
    category: "Hair care",
    name: "Mmofra Hair Conditioner",
    size: "250ml",
    price: "GH₵40.00",
    description: "A 250ml conditioner from the Jay Fanks Mmofra hair-care range.",
    image: "/products/mmofra-conditioner-250ml.jpg",
    productUrl: "https://jayfanks.com/product/mmofra-hair-conditioner-250ml/",
    interest: "mmofra-conditioner-250ml"
  },
  {
    category: "Hair care",
    name: "Shampoo",
    size: "500ml",
    price: "GH₵70.00",
    description: "A 500ml shampoo from the Jay Fanks hair-care collection.",
    image: "/products/shampoo-500ml.jpg",
    productUrl: "https://jayfanks.com/product/shampoo-500ml/",
    interest: "shampoo-500ml"
  },
  {
    category: "Skin care",
    name: "Mmofra Shea",
    size: "150ml",
    price: "GH₵35.00",
    description: "A 150ml shea product from the Jay Fanks Mmofra range.",
    image: "/products/mmofra-shea-150ml.jpg",
    productUrl: "https://jayfanks.com/product/mmofra-shea-150ml/",
    interest: "mmofra-shea-150ml"
  },
  {
    category: "Skin care",
    name: "Mmofra Shea",
    size: "250ml",
    price: "GH₵60.00",
    description: "A 250ml shea product from the Jay Fanks Mmofra range.",
    image: "/products/mmofra-shea-250ml.jpg",
    productUrl: "https://jayfanks.com/product/mmofra-shea-250ml/",
    interest: "mmofra-shea-250ml"
  }
];

type FormStatus = {
  message: string;
  tone: "success" | "error";
};

export default function Home() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<FormStatus | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (formOpen) return;

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % products.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, [activeSlide, formOpen]);

  useEffect(() => {
    if (!formOpen) return;

    nameInputRef.current?.focus();
    if (isSubmitting) return;

    let timer = window.setTimeout(() => setFormOpen(false), 60000);
    const resetTimer = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setFormOpen(false), 60000);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFormOpen(false);
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

  function openForm() {
    setStatus(null);
    setFormOpen(true);
  }

  function returnToShowcase() {
    formRef.current?.reset();
    setStatus(null);
    setFormOpen(false);
  }

  async function submitLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current?.reportValidity()) return;

    const values = new FormData(event.currentTarget);
    const payload = {
      name: String(values.get("name") ?? "").trim(),
      email: String(values.get("email") ?? "").trim(),
      phone: String(values.get("phone") ?? "").trim(),
      interest: String(values.get("interest") ?? ""),
      consent: values.get("consent") === "on",
      submittedAt: new Date().toISOString()
    };

    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`The server returned ${response.status}.`);
      }

      formRef.current?.reset();
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

  const product = products[activeSlide];

  return (
    <div className="shell">
      <header className="topbar">
        <a className="brand-link" href="https://jayfanks.com" aria-label="Jay Fanks home">
          <Image
            className="wordmark"
            src="/jayfanks-logo.png"
            alt="Jay Fanks"
            width={145}
            height={94}
            style={{ width: "145px", height: "auto" }}
            priority
          />
        </a>
        <div className="top-note">100% natural hair &amp; skin care</div>
      </header>

      <main>
        {!formOpen ? (
          <section className="showcase" aria-label="Jay Fanks products">
            <div className="copy">
              <p className="eyebrow">{product.category}</p>
              <h1>{product.name}</h1>
              <div className="product-details">
                <span>{product.size}</span>
                <span>{product.price || "Visit shop for price"}</span>
              </div>
              <p className="description">{product.description}</p>
              <button className="primary-button" type="button" onClick={openForm}>
                Ask about this product <span className="button-arrow" aria-hidden="true">→</span>
              </button>
              <a
                className="shop-link"
                href={product.productUrl}
                target="_blank"
                rel="noreferrer"
              >
                Shop {product.name} <span aria-hidden="true">↗</span>
              </a>
            </div>

            <div className="stage-wrap">
              <button
                className="product-stage"
                type="button"
                onClick={openForm}
                aria-label={`Ask us about ${product.name}`}
              >
                <span className="stage-label">{product.category}</span>
                <span className="product-art" key={activeSlide}>
                  <Image
                    className="product-photo"
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 760px) 90vw, 42vw"
                    priority={activeSlide === 0}
                  />
                </span>
                <span className="product-card-info">
                  <span>
                    <strong>{product.name}</strong>
                    <span className="product-size">{product.size}</span>
                  </span>
                  {product.price && <span className="product-price">{product.price}</span>}
                </span>
              </button>
              <div className="slide-controls" aria-label="Product slideshow controls">
                <button
                  className="slide-arrow"
                  type="button"
                  aria-label="Previous product"
                  onClick={() =>
                    setActiveSlide((current) => (current - 1 + products.length) % products.length)
                  }
                >
                  <span aria-hidden="true">←</span>
                </button>
                <div className="dots">
                  {products.map((item, index) => (
                    <button
                      className="dot"
                      key={item.interest}
                      type="button"
                      aria-label={`Show ${item.name} ${item.size}`}
                      aria-current={index === activeSlide ? "true" : undefined}
                      onClick={() => setActiveSlide(index)}
                    />
                  ))}
                </div>
                <span className="slide-count" aria-live="polite">
                  {String(activeSlide + 1).padStart(2, "0")} / {String(products.length).padStart(2, "0")}
                </span>
                <button
                  className="slide-arrow"
                  type="button"
                  aria-label="Next product"
                  onClick={() => setActiveSlide((current) => (current + 1) % products.length)}
                >
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
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
                  <label htmlFor="phone">Phone number <span aria-hidden="true">(optional)</span></label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+233 24 037 1188"
                  />
                </div>
                <div className="field">
                  <label htmlFor="interest">I&apos;m interested in</label>
                  <select id="interest" name="interest" defaultValue={product.interest}>
                    <option value="">Select a product</option>
                    {products.map((item) => (
                      <option key={item.interest} value={item.interest}>
                        {item.name} {item.size}
                      </option>
                    ))}
                    <option value="other">Another Jay Fanks product</option>
                    <option value="all">The whole collection</option>
                  </select>
                </div>
              </div>
              <label className="consent" htmlFor="consent">
                <input id="consent" name="consent" type="checkbox" required />
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
      </footer>
    </div>
  );
}
