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

class Input{
    constructor(keyRecord, touchRecord){
        this.keys = keyRecord
        this.touchs = touchRecord
    }
}



class Game{
    constructor(ctx, width, height, player){
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
        this.player = player
        this.enemies = [];
        this.projectiles = [];
        this.scrollingElements = [];
        this.firedArrows = []
        this.fpsSlider = document.getElementById("fps")
        //this.testBall = new Ball()
    }
    update(timestamp, keyRecord, touchRecord){
        if (!document.fullscreenElement) {
            document.getElementById("resume-btn").classList.remove("disabled")
            return
        }
        const framesDue = this.getFramesDue(timestamp)
        if (framesDue !== 0) {
            this.totalFrames++;
            this.handleEnemies();
            this.handleBackground();
            this.projectiles.forEach((e) => e.update())
            this.projectiles = this.projectiles.filter((e)=>e.percentTraveled < 1.2)
            this.player.update(keyRecord, touchRecord)
            this.updatePerpective()
            this.updateFiredArrows()
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
            const inRange = e.image.percentTraveled > 0.63 && e.image.percentTraveled < 0.9
            if (inRange){
                if (e.image.flipped && this.player.state.attack === 'd') e.recieveAttack();
                if (!e.image.flipped && this.player.state.attack === 'a') e.recieveAttack();
            }
            if(e.image.percentTraveled > 0.4 && e.state === "loaded") {
                e.attack();
                this.fireAtPlayer(e);
            }
            e.update()
        });
    }
    spawnCrossbowWave() {
        let roadSide = Math.sign(Math.random()-0.5)  // use randomSign() funciton 
        if (this.enemiesDue > 0) {
            const newEnemy = new Crossbowman(this.width/2 - 500*roadSide)
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
    fireAtPlayer(enemy){
        const x = this.width/2 + enemy.image.maxCenterOffset
        const y = enemy.image.baseY
        const heightOffset = -enemy.image.maxHeight/2 
        const arrow = new FiredArrow(x,y,heightOffset)
        this.firedArrows.push(arrow)
    
    }
    updateFiredArrows(){
        this.firedArrows.forEach((e) => {
            e.update()
            if (e.percentTraveled > 0.8) {
                e.markForDelete = true
                let velocityDirection = -1;
                let direction = 'a'
                if (Math.sign(e.maxCenterOffset) > 0){
                    velocityDirection = 1
                    direction = 'd'
                }
                if (this.player.state.block === direction) {
                    let arrowDestinationX = this.width/2 + velocityDirection*150
                    let newArrow = new BlockedArrow(arrowDestinationX,-300, 45, randomValue(5,20)*velocityDirection)
                    this.projectiles.push(newArrow)
                    
                } else {
                    console.log("didnt block")
                }
            }
        })
        this.firedArrows = this.firedArrows.filter(e=>!(e.markForDelete))
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
        console.log(this.scrollingElements.length)
    }
    draw(ctx){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.drawStaticBackground(ctx);
        
        this.scrollingElements.forEach((e) => e.draw(ctx))
        this.enemies.forEach((e) => e.draw(ctx))
        this.projectiles.forEach((e)=>e.draw(ctx))
        this.firedArrows.forEach((e)=>e.draw(ctx))                    
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
        if (this.percentTraveled > 1.25) return;
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
       

        //ctx.globalAlpha = this.shadow.alpha
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
    fadeShadowAlpha(increment){
        if (increment === 0) return;
        let alpha = this.shadowAlpha + increment
        if (alpha > 1) alpha = 1;
        if (alpha < 0) alpha = 0;
        this.shadowAlpha = alpha;
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
    }
    update(){
        super.update()
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

class Spark extends Projectile{
    constructor(basePosX, basePosY, heightOffset, velX){
        super('./images/spark.png',30,70,basePosX,basePosY,heightOffset+20,30, velX)
        this.angle = this.initialAngle = Math.tan(this.velX/this.velY)
        //this.velY *= randomSign()
        this.gravity = 0
        this.counter = 0;

    }
    update(){
        super.update()
        this.counter++
        this.velX *= 0.5
        this.velY *= 0.5 
        if (this.counter > 5) {
            this.fadeAlpha(-0.33)
            this.dh *= 0.6
        }
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
    constructor(baseImageSrc, maxWidth, maxHeight, basePosX, basePosY){
        this.image = new GameImage(baseImageSrc, maxWidth, maxHeight, basePosX, basePosY)
        
    }
    
}

class Crossbowman extends Enemy {
    constructor(basePosX, basePosY){
        super('./images/gaurd_nobolt.png', 321*0.8, 604*0.8, basePosX, basePosY)
        this.bloodSpurts = [];
        this.droppedCrossbows = [];
        this.inSightOfTarget = false;
        this.States = { Unloaded: "unloaded",
                        Loaded: "loaded",
                        Attacked: "attacked", 
                        Dead: "dead"}
        this.state = "unloaded"
    }
    update(){
        if (this.image.percentTraveled > 0.35 && this.state === "unloaded") this.loadCrossbow()
        this.bloodSpurts.forEach( e => {
            e.update()
        })

        this.bloodSpurts = this.bloodSpurts.filter( e => e.alpha > 0)
        this.droppedCrossbows.forEach( e => {
            e.update()
        })
        this.droppedCrossbows = this.droppedCrossbows.filter( e => e.percentTraveled < 1.1)
    }
    loadCrossbow(){
        this.state = "loaded"
        this.image.imageSwap('./images/gaurd_loaded.png')   
    }
    attack(){    
        this.state = "attacking"
        this.image.imageSwap('./images/gaurd_nobolt.png')
    }
    recieveAttack(){
        if (this.state === "dead") return;
        this.state = "dead"
        this.image.imageSwap('./images/gaurd_dead_nocrossbow.png')
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
    draw(ctx){
        this.image.draw(ctx);
        this.droppedCrossbows.forEach( e =>  e.draw(ctx))
        this.bloodSpurts.forEach( e => e.draw(ctx))
    }
}

class Pikeman extends Enemy {
    constructor(posX){
        //super()
    }
}


class Player{
    constructor(sprites){
        this.health = 1;
        this.block = sprites.block
        this.counter = 0;
            this.block.frame = 18;
            this.block.updateSourceDimensions();
            this.block.frameIncrement = 1;
            this.block.frameQueue = [18];
            this.block.positionInQueue = 0;
            this.block.frameDestinations = {'none':18, 'a':0, 'd':35} 
            this.block.middleSkipRange = [12,26] 
            this.block.earlyFramesToSkip = 5
            this.block.inputDelayCounter = 0;
            this.sway = 0;
            this.bounce = 0;
        this.attack = sprites.attack
            this.attack.frame = 0;
            this.attack.updateSourceDimensions();
            this.attack.direction = 'none'
            this.block.inputDelayCounter = 0;
        this.input = 'none'
        this.attackInput = true;
        this.isAttacking = false;
        this.state = {block:false, attack:false}
    }
    readKeyboard(keyRecord){
        let newInput;
        if (keyRecord.length === 0) this.input = 'none'
        else if (!keyRecord.includes(this.Input)){
            newInput = 'none'
            if (keyRecord.includes('a')) newInput = 'a'
            if (keyRecord.includes('d')) newInput = 'd'
            this.input = newInput;
        }
        if(keyRecord.includes(" ")) this.attackTransition()   
    }
    readTouch(touchRecord){
        if (Object.keys(touchRecord).length === 0) return;
        const touch0 = touchRecord.touch0
        const touch1 = touchRecord.touch1
        const lastTouch = touch1 || touch0
        const lastTouchX = lastTouch.x[lastTouch.x.length-1]
        let newInput = 'none'
        if (lastTouchX < window.innerWidth/3) newInput = 'a'
        if (lastTouchX > window.innerWidth*(2/3)) newInput = 'd'
        if (touchRecord.touch0 && touchRecord.touch1) newInput = 'none'
        this.input = newInput
        if (touch0 && touch0.y[touch0.y.length-2] - touch0.y[touch0.y.length-1] > 15) this.attackTransition();
        else if (touch1 && touch1.y[touch1.y.length-2] - touch1.y[touch1.y.length-1] > 15)  this.attackTransition();
    }
    update(keyRecord, touchRecord){
        this.readKeyboard(keyRecord)
        this.readTouch(touchRecord)
        this.updateBounceSway()
        this.isAttacking ? this.updateAttack() : this.updateBlock();
        this.setState();
    }
    draw(ctx){
        if (this.isAttacking) {
            ctx.save()
            this.directAttack(ctx)
            this.attack.draw(ctx)
            ctx.restore();
            this.block.fadeAlpha(-0.2)
        } else {
            this.block.fadeAlpha(0.2);
            this.attack.alpha = 0;
        }
        this.block.draw(ctx);
        
    }
    attackTransition(){
        this.isAttacking = true;
        
    }
    updateAttack(){
        const attack = this.attack
        if (attack.frame === 0) {
            this.attackDirection = this.input;
        }
        attack.frame++;
        if (attack.frame < 10) attack.fadeAlpha(0.2)
        if(attack.frame > 20) attack.fadeAlpha(-0.2)
        if (attack.frame === attack.frames.length) {
            attack.frame = 0; 
            this.isAttacking = false;
        }

        attack.updateSourceDimensions()
    };
    updateBlock(){
        const block = this.block;
        if (--block.inputDelayCounter >= 0) this.input = block.oldInput
        if (this.input !== block.oldInput) {
            block.inputDelayCounter = 4;
            this.makeFrameQueue(block, this.input)
        }
        block.oldInput = this.input;
        if (block.positionInQueue !== block.frameQueue.length) block.frame = block.frameQueue[block.positionInQueue++]
        block.updateSourceDimensions()
    }
    makeFrameQueue(sprite, newInput){
        sprite.frameQueue = [];
        sprite.positionInQueue = 0;
        let frameEnd = sprite.frameDestinations[newInput]; 
        let increment = Math.sign(frameEnd-sprite.frame)
        if (Object.values(sprite.frameDestinations).includes(sprite.frame)) {
            sprite.frame += sprite.earlyFramesToSkip * increment
        }
        for (let i = sprite.frame + increment; i !== frameEnd + increment; i += increment){
            sprite.frameQueue.push(i)
        }
        if(Math.abs(sprite.frame - frameEnd) > sprite.frames.length/2) {
            sprite.frameQueue = sprite.frameQueue.filter((e) => e < sprite.middleSkipRange[0] || e > sprite.middleSkipRange[1])
        }
        
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
    directAttack(){
        const attack = this.attack;
        //ctx.translate(this.attack.centerX, this.attack.baseY)
        attack.angle = 0;
        attack.maxCenterOffset = 0
        attack.maxHeightOffset = 300
        //attack.maxHeightOffset = 0
        if (this.attackDirection === 'd'){ 
           attack.angle = 1.35
           attack.maxHeightOffset = 80
           attack.maxCenterOffset = 30
            
        } else if (this.attackDirection === 'a') {
            attack.angle = -1.35
            attack.maxHeightOffset = 50
            attack.maxCenterOffset = -40
        } else {
            
        }
        //ctx.translate(-this.attack.centerX, -this.attack.baseY)
        
        
    }
    takeDamage(damage){
        this.health -= damage
    }
    heal(damage){

    }
    setState(){
        this.state.block = false;
        this.state.attack = false;
        if (this.block.frame > 23) this.state.block = 'd' 
        else if (this.block.frame < 12) this.state.block = 'a' 
        if (this.attack.isAttacking) this.state.block = false;
        if (this.attack.frame > 15 && this.attack.frame < 20){
            this.state.attack = this.attackDirection
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
    const player = new Player(sprites)
    startGame(player);
};

function startGame(player){ 
    const game = new Game(ctx, canvas.width, canvas.height, player)
    animate(0,game);  
}
function animate(timestamp, game){
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.update(timestamp, keyRecord, touchRecord)
    requestAnimationFrame((timestamp)=>{
        
        animate(timestamp, game)
    })
}


