import { data } from "@tensorflow/tfjs";
import React, { useRef, useState, useEffect } from "react";
import { setTimeout } from "timers";
import "./App.css";
import Processor, { VideoReadyPayload } from "./augmentedReality/Processor";
import StatsPanel from "./components/StatsPanel";

// start processing video
const processor = new Processor();
const rest_img = document.getElementById("rest-capture");
const capture = document.getElementById("capture");
let last_rest = '';
let d_url = null;
function App() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);

    const [videoWidth, setVideoWidth] = useState(100);
    const [videoHeight, setVideoHeight] = useState(100);

    const [imageCaptureTime, setImageCaptureTime] = useState(0);
    const [thresholdTime, setThresholdTime] = useState(0);
    const [connectedComponentTime, setConnectedComponentTime] = useState(0);
    const [getCornerPointsTime, setGetCornerPOintsTime] = useState(0);
    const [extractImageTime, setExtractImageTime] = useState(0);
    const [extractBoxesTime, setExtractBoxesTime] = useState(0);
    const [ocrTime, setOcrTime] = useState(0);
    const [solveTime, setSolveTime] = useState(0);

    // start the video playing
    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            processor.startVideo(video).then(
                () => console.log("Video started"),
                (error) => alert(error.message)
            );
        }
    }, [videoRef]);

    // render the overlay
    useEffect(() => {
        const interval = window.setInterval(() => {
            //capture.style.display = 'none';
            const canvas = previewCanvasRef.current;
            if (canvas && processor.isVideoRunning) {
                // update the peformance stats
                setImageCaptureTime(processor.captureTime);
                setThresholdTime(processor.thresholdTime);
                setConnectedComponentTime(processor.connectedComponentTime);
                setGetCornerPOintsTime(processor.cornerPointTime);
                setExtractImageTime(processor.extractPuzzleTime);
                setExtractBoxesTime(processor.extractBoxesTime);
                setOcrTime(processor.neuralNetTime);
                setSolveTime(processor.solveTime);
                // display the output from the processor
                const context = canvas.getContext("2d");
                if (context) {
                    context.drawImage(processor.video, 0, 0);
                    if (processor.corners) {
                        const {
                            topLeft,
                            topRight,
                            bottomLeft,
                            bottomRight,
                        } = processor.corners;
                        context.strokeStyle = "rgba(0,200,0,0.5)";
                        context.fillStyle = "rgba(0,0,0,0.3)";
                        context.lineWidth = 3;
                        context.beginPath();
                        context.moveTo(topLeft.x, topLeft.y);
                        context.lineTo(topRight.x, topRight.y);
                        context.lineTo(bottomRight.x, bottomRight.y);
                        context.lineTo(bottomLeft.x, bottomLeft.y);
                        context.closePath();
                        context.stroke();
                        context.fill();
                    }
                    if (processor.gridLines) {
                        context.strokeStyle = "rgba(0,200,0,0.5)";
                        context.lineWidth = 2;
                        processor.gridLines.forEach((line) => {
                            context.moveTo(line.p1.x, line.p1.y);
                            context.lineTo(line.p2.x, line.p2.y);
                        });
                        context.stroke();
                    }
                    if (processor.solvedPuzzle) {
                        context.fillStyle = "rgba(0,200,0,1)";
                        for (let y = 0; y < 9; y++) {
                            for (let x = 0; x < 9; x++) {
                                if (processor.solvedPuzzle[y][x]) {
                                    const {
                                        digit,
                                        digitHeight,
                                        digitRotation,
                                        position,
                                        isKnown,
                                    } = processor.solvedPuzzle[y][x];
                                    if (!isKnown) {
                                        context.font = `bold ${digitHeight}px sans-serif`;
                                        context.translate(position.x, position.y);
                                        context.rotate(Math.PI - digitRotation);
                                        context.fillText(
                                            digit.toString(),
                                            -digitHeight / 4,
                                            digitHeight / 3
                                        );
                                        context.setTransform();
                                    }
                                }
                            }
                        }
                        //console.log('Solved Puzzle' + processor.solvedPuzzle)
                        //to get unique key so stop reprint the result
                        var mashed = Object.keys(processor.solvedPuzzle).reduce(function (acc, key) {
                            return `${acc}_${processor.solvedPuzzle[key].map(t => t.digit).join()}`;
                        }, '');
                        console.log('rest match', mashed, last_rest);
                        capture.style.display = '';
                        var dataurl = canvas.toDataURL();
                        ((du) => setTimeout(() => {
                            capture.style.display = 'none';
                        }, 2000))(dataurl);
                        
                        //disable auto capture and move to long press
                        //if (last_rest != mashed) {
                        //    rest_img.innerHTML = rest_img.innerHTML + "<img src='" + canvas.toDataURL() + "'>";
                        //    last_rest = mashed;
                        //}

                        //if (last_rest != mashed) {
                        //    if (long_touch) {
                        //        rest_img.innerHTML = rest_img.innerHTML + "<img src='" + canvas.toDataURL() + "'>";
                        //        last_rest = mashed;
                        //    }
                        //}
                    }
                }
            }
        }, 100);
        return () => {
            window.clearInterval(interval);
        };
    }, [previewCanvasRef]);

    //var timer;
    //var touchduration = 500; //length of time we want the user to touch before we do something

    //var long_touch = false;
    //var touchstart = () => {
    //    long_touch = false;
    //    console.log('long pressed start reset...')
    //    timer = setTimeout(onlongtouch, touchduration);
    //}
    //var touchend = () => {
    //    long_touch = false;
    //    //stops short touches from firing the event
    //    console.log('long pressed end reset...')
    //    if (timer)
    //        clearTimeout(timer); // clearTimeout, not cleartimeout..
    //}
    //var onlongtouch = () => {
    //    console.log('long pressed...')
    //    long_touch = true;
    //};
    //window.addEventListener('touchstart', touchstart, false);
    //window.addEventListener('touchend', touchend, false);

    // update the video scale as needed
    useEffect(() => {
        function videoReadyListener({ width, height }: VideoReadyPayload) {
            setVideoWidth(width);
            setVideoHeight(height);
        }
        processor.on("videoReady", videoReadyListener);
        return () => {
            processor.off("videoReady", videoReadyListener);
        };
    });

    return (
        <div className="App">
            {/* need to have a visible video for mobile safari to work */}
            <video
                ref={videoRef}
                className="video-preview"
                width={10}
                height={10}
                playsInline
                muted
            />
            <canvas
                ref={previewCanvasRef}
                className="preview-canvas"
                width={videoWidth}
                height={videoHeight}
            />
            <StatsPanel
                imageCaptureTime={imageCaptureTime}
                thresholdTime={thresholdTime}
                connectedComponentTime={connectedComponentTime}
                getCornerPointsTime={getCornerPointsTime}
                extractImageTime={extractImageTime}
                extractBoxesTime={extractBoxesTime}
                ocrTime={ocrTime}
                solveTime={solveTime}
            />
        </div>
    );
}

export default App;
