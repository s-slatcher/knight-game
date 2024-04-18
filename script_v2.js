/** @type {HTMLCanvasElement} */


const canvas = document.getElementById("canvas1");
const canvas2 = document.createElement("canvas")
const pauseMenu = document.getElementById("pauseMenu")
const canvasContainer = document.getElementById("canvas-container")
const joyContainer = document.getElementById("joystick-container")
const joystickKnob = document.getElementById("joystick-knob")
const resumeButton = document.getElementById("resume-btn")
const startButton = document.getElementById("start-btn")
const attackButton = document.getElementById("atk-button")

const ctx = canvas.getContext('2d',{ alpha: false });
const keyRecord = [];
const touchRecord = {};
let joystickBoundingRect = {}
let joystickKnobBoundingRect = {}
let joystickKnobRelativePos = [0,0]
let joystickTouchID;
let spritesLoaded = 0;
let attackButtonPressed = false;
startButton.innerHTML = `Loading`

canvas.width = 1000;
canvas.height = 800;
canvas2.width = 1000
canvas2.height = 800
canvas.style.aspectRatio = 1/0.8
ctx.lineJoin = "round";


//cheats+testing --- normal settings for all is false
const loadBlankSprites = true;
let gameMuted = false;
let disableEnemyDamage = true;
let showElementsAtAnyDistance = false;
let stillMotion = true;
const db = {
    sounds(){
        gameMuted = !gameMuted
        console.log("set muted to: ",!gameMuted)
    },
    damage(){
        disableEnemyDamage = !disableEnemyDamage
        console.log("set damage to: ",!disableEnemyDamage)
    },
    fog(){
        showElementsAtAnyDistance = !showElementsAtAnyDistance
        console.log("set fog to: ",!showElementsAtAnyDistance)
    },
    motion(){
        stillMotion = !stillMotion
        console.log("set motion to: ",!stillMotion)
    }
}

// Math and vector functions 
//---------------
const randomSign = () => Math.random() >= 0.5 ? 1 : -1;
const randomValue = (a,b) => Math.random() * (b-a) + a
const randomInt = (a,b) => Math.floor(randomValue(a,b+1))
const round = (num,degree) => Math.floor(num*(Math.pow(10,degree))) / Math.pow(10,degree)
const square = (num) => Math.pow(num,2)
const randomColor = () => "#" + ((1 << 24) * Math.random() | 0).toString(16).padStart(6, "0")

const vectorMagnitude = (vector) => {
    const {x,y,z = 0} = vector
    return Math.sqrt(square(x) + square(y) + square(z))
} 
const dotProduct = (v1,v2) => {
    let dotProduct = v1.x*v2.x + v1.y*v2.y
    if (v1.z) dotProduct += v1.z * v2.z
    return dotProduct
}

const crossProduct = (v1, v2) => {
    return {
        x: v1.y * v2.z - v1.z * v2.y,
        y: v1.z * v2.x - v1.x * v2.z,
        z: v1.x * v2.y - v1.y * v2.x
    };
}

const angleBetweenVectors = (v1,v2) => {
    return Math.acos( 
        dotProduct(v1,v2) / 
        (vectorMagnitude(v1) * vectorMagnitude(v2))
    )
}
const unitVector = (vector) => {
    const magntitude = vectorMagnitude(vector)
    const {x,y,z} = vector
    return {x: x/magntitude, y: y/magntitude, z: z/magntitude}
}
const vectorFromPoints = (vector1,vector2) => {
    return {x: vector2.x-vector1.x, y: vector2.y-vector1.y, z: vector2.z-vector1.z}
}
const addVectors = (v1,v2) => {
    return {x: v1.x + v2.x, y: v1.y + v2.y, z: v1.z + v2.z}
}
const vectorDeepCopy = (vector) => {
    return vectorFromPoints({x:0,y:0,z:0},vector)
}
const changeVectorLength = (vector, length) => {
    const unit = unitVector(vector)
    return {x: unit.x*length, y: unit.y*length, z: unit.z*length}
}

const pointInRectangle = function(x,y,w,h,x2,y2){
    if (x2 > x && x2 < x+w && y2 > y && y2 < y+h) return true
    else return false
}

function rotatePointAroundPoint(point, center, axis, angle) {
    // Translate the point to the origin, store values in array in standard x,y,z order
    let translatedPoint = [
        point.x - center.x,
        point.y - center.y,
        point.z - center.z
    ];
    // Normalize the axis
    let axisLength = Math.sqrt(axis.x * axis.x + axis.y * axis.y + axis.z * axis.z);
    let normalizedAxis = [
        axis.x / axisLength,
        axis.y / axisLength,
        axis.z / axisLength
    ];

    let cosAngle = Math.cos(angle);
    let sinAngle = Math.sin(angle);
    let x = (cosAngle + (1 - cosAngle) * normalizedAxis[0] * normalizedAxis[0]) * translatedPoint[0] +
            ((1 - cosAngle) * normalizedAxis[0] * normalizedAxis[1] - normalizedAxis[2] * sinAngle) * translatedPoint[1] +
            ((1 - cosAngle) * normalizedAxis[0] * normalizedAxis[2] + normalizedAxis[1] * sinAngle) * translatedPoint[2];
    let y = ((1 - cosAngle) * normalizedAxis[0] * normalizedAxis[1] + normalizedAxis[2] * sinAngle) * translatedPoint[0] +
            (cosAngle + (1 - cosAngle) * normalizedAxis[1] * normalizedAxis[1]) * translatedPoint[1] +
            ((1 - cosAngle) * normalizedAxis[1] * normalizedAxis[2] - normalizedAxis[0] * sinAngle) * translatedPoint[2];
    let z = ((1 - cosAngle) * normalizedAxis[0] * normalizedAxis[2] - normalizedAxis[1] * sinAngle) * translatedPoint[0] +
            ((1 - cosAngle) * normalizedAxis[1] * normalizedAxis[2] + normalizedAxis[0] * sinAngle) * translatedPoint[1] +
            (cosAngle + (1 - cosAngle) * normalizedAxis[2] * normalizedAxis[2]) * translatedPoint[2];

    // return as key/value pairs 
    return {
        x : x + center.x,
        y : y + center.y,
        z : z + center.z
    };
}

const solveQuadratic = (a,b,c) => {
	const discriminant = Math.pow(b,2) - 4*a*c
	return [(-b + Math.sqrt(discriminant)) / (2*a), (-b - Math.sqrt(discriminant)) / (2*a)] 
}

const getMousePosition = (event, element) => { 
    let rect = element.getBoundingClientRect(); 
    let x = (event.clientX - rect.left) * (canvas.width/ rect.width); 
    let y = (event.clientY - rect.top) * (canvas.height/ rect.height); 
    return {x:x, y:y}
} 


//-----------------------


loadSprites().then( (bitmaps) => {
        startButton.innerHTML = "Start Game"
        startButton.addEventListener('click',() => {   
        startButton.classList.add("disabled")
        canvasContainer.requestFullscreen().then(newGame(bitmaps)); 
        console.log('%c Debug options: enter db.sounds(), db.damage(), db.motion(), db.fog() ', 
        'background: #222; color: #bada55')
    })
})

function newGame(bitmaps){ 
    const game = new Game(ctx, canvas.width, canvas.height, bitmaps)
    animate(0,game);  
}

function animate(timestamp, game){
    game.update(timestamp, keyRecord, touchRecord)
    requestAnimationFrame((timestamp)=>{
        animate(timestamp, game)
    })
}


// key and touch listeners 
//------------------------

resumeButton.addEventListener('click', () => {
    canvasContainer.requestFullscreen();
    resumeButton.classList.add("disabled")
})

window.addEventListener('keydown', (e) => {
    let key = e.key.length > 1 ? e.key : e.key.toLowerCase();
    if (keyRecord.indexOf(key) === -1) keyRecord.push(key)
    if (key === ' ' || key === 'Escape') e.preventDefault();
})
window.addEventListener('keyup', (e) => {
    let key = e.key.length > 1 ? e.key : e.key.toLowerCase();
    keyRecord.splice(keyRecord.indexOf(key),1)
})

document.addEventListener("touchstart", e => {
    [...e.touches].forEach((touch) => {
        let id = touch.identifier
        if (touch.identifier > 1) id = touch.identifier % 2
        touchRecord[`touch${id}`] = {
            x: [touch.pageX],
            y: [touch.pageY]
        }
    })
})

document.addEventListener("touchmove", e => {
    [...e.changedTouches].forEach(touch => {
        updateJoystickPosition(touch)
        const id = touch.identifier 
        touchRecord[`touch${id}`].x.push(touch.pageX) 
        touchRecord[`touch${id}`].y.push(touch.pageY)  
        })
    })

document.addEventListener("touchend", e => {
    [...e.changedTouches].forEach((touch) => {
        let id = touch.identifier
        if (id === joystickTouchID){
            joystickTouchID = undefined
            updateJoystickPosition()
            joystickKnob.style.transition = "top 100ms, left 100ms"
        }
        delete touchRecord[`touch${id}`]
    })
    
})

joyContainer.addEventListener("touchstart", (e) => {
    const touch = e.targetTouches[0] 
    if (joystickTouchID === undefined) joystickTouchID = touch.identifier
    updateJoystickPosition(touch)
    joystickKnob.style.transition = "top 0s, left 0s" 
})

attackButton.addEventListener("touchstart", (e) => {
    attackButtonPressed = true;
    attackButton.classList.add("pressed")
    console.log(attackButtonPressed)
})
attackButton.addEventListener("touchend", (e) => {
    attackButtonPressed = false;
    attackButton.classList.remove("pressed")
    console.log(attackButtonPressed)
})


window.onresize = (e) => {
    updateJoystickDimensions()
}

const updateJoystickPosition = (touch) => {
    let touchPosRelative;
    if (!touch) {
        joystickKnobRelativePos = [0,0]
        touchPosRelative = [0,0]
    }
    else {
        if (touch.identifier != joystickTouchID) return;
        touchPosRelative = [
            touch.pageX - joystickBoundingRect.centerPoint[0],
            touch.pageY - joystickBoundingRect.centerPoint[1]
        ]
    }
    const radius = joystickBoundingRect.radius
    let boundingMulitplier = 1
    let joystickDistance = vectorMagnitude({x:touchPosRelative[0], y:touchPosRelative[1], z:0})
    if (joystickDistance > radius) boundingMulitplier = radius / joystickDistance
    joystickKnobRelativePos[0] = touchPosRelative[0] / radius * boundingMulitplier
    joystickKnobRelativePos[1] = touchPosRelative[1] / radius * boundingMulitplier
    const knobRadius = joystickKnobBoundingRect.width * 0.5
    const radiusAsPercentage = (knobRadius / joystickBoundingRect.width) * 100
    const leftOffsetPercent = 50 - radiusAsPercentage + ((joystickKnobRelativePos[0]) * 40)
    const topOffsetPercent = 50 - radiusAsPercentage + ((joystickKnobRelativePos[1]) * 40)
    joystickKnob.style.left = Math.floor(leftOffsetPercent) + "%"
    joystickKnob.style.top = Math.floor(topOffsetPercent) + "%"
}

const updateJoystickDimensions = () => {
    joystickBoundingRect = joyContainer.getBoundingClientRect()
    joystickKnobBoundingRect = joystickKnob.getBoundingClientRect()
    joystickKnobBoundingRect.radius = joystickKnobBoundingRect.width/2
    joystickBoundingRect.radius = joystickBoundingRect.width/2
    joystickBoundingRect.centerPoint = [
        joystickBoundingRect.x + joystickBoundingRect.radius,
        joystickBoundingRect.y + joystickBoundingRect.radius
    ]
    updateJoystickPosition()
}

