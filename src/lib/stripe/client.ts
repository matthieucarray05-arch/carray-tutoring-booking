import Stripe from "stripe";

let instance: Stripe | undefined;

/**
 * Lazy, like the DB client — constructing this at module load would throw
 * during Next.js's build-time "collect page data" pass if the key isn't
 * visible to that build, failing the whole deployment instead of just the
 * routes that need it.
 */
export function getStripe(): Stripe {
  if (!instance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    instance = new Stripe(secretKey);
  }
  return instance;
}
