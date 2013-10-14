var STANDARD_HIGHWATER = 70;
var STANDARD_INTERVAL = 500;
var STANDARD_DECAY_FACTOR = 3;
var STANDARD_MAX_VIOLATIONS = 2;

// decayFactor is a dampening factor.  When determining average calls per second or
// current lag, we weigh the current value against the previous value using this factor to smooth spikes

var lastTime = new Date().valueOf(), now, lag, highWater = STANDARD_HIGHWATER, interval = STANDARD_INTERVAL, decayFactor = STANDARD_DECAY_FACTOR, maxViolations = STANDARD_MAX_VIOLATIONS, numViolations = 0, currentLag = 0;

var checkInterval = setInterval(function(){
  now = new Date().valueOf();
  lag = now - lastTime;
  lag = (lag < interval) ? 0 : lag - interval;
  currentLag = (lag + (currentLag * (decayFactor - 1))) / decayFactor;
  lastTime = now;

  if (currentLag > highWater) {
    numViolations++;
  } else {
    numViolations = 0;
  }
}, interval);

// Don't keep process open just for this timer.
checkInterval.unref();

var toobusy = function(){
  if (numViolations < maxViolations) {
    return;
  }

  // If current lag is < 2x the highwater mark, we don't always call it 'too busy'. E.g. with a 50ms lag
  // and a 40ms highWater (1.25x highWater), 25% of the time we will block. With 80ms lag and a 40ms highWater,
  // we will always block.
  var pctToBlock = (currentLag - highWater) / highWater;
  var rand = Math.random();
  return rand < pctToBlock;
};

toobusy.lag = function(){
  return parseInt(currentLag, 10);
};

toobusy.maxLag = function(newLag){
  if(!newLag) return highWater;

  // If an arg was passed, try to set highWater.
  if(Object.prototype.toString.call(newLag) !== "[object Number]"){
    throw "Expected numeric first argument.";
  }
  newLag = parseInt(newLag, 10);
  if(newLag < 10){
    throw "Maximum lag should be greater than 10ms.";
  }
  highWater = newLag;
  return highWater;
};

toobusy.decayFactor = function(newDecay){
  if(!newDecay) return decayFactor;

  // If an arg was passed, try to set highWater.
  if(Object.prototype.toString.call(newDecay) !== "[object Number]"){
    throw "Expected numeric first argument.";
  }
  newDecay = parseInt(newDecay, 10);
  if(newDecay <= 1){
    throw "Decay factor should be greater than 1.";
  }
  decayFactor = newDecay;
  return decayFactor;
};

toobusy.maxViolations = function(newViolations){
  if(!newViolations) return maxViolations;

  // If an arg was passed, try to set highWater.
  if(Object.prototype.toString.call(newViolations) !== "[object Number]"){
    throw "Expected numeric first argument.";
  }
  newViolations = parseInt(newViolations, 10);
  if(newViolations <= 0){
    throw "Max violations should be greater than 0.";
  }
  maxViolations = newViolations;
  return maxViolations;
};

toobusy.shutdown = function(){
  clearInterval(checkInterval);
};

module.exports = toobusy;