updateJoystickDimensions()



class Game {
    static setPerspective(bottomY=900, perspectiveHeight=500, basesWidth=1000, startPercentage=0.15){
        Game.baseWidth = basesWidth
        Game.baseCenterX = canvas.width/2
        Game.height = perspectiveHeight
        Game.bottomY = bottomY
        Game.topY = Game.bottomY - Game.height
        Game.startPercentage = startPercentage 
        Game.startY = Game.topY + (Game.height * Game.startPercentage)
    }
   
    constructor(ctx, width, height, bitmaps){
        Game.setPerspective();
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.lastTimeStamp = 0;
        this.frameTimeDeficit = 0;
        this.totalFrames = 0;
        this.fps = 48;
        this.gameProgress = 0
        this.speedModifier = 1;
        this.activeObjects = []
        this.stats = {score:0, coins: 500, combo: 1}
        this.player = new Player(this, bitmaps.block, bitmaps.attack)
        this.statsHandler = new StatsHandler(this)
        this.inputHandler = new InputHandler()
        this.states = { initializing: new Initializing(this), playing: new Playing(this), paused: new Paused(this),
                        gameOver: new GameOver(this), gameCompletion: new GameCompletion(this) }
        this.state = this.states.initializing
        this.state.enter();
        this.activeObjects.push(new CannonWielder(this,{x:0,y:0,z:400}))
        //this.activeObjects.push(new Line(this,{x:100,y:300,z:-300},{x:-1000,y:900,z:3000}))
        //this.activeObjects.push(new CircleTest(this,100,{x:0,y:500,z:1500}))
        
    }
    update(timestamp, keyRecord, touchRecord){
        const input = this.inputHandler.readInput(keyRecord, touchRecord)
        const framesDue = this.getFramesDue(timestamp)
        if (framesDue !== 0) {
            this.state.update(input)
            this.draw(this.ctx)
            this.statsHandler.update(this.stats)
            this.updateSpeedModifier()
        }
    }
    draw(ctx){
        this.state.draw(ctx)
    }
    changeState(state){
        this.state.exit();
        this.state = this.states[state]
        this.state.enter();
    }
    addScore(num){
        let score = num * this.stats.combo
        if (num > 5) this.stats.combo += 1
        this.stats.score += score
    }
    updateSpeedModifier(){
        let newSpeed = 1 + (Math.pow((this.stats.combo-1)/25, (2/3)))
        if (round(newSpeed,2) != this.speedModifier) {
            this.speedModifier = newSpeed
            this.player.moveSpeed = this.player.minimumSpeed * this.speedModifier
            this.setViewDistance(0.15 - ((1/16)*(newSpeed-1)))
        }
    }
    getFramesDue(timestamp){
        const frameTime = timestamp - this.lastTimeStamp
        this.frameTimeDeficit += frameTime;
        this.lastTimeStamp = timestamp;
        const framesDue = Math.floor(this.frameTimeDeficit / (1000/this.fps));
        this.frameTimeDeficit = this.frameTimeDeficit % (1000/this.fps);
        return framesDue;
    }
    setBaseStartPoint(y=1000){
        const difference = Game.bottomY - y
        Game.setPerspective(y,Game.height,Game.baseWidth,Game.startPercentage)
    }
    setViewDistance(startPercentage){
        Game.startPercentage = startPercentage
        Game.startY = Game.topY + (Game.height * Game.startPercentage)
    }
    changePerspectiveHeight(height){
        const heightDifference = Game.height-height
        this.player.moveSpeed = this.player.minimumSpeed * this.speedModifier * (height/Game.height)
        const baseAdjustment = heightDifference/3
        const ratio = (baseAdjustment+Game.baseWidth) / Game.baseWidth
        this.activeObjects.forEach((e)=> { if (!(e instanceof SkyLayer)) e.x *= ratio})
        Game.setPerspective(Game.bottomY,height,Game.baseWidth+baseAdjustment,Game.startPercentage)
    }
}


class GameState {
    constructor(game){
        this.game = game
        this.ctx = game.ctx
        this.width =  game.width
        this.height = game.height
    }
    enter(){}
    exit(){}
    update(){}
    draw(){}
}
class Paused extends GameState {
    constructor(game){
        super(game)
        document.addEventListener("mousedown", (event) => this.debugHighlight(event))
    }
    enter(){ 
        document.getElementById("resume-btn").classList.remove("disabled")
    }
    exit(){
    }
    update(input){ if (document.fullscreenElement) this.game.changeState("playing") } //fix this to have game start rules not based on fullscreen

    debugHighlight(event){
        if (this.game.state != this) return;
        const clickCoords = getMousePosition(event, canvas) 
        let endCycle = false
        this.game.activeObjects.filter(e=>{
            return (e instanceof Bush
                || e instanceof Enemy
                || e instanceof Projectile)
        }).toReversed().forEach( e => {
            if (endCycle) return;
            const color = randomColor()
            if (pointInRectangle(e.dx, e.dy, e.dw, e.dh, clickCoords.x, clickCoords.y)){
                endCycle = true
                e.image.drawOutline(ctx, color, e.dx, e.dy, e.dw, e.dh)
            }
        })
        
    }
}
class Initializing extends GameState {
    constructor(game){
        super(game)
        this.ctx.font = "50px Lugrasimo"
    }
    enter(){
        for (let i = 0; i < 600; i++) {
            this.game.states.playing.handleBackground();
            this.game.player.moveObjectsCloser()
        }
        for (let i = 0; i < 7; i++) this.game.activeObjects.push(new SkyLayer(this.game,0+(i*50),i*100))
    }
    exit(){
        
    }
    update(input){ this.game.changeState("playing") }
    draw(ctx){ return }
    
}
class Playing extends GameState {
    constructor(game){
        super(game)
        this.framesSinceBowman = 0;
        this.treesDelay = 40;
        this.bowmanDelay = 0
        this.shadowCanvas = document.createElement("canvas")
        this.shadowCanvas.width = this.width
        this.shadowCanvas.height = this.height
        this.ctxShadow = this.shadowCanvas.getContext("2d")
        //document.onclick = e => { document.onclick = e => {this.testProjectile(e)} }   
    }
    update(input){
        if (!document.fullscreenElement) {
            this.game.changeState("paused")
            return
        } 
        this.game.totalFrames++;
        this.handleEnemies();
        this.handleBackground();
        //this.handleCannon(input);
        this.game.player.update(input)
        this.game.activeObjects.forEach((e)=>e.update(input))
        
        this.game.activeObjects = this.game.activeObjects.filter((e)=>!e.markedForDel)
        this.game.activeObjects.sort((a,b)=> {
            const v1 = vectorMagnitude(b.vector.visionVector) * Math.sign(b.vector.z)
            const v2 = vectorMagnitude(a.vector.visionVector) * Math.sign(a.vector.z)
            return v1 - v2
            })
        this.draw(this.ctx);   
    }
    testProjectile(){
        const projectiles = ["soccorBall","bowlingBall"]
        const int = randomInt(0,projectiles.length-1)
        const newProj = Projectile[projectiles[int]](this.game)
        this.game.activeObjects.push(newProj)
    }
    handleEnemies(){
        const startingDepth = 4200
        if (this.framesSinceBowman > this.bowmanDelay) this.spawnBowWave(startingDepth);
        else this.framesSinceBowman += this.game.speedModifier;
        if (this.game.player.health < 0.5) {
            if(Turkey.turkeySpawnable()) this.game.activeObjects.push(new Turkey(this.game,{x: 0, y: 0, z: 4000}))
        }
    }
    spawnBowWave(startingDepth){ 
        this.game.activeObjects.push(...Bowman.spawnWave(this.game,startingDepth,randomInt(2,3)))
        this.framesSinceBowman = 0
        this.bowmanDelay = 600
    }
    handleBackground(){
        if (this.treesDelay <= 0) {
            Tree.spawnWave(this.game)
            this.treesDelay += Math.floor(40/this.game.speedModifier)   //swap out for just checking if trees have traveled a certain depth from starting point
        } else this.treesDelay -= 1
        if (this.treesDelay === Math.floor(20/this.game.speedModifier)) {
            this.game.activeObjects.push(new Bush(this.game, 4000, randomValue(925,1025)*randomSign()))
        }
    }
    draw(){
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctxShadow.clearRect(0,0,this.width,this.height)
        this.drawStaticBackground(this.ctx);
        this.overlayShadows()
        this.game.activeObjects.forEach(e => {
            e.draw(this.ctx)
        })
        this.game.player.draw(this.ctx)
        this.game.statsHandler.draw(this.ctx)
    }
    overlayShadows(){
        this.game.activeObjects.forEach(e => e.drawShadow(this.ctxShadow))
        this.ctxShadow.clearRect(0, 0, this.width, Game.startY)
        this.ctx.globalAlpha = 0.5
        this.ctx.drawImage(this.shadowCanvas,0,0,this.width,this.height)
        this.ctx.globalAlpha = 1        
    }
    drawStaticBackground(ctx){
        ctx.fillStyle = '#439544'
        ctx.fillRect(0, 0, this.width, this.height)
        ctx.fillStyle = '#439544'
        ctx.fillRect(0, Game.startY, Game.baseCenterX*2, Game.bottomY-Game.startY)
        ctx.beginPath()
        const StartWidth = Game.startPercentage * Game.baseWidth
        ctx.moveTo(Game.baseCenterX - StartWidth/2, Game.startY)
        ctx.lineTo(Game.baseCenterX + StartWidth/2, Game.startY)
        ctx.lineTo(Game.baseCenterX + Game.baseWidth/2, Game.bottomY)
        ctx.lineTo(Game.baseCenterX - Game.baseWidth/2, Game.bottomY)
        ctx.closePath()
        ctx.fillStyle = "#cfbd86"
        ctx.fill();
    }
    
}
class GameOver extends GameState {
    constructor(game){
        super(game)
    }
    enter(){
        
    }
    update(input){
        
    }
}
class GameCompletion extends GameState {
    constructor(game){
        super(game)

    }
    update(input){
        
    }
}

class Point { 
    constructor(coords = {x:0,y:0,z:0}){
        this._x = coords.x 
        this._y = coords.y 
        this._z = coords.z 
        this.updateCamera()
        this.parentPoint = undefined
        this.dependentPoints = []
        // must setup rotation dependency as well, 
        // even dependent points may not be rotation dependent on every axis
        // if a parent point is rotated on a point outside itself, then every dependent point 
        // down the chain will rotate around that same point
        // but if any object has a free axis of rotation (like a wheel) then it will ignore 
        // rotation requests from up the dependency chain only on that axis
        // so I need to be sure that that the wheel will know a rotation matches its free axis
        // meaning: the line made from the center of rotation and the axis of rotation, if
        // continued would line up with the center point and axis of rotation for the wheel
        // substract center points to make line between, check if that line between is some multiple
        // of both rotation axis (divide x/vx, z/v1x etc.. and should get two sets of 3 identical ratios)
        // (or 0.001 close to identical cause of small fractions and whatnot)
        
    }

    get x(){ return this._x }
    get y(){ return this._y }
    get z(){ return this._z }

    set x(num){ this._x = num, this.cX = Game.baseCenterX + (this._x * this.perspectiveScale) }
    set y(num){ this._y = num, this.cY = Game.bottomY - (this._z * this.perspectiveScale) - (this._y * this.perspectiveScale)}
    set z(num){ this._z = num, this.updateCamera() }

