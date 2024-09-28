import FG from "./firegun.js"

const fg = new FG();

fg.Put("nama/Wasis", {
  firstName: "Wasis",
  lastName: "Sasoko"
})

const listen = [];

fg.On("livechat/bimasoft", "", (s) => {
  /** @type {Object.<string,*>} */
  const nodelist = s;
  for (const key in nodelist) {
    if (!listen.includes(key)) {
      console.log(key);
      listen.push(key);
      fg.gun.get('livechat').get('bimasoft').get(key).on(s2 => {
        console.log(s2);
      })
    }
  }
});