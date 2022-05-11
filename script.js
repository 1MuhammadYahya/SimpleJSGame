// Dom dependent variables
let ctx;
let canvas;

// Game objects
let ball;
let player;
let brickArray;

// Variables
let velocityMultiplier = 0;

// This bit of code calls the initialize function once the domContent is Loaded
window.addEventListener('DOMContentLoaded', () => { initialize(); });

// These event listeners are used to help control the player paddle
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

// This function initializes a few variables which are dependent on the domContent
function initialize() {
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");

  let width = canvas.#width;
  let height = canvas.#height;

  let paddleDimensions = [ 200, 20 ];

  ball = new Ball( width * .5, height * .5 , 20, '#000022', -8, canvas, paddleDimensions);
  player = new Paddle( paddleDimensions[0], paddleDimensions[1], width , height, 7, '#111111' );
  brickArray = new BrickArray(5, 4, 120, 10, 10, 20, canvas.#width, '#222222')
}

// This function is responsible for updating the contents of the game
// It handles the logic and drawing of the canvas
function update() {
  let error = ball.update( [ player.x, player.y ] );

  // Checking if game over
  if ( error > 0 ) {
    alert("GAME OVER");
    // reloading the window
    window.location.reload();
    // clearing the loop interval, this is needed in Chrome.
    clearInterval(interval);
  }

  player.update( velocityMultiplier );
  draw();
}

// This function is the main function which draws stuff to the screen in an order.
// It is called roughly every 16ms to obtain a smooth 60fps
function draw() {
  ctx.clearRect(0, 0, canvas.#width, canvas.#height);

  ball.draw(ctx);
  player.draw(ctx);
}

// This function handles keyDownEvents
function keyDownHandler( e ) {
  // Storing the keyCode in a variable for later access
  let keyCode = e.keyCode;

  // '39' is the keycode for the left arrow ley while 68 is the keycode for the letter 'D'
  if ( keyCode === 39 || keyCode === 68 )
    velocityMultiplier = 1;
  // '37' is the keycode for the Right arrow ley while 65 is the keycode for the letter 'A'
  else if ( keyCode === 37 || keyCode === 65 )
    velocityMultiplier = -1;
}

// This function handles KeyUpEvents
function keyUpHandler( e ) {
  // Storing the keyCode in a variable for later access
  let keyCode = e.keyCode;

  // These if statements check to see whether the key event was actually influencing the player's move direction
  // This is done so that we don't stop the player while another key is being pressed
  // For example, I may delay lifting my finger up from one arrow key while transitioning to another key
  // Usually this would cause the player to stop completely while the game figures out what actually is going on

  // The conditional logic has been divided up into two statements for ease of use
  // Checking if the player was moving R
  if ( (keyCode === 39 || keyCode === 68) && velocityMultiplier === 1 )
    velocityMultiplier = 0;

  else if ( (keyCode === 37 || keyCode === 65) && velocityMultiplier === -1 )
    velocityMultiplier = 0;
}

// This bit of code infinitely calls the draw function
// Storing it in a variable so that it can be disposed off later
const interval = setInterval(update, 16.6);

// As this implementation is based on OOP, we shall be using classes
// However if you want to convert this to functions only. that too can be done pretty easily

// Ball class
// This holds the entire logic for the Ball
class Ball {
  constructor(x, y, radius, color, speed, canvas, paddleDimensions) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.speedX = speed;
    this.speedY = speed;
    this.paddleWidth = paddleDimensions[0];
    this.paddleHeight = paddleDimensions[1];
    this.canvasWidth = canvas.#width;
    this.canvasHeight = canvas.#height;
  }

  // This function draws the ball on a canvas
  draw( ctx ) {
    ctx.beginPath();

    ctx.arc( this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    ctx.closePath();
  }

  // This function handles the ball movement as well as the collision detection
  update( playerPos ) {
    this.#move();

    let error = this.#collisionDetection( playerPos );
    if (!error)
      return 0;

    return  1;
  }

  // This function moves the ball
  #move() {
    this.x += this.speedX /* The first value of the array represents the horizontal speed */ ;
    this.y += this.speedY /* The second value of the array represents the vertical speed */ ;
  }

  // This function handles the collision detection
  #collisionDetection( playerPos ) {
    let speedX = this.speedX,
      speedY = this.speedY,
      radius = this.radius,
      yPos = this.y + speedY,
      xPos = this.x + speedX;

    // Wall collisions
    // Checking to see if the ball is colliding with the top
    if ( yPos < radius )
      this.speedY = -speedY;
    // Checking to see if the ball is colliding either side
    else if ( xPos < radius || xPos + radius > this.canvasWidth )
      this.speedX = -speedX;
    // Checking to see if the ball touched the ground, i.e a game-over
    if ( yPos > this.canvasHeight - radius)
      return 1;

    // Paddle Collision
    if ( ( xPos > playerPos[0] && xPos < playerPos[0] + this.paddleWidth ) && ( yPos + radius >= playerPos[1] && yPos <= playerPos[1] + this.paddleHeight ) )
      this.speedY = -this.speedY;

    return 0;
  }
}

