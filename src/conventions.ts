const bent = require("bent");
const getJSON = bent("json");

export class SepConventions {
  static sep() {
    return "::";
  }
  static tilde() {
    return "~";
  }
}

export class HorizonConventions {
  public readonly delays: number[];
  constructor(delays: number[]) {
    this.delays = delays;
  }

  static horizon_name(name: string, delay: number) {
    return `${delay}${SepConventions.sep()}${name}`;
  }
  static split_horizon_name(key: string): [string, number] {
    const [name, delay] = key.split(SepConventions.sep());
    return [name, parseInt(delay)];
  }
}

export class LeaderboardConventions {
  public readonly LEADERBOARD = `leaderboard${SepConventions.sep()}`;
  public readonly CUSTOM_LEADERBOARD = `custom_leaderboard${SepConventions.sep()}`;

  leaderboard_name(name: string | undefined, delay: number | undefined) {
    if (name == null && delay == null) {
      return `${this.LEADERBOARD.substr(0, this.LEADERBOARD.length - 2)}.json`;
    } else if (name == null) {
      return `${this.LEADERBOARD}${delay}.json`;
    } else if (delay == null) {
      return `${this.LEADERBOARD}${name}`;
    } else {
      return `${this.LEADERBOARD}${HorizonConventions.horizon_name(
        name,
        delay
      )}`;
    }
  }

  /** Names for leaderboards with a given sponsor */
  custom_leaderboard_name(
    sponsor: string,
    name: string | undefined,
    dt: number | undefined
  ) {
    const lb_cat = (name: string | undefined) => {
      if (name != null) {
        if (name.match(/z1~/)) {
          return "zscores_univariate";
        } else if (name.match(/z2~/)) {
          return "zcurves_bivariate";
        } else if (name.match(/z3~/)) {
          return "zcurves_trivariate";
        } else {
          return "regular";
        }
      }
      return "all_streams";
    };

    const lb_month = (dt: number | undefined) => {
      if (dt != null) {
        const d = new Date(dt);
        return d.getMonth();
      }
      return "all_time";
    };

    const prefix = [
      this.CUSTOM_LEADERBOARD.substr(0, this.CUSTOM_LEADERBOARD.length - 2),
      sponsor.replace(/ /g, "_"),
      lb_cat(name),
      lb_month(dt),
    ].join(SepConventions.sep());
    return `${prefix}.json`;
  }
}

export class MiscConventions {
  private readonly DELAYED = `delayed${SepConventions.sep()}`;
  private readonly CDF = `cdf${SepConventions.sep()}`;
  private readonly LINKS = `links${SepConventions.sep()}`;
  private readonly BACKLINKS = `backlinks${SepConventions.sep()}`;
  private readonly MESSAGES = `messages${SepConventions.sep()}`;
  private readonly HISTORY = `history${SepConventions.sep()}`;
  private readonly LAGGED = `lagged${SepConventions.sep()}`;
  private readonly LAGGED_VALUES = `lagged_values${SepConventions.sep()}`;
  private readonly LAGGED_TIMES = `lagged_times${SepConventions.sep()}`;
  private readonly SUBSCRIBERS = `subscribers${SepConventions.sep()}`;
  private readonly SUBSCRIPTIONS = `subscriptions${SepConventions.sep()}`;
  private readonly TRANSACTIONS = `transactions${SepConventions.sep()}`;
  private readonly PREDICTIONS = `predictions${SepConventions.sep()}`;
  private readonly SAMPLES = `samples${SepConventions.sep()}`;
  private readonly BALANCE = `balance${SepConventions.sep()}`;
  private readonly PERFORMANCE = `performance${SepConventions.sep()}`;
  private readonly BUDGETS = `budget${SepConventions.sep()}`;
  private readonly VOLUMES = `volumes${SepConventions.sep()}`;
  private readonly SUMMARY = `summary${SepConventions.sep()}`;
  private readonly CONFIRMS = `confirms${SepConventions.sep()}`;
  private readonly WARNINGS = `warnings${SepConventions.sep()}`;
  private readonly ERRORS = `errors${SepConventions.sep()}`;

  history_name(name: string) {
    return `${this.HISTORY}${name}`;
  }

  lagged_values_name(name: string) {
    return `${this.LAGGED_VALUES}${name}`;
  }

