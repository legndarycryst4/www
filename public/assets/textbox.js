if(!document.querySelector("#textboxStyle")){
  var style = document.createElement("style")
  style.id = "textboxStyle"
  style.innerHTML = `
.comment-area *{
  box-sizing:border-box;
}
.comment-area{
  border:1px solid gray;
  overflow:auto;
  font-family:sans-serif;
  background:white;
}
body[theme=dark] .comment-area{
  background:#333;
  color:white;
}
.comment-area .comment-nav{
  background:#f5f5f5;
  padding:10px;
  padding-bottom:0;
  margin-bottom:10px;
  border-bottom:1px solid gray;
}
body[theme=dark] .comment-area .comment-nav{
  background:#444;
}
.comment-area .comment-nav > div{
  padding:10px;
  display:inline-block;
  font-size:13px;
  cursor:pointer;
}
.comment-area .comment-nav > div.selected{
  background:white;
  border:1px solid gray;
  border-top-left-radius:5px;
  border-top-right-radius:5px;
  border-bottom:1px solid white;
  position:relative;
  top:1px;
}
body[theme=dark] .comment-area .comment-nav > div.selected{
  background:#333;
  border-bottom:#333;
}
.comment-area button{
  float:right;
  margin:10px 10px 10px 0px;
}
.comment-area .comment-box{
  width:calc(100% - 20px);
  height:100px;
  font-family:inherit;
  border:1px solid #bbb;
  margin:0px 10px;
  resize:vertical;
  display:block;
  padding:10px;
}
.comment-area .comment-previewBox{
  width:calc(100% - 20px);
  border:1px solid #bbb;
  margin:0px 10px;
  padding:20px;
  overflow-wrap: break-word;
  white-space:pre-wrap;
}
.comment-area .comment-format{
  margin:0px 10px;
  background:#f7f7f7;
  font-size:13px;
  border-right:1px solid gray;
  display:flex;
  flex-flow: row wrap;
}
body[theme=dark] .comment-area .comment-format{
  background:#333;
}
.comment-area .comment-format > div{
  padding:4px;
  cursor:pointer;
  flex-grow:1;
  border-left:1px solid gray;
  border-bottom:1px solid gray;
}
.comment-area .comment-format > div:hover{
  background:#eee;
}
body[theme=dark] .comment-area .comment-format > div:hover{
  background:#111;
}
`
  document.head.appendChild(style)
}

(function(){
  var me = document.currentScript
  if(!me) return console.error("Oh no! The current script doesn't exsist")
  var id = me.getAttribute("textboxId")
  if(!id){
    var num = 1
    id = "textbox1"
    while(document.querySelector("[textboxId="+id+"]")){
      num ++
      id = "textbox"+num
    }
  }
  me.setAttribute("textboxId",id)
  var buttonText = me.getAttribute("buttonText")

  var placeholder = me.getAttribute("textboxPlaceholder") || "Write something..."

  var el = document.createElement("div")
  el.id = id
  el.classList.add("comment-area")
  el.innerHTML = `
<div class="comment-nav">
  <div class="selected comment-write onclick="commentMode('write')">Write</div><!--
--><div onclick="commentMode('preview')" class="comment-preview">Preview</div>
</div>
<textarea class="comment-box" placeholder="${placeholder}"></textarea>
<div class="comment-previewBox format" style="display:none;"></div>
<div class="comment-format">
  
</div>
${buttonText ? `<button onclick="comment()" class="comment-button">${buttonText}</button>
<pre id="error" style="color:red;"></pre>` : ""}
`
  el.querySelector(".comment-write").onclick = () => commentMode('write')
  el.querySelector(".comment-preview").onclick = () => commentMode('preview')

  var formatEl = el.querySelector(".comment-format")
  var upload = document.createElement("input")
  upload.type = "file"
  upload.onchange = function(){uploadIt(this.files[0], this.getAttribute('mediaType'))}
  upload.style.display = "none"
  formatEl.appendChild(upload)
  function addFormatButton(text, onclick){
    var div = document.createElement("div")
    div.onclick = onclick
    div.innerHTML = text
    formatEl.appendChild(div)
  }
  
  addFormatButton("Image",() => {upload.accept='image/*'; upload.setAttribute('mediaType', 'img'); upload.click()})
  addFormatButton("Video",() => {upload.accept='image/*'; upload.setAttribute('mediaType', 'video'); upload.click()})
  addFormatButton("Image from url", () => addToComment(`<img src='${prompt("URL for image")}'>`))
  addFormatButton("Video from url", () => addToComment(`<video controls src='${prompt("URL for video")}'>`))
  addFormatButton("Heading 1", () => addToComment('<h1>Heading</h1>'))
  addFormatButton("Heading 2", () => addToComment('<h2>Heading</h2>'))
  addFormatButton("Heading 3", () => addToComment('<h3>Heading</h3>'))
  addFormatButton("Heading 4", () => addToComment('<h4>Heading</h4>'))
  addFormatButton("Heading 5", () => addToComment('<h5>Heading</h5>'))
  addFormatButton("Heading 6", () => addToComment('<h6>Heading</h6>'))
  addFormatButton("Paragraph",() => addToComment("<p>Paragraph text goes here</p>"))
  addFormatButton("List", () => addToComment('<ul><li>one</li><li>two</li><li>three</li></ul>'))
  addFormatButton("Numbered List", () => addToComment('<ol><li>one</li><li>two</li><li>three</li></ol>'))
  addFormatButton("Link", () => addToComment(`<a href='${prompt("URL for link")}'>Link</a>`))
  addFormatButton("Code", () => addToComment(`<pre codeType="javascript">//Code here</pre>`))
  addFormatButton("Inline code", () => addToComment(`<pre codeType="javascript" inline>//Code here</pre>`))

  if(me.parentNode){
    me.parentNode.insertBefore(el,me)
  }else{
    document.body.appendChild(el)
  }
  
  console.log("Created textbox with id:",id)

  var commentBox = el.querySelector(".comment-box")
  var previewBox = el.querySelector(".comment-previewBox")

  function commentMode(m){
    if(m === "write"){
      commentBox.style.display = ""
      previewBox.style.display = "none"
      el.querySelector(".comment-write").classList.add("selected")
      el.querySelector(".comment-preview").classList.remove("selected")
    }else if(m === "preview"){
      commentBox.style.display = "none"
      previewBox.style.display = ""
      if(window.format){
        previewBox.innerHTML = format(commentBox.value, previewBox.id)
      }else{
        previewBox.innerHTML = "Need format.js<br>Check console for more info"
        console.error("Need format.js\n", '<script src="https://minekhan.repl.co/parts/format.js"></script>')
      }
      el.querySelector(".comment-write").classList.remove("selected")
      el.querySelector(".comment-preview").classList.add("selected")
    }
  }

  function readFileAsDataURL(blob){
    return new Promise(function(resolve, reject){
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }
  async function uploadIt(d, type){
    var base64 = await readFileAsDataURL(d)
    base64 = base64.replace(/data:[^\/]*\/[^\/]*;(base64|base36),/, '')
    var res = await fetch("/server/newMedia", {
      method: 'POST',
      body: base64,
      headers: {
        "Content-Type": d.type
      }
    }).then(r => r.json())
    if(res.success){
      addToComment("<"+(type || "img")+" src='"+res.url+"'"+(type==="video"?"controls":"")+"/>")
    }else alert(res.message)
  }

  function addToComment(str){
    commentBox.value += str
    previewBox.innerHTML = format(commentBox.value, previewBox.id)
  }
})()