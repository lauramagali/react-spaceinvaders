import R from 'ramda'
import { createGrid } from './create-grid'

import {
  cellWidth
, cellHeight
, worldWidth
, worldHeight
, cols
, rows
} from './config'

import {
  UPDATE
, DESTROY_ENEMY
} from './actions'

const grid = createGrid(3, cols - 2)
const hStepSize = cellWidth / 8
const vStepSize = cellHeight / 2
const period = 100

const defaultState = grid.cells.map(i => {

  let {x, y} = grid.getCoords(i)

  return {

    key: `enemy-${ i }`
  , type: y % 3
  , flip: false
  , age: 0
  , index: i
  , didMove: true

  , hDirection: 1
  , nextMoveTime: i * period
  , nextAdvanceTime: 0

  // this really should depend on how many enemies are still alive
  // and beatPeriod and beatFasterBy are two aspects of the same property
  , nextAnimateTime: 0

  , width: cellWidth
  , height: cellHeight
  , row: y
  , col: x
  , left: x * cellWidth + cellWidth
  , top: grid.rows * cellHeight - y * cellHeight
  }
})

const atLeftEdge = enemy => enemy.left <= cellWidth / 2
const atRightEdge = enemy => enemy.left >= worldWidth - cellWidth - cellWidth / 2

const edges = enemies => {
  return R.reduce(({leftmost, rightmost}, enemy) => {
    return {
      leftmost: !leftmost ? enemy : enemy.col < leftmost.col ? enemy : leftmost
    , rightmost: !rightmost ? enemy : enemy.col > rightmost.col ? enemy : rightmost
    }
  }, {}, enemies)
}

const update = (enemies, action) => {
  let { elapsedTime } = action
    , allDidMove = R.all(enemy => enemy.didMove, enemies)
    , {leftmost, rightmost} = edges(enemies)
    , atEdge = atLeftEdge(leftmost) || atRightEdge(rightmost)
    , advance = allDidMove && atEdge

  if (advance) return defaultState

  // if (advance) return enemies.map(enemy => {
  //   let age = enemy.age + elapsedTime
  //     , advance_ = age >= enemy.nextAdvanceTime
  //     , nextAdvanceTime = advance ? Number.MAX_SAFE_INTEGER : enemy.nextAdvanceTime

  //   return Object.assign({}, enemy, {
  //     age
  //   , didMove: true
  //   })
  // })

  return enemies.map(enemy => {
    let age = enemy.age + elapsedTime
      , move = age >= enemy.nextMoveTime
      , nextMoveTime = move ? age + (grid.length * period) : enemy.nextMoveTime
      , nextAdvanceTime = age + enemy.row * period
      , left = move ? enemy.left + hStepSize * enemy.hDirection : enemy.left
      , flip = move ? !enemy.flip : enemy.flip
      , selected = enemy.key == leftmost.key || enemy.key == rightmost.key
      , didMove = move || (allDidMove ? false : enemy.didMove)

    return Object.assign({}, enemy, {
      age
    , left
    , flip
    , selected
    , nextMoveTime
    , nextAdvanceTime
    , didMove
    , didAdvance: false
    })
  })
}

export const enemies = (state = defaultState, action) => {
  switch (action.type) {
    case DESTROY_ENEMY:
      return R.reject((e => e.key == action.enemy.key), state)
     case UPDATE:
      return update(state, action)
    default:
      return state
  }
}

const addExplosion = (state, action) => {
  let {top, left} = action.enemy
    , key = `exposion-${Date.now()}`
  return {top, left, key, age: 0}
}

const updateEplosions = (state, action) => {
  return state.reduce((acc, explosion) => {
    if (explosion.age >= 200) return acc
    let age = explosion.age + action.elapsedTime
    return acc.concat(Object.assign({}, explosion, {age}))
  }, [])
}

export const enemyExplosions = (state = [], action) => {
  switch (action.type) {
    case DESTROY_ENEMY:
      return state.concat(addExplosion(state, action))
    case UPDATE:
      return updateEplosions(state, action)
    default:
      return state
  }
}
