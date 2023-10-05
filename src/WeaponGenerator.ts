import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { Item } from "@spt-aki/models/eft/common/tables/IItem";
import { ITemplateItem } from "@spt-aki/models/eft/common/tables/ITemplateItem";
import { HashUtil } from "@spt-aki/utils/HashUtil";
import { ItemHelper } from "@spt-aki/helpers/ItemHelper";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { RandomUtil } from "@spt-aki/utils/RandomUtil";
import { BotWeaponGeneratorHelper } from "@spt-aki/helpers/BotWeaponGeneratorHelper";
import { EquipmentSlots } from "@spt-aki/models/enums/EquipmentSlots";
import { IInventoryMagGen } from "@spt-aki/generators/weapongen/IInventoryMagGen";
import { InventoryMagGen } from "@spt-aki/generators/weapongen/InventoryMagGen";
import { Inventory as PmcInventory } from "@spt-aki/models/eft/common/tables/IBotBase";
import { GenerationData } from "../models/eft/common/tables/IBotType";
import { MinMax } from "@spt-aki/models/common/MinMax";

import * as fs from "fs";

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

export abstract class WeaponGenerator {
    protected readonly magazineSlotId = "mod_magazine";
    protected readonly chamberSlotId = "patron_in_weapon";
    protected readonly equipmentSlot = "FirstPrimaryWeapon";

    protected weaponPresets: Record<string, WeaponPreset> = {};

    protected readonly secureContainerAmmoStackCount = 6;

    constructor(
        protected logger: ILogger,
        protected hashUtil: HashUtil,
        protected randomUtil: RandomUtil,
        protected databaseServer: DatabaseServer,
        protected itemHelper: ItemHelper,
        protected botWeaponGeneratorHelper: BotWeaponGeneratorHelper,
        protected inventoryMagGenComponents: IInventoryMagGen[],
        protected modResPath: string
    ) {
        this.loadPresets(modResPath);
    }

    protected itemsDb(): Record<string, ITemplateItem> {
        return this.databaseServer.getTables().templates?.items;
    }

    protected loadPresets(presetsDir: string): undefined {
        fs.readdir(presetsDir, (err, files) => {
            if (err) {
                console.error("Error reading directory:", err);
                return;
            }
            files.forEach((f) => {
                if (f === "ammo.json" || f === "gear.json") return;
                const fullFileName = `${presetsDir}/${f}`;
                const jsonData = fs.readFileSync(fullFileName, "utf-8");
                const preset = new WeaponPreset();
                Object.assign(preset, JSON.parse(jsonData));
                if (this.isPresetValid(preset, fullFileName)) {
                    this.weaponPresets[preset.id] = preset;
                }
            });
        });
    }

    protected getRandomWeapon(): Item[] {
        const keys = Object.keys(this.weaponPresets);
        const randomKey = this.randomUtil.getArrayValue(keys);
        const preset = this.weaponPresets[randomKey];
        return JSON.parse(JSON.stringify(preset.items)) as Item[];
    }

    protected getTemplateIdFromWeaponItems(weaponWithMods: Item[]): string {
        return weaponWithMods[0]._tpl;
    }

    protected getCaliberByTemplateId(tpl: string): string {
        return this.itemsDb()[tpl]._props.ammoCaliber;
    }

    protected abstract getAmmoByCaliber(caliber: string): string;

    protected getWeaponMagazine(weaponWithMods: Item[]): Item {
        return weaponWithMods.find((item) => item.slotId === "mod_magazine");
    }

