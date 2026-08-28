using SPTarkov.Common.Models.Logging;
using SPTarkov.DI.Annotations;
using SPTarkov.Reflection.Patching;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Models.Spt.Mod;
using SPTarkov.Server.Core.Models.Utils;

namespace BarlogM_Andern;

public record ModMetadata : IModMetadata
{
    public string ModGuid { get; init; } = "li.barlog.andern";
    public string Name { get; init; } = "Andern";
    public string Author { get; init; } = "Barlog_M";
    public List<string>? Contributors { get; init; } = [];
    public SemanticVersioning.Version Version { get; init; } = new("3.3.0");
    public SemanticVersioning.Range SptVersion { get; init; } = new("~4.1.3");
    public List<string>? Incompatibilities { get; init; } = [];
    public Dictionary<string, SemanticVersioning.Range>? ModDependencies { get; init; } = new();
    public string? Url { get; init; } = "https://github.com/barlog-m/spt-andern";
    public string License { get; init; } = "MIT";
    public bool HasPrepatcher { get; init; } = false;
}

[Injectable(InjectionType.Singleton, TypePriority = OnLoadOrder.Preload + 1)]
public class Andern(
    ISptLogger<Andern> logger,
    IEnumerable<IRuntimePatch> patches
) : IOnLoad
{
    public Task OnLoadAsync(CancellationToken cancellationToken)
    {
        foreach (var patch in patches)
        {
            patch.Enable();
        }

        return Task.CompletedTask;
    }
}