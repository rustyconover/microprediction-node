import { expect } from "chai";
import "mocha";
import { MicroWriter, MicroWriterConfig } from "../src/writer";

// An example write key.
const write_key = "928f948d11614f29c2c4d141bb645e1d";

describe("MicroWriter", () => {
  it("should be able to obtain the configuration", async () => {
    const config = await MicroWriterConfig.create({ write_key: "abcd" });
    const writer = new MicroWriter(config);
    expect(writer).to.not.be.undefined;
  });

  it("should be able to get the balance", async () => {
    const config = await MicroWriterConfig.create({
      write_key,
    });
    const writer = new MicroWriter(config);
    // FIXME: Peter is this right?
    expect(await writer.get_balance()).to.equal(0);
  });

  it("should be able to get warnings", async () => {
    const config = await MicroWriterConfig.create({
      write_key,
    });
    const writer = new MicroWriter(config);
    expect(await writer.get_warnings()).to.deep.equal([]);
  });

  it("should be able to get errors", async () => {
    const config = await MicroWriterConfig.create({
      write_key,
    });
    const writer = new MicroWriter(config);
    expect(await writer.get_errors()).to.deep.equal([]);
  });

  it.skip("should be able to touch a stream", async () => {
    const config = await MicroWriterConfig.create({
      write_key,
    });
    const writer = new MicroWriter(config);
    expect(await writer.touch("test123")).to.equal(5);
  });

  it("should be able to write to a stream", async () => {
    const config = await MicroWriterConfig.create({
      write_key,
    });
    const writer = new MicroWriter(config);
    expect(await writer.set("test123.json", 5)).to.equal(5);
  });
});
