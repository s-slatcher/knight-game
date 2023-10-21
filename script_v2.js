/** @type {HTMLCanvasElement} */

const loadBlankSprites = true;
const loadMuted = false;
const disableEnemyDamage = false;

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
let spritesToLoad = 2;
let spritesLoaded = 0;
startButton.innerHTML = `Loading`


canvas.width = 1000;
canvas.height = 1000;
canvas2.width = 1000
canvas2.height = 1000
canvas.style.aspectRatio = 1/1

const randomSign = () => Math.random() >= 0.5 ? 1 : -1;
const randomValue = (a,b) => Math.random() * (b-a) + a
const randomInt = (a,b) => Math.floor(randomValue(a,b+1))
const twoPointDistance = (coords1, coords2) => {
    return Math.sqrt(Math.pow((coords2[0]-coords1[0]),2) + Math.pow((coords2[1]-coords1[1]),2))
}



getSprites();

const updateLoadScreen = function(){
    spritesLoaded += 1;
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

class Stats {
    constructor(game){
        this.game = game;
        this.startFrame = 150
        this.centerX = this.game.width/2
        this.centerY = 100
        this.currentScore = 0
        this.targetScore = 0
        this.combo = 1
        this.targetCoins = 0
        this.currentCoins = 0
        this.scoreIncreaseDisplay = 0
        this.healthOverlays = []
        this.coinImages = []
        this.coinImage = 0
        this.game.ctx.strokeStyle = 'black'
        this.game.ctx.lineWidth = 5
        this.font = "50px Lugrasimo"
        this.game.ctx.font = this.font
        this.createCoinImages() 
        this.createHealthOverlays()
    }    
    createCoinImages(){
        this.coinImages.push(new GameObj("",0,0))
        for (let i = 0; i < 6; i++) {
            this.coinImages
                .push(new GameObj(`./images/coin_pile/${i+1}.png`,80,80,this.centerX-300,GameObj.bottomY,-1000+this.centerY+30))
        }
    }
    createHealthOverlays(){
        this.healthOverlays.push(new GameObj("",0,0))
        for (let i = 0; i < 4; i++){
            this.healthOverlays
                .push(new GameObj(`./images/health/stage${i+1}.png`,1000,1000,undefined,GameObj.bottomY))
        }
    }
    update(){
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
        if (increment < 0.5) increment = 0.2
        this.currentScore += increment
        
    }
    addScore(num){
        let score = num * this.combo
        this.targetScore += score
        this.scoreIncreaseDisplay += score
        if (num > 5) this.combo += 1
    }
    draw(ctx){
        ctx.fillStyle = "black"
        this.drawStrokedText(ctx,`${this.currentCoins}`, this.centerX-250, this.centerY+15)
        this.coinImages[this.coinImage].draw(ctx)
        let displayScore = Math.floor(this.currentScore)
        let remainder = this.targetScore - displayScore
        let scoreDimensions = ctx.measureText(`${displayScore}`)
        this.drawStrokedText(ctx,`${displayScore}`, this.centerX - (scoreDimensions.width/2), this.centerY+15)
        if(remainder > 0) {
            ctx.font = "30px Lugrasimo"
            ctx.fillText(`+${this.scoreIncreaseDisplay}`,this.centerX + (scoreDimensions.width/2) + 5, this.centerY+15)
            ctx.font = this.font
        } else {
            this.scoreIncreaseDisplay = 0;
        }
        this.drawStrokedText(ctx,`ₓ${this.combo}`, this.centerX+225, this.centerY+15)
        this.drawHealthOverlay(ctx)
    }
    drawStrokedText(ctx,text,x,y){
        ctx.strokeText(text,x,y)
        ctx.fillStyle = 'white'
        ctx.fillText(text,x,y)
    }
    drawHealthOverlay(ctx){
        let healthImageIndex = Math.ceil(5-(this.game.health*5))
        if (healthImageIndex < 0) healthImageIndex=0
        if (healthImageIndex > 4) healthImageIndex = 4 
        this.healthOverlays[healthImageIndex].draw(ctx)
    }
    spawnCoin(posXAtBase,startingY,heightOffset){
        this.game.activeObjects.push(new Coin(posXAtBase,startingY+40,heightOffset-40,this.centerX-300,this.centerY, this))
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
        this.framesSinceBowman = 0;
        this.treesDelay = 40;
        this.bowmanDelay = 0
        this.bowmanDue = 3;
        this.totalFrames = 0;
        this.speedModifier = 1;
        this.lanes = {left:0, middle:1, right:2}
        this.player = new Player(this, bitmaps.block, bitmaps.attack)
        this.stats = new Stats(this)
        this.health = 1
        this.activeObjects = []
        this.input;
        this.shadowCanvas = document.createElement("canvas")
        this.shadowCanvas.width = width
        this.shadowCanvas.height = height
        this.ctxShadow = this.shadowCanvas.getContext("2d")
        this.initalizeBackground();
        // window.addEventListener('click',e=>{
        //     this.speedModifier += 0.1;
        //     GameObj.scrollSpeed = 8*this.speedModifier;
        //     console.log(this.speedModifier,GameObj.scrollSpeed)
        //     this.setViewDistance(GameObj.startPercentage - (1/120))
        // })
        //this.perspectiveTestListeners(); 
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
            this.stats.update()
            this.player.update(this.input)
            this.handleEnemies();
            this.handleBackground();
            this.activeObjects.forEach((e)=>e.update())
            this.activeObjects = this.activeObjects.filter((e)=>!e.markedForDel)          
            this.draw(this.ctx);   
        }
    }
    initalizeBackground(){
        for (let i = 0; i < 450; i++) {
            this.handleBackground();
            this.activeObjects.forEach(e=>e.update())
        }
        for (let i = 0; i < 5; i++) this.activeObjects.push(new SkyLayer(400-(i*30),i*10-20))
    }
    handleBackground(){
        if (this.treesDelay <= 0) {
            this.createDuelTrees();
            this.treesDelay += Math.floor(40/this.speedModifier)
        } else this.treesDelay -= 1
        
        if (this.treesDelay === Math.floor(20/this.speedModifier)) {
            this.createBush();
        }
    }
    createDuelTrees(){
       this.activeObjects.unshift(new Tree((this.width/2)+randomInt(1030,1070)))
       this.activeObjects.unshift(new Tree((this.width/2)-randomInt(1030,1070)))
       this.activeObjects[1].flipped = randomInt(0,1) === 1
       this.activeObjects[0].flipped = randomInt(0,1) === 1
    }
    createBush(){
        this.activeObjects.unshift(new Bush((this.width/2+randomValue(925,1025)*randomSign())))
        if (Math.abs(Bush.centerOffsetBias) > 1200) {
                this.activeObjects[0].maxCenterOffset *= -1
                Bush.centerOffsetBias = 0;
        }
    }
    handleEnemies(){
        if (this.framesSinceBowman > this.bowmanDelay) this.spawnBowWave();
        else this.framesSinceBowman ++;
    }
    spawnBowWave() {   //should change to spawn all bowman at once, at staggered distances, makes delay handling more straightforward 
        let roadSide = randomSign();
        if (this.bowmanDue > 0) {
            const newEnemy = new Bowman(this, this.width/2 - 500*roadSide)
            if (roadSide === -1) newEnemy.flipped = true;
            this.activeObjects.unshift(newEnemy)
            this.framesSinceBowman = 0;
            this.bowmanDelay = Math.random()*20+40
            this.bowmanDue -= 1
        } else {
            this.bowmanDelay = 200
            this.bowmanDue = 3
        }
        this.bowmanDelay /= this.speedModifier 
    }
    draw(){
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctxShadow.clearRect(0,0,this.width,this.height)
        this.drawStaticBackground(this.ctx);
        if (this.totalFrames % 3 === 0) this.activeObjects.sort((a,b)=> a.percentTraveled - b.percentTraveled)
        this.overlayShadows()
        this.activeObjects.forEach(e => e.draw(this.ctx))
        this.player.draw(this.ctx)
        this.stats.draw(this.ctx);
    }
    overlayShadows(){
        this.activeObjects.forEach(e => e.drawShadow(this.ctxShadow))
        this.ctxShadow.clearRect(0, 0, this.width, GameObj.startY)
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
        GameObj.drawRoad(ctx)
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
            if (e.button === 0) this.setBaseStartPoint(GameObj.bottomY+5)
            if (e.button === 1) {
                if (GameObj.startPercentage < 0.15 || GameObj.startPercentage > 0.23) startPercentAdjust *= -1
                this.setViewDistance(GameObj.startPercentage+startPercentAdjust)
            }
            })
        window.addEventListener('contextmenu', (e) => { 
            e.preventDefault();
            this.setBaseStartPoint(GameObj.bottomY-5)
        })
        window.addEventListener('wheel', (e) => {
            let newHeight = GameObj.height + (20 * Math.sign(e.deltaY))
            this.changePerspectiveHeight(newHeight)
        })
    }
    setBaseStartPoint(y=1000){
        const difference = GameObj.bottomY - y
        GameObj.setPerspective(y,GameObj.height,GameObj.baseWidth,GameObj.startPercentage,GameObj.scrollSpeed)
        //this.activeObjects
    }
    setViewDistance(startPercentage){
        GameObj.startPercentage = startPercentage
        GameObj.startY = GameObj.topY + (GameObj.height * GameObj.startPercentage)
    }
    changePerspectiveHeight(height){
        const heightDifference = GameObj.height-height
        const newGameSpeed = 8 * this.speedModifier * (height/725)
        const baseAdjustment = heightDifference/3
        const ratio = (baseAdjustment+GameObj.baseWidth) / GameObj.baseWidth
        this.activeObjects.forEach((e)=> { if (!(e instanceof SkyLayer)) e.maxCenterOffset *= ratio})
        GameObj.setPerspective(GameObj.bottomY,height,GameObj.baseWidth+baseAdjustment,GameObj.startPercentage,newGameSpeed)
        
    }
    
}


