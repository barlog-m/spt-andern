import {inject, injectAll, injectable} from "tsyringe";

import {DatabaseServer} from "@spt/servers/DatabaseServer";
import {ConfigServer} from "@spt/servers/ConfigServer";
import {IPmcConfig} from "@spt/models/spt/config/IPmcConfig";
import {IRepairConfig} from "@spt/models/spt/config/IRepairConfig";
import {ConfigTypes} from "@spt/models/enums/ConfigTypes";
import {Item} from "@spt/models/eft/common/tables/IItem";
import {ITemplateItem} from "@spt/models/eft/common/tables/ITemplateItem";
import {HashUtil} from "@spt/utils/HashUtil";
import {ItemHelper} from "@spt/helpers/ItemHelper";
import {ILogger} from "@spt/models/spt/utils/ILogger";
import {RandomUtil} from "@spt/utils/RandomUtil";
import {
    BotWeaponGeneratorHelper
} from "@spt/helpers/BotWeaponGeneratorHelper";
import {BotGeneratorHelper} from "@spt/helpers/BotGeneratorHelper";
import {RepairService} from "@spt/services/RepairService";
import {IInventoryMagGen} from "@spt/generators/weapongen/IInventoryMagGen";
import {EquipmentSlots} from "@spt/models/enums/EquipmentSlots";

import {GeneratedWeapon} from "./models";
import {Data} from "./Data";
import {BaseClasses} from "@spt/models/enums/BaseClasses";

// eslint-disable-next-line @typescript-eslint/naming-convention
const MUZZLE_PAIRS = {
    //7.62x51 Tier 4
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "6130c43c67085e45ef1405a1": "5dfa3d2b0dee1b22f862eade",
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "618178aa1cb55961fa0fdc80": "5a34fe59c4a282000b1521a2",
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "5a34fd2bc4a282329a73b4c5": "5a34fe59c4a282000b1521a2",
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "5cf78496d7f00c065703d6ca": "5cf78720d7f00c06595bc93e",

    //7.62x51 Tier 3
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "5fbc22ccf24b94483f726483": "5fbe760793164a5b6278efc8",
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "612e0d3767085e45ef14057f": "63877c99e785640d436458ea",
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "5d1f819086f7744b355c219b": "5cff9e84d7ad1a049e54ed55",
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "5dfa3cd1b33c0951220c079b": "5dfa3d2b0dee1b22f862eade",
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "5d443f8fa4b93678dd4a01aa": "5d44064fa4b9361e4f6eb8b5",

    //5.56x45 Tier 4
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "609269c3b0e443224b421cc1": "60926df0132d4d12c81fd9df",
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "6386120cd6baa055ad1e201c": "638612b607dfed1ccb7206ba",
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "626667e87379c44d557b7550": "626673016f1edc06f30cf6d5",
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "5f6372e2865db925d54f3869": "5f6339d53ada5942720e2dc3",

    //5.56x45 Tier 3
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "612e0cfc8004cc50514c2d9e": "63877c99e785640d436458ea",
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "5c7fb51d2e2216001219ce11": "5ea17bbc09aa976f2e7a51cd",
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "5d440625a4b9361eec4ae6c5": "5d44064fa4b9361e4f6eb8b5",

    //Tier 2 SilencerCo Hybrid 46
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "59bffc1f86f77435b128b872": "59bffbb386f77435b379b9c2",

    //AK Hexagon Reactor 5.45x39 muzzle brake
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "615d8f5dd92c473c770212ef": "615d8f8567085e45ef1409ca"
};

@injectable()
export class WeaponGenerator {
    readonly magazineSlotId = "mod_magazine";

    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly MK47 = "606587252535c57a13424cfd";

    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly X_47_DRUM = "5cfe8010d7ad1a59283b14c6";

    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly MAGPUL_MOE_CARBINE_RUBBER_BUTTPAD = "58d2912286f7744e27117493";

    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly SIG_SAUER_TAPER_LOK_762X51_300_BLK_MUZZLE_ADAPTER = "5fbc22ccf24b94483f726483";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly SIG_SAUER_TWO_PORT_BRAKE_762X51_MUZZLE_BRAKE = "5fbcbd10ab884124df0cd563";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly SIG_SAUER_SRD762_QD_762X51_SOUND_SUPPRESSOR = "5fbe760793164a5b6278efc8";

    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly LANTAC_BMD_BLAST_MITIGATION_DEVICE_A3_DIRECT_THREAD_ADAPTER = "5cf78496d7f00c065703d6ca";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly AR_10_LANTAC_DRAGON_762X51_MUZZLE_BRAKE_COMPENSATOR = "5c878e9d2e2216000f201903"
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly LANTAC_BMD_762X51_BLAST_MITIGATION_DEVICE = "5cf78720d7f00c06595bc93e";

    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly ZENIT_KLESCH_2IKS = "5a5f1ce64f39f90b401987bc";

    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly TACTICAL_DEVICE_LIGHT_AND_LASER_MODE = 1;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly TACTICAL_DEVICE_LASER_ONLY_MODE = 2;
   
