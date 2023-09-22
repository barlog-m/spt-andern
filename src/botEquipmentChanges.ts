import { DependencyContainer } from "tsyringe";

import { ConfigTypes } from "@spt-aki/models/enums/ConfigTypes";
import { ConfigServer } from "@spt-aki/servers/ConfigServer";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { IBotConfig } from "@spt-aki/models/spt/config/IBotConfig";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";

export default function botEquipmentChanges(
    container: DependencyContainer
): undefined {
    const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
    const configServer = container.resolve<ConfigServer>("ConfigServer");
    const botConfig = configServer.getConfig<IBotConfig>(ConfigTypes.BOT);
    const tables = databaseServer.getTables();
    const items = tables.templates.items;
    const customization = tables.templates.customization;
    const traders = tables.traders;

    const usecInventory = tables.bots.types.usec.inventory;
    const bearInventory = tables.bots.types.bear.inventory;

    // botConfig.secureContainerAmmoStackCount = 200
    // tables.bots.types.usec.inventory.mods = {}
    // tables.bots.types.bear.inventory.mods = {}
    // console.log(JSON.stringify(tables.bots.types.assault.inventory))

    const usecAppearance = tables.bots.types.usec.appearance;
    const bearAppearance = tables.bots.types.bear.appearance;

    //botConfig.pmc.looseWeaponInBackpackChancePercent = 1;
    //botConfig.pmc.looseWeaponInBackpackLootMinMax = { min: 0, max: 1 };

    const tradersList = [
        "Prapor",
        "Therapist",
        "Skier",
        "Peacekeeper",
        "Mechanic",
        "Ragman",
        "Jaeger",
        "Doe",
    ];

    const logger = container.resolve<ILogger>("WinstonLogger");

    const doe = traders["doetrader"];

    //logger.info(`[Doe] traders ${JSON.stringify(doe)}`);
}
