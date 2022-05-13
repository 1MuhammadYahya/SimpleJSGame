// Dom dependent variables
let ctx,
  canvas;

// Game objects
let ball,
  player,
  brickArray;

// Variables
let velocityMultiplier = 0,
 playerLives = 3,
  orgLives = playerLives,
  score = 0,
  highScore,
  bricksDestoryed = 0;

// This bit of code calls the initialize function once the domContent is Loaded
window.addEventListener('DOMContentLoaded', () => { initialize(); });

// These event listeners are used to help control the player paddle
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

// This function initializes a few variables which are dependent on the domContent
function initialize() {
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");

  if ( localStorage.getItem('highScore') === null) {
    highScore = 0;
    localStorage.setItem('highScore', `${0}`);
  } else highScore = localStorage.getItem('highScore');

  let body = document.body,
    screenX = body.clientWidth,
    screenY = body.clientHeight;

  canvas.width = screenX;
  canvas.height = screenY;

  let paddleDimensions = [ 200, 20 ];

  ball = new Ball( screenX * .5, screenY * .5 , 20, '#542897', 7.5, 9, screenX, screenY, paddleDimensions);
  player = new Paddle( paddleDimensions[0], paddleDimensions[1], screenX , screenY, 7, '#6043a2' );
  brickArray = new BrickArray( 8, 7, 200, 20, 20, 20, 20 , screenX, '#654991', '#9887AB')
}

// This function is responsible for updating the contents of the game
// It handles the logic and drawing of the canvas
function update() {
  let canvasX = canvas.width, canvasY = canvas.height;
  ctx.clearRect(0, 0, canvasX, canvasY);
  ctx.fillStyle = '#BFB0B0';
  ctx.fillRect(0, 0, canvasX, canvasY);

  let error = ball.update( [ player.x, player.y ] );
  player.update( velocityMultiplier );

  // Checking if game over
  if ( error > 0 ) {
    if ( playerLives > 0 ) {
      playerLives -= 1;

      player.Reset();
      ball.Reset();

      return;
    }

    // Checking if the current score is higher than the high score and setting it as the high score if it is
    if ( score > highScore )
      localStorage.setItem('highScore', `${score}`)

    Reset('GAME OVER');
  }

  // Updating the brick array
  if ( brickArray.update( ball.x, ball.y, ctx ) ) {  // This function also draws the array for it was orders of magnitudes more performant to draw this way
    ball.changeYDir(); // Changing the y direction of the ball
    // incrementing the score
    score += playerLives > 1 ? playerLives : 1;
    bricksDestoryed++;
  }

  // Checking if game won
  if (bricksDestoryed === brickArray.size) {
    // Checking if the current score is higher than the high score and setting it as the high score if it is
    if ( score > highScore )
      localStorage.setItem('highScore', `${score}`)

    Reset("Congratulations!! You have won");
  }

  // Drawing the ball
  ball.draw(ctx);
  // Drawing the player paddle
  player.draw(ctx);
  // Displaying the score, highScore and lives
  ctx.font = "16px Helvetica";
  ctx.fillStyle = "#2e2e2e";
  ctx.fillText(`SCORE : ${score}`, 8, 20);
  ctx.fillText(`HIGHSCORE : ${highScore}`, 8, 40);
  ctx.fillText(`LIVES : ${playerLives}`, 8, 60);

}

