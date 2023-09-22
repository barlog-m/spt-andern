import { DependencyContainer } from "tsyringe";
import { BotWeaponGenerator } from "@spt-aki/generators/BotWeaponGenerator";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
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

export default function botWeaponChanges(
    container: DependencyContainer
): undefined {
    const logger = container.resolve<ILogger>("WinstonLogger");
    const botWeaponGenerator =
        container.resolve<BotWeaponGenerator>("BotWeaponGenerator");
    const tierOneWeapon = container.resolve<TierOneWeapon>("TierOneWeapon");
    const tierTwoWeapon = container.resolve<TierTwoWeapon>("TierTwoWeapon");
    const tierThreeWeapon =
        container.resolve<TierThreeWeapon>("TierThreeWeapon");
    const tierFourWeapon = container.resolve<TierFourWeapon>("TierFourWeapon");

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
                    if (botLevel < 20) {
                        weapon = tierOneWeapon.generateWeapon(weaponParentId);
                    } else if (botLevel >= 20 && botLevel < 30) {
                        weapon = tierTwoWeapon.generateWeapon(weaponParentId);
                    } else if (botLevel >= 30 && botLevel < 40) {
                        weapon = tierThreeWeapon.generateWeapon(weaponParentId);
                    } else {
                        weapon = tierFourWeapon.generateWeapon(weaponParentId);
                    }

                    const res = {
                        weapon: weapon.weaponWithMods,
                        chosenAmmoTpl: weapon.ammoTpl,
                        chosenUbglAmmoTpl: undefined,
                        weaponMods: modPool,
                        weaponTemplate: weapon.weaponTemplate,
                    };
                    //logger.info(`[Andern] weapon generated: ${JSON.stringify(res)}`);
                    return res;
                }

                const res = botWeaponGenerator.generateRandomWeapon(
                    sessionId,
                    equipmentSlot,
                    botTemplateInventory,
                    weaponParentId,
                    modChances,
                    botRole,
                    isPmc,
                    botLevel
                );
                return res;
            };
        },
        { frequency: "Always" }
    );

    logger.info("[Andern] PMC Bot Weapon Generator registered");
}
