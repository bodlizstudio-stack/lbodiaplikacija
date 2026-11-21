import { ScrollViewStyleReset } from 'expo-router/html';
import React from 'react';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html className="dark" lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no" />
        <title>GET UP // DISCIPLINE_OS 2088 — LUKA BODLAJ</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link crossOrigin="" href="https://fonts.gstatic.com" rel="preconnect" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
        <script
          id="tailwind-config"
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                darkMode: "class",
                theme: {
                  extend: {
                    "colors": {
                      "primary-fixed": "#ffdbca",
                      "on-secondary-fixed": "#2a1800",
                      "primary-fixed-dim": "#ffb690",
                      "inverse-primary": "#9d4300",
                      "on-primary-fixed-variant": "#783200",
                      "on-tertiary": "#2e3035",
                      "on-secondary": "#462a00",
                      "on-surface-variant": "#e0c0b1",
                      "primary": "#ffb690",
                      "tertiary": "#c5c6cd",
                      "surface-variant": "#343537",
                      "surface-container-lowest": "#08090b",
                      "secondary-fixed-dim": "#ffb95a",
                      "on-secondary-container": "#3d2400",
                      "tertiary-fixed": "#e2e2e9",
                      "secondary": "#ffb95a",
                      "background": "#0a0b0e",
                      "on-primary-fixed": "#341100",
                      "surface-tint": "#ffb690",
                      "surface-dim": "#0a0b0e",
                      "secondary-container": "#c68315",
                      "on-primary": "#552100",
                      "on-tertiary-container": "#303237",
                      "on-error": "#690005",
                      "inverse-on-surface": "#303033",
                      "on-tertiary-fixed-variant": "#45474c",
                      "primary-container": "#f97316",
                      "surface-container-high": "#1b1d22",
                      "surface-container-highest": "#262930",
                      "outline-variant": "#584237",
                      "on-tertiary-fixed": "#191c20",
                      "tertiary-fixed-dim": "#c5c6cd",
                      "surface": "#0e1014",
                      "on-surface": "#e3e2e5",
                      "secondary-fixed": "#ffddb6",
                      "on-background": "#e3e2e5",
                      "on-secondary-fixed-variant": "#643f00",
                      "on-error-container": "#ffdad6",
                      "tertiary-container": "#999aa0",
                      "error": "#ffb4ab",
                      "outline": "#a78b7d",
                      "inverse-surface": "#e3e2e5",
                      "surface-container": "#13151a",
                      "surface-bright": "#2c2f36",
                      "error-container": "#93000a",
                      "surface-container-low": "#0f1115",
                      "on-primary-container": "#582200"
                    },
                    "borderRadius": {
                      "DEFAULT": "0.25rem",
                      "lg": "0.5rem",
                      "xl": "0.75rem",
                      "full": "9999px"
                    },
                    "spacing": {
                      "space-xs": "0.25rem",
                      "space-lg": "1.5rem",
                      "space-xl": "2.5rem",
                      "margin-tablet": "2rem",
                      "gutter-desktop": "1.75rem",
                      "gutter": "1.25rem",
                      "space-md": "1rem",
                      "margin": "1rem",
                      "margin-desktop": "3rem",
                      "space-sm": "0.5rem"
                    },
                    "fontFamily": {
                      "mono": ["JetBrains Mono", "monospace"],
                      "headline-lg": ["Space Grotesk", "sans-serif"],
                      "headline-sm": ["Space Grotesk", "sans-serif"],
                      "metric-xl": ["Space Grotesk", "sans-serif"],
                      "headline-lg-mobile": ["Space Grotesk", "sans-serif"],
                      "body-sm": ["Inter", "sans-serif"],
                      "display-hero-mobile": ["Space Grotesk", "sans-serif"],
                      "label-sm": ["JetBrains Mono", "Space Grotesk", "monospace"],
                      "metric-xl-mobile": ["Space Grotesk", "sans-serif"],
                      "body-lg": ["Inter", "sans-serif"],
                      "label-lg": ["Space Grotesk", "sans-serif"],
                      "headline-md": ["Space Grotesk", "sans-serif"],
                      "display-hero": ["Space Grotesk", "sans-serif"],
                      "label-md": ["JetBrains Mono", "Space Grotesk", "monospace"],
                      "body-md": ["Inter", "sans-serif"]
                    }
                  }
                }
              };
            `,
          }}
        />
        <ScrollViewStyleReset />
      </head>
      <body className="bg-surface-container-lowest text-on-surface carbon-mesh min-h-screen antialiased selection:bg-primary-container selection:text-on-primary-container">
        {children}
      </body>
    </html>
  );
}
