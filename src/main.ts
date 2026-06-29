import "./style.css";
import { links, type Link } from "./links";

const app = document.querySelector<HTMLDivElement>("#app");

/** Tiny helper: make an element with a class and optional children/props. */
function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = "",
  props: Partial<HTMLElementTagNameMap[K]> = {},
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  Object.assign(node, props);
  return node;
}

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
  start.textContent = "▶ PRESS START"; // ▶ PRESS START
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
function wirePower(tv: HTMLDivElement, button: HTMLButtonElement): void {
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

  button.addEventListener("click", () => {
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
  });

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

function createChin(tv: HTMLDivElement): HTMLDivElement {
  const chin = el("div", "chin");

  const brand = el("span", "brand");
  brand.textContent = "SANY - Trinitran";

  const power = el("button", "power", { type: "button" });
  power.setAttribute("aria-label", "Power");

  const led = el("span", "power__led");
  led.textContent = "⏻"; // ⏻
  led.setAttribute("aria-hidden", "true");

  const label = el("span", "power__label");
  label.textContent = "Power";

  power.append(led, label);
  chin.append(brand, power);

  wirePower(tv, power);
  return chin;
}

function render(root: HTMLDivElement): void {
  root.replaceChildren();

  const page = el("div", "page");
  const tv = el("div", "tv");
  tv.append(createScreen(), createChin(tv));
  page.append(tv);
  root.append(page);
}

if (app) {
  render(app);
}
