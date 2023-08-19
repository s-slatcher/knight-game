/** @type {HTMLCanvasElement} */

const canvas = document.getElementById("canvas1");
const canvas2 = document.createElement("canvas")
const pauseMenu = document.getElementById("pauseMenu")
const canvasContainer = document.getElementById("canvas-container")
const resumeButton = document.getElementById("resume-btn")
const startButton = document.getElementById("start-btn")
const ctx = canvas.getContext('2d');
const keyRecord = [];
const touchRecord = {};

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

startButton.addEventListener('click',() => {
    fetchSprites();
    canvas.requestFullscreen();
    startButton.classList.add("disabled")
})

resumeButton.addEventListener('click', () => {
    canvas.requestFullscreen();
    resumeButton.classList.add("disabled")

})


window.addEventListener('keydown', (e) => {
    let key = e.key.length > 1 ? e.key : e.key.toLowerCase();
    if (keyRecord.indexOf(key) === -1) keyRecord.push(key)
    if (key.length === 1) 
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
    constructor(game,sprites){
        this.game = game;
        this.startFrame = 100
        this.marginY = 100
        this.marginX = 150
        this.coinIconX = this.gametextUpdateSpeed = 0.5
        this.targetHealth = 1
        this.actualScore = 0
        this.targetScore = 0
        this.actualCombo = 0
        this.targetCombo = 0
        this.targetCoins = 0
        this.displayCoins = 0
        this.font = "60px Lugrasimo"
        this.textUpdateRate = 24
        this.parchmentSprite = sprites.parchment
        this.parchmentSprite.maxHeightOffset = -850
        this.parchmentSprite.loops = false;
        this.parchmentSprite.alpha = 0.9
    }    
    update(health, score, combo){
        if (this.game.totalFrames < this.startFrame) return;
        this.parchmentSprite.update();
        if (this.game.totalFrames % (this.game.fps/this.textUpdateRate) !== 1) return;
        if (this.targetCoins > this.displayCoins) this.updateCoins()
    }
    updateCoins() {
        this.displayCoins++
    }
    draw(ctx){
        if (this.game.totalFrames < this.startFrame) return;
        this.parchmentSprite.draw(ctx)
        if (this.parchmentSprite.frame < this.parchmentSprite.lastFrameIndex-10) return; 
        ctx.fillStyle = "white"
        ctx.fillText(`${this.displayCoins}`, this.marginX, this.marginY)
        ctx.strokeText(`${this.displayCoins}`, this.marginX, this.marginY)
    }
    spawnCoin(PosXAtBase,StartingPerspectiveHeight,heightOffset){
        Projectile.activeProjectiles.push(new Coin(PosXAtBase,StartingPerspectiveHeight,heightOffset,this.coinIconX,this.marginY+20, this))
    }
    
    
}

class Game{
    constructor(ctx, width, height, sprites){
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.lastTimeStamp = 0;
        this.frameTimeDeficit = 0;
        this.fps = 48;
        this.framesSinceCrossbowman = 0;
        this.crossbowmanDelay = 100
        this.enemiesDue = 4;
        this.totalFrames = 0;
        this.speedModifier = 1;
        this.lanes = {left:0, middle:1, right:2}
        this.player = new Player(this, sprites)
        this.UI = new UI(this, sprites)
        this.ctx.font = "80px Lugrasimo"
        this.health = 1;
        this.enemies = [];
        this.backgroundElements = [];
        this.input;
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
    update(timestamp, keyRecord, touchRecord){
        
        if (!document.fullscreenElement) {
            document.getElementById("resume-btn").classList.remove("disabled")
            return
        }
        const framesDue = this.getFramesDue(timestamp)
        if (framesDue !== 0) {
            this.handleInput(keyRecord, touchRecord);
            this.UI.update(this.health)
            this.player.update(this.input)
            this.totalFrames++;
            this.handleEnemies();
            this.handleBackground();
            Projectile.activeProjectiles.forEach((e)=>e.update())
            Projectile.activeProjectiles = Projectile.activeProjectiles.filter((e)=>!e.markedForDel)
            if (Sprite.unloadedImages > 0) return;
            this.draw(this.ctx);
        }
        
    }
    handleBackground(){
        if (this.totalFrames % 32/this.speedModifier === 0) {
            let start = GameImage.perspectiveStartY
            this.backgroundElements.unshift(new GameImage("./images/tree.png",643*1.5,921*1.5,(this.width/2)+1000,start,40)) 
            this.backgroundElements.unshift(new GameImage("./images/tree.png",643*1.5,921*1.5,(this.width/2)-1000,start,40)) 
            this.backgroundElements[0].alpha = 0;
            this.backgroundElements[0].flipped = true;
            this.backgroundElements[1].alpha = 0;  
        }
        this.backgroundElements = this.backgroundElements.filter( e => {
            e.update();
            return !(e.percentTraveled>1)
        })
    }
    handleEnemies(){
        let center = this.width/2
        if (this.framesSinceCrossbowman > this.crossbowmanDelay) this.spawnCrossbowWave();
        else this.framesSinceCrossbowman ++;
        this.enemies = this.enemies.filter( e => {
            e.update();
            return !e.markedForDel
        })
    }
    spawnCrossbowWave() {
        let roadSide = Math.sign(Math.random()-0.5)  // use randomSign() funciton 
        if (this.enemiesDue > 0) {
            const newEnemy = new Crossbowman(this, this.width/2 - 500*roadSide)
            newEnemy.image.alpha = 0;
            if (roadSide === -1) newEnemy.image.flipped = true;
            this.enemies.unshift(newEnemy)
            this.framesSinceCrossbowman = 0;
            this.crossbowmanDelay = Math.random()*60+30
            this.enemiesDue -= 1
        } else {
            this.crossbowmanDelay += 200
            this.enemiesDue = 4
        }   
    }
    draw(ctx){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.drawStaticBackground(ctx);
        this.backgroundElements.forEach((e) => e.draw(ctx))
        this.enemies.forEach(e => e.draw(ctx))
        Projectile.activeProjectiles.forEach((e) => e.draw(ctx))
        this.player.draw(ctx)
        this.UI.draw(ctx);
    }
    drawStaticBackground(ctx){  //replace this image so im not making a new gradient every frame
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
}

class SoundEffect {
    constructor(fileSrc, volume){
        this.sound = new Audio()
        this.sound.volume = volume
        this.sound.src = fileSrc
    }
    play(){
        this.sound.play()
    }
}

class GameImage {
    static perpsectiveBaseWidth = 1000 
    static baseCenterX = canvas.width/2
    static perspectiveHeight = 800 
    static perspectiveBottomY = canvas.height
    static perspectiveTopY = GameImage.perspectiveBottomY - GameImage.perspectiveHeight
    static perspectiveStartPercentage = 0.25  
    static perspectiveStartY = GameImage.perspectiveTopY + (GameImage.perspectiveHeight * GameImage.perspectiveStartPercentage)
    static scrollSpeed = 8 
    
    static drawRoad(ctx){
        ctx.fillStyle = '#439544'
        ctx.fillRect(0, GameImage.perspectiveStartY, GameImage.baseCenterX*2, GameImage.perspectiveBottomY-GameImage.perspectiveStartY)
        ctx.beginPath()
        const perspectiveStartWidth = GameImage.perspectiveStartPercentage * GameImage.perpsectiveBaseWidth
        const point1X = GameImage.baseCenterX - perspectiveStartWidth/2
        const point2X = point1X + perspectiveStartWidth
        const point3X = GameImage.baseCenterX + GameImage.perpsectiveBaseWidth/2
        const point4X = point3X - GameImage.perpsectiveBaseWidth
        ctx.moveTo(point1X,GameImage.perspectiveStartY)
        ctx.lineTo(point2X,GameImage.perspectiveStartY)
        ctx.lineTo(point3X,GameImage.perspectiveBottomY)
        ctx.lineTo(point4X,GameImage.perspectiveBottomY)
        ctx.closePath()
        ctx.fillStyle = "#cfbd86"
        ctx.fill();
    }

    constructor(fileSrc, maxWidth, maxHeight, 
        PosXAtBase=GameImage.baseCenterX, StartingPerspectiveHeight=GameImage.perspectiveStartY, heightOffset = 0){
        this.image = new Image()
        this.image.src = fileSrc
        this.sx = 0
        this.sy = 0
        this.percentTraveled = ((StartingPerspectiveHeight)-GameImage.perspectiveTopY) / GameImage.perspectiveHeight 
        this.PosXAtBase = PosXAtBase
        this.relativeSpeed = 0
        this.maxWidth = maxWidth
        this.maxHeight = maxHeight
        this.maxHeightOffset = heightOffset
        this.maxCenterOffset = (PosXAtBase - GameImage.baseCenterX)
        this.dw = this.maxWidth * this.percentTraveled  
        this.dh = this.maxHeight * this.percentTraveled   
        this.dx = GameImage.baseCenterX - this.dw/2
        this.dy = StartingPerspectiveHeight - this.dh 
        this.heightTraveled = 0;
        this.angle = 0
        this.alpha = 1
        this.flipped = false;
        this.distanceFromBase = GameImage.perspectiveBottomY - StartingPerspectiveHeight  
        this.markedForDel = false;      
    }
    get centerX(){return this.dx+this.dw/2 + (this.maxCenterOffset * this.percentTraveled)}   
    get centerY(){return this.dy+this.dh/2 + (this.maxHeightOffset * this.percentTraveled)}
    get perspectiveHeight(){return this.dy+this.dh}
    get lane(){
            if (this.maxCenterOffset < -50) return "left"
            if (this.maxCenterOffset > 50) return "right"
            return "middle"
        }

    update(){
        this.moveWithPerspective();
        if (this.percentTraveled < 1) this.fadeAlpha(0.1) 
        else this.fadeAlpha(-0.1)
        if (this.percentTraveled > 1.15) this.markedForDel = true;
    }
    moveWithPerspective(){
        this.percentTraveled = ((this.perspectiveHeight)-GameImage.perspectiveTopY) / GameImage.perspectiveHeight
        if (this.percentTraveled > 1.5) return;
        const speed = (GameImage.scrollSpeed + this.relativeSpeed) * Math.pow(this.percentTraveled,2)
        this.distanceFromBase -= speed
        this.dw = this.percentTraveled * this.maxWidth
        this.dh = this.percentTraveled * this.maxHeight
        this.dy = (GameImage.perspectiveBottomY - this.distanceFromBase) - this.dh
        this.dx = GameImage.baseCenterX - this.dw/2
    }
    draw(ctx){
        const {image, sx, sy, sw, sh, dx, dy, dw, dh} = this;
        const heightOffset = this.maxHeightOffset * this.percentTraveled 
        const centerOffset = this.maxCenterOffset * this.percentTraveled
        ctx.save()
        if (this.flipped) this.flipHorizontal(ctx);    
        if (this.angle !== 0) this.rotate(ctx)
        this.drawShadow(ctx)
        ctx.globalAlpha = this.alpha
        if (this.sw && this.sh) ctx.drawImage(image, sx, sy, sw, sh, dx + centerOffset , dy + heightOffset, dw, dh)
        else ctx.drawImage(image, dx + centerOffset, dy + heightOffset, dw, dh)
        ctx.restore();
    }
    drawShadow(ctx){
        if (this.percentTraveled > 1.25) return;
        const centerX = this.centerX
        const centerY = this.perspectiveHeight - 10
        let sizeMulti = 1 + -this.maxHeightOffset/500
        if (sizeMulti < 1) sizeMulti = 1; 
        const alpha = 0.5 * (1/(Math.pow(sizeMulti,2)))
        ctx.beginPath()
        ctx.arc(centerX,centerY,this.dw * sizeMulti,0,2*Math.PI);
        const gradient = ctx.createRadialGradient(centerX, centerY, this.dw/5 * sizeMulti, centerX, centerY, this.dw/1.5 * sizeMulti)
        gradient.addColorStop(0, `rgba(0,0,0,${alpha})`)
        gradient.addColorStop(1, "rgba(0,0,0,0)")
        ctx.save()
        ctx.fillStyle = gradient
        ctx.translate(centerX, centerY)
        ctx.scale(1,0.3)
        ctx.translate(-centerX, -centerY)
        ctx.fill();
        ctx.restore()
    }
    rotate(ctx){
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

class Sprite extends GameImage{
    static unloadedImages = 0;
    constructor(spriteJson, maxWidth, maxHeight, heightOffset){
        super(`./images/${spriteJson.meta.image}`, maxWidth, maxHeight, GameImage.baseCenterX, GameImage.perspectiveBottomY, heightOffset)
        this.image.onload = (()=> Sprite.unloadedImages -= 1)
        Sprite.unloadedImages += 1
        this.offSetWidth = 0;
        this.offSetHeight = 0;
        this.frame = 0;
        this.sprite = spriteJson;
        this.frames = spriteJson.frames
        this.lastFrameIndex = this.frames.length-1
        this.loops = true;
    }
    update(){
        this.updateSourceDimensions()
        this.frame += 1;
        if (this.frame>this.frames.length-1) this.frame = this.loops ? 0 : this.frame-1;
    }
    updateSourceDimensions(){
        let frame = this.frames[this.frame].frame 
        this.sx = frame.x
        this.sy = frame.y 
        this.sw = frame.w
        this.sh = frame.h
    }
    drawShadow(){
        return;
    }
}

class Projectile extends GameImage {
    static activeProjectiles = [];
    constructor(fileSrc, maxHeight, maxWidth, PosXAtBase, StartingPerspectiveHeight, heightOffset, velTotal=0, velX=0, initialAngle=0, rotationSpeed=0){
        super(fileSrc, maxHeight, maxWidth, PosXAtBase, StartingPerspectiveHeight, heightOffset)
        this.velTotal = velTotal
        this.velX = velX
        this.velY = Math.sqrt(Math.pow(this.velTotal, 2) - Math.pow(this.velX, 2)) || 0
        this.angle = initialAngle
        this.rotationSpeed = rotationSpeed //full rotations per frame
        this.gravity = 1.5; //pixel-per-frame velY that is lost each frame (when obj is at max closeness in perspective)
    }
    update(){
        this.maxCenterOffset += this.velX
        this.maxHeightOffset -= this.velY
        this.velY -= this.gravity
        this.angle += this.rotationSpeed*Math.PI*2   
    }
    drawShadow(){
        return;
    } 
}
class BlockedArrow extends Projectile {
    constructor(posX,heightOffset,velTotal,velX){
        super('./images/arrow.png',
            40*0.5, 150*0.5, posX, GameImage.perspectiveBottomY, heightOffset, velTotal, 
            velX, 3.14*Math.sign(velX), randomValue(0.001,0.005)*velX)
        this.gravity = 3
        this.alpha = 1
        this.sfx = new SoundEffect(`./sounds/clank/${Math.floor(Math.random()*5)}.wav`,0.2)
        this.sfx.play();  
    }
    update(){
        super.update()
        this.velX -= 0.5*Math.sign(this.velX)
        if (this.maxHeightOffset > 50) this.fadeAlpha(-0.2)
        if (this.alpha === 0) this.markedForDel = true;
    }
}

class FiredArrow extends Projectile {
    constructor(PosXAtBase, StartingPerspectiveHeight, heightOffset, player){
        super('./images/fired_arrow.png', 50, 100, PosXAtBase, StartingPerspectiveHeight+10, heightOffset,0, 
            -40*Math.sign(PosXAtBase - GameImage.baseCenterX),0.25*Math.sign(PosXAtBase - GameImage.baseCenterX))
        this.gravity = 0;
        this.velY = 1
        this.relativeSpeed = 160
        this.player = player
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
            Projectile.activeProjectiles.push(new BlockedArrow(arrowDestinationX,-300, 45, randomValue(15,25)*velocityDirection))
        } else this.player.receiveAttack(this)
        
    }
}

class DroppedCrossbow extends Projectile {
    constructor(PosXAtBase, StartingPerspectiveHeight, heightOffset, flipped){
        super('./images/crossbow.png', 250*0.8, 141*0.8, PosXAtBase, StartingPerspectiveHeight, heightOffset, 10, 0)
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
        if (this.percentTraveled > 1.15) this.markedForDel = true
    }
}

class BloodSpurt extends Projectile {
    constructor(PosXAtBase, StartingPerspectiveHeight, heightOffset){
        super (`./images/blood/${Math.floor(Math.random()*2+1)}.png`,
            50, 50, PosXAtBase, StartingPerspectiveHeight, heightOffset, randomValue(3,15), 
            randomValue(-3,6), 0, 0)
        this.gravity = 0.8;
        this.relativeSpeed = this.velTotal/3
    }
    update(){
        super.update()
        this.moveWithPerspective();
        this.fadeAlpha(-0.01)
        if (this.alpha === 0) this.markedForDel = true
        if (this.maxHeightOffset > 0){
            this.maxHeightOffset = 0;
            this.velX = 0;
            this.relativeSpeed = 0
        }
    }
}

class PlayerBloodSpurt extends Projectile {
    constructor(PosXAtBase){
        super (`./images/blood/${Math.floor(Math.random()*2+1)}.png`,
            50, 50, PosXAtBase, GameImage.perspectiveBottomY, -150, randomValue(5,15), 
            randomValue(-5,5), 0, 0)
        this.alpha = 0.75
        this.relativeSpeed = this.velY * randomValue(0,1)
        this.streakOnScreen = GameImage.scrollSpeed+this.relativeSpeed > 0
        this.velY = this.streakOnScreen ? randomValue(0,5) : this.velY
        this.gravity = 0.1
    }
    update(){
        super.update()
        this.moveWithPerspective();
        if (this.streakOnScreen) {
            this.relativeSpeed = -6
            this.velX *= 0.95
            this.fadeAlpha(-0.02)
        } else {
            this.fadeAlpha(-0.02)
            if (this.maxHeightOffset > 0){
            this.maxHeightOffset = 0;
            this.velX = 0;
            this.relativeSpeed = 0
        }
        }
        if (this.alpha === 0) this.markedForDel = true
        
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

class Ball extends Projectile {
    constructor(){
        super(`./images/football.png`,120,120,
                650, 700, -300, 0,0)
        this.velY = 0
        this.velX = 0
        this.velZ = 0
        this.gravity = 3
    }
    update(){
        this.moveWithPerspective();
        this.maxHeightOffset -= this.velY
        this.maxCenterOffset += this.velX
        this.relativeSpeed = -this.velZ
        if (this.maxHeightOffset < 0) {
            this.velY -= this.gravity
        }
        else {
            this.maxHeightOffset = 0;
            this.velY *= -0.8
            this.velY -= 5
            this.velZ -= 0.25
            this.velX -= 0.1 * Math.sign(this.velX)
            if (this.velY < 0.5) this.velY = 0
        }
        
        if (this.velZ > 0.1){
            this.airResist = Math.pow(this.velZ,2)/2000 
            this.velZ -= this.airResist
        } else this.velZ = 0
        if (Math.abs(this.velX) > 0.1){
            this.airResist = Math.pow(this.velX,2)/2000 * Math.sign(this.velX)
            this.velX -= this.airResist
        } else this.velX = 0

        if (this.percentTraveled > 1){
            this.velY = 40*randomValue(1,1.5)
            this.velZ = 90-this.velY
            this.velX = randomValue(-10,10)
        }
        
    }
}


class Enemy{
    constructor(game, baseImageSrc, maxWidth, maxHeight, PosXAtBase, StartingPerspectiveHeight){
        this.image = new GameImage(baseImageSrc, maxWidth, maxHeight, PosXAtBase, StartingPerspectiveHeight)
        this.game = game
        this.markedForDel = false;
        this.sfx = {}
    }
    get lane(){
        return this.image.lane
    }
    spawnCoins(amount){
        const {PosXAtBase,perspectiveHeight,maxHeight} = this.image
        for (let i = 0; i < amount; i++) {
           this.game.UI.spawnCoin(PosXAtBase,perspectiveHeight,-maxHeight/2) 
        } 
    }
    
}

class Crossbowman extends Enemy {
    constructor(game, PosXAtBase, StartingPerspectiveHeight){
        super(game, './images/gaurd_nobolt.png', 321*0.8, 604*0.8, PosXAtBase, StartingPerspectiveHeight)
        this.alpha = 0;
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
        if (this.state === this.states.unloaded) this.fadeAlpha(1/6)
        if (this.state === this.states.dead) {
            this.deathCounter += 1
            if (this.deathCounter > 30) this.fadeAlpha(-0.1)
        }
        if (this.percentTraveled > 1.15) this.markedForDel = true;
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
        const {PosXAtBase,perspectiveHeight,maxHeight} = this.image
        Projectile.activeProjectiles.push(new FiredArrow(PosXAtBase,perspectiveHeight,-maxHeight/2, this.game.player))
        
    }
    receiveAttack(){
        if (this.state === "dead") return;
        this.state = "dead"
        this.image.swapImage('./images/gaurd_dead_bloody.png')
        this.sfx.death.play();
        this.sfx.death2.play();
        const {PosXAtBase,perspectiveHeight,maxHeight, flipped} = this.image
        Projectile.activeProjectiles.push(new DroppedCrossbow(PosXAtBase, perspectiveHeight, -maxHeight/2, flipped))
        for (let index = 0; index < 40; index++) {
            Projectile.activeProjectiles.push(new BloodSpurt(PosXAtBase, perspectiveHeight, -maxHeight/2))    
        }
        this.spawnCoins(5)
    }
    fadeAlpha(num){
        this.image.fadeAlpha(num)
    }
    draw(ctx){
        this.image.draw(ctx);
    }
}

class Pikeman extends Enemy {
    constructor(posX){
        //super()
    }
}

class Player{
    constructor(game,sprites){
        this.block = sprites.block
        this.attack = sprites.attack
        this.block.alpha = 0;
        this.attack.alpha = 0;
        this.game = game;
        this.states = { blocking: new Blocking(this), attacking: new Attacking(this)}
        this.lane = this.game.lanes["middle"]
        this.state = this.states.blocking;
        this.angleCounter = 0;
        this.bounceOffset = 0
        this.recoveryOffset = 0
        this.sfx = {hurt:[new SoundEffect(`./sounds/player_hurt/1.wav`,0.1), new SoundEffect(`./sounds/player_hurt/2.wav`,0.1),
                        new SoundEffect(`./sounds/player_hurt/3.wav`,0.1), new SoundEffect(`./sounds/player_hurt/4.wav`,0.1)]}

    }
    update(input){
        this.state.update(input);
        this.addBounce()
    }
    draw(ctx){
        this.attack.draw(ctx)
        this.block.maxHeightOffset += this.bounceOffset
        this.block.draw(ctx)
        this.block.maxHeightOffset -= this.bounceOffset
    }
    addBounce() {
        this.angleCounter += 1/10
        let mod = 20
        let unmodBounceOffset = Math.sin(this.angleCounter)
        if (this.recoveryOffset > 1) {
            this.recoveryOffset -=  2 * (this.recoveryOffset/20)
            mod *= (1/this.recoveryOffset)
        } else this.recoveryOffset = 0
        if (unmodBounceOffset > 0) mod *= -1
        this.bounceOffset = unmodBounceOffset * mod * this.game.speedModifier + this.recoveryOffset
        
    }
    changeState(state){
        this.state.exit();
        this.state = this.states[state]
        this.state.enter();
    }
    receiveAttack(source){
        console.log(source.lane)
        let sfxChoice = Math.floor(randomValue(0,4))
        this.sfx.hurt[sfxChoice].play();
        for (let index = 0; index < 30; index++) {
            Projectile.activeProjectiles.push(new PlayerBloodSpurt(source.centerX))  
        }
        this.recoveryOffset = 80
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
        this.sprite.updateSourceDimensions();
        this.frameIncrement = 1;
        this.frameQueue = [18];
        this.positionInQueue = 0;
        this.frameDestinations = {'middle':18, 'left':0, 'right':35} 
        this.middleSkipRange = [12,26] 
        this.earlyFramesToSkip = 5
        this.inputDelayCounter = 0;
        this.lastInput = 'middle'
    }
    enter(){
        this.sprite.alpha = 0;
    }
    exit(){
        this.inputDelayCounter = 0;
        this.updateLane();
    }
    update(input){
        this.player.attack.fadeAlpha(-0.2)
        this.sprite.fadeAlpha(0.2)
        if (input === 'attack'){
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
        if (this.positionInQueue !== this.frameQueue.length) this.sprite.frame = this.frameQueue[this.positionInQueue++]
        this.sprite.updateSourceDimensions()
        this.updateLane()
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
        this.activeFrameRange = [15,20]
        this.game = this.player.game
    }
    enter(){
        this.sprite.alpha = 0;
        this.sprite.frame = 0;
        this.sprite.updateSourceDimensions()
    }
    update(){
        this.player.block.fadeAlpha(-0.2)
        this.sprite.fadeAlpha(0.2)
        this.checkCollision();
        const attack = this.sprite
        if (attack.frame === 0) {
            this.attackDirection = this.input;
        }
        attack.frame++;
        
        if (attack.frame === attack.frames.length-1) {
            this.player.changeState("blocking")
        }
        attack.updateSourceDimensions()
        this.angleAttack();
    }
    checkCollision(){
        if (this.sprite.frame < this.activeFrameRange[0] || 
            this.sprite.frame > this.activeFrameRange[1]) return;
        this.game.enemies.forEach((e)=>{
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

async function fetchSprites(){
    let sprites = {}
    const [atkRep, blockRep, parchmentRep] = await Promise.all([
        fetch("./sword-attack-v2-compressed.json"),
        fetch("./sword48.json"),
        fetch("./parchment.json")])
    await atkRep.json().then((sprite) => sprites.attack = new Sprite(sprite, 534*0.8, 871*0.8, 200));
    await blockRep.json().then((sprite) => sprites.block = new Sprite(sprite, 842, 609));
    await parchmentRep.json().then((sprite) => sprites.parchment = new Sprite(sprite, 850, 140));
    startGame(sprites);
};

function startGame(sprites){ 
    const game = new Game(ctx, canvas.width, canvas.height, sprites)
    animate(0,game);  
}
function animate(timestamp, game){
    game.update(timestamp, keyRecord, touchRecord)
    
    requestAnimationFrame((timestamp)=>{
        
        animate(timestamp, game)
    })
}


