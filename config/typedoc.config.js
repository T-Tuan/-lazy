import { globSync } from "glob";
import { fileURLToPath } from "url";

/** @type {import('typedoc').TypeDocOptions} */
export default {
  name: "UtilsLib",
  out: "../docs/typedoc",
  readme: fileURLToPath(new URL("../README.md", import.meta.url)),
  entryPoints: globSync("packages/*").map((item) => "../" + item),
  entryPointStrategy: "packages",
  hideGenerator: true,
  includeVersion: false,
  navigationLinks: {
    GitHub: "https://github.com/T-Tuan/utilslib",
    新文档: "/vitepress",
  },
};
