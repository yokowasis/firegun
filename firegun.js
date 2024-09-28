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
   * @param {{
   * peers?:string[],
   * dbname?:string,
   * localstorage?:boolean,
   * prefix?:string,
   * axe?:boolean,
   * port?:number,
   * gunInstance?:(import('gun').IGunInstance | null),
   * }} option 
   */
  constructor(option) {

    if (option) {
      option.peers = option.peers || [],
        option.dbname = option.dbname || "fireDB",
        option.localstorage = option.localstorage || false,
        option.prefix = option.prefix || "",
        option.axe = option.axe || false,
        option.port = option.port || 8765,
        option.gunInstance = option.gunInstance || null
    }

    this.prefix = option?.prefix || "";
    this.peers = option?.peers || [];
    this.dbname = option?.dbname || "fireDB";

    if (option?.gunInstance) {
      this.gun = option.gunInstance;
    } else {
      // @ts-ignore
      this.gun = Gun({
        file: option?.dbname,
        localStorage: option?.localstorage,
        axe: option?.axe,
        multicast: {
          port: option?.port
        },
        peers: option?.peers
      })
    }

    this.gun = Gun();
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
      let g = this.gun.get(prefix);
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
    let g = this.gun.get(prefix);
    for (const p of paths) {
      g = g.get(p);
    }
    g.put(data);
  }
}