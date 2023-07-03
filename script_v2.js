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
        this.lastWASDInput = 'none'
        this.attackInput;
        this.#fetchSprites()
            .then(() => {
                this.block = new Block(this.game, this.blockSprite)
                this.attack = new Attack(this.game, this.attackSprite)
            })
    }
    
    readInput(keyRecord){
        let newWASDInput = this.lastWASDInput;
        if (keyRecord.length === 0) newWASDInput = 'none'
        else if (!keyRecord.includes(this.lastWASDInput)){
            if (keyRecord.includes('a')) newWASDInput = 'a'
            if (keyRecord.includes('d')) newWASDInput = 'd'
        }
        this.lastWASDInput = newWASDInput;

        if(keyRecord.includes(" ")) this.attackInput = this.lastWASDInput
        else this.attackInput = 'none'
        
        

        

        // read the key record, detect if a movement key was pressed, detect if new inputs are priotized or not
        // send current movement value to Blocking class object, it will create/run through a queue of frames
        // Player.update can also tell block to fade in/out depending on 

        // let inputCandidate = 'neutral';
        // if (keyRecord.d.pressed) inputCandidate = 'd'
        // if (keyRecord.a.pressed) inputCandidate = 'a'
        // this.input = this.lastInput === 'neutral' || !keyRecord[this.lastInput].pressed ?
        //     inputCandidate : this.lastInput;


        // if (this.inputDelayCounter > 0) {
        //     this.input = this.lastInput
        //     this.inputDelayCounter -= 1;
        // }
        // if (this.input !== this.lastInput) {
        //     this.inputDelayCounter = 4;
        // }
        // this.lastInput = this.input;

        // if (keyRecord[' '].pressed && this.inputDelayCounter === 0) {
        //     Object.values(this.blockDirection).forEach((e) => e = false)
        //     this.inputDelayCounter = this.attackSprite.frames.length
        //     this.isAttacking = true;
        // }
    }
    update(keyRecord){
        if(!this.spritesLoaded) return;
        this.block.update();
        let input = this.readInput(keyRecord);

    }
    draw(){
        if (!this.spritesLoaded) return;
        this.block.draw();
    }
        
        //update different player states based on 
    
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
        this.offSetWidth = 0 + game.width * 0.1;
        this.offSetHeight = 0 + game.height * 0.15;
        this.sprite = sprite;
        this.framesArr = sprite.frames
        this.frame = 18;
        this.frameIncrement = 1;
    }
    update(){
        this.frame += this.frameIncrement;
        if (this.frame === this.framesArr.length || this.frame < 0) {
            this.frameIncrement *= -1;
            this.frame += this.frameIncrement
        }
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