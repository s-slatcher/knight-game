class CannonWielder extends Enemy {
    constructor(game, basePoint){
        const alive = new GameImage(...Bowman.imageParams.unloaded)
        super (game, alive ,basePoint)
        this.image.height = 0
        this.shotCooldown = 0
        this.addPhysics()
        this.vector.borders.y = [30,undefined]
        this.vector.borders.z = [0,2000]
        this.vector.bounceDampening = 0.9
        this.vector.mass = 3
        this.vector.groundFriction = 0.03
        this.createCannon()
        
    }
    createCannon(){
        
        this.cannonBack = new GameObj(this.game, new GameImage(undefined,250,250),{x:0,y:0,z:400})
        
        this.cannonAngles = [0,3*Math.PI/2]

        const wheels = [
            this.wheelOne = new SpokedWheel(this.game,100,{x:0,y:0,z:0},0,0),
            this.wheelTwo = new SpokedWheel(this.game,100,{x:0,y:0,z:0},0,0)
        ]
        for (let i = 0; i < wheels.length; i++) {
            wheels[i].stroke = 15
            wheels[i].strokeColor = '#723C07'
        }
        this.wheelOne.isFirstWheel = true
        this.wheelOne.strokeColor = 'blue'

        this.newFront = new Circle(this.game,40,{x:0,y:500,z:30},0,0)
        this.newFront.stroke = 12
        this.newFront.strokeColor = 'grey'
        this.newFront.fillFace = 'grey'
        this.newFront.fillBack = 'black'
        this.game.activeObjects.push(this.newFront)

    }
    update(input){

        // test cannon front angle
        // console.log("normal angle to eyes: ",round(this.newFront.angleOfVisibility,2)," ellipse rotation angle: ",round(this.newFront.rotationAngle,2),
        // "angles: ",round(this.newFront.angleXZ % 6.28,2),round(this.newFront.angleZY % 6.28,2))

        super.update()
        if (this.shotCooldown > 0) this.shotCooldown -= 1;
        
        let directionVector = changeVectorLength(
            {x:this.newFront.normalVector.x, y:0, z:this.newFront.normalVector.z},5 + 15 * Math.abs(Math.cos(this.cannonAngles[0])))

        let movement = {x:0,y:0,z:0}
        if (input.includes('up')) this.cannonAngles[0] += Math.PI/100
        if (input.includes('down')) this.cannonAngles[0] -= Math.PI/100
        if (input.includes('right')) this.cannonAngles[1] += Math.PI/100
        if (input.includes('left')) this.cannonAngles[1] -= Math.PI/100
        if (input.includes('arrowUp')) movement = addVectors(movement,directionVector)
        if (input.includes('arrowDown')) movement = vectorFromPoints(directionVector,movement)
        if (input.includes('arrowRight')) movement.x += 10
        if (input.includes('arrowLeft')) movement.x -= 10
        if (input.includes('attack')) this.shoot();
        
        this.vector.x += movement.x
        this.vector.y += movement.y
        this.vector.z += movement.z

        this.cannonBack.vector.copyCoords(this.vector)

        this.newFront.angleXZ = this.cannonAngles[1]
        this.newFront.angleZY = this.cannonAngles[0]

        const cannonBackCenter = vectorDeepCopy(this.cannonBack.vector)
        cannonBackCenter.y += this.cannonBack.image.height/2
        
        const longerNormal = changeVectorLength(this.newFront.normalVector,300)
        const newFrontPos = addVectors(cannonBackCenter,longerNormal)

        this.newFront.vector.copyCoords(newFrontPos)
        
        

        const offCenterAdjustment = 50

        this.wheelOne.angleXZ = this.newFront.angleXZ + 1.571
        const wheelOneVector = addVectors(cannonBackCenter,changeVectorLength(this.wheelOne.normalVector,125))
        wheelOneVector.y -= offCenterAdjustment
        this.wheelOne.vector.copyCoords(wheelOneVector)

        this.wheelTwo.angleXZ = this.newFront.angleXZ - 1.571
        const wheelTwoVector = addVectors(cannonBackCenter,changeVectorLength(this.wheelTwo.normalVector,125))
        wheelTwoVector.y -= offCenterAdjustment
        this.wheelTwo.vector.copyCoords(wheelTwoVector)

        // this.testLine.p1 = cannonBackCenter
        // this.testLine.p2 = newFrontPos

            
    }
    
    draw(ctx){
        super.draw(ctx)
        ctx.strokeStyle = 'grey'
        let radius2 = this.cannonBack.dw/2
        const drawCannonBack = () => {
            ctx.beginPath();
            ctx.arc(this.cannonBack.centerX, this.cannonBack.centerY, this.cannonBack.dw/2, 0, 2 * Math.PI, false);
            ctx.fillStyle = 'grey'
            ctx.fill()
            ctx.strokeStyle = 'dimgrey'
            ctx.lineWidth = 3 * this.cannonBack.perspectiveScale
            ctx.stroke()
            ctx.closePath();
        }
        
        const drawCannonBarrel = () => {
            const frontRotation = this.newFront.rotationAngle
            const frontRadius = this.newFront.cameraRadius
            
            let p1 = {}
            let p2 = {}
            let p3 = {}
            let p4 = {}

            p1.x = this.newFront.vector.cX + (Math.cos(frontRotation) * frontRadius * 1.1) 
            p1.y = this.newFront.vector.cY + (Math.sin(frontRotation) * frontRadius * 1.1)
            p2.x = this.newFront.vector.cX - (Math.cos(frontRotation) * frontRadius * 1.1)
            p2.y = this.newFront.vector.cY - (Math.sin(frontRotation) * frontRadius * 1.1)
            p3.x = this.cannonBack.centerX + (Math.cos(frontRotation) * radius2)
            p3.y = this.cannonBack.centerY + (Math.sin(frontRotation) * radius2)
            p4.x = this.cannonBack.centerX - (Math.cos(frontRotation) * radius2)
            p4.y = this.cannonBack.centerY - (Math.sin(frontRotation) * radius2)
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p3.x,p3.y)
            ctx.lineTo(p4.x,p4.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.lineTo(p1.x,p1.y)
            ctx.fillStyle = 'grey'
            ctx.fill()
            ctx.closePath()
        }
        if (this.wheelOne.angleOfVisibility > 1.571) {
            this.wheelTwo.draw(ctx)
            drawCannonBack()
            drawCannonBarrel()
            this.wheelOne.draw(ctx)
        } else {
            this.wheelOne.draw(ctx)
            drawCannonBack()
            drawCannonBarrel()
            this.wheelTwo.draw(ctx)
        }
    }
    shoot(){
        if (this.shotCooldown > 0) return;
        else this.shotCooldown = 15
        const ball = new BowlingBall(this.game,{x:0,y:0,z:0})
        ball.vector.copyCoords(this.newFront.vector)
        ball.vector.velocity = changeVectorLength((vectorFromPoints(this.cannonBack.centralVector, this.newFront.vector)),randomInt(50,60)) 
        this.game.activeObjects.push(ball)
        this.vector.velocity = {x:ball.vector.velocity.x * -0.6,y:ball.vector.velocity.y * -0.6,z:ball.vector.velocity.z * -0.6, }
    }
}