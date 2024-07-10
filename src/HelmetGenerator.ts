import {inject, injectable} from "tsyringe";

import {ILogger} from "@spt/models/spt/utils/ILogger";
import {HashUtil} from "@spt/utils/HashUtil";
import {RandomUtil} from "@spt/utils/RandomUtil";
import {
    Inventory as PmcInventory
} from "@spt/models/eft/common/tables/IBotBase";
import {EquipmentSlots} from "@spt/models/enums/EquipmentSlots";

import {GearGeneratorHelper} from "./GearGeneratorHelper";

@injectable()
export class HelmetGenerator {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly ALTYN_HELMET = "5aa7e276e5b5b000171d0647";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly RYS_HELMET = "5f60c74e3b85f6263c145586";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly MASKA_OLIVE_HELMET = "5c091a4e0db834001d5addc8";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly MASKA_KILLA_HELMET = "5c0e874186f7745dc7616606";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly VULKAN_HELMET = "5ca20ee186f774799474abc2";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly LSHZ_2DTM_HELMET = "5d6d3716a4b9361bc8618872";

    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly AIRFRAME_HELMET = "5c17a7ed2e2216152142459c";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly CAIMAN_HYBRID_HELMET = "5f60b34a41e30a4ab12a6947";

    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly _6B47_RATNIK_BSH_HELMET = "5a7c4850e899ef00150be885";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly _6B47_RATNIK_BSH_HELMET_DIGITAL = "5aa7cfc0e5b5b00015693143";

    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly LSHZ_LIGHT_HELMET = "5b432d215acfc4771e1c6624";

    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly TC_2001_HELMET = "5d5e7d28a4b936645d161203";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly TC_2002_HELMET = "5d5e9c74a4b9364855191c40";

    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly EXFIL_BLACK_HELMET = "5e00c1ad86f774747333222c";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly EXFIL_EAR_COVERS_BLACK = "5e00cfa786f77469dc6e5685";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly EXFIL_FACE_SHIELD_BLACK = "5e00cdd986f7747473332240";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly EXFIL_BROWN_HELMET = "5e01ef6886f77445f643baa4";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly EXFIL_EAR_COVERS_BROWN = "5e01f31d86f77465cf261343";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly EXFIL_FACE_SHIELD_BROWN = "5e01f37686f774773c6f6c15";

    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly HJELM_HELMET = "61bca7cda0eae612383adf57";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly TC800_HELMET = "5e4bfc1586f774264f7582d3";

    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly BASTION_HELMET = "5ea17ca01412a1425304d1c0";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly BASTION_ARMOR_PLATE = "5ea18c84ecf1982c7712d9a2";

    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly FAST_TAN_HELMET = "5ac8d6885acfc400180ae7b0";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly FAST_BLACK_HELMET = "5a154d5cfcdbcb001a3b00da";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly FAST_BALLISTIC_FACE_SHIELD = "5a16b7e1fcdbcb00165aa6c9";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly FAST_SIDE_ARMOR = "5a16badafcdbcb001865f72d";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly FAST_SLAAP_HELMET_PLATE = "5c0e66e2d174af02a96252f4";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly FAST_GUNSIGHT_MANDIBLE = "5a16ba61fcdbcb098008728a";

    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly HEAVY_TROOPER_MASK = "5ea058e01dbce517f324b3e2";

    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly NVG_SLOT_ID = "mod_nvg";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly GPNVG_18_NIGHT_VISION_GOGGLES = "5c0558060db834001b735271";

    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly PNV_10T_NIGHT_VISION_GOGGLES = "5c0696830db834001d23f5da";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly NOROTOS_TITANIUM_ADVANCED_TACTICAL_MOUNT =
        "5a16b8a9fcdbcb00165aa6ca";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly PNV_10T_DOVETAIL_ADAPTER = "5c0695860db834001b735461";

    readonly headphonesIncompatibleHelmets = [
        this.ALTYN_HELMET,
        this.RYS_HELMET,
        this.MASKA_OLIVE_HELMET,
        this.MASKA_KILLA_HELMET,
        this.VULKAN_HELMET,
        this.LSHZ_2DTM_HELMET,
    ];

