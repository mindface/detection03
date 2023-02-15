import React, { ChangeEventHandler, useContext, useState, useRef, useEffect } from 'react'

import * as poseDetection from '@tensorflow-models/pose-detection';
import * as posenet from '@tensorflow-models/posenet';
import '@tensorflow/tfjs-backend-webgl';

import { dataContext } from '../context/data';
import { Keypoint, Data, GetData, FetchData } from '../types/data'

const setColor = 'deepskyblue';

export function drawSegment(a: Keypoint, b: Keypoint, color: string, scale: number, ctx:CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.moveTo(Math.floor(a.x) * scale, Math.floor(a.y) * scale);
  ctx.lineTo(Math.floor(b.x) * scale, Math.floor(b.y) * scale);
  ctx.lineWidth = 1;
  ctx.strokeStyle = color;
  ctx.stroke();
}

export function drawSkeleton(setkeypoints: posenet.Keypoint[], ctx:CanvasRenderingContext2D, scale = 1) {
  if(setkeypoints.length === 0) return;
  const keypoints = setkeypoints as unknown as Keypoint[];
  let left_keypoint: Keypoint = {
    name: "",
    score: 0,
    x: 0,
    y:0,
    z:0,
  };
  let right_keypoint: Keypoint = {
    name: "",
    score: 0,
    x: 0,
    y:0,
    z:0,
  };
  const adjacentKeyPoints =
    posenet.getAdjacentKeyPoints(setkeypoints, 0.1) as unknown as Keypoint[][];
  adjacentKeyPoints.forEach((keypoints : Keypoint[]) => {
    drawSegment(
        keypoints[0], keypoints[1], setColor,
        scale, ctx);
  });

  const leftKeypointList = ["left_shoulder","left_hip","left_knee","left_ankle"];
  const rightKeypointList = ["right_shoulder","right_hip","right_knee","right_ankle"];
  keypoints.forEach((keypoint : Keypoint) => {
    if( "left_shoulder" === left_keypoint.name && "left_hip" === keypoint?.name ) {
      drawSegment(left_keypoint, keypoint, setColor,
        scale, ctx);
    }
    if( "left_hip" === left_keypoint.name && "left_knee" === keypoint?.name ) {
      drawSegment(left_keypoint, keypoint, setColor,
        scale, ctx);
    }
    if( "left_knee" === left_keypoint.name && "left_ankle" === keypoint?.name ) {
      drawSegment(left_keypoint, keypoint, setColor,
        scale, ctx);
    }
    if( "right_shoulder" === right_keypoint.name && "right_hip" === keypoint?.name ) {
      drawSegment(right_keypoint, keypoint, setColor,
        scale, ctx);
    }
    if( "right_hip" === right_keypoint.name && "right_knee" === keypoint?.name ) {
      drawSegment(right_keypoint, keypoint, setColor,
        scale, ctx);
    }
    if( "right_knee" === right_keypoint.name && "right_ankle" === keypoint?.name ) {
      drawSegment(right_keypoint, keypoint, setColor,
        scale, ctx);
    }
    if(leftKeypointList.includes(keypoint.name!)) {
      left_keypoint = keypoint;
    }
    if(rightKeypointList.includes(keypoint.name!)) {
      right_keypoint = keypoint;
    }
  });
}

export function ContentPoseTree() {
  const videoWidth = 560;
  const videoHeight = 400;
  const [stateData,setStateData] = useState<Data[]>([]);
  // useContextの仕様を確認
  const stateDataList = useRef<{[k:string]:Array<Keypoint[]>}>({});
  const imgViewerArea = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  const {state,dispatch} = useContext(dataContext);
  useEffect(() => {
    (async() => {
      const ctx = canvas.current?.getContext('2d');
      const res = await fetch('http://localhost:8008/posedetection_all', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      res.json().then((res) => {
        // res.forEach((info: GetData) => {
        //   const points = JSON.parse(info.dataList) as unknown as Keypoint[][]
        //   points?.forEach((keyPoint) => {
        //     const setSkeleton = keyPoint as unknown as posenet.Keypoint[]
        //     const setPoints = keyPoint as unknown as Keypoint[]
        //     drawSkeleton(setSkeleton,ctx!);
        //     setCanvasPoint(setPoints,ctx!);
        //   })
        // });
        const list:Data[] = res.map((item: FetchData) => {
          if(item.dataList) {
            return {...item,dataList: (JSON.parse(item.dataList) as unknown as Keypoint[][])}
          }
          return item;
        })
        setStateData(list);
      })
    })();
  },[]);

  const setCanvasPoint = (keypoints: Keypoint[], ctx: CanvasRenderingContext2D) => {
    keypoints &&
      keypoints.forEach((item) => {
        ctx.beginPath();
        ctx.arc(Math.floor(item.x),Math.floor(item.y),4,0, Math.PI * 2, false);
        ctx.fillStyle = setColor;
        ctx.fill();
        ctx.closePath();
      });
  }

  const setBorn = (id: string) => {
    const ctx = canvas.current?.getContext('2d');
    ctx?.clearRect(0,0,videoWidth,videoHeight);
    stateData.forEach((info) => {
      if(!info.dataList) return;
      if(id === info.id){
        info.dataList?.forEach((keyPoint) => {
          const setSkeleton = keyPoint as unknown as posenet.Keypoint[]
          const setPoints = keyPoint as unknown as Keypoint[]
          drawSkeleton(setSkeleton,ctx!);
          setCanvasPoint(setPoints,ctx!);
        })
      }
    });
  }

  const deleteBorn = (id: string) => {
    (async() => {
      const res = await fetch('http://localhost:8008/deleteBoneAction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({id:id})
      })
      res.json().then((res) => {
        console.log(res)
      })
    })();
  }

  return (<div className="content">
      <div className="module-list flex p-1">
        {stateData.map((item) => <div key={item.id} className="p-1">
          <p className="text">{item.id}</p>
          <p>
            <button onClick={() => setBorn(item.id)}>setBorn</button>
            <button onClick={() => deleteBorn(item.id)}>deleteBorn</button>
          </p>
        </div>)}
      </div>
      <div className="filds">
        <div className="fild">
        </div>
      </div>
      <div className="canvas-viewer">
        <canvas ref={canvas} width={videoWidth} height={videoHeight} ></canvas>
      </div>
      <div className="viewer" ref={imgViewerArea}>
      </div>
    </div>)
}

