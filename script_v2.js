/** @type {HTMLCanvasElement} */

const loadNoSprites = true; //replaces sprites with blank pngs, game loads instantly 
const loadMuted = false;
const infiniteHealth = false;

const canvas = document.getElementById("canvas1");
const canvas2 = document.createElement("canvas")
const pauseMenu = document.getElementById("pauseMenu")
const canvasContainer = document.getElementById("canvas-container")
const resumeButton = document.getElementById("resume-btn")
const startButton = document.getElementById("start-btn")
const ctx = canvas.getContext('2d',{ alpha: false });
const keyRecord = [];
const touchRecord = {};
const bitmaps = {}
let spritesToLoad = 3;
let spritesLoaded = 0;


canvas.width = 1000;
canvas.height = 1000;
canvas2.width = 1000
canvas2.height = 1000
canvas.style.aspectRatio = 1/1

const randomSign = () => Math.random() >= 0.5 ? 1 : -1;
const randomValue = (a,b) => Math.random() * (b-a) + a
const twoPointDistance = (coords1, coords2) => {
    return Math.sqrt(Math.pow((coords2[0]-coords1[0]),2) + Math.pow((coords2[1]-coords1[1]),2))
}



getSprites();

const updateLoadScreen = function(){
    spritesLoaded += 1;
    let loadPercent = Math.floor((spritesLoaded/spritesToLoad)*100)
    startButton.innerHTML = `Loading ${loadPercent}%`
    if (spritesLoaded === spritesToLoad) {
        startButton.innerHTML = "Start Game"
        startButton.addEventListener('click',() => {   
        startButton.classList.add("disabled")
        canvas.requestFullscreen().then(startGame());
        
    })}
    
}

resumeButton.addEventListener('click', () => {
    canvas.requestFullscreen();
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

window.addEventListener('blur', () => keyRecord.splice(0,keyRecord.length))


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
        const id = touch.identifier 
        touchRecord[`touch${id}`].x.push(touch.pageX) 
        touchRecord[`touch${id}`].y.push(touch.pageY)  
        })
    })

document.addEventListener("touchend", e => {
    let id = [...e.changedTouches][0].identifier
    delete touchRecord[`touch${id}`]
})

class UI {
    constructor(game,spriteBitmap){
        this.game = game;
        this.sprite = new Sprite(spriteBitmap, 880, 260*0.6, -830)
        this.startFrame = 150
        this.centerX = this.sprite.centerX
        this.centerY = this.sprite.centerY
        this.marginY = 100
        this.marginX = 150
        this.currentScore = 0
        this.targetScore = 0
        this.combo = 1
        this.targetCoins = 0
        this.currentCoins = 0
        this.scoreIncreaseDisplay = 0
        this.healthOverlays = []
        this.coinImages = []
        this.coinImage = 0
        this.createCoins() 
        this.createHealthOverlays()
    }    
    createCoins(){
        this.coinImages.push(new GameImage("",0,0))
        for (let i = 0; i < 6; i++) {
            this.coinImages
                .push(new GameImage(`./images/coin_pile/${i+1}.png`,80,80,this.marginX+20,GameImage.bottomY,-885))
        }
    }
    createHealthOverlays(){
        this.healthOverlays.push(new GameImage("",0,0))
        for (let i = 0; i < 4; i++){
            this.healthOverlays
                .push(new GameImage(`./images/health/stage${i+1}.png`,1000,1000,undefined,GameImage.bottomY))
        }
    }
    update(){
        if (this.game.totalFrames < this.startFrame) return;
        this.sprite.incrementFrame(0.5);
        if (this.targetCoins > this.currentCoins) this.updateCoins()
        if (this.targetScore > this.currentScore) this.updateScore()
        
    }
    updateCoins() {
        this.currentCoins++
        if (this.coinImage === 0) this.coinImage++
        if (this.coinImage === 6) return;
        if (this.currentCoins > Math.pow((this.coinImage+3),3)) this.coinImage++
    }
    updateScore() {
        let difference = this.targetScore - this.currentScore
        let increment = (Math.sqrt(difference))/3
        if (increment > 200) increment = 200
        if (increment < 0.2) increment = 0.2
        this.currentScore += increment
        
    }
    addScore(num){
        let score = num * this.combo
        this.targetScore += score
        this.scoreIncreaseDisplay += score
        if (num > 5) this.combo += 1
    }
    draw(ctx){
        if (this.game.totalFrames < this.startFrame) return;
        this.drawHealthOverlay(ctx)
        this.sprite.draw(ctx);
        if (this.sprite.frame < this.sprite.frames.length-5) return;
        ctx.fillStyle = "black"
        ctx.fillText(`${this.currentCoins}`, this.marginX + 75, this.centerY+15)
        this.coinImages[this.coinImage].draw(ctx)
        let displayScore = Math.floor(this.currentScore)
        let remainder = this.targetScore - displayScore
        let scoreDimensions = ctx.measureText(`${displayScore}`)
        ctx.fillText(`${displayScore}`, this.centerX - (scoreDimensions.width/2), this.centerY+15)
        if(remainder > 1) {
            ctx.font = "30px Lugrasimo"
            ctx.fillText(`+${this.scoreIncreaseDisplay}`,this.centerX + (scoreDimensions.width/2) + 5, this.centerY+15)
            ctx.font = "45px Lugrasimo"
        } else {
            this.scoreIncreaseDisplay = 0;
        }
        ctx.fillText(`ₓ${this.combo}`, this.game.width-this.marginX-75, this.centerY+15)
        
    }
    drawHealthOverlay(ctx){
        let healthImageIndex = Math.ceil(5-(this.game.health*5))
        if (healthImageIndex < 0) healthImageIndex=0
        if (healthImageIndex > 4) healthImageIndex = 4 
        this.healthOverlays[healthImageIndex].draw(ctx)
    }
    spawnCoin(posXAtBase,startingY,heightOffset){
        this.game.activeObjects.push(new Coin(posXAtBase,startingY+40,heightOffset-40,this.marginX,this.marginY, this))
    }
    
    
}