    readonly headphonesNotFullyCompatableHelmets = [
        this.AIRFRAME_HELMET,
        this.LSHZ_LIGHT_HELMET,
        this.EXFIL_BLACK_HELMET,
        this.EXFIL_BROWN_HELMET,
        this.FAST_BLACK_HELMET,
        this.FAST_TAN_HELMET,
    ];

    constructor(
        @inject("WinstonLogger") protected logger: ILogger,
        @inject("HashUtil") protected hashUtil: HashUtil,
        @inject("RandomUtil") protected randomUtil: RandomUtil,
        @inject("AndernGearGeneratorHelper")
        protected gearGeneratorHelper: GearGeneratorHelper
    ) {
    }

    public generateHelmet(
        botLevel: number,
        botRole: string,
        botInventory: PmcInventory,
        tpl: string,
        isNightVision: boolean,
        isKittedHelmet: boolean
    ): undefined {
        if (isNightVision) {
            tpl = this.selectNightHelmet(botLevel);
        }

        switch (tpl) {
            case this.ALTYN_HELMET: {
                this.altynHelmet(botLevel, botRole, botInventory);
                break;
            }
            case this.RYS_HELMET: {
                this.rysHelmet(botLevel, botRole, botInventory);
                break;
            }
            case this.MASKA_OLIVE_HELMET: {
                this.maskaHelmet(
                    this.MASKA_OLIVE_HELMET,
                    botLevel,
                    botRole,
                    botInventory
                );
                break;
            }
            case this.MASKA_KILLA_HELMET: {
                this.maskaHelmet(
                    this.MASKA_KILLA_HELMET,
                    botLevel,
                    botRole,
                    botInventory
                );
                break;
            }
            case this.VULKAN_HELMET: {
                this.vulkanHelmet(botLevel, botRole, botInventory);
                break;
            }
            case this.LSHZ_2DTM_HELMET: {
                this.lshz2dtmHelmet(botLevel, botRole, botInventory, isKittedHelmet);
                break;
            }
            case this.AIRFRAME_HELMET: {
                this.airFrameHelmet(botLevel, botRole, botInventory, isNightVision, isKittedHelmet);
                break;
            }
            case this.CAIMAN_HYBRID_HELMET: {
                this.caimanHybridHelmet(
                    botLevel,
                    botRole,
                    botInventory,
                    isNightVision,
                    isKittedHelmet
                );
                break;
            }
            case this._6B47_RATNIK_BSH_HELMET: {
                this.ratnikBshHelmet(
                    this._6B47_RATNIK_BSH_HELMET,
                    botLevel,
                    botRole,
                    botInventory,
                    isNightVision
                );
                break;
            }
            case this._6B47_RATNIK_BSH_HELMET_DIGITAL: {
                this.ratnikBshHelmet(
                    this._6B47_RATNIK_BSH_HELMET_DIGITAL,
                    botLevel,
                    botRole,
                    botInventory,
                    isNightVision
                );
                break;
            }
            case this.LSHZ_LIGHT_HELMET: {
                this.lshzLightHelmet(botLevel, botRole, botInventory, isNightVision, isKittedHelmet);
                break;
            }
            case this.TC_2001_HELMET: {
                this.tc200xHelmet(
                    this.TC_2001_HELMET,
                    botLevel,
                    botRole,
                    botInventory,
                    isNightVision,
                    isKittedHelmet
                );
                break;
            }
            case this.TC_2002_HELMET: {
                this.tc200xHelmet(
                    this.TC_2002_HELMET,
                    botLevel,
                    botRole,
                    botInventory,
                    isNightVision,
                    isKittedHelmet
                );
                break;
            }
            case this.EXFIL_BLACK_HELMET: {
                this.exfilBlackHelmet(botLevel, botRole, botInventory, isNightVision, isKittedHelmet);
                break;
            }
            case this.EXFIL_BROWN_HELMET: {
                this.exfilBrownHelmet(botLevel, botRole, botInventory, isNightVision, isKittedHelmet);
                break;
            }
            case this.HJELM_HELMET: {
                this.hjelmHelmet(botLevel, botRole, botInventory, isNightVision, isKittedHelmet);
                break;
            }
            case this.TC800_HELMET: {
                this.tc800Helmet(botLevel, botRole, botInventory, isNightVision, isKittedHelmet);
                break;
            }
            case this.BASTION_HELMET: {
                this.bastionHelmet(botLevel, botRole, botInventory, isNightVision, isKittedHelmet);
                break;
            }
            case this.FAST_TAN_HELMET: {
                this.fastHelmet(
                    this.FAST_TAN_HELMET,
                    botLevel,
                    botRole,
                    botInventory,
                    isNightVision,
                    isKittedHelmet
                );
                break;
            }
            case this.FAST_BLACK_HELMET: {
                this.fastHelmet(
                    this.FAST_BLACK_HELMET,
                    botLevel,
                    botRole,
                    botInventory,
                    isNightVision,
                    isKittedHelmet
                );
                break;
            }
            default: {
                this.anyOtherHelmet(tpl, botLevel, botRole, botInventory);
                break;
            }
        }
    }

