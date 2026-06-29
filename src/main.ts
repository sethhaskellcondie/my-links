import "./style.css";
import { links, type Link } from "./links";

const app = document.querySelector<HTMLDivElement>("#app");

function createCard(link: Link): HTMLElement {
  const card = document.createElement("article");
  card.className = "card";

  const name = document.createElement("h2");
  name.className = "card__name";
  name.textContent = link.name;

  const action = document.createElement("a");
  action.className = "card__action";
  action.href = link.url;
  action.textContent = link.verb;
  action.rel = "noopener noreferrer";

  card.append(name, action);
  return card;
}

function render(app: HTMLDivElement): void {
  app.replaceChildren();

  const header = document.createElement("header");
  header.className = "page-header";

  const title = document.createElement("h1");
  title.textContent = "my links";

  const count = document.createElement("p");
  count.className = "count";
  count.textContent =
    links.length === 1 ? "1 link" : `${links.length} links`;

  header.append(title, count);
  app.append(header);

  if (links.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No links yet — add some in src/links.ts.";
    app.append(empty);
    return;
  }

  const grid = document.createElement("section");
  grid.className = "grid";
  // Expose the count so the layout can adapt via CSS.
  grid.dataset.count = String(links.length);
  grid.append(...links.map(createCard));
  app.append(grid);
}

if (app) {
  render(app);
}