    //fix vision vector at some point to get rid of arbitray +100
    get visionVector(){ return { x: this._x, y: this._y - Game.height, z: this._z + 100 } }
    
    update(){

    }
    move(coords, parentPoint){
        if (parentPoint !== this.parentPoint) return;
        this._x += coords.x || 0
        this._y += coords.y || 0
        this._z += coords.z || 0
        this.updateCamera()
        this.dependentPoints.forEach( (point) => {
            point.move(coords, this)
        })
    }
    moveTo(coords, parentPoint){
        const translationVector = vectorFromPoints(this, coords)
        this.move(translationVector, parentPoint)
    }
    updateCamera(){ 
        this.perspectiveScale = 1 - ((this._z) / (this._z + Game.height))
        this.cX = Game.baseCenterX + (this._x * this.perspectiveScale)
        this.cY = Game.bottomY - (this._z * this.perspectiveScale) - (this._y * this.perspectiveScale)
    }
    copyCoords(point){
        // not a translation, so doesn't respect linked points 
        this._z = point.z
        this._x = point.x
        this._y = point.y
        this.updateCamera() 
    }
    linkDependentPoints(){
        for (let i = 0; i < arguments.length; i++) {
            if (arguments[i] instanceof Point) {
                this.dependentPoints.push(arguments[i])
                arguments[i].parentPoint = this
            }
        }
        console.log(this.dependentPoints)
    }
    getCoords(){}
}
class PhysicsPoint extends Point{
    constructor(coords = {x:0,y:0,z:0}){
        super(coords)
        this.velocity = {x:0,y:0,z:0}
        this.force = {x:0,y:-2,z:0} //-2 default to represent gravity
        this.borders = {x:[-750,750],y:[0,undefined], z:[undefined,2100]} //[lowerlimit, upper limit]
        this.mass = 1
        this.airFriction = 0.005
        this.groundFriction = 0.05
        this.bounceDampening = 0.5  // max 1 (negative value needed for infnite bouncing) 
        this.framesActive = 0
    }
    update(){
        const {velocity, borders, force} = this
        const vector = {x:this._x, y:this._y, z:this._z} //block works on a copy of the current coordinates
        const onGround = vector.y >= borders.y[0] && velocity.y === 0
        const deceleration = onGround ? this.groundFriction * this.mass : this.airFriction / this.mass
        for (const axis in velocity) {
            velocity[axis] *= 1-deceleration
            velocity[axis] += force[axis]
            vector[axis] += velocity[axis] 
            borders[axis].forEach((border,index) => {
                const side = index === 0 ? -1 : 1  //used to reverse inequalities when border is left/down/back
                if (vector[axis] - velocity[axis] === border  //true if obj is moving into border it was touching last frame 
                    && side * (vector[axis]) > side * border){ 
                        vector[axis] -= velocity[axis]
                        velocity[axis] = 0
                    }
                if (side * vector[axis] > side * border) { //checks collision, cant be true if previous if-block reset the position
                    this.collision(vector, axis,index)
                }
            })
        } 
        this.framesActive += 1
        this.moveTo(vector)
        super.update()
    }
    collision(vector, axis, borderIndex){
        const {velocity, borders, force} = this
        const distanceCovered = Math.abs(velocity[axis])
        const overshootDistance = (Math.abs(vector[axis])-Math.abs(borders[axis][borderIndex]))
        const velocityCorrection = force[axis] * ( (distanceCovered-overshootDistance) / distanceCovered )
        vector[axis] = borders[axis][borderIndex]
        velocity[axis] -= force[axis] - velocityCorrection
        velocity[axis] *= -1
        const velMagnitude = Math.abs(velocity[axis])
        let decreaser = Math.pow(velMagnitude,this.bounceDampening) - (1-this.bounceDampening)
        if (decreaser < velMagnitude) velocity[axis] -= decreaser * Math.sign(velocity[axis])
        else velocity[axis] = 0 
    }
}

class GameImage {
    constructor(fileSrc, width, height, x = 0, y = 0){
        this.image = new Image()
        this.image.src = fileSrc
        this.width = width
        this.height = height
        this.x = x
        this.y = y
        this.alpha = 1
        this.angle = 0
        this.flipped = false
    }
    draw(ctx, x = this.x + Game.baseCenterX - this.width/2 , 
        y = Game.bottomY - this.y - this.height, 
        width = this.width, height = this.height){
        const {alpha,angle,flipped} = this
        if (alpha < 1 || angle !== 0 || flipped) {
            ctx.save()
            this.rotate(ctx,x+width/2,y+height/2)
            this.flipHorizontal(ctx,x+width/2,0)
            ctx.globalAlpha = this.alpha
        }
        if (this.image.currentSrc === "http://192.168.2.39:5501/images/coin_pile/1.png") console.log(this, x,y,width,height)
        if (alpha !== 0 && this.image) ctx.drawImage(this.image, x, y, width, height)
        ctx.restore()
    }
    fadeAlpha(increment){
        let alpha = this.alpha + increment
        if (alpha > 1) alpha = 1;
        if (alpha < 0) alpha = 0;
        this.alpha = alpha;
    }
    rotate(ctx,x,y){
        if (this.angle === 0) return; 
        ctx.translate(x,y)
        ctx.rotate(this.angle)
        ctx.translate(-x,-y)
    }
    flipHorizontal(ctx,x,y){
        if (!this.flipped) return;
        ctx.translate(x,y)
        ctx.scale(-1,1)
        ctx.translate(-x,y)
    }
    drawOutline(ctx,color, x, y, w, h){
        if (this instanceof Tree) return;
        ctx.save()
        ctx.strokeStyle = color
        ctx.lineWidth = 3
        ctx.strokeRect(x, y ,w, h)
        ctx.restore()
    }
}

class GameObj {
    constructor(game, gameImage, basePoint){
        this.game = game
        this.image = gameImage
        this.vector = new Point(vectorDeepCopy(basePoint))
        this.relativeSpeed = 0
        this.markedForDel = false;
        this.shadow = new Image()
        this.shadow.src = "./images/shadow_small.png"
    }

    get perspectiveScale(){return this.vector.perspectiveScale}
    get dw(){return this.image.width * this.perspectiveScale}
    get dh(){return this.image.height * this.perspectiveScale}
    get dy(){return this.vector.cY - this.dh}
    get dx(){return this.vector.cX - (this.dw/2)}

    get centralVector(){return {x: this.vector.x, y: this.vector.y + this.image.height/2, z: this.vector.z}}
    get centerX(){return this.dx+this.dw/2 }   
    get centerY(){return this.dy+this.dh/2 }
    get imageGroundY(){return Game.bottomY - (this.vector.z * this.perspectiveScale)}

    get lane(){
            if (this.vector.x < -50) return "left"
            if (this.vector.x > 50) return "right"
            return "middle"
        }
    
    draw(ctx){        
        if (this.imageGroundY < Game.startY && !showElementsAtAnyDistance) return;
        const {dx, dy, dw, dh} = this;
        this.image.draw(ctx,(dx), (dy), (dw), (dh))

    }
    update(){
        this.vector.update()
    }
    drawShadow(ctx, shadowImg, widthMultiplier){
        if (this.imageGroundY < Game.startY) return;
        if (!shadowImg) return;
        const width = this.dw * widthMultiplier
        const height = width * 0.3
        const y = this.imageGroundY - (height/1.8)
        ctx.drawImage(shadowImg, Math.floor((this.centerX-width*0.5)+0.5), y, Math.floor(width+0.5), Math.floor(height+0.5))
    }
    addPhysics(){
        const newPoint = new PhysicsPoint()
        newPoint.copyCoords(this.vector)
        this.vector = newPoint
    }
    swapGameImage(gameImage){
        this.image = gameImage
    }
    depthFromProjectedDistance(num){
        return num / (1-(num/Game.height))
    }
}

class InputHandler {
    constructor(){}
    readInput(keyRecord, touchRecord){
        if (Object.keys(touchRecord).length === 0) return this.readKeyboardInput(keyRecord)
        else return this.readTouchInput(touchRecord)
        
    }
    readKeyboardInput(keyRecord){
        let input = []
        if (keyRecord.includes('a')) input.push('left')
        if (keyRecord.includes('d')) input.push('right')
        if (keyRecord.includes(' ')) input.push('attack')
        if (keyRecord.includes('s')) input.push('down')
        if (keyRecord.includes('w')) input.push('up')
        if (keyRecord.includes('ArrowUp')) input.push ('arrowUp')
        if (keyRecord.includes('ArrowDown')) input.push ('arrowDown')
        if (keyRecord.includes('ArrowLeft')) input.push ('arrowLeft')
        if (keyRecord.includes('ArrowRight')) input.push ('arrowRight')
        return input
    }
    readTouchInput(touchRecord){
        // const touch0 = touchRecord.touch0
        // const touch1 = touchRecord.touch1
        // const lastTouch = touch1 || touch0
        // const lastTouchX = lastTouch.x[lastTouch.x.length-1]
        // let input = 'middle'
        // if (lastTouchX < window.innerWidth/3) input = 'left'
        // if (lastTouchX > window.innerWidth*(2/3)) input = 'right'
        // if (touchRecord.touch0 && touchRecord.touch1) input = 'middle'
        // if ((touch0 && touch0.y[touch0.y.length-2] - touch0.y[touch0.y.length-1] > 15) ||
        //     (touch1 && touch1.y[touch1.y.length-2] - touch1.y[touch1.y.length-1] > 15)) input = 'attack'
        // return input
        let input = ['middle']
        if (joystickKnobRelativePos[0] > 0.15) input.push('right')
        if (joystickKnobRelativePos[0] < -0.15) input.push('left')
        return input
    }

}

class StatsHandler {
    constructor(game){
        this.game = game
        this.scoreDisplay = new IncrementingText(GameText.standardStroked("0",500,100),0.5)
        this.comboDisplay = GameText.standardStroked(`ₓ1`,750,100)
        this.coinsNumDisplay = GameText.standardStroked("0",250,100)
        this.generateCoinImages()
        this.coinImage = 0;
    }
    update({score,coins,combo}){
        this.scoreDisplay.update(score)
        this.comboDisplay.content = `ₓ${combo}`
        this.coinsNumDisplay.content = `${coins}`
        this.updateCoinImage(coins)
    }
    draw(ctx){
        this.scoreDisplay.draw(ctx)
        this.comboDisplay.draw(ctx)
        this.coinsNumDisplay.draw(ctx)
        this.coinImages[this.coinImage].draw(ctx)
    }
    generateCoinImages(){
        this.coinImages = []
        this.coinImages.push(new GameImage("",0,0))
        for (let i = 0; i < 6; i++) {
            const imgSrc = `./images/coin_pile/${i+1}.png`
            this.coinImages
                .push(new GameImage(imgSrc,80,80,-340,890))
        }
    }
    updateCoinImage(coins){
        if (this.coinImage === 0 && coins > 0) this.coinImage = 1
        if (this.coinImage === 6) return;
        if (coins > Math.pow((this.coinImage+3),3)) this.coinImage++
    }

}

