import { DependencyContainer } from "tsyringe";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { BotWeaponGenerator } from "@spt-aki/generators/BotWeaponGenerator";
import {
    Inventory,
    ModsChances,
} from "@spt-aki/models/eft/common/tables/IBotType";
import { GenerateWeaponResult } from "@spt-aki/models/spt/bots/GenerateWeaponResult";
import { GeneratedWeapon } from "./WeaponGenerator";
import { TierOneWeapon } from "./TierOneWeapon";
import { TierTwoWeapon } from "./TierTwoWeapon";
import { TierThreeWeapon } from "./TierThreeWeapon";
import { TierFourWeapon } from "./TierFourWeapon";
import { RaidInfo } from "./RaidInfo";
import * as config from "../config/config.json";

export default function registerBotWeaponGenerator(
    container: DependencyContainer
): undefined {
    const logger = container.resolve<ILogger>("WinstonLogger");
    const botWeaponGenerator =
        container.resolve<BotWeaponGenerator>("BotWeaponGenerator");
    const tierOneWeapon = container.resolve<TierOneWeapon>(
        "AndernTierOneWeapon"
    );
    const tierTwoWeapon = container.resolve<TierTwoWeapon>(
        "AndernTierTwoWeapon"
    );
    const tierThreeWeapon = container.resolve<TierThreeWeapon>(
        "AndernTierThreeWeapon"
    );
    const tierFourWeapon = container.resolve<TierFourWeapon>(
        "AndernTierFourWeapon"
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

                    let weapon: GeneratedWeapon;
                    if (botLevel < 15) {
                        weapon = tierOneWeapon.generateWeapon(
                            weaponParentId,
                            raidInfo.isNight
                        );
                    } else if (botLevel >= 15 && botLevel < 28) {
                        weapon = tierTwoWeapon.generateWeapon(
                            weaponParentId,
                            raidInfo.isNight
                        );
                    } else if (botLevel >= 28 && botLevel < 40) {
                        weapon = tierThreeWeapon.generateWeapon(
                            weaponParentId,
                            raidInfo.isNight
                        );
                    } else {
                        weapon = tierFourWeapon.generateWeapon(
                            weaponParentId,
                            raidInfo.isNight
                        );
                    }

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
