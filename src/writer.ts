const bent = require("bent");
import qs, { stringify } from "querystring";
import { Config, ConfigPartialOptions, ConfigOptions } from "./config";
const getJSON = bent("json");
const put = bent("PUT", 200);
const deleteHttp = bent("DELETE", 308);
const deleteAny = bent("DELETE");

const patch = bent("PATCH", 200);

export type MicroWriterOptions = ConfigOptions & { write_key: string };

export type Confirmation = {
  /** The time of the confirmation */
  time: string;
  /** The unix based epoch time of the confirmation */
  epoch_time: number;
  /** The operation that was confirmed */
  operation: "withdraw" | "cancel" | "submit" | "set";
  /** The stream name */
  name?: string;
  count?: number;
  execution?: boolean;
  delays: Array<number>;
  some_values: Array<number>;
  success: boolean;
  warn: boolean;
};

export type Transaction = {
  /** The time the settlement happened */
  settlement_time: string;
  /** The time of the transaction since the unix epoch in seconds */
  epoch_time: number;
  /** The type of transaction */
  type: "transfer";
  /** The public source key of the transaction */
  source: string;
  /** The public recipient key of the transactions */
  recipient: string;
  /** The maximum amount that this transaction could give */
  max_to_give: string;
  /** The maximum amount the source key could receive */
  max_to_receive: string;
  /** The amount given */
  given: string;
  /** The amount received */
  received: string;
  /** A flag that indicates if the transaction was successful. */
  success: "1" | "0";
  /** A reason for why the transaction could not be successful */
  reason?: string;
};

