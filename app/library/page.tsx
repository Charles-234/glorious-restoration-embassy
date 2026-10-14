import Link from "next/link";
import { getLibraryMedia } from "@/lib/siteData";

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

type LibraryPageProps = {
  searchParams: Promise<{ filter?: string | string[] }>;
};

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const params = await searchParams;
  const requestedFilter = Array.isArray(params.filter) ? params.filter[0] : params.filter;
  const filter = FILTERS.find((option) => option.key === requestedFilter)?.key ?? "all";
  const visible = filter === "all" ? BOOKS : BOOKS.filter((book) => book.license === filter);
  const libraryMedia = await getLibraryMedia();

  return (
    <main className="container mx-auto px-4 py-12 max-w-5xl">
      <h1 className="text-3xl font-bold mb-3">Christian Library</h1>
      <p className="text-muted-foreground mb-8">
        A directory of free and paid Christian literature, alongside published audio and documents from the Embassy.
      </p>

      {libraryMedia.length > 0 ? (
        <section className="mt-12" aria-labelledby="library-media-heading">
          <h2 id="library-media-heading" className="text-2xl font-bold mb-5">
            Audio and Documents
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            {libraryMedia.map((item) => {
              const title = item.title?.trim() || (item.kind === "audio" ? "Audio resource" : "Document");
              const description = item.caption?.trim() || item.alt_text?.trim();

              return (
                <article key={item.id} className="p-5 border rounded-lg">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {item.kind}
                  </p>
                  <h3 className="text-lg font-semibold mt-2">{title}</h3>
                  {description ? (
                    <p className="text-sm text-muted-foreground mt-2">{description}</p>
                  ) : null}
                  {item.kind === "audio" ? (
                    <audio className="mt-4 w-full" controls preload="none" src={item.src}>
                      Your browser does not support audio playback.
                    </audio>
                  ) : (
                    <a
                      className="inline-block mt-4 text-sm text-primary font-medium underline-offset-4 hover:underline"
                      href={item.src}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open document
                    </a>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-8">
            {FILTERS.map((f) => (
              <Link
                key={f.key}
                href={f.key === "all" ? "/library" : `/library?filter=${f.key}`}
                aria-current={filter === f.key ? "page" : undefined}
                className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                  filter === f.key
                    ? "bg-primary text-white border-primary"
                    : "bg-card border-border hover:border-primary"
                }`}
              >
                {f.label}
              </Link>
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
        </>
      )}
    </main>
  );
}
