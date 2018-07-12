var videoInput;
var videoOutput;
var webRtcPeer;
var registerName = null;
var registerState = null;
var callState = null;
var wsocket;
var isAudioEnabled = true;
var isWebcamEnabled = true;

settings = {
    connection: {
        ws: "wss",
        ip: "localhost",
        port: '8443',
        service: '/livechat'
    },
    registerState: {
        NOT_REGISTERED: 0,
        REGISTERING: 1,
        REGISTERED: 2
    },
    callState: {
        NO_CALL: 0,
        PROCESSING_CALL: 1,
        IN_CALL: 2
    }
};

// Audara-Kurento Web Socket Connection
livechat = {};

livechat.vm = {
    chatMessage: [],
    userid: '',
    username: '',
    password: '',
    sessionid: '',
    agentNum: '',
    agentName: '',
    campaigns: '',
    livechatid: '',
    chathistory: '',
    agentResponse: false,
    welResponse: true,
    timeStart: '',
    time: '',
    display: 'login',
    reset: function () {
        this.chatMessage = [];
        this.userid = '';
        this.username = '';
        this.password = '';
        this.sessionid = '';
        this.agentNum = '';
        this.agentName = '';
        this.campaigns = '';
        this.livechatid = '';
        this.chathistory = '';
        this.agentResponse = false;
        this.welResponse = true;
        this.timeStart = '';
        this.time = '';
        this.display = 'login';
    }
};

var iceServersConfiguration = {
    'iceServers':[
    {'urls':['stun:149.56.115.238:3478']},
    {'urls':['turn:149.56.115.238:3478'],'username':'audaraturn','credential':'audaraturnpass'}]
};

