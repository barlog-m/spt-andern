using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.Helpers;
using SPTarkov.Server.Core.Models.Common;
using SPTarkov.Server.Core.Models.Eft.Common.Tables;
using SPTarkov.Server.Core.Models.Enums;
using SPTarkov.Server.Core.Models.Spt.Config;
using SPTarkov.Server.Core.Models.Utils;
using SPTarkov.Server.Core.Servers;
using SPTarkov.Server.Core.Services;
using SPTarkov.Server.Core.Utils;

namespace BarlogM_Andern;

[Injectable]
public class WeaponGenerator(
    ISptLogger<WeaponGenerator> logger,
    ConfigServer configServer,
    ItemHelper itemHelper,
    RandomUtil randomUtil,
    RepairService repairService,
    Data data
)
{
    static readonly Dictionary<string, string> MuzzlePairs = new()
    {
        ["6130c43c67085e45ef1405a1"] = "5dfa3d2b0dee1b22f862eade",
        ["618178aa1cb55961fa0fdc80"] = "5a34fe59c4a282000b1521a2",
        ["5a34fd2bc4a282329a73b4c5"] = "5a34fe59c4a282000b1521a2",
        ["5cf78496d7f00c065703d6ca"] = "5cf78720d7f00c06595bc93e",

        //7.62x51 Tier 3
        ["5fbc22ccf24b94483f726483"] = "5fbe760793164a5b6278efc8",
        ["612e0d3767085e45ef14057f"] = "63877c99e785640d436458ea",
        ["5d1f819086f7744b355c219b"] = "5cff9e84d7ad1a049e54ed55",
        ["5dfa3cd1b33c0951220c079b"] = "5dfa3d2b0dee1b22f862eade",
        ["5d443f8fa4b93678dd4a01aa"] = "5d44064fa4b9361e4f6eb8b5",

        //5.56x45 Tier 4
        ["609269c3b0e443224b421cc1"] = "60926df0132d4d12c81fd9df",
        ["6386120cd6baa055ad1e201c"] = "638612b607dfed1ccb7206ba",
        ["626667e87379c44d557b7550"] = "626673016f1edc06f30cf6d5",
        ["5f6372e2865db925d54f3869"] = "5f6339d53ada5942720e2dc3",

        //5.56x45 Tier 3
        ["612e0cfc8004cc50514c2d9e"] = "63877c99e785640d436458ea",
        ["5c7fb51d2e2216001219ce11"] = "5ea17bbc09aa976f2e7a51cd",
        ["5d440625a4b9361eec4ae6c5"] = "5d44064fa4b9361e4f6eb8b5",

        //Tier 2 SilencerCo Hybrid 46
        ["59bffc1f86f77435b128b872"] = "59bffbb386f77435b379b9c2",

        //AK Hexagon Reactor 5.45x39 muzzle brake
        ["615d8f5dd92c473c770212ef"] = "615d8f8567085e45ef1409ca",
    };

    static readonly string magazineSlotId = "mod_magazine";

    static readonly string MK47 = "606587252535c57a13424cfd";
    static readonly string X_47_DRUM = "5cfe8010d7ad1a59283b14c6";
    static readonly string MAGPUL_MOE_CARBINE_RUBBER_BUTTPAD = "58d2912286f7744e27117493";
    static readonly string SIG_SAUER_TAPER_LOK_762X51_300_BLK_MUZZLE_ADAPTER = "5fbc22ccf24b94483f726483";
    static readonly string SIG_SAUER_TWO_PORT_BRAKE_762X51_MUZZLE_BRAKE = "5fbcbd10ab884124df0cd563";
    static readonly string SIG_SAUER_SRD762_QD_762X51_SOUND_SUPPRESSOR = "5fbe760793164a5b6278efc8";
    static readonly string LANTAC_BMD_BLAST_MITIGATION_DEVICE_A3_DIRECT_THREAD_ADAPTER = "5cf78496d7f00c065703d6ca";
    static readonly string AR_10_LANTAC_DRAGON_762X51_MUZZLE_BRAKE_COMPENSATOR = "5c878e9d2e2216000f201903";
    static readonly string LANTAC_BMD_762X51_BLAST_MITIGATION_DEVICE = "5cf78720d7f00c06595bc93e";
    static readonly string ZENIT_KLESCH_2IKS = "5a5f1ce64f39f90b401987bc";
    static readonly int TACTICAL_DEVICE_LIGHT_AND_LASER_MODE = 1;
    static readonly int TACTICAL_DEVICE_LASER_ONLY_MODE = 2;

    readonly PmcConfig PMCConfig = configServer.GetConfig<PmcConfig>();
    readonly RepairConfig RepairConfig = configServer.GetConfig<RepairConfig>();

    string GetTemplateIdFromWeaponItems(List<Item> weaponWithMods)
    {
        return weaponWithMods[0].Template;
    }

    string GetCaliberByTemplateId(string tpl)
    {
        return GetTemplateById(tpl).Properties.AmmoCaliber;
    }

    private TemplateItem GetTemplateById(string tpl)
    {
        return itemHelper.GetItem(tpl).Value;
    }

    string GetWeaponClassByTemplateId(string tpl)
    {
        return GetTemplateById(tpl).Properties.WeapClass;
    }

    EquipmentSlots GetWeaponSlotByWeaponClass(string weaponClass)
    {
        switch (weaponClass)
        {
            case "pistol":
                return EquipmentSlots.Holster;
            default:
                return EquipmentSlots.FirstPrimaryWeapon;
        }
    }

    public Item GetWeaponMagazine(List<Item> weaponWithMods)
    {
        return weaponWithMods.Find(item => item.SlotId == "mod_magazine");
    }

    public void AddCartridgeToChamber(
        List<Item> weaponWithMods,
        string ammoTpl,
        TemplateItem weaponTemplate)
    {
        var chambersAmount = GetChambersAmountFromWeaponTemplate(weaponTemplate);
        var chamberName = GetChamberNameFromWeaponTemplate(weaponTemplate);

        var existingItemWithSlot = weaponWithMods
            .Where(item => item.SlotId.StartsWith(chamberName))
            .ToList();

        if (existingItemWithSlot.Count > 0)
        {
            existingItemWithSlot.ForEach(chamber =>
            {
                chamber.Upd = new Upd { StackObjectsCount = 1 };
                chamber.Template = ammoTpl;
            });
        }
        else
        {
            if (chambersAmount == 1)
            {
                weaponWithMods.Add(new Item
                {
                    Id = new MongoId(),
                    Template = ammoTpl,
                    ParentId = weaponWithMods[0].Id,
                    SlotId = chamberName,
                    Upd = new Upd { StackObjectsCount = 1 }
                });
            }
            else
            {
                for (int chamberNum = 0; chamberNum < chambersAmount; chamberNum++)
                {
                    var SlotIdName = $"{chamberName}_00{chamberNum}";
                    weaponWithMods.Add(new Item
                    {
                        Id = new MongoId(),
                        Template = ammoTpl,
                        ParentId = weaponWithMods[0].Id,
                        SlotId = SlotIdName,
                        Upd = new Upd { StackObjectsCount = 1 }
                    });
                }
            }
        }
    }

    string GetChamberNameFromWeaponTemplate(TemplateItem weaponTemplate)
    {
        const string WEAPON_CHIAPPA_RHINO_50DS_9X33R = "61a4c8884f95bc3b2c5dc96f";
        const string WEAPON_CHIAPPA_RHINO_200DS_9X19 = "624c2e8614da335f1e034d8c";
        const string WEAPON_KBP_RSH_12_127X55 = "633ec7c2a6918cb895019c6c";

        string chamberName = "patron_in_weapon";

        if (
            weaponTemplate.Id == WEAPON_CHIAPPA_RHINO_50DS_9X33R ||
            weaponTemplate.Id == WEAPON_CHIAPPA_RHINO_200DS_9X19 ||
            weaponTemplate.Id == WEAPON_KBP_RSH_12_127X55)
        {
            chamberName = "camora";
        }

        return chamberName;
    }

    string FillMagazine(List<Item> weaponWithMods, string ammoTpl)
    {
        weaponWithMods
            .Where(x => x.SlotId == magazineSlotId)
            .ToList()
            .ForEach(magazine =>
            {
                var magazineTemplate = GetTemplateById(magazine.Template);
                var magazineWithCartridges = new List<Item> { magazine };

                itemHelper.FillMagazineWithCartridge(
                    magazineWithCartridges,
                    magazineTemplate,
                    ammoTpl,
                    1);

                weaponWithMods.Remove(magazine);
                weaponWithMods.AddRange(magazineWithCartridges);
            });

        return "";
    }

    void UpdateWeaponInfo(
        List<Item> weaponWithMods,
        string weaponParentId,
        string weaponTpl,
        bool isNight)
    {
        weaponWithMods[0].SlotId = GetWeaponSlotByWeaponClass(
            GetWeaponClassByTemplateId(weaponTpl)).ToString();
        weaponWithMods[0].ParentId = weaponParentId;

        weaponWithMods[0] = new Item
        {
            Id = weaponWithMods[0].Id,
            Template = weaponWithMods[0].Template,
            ParentId = weaponWithMods[0].ParentId,
            SlotId = weaponWithMods[0].SlotId,
            Upd = weaponWithMods[0].Upd
        };

        if (isNight)
        {
            ReplaceTacticalDevice(weaponWithMods);
        }
        SetTacticalDeviceMode(weaponWithMods);
    }

    public void ReplaceTacticalDevice(List<Item> weaponWithMods)
    {
        foreach (var item in weaponWithMods)
        {
            if (
                item.SlotId.StartsWith("mod_tactical") &&
                itemHelper.IsOfBaseclass(item.Template, BaseClasses.TACTICAL_COMBO))
            {
                item.Template = ZENIT_KLESCH_2IKS;
            }
        }
    }

    public void SetTacticalDeviceMode(List<Item> weaponWithMods)
    {
        foreach (var item in weaponWithMods)
        {
            if (item.SlotId.StartsWith("mod_tactical"))
            {
                if (item.Upd?.Light != null)
                {
                    item.Upd.Light.IsActive = false;
                    item.Upd.Light.SelectedMode = TACTICAL_DEVICE_LASER_ONLY_MODE;
                }
            }
        }
    }

    void AlternateModules(
        int botLevel,
        List<Item> weapon,
        string weaponTpl)
    {
        var deleteMagpulRubberButtpad = false;
        var deleteSigSauerMuzzleParts = false;
        var deleteLantacBmdPart = false;

        for (int i = 0; i < weapon.Count; i++)
        {
            var item = weapon[i];
            var alternativeTpl = data.GetAlternativeModule(botLevel, item.Template);
            if (alternativeTpl != item.Template)
            {
                if (
                    weaponTpl != MK47 &&
                    alternativeTpl != X_47_DRUM)
                {
                    if (
                        item.SlotId == "mod_muzzle" &&
                        item.Template == SIG_SAUER_TAPER_LOK_762X51_300_BLK_MUZZLE_ADAPTER)
                    {
                        deleteSigSauerMuzzleParts = true;
                    }

                    if (
                        item.SlotId == "mod_muzzle" &&
                        item.Template == LANTAC_BMD_BLAST_MITIGATION_DEVICE_A3_DIRECT_THREAD_ADAPTER)
                    {
                        deleteLantacBmdPart = true;
                    }

                    if (item.Template == MAGPUL_MOE_CARBINE_RUBBER_BUTTPAD)
                    {
                        deleteMagpulRubberButtpad = true;
                    }

                    item.Template = alternativeTpl;

                    if (item.SlotId == "mod_muzzle")
                    {
                        AlternateOrAddSuppressor(weapon, item);
                    }
                }
            }
        }

        if (deleteMagpulRubberButtpad)
        {
            DeleteModule(weapon, MAGPUL_MOE_CARBINE_RUBBER_BUTTPAD);
        }

        if (deleteSigSauerMuzzleParts)
        {
            DeleteModule(weapon, SIG_SAUER_TWO_PORT_BRAKE_762X51_MUZZLE_BRAKE);
            DeleteModule(weapon, SIG_SAUER_SRD762_QD_762X51_SOUND_SUPPRESSOR);
        }

        if (deleteLantacBmdPart)
        {
            DeleteModule(weapon, AR_10_LANTAC_DRAGON_762X51_MUZZLE_BRAKE_COMPENSATOR);
            DeleteModule(weapon, LANTAC_BMD_762X51_BLAST_MITIGATION_DEVICE);
        }
    }

    public void AlternateOrAddSuppressor(List<Item> weapon, Item muzzleItem)
    {
        var suppressor = weapon.Find(
            i => i.ParentId == muzzleItem.Id && i.SlotId == "mod_muzzle");

        if (suppressor != null)
        {
            string alternativeSuppressorTpl = MuzzlePairs[muzzleItem.Template];
            if (alternativeSuppressorTpl != null)
            {
                if (
                    alternativeSuppressorTpl ==
                    SIG_SAUER_SRD762_QD_762X51_SOUND_SUPPRESSOR)
                {
                    suppressor.SlotId = "mod_muzzle_001";
                    weapon.Add(new Item
                    {
                        Id = new MongoId(),
                        Template = SIG_SAUER_TWO_PORT_BRAKE_762X51_MUZZLE_BRAKE,
                        ParentId = muzzleItem.Id,
                        SlotId = "mod_muzzle_000"
                    });
                }
                else if (
                    alternativeSuppressorTpl ==
                    LANTAC_BMD_762X51_BLAST_MITIGATION_DEVICE)
                {
                    suppressor.SlotId = "mod_muzzle_001";
                    weapon.Add(new Item
                    {
                        Id = new MongoId(),
                        Template = AR_10_LANTAC_DRAGON_762X51_MUZZLE_BRAKE_COMPENSATOR,
                        ParentId = muzzleItem.Id,
                        SlotId = "mod_muzzle_000"
                    });
                }

                suppressor.Template = MuzzlePairs[muzzleItem.Template];
            }
        }
        else
        {
            if (MuzzlePairs.ContainsKey(muzzleItem.Template))
            {
                var alternativeSuppressorTpl = MuzzlePairs[muzzleItem.Template];
                if (
                    alternativeSuppressorTpl ==
                    SIG_SAUER_SRD762_QD_762X51_SOUND_SUPPRESSOR)
                {
                    ConstructSigSauerSuppressor(weapon, muzzleItem);
                }
                else if (
                    alternativeSuppressorTpl ==
                    LANTAC_BMD_762X51_BLAST_MITIGATION_DEVICE)
                {
                    ConstructLantacBmd(weapon, muzzleItem);
                }
                else
                {
                    Item suppressorItem = new Item
                    {
                        Id = new MongoId(),
                        Template = alternativeSuppressorTpl,
                        ParentId = muzzleItem.Id,
                        SlotId = "mod_muzzle"
                    };
                    weapon.Add(suppressorItem);
                }
            }
        }
    }

    public void DeleteModule(List<Item> weapon, string tpl)
    {
        var i = weapon.FindIndex(item => item.Template == tpl);
        if (i > -1)
        {
            weapon.RemoveAt(i);
        }
    }

    void ConstructSigSauerSuppressor(List<Item> weapon, Item muzzleItem)
    {
        Item muzzleBrakeItem = new Item
        {
            Id = new MongoId(),
            Template = SIG_SAUER_TWO_PORT_BRAKE_762X51_MUZZLE_BRAKE,
            ParentId = muzzleItem.Id,
            SlotId = "mod_muzzle_000"
        };
        weapon.Add(muzzleBrakeItem);

        Item suppressorItem = new Item
        {
            Id = new MongoId(),
            Template = SIG_SAUER_SRD762_QD_762X51_SOUND_SUPPRESSOR,
            ParentId = muzzleItem.Id,
            SlotId = "mod_muzzle_001"
        };
        weapon.Add(suppressorItem);
    }

    void ConstructLantacBmd(List<Item> weapon, Item muzzleItem)
    {
        var muzzleBrakeItem = new Item
        {
            Id = new MongoId(),
            Template = AR_10_LANTAC_DRAGON_762X51_MUZZLE_BRAKE_COMPENSATOR,
            ParentId = muzzleItem.Id,
            SlotId = "mod_muzzle_000"
        };
        weapon.Add(muzzleBrakeItem);

        var suppressorItem = new Item
        {
            Id = new MongoId(),
            Template = LANTAC_BMD_762X51_BLAST_MITIGATION_DEVICE,
            ParentId = muzzleItem.Id,
            SlotId = "mod_muzzle_001"
        };
        weapon.Add(suppressorItem);
    }

    public void AddRandomEnhancement(List<Item> weapon)
    {
        if (randomUtil.GetChance100(PMCConfig.WeaponHasEnhancementChancePercent))
        {
            repairService.AddBuff(RepairConfig.RepairKit.Weapon, weapon[0]);
        }
    }

    int GetChambersAmountFromWeaponTemplate(TemplateItem weaponTemplate)
    {
        return weaponTemplate.Properties.Chambers.Count();
    }

    public GeneratedWeapon GenerateWeapon(
        int botLevel = 0,
        string weaponParentId = "",
        bool isNightVision = false)
    {
        var weaponWithMods = data.GetRandomWeapon(botLevel);
        if (weaponWithMods.Count <= 0)
        {
            logger.Error($"[Andern] GenerateWeapon for bot level {botLevel}");
        }

        var weaponTpl = GetTemplateIdFromWeaponItems(weaponWithMods);

        UpdateWeaponInfo(
            weaponWithMods,
            weaponParentId,
            weaponTpl,
            isNightVision);
        AlternateModules(botLevel, weaponWithMods, weaponTpl);
        SetDefaultScopeZoomValue(weaponWithMods);
        AddRandomEnhancement(weaponWithMods);
        var weaponTemplate = GetTemplateById(weaponTpl);
        var caliber = GetCaliberByTemplateId(weaponTpl);
        var ammoTpl = data.GetRandomAmmoByCaliber(botLevel, caliber);

        AddCartridgeToChamber(weaponWithMods, ammoTpl, weaponTemplate);
        var magazineTpl = FillMagazine(weaponWithMods, ammoTpl);

        return new GeneratedWeapon
        {
            WeaponWithMods = weaponWithMods,
            WeaponTemplate = weaponTemplate,
            AmmoTpl = ammoTpl,
            MagazineTpl = magazineTpl
        };
    }

    private void SetDefaultScopeZoomValue(List<Item> weaponWithMods)
    {
        foreach (var module in weaponWithMods)
        {
            if (itemHelper.IsOfBaseclass(module.Template, BaseClasses.OPTIC_SCOPE) ||
                itemHelper.IsOfBaseclass(module.Template, BaseClasses.ASSAULT_SCOPE))
            {
                module.Upd = new Upd();
                module.Upd.Sight = new UpdSight
                {
                    ScopeZoomValue = 0,
                };
            }
        }
    }
}
