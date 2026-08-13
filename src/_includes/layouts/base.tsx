export default (
  page: Lume.Data,
  h: Lume.Helpers,
) => {
  const { children } = page;

  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />

        <meta name="viewport" content="width=device-width,initial-scale=1" />

        <link rel="stylesheet" href={h.url("/assets/main.css")} />

        <title>{page.title}</title>
      </head>

      <body>
        {children}
      </body>
    </html>
  );
};
