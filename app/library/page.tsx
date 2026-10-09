"use client";

import { useState } from "react";
import Link from "next/link";

type Book = {
  id: string;
  title: string;
  author: string;
  description: string;
  license: "free" | "paid";
  category: string;
  url: string;
};

const BOOKS: Book[] = [
  {
    id: "poem-man-god",
    title: "The Poem of the Man-God",
    author: "Maria Valtorta",
    description: "A multi-volume work of visions of the life of Christ. Available from the official publisher.",
    license: "paid",
    category: "Valtorta",
    url: "https://www.valtorta.com.au/maria-valtorta-books-online-buy-read",
  },
  {
    id: "book-of-enoch",
    title: "The Book of Enoch",
    author: "R. H. Charles (trans.)",
    description: "Classic 1917 English translation of 1 Enoch — part of the Ethiopian canon.",
    license: "free",
    category: "Ethiopian Canon",
    url: "https://www.sacred-texts.com/bib/boe/",
  },
  {
    id: "book-of-jubilees",
    title: "The Book of Jubilees",
    author: "R. H. Charles (trans.)",
    description: "1902 translation of Jubilees (Little Genesis) — part of the Ethiopian canon.",
    license: "free",
    category: "Ethiopian Canon",
    url: "https://www.sacred-texts.com/bib/jub/",
  },
  {
    id: "ethiopian-bible-overview",
    title: "The Ethiopian Bible (Overview)",
    author: "Various",
    description: "The Ethiopian Orthodox canon includes 81+ books, including Enoch, Jubilees, and Meqabyan.",
    license: "free",
    category: "Ethiopian Canon",
    url: "https://en.wikipedia.org/wiki/Orthodox_Tewahedo_biblical_canon",
  },
  {
    id: "ccel-classics",
    title: "Christian Classics Ethereal Library",
    author: "Various",
    description: "Hundreds of public-domain Christian classics — Augustine, Aquinas, Bunyan, and more.",
    license: "free",
    category: "Classics",
    url: "https://www.ccel.org/",
  },
];

const FILTERS = [
  { key: "all", label: "All Books" },
  { key: "free", label: "Free" },
  { key: "paid", label: "Paid" },
] as const;

export default function LibraryPage() {
  const [filter, setFilter] = useState<"all" | "free" | "paid">("all");

  const visible = filter === "all" ? BOOKS : BOOKS.filter((b) => b.license === filter);

  return (
    <main className="container mx-auto px-4 py-12 max-w-5xl">
      <h1 className="text-3xl font-bold mb-3">Christian Library</h1>
      <p className="text-muted-foreground mb-8">
        A directory of free and paid Christian literature — public-domain classics, the Ethiopian canon, and modern works.
      </p>

      <div className="flex flex-wrap gap-2 mb-8">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm border transition-colors ${
              filter === f.key
                ? "bg-primary text-white border-primary"
                : "bg-card border-border hover:border-primary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {visible.map((book) => (
          <Link
            key={book.id}
            href={book.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-5 border rounded-lg hover:border-primary transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold uppercase tracking-wide ${
                book.license === "free" ? "text-green-600" : "text-amber-600"
              }`}>
                {book.license === "free" ? "Free" : "Paid"}
              </span>
              <span className="text-xs text-muted-foreground">{book.category}</span>
            </div>
            <h2 className="text-lg font-semibold">{book.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{book.author}</p>
            <p className="text-sm mt-3 leading-6">{book.description}</p>
            <span className="inline-block mt-3 text-sm text-primary font-medium">
              {book.license === "free" ? "Read free →" : "Buy from publisher →"}
            </span>
          </Link>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="text-muted-foreground">No books match this filter.</p>
      )}
    </main>
  );
}
