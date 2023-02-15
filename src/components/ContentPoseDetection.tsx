import React, { ChangeEventHandler, useContext, useState, useRef, useEffect } from 'react'

import * as poseDetection from '@tensorflow-models/pose-detection';
import * as posenet from '@tensorflow-models/posenet';
import '@tensorflow/tfjs-backend-webgl';

import { dataContext } from '../context/data';
import { Keypoint, Data, GetData } from '../types/data'

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
  const keypoints = setkeypoints as unknown as Keypoint[];
  let left_keypoint: Keypoint = {
    name: "",
    x: 0,
    y:0,
    z:0,
  };
  let right_keypoint: Keypoint = {
    name: "",
    x: 0,
    y:0,
    z:0,
  };
  console.log(setkeypoints)
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

export function ContentPoseDetection() {
  const videoWidth = 560;
  const videoHeight = 400;
  const [fileName, setFileName] = useState("");
  const [scoreId, setScoreId] = useState(0);
  const [videoLoad, setVideoLoad] = useState(true);
  const [score, setScore] = useState<string[]>([]);
  const stateData = useRef<Array<Keypoint[]>>([]);
  // useContextの仕様を確認
  const stateDataList = useRef<{[k:string]:Array<Keypoint[]>}>({});
  const imgViewerArea = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  const {state,dispatch} = useContext(dataContext);

  const model = poseDetection.SupportedModels.BlazePose;
  const detectorConfig = {
    runtime: 'tfjs',
    enableSmoothing: true,
    modelType: 'full'
  };
  const [detector, setDetector] = useState<poseDetection.PoseDetector>();

  useEffect(() => {
    (async() => {
      const detector = await poseDetection.createDetector(model, detectorConfig);
      if(detector) {
        setDetector(detector);
      }
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

  const addMovieLoadAction: ChangeEventHandler<HTMLInputElement> = (e: React.ChangeEvent) => {
    const element = e.currentTarget as HTMLInputElement;
    if(!element) return;
    const file = element.files![0]
    const url = URL.createObjectURL(file)
    file.name ?? setFileName((file.name as string).split('.')[0]);
    if(!video.current) return;
    video.current!.src = url;
    video.current?.addEventListener('timeupdate' , (e:Event) => {
      const ctx = canvas.current?.getContext('2d');
      const w = video.current?.clientWidth;
      const h = video.current?.clientHeight;
      canvas.current!.width = w ?? 100;
      canvas.current!.height = h ?? 100;
      ctx?.drawImage(video.current!,0,0,w!,h!);
      (async () => {
        const poses = await detector?.estimatePoses(canvas.current!) as unknown as { keypoints:Keypoint[], score: number}[];
        if(!poses) return;
        poses.forEach((pose:{ keypoints:Keypoint[], score: number},index: number) => {
          // 型と実際の値が違うため調整
          const setPoints = pose.keypoints as unknown as posenet.Keypoint[]
          drawSkeleton(setPoints,ctx!);
          if(pose.keypoints && pose.keypoints?.length) {
            setScoreId(pose.score);
            stateData.current.push(pose.keypoints);
          }
        });
        setCanvasPoint(poses[0].keypoints,ctx!);
      })();
      // stateData.current.push([{score: stateData.current.length,name:"###",x:0,y:0,z:0}]);
    });
  }

  const saveTemporaryData = () => {
    const idNumber = `E${state.dataList.length + 1}`;
    stateDataList.current = {...stateDataList.current,idNumber:stateData.current};
    const data = {
      id: idNumber,
      scoreId: scoreId,
      title: fileName,
      dataList: stateData.current
    };
    const dataList = state.dataList;
    localStorage.setItem(idNumber,JSON.stringify(stateData.current));
    dataList.push(data)
    dispatch({type:"data/add",dataList});
  }

  const changeFile = (e: React.ChangeEvent) => {
    const element = e.target as HTMLInputElement;
    const file = element?.files![0];
    const image = new Image();
    const reader = new FileReader();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    reader.onloadend = (read) => {
      if(read?.target?.result) {
        image.src = read?.target?.result as string;
        image.onload = () => {
          canvas.width = image.naturalWidth
          canvas.height = image.naturalHeight
          imgViewerArea.current?.appendChild(canvas);
          ctx?.drawImage(image,0,0);
          (async () => {
            const poses = await detector!.estimatePoses(image) as unknown as { keypoints: Keypoint[]}[];
            poses.forEach((pose:{ keypoints: Keypoint[]}) => {
              // 型と実際の値が違うため調整
              const setPoints = pose.keypoints as unknown as posenet.Keypoint[]
              drawSkeleton(setPoints,ctx!)
            });
            setCanvasPoint(poses[0].keypoints,ctx!);
          })();
        }
      }
    }
    reader.readAsDataURL(file);
    // image.onload = () => {
    //   (async () => {
    //     const estimationConfig = {flipHorizontal: true};
    //     const timestamp = performance.now();
    //     const poses = await detector.estimatePoses(image, estimationConfig, timestamp);
    //     console.log(image)
    //     console.log(poses)
    //   })();
    //   URL.revokeObjectURL(image.src);
    // }
    // image.src = URL.createObjectURL(file);
    // imgViewerArea.current.appendChild(image);
  }

  useEffect(() => {
    (async() => {
      const res = await fetch('http://localhost:8008/posedetection_all', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      res.json().then((res) => {
        const dataList: Data[] = [];
        res.forEach((info: GetData) => {
          dataList.push({...info,dataList: JSON.parse(info.dataList)})
        });
        dispatch({type:"data/set",dataList});
      })
    })();
  },[])

  const saveData = () => {
    // setVideoLoad(false);
    const stateDataCurrent = stateData.current?.filter((keyPoint,index) => {
      if(viewPose.includes(index)) {
        return keyPoint;
      }
    })
    console.log(stateDataCurrent)

    const data = {
      id: 'userId' + state.dataList.length + 1,
      scoreId: scoreId,
      title: fileName,
      dataList: stateDataCurrent
    };
    (async() => {
      const res = await fetch('http://localhost:8008/addBoneAction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if(res) {
        console.log(res)
        setVideoLoad(true);
      }
    })();
  }

  const [viewPose,setViewPose] = useState<number[]>([]);

  const reRenderCanvas = (id: number) => {
    stateData.current.forEach((item,index) => {
      if(index === id && !viewPose.includes(id) ) {
        setViewPose([...viewPose,id])
      }else if(index === id && viewPose.includes(id) ) {
        const list = viewPose.filter((_id) => _id !== id);
        setViewPose(list)
      }
    })
  }

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    ctx?.clearRect(0,0,videoWidth,videoHeight);
    stateData.current?.forEach((keyPoint,index) => {
      if(viewPose.includes(index)) {
        const setSkeleton = keyPoint as unknown as posenet.Keypoint[]
        const setPoints = keyPoint as unknown as Keypoint[]
        drawSkeleton(setSkeleton,ctx!);
        setCanvasPoint(setPoints,ctx!);
      }
    })
  },[viewPose])

  return (<div className="content">
      { videoLoad && <div>
        <div className="filds">
          <div className="fild">
            <input type="file" onChange={addMovieLoadAction} />
          </div>
          <div className="fild">
            <div className="view-content video">
              <video controls ref={video} width={videoWidth} height={videoHeight} ></video>
            </div>
          </div>
          <div className="fild">
            <input type="file" onChange={changeFile} />
          </div>
        </div>
        <div className="fild flex over-scroll">
          {stateData.current.map((item,index) => <div className='item p-1' >
            <label htmlFor={`viewPose${index}`} className="label">pose{index}</label>
            <input type="checkbox" name="" id={`viewPose${index}`} onChange={() => reRenderCanvas(index)} />
          </div>)}
        </div>
        <div className="canvas-viewer">
          <canvas ref={canvas}></canvas>
        </div>
        <div className="viewer" ref={imgViewerArea}>
        </div>
        <p><button onClick={() => saveTemporaryData()}>saveTemporaryData save</button></p>
        <p><button onClick={() => saveData()}>borne save</button>保存すると画像は初期化</p>
      </div> }
    </div>)
}

