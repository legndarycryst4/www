/*
This script is used in most pages of this website
*/

var origin = /*"https://minekhan.repl.co"//*/"https://www.empiressmp0.repl.co"
fetch(origin+"./test").then(() => {
  if(location.origin !== origin){
    location.href = origin + location.pathname
  }
})

const {floor, ceil, abs, round} = Math

var script = document.createElement("script")
script.src = "//cdn.jsdelivr.net/npm/sweetalert2@11"
document.body.appendChild(script)

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const publicVapidKey = 'BMw02isQfiYxHjt1ZqQy8YJDIBVF4F6mlMQl-IVQjioFf41rE9OFxd0Cdz4immJJVDB-L9kZ7QZVMLXoiMUGPE4';

async function subscribe() {
  if(!swRegister) return Swal.fire({
    title:"Wait!",
    text: 'Please wait for service worker to register.',
    icon: 'error',
  })
  if(subscription) return Swal.fire({
    title:"Wait!",
    text: 'You already subscribed.',
    icon: 'error',
  })
  subscription = await swRegister.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
  })
  await fetch('/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
async function sameSubscribe(){
  if(!subscription) console.error("no subscription")
  await fetch('/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

let swRegister, subscription
navigator.serviceWorker.register('/sw.js', {
  scope: '/'
}).then(r => {
  swRegister = r
  windowLoadedForPush++
  mentionNotifications()
})

var script = document.createElement("script")
script.src = "/assets/localforage.js"
document.body.appendChild(script)

let windowLoadedForPush = 0, localforageScript = script
localforageScript.addEventListener("load", function(){
  windowLoadedForPush++
  mentionNotifications()
});
async function mentionNotifications(){
  if(windowLoadedForPush !== 2) return console.log("not mention notifs "+windowLoadedForPush)
  console.log("mention notifs")
  if(await localforage.getItem("noNotifs")) return
  if (await localforage.getItem("notifs")) {
    subscription = await swRegister.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
    })
  }else{
    Swal.fire({
      title:"Notifcations!",
      text:"Please consider allowing notifications, so that we can alert you of new maps, and even chat features in the future!",
      toast: true,
      denyButtonText:"No thank you!",
      confirmButtonText:"Yes please!",
      showConfirmButton:true,
      showDenyButton:true,
      position: 'top-right',
    }).then(async result => {
      if (result.isConfirmed) {
        await localforage.setItem("notifs", "true")
        await subscribe()
        Swal.fire({
          title:"Notifcations!",
          text: 'Thank you for enabling notifications!' ,
          icon: 'success',
        })
      }else if(result.isDenied){
        await localforage.setItem("noNotifs", "true")
        Swal.fire({
          title:"Notifcations!",
          text: "Ok! We respect your privacy, so we will not ask again",
          icon: 'error',
        })
      }
    })
  }  
}


//====================NAVBAR===============
var navbar = document.createElement("div");
navbar.setAttribute("class", "navbar");

navbar.innerHTML = `
  <a class="logo" href="/"><img src="https://www.empiressmp0.repl.co/favicon.ico" height="40px"></a>
  <div class="search-container">
    <form action="/search">
      <input type="text" placeholder="Search..." name="q">
<button type="submit">🔎</button>
    </form>
  </div>

  <a href="/posts" nav="posts">Posts</a>
  `/*<div class="dropdown">
    <a class="dropdown-name">MineKhan Website</a>
    <div class="dropdown-content">
    </div>
  </div>*/+`
  <a href="/wiki">Wiki</a>
 <a href="/Tickets/browse">Tickets</a>
  <div id="adminNav"></div>

  <a class="right" id="loggedIn" href="/login">Log in</a>
  <div class="dropdown" id="usernameDropdown" style="display:none; float:right;">
    <a class="dropdown-name"></a>
    <div class="dropdown-content">
      <a href="/account">Account</a>
      <a id="usernameDropdown-profile">Profile</a>
    </div>
  </div>
  <a class="right" id="notifs" href="/notifs">Notifications</a>
`
document.body.prepend(navbar)

var style=document.createElement("style")
style.innerHTML = `
.navbar{
  overflow:hidden;
  background:var(--black);
  /*height:47px;*/
}
body[theme=dark] .navbar{
  background:#444;
}
.navbar a{
  float: left;
  display: block;
  color: white;
  text-align: center;
  padding: 14px 20px;
  text-decoration: none;
  cursor:pointer;
}
body[theme=dark] .navbar a{
  color:white;
}
/* Right-aligned link */
.navbar .right {
  float: right;
}
.navbar .logo{
  background:var(--theme);
}
.navbar .search-container{
  /*padding: 6px 10px;
  margin:8px 20px;*/
  padding:4px;
  float:left;
  display:inline-block;
}
/* Change color on hover */
.navbar a:hover {
  background-color: #ddd;
  color: black;
}
body[theme=dark] .navbar a:hover{
  background:#111;
}
.navbar .dropdown{
  display:inline-block;
  background:inherit;
}
.navbar .dropdown > a{
  display:block;
}
.navbar .dropdown .dropdown-name{
  
}
.navbar .dropdown .dropdown-content{
  display:none;
  position:absolute;
  z-index:1;
  background:inherit;
  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
}
.navbar .dropdown .dropdown-content a{
  display:block;
  width:100%;
}
.navbar .dropdown:hover .dropdown-content{
  display:block;
}
`
document.head.appendChild(style)

//================LOGGEDIN==============
function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i <ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function loggedIn(){
  /*return fetch("/server/account", {
    credentials: 'include',
  })*/
  return{then:()=>({then:r=>{r(USERDATA);return{catch:()=>{}}}})}
}
function findUnread(n){
  var a = 0
  for(var i=0; i<n.length; i++){
    if(!n[i].read) a++
  }
  if(a > 0) return a
}
function addBanner(text, bg = "white", color = "black"){
  var div = document.createElement("div")
  div.style.padding = "10px"
  div.style.background = bg
  div.style.color = color
  div.style.borderBottom = "1px solid black"
  div.style.boxShadow = "0px 0px 15px 3px black"
  div.innerHTML = text
  document.body.prepend(div)
}
//addBanner('text here')

let userInfo
var el = document.getElementById("loggedIn")
var notifs = document.getElementById("notifs")
notifs.style.display = "none"
loggedIn().then(data => data.json()).then(r => {
  userInfo = r
  var logged = r && r.username
  if(el && logged){
    var usernameEl = document.querySelector("#usernameDropdown .dropdown-name")
    if(usernameEl){
      el.style.display = "none"
      document.getElementById("usernameDropdown").style.display = "block"
      usernameEl.innerHTML = logged
      usernameEl.href = "/account"
      document.querySelector("#usernameDropdown-profile").href="/user?user="+escape(logged)
    }else{
      el.innerHTML = logged
      el.href = "/account"
    }
    notifs.style.display = ""
    if(r.notifs){
      var amount = findUnread(r.notifs)
      notifs.innerHTML += amount ? (" ("+amount+")") : ""
    }
    if(r.admin){
      document.querySelector("#adminNav").innerHTML = `
<a href="/admin/users.html">Users</a>
<a href="/admin/log.html">Log</a>
`
    }
  }
}).catch(function(e){
  console.log(e)
  addBanner("Something went wrong when fetching","var(--red)")
})
/*
var logged = getCookie("username")
if(logged){
  el.innerHTML = logged
}*/

var script = document.createElement("script")
script.src = "/common.js"
document.body.appendChild(script)

//===============FOOTER=============
var div = document.createElement("div")
div.innerHTML = `
<div>
  <b>Contact legndayrcryst4/shubbleYT</b>
  <ul>
    <li><a href="https://replit.com/@empiressmp0">Replit</a></li>
    <li><a href="/user?user=shubbleYT">My website</a></li>
    <li><a href="mailto:empiressmp0@gmail.com">Gmail (email)</a></li>
  </ul>
</div>
`
div.classList.add("footer")
document.body.appendChild(div)

var style=document.createElement("style")
style.innerHTML = `
.footer {
  padding: 20px;
  display:flex;
  background: #ddd;
  justify-content:center;
  flex-direction:row;
}
body[theme=dark] .footer{
  background:#171717;
}
.footer > div{
  margin:0px 20px;
}
.footer > div > ul{
  list-style-type: none;
  margin: 0;
  padding: 0;
}
.footer > div > ul li{
  margin:10px 0px;
}
.footer > div{
  text-align:center;
}
`
document.head.appendChild(style)

//=========THEME===========
var globTheme
async function updateTheme(theme){
  theme = theme || (await localforage.getItem("theme"))
  document.body.setAttribute("theme", theme)
  document.body.setAttribute("theme2", "")
  if(theme === "glow"){
    document.body.setAttribute("theme", "dark")
    document.body.setAttribute("theme2", "glow")
  }
  globTheme = theme
}
localforageScript.addEventListener("load",() => updateTheme())

function timeDiffString(millis){
  const SECOND = 1000
  const MINUTE = SECOND * 60
  const HOUR = MINUTE * 60
  const DAY = HOUR * 24
  const YEAR = DAY * 365

  if (millis < MINUTE) {
    return "just now"
  }

  let years = floor(millis / YEAR)
  millis -= years * YEAR

  let days = floor(millis / DAY)
  millis -= days * DAY

  let hours = floor(millis / HOUR)
  millis -= hours * HOUR

  let minutes = floor(millis / MINUTE)

  if (years) {
    return `${years} year${years > 1 ? "s" : ""} and ${days} day${days !== 1 ? "s" : ""} ago`
  }
  if (days) {
    return `${days} day${days > 1 ? "s" : ""} and ${hours} hour${hours !== 1 ? "s" : ""} ago`
  }
  if (hours) {
    return `${hours} hour${hours > 1 ? "s" : ""} and ${minutes} minute${minutes !== 1 ? "s" : ""} ago`
  }
  return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
}
function timeString(time){
  return timeDiffString(Date.now() - time) + " | " + (new Date(time).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }))
}
async function getLocalTime(time){
  return await fetch(`/server/getLocalTime?time=${Date.now()}${time ? "&convert="+time : ""}`).then(r => r.json()).then(r => {
    if(r.success){
      return r.time || r.diff
    }else{
      console.error(r.message)
      alert(r.message)
    }
  })
}
async function getLocalTimeString(time){
  time = await getLocalTime(time)
  return timeString(time)
}

