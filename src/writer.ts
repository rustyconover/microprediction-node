const bent = require("bent");
import qs from "querystring";
import { API_URL } from "./config";
const getJSON = bent("json");
const put = bent("PUT", 200);
const deleteHttp = bent("PUT", 200);
const patch = bent("PATCH", 200);

export class MicroWriter {
  private readonly base_url: string = API_URL;
  private readonly write_key: string;
  constructor(write_key: string, base_url: string | undefined) {
    if (base_url != null) {
      this.base_url = base_url;
    }

    this.write_key = write_key;
  }

  async get_home() {
    return await getJSON(`${this.base_url}/live/${this.write_key}`);
  }

  /** Create or update a stream */
  async set(name: string, value: number) {
    const res = await put(
      `${this.base_url}/live/${name}?${qs.encode({
        write_key: this.write_key,
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
      write_key: this.write_key,
      values: values.join(","),
    };
    return await put(`${this.base_url}/copuls/?${qs.encode(body)}`);
  }

  async touch(name: string) {
    const res = await patch(
      `${this.base_url}/live/${name}?${qs.encode({
        write_key: this.write_key,
      })}`
    );
    return res;
  }

  async get_errors() {
    return await getJSON(`${this.base_url}/errors/${this.write_key}`);
  }

  /** Clear log of errors */
  async delete_errors() {
    return await deleteHttp(`${this.base_url}/errors/${this.write_key}`);
  }

  /** Retrieve private log information */
  async get_warnings() {
    return await getJSON(`${this.base_url}/warnings/${this.write_key}`);
  }

  /** Clear warnings */
  async delete_warnings() {
    return await deleteHttp(`${this.base_url}/warnings/${this.write_key}`);
  }

  async get_balance() {
    return await getJSON(`${this.base_url}/balance/${this.write_key}`);
  }

  /** Transfer some balance into the write_key by reducing balance of source key */
  async put_balance(source_write_key: string, amount: number) {
    if (amount < 0) {
      throw new Error("Amount must be > 0");
    }
    return await put(
      `${this.base_url}/balance/${this.write_key}?${qs.encode({
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
      `${this.base_url}/balance/${recipient_write_key}?${qs.encode({
        source_write_key: this.write_key,
        amount,
      })}`
    );
  }

  // FIXME: bolster_balance_by_mining
  // FIXME: restore_balance_by_mining

  async get_confirms() {
    const result = await getJSON(`${this.base_url}/confirms/${this.write_key}`);
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
      `${this.base_url}/transactions/${this.write_key}`
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
    const result = await getJSON(`${this.base_url}/active/${this.write_key}`);
    return result.map((v: string) => JSON.parse(v));
  }

  async get_performance() {
    const result = await getJSON(`${this.base_url}/active/${this.write_key}`);
    return result.map((v: string) => JSON.parse(v));
  }

  async delete_performance() {
    const result = await deleteHttp(
      `${this.base_url}/performance/${this.write_key}`
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
    if (values.length !== this.num_predictions) {
      throw new Error(
        "The number of predictions supplies does not match the needed amount"
      );
    }
    const comma_sep_values = values.join(",");
    await put(
      `${this.base_url}/submit/${name}?${qs.encode({
        delay,
        write_key: this.write_key,
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
          `${this.base_url}/submit/${name}?${qs.encode({
            write_key: this.write_key,
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
