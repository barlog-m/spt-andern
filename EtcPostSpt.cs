using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Models.Common;
using SPTarkov.Server.Core.Models.Enums;
using SPTarkov.Server.Core.Models.Spt.Config;
using SPTarkov.Server.Core.Models.Utils;
using SPTarkov.Server.Core.Servers;
using SPTarkov.Server.Core.Services;

namespace BarlogM_Andern;

[Injectable(InjectionType.Singleton,
    TypePriority = OnLoadOrder.PostSptModLoader + 1)]
public class EtcPostSpt(
    ISptLogger<EtcPostSpt> logger,
    DatabaseService databaseService,
    ConfigServer configServer,
    ModData modData,
    SeasonRandomizer seasonRandomizer
)
    : IOnLoad
{
    private readonly ModConfig _modConfig = modData.ModConfig;

    public Task OnLoad()
    {
        SetMinFleaLevel();

        if (_modConfig.PlayerScavAlwaysHasBackpack)
        {
            playerScavAlwaysHasBackpack();
        }

        if (_modConfig.EmissaryPmcBotsDisable)
        {
            EmissaryPmcBotsDisable();
        }

        if (_modConfig.InsuranceOnLab)
        {
            InsuranceOnLab();
        }

        if (_modConfig.InsuranceReturnsNothing)
        {
            InsuranceReturnNothing();
        }

        InsuranceTune();

        if (_modConfig.PmcBackpackWeaponDisable)
        {
            PmcBackpackWeaponDisable();
        }

        seasonRandomizer.RandimizeSeason();

        return Task.CompletedTask;
    }

    private void PmcBackpackWeaponDisable()
    {
        var pmcConfig = configServer.GetConfig<PmcConfig>();
        pmcConfig.LooseWeaponInBackpackChancePercent = 0;
        pmcConfig.LooseWeaponInBackpackLootMinMax = new MinMax<int>(0, 0);
    }

    private void InsuranceReturnNothing()
    {
        var insuranceConfig = configServer.GetConfig<InsuranceConfig>();
        foreach (var traderId in insuranceConfig.ReturnChancePercent.Keys)
        {
            insuranceConfig.ReturnChancePercent[traderId] = 0;
        }
    }

    private void InsuranceTune()
    {
        var prapor = databaseService.GetTrader(Traders.PRAPOR);
        var therapist = databaseService.GetTrader(Traders.THERAPIST);

        if (_modConfig.InsuranceDecreaseReturnTime)
        {
            prapor.Base.Insurance.MinReturnHour = 2;
            prapor.Base.Insurance.MaxReturnHour = 3;

            therapist.Base.Insurance.MinReturnHour = 1;
            therapist.Base.Insurance.MaxReturnHour = 2;
        }

        if (_modConfig.InsuranceIncreaseStorageTime)
        {
            prapor.Base.Insurance.MaxStorageTime = 336;
            therapist.Base.Insurance.MaxStorageTime = 336;
        }
    }

    private void SetMinFleaLevel()
    {
        databaseService.GetGlobals().Configuration.RagFair.MinUserLevel =
            modData.ModConfig.FleaMinUserLevel;
    }

    private void InsuranceOnLab()
    {
        var lab = databaseService.GetLocation("laboratory");
        lab.Base.Insurance = true;
    }

    private void EmissaryPmcBotsDisable()
    {
        var pmcConfig = configServer.GetConfig<PmcConfig>();
        foreach (var memberCategory in pmcConfig.AccountTypeWeight.Keys)
        {
            pmcConfig.AccountTypeWeight[memberCategory] = 0;
        }
        pmcConfig.AccountTypeWeight[MemberCategory.Default] = 25;
    }

    private void playerScavAlwaysHasBackpack()
    {
        var playerScavConfig = configServer.GetConfig<PlayerScavConfig>();
        foreach (var keyValuePair in playerScavConfig.KarmaLevel)
        {
            keyValuePair.Value.Modifiers.Equipment["Backpack"] = 100;
        }
    }
}
