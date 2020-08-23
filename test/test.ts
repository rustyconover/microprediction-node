import { expect } from "chai";
import "mocha";
import {
  MicroWriter,
  MicroWriterConfig,
  MicroWriterOptions,
} from "../src/writer";

import {
  MicroReader,
  MicroReaderOptions,
  MicroReaderConfig,
} from "../src/reader";

// An example write key.
const write_key = "82457d14c37df7043cb5d6c0b53bdb30";

describe("MicroReader", () => {
  let reader: MicroReader;
  let config: MicroReaderOptions;
  const test_stream_name = "South_Australia_Electricity_Price.json";
  before(async () => {
    config = await MicroReaderConfig.create({});
    reader = new MicroReader(config);
  });

  it("should be able to return the current value from a stream", async () => {
    const result = await reader.get_current_value(test_stream_name);
    expect(result).to.not.be.undefined;
  });

  it("should be able to retrieve a leaderboard ", async () => {
    for (const delay of config.delays) {
      const result = await reader.get_leaderboard(test_stream_name, delay);
      expect(result).to.not.be.undefined;
      expect(typeof result).to.equal("object");
    }
  });

  it("should be able to retrieve the overall leaderboard", async () => {
    const result = await reader.get_overall();
    expect(result).to.not.be.undefined;
    expect(Object.keys(result).length).to.be.greaterThan(0);
  });

  it("should be able to retrieve the sponsors", async () => {
    const result = await reader.get_sponsors();
    expect(result).to.not.be.undefined;
    expect(Object.keys(result).length).to.be.greaterThan(0);
  });

  it("should be able to retreive all of the budgets for streams", async () => {
    const result = await reader.get_budgets();
    expect(result).to.not.be.undefined;
    expect(Object.keys(result).length).to.be.greaterThan(0);
  });

  it("should be able get the summary for a stream ", async () => {
    const result = await reader.get_summary(test_stream_name);
    expect(result.delays).to.not.be.undefined;
    expect(result.latest_value).to.not.be.undefined;
    expect(result.lagged_values).to.not.be.undefined;
    expect(Array.isArray(result.lagged_times)).to.be.true;
    expect(Array.isArray(result.lagged_values)).to.be.true;
  });

  it("should be able to retrieve lagged values", async () => {
    const result = await reader.get_lagged_values(test_stream_name);
    expect(result).to.not.be.undefined;
    expect(Array.isArray(result)).to.be.true;
  });

  it("should be able to retrieve lagged times", async () => {
    const result = await reader.get_lagged_times(test_stream_name);
    expect(result).to.not.be.undefined;
    expect(Array.isArray(result)).to.be.true;
  });

  it("should be able to retrieve a delayed value", async () => {
    const result = await reader.get_delayed_value(
      test_stream_name,
      config.delays[0]
    );
    expect(result).to.not.be.undefined;
  });
});

describe("MicroWriter", () => {
  const test_stream_name = `node-${Date.now()}.json`;

  let writer: MicroWriter;
  let config: MicroWriterOptions;
  before(async () => {
    config = await MicroWriterConfig.create({
      write_key: write_key,
    });
    writer = new MicroWriter(config);
  });

  it("should be able to obtain the configuration", async () => {
    expect(writer).to.not.be.undefined;
  });

  it("should be able to get the balance", async () => {
    const balance = await writer.get_balance();
    expect(balance).to.not.be.undefined;
  });

  it("should be able to get warnings", async () => {
    expect(await writer.get_warnings()).to.deep.equal([]);
  });

  it("should be able to clear warnings", async () => {
    await writer.delete_warnings();
  });

  it("should be able to get errors", async () => {
    expect(await writer.get_errors()).to.deep.equal([]);
  });

  it("should be able to clear errors", async () => {
    await writer.delete_errors();
  });

  it.skip("should be able to write to a stream", async () => {
    const stream_name = test_stream_name;
    const value = Math.random();
    await writer.set(stream_name, value);
  });

  it.skip("should be able to touch a stream", async () => {
    const result = await writer.touch(test_stream_name);

    expect(result).to.equal(true);
  });

  it.skip("should be able to create and delete a stream", async () => {
    const stream_name = `node1-${Date.now()}`;
    const value = Math.random();
    await writer.set(stream_name, value);

    const result = await writer.delete_stream(stream_name);

    expect(result).to.equal(5);
  });

  it.skip("should be able to transfer balances between keys", async () => {
    const starting_balance = await writer.get_balance();

    const other_key = "3f06e5b0d027fb4e33a5207dd112892e";

    const amount = 5;
    const transfer = await writer.put_balance(other_key, amount);
    expect(transfer).to.equal(1);

    const ending_balance = await writer.get_balance();
    expect(ending_balance - starting_balance).to.equal(amount * 0.9);
  });

  it("should be able to donate balances", async () => {
    const starting_balance = await writer.get_balance();

    const other_key = "3f06e5b0d027fb4e33a5207dd112892e";

    const amount = 5;
    const result = await writer.donate_balance(other_key, amount);
    expect(result.type).to.equal("transfer");

    const ending_balance = await writer.get_balance();
    expect(Math.round(starting_balance - ending_balance)).to.equal(amount);
  });

  it("should be able to return confirmations", async () => {
    const confirms = await writer.get_confirms();
    expect(confirms).to.not.be.undefined;
    expect(Array.isArray(confirms)).to.be.true;
  });

  it("should be able to return transactions", async () => {
    const transactions = await writer.get_transactions(false);
    expect(transactions).to.not.be.undefined;
    expect(Array.isArray(transactions)).to.be.true;
    expect(transactions.length).to.be.greaterThan(0);
  });

  it("should be able to return active submissions", async () => {
    const submissions = await writer.get_active();
    expect(submissions).to.not.be.undefined;
  });

  it("should return your performance", async () => {
    const result = await writer.get_performance();
    expect(typeof result).to.equal("object");
  });

  it("should be able to delete performance", async () => {
    await writer.delete_performance();
  });

  it("should be able to submit a prediction", async () => {
    const needed_predictions = config.num_predictions;
    const samples_from_predictive_distribution = [];
    for (let i = 0; i < needed_predictions; i++) {
      samples_from_predictive_distribution.push(42);
    }

    await writer.submit(
      test_stream_name,
      samples_from_predictive_distribution,
      config.delays[0]
    );
  });

  it("should be able to return active submissions", async () => {
    const submissions = await writer.get_active();
    expect(submissions).to.not.be.undefined;
    expect(submissions.length).to.be.greaterThan(0);
  });

  it("should be able to cancel a prediction", async () => {
    await writer.cancel(test_stream_name, [config.delays[0]]);
  });
});
