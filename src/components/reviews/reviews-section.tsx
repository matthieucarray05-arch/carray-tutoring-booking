import { getTranslations } from "next-intl/server";
import { ReviewCard } from "./review-card";

interface ReviewItem {
  name: string;
  quote: string;
  rating: number;
}

export async function ReviewsSection() {
  const t = await getTranslations("Reviews");
  const items = t.raw("items") as ReviewItem[];

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-20 text-center sm:py-24">
        <p className="kicker justify-center">{t("title")}</p>
        <div className="mt-10 grid gap-5 text-left sm:grid-cols-3">
          {items.map((item, i) => (
            <ReviewCard
              key={i}
              name={item.name}
              quote={item.quote}
              rating={item.rating}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