class GameText {
    static standardStroked(content,centerX,baseY){
        const font = "50px Lugrasimo"
        const stroke = 4
        return new GameText(content,font,centerX,baseY,stroke,"white","black")
    }
    static small(content,centerX,baseY){
        const font = "35px Lugrasimo"
        const stroke = 2
        return new GameText(content,font,centerX,baseY,stroke,"white","black")
    }
    static currentFont = "50px Lugrasimo"
    constructor(content,font,centerX,baseY,stroke,color,strokeColor){
        this.content = content 
        this.centerX = centerX
        this.baseY = baseY
        this.font = font
        this.stroke = stroke
        this.color = color
        this.strokeColor = strokeColor
    }
    draw(ctx){
        if (this.content === "") return;
        if (!this.dimensions) this.dimensions = ctx.measureText(this.content)
        const x = this.centerX - (this.dimensions.width/2)
        const y = this.baseY
        if (this.font !== GameText.currentFont) {
            ctx.font = this.font
            GameText.currentFont = this.font
        }
        if (this.stroke > 0){
            ctx.lineWidth = this.stroke
            ctx.strokeStyle = this.strokeColor
            ctx.strokeText(this.content,x,y)
        }
        ctx.fillStyle = this.color
        ctx.fillText(this.content,x,y)
    }
}

class IncrementingText {
    constructor(gameTextInstance,incrementSpeedFactor=0){
        if (isNaN(+gameTextInstance.content)) gameTextInstance.content = 0;
        this.text = gameTextInstance
        this.incrementSpeedFactor = incrementSpeedFactor
        this.incrementJumpPoint = 0.1*this.incrementSpeedFactor
        this.targetValue = +this.text.content
        this.currentValue = +this.text.content
        this.secondaryText = []
    }
    update(num){
        this.secondaryText.forEach(e=>e.update())
        if (this.targetValue !== num) this.generateSecondaryText(num)
        this.targetValue = num 
        const difference = this.targetValue - this.currentValue
        if (difference === 0) return;
        const sign = Math.sign(difference)
        const absDifference = Math.abs(difference)
        let increment = (Math.sqrt(absDifference)) * this.incrementSpeedFactor * sign
        if (Math.abs(increment) < this.incrementJumpPoint || Math.abs(increment) > absDifference) increment = difference
        this.currentValue += increment
        this.text.content = Math.floor(this.currentValue)
        this.text.dimensions = undefined;
    }
    generateSecondaryText(num){
        const difference = num - this.targetValue
        const content = `${difference < 0 ? "" : "+"}${difference}`
        const centerX = this.text.centerX + this.text.dimensions.width/2
        const baseY = this.text.baseY
        const secondaryText = AnimatedText.positive(GameText.small(content,centerX,baseY))
        this.secondaryText.push(secondaryText)
    }
    draw(ctx){
        this.text.draw(ctx)
        this.secondaryText.forEach(e=>e.draw(ctx))
    }
}

class AnimatedText {
    static positive(gameTextInstance){
        gameTextInstance.color = "white"
        return new AnimatedText(gameTextInstance,-8,12)
    }
    static negative(gameTextInstance){
        gameTextInstance.color = "red"
        return new AnimatedText(gameTextInstance,+8,12)
    }
    constructor(gameTextInstance,velY,movementFrameSpan){
        this.text = gameTextInstance
        this.velY = velY
        this.movementFrameSpan = movementFrameSpan
        this.framesActive = 0
        this.markedForDel = false;
    }
    update(){
        this.framesActive += 1
        if (this.framesActive > this.movementFrameSpan) return;
        this.text.baseY += this.velY
        this.velY *= 0.9
    }
    draw(ctx){
        if (this.framesActive > this.movementFrameSpan*1.5) return;
        this.text.draw(ctx)
    }
}

//If I make a shape class, I can draw lines between points by finding 4 points and drawing between them, creating a rectangle that is thicker closer to the player
// 

class Line {
    constructor(game, p1, p2){
        this.game = game
        this.p1 = new Point(p1)
        this.p2 = new Point(p2)
        this.markedForDel = false;
        this.stroke = 15
    }
    get vector(){return vectorFromPoints(this.p1,this.p2)}
    update(){}
    draw(ctx){
        const p1Coords = {x:this.p1._x,y:this.p1._y,z:this.p1._z}
        const vector = this.vector
        const vectorMag = vectorMagnitude(vector)
        const unitVec = unitVector(vector)
        const split = 20 //number of 
        const depth = this.p1.z - this.p2.z
        const steps = Math.abs(depth/split)
        const magntitudeStep = vectorMag/steps
        ctx.strokeStyle = 'black'
        for (let i = 0; i < steps; i++) {
            ctx.beginPath()
            ctx.moveTo(this.p1.cX, this.p1.cY)
            const steppedCoords = changeVectorLength(unitVec,(i+1)*magntitudeStep)
            this.p1.copyCoords(addVectors(p1Coords,steppedCoords))
            ctx.lineTo(this.p1.cX,this.p1.cY)
            ctx.lineWidth = this.stroke * this.p1.perspectiveScale 
            ctx.stroke()
            ctx.closePath()
        }
        ctx.beginPath()
        ctx.moveTo(this.p1.cX, this.p1.cY)
        ctx.lineTo(this.p2.cX, this.p2.cY)
        ctx.lineWidth = this.stroke * this.p1.perspectiveScale
        ctx.stroke()
        this.p1.copyCoords(p1Coords)
    }
    drawShadow(){}


}

class CircleTest {
    constructor(game, radius, centerPoint, strokeSize = 10, strokeColor = 'black',  fillColor){
        this.game = game
        this.radius = radius
        this.vector = new Point(centerPoint)
        this.xAxisReferencePoint = new Point(centerPoint)
        this.yAxisReferencePoint = new Point(centerPoint)
        this.normalEndPoint = new Point()
        this.xAxisReferencePoint.x += radius
        this.yAxisReferencePoint.y += radius
        this.setNormal()
        this.stroke = strokeSize
        this.strokeColor = strokeColor
        this.fillFace = fillColor
        this.fillBack = fillColor
        this.markedForDel = false;
        this.rotationAxis = {x:0.5,y:1,z:0}
        this.willDrawReferenceLines = false;
        this.spokes = 0;
        this.vector.linkDependentPoints(this.xAxisReferencePoint, this.yAxisReferencePoint)
        this.connectionPoints = [this.vector, this.xAxisReferencePoint, this.yAxisReferencePoint]
    }

    update(){
    }

    setNormal(){
        const v1 = vectorFromPoints(this.vector,this.xAxisReferencePoint)
        const v2 = vectorFromPoints(this.vector,this.yAxisReferencePoint)
        this.normalVector = changeVectorLength(crossProduct(v1,v2),100)
        this.normalEndPoint.copyCoords(addVectors(this.vector,this.normalVector))
    }

    move(translationVector){
        this.connectionPoints.forEach( point => {
            point.copyCoords(addVectors(point, translationVector))
        })
        this.setNormal()
    }

    moveTo(newCenterPosition){
        const translationVector = vectorFromPoints(this.vector, newCenterPosition)
        this.move(translationVector)
    }

    rotate(rotationCenter, rotationAxis, angle){
        this.connectionPoints.forEach( point => {
            point.copyCoords(rotatePointAroundPoint(point, rotationCenter, rotationAxis, angle) )
        })
        this.setNormal()
    }

    draw(ctx){
        //set the canvas settings (using visiblity angle to determine which face of the circle we are seeing)
        ctx.strokeStyle = this.strokeColor
        ctx.lineWidth = this.stroke * this.vector.perspectiveScale
        const angleOfVisibility = angleBetweenVectors(this.vector.visionVector, this.normalVector)
        const fillColor = angleOfVisibility < Math.PI/2 ? this.fillBack : this.fillFace

        //divide the circle into sides, create point to track rotation
        const sides = Math.floor((this.radius) * Math.sqrt(this.vector.perspectiveScale))
        let angleStep = Math.PI * 2 / sides
        const point = new Point()
        point.copyCoords(this.yAxisReferencePoint)
        
        this.polygonPoints = []
        ctx.beginPath()
        ctx.moveTo(point.cX, point.cY)
        for (let i = 0; i < sides; i++) {
            if (i === sides-1) angleStep *= 1.1
            const nextPoint = rotatePointAroundPoint(point, this.vector, this.normalVector, angleStep)
            point.copyCoords(nextPoint)
            ctx.lineTo(point.cX, point.cY)
            this.polygonPoints.push([point.cX,point.cY])
        }
        ctx.stroke()
        if (fillColor) {
            ctx.fillStyle = fillColor
            ctx.fill()
        }
        ctx.closePath()

        //rotated around again, drawing spokes
        const spokeInterval = this.spokes > 0? Math.PI*2 / this.spokes : 0
        ctx.lineWidth = this.stroke * (2/3) * this.vector.perspectiveScale
        point.copyCoords(this.yAxisReferencePoint)
        const {cX, cY} = this.vector
        for (let i = 0; i < this.spokes; i++) {
            ctx.beginPath()
            ctx.moveTo(cX, cY)
            const nextPoint = rotatePointAroundPoint(point, this.vector, this.normalVector, spokeInterval)
            point.copyCoords(nextPoint)
            ctx.lineTo(point.cX, point.cY)
            ctx.lineTo(cX, cY)
            ctx.stroke()
            ctx.closePath()
        }
        if (this.willDrawReferenceLines) this.drawReferenceLines()
    }
    drawReferenceLines(){
        const referenceLines = [[this.xAxisReferencePoint,'green'], [this.yAxisReferencePoint, 'blue'], [this.normalEndPoint, 'red']]
        referenceLines.sort((a,b) => b[0].z - a[0].z)
        const x = this.vector.cX
        const y = this.vector.cY
        referenceLines.forEach( e => {
            ctx.beginPath()
            ctx.moveTo(x, y)
            ctx.lineTo(e[0].cX, e[0].cY)
            ctx.strokeStyle = e[1]
            ctx.stroke()
            ctx.closePath()
        })
    }
    drawShadow(){}
}

class Sphere extends CircleTest{
    constructor(game, radius, centerPoint, strokeSize, strokeColor, fillColor){
        super(game, radius, centerPoint, strokeSize, strokeColor, fillColor)
    }
    draw(ctx){
        const radius = this.radius * this.vector.perspectiveScale

        ctx.strokeStyle = this.strokeColor
        ctx.fillStyle = this.fillFace
        ctx.lineWidth = this.stroke * this.vector.perspectiveScale
        
        ctx.beginPath()
        ctx.arc(this.vector.cX, this.vector.cY, radius, 0, Math.PI*2)
        ctx.stroke()
        ctx.fill()
        ctx.closePath()

        if (this.willDrawReferenceLines) this.drawReferenceLines()
    }
}

class Circle {
    constructor(game, radius, centerPoint, angleXZ, angleZY){
       this.game = game
       this.vector = new Point(vectorDeepCopy(centerPoint))
       this.radius = radius 
       this.angleXZ = angleXZ
       this.angleZY = angleZY
       this.stroke = 5
       this.strokeColor = 'black'
       this.fillFace = undefined
       this.fillBack = undefined
       this.normalEndPoint = new Point(addVectors(this.vector, this.normalVector)) 
    }
    get visionVector(){ return {x:this.vector.x, y:this.vector.y - Game.height, z:this.vector.z + 100} } // adding 100 to vision vector depth, correct later but right now makes effect better  

