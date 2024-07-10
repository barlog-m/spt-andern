import {inject, injectable} from "tsyringe";

import {ILogger} from "@spt/models/spt/utils/ILogger";
import {Item} from "@spt/models/eft/common/tables/IItem";
import {RandomUtil} from "@spt/utils/RandomUtil";
import {HashUtil} from "@spt/utils/HashUtil";
import {DatabaseServer} from "@spt/servers/DatabaseServer";
import {BaseClasses} from "@spt/models/enums/BaseClasses";
import {
    PresetData,
    Config,
    WeaponPreset,
    Gear,
    Ammo,
    Modules,
} from "./models";

import * as fs from "fs";
import JSON5 from "json5";

import * as config from "../config/config.json";

@injectable()
export class Data {
    private presets = config.presets;
    private data: Record<string, PresetData> = {};
    private armorPlatesData: Record<string, number>;

    constructor(
        @inject("WinstonLogger") protected logger: ILogger,
        @inject("HashUtil") protected hashUtil: HashUtil,
        @inject("RandomUtil") protected randomUtil: RandomUtil,
        @inject("DatabaseServer") protected databaseServer: DatabaseServer,
        @inject("AndernModPath") protected modPath: string
    ) {
        this.load();
    }

    public getRandomAmmoByCaliber(
        presetName: string,
        botLevel: number,
        caliber: string
    ): string | undefined {
        const tier = this.tierByLevel(presetName, botLevel);
        const ammo = this.data[presetName].ammo[tier][caliber];

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

    public getRandomWeapon(presetName: string, botLevel: number): Item[] {
        const tier = this.tierByLevel(presetName, botLevel);

        const presets = this.data[presetName].weapon[tier];
        const keys = Object.keys(presets);
        const randomKey = this.randomUtil.getArrayValue(keys);
        const preset: WeaponPreset = presets[randomKey];

        if (config.debug) {
            this.logger.info(
                `[Andern] for bot level ${botLevel} selected tier '${tier}' weapon '${preset.Name}'`
            );
        }

        return JSON.parse(JSON.stringify(preset.Items)) as Item[];
    }

    public getGear(presetName: string, level: number): Gear {
        const tier = this.tierByLevel(presetName, level);
        return this.data[presetName].gear[tier];
    }

    public getAlternativeModule(
        presetName: string,
        botLevel: number,
        moduleTpl: string
    ): string {
        const tier = this.tierByLevel(presetName, botLevel);
        const alternativesData = this.data[presetName].modules[tier];
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
    
    public getConfig(presetName: string, level: number): Config {
        const tier = this.tierByLevel(presetName, level);
        return this.data[presetName].config[tier];
    }

    getPresetsDir(): string {
        return `${this.modPath}presets`;
    }

    load(): undefined {
        for (const [presetName, presetWeight] of this.readAllPresetsList()) {
            const presetData = this.loadData(presetName);
            this.data[presetName] = presetData;
            this.logger.info(`[Andern] Loaded preset '${presetName}'`);
        }
    }

    readAllPresetsList(): [string, number][] {
        return Object.entries(this.presets).filter(([name, weight]) => {
            return weight > 0;
        });
    }

    loadData(presetName: string): PresetData {
        const presetDir = `${this.getPresetsDir()}/${presetName}`;
        const presetData: PresetData = {
            config: {},
            gear: {},
            weapon: {},
            ammo: {},
            modules: {}
        };

        try {
            const files = fs.readdirSync(presetDir, {withFileTypes: true});
            files.forEach((dir) => {
                if (dir.isDirectory()) {
                    const tierDirName = `${presetDir}/${dir.name}`;
                    const tierName = dir.name;

                    presetData.config[tierName] = this.loadTierConfig(tierDirName);
                    presetData.gear[tierName] = this.loadTierGear(tierDirName);
                    presetData.ammo[tierName] = this.loadTierAmmo(tierDirName);
                    presetData.modules[tierName] =
                        this.loadTierModules(tierDirName);
                    presetData.weapon[tierName] =
                        this.loadTierWeapon(tierDirName);
                }
            });
        } catch (err) {
            this.logger.error(
                `[Andern] Error reading directory: ${err.message}`
            );
        }

        return presetData;
    }

    loadTierGear(tierDir: string): Gear {
        const gearFileName = `${tierDir}/gear.json5`;
        const gear = new Gear();
        try {
            const jsonData = fs.readFileSync(gearFileName, "utf-8");
            Object.assign(gear, JSON5.parse(jsonData));
        } catch (err) {
            this.logger.error(`[Andern] error read file '${gearFileName}'`);
            this.logger.error(err.message);
        }
        return gear;
    }

    loadTierAmmo(tierDir: string): Ammo {
        const ammoFileName = `${tierDir}/ammo.json5`;
        const ammo: Ammo = {};
        try {
            const jsonData = fs.readFileSync(ammoFileName, "utf-8");
            Object.assign(ammo, JSON5.parse(jsonData));
        } catch (err) {
            this.logger.error(`[Andern] error read file '${ammoFileName}'`);
            this.logger.error(err.message);
        }
        return ammo;
    }

    loadTierModules(tierDir: string): Modules {
        const modulesFileName = `${tierDir}/modules.json5`;
        const modules: Modules = {};
        if (fs.existsSync(modulesFileName)) {
            try {
                const jsonData = fs.readFileSync(modulesFileName, "utf-8");
                Object.assign(modules, JSON5.parse(jsonData));
            } catch (err) {
                this.logger.error(
                    `[Andern] error read file '${modulesFileName}'`
                );
                this.logger.error(err.message);
            }
        }
        return modules;
    }

    loadTierWeapon(tierDir: string): WeaponPreset[] {
        const weapon: WeaponPreset[] = [];

        try {
            const files = fs.readdirSync(tierDir);

            files
                .filter((f) => f.endsWith(".json"))
                .forEach((f) => {
                    const fullWeaponPresetName = `${tierDir}/${f}`;

                    try {
                        const jsonData = fs.readFileSync(
                            fullWeaponPresetName,
                            "utf-8"
                        );
                        const preset = new WeaponPreset();
                        Object.assign(preset, JSON.parse(jsonData));
                        if (this.isPresetValid(preset, fullWeaponPresetName)) {
                            weapon.push(preset);
                        }
                    } catch (err) {
                        this.logger.error(
                            `[Andern] error read file '${fullWeaponPresetName}'`
                        );
                        this.logger.error(err.message);
                    }
                });
        } catch (err) {
            this.logger.error(
                `[Andern] Error reading directory: ${err.message}`
            );
        }

        return weapon;
    }

    loadTierConfig(tierDir: string): Config {
        const configFileName = `${tierDir}/config.json5`;
        const config = new Config();
        try {
            const jsonData = fs.readFileSync(configFileName, "utf-8");
            Object.assign(config, JSON5.parse(jsonData));
        } catch (err) {
            this.logger.error(`[Andern] error read file '${configFileName}'`);
            this.logger.error(err.message);
        }
        return config;
    }

    isPresetValid(weaponPreset: WeaponPreset, fileName: string): boolean {
        let hasMagazine = false;
        let hasTacticalDevice = false;

        for (const i of weaponPreset.Items) {
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

    tierByLevel(presetName: string, level: number): string {
        const presetConfig = this.data[presetName].config;
        let result = Object.keys(presetConfig)[0];

        for (const tier in presetConfig) {
            if (
                level >= presetConfig[tier].minLevel &&
                level <= presetConfig[tier].maxLevel
            ) {
                result = tier;
                break;
            }
        }
        return result;
    }

    getPresetName(): string {
        const totalWeight = Object.values(this.presets).reduce(
            (sum, item) => sum + item
        );

        let random = Math.random() * totalWeight;
        for (const [name, weight] of Object.entries(this.presets)) {
            random -= weight;
            if (random <= 0) {
                return name;
            }
        }
        return Object.keys(this.presets)[0];
    }

    public fillArmorPlatesData(): undefined {
        this.armorPlatesData = Object.entries(this.databaseServer.getTables().templates.items)
            .filter(([tpl, item]) => item._parent === BaseClasses.ARMOR_PLATE && item._id !== BaseClasses.BUILT_IN_INSERTS)
            .map(([tpl, item]) => [tpl, item._props.armorClass])
            .reduce((acc, [tpl, value]) => {
                acc[tpl] = value;
                return acc;
            }, {} as Record<string, any>);
    }

    public getPlateArmorClassByPlateTpl(tpl: string): number {
        return this.armorPlatesData[tpl]
    }
}
