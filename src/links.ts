// All of the link data for the site lives here.
//
// Each link has three parts:
//   - name: what the link is called (e.g. "My Blog")
//   - verb: the action shown on the button (e.g. "Read", "Visit", "Explore")
//   - url:  where the link points
//
// Add, remove, or edit entries below — the UI updates itself to match how
// many links are present.

export type Link = {
  name: string;
  verb: string;
  url: string;
};

export const links: Link[] = [
  {
    name: "Example One",
    verb: "Visit",
    url: "https://example.com",
  },
  {
    name: "Example Two",
    verb: "Read",
    url: "https://example.org",
  },
  {
    name: "Example Three",
    verb: "Explore",
    url: "https://example.net",
  },
];