livechat.ws = {
    connect: function (ip, port, service) {
        var lvc = this;
        wsocket = new WebSocket(settings.connection.ws + "://" + settings.connection.ip + ":" + settings.connection.port + "" + settings.connection.service);
        wsocket.onopen = lvc.onOpen;
        wsocket.onmessage = lvc.onMessage;
        wsocket.onerror = lvc.onError;
        wsocket.onclose = lvc.onClose;
    },
    onOpen: function () {
        console.info("WS Connected.");
        var message = {
            id: 'start',
            command: 'start'
        };
        sendMessage(message);  
        $("#loginCancel").show();
        $("#loginSubmit").show();
        $("#loginWS").hide();              
        //register();
    },
    onClose: function () {
        console.info("WS Closed.");
        stop();
        livechat.vm.reset(); // Reset Vars
        $('#lvmessage').html("");
        $('#lvroom').html("");
        $('#lvusername').val("");
        $('#lvpassword').val("");
        showPanel(livechat.vm.display);
        $('#btnclose').hide();
        $('#btnview').hide();
    },
    onError: function (error) {
        console.error("WS Error : " + error);
    },
    onMessage: function (message) {
        var parsedMessage = JSON.parse(message.data);
        console.log(parsedMessage);
        switch (parsedMessage.id) {
            case 'registerResponse':
                registerResponse(parsedMessage);
                console.info('Received message: ' + message.data);
                break;
            case 'callResponse':
                callResponse(parsedMessage);
                break;
            case 'incomingCall':
                incomingCall(parsedMessage);
                break;
            case 'startCommunication':
                startCommunication(parsedMessage);
                break;
            case 'stopCommunication':
                console.info("Communication ended by remote peer");
                stop(true);
                window.alert("The video is Stopped.");
                break;
            case 'iceCandidate':
                webRtcPeer.addIceCandidate(parsedMessage.candidate);
                break;

            case 'DISConnected':
                break;
            case 'DISError':
                break;
            case 'DISClose':
                break;

            default:
                switch (parsedMessage.command) {
                    case 'START':
                        livechat.vm.sessionid = parsedMessage.message.session;
                        if (livechat.vm.username !== '' && livechat.vm.password !== '') {
                            livechat.ws.login(livechat.vm.username, livechat.vm.password);
                        };
                        break;
                    case 'LOGIN_STATE':
                        if (parsedMessage.message.state === "true") {
                            $('#lvloginmsg').html('');
                            livechat.vm.userid = parsedMessage.message.userid;
                            livechat.vm.useremail = parsedMessage.message.useremail;
                            livechat.vm.display = "services";
                            showPanel(livechat.vm.display);
                        } else {
                            $('#lvloginmsg').html("<span class='error'>Please enter valid username and password</span>");
                        }
                        break;
                    case 'UNAVAILABLE_AGENTS':
                        addWelcomeMessage("Unavailable Agents. Try again later.");
                        break;
                    case 'CONNECT':
                        livechat.vm.agentNum = parsedMessage.message.agentnum;
                        livechat.vm.agentName = parsedMessage.message.agentname;
                        livechat.vm.livechatid = parsedMessage.message.livechatid;
                        livechat.vm.chathistory = parsedMessage.message.chathistory;
                        livechat.userdetails = parsedMessage.message;
                        $("#userid").val(livechat.vm.userid);
                        $("#username").val(livechat.vm.username);
                        $("#peer").val(livechat.vm.agentNum);
                        document.getElementById("chatinput").disabled = false;
                        addWelcomeMessage("You are now chatting with " + livechat.vm.agentName + "");
                        break;
                    case 'ENTERQUEUE':
                        addWelcomeMessage(parsedMessage.message.greeting);
                        break;
                    case 'MESSAGE_TO_USER':
                        livechat.vm.welResponse = false;
                        livechat.vm.agentResponse = true;
                        livechat.vm.time = (moment().format('DD-MM-YYYY HH:mm:ss'))
                        var userChat = {
                            type: 'Agent',
                            message: parsedMessage.message.chatmsg,
                            time: (moment().format('DD-MM-YYYY HH:mm:ss'))
                        };
                        livechat.vm.chatMessage.push(userChat);
                        addRoomMessage(userChat);
                        $('#btnview').show();
                        break;
                    case 'COMPLETEAGENT':
                        var systemChat = {
                            type: 'System',
                            message: "Chat Finalizado. Agente finalizo el servicio.",
                            time: (moment().format('DD-MM-YYYY HH:mm:ss'))
                        };
                        livechat.vm.chatMessage.push(systemChat);
                        addRoomMessage(systemChat);
                        stop();
                        document.getElementById("chatinput").disabled = true;
                        $('#btnview').hide();
                        break;
                    case 'INACTIVITY':
                        var systemChat = {
                            type: 'System',
                            message: "Chat Finalizado por Inactividad.",
                            time: (moment().format('DD-MM-YYYY HH:mm:ss'))
                        };
                        livechat.vm.chatMessage.push(systemChat);
                        addRoomMessage(systemChat);
                        stop();
                        document.getElementById("chatinput").disabled = true;
                        $('#btnview').hide();
                        break;
                    case 'AGENT_REQUEST_VIDEO':
                        var namevideo = "client_" + (moment().format('YYYYMMDD_HHmmss')) + "_agent_" + livechat.vm.agentNum + "_" + livechat.vm.userid + "_" + livechat.vm.livechatid + "_" + livechat.vm.chathistory;

                        if (confirm('Do you accept the video call?')) {
                            var Action = {
                                id: "AGENT_RESPONSE_VIDEO",
                                command: "AGENT_RESPONSE_VIDEO",
                                code: "81011",
                                message: {
                                    videoname: namevideo,
                                    videourl: namevideo,
                                    response: "ACCEPT",
                                    session: livechat.vm.sessionid
                                }
                            };
                            sendMessage(Action);
                            setTimeout(function () {
                                call();
                                livechat.vm.display = "video";
                                showPanel(livechat.vm.display); 
                            }, 3000);
                        } else {
                            var Action = {
                                id: "AGENT_RESPONSE_VIDEO",
                                command: "AGENT_RESPONSE_VIDEO",
                                code: "81011",
                                message: {
                                    videoname: namevideo,
                                    videourl: namevideo,
                                    response: "REJECT",
                                    session: livechat.vm.sessionid
                                }
                            };
                            sendMessage(Action);
                        }
                        break;
                    case 'USER_RESPONSE_VIDEO':
                        if (parsedMessage.message.response == "ACCEPT") {
                            console.log("Video Call accepted by Agent.");
                            setTimeout(function () {
                                call();
                            }, 3000);
                        }
                        break;
                    case 'PING':
                        livechat.ws.ping();
                        break;

                    default:
                        console.error('Unrecognized message', parsedMessage);
                        break;
                }
                break;
        }
    },
    ping: function () {
        var Action = {
            id: "PONG",
            command: "PONG",
            code: "81098",
            message: {
                session: livechat.vm.sessionid
            }
        };
        sendMessage(Action);
    },
    login: function () {
        var Action = {
            id: "LOGIN",
            command: "LOGIN",
            code: "81001",
            message: {
                username: livechat.vm.username,
                password: md5(livechat.vm.password),
                session: livechat.vm.sessionid,
                livechat: "LIVEDEVELOP",
                gui: 'WEB',
                engine: 'KURENTO'
            }
        };
        sendMessage(Action);
    },
    close: function () {
        wsocket.close();
    },
    setlivechat: function (lvname) {
        $('#lvname').html(lvname);
        livechat.ws.start("1");
    },
    start: function (sendemail) {
        var Action = {
            id: "CHAT_REQUEST",
            command: "CHAT_REQUEST",
            code: "81002",
            message: {
                name: livechat.vm.username,
                email: livechat.vm.useremail,
                queue: livechat.vm.campaign,
                query: "Conversation Request for Livechat...",
                sendmail: sendemail,
                authenticate: "no",
                userid: livechat.vm.userid,
                gui: 'WEB',
                session: livechat.vm.sessionid
            }
        };
        $('#btnclose').show();
        sendMessage(Action);
    }
};

