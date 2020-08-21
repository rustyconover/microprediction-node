import { expect } from "chai";
import "mocha";
import { MicroWriter, MicroWriterConfig } from "../src/writer";
import { start } from "repl";

// An example write key.
const write_key = "8b668ca3c6c30b8c28e76874b4222e6e";

describe("MicroWriter", () => {
  const test_stream_name = `node-${Date.now()}.json`;

  let writer: MicroWriter;
  before(async () => {
    const config = await MicroWriterConfig.create({
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
    console.error("Created stream");

    const result = await writer.delete_stream(stream_name);

    expect(result).to.equal(5);
  });

  it.skip("should be able to transfer balances between keys", async () => {
    const starting_balance = await writer.get_balance();

    const other_key = "3f06e5b0d027fb4e33a5207dd112892e";

    const amount = 500000;
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
    expect(result).to.equal(1);

    const ending_balance = await writer.get_balance();
    expect(Math.round(starting_balance - ending_balance)).to.equal(amount);
  });

  it("should be able to return confirmations", async () => {
    const confirms = await writer.get_confirms();
    expect(confirms).to.not.be.undefined;
    expect(Array.isArray(confirms)).to.be.true;
    expect(confirms.length).to.be.greaterThan(0);
  });

  it("should be able to return transactions", async () => {
    const transactions = await writer.get_transactions(false);
    expect(transactions).to.not.be.undefined;
    expect(Array.isArray(transactions)).to.be.true;
    expect(transactions.length).to.be.greaterThan(0);
  });
});
