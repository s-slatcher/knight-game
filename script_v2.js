window.addEventListener('load', function(){


const keyRecord = [];
window.addEventListener('keydown', (e) => {
    if (keyRecord.indexOf(e.key) === -1) keyRecord.push(e.key)
    if (e.key === ' ') e.preventDefault();
    console.log(keyRecord)
})
window.addEventListener('keyup', (e) => {
    keyRecord.splice(keyRecord.indexOf(e.key),1)
})

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
        this.fetchSprites()
    
    }
    async fetchSprites(){
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
    readInput(keyRecord){
        return keyRecord
    }
    update(keyRecord){
        if(!this.spritesLoaded) return;
        let input = this.readInput(keyRecord);
        
        
        
    }

        
        //update different player states based on 
    
    attacking(direction){
       
    }
    blocking(direction){
        if(!direction){
            this.fadeOut()
        }
    }
    fadeOut(){}
}

// class Attacking extends Player{}

// class Blocking extends Player{}

// class Backgrounds extends Game{}

// class Enemies extends Game{}


function animate(timestamp, game){
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    game.update(timestamp, keyRecord)
    game.draw();
    requestAnimationFrame(function(timestamp){
        animate(timestamp, game)
    });
}

(async () => {
    const res = await Promise.all([
        fetch("./sword48.json"),
        fetch("./sword-attack-1.json"),
        //fetch("./crossbow-attack.json")
    ]);
    const data = await Promise.all(res.map(r => r.json()))
    let game = new Game(ctx, CANVAS_WIDTH, CANVAS_HEIGHT)
    console.log(data.flat())
    data.forEach((json) => {
        json.image = new Image();
        json.image.src = `./${json.meta.image}`;
        json.offSetWidth = 0 + CANVAS_WIDTH * 0.1;
        json.offSetHeight = 0 + CANVAS_HEIGHT * 0.15;
        
    })    
    animate(0, game);
})();

});