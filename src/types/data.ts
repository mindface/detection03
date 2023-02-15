
export interface Card {
  id?:number;
  ID?:number;
  title: string;
  description: string;
  setNumber: number;
  coreNumber: number;
}

export interface Data {
  id: string;
  scoreId?: number;
  title: string;
  dataList?: Keypoint[][];
}

export interface FetchData {
  id:number;
  scoreId?: number;
  title: string;
  dataList?: string;
}

export interface Keypoint {
  name?: string;
  score?: number;
  x: number;
  y: number;
  z: number;
}

export interface GetData {id: string, title: string, dataList: string }
