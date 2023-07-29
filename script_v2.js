window.addEventListener('load', function(){


const canvas = document.getElementById("canvas1");
const pauseMenu = document.getElementById("pauseMenu")
const canvasContainer = document.getElementById("canvas-container")
const resumeButton = document.getElementById("resume-btn")
const startButton = document.getElementById("start-btn")
const ctx = canvas.getContext('2d');
const keyRecord = [];
const touchRecord = {};
canvas.width = 1000;
canvas.height = 1000;
canvas.style.aspectRatio = 1/1



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

document.getElementById("fps").addEventListener('change', (e) => (console.log(e.target.value)))


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
    console.log("end")
})



class Input{
    constructor(keyRecord, touchRecord){
        this.keys = keyRecord
        this.touchs = touchRecord
    }
}



class Game{
    constructor(ctx, width, height, playerSprites, backgroundSprites){
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
        this.foregroundStart = this.height - 600//first value will need to go up as height value increases, or road will pop off screen 
        this.maxPerspectiveScale = 2.7 //value comes from the perspective built into the road animation
        this.backgroundSpeed = 1.2 //pixels/frame -> value comes from speed built into the road animation
        this.roadTriangleHeight = 1000  //estimated from image
        this.foregroundRoadtopDistance = this.foregroundStart+(this.roadTriangleHeight-this.height)
        this.backgroundSprites = backgroundSprites
        this.player = new Player(this, playerSprites)
        //this.background = new Background(this, backgroundSprites)
        this.road = backgroundSprites.road
        this.road.offSetWidth = this.width/2 - this.road.dw/2
        this.road.offSetHeight = this.foregroundStart
        this.enemies = [];
        this.projectiles = [];
        this.scrollingElements = [];
        this.fpsSlider = document.getElementById("fps")
        this.healthBar
        
    }
    update(timestamp, keyRecord, touchRecord){
        if (!document.fullscreenElement) {
            document.getElementById("resume-btn").classList.remove("disabled")
            return
        }
        const framesDue = this.getFramesDue(timestamp)
        for (let i = 0; i < framesDue; i++) {
            this.totalFrames++;
            this.handleEnemies();
            this.handleBackground();
            this.projectiles.forEach((e) => e.update())
            this.player.update(keyRecord, touchRecord)
            this.updatePerpective()
            this.draw(this.ctx);
        }
    }
    handleBackground(){
        this.road.update()
        if (this.totalFrames % 24/this.speedModifier === 1) {
            let centerX = this.width/2
            this.scrollingElements.unshift(new GameImage("./images/tree.png",0.6,centerX + 300)) 
            this.scrollingElements.unshift(new GameImage("./images/tree.png",0.6,centerX - 300)) 
            this.scrollingElements[0].alpha = 0;
            this.scrollingElements[1].alpha = 0;    
        }
    }
    handleEnemies(){
        let center = this.width/2
        if (this.framesSinceCrossbowman > this.crossbowmanDelay) this.spawnCrossbowWave();
        else this.framesSinceCrossbowman ++;
        this.enemies.forEach((e)=> e.update());
        let attackingEnemies = this.enemies.filter(e => e.image.heightPercentTraveled > 0.2 && e.loaded);
        attackingEnemies.forEach( e => {
            e.attackPlayer()
            this.handleFiredArrows(e)
        })        
        
        
        // arrowLoadedEnemies.forEach((e) => {
        //     if (e.hasAttacked === true){
        //         let velocityDirection = Math.sign(e.image.dx - center)
        //         let arrowDestinationX = e.image.dx + e.image.dw/2
        //         let newArrow = new BlockedArrow(arrowDestinationX,this.height-350, 30, Math.random()*12*velocityDirection)
        //         this.projectiles.push(newArrow)
        //         //this.player.counter = 0;
        //     }
        
        // })
    }
    spawnCrossbowWave() {
        let roadSide = Math.sign(Math.random()-0.5)
        if (this.enemiesDue > 0) {
            const newEnemy = new Crossbowman(this.width/2 + 150*roadSide)
            newEnemy.image.alpha = 0;
            if (roadSide === 1) newEnemy.image.flipped = true;
            this.enemies.unshift(newEnemy)
            this.framesSinceCrossbowman = 0;
            this.crossbowmanDelay = Math.random()*60+30
            this.enemiesDue -= 1
        } else {
            this.crossbowmanDelay += 200
            this.enemiesDue = 4
            console.log("wave End")
        }
        
    }
    handleFiredArrows(enemey){
        
    }
    updateUI() {

    }
    updatePerpective(){
        this.enemies.forEach((e) => e.image.moveWithPerspective(this))
        this.scrollingElements.forEach((e) => e.moveWithPerspective(this))
        this.enemies = this.enemies.filter((e) => e.image.heightTraveled < this.height-100)
        this.scrollingElements = this.scrollingElements.filter((e) => {
            return e.dy < this.height && !(e.dx+e.dw < 0 || e.dx > this.width)   
        })
    }
    draw(ctx){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.drawStaticBackground(ctx);
        this.scrollingElements.forEach((e) => e.draw(ctx))
        this.enemies.forEach((e) => e.draw(ctx))
        this.projectiles.forEach((e)=>e.draw(ctx))
        this.player.draw();
    }
    drawStaticBackground(ctx){
        ctx.save()
        const gradient = ctx.createLinearGradient(0,0,0,200)
        gradient.addColorStop(1,"#b5dae5")
        gradient.addColorStop(0,"#0072b6")
        ctx.fillStyle = gradient;        
        ctx.fillRect(0,0,this.width,this.height)
        ctx.fillStyle = '#439544'
        ctx.fillRect(0, this.foregroundStart+2, this.width, this.height-this.foregroundStart)
        ctx.restore();
        this.road.draw(ctx);
    }
    getFramesDue(timestamp){
        let frameTime = timestamp - this.lastTimeStamp;
        this.lastTimeStamp = timestamp;
        this.frameTimeDeficit += frameTime;
        const framesDue = Math.floor(this.frameTimeDeficit / (1000/this.fps));
        this.frameTimeDeficit = this.frameTimeDeficit % (1000/this.fps);
        return framesDue;
    }
}

