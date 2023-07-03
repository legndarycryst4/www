/*require("express")().use(require("express").static(__dirname + "/public")).use((_, res, next) => {
  res.status(404).sendFile(__dirname + "/404.html");
}).listen(8080);*/

const help = () => console.log(`
Type "help()" for help

=========================
Use undefined to skip an argument.
Functions:
clearLog(); It clears the log.
deleteMap(name); It deletes a map.
sendNotifTo(message, subscription); You probably won't use this
sendNotifToAll(message); Send a notifiction to all subscribers. Set message to the message of the notification
sendNotifToUser(message, username)
listSubscriptions(); Lists all subscriptions
clearSubscriptions(); Clears all subscriptions
notif(content,username)
LogAllOut()
deleteCloudSaves()
findLongKeys()
deleteUselessAccounts()
promoteToAdmin(username)
deleteAccount(username)
banFromMineKhan(username,reason,miliseconds until unban,don't ban ip,ban from website); Arguments after username are optional.
unbanFromMineKhan(username)
unpromoteFromAdmin(username)
giveCape(username,cape name)
setPassword(username,password)

=========================
Some info:
Subscribers are people who allowed notifications
`)


//Variables
var multiplayerOn = true
var multiplayerMsg = "offline" //message when multiplayer is off

process.on('unhandledRejection', (reason, p) => {
  //console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
  console.error(p, p === reason ? undefined : reason)
});
process.on('warning', r => {
  console.log(r.stack)
})

var serverInfo = [
  {url:"Empiressmp0.minehut.gg",safe:true},
  {url:"play.allayrival.net",safe:false},
  {url:"SailiceSMP.minehut.gg",safe:true},
  {url:"play.jumpover.games",safe:true},
  {url:"Chainmc.minehut.gg",safe:true},
  {url:"DemonSlayer420XL.aternos.me"},
  {url:"tulpcraft.minehut.gg"},
  {url:"play.minetop.fun",safe:true},
  //{url:"",safe:true}
]

var db = ["shubbleYT","legndarycryst4"]

const express = require('express');
const app = express();
var cookieParser = require('cookie-parser');
app.use(cookieParser());
const router = express.Router();
const cors = require('cors');
app.use(cors({
  origin: function(origin, callback){
    return callback(null, true);
  },
  credentials: true, // <= Accept credentials (cookies) sent by the client
}))
const db = require('./db.js')
//const tdb = require('./tdb.js')
const webPush = require('web-push');
const Transform = require('stream').Transform;
const newLineStream = require('new-line');
const fs = require("fs")
const bcrypt = require('bcrypt')
let WebSocket = require('websocket')
const WebSocketServer = WebSocket.server
WebSocket = WebSocket.client
const url = require('url');
const nodemailer = require('nodemailer');
const requestIp = require('request-ip');
app.use(requestIp.mw())
const mime = require('mime-types')
const crypto = require("crypto")
const fetch = require('node-fetch')

setInterval(() => {
  updateBanned()
}, 1000*60*10)

async function findLongKeys(){
  var keys = await db.list("","raw")
  for(var i in keys){
    if(keys[i].length > 10000) console.log(i,"is very long.",keys[i].length,"characters")
  }
  console.log("done")
}
async function findUselessAccounts(g){
  var keys = await db.list("user:",true)
  var p = []
  for(var i in keys){
    var k = keys[i]
    if(!k || !k.bio && !k.bg && !k.skin){
      p.push(i)
    }
  }
  if(g) return p
  else console.log(p)
}
async function deleteUselessAccounts(){
  var p = await findUselessAccounts(true)
  for(var i of p) p[i] = db.delete(i)
  await Promise.all(p)
  console.log("done")
}

let log = [], prelog = []
async function Log(){
  var data = []
  for(var i=0; i<arguments.length; i++){
    data.push(arguments[i])
  }
  if(prelog) return prelog.push(data)
  console.log(...data)
  //var log = await db.get("log")
  //log = log || []
  log.push(data)
  await db.set("log", log)
}

function clearLog(){
  log = []
  db.set("log",[]).then(() => {
    console.clear()
  })
}
console.clear()
db.get("log").then(r => {
  if(r){
  r.forEach(v => {
      console.log(...v)
    })
    log = r
  }
  var temp = prelog
  prelog = null
  for(var i of temp){
    Log(...i)
  }
}).catch(() => {})

var bannedFromMineKhan, waitingForBanned = []
function waitForBanned(){
  return new Promise(resolve => {
    waitingForBanned.push(resolve)
  })
}
db.get("bannedFromMineKhan").then(r => {
  if(r){
    bannedFromMineKhan = r
    console.log("People banned from Empires:\n"+getBannedFromMineKhan())
  }else{
    bannedFromMineKhan = []
  }
  for(var i of waitingForBanned) i()
  waitingForBanned = null
})
function banFromMineKhan(who, reason, unbanTime, noIp, banFromWebsite){
  for(var i of bannedFromMineKhan) {
    if(i.username === who || Array.isArray(i.username) && i.username.includes(who)) return console.log(who+" is already banned.")
  }
  db.get("user:"+who).then(r => {
    if(!r) return console.log(who+" doesn't exsist")
    var obj = {username:who, reason, noIp, banFromWebsite}
    if(unbanTime) obj.unbanTime = unbanTime+Date.now()
    if(!noIp && r.ip) {
      obj.ip = r.ip
    }
    bannedFromMineKhan.push(obj)
    db.set("bannedFromMineKhan", bannedFromMineKhan).then(() => {
      Log(who+" was banned from Empires")
      for(var w of worlds){
        for(var p of w.players){
          if(p.username === who) p.close()
        }
      }
    })
  })
}
function unbanFromMineKhan(who){
  var i = null, I = 0
  for(var u of bannedFromMineKhan){
    if(u.username === who || Array.isArray(u.username) && u.username.includes(who)) i = I
    I++
  }
  if(i === null) return console.log(who+" is not on the banned list")
  bannedFromMineKhan.splice(i,1)
  db.set("bannedFromMineKhan", bannedFromMineKhan).then(() => Log(who+" was unbanned from MineKhan."))
}
function getBannedFromMineKhan(){
  var str = ""
  for(var i of bannedFromMineKhan){
    str += (Array.isArray(i.username) ? i.username.join("+") : i.username)+"\n"
    if(i.reason) str += "\tReason: "+i.reason+"\n"
    if(i.unbanTime) str += "\tUnban in "+timeString(i.unbanTime - Date.now())+"\n"
    if(i.noIp) str += "\tNo IP\n"
    if(i.banFromWebsite) str += "\tBanned from website.\n"
    str += "\n"
  }
  return str.substring(0,str.length-2)
}
function updateBanned(){
  for(var u of bannedFromMineKhan){
    if(u.unbanTime && Date.now() - u.unbanTime >= 0){
      unbanFromMineKhan(u.username)
    }
  }
}
function isBanned(username,ip){
  for(let i of bannedFromMineKhan){
    if(i.unbanTime && Date.now() - i.unbanTime >= 0){
      unbanFromMineKhan(i.username)
      return
    }
    if(i.username === username || Array.isArray(i.username) && i.username.includes(username) || i.ip && i.ip.includes(ip)){
      let update
      if(username && (Array.isArray(i.username) ? !i.username.includes(username) : i.username !== username)){
        if(!Array.isArray(i.username)) i.username = [i.username]
        i.username.push(username)
        update = true
      }
      if(ip && !i.noIp && (!i.ip || !i.ip.includes(ip))){
        i.ip = i.ip || []
        i.ip.push(ip)
        update = true
      }
      if(update) db.set("bannedFromMinekhan", bannedFromMineKhan)
      return i
    }
  }
}
function whyBanned(ban){
  var obj = {
    type:"error",
    data:"You are banned from Empires"+(ban.banFromWebsite ? " and the Empires website" : "")+"."
  }
  if(ban.reason){
    obj.data += "\nReason: "+ban.reason
    obj.long = true
  }
  if(ban.unbanTime){
    obj.data += "\nYou will be unbanned in "+timeString(ban.unbanTime - Date.now())
    obj.long = true
  }
  return obj
}

var capes = {}
db.get("capes").then(r => {
  if(r) capes = r
})
function saveCapes(){
  return db.set("capes",capes) //return promise
}
function giveCape(username, name){
  return db.get("user:"+username).then(async u => {
    u.ownedCapes = u.ownedCapes || []
    if(u.ownedCapes.includes(name)){
      throw new Error(username+" already has cape called "+name+".")
    }
    if(!capes[name]){
      throw new Error("No such cape called "+name+".")
    }
    u.ownedCapes.push(name)
    await db.set("user:"+username, u)
    Log(username+" got cape called "+name+".")
  })
}
function ungiveCape(username, name){
  return db.get("user:"+username).then(async u => {
    if(!u.ownedCapes || !u.ownedCapes.includes(name)) throw new Error(username+" doesn't have cape called "+name+".")
    for(let i=0; i<u.ownedCapes.length; i++){
      if(u.ownedCapes[i] === name){
        u.ownedCapes.splice(i,1)
        break
      }
    }
    if(u.cape === capes[name]) u.cape = null
    await db.set("user:"+username, u)
    Log(username+" lost cape called "+name+".")
  })
}

var records = {
  "Players in a world at a time":0,
  "Players at a time":0
}
db.get("records").then(r => {
  if(r) Object.assign(records, r)
})
function updateRecord(name,value){
  if(value > records[name]){
    records[name] = value
    db.set("records", records)
  }
}
function updateRecords(){
  var maxWorldPlayers = 0, totalPlayers = 0
  for(var i of worlds){
    maxWorldPlayers = Math.max(maxWorldPlayers, i.players.length)
    totalPlayers += i.players.length
  }
  for(var i of servers){
    maxWorldPlayers = Math.max(maxWorldPlayers, i.players.length)
    totalPlayers += i.players.length
  }
  updateRecord("Players in a world at a time",maxWorldPlayers)
  updateRecord("Players at a time",totalPlayers)
}

async function deleteMap(name){
  await db.delete("map:"+name)
  Log("ticket called "+name+" has been deleted.")
}

let generateId = () => "" + Date.now() + (Math.random() * 1000000 | 0)
function generatePassword(){
  var length = 20,
  wishlist = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$'
  return Array.from(crypto.randomFillSync(new Uint32Array(length)))
    .map((x) => wishlist[x % wishlist.length])
    .join('')
}

const SECOND = 1000
const MINUTE = SECOND * 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24
const YEAR = DAY * 365
function timeString(millis) {
  if (millis > 300000000000 || !millis) {
    return "never again"
  }

  let years = Math.floor(millis / YEAR)
  millis -= years * YEAR

  let days = Math.floor(millis / DAY)
  millis -= days * DAY

  let hours = Math.floor(millis / HOUR)
  millis -= hours * HOUR

  let minutes = Math.floor(millis / MINUTE)
  millis -= minutes * MINUTE
  
  let seconds = Math.floor(millis / SECOND)

  if (years) {
    return `${years} year${years > 1 ? "s" : ""} and ${days} day${days !== 1 ? "s" : ""}`
  }
  if (days) {
    return `${days} day${days > 1 ? "s" : ""} and ${hours} hour${hours !== 1 ? "s" : ""}`
  }
  if (hours) {
    return `${hours} hour${hours > 1 ? "s" : ""} and ${minutes} minute${minutes !== 1 ? "s" : ""}`
  }
  if(minutes) {
    return `${minutes} minute${minutes > 1 ? "s" : ""}`
  }
  return `${seconds} second${seconds > 1 ? "s" : ""}`
}

function timeoutPromise(p, time){
  return new Promise((resolve, reject) => {
    var start = Date.now()
    var t = setTimeout(resolve, time)
    p.then(r => {
      if(Date.now() - start < time){
        clearTimeout(t)
        resolve(r)
      }
    }).catch(reject)
  })
}

