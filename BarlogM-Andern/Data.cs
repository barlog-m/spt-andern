using fastJSON5;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.Extensions;
using SPTarkov.Server.Core.Helpers;
using SPTarkov.Server.Core.Models.Eft.Common.Tables;
using SPTarkov.Server.Core.Models.Logging;
using SPTarkov.Server.Core.Models.Utils;
using SPTarkov.Server.Core.Utils;
using SPTarkov.Server.Core.Utils.Cloners;
using Path = System.IO.Path;

namespace BarlogM_Andern;

[Injectable]
public class Data
{
    readonly ModConfig _modConfig;
    readonly Dictionary<string, PresetData> data = new ();

    readonly ISptLogger<Data> logger;
    readonly ModHelper modHelper;
    readonly RandomUtil randomUtil;
    readonly ICloner cloner;
    readonly ModData modData;

    public Data(ISptLogger<Data> logger, ModHelper modHelper, RandomUtil randomUtil, ICloner cloner, ModData modData)
    {
        this.logger = logger;
        this.modHelper = modHelper;
        this.randomUtil = randomUtil;
        this.modData = modData;
        this.cloner = cloner;
        this._modConfig = modData.ModConfig;

        LoadData();
    }

    private void LoadData()
    {
        var presetDir =
            Path.Join(modData.PathToMod, "presets", _modConfig.Preset);

        if (!Directory.Exists(presetDir))
        {
            logger.Error($"[Andern] preset directory {presetDir} does not exists");
            return;
        }

        foreach (var tierDir in Directory.EnumerateDirectories(presetDir))
        {
            var tierName = Path.GetFileNameWithoutExtension(tierDir);
            var tierData = LoadTierData(tierDir);
            data.Add(tierName, tierData);
        }
    }

    private PresetData LoadTierData(string path)
    {
        var data = new PresetData();
        data.PresetConfig = JSON5.ToObject<PresetConfig>(modHelper.GetRawFileData(path, "config.json5"));
        data.PresetGear = JSON5.ToObject<PresetGear>(modHelper.GetRawFileData(path, "gear.json5"));
        data.Ammo = JSON5.ToObject<Dictionary<string, string[]>>(modHelper.GetRawFileData(path, "ammo.json5"));
        data.Modules = JSON5.ToObject<Dictionary<string, string[]>>(modHelper.GetRawFileData(path, "modules.json5"));

        LoadTierWeaponData(path, data);
        return data;
    }

    private void LoadTierWeaponData(string path, PresetData data)
    {
        foreach (var file in Directory.EnumerateFiles(path))
        {
            var fileName = Path.GetFileName(file);

            if (fileName is "ammo.json5" or "config.json5" or "gear.json5" or "modules.json5") continue;

            var weaponPreset = modHelper.GetJsonDataFromFile<WeaponPreset>(path, fileName);

            data.Weapon.Add(weaponPreset);
        }
    }

    public string TierByLevel(int level)
    {
        foreach (var tier in data.Keys)
        {
            if (level >= data[tier].PresetConfig.MinLevel &&
                level <= data[tier].PresetConfig.MaxLevel)
            {
                return tier;
            }
        }

        return data.First().Key;
    }

    public PresetGear GetGear(int level) {
        var tier = TierByLevel(level);
        return data[tier].PresetGear;
    }

    public string GetAlternativeModule(int level, string moduleTpl)
    {
        var tier = TierByLevel(level);

        if (!data[tier].Modules.ContainsKey(moduleTpl))
        {
            return moduleTpl;
        }

        var altModules = data[tier].Modules[moduleTpl];

        return randomUtil.GetArrayValue(altModules);
    }

    public List<Item> GetRandomWeapon(int level)
    {
        var tier = TierByLevel(level);

        var weaponPreset = randomUtil.GetArrayValue(data[tier].Weapon);

        if (_modConfig.Debug)
        {
            logger.LogWithColor($"[Andern] for bot level {level} selected tier `{tier}` weapon '{weaponPreset.Name}'", LogTextColor.Blue);
        }

        var weaponPresetClone = cloner.Clone(weaponPreset.Items).ReplaceIDs().ToList();
        weaponPresetClone.RemapRootItemId();

        return weaponPresetClone;
    }

    public string GetRandomAmmoByCaliber(int level, string caliber)
    {
        var tier = TierByLevel(level);

        if (!data[tier].Ammo.ContainsKey(caliber))
        {
            logger.Error($"[Andern] no ammo record for tier '{tier}' with caliber '{caliber}'");
            return "";
        }

        var ammo = data[tier].Ammo[caliber];

        return randomUtil.GetArrayValue(ammo);
    }

    public PresetConfig GetConfig(int level)
    {
        var tier = TierByLevel(level);
        return data[tier].PresetConfig;
    }
}