    protected addCartridgeToChamber(
        weaponWithMods: Item[],
        ammoId: string
    ): undefined {
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

    protected fillMagazine(weaponWithMods: Item[], ammoTpl: string): string {
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

    protected getTemplateById(tpl: string): ITemplateItem {
        return this.itemsDb()[tpl];
    }

    protected updateWeaponInfo(
        weaponWithMods: Item[],
        weaponParentId: string,
        isNight: boolean
    ): undefined {
        weaponWithMods[0].slotId = this.equipmentSlot;
        weaponWithMods[0].parentId = weaponParentId;
        this.replaceId(weaponWithMods, 0);
        if (isNight) this.replaceTacticalDevice(weaponWithMods);
        this.setTacticalDeviceMode(weaponWithMods);
        this.setScopeMode(weaponWithMods);
    }

    protected replaceId(weaponWithMods: Item[], i: number): undefined {
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

    protected replaceTacticalDevice(weaponWithMods: Item[]): undefined {
        for (const item of weaponWithMods) {
            if (item.slotId.startsWith("mod_tactical")) {
                item._tpl = "5a5f1ce64f39f90b401987bc";
            }
        }
    }

    protected setTacticalDeviceMode(weaponWithMods: Item[]): undefined {
        for (const item of weaponWithMods) {
            if (item.slotId.startsWith("mod_tactical")) {
                if (item.upd?.Light) {
                    item.upd.Light.IsActive = false;
                    item.upd.Light.SelectedMode = 1;
                }
            }
        }
    }

    protected setScopeMode(weaponWithMods: Item[]): undefined {
        for (const item of weaponWithMods) {
            if (item.slotId.startsWith("mod_scope")) {
                if (item.upd?.Sight) {
                    item.upd.Sight.ScopesSelectedModes = [1];
                }
            }
        }
    }

    protected isPresetValid(
        weaponPreset: WeaponPreset,
        fileName: string
    ): boolean {
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
            this.logger.error(
                `[Andern] preset doesn't have magazine '${fileName}'`
            );
            return false;
        }

        if (!hasTacticalDevice) {
            this.logger.warning(
                `[Andern] preset doesn't have tactical device '${fileName}'`
            );
            return true;
        }

        return true;
    }
    public addExtraMagazinesToInventory(
        weapon: GeneratedWeapon,
        inventory: PmcInventory
    ): undefined {
        const weaponTemplate = weapon.weaponTemplate;

        const magazineTemplate = this.getTemplateById(weapon.magazineTpl);
        const ammoTemplate = this.getTemplateById(weapon.ammoTpl);

        const magazinesGenerationWeights: GenerationData = {
            weights: {
                0: 0,
                1: 0,
                2: 1,
                3: 3,
                4: 2,
            },
            whitelist: [],
        };

        const inventoryMagGenModel = new InventoryMagGen(
            magazinesGenerationWeights,
            magazineTemplate,
            weaponTemplate,
            ammoTemplate,
            inventory
        );

        this.inventoryMagGenComponents
            .find((v) => v.canHandleInventoryMagGen(inventoryMagGenModel))
            .process(inventoryMagGenModel);

        this.addAmmoToSecureContainer(
            this.secureContainerAmmoStackCount,
            weapon.ammoTpl,
            ammoTemplate._props.StackMaxSize,
            inventory
        );
    }

    protected addAmmoToSecureContainer(
        stackCount: number,
        ammoTpl: string,
        stackSize: number,
        inventory: PmcInventory
    ): void {
        for (let i = 0; i < stackCount; i++) {
            const id = this.hashUtil.generate();
            this.botWeaponGeneratorHelper.addItemWithChildrenToEquipmentSlot(
                [EquipmentSlots.SECURED_CONTAINER],
                id,
                ammoTpl,
                [
                    {
                        _id: id,
                        _tpl: ammoTpl,
                        upd: { StackObjectsCount: stackSize },
                    },
                ],
                inventory
            );
        }
    }

    public generateWeapon(
        weaponParentId: string,
        isNight: boolean
    ): GeneratedWeapon {
        const weaponWithMods = this.getRandomWeapon();
        this.updateWeaponInfo(weaponWithMods, weaponParentId, isNight);
        const weaponTpl = this.getTemplateIdFromWeaponItems(weaponWithMods);
        const weaponTemplate = this.getTemplateById(weaponTpl);
        const caliber = this.getCaliberByTemplateId(weaponTpl);
        const ammoTpl = this.getAmmoByCaliber(caliber);
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