/**
 * Express the configuration of the MicroWriter,
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
   * Retrieve value or derived value from a schema.
   *
   * Stream name can be the live data name, for example name=cop.json.
   * Alternatively name can be prefixed, such as
   * lagged_values::cop.json or delayed::70::cop.json
   *
   * @param stream_name The stream name
   */
  async get_stream(stream_name: string) {
    return await getJSON(`${this.config.base_url}/live/${stream_name}`);
  }

  /**
   * Create or set a new value on a stream
   *
   * @param stream_name the stream name
   * @param value the value to add to the stream
   *
   * @returns percentiles A average of the percentiles that the
   * algorithms assign to the data point (according to quarentined
   * predictions received further back than the delay seconds)
   */
  async set(
    stream_name: string,
    value: number
  ): Promise<{
    percentiles?: {
      [key: string]: number;
    };
  }> {
    const res = await put(
      `${this.config.base_url}/live/${stream_name}?${qs.encode({
        write_key: this.config.write_key,
        value,
      })}`
    );
    const result = await res.json();
    if (result.error) {
      throw new Error(`Failed to call set on a stream, error: ${result.error}`);
    }
    // It seems this returns a 200 on put, not a 201.
    return {
      percentiles: res.percentiles,
    };
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
   * @returns boolean indicating if the stream was successfully touched.
   */
  async touch(stream_name: string): Promise<boolean> {
    const res = await patch(
      `${this.config.base_url}/live/${stream_name}?${qs.encode({
        write_key: this.config.write_key,
      })}`
    );
    return res.json();
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

  /**
   * Retrieve the balance associated with a write key
   *
   * @returns number The balance for that key, may be negative.
   */
  async get_balance(): Promise<number> {
    return await getJSON(
      `${this.config.base_url}/balance/${this.config.write_key}`
    );
  }

  /**
   * Transfer some balance into the write_key by reducing balance of source key.
   * There is a 10% transfer fee deducted from the balance.
   *
   * @param source_write_key The key where balance should be transferered
   * @param amount The amount of balance to transfer.
   *
   * @returns number indicate 1 if the transfer was successful.
   * */
  async put_balance(
    source_write_key: string,
    amount: number
  ): Promise<Transaction> {
    if (amount < 0) {
      throw new Error("Amount must be > 0");
    }
    const result = await put(
      `${this.config.base_url}/balance/${this.config.write_key}?${qs.encode({
        source_write_key,
        amount,
      })}`
    );
    return result.json();
  }

  /**
   * Donate some balance to a recipient write key.
   *
   * @param recipient_write_key The key where the balance should be donated
   * @param amount The amount of the balance to donate
   */
  async donate_balance(
    recipient_write_key: string,
    amount: number
  ): Promise<Transaction> {
    if (amount < 0) {
      throw new Error("Amount must be > 0");
    }
    const result = await put(
      `${this.config.base_url}/balance/${recipient_write_key}?${qs.encode({
        source_write_key: this.config.write_key,
        amount,
      })}`
    );
    return result.json();
  }

  // FIXME: bolster_balance_by_mining
  // FIXME: restore_balance_by_mining

  async get_confirms(): Promise<Confirmation[]> {
    const result = await getJSON(
      `${this.config.base_url}/confirms/${this.config.write_key}/`
    );
    return result.map((v: string) => JSON.parse(v));
  }

  async get_infrequent_confirms() {
    const confirms = await this.get_confirms();
    const common = new Set(["set", "submit"]);
    return confirms.filter((v) => !common.has(v.operation));
  }

  async get_withdrawls() {
    const confirms = await this.get_confirms();
    return confirms.filter((v) => v.operation === "withdraw");
  }

  async get_cancellations() {
    const confirms = await this.get_confirms();
    return confirms.filter((v) => v.operation === "cancel");
  }

  async get_submissions() {
    const confirms = await this.get_confirms();
    return confirms.filter((v) => v.operation === "submit");
  }

  async get_set_confirmations() {
    const confirms = await this.get_confirms();
    return confirms.filter((v) => v.operation === "set");
  }

  async get_elasped_since_confirm(): Promise<number | undefined> {
    const confirms = await this.get_confirms();
    if (confirms.length === 0) {
      return;
    }
    const last = confirms[0].epoch_time;
    return Date.now() / 1000 - last;
  }

  async get_transactions(with_epoch: boolean = false): Promise<Transaction[]> {
    const result: Array<[string, any]> = await getJSON(
      `${this.config.base_url}/transactions/${this.config.write_key}/`
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

  /**
   * Return active submissions the list of streams that have predictions
   * that could be judged a a list.
   */
  async get_active(): Promise<string[]> {
    return getJSON(`${this.config.base_url}/active/${this.config.write_key}`);
  }

  /**
   * List all horizons and whether there is an active submission
   *
   * A dictionary that contains our cumulative performance.
   *
   */
  async get_performance(): Promise<{}> {
    return getJSON(
      `${this.config.base_url}/performance/${this.config.write_key}`
    );
  }

  async delete_performance(): Promise<number> {
    const result = await deleteAny(
      `${this.config.base_url}/performance/${this.config.write_key}`
    );
    return result.json();
  }

  /** Submit a prediction scenerio
   *
   * @param name The name of the stream where the submission should be sent
   * @param values The predicted values
   * @param delay The delay horizon of the prediction
   *
   */
  async submit(
    name: string,
    values: number[],
    delay: number | undefined
  ): Promise<boolean> {
    if (delay == null) {
      throw new Error(
        "You need to supply a delay parameter to submit a prediction scenario."
      );
    }
    if (values.length !== this.config.num_predictions) {
      throw new Error(
        `The number of predictions supplied does not match the needed amount.  Needs ${this.config.num_predictions}, was supplied with ${values.length}`
      );
    }
    const comma_sep_values = values.join(",");
    const result = await put(
      `${this.config.base_url}/submit/${name}?${qs.encode({
        delay,
        write_key: this.config.write_key,
        values: comma_sep_values,
      })}`
    );

    if (result.status === 200) {
      return result.json();
    } else if (result.status === 403) {
      throw new Error("Unable to add prediction, permission denied.");
    } else {
      throw new Error(
        "There was an error submitting your prediction, check the error log"
      );
    }
  }

  /**
   * Cancel a previously submitted prediction.
   *
   * @param name The stream name
   * @delay delays The delays of which to cancel
   *
   */
  async cancel(name: string, delays: number | number[] | undefined) {
    if (delays == null) {
      throw new Error("Must pass a delay to cancel");
    }
    if (!Array.isArray(delays)) {
      delays = [];
    }

    if (Array.isArray(delays)) {
      for (const delay in delays) {
        const response = await deleteAny(
          `${this.config.base_url}/submit/${name}?${qs.encode({
            write_key: this.config.write_key,
            delay,
          })}`
        );
        if (response.status !== 200) {
          throw new Error("Failed to cancel a submission");
        }
      }
    }
  }

  // FIXME: active_performance
  // FIXME: worst_active_horizons
  // FIXME: cancel_worst_active
}