// JQuery Initial

window.onload = function () {
    console.log("Windows Load");
    setRegisterState(settings.registerState.NOT_REGISTERED);
}

window.onbeforeunload = function () {
    console.log("Windows Before Unload");
    livechat.ws.close();
}

$(document).ready(function () {
    console.log("Document Ready...");

    $('#btnclose').hide();
    $('#btnmax').hide();
    $('#btnmin').hide();
    $('#btnview').hide();
    $('#register').hide();

    $("#loginCancel").hide();
    $("#loginSubmit").hide();

    videoInput = document.getElementById('videoInput');
    videoOutput = document.getElementById('videoOutput');
    document.getElementById('username').focus();
    document.getElementById("chatinput").disabled = true;

    showPanel(livechat.vm.display);

    // Login Page -> Button Submit
    $('#loginSubmit').on('click', function () {
        livechat.vm.chatMessage = [];
        if ($('#lvusername').val() === '') {
            $('#lvloginmsg').html("<span class='error'>Please enter username.</span>");
        } else if ($('#lvpassword').val() === '') {
            $('#lvloginmsg').html("<span class='error'>Please enter password.</span>");
        } else if ($('#lvusername').val() === '' && $('#lvpassword').val() === '') {
            console.log("Empty Username & Password");
        } else {
            livechat.vm.username = $('#lvusername').val();
            livechat.vm.password = $('#lvpassword').val();
            //livechat.ws.connect(settings.connection.ip, settings.connection.port, settings.connection.service);
            register();
        };
    });

    $('#loginWS').on('click', function () {  
        livechat.ws.connect(settings.connection.ip, settings.connection.port, settings.connection.service);
    });

    $('#chatinput').keyup(function (e) {
        if (e.which === 13) {
            return sendChatMessage();
        }
    });

    $('#register').on('click', function () {
        register();
    });

    //$('#call').on('click', function () {
    //    call();
    //});

    $('#terminate').on('click', function () {
        stop();
    });

    $('#audioEnabled').on('click', function () {
        toggleAudio();
    });

    $('#videoEnabled').on('click', function () {
        toggleWebcam();
    });
});

// - - - - - - - - - - FUNCTIONS ACTION AUDARA - - - - - - - - - - 

// Services -> Selected Campaign
function startChat(campaign) {
    livechat.vm.display = "chat";
    showPanel(livechat.vm.display);

    livechat.vm.campaign = campaign;
    livechat.ws.setlivechat(campaign);
    livechat.vm.timeStart = (moment().format('DD-MM-YYYY HH:mm:ss'));
};

// Button Close Chat
function closeChat() {
    stop();
    var Action = {
        id: "END_CONVERSATION",
        command: "END_CONVERSATION",
        code: "81009",
        message: {
            username: livechat.vm.username,
            session: livechat.vm.sessionid
        }
    };
    sendMessage(Action);
    livechat.ws.close(); // End WS Socket
    livechat.vm.reset(); // Reset Vars
    $('#lvusername').val("");
    $('#lvpassword').val("");
    showPanel(livechat.vm.display);
    $('#btnclose').hide();
    $('#btnview').hide();
};

