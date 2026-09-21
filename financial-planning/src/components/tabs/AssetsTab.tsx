"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { SegmentedControl, type SegmentedThumb } from "@/components/ui";
import { useLanguage } from "@/hooks/useLanguage";
import { TR } from "@/lib/i18n";
import { LiquidTab } from "./LiquidTab";
import { InvestmentTab } from "./InvestmentTab";
import { PersonalTab } from "./PersonalTab";
import { LiabilityTab } from "./LiabilityTab";
import { AssetTrendTab } from "./AssetTrendTab";

type AssetCategory = "liquid" | "investment" | "personal" | "liability" | "trend";
const ORDER: AssetCategory[] = ["liquid", "investment", "personal", "liability", "trend"];

// Swipe tuning. The distances are the most sensitive ("ไว") of the three
// settings on the phone mockup.
const COMMIT_DISTANCE = 45; // px of sideways travel that switches tab on release…
const FLICK_DISTANCE = 20;  // …or only this much, if the finger is still moving
const FLICK_SPEED = 0.3;    // at least this fast (px/ms) as it lets go
// Travel before a drag is read as a swipe or a scroll. Kept short: the
// verdict has to land before the phone commits to scrolling on its own.
const LOCK_DISTANCE = 8;
const EDGE_GUARD = 24;      // px at each screen edge, left to the phone's own back gesture
const SWIPE_SLOPE = Math.tan((30 * Math.PI) / 180); // within 30° of level is a swipe
const FOLLOW = 0.5;         // the content moves half as far as the finger
const SLIDE = 0.3;          // share of the width a tab travels as it leaves or arrives
const LEAVE_MS = 110;
const ENTER_MS = 220;
const EASE_IN = "cubic-bezier(.4,0,1,1)";
const EASE_OUT = "cubic-bezier(.22,1,.36,1)";

// The transform is cleared, not set to zero, at rest — the same reason the
// Modal sheet does it: any transform makes an element the containing block
// for position:fixed descendants.
function placeStage(el: HTMLElement, x: number, opacity: number, ms = 0, ease = EASE_OUT) {
  el.style.transition = ms ? `transform ${ms}ms ${ease}, opacity ${ms}ms ${ease}` : "none";
  el.style.transform = x ? `translate3d(${x}px, 0, 0)` : "";
  el.style.opacity = opacity < 1 ? String(opacity) : "";
}

// A drag that starts on something already using sideways drags belongs to
// that thing: the trend chart moves its tooltip under the finger (marked
// data-no-swipe), and the comparison table scrolls whenever it is wider than
// the screen — checked by overflow rather than marked, so any scroller added
// later steps aside the same way.
function swipeBlockedAt(target: EventTarget | null, root: HTMLElement): boolean {
  if (!(target instanceof Element)) return true;
  if (target.closest("[data-no-swipe], input, textarea, select")) return true;
  for (let el: Element | null = target; el && el !== root; el = el.parentElement) {
    if (el.scrollWidth > el.clientWidth + 1) {
      const overflowX = getComputedStyle(el).overflowX;
      if (overflowX === "auto" || overflowX === "scroll") return true;
    }
  }
  return false;
}

// Speed over roughly the last 90ms of movement; zero if the finger had
// stopped before letting go, so a slow drag that stops short stays put.
function releaseSpeed(samples: { t: number; x: number }[], releasedAt: number): number {
  const last = samples[samples.length - 1];
  if (releasedAt - last.t > 120) return 0;
  let first = samples[0];
  for (let i = samples.length - 1; i >= 0; i--) {
    first = samples[i];
    if (last.t - samples[i].t >= 90) break;
  }
  const dt = last.t - first.t;
  return dt > 0 ? (last.x - first.x) / dt : 0;
}

type Gesture = {
  id: number;
  x0: number;
  y0: number;
  dx: number;
  dy: number;
  sideways: boolean | null;
  samples: { t: number; x: number }[];
};

