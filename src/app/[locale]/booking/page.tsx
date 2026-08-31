"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ProductSelector } from "@/components/booking/product-selector";
import { Calendar } from "@/components/booking/calendar";
import { SlotPicker } from "@/components/booking/slot-picker";
import { TimezoneSelector } from "@/components/booking/timezone-selector";
import { detectBrowserTimezone, formatInTz } from "@/lib/timezone";
import { getAvailableSlots, type AvailableSlot } from "@/lib/availability";
import type { Product } from "@/lib/mock-data";
import { formatPrice } from "@/lib/format";

const BOOKING_WINDOW_DAYS = 45;

export default function BookingPage() {
  const t = useTranslations("Booking");
  const locale = useLocale();

  const [product, setProduct] = useState<Product | null>(null);
  const [timezone, setTimezone] = useState("UTC");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);

  useEffect(() => {
    // Defaults to UTC on the server to avoid a hydration mismatch, then
    // swaps in the real browser timezone once mounted on the client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimezone(detectBrowserTimezone());
  }, []);

  const slots = useMemo(() => {
    if (!product) return [];
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + BOOKING_WINDOW_DAYS);
    return getAvailableSlots({
      fromDate: from,
      toDate: to,
      durationMinutes: product.durationMinutes,
    });
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
  }

  function handleDateSelect(dateStr: string) {
    setSelectedDate(dateStr);
    setSelectedSlot(null);
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      <p className="mt-4 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
        {t("mockNotice")}
      </p>

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
            ) : (
              <div className="grid gap-8 sm:grid-cols-2">
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

        <aside className="h-fit rounded-xl border border-border p-6">
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
                  {t("duration60")}
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
                  )}{" "}
                  ({timezone})
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("summaryPrice")}</dt>
                <dd className="font-medium">
                  {formatPrice(product.priceCents, product.currency, locale)}
                </dd>
              </div>
            </dl>
          )}
          <button
            type="button"
            disabled={!product || !selectedSlot}
            className="mt-6 w-full rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("continueToPayment")}
          </button>
        </aside>
      </div>
    </div>
  );
}
