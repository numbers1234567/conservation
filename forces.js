
let G=1; // Gravitational constant

/*
Given an array of cows, applies all gravitational forces
    from each cow to every other cow.
*/
function ApplyGravitationalForce(cows) {
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


function CollisionForce(cows) {
    for (let i=0; i<cows.length; i++) {
        for (let j=i+1; j<cows.length; j++) {
            var cow1 = cows[i];
            var cow2 = cows[j];
            // Distance
            let dx = cow1.r.x-cow2.r.x;
            let dy = cow1.r.y-cow2.r.y;
            let r = Math.sqrt(dx*dx+dy*dy);

        }
    }
}