class GameObj {
    static setPerspective(bottomY=canvas.height, perspectiveHeight=725, basesWidth=1000, startPercentage=0.22, scrollSpeed=8){
        GameObj.baseWidth = basesWidth
        GameObj.baseCenterX = canvas.width/2
        GameObj.height = perspectiveHeight
        GameObj.bottomY = bottomY
        GameObj.topY = GameObj.bottomY - GameObj.height
        GameObj.startPercentage = startPercentage 
        GameObj.startY = GameObj.topY + (GameObj.height * GameObj.startPercentage)
        GameObj.scrollSpeed = scrollSpeed
    }
    static drawRoad(ctx){
        ctx.fillStyle = '#439544'
        ctx.fillRect(0, GameObj.startY, GameObj.baseCenterX*2, GameObj.bottomY-GameObj.startY)
        ctx.beginPath()
        const StartWidth = GameObj.startPercentage * GameObj.baseWidth
        const point1X = GameObj.baseCenterX - StartWidth/2
        const point2X = point1X + StartWidth
        const point3X = GameObj.baseCenterX + GameObj.baseWidth/2
        const point4X = point3X - GameObj.baseWidth
        ctx.moveTo(point1X,GameObj.startY)
        ctx.lineTo(point2X,GameObj.startY)
        ctx.lineTo(point3X,GameObj.bottomY)
        ctx.lineTo(point4X,GameObj.bottomY)
        ctx.closePath()
        ctx.fillStyle = "#cfbd86"
        ctx.fill();
    }
    