    // need to change this calc so that when circle is in full size, its angle is 90 not 0, so that the wheel
    // isnt spinning and squishing turned sideways (its only spinning if its unsqushing the same amount)
    get rotationAngle() {
        //const normalAngle2D = Math.atan2((this.vector.cY - this.normalEndPoint.cY) , (this.vector.cX - this.normalEndPoint.cX))
        const normalAngle2D = Math.atan((this.vector.cY - this.normalEndPoint.cY) / (this.vector.cX - this.normalEndPoint.cX))
        const ellipseAngle = normalAngle2D - (Math.sign(normalAngle2D) * Math.PI/2)
        return ellipseAngle
    }
    get normalVector(){ 
        const updatedNormal = {
            x:Math.cos(this.angleXZ) * Math.cos(this.angleZY),
            y:Math.sin(this.angleZY),
            z:Math.sin(this.angleXZ) * Math.cos(this.angleZY)
        }
        if (this.normalEndPoint) this.normalEndPoint.copyCoords(addVectors(this.vector, updatedNormal))
        return updatedNormal
    }
    
    get angleOfVisibility(){ return angleBetweenVectors(this.visionVector, this.normalVector)}

    get cameraMinorRadius(){ return this.radius * this.vector.perspectiveScale * Math.abs(Math.cos(this.angleOfVisibility)) }

    get cameraRadius(){ return this.radius * this.vector.perspectiveScale}

    setAngleFromNormalVector(vector){}

    update(){
        if (this.vector.z < 0) this.markedForDel 
    }

    draw(ctx){
        
        const drawCircle = () => {
            ctx.beginPath()
            const clockwise = false //this.angleOfVisibility > 1.571 ? true : false
            ctx.ellipse(this.vector.cX, this.vector.cY, this.cameraRadius,
                this.cameraMinorRadius, this.rotationAngle, 0, Math.PI*2, clockwise)
            if (this.angleOfVisibility < 1.571) ctx.fillStyle = this.fillFace
            else ctx.fillStyle = this.fillBack
            if (this.fillFace) ctx.fill()
            ctx.strokeStyle = this.strokeColor
            ctx.lineWidth = this.stroke * this.vector.perspectiveScale
            ctx.stroke()
            ctx.closePath()
        }

        // const drawNormalLine = () => {
        //     ctx.beginPath()
        //     ctx.moveTo(this.vector.cX, this.vector.cY)
        //     const perpdenciularVector = changeVectorLength(this.normalVector , 80)
        //     const perpPoint2D = Game.get2Dcoords(addVectors(this.vector, perpdenciularVector))
        //     ctx.lineTo(perpPoint2D.x, perpPoint2D.y)
        //     ctx.strokeStyle = 'red'
        //     ctx.lineWidth = 5 * this.vector.perspectiveScale
        //     ctx.stroke()
            
        //     ctx.closePath() 

        //     // const normalAngle2D = Math.atan((perpPoint2D.y - vector2D.y) / (perpPoint2D.x - vector2D.x))
        //     // this.rotation = normalAngle2D + 1.571

        // }

        if (Math.abs(this.angleOfVisibility < 1.571)) {
            //drawNormalLine(ctx, vector2D)
            drawCircle()
        } else {
            drawCircle()
            //drawNormalLine(ctx, vector2D)
        }
    }
    
    drawShadow(){}
}


class BowlingBall extends GameObj{
    constructor(game, point = {x:0,y:0,z:0}){
        super(game, new GameImage(`./images/bowlingball.png`,80,80),point)
        this.addPhysics()
        this.vector.groundFriction = 0.01
        this.vector.bounceDampening = 0.9
        this.mass = 0.75
    }
    update(){
        super.update()
    }
    drawShadow(ctx){
        return;
    }
}

class GroundedObjects extends GameObj{
    constructor(game, gameImage, depth){
            super(game, gameImage, depth)
        }
    update(){
        if(this.vector.z < 100) this.image.fadeAlpha(-0.2)
        if(this.vector.z < -150) this.markedForDel = true; 
    }
}

class Tree extends GroundedObjects {
    static imageSources = [`./images/trees/tree_v3_1.png`,
                     `./images/trees/tree_v3_2.png`]
    

    static spawnWave(game){
        const tree1 = new Tree(game,4000,randomInt(1000,1020))
        const tree2 = new Tree(game,4000,-1 * randomInt(1000,1020))
        tree1.image.flipped = randomInt(0,1) === 1
        tree2.image.flipped = randomInt(0,1) === 1
        game.activeObjects.push(tree1,tree2)
     }
    constructor(game,depth,x){
        const scaler = randomValue(1.9,2.1)
        const size = {width: 1060 * scaler, height: 1090 * scaler}
        const picIndex = randomInt(1,6) === 2 ? 1 : 0
        const image = new GameImage(Tree.imageSources[picIndex], size.width, size.height)
        super(game, image, {x:x, y:-40, z:depth})
        this.shadow.src = `./images/tree_shadows_v2/${Math.floor(randomValue(1,7))}.png`
        this.shadowWidthMultiplier = randomValue(0.85,1)
    }
    update(){
        super.update()
    }
    drawShadow(ctx){
        super.drawShadow(ctx, this.shadow, this.shadowWidthMultiplier)
    }
    draw(ctx){
        super.draw(ctx)
    }
}

class Bush extends GroundedObjects {
    static imageSources = [`./images/bushes/1.png`, `./images/bushes/2.png`]
    static sideBias = 0
    constructor(game,depth,x){
        const scaler = randomValue(1.9,2.1)
        const size = {width: 240 * scaler, height: 150 * scaler}
        const picIndex = randomInt(0,1)
        const image = new GameImage(Bush.imageSources[picIndex], size.width, size.height)
        super(game, image, {x:x, y:0, z:depth})
        Bush.sideBias += Math.sign(x)
        if (Math.abs(Bush.sideBias) > 2) {
            this.vector.x *= -1
            Bush.sideBias = 0
        }
    }
    drawShadow(){}
}

class SkyLayer extends GameObj{
    static image = new GameImage("./images/sky_layers/skylayer3.png",2500,3000)
    constructor(game, startDepth, endOffset){
        super(game,SkyLayer.image, {x:0, y:0, z:startDepth})
        this.endOffset = endOffset
        
    }
    get destinationDepth(){
        return this.depthFromProjectedDistance(Game.bottomY - Game.startY) - this.endOffset
    }
    
    update(){
        this.image.alpha = showElementsAtAnyDistance ? 0 : 1
        let difference = (this.destinationDepth - this.vector.z)
        if (Math.abs(difference) < 10) return 
        let speed = difference*0.05 + this.game.player.moveSpeed
        this.vector.z += speed
    }
    drawShadow(){}
}


class Sprite extends GameObj{
    constructor(game, bitmaps, maxWidth, maxHeight, heightOffset = 0){
        const gameImage = new GameImage(undefined, maxWidth, maxHeight)
        super(game, gameImage, {x:0, y: heightOffset, z: 0})
        this.frame = 0;
        this.frames = []
        for (let i = 0; i < bitmaps.length; i++) {
            const frame = new GameImage(undefined, maxWidth, maxHeight)
            frame.image = bitmaps[i]
            this.frames.push(frame)
        }
        this.setFrame(this.frame)
    }
    incrementFrame(num){
        const newFrame = this.frame + Math.floor(num)
        this.setFrame(newFrame)
    }
    setFrame(frame){
        if (frame > this.frames.length-1) return;
        if (frame < 0) return;
        this.frame = frame;
        this.swapGameImage(this.frames[this.frame])
    }
}




class Projectile extends GameObj{
    static soccorBall(game){
        const image = new GameImage(`./images/football.png`,100,100)
        const ball = new Projectile(game,image, {x:0, y: 50, z: 0})
        ball.velocity = {x:randomInt(-10,10), y:randomInt(0,1) === 0 ? 30 : 5, z:15}
        ball.groundFriction *= 0.05
        ball.bounceDampening = -0.5 
        return ball
    }
    constructor(game, gameImage, basePoint){
        super(game, gameImage, basePoint)
        this.game = game;
        this.velocity = {x:0,y:0,z:0}
        this.force = {x:0,y:-2,z:0} //-2.5 default to represent gravity
        this.borders = {x:[-750,750],y:[0,undefined], z:[undefined,2100]} //[lowerlimit, upper limit]
        this.rotationSpeed = 0
        this.mass = 1
        this.airFriction = 0.005
        this.groundFriction = 0.1
        this.bounceDampening = 0.5  // max 1 (negative value needed for infnite bouncing) 
        this.framesActive = 0
        this.frameLifeSpan = 1000
        this.relativeSpeed = 0
    }
    update(){
        const {velocity, vector, borders, force} = this
        const onGround = vector.y >= borders.y[1] && velocity.y === 0
        const deceleration = onGround ? this.groundFriction * this.mass : this.airFriction / this.mass
        for (const axis in velocity) {
            velocity[axis] *= 1-deceleration
            velocity[axis] += force[axis]
            vector[axis] += velocity[axis] 
            borders[axis].forEach((border,index) => {
                const side = index === 0 ? -1 : 1  //used to reverse inequalities when border is left (index 0)
                if (vector[axis] - velocity[axis] === border  //true if obj is moving into border it was touching last frame 
                    && side * (vector[axis]) > side * border){ 
                        vector[axis] -= velocity[axis]
                        velocity[axis] = 0
                    }
                if (side * vector[axis] > side * border) { //checks collision, cant be true if previous if-block reset the position
                    this.collision(axis,index)
                }
            })
        } 
        this.framesActive += 1
        this.image.angle += this.rotationSpeed * (Math.PI*2 / this.game.fps)
        if (this.framesActive > this.frameLifeSpan) this.markedForDel = true;
    }
    collision(axis,borderIndex){
        const {velocity, vector, borders, force} = this
        const distanceCovered = Math.abs(velocity[axis])
        const overshootDistance = (Math.abs(vector[axis])-Math.abs(borders[axis][borderIndex]))
        const velocityCorrection = force[axis] * ( (distanceCovered-overshootDistance) / distanceCovered )
        vector[axis] = borders[axis][borderIndex]
        velocity[axis] -= force[axis] - velocityCorrection
        velocity[axis] *= -1
        const velMagnitude = Math.abs(velocity[axis])
        let decreaser = Math.pow(velMagnitude,this.bounceDampening) - (1-this.bounceDampening)
        if (decreaser < velMagnitude) velocity[axis] -= decreaser * Math.sign(velocity[axis])
        else velocity[axis] = 0
        
    }
   
    rotation(){
          
    }
    drawShadow(ctx){
        //super.drawShadow(ctx,this.shadow,1.1)
    }
}

class Coin extends Projectile{
    static imageParams = [`./images/coin.png`,55*0.5,42*0.5]
    static lastSfxValue = 0 
    constructor(game,startPoint,targetPoint){
        super(game, new GameImage(...Coin.imageParams), startPoint)
        this.game = game
        this.setSfx()
        this.airFriction = 0;
        this.rotationSpeed = randomValue(-0.5,0.5)
        this.start = startPoint 
        this.target = targetPoint
        this.unitVector = unitVector(vectorFromPoints(this.start,this.target))
        for (const axis in this.unitVector){
            this.velocity[axis] = this.unitVector[axis] * randomValue(-2,2)
            this.force[axis] = this.unitVector[axis] * randomValue(0.5,0.6)
        }
        this.relativeSpeed = -this.game.player.moveSpeed
        this.borders.z[0] = undefined
    }
    update(){
        super.update();
        if (this.vector.z < randomValue(-300,-200)) this.image.fadeAlpha(-0.25)
        if (this.image.alpha <= 0) {
            this.markedForDel = true;
            this.sfx.play(); 
            this.game.stats.coins += 1       
        }   
    }
    setSfx(){
        let num = Math.floor(randomValue(1,6))
        while(num === Coin.lastSfxValue) { num = Math.floor(randomValue(1,6)) }
        Coin.lastSfxValue = num
        this.sfx = new SoundEffect(`./sounds/coins/${num}.mp3`,0.3)
    }
}

