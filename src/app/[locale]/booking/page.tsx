"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { ProductSelector } from "@/components/booking/product-selector";
import { Calendar } from "@/components/booking/calendar";
import { SlotPicker } from "@/components/booking/slot-picker";
import { TimezoneSelector } from "@/components/booking/timezone-selector";
import { CheckoutStatusBanner } from "@/components/booking/checkout-status-banner";
import { detectBrowserTimezone, formatInTz, resolveDateFnsLocale } from "@/lib/timezone";
import type { AvailableSlot } from "@/lib/availability";
import { MOCK_PRODUCTS, type Product } from "@/lib/mock-data";
import { formatPrice } from "@/lib/format";

const BOOKING_WINDOW_DAYS = 45;

export default function BookingPage() {
  const t = useTranslations("Booking");
  const locale = useLocale();

  const [product, setProduct] = useState<Product | null>(null);
  const [timezone, setTimezone] = useState("UTC");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState(false);

  const [freeIntroForm, setFreeIntroForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [isSubmittingFreeIntro, setIsSubmittingFreeIntro] = useState(false);
  const [freeIntroError, setFreeIntroError] = useState<
    "already_used" | "slot_taken" | "generic" | null
  >(null);
  const [freeIntroConfirmation, setFreeIntroConfirmation] = useState<{
    firstName: string;
    startUtc: Date;
    endUtc: Date;
    bookingNumber: string;
  } | null>(null);

  const [creditEmail, setCreditEmail] = useState("");
  const [creditCheckStatus, setCreditCheckStatus] = useState<
    "idle" | "checking" | "verified" | "not_found" | "error"
  >("idle");
  const [creditsAvailable, setCreditsAvailable] = useState(0);
  const [creditForm, setCreditForm] = useState({ firstName: "", lastName: "" });
  const [isSubmittingCredit, setIsSubmittingCredit] = useState(false);
  const [creditBookError, setCreditBookError] = useState<
    "no_credits" | "slot_taken" | "generic" | null
  >(null);
  const [creditConfirmation, setCreditConfirmation] = useState<{
    firstName: string;
    startUtc: Date;
    endUtc: Date;
    remainingCredits: number;
    bookingNumber: string;
  } | null>(null);

  useEffect(() => {
    // Defaults to UTC on the server to avoid a hydration mismatch, then
    // swaps in the real browser timezone once mounted on the client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimezone(detectBrowserTimezone());
  }, []);

  useEffect(() => {
    // product starts null (nothing selected yet) and is never reset back to
    // null, so there's no state to unwind here — just skip the fetch.
    if (!product) return;

    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + BOOKING_WINDOW_DAYS);

    const params = new URLSearchParams({
      duration: String(product.durationMinutes),
      from: from.toISOString(),
      to: to.toISOString(),
    });

    let cancelled = false;
    // Fetching data on a dependency change is the canonical effect use case;
    // the loading flag just tracks that in-flight request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoadingSlots(true);

    fetch(`/api/availability?${params.toString()}`)
      .then((res) => res.json())
      .then((data: { startUtc: string; endUtc: string }[]) => {
        if (cancelled) return;
        setSlots(
          data.map((slot) => ({
            startUtc: new Date(slot.startUtc),
            endUtc: new Date(slot.endUtc),
          })),
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [product]);

  const availableDates = useMemo(() => {
    const set = new Set<string>();
    for (const slot of slots) {
      set.add(formatInTz(slot.startUtc, timezone, "yyyy-MM-dd"));
    }
    return set;
  }, [slots, timezone]);

  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return slots
      .filter(
        (slot) => formatInTz(slot.startUtc, timezone, "yyyy-MM-dd") === selectedDate,
      )
      .sort((a, b) => a.startUtc.getTime() - b.startUtc.getTime());
  }, [slots, selectedDate, timezone]);

  function handleProductChange(next: Product) {
    setProduct(next);
    setSelectedDate(null);
    setSelectedSlot(null);
    setCreditEmail("");
    setCreditCheckStatus("idle");
    setCreditsAvailable(0);
    setCreditForm({ firstName: "", lastName: "" });
    setCreditBookError(null);
  }

  function handleDateSelect(dateStr: string) {
    setSelectedDate(dateStr);
    setSelectedSlot(null);
  }

  async function handleCheckout() {
    if (!product || !selectedSlot) return;

    setIsCheckingOut(true);
    setCheckoutError(false);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          slotStartUtc: selectedSlot.startUtc.toISOString(),
          slotEndUtc: selectedSlot.endUtc.toISOString(),
          customerTimezone: timezone,
          locale,
        }),
      });

      if (!res.ok) {
        // The slot may have just been taken by someone else — refresh the
        // list so the calendar reflects reality instead of retrying blind.
        setSelectedSlot(null);
        setProduct((current) => (current ? { ...current } : current));
        setCheckoutError(true);
        setIsCheckingOut(false);
        return;
      }

      const data = (await res.json()) as { url: string };
      window.location.href = data.url;
    } catch {
      setCheckoutError(true);
      setIsCheckingOut(false);
    }
  }

  async function handleFreeIntroSubmit() {
    if (!selectedSlot) return;
    if (!freeIntroForm.firstName.trim() || !freeIntroForm.lastName.trim() || !freeIntroForm.email.trim()) {
      return;
    }

    setIsSubmittingFreeIntro(true);
    setFreeIntroError(null);

    try {
      const res = await fetch("/api/free-intro/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: freeIntroForm.firstName.trim(),
          lastName: freeIntroForm.lastName.trim(),
          email: freeIntroForm.email.trim(),
          slotStartUtc: selectedSlot.startUtc.toISOString(),
          slotEndUtc: selectedSlot.endUtc.toISOString(),
          customerTimezone: timezone,
          locale,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (data.error === "already_used") {
          setFreeIntroError("already_used");
        } else if (data.error === "slot_taken") {
          setFreeIntroError("slot_taken");
          setSelectedSlot(null);
          setProduct((current) => (current ? { ...current } : current));
        } else {
          setFreeIntroError("generic");
        }
        setIsSubmittingFreeIntro(false);
        return;
      }

      const data = (await res.json()) as { bookingNumber: string };
      setFreeIntroConfirmation({
        firstName: freeIntroForm.firstName.trim(),
        startUtc: selectedSlot.startUtc,
        endUtc: selectedSlot.endUtc,
        bookingNumber: data.bookingNumber,
      });
    } catch {
      setFreeIntroError("generic");
      setIsSubmittingFreeIntro(false);
    }
  }

  function switchToSingleLesson() {
    const singleLesson = MOCK_PRODUCTS.find((p) => p.type === "single_lesson");
    if (singleLesson) handleProductChange(singleLesson);
  }

  function switchToPackage() {
    const pack = MOCK_PRODUCTS.find((p) => p.type === "lesson_package");
    if (pack) handleProductChange(pack);
  }

  async function handleCheckCredits() {
    if (!creditEmail.trim()) return;

    setCreditCheckStatus("checking");

    try {
      const res = await fetch("/api/credits/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: creditEmail.trim() }),
      });

      if (!res.ok) {
        setCreditCheckStatus("error");
        return;
      }

      const data = (await res.json()) as { available: number };
      if (data.available > 0) {
        setCreditsAvailable(data.available);
        setCreditCheckStatus("verified");
      } else {
        setCreditCheckStatus("not_found");
      }
    } catch {
      setCreditCheckStatus("error");
    }
  }

  async function handleCreditBookSubmit() {
    if (!selectedSlot) return;
    if (!creditForm.firstName.trim() || !creditForm.lastName.trim()) return;

    setIsSubmittingCredit(true);
    setCreditBookError(null);

    try {
      const res = await fetch("/api/credits/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: creditEmail.trim(),
          firstName: creditForm.firstName.trim(),
          lastName: creditForm.lastName.trim(),
          slotStartUtc: selectedSlot.startUtc.toISOString(),
          slotEndUtc: selectedSlot.endUtc.toISOString(),
          customerTimezone: timezone,
          locale,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (data.error === "no_credits") {
          setCreditBookError("no_credits");
        } else if (data.error === "slot_taken") {
          setCreditBookError("slot_taken");
          setSelectedSlot(null);
          setProduct((current) => (current ? { ...current } : current));
        } else {
          setCreditBookError("generic");
        }
        setIsSubmittingCredit(false);
        return;
      }

      const data = (await res.json()) as { remainingCredits: number; bookingNumber: string };
      setCreditConfirmation({
        firstName: creditForm.firstName.trim(),
        startUtc: selectedSlot.startUtc,
        endUtc: selectedSlot.endUtc,
        remainingCredits: data.remainingCredits,
        bookingNumber: data.bookingNumber,
      });
    } catch {
      setCreditBookError("generic");
      setIsSubmittingCredit(false);
    }
  }

  if (freeIntroConfirmation) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mx-auto max-w-2xl px-6 py-20 text-center"
      >
        <h1 className="font-display text-3xl font-medium tracking-tight">
          {t("freeIntroConfirmTitle", { name: freeIntroConfirmation.firstName })}
        </h1>
        <p className="mt-4 text-muted-foreground">{t("freeIntroConfirmBody")}</p>
        <div className="mt-8 inline-block rounded-2xl border border-border px-6 py-4 text-left">
          <p className="text-sm text-muted-foreground">{t("bookingNumberLabel")}</p>
          <p className="text-lg font-medium">{freeIntroConfirmation.bookingNumber}</p>
          <p className="mt-3 text-sm text-muted-foreground">{t("summarySlot")}</p>
          <p className="mt-1 text-lg font-medium">
            {formatInTz(
              freeIntroConfirmation.startUtc,
              timezone,
              "EEEE d MMMM yyyy, HH:mm",
              resolveDateFnsLocale(locale),
            )}{" "}
            ({timezone})
          </p>
        </div>
      </motion.div>
    );
  }

  if (creditConfirmation) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mx-auto max-w-2xl px-6 py-20 text-center"
      >
        <h1 className="font-display text-3xl font-medium tracking-tight">
          {t("freeIntroConfirmTitle", { name: creditConfirmation.firstName })}
        </h1>
        <p className="mt-4 text-muted-foreground">
          {t("useCreditConfirmBody", { count: creditConfirmation.remainingCredits })}
        </p>
        <div className="mt-8 inline-block rounded-2xl border border-border px-6 py-4 text-left">
          <p className="text-sm text-muted-foreground">{t("bookingNumberLabel")}</p>
          <p className="text-lg font-medium">{creditConfirmation.bookingNumber}</p>
          <p className="mt-3 text-sm text-muted-foreground">{t("summarySlot")}</p>
          <p className="mt-1 text-lg font-medium">
            {formatInTz(
              creditConfirmation.startUtc,
              timezone,
              "EEEE d MMMM yyyy, HH:mm",
              resolveDateFnsLocale(locale),
            )}{" "}
            ({timezone})
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-display text-3xl font-medium tracking-tight">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>

      <Suspense fallback={null}>
        <CheckoutStatusBanner />
      </Suspense>

      <div className="mt-10 grid gap-10 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-10">
          <section>
            <h2 className="mb-4 text-lg font-medium">
              {t("productSectionTitle")}
            </h2>
            <ProductSelector value={product} onChange={handleProductChange} />
          </section>

          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-medium">
                {t("calendarSectionTitle")}
              </h2>
              <TimezoneSelector value={timezone} onChange={setTimezone} />
            </div>

            {!product ? (
              <p className="text-sm text-muted-foreground">
                {t("selectProductFirst")}
              </p>
            ) : product.type === "use_credit" && creditCheckStatus !== "verified" ? (
              <div className="max-w-sm space-y-3">
                <input
                  type="email"
                  autoComplete="email"
                  placeholder={t("freeIntroEmail")}
                  value={creditEmail}
                  onChange={(e) => {
                    setCreditEmail(e.target.value);
                    if (creditCheckStatus !== "idle") setCreditCheckStatus("idle");
                  }}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                />
                {creditCheckStatus === "not_found" && (
                  <div className="rounded-lg bg-muted px-3 py-2.5 text-sm">
                    <p>{t("useCreditNotFound")}</p>
                    <button
                      type="button"
                      onClick={switchToPackage}
                      className="mt-2 font-medium text-accent underline underline-offset-2"
                    >
                      {t("useCreditNotFoundCta")}
                    </button>
                  </div>
                )}
                {creditCheckStatus === "error" && (
                  <p className="text-sm text-accent">{t("freeIntroFormError")}</p>
                )}
                <motion.button
                  type="button"
                  onClick={handleCheckCredits}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={creditCheckStatus === "checking" || !creditEmail.trim()}
                  className="rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {creditCheckStatus === "checking"
                    ? t("useCreditCheckLoading")
                    : t("useCreditCheckSubmit")}
                </motion.button>
              </div>
            ) : isLoadingSlots && slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("loadingSlots")}</p>
            ) : (
              <div className="grid gap-8 sm:grid-cols-2">
                {product.type === "use_credit" && (
                  <p className="sm:col-span-2 text-sm font-medium text-accent">
                    {t("useCreditAvailableBadge", { count: creditsAvailable })}
                  </p>
                )}
                <Calendar
                  selectedDate={selectedDate}
                  onSelect={handleDateSelect}
                  availableDates={availableDates}
                />
                <div>
                  {selectedDate ? (
                    <SlotPicker
                      slots={slotsForSelectedDate}
                      timezone={timezone}
                      selectedSlot={selectedSlot}
                      onSelect={setSelectedSlot}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t("pickDate")}
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-border p-6 shadow-[0_1px_2px_rgba(21,17,15,0.03),0_16px_32px_-24px_rgba(21,17,15,0.18)]">
          <h2 className="text-lg font-medium">{t("summaryTitle")}</h2>
          {!product || !selectedSlot ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {t("summaryEmpty")}
            </p>
          ) : (
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">
                  {t("summaryProduct")}
                </dt>
                <dd className="font-medium">
                  {product.type === "free_intro"
                    ? t("freeIntroSummaryLabel", { minutes: product.durationMinutes })
                    : product.type === "use_credit"
                      ? t("useCreditSummaryLabel")
                      : t("duration60")}
                  {product.type === "lesson_package" &&
                    ` · ${t("creditsLabel", { count: product.creditsCount })}`}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("summarySlot")}</dt>
                <dd className="font-medium">
                  {formatInTz(
                    selectedSlot.startUtc,
                    timezone,
                    "EEEE d MMMM yyyy, HH:mm",
                    resolveDateFnsLocale(locale),
                  )}{" "}
                  ({timezone})
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("summaryPrice")}</dt>
                <dd className="font-medium">
                  {product.type === "free_intro"
                    ? t("freeIntroBadge")
                    : product.type === "use_credit"
                      ? t("useCreditPriceLabel")
                      : formatPrice(product.priceCents, product.currency, locale)}
                </dd>
              </div>
            </dl>
          )}

          {product?.type === "free_intro" && selectedSlot ? (
            <>
              <div className="mt-4 space-y-2">
                <input
                  type="text"
                  autoComplete="given-name"
                  placeholder={t("freeIntroFirstName")}
                  value={freeIntroForm.firstName}
                  onChange={(e) =>
                    setFreeIntroForm((f) => ({ ...f, firstName: e.target.value }))
                  }
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                />
                <input
                  type="text"
                  autoComplete="family-name"
                  placeholder={t("freeIntroLastName")}
                  value={freeIntroForm.lastName}
                  onChange={(e) =>
                    setFreeIntroForm((f) => ({ ...f, lastName: e.target.value }))
                  }
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder={t("freeIntroEmail")}
                  value={freeIntroForm.email}
                  onChange={(e) =>
                    setFreeIntroForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </div>

              {freeIntroError === "already_used" && (
                <div className="mt-3 rounded-lg bg-muted px-3 py-2.5 text-sm">
                  <p>{t("freeIntroAlreadyUsedBody")}</p>
                  <button
                    type="button"
                    onClick={switchToSingleLesson}
                    className="mt-2 font-medium text-accent underline underline-offset-2"
                  >
                    {t("freeIntroAlreadyUsedCta")}
                  </button>
                </div>
              )}
              {freeIntroError === "slot_taken" && (
                <p className="mt-3 text-sm text-accent">{t("freeIntroSlotTaken")}</p>
              )}
              {freeIntroError === "generic" && (
                <p className="mt-3 text-sm text-accent">{t("freeIntroFormError")}</p>
              )}

              <motion.button
                type="button"
                onClick={handleFreeIntroSubmit}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={
                  isSubmittingFreeIntro ||
                  !freeIntroForm.firstName.trim() ||
                  !freeIntroForm.lastName.trim() ||
                  !freeIntroForm.email.trim()
                }
                className="mt-4 w-full rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmittingFreeIntro
                  ? t("freeIntroSubmitLoading")
                  : t("freeIntroSubmit")}
              </motion.button>
            </>
          ) : product?.type === "use_credit" && selectedSlot ? (
            <>
              <div className="mt-4 space-y-2">
                <input
                  type="text"
                  autoComplete="given-name"
                  placeholder={t("freeIntroFirstName")}
                  value={creditForm.firstName}
                  onChange={(e) =>
                    setCreditForm((f) => ({ ...f, firstName: e.target.value }))
                  }
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                />
                <input
                  type="text"
                  autoComplete="family-name"
                  placeholder={t("freeIntroLastName")}
                  value={creditForm.lastName}
                  onChange={(e) =>
                    setCreditForm((f) => ({ ...f, lastName: e.target.value }))
                  }
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </div>

              {creditBookError === "no_credits" && (
                <p className="mt-3 text-sm text-accent">{t("useCreditNoCreditsAtBooking")}</p>
              )}
              {creditBookError === "slot_taken" && (
                <p className="mt-3 text-sm text-accent">{t("freeIntroSlotTaken")}</p>
              )}
              {creditBookError === "generic" && (
                <p className="mt-3 text-sm text-accent">{t("freeIntroFormError")}</p>
              )}

              <motion.button
                type="button"
                onClick={handleCreditBookSubmit}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={
                  isSubmittingCredit ||
                  !creditForm.firstName.trim() ||
                  !creditForm.lastName.trim()
                }
                className="mt-4 w-full rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmittingCredit
                  ? t("freeIntroSubmitLoading")
                  : t("useCreditSubmit")}
              </motion.button>
            </>
          ) : (
            <>
              {checkoutError && (
                <p className="mt-3 text-sm text-accent">{t("checkoutError")}</p>
              )}
              <motion.button
                type="button"
                onClick={handleCheckout}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!product || !selectedSlot || isCheckingOut}
                className="mt-6 w-full rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isCheckingOut ? t("continueToPaymentLoading") : t("continueToPayment")}
              </motion.button>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
