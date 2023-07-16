window.addEventListener('load', function(){

const keyRecord = [];
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
pauseMenu.addEventListener('click', (e) => e.preventDefault(), true)

volOn.addEventListener('click', (e) => {
    volOn.classList.add("disabled");
    volOff.classList.remove("disabled")
})
volOff.addEventListener('click', (e) => {
    volOff.classList.add("disabled");
    volOn.classList.remove("disabled")
})


document.getElementById("fps").addEventListener('change', (e) => (console.log(e.target.value)))


const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext('2d');
const CANVAS_WIDTH = canvas.width = 1000;
const CANVAS_HEIGHT = canvas.height = 750;

// canvas.addEventListener("touchstart", process_touchstart, false);
// canvas.addEventListener("touchmove", process_touchmove, false);
// canvas.addEventListener("touchcancel", process_touchcancel, false);
// canvas.addEventListener("touchend", process_touchend, false);
// function process_touchmove(ev) {
//     // Set call preventDefault()
//     ev.preventDefault();
//   }


class Game{
    constructor(ctx, width, height, playerSprites, backgroundSprites){
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.lastTimeStamp = 0;
        this.frameTimeDeficit = 0;
        this.fps = 48;
        this.framesSinceLastEnemy = 0;
        this.totalFrames = 0;
        this.speedModifier = 1;
        this.foregroundStart = 0.3*this.height //first value will need to go up as height value increases, or road will pop off screen 
        this.maxPerspectiveScale = 3.5*(1-this.foregroundStart/this.height) //3.23  ->  value comes from the perspective built into the road animation
        this.backgroundSpeed = 1.2 //1.3 pixels/frame -> value comes from speed built into the road animation
        this.roadTriangleHeight = 1000  //estimated from image
        this.foregroundRoadtopDistance = this.foregroundStart+(this.roadTriangleHeight-this.height)
        
        this.backgroundSprites = backgroundSprites
        this.player = new Player(this, playerSprites)
        this.background = new Background(this, backgroundSprites)
        this.enemies = [];
        this.projectiles = [];
        this.trees = [];
        this.fpsSlider = document.getElementById("fps")
        this.castleBg = new GameImage('castle_bg.jpg',1.2,-300)
        this.castleBg.dy = -700
        
    }
    update(timestamp, keyRecord){
        
        this.fps = this.fpsSlider.value
        let framesDue = this.getFramesDue(timestamp)

        if (keyRecord.includes('Escape') && !this.isPaused) {
            keyRecord.splice(keyRecord.indexOf('Escape'),1)
            this.isPaused = true
            canvas.classList.add('blur')
            pauseMenu.classList.add('active')
            return;
        }
        if (this.isPaused) {
            if (keyRecord.includes('Escape')) {
                this.isPaused = false;
                canvas.classList.remove('blur')
                pauseMenu.classList.remove('active')
                keyRecord.splice(keyRecord.indexOf('Escape'),1)
            }
            return;
        }
        for (let i = 0; i < framesDue; i++) {
            this.totalFrames++;
            this.handleEnemies();
            this.handleBackground();
            this.player.update(keyRecord)
            this.background.update()
        
            //if (Math.random()*20 < 1) this.testRocks.push(new GameImage('rock.png',Math.random()*0.2+0.2,(Math.random()-0.5)*800))
            this.updatePerpectiveImages()
            this.draw(this.ctx);
        }

        


    }
    handleBackground(){
        if (this.totalFrames % 24/this.speedModifier === 1) {
            this.trees.unshift(new GameImage("tree.png",0.6,300)) 
            this.trees.unshift(new GameImage("tree.png",0.6,-300)) 
            this.trees[0].alpha = 0;
            this.trees[1].alpha = 0;  
            this.trees = this.trees.filter((e) => e.dh < this.height)
            
        }
        this.trees.forEach((e) => this.moveWithPerspective(e))
        
        
    }   
    handleEnemies(){
        if (this.framesSinceLastEnemy > 50 && Math.random()>0.95) {
            let randomSign = Math.sign(Math.random()-0.5)
            let newEnemy;
            
            newEnemy = new GameImage('gaurd_bolt.png',0.25,150*randomSign)
            newEnemy.alpha = 0;
            if (randomSign > 0) newEnemy.flipped = true;
            this.enemies.unshift(newEnemy)
            this.framesSinceLastEnemy = 0;
        } else this.framesSinceLastEnemy ++;
        
        
        this.enemies.forEach((e) => { e.framesAlive++})
           

    }
    updatePerpectiveImages(){
        this.enemies.forEach((e) => this.moveWithPerspective(e))
        this.enemies = this.enemies.filter((e) => e.dh < this.height)
        this.enemies.forEach((e) => {
           if (e.heightTraveled / (this.height-(this.foregroundStart)) > 0.2) {
            e.image.src = './gaurd_nobolt.png'
           }
        })
        
    }
    moveWithPerspective(image){
        if (!image.heightTraveled) image.heightTraveled = 0;

        let speedMultiplier = this.foregroundRoadtopDistance / (Math.sqrt(Math.pow(this.foregroundRoadtopDistance,2) + Math.pow(image.centerOffset,2)))
        if (this.enemies.includes(image)) console.log(speedMultiplier)

        let heightPercentTraveled = image.heightTraveled / (this.height-(this.foregroundStart))
        let perspectiveScale = (1+(heightPercentTraveled*(this.maxPerspectiveScale-1)))
        let speed = Math.pow(perspectiveScale,2) * (this.backgroundSpeed*speedMultiplier)
        let heightDistributionAdjustment = ((image.sh * image.scale) - (image.dh)) * 0.5
        let widthDistributionAdjustment = ((image.sw * image.scale) - (image.dw)) * (image.centerOffset/(this.width*0.5))
        image.heightTraveled += speed
        image.dw =  perspectiveScale * image.sw * image.scale
        image.dh =  perspectiveScale * image.sh * image.scale
        image.dy = (this.foregroundStart - image.dh + image.heightTraveled - heightDistributionAdjustment)
        image.dx = this.width/2 - image.dw/2 + (image.centerOffset * perspectiveScale) - widthDistributionAdjustment
        
        if (image.heightTraveled < 100) {
            image.fadeAlpha(0.075*this.speedModifier)
        }
        if (image.heightTraveled > this.height - this.foregroundStart - 20) image.fadeAlpha(-0.15)
        

    }
    fireArrow(rightSide){
        
    }
    draw(ctx){
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        
        this.background.draw(ctx);
        this.trees.forEach((e) => e.draw(ctx))
        this.enemies.forEach((e) => e.draw(ctx))
        
        this.player.draw();
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

class Background{
    constructor(game, sprites){
        this.game = game;
        this.road = sprites.road
            this.road.offSetWidth = this.game.width/2 - this.road.frameData.w/2
            this.road.offSetHeight = this.game.foregroundStart 
        
        
    }
    update(){
        const road = this.road;
        road.frame += 1;
        if (road.frame>road.frames.length-1) road.frame = 0;
        if (this.game.totalFrames % 5 === 1) this.game.castleBg.dy += 1;
        
    }
 
    draw(ctx){
        const {road, game} = this;
        
        ctx.save()
        const gradient = ctx.createLinearGradient(0,0,0,200)
        gradient.addColorStop(1,"#b5dae5")
        gradient.addColorStop(0,"#0072b6")
        ctx.fillStyle = gradient;        
        ctx.fillRect(0,0,game.width,game.height)
        ctx.fillStyle = '#439544'
        ctx.fillRect(0, game.foregroundStart+2, game.width, game.height-game.foregroundStart)
        ctx.restore();
        road.draw(ctx);
        
    }
}
class GameImage{
    constructor(fileName, initScale = 1, centerOffset = 0){
    this.scale = initScale
    this.image = new Image()
    this.image.src = `./${fileName}`
    this.sw = this.image.width;
    this.sh = this.image.height
    this.sx = 0
    this.sy = 0
    this.dx = 0 + centerOffset
    this.dy = 0
    this.dw = this.sw*this.scale
    this.dh = this.sh*this.scale
    this.centerOffset = centerOffset
    this.alpha = 1
    this.flipped = false;
    this.framesAlive = 0;
    }
    draw(ctx){
        const {image, sx, sy, sw, sh, dx, dy, dw, dh} = this;
        ctx.save()
        if (this.flipped) this.flipHorizontal(ctx);    
        
        ctx.globalAlpha = this.alpha
        ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)
        ctx.restore();
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
}

class Sprite extends GameImage{
    constructor(sprite){
        super(sprite.meta.image)
        this.offSetWidth = 0;
        this.offSetHeight = 0;
        this.frame = 0;
        this.sprite = sprite;
        this.frames = sprite.frames
        this.sway = 0;
        this.bounce = 0;
    }
    get frameData(){
        return this.frames[this.frame].frame
    }
   
    draw(ctx){
        let frame = this.frameData
        ctx.save();
        ctx.globalAlpha = this.alpha
        ctx.drawImage(
            this.image, frame.x, frame.y, frame.w, frame.h, 
            this.offSetWidth + this.sway, this.offSetHeight + this.bounce, frame.w, frame.h)
        ctx.restore();
    }
    
}


class Player{
    constructor(game, sprites){
        this.game = game;
        this.ctx = this.game.ctx
        this.block = sprites.block
            this.block.offSetWidth = this.game.width * 0.1;
            this.block.offSetHeight =  this.game.height * 0.25;
            this.block.frame = 18;
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
            this.attack.offSetWidth = this.game.width * 0.3;
            this.attack.offSetHeight = this.game.height * 0.5;
            this.frame = 0;
            this.attack.direction = 'none'
            this.block.inputDelayCounter = 0;
        this.input = 'none'
        this.attackInput = true;
        this.isAttacking = false;
        this.state = {block:false, attack:false}
    }
    
    readInput(keyRecord){
        let newInput;
        if (keyRecord.length === 0) this.input = 'none'
        else if (!keyRecord.includes(this.Input)){
            newInput = 'none'
            if (keyRecord.includes('a')) newInput = 'a'
            if (keyRecord.includes('d')) newInput = 'd'
            this.input = newInput;
        }
        if(keyRecord.includes(" ")) this.attackTransition();
        

    }
    update(keyRecord){
        this.readInput(keyRecord)
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
        } else this.block.fadeAlpha(0.2);
        
        this.block.draw(this.ctx);
        
    }
    attackTransition(){
        this.isAttacking = true;
        
    }
    updateAttack(){
        const attack = this.attack
        if (attack.frame === 0) this.attackDirection = this.input;
        attack.frame++;

        if (attack.frame === attack.frames.length) {
            attack.frame = 0; 
            this.isAttacking = false;
        }
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
    }
    makeFrameQueue(block, newInput){
        block.frameQueue = [];
        block.positionInQueue = 0;
        let frameEnd = block.frameDestinations[newInput]; 
        let increment = Math.sign(frameEnd-block.frame)
        if (Object.values(block.frameDestinations).includes(block.frame)) {
            block.frame += block.earlyFramesToSkip * increment
        }
        for (let i = block.frame + increment; i !== frameEnd + increment; i += increment){
            block.frameQueue.push(i)
        }
        if(Math.abs(block.frame - frameEnd) > block.frames.length/2) {
            block.frameQueue = block.frameQueue.filter((e) => e < block.middleSkipRange[0] || e > block.middleSkipRange[1])
        }
        
    }
    updateBounceSway() {
        let counter = this.game.totalFrames;
        let bounceModifier = Math.sin(counter / 7.5) * 15;
        let swayModifier = Math.cos(counter / 15) * 10;
        if (bounceModifier > 0) bounceModifier *= -1;
        if (swayModifier > 0) swayModifier *= -1;
        this.block.sway = this.attack.sway = swayModifier;
        this.block.bounce = this.attack.bounce = bounceModifier;
    }
    directAttack(){
        const ctx = this.ctx;
        ctx.translate(this.game.width/2, this.game.height)
        ctx.scale(1.2,1)
        if (this.attackDirection === 'd'){
            ctx.rotate(0.75)
            ctx.scale(-1.2,1)
        } else if (this.attackDirection === 'a') {
            ctx.rotate(-0.75)
            
        }
        ctx.translate(-this.game.width/2, -this.game.height)
        if (this.attackDirection === 'none') ctx.translate(0,this.game.height*0.15)
    }
    setState(){
        this.state.block = false;
        this.state.attack = false;
        if (this.block.frame > 30) this.state.block = 'd' 
        if (this.block.frame < 6) this.state.block = 'a' 
        if (this.attack.isAttacking) this.state.block = false;
        if (this.attack.frame > 18 && this.attack.frame < 28){
            this.state.attack = this.attack.attackDirection
        }
        
    }
}


(async function fetchSprites(){
    let playerSprites = {}
    let backgroundSprites = {}
    const [atkRep, blockRep, roadRep] = await Promise.all([
        fetch("./sword-attack-v2.json"),
        fetch("./sword48.json"),
        fetch("./road_background_v3.json"),
        fetch ("./gaurd_bolt.png")])
    await atkRep.json().then((sprite) => playerSprites.attack = new Sprite(sprite));
    await blockRep.json().then((sprite) => playerSprites.block = new Sprite(sprite));
    await roadRep.json().then((sprite) => backgroundSprites.road = new Sprite(sprite));
    startGame(playerSprites,backgroundSprites);
})();

function startGame(playerSprites,backgroundSprites){ 
  let game = new Game(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, playerSprites, backgroundSprites)
  animate(0,game);  
}
function animate(timestamp, game){
    // ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    game.update(timestamp, keyRecord)
    requestAnimationFrame((timestamp)=>{
        animate(timestamp, game)
    })
}


});