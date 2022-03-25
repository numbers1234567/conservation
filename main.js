import { Cow } from "./cow.mjs";
import {applyGravitationalForce, collisionForce} from "./forces.js";
import {vecSub, vecScalarProd, vecSum, vecDot} from "./vectorOps.js";

// Set up canvas
var canvas = document.getElementById("main-canvas");
// Note: Click points are in pixels from the top left of the window,
// but the canvas retains the same amount of pixels on resize.
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
        if (isNaN(mass) || isNaN(radius)) return null;
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

// Default click behavior
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

function calculateCenterOfMass(cows) {
    var com = {x : 0, y : 0};
    var totalMass = 0;

    for (let i=0; i<cows.length; i++) {
        if (!cows[i].isSystem) continue;
        totalMass += cows[i].mass;
        com.x += cows[i].mass*cows[i].r.x;
        com.y += cows[i].mass*cows[i].r.y;
    }

    com.x /= totalMass;
    com.y /= totalMass;
    return com;
}

/*
Calculate the path taken by the center of mass and draw it.
Returns {x: NaN, y:NaN} if there's no mass.
*/
function drawCenterOfMassPath(cows, canvasCtx, offsetX, offsetY) {
    let com = calculateCenterOfMass(cows);

    centerOfMassPath.push(com);

    canvasCtx.beginPath();
    canvasCtx.arc(com.x+offsetX, com.y+offsetY, 3, 0, 2*Math.PI, false);
    canvasCtx.fillStyle = "#00FF00";
    canvasCtx.fill();
    for (let i=0;i<centerOfMassPath.length;i++) {
        com = centerOfMassPath[i];
        canvasCtx.beginPath();
        canvasCtx.arc(com.x+offsetX, com.y+offsetY, 1, 0, 2*Math.PI, false);
        canvasCtx.fillStyle = "#00FF00";
        canvasCtx.fill();
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
    // Standard loop calls
    requestAnimationFrame(frameLoop);
    cContext.clearRect(0, 0, canvas.width, canvas.height)

    // Apply physics
    applyGravitationalForce(cowArr);
    for (let i=0;i<cowArr.length;i++) {
        cowArr[i].update(dt);
    }
    collisionForce(cowArr);
    
    // Calculate drawing offset from center of mass
    let com = calculateCenterOfMass(cowArr);
    let drawOffsetX = -com.x+canvasDefaultWidth/2;
    let drawOffsetY = -com.y+canvasDefaultWidth*canvas.height/canvas.width/2;
    
    if (isNaN(com.x)) { // No draw offset. No center of mass.
        drawOffsetX = 0;
        drawOffsetY = 0;
    }

    // Draw loop
    drawCenterOfMassPath(cowArr, cContext, drawOffsetX, drawOffsetY);

    for (let i=0;i<cowArr.length;i++) {
        cowArr[i].draw(cContext, drawOffsetX, drawOffsetY);
    }

    // Calculate next dt in seconds.
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

startButton.onclick = startLoop;