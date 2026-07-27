// The Ninfendo "Game Doy" — a Game Boy-style handheld that frames the same
// link menu on a 4-shade green dot-matrix screen. Recreated from the design
// handoff (design_handoff_retro_crt_mobile/README.md, concept 1B).

import { setChannel } from "./channel";
import { el } from "./dom";
import { hiddenLink, links, type Link } from "./links";
import { wireQrTrigger } from "./qr";

/**
 * Power state machine: off → booting → revealing → on, and on → poweringOff
 * → off. Controls are locked except during `on`; timings come from the spec
 * (boot 4000/4650ms, shutdown 1200ms).
 */
type Phase = "off" | "booting" | "revealing" | "on" | "poweringOff";

function createRow(link: Link): HTMLAnchorElement {
  const row = el("a", "gb-link", {
    href: link.url,
    target: "_blank",
    rel: "noopener noreferrer",
  });

  const cursor = el("span", "gb-link__cursor");
  cursor.textContent = "▶";
  cursor.setAttribute("aria-hidden", "true");

  const label = el("span", "gb-link__label");
  label.textContent = link.name.toUpperCase();

  const leader = el("span", "gb-link__leader");
  leader.setAttribute("aria-hidden", "true");

  const tag = el("span", "gb-link__tag");
  tag.textContent = link.verb.toUpperCase();

  row.append(cursor, label, leader, tag);
  return row;
}

function createMenu(rows: HTMLAnchorElement[]): HTMLDivElement {
  const menu = el("div", "gb__menu");

  const name = el("div", "gb__name");
  name.textContent = "Seth Haskell";

  // Green-recolored version of the TV's baked stripe + controller artwork.
  const bars = el("img", "gb__bars", {
    src: "/textures/controller-color-bars-gb.png",
    alt: "",
  });
  bars.setAttribute("aria-hidden", "true");

  const select = el("div", "gb__select");
  select.textContent = "— Select —";

  const list = el("nav", "gb__list");
  list.append(...rows);

  const start = el("div", "gb__start");
  const startCursor = el("span", "gb__start-cursor");
  startCursor.textContent = "▶";
  startCursor.setAttribute("aria-hidden", "true");
  const startLabel = el("span");
  startLabel.textContent = "Press Start";
  start.append(startCursor, startLabel);

  menu.append(name, bars, select, list, start);
  return menu;
}

function createWordmark(): HTMLDivElement {
  const wordmark = el("div", "gb__wordmark");

  const nin = el("span", "gb__nin");
  nin.textContent = "Ninfendo";
  wireQrTrigger(nin);

  const doy = el("span", "gb__doy");
  doy.textContent = "GAME DOY";

  const tm = el("sup", "gb__tm");
  tm.textContent = "™";

  wordmark.append(nin, doy, tm);
  return wordmark;
}

