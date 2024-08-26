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

    const Download =
      this.accessory.getService("Download") ||
      this.accessory.addService(
        this.platform.Service.Switch,
        "Download",
        "download"
      );
    Download.setCharacteristic(this.platform.Characteristic.Name, "Download");
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

    // Post Processing

    const PostProcessing =
      this.accessory.getService("Post Processing") ||
      this.accessory.addService(
        this.platform.Service.Switch,
        "Post Processing",
        "post_processing"
      );

    PostProcessing.setCharacteristic(
      this.platform.Characteristic.Name,
      "Post Processing"
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

    // Download Rate
    const DownloadRate =
      this.accessory.getService("Download Rate") ||
      this.accessory.addService(
        this.platform.Service.Lightbulb,
        "Download Rate",
        "download_rate"
      );
    DownloadRate.setCharacteristic(
      this.platform.Characteristic.Name,
      "Download Rate"
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

    // Scan
    const Scan =
      this.accessory.getService("Scan") ||
      this.accessory.addService(this.platform.Service.Switch, "Scan", "scan");
    Scan.setCharacteristic(this.platform.Characteristic.Name, "Scan");
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
  }
}
