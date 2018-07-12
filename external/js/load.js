/*
 * AudaraLivechat
 * Use of this software constitures aceptance of the End User License.
 * DreamPBX and Audara are registered trademarks of Gecko SAS.
 *      
 * Version: 1.0
 * Date: July 05th - 2018
 * Copyright®
 */
if (typeof (audara) === "undefined") {
    audara = {};
}
if (!audara.action) {
    audara.action = {
        start: function () {
            var mg = this;
            mg.loadjs(); // function to load the js
            mg.active(); //function to append the DOM with the chat box
        },       
        loadjs: function () {            
            if ( !window.jQuery ) {
                var f = document.createElement("script");
                f.src = "https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js";
                document.getElementsByTagName("head")[0].appendChild(f);
            }
        },
        maximize: function(){
            var height = "460px";
            var width = "310px";
            var f = document.getElementById("gecko-iframe");            
            f.style.height = height;
            f.style.maxHeight  = height;
            f.style.minHeight  = height;
            f.style.width = width;
            f.style.maxWidth  = width;
            f.style.minWidth  = width;
            f.style.bottom = "7px";

            /*var l = document.getElementById("dacpf5V-1530800744955");
            var d = document.getElementById("gecko-chat-frame");
            var m = document.getElementById("gecko-iframe"); 

            if( l != null ){
                l.style.display = "";
                m.style.display = "none";                
                return false;
            }            
            m.style.display = "none";                
            d.innerHTML+='<iframe id="dacpf5V-1530800744955" src="maximize.html" frameborder="0" scrolling="no" title="chat widget" class="" style="outline: none !important; visibility: visible !important; resize: none !important; box-shadow: none !important; overflow: visible !important; background: none transparent !important; opacity: 1 !important; position: fixed !important; border: 0px !important; padding: 0px !important; transition-property: none !important; cursor: auto !important; float: none !important; transform: rotate(0deg) translateZ(0px) !important; transform-origin: 0px center 0px !important; bottom: 10px !important; top: auto !important; right: 10px !important; left: auto !important; width: 310px !important; max-width: 310px !important; min-width: 310px !important; height: 460px !important; max-height: 460px !important; min-height: 460px !important; z-index: 1000002 !important; margin: 0px !important; border-radius: 5px;"></iframe>';*/
        },
        minimize: function(){
            var height = "40px";
            var width = "260px";
            var f = document.getElementById("gecko-iframe");            
            f.style.height = height;
            f.style.maxHeight  = height;
            f.style.minHeight  = height;
            f.style.width = width;
            f.style.maxWidth  = width;
            f.style.minWidth  = width;
            f.style.bottom = "0px";
            /*var q = document.getElementById("dacpf5V-1530800744955");
            q.style.display = "none";
            var w = document.getElementById("gecko-iframe");            
            w.style.display = "";*/
        },  
        newWindow: function(){
            var d = document.getElementById("gecko-chat-frame");
            d.style.display = "none";
            var myWindow = window.open("newWindow.html", "", "width=600,height=600,titlebar=1");            
        },
        switchVideo: function(){
            var d = document.getElementById("gecko-chat-frame");
            d.style.display = "none";
            var myWindow = window.open("videoWindow.html", "", "width=1024,height=768");
            myWindow.onresize = function(size){
                var minimum    = [640, 480];
                var current    = [myWindow.outerWidth, myWindow.outerHeight];
                var restricted = [];
                var i          = 2;
                while(i-- > 0){
                    restricted[i] = minimum[i] > current[i] ? minimum[i] : current[i];
                }
                myWindow.resizeTo(restricted[0], restricted[1]);
            };
        },        
        active: function () {
            window.onload = function () {                
                var f = document.createElement("div");
                f.id = "gecko-chat-frame";
                f.className = "chat_window";
                document.body.appendChild(f);

                // :::::::::::::::::::::: Insert your source here :::::::::::::::::::::::::::::::
                f.innerHTML='<iframe id="gecko-iframe" src="index.html" allow="microphone; camera" frameborder="0" scrolling="no" title="chat widget" style="outline: none !important; visibility: visible !important; resize: none !important; box-shadow: none !important; overflow: visible !important; background: none transparent !important; opacity: 1 !important; position: fixed !important; border: 0px !important; padding: 0px !important; transition-property: none !important; z-index: 1000001 !important; cursor: auto !important; float: none !important; height: 40px !important; min-height: 40px !important; max-height: 40px !important; width: 260px !important; min-width: 260px !important; max-width: 260px !important; transform: rotate(0deg) translateZ(0px) !important; transform-origin: 0px center 0px !important; margin: 0px !important; top: auto !important; bottom: 0px !important; right: 10px !important; left: auto !important; display: block !important;"></iframe>'
               
                window.addEventListener('message', function (event) {
                    if (event.data == 'maximize'){
                        audara.action.maximize();
                        //$("#gecko-chat-frame").addClass("active");
                    }else if (event.data == 'minimize'){
                        audara.action.minimize();
                        //$("#gecko-chat-frame").removeClass("active");
                    }else if (event.data == 'newWindow'){
                        audara.action.newWindow();
                        //$("#gecko-chat-frame").removeClass("active");
                    }else if (event.data == 'switchVideo'){
                        audara.action.switchVideo();
                        //$("#gecko-chat-frame").removeClass("active");
                    }else if (event.data == 'start'){                       
                       // $("#gecko-chat-frame").addClass("start");
                       // $("#gecko-iframe").addClass("gecko-iframe-active");
                    }else if (event.data == 'finish'){
                        $("#gecko-chat-frame").removeClass("start");
                        $("#gecko-iframe").removeClass("gecko-iframe-active");
                    }else if (event.data.message == 'popup') {
                        $('#gecko-modal').show();
                        $("#iframeURL").attr('src', event.data.url);
                        console.log(event);
                    }
                    else return;
                }, false);
            }
        }        
    }
}
audara.action.start();