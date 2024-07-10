import { DependencyContainer } from "tsyringe";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { BotWeaponGenerator } from "@spt/generators/BotWeaponGenerator";
import {
    Inventory,
    ModsChances,
} from "@spt/models/eft/common/tables/IBotType";
import { GenerateWeaponResult } from "@spt/models/spt/bots/GenerateWeaponResult";
import { WeaponGenerator } from "./WeaponGenerator";
import { GeneratedWeapon } from "./models";
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
                            "",
                            botLevel,
                            weaponParentId,
                            false
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
