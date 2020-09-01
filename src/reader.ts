const bent = require("bent");
import qs from "querystring";
import { ConfigOptions, Config, ConfigPartialOptions } from "./config";
const getJSON = bent("json");

export type MicroReaderOptions = ConfigOptions;

export type StreamSummary = {
  latest_value: number;
  lagged_values: number[];
  lagged_times: number[];
  leaderboard: { [identity: string]: number };
  delays: {
    [delay_amount: string]: {
      leaderboard: { [identity: string]: number };
      delayed_value: number;
    };
  };
};

/**
 * Express the configuration of the MicroReader
 * since a typescript constructor cannot be asynchronous and the
 * configuration may reach out to a remote server, the config
 * needs to be created and resolved first then the writer can
 * be created.
 */
export class MicroReaderConfig extends Config {
  static async create(options: ConfigPartialOptions) {
    return Config.create(options);
  }
}

export class MicroReader {
  private readonly config: MicroReaderOptions;

  constructor(config: MicroReaderOptions) {
    this.config = config;
  }

  /**
   * Return the latest value from the stream
   * @param stream_name The stream name
   */
  async get_current_value(stream_name: string): Promise<number> {
    return await getJSON(`${this.config.base_url}/live/${stream_name}`);
  }

  /**
   * Return the leaderboard for a stream at a particular delay
   *
   * @param stream_name The name of the stream
   * @param delay The delay used for the leaderboard.
   *
   * @returns An object containing the current score for each identity on the leaderboard.
   */
  async get_leaderboard(
    stream_name: string,
    delay: number
  ): Promise<{ [name: string]: number }> {
    return await getJSON(
      `${this.config.base_url}/leaderboards/${stream_name}?${qs.encode({
        delay,
      })}`
    );
  }

  /**
   * Return the overall leaderboard
   *
   * @returns An object containing the current score for each identity
   */
  async get_overall(): Promise<{ [identity: string]: number }> {
    return await getJSON(`${this.config.base_url}/overall/`);
  }

  /**
   * Return the sponsor of a particular stream
   *
   * @returns An object that has the stream name as the key and the sponsor as the value.
   */
  async get_sponsors(): Promise<{ [stream_name: string]: string }> {
    return await getJSON(`${this.config.base_url}/sponsors/`);
  }

  /**
   * Return all of the available streams (the same as get_sponsors)
   *
   * @returns An object that has the stream name as the key and the sponsor as the value.
   */
  async get_streams() {
    return this.get_sponsors();
  }

  /**
   * Return the budget amount for each stream
   *
   * @returns An object that has the stream name as the key and the associated budget amount
   */
  async get_budgets(): Promise<{ [stream_name: string]: number }> {
    return await getJSON(`${this.config.base_url}/budgets/`);
  }

  /**
   * Return summary information about a stream.
   * @param stream_name The stream name
   *
   */
  async get_summary(stream_name: string): Promise<StreamSummary> {
    const data = await getJSON(
      `${this.config.base_url}/live/summary::${stream_name}`
    );

    const delays: StreamSummary["delays"] = {};
    for (const full_delay of Object.keys(data).filter((v) =>
      v.match(/^delay_/)
    )) {
      const amount = full_delay.split("_")[1];
      delays[amount] = {
        leaderboard: data[full_delay][`leaderboard::${amount}::${stream_name}`],
        delayed_value: data[full_delay][`delayed::${amount}::${stream_name}`],
      };
    }
    const result: StreamSummary = {
      latest_value: data[stream_name],
      lagged_values: data[`lagged_values::${stream_name}`],
      lagged_times: data[`lagged_times::${stream_name}`],
      leaderboard: data[`leaderboard::${stream_name}`],
      delays: delays,
    };

    return result;
  }

  /**
   * Retrieve lagged times and values of a stream
   *
   * @param stream_name The stream name
   *
   */
  async get_lagged(stream_name: string): Promise<Array<[number, number]>> {
    return await getJSON(`${this.config.base_url}/lagged/${stream_name}`);
  }

  /**
   * Retrieve lagged values of a time series
   *
   * @param stream_name The stream name
   *
   */
  async get_lagged_values(stream_name: string): Promise<number[]> {
    return await getJSON(
      `${this.config.base_url}/live/lagged_values::${stream_name}`
    );
  }

  /**
   * Retrieve lagged times of a time series
   *
   * @param stream_name The stream name
   * @returns an array of lagged times of the time series
   */
  async get_lagged_times(stream_name: string): Promise<number[]> {
    return await getJSON(
      `${this.config.base_url}/live/lagged_times::${stream_name}`
    );
  }

  /** Retrieve quarantined value */
  async get_delayed_value(stream_name: string, delay?: number) {
    if (delay == null) {
      delay = this.config.delays[0];
    }
    return await getJSON(
      `${this.config.base_url}/live/delayed::${delay}::${stream_name}`
    );
  }

  // FIXME: pending implementation inv_cdf, get_cdf
}
