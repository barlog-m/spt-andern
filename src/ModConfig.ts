import * as packageJson from "../package.json";

export class ModConfig {
    static readonly modName = packageJson.name;
    static readonly authorName = packageJson.author;
    static readonly traderName = "Doe";
    static readonly traderDescription = "Boutique";
}