class Game{
    constructor(ctx, width, height, bitmaps){
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.lastTimeStamp = 0;
        this.frameTimeDeficit = 0;
        this.fps = 48;
        this.health = 1
        this.framesSinceCrossbowman = 0;
        this.treesDelay = 40;
        this.crossbowmanDelay = 0
        this.enemiesDue = 4;
        this.totalFrames = 0;
        this.speedModifier = 1;
        this.lanes = {left:0, middle:1, right:2}
        this.player = new Player(this, bitmaps.block, bitmaps.attack)
        this.UI = new UI(this,bitmaps.ui)
        this.ctx.font = "45px Lugrasimo"
        this.health = infiniteHealth ? 10000 : 1
        this.activeObjects = []
        this.input;
        this.bitmaps = bitmaps
        this.shadowCanvas = document.createElement("canvas")
        this.shadowCanvas.width = width
        this.shadowCanvas.height = height
        this.ctxShadow = this.shadowCanvas.getContext("2d")
        this.shadowImg = new Image()
        this.shadowImg.src = "./images/shadow_circle_blurred_2.png"
        this.initalizeBackground();
        //this.perspectiveTestListeners();    only for testing
        this.frameCounter = 0
    }
    initalizeBackground(){
        for (let i = 0; i < 450; i++) {
            this.handleBackground();
            this.activeObjects.forEach(e=>e.update())
            // for (let i = 0; i < 40; i++) {
            //     this.activeObjects.forEach((e)=> e.update())
            // }
            // this.createDuelTrees()
        }
        for (let i = 0; i < 5; i++) {
            this.activeObjects.push(new SkyLayer(550-(i*10),i*5))
        }
        
    }
    update(timestamp, keyRecord, touchRecord){
        if (!document.fullscreenElement) {
            document.getElementById("resume-btn").classList.remove("disabled")
            return
        }
        const framesDue = this.getFramesDue(timestamp)
        if (framesDue !== 0) {
            this.totalFrames++;
            this.handleInput(keyRecord, touchRecord);
            this.UI.update(this.health)
            this.player.update(this.input)
            this.handleEnemies();
            this.handleBackground();
            this.activeObjects.forEach((e)=>e.update())
            this.activeObjects = this.activeObjects.filter((e)=>!e.markedForDel)          
            this.draw(this.ctx);
            
    }
}
    handleBackground(){
        if (this.treesDelay <= 0) {
            this.createDuelTrees();
            this.treesDelay += 40/this.speedModifier
        } else this.treesDelay -= 1

        if (this.treesDelay === 20/this.speedModifier) {
            this.createBush();
        }
    }
    createDuelTrees(){
       this.activeObjects.unshift(new Tree((this.width/2)+1200))
       this.activeObjects.unshift(new Tree((this.width/2)-1200))
       this.activeObjects[1].flipped = true;
    }
    createBush(){
        this.activeObjects.unshift(new Bush((this.width/2+randomValue(925,1025)*randomSign())))
        if (Math.abs(Bush.centerOffsetBias) > 1200) {
                this.activeObjects[0].maxCenterOffset *= -1
                Bush.centerOffsetBias = 0;
        }
    }
    handleEnemies(){
        if (this.framesSinceCrossbowman > this.crossbowmanDelay) this.spawnCrossbowWave();
        else this.framesSinceCrossbowman ++;
    }
    spawnCrossbowWave() {
        let roadSide = randomSign();
        if (this.enemiesDue > 0) {
            const newEnemy = new Crossbowman(this, this.width/2 - 500*roadSide)
            if (roadSide === -1) newEnemy.image.flipped = true;
            this.activeObjects.unshift(newEnemy)
            this.framesSinceCrossbowman = 0;
            this.crossbowmanDelay = Math.random()*60+30
            this.enemiesDue -= 1
        } else {
            this.crossbowmanDelay += 200
            this.enemiesDue = 4
        }   
    }
    draw(){
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctxShadow.clearRect(0,0,this.width,this.height)
        this.drawStaticBackground(this.ctx);
        this.activeObjects.sort((a,b)=> a.percentTraveled - b.percentTraveled)
        this.overlayShadows()
        this.activeObjects.forEach(e => e.draw(this.ctx))
        this.player.draw(this.ctx)
        this.UI.draw(this.ctx);
    }
    overlayShadows(){
        this.activeObjects.forEach(e => e.drawShadow(this.ctxShadow,this.shadowImg))
        this.ctxShadow.clearRect(0, 0, this.width, GameImage.startY)
        this.ctx.globalAlpha = 0.5
        this.ctx.drawImage(this.shadowCanvas,0,0,this.width,this.height)
        this.ctx.globalAlpha = 1        
    }
    drawStaticBackground(ctx){
        const gradient = ctx.createLinearGradient(0,0,0,200)
        gradient.addColorStop(1,"#b5dae5")
        gradient.addColorStop(0,"#0072b6")
        ctx.fillStyle = gradient;        
        ctx.fillRect(0,0,this.width,this.height)
        GameImage.drawRoad(ctx)
    }
    getFramesDue(timestamp){
        const frameTime = timestamp - this.lastTimeStamp
        
        this.frameTimeDeficit += frameTime;
        this.lastTimeStamp = timestamp;
        const framesDue = Math.floor(this.frameTimeDeficit / (1000/this.fps));
        this.frameTimeDeficit = this.frameTimeDeficit % (1000/this.fps);
        return framesDue;
    }
    handleInput(keyRecord, touchRecord){
        if (keyRecord.includes('a') && keyRecord.includes('b') && keyRecord.includes('c')){
            alert("cheats activated")
        }
        let input = 'middle'
        if (Object.keys(touchRecord).length === 0){
            if (keyRecord.includes('a')) input = 'left'
            if (keyRecord.includes('d')) input = 'right'
            if (keyRecord.includes('a') && keyRecord.includes('d')) input = 'middle'
            if (keyRecord.includes(' ')) input = 'attack'
        } else {
            const touch0 = touchRecord.touch0
            const touch1 = touchRecord.touch1
            const lastTouch = touch1 || touch0
            const lastTouchX = lastTouch.x[lastTouch.x.length-1]
            if (lastTouchX < window.innerWidth/3) input = 'left'
            if (lastTouchX > window.innerWidth*(2/3)) input = 'right'
            if (touchRecord.touch0 && touchRecord.touch1) input = 'middle'
            if ((touch0 && touch0.y[touch0.y.length-2] - touch0.y[touch0.y.length-1] > 15) ||
                (touch1 && touch1.y[touch1.y.length-2] - touch1.y[touch1.y.length-1] > 15)) input = 'attack'
        }
        this.input = input;
    }
    perspectiveTestListeners(){
        let startPercentAdjust = -0.01
        window.addEventListener('mousedown', (e) => {
            e.preventDefault()
            if (e.button === 0) this.setBaseStartPoint(GameImage.bottomY+5)
            if (e.button === 1) {
                console.log("middle mouse")
                if (GameImage.startPercentage < 0.15 || GameImage.startPercentage > 0.23) startPercentAdjust *= -1
                this.setViewDistance(GameImage.startPercentage+startPercentAdjust)
            }
            })
        window.addEventListener('contextmenu', (e) => { 
            e.preventDefault();
            this.setBaseStartPoint(GameImage.bottomY-5)
        })
        window.addEventListener('wheel', (e) => {
            let newHeight = GameImage.height + (20 * Math.sign(e.deltaY))
            this.changePerspectiveHeight(newHeight)
        })
    }
    setBaseStartPoint(y=1000){
        const difference = GameImage.bottomY - y
        GameImage.setPerspective(y,GameImage.height,GameImage.baseWidth,GameImage.startPercentage,GameImage.scrollSpeed)
        //this.activeObjects
    }
    setViewDistance(startPercentage){
        GameImage.startPercentage = startPercentage
        GameImage.startY = GameImage.topY + (GameImage.height * GameImage.startPercentage)
    }
    changePerspectiveHeight(height){
        const heightDifference = GameImage.height-height
        const newGameSpeed = 8 * (height/725)
        const baseAdjustment = heightDifference/3
        const ratio = (baseAdjustment+GameImage.baseWidth) / GameImage.baseWidth
        this.activeObjects.forEach((e)=> {
            if (e instanceof Enemy) e.image.maxCenterOffset *= ratio
            else if (!(e instanceof SkyLayer)) e.maxCenterOffset *= ratio
            console.log(ratio)
        })
        GameImage.setPerspective(GameImage.bottomY,height,GameImage.baseWidth+baseAdjustment,GameImage.startPercentage,newGameSpeed)
        
    }
    
}


