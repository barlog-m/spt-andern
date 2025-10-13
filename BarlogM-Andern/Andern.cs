using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Models.Spt.Mod;
using SPTarkov.Server.Core.Models.Utils;

namespace BarlogM_Andern;

public record ModMetadata : AbstractModMetadata
{
    public override string ModGuid { get; init; } = "li.barlog.andern";
    public override string Name { get; init; } = "Andern";
    public override string Author { get; init; } = "Barlog_M";
    public override List<string>? Contributors { get; init; }
    public override SemanticVersioning.Version Version { get; init; } = new("3.0.0");
    public override SemanticVersioning.Range SptVersion { get; init; } = new("~4.0.0");
    public override List<string>? Incompatibilities { get; init; }
    public override Dictionary<string, SemanticVersioning.Range>? ModDependencies { get; init; }
    public override string? Url { get; init; } = "https://github.com/barlog-m/spt-andern";
    public override bool? IsBundleMod { get; init; } = false;
    public override string? License { get; init; } = "MIT";
}

[Injectable(InjectionType.Singleton, TypePriority = OnLoadOrder.PreSptModLoader + 1)]
public class Andern(ISptLogger<Andern> logger, ModData modData) : IOnLoad
{
    public Task OnLoad()
    {
        return Task.CompletedTask;
    }
}

