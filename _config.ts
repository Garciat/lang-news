import lume from "https://deno.land/x/lume@v1.19.4/mod.ts";
import basePath from "https://deno.land/x/lume@v1.19.4/plugins/base_path.ts";
import vento from "https://deno.land/x/lume@v1.19.4/plugins/vento.ts";

const site = lume({
  src: "./src",
  dest: "./dist",
  location: new URL(`https://example.com${getBasePath()}`),
});

site.use(basePath());
site.use(vento());

export default site;

function getBasePath(): string {
  const repository = Deno.env.get("GITHUB_REPOSITORY");
  const owner = Deno.env.get("GITHUB_REPOSITORY_OWNER");

  if (!repository) {
    return "/";
  }

  const repositoryParts = repository.split("/", 2);
  const repo = repositoryParts[1];

  if (!repo) {
    return "/";
  }

  if (owner && repo.toLowerCase() === `${owner.toLowerCase()}.github.io`) {
    return "/";
  }

  return `/${repo}/`;
}