class GameImage {
    static setPerspective(bottomY=canvas.height, perspectiveHeight=725, basesWidth=1000, startPercentage=0.22, scrollSpeed=8){
        GameImage.baseWidth = basesWidth
        GameImage.baseCenterX = canvas.width/2
        GameImage.height = perspectiveHeight
        GameImage.bottomY = bottomY
        GameImage.topY = GameImage.bottomY - GameImage.height
        GameImage.startPercentage = startPercentage 
        GameImage.startY = GameImage.topY + (GameImage.height * GameImage.startPercentage)
        GameImage.scrollSpeed = scrollSpeed
    }
    static drawRoad(ctx){
        ctx.fillStyle = '#439544'
        ctx.fillRect(0, GameImage.startY, GameImage.baseCenterX*2, GameImage.bottomY-GameImage.startY)
        ctx.beginPath()
        const StartWidth = GameImage.startPercentage * GameImage.baseWidth
        const point1X = GameImage.baseCenterX - StartWidth/2
        const point2X = point1X + StartWidth
        const point3X = GameImage.baseCenterX + GameImage.baseWidth/2
        const point4X = point3X - GameImage.baseWidth
        ctx.moveTo(point1X,GameImage.startY)
        ctx.lineTo(point2X,GameImage.startY)
        ctx.lineTo(point3X,GameImage.bottomY)
        ctx.lineTo(point4X,GameImage.bottomY)
        ctx.closePath()
        ctx.fillStyle = "#cfbd86"
        ctx.fill();
    }
    
