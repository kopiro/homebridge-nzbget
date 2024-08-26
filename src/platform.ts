import type {
  API,
  Characteristic,
  DynamicPlatformPlugin,
  IndependentPlatformPlugin,
  Logging,
  PlatformAccessory,
  PlatformConfig,
  Service,
} from "homebridge";

import { NZBGetPlatformAccessory } from "./platformAccessory.js";
import { NZBConfig, PLATFORM_NAME, PLUGIN_NAME } from "./settings.js";

export interface MyPlatformConfig extends PlatformConfig {
  instances?: NZBConfig[];
}

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
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

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on("didFinishLaunching", () => {
      log.debug("Executed didFinishLaunching callback");
      // run the method to discover / register your devices as accessories
      this.discoverDevices();
    });
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices() {
    for (const config of this.config.instances ?? []) {
      const uuid = this.api.hap.uuid.generate(config.id);

      // create a new accessory
      const accessory = new this.api.platformAccessory(config.name, uuid);
      new NZBGetPlatformAccessory(this, accessory, config);
      this.api.publishExternalAccessories(PLUGIN_NAME, [accessory]);
    }
  }
}