    anyOtherHelmet(
        tpl: string,
        botLevel: number,
        botRole: string,
        botInventory: PmcInventory
    ): undefined {
        this.gearGeneratorHelper.putGearItemToInventory(
            EquipmentSlots.HEADWEAR,
            botRole,
            botInventory,
            tpl,
            false,
            botLevel
        );
    }

    altynHelmet(botLevel: number, botRole: string, botInventory: PmcInventory): undefined {
        const ALTYN_FACE_SHIELD = "5aa7e373e5b5b000137b76f0";

        const helmetItemId = this.gearGeneratorHelper.putGearItemToInventory(
            EquipmentSlots.HEADWEAR,
            botRole,
            botInventory,
            this.ALTYN_HELMET,
            false,
            botLevel
        );

        this.gearGeneratorHelper.putModItemToInventory(
            botRole,
            botInventory,
            ALTYN_FACE_SHIELD,
            "mod_equipment",
            helmetItemId
        );
    }

    rysHelmet(botLevel: number, botRole: string, botInventory: PmcInventory): undefined {
        const RYS_FACE_SHIELD = "5f60c85b58eff926626a60f7";

        const helmetItemId = this.gearGeneratorHelper.putGearItemToInventory(
            EquipmentSlots.HEADWEAR,
            botRole,
            botInventory,
            this.RYS_HELMET,
            false,
            botLevel
        );

        this.gearGeneratorHelper.putModItemToInventory(
            botRole,
            botInventory,
            RYS_FACE_SHIELD,
            "mod_equipment",
            helmetItemId
        );
    }

    maskaHelmet(
        helmetTpl: string,
        botLevel: number,
        botRole: string,
        botInventory: PmcInventory
    ): undefined {
        const MASKA_OLIVE_FACE_SHIELD = "5c0919b50db834001b7ce3b9";
        const MASKA_KILLA_FACE_SHIELD = "5c0e842486f77443a74d2976";

        const faceShieldTpl =
            helmetTpl === this.MASKA_OLIVE_HELMET
                ? MASKA_OLIVE_FACE_SHIELD
                : MASKA_KILLA_FACE_SHIELD;

        const helmetItemId = this.gearGeneratorHelper.putGearItemToInventory(
            EquipmentSlots.HEADWEAR,
            botRole,
            botInventory,
            helmetTpl,
            false,
            botLevel
        );

        this.gearGeneratorHelper.putModItemToInventory(
            botRole,
            botInventory,
            faceShieldTpl,
            "mod_equipment",
            helmetItemId
        );
    }

    vulkanHelmet(botLevel: number, botRole: string, botInventory: PmcInventory): undefined {
        const VULKAN_FACE_SHIELD = "5ca2113f86f7740b2547e1d2";

        const helmetItemId = this.gearGeneratorHelper.putGearItemToInventory(
            EquipmentSlots.HEADWEAR,
            botRole,
            botInventory,
            this.VULKAN_HELMET,
            false,
            botLevel
        );

        this.gearGeneratorHelper.putModItemToInventory(
            botRole,
            botInventory,
            VULKAN_FACE_SHIELD,
            "mod_equipment",
            helmetItemId
        );
    }

