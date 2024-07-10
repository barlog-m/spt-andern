import {DependencyContainer} from "tsyringe";
import {DatabaseServer} from "@spt/servers/DatabaseServer";
import {
    IQuestConditionCounterCondition
} from "@spt/models/eft/common/tables/IQuest";
import * as config from "../config/config.json";
import {ILogger} from "@spt/models/spt/utils/ILogger";

export default function cheeseQuests(
    container: DependencyContainer
): undefined {
    const logger = container.resolve<ILogger>("WinstonLogger");
    const databaseServer: DatabaseServer =
        container.resolve<DatabaseServer>("DatabaseServer");
    const tables = databaseServer.getTables();
    const shotySilencerArray = ["5b363dd25acfc4001a598fd2"];

    Object.entries(tables.templates.quests).forEach(([questId, quest]) => {
        const questConditions = quest.conditions.AvailableForFinish.filter(
            (questCondition) => questCondition.conditionType === "CounterCreator"
        );

        if (questConditions !== undefined) {
            questConditions.forEach((questCondition) => {
                const questConditionCounters = questCondition.counter?.conditions.filter((conditionCounter) =>
                    (conditionCounter.conditionType === "Kills") || (conditionCounter.conditionType === "Shots") || (conditionCounter.conditionType === "Equipment"));

                if (questConditionCounters !== undefined) {
                    const questConditionCountersToDelete: IQuestConditionCounterCondition[] = [];
                    
                    questConditionCounters.forEach((conditionCounter) => {

                        // if quest required silenced shotgun
                        if (conditionCounter.weaponModsInclusive?.some(subArray => subArray.every((value, index) => value === shotySilencerArray[index]))) {
                            replaceWithAnySilencedWeapon(conditionCounter);
                            if (config.debug) {
                                logger.info(`[Andern] quest '${quest.QuestName}' condition set to any silenced weapon`)
                            }
                        }

                        // if quest has gear conditions
                        if (conditionCounter.equipmentInclusive?.length > 0) {
                            questConditionCountersToDelete.push(conditionCounter)
                            if (config.debug) {
                                logger.info(`[Andern] quest '${quest.QuestName}' gear condition removed`)
                            }
                        }

                        // if quest required bolt action rifle
                        if (conditionCounter.weapon?.includes("5bfd297f0db834001a669119")) {
                            addAllDmr(conditionCounter)

                            // if bolty should have suppressor
                            if (conditionCounter.weaponModsInclusive?.length > 0) {
                                replaceWithBoltyAndDMRSilencers(conditionCounter)
                            }

                            if (config.debug) {
                                logger.info(`[Andern] quest '${quest.QuestName}' weapon condition expanded to DMR`)
                            }
                        }

                        // if quest required shotgun
                        if (conditionCounter.weapon?.includes("54491c4f4bdc2db1078b4568")) {
                            delete conditionCounter.weapon;
                            if (config.debug) {
                                logger.info(`[Andern] quest '${quest.QuestName}' weapon condition removed`)
                            }
                        }
                    })

                    if (questConditionCountersToDelete.length > 0) {
                        questCondition.counter.conditions = questCondition.counter.conditions.filter(
                            c => !questConditionCountersToDelete.includes(c)
                        )
                    }
                }
            });
        }
    });
}

function addAllDmr(conditionCounter: IQuestConditionCounterCondition): undefined {
    conditionCounter.weapon = conditionCounter.weapon.concat([
        "6176aca650224f204c1da3fb",
        "5df8ce05b11454561e39243b",
        "5a367e5dc4a282000e49738f",
        "5aafa857e5b5b00018480968",
        "5c46fbd72e2216398b5a8c9c",
        "5fc22d7c187fea44d52eda44",
        "57838ad32459774a17445cd2",
        "5c501a4d2e221602b412b540"
    ])
}

function replaceWithAnySilencedWeapon(conditionCounter: IQuestConditionCounterCondition): undefined {
    // exclude weapon restrictions
    delete conditionCounter.weapon;
    // include all silencers
    conditionCounter.weaponModsInclusive = [
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
    ];
}

function replaceWithBoltyAndDMRSilencers(conditionCounter: IQuestConditionCounterCondition): undefined {
    conditionCounter.weaponModsInclusive = [
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
        ["5e01ea19e9dc277128008c0b"]
    ];
}

