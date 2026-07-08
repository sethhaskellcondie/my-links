import "./style.css";
import { el } from "./dom";
import { createGameboy } from "./gameboy";
import { hiddenLink, links, type Link } from "./links";
import { createQrSlot, wireQrTrigger } from "./qr";

const app = document.querySelector<HTMLDivElement>("#app");

/** One row in the start menu — derived straight from a Link in links.ts. */
function createLinkRow(link: Link): HTMLAnchorElement {
  const row = el("a", "link", {
    href: link.url,
    target: "_blank",
    rel: "noopener noreferrer",
  });

  const cursor = el("span", "link__cursor");
  cursor.textContent = "▶"; // ▶
  cursor.setAttribute("aria-hidden", "true");

  const label = el("span", "link__label");
  label.textContent = link.name.toUpperCase();

  const leader = el("span", "link__leader");
  leader.setAttribute("aria-hidden", "true");

  const action = el("span", "link__action");
  action.textContent = link.verb.toUpperCase();

  row.append(cursor, label, leader, action);
  return row;
}

function createHero(): HTMLDivElement {
  const hero = el("div", "hero");

  const title = el("h1", "hero__title");
  title.textContent = "Seth Haskell";

  // The NES stripe + controller are a single baked artwork.
  const stripe = el("img", "stripe", {
    src: "/textures/controller-color-bars.png",
    alt: "",
  });
  stripe.setAttribute("aria-hidden", "true");

  hero.append(title, stripe);
  return hero;
}

function createMenu(): HTMLDivElement {
  const menu = el("div", "menu");

  const select = el("div", "menu__select");
  select.textContent = "— Select —";
  menu.append(select);

  if (links.length === 0) {
    const empty = el("div", "menu__empty");
    empty.textContent = "NO LINKS YET\nADD SOME IN src/links.ts";
    menu.append(empty);
    return menu;
  }

  const list = el("nav", "menu__list");
  list.append(...links.map(createLinkRow));
  menu.append(list);

  const start = el("div", "menu__start");
  const startCursor = el("span", "menu__start-cursor");
  startCursor.textContent = "▶";
  startCursor.setAttribute("aria-hidden", "true");
  const startLabel = el("span");
  startLabel.textContent = "PRESS START";
  start.append(startCursor, startLabel);
  // Easter egg: PRESS START opens the unlisted "Hidden" link. Deliberately
  // no hover state — it should not look clickable.
  start.addEventListener("click", () => {
    if (hiddenLink) window.open(hiddenLink.url, "_blank", "noopener,noreferrer");
  });
  menu.append(start);

  return menu;
}

/**
 * Wire the POWER button to the CRT state machine.
 *   on      -> shutters / pinch line / fade / brightness / LED
 *   booting -> warm-up "hum bar" waves (~2.6s)
 *   tuned   -> the green "CH 03" indicator (5s, instant cut)
 * State lives as classes on `tv`; CSS does the rest.
 */
function wirePower(tv: HTMLDivElement, buttons: HTMLButtonElement[]): void {
  let on = true;
  let bootTimer: number | undefined;
  let chTimer: number | undefined;

  const clearTimers = () => {
    clearTimeout(bootTimer);
    clearTimeout(chTimer);
  };

  const apply = () => {
    tv.classList.toggle("is-off", !on);
  };

  const toggle = () => {
    on = !on;
    clearTimers();
    apply();

    if (on) {
      tv.classList.add("is-booting", "is-tuned");
      bootTimer = window.setTimeout(
        () => tv.classList.remove("is-booting"),
        2600,
      );
      chTimer = window.setTimeout(() => tv.classList.remove("is-tuned"), 5000);
    } else {
      tv.classList.remove("is-booting", "is-tuned");
    }
  };

  buttons.forEach((button) => button.addEventListener("click", toggle));

  // Tidy up if the node ever leaves the document.
  window.addEventListener("pagehide", clearTimers);
}

