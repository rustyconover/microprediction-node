const bent = require("bent");
import qs from "querystring";
import { ConfigOptions } from "./config";
const getJSON = bent("json");

type MicroReaderOptions = ConfigOptions;

export class MicroReader {
  private readonly config: MicroReaderOptions;

  constructor(config: MicroReaderOptions) {
    this.config = config;
  }

  async get_info(name: string) {
    return await getJSON(`${this.config.base_url}/live/${name}`);
  }

  async get_current_value(name: string): Promise<number> {
    return await getJSON(`${this.config.base_url}/live/${name}`);
  }

  async get_leaderboard(name: string, delay: number) {
    return await getJSON(
      `${this.config.base_url}/live/${name}?${qs.encode({ delay })}`
    );
  }

  async get_overall() {
    return await getJSON(`${this.config.base_url}/overall`);
  }
  async get_sponsors() {
    return await getJSON(`${this.config.base_url}/sponsors`);
  }

  async get_streams() {
    return this.get_sponsors();
  }

  async get_budgets() {
    return await getJSON(`${this.config.base_url}/budgets`);
  }

  async get_summary(name: string) {
    return await getJSON(`${this.config.base_url}/live/summary::${name}`);
  }

  /** Retrieve lagged values of a time series */
  async get_lagged_values(name: string) {
    return await getJSON(`${this.config.base_url}/live/lagged_values::${name}`);
  }

  /** Retrieve lagged values of a time series */
  async get_lagged_times(name: string) {
    return await getJSON(`${this.config.base_url}/live/lagged_times::${name}`);
  }

  /** Retrieve quarantined value */
  async get_delayed_value(name: string, delay?: number) {
    if (delay == null) {
      delay = this.config.delays[0];
    }
    return await getJSON(
      `${this.config.base_url}/live/delayed::${delay}::${name}`
    );
  }

  // FIXME: pending implementation inv_cdf, get_cdf
}