    constructor(fileSrc, maxWidth, maxHeight, 
        posXAtBase=GameObj.baseCenterX, startingY=GameObj.startY, heightOffset = 0){
        this.image = new Image()
        this.image.src = fileSrc
        this.sx = 0
        this.sy = 0
        this.percentTraveled = ((startingY)-GameObj.topY) / GameObj.height 
        this.posXAtBase = posXAtBase
        this.relativeSpeed = 0
        this.maxWidth = maxWidth
        this.maxHeight = maxHeight
        this.maxHeightOffset = heightOffset
        this.maxCenterOffset = (posXAtBase - GameObj.baseCenterX)
        this.dw = this.maxWidth * this.percentTraveled  
        this.dh = this.maxHeight * this.percentTraveled   
        this.dx = GameObj.baseCenterX - this.dw/2
        this.dy = startingY - this.dh 
        this.heightTraveled = 0;
        this.angle = 0
        this.alpha = 1
        this.flipped = false;
        this.distanceFromBase = GameObj.bottomY - startingY
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
        const speed = (GameObj.scrollSpeed + this.relativeSpeed) * Math.pow(this.percentTraveled,2)
        let distanceFromBase = (1-this.percentTraveled)*GameObj.height - speed
        this.dw = (this.percentTraveled * this.maxWidth)
        this.dh = (this.percentTraveled * this.maxHeight)
        this.dy = (GameObj.bottomY - distanceFromBase) - this.dh
        this.dx = (GameObj.baseCenterX - this.dw/2)
        this.percentTraveled = ((this.imageBaseY)-GameObj.topY) / GameObj.height
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
GameObj.setPerspective();

class GroundedObjects extends GameObj {
    static activeObjects = []
    constructor(fileSrc, maxWidth, maxHeight, posXAtBase, heightOffset){
            const spawningY = 0.15 * GameObj.height + GameObj.topY
            super(fileSrc, maxWidth, maxHeight, posXAtBase, spawningY, heightOffset)
        }
    update(){
        this.moveWithPerspective()
        if (this.percentTraveled > 1.15) this.markedForDel = true;
    }
    draw(ctx){
        if (this.imageBaseY < GameObj.startY) return;
        if (this.alpha === 0) return;
        super.draw(ctx)
    }
}

class Tree extends GroundedObjects {
    constructor(posXAtBase){
        let scaler = randomValue(0.9,1.1)
        const treePic = randomInt(1,6) === 2 ? 2 : 1   //1 in 4 chance for first tree in pic folder
        super(`./images/trees/tree_v3_${treePic}.png`,1060*2,1090*2*scaler,posXAtBase,40)
        this.shadow = new Image()
        this.shadow.src = `./images/tree_shadows_v2/${Math.floor(randomValue(1,7))}.png`
        this.shadowWidthMultiplier = randomValue(0.85,1)
    }
    update(){
        if(this.percentTraveled > 0.7) this.fadeAlpha(-0.2)
        super.update()
    }
    drawShadow(ctx){
        if (this.imageBaseY < GameObj.startY) return;
        const width = this.dw*this.shadowWidthMultiplier
        const height = width*0.3
        const y = this.imageBaseY - (height/1.8)
        ctx.drawImage(this.shadow, Math.floor((this.centerX-width*0.5)+0.5), y, Math.floor(width+0.5), Math.floor(height+0.5))
    }
}

class Bush extends GroundedObjects {
    static centerOffsetBias = 0
    constructor(posXAtBase){
        const scaler = randomValue(1,1.15)
        super(`./images/bushes/${randomInt(1,2)}.png`,240*2*scaler,150*2*scaler,posXAtBase,0)
        Bush.centerOffsetBias += this.maxCenterOffset
        this.shadow = new Image()
        this.shadow.src = "./images/shadow_small.png"
    }
    drawShadow(ctx){}
}

class SkyLayer extends GameObj{
    constructor(startOffset, endOffset){
        super("./images/sky_layers/skylayer3.png",2500,2500,500,GameObj.bottomY-startOffset,0) //./images/skylayer3.png
        this.endOffset = endOffset
        
        
    }
    get endPoint(){return GameObj.startY + this.endOffset}
    
    update(){
        let difference = (this.endPoint - this.imageBaseY)
        if (Math.abs(difference) < 1) return 
        this.relativeSpeed = difference*0.5
        this.moveWithPerspective()
    }
    drawShadow(){}
}


class Sprite extends GameObj{
    constructor(bitmaps, maxWidth, maxHeight, heightOffset){
        super(undefined,  maxWidth, maxHeight, GameObj.baseCenterX, GameObj.bottomY, heightOffset)
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

class Projectile extends GameObj {
    static activeProjectiles = [];
    constructor(fileSrc, maxHeight, maxWidth, posXAtBase, startingY, heightOffset, velTotal=0, velX=0, initialAngle=0, rotationSpeed=0){
        super(fileSrc, maxHeight, maxWidth, posXAtBase, startingY, heightOffset)
        this.velTotal = velTotal
        this.velX = velX
        this.velY = Math.sqrt(Math.pow(this.velTotal, 2) - Math.pow(this.velX, 2)) || 0
        this.angle = initialAngle
        this.rotationSpeed = rotationSpeed //full rotations per frame
        this.gravity = 1.5; //pixel-per-frame velY that is lost each frame (when percentTraveled = 1 )
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
            40*0.5, 150*0.5, posX, GameObj.bottomY, heightOffset, velTotal, 
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
            -40*Math.sign(posXAtBase - GameObj.baseCenterX),0.25*Math.sign(posXAtBase - GameObj.baseCenterX))
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
            const arrowDestinationX = GameObj.baseCenterX + velocityDirection*150
            this.game.activeObjects.push(new BlockedArrow(arrowDestinationX,-300, 45, randomValue(15,25)*velocityDirection))
            this.game.stats.addScore(2)
        } else this.player.receiveAttack(this)
        
    }
}

class DroppedBow extends Projectile {
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
    constructor(x,y,heightOffset,targetX, targetY, stats){
        super(`./images/coin.png`,55*0.6,42*0.6,x+randomValue(-10,10),y,heightOffset+randomValue(-10,10),0,0,randomValue(0,2),0)
        this.stats = stats
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
            this.stats.targetCoins += 1       
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

class Enemy extends GameObj{   //note to self: make Enemy a subclass of GameObj
    constructor(game, baseImageSrc, maxWidth, maxHeight, posXAtBase, startingY){
        super(baseImageSrc, maxWidth, maxHeight, posXAtBase, startingY)
        //this.image = new GameObj(baseImageSrc, maxWidth, maxHeight, posXAtBase, startingY)
        this.game = game
        this.sfx = {}
        this.shadow = new Image()
        this.shadow.src = "./images/shadow_small.png"
    }
    spawnCoins(amount){
        const {posXAtBase,imageBaseY,maxHeight} = this
        for (let i = 0; i < amount; i++) {
           this.game.stats.spawnCoin(posXAtBase,imageBaseY,-maxHeight/2) 
        } 
    }
    draw(ctx){
        if (this.imageBaseY < GameObj.startY) return;
        super.draw(ctx);
    }
    drawShadow(ctx){
        return;
        if (this.imageBaseY < GameObj.startY) return;
        const width = this.dw*1.5
        const height = width*0.3
        const y = this.imageBaseY - (height/1.8)
        ctx.drawImage(this.shadow, Math.floor((this.centerX-width*0.5)+0.5), y, Math.floor(width+0.5), Math.floor(height+0.5))
    }
}

class Bowman extends Enemy {
    constructor(game, posXAtBase){
        const spawningY = 0.15 * GameObj.height + GameObj.topY
        super(game, './images/gaurd_nobolt.png', 321*0.8, 604*0.8, posXAtBase, spawningY)
        this.alpha = 1;
        this.states = { unloaded: "unloaded", loaded: "loaded",
                        fired: "fired", dead: "dead"}
        this.state = "unloaded"
        this.bowLoadDistance = 0.27   //might need to store data protecting the player from arrows fired too close together
        this.sfx.load = new SoundEffect (`./sounds/crossbow_loading/1.mp3`,0.1)
        this.sfx.death = new SoundEffect (`./sounds/death/${Math.floor(Math.random()*5)}.ogg`,0.3)
        this.sfx.death2 = new SoundEffect (`./sounds/gore/${Math.floor(Math.random()*3)}.wav`, 0.3)
        this.deathCounter = 0;
        
    }
    
    update(){
        this.moveWithPerspective()
        if (this.percentTraveled > 1.2) this.markedForDel = true;
        if (this.state === this.states.dead) {
            this.deathCounter += 1
            if (this.deathCounter > 30) this.fadeAlpha(-0.1)
        } 
        if (this.percentTraveled > this.bowLoadDistance && this.state === "unloaded") this.loadBow()
        if (this.state === "loaded" && this.game.totalFrames > this.attackingFrame) this.attack();
    }
    loadBow(){
        this.state = "loaded"
        this.attackingFrame = this.game.totalFrames + 32
        this.swapImage('./images/gaurd_loaded.png')   
        this.sfx.load.play();
    }
    attack(){    
        this.state = "fired"
        this.swapImage('./images/gaurd_nobolt.png')
        const {posXAtBase,imageBaseY,maxHeight} = this
        this.game.activeObjects.push(new FiredArrow(posXAtBase,imageBaseY,-maxHeight/2, this.game))
        
    }
    receiveAttack(){
        if (this.state === "dead") return;
        this.state = "dead"
        this.swapImage('./images/gaurd_dead_bloody.png')
        this.sfx.death.play();
        this.sfx.death2.play();
        const {posXAtBase,imageBaseY,maxHeight, flipped} = this
        this.game.activeObjects.push(new DroppedBow(posXAtBase, imageBaseY+10, -maxHeight/2, flipped))
        for (let index = 0; index < 30; index++) {
            this.game.activeObjects.push(new BloodSpurt(posXAtBase, imageBaseY+10, -maxHeight/2))   
        }
        this.spawnCoins(5)
        this.game.stats.addScore(10)
    }
    
}

class Turkey extends Enemy {
    constructor(){}
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
        this.damageRecoveryEffect = 0;
        this.angleCounter = 0;
        this.sfx = {hurt:[new SoundEffect(`./sounds/player_hurt/1.wav`,0.1), new SoundEffect(`./sounds/player_hurt/2.wav`,0.1),
                        new SoundEffect(`./sounds/player_hurt/3.wav`,0.1), new SoundEffect(`./sounds/player_hurt/4.wav`,0.1)]}
        
    }
    update(input){
        this.state.update(input);
        this.angleCounter += 1/15 * this.game.speedModifier
        this.applyBounce()
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
        if (disableEnemyDamage) return;
        let sfxChoice = Math.floor(randomValue(0,4))
        this.game.health -= 0.075
        this.sfx.hurt[sfxChoice].play();
        this.damageRecoveryEffect = 90
        this.game.stats.combo = 1
        this.changeState("blocking")
    }
    applyBounce(){
        let damageBounceMod = 1;
        if (this.damageRecoveryEffect > 1) {
            this.damageRecoveryEffect -=  2 * (this.damageRecoveryEffect/20)
            damageBounceMod *= (1/this.damageRecoveryEffect)
        } else this.damageRecoveryEffect = 0 //delete?
        this.block.maxHeightOffset = 0 + this.getBounceMod(20 * damageBounceMod, this.angleCounter+0.25)
        this.game.changePerspectiveHeight(710-(this.getBounceMod(10 * damageBounceMod, this.angleCounter)))
    }
    getBounceMod(intensity, angleInput) {
        let bounceOffset = Math.sin(angleInput) * intensity
        if (bounceOffset > 0) bounceOffset *= -1
        return (bounceOffset ) + this.damageRecoveryEffect
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
    update(input){
        this.sprite.fadeAlpha(0.2)
        if (input === 'attack' && this.damageRecoveryEffect < 20){
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
        this.activeFrameRange = [15,23]
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
                let inRange = activeObj[i].percentTraveled > 0.63 
                            && activeObj[i].percentTraveled < 0.9
                            && activeObj[i].lane === this.player.lane
                if (inRange) activeObj[i].receiveAttack();
            } 
        }
        this.game.activeObjects.forEach((e)=>{
            let inRange = e.percentTraveled > 0.63 && e.percentTraveled < 0.9
                        && e.lane === this.player.lane && e instanceof Enemy
            if (inRange) e.receiveAttack();
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
    await getSprite("./sword48.json").then((resp) => bitmaps.block = resp)
    updateLoadScreen()
};

async function getSprite(spriteJsonSource){
    const response = await fetch(spriteJsonSource)
    const json = await response.json()
    const spriteName = loadBlankSprites ? `./images/empty.png` : `./images/${json.meta.image}` 
    const bitmaps = await getSpriteImages(json, spriteName)
    console.log(spriteName)
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

let oldTimestamp = 0;