    constructor(fileSrc, maxWidth, maxHeight, 
        posXAtBase=GameImage.baseCenterX, startingY=GameImage.startY, heightOffset = 0){
        this.image = new Image()
        this.image.src = fileSrc
        this.sx = 0
        this.sy = 0
        this.percentTraveled = ((startingY)-GameImage.topY) / GameImage.height 
        this.posXAtBase = posXAtBase
        this.relativeSpeed = 0
        this.maxWidth = maxWidth
        this.maxHeight = maxHeight
        this.maxHeightOffset = heightOffset
        this.maxCenterOffset = (posXAtBase - GameImage.baseCenterX)
        this.dw = this.maxWidth * this.percentTraveled  
        this.dh = this.maxHeight * this.percentTraveled   
        this.dx = GameImage.baseCenterX - this.dw/2
        this.dy = startingY - this.dh 
        this.heightTraveled = 0;
        this.angle = 0
        this.alpha = 1
        this.flipped = false;
        this.distanceFromBase = GameImage.bottomY - startingY
        this.markedForDel = false;      
    }
    get centerX(){return this.dx+this.dw/2 + (this.maxCenterOffset * this.percentTraveled)}   
    get centerY(){return this.dy+this.dh/2 + (this.maxHeightOffset * this.percentTraveled)}
    get imageBaseY(){return this.dy+this.dh}
    get lane(){
            if (this.maxCenterOffset < -50) return "left"
            if (this.maxCenterOffset > 50) return "right"
            return "middle"
        }
    moveWithPerspective(){
        const speed = (GameImage.scrollSpeed + this.relativeSpeed) * Math.pow(this.percentTraveled,2)
        let distanceFromBase = (1-this.percentTraveled)*GameImage.height - speed
        this.dw = (this.percentTraveled * this.maxWidth)
        this.dh = (this.percentTraveled * this.maxHeight)
        this.dy = (GameImage.bottomY - distanceFromBase) - this.dh
        this.dx = (GameImage.baseCenterX - this.dw/2)
        this.percentTraveled = ((this.imageBaseY)-GameImage.topY) / GameImage.height
    }
    draw(ctx){
        const {image, dx, dy, dw, dh} = this;
        const heightOffset = this.maxHeightOffset * this.percentTraveled 
        const centerOffset = this.maxCenterOffset * this.percentTraveled
        if (this.angle != 0 || this.alpha != 1 || this.flipped) ctx.save() //ugly way to not save/restore dozens of times a frame 
        if (this.flipped) this.flipHorizontal(ctx);  
        this.rotate(ctx)
        ctx.globalAlpha = this.alpha
        ctx.drawImage(image, (dx + centerOffset), dy + heightOffset, (dw), (dh))
        //ctx.drawImage(image, Math.floor(dx + centerOffset + 0.5), dy + heightOffset, Math.floor(dw+0.5), Math.floor(dh+0.5))
        if (this.angle != 0 || this.alpha != 1 || this.flipped) ctx.restore();
    }
    drawShadow(ctx,shadowImg){
        const width = this.dw*2
        const height = width*0.3
        const y = this.imageBaseY - (height/1.8)
        ctx.drawImage(shadowImg, Math.floor((this.centerX-width*0.5)+0.5), y, Math.floor(width+0.5), Math.floor(height+0.5))
    }
    rotate(ctx){
        if (this.angle === 0) return; 
        ctx.translate(this.centerX,this.centerY)
        ctx.rotate(this.angle)
        ctx.translate(-(this.centerX),-(this.centerY))
    }
    flipHorizontal(ctx){
        ctx.translate(this.centerX,0)
        ctx.scale(-1,1)
        ctx.translate(-this.centerX,0)
    }
    fadeAlpha(increment){
        if (increment === 0) return;
        let alpha = this.alpha + increment
        if (alpha > 1) alpha = 1;
        if (alpha < 0) alpha = 0;
        this.alpha = alpha;
    }
    swapImage(imageSrc){
        const newImage = new Image()
        newImage.onload = () => this.image = newImage
        newImage.src = imageSrc
    }
}
GameImage.setPerspective();

