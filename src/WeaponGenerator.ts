import { inject, injectAll, injectable } from "tsyringe";

import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { Item } from "@spt-aki/models/eft/common/tables/IItem";
import { ITemplateItem } from "@spt-aki/models/eft/common/tables/ITemplateItem";
import { HashUtil } from "@spt-aki/utils/HashUtil";
import { ItemHelper } from "@spt-aki/helpers/ItemHelper";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { RandomUtil } from "@spt-aki/utils/RandomUtil";
import { BotWeaponGeneratorHelper } from "@spt-aki/helpers/BotWeaponGeneratorHelper";
import { IInventoryMagGen } from "@spt-aki/generators/weapongen/IInventoryMagGen";

import { GeneratedWeapon } from "./models";
import { PresetData } from "./PresetData";

const MUZZLE_PAIRS = {
    //7.62x51 Tier 4
    "6130c43c67085e45ef1405a1": "5dfa3d2b0dee1b22f862eade",
    "618178aa1cb55961fa0fdc80": "5a34fe59c4a282000b1521a2",
    "5a34fd2bc4a282329a73b4c5": "5a34fe59c4a282000b1521a2",

    //7.62x51 Tier 3
    "5fbc22ccf24b94483f726483": "5fbe760793164a5b6278efc8",
    "612e0d3767085e45ef14057f": "63877c99e785640d436458ea",
    "5d1f819086f7744b355c219b": "5cff9e84d7ad1a049e54ed55",
    "5d443f8fa4b93678dd4a01aa": "5d44064fa4b9361e4f6eb8b5",

    //5.56x45 Tier 4
    "609269c3b0e443224b421cc1": "60926df0132d4d12c81fd9df",
    "6386120cd6baa055ad1e201c": "638612b607dfed1ccb7206ba",
    "626667e87379c44d557b7550": "626673016f1edc06f30cf6d5",

    //5.56x45 Tier 3
    "612e0cfc8004cc50514c2d9e": "63877c99e785640d436458ea",
    "5c7fb51d2e2216001219ce11": "5ea17bbc09aa976f2e7a51cd",
    "5d440625a4b9361eec4ae6c5": "5d44064fa4b9361e4f6eb8b5",
};

@injectable()
export class WeaponGenerator {
    private readonly magazineSlotId = "mod_magazine";
    private readonly chamberSlotId = "patron_in_weapon";
    private readonly equipmentSlot = "FirstPrimaryWeapon";

    private readonly MK47 = "606587252535c57a13424cfd";
    private readonly X_47_DRUM = "5cfe8010d7ad1a59283b14c6";

    constructor(
        @inject("WinstonLogger") protected logger: ILogger,
        @inject("HashUtil") protected hashUtil: HashUtil,
        @inject("RandomUtil") protected randomUtil: RandomUtil,
        @inject("DatabaseServer") protected databaseServer: DatabaseServer,
        @inject("ItemHelper") protected itemHelper: ItemHelper,
        @inject("BotWeaponGeneratorHelper")
        protected botWeaponGeneratorHelper: BotWeaponGeneratorHelper,
        @injectAll("InventoryMagGen")
        protected inventoryMagGenComponents: IInventoryMagGen[],
        @inject("AndernPresetData") protected presetData: PresetData
    ) {}

    templatesTable(): Record<string, ITemplateItem> {
        return this.databaseServer.getTables().templates.items;
    }

    getTemplateIdFromWeaponItems(weaponWithMods: Item[]): string {
        return weaponWithMods[0]._tpl;
    }

    getCaliberByTemplateId(tpl: string): string {
        return this.templatesTable()[tpl]._props.ammoCaliber;
    }

    getWeaponMagazine(weaponWithMods: Item[]): Item {
        return weaponWithMods.find((item) => item.slotId === "mod_magazine");
    }

    addCartridgeToChamber(weaponWithMods: Item[], ammoId: string): undefined {
        const slotName = "patron_in_weapon";

        const existingItemWithSlot = weaponWithMods.find(
            (item) => item.slotId === this.chamberSlotId
        );

        if (!existingItemWithSlot) {
            weaponWithMods.push({
                _id: this.hashUtil.generate(),
                _tpl: ammoId,
                parentId: weaponWithMods[0]._id,
                slotId: slotName,
                upd: { StackObjectsCount: 1 },
            });
        } else {
            existingItemWithSlot.upd = {
                StackObjectsCount: 1,
            };
            existingItemWithSlot._tpl = ammoId;
        }
    }

