/**
 * This is the name of the platform that users will use to register the plugin in the Homebridge config.json
 */
export const PLATFORM_NAME = "nzbget";

/**
 * This must match the name of your plugin as defined the package.json
 */
export const PLUGIN_NAME = "homebridge-nzbget";

export interface NZBConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: string;
  username: string;
  password: string;
  rateMultiplier?: number;
}
