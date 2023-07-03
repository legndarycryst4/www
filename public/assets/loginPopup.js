function login(){
  return new Promise((resolve, reject) => {
    var w = innerWidth / 2
    var h = innerHeight / 2
    var x = w - (w/2)
    var y = h - (h/2)
    var w = open("https://www.empiressmp0.repl.co/login", "_blank","resizable=no,width="+w+",height="+h+",top="+y+",left="+x)
    function onmsg(event){
      if (event.source !== w) return;
      if (event.data.startsWith("logged:")){
        w.close()
        window.removeEventListener("message", onmsg);
        resolve(event.data.replace("logged:",''))
      }else if(event.data === "canceled"){
        w.close()
        window.removeEventListener("message", onmsg);
        reject()
      }
    }
    window.addEventListener("message", onmsg);
  })
}

//use loggedIn(callback) to see if logged in
//if it detects you aren't logged in
//it will open a log in window

var username = ""
async function loggedIn(notLogged){
  var logged = false;
  if(location.origin.endsWith("www.empiressmp0.repl.co")){
    await fetch("https://www.empiressmp0.repl.co/server/getuser", {credentials:"include"}).then(r => r.text()).then(r => logged=r)
  }else{
    var w = open("https://www.empiressmp0.repl.co/getuser.html", "_blank","resizable=no,width=100,height=100,top=0,left=0")
    await new Promise((resolve, reject) => {
      function onmsg(event){
        if (event.source !== w) return;
        if (event.data.startsWith("logged:")){
          w.close()
          window.removeEventListener("message", onmsg);
          resolve()
          logged = event.data.replace("logged:",'')
        }else if(event.data === "canceled"){
          w.close()
          window.removeEventListener("message", onmsg);
          resolve()
        }
      }
      window.addEventListener("message", onmsg);
    })
  }
  if(logged){
    username = logged
    return logged
  }else{
    if(confirm("Your not logged in. Head over to https://www.empiressmp0.repl.co/login to login. Press ok to log in.")){
      var logged
      await login().then(r => logged = r).catch(r => logged = r)
      if(logged){
        username = logged
        return logged
      }
    }
    notLogged && notLogged()
    return false
  }
}