class GroundedObjects extends GameImage {
    static activeObjects = []
    constructor(fileSrc, maxWidth, maxHeight, posXAtBase, heightOffset){
            const spawningY = 0.15 * GameImage.height + GameImage.topY
            super(fileSrc, maxWidth, maxHeight, posXAtBase, spawningY, heightOffset)
            this.alpha = 0;
        }
    update(){
        this.moveWithPerspective()
        this.fadeAlpha(0.25)
        if (this.percentTraveled > 0.9) this.markedForDel = true;
    }
    draw(ctx){
        if (this.imageBaseY < GameImage.startY) return;
        super.draw(ctx)
    }
    drawShadow(ctx,shadowImg){
        if (this.imageBaseY < GameImage.startY) return;
        super.drawShadow(ctx,shadowImg)
    }
}

class Tree extends GroundedObjects {
    constructor(posXAtBase){
        let scaler = randomValue(1,1.05)
        super("./images/tree.png",643*2*scaler,921*1.8*scaler,posXAtBase,80)
    }
    update(){
        this.moveWithPerspective()
        this.fadeAlpha(0.25)
        if (this.percentTraveled > 1.1) this.markedForDel = true;
    }
}

class Bush extends GroundedObjects {
    static centerOffsetBias = 0
    constructor(posXAtBase){
        super("./images/bush.png",243*2,142*2,posXAtBase,30)
        Bush.centerOffsetBias += this.maxCenterOffset
    }
}

class SkyLayer extends GameImage{
    constructor(startOffset, endOffset){
        super("./images/sky_layers/skylayer3.png",2500,2500,500,GameImage.bottomY-startOffset,0) //./images/skylayer3.png
        this.relativeSpeed = -20
        this.endOffset = endOffset
    }
    get endPoint(){return GameImage.startY + this.endOffset}
    
    update(){
        let difference = (this.endPoint - this.imageBaseY)
        if (Math.abs(difference) < 5) return 
        this.relativeSpeed = 15 * Math.sign(difference)
        this.moveWithPerspective()
    }
    drawShadow(){}

}

class Sprite extends GameImage{
    constructor(bitmaps, maxWidth, maxHeight, heightOffset){
        super(undefined,  maxWidth, maxHeight, GameImage.baseCenterX, GameImage.bottomY, heightOffset)
        this.frames = bitmaps
        this.frame = 0;
        this.image = this.frames[this.frame]
    }
    incrementFrame(num){
        this.frame += num
        if (this.frame >= this.frames.length) return;
        if (this.frame < 0) return;
        this.image = this.frames[Math.floor(this.frame)]
    }
    setFrame(frame){
        this.frame = frame;
        this.image = this.frames[this.frame]
    }
}

class Projectile extends GameImage {
    static activeProjectiles = [];
    constructor(fileSrc, maxHeight, maxWidth, posXAtBase, startingY, heightOffset, velTotal=0, velX=0, initialAngle=0, rotationSpeed=0){
        super(fileSrc, maxHeight, maxWidth, posXAtBase, startingY, heightOffset)
        this.velTotal = velTotal
        this.velX = velX
        this.velY = Math.sqrt(Math.pow(this.velTotal, 2) - Math.pow(this.velX, 2)) || 0
        this.angle = initialAngle
        this.rotationSpeed = rotationSpeed //full rotations per frame
        this.gravity = 1.5; //pixel-per-frame velY that is lost each frame (when obj is at max closeness in )
        this.framesActive = 0;
    }
    update(){
        this.maxCenterOffset += this.velX
        this.maxHeightOffset -= this.velY
        this.velY -= this.gravity
        this.angle += this.rotationSpeed*Math.PI*2   
    }
    drawShadow(){}
}
class BlockedArrow extends Projectile {
    constructor(posX,heightOffset,velTotal,velX){
        super('./images/arrow.png',
            40*0.5, 150*0.5, posX, GameImage.bottomY, heightOffset, velTotal, 
            velX, 3.14*Math.sign(velX), randomValue(0.001,0.005)*velX)
        this.gravity = 3
        this.alpha = 1
        this.sfx = new SoundEffect(`./sounds/clank/${Math.floor(Math.random()*5)}.wav`,0.2)
        this.sfx.play();  
    }
    update(){
        super.update()
        this.velX -= 0.5*Math.sign(this.velX)
        if (this.maxHeightOffset > 0) this.markedForDel = true;
    }
}

