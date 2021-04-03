import { Node } from 'slate';

// export const DICE_REGEX = /^(^|\s|\()+(?<dice>(\d+)?[dD](\d+)(\s)?([+-](\s)?\d+)?)(\))?$/;
export const DICE_REGEX = /^(^|\s|\()(?<dice>([+-]?(?<number>\d+)?[dD](?<sides>\d+)|[+-][0-9]+))+(\))?$/
export const IMG_URL_REGEX = /\.(jpeg|jpg|gif|png)(\?|$)/;
export const URL_REGEX = new RegExp(
  "^" +
    // protocol identifier (optional)
    // short syntax // still required
    "(?:(?:(?:https?|ftp):)?\\/\\/)" +
    // user:pass BasicAuth (optional)
    "(?:\\S+(?::\\S*)?@)?" +
    "(?:" +
      // IP address exclusion
      // private & local networks
      "(?!(?:10|127)(?:\\.\\d{1,3}){3})" +
      "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +
      "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
      // IP address dotted notation octets
      // excludes loopback network 0.0.0.0
      // excludes reserved space >= 224.0.0.0
      // excludes network & broadcast addresses
      // (first & last IP address of each class)
      "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
      "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
      "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
    "|" +
      // host & domain names, may end with dot
      // can be replaced by a shortest alternative
      // (?![-_])(?:[-\\w\\u00a1-\\uffff]{0,63}[^-_]\\.)+
      "(?:" +
        "(?:" +
          "[a-z0-9\\u00a1-\\uffff]" +
          "[a-z0-9\\u00a1-\\uffff_-]{0,62}" +
        ")?" +
        "[a-z0-9\\u00a1-\\uffff]\\." +
      ")+" +
      // TLD identifier name, may end with dot
      "(?:[a-z\\u00a1-\\uffff]{2,}\\.?)" +
    ")" +
    // port number (optional)
    "(?::\\d{2,5})?" +
    // resource path (optional)
    "(?:[/?#]\\S*)?" +
  "$", "i"
);


export const INLINE_MATCHES = [
  // Record
  {
    element: 'record',
    dataProp: 'record',
    regex: /^@([a-zA-Z0-9]+)$/,
    searchKey: 'name',
    getData: ({ records }) => {
      return Object.values(records).map(r => {
        let name;
        if (typeof r.name === 'object') {
          name = r.name.map(n => Node.string(n))[0];
        } else {
          name = r.name;
        }

        return {
          ...r,
          name,
        }
      });
    },
    stateKey: 'recordMatches',
  },
  {
    element: 'page',
    dataProp: 'page',
    regex: /^#([a-zA-Z0-9]+)$/,
    searchKey: 'name',
    getData: ({ pages }) => Object.entries(pages).map(([key, page]) => ({ name: page.name, key})),
    stateKey: 'pageMatches',
  }
]

export const LIST_TYPES = ['list', 'ordered-list'];