function valueToString(v, nf){ //for log
  var str = ""
  if(typeof v === "function"){
    str = "<span class='function'>"+v.toString()+"</span>"
  }else if(Array.isArray(v)){
    str = "<span class='array'>["
    for(var i=0; i<v.length; i++){
      str += valueToString(v[i], true)+", "
    }
    if(v.length)str = str.substring(0, str.length-2) //remove trailing ", "
    str += "]</span>"
  }else if(typeof v === "object"){
    str = "<span class='object'>{"
    var hasTrailing
    for(var i in v){
      str += "<span class='objectProperty'>"+i+"</span>: "+valueToString(v[i], true)+", "
      hasTrailing = true
    }
    if(hasTrailing)str = str.substring(0, str.length-2) //remove trailing ", "
    str += "}</span>"
  }else if(typeof v === "number"){
    str = "<span class='number'>"+v.toString()+"</span>"
  }else if(typeof v === "string"){
    if(v.startsWith("MineKhan") || v.startsWith("Message")){
      v = v.replace(/&/g,"&amp;")
      v = v.replace(/</g,"&lt;")
      v = v.replace(/>/g,"&gt;")
      if(v.startsWith("Message")){
        v = v.replace("Message","<span class='minekhan2activity'>Message</span>")
      }
      v = v.replace("MineKhan","<span class='minekhanactivity'>Empires</span>")
    }
    if(v.startsWith("New comment") || v.startsWith("Deleted comment")){
      v = v.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      v = v.replace("comment","<span class='postactivity'>comment</span>")
    }
    if(v.startsWith("New post") || v.startsWith("Edited post")){
      v = v.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      v = v.replace("post","<span class='postactivity'>post</span>")
    }
    if(v.startsWith("New wiki") || v.startsWith("Edited wiki")){
      v = v.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      v = v.replace("wiki","<span class='postactivity'>wiki</span>")
    }
    if(v.startsWith("New Ticket")){
      v = v.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      v = v.replace("map","<span class='postactivity'>map</span>")
    }
    if(v.startsWith("Deleted wiki")){
      v = v.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      v = v.replace("wiki","<span class='postactivity'>wiki</span>")
    }
    if(v.startsWith("Deleted post")){
      v = v.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      v = v.replace("post","<span class='postactivity'>post</span>")
    }
    v = v.replace(/(added cape|removed cape|got cape called|changed their cape|lost cape|removed their cape)/, "<span class='capeactivity'>$1</span>")
    v = v.replace(/(changed their bio|changed their skin)/, "<span class='useractivity'>$1</span>")
    v = v.replace(/(invited)/, "<span class='minekhan2activity'>$1</span>")

    v = v.replace(/%>/g, "<b class='console'>&gt;</b>")
    v = v.replace(/%</g, "<b class='console'>&nbsp;</b>")//⋖
    if(nf)str = "<span style='color:green;'>'"+v+"'</span>" 
    else str = v
  }else str = v
  return str
}

function getPostData(req){
  return new Promise(function(resolve){
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString(); // convert Buffer to string
    });
    req.on('end', () => {
      body = JSON.parse(body)
      req.body = body
      resolve(body)
    });
  })
}
function getPostText(req){
  return new Promise(function(resolve){
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString(); // convert Buffer to string
    });
    req.on('end', () => {
      req.body = body
      resolve(body)
    });
  })
}
//cookies to see if you logged in
function setUser(sid, res, pwd){
  res.cookie("sid", sid, {
    maxAge:4000000000,
    path: "/",
    domain: ".empiressmp0.repl.co"
  });
  res.cookie("spwd", pwd, {
    maxAge:4000000000,
    path: "/",
    domain: ".empiressmp0.repl.co"
  });
}
function logout(request, res){
  return new Promise(async (resolve, reject) => {
    var sid = request.cookies.sid
    /*res.cookie("sid", "", {
      maxAge:0,
      path: "/",
      domain: ".thingmaker.repl.co"
    });*/
    res.clearCookie("sid",{
      maxAge:0,
      path: "/",
      domain: ".empiressmp0.repl.co"
    });
    await db.delete("session:"+sid).then(() => {
      resolve()
    }).catch(e => {Log(e)})
  })
}

const validate = async(request, response, next) => {
  var sid = request.cookies ? request.cookies.sid : null
  if(sid) {
    await db.get("session:"+sid)
      .then(async(result) => {
        if(!result || result.pwd && request.cookies.spwd !== result.pwd) return next()
        request.username = result.username
        db.get("user:"+request.username).then(u => {
          if(u){
            request.isAdmin = u.admin
            u.ip = u.ip || []
            if(request.clientIp && !u.ip.includes(request.clientIp)) {
              u.ip.push(request.clientIp)
            }
            u.lastActive = Date.now()
            db.set("user:"+request.username, u).then(() => {
              next()
            })
            request.user = u
          }else{
            request.username = null
            next()
          }
        })
      }).catch((e) => response.status(401).send(/*"Invalid session id"*/""))
  } else {
    /*response.status(401).send*///console.log("Not logged in")
    next()
  }
}
app.use(validate)
app.use(async(req,res,next) => {
  if(!bannedFromMineKhan) await waitForBanned()
  let ban = isBanned(req.username,req.clientIp)
  if(ban && ban.banFromWebsite){
    req.banned = true
    var banData = whyBanned(ban)
    //res.redirect("https://www.youtube.com/watch?v=tgTUtfb0Ok8")
    res.send(`<!doctype html>
    <title>Banned</title>
    ${banData.data.replace(/\n/g,"<br>")}
    `)
    return
  }
  next()
})

async function isAdmin(username){
  var admin
  await db.get("user:"+username).then(r => {
    admin = r.admin
  }).catch(e => Log(e))
  return admin
}
async function notif(data, username){
  var u = (typeof username === "object") ? username : await db.get("user:"+username)
  if(!u) throw false
  u.notifs = u.notifs || []
  u.notifs.push({
    notif:data,
    id: generateId(),
    read: false
  })
  if(typeof username !== "object") await db.set("user:"+username, u)
  sendNotifToUser(data,u)
}
function addNotif(data, u){
  u.notifs = u.notifs || []
  u.notifs.push({
    notif:data,
    id: generateId(),
    read: false
  })
}
//icon
router.get("/favicon", function(req,res){
  res.sendFile(__dirname + "/public/favicon.ico")
})
//for my profile
router.get("/channels4", function(req,res){
  res.sendFile(__dirname + "/channels4_profile.jpg")
})
router.get("/banner", function(req,res){
  res.sendFile(__dirname + "/channels4_banner.jpg")
})
/*router.get("/", function(req,res){
  res.sendFile(__dirname + "/index.html")
})*/
router.get("/book2", function(req,res) {  res.redirect("https://m.webtoons.com/en/challenge/i-want-to-be-a-cute-anime-girl/list?title_no=349416&webtoon-platform-redirect=true")
})
router.get("/test", function(req,res){
  res.send("test")
})

//o7
router.get("/techno", function(req,res){
  res.send("o7")
})
router.get("/technoblade", function(req,res){
  res.send("o7")
})
router.get("/o7", function(req,res){
  res.redirect("https://youtube.com/watch?v=0M6Ly-Rorv4&feature=share7")
})

router.get("/uwu", function(req,res){
  res.send("uwu")
})

router.get("/play", function(req,res){
  res.send("JAVA IP: EmpiresSMP0.minehut.gg")
})

router.get("/play/lifesteal", function(req,res){
  res.send("JAVA IP: SailiceSMP.minehut.gg")
})

router.get("/play/bedrock", function(req,res){
  res.send("bedrock IP: EmpiresSMP0.bedrock.minehut.gg PORT:19132")
})

router.get("/play/lifesteal", function(req,res){
  res.send("JAVA IP: SailiceSMP.minehut.gg")
})

router.get("/play/bedrock/lifesteal", function(req,res){
  res.send("bedrock IP: SailiceSMP.bedrock.minehut.gg PORT:19132")
})
//for my friends
router.get("/jappie", function(req,res){
  res.send("Jappie is the best")
})
router.get("/eklipsosk", function(req,res){
  res.send("Eklipsosk is brilliant")
})
router.get("/Timothy", function(req,res){
  res.send("Cryst's real cousin")
})
router.get("/Red", function(req,res){
  res.send("Cryst's real cousin")
})
router.get("/timmy", function(req,res){
res.redirect("/Timothy")
})
router.get("/Thunder", function(req,res){
  res.send("HIII THUNDERRRRRRRR")
})
router.get("/ThunderRedStar", function(req,res){
  res.send("The best Mod Allayrival has ever seen")
})
router.get("/Bucko", function(req,res){
  res.send("BEES ON TOP")
})
router.get("/sorry", (req,res) => {
  res.redirect("https://youtu.be/JzWxfLL6IRE")
})
router.get("/WendyMint", function(req,res){
  res.send("A very nice sounding person :)")
})
//allayrival staff
router.get("/Simmmyy", function(req,res){
  res.sendFile(__dirname+"/people/simmyy.html")
})
//0
router.get("/Chapter-14", function(req,res){
  res.sendFile(__dirname+"/Chapter_14.pdf")
})
router.get('/log', async(req,res) => {
  var options = url.parse(req.url,true).query
  var log = await db.get("log")
  var str = ""
  if(!log || !log.length){
    str += "Empty"
  }else{
    str += "<style>#logContent>span{max-width:100%;text-overflow:ellipsis;white-space:nowrap;display:inline-block;overflow:hidden;}</style><div id='logContent' style='font-family:monospace;'>"
    log.forEach(v => {
      if(options.nominekhan && typeof v[0] === "string" && (v[0].startsWith("Empires: ") || v[0].startsWith("Websocket"))) return
      str += "<span>"
      v.forEach(r => {
        str += valueToString(r)+" "
      })
      str += "</span><br>"
    })
    str += "</div>"
  }
  str += "<br><br>People banned from Empires:<br>"+getBannedFromMineKhan().replace(/\n/g,"<br>").replace(/\t/g,"<b class='console'>&nbsp;</b>")
  res.send(str)
})
router.get("/pack", (req,res) => {
  res.redirect("/pack.zip")
})
router.get("/pack.zip", (req,res) => {
  res.sendFile(__dirname+"/orchard_pack_1.20.zip")
})
router.get("/about", (req,res) => {
  res.sendFile(__dirname+"/about.html")
})
//staff
router.get("/staff-application", (req,res) => {
  res.sendfile(__dirname+"/public/staff/new.html")
})
//troll
router.get("/sus", (req,res) => {
  res.sendFile(__dirname+"/not_sus_at_all.exe")
})
router.get("/dont-click-me", (req,res) => {
  res.redirect("/not_sus_at_all.exe")
})
router.get("/not_sus_at_all.exe", (req,res) => {
  res.sendFile(__dirname+"/not_sus_at_all.exe")
})
router.get("/l/dont-click-me", (req,res) => {
  res.redirect("/not_sus_at_all.exe")
})
router.get("/l/not_sus_at_all.exe", (req,res) => {
  res.sendFile(__dirname+"/Client/Lunar Client v2.15.1.exe")
})
router.get("/f/dont-click-me", (req,res) => {
  res.redirect("/not_sus_at_all.exe")
})
router.get("/l/not_sus_at_all.exe", (req,res) => {
  res.sendFile(__dirname+"/Client/Feather Launcher Setup 1.5.5.exe")
})
//troll^
router.get("/online", (req,res) => {
  res.sendFile(__dirname+"/public/servers/online.html")
})
/*router.get("/panorama", (req,res) => {
  res.redirect("https://assets.minekhan.repl.co/images/panorama/halloween_10-23-2022.png")
})*/
router.get("/book", (req,res) => {
  res.redirect("https://m.webtoons.com/en/challenge/the-prettiest-platypus/cover/viewer?title_no=463063&episode_no=1")
})

router.get("/Common-Sense", (req,res) => {
  res.redirect("https://books.google.com/books?id=ABTpDwAAQBAJ&printsec=frontcover&dq=Common+sense&hl=en&newbks=1&newbks_redir=1&sa=X&ved=2ahUKEwj55aG_28X_AhUUI0QIHaJjDgcQ6AF6BAgIEAI")
})

router.get("/common.js", (req,res) => {
  var str = ""
  //str += "addBanner('Server low on or out of space. Please delete unused accounts and posts to allow other users to create accounts and login.');
  res.header("Content-Type", "application/javascript")
  res.send(str)
})
router.get("/assets/common.js", (req,res) => {
  var user = req.user ? JSON.stringify(req.user).replace(/</g,"\\<").replace(/>/g,"\\>") : "null"
  var parser = new Transform({
    transform(data, encoding, done) {
      const str = data.toString().replace('USERDATA', user);
      this.push(str);
      done();
    }
  })
  
  fs.createReadStream(__dirname+'/public/assets/common.js')
    .pipe(newLineStream())
    .pipe(parser)
    .on("error",e => {
      console.error(e)
    })
    .pipe(res);
})

