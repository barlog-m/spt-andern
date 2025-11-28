using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Models.Common;
using SPTarkov.Server.Core.Models.Eft.Common.Tables;
using SPTarkov.Server.Core.Models.Enums;
using SPTarkov.Server.Core.Models.Logging;
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

        if (_modConfig.CheeseQuests)
        {
            CheeseQuests();
        }

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

    private void CheeseQuests()
    {
        var shotySilencer = "5b363dd25acfc4001a598fd2";

        foreach (var (questId, quest) in databaseService.GetTemplates().Quests)
        {
            var questConditions = quest.Conditions.AvailableForFinish
                .Where(questCondition => questCondition.ConditionType == "CounterCreator")
                .ToList();

            foreach (var questCondition in questConditions)
            {
                var questConditionCounters = questCondition.Counter.Conditions
                    .Where(questConditionCounterCondition =>
                        questConditionCounterCondition.ConditionType is "Kills" or "Shots" or "Equipment")
                    .ToList();

                var questConditionCountersToDelete = new List<QuestConditionCounterCondition>();

                foreach (var conditionCounter in questConditionCounters)
                {
                    // if quest required silenced shotgun
                    if (conditionCounter.WeaponModsInclusive != null)
                    {
                        if (conditionCounter.WeaponModsInclusive.Any(subArray => subArray.Contains(shotySilencer)))
                        {
                            ReplaceWithAnySilencedWeapon(conditionCounter);
                            if (_modConfig.Debug)
                            {
                                logger.LogWithColor(
                                    $"[Andern] quest '{quest.QuestName}' condition set to any silenced weapon",
                                    LogTextColor.Blue);
                            }
                        }
                    }

                    // if quest has gear conditions
                    if (conditionCounter.EquipmentInclusive?.Count() > 0)
                    {
                        questConditionCountersToDelete.Add(conditionCounter);
                        if (_modConfig.Debug)
                        {
                            logger.LogWithColor(
                                $"[Andern] quest '{quest.QuestName}' gear condition removed", LogTextColor.Blue);
                        }
                    }

                    if (conditionCounter.Weapon == null) continue;

                    // if quest required bolt action rifle
                    if (conditionCounter.Weapon.Contains("5bfd297f0db834001a669119"))
                    {
                        AddAllDmr(conditionCounter);

                        // if bolty should have suppressor
                        if (conditionCounter.WeaponModsInclusive != null)
                        {
                            if (conditionCounter.WeaponModsInclusive.Any())
                            {
                                ReplaceWithBoltyAndDMRSilencers(conditionCounter);
                            }

                            if (_modConfig.Debug)
                            {
                                logger.LogWithColor(
                                    $"[Andern] quest '{quest.QuestName}' weapon condition expanded to DMR",
                                    LogTextColor.Blue);
                            }
                        }
                    }

                    // if quest required shotgun
                    if (conditionCounter.Weapon.Contains("54491c4f4bdc2db1078b4568"))
                    {
                        conditionCounter.Weapon = null;

                        if (_modConfig.Debug)
                        {
                            logger.LogWithColor(
                                $"[Andern] quest '{quest.QuestName}' weapon condition removed",
                                LogTextColor.Blue);
                        }
                        continue;
                    }

                    // if quest required RPDN
                    if (conditionCounter.Weapon.Contains("65268d8ecb944ff1e90ea385"))
                    {
                        conditionCounter.Weapon = null;
                        conditionCounter.WeaponModsInclusive = null;

                        if (_modConfig.Debug)
                        {
                            logger.LogWithColor(
                                $"[Andern] quest '{quest.QuestName}' weapon condition removed",
                                LogTextColor.Blue);
                        }
                        continue;
                    }

                    // if quest required UZI
                    if (conditionCounter.Weapon.Contains("6680304edadb7aa61d00cef0"))
                    {
                        conditionCounter.WeaponModsInclusive = null;

                        if (_modConfig.Debug)
                        {
                            logger.LogWithColor(
                                $"[Andern] quest '{quest.QuestName}' weapon condition removed",
                                LogTextColor.Blue);
                        }
                    }
                }

                if (questConditionCountersToDelete.Count > 0)
                {
                    questCondition.Counter.Conditions.RemoveAll(item => questConditionCountersToDelete.Contains(item));
                }
            }
        }
    }


    private static readonly HashSet<string> AllDmr =
    [
        "6176aca650224f204c1da3fb",
        "5df8ce05b11454561e39243b",
        "5a367e5dc4a282000e49738f",
        "5aafa857e5b5b00018480968",
        "5c46fbd72e2216398b5a8c9c",
        "5fc22d7c187fea44d52eda44",
        "57838ad32459774a17445cd2",
        "5c501a4d2e221602b412b540",
    ];

    void AddAllDmr(QuestConditionCounterCondition conditionCounter)
    {
        conditionCounter.Weapon!.UnionWith(AllDmr);
    }

    private static readonly List<List<string>> AllSilencers =
    [
        ["59bffc1f86f77435b128b872"],
        ["5a32a064c4a28200741e22de"],
        ["59bffbb386f77435b379b9c2"],
        ["54490a4d4bdc2dbc018b4573"],
        ["5b363dd25acfc4001a598fd2"],
        ["5b363dea5acfc4771e1c5e7e"],
        ["5b363e1b5acfc4771e1c5e80"],
        ["593d489686f7745c6255d58a"],
        ["5a27b6bec4a282000e496f78"],
        ["58aeac1b86f77457c419f475"],
        ["593d490386f7745ee97a1555"],
        ["55d6190f4bdc2d87028b4567"],
        ["59bfc5c886f7743bf6794e62"],
        ["57c44dd02459772d2e0ae249"],
        ["5a0d63621526d8dba31fe3bf"],
        ["5a34fe59c4a282000b1521a2"],
        ["5a9fb739a2750c003215717f"],
        ["5a9fbb84a2750c00137fa685"],
        ["5c4eecc32e221602b412b440"],
        ["57838c962459774a1651ec63"],
        ["5b86a0e586f7745b600ccb23"],
        ["593d493f86f7745e6b2ceb22"],
        ["564caa3d4bdc2d17108b458e"],
        ["57ffb0e42459777d047111c5"],
        ["59fb257e86f7742981561852"],
        ["5c7e8fab2e22165df16b889b"],
        ["5a33a8ebc4a282000c5a950d"],
        ["5a9fbb74a2750c0032157181"],
        ["5a9fbacda2750c00141e080f"],
        ["5c6165902e22160010261b28"],
        ["5abcc328d8ce8700194394f3"],
        ["5c7955c22e221644f31bfd5e"],
        ["5a7ad74e51dfba0015068f45"],
        ["5926d33d86f77410de68ebc0"],
        ["57da93632459771cb65bf83f"],
        ["57dbb57e2459774673234890"],
        ["5ba26ae8d4351e00367f9bdb"],
        ["56e05b06d2720bb2668b4586"],
        ["57f3c8cc2459773ec4480328"],
        ["55d614004bdc2d86028b4568"],
        ["571a28e524597720b4066567"],
        ["59c0ec5b86f77435b128bfca"],
        ["5d3ef698a4b9361182109872"],
        ["5caf187cae92157c28402e43"],
        ["5cebec00d7f00c065c53522a"],
        ["5d44064fa4b9361e4f6eb8b5"],
        ["5cff9e84d7ad1a049e54ed55"],
        ["5cff9e84d7ad1a049e54ed55"],
        ["5a9fbacda2750c00141e080f"],
        ["5a9fbb84a2750c00137fa685"],
        ["593d489686f7745c6255d58a"],
        ["5e208b9842457a4a7a33d074"],
        ["5dfa3cd1b33c0951220c079b"],
        ["5e01ea19e9dc277128008c0b"],
        ["5c7fb51d2e2216001219ce11"],
        ["5fbe7618d6fa9c00c571bb6c"],
        ["5fbe760793164a5b6278efc8"],
        ["5fc4b9b17283c4046c5814d7"],
        ["5f63407e1b231926f2329f15"],
        ["5ea17bbc09aa976f2e7a51cd"],
        ["60926df0132d4d12c81fd9df"],
        ["6171367e1cb55961fa0fdb36"],
        ["6130c4d51cb55961fa0fd49f"],
        ["602a97060ddce744014caf6f"],
        ["5de8f2d5b74cd90030650c72"],
        ["615d8f8567085e45ef1409ca"],
        ["58889c7324597754281f9439"],
        ["62811fa609427b40ab14e765"],
        ["626673016f1edc06f30cf6d5"],
        ["5dfa3d2b0dee1b22f862eade"],
        ["63877c99e785640d436458ea"],
        ["638612b607dfed1ccb7206ba"],
        ["634eba08f69c710e0108d386"],
        ["630f2982cdb9e392db0cbcc7"],
        ["62e2a7138e1ac9380579c122"],
        ["64c196ad26a15b84aa07132f"],
        ["652911e650dc782999054b9d"]
    ];

    void ReplaceWithAnySilencedWeapon(
        QuestConditionCounterCondition conditionCounter)
    {
        conditionCounter.Weapon = null;
        conditionCounter.WeaponModsInclusive = AllSilencers;
    }

    private static readonly List<List<string>> BoltyAndDMRSilencers =
    [
        ["5b86a0e586f7745b600ccb23"],
        ["59bffbb386f77435b379b9c2"],
        ["593d489686f7745c6255d58a"],
        ["5a0d63621526d8dba31fe3bf"],
        ["59fb257e86f7742981561852"],
        ["5a9fbacda2750c00141e080f"],
        ["5a34fe59c4a282000b1521a2"],
        ["5c7955c22e221644f31bfd5e"],
        ["5cff9e84d7ad1a049e54ed55"],
        ["5d44064fa4b9361e4f6eb8b5"],
        ["5e208b9842457a4a7a33d074"],
        ["59fb257e86f7742981561852"],
        ["5dfa3d2b0dee1b22f862eade"],
        ["5c4eecc32e221602b412b440"],
        ["58889c7324597754281f9439"],
        ["5a9fbb74a2750c0032157181"],
        ["5fbe7618d6fa9c00c571bb6c"],
        ["5fbe760793164a5b6278efc8"],
        ["62811fa609427b40ab14e765"],
        ["63877c99e785640d436458ea"],
        ["5a34fe59c4a282000b1521a2"],
        ["5fbe760793164a5b6278efc8"],
        ["63877c99e785640d436458ea"],
        ["5cff9e84d7ad1a049e54ed55"],
        ["5d44064fa4b9361e4f6eb8b5"],
        ["5dfa3d2b0dee1b22f862eade"],
        ["6171367e1cb55961fa0fdb36"],
        ["5fbe7618d6fa9c00c571bb6c"],
        ["5f63407e1b231926f2329f15"],
        ["5e01ea19e9dc277128008c0b"],
    ];

    void ReplaceWithBoltyAndDMRSilencers(
        QuestConditionCounterCondition conditionCounter)
    {
        conditionCounter.WeaponModsInclusive = BoltyAndDMRSilencers;
    }
}