    pmcConfig: IPmcConfig;
    repairConfig: IRepairConfig;

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
                    upd: {StackObjectsCount: 1},
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
                        upd: {StackObjectsCount: 1},
                    });
                }
            }
        }
    }

    getChamberNameFromWeaponTemplate(weaponTemplate: ITemplateItem): string {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const WEAPON_CHIAPPA_RHINO_50DS_9X33R = "61a4c8884f95bc3b2c5dc96f";
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const WEAPON_CHIAPPA_RHINO_200DS_9X19 = "624c2e8614da335f1e034d8c";
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const WEAPON_KBP_RSH_12_127X55 = "633ec7c2a6918cb895019c6c";

        let chamberName = "patron_in_weapon";

        if (
            weaponTemplate._id === WEAPON_CHIAPPA_RHINO_50DS_9X33R ||
            weaponTemplate._id === WEAPON_CHIAPPA_RHINO_200DS_9X19 ||
            weaponTemplate._id === WEAPON_KBP_RSH_12_127X55
        ) {
            chamberName = "camora";
        }

        return chamberName;
    }

    fillMagazine(weaponWithMods: Item[], ammoTpl: string): string {
        weaponWithMods.filter(
            (x) => x.slotId === this.magazineSlotId
        ).map((magazine) => {
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
        });
        return undefined;
    }

    getTemplateById(tpl: string): ITemplateItem {
        return this.templatesTable()[tpl];
    }

    updateWeaponInfo(
        weaponWithMods: Item[],
        weaponParentId: string,
        weaponTpl: string,
        isNight: boolean,
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
        if (isNight) {
            this.replaceTacticalDevice(weaponWithMods);
        }
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
            if (item.slotId.startsWith("mod_tactical") &&
                this.itemHelper.isOfBaseclass(item._tpl, BaseClasses.TACTICAL_COMBO)
            ) {
                item._tpl = this.ZENIT_KLESCH_2IKS;
            }
        }
    }

    setTacticalDeviceMode(weaponWithMods: Item[]): undefined {
        for (const item of weaponWithMods) {
            if (item.slotId.startsWith("mod_tactical")) {
                if (item.upd?.Light) {
                    item.upd.Light.IsActive = false;
                    item.upd.Light.SelectedMode = this.TACTICAL_DEVICE_LASER_ONLY_MODE;
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
        let deleteSigSauerMuzzleParts = false;
        let deleteLantacBmdPart = false;

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
                    if ((item.slotId === "mod_muzzle") &&
                        (item._tpl === this.SIG_SAUER_TAPER_LOK_762X51_300_BLK_MUZZLE_ADAPTER)) {
                        deleteSigSauerMuzzleParts = true;
                    }

                    if ((item.slotId === "mod_muzzle") &&
                        (item._tpl === this.LANTAC_BMD_BLAST_MITIGATION_DEVICE_A3_DIRECT_THREAD_ADAPTER)) {
                        deleteLantacBmdPart = true;
                    }

                    if (item._tpl === this.MAGPUL_MOE_CARBINE_RUBBER_BUTTPAD) {
                        deleteMagpulRubberButtpad = true;
                    }

                    item._tpl = alternativeTpl;

                    if (item.slotId === "mod_muzzle") {
                        this.alternateOrAddSuppressor(weapon, item);
                    }
                }
            }
        });

        if (deleteMagpulRubberButtpad) {
            this.deleteModule(weapon, this.MAGPUL_MOE_CARBINE_RUBBER_BUTTPAD);
        }

        if (deleteSigSauerMuzzleParts) {
            this.deleteModule(weapon, this.SIG_SAUER_TWO_PORT_BRAKE_762X51_MUZZLE_BRAKE);
            this.deleteModule(weapon, this.SIG_SAUER_SRD762_QD_762X51_SOUND_SUPPRESSOR);
        }

        if (deleteLantacBmdPart) {
            this.deleteModule(weapon, this.AR_10_LANTAC_DRAGON_762X51_MUZZLE_BRAKE_COMPENSATOR);
            this.deleteModule(weapon, this.LANTAC_BMD_762X51_BLAST_MITIGATION_DEVICE);
        }
    }

    alternateOrAddSuppressor(weapon: Item[], muzzleItem: Item): undefined {
        const suppressor = weapon.find(
            (i) => (i.parentId === muzzleItem._id) && (i.slotId === "mod_muzzle")
        );

        if (suppressor !== undefined) {
            const alternativeSuppressorTpl = MUZZLE_PAIRS[muzzleItem._tpl]
            if (alternativeSuppressorTpl !== undefined) {
                if (alternativeSuppressorTpl === this.SIG_SAUER_SRD762_QD_762X51_SOUND_SUPPRESSOR) {
                    suppressor.slotId = "mod_muzzle_001"
                    weapon.push({
                        _id: this.hashUtil.generate(),
                        _tpl: this.SIG_SAUER_TWO_PORT_BRAKE_762X51_MUZZLE_BRAKE,
                        parentId: muzzleItem._id,
                        slotId: "mod_muzzle_000"
                    })
                } else if (alternativeSuppressorTpl === this.LANTAC_BMD_762X51_BLAST_MITIGATION_DEVICE) {
                    suppressor.slotId = "mod_muzzle_001"
                    weapon.push({
                        _id: this.hashUtil.generate(),
                        _tpl: this.AR_10_LANTAC_DRAGON_762X51_MUZZLE_BRAKE_COMPENSATOR,
                        parentId: muzzleItem._id,
                        slotId: "mod_muzzle_000"
                    })
                }

                suppressor._tpl = MUZZLE_PAIRS[muzzleItem._tpl];
            }
        } else {
            const alternativeSuppressorTpl = MUZZLE_PAIRS[muzzleItem._tpl]
            if (alternativeSuppressorTpl !== undefined) {
                if (alternativeSuppressorTpl === this.SIG_SAUER_SRD762_QD_762X51_SOUND_SUPPRESSOR) {
                    this.constructSigSauerSuppressor(weapon, muzzleItem)
                } else if (alternativeSuppressorTpl === this.LANTAC_BMD_762X51_BLAST_MITIGATION_DEVICE) {
                    this.constructLantacBmd(weapon, muzzleItem)
                } else {
                    const suppressorItem: Item = {
                        _id: this.hashUtil.generate(),
                        _tpl: alternativeSuppressorTpl,
                        parentId: muzzleItem._id,
                        slotId: "mod_muzzle"
                    }
                    weapon.push(suppressorItem)
                }
            }
        }
    }

    deleteModule(weapon: Item[], tpl: string): undefined {
        const i = weapon.findIndex(
            (item) => item._tpl === tpl
        );
        if (i > -1) {
            weapon.splice(i, 1);
        }
    }

    constructSigSauerSuppressor(weapon: Item[], muzzleItem: Item): undefined {
        const muzzleBrakeItem: Item = {
            _id: this.hashUtil.generate(),
            _tpl: this.SIG_SAUER_TWO_PORT_BRAKE_762X51_MUZZLE_BRAKE,
            parentId: muzzleItem._id,
            slotId: "mod_muzzle_000"
        }
        weapon.push(muzzleBrakeItem)

        const suppressorItem: Item = {
            _id: this.hashUtil.generate(),
            _tpl: this.SIG_SAUER_SRD762_QD_762X51_SOUND_SUPPRESSOR,
            parentId: muzzleItem._id,
            slotId: "mod_muzzle_001"
        }
        weapon.push(suppressorItem)
    }

    constructLantacBmd(weapon: Item[], muzzleItem: Item): undefined {
        const muzzleBrakeItem: Item = {
            _id: this.hashUtil.generate(),
            _tpl: this.AR_10_LANTAC_DRAGON_762X51_MUZZLE_BRAKE_COMPENSATOR,
            parentId: muzzleItem._id,
            slotId: "mod_muzzle_000"
        }
        weapon.push(muzzleBrakeItem)

        const suppressorItem: Item = {
            _id: this.hashUtil.generate(),
            _tpl: this.LANTAC_BMD_762X51_BLAST_MITIGATION_DEVICE,
            parentId: muzzleItem._id,
            slotId: "mod_muzzle_001"
        }
        weapon.push(suppressorItem)
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
        isNightVision: boolean,
    ): GeneratedWeapon {
        if (presetName.length == 0) {
            presetName = this.data.getPresetName();
        }
        
        const weaponWithMods = this.data.getRandomWeapon(presetName, botLevel);
        const weaponTpl = this.getTemplateIdFromWeaponItems(weaponWithMods);
        
        this.updateWeaponInfo(
            weaponWithMods,
            weaponParentId,
            weaponTpl,
            isNightVision,
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
