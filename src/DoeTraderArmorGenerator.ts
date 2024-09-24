import {inject, injectable} from "tsyringe";
import {ILogger} from "@spt/models/spt/utils/ILogger";
import {HashUtil} from "@spt/utils/HashUtil";
import {Item} from "@spt/models/eft/common/tables/IItem";

@injectable()
export class DoeTraderArmorGenerator {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly KIRASA_N = "5b44d22286f774172b0c9de8";
    readonly TV_115 = "64a536392d2c4e6e970f4121";
    readonly allArmor = [this.KIRASA_N, this.TV_115];

    constructor(
        @inject("WinstonLogger") protected logger: ILogger,
        @inject("HashUtil") protected hashUtil: HashUtil
    ) {
    }

    public getArmor(tpl: string): Item[] {
        switch (tpl) {
            case this.KIRASA_N: {
                return this.kirasaN();
            }
            case this.TV_115: {
                return this.tv115();
            }
            default: {
                return this.anyOtherArmor(tpl);
            }
        }

    }

    public isArmor(tpl: string): boolean {
        return this.allArmor.includes(tpl);
    }


    private anyOtherArmor(tpl: string): Item[] {
        const item: Item = {
            _id: this.hashUtil.generate(),
            _tpl: tpl
        }
        return [item];
    }

    private kirasaN(): Item[] {
        const id = this.hashUtil.generate();
        const armor: Item[] = [];

        armor.push({
            _id: id,
            _tpl: this.KIRASA_N
        });

        armor.push({
            _id: this.hashUtil.generate(),
            _tpl: "65704de13e7bba58ea0285c8",
            parentId: id,
            slotId: "Soft_armor_front"
        });
        armor.push({
            _id: this.hashUtil.generate(),
            _tpl: "65705c3c14f2ed6d7d0b7738",
            parentId: id,
            slotId: "Soft_armor_back"
        });
        armor.push({
            _id: this.hashUtil.generate(),
            _tpl: "65705c777260e1139e091408",
            parentId: id,
            "slotId": "Soft_armor_left"
        });
        armor.push({
            _id: this.hashUtil.generate(),
            _tpl: "65705cb314f2ed6d7d0b773c",
            parentId: id,
            "slotId": "soft_armor_right"
        });
        armor.push({
            _id: this.hashUtil.generate(),
            _tpl: "65705cea4916448ae1050897",
            parentId: id,
            "slotId": "Collar"
        });
        armor.push({
            _id: this.hashUtil.generate(),
            _tpl: "656f9d5900d62bcd2e02407c",
            parentId: id,
            slotId: "Front_plate"
        });
        armor.push({
            _id: this.hashUtil.generate(),
            _tpl: "656f9d5900d62bcd2e02407c",
            parentId: id,
            slotId: "Back_plate"
        });

        return armor;
    }
    
    private tv115(): Item[] {
        const id = this.hashUtil.generate();
        const armor: Item[] = [];

        armor.push({
            _id: id,
            _tpl: this.TV_115
        });

        armor.push({
            _id: this.hashUtil.generate(),
            _tpl: "6570653e89fd4926380b733e",
            parentId: id,
            slotId: "Soft_armor_front"
        });
        armor.push({
            _id: this.hashUtil.generate(),
            _tpl: "6570658a89fd4926380b7346",
            parentId: id,
            slotId: "Soft_armor_back"
        });
        armor.push({
            _id: this.hashUtil.generate(),
            _tpl: "656fac30c6baea13cd07e10c",
            parentId: id,
            slotId: "Front_plate"
        });
        armor.push({
            _id: this.hashUtil.generate(),
            _tpl: "656fac30c6baea13cd07e10c",
            parentId: id,
            slotId: "Back_plate"
        });

        return armor;
    }
}
