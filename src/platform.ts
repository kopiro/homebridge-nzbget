import type {
  API,
  Characteristic,
  DynamicPlatformPlugin,
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

export class NZBGetPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

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

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to set up event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info("Loading accessory from cache:", accessory.displayName);
    this.accessories.push(accessory);
  }

  discoverDevices() {
    for (const config of this.config.instances ?? []) {
      const uuid = this.api.hap.uuid.generate(config.id);
      const existingAccessory = this.accessories.find(
        (accessory) => accessory.UUID === uuid
      );

      if (existingAccessory) {
        // the accessory already exists
        this.log.info(
          "Restoring existing accessory from cache:",
          existingAccessory.displayName
        );
        new NZBGetPlatformAccessory(this, existingAccessory, config);
      } else {
        // the accessory does not yet exist, so we need to create it
        this.log.info("Adding new accessory:", config.name);

        // create a new accessory
        const accessory = new this.api.platformAccessory(config.name, uuid);

        // create the accessory handler for the newly create accessory
        // this is imported from `platformAccessory.ts`
        new NZBGetPlatformAccessory(this, accessory, config);

        // link the accessory to your platform
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
          accessory,
        ]);
      }
    }

    // remove any accessories that are no longer present
    this.accessories.forEach((accessory) => {
      if (
        !this.config.instances?.find(
          (config) => accessory.UUID === this.api.hap.uuid.generate(config.id)
        )
      ) {
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
          accessory,
        ]);
        this.log.info(
          "Removing existing accessory from cache:",
          accessory.displayName
        );
      }
    });
  }
}