    lshz2dtmHelmet(botLevel: number, botRole: string, botInventory: PmcInventory, isKittedHelmet: boolean): undefined {
        const LSHZ_2DTM_FACE_SHIELD = "5d6d3829a4b9361bc8618943";
        const LSHZ_2DTM_AVENTAIL = "5d6d3be5a4b9361bc73bc763";
        const LSHZ_2DTM_COVER = "5d6d3943a4b9360dbc46d0cc";

        const helmetItemId = this.gearGeneratorHelper.putGearItemToInventory(
            EquipmentSlots.HEADWEAR,
            botRole,
            botInventory,
            this.LSHZ_2DTM_HELMET,
            false,
            botLevel
        );

        if (isKittedHelmet) {

            this.gearGeneratorHelper.putModItemToInventory(
                botRole,
                botInventory,
                LSHZ_2DTM_FACE_SHIELD,
                "mod_equipment_000",
                helmetItemId
            );

            this.gearGeneratorHelper.putModItemToInventory(
                botRole,
                botInventory,
                LSHZ_2DTM_AVENTAIL,
                "mod_equipment_001",
                helmetItemId
            );

            this.gearGeneratorHelper.putModItemToInventory(
                botRole,
                botInventory,
                LSHZ_2DTM_COVER,
                "mod_equipment_002",
                helmetItemId
            );
        }
    }

    airFrameHelmet(
        botLevel: number,
        botRole: string,
        botInventory: PmcInventory,
        isNightVision: boolean,
        isKittedHelmet: boolean,
    ): undefined {
        const helmetItemId = this.gearGeneratorHelper.putGearItemToInventory(
            EquipmentSlots.HEADWEAR,
            botRole,
            botInventory,
            this.AIRFRAME_HELMET,
            false,
            botLevel
        );

        if (isKittedHelmet) {
            const AIRFRAME_CHOPS = "5c178a942e22164bef5ceca3";

            this.gearGeneratorHelper.putModItemToInventory(
                botRole,
                botInventory,
                AIRFRAME_CHOPS,
                "mod_equipment_001",
                helmetItemId
            );
        }

        if (isNightVision) {
            this.generateNvg(botLevel, botRole, botInventory, helmetItemId);
        } else if (isKittedHelmet) {
            this.gearGeneratorHelper.putModItemToInventory(
                botRole,
                botInventory,
                this.FAST_BALLISTIC_FACE_SHIELD,
                "mod_equipment_000",
                helmetItemId
            );
        }
    }

    caimanHybridHelmet(
        botLevel: number,
        botRole: string,
        botInventory: PmcInventory,
        isNighVision: boolean,
        isKittedHelmet: boolean,
    ): undefined {
        const helmetItemId = this.gearGeneratorHelper.putGearItemToInventory(
            EquipmentSlots.HEADWEAR,
            botRole,
            botInventory,
            this.CAIMAN_HYBRID_HELMET,
            false,
            botLevel
        );

        if (isKittedHelmet) {
            const CAIMAN_BALLISTIC_MANDIBLE_GUARD = "5f60c076f2bcbb675b00dac2";
            this.gearGeneratorHelper.putModItemToInventory(
                botRole,
                botInventory,
                CAIMAN_BALLISTIC_MANDIBLE_GUARD,
                "mod_equipment_000",
                helmetItemId
            );

            const CAIMAN_BALLISTIC_APPLIQUE = "5f60b85bbdb8e27dee3dc985";
            this.gearGeneratorHelper.putModItemToInventory(
                botRole,
                botInventory,
                CAIMAN_BALLISTIC_APPLIQUE,
                "mod_equipment_002",
                helmetItemId
            );
        }

        if (isNighVision) {
            this.generateNvg(botLevel, botRole, botInventory, helmetItemId);
        } else if (isKittedHelmet) {
            const CAIMAN_FIXED_ARM_VISOR = "5f60bf4558eff926626a60f2";
            this.gearGeneratorHelper.putModItemToInventory(
                botRole,
                botInventory,
                CAIMAN_FIXED_ARM_VISOR,
                this.NVG_SLOT_ID,
                helmetItemId
            );
        }
    }

    ratnikBshHelmet(
        helmetTpl: string,
        botLevel: number,
        botRole: string,
        botInventory: PmcInventory,
        isNightVision: boolean
    ): undefined {
        const helmetItemId = this.gearGeneratorHelper.putGearItemToInventory(
            EquipmentSlots.HEADWEAR,
            botRole,
            botInventory,
            helmetTpl,
            false,
            botLevel
        );

        if (isNightVision) {
            this.generateNvg(botLevel, botRole, botInventory, helmetItemId);
        }
    }

