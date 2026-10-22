// Runs before the page paints, as a packaged external script allowed by MV3 CSP.
try {
  const preference = localStorage.getItem("clientbrief-theme");
  document.documentElement.dataset.theme =
    preference === "light" || preference === "dark"
      ? preference
      : matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
} catch {
  /* CSS follows the system preference if storage is unavailable. */
}
