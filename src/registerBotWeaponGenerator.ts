import { DependencyContainer } from "tsyringe";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { BotWeaponGenerator } from "@spt-aki/generators/BotWeaponGenerator";
import {
    Inventory,
    ModsChances,
} from "@spt-aki/models/eft/common/tables/IBotType";
import { GenerateWeaponResult } from "@spt-aki/models/spt/bots/GenerateWeaponResult";
import { WeaponGenerator } from "./WeaponGenerator";
import { GeneratedWeapon } from "./models";
import { RaidInfo } from "./RaidInfo";
import * as config from "../config/config.json";

export default function registerBotWeaponGenerator(
    container: DependencyContainer
): undefined {
    const logger = container.resolve<ILogger>("WinstonLogger");
    const botWeaponGenerator =
        container.resolve<BotWeaponGenerator>("BotWeaponGenerator");
    const pmcWeaponGenerator = container.resolve<WeaponGenerator>(
        "AndernWeaponGenerator"
    );
    const raidInfo = container.resolve<RaidInfo>("AndernRaidInfo");

    container.afterResolution(
        "BotWeaponGenerator",
        (_t, result: BotWeaponGenerator) => {
            result.generateRandomWeapon = (
                sessionId: string,
                equipmentSlot: string,
                botTemplateInventory: Inventory,
                weaponParentId: string,
                modChances: ModsChances,
                botRole: string,
                isPmc: boolean,
                botLevel: number
            ): GenerateWeaponResult => {
                if (isPmc) {
                    const modPool = botTemplateInventory.mods;

                    const weapon: GeneratedWeapon =
                        pmcWeaponGenerator.generateWeapon(
                            botLevel,
                            weaponParentId,
                            raidInfo.isNight
                        );

                    const res = {
                        weapon: weapon.weaponWithMods,
                        chosenAmmoTpl: weapon.ammoTpl,
                        chosenUbglAmmoTpl: undefined,
                        weaponMods: modPool,
                        weaponTemplate: weapon.weaponTemplate,
                    };
                    if (config.debug)
                        logger.info(
                            `[Andern] weapon generated: ${JSON.stringify(res)}`
                        );
                    return res;
                }

                return botWeaponGenerator.generateRandomWeapon(
                    sessionId,
                    equipmentSlot,
                    botTemplateInventory,
                    weaponParentId,
                    modChances,
                    botRole,
                    isPmc,
                    botLevel
                );
            };
        },
        { frequency: "Always" }
    );

    logger.info("[Andern] PMC Bot Weapon Generator registered");
}