class Coin_test extends GameObj {
    static imageParams = [`./images/coin.png`,55*0.5,42*0.5]
    static lastSfxValue = 0
    constructor(game, startPoint) {
        super(game, new GameImage(...Coin.imageParams), startPoint)
        this.setSfx()
        this.addPhysics()
        this.rotationSpeed = randomValue(-0.5,0.5)
        this.target = {x: 0, y: 500, z: -300}
        this.unitVector = unitVector(vectorFromPoints(this.vector,this.target))
        for (const axis in this.unitVector){
            this.vector.velocity[axis] = this.unitVector[axis] * randomValue(-2,2)
            this.vector.force[axis] = this.unitVector[axis] * randomValue(0.7,0.9)
        }
        this.vector.velocity.z += this.game.player.moveSpeed
        this.vector.borders.z[0] = undefined
    }
    update(){
        super.update();
        this.image.angle += this.rotationSpeed * (Math.PI*2 / this.game.fps)
        if (this.vector.z < randomValue(-300,-200)) this.image.fadeAlpha(-0.25)
        if (this.image.alpha <= 0) {
            this.markedForDel = true;
            this.sfx.play(); 
            this.game.stats.coins += 1       
        }
    }
    setSfx(){
        let num = Math.floor(randomValue(1,6))
        while(num === Coin.lastSfxValue) { num = Math.floor(randomValue(1,6)) }
        Coin.lastSfxValue = num
        this.sfx = new SoundEffect(`./sounds/coins/${num}.mp3`,0.3)
    }
}

class FiredArrow extends Projectile {
    static imageSource = './images/fired_arrow_2.png'
    constructor(game, basePoint){
        const image = new GameImage(FiredArrow.imageSource, 100*0.6, 185*0.6)
        super(game, image, basePoint)
        this.image.alpha = 0
        this.force.y = 0
        this.relativeSpeed = 0
        this.velocity = changeVectorLength(vectorFromPoints(basePoint,{x:125 * Math.sign(basePoint.x),y:250,z:0}), 150) 
        this.image.angle = Math.atan(this.velocity.x/this.velocity.z)
    }
    update(){
        super.update();
        this.image.fadeAlpha(0.25)
        this.checkForCollison();
    }
    checkForCollison(){
        if (this.vector.z > 150) return;
        const player = this.game.player
        if (player.lane === this.lane &&
            player.state === player.states["blocking"]){

            this.game.activeObjects.push(new BlockedArrow(this.game, this.vector))
            this.game.addScore(2)
            
        } else player.receiveAttack(-0.4)
        this.markedForDel = true;
    }
}

class BlockedArrow extends Projectile {
    static imageSource = './images/arrow_2.png'
    constructor(game, startPoint){
        const image = new GameImage(BlockedArrow.imageSource, 51*0.5, 178*0.5)
        super(game, image, startPoint)
        this.image.alpha = 1
        this.sfx = new SoundEffect(`./sounds/clank/${Math.floor(Math.random()*5)}.wav`,0.2)
        this.sfx.play(); 
        this.force.y = -1.5
        this.velocity.y = randomInt(30,40)
        this.velocity.x = Math.sqrt(square(40)-square(this.velocity.y)) * Math.sign(startPoint.x) * 0.5
        this.velocity.z = randomInt(0,15)
        this.borders.x = [undefined,undefined]
        this.image.angle = 0.5 * Math.sign(startPoint.x)
        this.rotationSpeed = (-29 + this.velocity.y) * Math.sign(startPoint.x) * randomValue(0.2,0.3)
        this.relativeSpeed = -this.game.player.moveSpeed
    }
    update(){
        if (this.vector.y < 200) this.image.fadeAlpha(-0.25)
        if (this.image.alpha === 0) this.markedForDel = true;
        super.update()
    }
}

class DroppedBow extends Projectile {
    static imageParams = ['./images/crossbow.png', 250*0.8, 141*0.8]
    constructor(game, startPoint, flipped){
        super(game, new GameImage(...DroppedBow.imageParams), startPoint)
        this.image.flipped = flipped
        this.bounceDampening = 0.9
        this.velocity = {x:0, y:8, z:-2}
    }
    update(){
        super.update();
        if (this.vector.z < 0) this.markedForDel = true
    }
}

class Spurt extends Projectile {
    constructor(game, image, startPoint){
        const adjustedPoint = {x: startPoint.x + randomInt(-25,25),
                                y: startPoint.y + randomInt(-25,25),
                                z: startPoint.z + randomInt(-5,-10)}
        super(game, image, adjustedPoint)
        this.bounceDampening = 1
        this.airFriction *= 2
        this.force.y *= 0.5
        this.frameLifeSpan = 48
        this.velocity.y = randomInt(0,15)
        this.velocity.x = randomInt(-5,5)
        this.velocity.z = randomValue(0,-5)
    }
    update(){
        super.update()
        
    }
}

class BloodSpurt extends Spurt {
    static imageSources = [`./images/blood/1.png`, `./images/blood/2.png`]
    constructor(game, startPoint){
        const image = new GameImage(BloodSpurt.imageSources[randomInt(0,1)], 40, 40)
        super (game, image, startPoint)
        
    }
}

class TurkeyMush extends Spurt {
    static imageSources = [`./images/turkey_bits/1.png`, `./images/turkey_bits/2.png`]
    constructor(game, startPoint){
        const image = new GameImage(TurkeyMush.imageSources[randomInt(0,1)], 40, 40)
        super (game, image, startPoint)
    }
}


class SoundEffect {
    constructor(fileSrc, volume){
        this.sound = new Audio()
        this.sound.volume = gameMuted ? 0 : volume
        this.sound.src = fileSrc
    }
    play(){
        this.sound.play()
    }
}

//enemy class needs the schedudling system built into it
// array is indexed around the frame count of the game, filled with a marker that the player will need to block or attack
// when new enemies spawn in they look for gaps in the array to and test if they 
// attack scheduling can be partially overwritten by another enemies block or attack timings, so long as a player attack can be fit into the schedule
// this is because the attack window is bigger than the player needs to perform the attack
// e.g., enemy 2 will try to schedule a block during enemy 1's attacking phase, it will then check if the if time between a start-up and active frame window 
// can fit inside the remaining attack window, if it can it, schedules in a recovery time for the player to reel back from attacking before they can block again
// enemies may still attempt to schedule in blocks/attacks,checking first if the attack can be pushed further forward (and still overlap with attack timing)
// and if that fails, scheduling itself after the player attacks.
// this will produce predictable results based on the player speed, unless some gap time is added randomly
// adding in chunks of un-schedulable time will mean sometimes the timing are mixed up, on whether the player must try to sneak in a quick attack before blocking the next enemy, 
// or must wait to block both enemies before getting a last second attack on the first enemy
// this can be made difficult because its not essential for the player to attack every enemy, allthough it will be *possible*
// to prove this the system will be able to send inputs to the player based on its scheduling, so the game can play itself to gaurentee timings are possible. 

// the most difficult part of this is probably getting the player attack scheduling to be dynamic, so it can move anywhere within its allotted time to best accomdate enemy scheduling. 

class Enemy extends GameObj{
    static enemies = []
    constructor(game, image, basePoint){
        super(game, image, basePoint)
        this.game = game
        this.sfx = {}

        Enemy.enemies.push(this)
    }
    spawnCoins(num){
        const startPoint = this.centralVector
        console.log(this.centralVector)
        startPoint.z -= 150
        startPoint.x *= 0.9
        const playerPoint = {x: 0, y: 500, z: -400}
        for (let i = 0; i < num; i++) {
            const coin = new Coin_test(this.game, startPoint)
            this.game.activeObjects.push(coin)
        } 
    }
    drawShadow(ctx){
        super.drawShadow(ctx,this.shadow,1.1)
    }
    receiveAttack(){

    }
}

class Bowman extends Enemy {   //eventually split into states to deal with the logic and differing images better
    static imageParams = { 
        unloaded: ['./images/bowman/unloaded.png', 321*0.8, 604*0.8],
        loaded: ['./images/bowman/loaded.png',321*0.8, 604*0.8],
        dead: ['./images/bowman/dead.png',321*0.8, 604*0.8],
    }
    static spawnWave(game, spawnDepth, waveSize=3){
        let x = 500 * randomSign()
        let depth = 4000
        const wave = [new Bowman(game, {x: x, y: 0, z: depth})]
        for (let i = 1; i < waveSize; i++) {
            x *= randomSign()
            let buffer = randomInt(300,400)
            if (x !== wave[i-1].x) buffer += 200
            depth -= buffer
            wave.push(new Bowman(game, {x: x, y: 0, z: depth}))
            Enemy.enemies.push(wave[i])
        }
        return wave;
    }
    constructor(game, basePoint){
        const unloaded = new GameImage(...Bowman.imageParams.unloaded)
        const loaded = new GameImage(...Bowman.imageParams.loaded)
        const dead = new GameImage(...Bowman.imageParams.dead)
        super(game, unloaded, basePoint)
        this.images = {loaded:loaded, unloaded:unloaded, dead:dead}
        this.image.alpha = 0;
        this.image.flipped = this.lane === "right" ? true : false
        this.states = { unloaded: "unloaded", loaded: "loaded",
                        fired: "fired", dead: "dead"}
        this.state = "unloaded"
        this.bowLoadDistance = 2000
        this.sfx.load = new SoundEffect (`./sounds/crossbow_loading/1.mp3`,0.1)
        this.sfx.death = new SoundEffect (`./sounds/death/${Math.floor(Math.random()*5)}.ogg`,0.3)
        this.sfx.death2 = new SoundEffect (`./sounds/gore/${Math.floor(Math.random()*3)}.wav`, 0.3)
        this.deathCounter = 0;
    }
    update(){
        if (this.vector.z < -150) this.markedForDel = true;
        if (this.state === this.states.dead) {
            this.deathCounter += 1
            if (this.deathCounter > 30) this.image.fadeAlpha(-0.1)
        } else {
            this.image.fadeAlpha(0.25)
        }
        if (this.vector.z < this.bowLoadDistance && this.state === "unloaded") this.loadBow()
        if (this.state === "loaded" && this.game.totalFrames > this.attackingFrame) this.attack();
    }
    loadBow(){
        this.state = "loaded"
        this.attackingFrame = this.game.totalFrames + 32
        this.image = this.images.loaded
        this.image.flipped = this.lane === "right" ? true : false 
        this.sfx.load.play();
    }
    attack(){
        this.state = "fired"
        this.image = this.images.unloaded
        this.image.flipped = this.lane === "right" ? true : false
        this.game.activeObjects.push(new FiredArrow(this.game, this.centralVector))
    }
    receiveAttack(){
        if (this.state === "dead") return;
        this.state = "dead"
        this.image = this.images.dead
        this.image.flipped = this.lane === "right" ? true : false
        this.sfx.death.play();
        this.sfx.death2.play();
        this.game.activeObjects.push(new DroppedBow(this.game, this.centralVector, this.image.flipped))
        for (let index = 0; index < 30; index++) {
            this.game.activeObjects.push(new BloodSpurt(this.game, this.centralVector))   
        }
        this.spawnCoins(5)
        this.game.addScore(10)
    }
    drawShadow(ctx){
        return;
    }
    
}



