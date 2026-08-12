import lume from "lume/mod.ts";
import basePath from "lume/plugins/base_path.ts";
import jsx from "lume/plugins/jsx.ts";
import slugifyUrls from "lume/plugins/slugify_urls.ts";

const site = lume({
  src: "./src",
  dest: "./dist",
}).add([
  ".css",
  ".jpg",
  ".png",
  ".ico",
  ".html",
]).use(basePath())
  .use(jsx())
  .use(slugifyUrls());

export default site;
