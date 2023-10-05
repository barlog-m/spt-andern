import { Money } from "@spt-aki/models/enums/Money";
import { IDatabaseTables } from "@spt-aki/models/spt/server/IDatabaseTables";
import { ItemHelper } from "@spt-aki/helpers/ItemHelper";
import { FluentAssortConstructor } from "./FluentTraderAssortCreator";
import * as baseJson from "../db/base.json";
import tierOneItems from "../res/one/trader.json";
import tierTwoItems from "../res/two/trader.json";
import tierThreeItems from "../res/three/trader.json";
import tierFourItems from "../res/four/trader.json";

type TraderItem = {
    tpl: string;
    name: string;
};

export class DoeTrader {
    public static addAllItems(
        fluentTraderAssortHeper: FluentAssortConstructor,
        tables: IDatabaseTables,
        itemHelper: ItemHelper
    ): undefined {
        DoeTrader.addTierItems(
            fluentTraderAssortHeper,
            tables,
            tierOneItems,
            1,
            itemHelper
        );
        DoeTrader.addTierItems(
            fluentTraderAssortHeper,
            tables,
            tierTwoItems,
            2,
            itemHelper
        );
        DoeTrader.addTierItems(
            fluentTraderAssortHeper,
            tables,
            tierThreeItems,
            3,
            itemHelper
        );
        DoeTrader.addTierItems(
            fluentTraderAssortHeper,
            tables,
            tierFourItems,
            4,
            itemHelper
        );
    }

    private static addTierItems(
        fluentTraderAssortHeper: FluentAssortConstructor,
        tables: IDatabaseTables,
        items: TraderItem[],
        loyalityLevel: number,
        itemHelper: ItemHelper
    ): undefined {
        items.forEach((i) => {
            fluentTraderAssortHeper
                .createSingleAssortItem(i.tpl)
                .addUnlimitedStackCount()
                .addMoneyCost(Money.ROUBLES, itemHelper.getItemPrice(i.tpl))
                .addLoyaltyLevel(loyalityLevel)
                .export(tables.traders[baseJson._id]);
        });
    }
}
