import {DependencyContainer} from "tsyringe";
import {DatabaseServer} from "@spt/servers/DatabaseServer";
import * as config from "../config/config.json";

export default function vssOverheatFix(container: DependencyContainer): undefined {
    const VSS_TPL = "57838ad32459774a17445cd2";
    const VAL_TPL = "57c44b372459772d2b39b8ce";

    const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
    const tables = databaseServer.getTables();
    const items = tables.templates.items;

    items[VSS_TPL]._props.HeatFactorGun *= config.vssValOverheatMultiplier;
    items[VSS_TPL]._props.HeatFactorByShot *= config.vssValOverheatMultiplier;
    
    items[VAL_TPL]._props.HeatFactorGun *= config.vssValOverheatMultiplier;
    items[VAL_TPL]._props.HeatFactorByShot *= config.vssValOverheatMultiplier;
    
    Object.entries(items)
        .filter(([tpl, itemTemplate]) => itemTemplate._props.Caliber === "Caliber9x39")
        .forEach(([tpl, itemTemplate]) => itemTemplate._props.HeatFactor *= config.vssValOverheatMultiplier);
}
