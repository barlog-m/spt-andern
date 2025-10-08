using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Helpers;
using SPTarkov.Server.Core.Models.Logging;
using SPTarkov.Server.Core.Models.Spt.Config;
using SPTarkov.Server.Core.Models.Utils;
using SPTarkov.Server.Core.Servers;
using SPTarkov.Server.Core.Services;

namespace BarlogM_Andern;

[Injectable(InjectionType.Singleton,
    TypePriority = OnLoadOrder.PostDBModLoader + 1)]
public class MapBotTuning(
    ISptLogger<MapBotTuning> logger,
    DatabaseService databaseService,
    ConfigServer configServer,
    BotHelper botHelper,
    ModData modData
)
    : IOnLoad
{
    private readonly ModConfig _modConfig = modData.ModConfig;

    public Task OnLoad()
    {
        if (_modConfig.MapBotSettings)
        {
            TunePmc();
            TuneScavs();
        }

        return Task.CompletedTask;
    }

    private void TunePmc()
    {
        if (_modConfig.MapMakePmcAlwaysHostile)
        {
            MakePmcAlwaysHostile();
        }

        if (_modConfig.MapBotDisablePmcTalkativeness)
        {
            PmcTalkativnessDisable();
        }

        if (_modConfig.MapPmcBrainsAsLive)
        {
            SetPmcBrainsAsLive();
        }

        if (_modConfig.MapBossChanceAdjustment != 0)
        {
            MapBossChanceAdjustment();
        }

        TunePmcGear();
    }

    private void MapBossChanceAdjustment()
    {
        foreach (var locationId in ModData.EftMaps)
        {
            var location = databaseService.GetLocation(locationId);
            foreach (var bossLocationSpawn in location.Base.BossLocationSpawn)
            {
                if (locationId == "labyrinth") continue;
                var bossName = bossLocationSpawn.BossName.ToLower();
                if (
                    bossName is "pmcusec" or "pmcbear" or "pmcbot" or "crazyassaultevent" or "exusec"
                )
                {
                    continue;
                }

                if (bossLocationSpawn.BossChance is >= 100 or <= 0)
                {
                    continue;
                }

                var newChance = bossLocationSpawn.BossChance +
                                modData.ModConfig.MapBossChanceAdjustment;
                    var chance = Math.Round(newChance.Value);
                    if (chance > 100.0) {
                        chance = 100;
                    }
                    if (chance < 0.0) {
                        chance = 0;
                    }
                    bossLocationSpawn.BossChance = chance;

                    if (_modConfig.Debug)
                    {
                        logger.LogWithColor(
                            $"[Andern] '{location.Base.Name}' boss '{bossLocationSpawn.BossName}' chance {bossLocationSpawn.BossChance}",
                            LogTextColor.Blue);
                    }
            }
        }
    }

    private void SetPmcBrainsAsLive()
    {
        var pmcConfig = configServer.GetConfig<PmcConfig>();

        foreach (var locationName in ModData.EftMaps)
        {
            var usecType = pmcConfig.PmcType["pmcusec"][locationName];
            usecType.Clear();
            usecType.Add("pmcUSEC", 1);

            var bearType = pmcConfig.PmcType["pmcbear"][locationName];
            bearType.Clear();
            bearType.Add("pmcBEAR", 1);
        }

    }

    private void PmcTalkativnessDisable()
    {
        PmcTalkativnessTune("pmcusec");
        PmcTalkativnessTune("pmcbear");
    }

    private void PmcTalkativnessTune(string type)
    {
        var botType = databaseService.GetBots().Types[type];

        botType.BotDifficulty["normal"].Mind.CanTalk = false;
        botType.BotDifficulty["normal"].Mind.TalkWithQuery = false;

        botType.BotDifficulty["hard"].Mind.CanTalk = false;
        botType.BotDifficulty["hard"].Mind.TalkWithQuery = false;

        botType.BotDifficulty["impossible"].Mind.CanTalk = false;
        botType.BotDifficulty["impossible"].Mind.TalkWithQuery = false;
    }

    private void MakePmcAlwaysHostile()
    {
        var pmcConfig = configServer.GetConfig<PmcConfig>();
        PmcHostilitySettings(pmcConfig.HostilitySettings["pmcusec"]);
        PmcHostilitySettings(pmcConfig.HostilitySettings["pmcbear"]);
    }

    private void PmcHostilitySettings(
        HostilitySettings hostilitySetting)
    {
        hostilitySetting.BearEnemyChance = 100;
        hostilitySetting.UsecEnemyChance = 100;
        hostilitySetting.SavageEnemyChance = 100;
        hostilitySetting.SavagePlayerBehaviour = "AlwaysEnemies";
        foreach (var hostilitySettingChancedEnemy in hostilitySetting.ChancedEnemies)
        {
            hostilitySettingChancedEnemy.EnemyChance = 100;
        }
    }

    private void TuneScavs()
    {
        var botConfig = configServer.GetConfig<BotConfig>();
        var assaultJson = botHelper.GetBotTemplate("assault");
        var equipmentChances = assaultJson.BotChances.EquipmentChances;

        var modConfig = modData.ModConfig;

        if (modConfig.MapScavsAlwaysHasArmor)
        {
            botConfig.Equipment["assault"].ForceOnlyArmoredRigWhenNoArmor =
                true;
            equipmentChances["ArmorVest"] = 100;
        }

        if (modConfig.MapScavsAlwaysHasBackpack)
        {
            equipmentChances["Backpack"] = 100;
        }

        if (modConfig.MapScavsAlwaysHasHeadwear)
        {
            equipmentChances["Headwear"] = 100;
        }

        if (modConfig.MapPlayerScavsBossBrainsOff)
        {
            foreach (var map in botConfig.PlayerScavBrainType.Keys)
            {
                botConfig.PlayerScavBrainType[map] = [];
                botConfig.PlayerScavBrainType[map].Add("pmcBot", 1);
            }
        }
    }

    private void TunePmcGear()
    {
        var botConfig = configServer.GetConfig<BotConfig>();
        botConfig.Equipment["pmc"].ForceOnlyArmoredRigWhenNoArmor = true;

        foreach (var randomisationDetailse in botConfig.Equipment["pmc"].Randomisation)
        {
            randomisationDetailse.Equipment["Backpack"] = 100;
            randomisationDetailse.Equipment["Earpiece"] = 100;
            randomisationDetailse.Equipment["Eyewear"] = 100;
            randomisationDetailse.Equipment["FaceCover"] = 100;
            randomisationDetailse.Equipment["FirstPrimaryWeapon"] = 100;
            randomisationDetailse.Equipment["Holster"] = 80;
            randomisationDetailse.Equipment["SecondPrimaryWeapon"] = 40;

            randomisationDetailse.EquipmentMods["back_plate"] = 100;
            randomisationDetailse.EquipmentMods["left_side_plate"] = 100;
            randomisationDetailse.EquipmentMods["right_side_plate"] = 100;
        }
    }
}
