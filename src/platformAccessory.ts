import type { CharacteristicValue, PlatformAccessory } from "homebridge";

import type { NZBGetPlatform } from "./platform.js";
import { Client } from "@jc21/nzbget-jsonrpc-api";
import { NZBConfig } from "./settings.js";

export class NZBGetPlatformAccessory {
  private readonly ng: Client;
  private readonly config: NZBConfig & {
    rateMultiplier: number;
  };

  constructor(
    private readonly platform: NZBGetPlatform,
    private readonly accessory: PlatformAccessory,
    private readonly _config: NZBConfig
  ) {
    this.config = {
      // Value is 0-100, assuming a connection of 100mbps, the value is in KPBS, so for 100 we want 100MB/S -> 100000KB/S,
      rateMultiplier: 100_000,
      ..._config,
    };

    const url = new URL(
      `${this.config.protocol}://${this.config.host}:${this.config.port}/${this.config.username}:${this.config.password}/jsonrpc`
    );

    this.ng = new Client(url);

    // set accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, "NZBGet")
      .setCharacteristic(this.platform.Characteristic.Model, "NZBGet")
      .setCharacteristic(this.platform.Characteristic.SerialNumber, "NZBGet");

    // Download

    const Download = new this.platform.api.hap.Service.Switch(
      "Download",
      "download"
    );

    Download.getCharacteristic(this.platform.Characteristic.On)
      .onSet((value: CharacteristicValue) => {
        if (value) {
          this.ng.resumedownload();
        } else {
          this.ng.pausedownload();
        }
      })
      .onGet(() =>
        this.ng
          .status()
          .then((status) => (status.DownloadPaused ? false : true))
      );

    this.accessory.addService(Download);

    // Post Processing

    const PostProcessing = new this.platform.api.hap.Service.Switch(
      "Post Processing",
      "post_processing"
    );

    PostProcessing.getCharacteristic(this.platform.Characteristic.On)
      .onSet((value: CharacteristicValue) => {
        if (value) {
          this.ng.resumepost();
        } else {
          this.ng.pausepost();
        }
      })
      .onGet(() =>
        this.ng.status().then((status) => (status.PostPaused ? false : true))
      );

    this.accessory.addService(PostProcessing);

    // Download Rate

    const DownloadRate = new this.platform.api.hap.Service.Lightbulb(
      "Download Rate",
      "download_rate"
    );

    DownloadRate.getCharacteristic(this.platform.Characteristic.On)
      .onSet((value: CharacteristicValue) => {
        this.ng.rate(value ? 100 : 0);
      })
      .onGet(() => {
        return this.ng
          .status()
          .then((status) => (status.DownloadRate === 0 ? false : true));
      });

    DownloadRate.getCharacteristic(this.platform.Characteristic.Brightness)
      .onSet((value: CharacteristicValue) => {
        if (typeof value !== "number") throw new Error();
        this.ng.rate(Math.floor(value * this.config.rateMultiplier));
      })
      .onGet(() =>
        this.ng
          .status()
          .then((status) => status.DownloadRate / this.config.rateMultiplier)
      );

    this.accessory.addService(DownloadRate);

    // Scan

    const Scan = new this.platform.api.hap.Service.Switch("Scan", "scan");

    Scan.getCharacteristic(this.platform.Characteristic.On)
      .onSet((value: CharacteristicValue) => {
        if (value) {
          this.ng.resumescan();
        } else {
          this.ng.pausescan();
        }
      })
      .onGet(() =>
        this.ng.status().then((status) => (status.ScanPaused ? false : true))
      );

    this.accessory.addService(Scan);
  }
}
