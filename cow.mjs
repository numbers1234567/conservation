import {vecDot, vecSub, vecSum, vecScalarProd} from "./vectorOps.js";

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
        canvas.arc(this.r.x+offset_x, this.r.y+offset_y, this.radius, 0, 2*Math.PI, false);
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

export {Cow};