export function AssetsTab() {
  const { t } = useLanguage();
  const [category, setCategory] = useState<AssetCategory>("liquid");
  const [thumb, setThumb] = useState<SegmentedThumb | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef(category);
  // The side the next tab slides in from (1 = from the right), set just
  // before switching; 0 switches without animating.
  const enterFrom = useRef(0);
  // True while a tab is leaving or arriving, so a second swipe or tap can't
  // start halfway through the first.
  const busy = useRef(false);

  const CATEGORIES: { value: AssetCategory; label: string }[] = [
    { value: "liquid", label: t(TR.assets.tabLiquid) },
    { value: "investment", label: t(TR.assets.tabInvestment) },
    { value: "personal", label: t(TR.assets.tabPersonal) },
    { value: "liability", label: t(TR.assets.tabLiability) },
    { value: "trend", label: t(TR.assets.tabTrend) },
  ];

  // Built once per tab: the thumb re-renders this component on every pointer
  // move during a swipe, and the tab's own list shouldn't re-render with it.
  const panel = useMemo(() => {
    if (category === "liquid") return <LiquidTab />;
    if (category === "investment") return <InvestmentTab />;
    if (category === "personal") return <PersonalTab />;
    if (category === "liability") return <LiabilityTab />;
    return <AssetTrendTab />;
  }, [category]);

  // Tapping slides the new tab in from the same side a swipe would, so the
  // two ways of switching read as one.
  const selectCategory = (next: AssetCategory) => {
    if (next === category || busy.current) return;
    enterFrom.current = ORDER.indexOf(next) > ORDER.indexOf(category) ? 1 : -1;
    setThumb(null);
    setCategory(next);
  };

  useLayoutEffect(() => {
    categoryRef.current = category;
    const dir = enterFrom.current;
    enterFrom.current = 0;
    const stage = stageRef.current;
    if (!dir || !stage) return;
    // Switched from far down a long list: bring the tab bar back on screen,
    // so the new tab's name is visible and it opens at its top.
    const bar = barRef.current;
    if (bar) {
      const top = bar.getBoundingClientRect().top;
      if (top < 8) window.scrollTo(0, Math.max(0, window.scrollY + top - 12));
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      placeStage(stage, 0, 1);
      busy.current = false;
      return;
    }
    const width = stage.parentElement?.clientWidth ?? stage.clientWidth;
    placeStage(stage, dir * width * SLIDE, 0);
    void stage.offsetWidth; // commit the start position so the transition runs from it
    placeStage(stage, 0, 1, ENTER_MS, EASE_OUT);
    busy.current = true;
    const id = window.setTimeout(() => { busy.current = false; }, ENTER_MS);
    return () => {
      window.clearTimeout(id);
      busy.current = false;
    };
  }, [category]);

  // Listeners go on the DOM node rather than as React props. React's
  // synthetic events bubble through portals along the component tree, so the
  // add/edit sheets — portaled to <body> but owned by the tab underneath —
  // would feed their own drags into this handler, and a sideways drag inside
  // a half-filled form could switch the tab out from under it, unmounting
  // the form with everything typed so far.
  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const timers: number[] = [];
    let g: Gesture | null = null;
    let suppressClicksUntil = 0;

    const stop = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      g = null;
    };
    const snapBack = () => {
      setThumb(null);
      placeStage(stage, 0, 1, reducedMotion.matches ? 0 : ENTER_MS, EASE_OUT);
    };

    const onDown = (e: PointerEvent) => {
      // Fingers and pens only: with a mouse a sideways drag selects text, and
      // the tab bar is right there to click.
      if (e.pointerType === "mouse" || !e.isPrimary || g || busy.current) return;
      if (e.clientX < EDGE_GUARD || e.clientX > window.innerWidth - EDGE_GUARD) return;
      if (swipeBlockedAt(e.target, root)) return;
      g = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, sideways: null, samples: [{ t: e.timeStamp, x: e.clientX }] };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onCancel);
    };

    const onMove = (e: PointerEvent) => {
      if (!g || e.pointerId !== g.id) return;
      g.dx = e.clientX - g.x0;
      g.dy = e.clientY - g.y0;
      const adx = Math.abs(g.dx), ady = Math.abs(g.dy);
      if (g.sideways === null) {
        if (adx < LOCK_DISTANCE && ady < LOCK_DISTANCE) return;
        // Within 30° of level it's a swipe, and onTouchMove holds the page
        // still from here until the finger lifts. Anything steeper is a
        // scroll and is left to the browser.
        g.sideways = ady <= adx * SWIPE_SLOPE;
        if (!g.sideways) { stop(); return; }
      }
      g.samples.push({ t: e.timeStamp, x: e.clientX });
      if (g.samples.length > 10) g.samples.shift();
      const index = ORDER.indexOf(categoryRef.current);
      const dir = g.dx < 0 ? 1 : -1;
      const target = index + dir;
      if (target < 0 || target >= ORDER.length) {
        // Nothing further this way: give a little, harder the further it's
        // pulled, and spring back on release.
        setThumb({ index, tracking: true });
        if (!reducedMotion.matches) placeStage(stage, Math.sign(g.dx) * 42 * (1 - Math.exp(-adx / 150)), 1);
        return;
      }
      const progress = Math.min(adx / COMMIT_DISTANCE, 1);
      setThumb({ index: index + dir * progress, tracking: true });
      if (!reducedMotion.matches) {
        placeStage(stage, g.dx * FOLLOW, 1 - 0.35 * Math.min(adx / (COMMIT_DISTANCE * 1.6), 1));
      }
    };

    const onUp = (e: PointerEvent) => {
      if (!g || e.pointerId !== g.id) return;
      const done = g;
      stop();
      if (!done.sideways) return;
      // A swipe that ends over a row must not also open its edit form.
      suppressClicksUntil = performance.now() + 350;
      const index = ORDER.indexOf(categoryRef.current);
      const adx = Math.abs(done.dx), ady = Math.abs(done.dy);
      const dir = done.dx < 0 ? 1 : -1;
      const target = index + dir;
      const speed = releaseSpeed(done.samples, e.timeStamp);
      const flicked = adx >= FLICK_DISTANCE && Math.abs(speed) >= FLICK_SPEED && Math.sign(speed) === Math.sign(done.dx);
      // It was judged a swipe at the start, so a drift in angle along the
      // way doesn't undo that — only a drag that ended up mostly vertical.
      if (target < 0 || target >= ORDER.length || ady > adx || (adx < COMMIT_DISTANCE && !flicked)) {
        snapBack();
        return;
      }
      const next = ORDER[target];
      busy.current = true;
      if (reducedMotion.matches) {
        enterFrom.current = dir;
        setThumb(null);
        setCategory(next);
        return;
      }
      // The thumb glides to the destination while the old tab slides out;
      // the new one slides in from the far side once it has rendered.
      setThumb({ index: target, tracking: false });
      const width = stage.parentElement?.clientWidth ?? stage.clientWidth;
      placeStage(stage, -dir * width * SLIDE, 0, LEAVE_MS, EASE_IN);
      timers.push(window.setTimeout(() => {
        enterFrom.current = dir;
        setThumb(null);
        setCategory(next);
      }, LEAVE_MS));
    };

    const onCancel = (e: PointerEvent) => {
      if (!g || e.pointerId !== g.id) return;
      const wasSideways = g.sideways;
      stop();
      if (wasSideways) snapBack();
    };
    const onBlur = () => {
      if (!g) return;
      const wasSideways = g.sideways;
      stop();
      if (wasSideways) snapBack();
    };
    const onClickCapture = (e: MouseEvent) => {
      if (performance.now() < suppressClicksUntil) {
        e.stopPropagation();
        e.preventDefault();
      }
    };
    // touch-action: pan-y leaves vertical panning to the browser, and not
    // every browser keeps a mostly-sideways drag out of it — a slightly
    // slanted swipe could scroll the page up or down along the way.
    // Cancelling the touchmove holds the page still. Each touchmove follows
    // the pointermove for the same movement, which has already given the
    // verdict; the few before it go through untouched, since cancelling one
    // then could stop the page scrolling at all if the drag turns out to be
    // vertical.
    const onTouchMove = (e: TouchEvent) => {
      if (g?.sideways && e.cancelable) e.preventDefault();
    };

    root.addEventListener("pointerdown", onDown);
    root.addEventListener("click", onClickCapture, true);
    root.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("blur", onBlur);
    return () => {
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("click", onClickCapture, true);
      root.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("blur", onBlur);
      stop();
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  // The swipe surface reaches the bottom of the screen even when a tab is
  // short, so the space under a two-item list swipes too. Measured rather
  // than written as calc() so it ends exactly at the page's bottom padding
  // and never adds a few pixels of scroll to a page that already fits.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const fit = () => {
      const main = root.parentElement;
      const bottomPadding = main ? parseFloat(getComputedStyle(main).paddingBottom) || 0 : 0;
      const top = root.getBoundingClientRect().top + window.scrollY;
      root.style.minHeight = `${Math.max(0, window.innerHeight - top - bottomPadding)}px`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    // pan-y leaves vertical scrolling (and pinch zoom) to the browser and
    // hands sideways movement to the swipe handler above.
    <div ref={rootRef} style={{ touchAction: "pan-y pinch-zoom" }}>
      <div ref={barRef} style={{ marginBottom: 22 }}>
        <SegmentedControl small options={CATEGORIES} value={category} onChange={selectCategory} thumb={thumb} />
      </div>
      <div className="fp-swipe-clip">
        <div ref={stageRef}>{panel}</div>
      </div>
    </div>
  );
}
