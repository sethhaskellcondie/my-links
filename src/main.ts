import "./style.css";
import { initAudio, playTvOff } from "./audio";
import {
  formatChannel,
  getChannel,
  isNumberedChannel,
  onChannelChange,
  setChannel,
  stepChannel,
} from "./channel";
import { getChannelContent } from "./channels";
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

/**
 * The text-only picture: no title, no menu, just a message on the static
 * background. Channels 4 and 5 fill it from channels.ts.
 */
function createBroadcast(): {
  broadcast: HTMLDivElement;
  setText: (text: string) => void;
} {
  const broadcast = el("div", "broadcast");

  const text = el("p", "broadcast__text");
  broadcast.append(text);

  return {
    broadcast,
    setText: (value: string) => {
      text.textContent = value;
    },
  };
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
  const { broadcast, setText } = createBroadcast();
  tube.append(
    el("div", "scanlines"),
    el("div", "vignette"),
    createHero(),
    createMenu(),
    broadcast,
  );

  // What the tube shows follows the dial. "off" and the Game Doy leave the
  // last picture in place — neither retunes the CRT, and powering back on
  // returns to channel 3.
  onChannelChange((value) => {
    if (!isNumberedChannel(value)) return;

    const content = getChannelContent(value);
    if (content.type === "text") setText(content.text);
    tube.classList.toggle("is-text", content.type === "text");
  });

  // Power-state overlays (order = stacking within the screen).
  const shutterTop = el("div", "shutter shutter--top");
  const shutterBottom = el("div", "shutter shutter--bottom");
  const pinch = el("div", "pinch");
  const fade = el("div", "fade");
  const waves = el("div", "waves");
  const channel = el("div", "channel");
  // Powering down leaves the last number on the dark screen rather than
  // blanking it — the readout is hidden by then anyway.
  onChannelChange((value) => {
    if (isNumberedChannel(value)) channel.textContent = formatChannel(value);
  });

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

/**
 * A rocker pair — two round bezel buttons, triangle down then triangle up,
 * under a caption. VOL and CH are the same control with different wiring.
 * `name` reads out to assistive tech ("Channel up"); `caption` is the plate.
 */
function createPad(
  name: string,
  caption: string,
): {
  pad: HTMLDivElement;
  up: HTMLButtonElement;
  down: HTMLButtonElement;
} {
  const pad = el("div", "pad");

  const makeButton = (direction: "up" | "down") => {
    const button = el("button", "pad__btn", { type: "button" });
    button.setAttribute("aria-label", `${name} ${direction}`);
    const triangle = el("span", `pad__tri pad__tri--${direction}`);
    triangle.setAttribute("aria-hidden", "true");
    button.append(triangle);
    return button;
  };

  const down = makeButton("down");
  const up = makeButton("up");

  const buttons = el("div", "pad__buttons");
  buttons.append(down, up);

  const label = el("span", "pad__label");
  label.textContent = caption;
  label.setAttribute("aria-hidden", "true");

  pad.append(buttons, label);
  return { pad, up, down };
}

/**
 * Wire a rocker pair to a stepper and flash its on-screen readout. Both
 * readouts follow the same rules — instant on, 5s, instant cut — appearing on
 * power-up (via `is-tuned`) and again on every press of their own buttons.
 * `osdClass` is the class on `tv` that CSS keys the readout off.
 */
function wirePad(
  tv: HTMLDivElement,
  pads: { up: HTMLButtonElement; down: HTMLButtonElement }[],
  step: (delta: number) => void,
  osdClass: string,
): void {
  let osdTimer: number | undefined;

  const nudge = (delta: number) => {
    step(delta);
    clearTimeout(osdTimer);
    tv.classList.add(osdClass);
    osdTimer = window.setTimeout(() => tv.classList.remove(osdClass), 5000);
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
 * Landscape bezel: brand plate on the left, with the channel and volume
 * rockers and the power button grouped together on the right.
 */
function createChin(
  power: HTMLButtonElement,
  channelPad: HTMLDivElement,
  volumePad: HTMLDivElement,
): HTMLDivElement {
  const chin = el("div", "chin");

  const brand = el("span", "brand");
  brand.textContent = "SANY - Trinitran";
  wireQrTrigger(brand);

  const controls = el("div", "chin__controls");
  controls.append(channelPad, volumePad, power);

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
 * Portrait only: the working CH rocker where the decorative TUNE knob used to
 * be, the model name, and the VOL rocker that replaced its own knob earlier.
 * Only the model plate is hidden from assistive tech — the rest are real
 * controls.
 */
function createKnobs(
  channelPad: HTMLDivElement,
  volumePad: HTMLDivElement,
): HTMLDivElement {
  const knobs = el("div", "knobs");

  const model = el("span", "knobs__model");
  model.setAttribute("aria-hidden", "true");
  model.textContent = "FD - 42 Watchmaan";

  knobs.append(channelPad, model, volumePad);
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

/**
 * Roll-10 loads only: both devices exist in the DOM but CSS shows just one, so
 * the channel has to follow the rotation. Portrait hands over to the Game Doy;
 * landscape hands back to the TV on channel 3.
 */
function wireRotation(tv: HTMLDivElement): void {
  const portrait = window.matchMedia("(orientation: portrait)");

  const retune = () => {
    if (portrait.matches) {
      setChannel("game_boy");
      return;
    }
    // The set may have been powered down before the rotation. Channel 3 means
    // it's on, so clear the power-off classes too — otherwise the TV comes
    // back to a dark screen that is nonetheless hissing.
    tv.classList.remove("is-off", "is-booting", "is-tuned");
    setChannel(3);
  };

  portrait.addEventListener("change", retune);
  retune();
}

/** Builds the TV page and returns the shell, for callers that wire to it. */
function render(root: HTMLDivElement): HTMLDivElement {
  root.replaceChildren();

  const page = el("div", "page");
  const tv = el("div", "tv");

  // Two of each control — only one bezel is visible at a time (chin in
  // landscape, top bar and knob panel in portrait) but both sets drive the
  // same state.
  const chinPower = createPowerButton();
  const topPower = createPowerButton();
  const chinVolume = createPad("Volume", "Vol");
  const knobVolume = createPad("Volume", "Vol");
  const chinChannel = createPad("Channel", "Ch");
  const knobChannel = createPad("Channel", "Ch");

  tv.append(
    createAntenna(),
    createTopBar(topPower),
    createScreen(),
    createChin(chinPower, chinChannel.pad, chinVolume.pad),
    createKnobs(knobChannel.pad, knobVolume.pad),
  );
  wirePower(tv, [chinPower, topPower]);
  wirePad(tv, [chinVolume, knobVolume], stepVolume, "is-vol");
  wirePad(tv, [chinChannel, knobChannel], stepChannel, "is-ch");

  page.append(createQrSlot(), tv);
  root.append(page);
  return tv;
}

if (app) {
  const tv = render(app);
  initAudio();
  setChannel(3); // the CRT starts powered on and tuned in

  // Roll 1–10 on every visit; a 10 swaps the portrait view for the hidden
  // page. The wide view renders as normal regardless of the roll.
  const roll = Math.floor(Math.random() * 10) + 1;
  if (roll === 10) {
    app.classList.add("has-hidden");
    renderHidden(app);
    wireRotation(tv);
  }
}
