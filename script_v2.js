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
        this.enemies = [];
        this.projectiles = [];
        this.scrollingElements = [];
        this.firedArrows = []
        this.fpsSlider = document.getElementById("fps")
        this.input;
        //this.testBall = new Ball()
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
            //this.player.update_test(this.input)
            this.player.update(this.input)
            this.totalFrames++;
            this.handleEnemies();
            this.handleBackground();
            this.projectiles.forEach((e) => e.update())
            this.projectiles = this.projectiles.filter((e)=>e.percentTraveled < 1.2)
            
            this.updatePerpective()
            this.draw(this.ctx);
            
        }
    }
    handleBackground(){
        if (this.totalFrames % 32/this.speedModifier === 0) {
            let scale = 1.5
            let centerX = this.width/2
            this.scrollingElements.unshift(new GameImage("./images/tree.png",643*scale,921*scale,centerX+1000,undefined,40)) 
            this.scrollingElements.unshift(new GameImage("./images/tree.png",643*scale,921*scale,centerX-1000,undefined,40))
            this.scrollingElements[0].alpha = 0;
            this.scrollingElements[0].flipped = true;
            this.scrollingElements[1].alpha = 0;    
        }
    }
    handleEnemies(){
        let center = this.width/2
        if (this.framesSinceCrossbowman > this.crossbowmanDelay) this.spawnCrossbowWave();
        else this.framesSinceCrossbowman ++;
        this.enemies.forEach((e)=> {
            
            e.update()
        });
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
    
    
    updatePerpective(){
        this.enemies.forEach((e) => {
            e.image.moveWithPerspective()
            if (e.image.percentTraveled < 1) e.image.fadeAlpha(0.1)
            else e.image.fadeAlpha(-0.1)
        })
        this.scrollingElements.forEach((e) => {
            e.moveWithPerspective()
            if (e.percentTraveled < 1) e.fadeAlpha(0.1)
            else e.fadeAlpha(-0.1)
        })
        this.enemies = this.enemies.filter((e) => e.image.percentTraveled < 1.1)
        this.scrollingElements = this.scrollingElements.filter((e) => e.percentTraveled < 1)
        
    }
    draw(ctx){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.drawStaticBackground(ctx);
        
        this.scrollingElements.forEach((e) => e.draw(ctx))
        this.enemies.forEach((e) => e.draw(ctx))
        this.projectiles.forEach((e)=>e.draw(ctx))                    
        this.player.draw(ctx);
        
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
        //if (frameTime > 30) console.log(frameTime, "ms --- high frame time warning")
        return framesDue;
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
        basePosX=GameImage.baseCenterX, basePosY=GameImage.perspectiveStartY, heightOffset = 0){
        this.image = new Image()
        this.image.src = fileSrc
        this.sx = 0
        this.sy = 0
        this.percentTraveled = ((basePosY)-GameImage.perspectiveTopY) / GameImage.perspectiveHeight 
        this.maxCenterOffset = (basePosX - GameImage.baseCenterX)
        this.maxSpeed = GameImage.scrollSpeed
        this.maxWidth = maxWidth
        this.maxHeight = maxHeight
        this.maxHeightOffset = heightOffset
        this.dw = this.maxWidth * this.percentTraveled  
        this.dh = this.maxHeight * this.percentTraveled   
        this.dx = GameImage.baseCenterX - this.dw/2
        this.dy = basePosY - this.dh 
        this.heightTraveled = 0;
        this.angle = 0
        this.alpha = 1
        this.shadow = {};
        this.flipped = false;
        this.sway = 0;
        this.bounce = 0;
        this.distanceFromBase = GameImage.perspectiveBottomY - basePosY        
    }
    get centerX(){return this.dx+this.dw/2 + (this.maxCenterOffset * this.percentTraveled)}   
    get centerY(){return this.dy+this.dh/2 + (this.maxHeightOffset * this.percentTraveled)}
    get baseY(){return this.dy+this.dh}


    moveWithPerspective(){
        this.percentTraveled = ((this.baseY)-GameImage.perspectiveTopY) / GameImage.perspectiveHeight
        if (this.percentTraveled > 1.5) return;
        const speed = this.maxSpeed * Math.pow(this.percentTraveled,2)
        this.distanceFromBase -= speed
        this.dw = this.percentTraveled * this.maxWidth
        this.dh = this.percentTraveled * this.maxHeight
        this.dy = (GameImage.perspectiveBottomY - this.distanceFromBase) - this.dh
        this.dx = GameImage.baseCenterX - this.dw/2
    }
    draw(ctx){
        const {image, sx, sy, sw, sh, dx, dy, dw, dh} = this;
        const heightOffset = this.maxHeightOffset * this.percentTraveled // note: might need to incorporate these back in to the calcs for dx,dy
        const centerOffset = this.maxCenterOffset * this.percentTraveled // and just call moveWithPerspective on all items every time (just raising their height to counteract)
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
        const centerY = this.baseY - 10
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
    imageSwap(imageSrc){
        const newImage = new Image()
        newImage.onload = () => this.image = newImage
        newImage.src = imageSrc
    }
    
    
}

class Sprite extends GameImage{
    constructor(sprite, maxWidth, maxHeight, heightOffset){
        super(`./images/${sprite.meta.image}`, maxWidth, maxHeight, GameImage.baseCenterX, GameImage.perspectiveBottomY, heightOffset)
        this.offSetWidth = 0;
        this.offSetHeight = 0;
        this.frame = 0;
        this.sprite = sprite;
        this.frames = sprite.frames
    }
    update(){
        this.frame += 1;
        if (this.frame>this.frames.length-1) this.frame = 0;
        this.updateSourceDimensions()
    }
    updateSourceDimensions(){
        let frame = this.frames[this.frame].frame 
        this.sx = frame.x
        this.sy = frame.y 
        this.sw = frame.w
        this.sh = frame.h
        // this.dx = this.heightTraveled ? this.dx + this.offSetWidth + this.sway : this.offSetWidth + this.sway 
        // this.dy = this.heightTraveled ? this.dx + this.offSetHeight + this.bounce : this.offSetHeight + this.bounce
    }
    drawShadow(){
        return;
    }
}

class Projectile extends GameImage {
    constructor(fileSrc, maxHeight, maxWidth, basePosX, basePosY, heightOffset, velTotal, velX, initialAngle=0, rotationSpeed=0){
        super(fileSrc, maxHeight, maxWidth, basePosX, basePosY, heightOffset)
        this.velTotal = velTotal
        this.velX = velX
        this.velY = Math.sqrt(Math.pow(this.velTotal, 2) - Math.pow(this.velX, 2)) || 0
        this.angle = initialAngle
        this.rotationSpeed = rotationSpeed //full rotations per frame
        this.gravity = 1.5; //pixel-per-frame velY that is lost each frame (when obj is at max closeness in perspective)
        this.markForDelete = false;
    }
    update(){
        this.maxCenterOffset += this.velX
        this.maxHeightOffset -= this.velY
        this.velY -= this.gravity
        this.angle += this.rotationSpeed*Math.PI*2   
    }   
}
class BlockedArrow extends Projectile {
    constructor(posX,heightOffset,velTotal,velX){
        super('./images/arrow.png',
            40*0.5, 150*0.5, posX, GameImage.perspectiveBottomY, heightOffset, velTotal, 
            velX, 3.14*Math.sign(velX), randomValue(0.05,0.08)*Math.sign(velX))
        this.gravity = 3
        this.alpha = 1
        this.sfx = new Audio()
        this.sfx.src = `./sounds/clank/${Math.floor(Math.random()*5)}.wav`
        this.sfx.volume = 0.1;
    }
    drawShadow(){
        return
    }
}

class FiredArrow extends Projectile {
    constructor(basePosX, basePosY, heightOffset){
        super('./images/fired_arrow.png', 50, 100, basePosX, basePosY+10, heightOffset,0, 
            -40*Math.sign(basePosX - GameImage.baseCenterX),0.25*Math.sign(basePosX - GameImage.baseCenterX))
        this.gravity = 0;
        this.velY = 1
        this.maxSpeed = 160
    }
    update(){
        super.update();
        this.moveWithPerspective();
    }
    drawShadow(){
        return
    }

}


class Crossbow extends Projectile {
    constructor(basePosX, basePosY, heightOffset){
        super('./images/crossbow.png', 250*0.8, 141*0.8, basePosX, basePosY, heightOffset, 10, 0)
    }
    update(){
        super.update();
        if (this.maxHeightOffset >= 0){
            this.maxHeightOffset = 0;
            this.velX = 0;
        }
        this.moveWithPerspective();
    }
    drawShadow(){
        return;
    }
}

class BloodSpurt extends Projectile {
    constructor(basePosX, basePosY, heightOffset){
        super (`./images/blood/${Math.floor(Math.random()*2+1)}.png`,
            50, 50, basePosX, basePosY, heightOffset, randomValue(3,15), 
            randomValue(-3,6), 0, 0)
        this.gravity = 0.8;
        this.maxSpeed = GameImage.scrollSpeed+(this.velTotal/3)
    }
    update(){
        super.update()
        this.fadeAlpha(-0.02)
        if (this.maxHeightOffset >= 0){
            this.maxHeightOffset = 0;
            this.velX = 0;
            this.maxSpeed = GameImage.scrollSpeed
        }
        this.moveWithPerspective();
    }
    drawShadow(){
        return
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
        this.maxSpeed = GameImage.scrollSpeed - this.velZ
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
    constructor(game, baseImageSrc, maxWidth, maxHeight, basePosX, basePosY){
        this.image = new GameImage(baseImageSrc, maxWidth, maxHeight, basePosX, basePosY)
        this.game = game
    }
    
}

class Crossbowman extends Enemy {
    constructor(game, basePosX, basePosY){
        super(game, './images/gaurd_nobolt.png', 321*0.8, 604*0.8, basePosX, basePosY)
        this.bloodSpurts = [];
        this.droppedCrossbows = [];
        this.firedArrows = [];
        this.blockedArrows = [];//note to self: may have to store projectiles in class as static value, so i can draw them all at once after enemy calls
        this.States = { Unloaded: "unloaded",
                        Loaded: "loaded",
                        Attacked: "attacked", 
                        Dead: "dead"}
        this.state = "unloaded"
        this.lane = this.image.maxCenterOffset < 0 ? "left" : "right"
        this.loadSound = new Audio()
        this.deathSound = new Audio()
        this.bloodSound = new Audio()
        this.loadSound.src = `./sounds/crossbow_load.ogg`
        this.deathSound.src = `./sounds/death/${Math.floor(Math.random()*5)}.ogg`
        this.bloodSound.src = `./sounds/gore/${Math.floor(Math.random()*3)}.wav`
        this.loadSound.volume = 0.15
        this.deathSound.volume = 0.3
        this.bloodSound.volume = 0.3
    }
    update(){
        if (this.image.percentTraveled > 0.35 && this.state === "unloaded") this.loadCrossbow()
        if (this.image.percentTraveled > 0.4 && this.state === "loaded") this.attack();
        this.updateFiredArrows();
        this.bloodSpurts.forEach( e => {
            e.update()
        })

        this.bloodSpurts = this.bloodSpurts.filter( e => e.alpha > 0)
        this.droppedCrossbows.forEach( e => e.update())
        this.blockedArrows.forEach(e => e.update())
        this.blockedArrows = this.blockedArrows.filter((e)=>e.percentTraveled < 1.2)
        this.droppedCrossbows = this.droppedCrossbows.filter( e => e.percentTraveled < 1.1)
    }
    loadCrossbow(){
        this.state = "loaded"
        this.image.imageSwap('./images/gaurd_loaded.png')   
        this.loadSound.play();
    }
    attack(){    
        this.state = "attacking"
        this.image.imageSwap('./images/gaurd_nobolt.png')
        const x = this.game.width/2 + this.image.maxCenterOffset
        const y = this.image.baseY
        const heightOffset = -this.image.maxHeight/2 
        const arrow = new FiredArrow(x,y,heightOffset)
        this.firedArrows.push(arrow)
    }
    receiveAttack(){
        if (this.state === "dead") return;
        this.state = "dead"
        this.image.imageSwap('./images/gaurd_dead_nocrossbow.png')
        this.deathSound.play();
        this.bloodSound.play();
        const x = GameImage.baseCenterX + this.image.maxCenterOffset
        const y = this.image.baseY
        const heightOffset = -this.image.maxHeight/2 
        const crossbow = new Crossbow(x-(50*Math.sign(this.image.maxCenterOffset)), y+20, heightOffset)
        crossbow.flipped = this.image.flipped
        this.droppedCrossbows.push(crossbow)
        for (let index = 0; index < 60; index++) {
            this.bloodSpurts.push(new BloodSpurt(x, y, heightOffset))    
        }
    }
    updateFiredArrows(){
        this.firedArrows.forEach((e) => {
            const player = this.game.player
            e.update()
            if (e.percentTraveled > 0.8 &&
                player.lane === this.lane &&
                player.state === player.states["blocking"]) {
                let velocityDirection = -Math.sign(e.velX)
                let arrowDestinationX = this.game.width/2 + velocityDirection*150
                let newArrow = new BlockedArrow(arrowDestinationX,-300, 45, randomValue(5,20)*velocityDirection)
                newArrow.sfx.play();
                this.blockedArrows.push(newArrow)
                e.markForDelete = true
            } 
            if (e.percentTraveled > 0.9){
                e.markForDelete = true
            }
            
        })
        this.firedArrows = this.firedArrows.filter(e=>!(e.markForDelete))
    }
    draw(ctx){
        this.image.draw(ctx);
        this.droppedCrossbows.forEach( e =>  e.draw(ctx))
        this.bloodSpurts.forEach( e => e.draw(ctx))
        this.firedArrows.forEach((e)=>e.draw(ctx))
        this.blockedArrows.forEach((e)=>e.draw(ctx)) 
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
        this.isAttacking = false;
    }
    update(input){
        this.state.update(input);
    }
    draw(ctx){
        this.attack.draw(ctx)
        this.block.draw(ctx)
    }
    updateBounceSway() {
        this.counter ++;
        let bounceModifier = Math.sin(this.counter / 7.5) * 15;
        let swayModifier = Math.cos(this.counter / 15) * 10;
        if (bounceModifier > 0) bounceModifier *= -1;
        if (swayModifier > 0) swayModifier *= -1;
        this.block.sway = this.attack.sway = swayModifier;
        this.block.bounce = this.attack.bounce = bounceModifier;
    }
    changeState(state){
        this.state.exit();
        this.state = this.states[state]
        this.state.enter();
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
            if (inRange && e.lane === this.player.lane){
                e.receiveAttack();
            } else if (inRange){
                console.log(e.lane)
                console.log(this.player.lane)
            }
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
    const [atkRep, blockRep] = await Promise.all([
        fetch("./sword-attack-v2-compressed.json"),
        fetch("./sword48.json")])
    await atkRep.json().then((sprite) => sprites.attack = new Sprite(sprite, 534*0.8, 871*0.8, 200));
    await blockRep.json().then((sprite) => sprites.block = new Sprite(sprite, 842, 609));
    startGame(sprites);
};

function startGame(sprites){ 
    const game = new Game(ctx, canvas.width, canvas.height, sprites)
    animate(0,game);  
}
function animate(timestamp, game){
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.update(timestamp, keyRecord, touchRecord)
    requestAnimationFrame((timestamp)=>{
        
        animate(timestamp, game)
    })
}


