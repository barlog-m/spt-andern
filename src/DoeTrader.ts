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
    private static items: TraderItem[] = [
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
            id: "5a13f46386f7741dd7384b04",
            price: 50000,
            name: "Health Resort west wing room 306 key",
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
    ];

    public static addItems(
        fluentTraderAssortHeper: FluentAssortConstructor,
        tables: IDatabaseTables
    ): void {
        DoeTrader.items.forEach((i) => {
            fluentTraderAssortHeper
                .createSingleAssortItem(i.id)
                .addUnlimitedStackCount()
                .addBuyRestriction(i.buyRestriction)
                .addMoneyCost(Money.ROUBLES, i.price)
                .addLoyaltyLevel(1)
                .export(tables.traders[baseJson._id]);
        });
    }
}