  lagged_times_name(name: string) {
    return `${this.LAGGED_TIMES}${name}`;
  }

  links_name(name: string, delay: number) {
    return `${this.LINKS}${delay}${SepConventions.sep()}${name}`;
  }

  backlinks_name(name: string) {
    return `${this.BACKLINKS}${name}`;
  }

  subscribers_name(name: string) {
    return `${this.SUBSCRIBERS}${name}`;
  }

  subscriptions_name(name: string) {
    return `${this.SUBSCRIPTIONS}${name}`;
  }

  cdf_name(name: string, delay: number | undefined) {
    return `${this.CDF}${delay == null ? name : `${this.CDF}${delay}${SepConventions.sep()}${name}`
      }`;
  }
}

//var cdf = require("@stdlib/stats/base/dists/normal/cdf");
//var Normal = require("@stdlib/stats/base/dists/normal/ctor");
// export class StatsConventions {
//   static normcdf(x: number) {
//     return this._normcdf_function()(x);
//   }

//   static norminv(p: number) {
//     return cdf(p, 0, 1);
//   }

//   // FIXME
//   static _norminv_function() {
//     // FIXME: implement this.
//     throw new Error("Implement inv_cdf");
//   }

//   static _normcdf_function() {
//     return (x: number) => cdf(x, 0, 1);
//   }

//   static zmean_percentile(ps: number[]) {
//     if (ps.length === 0) {
//       return 0.5;
//     }
//     const zscores = ps.map((p) => StatsConventions.norminv(p));
//     const nonNan = ps.filter((p) => !Number.isNaN(p));
//     const avg_zscore = nonNan.reduce((a, c) => a + c, 0) / nonNan.length;
//     return this.normcdf(avg_zscore);
//   }

//   /** Default x-values for cdf */
//   static percentile_abscissa() {
//     return [
//       -2.3263478740408408,
//       -1.6368267885518997,
//       -1.330561513178897,
//       -1.1146510149326596,
//       -0.941074530352976,
//       -0.792046894425591,
//       -0.6588376927361878,
//       -0.5364223812298266,
//       -0.4215776353171568,
//       -0.3120533220328322,
//       -0.20615905948527324,
//       -0.10253336200497987,
//       0.0,
//       0.10253336200497973,
//       0.20615905948527324,
//       0.31205332203283237,
//       0.4215776353171568,
//       0.5364223812298264,
//       0.6588376927361878,
//       0.7920468944255913,
//       0.941074530352976,
//       1.1146510149326592,
//       1.330561513178897,
//       1.6368267885519001,
//       2.3263478740408408,
//     ];
//   }
// }

const { v4: uuidv4 } = require("uuid");

export class StreamConventions {
  static sep() {
    return "::";
  }

  static is_plain_name(name: string) {
    return this.is_valid_name(name) && !name.match(/~/);
  }

  static is_valid_name(name: string) {
    return (
      name.match(/^[-a-zA-Z0-9_~.:]{1,200}\.[json,html]+$/i) &&
      name.indexOf(this.sep()) === -1
    );
  }

  static random_name() {
    return `${uuidv4()}.json`;
  }
}

/** A configuration that is running on the server */
export type RemoteConfig = {
  /** An array of delays for forecasts */
  delays: number[];
  /** The minimum balance of the key */
  min_balance: number;
  /** The minimum length of a Muid that is able to write  */
  min_len: number;
  /** The number of predictions to supply which are sampled from
   * the distribution.
   */
  num_predictions: number;
};

export class URLConventions {
  private static readonly CONFIG_URL =
    "https://config.microprediction.org/config.json";
  private static readonly FAILOVER_CONFIG_URL =
    "https://stableconfig.microprediction.org/config.json";
  private static readonly API_URL = "https://api.microprediction.org";
  private static readonly FAILOVER_API_URL =
    "https://stableapi.microprediction.org";

  private static _cached_config: Promise<RemoteConfig> | undefined;

  static api_url() {
    return this.API_URL;
  }

  static failover_api_url() {
    return this.FAILOVER_API_URL;
  }

  static async get_config(): Promise<RemoteConfig> {
    if (this._cached_config != null) {
      return this._cached_config;
    }

    this._cached_config = getJSON(this.CONFIG_URL);
    return this._cached_config as Promise<RemoteConfig>;
  }
}
