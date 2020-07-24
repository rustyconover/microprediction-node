// A javascript implementation of muid.
import path from "path";
import fs from "fs";
import crypto from "crypto";

interface FoundKey {
  length: number;
  pretty: string;
  key: string;
  hash: string;
}

const CORPUS: { [key: string]: [number, number] } = JSON.parse(
  fs.readFileSync(path.join(__dirname, "animals.json"), {
    encoding: "utf8",
  })
);

export class Muid {
  /**
   * Return the first 32 bytes a hex encoded string
   * @param key The key to hash (should be lowercase hex)
   * @returns string A 32 byte hash
   */
  static bhash(key: string) {
    const hash = crypto.createHash("sha256");
    hash.update(key);
    return hash.digest("hex").substr(0, 32);
  }

  static shash(source: Buffer) {
    const hash = crypto.createHash("sha256");
    hash.update(source);
    return hash.digest("hex").substr(0, 32);
  }

  static create(difficulty: number = 8) {
    if (difficulty >= 13) {
      console.error(
        "WARNING: Creating a muid with a difficulty >= 13 may take days or weeks"
      );
    }
    const results = this.mine_until(difficulty, 1);
    return results[0];
  }

  static animal(key: string) {
    const bkey = this.bhash(key);
    return this.search(bkey);
  }

  static validate(key: string) {
    return this.animal(key) != null;
  }

  static difficulty(key: string) {
    return (this.animal(key) || "").replace(/ /, "").length;
  }

  /** Mine until the necessary number of keys are produced. */
  static mine_until(difficulty: number, quota: number) {
    const results: FoundKey[] = [];

    while (results.length < quota) {
      const buf = crypto.randomBytes(16);
      const hashed = this.bhash(buf.toString("hex"));

      const l = CORPUS[hashed.substr(0, difficulty)];
      if (l != null) {
        // There is a match.
        results.push(this.report_finding(buf.toString("hex"), hashed, l));
      }
    }
    return results;
  }

  static report_finding(
    key: string,
    code: string,
    key_lengths: [number, number]
  ): FoundKey {
    const pretty = this.pretty(code, ...key_lengths);
    const longest = key_lengths[0] + key_lengths[1];
    const full_code = this.bhash(key);
    return {
      length: longest,
      pretty,
      key,
      hash: full_code,
    };
  }

  /** Return the spirit animal given the public identity */
  static search(code: string) {
    for (let k = 16; k > 5; k--) {
      const code_k = code.substr(0, k);
      const lengths = CORPUS[code_k];
      if (lengths != null) {
        return this.pretty(code_k, ...lengths);
      }
    }
  }

  /** Just the animal's name */
  static pretty(code: string, k1: number, k2: number) {
    const w1 = code.substr(0, k1);
    const w2 = code.substr(k1, k2);
    const r1 = this.to_readable_hex(w1);
    const r2 = this.to_readable_hex(w2);
    return `${this.firstUpper(r1)} ${this.firstUpper(r2)}`;
  }

  private static firstUpper(word: string) {
    return `${word.substr(0, 1).toLocaleUpperCase()}${word.substr(1)}`;
  }

  static to_readable_hex(word: string) {
    return word
      .replace(/0/g, "o")
      .replace(/1/g, "l")
      .replace(/2/g, "z")
      .replace(/3/g, "m")
      .replace(/4/g, "y")
      .replace(/5/g, "s")
      .replace(/6/g, "h")
      .replace(/7/g, "t")
      .replace(/8/g, "x")
      .replace(/9/g, "g");
  }

  static from_readable_hex(word: string) {
    return word
      .replace(/o/g, "0")
      .replace(/l/g, "1")
      .replace(/z/g, "2")
      .replace(/m/g, "3")
      .replace(/y/g, "4")
      .replace(/s/g, "5")
      .replace(/h/g, "6")
      .replace(/t/g, "7")
      .replace(/x/g, "8")
      .replace(/g/g, "9");
  }
}
