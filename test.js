import FG from "./firegun.js"

const fg = new FG();

fg.Put("nama/Wasis", {
  firstName: "Wasis",
  lastName: "Sasoko"
})

fg.Get("nama/Wasis").then(s => { console.log(s); })

fg.On("note/1").then(s => { console.log(s); })