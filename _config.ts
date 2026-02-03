import lume from "https://deno.land/x/lume@v1.19.4/mod.ts";
import vento from "https://deno.land/x/lume@v1.19.4/plugins/vento.ts";

const site = lume({
  src: "./src",
  dest: "./dist",
});

site.use(vento());

export default site;
