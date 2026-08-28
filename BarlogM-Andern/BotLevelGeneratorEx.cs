using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.Generators.Bot;
using SPTarkov.Server.Core.Models.Common;
using SPTarkov.Server.Core.Models.Eft.Bot;
using SPTarkov.Server.Core.Models.Eft.Common.Tables;
using SPTarkov.Server.Core.Models.Spt.Bots;
using SPTarkov.Server.Core.Models.Spt.Tables;
using SPTarkov.Server.Core.Utils;

namespace BarlogM_Andern;

[Injectable(InjectionType.Scoped)]
public class BotLevelGeneratorEx(
    GlobalTable globalTable,
    RandomUtil randomUtil,
    ModData modData
) : BotLevelGenerator(globalTable, randomUtil)
{
    private readonly ModConfig _modConfig = modData.ModConfig;

    public override RandomisedBotLevelResult GenerateBotLevel(MinMax<int> levelDetails, BotGenerationDetails botGenerationDetails, BotBase bot)
    {
        if (!botGenerationDetails.IsPmc)
        {
            return base.GenerateBotLevel(levelDetails, botGenerationDetails,
                bot);
        }

        var pmcBotLevelRange = GetPmcBotLevelRange(botGenerationDetails);

        var pmcBotLevel =
            randomUtil.GetInt(pmcBotLevelRange.Min, pmcBotLevelRange.Max);

        var expTable = globalTable.Configuration.Exp.Level
            .ExperienceTable;
        var baseExp = expTable.Take(pmcBotLevel).Sum(entry => entry.Experience);
        var fractionalExp = pmcBotLevel < 99
            ? randomUtil.GetInt(0, expTable[pmcBotLevel].Experience - 1)
            : 0;

        return new RandomisedBotLevelResult
            { Exp = baseExp + fractionalExp, Level = pmcBotLevel };
    }

    MinMax<int> GetPmcBotLevelRange(BotGenerationDetails botGenerationDetails)
    {
        if (_modConfig.UseFixedPmcBotLevelRange)
        {
            return new MinMax<int>(_modConfig.PmcBotMinLevel,
                _modConfig.PmcBotMaxLevel);
        }

        var playerLevel = botGenerationDetails.PlayerLevel ?? 1;

        var minPmcLevel = playerLevel - _modConfig.PmcBotLevelDownDelta;
        var maxPmcLevel = playerLevel + _modConfig.PmcBotLevelUpDelta;

        var minLevel = Math.Clamp(minPmcLevel, 1, 99);
        var maxLevel = Math.Clamp(maxPmcLevel, 1, 99);

        return new MinMax<int>(minLevel, maxLevel);
    }
}
