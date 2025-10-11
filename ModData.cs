using System.Collections.Frozen;
using System.Reflection;
using fastJSON5;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.Helpers;
using SPTarkov.Server.Core.Models.Common;
using SPTarkov.Server.Core.Models.Utils;

namespace BarlogM_Andern;

[Injectable]
public class ModData
{
    public readonly ModConfig ModConfig;
    public readonly string PathToMod;

    static readonly FrozenSet<string> _excludedMaps =
        ["develop", "hideout", "privatearea", "suburbs", "terminal", "town"];

    public static readonly FrozenSet<string> AllMaps =
    [
        "bigmap",
        "factory4_day",
        "factory4_night",
        "interchange",
        "laboratory",
        "lighthouse",
        "rezervbase",
        "shoreline",
        "tarkovstreets",
        "labyrinth",
        "woods",
        "sandbox",
        "sandbox_high"
    ];

    public static readonly MongoId LegaMedalId = new("6656560053eaaa7a23349c86");

    public ModData(ISptLogger<ModData> logger, ModHelper modHelper)
    {
        PathToMod =
            modHelper.GetAbsolutePathToModFolder(Assembly.GetExecutingAssembly());

        var pathToConfig = Path.Join(PathToMod, "config");
        ModConfig = JSON5.ToObject<ModConfig>(modHelper.GetRawFileData(pathToConfig, "config.json5"));
    }

    public bool IsMapExclueded(string mapName)
    {
        return _excludedMaps.Contains(mapName.ToLower());
    }
}