function Reset( message ) {
  player.Reset();
  ball.Reset();
  brickArray.Reset();

  score = 0;
  playerLives = orgLives;

  alert(message);
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
  // '32' is the keycode for space.
  // It helps to start the game on space Press;
  else if ( keyCode === 32 && ball.speed === 0 )
    ball.spaceToStart();
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
setInterval(update, 16.6);
// As this implementation is based on OOP, we shall be using classes
// However if you want to convert this to functions only. that too can be done pretty easily

// Ball class
// This holds the entire logic for the Ball
class Ball {
  #x;
  #y;
  radius;
  color;
  #speedX;
  #speedY;
  #orgSpeedX;
  #orgSpeedY;
  paddleWidth;
  paddleHeight;
  canvasWidth;
  canvasHeight;
  hitRecently = false;

  get x() { return this.#x; }
  get y() { return this.#y; }
  get speed() { return this.#speedX + this.#speedY };

  constructor(x, y, radius, color, speedX, speedY, canvasX, canvasY, paddleDimensions) {
    this.#x = x;
    this.#y = y;
    this.radius = radius;
    this.color = color;
    this.#speedX = 0;
    this.#speedY = 0;
    this.#orgSpeedX = speedX;
    this.#orgSpeedY = speedY;
    this.paddleWidth = paddleDimensions[0];
    this.paddleHeight = paddleDimensions[1];
    this.canvasWidth = canvasX;
    this.canvasHeight = canvasY;
  }

  changeYDir() {
    this.#speedY *= -1;

    // Everything beneath this comment within this function is to check if we hit a brick recently and if we did, then we just invert the x direction as well
    // Why not just check which side we hit from? I hear you ask, well quite honestly I am not in the mood to do directional collisions; maybe sometime in the future
    // you see I have exams rn. Like the 'decide my future' kind sooo I guess I am eligible to slack off
    if ( this.hitRecently ) {
      // Changing the xDirection if hit recently
      this.changeXDir();
      this.hitRecently = false;
      return;
    }

    // Here we just set the hit recently variable to true whenever we are hit for the first time
    this.hitRecently = true;

    // This timeout is responsible for setting the 'hitrecently' variable to false after some time
    setTimeout( () => { this.hitRecently = false; }, 100 );

  };
  changeXDir() { this.#speedX *= -1; }

  Reset() {
    this.#x = this.canvasWidth * .5 + this.radius;
    this.#y = this.canvasHeight * .5 + this.radius;

    this.#speedX *= 0;
    this.#speedY *= 0;
  }

  // This function helps start the game when the spacebar is pressed
  spaceToStart() {
    this.#speedX = this.#orgSpeedX * (Math.round(Math.random()) * 2 - 1); // Multiplying randomly with 1 or -1
    this.#speedY = this.#orgSpeedY * (Math.round(Math.random()) * 2 - 1); // Multiplying randomly with 1 or -1
  }

  // This function draws the ball on a canvas
  draw( ctx ) {
    ctx.beginPath();

    ctx.arc( this.#x, this.#y, this.radius, 0, Math.PI * 2);
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
    this.#x += this.#speedX /* The first value of the array represents the horizontal speed */ ;
    this.#y += this.#speedY /* The second value of the array represents the vertical speed */ ;
  }

  // This function handles the collision detection
  #collisionDetection( playerPos ) {
    let radius = this.radius,
      yPos = this.#y + this.#speedY,
      xPos = this.#x + this.#speedX;

    // Wall collisions
    // Checking to see if the ball is colliding with the top
    if ( yPos < radius )
      this.#speedY *= -1;
    // Checking to see if the ball is colliding either side
    else if ( xPos < radius || xPos + radius > this.canvasWidth )
      this.#speedX *= -1;
    // Checking to see if the ball touched the ground, i.e a game-over
    if ( yPos > this.canvasHeight - radius)
      return 1;

    // Paddle Collision
    if ( ( xPos > playerPos[0] && xPos < playerPos[0] + this.paddleWidth ) && ( yPos + radius >= playerPos[1] && yPos <= playerPos[1] + this.paddleHeight ) )
      this.#speedY *= -1;

    return 0;
  }
}

// Paddle class
// This holds the entire logic for the Paddles
class Paddle {
  _x;
  _y;
  color;
  speed;
  length;
  breadth;
  canvasWidth;

  constructor( width, height, canvasWidth, yPos, speed, color) {
    this._x = (canvasWidth - width) * .5;
    this._y = yPos - height * 2;
    this.color = color;
    this.speed = speed;
    this.length = height;
    this.breadth = width;
    this.canvasWidth = canvasWidth;
  }

  Reset() {
    this._x = (this.canvasWidth - this.breadth) * .5;
  }

  get x() { return this._x; };
  get y() { return this._y; };

  update( velocityMultiplier ) {
    this.#move(velocityMultiplier)
  }

  #move( velocityMultiplier ) {
    this._x += this.speed * velocityMultiplier;

    if ( this._x < 0 ) this._x = 0

    else if ( this._x + this.breadth > this.canvasWidth ) this._x = this.canvasWidth - this.breadth
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.rect( this._x, this._y, this.breadth, this.length );
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
  #paddingLeft;
  #offsetLeft;
  #offsetTop;
  #canvasWidth;
  #color1;
  #color2;

  get size() { return (this.#columns * this.#rows) }

  constructor( columns, rows, brickWidth, brickHeight, paddingTop, paddingLeft, offsetTop, canvasWidth, color1, color2 ) {
    this.#columns = columns;
    this.#rows = rows;
    this.#brickWidth = brickWidth;
    this.#brickHeight = brickHeight;
    this.#paddingTop = paddingTop;
    this.#paddingLeft = paddingLeft;
    this.#offsetTop = offsetTop;
    this.#canvasWidth = canvasWidth;
    this.#color1 = color1;
    this.#color2 = color2;

    this.initialize();
  }

  initialize() {
    // Calculating the space left
    let spaceOccupied = this.#columns * this.#brickWidth + this.#columns * this.#paddingLeft;
    // Making sure that the space left is not less than 0 i.e. the array does not extend beyond the screen
    while ( spaceOccupied + this.#brickWidth > this.#canvasWidth ) {
      this.#columns--;
      // Recalculating the space left
      spaceOccupied = this.#columns * this.#brickWidth + this.#columns * this.#paddingLeft;
    }
    // Setting the offset left such that the array is always centered
    this.#offsetLeft = ( this.#canvasWidth - spaceOccupied ) * 0.5 + (this.#paddingLeft * .5);

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
        let xPos = (this.#brickWidth + this.#paddingLeft) * col + this.#offsetLeft;
        let yPos = (this.#brickHeight + this.#paddingTop) * row + this.#offsetTop;

        let color = ( col + row ) % 2 === 1 ? this.#color1 : this.#color2;

        this._bricks[col][row] = new Brick( xPos, yPos, this.#brickWidth, this.#brickHeight, color);
      }
    }
  }

  Reset() { initialize() }

  update(playerX, playerY, ctx){
    // Looping over the columns
    for ( let col = 0; col < this.#columns; col++) {
      // Looping over the rows in the columns
      for (let row = 0; row < this.#rows; row++) {
        // Checking for the ball's collision with any of the bricks
        let element = this._bricks[col][row];

        if ( !element.status ) continue;

        element.draw(ctx);

        if ( element.collisionDetection( playerX, playerY ) ) {
          element.status = 0;
          return true;
        }
      }
    }
    return false;
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
  #status;

  get status() { return this.#status; }
  set status(value) { this.#status = value; }

  constructor( xPos, yPos, width, height, color ) {
    this.#xPos = xPos
    this.#yPos = yPos;
    this.#width = width;
    this.#height = height;
    this.#color = color;

    this.#status = 1;
  }

  // Checking for collisions with the player
  collisionDetection ( playerX, playerY ) {
    return playerX > this.#xPos && playerX < this.#xPos + this.#width && playerY + 20> this.#yPos && playerY - 20 < this.#yPos + this.#height;
  }

  // Drawing the brick
  draw( ctx ) {
    ctx.beginPath();

    ctx.rect( this.#xPos, this.#yPos, this.#width, this.#height );
    ctx.fillStyle = this.#color;
    ctx.fill();

    ctx.closePath();
  }
}
