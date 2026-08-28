using System.Reflection;
using SPTarkov.DI.Annotations;
using SPTarkov.Reflection.Patching;
using SPTarkov.Server.Core.Generators.Bot;
using SPTarkov.Server.Core.Models.Common;
using SPTarkov.Server.Core.Models.Eft.Bot;
using SPTarkov.Server.Core.Models.Eft.Common.Tables;
using SPTarkov.Server.Core.Models.Spt.Bots;
using SPTarkov.Server.Core.Models.Spt.Tables;
using SPTarkov.Server.Core.Utils;

namespace BarlogM_Andern;

[Injectable]
public class BotLevelGeneratorPatch : AbstractPatch
{
    private static GlobalTable _globalTable = default!;
    private static RandomUtil _randomUtil = default!;
    private static ModData _modData = default!;

    public BotLevelGeneratorPatch(GlobalTable globalTable, RandomUtil randomUtil, ModData modData)
    {
        _globalTable = globalTable;
        _randomUtil = randomUtil;
        _modData = modData;
    }

    protected override MethodBase GetTargetMethod()
    {
        return typeof(BotLevelGenerator).GetMethod(nameof(BotLevelGenerator.GenerateBotLevel))
               ?? throw new InvalidOperationException(
                   "Could not find target method BotLevelGenerator.GenerateBotLevel");
    }

    [PatchPrefix]
    public static bool Prefix(
        ref RandomisedBotLevelResult __result,
        MinMax<int> levelDetails,
        BotGenerationDetails botGenerationDetails,
        BotBase bot
        )
    {
        if (!botGenerationDetails.IsPmc)
        {
            return true;
        }

        var modConfig = _modData.ModConfig;

        var pmcBotLevelRange = GetPmcBotLevelRange(modConfig, botGenerationDetails);

        var pmcBotLevel = _randomUtil.GetInt(pmcBotLevelRange.Min, pmcBotLevelRange.Max);

        var expTable = _globalTable.Configuration.Exp.Level
            .ExperienceTable;
        var baseExp = expTable.Take(pmcBotLevel).Sum(entry => entry.Experience);
        var fractionalExp = pmcBotLevel < 99
            ? _randomUtil.GetInt(0, expTable[pmcBotLevel].Experience - 1)
            : 0;

        __result = new RandomisedBotLevelResult
            { Exp = baseExp + fractionalExp, Level = pmcBotLevel };

        return false;
    }

    static MinMax<int> GetPmcBotLevelRange(ModConfig modConfig, BotGenerationDetails botGenerationDetails)
    {
        if (modConfig.UseFixedPmcBotLevelRange)
        {
            return new MinMax<int>(modConfig.PmcBotMinLevel,
                modConfig.PmcBotMaxLevel);
        }

        var playerLevel = botGenerationDetails.PlayerLevel ?? 1;

        var minPmcLevel = playerLevel - modConfig.PmcBotLevelDownDelta;
        var maxPmcLevel = playerLevel + modConfig.PmcBotLevelUpDelta;

        var minLevel = Math.Clamp(minPmcLevel, 1, 99);
        var maxLevel = Math.Clamp(maxPmcLevel, 1, 99);

        return new MinMax<int>(minLevel, maxLevel);
    }
}