class FiredArrow extends Projectile {
    constructor(posXAtBase, startingY, heightOffset, game){
        super('./images/fired_arrow.png', 50, 100, posXAtBase, startingY+10, heightOffset,0, 
            -40*Math.sign(posXAtBase - GameImage.baseCenterX),0.25*Math.sign(posXAtBase - GameImage.baseCenterX))
        this.gravity = 0;
        this.velY = 1
        this.relativeSpeed = 160
        this.game = game
        this.player = game.player
    }
    update(){
        super.update();
        this.moveWithPerspective();
        this.checkForCollison();
    }
    checkForCollison(){
        if (this.percentTraveled < 0.8) return;
        this.markedForDel = true;
        if (this.player.lane === this.lane &&
            this.player.state === this.player.states["blocking"]){
            const velocityDirection = -Math.sign(this.velX)
            const arrowDestinationX = GameImage.baseCenterX + velocityDirection*150
            this.game.activeObjects.push(new BlockedArrow(arrowDestinationX,-300, 45, randomValue(15,25)*velocityDirection))
            this.game.UI.addScore(2)
        } else this.player.receiveAttack(this)
        
    }
}

class DroppedCrossbow extends Projectile {
    constructor(posXAtBase, startingY, heightOffset, flipped){
        super('./images/crossbow.png', 250*0.8, 141*0.8, posXAtBase, startingY, heightOffset, 10, 0)
        this.flipped = flipped
    }
    update(){
        super.update();
        this.moveWithPerspective();
        if (this.maxHeightOffset >= 0){
            this.maxHeightOffset = 0;
            this.velX = 0;
        }
        this.fadeAlpha(-0.01)
        if (this.percentTraveled > 1.1) this.markedForDel = true
    }
}

class BloodSpurt extends Projectile {
    constructor(posXAtBase, startingY, heightOffset){
        super (`./images/blood/${Math.floor(Math.random()*2+1)}.png`,
            40, 40, posXAtBase, startingY, heightOffset, randomValue(3,15), 
            randomValue(-3,6), 0, 0)
        this.gravity = 0.8;
        this.relativeSpeed = this.velTotal/3
    }
    update(){
        super.update()
        this.moveWithPerspective();
        this.framesActive += 1
        if (this.framesActive === 40) this.markedForDel = true
        if (this.maxHeightOffset > 0){
            this.maxHeightOffset = 0;
            this.velX = 0;
            this.relativeSpeed = 0
        }
    }
}

class Coin extends Projectile{
    static lastSfxValue = 0 
    constructor(x,y,heightOffset,targetX, targetY, UI){
        super(`./images/coin.png`,55*0.6,42*0.6,x+randomValue(-10,10),y,heightOffset+randomValue(-10,10),0,0,randomValue(0,2),0)
        this.UI = UI
        this.targetX = targetX + randomValue(-80,80)
        this.targetY = targetY
        this.velY = (y - this.targetY)/ 100  
        this.velX = (this.targetX - x)/ 100
        this.XYratio = Math.abs(this.velX / this.velY)
        this.acceleration = randomValue(1.03,1.035)
        this.rotationSpeed = randomValue(-0.02,0.02)//this.acceleration-1.02
        this.gravity = 0
        this.setSfx()
    }
    update(){
        super.update();
        this.velY *= this.acceleration
        this.velX *= this.acceleration
        if (this.centerY-this.targetY < 100) this.fadeAlpha(-0.25)
        if (this.alpha <= 0) {
            this.markedForDel = true;
            this.sfx.play(); 
            this.UI.targetCoins += 1       
        }    
    }
    setSfx(){
        let num = Math.floor(randomValue(1,6))
        while(num === Coin.lastSfxValue) { num = Math.floor(randomValue(1,6)) }
        Coin.lastSfxValue = num
        this.sfx = new SoundEffect(`./sounds/coins/${num}.mp3`,0.3)
    }
}


class SoundEffect {
    constructor(fileSrc, volume){
        this.sound = new Audio()
        this.sound.volume = loadMuted ? 0 : volume
        this.sound.src = fileSrc
    }
    play(){
        this.sound.play()
    }
}