// Send Chat Message -> Chat Room : Button Send
function sendChatMessage() {
    if ($("#chatinput").val() !== '') {
        var userChat = {
            type: 'Customer',
            message: $("#chatinput").val(),
            time: (moment().format('DD-MM-YYYY HH:mm:ss'))
        };
        livechat.vm.chatMessage.push(userChat);
        addRoomMessage(userChat);

        var Action = {
            id: "MESSAGE_TOAGENT",
            command: "MESSAGE_TOAGENT",
            code: "81010",
            message: {
                chatmsg: $("#chatinput").val(),
                session: livechat.vm.sessionid
            }
        };
        sendMessage(Action);

        $("#chatinput").val('');
    }
};

// Send Start Video Request
function requestVideo() {
    var namevideo = "client_" + (moment().format('YYYYMMDD_HHmmss')) + "_client_" + livechat.vm.userid + "_" + livechat.vm.agentNum + "_" + livechat.vm.livechatid + "_" + livechat.vm.chathistory;

    var Action = {
        id: "USER_REQUEST_VIDEO",
        command: "USER_REQUEST_VIDEO",
        code: "81012",
        message: {
            videoname: namevideo,
            videourl: namevideo,
            session: livechat.vm.sessionid
        }
    };
    sendMessage(Action);
}

// Add Welcome Message to Waiting Chat Room
function addWelcomeMessage(message) {
    $('#lvmessage').append("<div><span> Info at " + (moment().format('DD-MM-YYYY HH:mm:ss')) + "</span><div>" + message + "</div></div>");
}

// Add Message to Chat Room
function addRoomMessage(message) {
    switch (message.type) {
        case "Agent":
            $('#lvroom').append('<div class="message left appeared"><span>' + livechat.vm.agentName + ' : ' + message.time + '</span><div class="text_wrapper"><div class="text">' + message.message + '</div></div></div>');
            break
        case "Customer":
            $('#lvroom').append('<div class="message right appeared"><span>' + livechat.vm.username + ' : ' + message.time + '</span><div class="text_wrapper"><div class="text">' + message.message + '</div></div></div>');
            break
        default:
            $('#lvroom').append('<div class="message left appeared"><span>System : ' + message.time + '</span><div class="text_wrapper"><div class="text">' + message.message + '</div></div></div>');
            break
    }
    $('#chat').animate({ scrollTop: $('#chat').prop('scrollHeight') }, 300);
}

// - - - - - - - - - - FUNCTIONS ACTIONS KURENTO - - - - - - - - - - 

// Register Kurento Action
function register() {
    var name = livechat.vm.username;
    var userid = livechat.vm.username;
    if (name == '') {
        window.alert("You must insert your user name");
        return;
    }

    setRegisterState(settings.registerState.REGISTERING);

    var message = {
        id: 'register',
        name: name,
        number: userid,
        type: 'USER'
    };
    sendMessage(message);
}

// Send Video Session Request
function call() {
    if (document.getElementById('peer').value == '') {
        window.alert("You must specify the peer name");
        return;
    }

    setCallState(settings.callState.PROCESSING_CALL);

    showSpinner(videoInput, videoOutput);

    var options = {
        localVideo: videoInput,
        remoteVideo: videoOutput,
        onicecandidate: onIceCandidate
    };
    options.configuration = iceServersConfiguration;

    webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, function (error) {
        if (error) {
            console.error(error);
            setCallState(settings.callState.NO_CALL);
        }

        this.generateOffer(function (error, offerSdp) {
            if (error) {
                console.error(error);
                setCallState(settings.callState.NO_CALL);
            }
            var message = {
                id: 'call',
                from: document.getElementById('username').value,
                to: document.getElementById('peer').value,
                sdpOffer: offerSdp
            };
            sendMessage(message);
        });
    });
}

// Kurento Stop Video Session
function stop(message) {
    setCallState(settings.callState.NO_CALL);
    if (webRtcPeer) {
        webRtcPeer.dispose();
        webRtcPeer = null;

        if (!message) {
            var message = {
                id: 'stop'
            };
            sendMessage(message);
        }
    }
    hideSpinner(videoInput, videoOutput);
}