    fillMagazine(weaponWithMods: Item[], ammoTpl: string): string {
        for (const magazine of weaponWithMods.filter(
            (x) => x.slotId === this.magazineSlotId
        )) {
            const magazineTemplate = this.getTemplateById(magazine._tpl);
            const magazineWithCartridges = [magazine];

            this.itemHelper.fillMagazineWithCartridge(
                magazineWithCartridges,
                magazineTemplate,
                ammoTpl,
                1
            );
            weaponWithMods.splice(
                weaponWithMods.indexOf(magazine),
                1,
                ...magazineWithCartridges
            );
            return magazine._tpl;
        }
    }

    getTemplateById(tpl: string): ITemplateItem {
        return this.templatesTable()[tpl];
    }

    updateWeaponInfo(
        weaponWithMods: Item[],
        weaponParentId: string,
        isNight: boolean
    ): undefined {
        weaponWithMods[0].slotId = this.equipmentSlot;
        weaponWithMods[0].parentId = weaponParentId;
        this.replaceId(weaponWithMods, 0);
        if (isNight) this.replaceTacticalDevice(weaponWithMods);
        this.setTacticalDeviceMode(weaponWithMods);
    }

    replaceId(weaponWithMods: Item[], i: number): undefined {
        const oldId = weaponWithMods[i]._id;
        const newId = this.hashUtil.generate();
        weaponWithMods[i]._id = newId;
        for (const item of weaponWithMods) {
            if (item.parentId && item.parentId === oldId) {
                item.parentId = newId;
            }
        }

        i++;
        if (i < weaponWithMods.length) {
            this.replaceId(weaponWithMods, i);
        }
    }

    replaceTacticalDevice(weaponWithMods: Item[]): undefined {
        for (const item of weaponWithMods) {
            if (item.slotId.startsWith("mod_tactical")) {
                item._tpl = "5a5f1ce64f39f90b401987bc";
            }
        }
    }

    setTacticalDeviceMode(weaponWithMods: Item[]): undefined {
        for (const item of weaponWithMods) {
            if (item.slotId.startsWith("mod_tactical")) {
                if (item.upd?.Light) {
                    item.upd.Light.IsActive = false;
                    item.upd.Light.SelectedMode = 1;
                }
            }
        }
    }

    alternateModules(
        botLevel: number,
        weapon: Item[],
        weaponTpl: string
    ): undefined {
        weapon.forEach((item) => {
            const alternativeTpl = this.presetData.getAlternativeModule(
                botLevel,
                item._tpl
            );
            if (alternativeTpl != item._tpl) {
                if (
                    weaponTpl !== this.MK47 &&
                    alternativeTpl !== this.X_47_DRUM
                ) {
                    item._tpl = alternativeTpl;

                    if (item.slotId === "mod_muzzle") {
                        this.alternateSuppressor(weapon, item);
                    }
                }
            }
        });
    }

    alternateSuppressor(weapon: Item[], muzzleItem: Item): undefined {
        let isSuppressorReplaced = false;
        let indexToRemove: number;

        for (let i = 0; i < weapon.length; i++) {
            const item = weapon[i];
            if (item.parentId === muzzleItem._id) {
                if (!isSuppressorReplaced) {
                    item.slotId = "mod_muzzle";
                    item._tpl = MUZZLE_PAIRS[muzzleItem._tpl];
                    isSuppressorReplaced = true;
                } else {
                    indexToRemove = i;
                }
            }
        }

        if (isSuppressorReplaced && indexToRemove) {
            weapon.splice(indexToRemove, 1);
        }
    }

    public generateWeapon(
        botLevel: number,
        weaponParentId: string,
        isNight: boolean
    ): GeneratedWeapon {
        const weaponWithMods = this.presetData.getRandomWeapon(botLevel);
        this.updateWeaponInfo(weaponWithMods, weaponParentId, isNight);
        const weaponTpl = this.getTemplateIdFromWeaponItems(weaponWithMods);
        this.alternateModules(botLevel, weaponWithMods, weaponTpl);
        const weaponTemplate = this.getTemplateById(weaponTpl);
        const caliber = this.getCaliberByTemplateId(weaponTpl);
        const ammoTpl = this.presetData.getRandomAmmoByCaliber(
            botLevel,
            caliber
        );
        this.addCartridgeToChamber(weaponWithMods, ammoTpl);
        const magazineTpl = this.fillMagazine(weaponWithMods, ammoTpl);

        return {
            weaponWithMods: weaponWithMods,
            weaponTemplate: weaponTemplate,
            ammoTpl: ammoTpl,
            magazineTpl: magazineTpl,
        };
    }
}
