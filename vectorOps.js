
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

export {vecScalarProd, vecSub, vecSum, vecDot};