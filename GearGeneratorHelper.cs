using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.Extensions;
using SPTarkov.Server.Core.Helpers;
using SPTarkov.Server.Core.Models.Common;
using SPTarkov.Server.Core.Models.Eft.Common.Tables;
using SPTarkov.Server.Core.Models.Enums;
using SPTarkov.Server.Core.Models.Utils;
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
        var (isItemExists, templateItem) =
            itemHelper.GetItem(equipmentItemTpl);

        if (!isItemExists)
        {
            logger.Error(
                $"[Andern] PutGearItemToInventory itemHelper.GetItem id {equipmentItemTpl} for slot {equipmentSlot}");
        }

        if (equipmentSlot == EquipmentSlots.Headwear ||
            equipmentSlot == EquipmentSlots.ArmorVest ||
            (equipmentSlot == EquipmentSlots.TacticalVest && itemHelper.ItemHasSlots(templateItem.Id)))
        {
            var items = CreateComplexItem(equipmentItemTpl, botRole, templateItem);
            var root = items.First();

            root.ParentId = botInventory.Equipment;
            root.SlotId = equipmentSlot.ToString();

            botInventory.Items.AddRange(items);

            return root;
        }

        var extraProps = botGeneratorHelper.GenerateExtraPropertiesForItem(
            templateItem, botRole, true);

        var id = new MongoId();

        var item = new Item
        {
            Id = id,
            Template = templateItem.Id,
            ParentId = botInventory.Equipment,
            SlotId = equipmentSlot.ToString(),
            Upd = extraProps == null ? new Upd() : extraProps
        };

        botInventory.Items.Add(item);

        return item;
    }

    public MongoId PutModItemToInventory(
        string botRole,
        BotBaseInventory botInventory,
        string equipmentItemTpl,
        string slotId,
        MongoId parentId)
    {
        var (isItemExists, templateItem) =
            itemHelper.GetItem(equipmentItemTpl);

        if (!isItemExists)
        {
            logger.Error(
                $"[Andern] PutModItemToInventory: wrong template id {equipmentItemTpl} for slot {slotId}");
        }

        var extraProps = botGeneratorHelper.GenerateExtraPropertiesForItem(
            templateItem, botRole, true);

        var id = new MongoId();

        var item = new Item
        {
            Id = id,
            Template = templateItem.Id,
            ParentId = parentId,
            SlotId = slotId,
            Upd = extraProps == null ? new Upd() : extraProps
        };

        botInventory.Items.Add(item);
        return id;
    }

    private List<Item> CreateComplexItem(string tpl, string botRole, TemplateItem templateItem)
    {
        var preset = presetHelper.GetDefaultPresetsByTplKey()[tpl];

        var items = cloner.Clone(preset.Items).ReplaceIDs().ToList();
        items.RemapRootItemId();

        foreach (var item in items)
        {
            var extraProps = botGeneratorHelper.GenerateExtraPropertiesForItem(
                templateItem, botRole);

            item.Upd = extraProps == null ? new Upd() : extraProps;
        }

        return items;
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
        return weightedRandomHelper.GetWeightedValue(GearItemArrayToDictionary(items));
    }

    private Dictionary<string, double> GearItemArrayToDictionary(
        List<GearItem> items)
    {
        var result = new Dictionary<string, double>();

        foreach (var item in items)
        {
            result.Add(item.Id, item.Weight);
        }

        return result;
    }
}
