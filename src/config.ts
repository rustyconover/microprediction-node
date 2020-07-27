import { URLConventions, RemoteConfig } from "./conventions";

/** The basic configuration options for objects in MicroPrediction
 *
 */
export type ConfigOptions = RemoteConfig & {
  /** The base URL of the MicroPrediction API */
  base_url: string;
  /** The failover URL of the MicroPrediction API */
  failover_base_url: string;
};

export type ConfigPartialOptions = Partial<ConfigOptions>;

/**
 * Process the basic level configuration which may be
 * fetched from the running API server.
 */
export class Config {
  static async create(options: ConfigPartialOptions): Promise<ConfigOptions> {
    if (options.base_url == null) {
      options.base_url = URLConventions.api_url();
    }

    if (options.failover_base_url == null) {
      options.failover_base_url = URLConventions.failover_api_url();
    }

    if (
      options.num_predictions == null ||
      options.min_len == null ||
      options.min_balance == null
    ) {
      options = {
        // Grab the values from the running config.
        ...(await URLConventions.get_config()),
        ...options,
      };
    }

    return options as ConfigOptions;
  }
}
