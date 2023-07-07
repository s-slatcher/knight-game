window.addEventListener('load', function(){

const keyRecord = [];
window.addEventListener('keydown', (e) => {
    if (keyRecord.indexOf(e.key) === -1) keyRecord.push(e.key)
    if (e.key === ' ') e.preventDefault();
})
window.addEventListener('keyup', (e) => {
    keyRecord.splice(keyRecord.indexOf(e.key),1)
})

window.addEventListener('blur', () => keyRecord.splice(0,keyRecord.length))

document.getElementById("fps").addEventListener('change', (e) => (console.log(e.target.value)))

const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext('2d');
const CANVAS_WIDTH = canvas.width = 1000;
const CANVAS_HEIGHT = canvas.height = 750;


class Game{
    constructor(ctx, width, height, playerSprites, backgroundSprites){
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.lastTimeStamp = 0;
        this.frameTimeDeficit = 0;
        this.fps = 48;
        this.testX = 0;
        this.totalFrames = 0;
        this.speedModifier = 1;
        this.backgroundSprites = backgroundSprites
        this.player = new Player(this, playerSprites)
        this.background = new Background(this, backgroundSprites)
        this.fpsSlider = document.getElementById("fps")
    }
    update(timestamp, keyRecord){
        this.fps = this.fpsSlider.value
        let framesDue = this.getFramesDue(timestamp)
        for (let i = 0; i < framesDue; i++) {
            this.testX += 5;
            this.totalFrames++;
            this.player.update(keyRecord)
            this.background.update()
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            this.draw();
        }
    }
    draw(){
        this.ctx.fillRect(this.testX,this.height/2,50,50);
        this.background.draw(this.ctx);
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
            this.road.offSetHeight = this.game.height - this.road.frameData.h * 0.75
        this.rock = {}
        this.rock.image = new Image()
        this.rock.image.src = "./rock.png"
        this.rock.initWidth = this.rock.image.width/4
        this.rock.initHeight = this.rock.image.height/4
        this.rock.initSpeed = 1.3;
        this.rock.scaler = 1;
        this.rock.maxScaler = 1.35 //diference in width from top-bottom of road
        this.rock.heightTraveled = 0;
        this.rock.distanceFromCenter = 0;
        this.rock.speed = this.rock.initSpeed;
    }
    update(){
        const road = this.road;
        road.frame += 1;
        if (road.frame>road.frames.length-1) road.frame = 0;

    }
 
    draw(ctx){
        const {road, rock, game} = this;
        road.draw(ctx);

        let oldScaler = rock.scaler
        let percentTraveled = rock.heightTraveled / (game.height-(road.offSetHeight))
        rock.scalar = 1+(percentTraveled*rock.maxScaler)
        
        rock.width = rock.scalar * rock.initWidth
        rock.height = rock.scalar * rock.initHeight
        rock.speed = Math.pow(rock.scalar,2) * rock.initSpeed 
        rock.heightTraveled += rock.speed
        
        
        
        const sw = 360
        const sh = 235
        const dx = game.width/2 - rock.width/2 + (rock.distanceFromCenter * rock.scalar)
        const dy = (road.offSetHeight - rock.height)
        const dw = rock.width
        const dh = rock.height
        
        
        ctx.drawImage(rock.image, 0,0, sw, sh, dx, dy + rock.heightTraveled, dw, dh)
        
    }
}

class Sprite{
    constructor(sprite){
        this.offSetWidth = 0;
        this.offSetHeight = 0;
        this.image = new Image()
        this.image.src = `./${sprite.meta.image}`
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
        ctx.drawImage(
            this.image, frame.x, frame.y, frame.w, frame.h, 
            this.offSetWidth + this.sway, this.offSetHeight + this.bounce, frame.w, frame.h)
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
        if(keyRecord.includes(" ")) this.isAttacking = true;
        

    }
    update(keyRecord){
        this.readInput(keyRecord)
        this.updateBounceSway()
        this.isAttacking ? this.updateAttack() : this.updateBlock();
    }
    draw(){
        if (this.isAttacking) {
            this.ctx.save()
            this.directAttack()
            this.attack.draw(this.ctx)
            this.ctx.restore();
            this.ctx.globalAlpha = 0;
        }
        this.block.draw(this.ctx);
        this.ctx.globalAlpha = 1;
    }
    updateAttack(){
        const attack = this.attack
        if (attack.frame === 0) this.attackDirection = this.input;
        attack.frame++;
        if (attack.frame === attack.frames.length){
            attack.frame = 0;
            this.isAttacking = false;
        };
    }
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
        let skipMiddleFrames = false;
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
        let bounceModifier = Math.sin(counter / 10) * 15;
        let swayModifier = Math.cos(counter / 20) * 10;
        if (bounceModifier > 0) bounceModifier *= -1;
        if (swayModifier > 0) swayModifier *= -1;
        this.block.sway = swayModifier;
        this.block.bounce = bounceModifier;
        this.attack.sway = swayModifier;
        this.attack.bounce = bounceModifier;
    }
    directAttack(){
        const ctx = this.ctx;
        ctx.translate(this.game.width/2, this.game.height)
        if (this.attackDirection === 'd'){
            ctx.rotate(0.75)
            ctx.scale(-1,1)
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

class Attack{
    constructor(game, sprite){
        this.game = game
        this.ctx = game.ctx
        this.isAttacking = false;
        this.attackDirection = 'none'
        this.offSetWidth = game.width * 0.3;
        this.offSetHeight = game.height * 0.25;
        this.sprite = sprite;
        this.framesArr = sprite.frames
        this.length = this.framesArr.length
        this.frame = -1;
        this.attackDirection = 'none';
    }
    update(wasdInput, isAttacking){
        if (!this.isAttacking) this.isAttacking = isAttacking;
        if (!this.isAttacking) return;
        if (this.frame < 0) this.attackDirection = wasdInput;
        this.frame++;
        if (this.frame === this.framesArr.length - 1){
            this.frame = -1;
            this.isAttacking = undefined;
        };
    }
    draw(){
        if (this.frame < 0) return;
        let ctx = this.ctx
        let frame = this.framesArr[this.frame].frame
        ctx.save()
        this.directAttack();
        this.ctx.drawImage(this.sprite.image, frame.x, frame.y,
            frame.w, frame.h,
            this.offSetWidth,
            this.offSetHeight,
            frame.w, frame.h)
        ctx.restore();
    }
    directAttack(){
        ctx.translate(this.game.width/2, this.game.height)
        if (this.attackDirection === 'd'){
            ctx.rotate(0.75)
            ctx.scale(-1,1)
        } else if (this.attackDirection === 'a') {
            ctx.rotate(-0.75)
        }
        ctx.translate(-this.game.width/2, -this.game.height)
        if (this.attackDirection === 'none') ctx.translate(0,this.game.height*0.15)
    }
    
    
}


(async function fetchSprites(){
    let playerSprites = {}
    let backgroundSprites = {}
    const [atkResponse, blockResponse, roadResponse] = await Promise.all([
        fetch("./sword-attack-v2.json"),
        fetch("./sword48.json"),
        fetch("./road_background.json")])
        
    await atkResponse.json().then((sprite) => {
        const attack = new Sprite(sprite)
        playerSprites.attack = attack;
    });
    await blockResponse.json().then((sprite) => {
        const block = new Sprite(sprite)
        playerSprites.block = block;
    });
    await roadResponse.json().then((sprite) => {
        const road = new Sprite(sprite)
        backgroundSprites.road = road;
    });
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