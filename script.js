let pieces_elements = []
let field_elements = []
let pieces_indices = []
let field_width = 6 //columns
let field_height = 4 //rows
let image_width //real width
let image_height //real height
const el_image_width = 600 //max image width in px in html
const el_image_height = 500 //max image height in px in html
let tile_size = 50
let tile_shift = 0 //vertical tile shift
let selected_piece = undefined

const draggable = { //object for dragging elements
	el: null,
	clickX: 0,
	clickY: 0,
	shiftX: 0,
	shiftY: 0,
	moving: false,
	distance: function(x,y){
		return Math.sqrt( (x-this.clickX)**2 + (y-this.clickY)**2 )
	},
	canMove: function(x,y){
		return this.el!==null && ( this.moving || this.distance(x,y) >= 7 )
	},
	moveAt: function(x,y){
		this.moving = true
		this.el.style.left = x - this.shiftX + "px"
		this.el.style.top = y - this.shiftY + "px"
	},
	set: function(el,clickX,shiftY){
		this.el = el
		this.shiftX = clickX - el.getBoundingClientRect().left
		this.shiftY = shiftY - el.getBoundingClientRect().top
		this.clickX = clickX
		this.clickY = shiftY
	},
	clear: function(){
		this.moving = false
		this.el = null
	},
}

function initValues(){
	selected_index = -1
	selected_cell = undefined
	const img = document.querySelector(".hint>img")
	image_width = img.width
	image_height = img.height
	document.body.style.setProperty("--el-image-width",el_image_width+"px")
}

function createField(){
	const field = document.querySelector(".field")
	field.replaceChildren()

	field.addEventListener("click", field_click)

	field_elements = []
	for (let i=0;i<field_height*field_width;i++){
		d = document.createElement("div")
		d.index = i
		field.appendChild(d)
		field_elements.push(d)
	}
}

function createPieces(){
	const pieces = document.querySelector(".pieces")
	pieces.replaceChildren()

	pieces_indices = []
	pieces_elements = []
	for (let i=0;i<field_height*field_width;i++){
		d = document.createElement("div")
		d.index = i
		d.ondragstart = ()=>{return false;}
		d.addEventListener("pointerdown",onDown)
		d.addEventListener("pointerup",onUp)
		wrapper = document.createElement("div")
		wrapper.appendChild(d)
		pieces.appendChild(wrapper)
		pieces_indices.push(i)
		pieces_elements.push(d)
	}
}

function onDown(event){
	const el = event.target
	draggable.set(el, event.pageX, event.pageY)
}                     

function onMove(event){
	const cursorX = event.pageX
	const cursorY = event.pageY
	if (draggable.canMove(cursorX,cursorY)){
		if (!draggable.moving && selected_piece!==draggable.el)select_piece(draggable.el)
		draggable.moveAt(cursorX,cursorY)
	}
}

function onUp(event){
	if (event.button === 2){//right click
		if (event.target.container){
			if (event.target===selected_piece)select_piece(selected_piece)
			moveWithAnimationToStart(event.target)
		}
	}else{
		const cursorX = event.pageX
		const cursorY = event.pageY
		if (draggable.moving){
			draggable.el.hidden = true
			const el_below = document.elementFromPoint(cursorX, cursorY)
			draggable.el.hidden = false
			let type = 0
			if (el_below && el_below.parentElement){
				if (field_elements.includes(el_below))type = 2
				else if (pieces_elements.includes(el_below))type = 1
			}
			if(type===0 || (type===1 && el_below.container===undefined)){
				moveWithAnimationToStart(draggable.el)
			}else{
				let to = el_below
				if(type === 1){
					to = el_below.container
					if (draggable.el.container)moveWithAnimationToContainer(el_below, draggable.el.container)
					else moveWithAnimationToStart(el_below)
				}
				moveWithAnimationToContainer(draggable.el, to)			
			}
			select_piece(event.target)
			checkWin()
		}else{
			if (!selected_piece || (!selected_piece.container && !event.target.container) 
				|| selected_piece===event.target)
				select_piece(event.target)
			else{
				let el_with_container = selected_piece
				let el_second = event.target
				select_piece(selected_piece)
				if (!el_with_container.container){
					const temp = el_with_container
					el_with_container = el_second
					el_second = temp
				}
				const temp_container = el_second.container
				moveWithAnimationToContainer(el_second, el_with_container.container)
				if (temp_container)moveWithAnimationToContainer(el_with_container, temp_container)
				else moveWithAnimationToStart(el_with_container)
				checkWin()
			}
		}
	}
	
	draggable.clear()
}

function field_click(e){
	if (!e.target.classList.contains("field") && selected_piece){
		moveWithAnimationToContainer(selected_piece, e.target)
		select_piece(selected_piece)
		checkWin()
	}
}

