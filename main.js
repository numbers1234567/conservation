// Set up canvas
var canvas = document.getElementById("main-canvas");
let canvasDefaultWidth = canvas.width;
canvas.style.width = "100%";
var cContext = canvas.getContext("2d");
var canvasLeft = canvas.offsetLeft + canvas.clientLeft;
var canvasTop = canvas.offsetTop + canvas.clientTop;

// Set up input fields
var startButton = document.getElementById("start-button");
var massInput = document.getElementById("mass-input");
var radiusInput = document.getElementById("radius-input");
var isSystemInput = document.getElementById("system-part");

function Cow(x, y, dx_dt, dy_dt, radius, mass, isSystem) {
    this.r = {x : x, y: y};
    /*
    The choice of dr/dt rather than simply dr is supposed to make it easier
        to manually choose velocity. When updating position, simply multiply 
        by dt.
    */
    this.dr_dt = {x:dx_dt, y:dy_dt};
    this.dp_dt = {x:0, y:0}

    this.radius = radius;
    this.mass = mass;

    this.isSystem = isSystem;

    /*
    Draws a spherical cow in a vacuum using the predefined location and 
        radius attributes
    
    Takes a canvas as input which is drawn on. Takes in an offset. This
        offset might be used if we need to look at a "different" part
        of the system.
    */
    this.draw = function(canvas, offset_x, offset_y) { 
        canvas.beginPath();
        canvas.arc(this.r.x, this.r.y, this.radius, 0, 2*Math.PI, false);
        if (!this.isSystem) canvas.fillStyle = "#FFFFFF";
        else canvas.fillStyle = "#FF0000"
        canvas.fill();
    }

    /*
    Update the position of the spherical cow using predefined dr and
        position attributes.

    Takes dt as input, the change in time since the last update.
    */
    this.update = function(dt) {
        // Calculate acceleration, dv/dt = (1/m)dp/dt
        // -> dr/dt=p/m + v0
        let dv_x = this.dp_dt.x*dt/this.mass; // m/s^2
        let dv_y = this.dp_dt.y*dt/this.mass;
        // Calculate velocity, dr/dt = v0 + dv
        this.dr_dt.x += dv_x;
        this.dr_dt.y += dv_y;

        // Update position
        this.r.x += this.dr_dt.x*dt;
        this.r.y += this.dr_dt.y*dt;

        // Reset forces for the next timestep
        this.dp_dt.x=0;
        this.dp_dt.y=0;
    }

    /*
    Apply some amount of force for the next timestep.
     */
    this.apply_force_dt = function(f_x, f_y) {
        this.dp_dt.x += f_x;
        this.dp_dt.y += f_y;
    }

};

/*
 * * * * * * * * * * * *
 * USER INTERACTIVITY  *
 * * * * * * * * * * * * 
 * 
 * Define what the user can do prior to the start of simulation
 */

function testSetup1() {
    const cowArr = 
    [
        new Cow(0, 0, 20, 5, 5, 5, true),
        new Cow(canvas.width, 0, -20, 5, 5, 5, true)
    ];
    return cowArr; 
}

function testSetup2() {
    const cowArr = 
    [
        new Cow(100, 100, 0, 300, 5, 5, true),
        new Cow(200, 100, 0, -300, 5, 5, true),
        new Cow(150, 100, 0, 0, 5, 500, false)
    ];
    return cowArr;
}

const cowArr = [];
for (let i=0;i<cowArr.length;i++) cowArr[i].draw(cContext);

var placingMass = true;

/*
All the functionality for a single click on the canvas.
This only consists of adding a cow and intial velocity.
*/
function onCanvasClick(event) {
    // Place cow
    if (placingMass) {
        const rect = canvas.getBoundingClientRect();
        let x = (event.clientX-rect.left)/rect.width*canvasDefaultWidth;
        let y = (event.clientY-rect.top)/rect.width*canvasDefaultWidth;
        
        let mass = parseFloat(massInput.value);
        let radius = parseFloat(radiusInput.value);
        let isSystemPart = isSystemInput.checked;
        
        cowArr.push(new Cow(x, y, 0, 0, radius, mass, isSystemPart));
        cowArr[cowArr.length-1].draw(cContext, 0, 0);
        
        placingMass = !placingMass;
    }
    // Define initial velocity
    else {
        const rect = canvas.getBoundingClientRect();
        let xMouse = (event.clientX-rect.left)/rect.width*canvasDefaultWidth;
        let yMouse = (event.clientY-rect.top)/rect.width*canvasDefaultWidth;
        
        let cow = cowArr[cowArr.length-1];
        cow.dr_dt = vecSub({x: xMouse, y: yMouse}, cow.r);
        
        // Draw velocity vector
        cContext.beginPath();
        cContext.moveTo(cow.r.x, cow.r.y);
        cContext.lineTo(xMouse, yMouse);
        cContext.strokeStyle = "#FFFFFF";
        cContext.stroke();

        placingMass = !placingMass;
    }
}

canvas.addEventListener("click",
    onCanvasClick,
    false
);

/*
Disables event listeners and other user 
    input once the simulation starts to
    avoid unexpected behavior.
 */
function disableInteractivity() {
    startButton.onclick = undefined;
    canvas.removeEventListener("click", onCanvasClick, false);
}



/*
 * * * * * * * * * * * * * * *
 * SETTING UP THE MAIN LOOP  *
 * * * * * * * * * * * * * * *
 */