// Paddle class
// This holds the entire logic for the Paddles
class Paddle {
  #x;
  #y;
  #color;
  #speed;
  #length;
  #bredth;
  #canvasWidth;

  constructor( width, height, canvasWidth, yPos, speed, color) {
    this._x = (canvasWidth - width) * .5;
    this._y = yPos - height * 2;
    this.color = color;
    this.speed = speed;
    this.length = height;
    this.bredth = width;
    this.canvasWidth = canvasWidth;
  }

  get x() { return this._x; };
  get y() { return this._y; };

  update( velocityMultiplier ) {
    this.#move(velocityMultiplier)
  }

  #move( velocityMultiplier ) {
    this._x += this.speed * velocityMultiplier;

    if ( this._x < 0 ) this._x = 0

    else if ( this._x + this.bredth > this.canvasWidth ) this._x = this.canvasWidth - this.bredth
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.rect( this._x, this._y, this.bredth, this.length );
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }
}

// BrickArray Class
// This holds the entire logic for the Brick Array
class BrickArray {
  #columns;
  #rows;
  #brickWidth;
  #brickHeight;
  #paddingTop;
  #desiredOffset;
  #canvasWidth;
  #color;

  constructor( columns, rows, brickWidth, brickHeight, paddingTop, desiredOffset, canvasWidth, color ) {
    this.#columns = columns;
    this.#rows = rows;
    this.#brickWidth = brickWidth;
    this.#brickHeight = brickHeight;
    this.#paddingTop = paddingTop;
    this.#desiredOffset = desiredOffset;
    this.#canvasWidth = canvasWidth;
    this.#color = color;

    this.initialize();
  }

  initialize ( ) {
    let minWidth = this.#columns * this.#brickWidth;
    let spaceLeft = this.#canvasWidth - minWidth;



    console.log( `minWidth = ${minWidth}, canvasWidth = ${this.#canvasWidth}, spaceLeft = ${spaceLeft}`)

    this.initArray();
  }

  initArray(){
    // Initializing the bricks array
    this._bricks = [];

    // Looping over each column and row to store the brick array in a 2-d Array
    // Looping over the columns
    for (let col = 0; col < this.#columns; col++ ) {
      // Creating an array at the column for a row
      this._bricks[col] = [];
      // Looping over the rows
      for (let row = 0; row < this.#rows; row++) {
        this._bricks[col][row] = new Brick();
      }
    }
  }
}

// Brick class
// This holds the entire logic for the Brick
class Brick {
  #xPos;
  #yPos;
  #width;
  #height;
  #color;

  constructor( xPos, yPos, width, height, color ) {
    this.#xPos = xPos
    this.#yPos = yPos;
    this.#width = width;
    this.#height = height;
    this.#color = color;
  }
}