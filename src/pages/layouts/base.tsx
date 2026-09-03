import { helpers } from "deno-static/mod.ts";

type BaseLayoutProps = {
  title: string;
  url: `/${string}`;
  children: React.ReactNode;
};

export const BaseLayout: React.FC<BaseLayoutProps> = (
  { title, url, children },
) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />

        <meta name="viewport" content="width=device-width,initial-scale=1" />

        <link rel="canonical" href={helpers.url(url, true)} />

        <link rel="stylesheet" href={helpers.url("/assets/main.css")} />

        <title>{title}</title>

        <script
          src="https://cdn.jsdelivr.net/npm/@github/relative-time-element@5.3.1/dist/bundle.min.js"
          type="module"
        />
      </head>

      <body>
        {children}
      </body>
    </html>
  );
};
