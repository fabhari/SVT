
import React, { useEffect, useState } from "react";





const svt = () => {

    const sendToBackground=(message:string) : void => {
        // chrome.runtime.sendMessage(message, (response) => {
        //     console.log('Response:', response);
        //   });
    }

    useEffect(()=>{
        // chrome.runtime.onMessage.addListener((message) => {
        //     switch (message.type) 
        //     {
        //       case 'JOB_DETECTED':
        //         console.log('New job detected:', message.data);
        //         break;
        //     }
        // });
     
    },[]);
    return <div>SVT</div>
}


export default svt;