const bent = require("bent");
import qs from "querystring";
import { Config, ConfigPartialOptions, ConfigOptions } from "./config";
const getJSON = bent("json");
const put = bent("PUT", 200);
const deleteHttp = bent("PUT", 200);
const patch = bent("PATCH", 200);

export type MicroWriterOptions = ConfigOptions & { write_key: string };

/** Express the configuration of the MicroWriter,
 * since a typescript constructor cannot be asynchronous and the
 * configuration may reach out to a remote server, the config
 * needs to be created and resolved first then the writer can
 * be created.
 */
export class MicroWriterConfig extends Config {
  static async create(
    options: ConfigPartialOptions & { write_key: string }
  ): Promise<MicroWriterOptions> {
    return {
      ...(await Config.create(options)),
      write_key: options.write_key,
    };
  }
}

export class MicroWriter {
  private readonly config: MicroWriterOptions;

  constructor(config: MicroWriterOptions) {
    this.config = config;
  }

  /**
   * Retrieve value or derived value
   *
   * Stream name can be the live data name, for example name=cop.json.
   * Alternatively\nname can be prefixed, such as
   * lagged_values::cop.json or delayed::70::cop.json
   *
   * @param stream_name The stream name
   */
  async get_stream(stream_name: string) {
    return await getJSON(`${this.config.base_url}/live/${stream_name}`);
  }

  /** Create or update a stream */
  async set(stream_name: string, value: number) {
    const res = await put(
      `${this.config.base_url}/live/${stream_name}?${qs.encode({
        write_key: this.config.write_key,
        value,
      })}`
    );
    // It seems this returns a 200 on put, not a 201.
    return res;
  }

  /** Set multiple values linked by copula */
  async cset(names: string[], values: number[]) {
    const body = {
      names: names.join(","),
      write_key: this.config.write_key,
      values: values.join(","),
    };
    return await put(`${this.config.base_url}/copuls/?${qs.encode(body)}`);
  }

  /**
   * Delete a stream
   * Deletes the stream and also deletes the derived quantities.
   *
   * @param stream_name The stream name
   */
  async delete_stream(stream_name: string) {
    const res = await deleteHttp(
      `${this.config.base_url}/live/${stream_name}?${qs.encode({
        write_key: this.config.write_key,
      })}`
    );
    return res;
  }

  /**
   * Modify the time to live
   * Prevents a stream with no recent updates from being deleted.
   *
   * @param stream_name The stream name
   */
  async touch(stream_name: string) {
    const res = await patch(
      `${this.config.base_url}/live/${stream_name}?${qs.encode({
        write_key: this.config.write_key,
      })}`
    );
    return res;
  }

  async get_errors() {
    return await getJSON(
      `${this.config.base_url}/errors/${this.config.write_key}/`
    );
  }

  /** Clear log of errors */
  async delete_errors() {
    return await deleteHttp(
      `${this.config.base_url}/errors/${this.config.write_key}`
    );
  }

  /** Retrieve private log information */
  async get_warnings() {
    return await getJSON(
      `${this.config.base_url}/warnings/${this.config.write_key}/`
    );
  }

  /** Clear warnings */
  async delete_warnings() {
    return await deleteHttp(
      `${this.config.base_url}/warnings/${this.config.write_key}`
    );
  }

  /** Retrieve the balance associated with a write key
   * @returns number The balance
   */
  async get_balance(): Promise<number> {
    return await getJSON(
      `${this.config.base_url}/balance/${this.config.write_key}`
    );
  }

  /** Transfer some balance into the write_key by reducing balance of source key */
  async put_balance(source_write_key: string, amount: number) {
    if (amount < 0) {
      throw new Error("Amount must be > 0");
    }
    return await put(
      `${this.config.base_url}/balance/${this.config.write_key}?${qs.encode({
        source_write_key,
        amount,
      })}`
    );
  }

