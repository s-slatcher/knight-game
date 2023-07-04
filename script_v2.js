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

const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext('2d');
const CANVAS_WIDTH = canvas.width = 1000;
const CANVAS_HEIGHT = canvas.height = 750;


class Game{
    constructor(ctx, width, height){
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.lastTimeStamp = 0;
        this.frameTimeDeficit = 0;
        this.fps = 48;
        this.testX = 0;
        this.totalFrames = 0;
        this.speedModifier = 1;
        this.player = new Player(this);
        document.getElementById("")
    }
    update(timestamp, keyRecord){
        let framesDue = this.getFramesDue(timestamp)
        for (let i = 0; i < framesDue; i++) {
            this.testX += 5;
            this.totalFrames++;
            this.player.update(keyRecord)
        }
    }
    draw(){
        
        this.ctx.fillRect(this.testX,this.height/2,50,50);
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

class Player{
    constructor(game){
        this.game = game;
        this.spritesLoaded = false;
        this.wasdInput = 'none'
        this.attackInput;
        this.state = {block:false, attack:false}
        this.#fetchSprites()
            .then(() => {
                this.block = new Block(this.game, this.blockSprite)
                this.attack = new Attack(this.game, this.attackSprite)
            })
        
    }
    
    updateInput(keyRecord){
        let newWasdInput;
        if (keyRecord.length === 0) newWasdInput = 'none'
        else if (!keyRecord.includes(this.newWasdInput)){
            if (keyRecord.includes('a')) newWasdInput = 'a'
            if (keyRecord.includes('d')) newWasdInput = 'd'
        }
        this.wasdInput = newWasdInput;

        if(keyRecord.includes(" ")) this.attackInput = this.wasdInput
        else this.attackInput = 'none'
        
        

        

        // read the key record, detect if a movement key was pressed, detect if new inputs are priotized or not
        // send current movement value to Blocking class object, it will create/run through a queue of frames
        // Player.update can also tell block to fade in/out depending on 

        // let inputCandidate = 'neutral';
        // if (keyRecord.d.pressed) inputCandidate = 'd'
        // if (keyRecord.a.pressed) inputCandidate = 'a'
        // this.input = this.lastInput === 'neutral' || !keyRecord[this.lastInput].pressed ?
        //     inputCandidate : this.lastInput;


        

        // if (keyRecord[' '].pressed && this.inputDelayCounter === 0) {
        //     Object.values(this.blockDirection).forEach((e) => e = false)
        //     this.inputDelayCounter = this.attackSprite.frames.length
        //     this.isAttacking = true;
        // }
    }
    update(keyRecord){
        if(!this.spritesLoaded) return;
        this.updateInput(keyRecord)
        this.block.update(this.wasdInput);
        this.setState();
    }
    draw(){
        if (!this.spritesLoaded) return;
        this.block.draw();
    }
    setState(){
        this.state.block = false;
        if (this.block.frame > 30) this.state.block = 'right' 
        if (this.block.frame < 6) this.state.block = 'left' 
        console.log(this.state.block)
        
        
    }
    
    fadeOut(){}
    async #fetchSprites(){
        const [atkResponse, blockResponse] = await Promise.all([
            fetch("./sword-attack-1.json"),
            fetch("./sword48.json")])
        await atkResponse.json().then((sprite) => {
            this.attackSprite = sprite
            this.attackSprite.image = swordAttack
        });
        await blockResponse.json().then((sprite) => {
            this.blockSprite = sprite
            this.blockSprite.image = swordBlock
        })
        this.spritesLoaded = true;
    }
}

class Block{
    constructor(game, sprite){
        this.game = game
        this.ctx = game.ctx
        this.input = 'none'
        this.offSetWidth = 0 + game.width * 0.1;
        this.offSetHeight = 0 + game.height * 0.15;
        this.sprite = sprite;
        this.framesArr = sprite.frames
        this.frame = 18;
        this.frameIncrement = 1;
        this.frameQueue = [18];
        this.positionInQueue = 0;
        this.frameDestinations = {'none':18, 'a':0, 'd':35} 
        this.middleFramesToSkip = 10 
        this.earlyFramesToSkip = 5
        this.inputDelayCounter = 0;
        
        
    }
    makeNewFrameQueue(newInput='none'){
        let frameEnd = this.frameDestinations[newInput];
        
        this.frameQueue = [];
       
        let increment = Math.sign(frameEnd-this.frame)
        let skipMiddleFrames = false;

        if (Object.values(this.frameDestinations).includes(this.frame)) {
            
            this.frame += this.earlyFramesToSkip * increment
        }
        if(Math.abs(this.frame - frameEnd)> 18) {
            skipMiddleFrames = true;
            
        }
        
        for (let i = this.frame + increment; i !== frameEnd + increment; i += increment){
            if (skipMiddleFrames && (i>11 && i<27)) continue;
            this.frameQueue.push(i)
        }
        this.positionInQueue = 0;
        
        
    }
    update(input){
        if (this.inputDelayCounter > 0) {
            input = this.input
            this.inputDelayCounter -= 1;
        }
        if (input !== this.input) {
            this.inputDelayCounter = 4;
            this.makeNewFrameQueue(input)
            
        }
        this.input = input;
        
        if (this.positionInQueue !== this.frameQueue.length) this.frame = this.frameQueue[this.positionInQueue++]
        return;
        

    }
    draw(){
        
        let frame = this.framesArr[this.frame].frame
        
        ctx.drawImage(this.sprite.image, frame.x, frame.y,
            frame.w, frame.h,
            this.offSetWidth,
            this.offSetHeight,
            frame.w, frame.h)
    }
}

class Attack{}



// class Backgrounds extends Game{}

// class Enemies extends Game{}

let game = new Game(ctx, CANVAS_WIDTH, CANVAS_HEIGHT)
animate(0);

function animate(timestamp){
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    game.update(timestamp, keyRecord)
    game.draw();
    requestAnimationFrame(animate)
}


});