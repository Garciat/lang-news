export const layout = "layouts/base.tsx";

export default (
  page: Lume.Data,
  h: Lume.Helpers,
) => {
  const { children } = page;

  return (
    <article>
      <header>
        <h1>{page.title}</h1>
      </header>

      <section>
        {children}
      </section>
    </article>
  );
};