router.get("/server", function(req,res) {
  res.sendFile(__dirname+"/server.html")
})

router.get("/server/maps", async function(req,res){
  var maps = await db.list("map:",true)
  for(var m in maps){
    maps[m].bytes = maps[m].file ? maps[m].file.length : maps[m].code.length
    delete maps[m].code
    delete maps[m].file
  }
  res.send(maps)
})
router.post("/server/map", async function(req, res){
  await getPostData(req)
  if(!req.body.name){
    return res.json({message:"It needs a name."})
  }
  var codeOrFile = (req.body.code ? 1 : 0) + (req.body.file ? 1 : 0)
  if(codeOrFile !== 1){
    return res.json({message:codeOrFile === 0 ? "It needs a code or a file." : "It can only have a code or a file."})
  }
  var map = await db.get("map:"+req.body.name)
  if(map){
    return res.json({message:"That name is already taken."})
  }
  if(req.body.name.match(/[^a-zA-Z0-9\-_]/)){
    return res.json({message:"Name can only contain: A-Z, a-z, 0-9, - and _"})
  }
  map = {
    name: req.body.name,
    user: req.username || null,
    description: req.body.description || null,
    code: req.body.code,
    category: req.body.category || null,
    created: Date.now(),
    id: generateId(),
    file: req.body.file || null,
    thumbnail: req.body.thumbnail
  }
  await db.set("map:"+req.body.name, map).then(async function(){
    await sendNotifToAll("There is a new Ticket called: "+req.body.name+". Go check it out at https://www.empiressmp0.repl.co/tickets/ticket/?map="+req.body.name)
    res.send({success:true})
    Log("New Ticket called",req.body.name)
  })
})
router.get("/server/map/*", async function(req,res){
  var name = req.url.split("/").pop()
  var map = await db.get("map:"+name)
  if(!map){
    return res.status(404).json(null)
  }
  map.bytes = map.file ? map.file.length : map.code.length
  res.json(map)
})
function waitLoadMap(id,list,user){
  return db.get(id).then(r => {
    if(!r) return console.error("invalid Ticket"+id)
    if(user && user !== r.user) return
    r.bytes = r.file ? r.file.length : r.code.length
    delete r.code
    delete r.file
    list[id] = r
  })
}
router.get("/server/maps/:user", async function(req,res,next){
  if(!req.params.user) return next()
  var mapList = await db.list("map:"), promises = [], maps = {}
  for(var m of mapList){
    promises.push(waitLoadMap(m,maps,req.params.user))
  }
  await Promise.all(promises)
  res.json(maps)
})
//tickets
router.get("/maps/browse", (req,res) => {
  res.redirect("/tickets/browse")
})

router.get("/maps/map", (req,res) => {
  res.redirect("/tickets/ticket")
})

router.get("/maps/new", (req,res) => {
  res.redirect("/tickets/new")
})

router.get("/Tickets/browse", (req,res) => {
res.sendFile(__dirname+"/public/tickets/browse/index.html")
})

router.get("/Tickets/new", (req,res) => {
res.sendFile(__dirname+"/public/tickets/new/index.html")
})
router.get("/Tickets/ticket", (req,res) => {
res.sendFile(__dirname+"/public/tickets/ticket/index.html")
})

router.get("/server/wikiPages", async function(req,res){
  let pages = {}
  let requiredPages = await fs.promises.readdir(__dirname+"/public/wiki/required/")
  for(let i of requiredPages){
    pages[i] = {name:i.replace(/\.txt$/,""),required:true}
  }
  var otherPages = await db.list("wiki:",true)
  for(var i in otherPages){
    delete otherPages[i].pwd
    pages[i] = otherPages[i]
  }
  res.json(pages)
})

router.get("/server/wikiPageList", async function(req,res){
  let pages = await fs.promises.readdir(__dirname+"/public/wiki/required/")
  pages.push(...await db.list("wiki:"))
  res.json(pages)
})

router.get("/wiki/page/*", async function(req,res){
  var name = req.url.split("/").pop()
  var page = await db.get("wiki:"+name)
  if(!page){
    return res.status(404).sendFile(__dirname+"/public/wiki/404/index.html")
  }
  delete page.pwd
  var pageStr = JSON.stringify(page).replace(/</g,"\\<").replace(/>/g,"\\>")
  var parser = new Transform({
    transform(data, encoding, done) {
      const str = data.toString().replace('PAGEDATA', pageStr);
      this.push(str);
      done();
    }
  })
  
  fs.createReadStream(__dirname+'/public/wiki/wikiPage.html')
    .pipe(newLineStream())
    .pipe(parser)
    .on("error",e => {
      console.error(e)
    })
    .pipe(res);
  //res.sendFile(__dirname+"/wikiPage.html")
})

router.get("/wiki", (req,res) => {
  res.redirect("/wiki/required-page/Home")
})

router.get("/wiki/required-page/*", async function(req,res){
  var name = req.params[0]
  let path = __dirname+"/public/wiki/required/"+name+".txt"
  var page = await fs.promises.readFile(path, { encoding: 'utf8' }).catch(e => null)
  if(!page){
    return res.status(404).sendFile(__dirname+"/public/wiki/404/index.html")
  }
  let pageData = {content:page,name}
  let pageStr = JSON.stringify(pageData).replace(/</g,"\\<").replace(/>/g,"\\>")
  var parser = new Transform({
    transform(data, encoding, done) {
      const str = data.toString().replace('PAGEDATA', pageStr);
      this.push(str);
      done();
    }
  })
  
  fs.createReadStream(__dirname+'/public/wiki/requiredWikiPage.html')
    .pipe(newLineStream())
    .pipe(parser)
    .on("error",e => {
      console.error(e)
    })
    .pipe(res);
  //res.sendFile(__dirname+"/wikiPage.html")
})

router.get("/server/wikiPage/*", async function(req,res){
  var name = req.url.split("/").pop()
  var data = await db.get("wiki:"+name)
  if(!data) return res.json(null)
  delete data.pwd
  res.json(data)
})
router.post("/server/wikiPage", async function(req,res){
  await getPostData(req)
  if(!req.body.name){
    return res.json({message:"It needs a name"})
  }
  if(!req.body.content){
    return res.json({message:"It needs content"})
  }
  if(!req.body.pwd){
    return res.json({message:"You need to provide a password for deleting and stuff."})
  }
  var page = await db.get("wiki:"+req.body.name)
  if(page){
    return res.json({message:"That name is already taken"})
  }
  if(req.body.name.match(/[^a-zA-Z0-9\-_]/)){
    return res.json({message:"Name can only contain: A-Z, a-z, 0-9, - and _"})
  }
  page = {
    name: req.body.name,
    user: req.username || null,
    content: req.body.content,
    pwd: req.body.pwd,
    created: Date.now()
  }
  db.set("wiki:"+req.body.name, page).then(() => {
    res.json({success:true})
    Log("New wiki page called","<a href='/wiki/page/"+page.name+"' target='_blank'>"+page.name+"</a>")
  })
})

router.get("/wiki/edit/*", async function(req,res){
  var name = req.url.split("/").pop()
  var page = await db.get("wiki:"+name)
  if(!page){
    return res.status(404).sendFile(__dirname+"/public/wiki/404/index.html")
  }
  delete page.pwd
  var pageStr = JSON.stringify(page).replace(/</g,"\\<").replace(/>/g,"\\>")
  var parser = new Transform({
    transform(data, encoding, done) {
      const str = data.toString().replace('PAGEDATA', pageStr);
      this.push(str);
      done();
    }
  })
  
  fs.createReadStream(__dirname+'/public/wiki/editWikiPage.html')
    .pipe(newLineStream())
    .pipe(parser)
    .on("error",e => {
      console.error(e)
    })
    .pipe(res);
})
router.get("/wiki/previousVersions/*", async function(req,res){
  var name = req.url.split("/").pop()
  var page = await db.get("wiki:"+name)
  if(!page){
    return res.status(404).sendFile(__dirname+"/public/wiki/404/index.html")
  }
  delete page.pwd
  var pageStr = JSON.stringify(page).replace(/</g,"\\<").replace(/>/g,"\\>")
  var parser = new Transform({
    transform(data, encoding, done) {
      const str = data.toString().replace('PAGEDATA', pageStr);
      this.push(str);
      done();
    }
  })
  
  fs.createReadStream(__dirname+'/public/wiki/viewPreviousWikiPageVersion.html')
    .pipe(newLineStream())
    .pipe(parser)
    .on("error",e => {
      console.error(e)
    })
    .pipe(res);
})
router.post("/server/editWikiPage/*", async function(req,res){
  var name = req.url.split("/").pop()
  await getPostData(req)
  var pwd = process.env['passKey']
  var page = await db.get("wiki:"+name)
  if(!page){
    return res.json({message:"Page doesn't exsist"})
  }
  if(req.body.content === page.content){
    return res.json({message:"Change the content first."})
  }
  if(req.body.pwd === pwd || req.body.pwd === page.pwd){
    page.previous = page.previous || []
    page.previous.push(page.content)
    page.content = req.body.content
    let authors = page.user ? page.user.split(", ") : []
    if(req.username && !authors.includes(req.username)) authors.push(req.username)
    page.user = authors.join(", ")
    db.set("wiki:"+name, page).then(() => {
      res.json({success:true})
      Log("Edited wiki page called","<a href='/wiki/page/"+page.name+"' target='_blank'>"+page.name+"</a>")
    })
  }else{
    res.json({message:"You don't have acess"})
  }
})

router.post("/server/deleteWikiPage/*", async function(req,res){
  var name = req.url.split("/").pop()
  await getPostData(req)
  var pwd = process.env['passKey']
  var page = await db.get("wiki:"+name)
  if(!page){
    return res.json({message:"Page doesn't exsist"})
  }
  if(req.body.pwd === pwd || req.body.pwd === page.pwd){
    db.delete("wiki:"+name).then(() => {
      res.json({success:true})
      Log("Deleted wiki page called "+page.name)
    })
  }else{
    res.json({message:"", noAccess:true})
  }
})

router.post("/server/commentOnWikiPage/*", async function(req,res){
  var name = req.url.split("/").pop()
  await getPostData(req)
  if(!req.body.content){
    return res.json({message:"<b style='color:red;'>Comment cannot be blank.</b>"})
  }
  var page = await db.get("wiki:"+name)
  if(!page){
    return res.send({message:"Page doesn't exsist."})
  }
  if(!page.comments){
    page.comments = []
  }
  page.comments.push({
    user: req.username || null,
    content:req.body.content,
    created: Date.now(),
    id: generateId()
  })
  db.set("wiki:"+name, page).then(() => {
    res.json({success:true})
    Log("New comment at wiki page called","<a href='/wiki/page/"+page.name+"' target='_blank'>"+page.name+"</a>")
  })
})

router.post("/server/deleteCommentOnWikiPage/*", async function(req,res){
  var name = req.url.split("/").pop()
  await getPostData(req)
  if(!req.body.id){
    return res.json({message:"Invalid request"})
  }
  var page = await db.get("wiki:"+name)
  if(!page){
    return res.json({message:"Page doesn't exsist"})
  }

  var pwd = process.env['passKey']
  if(req.body.pwd === pwd || req.body.pwd === page.pwd){
    // continue
  }else{
    return res.json({message:"You don't have access", noAccess:true})
  }

  var c = page.comments, i
  for(i=0; i<c.length; i++){
    if(c[i].id === req.body.id){
      break
    }
  }
  c.splice(i,1)
  await db.set("wiki:"+name, page).then(() => {
    res.json({success:true})
    Log("Deleted comment at wiki page called",name)
  })
})
router.get("/tulpcraft-archive", function(req,res){
res.redirect("https://discord.gg/tUA4YmGDeC")
})
router.get("/discord", function(req,res){
res.redirect("https://discord.gg/hcZaqT5V37")
})
router.get("/youtube", function(req,res){
res.redirect("https://www.youtube.com/@legndarycryst4?sub_confirmation=1")
})
router.get("/twitch", function(req,res){
res.redirect("https://www.twitch.tv/legndarycryst4")
})
router.get("/lifesteal/discord", function(req,res){
res.redirect("https://discord.gg/hcZaqT5V37")
})
//==================================================
const publicVapidKey = process.env['publicVapidKey']
const privateVapidKey = process.env['privateVapidKey']
//get you own at https://vapidkeys.com/
webPush.setVapidDetails('mailto:test@example.com', publicVapidKey, privateVapidKey);
router.post('/testNotif', async(req, res) => {
  await getPostData(req)
  const subscription = req.body

  res.status(201).json({});

  const payload = JSON.stringify({
    title: 'Push notifications with Service Workers',
  });

  webPush.sendNotification(subscription, payload)
    .catch(error => console.error(error));
});

