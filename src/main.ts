import "./style.css";
import { initAudio, playTvOff } from "./audio";
import { getChannel, setChannel } from "./channel";
import { el } from "./dom";
import { createGameboy } from "./gameboy";
import { hiddenLink, links, type Link } from "./links";
import { createQrSlot, wireQrTrigger } from "./qr";
import { formatVolume, onVolumeChange, stepVolume } from "./volume";

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
 * Wire the POWER button to the CRT state machine. The channel is the source of
 * truth for whether the set is on — powered means channel 3.
 *   on      -> shutters / pinch line / fade / brightness / LED
 *   booting -> warm-up "hum bar" waves (~2.6s)
 *   tuned   -> the green "CH 03" indicator (5s, instant cut)
 * State lives as classes on `tv`; CSS does the rest.
 */
function wirePower(tv: HTMLDivElement, buttons: HTMLButtonElement[]): void {
  let bootTimer: number | undefined;
  let chTimer: number | undefined;

  const clearTimers = () => {
    clearTimeout(bootTimer);
    clearTimeout(chTimer);
  };

  const toggle = () => {
    const on = getChannel() === "off";
    setChannel(on ? 3 : "off");
    clearTimers();
    tv.classList.toggle("is-off", !on);

    if (on) {
      tv.classList.add("is-booting", "is-tuned");
      bootTimer = window.setTimeout(
        () => tv.classList.remove("is-booting"),
        2600,
      );
      chTimer = window.setTimeout(() => tv.classList.remove("is-tuned"), 5000);
    } else {
      tv.classList.remove("is-booting", "is-tuned");
      playTvOff();
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

  // Opposite corner from the CH indicator, sharing its show/hide rules.
  const volume = el("div", "volume");
  onVolumeChange((value) => {
    volume.textContent = formatVolume(value);
  });

  [shutterTop, shutterBottom, pinch, fade, waves, channel, volume].forEach(
    (node) => node.setAttribute("aria-hidden", "true"),
  );

  screen.append(
    tube,
    shutterTop,
    shutterBottom,
    pinch,
    fade,
    waves,
    channel,
    volume,
  );
  return screen;
}

/** VOL − / + : two round bezel buttons, triangle down and triangle up. */
function createVolumePad(): {
  pad: HTMLDivElement;
  up: HTMLButtonElement;
  down: HTMLButtonElement;
} {
  const pad = el("div", "volpad");

  const makeButton = (direction: "up" | "down") => {
    const button = el("button", "volpad__btn", { type: "button" });
    button.setAttribute(
      "aria-label",
      direction === "up" ? "Volume up" : "Volume down",
    );
    const triangle = el("span", `volpad__tri volpad__tri--${direction}`);
    triangle.setAttribute("aria-hidden", "true");
    button.append(triangle);
    return button;
  };

  const down = makeButton("down");
  const up = makeButton("up");

  const buttons = el("div", "volpad__buttons");
  buttons.append(down, up);

  const label = el("span", "volpad__label");
  label.textContent = "Vol";
  label.setAttribute("aria-hidden", "true");

  pad.append(buttons, label);
  return { pad, up, down };
}

/**
 * Wire the VOL buttons to the volume state and the on-screen readout. The
 * readout borrows the CH indicator's rules — instant on, 5s, instant cut —
 * appearing on power-up (via `is-tuned`) and again on every volume press.
 */
function wireVolume(
  tv: HTMLDivElement,
  pads: { up: HTMLButtonElement; down: HTMLButtonElement }[],
): void {
  let osdTimer: number | undefined;

  const nudge = (delta: number) => {
    stepVolume(delta);
    clearTimeout(osdTimer);
    tv.classList.add("is-vol");
    osdTimer = window.setTimeout(() => tv.classList.remove("is-vol"), 5000);
  };

  pads.forEach(({ up, down }) => {
    up.addEventListener("click", () => nudge(1));
    down.addEventListener("click", () => nudge(-1));
  });

  window.addEventListener("pagehide", () => clearTimeout(osdTimer));
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

/**
 * Landscape bezel: brand plate on the left, with the volume buttons and the
 * power button grouped together on the right.
 */
function createChin(
  power: HTMLButtonElement,
  volumePad: HTMLDivElement,
): HTMLDivElement {
  const chin = el("div", "chin");

  const brand = el("span", "brand");
  brand.textContent = "SANY - Trinitran";
  wireQrTrigger(brand);

  const controls = el("div", "chin__controls");
  controls.append(volumePad, power);

  chin.append(brand, controls);
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

/**
 * Portrait only: a decorative TUNE knob, the model name, and the working
 * volume buttons where the matching VOL knob used to be. Only the decorative
 * parts are hidden from assistive tech — the buttons are real controls.
 */
function createKnobs(volumePad: HTMLDivElement): HTMLDivElement {
  const knobs = el("div", "knobs");

  const makeKnob = (name: string) => {
    const group = el("div", "knob-group");
    group.setAttribute("aria-hidden", "true");
    const dial = el("span", "knob");
    const label = el("span", "knob__label");
    label.textContent = name;
    group.append(dial, label);
    return group;
  };

  const model = el("span", "knobs__model");
  model.setAttribute("aria-hidden", "true");
  model.textContent = "FD - 42 Watchmaan";

  knobs.append(makeKnob("Tune"), model, volumePad);
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

  // Two of each control — only one bezel is visible at a time (chin in
  // landscape, top bar and knob panel in portrait) but both sets drive the
  // same state.
  const chinPower = createPowerButton();
  const topPower = createPowerButton();
  const chinVolume = createVolumePad();
  const knobVolume = createVolumePad();

  tv.append(
    createAntenna(),
    createTopBar(topPower),
    createScreen(),
    createChin(chinPower, chinVolume.pad),
    createKnobs(knobVolume.pad),
  );
  wirePower(tv, [chinPower, topPower]);
  wireVolume(tv, [chinVolume, knobVolume]);

  page.append(createQrSlot(), tv);
  root.append(page);
}

if (app) {
  render(app);
  initAudio();
  setChannel(3); // the CRT starts powered on and tuned in

  // Roll 1–10 on every visit; a 10 swaps the portrait view for the hidden
  // page. The wide view renders as normal regardless of the roll.
  const roll = Math.floor(Math.random() * 10) + 1;
  if (roll === 10) {
    app.classList.add("has-hidden");
    renderHidden(app);
    setChannel("game_boy");
  }
}
