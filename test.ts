console.log (<any>"Hello World",<any>123);

interface gaga {
    err : string
}

interface gogo {
    a : string,
    b? : string
}

let s : (gaga | gogo)

s = {
    a : "asdasd"
}

let a = s;

a.b = "Hello World";

console.log (s);