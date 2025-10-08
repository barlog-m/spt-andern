using SPTarkov.Server.Core.Models.Common;
using SPTarkov.Server.Core.Models.Eft.Common.Tables;

namespace BarlogM_Andern;

public class PresetData
{
    public PresetConfig PresetConfig { get; set; } = new();
    public PresetGear PresetGear { get; set; } = new();
    public List<WeaponPreset> Weapon { get; set; } = [];
    public Dictionary<string, string[]> Ammo { get; set; } = new();
    public Dictionary<string, string[]> Modules { get; set; } = new();
}

public class PresetConfig
{
    public int MinLevel { get; set; }
    public int MaxLevel { get; set; }
    public int KittedHelmetPercent { get; set; }
    public int NightVisionPercent { get; set; }

    public MinMax<int> GetMinMax()
    {
        return new MinMax<int>
        {
            Min = MinLevel,
            Max = MaxLevel
        };
    }
}

public class WeaponPreset
{
    public string Id { get; set; }
    public string Name { get; set; }
    public string Root { get; set; }
    public List<Item> Items { get; set; }
    public string Parent { get; set; }
}

public class GeneratedWeapon
{
    public List<Item> WeaponWithMods { get; set; }
    public TemplateItem WeaponTemplate { get; set; }
    public string AmmoTpl { get; set; }
    public string MagazineTpl { get; set; }
}

public class GearItem
{
    public double Weight { get; set; }
    public string Id { get; set; }
    public string Name { get; set; }
}

public class PresetGear
{
    public List<GearItem> Headsets { get; set; }
    public List<GearItem> Helmets { get; set; }
    public List<GearItem> ArmoredRigs { get; set; }
    public List<GearItem> Armor { get; set; }
    public List<GearItem> Rigs { get; set; }
    public List<GearItem> Backpacks { get; set; }
    public List<GearItem> Face { get; set; }
    public List<GearItem> Eyewear { get; set; }
    public List<GearItem> Sheath { get; set; }
    public List<GearItem> ChadMasks { get; set; }
    public List<GearItem> ChadHelmets { get; set; }
    public List<GearItem> ChadArmor { get; set; }
}