async function addSubscription(s,username){
  console.log("add subscription "+username,s)
  var r = await db.get("subscriptions")
  r = r || []
  let exist
  for(let i of r) if(i.p256dh === s.p256dh) exist = true
  if(!exist) r.push(s)
  await db.set("subscriptions", r)
  if(username){
    console.log(s)
    var user = await db.get("user:"+username)
    user.subscriptions = user.subscriptions || []
    let exist
    for(let i of user.subscriptions) if(i.p256dh === s.p256dh) exist = true
    if(!exist) user.subscriptions.push(s)
    await db.set("user:"+username,user)
  }
  return s
}
async function removeSubscription(s){
  var s = await db.get("subscriptions")
  s.splice(s.indexOf(s),1)
  await db.set("subscriptions",s)
}
async function clearSubscriptions(){
  var s = await db.get("subscriptions")
  await db.delete("subscriptions")
  const payload = JSON.stringify({
    type:"resetNotifs"
  });

  for(var i in s){
    webPush.sendNotification(s[i], payload)
      .catch(error => console.error(error));
  }
  console.log("Done")
}
function sendNotifTo(msg, subscription, fromUser = null){
  const payload = JSON.stringify({
    type:"notif",
    msg: msg
  });

  webPush.sendNotification(subscription, payload)
    .catch(error => {
      if(error.statusCode === 410){
        removeSubscription(subscription)
        if(fromUser && fromUser.subscriptions){
          fromUser.subscriptions.splice(fromUser.subscriptions.indexOf(subscription),1)
          db.set("user:"+fromUser.username, fromUser)
          console.log("removed subscription "+fromUser.username,subscription)
        }
      }else console.error(error)
    });
}
async function sendNotifToUser(msg,username){
  let user = (typeof username === "string") ? (await db.get("user:"+username)) : username
  if(!user) return console.log("no such user "+username)
  if(!user.subscriptions || !user.subscriptions.length) {
    if(typeof username === "string") console.log(username+" hasn't subscribed")
    return
  }
  for(let i of user.subscriptions) sendNotifTo(msg,i,user)
}
async function listSubscriptions(){
  console.log(await db.get("subscriptions"))
}
async function sendNotifToAll(msg){
  var r = await db.get("subscriptions")
  if(!r) return console.log("There is no one subscribed")
  r.forEach(s => {
    sendNotifTo(msg,s)
  })
}

router.post('/subscribe', async(req, res) => {
  await getPostData(req)
  const subscription = req.body

  await addSubscription(subscription,req.username)
  sendNotifTo("So you enabled notifications. If you see this, that means it worked!",subscription)
  res.status(201).json({});
})
//=======================================

router.get('/server/getuser', (req, res)=>{
  res.header("Content-Type", "text/plain")
  if(req.username){
    res.send(req.username)
    return
  }
  res.send("")
});

router.post("/server/register", async (request, response) => {
  await getPostData(request)

  if (!request.body.password) {
    return response.status(401).json({
      success: false,
      "message": "A `password` is required"
    })
  }else if (!request.body.username) {
    return response.status(401).json({
      success: false,
      "message": "A `username` is required"
    })
  }else if (request.body.username.length > 15){
    return response.json({
      success:false,
      message: "Username can only have less than 15 characters."
    })
  }

  if(request.body.username.match(/[^a-zA-Z0-9\-_]/)){
    return response.json({message:"Username can only contain characters: A-Z, a-z, 0-9, - and _"})
  }

  var exsists = false
  await db.get("user:"+request.body.username).then(u => {
    if(u){
      exsists = true
      response.status(401).json({
        success: false,
        message: "Account already exsists"
      })
    }
  }).catch(() => exsists = false)
  if(exsists){return}

  const id = generateId()
  const account = {
    "type": "account",
    "pid": id,
    "username": request.body.username,
    "password": bcrypt.hashSync(request.body.password, 10),
    email:request.body.email,
    pfp: "https://www.empiressmp0.repl.co/pfp",
    timestamp:Date.now(),
  }
  
  db.set("user:"+account.username, account).then(() => {
    var session = {
      type: "session",
      id: generateId(),
      pid: account.pid,
      pwd: generatePassword(),
      username: account.username
    }
    db.set("session:"+session.id, session)
        .then(() => {
          setUser(session.id, response, session.pwd)
          response.json({
            success:true,
            redirect:"/"
          })
          Log("New user", account.username)
        })
        .catch(e => response.status(500).send({success:false, message:e}))
  }).catch(e => response.status(500).send({success:false, message:e}));
})

router.post('/server/login', async (request, response) => {
  await getPostData(request)
  if (!request.body.username) {
    return response.status(401).send({success:false, "message": "An `username` is required" })
  } else if (!request.body.password) {
    return response.status(401).send({success:false, "message": "A `password` is required" })
  }
  
  await db.get("user:"+request.body.username)
    .then(async (result) => {
      if(!result) return response.status(500).send({success:false, "message": "Account doesn't exist." })
      if (!bcrypt.compareSync(request.body.password, result.password)) {
        return response.status(500).send({success:false, "message": "Password invalid" })
      }
      var session = {
        type: "session",
        id: generateId(),
        pid: result.pid,
        pwd: generatePassword(),
        username: result.username
      }
      await db.set("session:"+session.id, session)
        .then(() => {
          setUser(session.id, response, session.pwd)
          response.json({
            success:true,
            redirect:"/"
          })
        }).catch(e => response.status(500).json({success:false, message:e}))
    }).catch(e => response.status(500).json({success:false, message:e}))
});
router.get("/server/account", async (request, response) => {
  if(!request.username) return response.status(401).send('"Unauthorized"')
  if(!("profanityFilter" in request.user)) request.user.profanityFilter = true
  response.json(request.user)
})
//delete account
router.delete("/server/deleteAccount", async (request, response) => {
  try {
    await logout(request, response)
    await db.delete("user:"+request.username)
      .then(() => {
        response.send("deleted")
        Log("Deleted user", request.username)
      })
      .catch((e) => response.status(500).send(e))
  } catch (e) {
    console.error(e.message)
  }
})
router.get("/server/logout", async (request, response) => {
  await logout(request, response)
  response.send("Your'e logged out")
})
router.get("/server/getSession", async (req,res) => {
  var sid = req.cookies ? req.cookies.sid : null
  var s
  if(sid){
    s = await db.get("session:"+sid)
  }
  if(s){
    s = s.id
  }else{
    s = null
  }
  
  var parser = new Transform({
    transform(data, encoding, done) {
      const str = data.toString().replace('SESSION', s);
      this.push(str);
      done();
    }
  })

  res.header("Content-Type","text/html")
  
  fs.createReadStream(__dirname+'/getSession.html')
    .pipe(newLineStream())
    .pipe(parser)
    .on("error",e => {
      console.error(e)
    })
    .pipe(res);
})
router.get("/server/account/*", async (request, response, next) => {
  let username = request.params[0]
  if(username.includes("/")) return next()
  try {
    await db.get("user:"+username)
      .then(result => {
        if(result){
          delete result.ip
          delete result.notifs
          delete result.password
    } 
        
        response.json(result)
      })
      .catch((e) => response.status(500).send(e))
  } catch (e) {
    console.error(e.message)
  }
})

router.post("/server/changePfp", async(req, res) => {
  if(!req.username) return res.json({message:"Unauthorized"})
  await getPostData(req)
  await db.get("user:"+req.username).then(r => {
    if(req.body.pfp) r.pfp = req.body.pfp
    if(req.body.bg) r.bg = req.body.bg
    db.set("user:"+req.username, r).then(() => {
      res.json({success:true, pfp:req.body.pfp, bg:req.body.bg})
    }).catch(e => res.json({message:e}))
  }).catch(e => res.json({message: e}))
})
router.post("/server/changePwd", async(req, res) => {
  if(!req.username) return res.json({message:"Unauthorized"})
  await getPostData(req)
  db.get("user:"+req.username).then(r => {
    r.password = bcrypt.hashSync(req.body.pwd, 10)
    db.set("user:"+req.username, r).then(() => {
      res.json({success:true})
    }).catch(e => res.json({message:e}))
  }).catch(e => res.json({message: e}))
  Log(req.username+" changed their password")
})
router.post("/server/changeEmail", async(req, res) => {
  if(!req.username) return res.json({message:"Unauthorized"})
  await getPostData(req)
  db.get("user:"+req.username).then(r => {
    r.email = req.body.email
    db.set("user:"+req.username, r).then(() => {
      res.json({success:true})
    }).catch(e => res.json({message:e}))
  }).catch(e => res.json({message: e}))
  Log(req.username+" changed their email")
})
router.post("/server/changeBio", async(req, res) => {
  if(!req.username) return res.status(401).json({message:"Unauthorized"})
  await getPostData(req)
  db.get("user:"+req.username).then(r => {
    r.bio = req.body.bio
    db.set("user:"+req.username, r).then(() => {
      res.json({success:true})
      Log(req.username+" changed their bio.")
    }).catch(e => res.json({message:e}))
  }).catch(e => res.json({message: e}))
})
router.post("/server/changeSkin", async(req, res) => {
  if(!req.username) return res.status(401).json({message:"Unauthorized"})
  await getPostData(req)
  if(!req.body.skin) return res.json({message:"Please set a skin"})
  db.get("user:"+req.username).then(r => {
    r.skin = req.body.skin
    db.set("user:"+req.username, r).then(() => {
      res.json({success:true})
      Log(req.username+" changed their skin.")
    }).catch(e => res.json({message:e}))
  }).catch(e => res.json({message: e}))
})

router.get("/server/capes", (req,res) => {
  res.json(capes)
})
router.get("/server/cape/*", (req,res) => {
  let name = unescape(req.params[0])
  res.send(capes[name] || "null")
})
let nono = ["Vanilla cape"]
router.post("/server/equipCape", async(req,res) => {
  if(!req.username) return res.status(401).json({message:"Unauthorized"})
  await getPostData(req)
  var user = await db.get("user:"+req.username)
  if(user.admin && req.body.cape && !user.ownedCapes.includes(req.body.cape)) user.ownedCapes.push(req.body.cape)
  if(!req.body.cape){
    delete user.cape
    await db.set("user:"+req.username,user)
    res.json({success:true})
    Log(req.username+ " removed their cape.")
  }else if(user.ownedCapes.includes(req.body.cape)){
    if(req.body.cape.includes(nono) && !d.includes(req.username)) return res.json({message:"Don't do it"})
    user.cape = capes[req.body.cape]
    await db.set("user:"+req.username,user)
    res.json({success:true})
    Log(req.username+ " changed their cape to "+req.body.cape+".")
  }else{
    res.json({message:"you don't own it"})
  }
})
router.post("/server/addCape", async(req,res) => {
  if(!req.username) return res.status(401).json({message:"Unauthorized"})
  var user = await db.get("user:"+req.username)
  if(!user.admin) return res.json({message:"no permission"})
  await getPostData(req)
  if(!req.body.name) return res.json({message:"It needs a name."})
  capes[req.body.name] = req.body.url
  await saveCapes()
  res.json({success:true})
  Log(req.username+" added cape "+req.body.name)
})
router.post("/server/removeCape", async(req,res) => {
  if(!req.username) return res.status(401).json({message:"Unauthorized"})
  var user = await db.get("user:"+req.username)
  if(!user.admin) return res.json({message:"no permission"})
  await getPostData(req)
  if(!capes[req.body.name]) return res.json({message:"invalid name"})
  delete capes[req.body.name]
  await saveCapes()
  res.json({success:true})
  Log(req.username+" removed cape "+req.body.name)
})
router.post("/server/changeProfanityFilter", async(req,res) => {
  if(!req.username) return res.status(401).json({message:"Unauthorized"})
  await getPostData(req)
  var user = await db.get("user:"+req.username)
  user.profanityFilter = req.body.on
  await db.set("user:"+req.username,user)
  res.json({success:true})
  Log(req.username+" changed their profanity filter.")
})

