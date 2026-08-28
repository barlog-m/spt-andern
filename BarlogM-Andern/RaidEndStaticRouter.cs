using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Utils;

namespace BarlogM_Andern;

[Injectable]
public class RaidEndStaticRouter(
    RaidEndStaticRouterCallbacks callbacks,
    JsonUtil jsonUtil) : StaticRouter(jsonUtil, [
    new RouteAction(
        "/client/match/local/end",
        async (
            url,
            info,
            sessionId,
            output,
            cancellationToken
        ) => await callbacks.HandleRaidEnd()
    )
]);

[Injectable]
public class RaidEndStaticRouterCallbacks(
    HttpResponseUtil httpResponseUtil,
    SeasonRandomizer seasonRandomizer)
{
    public async ValueTask<string> HandleRaidEnd()
    {
        seasonRandomizer.RandimizeSeason();

        return httpResponseUtil.NullResponse();
    }
}