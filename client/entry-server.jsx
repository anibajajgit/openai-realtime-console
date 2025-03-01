import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import LandingPage from "./pages/LandingPage";

export function render(url) {
  const html = renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <LandingPage />
      </StaticRouter>
    </StrictMode>,
  );
  return { html };
}
