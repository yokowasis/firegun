const { Firegun } = require("../firegun-js");
const fg = new Firegun([],"firedb",true,null,false,8767);

function randomIntFromInterval(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min);
}

jest.setTimeout(500);

var paths = [];
var count = 50;
var iteration = 10;
for (let k = 0; k < iteration; k++) {
  let s = []
  for (let i = 0; i < randomIntFromInterval(1,10); i++) {
    s.push(`level${i}`);
  }
  let path = s.join("/");
  paths.push(path);
  for (let i = 0; i < count; i++) {
    test(`Writing "data-${i}" to node ${path}/${i}`, () => {
      return fg.Put(`${path}/${i}`,{
          "data" : `data-${i}`
      }).then(data => {
        expect(data.ok).toStrictEqual({'' : 1});
      });
    });
  }
}

paths.forEach(path => {
    for (let i = 0; i < count; i++) {
        test(`Reading data-${i} from node ${path}/${i}`, () => {
            return fg.Get(`${path}/${i}`).then(data => {
                expect(data.data).toStrictEqual(`data-${i}`);
            });
          });                
    }
});