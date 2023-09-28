import { Money } from "@spt-aki/models/enums/Money";
import { IDatabaseTables } from "@spt-aki/models/spt/server/IDatabaseTables";
import { FluentAssortConstructor } from "./FluentTraderAssortCreator";
import * as baseJson from "../db/base.json";

type TraderItem = {
    id: string;
    price: number;
    name: string;
    buyRestriction: number;
};

export class DoeTrader {
    public static items: TraderItem[] = [
        {
            id: "5648ae314bdc2d3d1c8b457f",
            price: 12000,
            name: "AK_CAA_RS47_HANDGUARD",
            buyRestriction: 5,
        },
        {
            id: "593d493f86f7745e6b2ceb22",
            price: 46000,
            name: "SILENCER_AK74_HEXAGON_AK74_545X39",
            buyRestriction: 5,
        },
        {
            id: "570fd6c2d2720bc6458b457f",
            price: 26000,
            name: "SCOPE_ALL_EOTECH_553",
            buyRestriction: 5,
        },
        {
            id: "5a9fbb84a2750c00137fa685",
            price: 55000,
            name: "SILENCER_ALL_ROTOR_43_V2_556X45",
            buyRestriction: 5,
        },
        {
            id: "5a9fbacda2750c00141e080f",
            price: 48000,
            name: "SILENCER_ALL_ROTOR_43_V2_762X39",
            buyRestriction: 5,
        },
        {
            id: "59d625f086f774661516605d",
            price: 2500,
            name: "MAG_AK_IZHMASH_AK_STD_55_762X39_30",
            buyRestriction: 12,
        },
        {
            id: "59387a4986f77401cc236e62",
            price: 550000,
            name: "Dorm room 114 key",
            buyRestriction: 1,
        },
        {
            id: "5938144586f77473c2087145",
            price: 170000,
            name: "Portable bunkhouse key",
            buyRestriction: 1,
        },
        {
            id: "591afe0186f77431bd616a11",
            price: 50000,
            name: "ZB-014 key",
            buyRestriction: 1,
        },
        {
            id: "5938504186f7740991483f30",
            price: 50000,
            name: "Dorm room 203 key",
            buyRestriction: 1,
        },
        {
            id: "5d947d4e86f774447b415895",
            price: 140000,
            name: "RB-KSM key",
            buyRestriction: 1,
        },
        {
            id: "5d947d3886f774447b415893",
            price: 140000,
            name: "RB-SMP key",
            buyRestriction: 1,
        },
        {
            id: "5a0eb6ac86f7743124037a28",
            price: 80000,
            name: "Cottage back door key",
            buyRestriction: 1,
        },
        {
            id: "5eff09cd30a7dc22fd1ddfed",
            price: 80000,
            name: "Health Resort office key with a blue tape",
            buyRestriction: 1,
        },
        {
            id: "62987da96188c076bc0d8c51",
            price: 80000,
            name: "Operating room key",
            buyRestriction: 1,
        },
        {
            id: "593aa4be86f77457f56379f8",
            price: 50000,
            name: "Dorm room 303 key",
            buyRestriction: 1,
        },
        {
            id: "5780cf7f2459777de4559322",
            price: 3500000,
            name: "Dorm room 314 marked key",
            buyRestriction: 1,
        },
        {
            id: "5a0ee30786f774023b6ee08f",
            price: 100000,
            name: "Health Resort west wing room 216 key",
            buyRestriction: 1,
        },
        {
            id: "5a0dc95c86f77452440fc675",
            price: 60000,
            name: "Health Resort west wing office room 112 key",
            buyRestriction: 1,
        },
        {
            id: "5a0ee34586f774023b6ee092",
            price: 60000,
            name: "Health Resort west wing room 220 key",
            buyRestriction: 1,
        },
        {
            id: "5ad5db3786f7743568421cce",
            price: 90000,
            name: "EMERCOM medical unit key",
            buyRestriction: 1,
        },
        {
            id: "5d80c6c586f77440351beef1",
            price: 280000,
            name: "RB-OB key",
            buyRestriction: 1,
        },
        {
            id: "5d80cd1a86f77402aa362f42",
            price: 160000,
            name: "RB-ORB3 key",
            buyRestriction: 1,
        },
        {
            id: "5d80ccdd86f77474f7575e02",
            price: 150000,
            name: "RB-ORB2 key",
            buyRestriction: 1,
        },
        {
            id: "5d80ccac86f77470841ff452",
            price: 220000,
            name: "RB-ORB1",
            buyRestriction: 1,
        },
        {
            id: "5a0eee1486f77402aa773226",
            price: 80000,
            name: "Health Resort east wing room 328 key",
            buyRestriction: 1,
        },
    ];

    public static tierFourItems: TraderItem[] = [
        {
            id: "5fd20ff893a8961fc660a954",
            price: 1200,
            name: "patron_762x35_blackout_ap",
            buyRestriction: 500,
        },
        {
            id: "59e0d99486f7744a32234762",
            price: 1200,
            name: "patron_762x39_BP",
            buyRestriction: 500,
        },
        {
            id: "61962b617c6c7b169525f168",
            price: 1200,
            name: "patron_545x39_7n40",
            buyRestriction: 500,
        },
    ];

    public static addItems(
        fluentTraderAssortHeper: FluentAssortConstructor,
        tables: IDatabaseTables,
        items: TraderItem[],
        loyalityLevel: number
    ): undefined {
        items.forEach((i) => {
            fluentTraderAssortHeper
                .createSingleAssortItem(i.id)
                .addUnlimitedStackCount()
                .addBuyRestriction(i.buyRestriction)
                .addMoneyCost(Money.ROUBLES, i.price)
                .addLoyaltyLevel(loyalityLevel)
                .export(tables.traders[baseJson._id]);
        });
    }
}
