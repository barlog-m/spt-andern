import { inject, injectable } from "tsyringe";

import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { Item } from "@spt-aki/models/eft/common/tables/IItem";
import { RandomUtil } from "@spt-aki/utils/RandomUtil";
import { HashUtil } from "@spt-aki/utils/HashUtil";
import { Inventory as PmcInventory } from "@spt-aki/models/eft/common/tables/IBotBase";
import { MinMax } from "@spt-aki/models/common/MinMax";

import { NightHeadwear } from "./NightHeadwear";
import { WeaponPreset, Gear } from "./models";
import * as fs from "fs";

import * as config from "../config/config.json";

@injectable()
export class PresetData {
    private presetConfig: Record<string, MinMax> = {};
    private gear: Record<string, Gear> = {};
    private weapon: Record<string, WeaponPreset[]> = {};
    private ammo: Record<string, Record<string, string[]>> = {};
    private modules: Record<string, Record<string, string[]>> = {};

    constructor(
        @inject("WinstonLogger") protected logger: ILogger,
        @inject("HashUtil") protected hashUtil: HashUtil,
        @inject("RandomUtil") protected randomUtil: RandomUtil,
        @inject("AndernNightHeadwear")
        protected nightHeadwear: NightHeadwear,
        @inject("AndernModPath") protected modPath: string
    ) {
        this.load();
        this.logger.info(`[Andern] preset '${config.preset}' enabled`);
    }

    public generateNightHeadwear(botInventory: PmcInventory): undefined {
        this.nightHeadwear.tierOneHeadwearWithNvg(botInventory);
    }

    public getRandomAmmoByCaliber(
        botLevel: number,
        caliber: string
    ): string | undefined {
        const tier = this.tierByLevel(botLevel);

        const ammo = this.ammo[tier][caliber];

        if (ammo === undefined) {
            this.logger.error(
                `[Andern] no ammo record for tier '${tier}' with caliber '${caliber}'`
            );
            return undefined;
        }

        if (ammo.length == 1) {
            return ammo[0];
        } else {
            const keys = Object.keys(ammo);
            const randomKey = this.randomUtil.getArrayValue(keys);
            return ammo[randomKey];
        }
    }

    public getRandomWeapon(botLevel: number): Item[] {
        const tier = this.tierByLevel(botLevel);

        const presets = this.weapon[tier];
        const keys = Object.keys(presets);
        const randomKey = this.randomUtil.getArrayValue(keys);
        const preset = presets[randomKey];
        return JSON.parse(JSON.stringify(preset.items)) as Item[];
    }

    public getGear(level: number): Gear {
        const tier = this.tierByLevel(level);
        return this.gear[tier];
    }

    public getAlternativeModule(botLevel: number, moduleTpl: string): string {
        const tier = this.tierByLevel(botLevel);
        const alternativesData = this.modules[tier];
        if (!alternativesData) {
            return moduleTpl;
        }

        if (moduleTpl in alternativesData) {
            const alternatives = alternativesData[moduleTpl];

            if (this.randomUtil.getBool()) {
                const keys = Object.keys(alternatives);
                const randomKey = this.randomUtil.getArrayValue(keys);
                return alternatives[randomKey];
            }
        }

        return moduleTpl;
    }

    load(): undefined {
        this.loadPresetConfig();
        this.loadData();
    }

    loadPresetConfig(): undefined {
        const presetConfigFileName = `${this.modPath}presets/${config.preset}/preset.json`;
        try {
            const jsonData = fs.readFileSync(presetConfigFileName, "utf-8");
            Object.assign(this.presetConfig, JSON.parse(jsonData));
        } catch (err) {
            this.logger.error(
                `[Andern] error read file '${presetConfigFileName}'`
            );
            this.logger.error(err.message);
        }
    }