    lshzLightHelmet(
        botLevel: number,
        botRole: string,
        botInventory: PmcInventory,
        isNightVision: boolean,
        isKittedHelmet: boolean,
    ): undefined {
        const helmetItemId = this.gearGeneratorHelper.putGearItemToInventory(
            EquipmentSlots.HEADWEAR,
            botRole,
            botInventory,
            this.LSHZ_LIGHT_HELMET,
            false,
            botLevel
        );

        if (!isNightVision && isKittedHelmet) {
            this.gearGeneratorHelper.putModItemToInventory(
                botRole,
                botInventory,
                this.FAST_BALLISTIC_FACE_SHIELD,
                this.NVG_SLOT_ID,
                helmetItemId
            );
            return;
        }

        if (isKittedHelmet) {

            const sideArmorId = this.gearGeneratorHelper.putModItemToInventory(
                botRole,
                botInventory,
                this.FAST_SIDE_ARMOR,
                "mod_equipment_000",
                helmetItemId
            );

            if (this.randomUtil.getBool()) {
                const maskId = this.gearGeneratorHelper.putModItemToInventory(
                    botRole,
                    botInventory,
                    this.HEAVY_TROOPER_MASK,
                    this.NVG_SLOT_ID,
                    helmetItemId
                );

                if (isNightVision) {
                    this.generateNvg(botLevel, botRole, botInventory, maskId);
                }
            } else {
                this.gearGeneratorHelper.putModItemToInventory(
                    botRole,
                    botInventory,
                    this.FAST_GUNSIGHT_MANDIBLE,
                    "mod_equipment",
                    sideArmorId
                );

                if (isNightVision) {
                    this.generateNvg(botLevel, botRole, botInventory, helmetItemId);
                }
            }
        } else if (isNightVision) {
            this.generateNvg(botLevel, botRole, botInventory, helmetItemId);
        }
    }

    tc200xHelmet(
        helmetTpl: string,
        botLevel: number,
        botRole: string,
        botInventory: PmcInventory,
        isNightVision: boolean,
        isKittedHelmet: boolean,
    ): undefined {
        const helmetItemId = this.gearGeneratorHelper.putGearItemToInventory(
            EquipmentSlots.HEADWEAR,
            botRole,
            botInventory,
            helmetTpl,
            false,
            botLevel
        );
        
        if (isKittedHelmet) {
            this.gearGeneratorHelper.putModItemToInventory(
                botRole,
                botInventory,
                this.FAST_SLAAP_HELMET_PLATE,
                "mod_equipment_002",
                helmetItemId
            );
        }

        if (isNightVision) {
            this.generateNvg(botLevel, botRole, botInventory, helmetItemId);
        }
    }

    exfilBlackHelmet(
        botLevel: number,
        botRole: string,
        botInventory: PmcInventory,
        isNightVision: boolean,
        isKittedHelmet: boolean,
    ): undefined {
        const helmetItemId = this.gearGeneratorHelper.putGearItemToInventory(
            EquipmentSlots.HEADWEAR,
            botRole,
            botInventory,
            this.EXFIL_BLACK_HELMET,
            false,
            botLevel
        );

        if (isKittedHelmet) {
            this.gearGeneratorHelper.putModItemToInventory(
                botRole,
                botInventory,
                this.EXFIL_EAR_COVERS_BLACK,
                "mod_equipment_000",
                helmetItemId
            );
        }

        if (isNightVision) {
            this.generateNvg(botLevel, botRole, botInventory, helmetItemId);
        } else if (isKittedHelmet) {
            const faceShieldId = this.randomUtil.getBool()
                ? this.EXFIL_FACE_SHIELD_BLACK
                : this.EXFIL_FACE_SHIELD_BROWN;
            this.gearGeneratorHelper.putModItemToInventory(
                botRole,
                botInventory,
                faceShieldId,
                "mod_equipment_001",
                helmetItemId
            );
        }
    }

