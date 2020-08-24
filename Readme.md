# Microprediction for TypeScript/Node.js

An implementation of a [Microprediction.org](https://microprediction.org) client using TypeScript and Node.js.

## Installation

```sh
npm install microprediction
```

## Usage

The code in `test/test.js` tests all of the usage of MicroReader and
MicroWriter.

An example to retrieve the latest value of a stream:

```js
let reader: MicroReader;
let config: MicroReaderOptions;
const test_stream_name = "South_Australia_Electricity_Price.json";
config = await MicroReaderConfig.create({});
reader = new MicroReader(config);

const result = await reader.get_current_value(test_stream_name);
```
