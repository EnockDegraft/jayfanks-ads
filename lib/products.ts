/** A product customers can tick on the form. Its ID (`interest`) is what the API stores. */
export type Product = {
  category: string;
  name: string;
  size: string;
  price: string;
  description: string;
  /** Products with an image get their own screen in the showcase. */
  image?: string;
  productUrl?: string;
  interest: string;
};

/** One full-screen photo in the kiosk showcase. Its button ticks `interests` on the form. */
export type Slide = {
  title: string;
  size?: string;
  image: string;
  interests: string[];
};

export const products: Product[] = [
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
  },
  // Products seen in the client's own photos (see `photoSlides`). Prices and shop links to come.
  {
    category: "Hair care",
    name: "Leave-In Conditioner",
    size: "250ml",
    price: "",
    description: "A 250ml flaxseed and castor oil leave-in conditioner from the Jay Fanks hair-care collection.",
    interest: "leave-in-conditioner-250ml"
  },
  {
    category: "Hair care",
    name: "Mmofra Hair Growth Shampoo",
    size: "500ml",
    price: "",
    description: "A 500ml sulphate-free hair growth shampoo for kids from the Jay Fanks Mmofra range.",
    interest: "mmofra-hair-growth-shampoo-500ml"
  },
  {
    category: "Hair care",
    name: "Mmofra Hair Butter",
    size: "250ml",
    price: "",
    description: "A 250ml hair butter from the Jay Fanks Mmofra range.",
    interest: "mmofra-hair-butter-250ml"
  },
  {
    category: "Skin care",
    name: "Unrefined Shea Butter",
    size: "300ml",
    price: "",
    description: "A 300ml unrefined shea butter from Jay Fanks.",
    interest: "unrefined-shea-butter-300ml"
  },
  {
    category: "Gifts",
    name: "Christmas Gift Pack",
    size: "",
    price: "",
    description: "A Jay Fanks Christmas box of body butter, hair butter and Mmofra Shea.",
    interest: "christmas-gift-pack"
  },
  {
    category: "Gifts",
    name: "Custom Gift Boxes",
    size: "",
    price: "",
    description: "Personalised Fortified Butter gift boxes for events.",
    interest: "custom-gift-boxes"
  }
];

/** Every value the form's "I'm interested in" select can send. */
export const interestValues = new Set([
  ...products.map((product) => product.interest),
  "other",
  "all"
]);

const hairCareRange = ["shampoo-500ml", "conditioner-500ml", "leave-in-conditioner-250ml", "hair-growth-oil-100ml"];
const mmofraRange = [
  "mmofra-hair-growth-shampoo-500ml",
  "mmofra-leave-in-detangler",
  "mmofra-conditioner-250ml",
  "mmofra-hair-growth-oil",
  "mmofra-hair-butter-250ml"
];

/** The client's own flyers and product photos, shown after the product photos. */
const photoSlides: Slide[] = [
  { title: "Body and Hair Butter", image: "/promos/body-and-hair-butter.jpg", interests: ["body-butter", "hair-butter-150ml"] },
  { title: "Organic Hair Care", image: "/promos/hair-care-range.jpg", interests: hairCareRange },
  { title: "Body Butter", size: "300ml", image: "/promos/body-butter-soft-radiant-skin.jpg", interests: ["body-butter"] },
  { title: "Body Butter", size: "300ml", image: "/promos/body-butter-shea-massage.jpg", interests: ["body-butter"] },
  { title: "Hair Care Range", image: "/photoshoot/hair-care-range-leaves.jpg", interests: hairCareRange },
  {
    title: "The Jay Fanks Range",
    image: "/photoshoot/full-range.jpg",
    interests: ["leave-in-conditioner-250ml", "hair-butter-150ml", "body-butter", "mmofra-shea-150ml", "mmofra-shea-250ml"]
  },
  { title: "Mmofra Kids' Range", image: "/photoshoot/mmofra-range.jpg", interests: mmofraRange },
  { title: "Mmofra Kids' Range", image: "/photoshoot/mmofra-range-2.jpg", interests: mmofraRange },
  { title: "Hair Care Range", image: "/photoshoot/hair-care-range-fur.jpg", interests: hairCareRange },
  { title: "Hair Butter", image: "/photoshoot/hair-butter-pair.jpg", interests: ["hair-butter-250ml", "hair-butter-150ml"] },
  { title: "Body Butter", size: "300ml", image: "/photoshoot/body-butter-300ml.jpg", interests: ["body-butter"] },
  { title: "Hair Butter", size: "250ml", image: "/photoshoot/hair-butter-250ml.jpg", interests: ["hair-butter-250ml"] },
  { title: "Mmofra Shea", size: "250ml", image: "/photoshoot/mmofra-shea.jpg", interests: ["mmofra-shea-250ml"] },
  { title: "Christmas Gift Pack", image: "/photoshoot/christmas-gift-pack.jpg", interests: ["christmas-gift-pack"] },
  {
    title: "Body and Hair Butter for Men",
    image: "/photoshoot/mens-body-and-hair-butter.jpg",
    interests: ["body-butter-men", "hair-butter-men"]
  },
  {
    title: "Hair Butter",
    size: "250ml & 150ml",
    image: "/photoshoot/hair-butter-250ml-and-150ml.jpg",
    interests: ["hair-butter-250ml", "hair-butter-150ml"]
  },
  { title: "Mmofra Hair Butter", size: "250ml", image: "/photoshoot/mmofra-hair-butter-250ml.jpg", interests: ["mmofra-hair-butter-250ml"] },
  { title: "Unrefined Shea Butter", size: "300ml", image: "/photoshoot/unrefined-shea-butter-300ml.jpg", interests: ["unrefined-shea-butter-300ml"] },
  { title: "Custom Gift Boxes", image: "/custom-gifts/fortified-butter-gift-box.jpg", interests: ["custom-gift-boxes"] },
  { title: "Custom Gift Boxes", image: "/custom-gifts/fortified-butter-gift-boxes-row.jpg", interests: ["custom-gift-boxes"] },
  { title: "Custom Gift Boxes", image: "/custom-gifts/fortified-butter-gift-boxes-stack.jpg", interests: ["custom-gift-boxes"] }
];

// A typo here would open the form with nothing ticked, so fail the build instead.
for (const slide of photoSlides) {
  const unknown = slide.interests.filter((id) => !products.some((product) => product.interest === id));
  if (unknown.length > 0) throw new Error(`Slide ${slide.image} ticks unknown products: ${unknown.join(", ")}`);
}

/** Every screen of the kiosk showcase, in order: one per product photo, then the client's photos. */
export const slides: Slide[] = [
  ...products.flatMap((product) =>
    product.image
      ? [{ title: product.name, size: product.size, image: product.image, interests: [product.interest] }]
      : []
  ),
  ...photoSlides
];