let centerOfMassPath = [];

let G=10000; // Gravitational constant

function calculateCenterOfMass(cows) {
    var com = {x : 0, y : 0};
    var totalMass = 0;

    for (let i=0; i<cows.length; i++) {
        totalMass += cows[i].mass;
        com.x += cows[i].mass*cows[i].r.x;
        com.y += cows[i].mass*cows[i].r.y;
    }

    com.x /= totalMass;
    com.y /= totalMass;
    return com;
}

function drawCenterOfMass(cows, canvas) {
    let com = calculateCenterOfMass(cows);

    centerOfMassPath.push(com);

    canvas.beginPath();
    canvas.arc(com.x, com.y, 3, 0, 2*Math.PI, false);
    canvas.fillStyle = "#00FF00";
    canvas.fill();
}

/*
Given an array of cows, applies all gravitational forces
    from each cow to every other cow.
*/
function applyGravitationalForce(cows) {
    for (let i=0; i<cows.length; i++) {
        for (let j=i+1; j<cows.length;j++) {
            var cow1 = cows[i];
            var cow2 = cows[j];
            // Distance
            let dx = cow1.r.x-cow2.r.x;
            let dy = cow1.r.y-cow2.r.y;
            let r = Math.sqrt(dx*dx+dy*dy);
            // Force magnitude
            let F = G*cow1.mass*cow2.mass/(r*r);
            // (x_hat, y_hat) are on unit circle
            let x_hat = dx/r;
            let y_hat = dy/r;

            cow1.apply_force_dt(-x_hat*F, -y_hat*F);
            cow2.apply_force_dt(x_hat*F, y_hat*F);
        }
    }
}


function vecSum(v1, v2) {
    var vp = {x: v1.x+v2.x, y: v1.y+v2.y};
    return vp;
}

/*
Returns v1-v2
*/
function vecSub(v1, v2) {
    var vp = {x: v1.x-v2.x, y:v1.y-v2.y};
    return vp;
}

/*
Takes the dot product of vectors v1 and v2.
*/
function vecDot(v1, v2) {
    return v1.x*v2.x + v1.y*v2.y;
}

function vecScalarProd(v, scalar) {
    var vp = {x:scalar*v.x, y: scalar*v.y};
    return vp;
}

/*
Represents elastic collisions by directly modifying cow velocities.
Inputs cows array. Elements' velocities are directly accessed and modified.
*/
function collisionForce(cows) {
    for (let i=0; i<cows.length; i++) {
        for (let j=i+1; j<cows.length; j++) {
            var cow1 = cows[i];
            var cow2 = cows[j];
            // Distance
            let dx = cow1.r.x-cow2.r.x;
            let dy = cow1.r.y-cow2.r.y;
            let r = Math.sqrt(dx*dx+dy*dy);
            // Cows are not touching
            if (r > cow1.radius+cow2.radius) continue; 
            
            let m1 = cow1.mass;
            let m2 = cow2.mass;

            let v1 = cow1.dr_dt;
            let v2 = cow2.dr_dt;

            let x1 = cow1.r;
            let x2 = cow2.r;

            // Elastic collision velocity was too annoying for me to enjoy deriving on my own. 
            // See below for derivation and equation.
            // https://en.wikipedia.org/wiki/Elastic_collision#Two-dimensional_collision_with_two_moving_objects
            let v1p = vecSub(v1, vecScalarProd(vecSub(x1,x2), 2*m2*vecDot(vecSub(v1, v2), vecSub(x1, x2))/(m1+m2)/(r*r)));
            let v2p = vecSub(v2, vecScalarProd(vecSub(x2,x1), 2*m1*vecDot(vecSub(v2, v1), vecSub(x2, x1))/(m2+m1)/(r*r)));

            let rVec = vecSub(x2, x1);
            let vVec = vecSub(v1p, v2p);
            if (vecDot(rVec, vVec) >= 0) continue;
            
            cow1.dr_dt = v1p;
            cow2.dr_dt = v2p;
            cow1.update(dt);
            cow2.update(dt);
        }
    }
}

var lastTime = undefined;
var dt = undefined;

/*
Runs a single loop of the main loop.
Updates the display and state based on the time elapsed
    from la ultima loop.
*/
function frameLoop() {
    requestAnimationFrame(frameLoop);
    cContext.clearRect(0, 0, canvas.width, canvas.height)
    applyGravitationalForce(cowArr);
    for (let i=0;i<cowArr.length;i++) {
        cowArr[i].update(dt);
    }
    collisionForce(cowArr);
    for (let i=0;i<cowArr.length;i++) {
        cowArr[i].draw(cContext);
    }
    drawCenterOfMass(cowArr, cContext);

    for (let i=0;i<centerOfMassPath.length;i++) {
        let com = centerOfMassPath[i];
        cContext.beginPath();
        cContext.arc(com.x, com.y, 1, 0, 2*Math.PI, false);
        cContext.fillStyle = "#00FF00";
        cContext.fill();
    }

    dt = Date.now()/1000 - lastTime;
    lastTime = Date.now()/1000;
}

/*
Starts the main loop, initializing timekeeping variables.
 */
function startLoop() {
    disableInteractivity();
    lastTime = Date.now()/1000;
    dt = 0;
    frameLoop();
}

//startButton.onclick = function(){startLoop};