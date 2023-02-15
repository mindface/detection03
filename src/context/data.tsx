import { Dispatch, createContext, useReducer, ReactNode } from "react";
import { Data } from "../types/data";

interface State {
  dataList: Data[]
  data: Data
}

interface Action {
  type: string,
  dataList?: Data[],
  data?: any
}

interface Props {
  children: ReactNode
}

export const dataContext = createContext({} as {
  state: State,
  dispatch: Dispatch<Action>
})

const reducer = (state:State, action:Action) => {
  const actionList = (action.dataList ?? []);
  switch (action.type) {
    case "data/add":
      return {
        ...state,
        dataList: actionList
      }
    case "data/set":
      return {
        ...state,
        dataList: actionList
      }
    case "data/update":
      const __ = actionList.map((item) => {
        return item.id === action.data!.id ? action.data : item; 
      })
      return {
        ...state,
        dataList: __
      }
    default:
      return state
  }
}

const initalState: State = {
  dataList: [],
  data: {
    id: "1",
    title: "testtest",
    dataList: []
  }
}

export const DataProvider = (props:Props) => {
  const [state,dispatch] = useReducer(reducer,initalState);
  return <dataContext.Provider value={{state, dispatch}}>{props.children}</dataContext.Provider>
}