function enableUserPopup(el,user){
  var hoveringEl = false, hoveringPopup = false
  el.addEventListener("mouseover", function(e){
    hoveringEl = true
    var popup = el.previousElementSibling
    if(popup && popup.classList.contains("popup")) return
    popup = document.createElement("div")
    popup.className = "popup"
    var popupContent = document.createElement("span")
    popup.appendChild(popupContent)
    popupContent.innerHTML = `<h3 class="skeletonText" style="width:200px;">&nbsp;</h3><br><span class="skeletonText" style="width:300px;">&nbsp;</span><br><span class="skeletonText" style="width:100px;">&nbsp;</span>`
    el.parentNode.insertBefore(popup, el);
    popup.addEventListener("mouseover", function(e){
      hoveringPopup = true
    })
    popup.addEventListener("mouseout", function(e){
      hoveringPopup = false
      setTimeout(function(){
        if(!hoveringPopup && !hoveringEl){
          popup.remove()
        }
      },1000)
    })
    fetch(`/server/account/${user}`).then(r => r.json()).then(r => {
      if(!r){
        return popupContent.innerHTML = "User doesn't exist: "+user
      }
      popupContent.innerHTML = `${r.bg ? '<div class="bg"></div>' : ''}
      <div class="userContent">
      <a href="/user?user=${r.username}"><h3>
      <img class="pfp" style="width:30px;height:30px;border-radius:100%;border:1px solid gray;vertical-align:middle;">
      ${r.username}</h3></a><br>
      ${r.bio ? "@"+r.username+" - "+r.bio.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;") : ""}<br>
      ${r.lastActive ? "Last active: "+timeString(r.lastActive) : ""}</div>`
      if(r.bg) popupContent.querySelector(".bg").backgroundImage = 'url('+r.bg+')'
      popupContent.querySelector(".pfp").src = r.pfp
    })
  })
  el.addEventListener("mouseout", function(e){
    hoveringEl = false
    var popup = el.previousElementSibling
    if(!popup || !popup.classList.contains("popup")) return
    setTimeout(function(){
      if(!hoveringEl && !hoveringPopup){
        popup.remove()
        hoveringPopup = false
      }
    },1000)
  })
}

