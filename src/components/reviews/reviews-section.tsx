import { getTranslations } from "next-intl/server";
import { ReviewCard } from "./review-card";
import { Reveal } from "@/components/motion/reveal";

interface ReviewItem {
  name: string;
  quote: string;
  rating: number;
}

/** Photos aren't translatable text, so they're matched by name here rather
 * than stored in messages/*.json. Add a new entry whenever a review gets
 * a real photo — see public/reviews/ for the image files. */
const REVIEW_PHOTOS: Record<string, string> = {
  Kevin: "/reviews/kevin.jpg",
};

export async function ReviewsSection() {
  const t = await getTranslations("Reviews");
  const items = t.raw("items") as ReviewItem[];

  return (
    <section id="reviews" className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-20 text-center sm:py-24">
        <Reveal>
          <p className="kicker justify-center">{t("title")}</p>
        </Reveal>
        <div className="mt-10 grid items-stretch gap-5 text-left sm:grid-cols-3">
          {items.map((item, i) => (
            <Reveal key={i} delay={i * 0.1} className="h-full">
              <ReviewCard
                name={item.name}
                quote={item.quote}
                rating={item.rating}
                photo={REVIEW_PHOTOS[item.name]}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