class Enemy{
    constructor(game, baseImageSrc, maxWidth, maxHeight, posXAtBase, startingY){
        this.image = new GameImage(baseImageSrc, maxWidth, maxHeight, posXAtBase, startingY)
        this.game = game
        this.markedForDel = false;
        this.sfx = {}
    }
    get lane(){
        return this.image.lane
    }
    get percentTraveled(){
        return this.image.percentTraveled
    }
    spawnCoins(amount){
        const {posXAtBase,imageBaseY,maxHeight} = this.image
        for (let i = 0; i < amount; i++) {
           this.game.UI.spawnCoin(posXAtBase,imageBaseY,-maxHeight/2) 
        } 
    }
    draw(ctx){
        if (this.image.imageBaseY < GameImage.startY) return;
        this.image.draw(ctx);
    }
    drawShadow(ctx,shadowImg){
        if (this.image.imageBaseY < GameImage.startY) return;
        this.image.drawShadow(ctx,shadowImg)
    }
    
}

class Crossbowman extends Enemy {
    constructor(game, posXAtBase){
        const spawningY = 0.15 * GameImage.height + GameImage.topY
        super(game, './images/gaurd_nobolt.png', 321*0.8, 604*0.8, posXAtBase, spawningY)
        this.image.alpha = 0;
        this.states = { unloaded: "unloaded", loaded: "loaded",
                        fired: "fired", dead: "dead"}
        this.state = "unloaded"
        this.sfx.load = new SoundEffect (`./sounds/crossbow_loading/1.mp3`,0.1)
        this.sfx.death = new SoundEffect (`./sounds/death/${Math.floor(Math.random()*5)}.ogg`,0.3)
        this.sfx.death2 = new SoundEffect (`./sounds/gore/${Math.floor(Math.random()*3)}.wav`, 0.3)
        this.deathCounter = 0;
    }
    
    update(){
        this.image.moveWithPerspective()
        if (this.image.percentTraveled > 1.1) this.markedForDel = true;
        if (this.state === this.states.dead) {
            this.deathCounter += 1
            if (this.deathCounter > 30) this.fadeAlpha(-0.1)
        } else this.fadeAlpha(0.25)
        if (this.image.percentTraveled > 0.35 && this.state === "unloaded") this.loadCrossbow()
        if (this.image.percentTraveled > 0.4 && this.state === "loaded") this.attack();
    }
    loadCrossbow(){
        this.state = "loaded"
        this.image.swapImage('./images/gaurd_loaded.png')   
        this.sfx.load.play();
    }
    attack(){    
        this.state = "fired"
        this.image.swapImage('./images/gaurd_nobolt.png')
        const {posXAtBase,imageBaseY,maxHeight} = this.image
        this.game.activeObjects.push(new FiredArrow(posXAtBase,imageBaseY,-maxHeight/2, this.game))
        
    }
    receiveAttack(){
        if (this.state === "dead") return;
        this.state = "dead"
        this.image.swapImage('./images/gaurd_dead_bloody.png')
        this.sfx.death.play();
        this.sfx.death2.play();
        const {posXAtBase,imageBaseY,maxHeight, flipped} = this.image
        this.game.activeObjects.push(new DroppedCrossbow(posXAtBase, imageBaseY+10, -maxHeight/2, flipped))
        for (let index = 0; index < 30; index++) {
            this.game.activeObjects.push(new BloodSpurt(posXAtBase, imageBaseY+10, -maxHeight/2))   
        }
        this.spawnCoins(5)
        this.game.UI.addScore(10)
    }
    fadeAlpha(num){
        this.image.fadeAlpha(num)
    }
    
}

class Pikeman extends Enemy {
    constructor(posX){
        //super()
    }
}

class Player{
    constructor(game, blockBitmaps, attackBitmaps){
        this.block = new Sprite(blockBitmaps, 842, 609)
        this.attack = new Sprite(attackBitmaps, 534*0.8, 871*0.8, 200)
        this.block.alpha = 1;
        this.attack.alpha = 1;
        this.game = game;
        this.states = { blocking: new Blocking(this), attacking: new Attacking(this)}
        this.lane = this.game.lanes["middle"]
        this.state = this.states.blocking;
        this.sfx = {hurt:[new SoundEffect(`./sounds/player_hurt/1.wav`,0.1), new SoundEffect(`./sounds/player_hurt/2.wav`,0.1),
                        new SoundEffect(`./sounds/player_hurt/3.wav`,0.1), new SoundEffect(`./sounds/player_hurt/4.wav`,0.1)]}

    }
    update(input){
        this.state.update(input);
    }
    draw(ctx){
        this.state.draw(ctx)
    }
    changeState(state){
        this.state.exit();
        this.state = this.states[state]
        this.state.enter();
    }
    receiveAttack(source){
        let sfxChoice = Math.floor(randomValue(0,4))
        this.game.health -= 0.075
        this.sfx.hurt[sfxChoice].play();
        this.states.blocking.recoveryOffset = 120
        this.game.UI.combo = 1
        this.changeState("blocking")
    }
}

class State{
    constructor(state){
        this.state = state
    }
    enter(){}
    exit(){}
    update(){}
}