router.get("/server/deleteNotifs", (req,res) => {
  if(!req.username) return res.status(401).json({message:"Unathorized"})
  db.get("user:"+req.username).then(r => {
    delete r.notifs
    db.set("user:"+req.username, r).then(() => {
      res.json({success:true})
      Log(req.username+" deleted their notifications.")
    }).catch(e => res.json({message:e}))
  }).catch(e => res.json({message: e}))
})
router.get("/server/pfp/*", async(req,res) => {
  let username = req.url.split("/").pop()
  db.get("user:"+username).then(d => {
    /*fetch(d.pfp, (err,meta,body) => {
      if(err){
        console.log(err)
        return res.send("error")
      }
      res.send(body)
    })*/
    res.redirect(d.pfp)
  }).catch(() => res.send("error"))
})
router.get("/server/pfpLocation/*", async(req,res) => {
  let username = req.url.split("/").pop()
  db.get("user:"+username).then(d => {
    res.send(d.pfp)
  }).catch(() => res.send("error"))
})
router.get("/pfp", function(req,res){
  res.sendFile(__dirname + "/public/pfp.png")
})

router.get("/server/skin/*", async(req,res) => {
  let username = req.url.split("/").pop()
  db.get("user:"+username).then(d => {
    var data = d.skin.replace(/^data:image\/png;base64,/, '');
    var img = Buffer.from(data, 'base64');
    res.header("Content-Type", "image/png")
    res.header("Content-Length",img.length)
    res.send(img);
  }).catch(() => res.send("error"))
})
router.get("/server/users", (req, res) => {
  db.list("user:").then((users) => {res.json(users) })
})

/*var currentMedia = {
  type: "",
  data: ""
}
router.get("/currentMedia", async(req,res) => {
  if(currentMedia.data){
    res.header("Content-Type", currentMedia.type)
    res.end(currentMedia.data)
  }else res.send("")
})*/
router.post("/server/newMedia", async(req,res) => {
  await getPostText(req)
  var id = generateId()
  /*var buffer = Buffer.from(req.body)
  var prefix = "data:"+req.headers['content-type']+";base64,"
  var url = prefix + buffer.toString("base64").replace(/(\r\n|\n|\r)/gm,"")
  console.log(prefix)*/
  /*currentMedia.type = req.headers['content-type']
  currentMedia.data = Buffer.from(req.body, "base64")

  cloudinary.uploader.upload("https://www.empiressmp0.repl.co/currentMedia", {
    public_id: id,
    resource_type: currentMedia.type.split("/")[0]
  }, function(error, result){
    if(error){
      Log(error)
      return res.json({message: error})
    }
    res.json({success:true, url: result.secure_url})
    Log("Media id:",id)
  })*/
  var type = mime.extension(req.headers['content-type'])
  await db.setFile("/images/"+id+"."+type, Buffer.from(req.body, "base64"))
  var url = "https://www.empiressmp0.repl.co/images/"+id+"."+type
  Log("Media url:",url)
  res.json({success:true,url})
})
router.get("/images/*",async(req,res) => {
  var buffer = await db.getFile("images/"+req.params[0])
  if(!buffer) return res.end()
  res.header("Content-Type", mime.lookup(req.params[0]))
  res.end(buffer)
})
// user makes a post/blog
router.post("/server/post", async(request, response) => {
  if(!request.username){
    return response.status(401).json({message:"You need to login to create posts. Login is at the top right."})
  }
  await getPostData(request)
  if(!request.body.title) {
    return response.status(401).json({ "message": "A `title` is required" })
  } else if(!request.body.content) {
    return response.status(401).json({ "message": "A `content` is required" })
  }
  const uniqueId = generateId()
  var blog = {
    "type": "blog",
    "username": request.username,
    id:uniqueId,
    "title": request.body.title,
    "content": request.body.content,
    "followers":[request.username],
    "timestamp": Date.now()
  }
  db.set("post:"+uniqueId, blog)
    .then(() => {
      response.json({
        success:true,
        data:blog,
        redirect: "/post?id="+uniqueId
      })
      Log("New post", "<a href='/post?id="+blog.id+"' target='_blank'>"+blog.title+"</a>")
    })
    .catch((e) => response.status(500).json({message:e}))
})
router.delete("/server/deletePost/*", async(req, res) => {
  let id = req.url.split("/").pop()
  var canDelete = false
  var adminDelete = false
  var title
  var author
  await db.get("post:"+id).then(async r => {
    title = r.title
    author = r.username
    if(req.username === r.username){
      canDelete = true
    }else{
      await db.get("user:"+req.username).then(u => {
        if(u.admin){
          canDelete = true
          adminDelete = true
        }
      }).catch(() => res.send("error"))
    }
  }).catch(() => res.send("error"))

  if(!canDelete) return res.status(401).send("Your'e not authorized")
  db.delete("post:"+id).then(async() => {
    if(adminDelete) await notif(req.username+" deleted your post: "+title, author)
    res.send("ok")
    Log("Deleted post", title)
  }).catch(e => {res.send("error"); console.log(e)})
})
router.post("/server/editPost/*", async(req, res) => {
  let id = req.url.split("/").pop()
  if(!req.username){
    return response.status(401).json({message:"You need to login to edit your posts. Login is at the top right."})
  }
  await getPostData(req)
  var post = await db.get("post:"+id)
  if(!post) return res.json({message:"post does not exist"})

  var user = await db.get("user:"+req.username)
  var canEdit = false
  if(post.username === req.username) canEdit = true
  if(user.admin) canEdit = true
  if(!canEdit) return res.json({message:"You do not have permission to edit this post."})
  
  if(!req.body.content) return res.json({message:"You need content for the post."})
  if(req.body.content === post.content) return res.json({message:"You did not change the content."})

  post.content = req.body.content
  if(post.followers){
    for(var i=0; i<post.followers.length; i++){
      if(post.followers[i] !== req.username){
        notif(req.username+" edited post <a href='/post?id="+id+"'>"+post.title+"</a>", post.followers[i]).catch(e => {})
      }
    }
  }
  await db.set("post:"+id, post)
  sendPostWs({
    type:"edit",
    data:post.content
  }, id, req.body.userId)
  res.json({success:true})
  Log("Edited post <a href='/post?id="+id+"' target='_blank'>"+post.title+"</a>")
})
//test
/*function saveAdmin(){
  return db.get("user:"+username).then(r =>{
    if(!r) return console.log("user doesn't exsist")
    r.admin = true
    addNotif("You have been promoted to admin",r)
    db.set("user:"+username, r).then(() => console.log("done"))
  })*/
//e

/*router.get("/server/admin/*", (request, res) => {
  let username = req.url.split("/").pop()
    db.get("user:"+username).then(r =>{
    if(!r) return console.log("user doesn't exsist")
    r.admin = false
    addNotif("You have been promoted to admin",r)
    db.set("user:"+username, r).then(() => console.log("done"))
  }) 
})*/
//get a post by its id
router.get("/server/post/*", (request, res) => {
  let id = request.url.split("/").pop()
  db.get("post:"+id).then(data => {
    res.json(data)
  }).catch(() => res.send(null))
})
function waitLoadPost(arr,i,id,username){
  return db.get(id).then(r => {
    if(!username || r.username === username){
      arr[i] = {
        username:r.username,
        id:r.id,
        title:r.title,
        timestamp:r.timestamp
      }
    }
  })
}

//get posts from a user
router.get("/server/posts/*", (req, res) => {
  let username = req.url.split("/").pop()
  db.list("post:").then(async matches => {
    var posts = [], promises = []
    for(var i=0; i<matches.length; i++){
      promises.push(waitLoadPost(posts,i,matches[i],username))
    }
    await Promise.all(promises)
    res.json(posts.filter(r => r))
  }).catch(() => res.send(null))
})
router.get("/server/posts", (req, res) => {
  db.list("post:").then(async matches => {
    var posts = [], promises = []
    for(var i=0; i<matches.length; i++){
      promises.push(waitLoadPost(posts,i,matches[i]))
    }
    await Promise.all(promises)
    posts.sort((a,b) => b.timestamp - a.timestamp)
    res.json(posts)
  }).catch(() => res.send(null))
})
router.post("/server/commentPost/*", async(req, res) => {
  if(!req.username) return res.json({message:"Sign in to comment"})
  let id = req.url.split("/").pop()
  await getPostData(req)
  if(!req.body.comment){
    return res.json({message:"Comment cannot be blank."})
  }

  //get post and add comment and replace post
  //first comment on top
  await db.get("post:"+id).then(async r => {
    var cid = generateId()
    r.comments = r.comments || []
    var commentData = {
      username:req.username,
      comment:req.body.comment,
      id: cid,
      timestamp:Date.now()
    }
    r.comments.push(commentData)
    if(r.followers){
      for(var i=0; i<r.followers.length; i++){
        if(r.followers[i] !== req.username){
          notif(req.username+" commented at <a href='/post?id="+id+"#comment"+cid+"'>"+r.title+"</a>", r.followers[i]).catch(e => {})
        }
      }
    }
    db.set("post:"+id, r).then(() => {
      res.json({success:true, id:cid})
      sendPostWs({
        type:"comment",
        data:commentData
      }, id, req.body.userId)
      Log("New comment at", "<a href='/post?id="+r.id+"#comment"+cid+"' target='_blank'>"+r.title+"</a>")
    })
  }).catch(() => {
    res.json({message:"Post doesn't exsist"})
  })
})
router.post("/server/deletePostComment/*", async(req,res) => {
  if(!req.username) return res.status(401).send("error")
  let id = req.url.split("/").pop()
  await getPostData(req)
  db.get("post:"+id).then(async d => {
    var canDelete, sendNotif
    let cid = req.body.cid
    var c
    for(var i=0; i<d.comments.length; i++){
      if(d.comments[i].id == cid){
        c = d.comments[i]
        break
      }
    }
    if(c.username === req.username){//creator of comment delete the comment
      canDelete = true
    }else if(req.username === d.username){//creator of post delete the comment
      sendNotif = canDelete = true
    }else{//admin delete comment
      await db.get("user:"+req.username).then(r => {
        if(r.admin) sendNotif = canDelete = true
      })
    }
    if((!c) || (!canDelete)) return res.send("error")
    c.hide = true
    db.set("post:"+id, d).then(async() => {
      res.send("ok")
      if(sendNotif) await notif(req.username+" deleted your comment at: "+d.title, c.username)
      sendPostWs({
        type:"deleteComment",
        data: cid
      }, id, req.body.userId)
      Log("Deleted comment at", d.title)
    })
  })
})
router.post("/server/followPost/*", async(req, res) => {
  if(!req.username) return res.status(401).send("error")
  let id = req.url.split("/").pop()
  await getPostData(req)
  db.get("post:"+id).then(r => {
    var f = r.followers || (r.followers = [])
    if(req.body.follow){
      if(!f.includes(req.username)){
        f.push(req.username)
      }
    }else{
      var i = f.indexOf(req.username)
      if(i > -1){
        f.splice(i, 1)
      }
    }
    db.set("post:"+id, r).then(() => res.send("ok"))
  }).catch(() => {res.send("error")})
})
router.get("/server/comments/*", (req, res) => {
  let id = req.url.split("/").pop()
  db.get("post:"+id).then(r => {
    res.json(r.comments || [])
  }).catch(() => {res.send(null)})
})
router.post("/server/commentUser/*", async(req, res) => {
  if(!req.username) return res.json({message:"Sign in to comment"})
  let user = req.url.split("/").pop()
  await getPostData(req)
  if(!req.body.comment){
    return res.json({message:"Comment cannot be blank."})
  }

  await db.get("user:"+user).then(async r => {
    var cid = generateId()
    r.comments = r.comments || []
    var commentData = {
      username:req.username,
      comment:req.body.comment,
      id: cid,
      timestamp:Date.now()
    }
    r.comments.push(commentData)
    if(req.username !== r.username) notif(req.username+" commented on <a href='/user?user="+user+"#comment"+cid+"'>your profile</a>", r)
    db.set("user:"+user, r).then(() => {
      res.json({success:true, id:cid})
      sendUserWs({
        type:"comment",
        data:commentData
      }, user, req.body.userId)
      Log("New comment at profile", "<a href='/user?user="+user+"#comment"+cid+"' target='_blank'>"+user+"</a>")
    })
  }).catch(e => {
    res.json(e)
    Log(e && e.message || e)
  })
})
router.post("/server/deleteUserComment/*", async(req,res) => {
  if(!req.username) return res.status(401).send("error")
  let user = req.url.split("/").pop()
  await getPostData(req)
  db.get("user:"+user).then(async d => {
    var canDelete, sendNotif
    let cid = req.body.cid
    var c
    for(var i=0; i<d.comments.length; i++){
      if(d.comments[i].id == cid){
        c = d.comments[i]
        break
      }
    }
    if(c.username === req.username){//creator of comment delete the comment
      canDelete = true
    }else if(req.username === d.username){//creator of post delete the comment
      sendNotif = canDelete = true
    }else{//admin delete comment
      await db.get("user:"+req.username).then(r => {
        if(r.admin) sendNotif = canDelete = true
      })
    }
    if((!c) || (!canDelete)) return res.send("error")
    c.hide = true
    db.set("user:"+user, d).then(async() => {
      res.send("ok")
      if(sendNotif) await notif(req.username+" deleted your comment on profile: "+user, c.username === d.username ? d : c.username)
      sendUserWs({
        type:"deleteComment",
        data: cid
      }, user, req.body.userId)
      Log("Deleted comment at profile", user)
    })
  })
})
router.get("/server/getLocalTime/", (req,res) => {
  if(!req.query.time) return res.json({message:"need time parameter"})
  var diff = Date.now() - parseFloat(req.query.time)
  if(req.query.convert){
    res.json({success:true,time:parseFloat(req.query.convert)+diff})
  }else{
    res.json({success:true,diff})
  }
})
router.get("/server/clearNotifs", (req, res) => {
  if(!req.username) return res.status(401).send("Unauthorized")
  db.get("user:"+req.username).then(r => {
    for(var i=0; i<r.notifs.length; i++){
      var n = r.notifs[i]
      n.read = true
    }
    db.set("user:"+req.username, r).then(() => res.send("cleared")).catch(e => Log(e))
  }).catch(e => Log(e))
})

