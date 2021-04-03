import React, { Component, createRef } from 'react';
import * as THREE from 'three'
import { connect } from 'react-redux';
import CANNON from 'cannon';
import { DiceD4, DiceD6, DiceD20, DiceD8, DiceD10, DiceD12, DiceManager } from './dice-models';
import { getCurrentRoll, logRollAction } from 'reducers/rolls';
import './Dice.scss';


const getUpsideValue = (dice) => {
  let vector = new THREE.Vector3(0, 0, 1);
  let closest_face;
  let closest_angle = Math.PI * 2;
  for (let i = 0; i < dice.getObject().geometry.faces.length; ++i) {
      let face = dice.getObject().geometry.faces[i];
      if (face.materialIndex === 0) continue;

      let angle = face.normal.clone().applyQuaternion(dice.getObject().body.quaternion).angleTo(vector);
      if (angle < closest_angle) {
          closest_angle = angle;
          closest_face = face;
      }
  }

  return closest_face.materialIndex - 1;
}

const SIDE_TO_TYPE = {
  4: DiceD4,
  6: DiceD6,
  8: DiceD8,
  10: DiceD10,
  12: DiceD12,
  20: DiceD20
}

const makeDie = (sides) => {
  var dice = new SIDE_TO_TYPE[sides]({backColor: '#ff0000', size: 5});

  dice.getObject().position.x = 40 * Math.random() - 20;
  dice.getObject().position.y = 40 * Math.random() - 20;
  dice.getObject().position.z = 20;
  dice.getObject().quaternion.x = (Math.random()*90-45) * Math.PI / 180;
  dice.getObject().quaternion.z = (Math.random()*90-45) * Math.PI / 180;
  dice.getObject().body.velocity.set(60 * Math.random() - 30, 60 * Math.random() - 30, 60 * Math.random() - 30);
  dice.getObject().body.angularVelocity.set(20 * Math.random() -10, 20 * Math.random() -10, 20 * Math.random() -10);
  dice.updateBodyFromMesh();

  return dice;
}

class Dice extends Component {
  constructor(props) {
    super(props)

    this.mount = createRef()
  }

  componentDidUpdate(prevProps) {
    const { currentRoll, logRoll } = this.props;

    if (!currentRoll || currentRoll === prevProps.currentRoll) {
      return;
    }

    const world = new CANNON.World();
    world.gravity.set(0,0,-9.82 * 5);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 16;

    var groundBody = new CANNON.Body({
      mass: 0 // mass == 0 makes the body static
    });
    var groundShape = new CANNON.Plane();
    groundBody.addShape(groundShape);
    world.addBody(groundBody);

    var rightWallBody = new CANNON.Body({
      position: new CANNON.Vec3(40, 0, 0),
      shape: new CANNON.Plane()
    });
    var axis = new CANNON.Vec3(0,1,0);
    var angle = -Math.PI / 2;
    rightWallBody.quaternion.setFromAxisAngle(axis, angle);
    world.addBody(rightWallBody)


    var leftWallBody = new CANNON.Body({
      position: new CANNON.Vec3(-40, 0, 0),
      shape: new CANNON.Plane()
    });
    var axis = new CANNON.Vec3(0,1,0);
    var angle = Math.PI / 2;
    leftWallBody.quaternion.setFromAxisAngle(axis, angle);
    world.addBody(leftWallBody)

    var topWallBody = new CANNON.Body({
      position: new CANNON.Vec3(0, 40, 0),
      shape: new CANNON.Plane()
    });
    var axis = new CANNON.Vec3(1,0,0);
    var angle = Math.PI / 2;
    topWallBody.quaternion.setFromAxisAngle(axis, angle);
    world.addBody(topWallBody)

    var bottomWallBody = new CANNON.Body({
      position: new CANNON.Vec3(0, -40, 0),
      shape: new CANNON.Plane()
    });
    var axis = new CANNON.Vec3(1,0,0);
    var angle = -Math.PI / 2;
    bottomWallBody.quaternion.setFromAxisAngle(axis, angle);
    world.addBody(bottomWallBody)

    const width = this.mount.current.clientWidth;
    const height = this.mount.current.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, width/height, 0.1, 1000 );
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    const light = new THREE.AmbientLight( 0xD0D0D0 );
    renderer.setSize( width, height);
    renderer.setClearColor( 0x000000, 0 );
    scene.add(light);

    DiceManager.setWorld(world);

    const dice = []
    const strangeSides = []

    for (let i = 0; i < currentRoll.dice.length; i++) {
      const sides = currentRoll.dice[i]
      if (sides in SIDE_TO_TYPE) {
        const die = makeDie(sides)
        scene.add(die.getObject());

        dice.push(die);
      } else {
        strangeSides.push(sides);
      }

    }

    this.mount.current.appendChild( renderer.domElement );

    camera.position.z = 150;

    let stableCount = dice.map(d => 0);
    const threshold = .01;

    function animate() {
      world.step(1/60);

      for (let i = 0; i < dice.length; i++) {
        const die = dice[i]
        die.updateMeshFromBody();

        let angularVelocity = die.getObject().body.angularVelocity;
        let velocity = die.getObject().body.velocity;

        if (Math.abs(angularVelocity.x) < threshold && Math.abs(angularVelocity.y) < threshold && Math.abs(angularVelocity.z) < threshold &&
        Math.abs(velocity.x) < threshold && Math.abs(velocity.y) < threshold && Math.abs(velocity.z) < threshold) {
          stableCount[i]++
        }
      }



      renderer.render( scene, camera );

      if (stableCount.some(c => c < 10)) {
        requestAnimationFrame(animate);
      } else {
        const results = []
        let sum = currentRoll.shift;
        for (const die of dice) {
          const val = getUpsideValue(die)
          results.push([val, die.faces.length])
          sum += val;
        }

        for (const sides of strangeSides) {
          const val = Math.floor(Math.random() * sides) + 1
          results.push([val, sides])
          sum += val
        }

        logRoll({
          results,
          sum,
          shift: currentRoll.shift,
          rollText: currentRoll.text,
        })
      }
  }

    animate();

  }

  render() {
    const { currentRoll } = this.props;

    if (!currentRoll) {
      return null;
    }

    return (
      <div className="dice-container" ref={this.mount} />
    )
  }
}

const mapStateToProps = (state, props) => ({
  currentRoll: getCurrentRoll(state)
})

const mapDispatchToProps = {
  logRoll: logRollAction
}

export default connect(mapStateToProps, mapDispatchToProps)(Dice);