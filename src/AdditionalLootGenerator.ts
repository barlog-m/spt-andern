import { inject, injectable } from "tsyringe";

import { HashUtil } from "@spt/utils/HashUtil";
import { BotLootGenerator } from "@spt/generators/BotLootGenerator";
import { RandomUtil } from "@spt/utils/RandomUtil";
import { WeightedRandomHelper } from "@spt/helpers/WeightedRandomHelper";
import { ConfigServer } from "@spt/servers/ConfigServer";
import { ItemHelper } from "@spt/helpers/ItemHelper";
import { InventoryHelper } from "@spt/helpers/InventoryHelper";
import { DatabaseService } from "@spt/services/DatabaseService";
import { HandbookHelper } from "@spt/helpers/HandbookHelper";
import { BotGeneratorHelper } from "@spt/helpers/BotGeneratorHelper";
import { BotWeaponGenerator } from "@spt/generators/BotWeaponGenerator";
import { BotHelper } from "@spt/helpers/BotHelper";
import { BotLootCacheService } from "@spt/services/BotLootCacheService";
import { LocalisationService } from "@spt/services/LocalisationService";

import { IInventory as PmcInventory } from "@spt/models/eft/common/tables/IBotBase";
import { IBotType } from "@spt/models/eft/common/tables/IBotType";
import type { ILogger } from "@spt/models/spt/utils/ILogger";
import { EquipmentSlots } from "@spt/models/enums/EquipmentSlots";
import type { ICloner } from "@spt/utils/cloners/ICloner";
import * as config from "../config/config.json";
import { IBotConfig } from "@spt/models/spt/config/IBotConfig";
import { ConfigTypes } from "@spt/models/enums/ConfigTypes";

@injectable()
export class AdditionalLootGenerator extends BotLootGenerator {
    constructor(
        @inject("PrimaryLogger") logger: ILogger,
        @inject("HashUtil") hashUtil: HashUtil,
        @inject("RandomUtil") randomUtil: RandomUtil,
        @inject("ItemHelper") itemHelper: ItemHelper,
        @inject("InventoryHelper") inventoryHelper: InventoryHelper,
        @inject("DatabaseService") databaseService: DatabaseService,
        @inject("HandbookHelper") handbookHelper: HandbookHelper,
        @inject("BotGeneratorHelper") botGeneratorHelper: BotGeneratorHelper,
        @inject("BotWeaponGenerator") botWeaponGenerator: BotWeaponGenerator,
        @inject("WeightedRandomHelper")
        weightedRandomHelper: WeightedRandomHelper,
        @inject("BotHelper") botHelper: BotHelper,
        @inject("BotLootCacheService") botLootCacheService: BotLootCacheService,
        @inject("LocalisationService") localisationService: LocalisationService,
        @inject("ConfigServer") configServer: ConfigServer,
        @inject("PrimaryCloner") cloner: ICloner,
    ) {
        super(
            logger,
            hashUtil,
            randomUtil,
            itemHelper,
            inventoryHelper,
            databaseService,
            handbookHelper,
            botGeneratorHelper,
            botWeaponGenerator,
            weightedRandomHelper,
            botHelper,
            botLootCacheService,
            localisationService,
            configServer,
            cloner,
        );

        const botConfig = this.configServer.getConfig<IBotConfig>(
            ConfigTypes.BOT,
        );
        this.bosses = botConfig.bosses.map((i) => i.toLowerCase());
    }

    public override generateLoot(
        sessionId: string,
        botJsonTemplate: IBotType,
        isPmc: boolean,
        botRole: string,
        botInventory: PmcInventory,
        botLevel: number,
    ): void {
        super.generateLoot(
            sessionId,
            botJsonTemplate,
            isPmc,
            botRole,
            botInventory,
            botLevel,
        );

        if (config.gpCoinsOnPmcAndScavs && !config.disableBotBackpackLoot) {
            if (isPmc || botRole === "assault") {
                this.addGpCoins(isPmc, botRole, botInventory);
            }
        }

        if (config.legaMedalOnBosses && !config.disableBotBackpackLoot) {
            const botConfig = this.configServer.getConfig<IBotConfig>(
                ConfigTypes.BOT,
            );
            if (this.bosses.includes(botRole) {
                this.addLegaMedal(isPmc, botRole, botInventory);
            }
        }
    }

    addGpCoins(isPmc: boolean, botRole: string, botInventory: PmcInventory) {
        if (this.randomUtil.getBool()) {
            this.addLootFromPool(
                { "5d235b4d86f7742e017bc88a": 1 },
                [EquipmentSlots.BACKPACK],
                1,
                botInventory,
                botRole,
                undefined,
                -1,
                isPmc,
            );
        }
    }

    addLegaMedal(isPmc: boolean, botRole: string, botInventory: PmcInventory) {
        this.addLootFromPool(
            { "6656560053eaaa7a23349c86": 1 },
            [EquipmentSlots.POCKETS],
            1,
            botInventory,
            botRole,
            undefined,
            -1,
            isPmc,
        );
    }
}