class Blocking extends State {
    constructor(player){
        super("blocking")
        this.player = player
        this.sprite = this.player.block 
        this.sprite.frame = 18;
        this.frameIncrement = 1;
        this.frameQueue = [18];
        this.positionInQueue = 0;
        this.frameDestinations = {'middle':18, 'left':0, 'right':34} 
        this.middleSkipRange = [12,26] 
        this.earlyFramesToSkip = 5
        this.inputDelayCounter = 0;
        this.angleCounter = 0;
        this.bounceOffset = 0
        this.recoveryOffset = 0
        this.lastInput = 'middle'
    }
    enter(){
    }
    exit(){
        this.inputDelayCounter = 0;
        this.updateLane();
    }
    update(input){
        this.sprite.fadeAlpha(0.2)
        this.addBounce()
        this.updateLane()
        if (input === 'attack' && this.recoveryOffset < 20){
            this.player.changeState("attacking")
            return;
        }
        else if ( ! (Object.keys(this.frameDestinations).includes(input)) ) return;
        if (--this.inputDelayCounter >= 0 || this.frameDestinations[input] === undefined) input = this.lastInput
        if (input !== this.lastInput) {
            this.inputDelayCounter = 4;
            this.makeFrameQueue(input)
        }
        this.lastInput = input;
        if (this.positionInQueue !== this.frameQueue.length) this.sprite.setFrame(this.frameQueue[this.positionInQueue++])
        
    }
    draw(ctx){
        this.sprite.maxHeightOffset += this.bounceOffset
        this.player.game.changePerspectiveHeight(725-(this.bounceOffset+20))
        this.sprite.draw(ctx)
        this.sprite.maxHeightOffset -= this.bounceOffset
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
    addBounce() {
        this.angleCounter += 1/20
        let mod = 15
        let unmodBounceOffset = Math.sin(this.angleCounter)
        if (this.recoveryOffset > 1) {
            this.recoveryOffset -=  2 * (this.recoveryOffset/20)
            mod *= (1/this.recoveryOffset)
        } else this.recoveryOffset = 0
        if (unmodBounceOffset > 0) mod *= -1
        this.bounceOffset = unmodBounceOffset * mod * this.player.game.speedModifier + this.recoveryOffset
        
    }
    updateLane(){
        if (this.inputDelayCounter > 0) return
        let lane = "middle"
        if (this.sprite.frame > 23) lane = "right"
        if (this.sprite.frame < 12) lane = "left"
        this.player.lane = lane;
    }
}

class Attacking extends State {
    constructor(player){
        super("attacking")
        this.player = player
        this.sprite = this.player.attack
        this.activeFrameRange = [15,20]
        this.game = this.player.game
    }
    exit(){
        this.sprite.frame = 0
    }
    update(){
        this.sprite.fadeAlpha(0.2)
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
        if (this.sprite.frame < this.activeFrameRange[0] || 
            this.sprite.frame > this.activeFrameRange[1]) return;
        const activeObj = this.game.activeObjects
        for (let i = activeObj.length-1; i >= 0; i--) {
            if (activeObj[i] instanceof Enemy){
                let inRange = activeObj[i].image.percentTraveled > 0.63 
                            && activeObj[i].image.percentTraveled < 0.9
                            && activeObj[i].lane === this.player.lane
                if (inRange) activeObj[i].receiveAttack();
            } 
        }
        this.game.activeObjects.forEach((e)=>{
            let inRange = e.image.percentTraveled > 0.63 && e.image.percentTraveled < 0.9
            if (inRange && e.lane === this.player.lane) e.receiveAttack();
        })
    }
    angleAttack(){
        const sprite = this.sprite
        sprite.angle = 0
        sprite.maxCenterOffset = 0
        sprite.maxHeightOffset = 300
        if (this.player.lane === "right"){ 
            sprite.angle = 1.35
            sprite.maxHeightOffset = 80
            sprite.maxCenterOffset = 30
            
        } else if (this.player.lane === "left") {
            sprite.angle = -1.35
            sprite.maxHeightOffset = 50
            sprite.maxCenterOffset = -40
        }  
    }
}

async function getSprites(){
    await getSprite("./sword-attack-v2-compressed.json").then((resp) => bitmaps.attack = resp)
    updateLoadScreen()
    await getSprite("./parchment.json").then((resp) => bitmaps.ui = resp)
    updateLoadScreen()
    await getSprite("./sword48.json").then((resp) => bitmaps.block = resp)
    updateLoadScreen()
};

async function getSprite(spriteJsonSource){
    const response = await fetch(spriteJsonSource)
    const json = await response.json()
    const spriteName = loadNoSprites ? './images/empty.png' : `./images/${json.meta.image}`
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
    

function startGame(){ 
    const game = new Game(ctx, canvas.width, canvas.height, bitmaps)
    
    animate(0,game);  
}
function animate(timestamp, game){
    game.update(timestamp, keyRecord, touchRecord)
    requestAnimationFrame((timestamp)=>{
        
        animate(timestamp, game)
    })
}


