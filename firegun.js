// @ts-check

import Gun from 'gun';

/**
 * 
 * @param {number} length 
 * @returns {string}
 */
function randomAlphaNumeric(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export default class Firegun {

  /** @type {import('gun').IGunInstance} */
  gun

  prefix = "";
  /** @type {string[]} */
  peers = [];
  dbname = "";

  /**
   * 
   * @param {string} prefix 
   * @param {string[]} peers 
   */
  constructor(prefix = "", peers = ["https://ddb.bimasoft.web.id/gun"]) {
    this.gun = Gun(peers);
  }

  /**
   * 
   * @param {string} path 
   * @param {number} wait
   * @param {string} prefix 
   * @returns {Promise<*>}
   */
  async Get(path, wait = 1000, prefix = this.prefix) {
    return new Promise((resolve, reject) => {

      const paths = path.split("/");

      /** @type {*} */
      let g = this.gun;
      if (prefix) {
        g = g.get(prefix);
      }

      for (const p of paths) {
        g = g.get(p);
      }

      g.once(async (s) => {
        resolve(s);
      }, { wait });
    });
  }

  /**
   * 
   * @param {string} path
   * @param {*} data 
   * @param {string} prefix 
   */
  async Put(path, data, prefix = this.prefix) {
    // a/b/c/d
    const paths = path.split("/");

    /** @type {*} */
    let g = this.gun;
    if (prefix) {
      g = g.get(prefix);
    }
    for (const p of paths) {
      g = g.get(p);
    }
    g.put(data);
  }

  async On(path, prefix = this.prefix) {
    const paths = path.split("/");
    /** @type {*} */
    let g = this.gun;
    if (prefix) {
      g = g.get(prefix);
    }
    for (const p of paths) {
      g = g.get(p);
    }
    g.on((s) => {
      console.log(s);
    });
  }
}