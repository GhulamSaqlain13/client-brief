import type { AppProps } from "next/app";
import "@fontsource-variable/inter";
import "../styles/globals.css";
import "../styles/theme.css";
import "../styles/typography.css";
import "../styles/workspace.css";
import "../styles/redesign.css";
export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
