import {Cow} from "./cow";

/*
Test setup which predefines the initial state and returns.
*/
export function testSetup() {
    const cowArr = 
    [
        new Cow(10, 10, 10, 10, 5)
    ];
    return cowArr;
}
