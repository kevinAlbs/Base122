let tests = [];
function addTest(name, fn, async) {
    tests.push({name: name, fn: fn, async: !!async});
}

function run() {
    let index = -1;
    function iterate() {
        index++;
        if (index >= tests.length) {
            console.log("All tests passed");
            return;
        }
        
        let test = tests[index];
        console.log('Running test ' + test.name);
        if (test.async) {
            test.fn(iterate);
        } else {
            test.fn();
            iterate();
        }
    }
    iterate();
}

module.exports = {
    addTest: addTest,
    run: run
}