function formatGetAttributesInString(str){
  var arr = []
  var attribute = "", value = ""
  var inQuotes = false, quoteType = null
  var isValue = false
  for(var l of str){
    if((!inQuotes || l === quoteType) && (l === "'" || l === '"')){
      inQuotes = !inQuotes
      quoteType = l
      if(!inQuotes){
        if(attribute) arr.push([attribute.toLowerCase(),value.toLowerCase()])
        attribute = value = ""
        isValue = false
        quoteType = null
      }
    }else if(!inQuotes && l === " "){
      if(attribute) arr.push([attribute.toLowerCase(),value.toLowerCase()])
      attribute = value = ""
      isValue = false
      quoteType = null
    }else if(!inQuotes && !(isValue && value) && l === "="){
      isValue = true
    }else{
      if(isValue) value += l
      else attribute += l
    }
  }
  if(attribute) arr.push([attribute.toLowerCase(),value.toLowerCase()])
  return arr
}
function formatGetElementsInString(str){
  var main = []
  var element = {elements:main}
  while(str){
    var isText = true
    if(str[0] === "<"){
      var i = 0
      var j = str.indexOf(">")
      if(j === -1){
        isText = true
      }else if(str[i+1] === "/"){
        var tagName = str.substring(i+2,j).toLowerCase()
        if(tagName === element.tagName){
          element = element.parent
          isText = false
        }
      }else if(!formatUnparsedElements.includes(element.tagName)){
        var preclose = (str[j-1] === "/") ? 1 : 0
        var attributeStart = str.indexOf(" ")
        if(attributeStart > j) attributeStart = -1
        var tagEnd = attributeStart === -1 ? j-preclose : attributeStart+i
        attributeStart = attributeStart === -1 ? j-preclose : attributeStart+i+1
        var tagName = str.substring(i+1,tagEnd).toLowerCase()
        var parent = element
        var attributes = formatGetAttributesInString(str.substring(attributeStart,j-preclose))
        element = {tagName,attributes,elements:[],parent}
        parent.elements.push(element)
        if(formatUnclosedElements.includes(tagName) || preclose){
          element = parent
        }
        isText = false
      }
      if(!isText) str = str.substring(j+1,str.length)
    }
    if(isText){
      var i = str.substring(1,str.length).indexOf("<")
      if(i === -1) i = str.length
      else i++
      let str2 = str.substring(0,i)
      if(!formatUnparsedElements.includes(element.tagName)) str2 = str2.replace(/</g,"&lt;").replace(/>/g,"&gt;")
      element.elements.push(str2)
      str = str.substring(i,str.length)
    }
  }
  return main
}
var formatSafeElements = ["h1","h2","h3","h4","h5","h6","p","img","video","audio","a","ul","ol","li","pre","code","br","image-recipe","mc-recipe","font","b","i","big","center","small","span","strike","strong","sub","sup","table","tbody","td","tfoot","th","thead","tr","hr"]
var formatSafeAttributes = ["align","alt","width","height","href","src","media","title","style","target"]
var formatUnclosedElements = ["img","br","hr"]
var formatUnparsedElements = ["pre","code"]
function formatConvertToSafeHtml(elements,addTo){
  for(var e of elements){
    if(typeof e === "string"){
      addTo.insertAdjacentHTML("beforeend",e)
      continue
    }else if(e instanceof HTMLElement){
      addTo.appendChild(e)
      continue
    }
    if(!formatSafeElements.includes(e.tagName)) e.tagName = "span"
    let element = document.createElement(e.tagName)
    addTo.appendChild(element)
    for(let a of e.attributes){
      if(!formatSafeAttributes.includes(a[0]) && !(a[0] === "id" && a[1].startsWith("heading_"))) continue
      element.setAttribute(a[0],a[1])
    }
    if(formatUnclosedElements.includes(e.tagName)) continue
    formatConvertToSafeHtml(e.elements,element)
  }
  return addTo
}
function formatGetElementsByTagName(e,tag, arr = []){
  if(e) for(var i of e){
    if(i.tagName === tag) arr.push(i)
    formatGetElementsByTagName(i.elements,tag,arr)
  }
  return arr
}
function formatGetAttribute(e,a){
  for(var i of e.attributes){
    if(i[0] === a) return i[1]
  }
  return null
}
function formatGetAttributeArr(e,a){
  for(var i of e.attributes){
    if(i[0] === a) return i
  }
}

