import { LootTableIndexs, mapPmcBackpackLootData } from "./models";
import * as backpackLootConfig from "../config/backpack.json";

export function combineMapItemListIntoArray(selectedMapLootData: mapPmcBackpackLootData): string[][] {
    const mapPmcBackpackLootTables: string[][] = [
        [...backpackLootConfig.loot_tables.extremely_rare],
        [...backpackLootConfig.loot_tables.rare],
        [...backpackLootConfig.loot_tables.valuable],
        [...backpackLootConfig.loot_tables.common]
    ]

    if (selectedMapLootData.include_normal_keys) {
        mapPmcBackpackLootTables[LootTableIndexs.COMMON].push(...backpackLootConfig.loot_tables.common_keys);
    }

    const weightArrayLength = selectedMapLootData.weights.length;

    return mapPmcBackpackLootTables.slice(0, weightArrayLength);
}

export function combineGlobalItemListIntoArray() : string[][] {
    const mapPmcBackpackLootTables: string[][] = [
        [...backpackLootConfig.loot_tables.extremely_rare],
        [...backpackLootConfig.loot_tables.rare],
        [...backpackLootConfig.loot_tables.valuable],
        [...backpackLootConfig.loot_tables.common]
    ]

    if (backpackLootConfig.global.include_normal_keys) {
        mapPmcBackpackLootTables[LootTableIndexs.COMMON].push(...backpackLootConfig.loot_tables.common_keys)
    }

    const weightArrayLength = backpackLootConfig.global.weights.length;

    return mapPmcBackpackLootTables.slice(0, weightArrayLength);
}
