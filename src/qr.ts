// QR-code easter egg: clicking a device wordmark (SANY / Ninfendo) cycles a
// QR code shown above the device — dark QR → light QR → hidden — and repeats.

import { el } from "./dom";

const QR_DARK = "/my-links-qr-code-dark.png";
const QR_LIGHT = "/my-links-qr-code.png";

const slots: { slot: HTMLDivElement; image: HTMLImageElement }[] = [];
let step = 0; // 0 = hidden, 1 = dark, 2 = light

/** A per-page mount point for the QR code, placed above the device. */
export function createQrSlot(): HTMLDivElement {
  const slot = el("div", "qr-slot");
  slot.hidden = true;
  const image = el("img", "", { alt: "QR code for this page" });
  slot.append(image);
  slots.push({ slot, image });
  return slot;
}

/** Make a wordmark cycle the QR display when clicked. */
export function wireQrTrigger(trigger: HTMLElement): void {
  trigger.classList.add("qr-trigger");
  trigger.addEventListener("click", () => {
    step = (step + 1) % 3;
    for (const { slot, image } of slots) {
      slot.hidden = step === 0;
      if (step !== 0) image.src = step === 1 ? QR_DARK : QR_LIGHT;
    }
  });
}