let notLetterRegex = /[^a-zA-Z]/g, headingNames = ["h1","h2","h3","h4","h5","h6"]
function formatTextInElements(arr){
  let str = ""
  for(var i=0; i<arr.length; i++){
    if(typeof arr[i] === "string"){
      var m = arr[i]
      str += m+" "
      if(userInfo ? userInfo.profanityFilter : true) for(var obj of remove){ //remove bad words
        m = m.replace(obj.replace, "<span style='color:red; background:black;'>"+obj.with+"</span>")
      }
      //m = m.replace(/ /g, "&nbsp;")
      //m = m.replace(/\n/g, "<br>"
      m = m.replace(/@([^ \n]*)/g, "<a href='/user?user=$1'>@$1</a>")
      m = m.replace(
        /(([a-z]+:\/\/)?(([a-z0-9\-]+\.)+([a-z]{2}|aero|arpa|biz|com|coop|edu|gov|info|int|jobs|mil|museum|name|nato|net|org|pro|travel|local|internal|io))(:[0-9]{1,5})?(\/[a-z0-9_\-\.~]+)*(\/([a-z0-9_\-\.]*)(\?[a-z0-9+_\-\.%=&amp;]*)?)?(#[a-zA-Z0-9!$&'()*+.=-_~:@/?]*)?)(\s+|$)/gi
        , "<a href='$1'>$1</a>")
      arr[i] = m
    }else{
      let c = formatTextInElements(arr[i].elements)
      if(headingNames.includes(arr[i].tagName)){
        let has
        for(let j of arr[i].attributes){
          if(j[0] === "id"){
            has = j
            break
          }
        }
        if(has) has[1] = "heading_"+c
        else arr[i].attributes.push(["id","heading_"+c])
      }
    }
  }
  return str.substring(0,str.length-1).replace(notLetterRegex,"-")
}

let remove = (function(){ //wow, this is a really advanced filter
  var arr = [
    {replace:["k","c","u","f"].reverse().join(""), optional:["c"]},
    {replace:["t","n","u","c"].reverse().join(""), optional:["u"]},
    {replace:"stupid", with:"very not smart", optional:["u","i"]},
    {replace:"dumby", with:"not smart", optional:["b","y"],noEnd:"p"},
    {replace:"bitch",with:"female dog, wolf, fox, or otter", optional:["i","h"]},
    {replace:"shit",with:"poo poo",noStart:"[a-z]", optional:["i"]},
    {replace:"crap",with:"something of extremely poor quality",noStart:"s"},
    {replace:"ass",with:"animal of the horse family",noStart:"[a-z]",noEnd:"[a-rt-z]"},
    {replace:"sex",with:"gender",noStart:"[a-z]"}
  ]
  var between = "[THELETTER \\\-_\*.,|`~\\/\\\\!&\?\\\[\\\]'\":;]*" //there might be characters between, like this: b.a.d
  var subs = {
    i:["1","!","|","l"],
    u:["v","µ"],
    f:["ƒ"],
    v:["\\\/"]
  } //letters could be replaced like this: stvpid
  arr.forEach((obj, i) => {
    var str = "", value, witH
    if(typeof obj === "string") value = obj, witH = "bad"
    else value = obj.replace, witH = obj.with || "bad"
    if(obj.noStart) str += "(?<!"+obj.noStart+")" //negative look behind
    for(var j=0; j<value.length; j++){
      var letter = value[j], group = value[j]
      if(subs[letter]){
        group = "("+letter+"|"+subs[letter].join("|")+")"
        letter += subs[letter].join("")
      }
      if(obj.optional && obj.optional.includes(value[j])) group = ""
      if(j+1 === value.length) str += group
      else str += group + between.replace("THELETTER",letter)
    }
    if(obj.noEnd) str += "(?!"+obj.noEnd+")"
    arr[i] = {original:value,replace:new RegExp("("+str+")", "gi"),with:witH}
  })
  return arr
})()

function format(m){
  var elements = formatGetElementsInString(m)

  prismHilite(elements)
  var r = formatGetElementsByTagName(elements,"image-recipe")
  for(var i=0; i<r.length; i++){
    var a = r[i].elements.join("").split("\n")
    a.pop(); a.shift() //remove first and last
    r[i].elements = a.map(v => v ? `<img src="https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.19.2/assets/minecraft/textures/${v}.png">` : "<div></div>")
  }
  r = formatGetElementsByTagName(elements,"font")
  for(var i=0; i<r.length; i++){
    var font = formatGetAttribute(r[i],"font")
    if(font){
      var s = formatGetAttributeArr(r[i],"style") || ["style",""]
      s += "fontFamily:"+font+";"
    }
  }
  formatTextInElements(elements)
  m = formatConvertToSafeHtml(elements,document.createElement("div")).innerHTML

  return m
  //return md.render(m).replace(/\n$/,"")
}
function prismHilite(el){
  if(!window.Prism) return
  var pres = formatGetElementsByTagName(el,"pre")
  for(var i=0; i<pres.length; i++){
    var pre = pres[i]
    var lang = formatGetAttribute(pre,"codeType")
    var notcode = formatGetAttribute(pre,"notcode")
    if(!lang) lang = "javascript"
    if(Prism.languages[lang] && notcode === null){
      pre.elements = [Prism.highlight(pre.elements.join(""), Prism.languages[lang], lang).replace(/\./g,"&period;")]
    }
  }
}

var prismVersion = "1.24.1"

var script = document.createElement("script")
script.src = "https://cdnjs.cloudflare.com/ajax/libs/prism/"+prismVersion+"/prism.min.js"
document.head.appendChild(script)

var prismTheme = localStorage.getItem("theme") === "dark" ? "prism-dark" : "prism"
var link = document.createElement("link")
link.rel = "stylesheet"
link.href = "https://cdnjs.cloudflare.com/ajax/libs/prism/"+prismVersion+"/themes/"+prismTheme+".min.css"
document.head.appendChild(link)

var style = document.createElement('style')
style.innerHTML = `
.format pre{
  padding:10px;
  background:#f8f4f4;
  color:black;
  white-space:pre-wrap;
}
.format pre[inline]{
  display: inline-block;
  padding: 0 2px;
  margin: 0;
}
body[theme=dark] .format pre{
  color:white;
  background:black;
}

.format img, .format video{
  max-width:100%;
}

mc-recipe, image-recipe{
  display: flex;
  flex-wrap: wrap;
  width:144px;
  image-rendering:pixelated;
  outline:2px solid black;
}
mc-recipe > *, image-recipe > *{
  width:48px;
  height:48px;
  outline:1px solid black;
}

@font-face{
  font-family:mojangles;
  src:url('https://minekhan.thingmaker.repl.co/mojangles.ttf');
}
`
document.head.appendChild(style)