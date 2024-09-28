/**
 * @typedef {Object} FiregunUser
 * @property {string} alias - The user's alias.
 * @property {Object} pair - The key pair associated with the user.
 * @property {string} pair.priv - The private key.
 * @property {string} pair.pub - The public key.
 * @property {string} pair.epriv - The encrypted private key.
 * @property {string} pair.epub - The encrypted public key.
 * @property {any} [err] - An optional error.
 */

/**
 * @typedef {Object} Ack
 * @property {undefined} err - Indicates no error occurred.
 * @property {Object|string} ok - The acknowledgment result, either as an object with a numeric value or as a string.
 * 
 * @typedef {Object} AckWithError
 * @property {Error} err - The error that occurred.
 * @property {any} ok - The associated value.
 * 
 * @typedef {Ack | AckWithError | void} AckUnion
 */

/**
 * @typedef {Object} Pubkey
 * @property {string} pub - The public key.
 * @property {string} [epub] - An optional encrypted public key.
 */

/**
 * @typedef {Object} chatType
 * @property {boolean} _self - Indicates if the message is from the user themselves.
 * @property {string} alias - The alias of the user sending the message.
 * @property {string} msg - The content of the message.
 * @property {string} timestamp - The time the message was sent.
 * @property {string} id - The unique identifier for the message.
 * @property {string} status - The status of the message.
 */

/**
 * 
 * @param {number} num
 * @param {number} places 
 * @returns 
 */
const zeroPad = (num, places) => String(num).padStart(places, '0')

export const common = {


  /**
   * Sort and array based of their property
   * 
   * e.g. arrays.sort(dynamicSort("timestamp"));
   * 
   * @param {string} property  
   * @returns 
   */
  dynamicSort: (property) => {
    var sortOrder = 1;
    if (property[0] === "-") {
      sortOrder = -1;
      property = property.substr(1);
    }

    const f =
      /**
       * 
       * @param {*} a 
       * @param {*} b 
       * @returns 
       */
      (a, b) => {
        /* next line works with strings and numbers, 
         * and you may want to customize it to your needs
         */
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
      }
    return f;
  },

  /**
   * 
   * @param {HTMLInputElement} fileElement 
   * @returns {Promise<{info:{name:string,size:number,type:string},content:string | ArrayBuffer | null}>}
   */
  fileTobase64: async (fileElement) => {
    return new Promise((resolve) => {
      if (fileElement.files !== null) {
        let file = fileElement.files[0];
        var reader = new FileReader();
        reader.readAsDataURL(file);
        let fileInfo = {
          name: file.name,
          size: file.size,
          type: file.type,
        }
        reader.onload = function () {
          let data = {
            info: fileInfo,
            content: reader.result,
          }
          resolve((data));
        };
        reader.onerror = function (error) {
          console.log('Error: ', error);
        };
      }

    })
  },

  /**
   * Generate Current date and time object
   * @returns 
   */
  getDate: () => {
    let currentdate = new Date();
    let year = currentdate.getFullYear().toString();
    let month = zeroPad(currentdate.getMonth() + 1, 2);
    let date = zeroPad(currentdate.getDate(), 2)
    let hour = zeroPad(currentdate.getHours(), 2)
    let minutes = zeroPad(currentdate.getMinutes(), 2)
    let seconds = zeroPad(currentdate.getSeconds(), 2)
    let miliseconds = zeroPad(currentdate.getMilliseconds(), 3)
    return ({ year: year, month: month, date: date, hour: hour, minutes: minutes, seconds: seconds, miliseconds: miliseconds })
  }

}
