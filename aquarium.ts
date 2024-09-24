// aquarium.ts

interface Position {
    x: number;
    y: number;
  }
  
  abstract class Entity {
    position: Position;
    velocity: Position;
    art: string[];
  
    constructor(position: Position, velocity: Position) {
      this.position = position;
      this.velocity = velocity;
      this.art = [];
    }
  
    abstract update(width: number, height: number): void;
    abstract draw(): void;
  }
  
  class Fish extends Entity {
    constructor(position: Position, velocity: Position) {
      super(position, velocity);
      this.art = [
        "🐠"
        // "><>",
        // ">))'>",
        // "><(((('>",
        // "><>    ><>",
      ];
    }
  
    update(width: number, height: number): void {
      this.position.x += this.velocity.x;
  
      // Wrap around the screen horizontally
      if (this.position.x > width) {
        this.position.x = 0;
      } else if (this.position.x < 0) {
        this.position.x = width;
      }
  
      // Optionally, fish can move vertically
      this.position.y += this.velocity.y;
      if (this.position.y >= height) {
        this.position.y = 1;
      } else if (this.position.y < 1) {
        this.position.y = height - 1;
      }
    }
  
    draw(): void {
      moveCursor(Math.floor(this.position.x), Math.floor(this.position.y));
      process.stdout.write(this.art[Math.floor(Math.random() * this.art.length)]);
    }
  }
  
  class Shark extends Entity {
    constructor(position: Position, velocity: Position) {
      super(position, velocity);
      this.art = ["🦈"]
    //   this.art = [
    //     "><(((*>",
    //     "><(((-{`>",
    //   ];
    }
  
    update(width: number, height: number): void {
      this.position.x += this.velocity.x;
  
      // Wrap around the screen horizontally
      if (this.position.x > width) {
        this.position.x = 0;
      } else if (this.position.x < 0) {
        this.position.x = width;
      }
    }
  
    draw(): void {
      moveCursor(Math.floor(this.position.x), Math.floor(this.position.y));
      process.stdout.write(this.art[Math.floor(Math.random() * this.art.length)]);
    }
  }
  
  class Aquarium {
    width: number;
    height: number;
    entities: Entity[];
  
    constructor() {
      this.width = process.stdout.columns;
      this.height = process.stdout.rows;
      this.entities = [];
    }
  
    addEntity(entity: Entity): void {
      this.entities.push(entity);
    }
  
    update(): void {
      this.entities.forEach((entity) => entity.update(this.width, this.height));
    }
  
    draw(): void {
      clearScreen();
      this.entities.forEach((entity) => entity.draw());
    }
  }
  
  // Utility functions for terminal control
  function clearScreen() {
    process.stdout.write("\x1b[2J");
  }
  
  function moveCursor(x: number, y: number) {
    process.stdout.write(`\x1b[${y};${x}H`);
  }
  
  function hideCursor() {
    process.stdout.write("\x1B[?25l");
  }
  
  function showCursor() {
    process.stdout.write("\x1B[?25h");
  }
  
  function main() {
    hideCursor();
  
    const aquarium = new Aquarium();
  
    // Add fish to the aquarium
    for (let i = 0; i < 10; i++) {
      const fish = new Fish(
        {
          x: Math.random() * aquarium.width,
          y: Math.random() * (aquarium.height - 2) + 1,
        },
        {
          x: Math.random() < 0.5 ? -0.5 : 0.5,
          y: 0,
        }
      );
      aquarium.addEntity(fish);
    }
  
    // Add sharks to the aquarium
    for (let i = 0; i < 3; i++) {
      const shark = new Shark(
        {
          x: Math.random() * aquarium.width,
          y: Math.random() * (aquarium.height - 2) + 1,
        },
        {
          x: Math.random() < 0.5 ? -1 : 1,
          y: 0,
        }
      );
      aquarium.addEntity(shark);
    }
  
    // Main animation loop
    const interval = setInterval(() => {
      aquarium.update();
      aquarium.draw();
    }, 100);
 
    
    const intervalId = interval[Symbol.toPrimitive]();

    // Clean up on exit
    const cleanUp = () => {
      clearInterval(intervalId);
      showCursor();
      process.exit();
    };
  
    process.on("SIGINT", cleanUp);
    process.on("exit", showCursor);
  }
  
  main();
  