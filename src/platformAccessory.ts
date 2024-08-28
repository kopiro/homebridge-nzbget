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
    _config: NZBConfig
  ) {
    this.config = {
      rateMultiplier: 1_000,
      ..._config,
    };

    const url = new URL(
      `${this.config.protocol}://${this.config.host}:${this.config.port}/${this.config.username}:${this.config.password}/jsonrpc`
    );

    this.ng = new Client(url);

    // this.ng.status().then((s) => {
    //   console.log(s);
    // });

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
    Download.setCharacteristic(
      this.platform.Characteristic.ConfiguredName,
      "Download"
    );
    Download.getCharacteristic(this.platform.Characteristic.On)
      .onSet((value: CharacteristicValue) => {
        this.platform.log.debug("Setting Download to", value);
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
    PostProcessing.setCharacteristic(
      this.platform.Characteristic.ConfiguredName,
      "Post Processing"
    );

    PostProcessing.getCharacteristic(this.platform.Characteristic.On)
      .onSet((value: CharacteristicValue) => {
        this.platform.log.debug("Setting Post Processing to", value);
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
        this.platform.Service.Fan,
        "Download Rate",
        "download_rate"
      );
    DownloadRate.setCharacteristic(
      this.platform.Characteristic.Name,
      "Download Rate"
    );
    DownloadRate.setCharacteristic(
      this.platform.Characteristic.ConfiguredName,
      "Download Rate"
    );
    DownloadRate.getCharacteristic(this.platform.Characteristic.On)
      .onSet((value: CharacteristicValue) => {
        this.ng.rate(value ? 100 : 0);
      })
      .onGet(() => {
        return this.ng
          .status()
          .then((status) => (status.DownloadLimit === 0 ? false : true));
      });
    DownloadRate.getCharacteristic(this.platform.Characteristic.RotationSpeed)
      .onSet((value: CharacteristicValue) => {
        this.platform.log.debug("Setting Download Rate to", value);
        if (typeof value !== "number") throw new Error();
        this.ng.rate(Math.floor(value * this.config.rateMultiplier));
      })
      .onGet(() =>
        this.ng.status().then((status) => {
          return Math.floor(
            status.DownloadLimit / (1024 * this.config.rateMultiplier)
          );
        })
      );

    // Scan
    const Scan =
      this.accessory.getService("Scan") ||
      this.accessory.addService(this.platform.Service.Switch, "Scan", "scan");
    Scan.setCharacteristic(this.platform.Characteristic.Name, "Scan");
    Scan.setCharacteristic(this.platform.Characteristic.ConfiguredName, "Scan");
    Scan.getCharacteristic(this.platform.Characteristic.On)
      .onSet((value: CharacteristicValue) => {
        this.platform.log.debug("Setting Scan to", value);
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