export function createGameboy(): HTMLDivElement {
  const gb = el("div", "gameboy");
  gb.dataset.phase = "on"; // startPowered

  // --- Device chrome -------------------------------------------------------
  const powerSwitch = el("button", "gb__switch", { type: "button" });
  powerSwitch.setAttribute("aria-label", "Power");

  const bezel = el("div", "gb__bezel");
  const bezelTop = el("div", "gb__bezel-top");
  const led = el("span", "gb__led");
  led.setAttribute("aria-hidden", "true");
  const bezelText = el("span", "gb__bezel-text");
  bezelText.textContent = "Dot Matrix With Stereo Sound";
  bezelTop.append(led, bezelText);

  const screen = el("div", "gb__screen");
  const rows = links.map(createRow);
  const menu = createMenu(rows);

  // Power-animation layer; rebuilt on every toggle so animations restart.
  const fx = el("div", "gb__fx");
  fx.setAttribute("aria-hidden", "true");

  const scanlines = el("div", "gb__scanlines");
  scanlines.setAttribute("aria-hidden", "true");

  screen.append(menu, fx, scanlines);
  bezel.append(bezelTop, screen);

  // --- Controls --------------------------------------------------------------
  const dpad = el("div", "gb__dpad");
  const dpadUp = el("button", "gb__dpad-btn gb__dpad-btn--up", {
    type: "button",
  });
  dpadUp.setAttribute("aria-label", "Move cursor up");
  const dpadDown = el("button", "gb__dpad-btn gb__dpad-btn--down", {
    type: "button",
  });
  dpadDown.setAttribute("aria-label", "Move cursor down");
  const dpadDot = el("span", "gb__dpad-dot");
  dpadDot.setAttribute("aria-hidden", "true");
  dpad.append(dpadUp, dpadDown, dpadDot);

  const roundButton = (letter: string) => {
    const group = el("div", "gb__ab-group");
    const button = el("button", "gb__round", { type: "button" });
    button.setAttribute("aria-label", `${letter} — open selected link`);
    const label = el("span", "gb__round-label");
    label.textContent = letter;
    group.append(button, label);
    return { group, button };
  };
  const b = roundButton("B");
  const a = roundButton("A");
  const ab = el("div", "gb__ab");
  ab.append(b.group, a.group);

  const controls = el("div", "gb__controls");
  controls.append(dpad, ab);

  const pillButton = (name: string, action: string) => {
    const group = el("div", "gb__pill-group");
    const button = el("button", "gb__pill", { type: "button" });
    button.setAttribute("aria-label", `${name} — ${action}`);
    const label = el("span", "gb__pill-label");
    label.textContent = name;
    group.append(button, label);
    return { group, button };
  };
  const select = pillButton("Select", "move cursor down");
  const start = pillButton("Start", "open selected link");
  const pills = el("div", "gb__pills");
  pills.append(select.group, start.group);

  const speaker = el("div", "gb__speaker");
  speaker.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 4; i++) speaker.append(el("i"));

  gb.append(powerSwitch, bezel, createWordmark(), controls, pills, speaker);

  // --- State ---------------------------------------------------------------
  let phase: Phase = "on";
  let sel = 0;
  const timers: number[] = [];

  const clearTimers = () => {
    timers.forEach((t) => clearTimeout(t));
    timers.length = 0;
  };

  const setPhase = (next: Phase) => {
    phase = next;
    gb.dataset.phase = next;
    // Anything short of a dark screen counts as tuned to the handheld.
    setChannel(next === "off" || next === "poweringOff" ? "off" : "game_boy");
  };

  const setSel = (index: number, focus = true) => {
    sel = (index + rows.length) % rows.length;
    rows.forEach((row, i) => row.classList.toggle("is-sel", i === sel));
    if (focus) rows[sel].focus({ preventScroll: true });
  };

  const moveSel = (delta: number) => {
    if (phase === "on") setSel(sel + delta);
  };

  const activate = () => {
    if (phase === "on") rows[sel].click();
  };

  rows.forEach((row, i) => {
    row.addEventListener("mouseenter", () => setSel(i, false));
  });

  const powerOn = () => {
    setPhase("booting");
    const cover = el("div", "gb__cover gb__cover--boot");
    const fall = el("div", "gb__fall");
    fall.textContent = "Seth Haskell";
    cover.append(fall);
    fx.replaceChildren(cover);

    timers.push(window.setTimeout(() => setPhase("revealing"), 4000));
    timers.push(
      window.setTimeout(() => {
        setPhase("on");
        fx.replaceChildren();
        setSel(0);
      }, 4650),
    );
  };

  const powerOff = () => {
    setPhase("poweringOff");
    // Snap to the light phosphor field with a single dark line, then the
    // whole field fades to the darkest green. No collapse, no scaling.
    const cover = el("div", "gb__cover gb__cover--off");
    cover.append(el("div", "gb__offline"));
    fx.replaceChildren(cover);

    timers.push(window.setTimeout(() => setPhase("off"), 1200));
  };

  const togglePower = () => {
    if (phase !== "on" && phase !== "off") return; // locked mid-animation
    clearTimers();
    if (phase === "off") powerOn();
    else powerOff();
  };

  // Easter egg: PRESS START opens the unlisted "Hidden" link. Deliberately
  // no hover state — it should not look clickable.
  menu.querySelector(".gb__start")?.addEventListener("click", () => {
    if (phase === "on" && hiddenLink) {
      window.open(hiddenLink.url, "_blank", "noopener,noreferrer");
    }
  });

  powerSwitch.addEventListener("click", togglePower);
  dpadUp.addEventListener("click", () => moveSel(-1));
  dpadDown.addEventListener("click", () => moveSel(1));
  select.button.addEventListener("click", () => moveSel(1));
  [a.button, b.button, start.button].forEach((button) =>
    button.addEventListener("click", activate),
  );

  window.addEventListener("keydown", (event) => {
    // Only respond while the Game Doy is actually on screen (portrait roll).
    if (gb.offsetParent === null) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    if (event.key === "p" || event.key === "P") {
      togglePower();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveSel(-1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      moveSel(1);
    }
    // Enter activates natively — the selected row holds real focus.
  });

  window.addEventListener("pagehide", clearTimers);

  return gb;
}