router.post("/server/resetPwd", async (req,res) => {
  //return res.json({message:"Functionality not available yet"})

  await getPostData(req)
  var username = req.body.username
  db.get("user:"+username).then(r => {
    if(!r) return res.json({message:"That account doesn't exsist."})
    var email = r.email || ""
    if(!email){
      return res.json({message:"Sorry, that account doesn't have an email."})
    }
    var transport = nodemailer.createTransport({
      /*host: "smtp.gmail.com",
      port: 2525,*/
      service:"gmail",
      auth: {
        user: "empiressmp0server@gmail.com",
        pass: process.env['google_pass']
      }
    });
    var message = {
      from: "reset_password@EmpiresSMP0.repl.co",
      to: email,
      subject: "Reset Password",
      html: `
<h1>So, you decided to reset your password, huh?</h1>
<p>All you have to do is follow the instructions.</p>
<ol>
  <li>Click <a>here</a></li>
</ol>
`
    }
    transport.sendMail(message, function(err, info) {
      if (err) {
        res.json({message:JSON.stringify(err)})
      } else {
        Log("Reset password email sent to "+req.username,info);
        res.json({success:true})
      }
    })
  })
})

router.get("/server/sessions", (req, res) => {
  const pwd = process.env['passKey']
  var urlData = url.parse(req.url,true)
  var q = urlData.query.pwd
  if(q === pwd){
    db.list("session:").then((d) => {res.json(d) })
  }else{
    res.sendFile(__dirname+"/401.html")
  }
})
/*router.get("/server/findEmail/*", async(req,res) => {
  var search = req.params[0]
  if(!search) return res.end()
  var users = await db.list("user:",true)
  for(var i in users){
    var u = users[i]
    if(u.email && u.email.includes(search)) res.write(i+": "+u.email+"\n")
  }
  res.end()
})
router.get("/server/findSimilarUsers/*", async(req,res) => {
  var search = req.params[0]
  if(!search) return res.end()
  var user = await db.get("user:"+search)
  if(!user) return res.send("invalid username")
  var ip = user.ip
  if(!ip) return res.send("user has no ip")
  var users = await db.list("user:",true)
  userLoop:for(var i in users){
    var u = users[i]
    if(!u.ip) continue
    for(var i2 of u.ip) if(ip.includes(i2)){
      res.write(u.username+"\n")
      continue userLoop
    }
  }
  res.end()
})*/
router.get("/server/findAdmins/", async(req,res) => {
  var users = await db.list("user:",true)
  for(var i in users){
    if(users[i].admin){
      res.write(users[i].username+"\n")
    }
  }
  res.end()
})
//promoteToAdmin
//cloud saves
router.get("/saves", async(req,res) => {
  if(!req.username) return res.status(401).json("Unauthorized")
  var saves = await db.get("saves:"+req.username)
  if(!saves) return res.json(null)
  for(var i=0; i<saves.length; i++){
    var s = saves[i]
    saves[i] = {
      edited:s.edited,
      id:s.id,
      name:s.name,
      thumbnail:s.thumbnail,
      version:s.version,
      size:s.code ? s.code.length : 0
    }
  }
  res.json(saves)
})
router.get("/saves/*", async(req,res) => {
  if(!req.username) return res.status(401).json("Unauthorized")
  var saves = await db.get("saves:"+req.username)
  if(!saves) return res.json(null)
  let id = req.params[0]
  for(var i=0; i<saves.length; i++){
    var s = saves[i]
    if(s.id.toString() === id) return res.json(s)
  }
  res.json(null)
})
router.post("/saves", async(req,res) => {
  if(!req.username) return res.status(401).json("Unauthorized")
  await getPostData(req)
  var save = req.body
  if(!save || !save.id) res.json({message:"invalid save"})
  var saves = await db.get("saves:"+req.username) || []
  var found = false
  for(var i=0; i<saves.length; i++){
    if(saves[i].id === save.id){
      saves[i] = save
      found = true
    }
  }
  if(!found) saves.push(save)
  await db.set("saves:"+req.username, saves)
  res.json({success:true})
})
router.delete("/saves/*", async(req,res) => {
  if(!req.username) return res.status(401).json("Unauthorized")
  var saves = await db.get("saves:"+req.username)
  if(!saves) return res.json({message:"save doesn't exist"})
  let id = req.params[0]
  for(var i=0; i<saves.length; i++){
    var s = saves[i]
    if(s.id.toString() === id){
      saves.splice(i,1)
      await db.set("saves:"+req.username, saves)
      return res.json({success:true})
    }
  }
  res.json({message:"save doesn't exist"})
})
router.get("/server/account/*/saves", async(req,res) => {
  let username = req.params[0]
  var saves = await db.get("saves:"+username)
  res.json(saves)
})

router.get("/records", (req,res) => {
  res.json(records)
})

//for minekhan
router.get("/server/worlds", (req, res) => {
  res.json(worlds.toRes())
})
router.get("/server/worldsPing", (req, res) => {
  var w = []
  var data = {}
  for(var i=0; i<worlds.length; i++){
    var world = worlds[i]
    w.push(pingWorld(world.id,data))
  }
  for(var i=0; i<servers.length; i++){
    var server = servers[i]
    w.push(pingWorld(server.id,data))
  }
  Promise.all(w).then(w => {
    res.json(data)
  })
})
router.get("/server/servers", async(req,res) => {
  /*var promises = []
  var results = []
  for(var i of servers){
    promises.push(timeoutPromise(fetch("https://"+i.url+"/info").then(r => r.json()).then(r => results.push(r)),20000).catch(() => {}))
  }
  await Promise.all(promises)
  res.json(results)*/
  res.json(servers.toRes())
  for(var i of serverInfo){
    var s
    for(var j in servers){
      if(servers[j].url === i.url) s = i
    }
    if(!s) getServerInfo(i)
  }
})
router.get("/getExternalServerSession/:id", (req,res) => {
  if(!req.username) return res.status(401).json({type:"error",data:"unauthorized"})
  let v = validateMKClient(req.username,req.clientIp)
  if(v) return res.send(v)
  let server = findServerForClient(req.params.id)
  if(!server) return res.json({type:"error",data:"can't find server"})
  let pwd = generatePassword()
  server.connection.sendUTF(JSON.stringify({
    type:"addSession",
    data:pwd,
    username:req.username
  }))
  res.json({type:"session",data:pwd})
})

router.post("/admin/messageUser/*", async(req,res) => {
  if(!req.isAdmin) return res.json({message:"Unauthorized"})
  await getPostData(req)
  let to = req.url.split("/").pop()
  await notif(req.username+" sent message: "+req.body.message, to)
  res.json({success:true})
})
/*router.post("/admin/giveCape/*", async(req,res) => {
  if(!req.isAdmin) return res.json({message:"Unauthorized"})
  await getPostData(req)
  let to = req.url.split("/").pop()
  if((await giveCape(to, req.body.name).catch(e => {
    res.json({success:false,message:e.message})
    return "error"
  })) !== "error") res.json({success:true})
})*/

function LogAllOut(){
  db.list("session:").then(m => {
    var p = []
    for(var i=0; i<m.length; i++){
      p.push(db.delete(m[i]))
    }
    Promise.all(p).then(() => {
      console.log("Done")
    })
  })
}
function deleteCloudSaves(){
  db.list("saves:").then(m => {
    var p = []
    for(var i=0; i<m.length; i++){
      p.push(db.delete(m[i]))
    }
    Promise.all(p).then(() => {
      console.log("Done")
    })
  })
}
function deleteAccount(username){
  db.delete("user:"+username).then(() => console.log("done"))
}
//admin
function promoteToAdmin(username){
  db.get("user:"+username).then(r =>{
    if(!r) return console.log("user doesn't exsist")
    r.admin = true
    addNotif("You have been promoted to admin",r)
    db.set("user:"+username, r).then(() => console.log("done"))
  })
}
function unpromoteFromAdmin(username){
  db.get("user:"+username).then(r =>{
    if(!r) return console.log("user doesn't exsist")
    r.admin = false
    addNotif("You have been unpromoted from admin",r)
    db.set("user:"+username, r).then(() => console.log("done"))
  })
}
function setPassword(username,pwd){
  db.get("user:"+username).then(async r => {
    r.password = bcrypt.hashSync(pwd, 10)
    await db.set("user:"+username,r)
    console.log("done")
  })
}

let serverPort = app.listen(3000, function(){
  console.log("App server is running on port 3000");
});

//WebSocket
class WebSocketRoom{
  static rooms = []
  constructor(path){
    this.path = path
    this.onrequest = null
    this.connections = []
    this.validateFunc = null

    WebSocketRoom.rooms.push(this)
  }
  static getRoom(path){
    for(var i=0; i<this.rooms.length; i++){
      if(this.rooms[i].path === path){
        return this.rooms[i]
      }
    }
  }
  static async connection(request){
    let urlData = url.parse(request.httpRequest.url,true)
    let path = urlData.pathname
    var room = this.getRoom(path)
    if(room){
      var valid = true
      var options = {send:null}
      if(room.validateFunc){
        valid = await room.validateFunc(request, options, urlData)
      }
      const connection = request.accept(null, request.origin);
      if(options.send) connection.sendUTF(options.send)
      if(!valid){
        return connection.close()
      }
      room.connections.push(connection)
      room.onrequest(request, connection, urlData)
      connection.on("close", function(){
        var idx = room.connections.indexOf(connection)
        room.connections.splice(idx,1)
      })
    }else request.reject()
  }
}
const wsServer = new WebSocketServer({
  httpServer: serverPort
})
wsServer.on("request", req => WebSocketRoom.connection(req))

const minekhanWs = new WebSocketRoom("/ws");

