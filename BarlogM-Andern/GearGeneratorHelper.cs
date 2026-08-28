using SPTarkov.Common.Models.Logging;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.Extensions;
using SPTarkov.Server.Core.Helpers;
using SPTarkov.Server.Core.Helpers.Bot;
using SPTarkov.Server.Core.Helpers.Items;
using SPTarkov.Server.Core.Models.Common;
using SPTarkov.Server.Core.Models.Eft.Common.Tables;
using SPTarkov.Server.Core.Models.Enums;
using SPTarkov.Server.Core.Utils.Cloners;

namespace BarlogM_Andern;

[Injectable]
public class GearGeneratorHelper(
    ISptLogger<GearGeneratorHelper> logger,
    ItemHelper itemHelper,
    BotGeneratorHelper botGeneratorHelper,
    WeightedRandomHelper weightedRandomHelper,
    ICloner cloner,
    PresetHelper presetHelper
)
{
    public Item PutGearItemToInventory(
        EquipmentSlots equipmentSlot,
        string botRole,
        BotBaseInventory botInventory,
        string equipmentItemTpl)
    {
        var (isItemExists, itemTemplate) =
            itemHelper.GetItem(equipmentItemTpl);

        if (!isItemExists)
        {
            logger.Error(
                $"[Andern] PutGearItemToInventory itemHelper.GetItem id {equipmentItemTpl} for slot {equipmentSlot}");
        }

        if (equipmentSlot == EquipmentSlots.Headwear ||
            equipmentSlot == EquipmentSlots.ArmorVest ||
            (equipmentSlot == EquipmentSlots.TacticalVest && itemHelper.ItemHasSlots(itemTemplate!.Id)))
        {
            var items = CreateComplexItem(itemTemplate!, botRole);
            var root = items.First();

            root.ParentId = botInventory.Equipment;
            root.SlotId = equipmentSlot.ToString();

            botInventory.Items!.AddRange(items);

            return root;
        }

        var item = new Item
        {
            Id = new MongoId(),
            Template = itemTemplate!.Id,
            ParentId = botInventory.Equipment,
            SlotId = equipmentSlot.ToString(),
            Upd = botGeneratorHelper.GenerateExtraPropertiesForItem(
            itemTemplate, botRole)
        };

        botInventory.Items!.Add(item);

        return item;
    }

    public MongoId PutModItemToInventory(
        string botRole,
        BotBaseInventory botInventory,
        string equipmentItemTpl,
        string slotId,
        MongoId parentId)
    {
        var (isItemExists, itemTemplate) =
            itemHelper.GetItem(equipmentItemTpl);

        if (!isItemExists)
        {
            logger.Error(
                $"[Andern] PutModItemToInventory: wrong template id {equipmentItemTpl} for slot {slotId}");
        }

        var item = new Item
        {
            Id = new MongoId(),
            Template = itemTemplate!.Id,
            ParentId = parentId,
            SlotId = slotId,
            Upd = botGeneratorHelper.GenerateExtraPropertiesForItem(itemTemplate, botRole)
        };

        botInventory.Items?.Add(item);
        return item.Id;
    }

    private List<Item> CreateComplexItem(TemplateItem baseItemTemplate, string botRole)
    {
        // SPT GetDefaultPresetsByTplKey() rebuilds a dictionary via ToDictionary() on EVERY
        // call and is indexed with [tpl]. That throws ArgumentException (a duplicate root tpl,
        // e.g. when a content mod adds a colliding default preset) or KeyNotFoundException (an
        // item that has no default preset). Either throw propagates out of GenerateArmor and
        // aborts the whole equipment pass, so the bot ends up with no armor / rig / backpack.
        // GetDefaultPreset() is the safe accessor: it reads PresetCache and returns null
        // instead of throwing.
        var preset = presetHelper.GetDefaultPreset(baseItemTemplate.Id);

        if (preset?.Items is null || preset.Items.Count == 0)
        {
            // No usable default preset - fall back to a plain item so the bot still gets the
            // armor / helmet / rig (just without the preset's plates / attachments) instead
            // of nothing.
            return [CreatePlainGearItem(baseItemTemplate, botRole)];
        }

        var items = cloner.Clone(preset.Items)!.ReplaceIDs().ToList();
        items.RemapRootItemId();

        foreach (var item in items)
        {
            var (itemExists, itemTemplate) = itemHelper.GetItem(item.Template);
            if (!itemExists)
            {
                continue;
            }
            
            item.Upd =
                botGeneratorHelper.GenerateExtraPropertiesForItem(itemTemplate, botRole);
        }

        return items;
    }
    
    private Item CreatePlainGearItem(TemplateItem itemTemplate, string botRole)
    {
        return new Item
        {
            Id = new MongoId(),
            Template = itemTemplate.Id,
            Upd = botGeneratorHelper.GenerateExtraPropertiesForItem(itemTemplate, botRole),
        };
    }

    public string ReplaceEarpiece(string tpl) {
        // "GSSh-01 active headset" -> "OPSMEN Earmor M32 headset"
        if (tpl == "5b432b965acfc47a8774094e") {
            return "6033fa48ffd42c541047f728";
        }

        // "Peltor ComTac 2 headset" -> "OPSMEN Earmor M32 headset"
        if (tpl == "5645bcc04bdc2d363b8b4572") {
            return "6033fa48ffd42c541047f728";
        }

        // "Peltor Tactical Sport headset" -> "OPSMEN Earmor M32 headset"
        if (tpl == "5c165d832e2216398b5a7e36") {
            return "6033fa48ffd42c541047f728";
        }

        // "MSA Sordin Supreme PRO-X/L active headset" -> "Walker's XCEL 500BT Digital headset"
        if (tpl == "5aa2ba71e5b5b000137b758f") {
            return "5f60cd6cf2bcbb675b00dac6";
        }

        // "Walkers Razor Digital headset" -> "Walker's XCEL 500BT Digital headset"
        if (tpl == "5e4d34ca86f774264f758330") {
            return "5f60cd6cf2bcbb675b00dac6";
        }

        return tpl;
    }

    public string WeightedRandomGearItemTpl(List<GearItem> items)
    {
        if (items.Count == 0) return "";

        return weightedRandomHelper.GetWeightedValue(GearItemArrayToDictionary(items));
    }

    private Dictionary<string, double> GearItemArrayToDictionary(
        List<GearItem> items)
    {
        var result = new Dictionary<string, double>();

        foreach (var item in items)
        {
            result.TryAdd(item.Id, item.Weight);
        }

        return result;
    }
}
