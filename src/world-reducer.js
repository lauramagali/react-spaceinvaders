import {
  UPDATE_WORLD
, DID_UPDATE_WORLD
} from './actions'

const defaultState = { outdated: false }

export const world = (state = defaultState, action) => {
  switch (action.type) {
    case UPDATE_WORLD:
      return { outdated: true }
    case DID_UPDATE_WORLD:
      return { outdated: false }
    default:
      return state
  }
}