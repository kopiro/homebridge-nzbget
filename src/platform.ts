import type {
  API,
  Characteristic,
  IndependentPlatformPlugin,
  Logging,
  PlatformConfig,
  Service,
} from "homebridge";

import { NZBGetPlatformAccessory } from "./platformAccessory.js";
import { NZBConfig, PLUGIN_NAME } from "./settings.js";

export interface MyPlatformConfig extends PlatformConfig {
  instances?: NZBConfig[];
}

export class NZBGetPlatform implements IndependentPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;

  constructor(
    public readonly log: Logging,
    public readonly config: MyPlatformConfig,
    public readonly api: API
  ) {
    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;

    this.log.debug("Finished initializing platform:", this.config.name);

    this.api.on("didFinishLaunching", () => {
      log.debug("Executed didFinishLaunching callback");
      this.discoverDevices();
    });
  }

  discoverDevices() {
    for (const config of this.config.instances ?? []) {
      const uuid = this.api.hap.uuid.generate(config.id);
      const accessory = new this.api.platformAccessory(config.name, uuid);
      new NZBGetPlatformAccessory(this, accessory, config);
      this.api.publishExternalAccessories(PLUGIN_NAME, [accessory]);
    }
  }
}