//pieces movements
function moveWithAnimationTo(el, finishX, finishY, finalLeft, finalTop){
	const fps = 50
	const movingTime = 1000
	const times = movingTime/fps
	let k = 0
	let nowX = el.getBoundingClientRect().x
	let nowY = el.getBoundingClientRect().y
	const stepX = (finishX-nowX)/times
	const stepY = (finishY-nowY)/times
	let threadId
	el.classList.add("moving")
	const moveElement = ()=>{
		if ( k < times ){
			k++
			nowX+=stepX
			nowY+=stepY
			el.style.left = nowX+"px"
			el.style.top = nowY+"px"
		}else{
			el.classList.remove("moving")
			el.style.left = finalLeft
			el.style.top = finalTop
			clearInterval(threadId)
		}
	}
	threadId = setInterval(moveElement, 1000/fps)
	
}
function moveWithAnimationToStart(el){
	el.container = undefined
	const temp_l = el.style.left
	const temp_t = el.style.top
	el.style.left = ""
	el.style.top = ""
	const coord = el.getBoundingClientRect()
	el.style.left = temp_l
	el.style.top = temp_t
	moveWithAnimationTo(el,coord.x,coord.y,"","")
}

function moveWithAnimationToContainer(el, container){
	el.container = container
	const coord = container.getBoundingClientRect()
	moveWithAnimationTo(el, coord.x, coord.y, coord.left+"px", coord.top+"px")
}

function shuffle(arr) {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]]
	}
}

function shuffle_pieces(){
	shuffle(pieces_indices)
	for (let i=0;i<field_height*field_width;i++){
		const el = pieces_elements[i]
		el.style.top = ''
		el.style.left = ''
		el.container = undefined
		const index = pieces_indices[i]
		const row = Math.floor(index/field_width)
		const column = index%field_width
		el.style.backgroundPosition = `${-tile_size*column}px ${tile_shift-tile_size*row}px`
	}
}

function select_piece(el){//toggle or select a new element
	if (selected_piece)selected_piece.classList.remove("selected")
	if (el===selected_piece){
		selected_piece = undefined
	}else{
		el.classList.add("selected")
		selected_piece = el
	}
}

function checkWin(){
	for (let piece of pieces_elements){
		if (piece.container === undefined || 
			pieces_indices[piece.index]!==piece.container.index)
			return;
	}
	setTimeout(win,500)
}


function playSound(name) {
	const audio = new Audio(`./audio/${name}.mp3`);
	audio.play()
}

function win(){
	playSound("win")
	
	for (let i=-field_height+1;i<field_width;i++){
		for (let row=0;row<field_height;row++){
			const column = i + row
			if (column>=0&&column<field_width){
				setTimeout(()=>{animate_tile(row*field_width+column)},60*(i+field_height))
			}
		}
	}

}

function animate_tile(index){
	const el = pieces_elements[pieces_indices.indexOf(index)]
	el.classList.add("selected")
	setTimeout(()=>{
		el.classList.remove("selected")
	},60)
}

function calculateImageSizes(){
	const scale = image_width>image_height ? el_image_width/image_width : el_image_height/image_height
	const scaled_width = image_width*scale
	const scaled_height = image_height*scale
	
	tile_size = scaled_width/field_width
	field_height = Math.floor(scaled_height/tile_size+0.7)
	tile_shift = (field_height*tile_size-scaled_height)/2
	
	document.body.style.setProperty("--el-image-width",scaled_width+"px")
	document.body.style.setProperty("--cell-size",tile_size+"px")
}

function onImageUpload(e){
	const file = e.target.files[0]
	const link = URL.createObjectURL(file)
	
	const img = document.querySelector(".hint>img")
	img.src = link
	
	img.onload = function() {
		image_width = this.width
		image_height = this.height
		document.body.style.setProperty("--pazzle-image",'URL('+link+')')
		generatePuzzle()
	}
}

function onPuzzleWidthChange(e){
	field_width = +e.target.value
	document.body.style.setProperty("--columns",field_width)
	generatePuzzle()
	e.target.nextElementSibling.textContent = field_width+"x"+field_height
}

function generatePuzzle(){
	calculateImageSizes()
	createPieces()
	createField()
	shuffle_pieces()
}

function start(){
	document.addEventListener('pointermove', onMove)
	document.querySelector('input[type="file"]').addEventListener("input",onImageUpload)
	document.querySelector('input[name="shuffle"]').addEventListener("click",shuffle_pieces)
	const slider = document.querySelector(".slider>input")
	slider.addEventListener("input", onPuzzleWidthChange)
	initValues()
	onPuzzleWidthChange({"target":slider})
	document.querySelector(".container").oncontextmenu = ()=>{return false;}
}

window.onload = start