class Enemy{
    constructor(baseImageSrc, scale, posX){
        this.image = new GameImage(baseImageSrc,scale,posX, 0)
        this.States = {Spawned: "spawned", 
                    Attacking: "attacking", 
                    Dying: "dying", 
                    Dead: "dead"}
        this.state = this.States.Spawned
    }
    
}

class Crossbowman extends Enemy {
    constructor(posX){
        super('./images/gaurd_bolt.png', 0.25, posX)
        this.bloodSpurts = [];
        this.droppedCrossbows = [];
        this.deathCounter = 0;
        this.loaded = true;
        
    }
    update(){
        
        if (this.state === "dying") this.deathCounter++;
        if (this.deathCounter > 48) this.state === "dead"
        //let projectiles = this.bloodSpurts.concat(this.droppedCrossbows)
        this.bloodSpurts.forEach( e => {
            e.update()
            e.fadeAlpha(-0.04)
        })
        this.bloodSpurts = this.bloodSpurts.filter( e => e.alpha > 0)
        this.droppedCrossbows.forEach( e => {
            e.update()
            if (e.velY < -25) e.fadeAlpha(-1/3)
        })
    }
    attackPlayer(){
        this.loaded = false;
        this.image.image.src = './images/gaurd_nobolt.png'
    }
    recieveAttack(){
        if (this.state === "spawned") {
            this.state === "dying"
            this.image.image.src = './images/gaurd_dead_nocrossbow.png'
            const x = this.image.centerX
            const y = this.image.centerY
            const crossbow = new Projectile('./images/crossbow.png',0.5,x, y,10,0,0,0)
            crossbow.flipped = this.image.flipped
            this.droppedCrossbows.push(crossbow)
            for (let index = 0; index < 60; index++) {
                this.bloodSpurts.push = new BloodSpurt(x, y)
            }
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

class GameImage{
    constructor(fileSrc, initScale = 1, posX = 0, posY = 0){
    this.scale = initScale
    this.image = new Image()
    this.image.src = fileSrc
    this.sw = this.image.width;
    this.sh = this.image.height
    this.sx = 0
    this.sy = 0
    this.dx = posX
    this.dy = posY
    this.dw = this.sw*this.scale
    this.dh = this.sh*this.scale
    this.heightTraveled = 0;
    this.horizonOffset = this.dx - 1000/2
    this.angle = 0
    this.alpha = 1
    this.shadowAlpha = 0;
    this.flipped = false;
    this.sway = 0;
    this.bounce = 0;
    }
    get centerX(){return this.dx+this.dw/2}
    get centerY(){return this.dy+this.dh/2}
    
    draw(ctx){
        const {image, sx, sy, sw, sh, dx, dy, dw, dh} = this;
        ctx.save()
        if (this.flipped) this.flipHorizontal(ctx);    
        if (this.angle !== 0) this.rotate(ctx)
        ctx.beginPath();
        this.drawShadow(ctx)
        ctx.globalAlpha = this.alpha
        ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)
        ctx.restore();
    }
    drawShadow(ctx){
        if (this.heightTraveled < 20) return;
        const centerX = this.dx + this.dw/2 
        const centerY = this.dy + this.dh*0.9
        ctx.beginPath()
        ctx.arc(centerX,centerY,this.dw,0,2*Math.PI);
        const gradient = ctx.createRadialGradient(centerX, centerY, this.dw/4, centerX, centerY, this.dw/1.75)
        gradient.addColorStop(0, "rgba(0,0,0,0.5)")
        gradient.addColorStop(1, "rgba(0,0,0,0)")
        ctx.fillStyle = gradient
        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.scale(1,0.5)
        this.fadeShadowAlpha(0.05)
        ctx.globalAlpha = this.shadowAlpha
        ctx.translate(-centerX, -centerY)
        ctx.fill();
        ctx.restore()
    }
    rotate(ctx){
        ctx.translate(this.dx+(this.dw/2),this.dy+(this.dh/2))
        ctx.rotate(this.angle)
        ctx.translate(-(this.dx+(this.dw/2)),-(this.dy+(this.dh/2)))
    }
    flipHorizontal(ctx){
        ctx.translate(this.dx+(this.dw/2),0)
        ctx.scale(-1,1)
        ctx.translate(-(this.dx+(this.dw/2)),0)
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
    moveWithPerspective(game){
        const {width, height, foregroundRoadtopDistance, foregroundStart, maxPerspectiveScale, backgroundSpeed} = game;
        this.heightPercentTraveled = this.heightTraveled / (height-(foregroundStart))
        let speedMultiplier = foregroundRoadtopDistance / (Math.sqrt(Math.pow(foregroundRoadtopDistance,2) + Math.pow(this.horizonOffset,2)))
        let perspectiveScale = (1+(this.heightPercentTraveled*(maxPerspectiveScale-1)))
        let speed = Math.pow(perspectiveScale,2) * (backgroundSpeed*speedMultiplier)
        let heightDistributionAdjustment = ((this.sh * this.scale) - (this.dh)) * 0.5
        let widthDistributionAdjustment = ((this.sw * this.scale) - (this.dw)) * (this.horizonOffset/(width*0.5))
        this.heightTraveled += speed
        this.dw =  perspectiveScale * this.sw * this.scale
        this.dh =  perspectiveScale * this.sh * this.scale
        this.dy = (foregroundStart - this.dh + this.heightTraveled - heightDistributionAdjustment)
        this.dx = width/2 - this.dw/2 + (this.horizonOffset * perspectiveScale) - widthDistributionAdjustment
        
        if (this.heightTraveled < 100) this.fadeAlpha(0.075)
        if (this.heightTraveled > height - foregroundStart - 20) this.fadeAlpha(-0.15)
    }
}

class Sprite extends GameImage{
    constructor(sprite, scale){
        super(`./images/${sprite.meta.image}`, scale)
        this.offSetWidth = 0;
        this.offSetHeight = 0;
        this.frame = 0;
        this.sprite = sprite;
        this.frames = sprite.frames
        this.dx = 0;
        this.dy = 0;
        this.dw = this.frames[this.frame].frame.w
        this.dh = this.frames[this.frame].frame.h
        
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
        this.dw = frame.w * this.scale
        this.dh = frame.h * this.scale
        this.dx = this.heightTraveled ? this.dx + this.offSetWidth + this.sway : this.offSetWidth + this.sway 
        this.dy = this.heightTraveled ? this.dx + this.offSetHeight + this.bounce : this.offSetHeight + this.bounce
    }
}

class Projectile extends GameImage {
    constructor(fileSrc, scale, posX, posY, velTotal, velX, initialAngle, rotationSpeed){
        super(fileSrc, scale, 0)
        this.dx = posX - this.dw/2
        this.dy = posY - this.dh/2
        this.velTotal = velTotal
        this.velX = velX
        this.velY = Math.sqrt(Math.pow(this.velTotal, 2) - Math.pow(this.velX, 2)) || 0
        this.angle = initialAngle
        this.rotationSpeed = rotationSpeed //full rotations per frame
        this.gravity = 2; //pixel-per-frame velY that is lost each frame 
        
    }
    update(){
        this.dx += this.velX
        this.dy -= this.velY
        this.velY -= this.gravity
        this.angle += this.rotationSpeed*Math.PI*2
    }
}

class BlockedArrow extends Projectile {
    constructor(posX,posY,velTotal,velX){
        super('./images/arrow.png',
            0.5, posX, posY, velTotal, velX, 3.14*Math.sign(velX), (Math.random()*0.04+0.02)*Math.sign(velX))
    }
}

class BloodSpurt extends Projectile {
    constructor(posX,posY,intensity=1){
        super (`./images/blood/${Math.floor(Math.random()*3+1)}.png`,
            1.5, posX, posY, (Math.random()*10)*intensity, Math.random()*3*intensity*Math.sign(Math.random()-0.5), 
            0, 0.02)
        this.gravity *= 0.5;
    }
    
}


class Player{
    constructor(game, sprites){
        this.game = game;
        this.ctx = this.game.ctx
        this.health = 1;
        this.block = sprites.block
        this.counter = 0;
            this.block.frame = 18;
            this.block.updateSourceDimensions();
            this.block.offSetWidth = this.game.width * 0.1;
            this.block.offSetHeight =  this.game.height - this.block.dh* 0.9;
            
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
            this.attack.offSetWidth = this.game.width * 0.3;
            this.attack.offSetHeight = this.game.height - this.attack.dh*0.75
            
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
    }
    draw(){
        if (this.isAttacking ) {
            this.ctx.save()
            this.directAttack()
            this.attack.draw(this.ctx)
            this.ctx.restore();
            this.block.fadeAlpha(-0.2)
        } else {
            this.block.fadeAlpha(0.2);
            this.attack.alpha = 0;
        }
        this.block.draw(this.ctx);
        
    }
    attackTransition(){
        this.isAttacking = true;
        
    }
    updateAttack(){
        const attack = this.attack
        if (attack.frame === 0) this.attackDirection = this.input;
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
        const ctx = this.ctx;
        let xTranslation = 0;
        ctx.translate(this.game.width/2, this.game.height)
        ctx.scale(1.35,1)
        if (this.attackDirection === 'd'){
            ctx.rotate(0.75)
            ctx.scale(-1.35,1)
            
        } else if (this.attackDirection === 'a') {
            ctx.rotate(-0.75)
        }
        ctx.translate(-this.game.width/2, -this.game.height+300)
        
        
    }
    takeDamage(damage){
        this.health -= damage
    }
    heal(damage){

    }
    setState(){
        this.state.block = false;
        this.state.attack = false;
        if (this.block.frame > 30) this.state.block = 'd' 
        else if (this.block.frame < 6) this.state.block = 'a' 
        if (this.attack.isAttacking) this.state.block = false;
        if (this.attack.frame > 18 && this.attack.frame < 28){
            this.state.attack = this.attack.attackDirection
        }
        
    }
}


async function fetchSprites(){
    let playerSprites = {}
    let backgroundSprites = {}
    const [atkRep, blockRep, roadRep] = await Promise.all([
        fetch("./sword-attack-v2-compressed.json"),
        fetch("./sword48.json"),
        fetch("./road_background_v3.json")])
    await atkRep.json().then((sprite) => playerSprites.attack = new Sprite(sprite, 2));
    await blockRep.json().then((sprite) => playerSprites.block = new Sprite(sprite, 1));
    await roadRep.json().then((sprite) => backgroundSprites.road = new Sprite(sprite, 1));
    startGame(playerSprites,backgroundSprites);
};

function startGame(playerSprites,backgroundSprites){ 
  let game = new Game(ctx, canvas.width, canvas.height, playerSprites, backgroundSprites)
  animate(0,game);  
}
function animate(timestamp, game){
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.update(timestamp, keyRecord, touchRecord)
    requestAnimationFrame((timestamp)=>{
        animate(timestamp, game)
    })
}


});