// Processing Video Request 
function callResponse(message) {
    if (message.response != 'accepted') {
        console.info('Call not accepted by peer. Closing call');
        var errorMessage = message.message ? message.message : 'Unknown reason for call rejection.';
        console.log(errorMessage);
        window.alert("The Agent is not Ready for Video Session, Please try again.");
        stop(true);
    } else {
        setCallState(settings.callState.IN_CALL);
        webRtcPeer.processAnswer(message.sdpAnswer);
    }
}

// Kurento Start Video Session
function startCommunication(message) {
    setCallState(settings.callState.IN_CALL);
    webRtcPeer.processAnswer(message.sdpAnswer);
}

// Kurento Receive Incoming Video Request
function incomingCall(message) {
    // If bussy just reject without disturbing user
    if (callState != settings.callState.NO_CALL) {
        var response = {
            id: 'incomingCallResponse',
            from: message.from,
            callResponse: 'reject',
            message: 'bussy'

        };
        return sendMessage(response);
    }

    setCallState(settings.callState.PROCESSING_CALL);
    if (confirm('User ' + message.from + ' is calling you. Do you accept the call?')) {
        showSpinner(videoInput, videoOutput);

        livechat.vm.display = "video";
        showPanel(livechat.vm.display);

        var options = {
            localVideo: videoInput,
            remoteVideo: videoOutput,
            onicecandidate: onIceCandidate
        }
        options.configuration = iceServersConfiguration;

        webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options,
            function (error) {
                if (error) {
                    console.error(error);
                    setCallState(settings.callState.NO_CALL);
                }

                this.generateOffer(function (error, offerSdp) {
                    if (error) {
                        console.error(error);
                        setCallState(settings.callState.NO_CALL);
                    }
                    var response = {
                        id: 'incomingCallResponse',
                        from: message.from,
                        callResponse: 'accept',
                        sdpOffer: offerSdp
                    };
                    sendMessage(response);
                });
            });

    } else {
        var response = {
            id: 'incomingCallResponse',
            from: message.from,
            callResponse: 'reject',
            message: 'user declined'
        };
        sendMessage(response);
        stop(true);
    }
}

// Kurento IceCandidate
function onIceCandidate(candidate) {
    console.log('Local candidate' + JSON.stringify(candidate));
    var message = {
        id: 'onIceCandidate',
        candidate: candidate
    }
    sendMessage(message);
}

// Send Message to WebSocket Connection
function sendMessage(message) {
    var jsonMessage = JSON.stringify(message);
    console.log('Senging message: ' + jsonMessage);
    wsocket.send(jsonMessage);
}

// - - - - - - - - - - - - FUNCTIONS RESPONSE - - - - - - - - - - - - 

// Register Response Kurento Session
function registerResponse(message) {
    console.info('Registered: ' + message);
    if (message.response == 'accepted') {
        setRegisterState(settings.registerState.REGISTERED);
    } else {
        setRegisterState(settings.registerState.NOT_REGISTERED);
        var errorMessage = message.message ? message.message : 'Unknown reason for register rejection.';
        console.log(errorMessage);
        alert('Error registering user. See console for further information.');
    }
}

// - - - - - - - - - - - - FUNCTIONS SPINNER - - - - - - - - - - - - 

// Display Background Image in Video Frames
function showSpinner() {
    for (var i = 0; i < arguments.length; i++) {
        arguments[i].poster = './img/transparent-1px.png';
        arguments[i].style.background = 'center transparent url("./img/spinner.gif") no-repeat';
    }
}

// Remove Background Image in Video Frames
function hideSpinner() {
    for (var i = 0; i < arguments.length; i++) {
        arguments[i].src = '';
        arguments[i].poster = './img/webrtc.png';
        arguments[i].style.background = '';
    }
}

// - - - - - - - - - - - - FUNCTIONS STATUS - - - - - - - - - - - - 

// Change Register Status
function setRegisterState(nextState) {
    switch (nextState) {
        case settings.registerState.NOT_REGISTERED:
            $('#register').attr('disabled', false);
            $('#call').attr('disabled', true);
            $('#terminate').attr('disabled', true);
            break;

        case settings.registerState.REGISTERING:
            $('#register').attr('disabled', true);
            break;

        case settings.registerState.REGISTERED:
            $('#register').attr('disabled', true);
            setCallState(settings.callState.NO_CALL);
            break;

        default:
            return;
    }
    registerState = nextState;
}

