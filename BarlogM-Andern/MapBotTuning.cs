using SPTarkov.Common.Models.Logging;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Helpers.Bot;
using SPTarkov.Server.Core.Models.Spt.Config;
using SPTarkov.Server.Core.Models.Spt.Tables;

namespace BarlogM_Andern;

[Injectable(InjectionType.Singleton,
    TypePriority = OnLoadOrder.PostLoad + 1)]
public class MapBotTuning(
    ISptLogger<MapBotTuning> logger,
    LocationTable locationTable,
    BotConfig botConfig,
    PmcConfig pmcConfig,
    BotHelper botHelper,
    ModData modData
)
    : IOnLoad
{
    private readonly ModConfig _modConfig = modData.ModConfig;

    public Task OnLoadAsync(CancellationToken cancellationToken)
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

        if (_modConfig.MapPmcBrainsAsLive)
        {
            SetPmcBrainsAsLive();
        }

        MapBossChanceAdjustment();

        TunePmcGear();
    }

    private void MapBossChanceAdjustment()
    {
        foreach (var locationId in ModData.ALL_MAPS)
        {
            var location = locationTable.GetLocation(locationId)!;
            foreach (var bossLocationSpawn in location.Base.BossLocationSpawn)
            {
                if (locationId == "labyrinth") continue;
                var bossName = bossLocationSpawn.BossName!.ToLower();
                if (
                    bossName is "pmcusec" or "pmcbear" or "pmcbot"
                    or "crazyassaultevent" or "exusec" or "arenafighterevent"
                )
                {
                    continue;
                }

                if (bossLocationSpawn.BossChance is >= 100 or <= 0)
                {
                    continue;
                }

                var newChance = bossLocationSpawn.BossChance! +
                                modData.ModConfig.MapBossChanceAdjustment;

                var chance = Math.Clamp(Math.Round(newChance.Value), 0, 100);

                if (_modConfig.MapBossPartisanDisable &&
                    bossName == "bosspartisan")
                {
                    chance = 0;
                }

                if (bossName == "bossknight")
                {
                    if (_modConfig.MapBossGoonsDisable)
                    {
                        chance = 0;
                        botConfig.GoonSpawnSystem.SpawnChance = 0;
                    }
                    else if (chance >= 100)
                    {
                        botConfig.GoonSpawnSystem.Enabled = false;
                        botConfig.GoonSpawnSystem.SpawnChance = chance;
                    }
                    else
                    {
                        botConfig.GoonSpawnSystem.SpawnChance = chance;
                    } 
                } 

                bossLocationSpawn.BossChance = chance;

                if (_modConfig.Debug)
                {
                    logger.LogWithColor(
                        $"[Andern] '{location.Base.Name}' boss '{bossLocationSpawn.BossName}' chance {bossLocationSpawn.BossChance}",
                        Spectre.Console.Color.Blue);
                }
            }
        }

        if (_modConfig.Debug)
        {
            logger.LogWithColor(
                $"[Andern] BotConfig.GoonSpawnSystem.Enabled = {botConfig.GoonSpawnSystem.Enabled}",
                Spectre.Console.Color.Blue);
            logger.LogWithColor(
                $"[Andern] BotConfig.GoonSpawnSystem.SpawnChance = {botConfig.GoonSpawnSystem.SpawnChance}",
                Spectre.Console.Color.Blue);
        }
    }

    private void SetPmcBrainsAsLive()
    {
        foreach (var locationName in ModData.ALL_MAPS)
        {
            var usecType = pmcConfig.PmcType["pmcusec"][locationName];
            usecType.Clear();
            usecType.Add("pmcUSEC", 1);

            var bearType = pmcConfig.PmcType["pmcbear"][locationName];
            bearType.Clear();
            bearType.Add("pmcBEAR", 1);
        }
    }

    private void MakePmcAlwaysHostile()
    {
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
        foreach (var hostilitySettingChancedEnemy in hostilitySetting
                     .ChancedEnemies!)
        {
            hostilitySettingChancedEnemy.EnemyChance = 100;
        }
    }

    private void TuneScavs()
    {
        var assaultJson = botHelper.GetBotTemplate("assault")!;
        var equipmentChances = assaultJson.BotChances.EquipmentChances;

        var modConfig = modData.ModConfig;

        if (modConfig.MapScavsAlwaysHasArmor)
        {
            botConfig.Equipment["assault"]!.ForceOnlyArmoredRigWhenNoArmor =
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
        botConfig.Equipment["pmc"]!.ForceOnlyArmoredRigWhenNoArmor = true;

        foreach (var randomisationDetailse in botConfig.Equipment["pmc"]!
                     .Randomisation!)
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
