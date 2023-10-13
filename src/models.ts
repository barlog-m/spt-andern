import { Item } from "@spt-aki/models/eft/common/tables/IItem";
import { ITemplateItem } from "@spt-aki/models/eft/common/tables/ITemplateItem";

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
}
