import lume from "https://deno.land/x/lume@v1.19.4/mod.ts";
import vento from "https://deno.land/x/lume@v1.19.4/plugins/vento.ts";
import date from "https://deno.land/x/lume@v1.19.4/plugins/date.ts";
import metas from "https://deno.land/x/lume@v1.19.4/plugins/metas.ts";

const site = lume({
  src: "./src",
  dest: "./dist",
});

site.use(vento());
site.use(date());
site.use(metas());

export default site;
