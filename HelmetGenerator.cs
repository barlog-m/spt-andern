using System.Collections.Frozen;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.Models.Common;
using SPTarkov.Server.Core.Models.Eft.Common.Tables;
using SPTarkov.Server.Core.Models.Enums;
using SPTarkov.Server.Core.Models.Utils;
using SPTarkov.Server.Core.Utils;

namespace BarlogM_Andern;

[Injectable]
public class HelmetGenerator(
    ISptLogger<HelmetGenerator> logger,
    RandomUtil randomUtil,
    GearGeneratorHelper gearGeneratorHelper
)
{
    const string ALTYN_HELMET = "5aa7e276e5b5b000171d0647";
    const string RYS_HELMET = "5f60c74e3b85f6263c145586";
    const string MASKA_OLIVE_HELMET = "5c091a4e0db834001d5addc8";
    const string MASKA_KILLA_HELMET = "5c0e874186f7745dc7616606";
    const string VULKAN_HELMET = "5ca20ee186f774799474abc2";
    const string LSHZ_2DTM_HELMET = "5d6d3716a4b9361bc8618872";

    const string AIRFRAME_HELMET = "5c17a7ed2e2216152142459c";
    const string CAIMAN_HYBRID_HELMET = "5f60b34a41e30a4ab12a6947";

    const string _6B47_RATNIK_BSH_HELMET = "5a7c4850e899ef00150be885";
    const string _6B47_RATNIK_BSH_HELMET_DIGITAL = "5aa7cfc0e5b5b00015693143";

    const string LSHZ_LIGHT_HELMET = "5b432d215acfc4771e1c6624";

    const string TC_2001_HELMET = "5d5e7d28a4b936645d161203";
    const string TC_2002_HELMET = "5d5e9c74a4b9364855191c40";

    const string EXFIL_BLACK_HELMET = "5e00c1ad86f774747333222c";
    const string EXFIL_EAR_COVERS_BLACK = "5e00cfa786f77469dc6e5685";
    const string EXFIL_FACE_SHIELD_BLACK = "5e00cdd986f7747473332240";
    const string EXFIL_BROWN_HELMET = "5e01ef6886f77445f643baa4";
    const string EXFIL_EAR_COVERS_BROWN = "5e01f31d86f77465cf261343";
    const string EXFIL_FACE_SHIELD_BROWN = "5e01f37686f774773c6f6c15";

    const string HJELM_HELMET = "61bca7cda0eae612383adf57";
    const string TC800_HELMET = "5e4bfc1586f774264f7582d3";

    const string BASTION_HELMET = "5ea17ca01412a1425304d1c0";
    const string BASTION_ARMOR_PLATE = "5ea18c84ecf1982c7712d9a2";

    const string FAST_TAN_HELMET = "5ac8d6885acfc400180ae7b0";
    const string FAST_BLACK_HELMET = "5a154d5cfcdbcb001a3b00da";
    const string FAST_BALLISTIC_FACE_SHIELD = "5a16b7e1fcdbcb00165aa6c9";
    const string FAST_SIDE_ARMOR = "5a16badafcdbcb001865f72d";
    const string FAST_SLAAP_HELMET_PLATE = "5c0e66e2d174af02a96252f4";
    const string FAST_GUNSIGHT_MANDIBLE = "5a16ba61fcdbcb098008728a";

    const string HEAVY_TROOPER_MASK = "5ea058e01dbce517f324b3e2";

    const string NVG_SLOT_ID = "mod_nvg";
    const string GPNVG_18_NIGHT_VISION_GOGGLES = "5c0558060db834001b735271";

    const string PNV_10T_NIGHT_VISION_GOGGLES = "5c0696830db834001d23f5da";

    const string NOROTOS_TITANIUM_ADVANCED_TACTICAL_MOUNT =
        "5a16b8a9fcdbcb00165aa6ca";

    const string PNV_10T_DOVETAIL_ADAPTER = "5c0695860db834001b735461";

    static readonly FrozenSet<string> HeadphonesIncompatibleHelmets =
    [
        ALTYN_HELMET,
        RYS_HELMET,
        MASKA_OLIVE_HELMET,
        MASKA_KILLA_HELMET,
        VULKAN_HELMET,
        LSHZ_2DTM_HELMET
    ];

    static readonly FrozenSet<string> HeadphonesNotFullyCompatibleHelmets =
    [
        AIRFRAME_HELMET,
        LSHZ_LIGHT_HELMET,
        EXFIL_BLACK_HELMET,
        EXFIL_BROWN_HELMET,
        FAST_BLACK_HELMET,
        FAST_TAN_HELMET
    ];


    static readonly FrozenSet<string> TierTwoNightHelmets =
    [
        _6B47_RATNIK_BSH_HELMET,
        TC_2001_HELMET,
        TC_2002_HELMET,
        TC800_HELMET,
        CAIMAN_HYBRID_HELMET,
        LSHZ_LIGHT_HELMET,
        HJELM_HELMET
    ];

    static readonly FrozenSet<string> TierThreeNightHelmets =
    [
        CAIMAN_HYBRID_HELMET,
        TC800_HELMET,
        BASTION_HELMET,
        TC_2001_HELMET,
        TC_2002_HELMET
    ];

    static readonly FrozenSet<string> TierFourNightHelmets =
    [
        AIRFRAME_HELMET,
        EXFIL_BLACK_HELMET,
        EXFIL_BROWN_HELMET,
        FAST_TAN_HELMET,
        FAST_BLACK_HELMET
    ];

    public void GenerateHelmet(
        int botLevel,
        string botRole,
        BotBaseInventory botInventory,
        string tpl,
        bool isNightVision,
        bool isKittedHelmet)
    {
        if (isNightVision)
            tpl = SelectNightHelmet(botLevel);

        switch (tpl)
        {
            case ALTYN_HELMET:
                AltynHelmet(botLevel, botRole, botInventory);
                break;
            case RYS_HELMET:
                RysHelmet(botLevel, botRole, botInventory);
                break;
            case MASKA_OLIVE_HELMET:
                MaskaHelmet(MASKA_OLIVE_HELMET, botLevel, botRole,
                    botInventory);
                break;
            case MASKA_KILLA_HELMET:
                MaskaHelmet(MASKA_KILLA_HELMET, botLevel, botRole,
                    botInventory);
                break;
            case VULKAN_HELMET:
                VulkanHelmet(botLevel, botRole, botInventory);
                break;
            case LSHZ_2DTM_HELMET:
                Lshz2dtmHelmet(botLevel, botRole, botInventory, isKittedHelmet);
                break;
            case AIRFRAME_HELMET:
                AirFrameHelmet(botLevel, botRole, botInventory, isNightVision,
                    isKittedHelmet);
                break;
            case CAIMAN_HYBRID_HELMET:
                CaimanHybridHelmet(botLevel, botRole, botInventory,
                    isNightVision, isKittedHelmet);
                break;
            case _6B47_RATNIK_BSH_HELMET:
                RatnikBshHelmet(_6B47_RATNIK_BSH_HELMET, botLevel, botRole,
                    botInventory, isNightVision);
                break;
            case _6B47_RATNIK_BSH_HELMET_DIGITAL:
                RatnikBshHelmet(_6B47_RATNIK_BSH_HELMET_DIGITAL, botLevel,
                    botRole, botInventory, isNightVision);
                break;
            case LSHZ_LIGHT_HELMET:
                LshzLightHelmet(botLevel, botRole, botInventory, isNightVision,
                    isKittedHelmet);
                break;
            case TC_2001_HELMET:
                Tc200xHelmet(TC_2001_HELMET, botLevel, botRole, botInventory,
                    isNightVision, isKittedHelmet);
                break;
            case TC_2002_HELMET:
                Tc200xHelmet(TC_2002_HELMET, botLevel, botRole, botInventory,
                    isNightVision, isKittedHelmet);
                break;
            case EXFIL_BLACK_HELMET:
                ExfilBlackHelmet(botLevel, botRole, botInventory, isNightVision,
                    isKittedHelmet);
                break;
            case EXFIL_BROWN_HELMET:
                ExfilBrownHelmet(botLevel, botRole, botInventory, isNightVision,
                    isKittedHelmet);
                break;
            case HJELM_HELMET:
                HjelmHelmet(botLevel, botRole, botInventory, isNightVision,
                    isKittedHelmet);
                break;
            case TC800_HELMET:
                Tc800Helmet(botLevel, botRole, botInventory, isNightVision,
                    isKittedHelmet);
                break;
            case BASTION_HELMET:
                BastionHelmet(botLevel, botRole, botInventory, isNightVision,
                    isKittedHelmet);
                break;
            case FAST_TAN_HELMET:
                FastHelmet(FAST_TAN_HELMET, botLevel, botRole, botInventory,
                    isNightVision, isKittedHelmet);
                break;
            case FAST_BLACK_HELMET:
                FastHelmet(FAST_BLACK_HELMET, botLevel, botRole, botInventory,
                    isNightVision, isKittedHelmet);
                break;
            default:
                AnyOtherHelmet(tpl, botLevel, botRole, botInventory);
                break;
        }
    }

    private void AnyOtherHelmet(
        string tpl,
        int botLevel,
        string botRole,
        BotBaseInventory botInventory)
    {
        gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.Headwear,
            botRole,
            botInventory,
            tpl);
    }

    private void AltynHelmet(
        int botLevel,
        string botRole,
        BotBaseInventory botInventory)
    {
        const string ALTYN_FACE_SHIELD = "5aa7e373e5b5b000137b76f0";

        var helmetItem = gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.Headwear,
            botRole,
            botInventory,
            ALTYN_HELMET);

        gearGeneratorHelper.PutModItemToInventory(
            botRole,
            botInventory,
            ALTYN_FACE_SHIELD,
            "mod_equipment",
            helmetItem.Id);
    }

    private void RysHelmet(
        int botLevel,
        string botRole,
        BotBaseInventory botInventory)
    {
        const string RYS_FACE_SHIELD = "5f60c85b58eff926626a60f7";

        var helmetItem = gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.Headwear,
            botRole,
            botInventory,
            RYS_HELMET);

        gearGeneratorHelper.PutModItemToInventory(
            botRole,
            botInventory,
            RYS_FACE_SHIELD,
            "mod_equipment",
            helmetItem.Id);
    }

    private void MaskaHelmet(
        string helmetTpl,
        int botLevel,
        string botRole,
        BotBaseInventory botInventory)
    {
        const string MASKA_OLIVE_FACE_SHIELD = "5c0919b50db834001b7ce3b9";
        const string MASKA_KILLA_FACE_SHIELD = "5c0e842486f77443a74d2976";

        var faceShieldTpl = helmetTpl == MASKA_OLIVE_HELMET
            ? MASKA_OLIVE_FACE_SHIELD
            : MASKA_KILLA_FACE_SHIELD;

        var helmetItem = gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.Headwear,
            botRole,
            botInventory,
            helmetTpl);

        gearGeneratorHelper.PutModItemToInventory(
            botRole,
            botInventory,
            faceShieldTpl,
            "mod_equipment",
            helmetItem.Id);
    }

    private void VulkanHelmet(
        int botLevel,
        string botRole,
        BotBaseInventory botInventory)
    {
        const string VULKAN_FACE_SHIELD = "5ca2113f86f7740b2547e1d2";

        var helmetItem = gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.Headwear,
            botRole,
            botInventory,
            VULKAN_HELMET);

        gearGeneratorHelper.PutModItemToInventory(
            botRole,
            botInventory,
            VULKAN_FACE_SHIELD,
            "mod_equipment",
            helmetItem.Id);
    }

    private void Lshz2dtmHelmet(
        int botLevel,
        string botRole,
        BotBaseInventory botInventory,
        bool isKittedHelmet)
    {
        const string LSHZ_2DTM_FACE_SHIELD = "5d6d3829a4b9361bc8618943";
        const string LSHZ_2DTM_AVENTAIL = "5d6d3be5a4b9361bc73bc763";
        const string LSHZ_2DTM_COVER = "5d6d3943a4b9360dbc46d0cc";

        var helmetItem = gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.Headwear,
            botRole,
            botInventory,
            LSHZ_2DTM_HELMET);

        if (isKittedHelmet)
        {
            gearGeneratorHelper.PutModItemToInventory(
                botRole,
                botInventory,
                LSHZ_2DTM_FACE_SHIELD,
                "mod_equipment_000",
                helmetItem.Id);

            gearGeneratorHelper.PutModItemToInventory(
                botRole,
                botInventory,
                LSHZ_2DTM_AVENTAIL,
                "mod_equipment_001",
                helmetItem.Id);

            gearGeneratorHelper.PutModItemToInventory(
                botRole,
                botInventory,
                LSHZ_2DTM_COVER,
                "mod_equipment_002",
                helmetItem.Id);
        }
    }

    private void AirFrameHelmet(
        int botLevel,
        string botRole,
        BotBaseInventory botInventory,
        bool isNightVision,
        bool isKittedHelmet)
    {
        var helmetItem = gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.Headwear,
            botRole,
            botInventory,
            AIRFRAME_HELMET);

        if (isKittedHelmet)
        {
            const string AIRFRAME_CHOPS = "5c178a942e22164bef5ceca3";
            gearGeneratorHelper.PutModItemToInventory(
                botRole,
                botInventory,
                AIRFRAME_CHOPS,
                "mod_equipment_001",
                helmetItem.Id);
        }

        if (isNightVision)
            GenerateNvg(botLevel, botRole, botInventory, helmetItem.Id);
        else if (isKittedHelmet)
            gearGeneratorHelper.PutModItemToInventory(
                botRole,
                botInventory,
                FAST_BALLISTIC_FACE_SHIELD,
                "mod_equipment_000",
                helmetItem.Id);
    }

    private void CaimanHybridHelmet(
        int botLevel,
        string botRole,
        BotBaseInventory botInventory,
        bool isNightVision,
        bool isKittedHelmet)
    {
        var helmetItem = gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.Headwear,
            botRole,
            botInventory,
            CAIMAN_HYBRID_HELMET);

        if (isKittedHelmet)
        {
            const string CAIMAN_BALLISTIC_MANDIBLE_GUARD =
                "5f60c076f2bcbb675b00dac2";
            gearGeneratorHelper.PutModItemToInventory(
                botRole,
                botInventory,
                CAIMAN_BALLISTIC_MANDIBLE_GUARD,
                "mod_equipment_000",
                helmetItem.Id);

            const string CAIMAN_BALLISTIC_APPLIQUE = "5f60b85bbdb8e27dee3dc985";
            gearGeneratorHelper.PutModItemToInventory(
                botRole,
                botInventory,
                CAIMAN_BALLISTIC_APPLIQUE,
                "mod_equipment_002",
                helmetItem.Id);
        }

        if (isNightVision)
            GenerateNvg(botLevel, botRole, botInventory, helmetItem.Id);
        else if (isKittedHelmet)
        {
            const string CAIMAN_FIXED_ARM_VISOR = "5f60bf4558eff926626a60f2";
            gearGeneratorHelper.PutModItemToInventory(
                botRole,
                botInventory,
                CAIMAN_FIXED_ARM_VISOR,
                NVG_SLOT_ID,
                helmetItem.Id);
        }
    }

    private void RatnikBshHelmet(
        string helmetTpl,
        int botLevel,
        string botRole,
        BotBaseInventory botInventory,
        bool isNightVision)
    {
        var helmetItem = gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.Headwear,
            botRole,
            botInventory,
            helmetTpl);

        if (isNightVision)
            GenerateNvg(botLevel, botRole, botInventory, helmetItem.Id);
    }

    private void LshzLightHelmet(
        int botLevel,
        string botRole,
        BotBaseInventory botInventory,
        bool isNightVision,
        bool isKittedHelmet)
    {
        var helmetItem = gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.Headwear,
            botRole,
            botInventory,
            LSHZ_LIGHT_HELMET);

        if (!isNightVision && isKittedHelmet)
        {
            gearGeneratorHelper.PutModItemToInventory(
                botRole,
                botInventory,
                FAST_BALLISTIC_FACE_SHIELD,
                NVG_SLOT_ID,
                helmetItem.Id);
            return;
        }

        if (isKittedHelmet)
        {
            var sideArmorId = gearGeneratorHelper.PutModItemToInventory(
                botRole,
                botInventory,
                FAST_SIDE_ARMOR,
                "mod_equipment_000",
                helmetItem.Id);

            if (randomUtil.GetBool())
            {
                var maskId = gearGeneratorHelper.PutModItemToInventory(
                    botRole,
                    botInventory,
                    HEAVY_TROOPER_MASK,
                    NVG_SLOT_ID,
                    helmetItem.Id);

                if (isNightVision)
                    GenerateNvg(botLevel, botRole, botInventory, maskId);
            }
            else
            {
                gearGeneratorHelper.PutModItemToInventory(
                    botRole,
                    botInventory,
                    FAST_GUNSIGHT_MANDIBLE,
                    "mod_equipment",
                    sideArmorId);

                if (isNightVision)
                    GenerateNvg(botLevel, botRole, botInventory, helmetItem.Id);
            }
        }
        else if (isNightVision)
            GenerateNvg(botLevel, botRole, botInventory, helmetItem.Id);
    }

    private void Tc200xHelmet(
        string helmetTpl,
        int botLevel,
        string botRole,
        BotBaseInventory botInventory,
        bool isNightVision,
        bool isKittedHelmet)
    {
        var helmetItem = gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.Headwear,
            botRole,
            botInventory,
            helmetTpl);

        if (isKittedHelmet)
            gearGeneratorHelper.PutModItemToInventory(
                botRole,
                botInventory,
                FAST_SLAAP_HELMET_PLATE,
                "mod_equipment_002",
                helmetItem.Id);

        if (isNightVision)
            GenerateNvg(botLevel, botRole, botInventory, helmetItem.Id);
    }

    private void ExfilBlackHelmet(
        int botLevel,
        string botRole,
        BotBaseInventory botInventory,
        bool isNightVision,
        bool isKittedHelmet)
    {
        var helmetItem = gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.Headwear,
            botRole,
            botInventory,
            EXFIL_BLACK_HELMET);

        if (isKittedHelmet)
            gearGeneratorHelper.PutModItemToInventory(
                botRole,
                botInventory,
                EXFIL_EAR_COVERS_BLACK,
                "mod_equipment_000",
                helmetItem.Id);

        if (isNightVision)
            GenerateNvg(botLevel, botRole, botInventory, helmetItem.Id);
        else if (isKittedHelmet)
        {
            string faceShieldId = randomUtil.GetBool()
                ? EXFIL_FACE_SHIELD_BLACK
                : EXFIL_FACE_SHIELD_BROWN;
            gearGeneratorHelper.PutModItemToInventory(
                botRole,
                botInventory,
                faceShieldId,
                "mod_equipment_001",
                helmetItem.Id);
        }
    }

    private void ExfilBrownHelmet(
        int botLevel,
        string botRole,
        BotBaseInventory botInventory,
        bool isNightVision,
        bool isKittedHelmet)
    {
        var helmetItem = gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.Headwear,
            botRole,
            botInventory,
            EXFIL_BROWN_HELMET);

        if (isKittedHelmet)
            gearGeneratorHelper.PutModItemToInventory(
                botRole,
                botInventory,
                EXFIL_EAR_COVERS_BROWN,
                "mod_equipment_000",
                helmetItem.Id);

        if (isNightVision)
            GenerateNvg(botLevel, botRole, botInventory, helmetItem.Id);
    }

    private void HjelmHelmet(
        int botLevel,
        string botRole,
        BotBaseInventory botInventory,
        bool isNightVision,
        bool isKittedHelmet)
    {
        var helmetItem = gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.Headwear,
            botRole,
            botInventory,
            HJELM_HELMET);

        if (isNightVision)
            GenerateNvg(botLevel, botRole, botInventory, helmetItem.Id);
        else if (isKittedHelmet)
            gearGeneratorHelper.PutModItemToInventory(
                botRole,
                botInventory,
                FAST_BALLISTIC_FACE_SHIELD,
                "mod_equipment_000",
                helmetItem.Id);
    }

    private void Tc800Helmet(
        int botLevel,
        string botRole,
        BotBaseInventory botInventory,
        bool isNightVision,
        bool isKittedHelmet)
    {
        var helmetItem = gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.Headwear,
            botRole,
            botInventory,
            TC800_HELMET);

        if (isNightVision)
            GenerateNvg(botLevel, botRole, botInventory, helmetItem.Id);
        else if (isKittedHelmet)
            gearGeneratorHelper.PutModItemToInventory(
                botRole,
                botInventory,
                FAST_BALLISTIC_FACE_SHIELD,
                "mod_equipment_000",
                helmetItem.Id);
    }

    private void BastionHelmet(
        int botLevel,
        string botRole,
        BotBaseInventory botInventory,
        bool isNightVision,
        bool isKittedHelmet)
    {
        var helmetItem = gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.Headwear,
            botRole,
            botInventory,
            BASTION_HELMET);

        if (isKittedHelmet)
        {
            string plateId = gearGeneratorHelper.PutModItemToInventory(
                botRole,
                botInventory,
                BASTION_ARMOR_PLATE,
                NVG_SLOT_ID,
                helmetItem.Id);

            if (isNightVision)
                GenerateNvg(botLevel, botRole, botInventory, plateId);
        }
        else if (isNightVision)
            GenerateNvg(botLevel, botRole, botInventory, helmetItem.Id);
    }

    private void FastHelmet(
        string helmetTpl,
        int botLevel,
        string botRole,
        BotBaseInventory botInventory,
        bool isNightVision,
        bool isKittedHelmet)
    {
        var helmetItem = gearGeneratorHelper.PutGearItemToInventory(
            EquipmentSlots.Headwear,
            botRole,
            botInventory,
            helmetTpl);

        if (!isNightVision && isKittedHelmet && randomUtil.GetBool())
        {
            gearGeneratorHelper.PutModItemToInventory(
                botRole,
                botInventory,
                FAST_BALLISTIC_FACE_SHIELD,
                "mod_equipment_000",
                helmetItem.Id);
            return;
        }

        if (isKittedHelmet)
        {
            string sideArmorId = gearGeneratorHelper.PutModItemToInventory(
                botRole,
                botInventory,
                FAST_SIDE_ARMOR,
                "mod_equipment_000",
                helmetItem.Id);

            if (randomUtil.GetBool())
            {
                string maskId = gearGeneratorHelper.PutModItemToInventory(
                    botRole,
                    botInventory,
                    HEAVY_TROOPER_MASK,
                    NVG_SLOT_ID,
                    helmetItem.Id);

                if (isNightVision)
                    GenerateNvg(botLevel, botRole, botInventory, maskId);
            }
            else
            {
                gearGeneratorHelper.PutModItemToInventory(
                    botRole,
                    botInventory,
                    FAST_GUNSIGHT_MANDIBLE,
                    "mod_equipment",
                    sideArmorId);

                gearGeneratorHelper.PutModItemToInventory(
                    botRole,
                    botInventory,
                    FAST_SLAAP_HELMET_PLATE,
                    "mod_equipment_002",
                    helmetItem.Id);

                if (isNightVision)
                    GenerateNvg(botLevel, botRole, botInventory, helmetItem.Id);
            }
        }
        else if (isNightVision)
            GenerateNvg(botLevel, botRole, botInventory, helmetItem.Id);
    }

    private void GenerateNvg(
        int botLevel,
        string botRole,
        BotBaseInventory botInventory,
        MongoId helmetItemId)
    {
        if (botLevel <= 28)
            GeneratePnvNvg(botRole, botInventory, helmetItemId);
        else
            GenerateGpNvg(botRole, botInventory, helmetItemId);
    }

    private void GeneratePnvNvg(
        string botRole,
        BotBaseInventory botInventory,
        MongoId parentId)
    {
        var mountId = gearGeneratorHelper.PutModItemToInventory(
            botRole,
            botInventory,
            NOROTOS_TITANIUM_ADVANCED_TACTICAL_MOUNT,
            NVG_SLOT_ID,
            parentId);

        var adapterId = gearGeneratorHelper.PutModItemToInventory(
            botRole,
            botInventory,
            PNV_10T_DOVETAIL_ADAPTER,
            NVG_SLOT_ID,
            mountId);

        gearGeneratorHelper.PutModItemToInventory(
            botRole,
            botInventory,
            PNV_10T_NIGHT_VISION_GOGGLES,
            NVG_SLOT_ID,
            adapterId);
    }

    private void GenerateGpNvg(
        string botRole,
        BotBaseInventory botInventory,
        MongoId parentId)
    {
        gearGeneratorHelper.PutModItemToInventory(
            botRole,
            botInventory,
            GPNVG_18_NIGHT_VISION_GOGGLES,
            NVG_SLOT_ID,
            parentId);
    }

    private string TierOneNightHelmet() => _6B47_RATNIK_BSH_HELMET_DIGITAL;

    private string TierTwoNightHelmet()
    {
        return randomUtil.GetArrayValue(TierTwoNightHelmets);
    }

    private string TierThreeNightHelmet()
    {
        return randomUtil.GetArrayValue(TierThreeNightHelmets);
    }

    private string TierFourNightHelmet()
    {
        return randomUtil.GetArrayValue(TierFourNightHelmets);
    }

    private string SelectNightHelmet(int botLevel)
    {
        if (botLevel < 15)
            return TierOneNightHelmet();
        if (botLevel < 32)
            return TierTwoNightHelmet();
        if (botLevel < 42)
            return TierThreeNightHelmet();
        return TierFourNightHelmet();
    }

    public bool IsEarpieceIncompatible(MongoId helmetTpl) =>
        HeadphonesIncompatibleHelmets.Contains(helmetTpl);

    public bool IsEarpieceNotFullyCompatible(MongoId helmetTpl) =>
        HeadphonesNotFullyCompatibleHelmets.Contains(helmetTpl);
}
