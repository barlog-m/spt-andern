import {Item} from "@spt/models/eft/common/tables/IItem";
import {ITemplateItem} from "@spt/models/eft/common/tables/ITemplateItem";
import {MinMax} from "@spt/models/common/MinMax";

export type PresetConfig = Record<string, Config>;
export type PresetGear = Record<string, Gear>;
export type PresetWeapon = Record<string, WeaponPreset[]>;
export type PresetAmmo = Record<string, Ammo>;
export type PresetModules = Record<string, Modules>;
export type Ammo = Record<string, string[]>;
export type Modules = Record<string, string[]>;
export type Mods = Record<string, string[]>;

export class PresetData {
    public config: PresetConfig;
    public gear: PresetGear;
    public weapon: PresetWeapon;
    public ammo: PresetAmmo;
    public modules: PresetModules;
}

export class Config {
    minLevel: number;
    maxLevel: number;
    kittedHelmetPercent: number;
    nightVisionPercent: number;

    public getMinMax(): MinMax {
        return {
            min: this.minLevel,
            max: this.maxLevel,
        }
    }
}

export class WeaponPreset {
    Id: string;
    Name: string;
    Root: string;
    Items: Item[];
}

export class GeneratedWeapon {
    weaponWithMods: Item[];
    weaponTemplate: ITemplateItem;
    ammoTpl: string;
    magazineTpl: string;
}

export class GearItem {
    weight: number;
    id: string;
    name: string;
}

export class Gear {
    headsets: GearItem[];
    helmets: GearItem[];
    armoredRigs: GearItem[];
    armor: GearItem[];
    rigs: GearItem[];
    backpacks: GearItem[];
    face: GearItem[];
    eyewear: GearItem[];
    sheath: GearItem[];
    chadMasks: GearItem[];
    chadHelmets: GearItem[];
    chadArmor: GearItem[];
}

export interface mapPmcBackpackLootData {
    min_level: number;
    max_level: number;
    min_items: number;
    max_items: number;
    weights: [
        number,
        number?,
        number?,
        number?
    ];
    keycard_chance: number;
    rare_key_chance: number;
    include_normal_keys: boolean;
}

export type mapPmcBackpackLootDataGroup = mapPmcBackpackLootData[];

export interface mapPmcBackpackLootTable {
    extremely_rare: string[],
    rare: string[],
    valuable: string[],
    common: string[],
}

export enum LootTableIndexs {
    EXTREMELY_RARE = 0,
    RARE = 1,
    VALUABLE = 2,
    COMMON = 3
}
