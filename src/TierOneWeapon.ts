import { inject, injectable } from "tsyringe";

import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { HashUtil } from "@spt-aki/utils/HashUtil";
import { RandomUtil } from "@spt-aki/utils/RandomUtil";
import { ItemHelper } from "@spt-aki/helpers/ItemHelper";
import { WeaponGenerator } from "./WeaponGenerator";
import * as ammo from "../res/one/ammo.json";

@injectable()
export class TierOneWeapon extends WeaponGenerator {
    constructor(
        @inject("WinstonLogger") protected logger: ILogger,
        @inject("HashUtil") protected hashUtil: HashUtil,
        @inject("RandomUtil") protected randomUtil: RandomUtil,
        @inject("DatabaseServer") protected databaseServer: DatabaseServer,
        @inject("ItemHelper") protected itemHelper: ItemHelper,
        @inject("ModResPath") protected modResPath: string
    ) {
        super(
            logger,
            hashUtil,
            randomUtil,
            databaseServer,
            itemHelper,
            `${modResPath}/one`
        );
        this.logger.info("[Andern] Tier One Bot Weapon Changes enabled");
    }

    protected getAmmoByCaliber(caliber: string): string {
        const selectedAmmo = ammo[caliber];
        if (!selectedAmmo) {
            this.logger.error(
                `[Andern] No ammo found for caliber ${caliber}. Fix ammo.json`
            );
        }
        return selectedAmmo;
    }
}