// Change Call Status
function setCallState(nextState) {
    switch (nextState) {
        case settings.callState.NO_CALL:
            $('#call').attr('disabled', false);
            $('#terminate').attr('disabled', true);
            $('#audioEnabled').attr('disabled', true);
            $('#videoEnabled').attr('disabled', true);
            break;
        case settings.callState.PROCESSING_CALL:
            $('#call').attr('disabled', true);
            $('#terminate').attr('disabled', true);
            $('#audioEnabled').attr('disabled', true);
            $('#videoEnabled').attr('disabled', true);
            break;
        case settings.callState.IN_CALL:
            $('#call').attr('disabled', true);
            $('#terminate').attr('disabled', false);
            $('#audioEnabled').attr('disabled', false);
            $('#videoEnabled').attr('disabled', false);
            break;
        default:
            return;
    }
    callState = nextState;
}

// - - - - - - - - - - - - FUNCTIONS JQUERY - - - - - - - - - - - - 

// Display Livechat Component
function showPanel(panel) {
    $("#login").hide();
    $("#services").hide();
    $("#chat").hide();
    $("#video").hide();
    $("#logo").hide();
    $("#chat-input").hide();

    if (panel === "login") {
        $("#login").show();
        $("#logo").show();
    }
    if (panel === "services") {
        $("#services").show();
        $("#logo").show();
    }
    if (panel === "chat") {
        $("#chat").show();
        $("#chat-input").show();
    }
    if (panel === "video") {
        $("#video").show();
        $("#logo").show();
    }
}

// Switch Text/Video Screen
function viewVideo() {
    if (livechat.vm.agentResponse) {
        if (livechat.vm.display === "chat") {
            livechat.vm.display = "video";
        } else {
            livechat.vm.display = "chat";
        }
        showPanel(livechat.vm.display);
    }
};

// toggle audio stream
function toggleAudio() {
    setAudioEnabled(!isAudioEnabled);
}

// enable or disable the audio stream
function setAudioEnabled(enabled) {
    isAudioEnabled = enabled;
    if (webRtcPeer) {
        var localStreams = webRtcPeer.peerConnection.getLocalStreams();
        console.log(localStreams.length + " local streams");
        localStreams.forEach(function(localStream, index, array) {
            var audioTracks = localStream.getAudioTracks();
            console.log(audioTracks.length + " audio tracks");
            // if MediaStream has reference to microphone
            if (audioTracks[0]) {
                audioTracks[0].enabled = enabled;
            } else {
                console.error("No reference to microphone set!");
            }
        })
    } else {
        console.error("webRtcPeer is undefined! Cannot mute/unmute.");
    }

    if (isAudioEnabled) {
        $("#audioEnabled").children().attr("class", "fa fa-microphone fa-fw");
    } else {
        $("#audioEnabled").children().attr("class", "fa fa-microphone-slash fa-fw");
    }

    $('#audioEnabled').toggleClass('active', isAudioEnabled);
    $('#audioEnabled').toggleClass('focus', false);

    console.log("Audio enabled: " + isAudioEnabled);
}

// toggle video stream
function toggleWebcam() {
    setWebcamEnabled(!isWebcamEnabled);
}

// enable or disable the video stream
function setWebcamEnabled(enabled) {
    isWebcamEnabled = enabled;
    if (webRtcPeer) {
        var localStreams = webRtcPeer.peerConnection.getLocalStreams();
        console.log(localStreams.length + " local streams");
        localStreams.forEach(function(localStream, index, array) {
            var videoTracks = localStream.getVideoTracks();
            console.log(videoTracks.length + " video tracks");
            // if MediaStream has reference to webcam
            if (videoTracks[0]) {
                videoTracks[0].enabled = enabled;
            } else {
                console.error("No reference to webcam set!");
            }
        })
        // webRtcPeer.peerConnection.getLocalStreams()[0].getVideoTracks()[0].enabled = isWebcamEnabled;
    } else {
        console.error("webRtcPeer is undefined! Cannot disable/enable video.");
    }

    $('#videoEnabled').toggleClass('active', isWebcamEnabled);
    $('#videoEnabled').toggleClass('focus', false);

    console.log("Video enabled: " + isWebcamEnabled);
}