function createScreen(): HTMLDivElement {
  const screen = el("div", "screen");

  const tube = el("div", "tube");
  tube.append(
    el("div", "scanlines"),
    el("div", "vignette"),
    createHero(),
    createMenu(),
  );

  // Power-state overlays (order = stacking within the screen).
  const shutterTop = el("div", "shutter shutter--top");
  const shutterBottom = el("div", "shutter shutter--bottom");
  const pinch = el("div", "pinch");
  const fade = el("div", "fade");
  const waves = el("div", "waves");
  const channel = el("div", "channel");
  channel.textContent = "CH 03";
  [shutterTop, shutterBottom, pinch, fade, waves, channel].forEach((node) =>
    node.setAttribute("aria-hidden", "true"),
  );

  screen.append(
    tube,
    shutterTop,
    shutterBottom,
    pinch,
    fade,
    waves,
    channel,
  );
  return screen;
}

function createPowerButton(): HTMLButtonElement {
  const power = el("button", "power", { type: "button" });
  power.setAttribute("aria-label", "Power");

  const led = el("span", "power__led");
  led.setAttribute("aria-hidden", "true");

  const label = el("span", "power__label");
  label.textContent = "Power";

  power.append(led, label);
  return power;
}

/** Landscape bezel: brand plate + power button under the screen. */
function createChin(power: HTMLButtonElement): HTMLDivElement {
  const chin = el("div", "chin");

  const brand = el("span", "brand");
  brand.textContent = "SANY - Trinitran";
  wireQrTrigger(brand);

  chin.append(brand, power);
  return chin;
}

/** Portrait bezel: brand, speaker dots, and power above the screen. */
function createTopBar(power: HTMLButtonElement): HTMLDivElement {
  const bar = el("div", "topbar");

  const brand = el("span", "topbar__brand");
  brand.textContent = "SANY";
  wireQrTrigger(brand);

  const dots = el("span", "topbar__dots");
  dots.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 4; i++) dots.append(el("i", "topbar__dot"));

  bar.append(brand, dots, power);
  return bar;
}

/** Portrait only: the aerial poking out of the top-right corner. */
function createAntenna(): HTMLDivElement {
  const antenna = el("div", "antenna");
  antenna.setAttribute("aria-hidden", "true");
  return antenna;
}

/** Portrait only: decorative TUNE / VOL knobs with the model name between. */
function createKnobs(): HTMLDivElement {
  const knobs = el("div", "knobs");
  knobs.setAttribute("aria-hidden", "true");

  const makeKnob = (name: string) => {
    const group = el("div", "knob-group");
    const dial = el("span", "knob");
    const label = el("span", "knob__label");
    label.textContent = name;
    group.append(dial, label);
    return group;
  };

  const model = el("span", "knobs__model");
  model.textContent = "FD - 42 Watchmaan";

  knobs.append(makeKnob("Tune"), model, makeKnob("Vol"));
  return knobs;
}

/**
 * The hidden page — appended alongside the TV. CSS swaps it in for the
 * portrait (skinny) view only; landscape always shows the TV.
 */
function renderHidden(root: HTMLDivElement): void {
  const page = el("div", "page page--hidden");
  page.append(createQrSlot(), createGameboy());
  root.append(page);
}

function render(root: HTMLDivElement): void {
  root.replaceChildren();

  const page = el("div", "page");
  const tv = el("div", "tv");

  // Two power buttons — only one is visible at a time (chin in landscape,
  // top bar in portrait) but both drive the same CRT state machine.
  const chinPower = createPowerButton();
  const topPower = createPowerButton();

  tv.append(
    createAntenna(),
    createTopBar(topPower),
    createScreen(),
    createChin(chinPower),
    createKnobs(),
  );
  wirePower(tv, [chinPower, topPower]);

  page.append(createQrSlot(), tv);
  root.append(page);
}

if (app) {
  render(app);

  // Roll 1–10 on every visit; a 10 swaps the portrait view for the hidden
  // page. The wide view renders as normal regardless of the roll.
  const roll = Math.floor(Math.random() * 10) + 1;
  if (roll === 10) {
    app.classList.add("has-hidden");
    renderHidden(app);
  }
}