  async donate_balance(recipient_write_key: string, amount: number) {
    if (amount < 0) {
      throw new Error("Amount must be > 0");
    }
    return await put(
      `${this.config.base_url}/balance/${recipient_write_key}?${qs.encode({
        source_write_key: this.config.write_key,
        amount,
      })}`
    );
  }

  // FIXME: bolster_balance_by_mining
  // FIXME: restore_balance_by_mining

  async get_confirms() {
    const result = await getJSON(
      `${this.config.base_url}/confirms/${this.config.write_key}`
    );
    return result.map((v: string) => JSON.parse(v));
  }

  async get_infrequent_confirms() {
    const confirms = await this.get_confirms();
    const common = new Set(["set", "submit"]);
    return confirms.filter((v: any) => !common.has(v.operation));
  }

  async get_withdrawls() {
    const confirms = await this.get_confirms();
    return confirms.filter((v: any) => v.operation === "withdraw");
  }

  async get_cancellations() {
    const confirms = await this.get_confirms();
    return confirms.filter((v: any) => v.operation === "cancel");
  }

  async get_submissions() {
    const confirms = await this.get_confirms();
    return confirms.filter((v: any) => v.operation === "submit");
  }

  async get_set_confirmations() {
    const confirms = await this.get_confirms();
    return confirms.filter((v: any) => v.operation === "set");
  }

  async get_elasped_since_confirm(): Promise<number | undefined> {
    const confirms = await this.get_confirms();
    if (confirms.length === 0) {
      return;
    }
    const last = confirms[0].epoch_time;
    return Date.now() / 1000 - last;
  }

  async get_transactions(with_epoch: boolean) {
    const result: Array<[string, any]> = await getJSON(
      `${this.config.base_url}/transactions/${this.config.write_key}`
    );
    const values = result.map((v) => v[1]);
    if (with_epoch) {
      result.forEach((v, idx) => {
        v[1].epoch_time = parseInt(result[idx][0].split(/-/)[0]) / 1000;
      });
    }
    return values;
  }

  async get_elapsed_since_transaction() {
    const transactions = await this.get_transactions(true);
    if (transactions.length === 0) {
      return;
    }
    return Date.now() / 1000 - transactions[0].epoch_time;
  }

  async get_active() {
    const result = await getJSON(
      `${this.config.base_url}/active/${this.config.write_key}`
    );
    return result.map((v: string) => JSON.parse(v));
  }

  /** List all horizons and whether there is an active submission */
  async get_performance() {
    const result = await getJSON(
      `${this.config.base_url}/active/${this.config.write_key}`
    );
    return result.map((v: string) => JSON.parse(v));
  }

  async delete_performance() {
    const result = await deleteHttp(
      `${this.config.base_url}/performance/${this.config.write_key}`
    );
    return result.map((v: string) => JSON.parse(v));
  }

  /** Submit a prediction scenerio */
  async submit(name: string, values: number[], delay: number | undefined) {
    if (delay == null) {
      throw new Error(
        "You need to supply a delay parameter to submit a prediction scenario."
      );
    }
    if (values.length !== this.config.num_predictions) {
      throw new Error(
        "The number of predictions supplies does not match the needed amount"
      );
    }
    const comma_sep_values = values.join(",");
    await put(
      `${this.config.base_url}/submit/${name}?${qs.encode({
        delay,
        write_key: this.config.write_key,
        values: comma_sep_values,
      })}`
    );
  }

  /** Cancel a prediction scenerio */
  async cancel(name: string, delays: number | number[] | undefined) {
    if (delays == null) {
      throw new Error("Must pass a delay to cancel");
    }
    if (!Array.isArray(delays)) {
      delays = [];
    }

    if (Array.isArray(delays)) {
      for (const delay in delays) {
        await deleteHttp(
          `${this.config.base_url}/submit/${name}?${qs.encode({
            write_key: this.config.write_key,
            delay,
          })}`
        );
      }
    }
  }

  // FIXME: active_performance
  // FIXME: worst_active_horizons
  // FIXME: cancel_worst_active
}
