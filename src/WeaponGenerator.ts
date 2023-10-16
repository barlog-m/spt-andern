import { inject, injectAll, injectable } from "tsyringe";

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
import { GenerationData } from "@spt-aki/models/eft/common/tables/IBotType";

import { GeneratedWeapon } from "./models";
import { PresetData } from "./PresetData";

@injectable()
export class WeaponGenerator {
    private readonly magazineSlotId = "mod_magazine";
    private readonly chamberSlotId = "patron_in_weapon";
    private readonly equipmentSlot = "FirstPrimaryWeapon";

    private readonly secureContainerAmmoStackCount = 6;

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
        this.setScopeMode(weaponWithMods);
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

    setScopeMode(weaponWithMods: Item[]): undefined {
        for (const item of weaponWithMods) {
            if (item.slotId.startsWith("mod_scope")) {
                if (item.upd?.Sight) {
                    item.upd.Sight.ScopesSelectedModes = [1];
                }
            }
        }
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

    addAmmoToSecureContainer(
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

    alternateModules(botLevel: number, weapon: Item[]): undefined {
        weapon.forEach((item) => {
            const alternativeTpl = this.presetData.getAlternativeModule(
                botLevel,
                item._tpl
            );
            if (alternativeTpl != item._tpl) {
                item._tpl = alternativeTpl;
            }
        });
    }

    public generateWeapon(
        botLevel: number,
        weaponParentId: string,
        isNight: boolean
    ): GeneratedWeapon {
        const weaponWithMods = this.presetData.getRandomWeapon(botLevel);
        this.updateWeaponInfo(weaponWithMods, weaponParentId, isNight);
        this.alternateModules(botLevel, weaponWithMods);
        const weaponTpl = this.getTemplateIdFromWeaponItems(weaponWithMods);
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
