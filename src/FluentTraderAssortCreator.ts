import { IItem } from "@spt/models/eft/common/tables/IItem";
import { IBarterScheme, ITrader } from "@spt/models/eft/common/tables/ITrader";
import { Money } from "@spt/models/enums/Money";
import type { ILogger } from "@spt/models/spt/utils/ILogger";
import { HashUtil } from "@spt/utils/HashUtil";

export class FluentAssortConstructor {
    protected itemsToSell: IItem[] = [];
    protected barterScheme: Record<string, IBarterScheme[][]> = {};
    protected loyaltyLevel: Record<string, number> = {};
    protected hashUtil: HashUtil;
    protected logger: ILogger;

    constructor(hashutil: HashUtil, logger: ILogger) {
        this.hashUtil = hashutil;
        this.logger = logger;
    }

    public createSingleAssortItem(
        itemTpl: string,
        itemId = undefined,
    ): FluentAssortConstructor {
        const newItemToAdd: IItem = {
            _id: !itemId ? this.hashUtil.generate() : itemId,
            _tpl: itemTpl,
            parentId: "hideout",
            slotId: "hideout",
            upd: {
                UnlimitedCount: true,
                StackObjectsCount: 9999999,
            },
        };

        this.itemsToSell.push(newItemToAdd);

        return this;
    }

    public createComplexAssortItem(items: IItem[]): FluentAssortConstructor {
        items[0].parentId = "hideout";
        items[0].slotId = "hideout";

        if (!items[0].upd) {
            items[0].upd = {};
        }

        items[0].upd.UnlimitedCount = true;

        this.itemsToSell.push(...items);

        return this;
    }

    public addStackCount(stackCount: number): FluentAssortConstructor {
        this.itemsToSell[0].upd.StackObjectsCount = stackCount;

        return this;
    }

    public addUnlimitedStackCount(): FluentAssortConstructor {
        this.itemsToSell[0].upd.StackObjectsCount = 999999;
        this.itemsToSell[0].upd.UnlimitedCount = true;

        return this;
    }

    public makeStackCountUnlimited(): FluentAssortConstructor {
        this.itemsToSell[0].upd.StackObjectsCount = 999999;

        return this;
    }

    public addBuyRestriction(maxBuyLimit: number): FluentAssortConstructor {
        this.itemsToSell[0].upd.BuyRestrictionMax = maxBuyLimit;
        this.itemsToSell[0].upd.BuyRestrictionCurrent = 0;

        return this;
    }

    public addLoyaltyLevel(level: number): this {
        this.loyaltyLevel[this.itemsToSell[0]._id] = level;
        return this;
    }

    public addMoneyCost(
        currencyType: Money,
        amount: number,
    ): FluentAssortConstructor {
        this.barterScheme[this.itemsToSell[0]._id] = [
            [
                {
                    count: amount,
                    _tpl: currencyType,
                },
            ],
        ];

        return this;
    }

    public addBarterCost(
        itemTpl: string,
        count: number,
    ): FluentAssortConstructor {
        const sellableItemId = this.itemsToSell[0]._id;

        // No data at all, create
        if (Object.keys(this.barterScheme).length === 0) {
            this.barterScheme[sellableItemId] = [
                [
                    {
                        count: count,
                        _tpl: itemTpl,
                    },
                ],
            ];
        } else {
            // Item already exists, add to
            const existingData = this.barterScheme[sellableItemId][0].find(
                (x) => x._tpl === itemTpl,
            );
            if (existingData) {
                // itemtpl already a barter for item, add to count
                existingData.count += count;
            } else {
                // No barter for item, add it fresh
                this.barterScheme[sellableItemId][0].push({
                    count: count,
                    _tpl: itemTpl,
                });
            }
        }

        return this;
    }

    /**
     * Reset objet ready for reuse
     * @returns
     */
    public export(data: ITrader): FluentAssortConstructor {
        const itemBeingSoldId = this.itemsToSell[0]._id;
        if (data.assort.items.find((x) => x._id === itemBeingSoldId)) {
            this.logger.error(
                `Unable to add complex item with item key ${this.itemsToSell[0]._id}, key already used`,
            );

            return;
        }

        data.assort.items.push(...this.itemsToSell);
        data.assort.barter_scheme[itemBeingSoldId] =
            this.barterScheme[itemBeingSoldId];
        data.assort.loyal_level_items[itemBeingSoldId] =
            this.loyaltyLevel[itemBeingSoldId];

        this.itemsToSell = [];
        this.barterScheme = {};
        this.loyaltyLevel = {};

        return this;
    }
}
