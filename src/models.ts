import { Item } from "@spt-aki/models/eft/common/tables/IItem";
import { ITemplateItem } from "@spt-aki/models/eft/common/tables/ITemplateItem";
import { MinMax } from "@spt-aki/models/common/MinMax";

export type PresetConfig = Record<string, MinMax>;
export type PresetGear = Record<string, Gear>;
export type PresetWeapon = Record<string, WeaponPreset[]>;
export type PresetAmmo = Record<string, Ammo>;
export type PresetModules = Record<string, Modules>;
export type Ammo = Record<string, string[]>;
export type Modules = Record<string, string[]>;

export class PresetData {
    public config: PresetConfig;
    public gear: PresetGear;
    public weapon: PresetWeapon;
    public ammo: PresetAmmo;
    public modules: PresetModules;
}

export class WeaponPreset {
    id: string;
    name: string;
    root: string;
    items: Item[];
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
}