class CannonWielder extends Enemy {
    constructor(game, basePoint){
        const alive = new GameImage(...Bowman.imageParams.unloaded)
        super (game, alive, basePoint)
        console.log(this.image)
        this.image.height = 0
        this.shotCooldown = 0
        this.joystickVector = {x:0,y:0}
        this.createCannon()
        //this.addPhysics()
        
    }
    createCannon(){
        
        const cannonLength = 400
        const baseRadius = 125
        const wheelAxelOffset = -30

        const baseX = this.vector.x
        const baseY = this.vector.y
        const baseZ = this.vector.z - 200
        
        //new cannon parts creation
        this.cannonBase = new Sphere(this.game, baseRadius, {x: baseX, y: baseY + baseRadius, z:baseZ},  10, 'grey', 'grey')

        this.cannonEnd = new CircleTest(this.game,30,{x: baseX, y: baseY + cannonLength, z: baseZ}, 16, 'grey', 'black')
        this.cannonEnd.fillBack = 'grey'
        
        // create wheels
        this.wheelOne = new CircleTest(this.game, 100, {x: baseX + baseRadius, y: baseY + baseRadius + wheelAxelOffset, z: baseZ},
            14, '#723C07')
        this.wheelTwo = new CircleTest(this.game, 100, {x: baseX - baseRadius, y: baseY + baseRadius + wheelAxelOffset, z: baseZ},
            14, '#723C07')
        this.wheelOne.spokes = this.wheelTwo.spokes = 8
        
        //set default rotations 
        this.cannonEnd.rotate(this.cannonEnd.vector,{x:1,y:0,z:0},-Math.PI/2)
        
        this.cannonBase.rotate(this.cannonBase.vector,{x:1,y:0,z:0}, Math.PI/3)
        this.cannonEnd.rotate(this.cannonBase.vector,{x:1,y:0,z:0}, Math.PI/3)

        this.wheelOne.rotate(this.wheelOne.vector, {x:0,y:1,z:0}, -Math.PI/2)
        this.wheelTwo.rotate(this.wheelTwo.vector, {x:0,y:1,z:0}, Math.PI/2)
        
        

        //establish point links for translations
        this.vector.linkDependentPoints(this.cannonBase.vector)
        this.cannonBase.vector.linkDependentPoints(this.cannonEnd.vector, 
            this.wheelOne.vector, this.wheelTwo.vector
        );
        
        this.game.activeObjects.push(...[this.wheelOne,this.wheelTwo,this.cannonBase,this.cannonEnd])
    }
    update(input){
        super.update()
        if (this.shotCooldown > 0) this.shotCooldown -= 1;
  
        let movement = {x:0,y:0,z:0}
        let yAxisRotation = 0
        let xzAxisRotation = 0

        // read keyboard input
        if (input.includes('up'))  xzAxisRotation += Math.PI/50
        if (input.includes('down'))  xzAxisRotation -= Math.PI/50
        if (input.includes('attack')) this.shoot();
        if (attackButtonPressed) this.shoot();
        
        //read joystick input for movement + rotation 
        const newJoystickVector = {x:joystickKnobRelativePos[0],y:joystickKnobRelativePos[1]}
        const newJoystickAngle = Math.atan2(newJoystickVector.y * -1, newJoystickVector.x) 
        const currentCannonAngle = Math.atan2(this.cannonBase.normalVector.z, this.cannonBase.normalVector.x) 
        const angleDifference = (newJoystickAngle - currentCannonAngle)
        const newJoystickMagnitude = Math.sqrt(Math.pow(newJoystickVector.x,2) + Math.pow(newJoystickVector.y,2))
        if (newJoystickMagnitude > 0.01){
            movement.x = 15 * newJoystickVector.x
            movement.z = -15 * newJoystickVector.y
            if (Math.abs(angleDifference) > Math.PI/32) yAxisRotation = -angleDifference
        }
        this.vector.move(movement)
        const pieces = [
            this.cannonBase, this.cannonEnd, this.wheelOne, this.wheelTwo
        ]

        //spin wheels according to forward movement
        const movementMagnitude = vectorMagnitude(movement)
        if (movementMagnitude != 0) {
            const wheelCircumference =  2 * Math.PI * this.wheelOne.radius 
            const arr = [this.wheelOne, this.wheelTwo].forEach( wheel => {
                const rotationAmount = (movementMagnitude / wheelCircumference) * Math.PI * 2
                wheel.rotate(this.wheelOne.vector, this.wheelOne.normalVector, -rotationAmount)
            })
        }

        if (yAxisRotation != 0) {pieces.forEach( piece => {
            piece.rotate(this.cannonBase.vector, {x:0,y:1,z:0}, yAxisRotation)
        })}
        
        if (xzAxisRotation != 0) {
            const xzAxisRotationAxis = vectorFromPoints(this.cannonBase.vector, this.cannonBase.xAxisReferencePoint)
            this.cannonBase.rotate(this.cannonBase.vector, xzAxisRotationAxis, xzAxisRotation)
            this.cannonEnd.rotate(this.cannonBase.vector, xzAxisRotationAxis, xzAxisRotation)
        }
    }
    draw(ctx){
        super.draw(ctx)
        if (!this.cannonEnd.polygonPoints) return
        this.drawCannonBarrel(ctx)
    }
    drawCannonBarrel(ctx){
        //finding point and tangent line between circle to two points on cannon end polygon
        
        //loop over polygon points to find the crimped edges of the polygon (points most perpendicular to the line connecting end to base in 2D)
        const points = this.cannonEnd.polygonPoints
        let furthestPoint = {pointIndex:-1,length:0}
        const cannonEndCenter = [this.cannonEnd.vector.cX, this.cannonEnd.vector.cY]
        
        //finds point fursthest from the center(ish) of the polygon
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            const delta = Math.pow(p[0]-cannonEndCenter[0],2) + Math.pow(p[1]-cannonEndCenter[1],2)
            if (delta > furthestPoint.length) {
                furthestPoint.pointIndex = i
                furthestPoint.length = delta
            }
        }
        const point1 = points[furthestPoint.pointIndex]

        //run loop again to find point furthest from the first point 
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            const delta = Math.pow(p[0]-point1[0],2) + Math.pow(p[1]-point1[1],2)
            if (delta > furthestPoint.length) {
                furthestPoint.pointIndex = i
                furthestPoint.length = delta
            }
        }
        const point2 = points[furthestPoint.pointIndex]
        
        // draw line to test
        ctx.beginPath()
        ctx.moveTo(point1[0],point1[1])
        ctx.lineTo(point2[0],point2[1])
        ctx.stroke()

        
        const tangentLineConnectionPoints = () => {

            const radius = this.cannonBase.radius*this.cannonBase.vector.perspectiveScale
            const circleCenterPoint = [this.cannonBase.vector.cX, this.cannonBase.vector.cY]
            
            // center the circle on the origin
            const p1 = [point1[0]-circleCenterPoint[0], point1[1]-circleCenterPoint[1]]
            const p2 = [point2[0]-circleCenterPoint[0], point2[1]-circleCenterPoint[1]]

            const getSlopes = (point, radius) => {
                //slopes of both tangent lines between a point and a circle, defined by radius, centered at [0,0]
                //from forumla of a line-from-known-point and formula for finding the perpendicular distance of a point from a line
                const a = Math.pow(point[0],2) - Math.pow(radius,2)
                const b = -2 * point[0] * point[1]
                const c = Math.pow(point[1],2) - Math.pow(radius,2)
                return solveQuadratic(a,b,c)
            }
            const p1TangentSlopes = getSlopes(p1, radius)
            const p2TangentSlopes = getSlopes(p2, radius)
            const comparisionSlope = Math.abs((cannonEndCenter[1] - circleCenterPoint[1]) / (cannonEndCenter[0] - circleCenterPoint[0]))
        

            const tangentLineConnectionPoint = (slope, point, radius) => {
                // using same translated point, assuming cricle at [0,0]
                //increase the circle radius by small amount, to make up for small imprecision
                //result is tangent as two roots, but close enough in value
                const r = radius + 0.1 
                const m = slope
                const x1 = point[0]
                const y1 = point[1]
                const c1 = m * x1  - y1
                const a = Math.pow(m,2) + 1
                const b = -2 * m * c1
                const c = Math.pow(c1,2) - Math.pow(r,2)
                let x = solveQuadratic(a,b,c)[0]
                let y = (m * x) - (m * x1) + y1  //plug x back in original line formula
                return [x,y]
            }
            const p1ConnectionPoints = [
                tangentLineConnectionPoint(p1TangentSlopes[0], p1, radius),  
                tangentLineConnectionPoint(p1TangentSlopes[1], p1, radius)
            ]
            const p2ConnectionPoints = [
                tangentLineConnectionPoint(p2TangentSlopes[0], p2, radius),  
                tangentLineConnectionPoint(p2TangentSlopes[1], p2, radius)
            ]

            let p1OuterTangentPoint = p1ConnectionPoints[0]
            let p2OuterTangentPoint = p2ConnectionPoints[0]
        
            const testVector = vectorFromPoints({x:p2[0],y:p2[1],z:0},{x:p1[0],y:p1[1],z:0})
            const testConnectPoint = {x:p1ConnectionPoints[0][0],y:p1ConnectionPoints[0][1],z:0}
            const testTangent = vectorFromPoints({x:p1[0],y:p1[1],z:0},testConnectPoint)
            const testAngle = angleBetweenVectors(testVector,testTangent)
            if (testAngle > Math.PI/2) p1OuterTangentPoint = p1ConnectionPoints[1]
           
            const testVector2 = vectorFromPoints({x:p1[0],y:p1[1],z:0},{x:p2[0],y:p2[1],z:0})
            const testConnectPoint2 = {x:p2ConnectionPoints[0][0],y:p2ConnectionPoints[0][1],z:0}
            const testTangent2 = vectorFromPoints({x:p2[0],y:p2[1],z:0},testConnectPoint2)
            const testAngle2 = angleBetweenVectors(testVector2,testTangent2)
            if (testAngle2 > Math.PI/2) p2OuterTangentPoint = p2ConnectionPoints[1]

           

            //values to translate back to original position 
            const xAdjust = circleCenterPoint[0]
            const yAdjust = circleCenterPoint[1]

            ctx.beginPath()
            ctx.moveTo(point1[0], point1[1])
            ctx.lineTo(p1OuterTangentPoint[0] + xAdjust, p1OuterTangentPoint[1] + yAdjust)
            ctx.lineTo(p2OuterTangentPoint[0] + xAdjust, p2OuterTangentPoint[1] + yAdjust)
            ctx.lineTo(point2[0], point2[1])
            ctx.fillStyle = 'grey'
            ctx.lineWidth = this.vector.perspectiveScale * 10
            ctx.strokeStyle = 'grey'
            ctx.stroke()
            ctx.fill()
           

        }
        
        tangentLineConnectionPoints()
    }
    
    shoot(){
        if (this.shotCooldown > 0) return;
        else this.shotCooldown = 15
        const ball = new BowlingBall(this.game,{x:0,y:0,z:0})
        ball.vector.copyCoords(this.cannonEnd.vector)
        ball.vector.velocity = changeVectorLength(this.cannonEnd.normalVector,randomInt(50,60)) 
        this.game.activeObjects.push(ball)
        this.vector.velocity = {x:ball.vector.velocity.x * -0.6,y:ball.vector.velocity.y * -0.6,z:ball.vector.velocity.z * -0.6, }
    }
}

