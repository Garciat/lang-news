import lume from "https://deno.land/x/lume@v1.19.4/mod.ts";
import basePath from "https://deno.land/x/lume@v1.19.4/plugins/base_path.ts";
import vento from "https://deno.land/x/lume@v1.19.4/plugins/vento.ts";

const site = lume({
  src: "./src",
  dest: "./dist",
  location: new URL("https://example.com/"),
});

site.use(basePath());
site.use(vento());

export default site;