    exfilBrownHelmet(
        botLevel: number,
        botRole: string,
        botInventory: PmcInventory,
        isNightVision: boolean,
        isKittedHelmet: boolean,
    ): undefined {
        const helmetItemId = this.gearGeneratorHelper.putGearItemToInventory(
            EquipmentSlots.HEADWEAR,
            botRole,
            botInventory,
            this.EXFIL_BROWN_HELMET,
            false,
            botLevel
        );

        if (isKittedHelmet) {
            this.gearGeneratorHelper.putModItemToInventory(
                botRole,
                botInventory,
                this.EXFIL_EAR_COVERS_BROWN,
                "mod_equipment_000",
                helmetItemId
            );
        }

        if (isNightVision) {
            this.generateNvg(botLevel, botRole, botInventory, helmetItemId);
        }
    }

    hjelmHelmet(
        botLevel: number,
        botRole: string,
        botInventory: PmcInventory,
        isNightVision: boolean,
        isKittedHelmet: boolean,
    ): undefined {
        const helmetItemId = this.gearGeneratorHelper.putGearItemToInventory(
            EquipmentSlots.HEADWEAR,
            botRole,
            botInventory,
            this.HJELM_HELMET,
            false,
            botLevel
        );

        if (isNightVision) {
            this.generateNvg(botLevel, botRole, botInventory, helmetItemId);
        } else if (isKittedHelmet) {
            this.gearGeneratorHelper.putModItemToInventory(
                botRole,
                botInventory,
                this.FAST_BALLISTIC_FACE_SHIELD,
                "mod_equipment_000",
                helmetItemId
            );
        }
    }

    tc800Helmet(
        botLevel: number,
        botRole: string,
        botInventory: PmcInventory,
        isNightVision: boolean,
        isKittedHelmet: boolean,
    ): undefined {
        const helmetItemId = this.gearGeneratorHelper.putGearItemToInventory(
            EquipmentSlots.HEADWEAR,
            botRole,
            botInventory,
            this.TC800_HELMET,
            false,
            botLevel
        );

        if (isNightVision) {
            this.generateNvg(botLevel, botRole, botInventory, helmetItemId);
        } else if (isKittedHelmet) {
            this.gearGeneratorHelper.putModItemToInventory(
                botRole,
                botInventory,
                this.FAST_BALLISTIC_FACE_SHIELD,
                "mod_equipment_000",
                helmetItemId
            );
        }
    }

    bastionHelmet(
        botLevel: number,
        botRole: string,
        botInventory: PmcInventory,
        isNightVision: boolean,
        isKittedHelmet: boolean,
    ): undefined {
        const helmetItemId = this.gearGeneratorHelper.putGearItemToInventory(
            EquipmentSlots.HEADWEAR,
            botRole,
            botInventory,
            this.BASTION_HELMET,
            false,
            botLevel
        );

        if (isKittedHelmet) {

            const plateId = this.gearGeneratorHelper.putModItemToInventory(
                botRole,
                botInventory,
                this.BASTION_ARMOR_PLATE,
                this.NVG_SLOT_ID,
                helmetItemId
            );

            if (isNightVision) {
                this.generateNvg(botLevel, botRole, botInventory, plateId);
            }
        } else {
            if (isNightVision) {
                this.generateNvg(botLevel, botRole, botInventory, helmetItemId);
            }
        }
    }

    fastHelmet(
        helmetTpl: string,
        botLevel: number,
        botRole: string,
        botInventory: PmcInventory,
        isNightVision: boolean,
        isKittedHelmet: boolean,
    ): undefined {
        const helmetItemId = this.gearGeneratorHelper.putGearItemToInventory(
            EquipmentSlots.HEADWEAR,
            botRole,
            botInventory,
            helmetTpl,
            false,
            botLevel
        );

        if (!isNightVision && isKittedHelmet && this.randomUtil.getBool()) {
            this.gearGeneratorHelper.putModItemToInventory(
                botRole,
                botInventory,
                this.FAST_BALLISTIC_FACE_SHIELD,
                "mod_equipment_000",
                helmetItemId
            );
            return;
        }

        if (isKittedHelmet) {
            const sideArmorId = this.gearGeneratorHelper.putModItemToInventory(
                botRole,
                botInventory,
                this.FAST_SIDE_ARMOR,
                "mod_equipment_000",
                helmetItemId
            );

            if (this.randomUtil.getBool()) {
                const maskId = this.gearGeneratorHelper.putModItemToInventory(
                    botRole,
                    botInventory,
                    this.HEAVY_TROOPER_MASK,
                    this.NVG_SLOT_ID,
                    helmetItemId
                );

                if (isNightVision) {
                    this.generateNvg(botLevel, botRole, botInventory, maskId);
                }
            } else {
                this.gearGeneratorHelper.putModItemToInventory(
                    botRole,
                    botInventory,
                    this.FAST_GUNSIGHT_MANDIBLE,
                    "mod_equipment",
                    sideArmorId
                );
                this.gearGeneratorHelper.putModItemToInventory(
                    botRole,
                    botInventory,
                    this.FAST_SLAAP_HELMET_PLATE,
                    "mod_equipment_002",
                    helmetItemId
                );
                if (isNightVision) {
                    this.generateNvg(botLevel, botRole, botInventory, helmetItemId);
                }
            }
        } else {
            if (isNightVision) {
                this.generateNvg(botLevel, botRole, botInventory, helmetItemId);
            }
        }
    }

