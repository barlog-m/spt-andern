import { inject, injectAll, injectable } from "tsyringe";

import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { ConfigServer } from "@spt-aki/servers/ConfigServer";
import { IPmcConfig } from "@spt-aki/models/spt/config/IPmcConfig";
import { IRepairConfig } from "@spt-aki/models/spt/config/IRepairConfig";
import { ConfigTypes } from "@spt-aki/models/enums/ConfigTypes";
import { Item } from "@spt-aki/models/eft/common/tables/IItem";
import { ITemplateItem } from "@spt-aki/models/eft/common/tables/ITemplateItem";
import { HashUtil } from "@spt-aki/utils/HashUtil";
import { ItemHelper } from "@spt-aki/helpers/ItemHelper";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { RandomUtil } from "@spt-aki/utils/RandomUtil";
import { BotWeaponGeneratorHelper } from "@spt-aki/helpers/BotWeaponGeneratorHelper";
import { BotGeneratorHelper } from "@spt-aki/helpers/BotGeneratorHelper";
import { RepairService } from "@spt-aki/services/RepairService";
import { IInventoryMagGen } from "@spt-aki/generators/weapongen/IInventoryMagGen";
import { EquipmentSlots } from "@spt-aki/models/enums/EquipmentSlots";

import { GeneratedWeapon } from "./models";
import { Data } from "./Data";

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
    "5dfa3cd1b33c0951220c079b": "5dfa3d2b0dee1b22f862eade",

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

    private readonly MK47 = "606587252535c57a13424cfd";

    private readonly X_47_DRUM = "5cfe8010d7ad1a59283b14c6";
    
    private readonly MAGPUL_MOE_CARBINE_RUBBER_BUTTPAD = "58d2912286f7744e27117493";

    protected pmcConfig: IPmcConfig;
    protected repairConfig: IRepairConfig;

    constructor(
        @inject("WinstonLogger") protected logger: ILogger,
        @inject("HashUtil") protected hashUtil: HashUtil,
        @inject("RandomUtil") protected randomUtil: RandomUtil,
        @inject("DatabaseServer") protected databaseServer: DatabaseServer,
        @inject("ConfigServer") protected configServer: ConfigServer,
        @inject("ItemHelper") protected itemHelper: ItemHelper,
        @inject("BotWeaponGeneratorHelper")
        protected botWeaponGeneratorHelper: BotWeaponGeneratorHelper,
        @inject("RepairService") protected repairService: RepairService,
        @inject("BotGeneratorHelper")
        protected botGeneratorHelper: BotGeneratorHelper,
        @injectAll("InventoryMagGen")
        protected inventoryMagGenComponents: IInventoryMagGen[],
        @inject("AndernData") protected data: Data
    ) {
        this.pmcConfig = this.configServer.getConfig(ConfigTypes.PMC);
        this.repairConfig = this.configServer.getConfig(ConfigTypes.REPAIR);
    }

    templatesTable(): Record<string, ITemplateItem> {
        return this.databaseServer.getTables().templates.items;
    }

    getTemplateIdFromWeaponItems(weaponWithMods: Item[]): string {
        return weaponWithMods[0]._tpl;
    }

    getCaliberByTemplateId(tpl: string): string {
        return this.getTemplateById(tpl)._props.ammoCaliber;
    }

    getWeaponClassByTemplateId(tpl: string): string {
        return this.getTemplateById(tpl)._props.weapClass;
    }

    getWeaponSlotByWeaponClass(weaponClass: string): string {
        switch (weaponClass) {
            case "pistol":
                return EquipmentSlots.HOLSTER;
            default:
                return EquipmentSlots.FIRST_PRIMARY_WEAPON;
        }
    }

    getWeaponMagazine(weaponWithMods: Item[]): Item {
        return weaponWithMods.find((item) => item.slotId === "mod_magazine");
    }

    addCartridgeToChamber(
        weaponWithMods: Item[],
        ammoTpl: string,
        weaponTemplate: ITemplateItem
    ): undefined {
        const chambersAmount =
            this.getChambersAmountFromWeaponTemplate(weaponTemplate);

        const chamberName =
            this.getChamberNameFromWeaponTemplate(weaponTemplate);

        const existingItemWithSlot = weaponWithMods.filter((item) =>
            item.slotId.startsWith(chamberName)
        );

        if (existingItemWithSlot.length > 0) {
            existingItemWithSlot.forEach((chamber) => {
                chamber.upd = {
                    StackObjectsCount: 1,
                };
                chamber._tpl = ammoTpl;
            });
        } else {
            if (chambersAmount === 1) {
                weaponWithMods.push({
                    _id: this.hashUtil.generate(),
                    _tpl: ammoTpl,
                    parentId: weaponWithMods[0]._id,
                    slotId: chamberName,
                    upd: { StackObjectsCount: 1 },
                });
            } else {
                for (
                    let chamberNum = 0;
                    chamberNum < chambersAmount;
                    chamberNum++
                ) {
                    const slotIdName = `${chamberName}_00${chamberNum}`;
                    weaponWithMods.push({
                        _id: this.hashUtil.generate(),
                        _tpl: ammoTpl,
                        parentId: weaponWithMods[0]._id,
                        slotId: slotIdName,
                        upd: { StackObjectsCount: 1 },
                    });
                }
            }
        }
    }

    getChamberNameFromWeaponTemplate(weaponTemplate: ITemplateItem): string {
        const weapon_chiappa_rhino_50ds_9x33R = "61a4c8884f95bc3b2c5dc96f";
        const weapon_chiappa_rhino_200ds_9x19 = "624c2e8614da335f1e034d8c";
        const weapon_kbp_rsh_12_127x55 = "633ec7c2a6918cb895019c6c";

        let chamberName = "patron_in_weapon";

        if (
            weaponTemplate._id === weapon_chiappa_rhino_50ds_9x33R ||
            weaponTemplate._id === weapon_chiappa_rhino_200ds_9x19 ||
            weaponTemplate._id === weapon_kbp_rsh_12_127x55
        ) {
            chamberName = "camora";
        }

        return chamberName;
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
        isNight: boolean,
        weaponTpl: string
    ): undefined {
        weaponWithMods[0].slotId = this.getWeaponSlotByWeaponClass(
            this.getWeaponClassByTemplateId(weaponTpl)
        );
        weaponWithMods[0].parentId = weaponParentId;

        weaponWithMods[0] = {
            ...weaponWithMods[0],
            ...this.botGeneratorHelper.generateExtraPropertiesForItem(
                this.getTemplateById(weaponTpl),
                "pmc"
            ),
        };

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
        presetName: string,
        botLevel: number,
        weapon: Item[],
        weaponTpl: string
    ): undefined {
        let deleteMagpulRubberButtpad = false;
        
        weapon.forEach((item) => {
            const alternativeTpl = this.data.getAlternativeModule(
                presetName,
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
                    
                    if (item._tpl === this.MAGPUL_MOE_CARBINE_RUBBER_BUTTPAD) {
                        deleteMagpulRubberButtpad = true;
                    }
                }
            }
        });
       
        if (deleteMagpulRubberButtpad) {
            this.deleteModule(weapon, this.MAGPUL_MOE_CARBINE_RUBBER_BUTTPAD);
        }
    }

    alternateSuppressor(weapon: Item[], muzzleItem: Item): undefined {
        const suppressor = weapon.find(
            (i) => i.parentId === muzzleItem._id && (i.slotId = "mod_muzzle")
        );
        
        if (suppressor !== undefined) {
            suppressor._tpl = MUZZLE_PAIRS[muzzleItem._tpl];

            this.deleteUnnecessaryMuzzleModules(weapon);
        }
    }

    deleteUnnecessaryMuzzleModules(weapon: Item[]): undefined {
       const SIG_SAUER_TWO_PORT_BRAKE_762X51_MUZZLE_BRAKE = "5fbcbd10ab884124df0cd563"; 
       this.deleteModule(weapon, SIG_SAUER_TWO_PORT_BRAKE_762X51_MUZZLE_BRAKE);
    }

    deleteModule(weapon: Item[], tpl: string): undefined {
        const i = weapon.findIndex(
            (item) => item._tpl === tpl
        );
        if (i > -1) {
            weapon.splice(i, 1);
        }
    }

    addRandomEnhancement(weapon: Item[]): undefined {
        if (
            this.randomUtil.getChance100(
                this.pmcConfig.weaponHasEnhancementChancePercent
            )
        ) {
            const weaponConfig = this.repairConfig.repairKit.weapon;
            this.repairService.addBuff(weaponConfig, weapon[0]);
        }
    }

    getChambersAmountFromWeaponTemplate(weaponTemplate: ITemplateItem): number {
        return weaponTemplate._props.Chambers.length;
    }

    public generateWeapon(
        presetName: string = "",
        botLevel: number,
        weaponParentId: string,
        isNight: boolean
    ): GeneratedWeapon {
        if (presetName.length == 0) {
            presetName = this.data.getPresetName();
        }
        const weaponWithMods = this.data.getRandomWeapon(presetName, botLevel);
        const weaponTpl = this.getTemplateIdFromWeaponItems(weaponWithMods);
        this.updateWeaponInfo(
            weaponWithMods,
            weaponParentId,
            isNight,
            weaponTpl
        );
        this.alternateModules(presetName, botLevel, weaponWithMods, weaponTpl);
        this.addRandomEnhancement(weaponWithMods);
        const weaponTemplate = this.getTemplateById(weaponTpl);
        const caliber = this.getCaliberByTemplateId(weaponTpl);
        const ammoTpl = this.data.getRandomAmmoByCaliber(
            presetName,
            botLevel,
            caliber
        );

        this.addCartridgeToChamber(weaponWithMods, ammoTpl, weaponTemplate);
        const magazineTpl = this.fillMagazine(weaponWithMods, ammoTpl);

        return {
            weaponWithMods: weaponWithMods,
            weaponTemplate: weaponTemplate,
            ammoTpl: ammoTpl,
            magazineTpl: magazineTpl,
        };
    }
}