//Function to validate request
function validateMKClient(username,ip){
  if(!multiplayerOn && !d.includes(username)){
    return JSON.stringify({
      type:"error",
      data:multiplayerMsg
    })
  }

  let ban = isBanned(username,ip)
  if(ban){
    return JSON.stringify(whyBanned(ban))
  }
}
minekhanWs.validateFunc = async (request, options) => {
  if(request.origin !== "https://www.empiressmp0.repl.co") Log("<h2>Incorrect client: "+request.origin+"</h2>")
  var sid, spwd
  for(var i=0; i<request.cookies.length; i++){
    var c = request.cookies[i]
    if(c.name === "sid"){
      sid = c.value
    }else if(c.name === "spwd"){
      spwd = c.value
    }
  }
  if(sid) {
    var l = await db.get("session:"+sid)
      .then(async result => {
        if(!result || result && result.pwd !== spwd) return false
        if(await db.get("user:"+result.username).then(u => {
          if(u) request.isAdmin = u.admin || false, request.username = u.username
          else return true
        })){
          return false
        }
        return result.username
      })
    if(!l) return false
  }else return false

  var ip = requestIp.getClientIp(request)
  options.send = validateMKClient(request.username,ip)
  if(options.send) return false
  
  return true
}

var worlds = []
worlds.find = (id) => {
  for(var i=0; i<worlds.length; i++){
    if(worlds[i].id === id){
      return worlds[i]
    }
  }
}
worlds.toRes = function(){
  var data = []
  for(var i=0; i<worlds.length; i++){
    var w = worlds[i]
    data.push({
      name: w.name,
      players: (() => {
        var ps = []
        w.players.forEach(r => ps.push(r.username))
        return ps
      })(),
      id: w.id,
      host: w.host.username,
      banned: w.banned,
      whitelist: w.whitelist
    })
  }
  return data
}
var pings = {}
function pingWorld(id, obj=null){
  var w = worlds.find(id) || findServerForClient(id)
  if(!w) return "error"
  var start = Date.now()
  var pingId = generateId()
  return new Promise((resolve,reject) => {
    var resolved = false
    pings[pingId] = {
      id: id,
      done: f => {
        var finish = Date.now()
        var ms = (finish - start)
        resolve(ms)
        resolved = true
        delete pings[pingId]
        if(obj) obj[id] = ms
      }
    }
    ;(w.host || w.connection).sendUTF(JSON.stringify({
      type:"ping",
      id:pingId
    }))
    setTimeout(() => {
      if(!resolved){
        resolve("timeout")
        if(obj) obj[id] = "timeout"
        delete pings[pingId]
      }
    }, 20000)
  })
}

worlds.sendEval = function(index, player, data){
  Log("%>worlds["+index+"].players["+player+"].sendUTF('{\"type\":\"eval\",\"data\":\""+data+"\"}')")
  var world = worlds[index]
  if(!world) return Log("%<Error: worlds["+index+"] is not defined")
  if(player === "@a"){
    world.players.forEach(p => {
      p.sendUTF(JSON.stringify({type:"eval",data:data}))
    })
  }else{
    var p = world.players[player]
    if(!p) return Log("%<Error: worlds["+index+"].players["+player+"] is not defined")
    p.sendUTF(JSON.stringify({type:"eval",data:data}))
  }
  Log("%<Eval data sent.")
}
var spyServers = false

minekhanWs.onrequest = function(request, connection, urlData) {
  const queryObject = urlData.query
  var target = queryObject.target
  if(!(target||target===0)){
    connection.close()
    return
  }
  
  connection.isAdmin = request.isAdmin
  var username = connection.username = request.username

  //add user to a world
  var world = worlds.find(target)
  if(world){
    world.players.push(connection)
  }else{
    /*if(worlds.length >= 5){
      connection.sendUTF(JSON.stringify({
        type:"error",
        data:"Only 5 servers at a time"
      }))
      connection.close()
      return
    }*/
    world = {
      id: target,
      players: [connection],
      banned: {},
      whitelist: null,
      host: connection,
      name: "Ghost server "+target,
      spy:false
    }
    worlds.push(world)
  }
  updateRecords()
  connection.sendJSON = function(o){
     if(typeof o === "object") o = JSON.stringify(o)
    this.sendUTF(o)
  }
  function sendPlayers(msg){
    for(var i=0; i<world.players.length; i++){
      var p = world.players[i]
      if(p !== connection){
        p.sendJSON(msg)
      }
    }
  }
  function sendAllPlayers(msg){
    for(var i=0; i<world.players.length; i++){
      var p = world.players[i]
      p.sendJSON(msg)
    }
  }
  function sendPlayer(msg, to){
    for(var i=0; i<world.players.length; i++){
      var p = world.players[i]
      if(p.id === to){
        p.sendJSON(msg)
      }
    }
  }
  function sendThisPlayer(msg){
    connection.sendJSON(msg)
  }
  function sendPlayerName(msg, to){
    for(var i=0; i<world.players.length; i++){
      var p = world.players[i]
      if(p.username === to){
        p.sendJSON(msg)
      }
    }
  }
  function closePlayers(){
    for(var i=0; i<world.players.length; i++){
      var p = world.players[i]
      if(p !== connection){
        p.close()
      }
    }
  }
  function closePlayer(id){
    for(var i=0; i<world.players.length; i++){
      var p = world.players[i]
      if(p.username === id){
        p.close()
      }
    }
  }
  function closeThisPlayer(){
    connection.close()
  }
  function findPlayer(id){
    for(var i=0; i<world.players.length; i++){
      var p = world.players[i]
      if(p.username === id){
        return p
      }
    }
  }
  connection.on('message', function(message) {
    var data
    try{
      data = JSON.parse(message.utf8Data)
    }catch{
      return
    }
    if(data.type === "connect"){
      if(username in world.banned){
        if(connection.isAdmin){
          delete world.banned[username]
        }else{
          var b = world.banned[username]
          sendThisPlayer(JSON.stringify({
            type:"error",
            data: "You've been banned from this world." + (b ? "\n\n\n\n\nReason:\n"+b : "")
          }))
          sendAllPlayers(JSON.stringify({
            type:"message",
            username:"Server",
            data:username+" was banned and tried to join ",
            fromServer:true
          }))
          Log("MineKhan: "+username+" was banned but tried to join "+world.name)
          closeThisPlayer()
          return
        }
      }
      if(world.whitelist && !world.whitelist.includes(username) && !connection.isAdmin){
        sendThisPlayer(JSON.stringify({
          type:"error",
          data: "You have not been whitelisted on this server."
        }))
        closeThisPlayer()
        return
      }

      connection.id = data.id
      //connection.username = data.username
      sendPlayers(message.utf8Data)
      sendPlayers(JSON.stringify({
        type:"message",
        data: username+" is connecting. "+world.players.length+" players now.",
        username: "Server",
        fromServer:true
      }))
      Log("MineKhan: "+username+" joined the server: "+world.name)
      sendThisPlayer(JSON.stringify({
        type:"message",
        data: "Please read the multiplayer rules, read them <a href='https://www.empiressmp0.repl.co/multiplayerRules.html' target='_blank'>here</a>. They can change at any time.",
        username: "Server",
        fromServer:true
      }))
    }else if(data.type === "joined"){
      sendPlayers(JSON.stringify({
        type:"message",
        data: username+" joined. ",
        username: "Server",
        fromServer:true
      }))
    }else if(data.type === "init"){
      world.name = data.name
      Log("MineKhan: "+username+" opened server: "+world.name, worlds.length+" worlds")
      worldsChanged()
    }else if(data.type === "settings"){
      if(connection === world.host){
        sendPlayers(message.utf8Data)
      }
    }else if(data.type === "pong"){
      var p = pings[data.id]
      if(p) p.done(data.data)
    }else if(data.type === "pos"){
      connection.pos = message.utf8Data
      for(let i of world.players){
        if(i !== connection && i.pos) connection.sendUTF(i.pos)
      }
      sendThisPlayer(JSON.stringify({
        type:"canSendPos"
      }))
    }else if(data.type === "message" || data.type === "die"){
      data.username = username
      delete data.fromServer
      sendPlayers(JSON.stringify(data))
      if(spyServers || world.spy) Log("Message from "+username+" in world "+world.name+": "+data.data)
    }else if(data.type === "setBlock" || data.type === "getSave" || data.type === "entityPos" || data.type === "entityPosAll" || data.type === "entityDelete" || data.type === "harmEffect" || data.type === "achievment" ||  data.type === "playSound" || data.type === "mySkin" || data.type === "setTags" || data.type === "entEvent" || data.type === "title" || data.type === "particles" || data.type === "saveProg" || data.type){
      sendPlayers(message.utf8Data)
    }else if(data.type === "hit"){
      sendPlayer(JSON.stringify(data), data.TO)
    }else if(data.type === "loadSave" || data.type === "loadSaveChunk"){
      sendPlayer(message.utf8Data, data.TO)
    }else if(data.type === "serverChangeBlock"){
      world.host.sendJSON(data)
    }else if(data.type === "remoteControl"){
      if(connection.isAdmin) sendPlayer(message.utf8Data, data.TO)
    }else if(data.type === "kill"){
      if(data.data === "@a"){
        sendPlayers(JSON.stringify({type:"kill",data:data.message}))
      }else{
        sendPlayerName(JSON.stringify({
          type:"kill",
          data:data.message
        }), data.data)
      }
    }else if(data.type === "diamondsToYou"){
      sendPlayer(JSON.stringify({
        type:"diamondsToYou"
      }), data.TO)
    }else if(data.type === "ban"){
      if(!(connection === world.host || connection.isAdmin)) return sendThisPlayer(JSON.stringify({
          type:"message",
          username:"Server",
          data:"You dont have permission to ban.",
          fromServer:true
        }))
      
      var banWho = findPlayer(data.data)
      if(banWho && banWho.isAdmin){
        sendPlayer(JSON.stringify({
          type:"message",
          username:"Server",
          data:"You can't ban "+data.data,
          fromServer:true
        }), data.FROM)
        sendPlayers(JSON.stringify({
          type:"message",
          username:"Server",
          data: username+" tried to ban "+data.data+".",
          fromServer:true
        }))
        return
      }

      if(data.data in world.banned){
        return sendThisPlayer(JSON.stringify({
          type:"message",
          username:"Server",
          data:data.data+" is already banned.",
          isServer:true
        }))
      }else{
        world.banned[data.data] = data.reason || ""
      }
      
      sendPlayerName(JSON.stringify({
        type:"error",
        data: "You've been banned from this world." + (data.reason ? "\n\n\n\n\nReason:\n"+data.reason : "")
      }), data.data)
      world.host.send(JSON.stringify({
        type:"updatePermissions",
        action:"addBan",
        username:data.data,
        messages:data.reason
      }))
      sendAllPlayers(JSON.stringify({
        type:"message",
        username:"Server",
        data:data.data+" got banned.",
        fromServer:true
      }))
      Log("MineKhan: "+data.data+" got banned from the server: "+world.name)
      closePlayer(data.data)
      worldsChanged()
    }else if(data.type === "unban"){
      if(!(connection === world.host || connection.isAdmin)) return sendThisPlayer(JSON.stringify({
          type:"message",
          username:"Server",
          data:"You dont have permission to unban.",
          fromServer:true
        }))
      
      if(!(data.data in world.banned)){
        return sendThisPlayer(JSON.stringify({
          type:"message",
          username:"Server",
          data:data.data+" is not banned.",
          fromServer:true
        }))
      }
      delete world.banned[data.data]
      world.host.send(JSON.stringify({
        type:"updatePermissions",
        action:"removeBan",
        username:data.data
      }))
      sendAllPlayers(JSON.stringify({
        type:"message",
        username:"Server",
        data:data.data+" got unbanned.",
        fromServer:true
      }))
      Log("MineKhan: "+data.data+" got unbanned from the server: "+world.name)
      worldsChanged()
    }else if(data.type === "whitelist"){
      if(!(connection === world.host || connection.isAdmin)) return sendThisPlayer(JSON.stringify({
          type:"message",
          username:"Server",
          data:"You dont have permission to edit whitelist.",
          fromServer:true
        }))

      if((data.data === "add" || data.data === "remove") && !world.whitelist) return sendThisPlayer(JSON.stringify({
          type:"message",
          data: "You need to enable whitelist to do that.",
          username: "Server",
          fromServer:true
        }))
      
      if(data.data === "enable" && !world.whitelist){
        world.whitelist = []
        world.host.send(JSON.stringify({
          type:"updatePermissions",
          action:"whitelistEnable"
        }))
        sendPlayers({
          type:"error",
          data:"Whitelist has been enabled. You can rejoin if whitelisted.",
        })
        closePlayers()
        sendAllPlayers(JSON.stringify({
          type:"message",
          username:"Server",
          data:"Whitelist was enabled.",
          fromServer:true
        }))
        worldsChanged()
      }else if(data.data === "disable" && world.whitelist){
        world.whitelist = null
        world.host.send(JSON.stringify({
          type:"updatePermissions",
          action:"whitelistDisable"
        }))
        sendAllPlayers(JSON.stringify({
          type:"message",
          username:"Server",
          data:"Whitelist was disabled.",
          fromServer:true
        }))
        worldsChanged()
      }else if(data.data === "add" && !world.whitelist.includes(data.who)){
        world.whitelist.push(data.who)
        world.host.send(JSON.stringify({
          type:"updatePermissions",
          action:"whitelistAdd",
          username:data.who
        }))
        sendAllPlayers(JSON.stringify({
          type:"message",
          username:"Server",
          data:data.who+" was added to the whitelist.",
          fromServer:true
        }))
        worldsChanged()
      }else if(data.data === "remove" && world.whitelist.includes(data.who)){
        world.whitelist.splice(world.whitelist.indexOf(data.who), 1)
        world.host.send(JSON.stringify({
          type:"updatePermissions",
          action:"whitelistRemove",
          username:data.who
        }))
        sendAllPlayers(JSON.stringify({
          type:"message",
          username:"Server",
          data:data.who+" was removed from the whitelist.",
          fromServer:true
        }))
        var remove = []
        for(var i of world.players){
          if(i.username === data.who) remove.push(i)
        }
        for(var i of remove) i.close()
        worldsChanged()
      }
    }else if(data.type === "fetchUsers"){
      var str = world.players.length + " players online: "
      world.players.forEach(u => str += u.username+", ")
      str = str.slice(0,str.length-2)

      var bannedLength = 0
      for(var b in world.banned) bannedLength ++
      if(bannedLength){
        str += "<br>"
        str += bannedLength + " players banned: "
        for(var b in world.banned) str += b + ", "
        str = str.slice(0,str.length-2)
      }
      if(world.whitelist && world.whitelist.length){
        str += "<br>"
        str += world.whitelist.length + " players whitelisted: "
        world.whitelist.forEach(u => str += u + ", ")
        str = str.slice(0,str.length-2)
      }
      
      sendPlayer(JSON.stringify({
        type:"message",
        username:"Server",
        data:str,
        fromServer:true
      }), data.FROM)
    }else if(data.type === "eval"){
      if(connection.isAdmin){
        var o = JSON.stringify({type:"eval",data:data.data})
        if(data.TO === "@A"){
          sendAllPlayers(o)
        }else if(data.TO){
          let players = data.TO.split("|")
          for(let p of players) sendPlayerName(o, p)
        }else{
          sendPlayers(o)
          console.log("all")
        }
        console.log(o,data)
        sendPlayer(JSON.stringify({
          type:"message",
          username:"Server",
          data:"Eval data sent",
          fromServer:true
        }), data.FROM)
      }else{
        sendPlayer(JSON.stringify({
          type:"message",
          username:"Server",
          data:"You can not use this command.",
          fromServer:true
        }), data.FROM)
      }
    }else if(data.type === "invite"){
      notif(connection.username+" invites you to world called <a href='https://play.empiressmp0.repl.co/?target="+world.id+"'>"+world.name+"</a>",data.data).then(() => {
        sendPlayer(JSON.stringify({
          type:"message",
          username:"Server",
          data:"A notification has been sent to "+data.data,
          fromServer:true
        }), data.FROM)
        sendPlayers(JSON.stringify({
          type:"message",
          username:"Server",
          data:connection.username+" invited "+data.data,
          fromServer:true
        }))
        Log(connection.username+" invited "+data.data+" to "+world.name)
      }).catch(e => {
        if(e === false) sendPlayer(JSON.stringify({
          type:"message",
          username:"Server",
          data:"No such user: "+data.data,
          fromServer:true
        }), data.FROM)
      })
    }
  });
  connection.on('close', function(reasonCode, description) {
    if(reasonCode !== 1000 && reasonCode !== 1001){
      Log("Websocket closed with code: "+reasonCode+", "+description)
    }
    var idx = world.players.indexOf(connection)
    if(connection === world.host){
      var name = world.name
      var playerAmount = world.players.length
      sendPlayers(JSON.stringify({
        type:"error",
        data: "Server closed"
      }))
      closePlayers()
      worlds.splice(worlds.indexOf(world), 1)
      world = {}
      Log("MineKhan: "+username+" closed server: "+name+" with "+playerAmount+" people", worlds.length+" worlds")
    }else{
      sendPlayers(JSON.stringify({
        type:"dc",
        data: world.players[idx].id
      }))
      sendPlayers(JSON.stringify({
        type:"message",
        data: world.players[idx].username+" left. "+(world.players.length-1)+" players now.",
        username: "Server",
        fromServer:true
      }))
      Log("MineKhan: "+world.players[idx].username+" left the server: "+world.name)
      world.players.splice(idx, 1)
    }
    worldsChanged()
  });
  connection.on("error", function(err){
    console.log("UH OH!!! Websocket error", err)
  })
  worldsChanged()
};
function worldsChanged(){
  sendWorlds()
}