    generateNvg(botLevel: number, botRole: string, botInventory: PmcInventory, helmetItemId: string): undefined {
        if (botLevel <= 28) {
            this.generatePnvNvg(botRole, botInventory, helmetItemId);
        } else {
            this.generateGpNvg(botRole, botInventory, helmetItemId);
        }
    }

    generatePnvNvg(
        botRole: string,
        botInventory: PmcInventory,
        parentId: string
    ): undefined {
        const mountId = this.gearGeneratorHelper.putModItemToInventory(
            botRole,
            botInventory,
            this.NOROTOS_TITANIUM_ADVANCED_TACTICAL_MOUNT,
            this.NVG_SLOT_ID,
            parentId
        );

        const adapterId = this.gearGeneratorHelper.putModItemToInventory(
            botRole,
            botInventory,
            this.PNV_10T_DOVETAIL_ADAPTER,
            this.NVG_SLOT_ID,
            mountId
        );

        this.gearGeneratorHelper.putModItemToInventory(
            botRole,
            botInventory,
            this.PNV_10T_NIGHT_VISION_GOGGLES,
            this.NVG_SLOT_ID,
            adapterId
        );
    }

    generateGpNvg(
        botRole: string,
        botInventory: PmcInventory,
        parentId: string
    ): undefined {
        this.gearGeneratorHelper.putModItemToInventory(
            botRole,
            botInventory,
            this.GPNVG_18_NIGHT_VISION_GOGGLES,
            this.NVG_SLOT_ID,
            parentId
        );
    }

    tierOneNightHelmet(): string {
        return this._6B47_RATNIK_BSH_HELMET_DIGITAL;
    }

    tierTwoNightHelmet(): string {
        const helmets = [
            this._6B47_RATNIK_BSH_HELMET,
            this.TC_2001_HELMET,
            this.TC_2002_HELMET,
            this.TC800_HELMET,
            this.CAIMAN_HYBRID_HELMET,
            this.LSHZ_LIGHT_HELMET,
            this.HJELM_HELMET
        ];
        return this.randomUtil.getArrayValue(helmets);
    }

    tierThreeNightHelmet(): string {
        const helmets = [
            this.CAIMAN_HYBRID_HELMET,
            this.TC800_HELMET,
            this.BASTION_HELMET,
            this.TC_2001_HELMET,
            this.TC_2002_HELMET,
        ];
        return this.randomUtil.getArrayValue(helmets);
    }

    tierFourNightHelmet(): string {
        const helmets = [
            this.AIRFRAME_HELMET,
            this.EXFIL_BLACK_HELMET,
            this.EXFIL_BROWN_HELMET,
            this.FAST_TAN_HELMET,
            this.FAST_BLACK_HELMET,
        ];
        return this.randomUtil.getArrayValue(helmets);
    }

    selectNightHelmet(botLevel: number): string {
        if (botLevel < 15) {
            return this.tierOneNightHelmet();
        } else if (botLevel >= 15 && botLevel < 32) {
            return this.tierTwoNightHelmet();
        } else if (botLevel >= 32 && botLevel < 42) {
            return this.tierThreeNightHelmet();
        } else {
            return this.tierFourNightHelmet();
        }
    }

    public isEarpieceIncompatible(helmetTpl: string): boolean {
        return this.headphonesIncompatibleHelmets.includes(helmetTpl);
    }

    public isEarpieceNotFullyCompatible(helmetTpl: string): boolean {
        return this.headphonesNotFullyCompatableHelmets.includes(helmetTpl);
    }
}
