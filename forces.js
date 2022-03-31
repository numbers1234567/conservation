import {vecScalarProd, vecSub, vecSum, vecDot} from "./vectorOps.js"

let G=10000; // Gravitational constant

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

/*
Represents elastic collisions by directly modifying cow velocities.
Inputs cows array. Elements' velocities are directly accessed and modified.

First determines what the new velocities of two colliding cows should be,
    then figures out which exact time the collision occurred. It uses this
    to estimate a new position for two cows.
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

            // Figure out how much to backtrack on the previous velocity, so the cows no longer touch
            let k = vecSub(cow1.dr_dt, cow2.dr_dt);
            let magK = Math.sqrt(k.x*k.x + k.y*k.y);
            let backtrackT = -(cow1.radius + cow2.radius-r)/magK;
            cow1.r = vecSum(cow1.r, vecScalarProd(cow1.dr_dt, backtrackT));
            cow2.r = vecSum(cow2.r, vecScalarProd(cow2.dr_dt, backtrackT));

            // New velocity
            cow1.dr_dt = v1p;
            cow2.dr_dt = v2p;

            // Make up for the time spent backtracked
            cow1.r = vecSum(cow1.r, vecScalarProd(cow1.dr_dt, -backtrackT));
            cow2.r = vecSum(cow2.r, vecScalarProd(cow2.dr_dt, -backtrackT));
        }
    }
}

/*
Calculate center of mass of cows part of system
*/
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
Calculates total kinetic energy of the cows in the system
*/
function calcKE(cows) {
    var totalKE = 0;
    for (let i=0;i<cows.length;i++) {
        if (!cows[i].isSystem) continue;
        let vx = cows[i].dr_dt.x;
        let vy = cows[i].dr_dt.y;
         
        totalKE += cows[i].mass*(vx*vx+vy*vy)/2;
        
    }
    return totalKE;
}

/*
Calculates total potential energy of the cows in the system
*/
function calcU(cows) {
    var totalU = 0;
    for (let i=0;i<cows.length;i++) {
        if (!cows[i].isSystem) continue;
        // Gravitational potential energy
        for (let j=i+1;j<cows.length;j++) {
            let dx = cows[i].r.x-cows[j].r.x;
            let dy = cows[i].r.y-cows[j].r.y;
            
            let distance = Math.sqrt(dx*dx+dy*dy);
            totalU += -G*cows[i].mass*cows[j].mass/distance
        }
    }
    return totalU;
}

export {applyGravitationalForce, collisionForce, calculateCenterOfMass, calcKE, calcU};