var servers = []
servers.toRes = function(){
  return servers.map(r => ({
    id:r.id,
    name:r.name,
    description:r.description,
    players:r.players.map(r => r.username),
    thumbnail:r.thumbnail,
    safe:r.safe,
    url:r.url
  }))
}
function findServerForClient(id){
  for(var i of servers){
    if(i.id === id){
      return i
    }
  }
}
function findServer(id){
  for(var i of servers){
    if(i.serverId === id){
      return i
    }
  }
}
function findServerInfo(id){
  if(!id && id !== 0) return
  for(var i of serverInfo){
    if(i.serverId === id){
      return i
    }
  }
}
async function getServerInfo(info){
  var data = await fetch("https://"+info.url+"/info").then(r => r.json()).catch(e => {})
  if(data) info.id = data.id
  return info
}
function getServerInfoForId(id){
  return new Promise(function(resolve,reject){
    var p = [], done
    for(var i of serverInfo){
      if(!findServer(i.id)) p.push(getServerInfo(i).then(r => {
        if((r.id || r.id === 0) && r.id === id) resolve(r), done = true
      }))
    }
    Promise.all(p).then(() => {
      if(!done) resolve()
    })
  })
}
var serverWs = new WebSocketRoom("/serverWs")
serverWs.validateFunc = async function(request, options, urlData){
  var id = urlData.query.target
  if(findServer(id)) return false
  var info = findServerInfo(id)
  if(!info){
    info = await getServerInfoForId(id)
  }   
  if(info){
    let pwd = await fetch("https://"+info.url+"/validateServer/?pwd="+encodeURIComponent(urlData.query.pwd)).then(r => r.text()).catch(e => console.log(e))
    if(pwd !== "yes"){
      //Log("<h2>Warning: Unvalidated server</h2>",info)
      info = null
    }
  }
  request.serverInfo = info
  return true
}
serverWs.onrequest = function(req, connection, urlData){
  var id = urlData.query.target
  var info = req.serverInfo
  var server = {
    serverId:id, id,
    name:null,
    description:null,
    thumbnail:null,
    players:[],
    url:info && info.url || requestIp.getClientIp(req),
    safe:info && info.safe,
    connection
  }
  connection.on("message", function(message){
    var data = JSON.parse(message.utf8Data)
    if(data.type === "init"){
      server.id = info && info.url ? "external:"+info.url : data.id
      server.name = ""+data.name
      server.description = data.description
      server.thumbnail = data.thumbnail
      if(data.players) server.players = data.players
      servers.push(server)
      worldsChanged()
      Log("MineKhan: External server opened: "+server.name)
    }else if(data.type === "pong"){
      var p = pings[data.id]
      if(p) p.done(data.data)
    }else if(data.type === "joined"){
      server.players.push({id:data.id,username:data.username})
      updateRecords()
      Log("MineKhan: "+data.username+" joined external server: "+server.name)
      worldsChanged()
    }else if(data.type === "left"){
      for(let i=0;i<server.players.length;i++){
        if(server.players[i].id === data.id){
          server.players.splice(i,1)
          break
        }
      }
      Log("MineKhan: "+data.username+" left external server: "+server.name)
      worldsChanged()
    }/*else if(data.SENDTO){
      var sendTo = data.SENDTO.split("\n")
      delete data.SENDTO
      var msg = JSON.stringify(data)
      for(var p of server.players){
        if(sendTo.includes(p.id)){
          if(data.type === "sendDc") p.close()
          else p.sendUTF(msg)
        }
      }
    }*/
  })
  connection.on("close", function(){
    /*for(var i of server.players){
      i.sendUTF(JSON.stringify({
        type:"error",
        data:"Server closed"
      }))
      i.close()
    }*/
    servers.splice(servers.indexOf(server),1)
    Log("MineKhan: External server closed: "+server.name)
    worldsChanged()
  })
}
/*var externalWs = new WebSocketRoom("/externalWs")
externalWs.validateFunc = minekhanWs.validateFunc
externalWs.onrequest = function(req, connection, urlData){
  const queryObject = urlData.query
  var target = queryObject.target
  var server = findServerForClient(target)
  if(!server) return connection.close()
  var username = req.username
  connection.on("message", function(message){
    var data = JSON.parse(message.utf8Data)
    data.FROM = connection.id
    if(data.type === "connect"){
      connection.username = data.username = username
      data.FROM = connection.id = data.id
      server.players.push(connection)
      updateRecords()
      Log("MineKhan: "+username+" joined external server: "+server.name)
    }else if(data.type === "message"){
      if(spyServers) Log("MineKhan: Message from "+username+" in external server "+server.name+": "+data.data)
    }
    data = JSON.stringify(data)
    server.connection.sendUTF(data)
  })
  connection.on('close', function(){
    server.players.splice(server.players.indexOf(connection),1)
    server.connection.sendUTF(JSON.stringify({
      type:"dc",
      data:connection.id
    }))
    Log("MineKhan: "+username+" left external server: "+server.name)
  })
}*/

var postWs = new WebSocketRoom("/postWs")
postWs.onrequest = function(req, connection, urlData){
  connection.postId = urlData.query.id
  connection.on("message", function(message){
    var packet = JSON.parse(message.utf8Data)
    if(packet.type === "connect"){
      connection.userId = packet.userId
    }
  })
}
function sendPostWs(obj, id, fromUserId){
  var str = JSON.stringify(obj)
  for(var i=0; i<postWs.connections.length; i++){
    var con = postWs.connections[i]
    if(con.postId === id && fromUserId !== con.userId) con.sendUTF(str)
  }
}
var userWs = new WebSocketRoom("/userWs")
userWs.onrequest = function(req, connection, urlData){
  connection.profile = urlData.query.profile
  connection.on("message", function(message){
    var packet = JSON.parse(message.utf8Data)
    if(packet.type === "connect"){
      connection.userId = packet.userId
    }
  })
}
function sendUserWs(obj, profile, fromUserId){
  var str = JSON.stringify(obj)
  for(var i=0; i<userWs.connections.length; i++){
    var con = userWs.connections[i]
    if(con.profile === profile && fromUserId !== con.userId) con.sendUTF(str)
  }
}

var worldsWs = new WebSocketRoom("/worlds")
worldsWs.onrequest = function(request,connection){
  connection.sendUTF(JSON.stringify(worlds.toRes()))
  connection.on("message",function(message){
    var data = message.utf8Data
    if(data === "get"){
      connection.sendUTF(JSON.stringify(worlds.toRes()))
    }
  })
}
function sendWorlds(){
  var o = worlds.toRes()
  o.push(...servers.toRes())
  var str = JSON.stringify(o)
  for(var i=0; i<worldsWs.connections.length; i++){
    var con = worldsWs.connections[i]
    con.sendUTF(str)
  }
  
}
//Test for auth on all /admin/* pages
//-*
router.get("/admin(/*)", function(req,res) {
 if(!req.isAdmin){
  res.redirect("/")
 }else{
   app.use(express.static(__dirname + "/public"))
 }
})
//-*
app.use(router)

app.use(express.static(__dirname + "/public"))

//404
app.use(function(req, res, next) {
  res.status(404);
  res.sendFile(__dirname + '/404.html');
});


void 0
