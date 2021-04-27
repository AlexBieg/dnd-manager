import React, { Component, createRef } from 'react';
import * as THREE from 'three'
import { connect } from 'react-redux';
import CANNON from 'cannon';
import { sample } from 'lodash'
import { DiceD4, DiceD6, DiceD20, DiceD8, DiceD10, DiceD12, DiceManager } from './dice-models';
import { getCurrentRoll, logRollAction, cancelRollAction } from 'reducers/rolls';
import './Dice.scss';

function promisifyLoader ( loader, onProgress ) {

  function promiseLoader ( url ) {

    return new Promise( ( resolve, reject ) => {

      loader.load( url, resolve, onProgress, reject );

    } );
  }

  return {
    originalLoader: loader,
    load: promiseLoader,
  };

}


const getUpsideValue = (dice) => {
  let vector = new THREE.Vector3(0, 0, dice.invertUpside ? -1 : 1);
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
  4: {
    type: DiceD4,
    backColor: '#93b139',
    fontColor: '#ffffff',
  },
  6: {
    type: DiceD6,
    backColor: '#d68316',
    fontColor: '#ffffff',
  },
  8: {
    type: DiceD8,
    backColor: '#5eb0c5',
    fontColor: '#ffffff',
  },
  10: {
    type: DiceD10,
    backColor: '#c74749',
    fontColor: '#ffffff',
  },
  12: {
    type: DiceD12,
    backColor: '#7339be',
    fontColor: '#ffffff',
  },
  20: {
    type: DiceD20,
    backColor: '#171120',
    fontColor: '#ff0000',
  },
}

const randomVelocity = (max, min) => {
  const base = Math.random() * (max - min) + min

  if (Math.random() > 0.5) {
    return -base;
  }

  return base;
}

const makeDie = (sides, sounds) => {
  const config = SIDE_TO_TYPE[sides]
  var dice = new config.type({backColor: config.backColor, fontColor: config.fontColor, size: 5, mass: 0.1 });

  dice.getObject().position.x = 40 * Math.random() - 20;
  dice.getObject().position.y = 40 * Math.random() - 20;
  dice.getObject().position.z = 20;
  dice.getObject().quaternion.x = (Math.random()*90-45) * Math.PI / 180;
  dice.getObject().quaternion.z = (Math.random()*90-45) * Math.PI / 180;
  dice.getObject().body.velocity.set(randomVelocity(50, 10), randomVelocity(50, 10), 2)
  dice.getObject().body.angularVelocity.set(randomVelocity(10, 5), randomVelocity(10, 5), randomVelocity(10, 5));
  dice.getObject().body.addEventListener('collide', (e) => {
    const audio = sample(sounds)

    if (!audio.isPlaying) {
      audio.setRefDistance(Math.abs(e.contact.getImpactVelocityAlongNormal()) * .04)
      audio.play();
    }
  })
  dice.updateBodyFromMesh();

  return dice;
}

const makeWall = (pos, axis, angle) => {
  var wallBody = new CANNON.Body({
    position: pos,
    shape: new CANNON.Plane(),
  });
  wallBody.quaternion.setFromAxisAngle(axis, angle);

  return wallBody;
}


function animate(scene, camera, currentRoll, world, dice, threshold, stableCount, renderer, normalSides, strangeSides, logRoll) {
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
    requestAnimationFrame(() => {
      animate(scene, camera, currentRoll, world, dice, threshold, stableCount, renderer, normalSides, strangeSides, logRoll)
    });
  } else {
    const results = []
    let sum = currentRoll.shift;
    for (let i = 0; i < dice.length; i++) {
      const die = dice[i]
      const val = getUpsideValue(die)
      results.push([val, normalSides[i]])
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

class Dice extends Component {
  constructor(props) {
    super(props)

    this.mount = createRef()
  }

  async componentDidUpdate(prevProps) {
    const { currentRoll, logRoll } = this.props;

    if (!currentRoll || currentRoll === prevProps.currentRoll) {
      return;
    }

    const world = new CANNON.World();
    world.gravity.set(0,0,-9.82 * 10);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 16;

    var groundBody = new CANNON.Body({
      mass: 0 // mass == 0 makes the body static
    });
    var groundShape = new CANNON.Plane();
    groundBody.addShape(groundShape);
    world.addBody(groundBody);

    world.addBody(makeWall(new CANNON.Vec3(40, 0, 0), new CANNON.Vec3(0,1,0), -Math.PI / 2))
    world.addBody(makeWall(new CANNON.Vec3(-40, 0, 0), new CANNON.Vec3(0,1,0), Math.PI / 2))
    world.addBody(makeWall(new CANNON.Vec3(0, 40, 0), new CANNON.Vec3(1,0,0), Math.PI / 2))
    world.addBody(makeWall(new CANNON.Vec3(0, -40, 0), new CANNON.Vec3(1,0,0), -Math.PI / 2))

    const width = this.mount.current.clientWidth;
    const height = this.mount.current.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, width/height, 0.1, 1000 );
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    const light = new THREE.AmbientLight( 0xFFFFFF );
    scene.add(light);
    renderer.setSize( width, height);
    renderer.setClearColor( 0x000000, 0 );

    const pLight = new THREE.PointLight( 0xF0F0F0, 0.7, 100 );
    pLight.position.set( 0, 10, 30 );
    scene.add( pLight );

    const audioLoader = new THREE.AudioLoader();
    const listener = new THREE.AudioListener();
    listener.setMasterVolume(20)
    camera.add(listener);

    DiceManager.setWorld(world);

    this.mount.current.appendChild( renderer.domElement );

    camera.position.z = 150;

    const promiseAudioLoader = promisifyLoader(audioLoader)

    const sounds = ['./collision1.wav', './collision2.wav', './collision3.wav']

    const dice = []
    const strangeSides = []
    const normalSides = []

    for (let i = 0; i < currentRoll.dice.length; i++) {
      const sides = currentRoll.dice[i]
      if (sides in SIDE_TO_TYPE) {
        normalSides.push(sides);

        const audio = []

        for (let sound of sounds) {
          const buffer = await promiseAudioLoader.load(sound)

          const posAudio = new THREE.PositionalAudio(listener);
          posAudio.setBuffer(buffer);

          audio.push(posAudio)
        }

        const die = makeDie(sides, audio)
        scene.add(die.getObject());

        dice.push(die);
      } else {
        strangeSides.push(sides);
      }

    }

    let stableCount = dice.map(d => 0);
    const threshold = .1;

    animate(scene, camera, currentRoll, world, dice, threshold, stableCount, renderer, normalSides, strangeSides, logRoll);
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
  logRoll: logRollAction,
  cancelRoll: cancelRollAction,
}

export default connect(mapStateToProps, mapDispatchToProps)(Dice);