class Turkey extends Enemy {
    static imageParams = ['./images/turkey.png', 384*0.9, 206*0.9]
    static bufferFrames = 0;
    static turkeySpawnable(){
        if (Turkey.bufferFrames < 1) return true;
        Turkey.bufferFrames -= 1
        return false;
    }
    constructor(game, startPoint){
        const image = new GameImage(...Turkey.imageParams)
        super(game, image, startPoint)
        this.sfx.death = new SoundEffect (`./sounds/gore/${Math.floor(Math.random()*3)}.wav`, 0.3)
        Turkey.bufferFrames += randomInt(1000,1800) / this.game.speedModifier
    }
    update(){
        if (this.vector.z < 0) {
            this.markedForDel = true;
        }
    }
    receiveAttack(){
        this.markedForDel = true;
        this.game.player.updateHealth(0.5)
        this.sfx.death.play()
        for (let i = 0; i < 50; i++) {
           this.game.activeObjects.push(new TurkeyMush(this.game, this.centralVector)) 
        }
    }
}
class Pikeman extends Enemy {
    constructor(posX){
        //super()
    }
}

class Player {
    constructor(game, blockBitmaps, attackBitmaps){
        this.block = new Sprite(game, blockBitmaps, 842*0.9, 609*0.9, 75)
        this.attack = new Sprite(game, attackBitmaps, 534*0.8, 871*0.8, 50)
        this.block.image.alpha = 1;
        this.attack.image.alpha = 1;
        this.game = game;
        this.states = { blocking: new Blocking(this), attacking: new Attacking(this)}
        this.lane = "middle"
        this.state = this.states.blocking;
        this.damageRecoveryEffect = 0;
        this.angleCounter = 0;
        this.health = 1
        this.minimumSpeed = 8
        this.moveSpeed = 8 
        this.healthOverlays = [...this.createHealthOverlays()]
        this.healthOverlayIndex = 0
        this.sfx = {hurt:[new SoundEffect(`./sounds/player_hurt/1.wav`,0.1), new SoundEffect(`./sounds/player_hurt/2.wav`,0.1),
                        new SoundEffect(`./sounds/player_hurt/3.wav`,0.1), new SoundEffect(`./sounds/player_hurt/4.wav`,0.1)]}
    }
    update(input){
        if (stillMotion) this.game.player.moveSpeed = 0;
        this.state.update(input);
        this.angleCounter += 1/15 * this.game.speedModifier
        if(!stillMotion) this.applyBounce()
        this.moveObjectsCloser()
    }
    draw(ctx){
        this.state.draw(ctx)
        ctx.drawImage(this.healthOverlays[this.healthOverlayIndex].image,0,0)
    }
    changeState(state){
        this.state.exit();
        this.state = this.states[state]
        this.state.enter();
    }
    moveObjectsCloser(){
        this.game.activeObjects.forEach((e)=>{
            e.vector.z -= this.moveSpeed + (e.relativeSpeed || 0)
        })
    }
    receiveAttack(dmg){
        if (disableEnemyDamage) return;
        let sfxChoice = Math.floor(randomValue(0,4))
        this.sfx.hurt[sfxChoice].play();
        this.damageRecoveryEffect = 90
        this.game.stats.combo = 1
        this.updateHealth(dmg)
        this.changeState("blocking")  //change this to make it less punishing to get hit right after hitting attack?
    }
    updateHealth(dmg){
        this.health += dmg
        let healthOverlayIndex = Math.ceil(5-(this.health*5))
        if (healthOverlayIndex < 0) healthOverlayIndex = 0
        if (healthOverlayIndex > 4) healthOverlayIndex = 4
        this.healthOverlayIndex = healthOverlayIndex 
    }
    applyBounce(){    // this could be redone, but at least i need to stop hardcoding values like bounce mod and perspective
        let damageBounceMod = 1;
        if (this.damageRecoveryEffect > 1) {
            this.damageRecoveryEffect -=  2 * (this.damageRecoveryEffect/20)    
            damageBounceMod *= (1/this.damageRecoveryEffect)
        } else this.damageRecoveryEffect = 0 //delete?
        this.block.vector.y = 50 - this.getBounceMod(25 * damageBounceMod, this.angleCounter+0.25)
        this.game.changePerspectiveHeight(500 - (this.getBounceMod(10 * damageBounceMod, this.angleCounter)))
    }
    getBounceMod(intensity, angleInput) {
        let bounceOffset = Math.sin(angleInput) * intensity
        if (bounceOffset > 0) bounceOffset *= -1
        return (bounceOffset ) + this.damageRecoveryEffect
    }
    createHealthOverlays(){
        const overlays = []
        overlays.push(new GameImage("",0,0))
        for (let i = 0; i < 4; i++){
            const imgSrc = `./images/health/stage${i+1}.png`
            overlays.push(new GameImage(imgSrc,1000,1000,0,0))
        }
        return overlays
    }
}
class PlayerState {
    constructor(player){
        this.player = player
    }
    enter(){}
    exit(){}
    update(){}
}

class Blocking extends PlayerState {
    constructor(player){
        super(player)
        this.sprite = this.player.block 
        this.sprite.setFrame(18)
        this.frameIncrement = 1;
        this.frameQueue = [18];
        this.positionInQueue = 0;
        this.frameDestinations = {'middle':18, 'left':0, 'right':34} 
        this.middleSkipRange = [12,26] 
        this.earlyFramesToSkip = 5
        this.inputDelayCounter = 0;
        this.angleCounter = 0;
        this.bounceDamageIntensity = 15
        this.damageRecoveryEffect = 0
        this.lastInput = 'middle'
    }
    enter(){
        
    }
    exit(){
        this.inputDelayCounter = 0;
        this.updateLane();
    }
    update(inputs){
        
        let input = inputs[inputs.length-1]
        if (!input || ((inputs.includes('left') && inputs.includes('right')))) input = 'middle'
        this.sprite.image.fadeAlpha(0.2)
        
        if (input === 'attack' && this.damageRecoveryEffect < 20){
            this.player.changeState("attacking")
            return;
        }
        if (--this.inputDelayCounter >= 0 || this.frameDestinations[input] === undefined) input = this.lastInput
        if (input !== this.lastInput) {
            this.inputDelayCounter = 4;
            this.makeFrameQueue(input)
        }
        this.lastInput = input;
        if (this.positionInQueue !== this.frameQueue.length) this.sprite.setFrame(this.frameQueue[this.positionInQueue++])
        this.updateLane()
    }
    draw(ctx){
        this.sprite.draw(ctx)
    }
    makeFrameQueue(input){
        this.frameQueue = [];
        this.positionInQueue = 0;
        let frame = this.sprite.frame
        const frameEnd = this.frameDestinations[input]; 
        const increment = Math.sign(frameEnd-frame)
        if (Object.values(this.frameDestinations).includes(frame)) {
            frame += this.earlyFramesToSkip * increment
        }
        for (let i = frame + increment; i !== frameEnd + increment; i += increment){
            this.frameQueue.push(i)
        }
        if(Math.abs(frame - frameEnd) > this.sprite.frames.length/2) {
            this.frameQueue = this.frameQueue.filter((e) => e < this.middleSkipRange[0] || e > this.middleSkipRange[1])
        }
    }
    // rewriting the frame queue system for mobile, to tie the frame displayed closer to x pos of joystick
    // --- letting go of the stick, or returning to the center buffer ring, will play the normal reset animation queue
    // put moving the joystick out of the buffer will instantly skip the middle skip range and snap the sword position to 
    // last frame before earlyFramesToSkip,
    // the earlyFramesToSkip would play only if the end frame of the queue is the last frame, and the start frame is not within that
    // side already (past the middle skip frame). The issue is that the end frame queue will update constantly unless some buffer is put between different
    // updates. E.g., if joystick.x = 0.9 (90 percent  pulled to the right), and the buffer zone is 0.1, then all the block animation frames 
    // destinations are distrubuted over that 0.8 range. if theres ~ 8 frames of animation between the middle range and the ending ease frames
    // then the frame destination (and frame queue) will only update on changes of .1 or more from joystick.x
    // so if joystick is moved fast, frame updates will lag behind joystick pos enough to tell the frame queue to add some ending animation to it,
    // in the form of the earlyFramesToSkip  
    updateLane(){
        if (this.inputDelayCounter > 0) return
        let lane = "middle"
        if (this.sprite.frame > 23) lane = "right"
        if (this.sprite.frame < 12) lane = "left"
        this.player.lane = lane;
    }
}

class Attacking extends PlayerState {
    constructor(player){
        super(player)
        this.sprite = this.player.attack
        this.activeFrameRange = [15,23]
        this.game = this.player.game
    }
    enter(){
        this.sprite.vector.z = 0;
    }
    exit(){
        this.sprite.frame = 0
    }
    update(){
        this.sprite.image.fadeAlpha(0.2)
        this.checkCollision();
        const attack = this.sprite
        if (attack.frame === 0) {
            this.attackDirection = this.input;
        }
        attack.incrementFrame(1)
        if (attack.frame === attack.frames.length-1) {
            this.player.changeState("blocking")
        }
        this.angleAttack();
    }
    draw(ctx){
        if (this.sprite.frame != 0)this.sprite.draw(ctx)
    }
    checkCollision(){
        if (!this.inActiveFrameRange()) return;
        const activeObj = this.game.activeObjects
        for (let i = activeObj.length-1; i >= 0; i--) {
            if (activeObj[i] instanceof Enemy){
                let inRange = activeObj[i].vector.z < 400 
                            && activeObj[i].vector.z > (activeObj[i].lane === "middle" ? -100 : 100)  
                            && activeObj[i].lane === this.player.lane
                if (inRange) activeObj[i].receiveAttack();
            } 
        }
    }
    angleAttack(){
        const sprite = this.sprite
        if (this.inActiveFrameRange()) sprite.vector.z += 10
        sprite.image.angle = 0
        sprite.vector.x = 0
        sprite.vector.y = -300
        if (this.player.lane === "right"){ 
            sprite.image.angle = 1.35
            sprite.vector.y = -80
            sprite.vector.x = 30
            
        } else if (this.player.lane === "left") {
            sprite.image.angle = -1.35
            sprite.vector.y = -50
            sprite.vector.x = -40
        }  
    }
    inActiveFrameRange(){
        if (this.sprite.frame < this.activeFrameRange[0] || 
            this.sprite.frame > this.activeFrameRange[1]) return false;
        return true;
    }
}

async function loadSprites(){
    const bitmaps = {}
    await getSprite("./sword-attack-v2-compressed.json").then((resp) => bitmaps.attack = resp)
    await getSprite("./sword48.json").then((resp) => bitmaps.block = resp)
    return bitmaps
};

async function getSprite(spriteJsonSource){
    const response = await fetch(spriteJsonSource)
    const json = await response.json()
    const spriteName = loadBlankSprites ? `./images/empty.png` : `./images/${json.meta.image}` 
    const bitmaps = await getSpriteImages(json, spriteName)
    return bitmaps
}

async function getSpriteImages(spriteJson, spritesheetSrc){
    let bitmaps = []
    const sheet = new Image()
    const json = spriteJson
    await new Promise(resolve => {
        sheet.onload = (img)=>{
            resolve(img)
        }
        sheet.src = spritesheetSrc
    })
    for (let i = 0; i < json.frames.length-1; i++) {
        const data = json.frames[i].frame;
        bitmaps.push(createImageBitmap(sheet, data.x, data.y, data.w, data.h))
    }
    await Promise.all(bitmaps).then((response)=> {
        bitmaps = response
    })
    return bitmaps
}
 