    loadData(): undefined {
        const presetDirName = `${this.modPath}presets/${config.preset}`;

        fs.readdir(presetDirName, { withFileTypes: true }, (err, files) => {
            if (err) {
                this.logger.error("Error reading directory: " + err.message);
                return;
            }
            files.forEach((dir) => {
                if (!dir.isDirectory()) return;

                const tierDirName = `${presetDirName}/${dir.name}`;

                this.loadTierGear(dir.name, tierDirName);
                this.loadTierAmmo(dir.name, tierDirName);
                this.loadTierModules(dir.name, tierDirName);
                this.loadTierWeapon(dir.name, tierDirName);
            });
        });
    }

    loadTierGear(tier: string, tierDir: string): undefined {
        const gearFileName = `${tierDir}/gear.json`;
        try {
            const jsonData = fs.readFileSync(gearFileName, "utf-8");
            this.gear[tier] = new Gear();
            Object.assign(this.gear[tier], JSON.parse(jsonData));
        } catch (err) {
            this.logger.error(`[Andern] error read file '${gearFileName}'`);
            this.logger.error(err.message);
        }
    }

    loadTierAmmo(tier: string, tierDir: string): undefined {
        const ammoFileName = `${tierDir}/ammo.json`;
        try {
            const jsonData = fs.readFileSync(ammoFileName, "utf-8");
            this.ammo[tier] = {};
            Object.assign(this.ammo[tier], JSON.parse(jsonData));
        } catch (err) {
            this.logger.error(`[Andern] error read file '${ammoFileName}'`);
            this.logger.error(err.message);
        }
    }

    loadTierModules(tier: string, tierDir: string): undefined {
        const modulesFileName = `${tierDir}/modules.json`;
        this.modules[tier] = {};
        if (fs.existsSync(modulesFileName)) {
            try {
                const jsonData = fs.readFileSync(modulesFileName, "utf-8");
                Object.assign(this.modules[tier], JSON.parse(jsonData));
            } catch (err) {
                this.logger.error(
                    `[Andern] error read file '${modulesFileName}'`
                );
                this.logger.error(err.message);
            }
        }
    }

    loadTierWeapon(tier: string, tierDir: string): undefined {
        fs.readdir(tierDir, (err, files) => {
            if (err) {
                this.logger.error("Error reading directory: " + err.code);
                return;
            }
            this.weapon[tier] = [];

            files
                .filter((f) => f.endsWith(".json"))
                .forEach((f) => {
                    if (
                        f === "ammo.json" ||
                        f === "gear.json" ||
                        f === "modules.json"
                    )
                        return;

                    const fullWeaponPresetName = `${tierDir}/${f}`;

                    try {
                        const jsonData = fs.readFileSync(
                            fullWeaponPresetName,
                            "utf-8"
                        );
                        const preset = new WeaponPreset();
                        Object.assign(preset, JSON.parse(jsonData));
                        if (this.isPresetValid(preset, fullWeaponPresetName)) {
                            this.weapon[tier][preset.id] = preset;
                        }
                    } catch (err) {
                        this.logger.error(
                            `[Andern] error read file '${fullWeaponPresetName}'`
                        );
                        this.logger.error(err.message);
                    }
                });
        });
    }

    isPresetValid(weaponPreset: WeaponPreset, fileName: string): boolean {
        let hasMagazine = false;
        let hasTacticalDevice = false;

        for (const i of weaponPreset.items) {
            if (!i.slotId) {
                continue;
            }
            if (i.slotId === "cartridges") {
                this.logger.error(
                    `[Andern] preset's magazine is not empty '${fileName}'`
                );
                return false;
            }
            if (i.slotId === "mod_magazine") {
                hasMagazine = true;
            }
            if (i.slotId.startsWith("mod_tactical")) {
                hasTacticalDevice = true;
            }
        }

        if (!hasMagazine) {
            this.logger.warning(
                `[Andern] preset doesn't have magazine '${fileName}'`
            );
            return true;
        }

        if (!hasTacticalDevice) {
            this.logger.warning(
                `[Andern] preset doesn't have tactical device '${fileName}'`
            );
            return true;
        }

        return true;
    }

    tierByLevel(level: number): string {
        for (const tier in this.presetConfig) {
            if (
                level >= this.presetConfig[tier].min &&
                level < this.presetConfig[tier].max
            ) {
                return tier;
            }
        }
        return "one";
    }
}
