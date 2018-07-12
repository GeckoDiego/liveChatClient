
var videoInput;
var videoOutput;
var webRtcPeer;
var registerName = null;
var registerState = null;
var callState = null;
var wsocket;
var isAudioEnabled = true;
var isWebcamEnabled = true;
var totalSeconds = 0;
var toggleNav = true;
var emailId = "";
var sendemail = "no";
var requestCall = true;
var agentRated = false;
var endchat = false;
var group = '';
var clientlogout = true;
var timerSwitch = false;
var cTimer = null;
var facebookLogin = false;
var appId, version;
var resizeWindow = true;
var loginError = false;
var currentUrl;
var check_login = false;
var emoticon = false;
var restrictClick = false;
var imgAppend = true;
var lastImgSrc = "";
var lastImgFrm = "";
var restrictShow = false;
var duplicate= false;
var speaker = true;
//Variables for width, height and chatwindow
var width, height, chatWindow;
settings = {
    connection: {
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
// var remainingTime;
// var interval;
// Audara-Kurento Web Socket Connection
livechat = {};

livechat.vm = {
    chatMessage: [],
    userid: '',
    goodbye: '',
    username: '',
    useremail: '',
    password: '',
    query: '',
    sessionid: '',
    agentNum: '',
    agentName: '',
    campaigns: [],
    types: [],
    type: '',
    campaign: '',
    livechatid: '',
    chathistory: '',
    agentResponse: false,
    welResponse: true,
    video: 'load',
    videoLists: [],
    videoDisplay: '',
    grouplist: [],
    timeStart: '',
    time: '',
    display: 'login',
    rating: '',
    reset: function () {
        this.chatMessage = [];
        this.userid = '';
        this.goodbye = '';
        this.username = '';
        this.useremail = '';
        this.query = '';
        this.password = '';
        this.sessionid = '';
        this.agentNum = '';
        this.agentName = '';
        this.campaigns = [];
        this.campaign = '';
        this.livechatid = '';
        this.chathistory = '';
        this.videoLists = [];
        this.videoDisplay = '';
        this.agentResponse = false;
        this.welResponse = true;
        this.video = 'load'
        this.timeStart = '';
        this.time = '';
        this.display = 'login';
        this.rating = '';
        this.types = [];
        this.type = '';
        this.grouplist = [];
    }
};

var iceServersConfiguration = {};
// =
// {
//     'iceServers': [
//         { 'urls': ['stun:149.56.115.238:3478'] },
//         { 'urls': ['turn:149.56.115.238:3478'], 'username': 'audaraturn', 'credential': 'audaraturnpass' }]
// };

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
        clientlogout = true;
        console.info("WS Connected.");
        var message = {
            id: 'start',
            command: 'start'
        };
        sendMessage(message);
    },
    onClose: function () {
        if (clientlogout == true) {
            document.getElementById('popupError').innerHTML = '';
            if (duplicate)
            {
                document.getElementById('popupError').innerHTML = 'Has logged into another device<br>please try again';
                $('#popupfeed').modal('show');
            }
            else
            {
                document.getElementById('popupError').innerHTML = 'The connection to the server was lost<br>please try again';
                $('#popupfeed').modal('show');
            }
        }
        else {
            console.info("WS Closed.");
            stop();
            livechat.vm.reset(); // Reset Vars
            $('#campaigns').html("");
            $('#lvusername').val("");
            $('#lvpassword').val("");
            $('#lvuseremail').val("");
            $('#lvuserquery').val("");
            $('#lvuserid').val("");
            $('#btnclose').hide();
            $('#btnview').hide();
            clearDom();
            showPanel(livechat.vm.display);
        }
        // loadCampaign();
    },
    onError: function (error) {

        console.error("WS Error : " + error);
    },
    onMessage: function (message) {

        console.log("Nuevo Mensaje :: ", message);

        var parsedMessage = JSON.parse(message.data);

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
                        if (livechat.vm.campaigns.length < 1) {
                            livechat.vm.campaigns = parsedMessage.message.livechatQueues.split(", ");
                            livechat.vm.types = parsedMessage.message.livechatTypes.split(", ");
                            livechat.vm.videoLists = parsedMessage.message.livechatVideo.split(", ");
                            livechat.vm.grouplist = parsedMessage.message.livechatGroup.split(", ");
                            populateCampaigns();
                        }
                        if ((livechat.vm.username !== '' && livechat.vm.password !== '') || (livechat.vm.username !== '' && livechat.vm.useremail !== '' && livechat.vm.userquery !== '')) {
                            livechat.ws.login(livechat.vm.username, livechat.vm.password, livechat.vm.campaign);
                        }
                        if (facebookLogin) {
                            livechat.ws.fbLogin()
                        }
                        break;
                    case 'LOGIN_STATE':
                        check_login = true;

                        $('#loginSubmit').prop("disabled", false).html("Start Chat");
                        $('#loginSubmitauthenticate').prop("disabled", false).html("<span>Start Chat</span>");
                        if (parsedMessage.message.state === "true") {
                            loginError = false;
                            startLoginTimer();
                            $('#lvloginmsg').html('');
                            livechat.vm.userid = parsedMessage.message.userid;
                            livechat.vm.useremail = parsedMessage.message.useremail;
                            livechat.vm.userFullName = parsedMessage.message.userfull;
                            livechat.vm.livechatid = parsedMessage.message.livechatid;
                            if (livechat.vm.type === 'authenticate') {
                                livechat.vm.display = "waitingRoom";
                                showPanel(livechat.vm.display);
                                populateWaitingRoom(true);
                            }
                            else
                                startChat(livechat.vm.campaign);
                        } else {
                            loginError = true;
                            facebookLogin = false;
                            $('#lvloginmsg').html("<span class='error'>Please enter valid username and password</span>");
                        }
                        break;
                    case 'FACEBOOK_LOGIN_STATE':

                        if (parsedMessage.message.state === "true") {
                            startLoginTimer();
                            $('#lvloginmsg').html('');
                            livechat.vm.username = fbUsername;
                            livechat.vm.userid = parsedMessage.message.userid;
                            livechat.vm.useremail = parsedMessage.message.useremail;
                            livechat.vm.userFullName = parsedMessage.message.userfull;
                            if (livechat.vm.type === 'authenticate') {
                                livechat.vm.display = "waitingRoom";
                                showPanel(livechat.vm.display);
                                populateWaitingRoom(true);
                            }
                            else
                                startChat(livechat.vm.campaign);
                        } else {
                            $('#lvloginmsg').html("<span class='error'>You are not registered. Please create an account</span>");
                        }
                        break;
                    case 'UNAVAILABLE_AGENTS':
                        /** show wait message on chat screen **/
                        $('#retry').show();
                        $("#mainChat").removeClass('d-none');
                        $("#waitMessage").append(parsedMessage.message.message);
                        $("#waitMessage1").append(parsedMessage.message.message);
                        /** get current time with am / pm **/
                        var time = new Date();
                        time = time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
                        $("#waitMessageTime").append(time);
                        $("#waitMessageTime1").append(time);
                        addWelcomeMessage("Unavailable Agents. Try again later.");
                        break;
                    case 'CONNECT':
                        restrictClick = false;
                        clearDom();
                        clearAgentDetails();
                        livechat.vm.agentNum = parsedMessage.message.agentnum;
                        livechat.vm.agentName = parsedMessage.message.agentname;
                        livechat.vm.livechatid = parsedMessage.message.livechatid;
                        livechat.vm.chathistory = parsedMessage.message.chathistory;
                        livechat.userdetails = parsedMessage.message;
                        var agentProfilePic = document.getElementById("agentProfilePic");
                        agentProfilePic.src = "data:image/"+parsedMessage.message.agentpicformat+";base64, "+parsedMessage.message.agentpic+"";
                        $("#userid").val(livechat.vm.userid);
                        $("#username").val(livechat.vm.username);
                        $("#peer").val(livechat.vm.agentNum);
                        document.getElementById("chatinput").disabled = false;
                        emoticon = true;
                        addWelcomeMessage("You are now chatting with " + livechat.vm.agentName + "");
                        $('#feedbackAgent').html(livechat.vm.agentName);
                        $("#connectMessage").append('<span style="font-weight:800;font-style:normal">' + livechat.vm.agentName + '</span> has joined the conversation');
                        $("#connectMessage1").append('<span style="font-weight:800;font-style:normal">' + livechat.vm.agentName + '</span> has joined the conversation');
                        /** get current time with am / pm **/
                        var time = new Date();
                        time = time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
                        $("#connectTime").append(time);
                        $("#connectTime1").append(time);
                        $("#agentName").append(livechat.vm.agentName);
                        $("#agentType").append(livechat.vm.agentNum);
                        /** change agent pic **/
                        // $("#activeAgentPic").show();
                        // $("#Capa_logoaudara").hide();
                        $("#agentName1").append(livechat.vm.agentName);
                        $("#agentType1").append(livechat.vm.agentNum);
                        /** change agent pic **/
                        // $("#activeAgentPic1").show();
                        // $("#Capa_logoaudara1").hide();
                        lastImgSrc = parsedMessage.message.agentpic;
                        lastImgFrm = parsedMessage.message.agentpicformat;
                        break;
                    case 'ENTERQUEUE':
                        $('#retry').hide();
                        /** show wait message on chat screen **/
                        $("#mainChat").removeClass('d-none');
                        $("#waitMessage").append(parsedMessage.message.greeting);
                        $("#waitMessage1").append(parsedMessage.message.greeting);
                        livechat.vm.goodbye = parsedMessage.message.goodbye;
                        /** get current time with am / pm **/
                        var time = new Date();
                        time = time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
                        $("#waitMessageTime").append(time);
                        $("#waitMessageTime1").append(time);
                        addWelcomeMessage(parsedMessage.message.greeting);
                        break;
                    case 'AGENT_CHAT_REQUEST':
                        restrictClick = false;
                        if (livechat.vm.type == 'anonymous' || livechat.vm.display === 'waitingRoom') {
                            if (confirm('Do you accept the chat request from ' + parsedMessage.message.agentname + '?')) {
                                console.log("USER ACCEPTED CHAT REQUEST");
                                var Action = {
                                    id: "USER_CHAT_RESPONSE",
                                    command: "USER_CHAT_RESPONSE",
                                    code: "81020",
                                    message: {
                                        userid: livechat.vm.userid,
                                        name: livechat.vm.username,
                                        email: livechat.vm.useremail,
                                        queue: livechat.vm.campaign,
                                        query: "",
                                        response: "START",
                                        session: livechat.vm.sessionid
                                    }
                                };
                                livechat.vm.display = "chat";
                                showPanel(livechat.vm.display);
                                sendMessage(Action);
                                clearDom();
                                clearAgentDetails();
                                livechat.vm.agentNum = parsedMessage.message.agentnum;
                                livechat.vm.agentName = parsedMessage.message.agentname;
                                livechat.vm.livechatid = parsedMessage.message.livechatid;
                                livechat.vm.chathistory = parsedMessage.message.chathistory;
                                livechat.userdetails = parsedMessage.message;
                                $("#userid").val(livechat.vm.userid);
                                $("#username").val(livechat.vm.username);
                                $("#peer").val(livechat.vm.agentNum);
                                $('#btnclose').show();
                                document.getElementById("chatinput").disabled = false;
                                emoticon = true;
                                addWelcomeMessage("You are now chatting with " + livechat.vm.agentName + "");
                                $('#feedbackAgent').html(livechat.vm.agentName);
                                $("#connectMessage").append('<span style="font-weight:800;font-style:normal">' + livechat.vm.agentName + '</span> has joined the conversation');
                                $("#connectMessage1").append('<span style="font-weight:800;font-style:normal">' + livechat.vm.agentName + '</span> has joined the conversation');

                                /** get current time with am / pm **/
                                var time = new Date();
                                time = time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
                                $("#connectTime").append(time);
                                $("#connectTime1").append(time);
                                $("#agentName").append(livechat.vm.agentName);
                                $("#agentType").append(livechat.vm.agentNum);
                                /** change agent pic **/
                                // $("#activeAgentPic").show();
                                // $("#Capa_logoaudara").hide();
                                $("#agentName1").append(livechat.vm.agentName);
                                $("#agentType1").append(livechat.vm.agentNum);
                                /** change agent pic **/
                                // $("#activeAgentPic1").show();
                                // $("#Capa_logoaudara1").hide();
                                var userChat = {
                                    type: 'Agent',
                                    message: parsedMessage.message.message,
                                    time: (moment().format('DD-MM-YYYY HH:mm:ss'))
                                };
                                livechat.vm.chatMessage.push(userChat);
                                addRoomMessage(userChat);
                            } else {
                                var Action = {
                                    id: "USER_CHAT_RESPONSE",
                                    command: "USER_CHAT_RESPONSE",
                                    code: "81020",
                                    message: {
                                        userid: livechat.vm.userid,
                                        name: livechat.vm.username,
                                        email: livechat.vm.useremail,
                                        queue: livechat.vm.campaign,
                                        query: "",
                                        response: "CANCEL",
                                        session: livechat.vm.sessionid
                                    }
                                };
                                sendMessage(Action);
                            }
                        }
                        break;
                    case 'MESSAGE_TO_USER':
                        if(speaker){
                            document.getElementById('audiofile').play();
                        }
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
                        imgAppend = false;
                        like();
                        endchat = true;
                        requestCall = false;
                        var systemChat = {
                            type: 'System',
                            message: parsedMessage.message.message,
                            time: (moment().format('DD-MM-YYYY HH:mm:ss'))
                        };
                        var goodbye = {
                            type: 'System',
                            message: livechat.vm.goodbye,
                            time: (moment().format('DD-MM-YYYY HH:mm:ss'))
                        }
                        livechat.vm.chatMessage.push(systemChat);
                        addRoomMessage(systemChat);
                        addRoomMessage(goodbye);
                        stop();
                        document.getElementById("chatinput").disabled = true;
                        emoticon = false;
                        $('#btnview').hide();
                        break;
                    case 'INACTIVITY':
                        imgAppend = false;
                        like();
                        requestCall = false;
                        var systemChat = {
                            type: 'System',
                            message: 'Conversation ends for Inactivity',
                            time: (moment().format('DD-MM-YYYY HH:mm:ss'))
                        };
                        var goodbye = {
                            type: 'System',
                            message: livechat.vm.goodbye,
                            time: (moment().format('DD-MM-YYYY HH:mm:ss'))
                        }
                        livechat.vm.chatMessage.push(systemChat);
                        addRoomMessage(systemChat);
                        addRoomMessage(goodbye);
                        stop();
                        document.getElementById("chatinput").disabled = true;
                        emoticon = false;
                        $('#btnview').hide();
                        break;
                    case 'AGENT_REQUEST_VIDEO':
                        var namevideo = "client_" + (moment().format('YYYYMMDD_HHmmss')) + "_agent_" + livechat.vm.agentNum + "_" + livechat.vm.userid + "_" + livechat.vm.livechatid + "_" + livechat.vm.chathistory;

                        if (confirm('Do you accept the video call?')) {
                            console.log("USER ACCEPTED VIDEO CALL");
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
                                livechat.vm.video = 'start';
                                call();
                                livechat.vm.display = "video";
                                showPanel(livechat.vm.display);
                                // $('.chat_window:first').hide(); 

                                // openVideoChat();  // open video chat window

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
                                livechat.vm.video = 'start';
                                videoStatus(livechat.vm.video)
                                call();
                            }, 3000);
                        }
                        else {
                            minimize();
                            livechat.vm.display = "chat"
                            showPanel(livechat.vm.display);
                        }
                        break;
                    case 'AGENT_RATING_RESPONSE':
                        imgAppend = true;
                        agentRated = true;

                        if (endchat) {
                            closeChat();
                        }
                        break;
                    case 'AGENT_START_TIMER':
                        startCountdownTimer(parsedMessage.message.time);
                        $("#timeRemaining").show();
                        $("#timeRemaining1").show();
                        //  startCountdownTimer(1);

                        break;
                    case 'USER_RESET_PASSWORD_RESULT':
                        if (parsedMessage.message.message == "SUCCESS") {
                            $('#passwordEmail').val('');
                            $('#requestError').html('');
                            livechat.vm.display = "passwordReset";
                            showPanel(livechat.vm.display);
                        }
                        else {
                            switch (parsedMessage.message.error) {
                                case 'EMAIL_NO_EXISTS':
                                    $('#requestError').html('');
                                    $('#requestError').append('<span>Your email is not registered</span>')
                                    break;
                                case 'CODE_FAIL':
                                    $('#requestError').html('');
                                    $('#requestError').append('<span>Failed to generate a Recovery Code</span>')
                                    break;
                                case 'SMTP_FAIL':
                                    $('#requestError').html('');
                                    $('#requestError').append('<span>Failed to Send the Email</span>')
                                    break;
                                case 'EMAIL_NO_SENT':
                                    $('#requestError').html('');
                                    $('#requestError').append('<span>Failed to Send the Email</span>')
                                    break;
                            }

                        }
                        break;
                    case 'USER_RECOVERY_PASSWORD_RESULT':
                        if (parsedMessage.message.message == "SUCCESS") {
                            $('#resetEmail').val('');
                            $('#resetCode').val('');
                            $('#resetpassword').val('');
                            $('#resetConfirmPassword').val('');
                            $('#resetError').html('');
                            livechat.vm.display = "login"
                            showPanel(livechat.vm.display);
                            $('#lvloginmsg').html("<span class='error'>Password Successfully Reset</span>");
                        }
                        else {
                            switch (parsedMessage.message.error) {
                                case 'EMAIL_NO_EXISTS':
                                    $('#resetError').html('');
                                    $('#resetError').append('<span>Your email is not registered</span>')
                                    break;
                                case 'CODE_OR_LIMIT_FAIL':
                                    $('#resetError').html('');
                                    $('#resetError').append('<span>Your Recovery Code is not valid or expired')
                                    break;
                                case 'PASSWD_FAIL':
                                    $('#resetError').html('');
                                    $('#resetError').append('<span>Failed to Register Password</span>')
                                    break;
                            }

                        } break;

                    case 'USER_SAVE_FACEBOOK_EMAIL_RESPONSE':
                        if (parsedMessage.message.state == "SUCCESS") {
                            $('#updatedEmail').val('');
                            $('#updatedEmail1').val('');
                            $('#updateError').html('');
                            livechat.vm.display = "waitingRoom"
                            showPanel(livechat.vm.display);
                        }
                        else {
                            $('#updateError').html('');
                            $('#updateError').append('<span>Failed to save the email</span>')
                        }
                        break;

                    case 'DUPLICATE_LOGIN':
                        duplicate = true;
                        livechat.ws.close();
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
    fbLogin: function () {
        var Action = {
            id: "FACEBOOK_LOGIN",
            command: "FACEBOOK_LOGIN",
            code: "81201",
            message: {
                facebookid: fbId,
                facebookname: fbUsername,
                facebookemail: fbEmail,
                session: livechat.vm.sessionid,
                livechat: livechat.vm.campaign,
                gui: "WEB",
                engine: "KURENTO"
            }
        };
        sendMessage(Action);
    },
    login: function () {
        var ActionAnonymous = {
            id: "LOGIN",
            command: "LOGIN",
            code: "81101",
            message: {
                username: livechat.vm.username,
                email: livechat.vm.useremail,
                query: livechat.vm.query,
                livechat: livechat.vm.campaign,
                gui: "HTML5",
                engine: "KURENTO",
                session: livechat.vm.sessionid
            }
        };
        var ActionAuthenticate = {
            id: "LOGIN",
            command: "LOGIN",
            code: "81001",
            message: {
                username: livechat.vm.username,
                password: md5(livechat.vm.password),
                session: livechat.vm.sessionid,
                livechat: livechat.vm.campaign,
                gui: 'WEB',
                engine: 'KURENTO'
            }
        };
        var Action = livechat.vm.type === 'anonymous' ? ActionAnonymous : ActionAuthenticate;
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
                query: livechat.vm.query,
                sendmail: sendemail,
                authenticate: "no",
                userid: livechat.vm.userid,
                gui: 'WEB',
                session: livechat.vm.sessionid
            }
        };
        $('#btnclose').show();
        sendMessage(Action);
    },
    rate: function () {
        var Action = {
            id: "AGENT_RATING",
            command: "AGENT_RATING",
            code: "81024",
            message: {
                agentnum: livechat.vm.agentNum,
                agentname: livechat.vm.agentName,
                comment: livechat.vm.comment,
                rating: livechat.vm.rating,
                livechatid: livechat.vm.livechatid,
                chathistory: livechat.vm.chathistory,
                userid: livechat.vm.userid,
                sendmail: sendemail,
                email: emailId,
                session: livechat.vm.sessionid
            }
        };

        // $('#btnclose').show();
        sendMessage(Action);
    }
};

// JQuery Initial

window.onload = function () {
    setRegisterState(settings.registerState.NOT_REGISTERED);    
}

window.onbeforeunload = function () {
    console.log("Windows Before Unload");
    livechat.ws.close();
}

$(document).ready(function () {
    // console.log("pagebeforecreate event fired!");
    $.getJSON("/config.json", function (data) {
        iceServersConfiguration.iceServers = data.iceServers;
        settings.connection.ws = data.ws;
        settings.connection.ip = data.ip;
        settings.connection.port = data.port;
        settings.connection.service = data.service;
        group = data.group;
        createURL = data.createURL;
        passwordURL = data.passwordURL;
        scheduleURL = data.scheduleURL;
        appId = data.code;
        version = data.version;
        (function (d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) return;
            js = d.createElement(s); js.id = id;
            js.src = "//connect.facebook.net/en_US/all.js";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
        window.fbAsyncInit = function () {
            FB.init({
                appId: appId,
                cookie: true,  // enable cookies to allow the server to access 
                // the session
                xfbml: true,  // parse social plugins on this page
                version: version // use graph api version 2.8
            });

        };

    }).fail(function (error) {
        console.log(error);
    })

    $('#click_on').click(function () {
        if (emoticon)
            $('#myPopup').toggle(100);
    });
    $('#click_on1').click(function () {
        if (emoticon)
            $('#myPopup1').toggle(100);
    });

    console.log("Document Ready...");
    width = $(window).width();
    height = $(window).height();
    chatWindow = $('.chat_window');

    chatWindow.css('top', height / 2);
    //FULL SCREEN 
    var c = 1;
    $('.expand').click(function () {
        c++;
        //odd -> Full Screen 
        if (c % 2 == 0) {
            maximize();
        }

        //even -> Exit Full Screen 
        if (c % 2 != 0) {
            minimize();
        }
    });
    //PLAY BTN
    $('.fa-play').click(function () {
        $(this).toggleClass('fa-pause');
    });
    $('#btnclose').hide();
    $('#btnmax').hide();
    $('#btnmin').hide();
    $('#btnview').hide();
    $('#register').hide();
    $('#anonymous').hide();
    $("#timeRemaining").hide();
    $("#timeRemaining1").hide();
    // $("#Capa_logoaudara1").show();
    // $("#activeAgentPic1").hide();
    videoInput = document.getElementById('invideo');
    videoOutput = document.getElementById('outvideo');
    // document.getElementById('username').focus();
    //document.getElementById("chatinput").disabled = true;
    // livechat.ws.connect(settings.connection.ip, settings.connection.port, settings.connection.service);
    showPanel(livechat.vm.display);
    function login() {
        check_login = false;
        $('#loginSubmit').attr('disabled', 'disabled').html("Loading....");
        //$('#loginSubmitauthenticate').attr('disabled', 'disabled').html("<i class='fa fa-spinner fa-pulse fa-fw'></i>");
        setTimeout(function () {
            if (check_login === true) {
                console.log('LOGIN_STATE RECEIVED');
            } else {
                $('#dialog_confirm_map').modal();

                //appending modal background inside the bigform-content
                $('.modal-backdrop').appendTo('#login');
                //removing body classes to able click events
                $('body').removeClass();
                // window.alert("<h4>Failed to connect to Server<br> Please Try Again!</h4>");
                $('#loginSubmit').prop("disabled", false).html("Start Chat");
                $('#loginSubmitauthenticate').prop("disabled", false).html("Start Chat");
            }


        }, 20000);
        livechat.vm.chatMessage = [];

        livechat.vm.username = $('#lvusername').val() ? $('#lvusername').val() : $('#lvuserid').val();
        livechat.vm.password = $('#lvpassword').val();
        livechat.vm.useremail = $('#lvuseremail').val();
        livechat.vm.query = $('#lvuserquery').val();
        register();
    }
    // Login Page -> Button Submit
    $('#loginSubmitauthenticate').on('click', function () {
        if ($('#lvuserid').val() === '' && $('#lvpassword').val() === '') {
            $('#lvloginmsg').html("<span class='error'>Empty Username & Password.</span>");
        }
        else if ($('#lvuserid').val() === '') {
            $('#lvloginmsg').html("<span class='error'>Please enter username.</span>");
        }
        else if ($('#lvpassword').val() === '') {
            $('#lvloginmsg').html("<span class='error'>Please enter password.</span>");
        }
        else
            login();
    });

    $('#loginSubmit').on('click', function () {
        if (!validateEmail($('#lvuseremail').val() || $('#lvuseremail').val() === ''))
            $('#lvloginmsg').html("<span class='error'>Please enter a valid email</span>");
        else if ($('#lvusername').val() === '') {
            $('#lvloginmsg').html("<span class='error'>Please enter your name.</span>");
        }
        else
            login();
    });

    $('#saveEmail').on('submit', function (e) {
        e.preventDefault();
        saveEmail();
    })

    $('#chatinput').keyup(function (e) {
        if (e.keyCode === 13) {
            $('#chatinput').val($('#chatinput').val().slice(0, $('#chatinput').val().length - 1));
            return sendChatMessage();
        }
    });

    $('#chatinput1').keyup(function (e) {
        if (e.keyCode == 13) {
            $('#chatinput1').val($('#chatinput1').val().slice(0, $('#chatinput1').val().length - 1));
            return sendChatMessage();
        }
    });

    $('#register').on('click', function () {
        register();
    });

    $('.chatspeaker').on('click', function () {
        speaker = !speaker;
    });

});

// - - - - - - - - - - FUNCTIONS ACTION AUDARA - - - - - - - - - - 

// Services -> Selected Campaign

function startChat(campaign) {
    lastImgSrc = "";
    lastImgFrm = "";
    restrictShow = false;
    $('#emailUpdated').html('');
    livechat.vm.display = "chat";
    showPanel(livechat.vm.display);

    livechat.vm.campaign = campaign ? campaign : livechat.vm.campaign;

    livechat.ws.setlivechat(campaign);
    livechat.vm.timeStart = (moment().format('DD-MM-YYYY HH:mm:ss'));
};


// Button Close Chat
function closeChat() {
    imgAppend = true;
    emoticon = false;

    if (agentRated || livechat.vm.agentName == '' || restrictShow) {
        resetTimer();
        clearDom();
        stop();
        if (livechat.vm.agentName != '' && !document.getElementById("chatinput").disabled) {
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
        }
        if (livechat.vm.type == 'authenticate') {
            livechat.vm.display = "waitingRoom";
            showPanel(livechat.vm.display);
        }else{
            logout();
        }    
    } else {
        like();
        endchat = true;
    }
};

//logout from livechat client
function logout() {
    clientlogout = false;
    if (facebookLogin)
        fbLogout();
    minimize();
    stopLoginTimer();
    $('#qnimate').removeClass('popup-box-on');
    $('#addClass').css('display', 'block');
    livechat.ws.close(); // End WS Socket
    livechat.vm.reset(); // Reset Vars
    $('#lvusername').val("");
    $('#lvpassword').val("");
    populateWaitingRoom(false);
    showPanel(livechat.vm.display);
    $('#Capa_videocall').show();
    $('#btnclose').hide();
    $('#btnview').hide();
    $('#emailUpdated').html('');
}

// function getPressedKey(ev) {
//     var keycode = (ev.keyCode ? ev.keyCode : ev.which);
//     if (keycode == 13) {
//         console.log("Enter pressed");
//         $("#send").click();
//     } else {
//         console.log(keycode);
//     }
// }

// Send Chat Message -> Chat Room : Button Send
function sendChatMessage() {
    if ($("#chatinput").val() != "" || $("#chatinput1").val() != "") {
        var userChat = {
            type: 'Customer',
            message: $("#chatinput").val() ? $("#chatinput").val() : $("#chatinput1").val(),
            time: (moment().format('DD-MM-YYYY HH:mm:ss'))
        };
        livechat.vm.chatMessage.push(userChat);
        addRoomMessage(userChat);

        var Action = {
            id: "MESSAGE_TOAGENT",
            command: "MESSAGE_TOAGENT",
            code: "81010",
            message: {
                chatmsg: $("#chatinput").val() ? $("#chatinput").val() : $("#chatinput1").val(),
                session: livechat.vm.sessionid
            }
        };
        sendMessage(Action);
        $("#chatinput").val("")
        $("#chatinput1").val("");

    }
};

// Send Start Video Request

function requestVideo() {
    if (livechat.vm.agentName != '' && requestCall) {
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
        livechat.vm.display = "video";
        showPanel(livechat.vm.display);

    }
}


// Add Welcome Message to Waiting Chat Room
function addWelcomeMessage(message) {
    $('#lvmessage').append("<div><span> Info at " + (moment().format('DD-MM-YYYY HH:mm:ss')) + "</span><div>" + message + "</div></div>");
}


// formatting incoming / outgoing  messages

// in case countinuous messages
var agentMsgCount = 0;
var customerMsgCount = 0;
var time;
var lastMsgBy = 'Agent';

// Add Message to Chat Room
function addRoomMessage(message) {
    switch (message.type) {
        case "Customer":

            if (lastMsgBy == 'Agent') {
                $('#chats').append('<p class="systemmessage">' + time + '</p>');
                $('#chats1').append('<p class="systemmessage">' + time + '</p>');
            }

            agentMsgCount = 0;
            customerMsgCount++;
            /** cases of concurrent messages **/
            if (customerMsgCount == 1) {
                $("#chats").append('<div class="chat_message_wrapper chat_message_left"><ul class="chat_message"><li class="messagestart"><p>' + message.message + '</p></li></ul></div>');
                $("#chats1").append('<div class="chat_message_wrapper chat_message_left"><ul class="chat_message"><li class="messagestart1"><p>' + message.message + '</p></li></ul></div>');
            } else {
                $('.messagestart:last').parent().append('<li class="message2nd"><p>' + message.message + '</p></li>');
                $('.messagestart1:last').parent().append('<li class="message2nd"><p>' + message.message + '</p></li>');
            }

            time = new Date();
            time = time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });

            lastMsgBy = 'Customer';

            break;
        case "Agent":
            console.log("Nuevo mensaje del agente !!!");
            if (lastMsgBy == 'Customer') {
                $('#chats').append('<p class="systemmessage">' + time + '</p>');
                $('#chats1').append('<p class="systemmessage">' + time + '</p>');
            }

            customerMsgCount = 0;
            agentMsgCount++;
            /** case of concurrent messages **/
            if (agentMsgCount == 1) {
                $("#chats").append('<div class="chat_message_wrapper chat_message_right"><ul class="chat_message"><li class="messageagent"><p class="test" data-id="'+agentMsgCount+'">' + message.message + '</p></li></ul></div>');
                $("#chats1").append('<div class="chat_message_wrapper chat_message_right"><ul class="chat_message"><li class="messageagent2"><p class="test" data-id="'+agentMsgCount+'">' + message.message + '</p></li></ul></div>');

            } else {
                $('.messageagent:last').parent().append('<li class="messageagent2nd"><p class="prueba" data-id="'+agentMsgCount+'">' + message.message + '</p></li>');
                $('.messageagent2:last').parent().append('<li class="messageagent2nd"><p class="prueba" data-id="'+agentMsgCount+'">' + message.message + '</p></li>');
            }

            time = new Date();
            time = time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });

            lastMsgBy = 'Agent';

            break;
        default:
            // var time = message.time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
            $('#chats').append('<p class="systemmessage">' + message.message + '</p>');
            $('#chats1').append('<p class="systemmessage text-center">' + message.message + '</p>');
            break;
    }

    $('#scroll').animate({ scrollTop: $('#scroll').prop('scrollHeight') }, 300);
    $('#scroll1').animate({ scrollTop: $('#scroll1').prop('scrollHeight') }, 300);



}

// - - - - - - - - - - FUNCTIONS ACTIONS KURENTO - - - - - - - - - - 

// Register Kurento Action
function register() {
    
    if (loginError == true && registeredname == livechat.vm.username) {
        if ((livechat.vm.username !== '' && livechat.vm.password !== '') || (livechat.vm.username !== '' && livechat.vm.useremail !== '' && livechat.vm.userquery !== '')) {
            livechat.ws.login(livechat.vm.username, livechat.vm.password, livechat.vm.campaign);
        }
    }
    else {
        if (livechat.vm.type == "anonymous") {
            livechat.vm.username = livechat.vm.username + "^_^" + Math.floor(Math.random() * 111) + "" + Math.floor(Math.random() * 111);
        }
        registeredname = livechat.vm.username;
        var userid = livechat.vm.username;
        if (registeredname == '') {
            window.alert("You must insert your user name");
            return;
        }

        setRegisterState(settings.registerState.REGISTERING);

        var message = {
            id: 'register',
            name: registeredname,
            number: userid,
            type: 'USER'
        };
        sendMessage(message);
    }
}

// Send Video Session Request
function call() {
    if (document.getElementById('peer').value == '') {
        window.alert("You must specify the peer name");
        return;
    }
    startTimer();
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
    $('#agentDetails').html('');
    livechat.vm.video = 'load'
    stopTimer()
    closeNav();
    minimize();
    livechat.vm.display = "chat";
    showPanel(livechat.vm.display);
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
    /*if( wsocket == null ){
        loadCampaign();
    }*/
    var jsonMessage = JSON.stringify(message);
    console.log('Sending message: ' + jsonMessage);
    wsocket.send(jsonMessage);   
}

// - - - - - - - - - - - - FUNCTIONS RESPONSE - - - - - - - - - - - - 

// Register Response Kurento Session
function registerResponse(message) {

    if (message.response == 'accepted') {
        setRegisterState(settings.registerState.REGISTERED);
    } else {
        facebookLogin = false;
        setRegisterState(settings.registerState.NOT_REGISTERED);
        var errorMessage = message.message ? message.message : 'Unknown reason for register rejection.';
        console.log(errorMessage);

        alert('Error registering user. See console for further information.');
    }
}

// - - - - - - - - - - - - FUNCTIONS SPINNER - - - - - - - - - - - - 

// Display Background Image in Video Frames
function showSpinner() {
    // for (var i = 0; i < arguments.length; i++) {
    //     arguments[i].poster = './img/transparent-1px.png';
    //     arguments[i].style.background = 'center transparent url("./img/spinner.gif") no-repeat';
    // }
}

// Remove Background Image in Video Frames
function hideSpinner() {
    // for (var i = 0; i < arguments.length; i++) {
    //     arguments[i].src = '';
    //     arguments[i].poster = './img/webrtc.png';
    //     arguments[i].style.background = '';
    // }
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
    console.log("Adentro :: ", panel);
    $("#login").hide();
    $("#services").hide();
    $("#chat").hide();
    $("#waitingRoom").hide();
    $("#video").hide();
    $("#logo").hide();
    $('#retry').hide();
    $("#requestcode").hide();
    $("#passwordReset").hide();
    $("#updateEmail").hide();
    $("#Capa_logoaudara").hide();
    if (panel === "login") {
        $('.expand').hide();
        $("#login").show();
        $("#logo").show();
        $('#footerIcons').hide();
    }
    if (panel === "requestCode") {
        $("#logo").show();
        $("#requestcode").show();

    }
    if (panel === "updateEmail") {
        $("#logo").show();
        $("#updateEmail").show();
    }
    if (panel === "passwordReset") {
        $("#logo").show();
        $("#passwordReset").show();
    }
    if (panel === "services") {
        $("#services").show();
        $("#logo").show();
        $('#footerIcons').hide();
    }
    if (panel === "waitingRoom") {
        $("#waitingRoom").show();
        $("#logo").show();
    }
    if (panel === "chat") {

        $('.expand').show();
        $("#chat").show();
        $("#Capa_logoaudara").show();
        $("#logo").show();
        $('#footerIcons').show();
    }
    if (panel === "video") {
        $('.expand').hide();
        maximize();
        videoStatus(livechat.vm.video);
        $('#agentDetails').append('<span class="name">' + livechat.vm.agentName + '</span><span class="userdesignation1 ">' + livechat.vm.agentNum + '</span>')
        $("#video").show();
        $("#logo").show();
        $("#mute").hide();
        $('#footerIcons').hide();

    }
}

// Switch Text/Video Screen
// function viewVideo() {
//     if (livechat.vm.agentResponse) {
//         if (livechat.vm.display === "chat") {
//             livechat.vm.display = "video";
//         } else {
//             livechat.vm.display = "chat";
//         }
//         showPanel(livechat.vm.display);
//     }
// };

// toggle audio stream
function toggleAudio() {
    if (livechat.vm.video == 'start')
        setAudioEnabled(!isAudioEnabled);
}

// enable or disable the audio stream
function setAudioEnabled(enabled) {
    isAudioEnabled = enabled;
    if (webRtcPeer) {
        var localStreams = webRtcPeer.peerConnection.getLocalStreams();
        console.log(localStreams.length + " local streams");
        localStreams.forEach(function (localStream, index, array) {
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
        $("#unmute").show();
        $('#mute').hide();
    } else {
        $("#unmute").hide();
        $('#mute').show();
    }

    $('#audioEnabled').toggleClass('active', isAudioEnabled);
    $('#audioEnabled').toggleClass('focus', false);

    console.log("Audio enabled: " + isAudioEnabled);
}

// toggle video stream
function toggleWebcam() {
    if (livechat.vm.video == 'start')
        setWebcamEnabled(!isWebcamEnabled);
}

// enable or disable the video stream
function setWebcamEnabled(enabled) {
    isWebcamEnabled = enabled;
    if (webRtcPeer) {
        var localStreams = webRtcPeer.peerConnection.getLocalStreams();
        console.log(localStreams.length + " local streams");
        localStreams.forEach(function (localStream, index, array) {
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

    $('#videoEnabled').toggleClass('onactive-bg-white', isWebcamEnabled);

    console.log("Video enabled: " + isWebcamEnabled);
}

//Populating the dropdown list
function populateCampaigns() {    
    var campaigns = "";
    var count = 0;
    for (i = 0; i < livechat.vm.campaigns.length; i++) {

        if (livechat.vm.grouplist[i] === group) {
            count++; 
            campaigns+="<option value=" + livechat.vm.campaigns[i] + '-' + livechat.vm.types[i] + '-' + livechat.vm.videoLists[i] + "><b>" + livechat.vm.campaigns[i] + "</b></option>";            
        }
        if (i == livechat.vm.campaigns.length - 1) {
           /*var opt = $("#campaigns option").sort(function (a, b) { return a.value.toUpperCase().localeCompare(b.value.toUpperCase()) });
            campaigns+=opt;
            var object = {
                value: $("#campaigns").find('option:first').val()
            }
            changeLoginType(object);
            //console.log($("#campaigns").find('option:first').val());
            // changeLoginType($("#campaigns").find('option:first').val())
            $("#campaigns").find('option:first').attr('selected', 'selected');
            if (typeof InstallTrigger !== 'undefined') {
                $("#campaigns").find('option:first').prop('selected', 'selected');
            }*/
        }
    }
    localStorage.setItem("campaigns", campaigns);
    maximize();
}

//Connect the websocket on click of the icon and load the campaigns for the dropdown
function loadCampaign() {
    if (livechat.vm.display == 'login'){
        livechat.ws.connect(settings.connection.ip, settings.connection.port, settings.connection.service);
        startLC();
    }else{
        maximize();
    }
}

//Login type change for anonymous or authenticate
function changeLoginType(sel) {
    var selection = sel.value.split('-');
    livechat.vm.campaign = selection[0];
    livechat.vm.type = selection[1];
    livechat.vm.videoDisplay = selection[2];
    if (selection[1] == "anonymous") {
        $('#authenticate').hide();
        $('#anonymous').show();
    }
    else {
        $('#authenticate').show();
        $('#anonymous').hide();
    }
    if (selection[2] == "YES") {
        $('#Capa_videocall').show();
    }
    else {
        $('#Capa_videocall').hide();
    }
}

//Start the window
function startLC() {
    var message  = 'start';
    top.postMessage(message, document.referrer);
}

//Maximize the window
function maximize() {
    var message  = 'maximize';
    /**/
    var min = document.getElementById("livechat-minified-wrapper");
        min.classList.add("d-none");
    var max = document.getElementById("livechat-maxified-wrapper");
        max.classList.remove("d-none");
        if( livechat.vm.display != 'minimize' ){
            prueba();
        }        
    /**/
    top.postMessage(message, document.referrer)    
}

//Minimizing the window
function minimize() {
    var message = 'minimize';  
    var max = document.getElementById("livechat-maxified-wrapper");
        max.classList.add("d-none");  
    var min = document.getElementById("livechat-minified-wrapper"); 
        min.classList.remove("d-none");
    livechat.vm = {
        display: "minimize",
    };
    top.postMessage(message, document.referrer)
}

//Close and force end the window
function closeWaS(){
    var message = 'minimize'; 
    $("#campaigns").empty();
    top.postMessage(message, document.referrer)
    var max = document.getElementById("livechat-maxified-wrapper");
        max.classList.add("d-none");  
    var min = document.getElementById("livechat-minified-wrapper"); 
        min.classList.remove("d-none");   
    livechat.vm.display = "login";
    livechat.vm.reset(); // Reset Vars    
}

//Adding emojis to the text area
function addEmoticon(val) {
    value = $("#chatinput").val();
    $("#chatinput").val(value + val);
    $("#myPopup").hide();
}

function addEmoticon1(val) {
    value = $("#chatinput1").val();
    $("#chatinput1").val(value + val);
}

//Video call status
function videoStatus(val) {

    if (val === 'load') {
        $('.jecko_loading').show();
        $("#bigvideo").hide();
        $('.controller').css('opacity', '0.4');
        $('.controller1').css('opacity', '0.4');
        $('.bg-red').css('opacity', '1');
        $('#side').css('opacity', '1')
    }
    else {
        $('.jecko_loading').hide();
        $("#bigvideo").show();
        $('.controller').css('opacity', '1');
        $('.controller1').css('opacity', '1');

    }
}

function startTimer() {
    timer = setInterval(countTimer, 1000);
    // setInterval(countTimer,1000)
    totalSeconds = 0;
}

function countTimer() {

    totalSeconds = totalSeconds + 1;
    // var hour = Math.floor(totalSeconds / 3600);
    var minute = Math.floor((totalSeconds) / 60);
    var seconds = totalSeconds - (minute * 60);

    document.getElementById("timer").innerHTML = (minute < 10 ? '0' + minute : minute) + ":" + (seconds < 10 ? '0' + seconds : seconds);

}

function stopTimer() {
    clearInterval(timer);
    document.getElementById("timer").innerHTML = ''
}

function startLoginTimer() {
    loginTimer = setInterval(countLoginTimer, 1000);
    // setInterval(countTimer,1000)
    totalLoginSeconds = 0;
    countLoginTimer();
}

function countLoginTimer() {

    totalLoginSeconds = totalLoginSeconds + 1;
    var hour = Math.floor(totalLoginSeconds / 3600);
    var minute = Math.floor((totalLoginSeconds) / 60) - (hour * 60);
    var seconds = totalLoginSeconds - (minute * 60 + hour * 3600);

    document.getElementById("loginTimer").innerHTML = (hour < 10 ? '0' + hour : hour) + ':' + (minute < 10 ? '0' + minute : minute) + ":" + (seconds < 10 ? '0' + seconds : seconds);

}

function stopLoginTimer() {
    clearInterval(loginTimer);
    document.getElementById("loginTimer").innerHTML = ''
}

function openNav() {
    document.getElementById("mySidenav").style.width = "350px";
    document.getElementById("main2").style.marginRight = "350px";
}

function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
    document.getElementById("main2").style.marginRight = "0";
}

function toogleNav() {
    if (toggleNav == true) {
        openNav();
        toggleNav = false;
    }
    else {
        closeNav();
        toggleNav = true;
    }

}

function clearDom() {
    $('#lvmessage').html("");
    $("#waitMessage").html("");
    $("#waitMessage1").html("");
    $("#waitMessageTime").html("");
    $("#waitMessageTime1").html("");
    $('#chats').html("");
    $('#chats1').html("");
    $("#connectTime").html("");
    $("#connectTime1").html("");
    $("#agentName").html("");
    $("#agentType").html("");
    $("#agentName1").html("");
    $("#agentType1").html("");
    $("#connectMessage").html("");
    $("#connectMessage1").html("");
    $("#imageAppend").html("");
    $("#timeRemaining").removeClass('time_border_red');
    $("#timeRemaining").hide();
    $("#timeRemaining1").removeClass('time_border_red');
    $("#timeRemaining1").hide();
    // $("#activeAgentPic").hide();
    // $("#activeAgentPic1").hide();
    $("#Capa_logoaudara").show();
    $('.chat').show();
    $('.st02').css("fill", '#949494');
    $('.st01').css("fill", '#949494');
    timerSwitch = false;
    emailId = "";
    sendemail = "no";
}

function submitRating() {

    agentRated = true;
    livechat.vm.comment = $('.optionalcomment').val();
    $('.optionalcomment').val('');
    livechat.ws.rate('1');
    restrictClick = true;
}

function rate(rating) {
    if (rating == '1') {
        $('.st01').css("fill", '#36AECC')
        $('.st02').css("fill", '#949494')
    }
    else {
        $('.st01').css("fill", '#949494')
        $('.st02').css("fill", '#F6292B')
    }
    livechat.vm.rating = rating;
}

function like() {
    if (restrictShow == false) {
        if (restrictClick == false) {
            if (livechat.vm.agentName != '') {
                if (imgAppend == true) {
                    $('#imageAppend').html("");
                    if(lastImgFrm != ""){
                        $('#imageAppend').append('<img src="data:image/jpeg;base64, '+lastImgSrc+'" alt="" class="img img-circle" />');
                    }else{
                        $('#imageAppend').append('<img src="img/profile.png" alt="" class="img img-circle" />');
                    }
                    $("#service").modal("show");
                }
                else {
                    $('#imageAppend').html("");
                    $('#feedbackAgent').html('<span> The chat has ended </span>');

                    $("#imageAppend").append('<svg version="1.1" id="Capafeedback" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="47.926px" height="47.926px" fill="#36aecc" viewBox="0 0 47.926 47.926" style="enable-background:new 0 0 47.926 47.926;" xml:space="preserve"> <g> <g><g><path d="M39.928,0.09H8c-4.4,0-8,3.6-8,8v20.977c0,4.4,3.6,8,8,8h7.397v10.77l13.333-10.77h11.195c4.399,0,8-3.6,8-8V8.09 C47.928,3.69,44.328,0.09,39.928,0.09z M42.928,29.066c0,1.627-1.374,3-3,3H28.73h-1.768l-1.375,1.11l-5.191,4.193v-0.305v-5h-5 H8c-1.626,0-3-1.373-3-3V8.09c0-1.626,1.374-3,3-3h31.928c1.626,0,3,1.374,3,3V29.066L42.928,29.066z"/><circle cx="13.707" cy="18.58" r="2.913"/> <circle cx="23.964" cy="18.58" r="2.913"/> <circle cx="34.22" cy="18.58" r="2.913"/>  </g> </g> </g  </svg>>');
                    $("#service").modal("show");
                }

                $(".after_modal").addClass("after_modal_appended");

                //appending modal background inside the chat_window div
                $('.modal-backdrop').appendTo('.after_modal');

                //remove the padding right and modal-open class from the body tag which bootstrap adds when a modal is shown

                $('body').removeClass("modal-open")
                $('body').css("padding-right", "");
            }
        }
    }

}

function saveEmail() {
    sendemail = "yes";
    emailId = $('.email').val();
    $('.email').val('');
    $('.chat').hide();
    $('#message').modal('hide');
}

function clearAgentDetails() {
    agentMsgCount = 0;
    customerMsgCount = 0;
    livechat.vm.agentNum = '';
    livechat.vm.agentName = '';
    livechat.vm.livechatid = '';
    livechat.vm.chathistory = '';
    livechat.userdetails = '';
    agentRated = false;
    endchat = false;
    requestCall = true;
    $('.chat').show();
    $("#userid").val('');
    $("#username").val('');
    $("#peer").val('');
    $('#feedbackAgent').html('');
}

function requestChat() {
    $("#waitMessage").html('');
    $("#waitMessage1").html('');
    $("#waitMessageTime").html('');
    $("#waitMessageTime1").html('');
    livechat.ws.start();
}

function closeRate() {
    restrictShow = true;
    if (endchat)
        closeChat();

}

function clearIframeSrc() {
    document.getElementById('iframeURL').src = '';
}

function populateWaitingRoom(val) {
    if (val) {
        $('#livechatCampaign').append('<p class="adjust_live" >' + livechat.vm.campaign + ' </p><br>');
        $('#userDetails').append('<p class="adjust_live1" >' + livechat.vm.userFullName + ' (' + livechat.vm.username + ') </p>');
    }
    else {
        $('#livechatCampaign').html('<div id="circle"> </div>')
        $('#userDetails').html('')
    }
}

function startCountdownTimer(val) {
    cTimer = setInterval(countdownTimer, 1000);
    totalTime = parseInt(val) * 60;
}

function countdownTimer() {
    minutes = parseInt(totalTime / 60, 10)
    seconds = parseInt(totalTime % 60, 10);

    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    document.getElementById('timeRemaining').innerHTML = minutes + ":" + seconds;
    document.getElementById('timeRemaining1').innerHTML = minutes + ":" + seconds;
    if (timerSwitch) {
        totalTime = totalTime + 1
        $("#timeRemaining").addClass('time_border_red');
        $("#timeRemaining1").addClass('time_border_red');

    }
    else {
        totalTime = totalTime - 1
    }

    if (totalTime == 0) {
        timerSwitch = true;
    }

}

function resetTimer() {
    clearInterval(cTimer);
    cTimer = null;
    document.getElementById('timeRemaining').innerHTML = '';
    document.getElementById('timeRemaining1').innerHTML = '';
}

function forgotPassword() {
    livechat.vm.display = "requestCode";
    showPanel(livechat.vm.display);
    var message = {
        id: 'register',
        name: livechat.vm.sessionid + '~' + Date.now(),
        number: livechat.vm.sessionid + '~' + Date.now(),
        type: 'USER'
    };
    sendMessage(message);
}

function requestCode() {
    if (validateEmail($('#passwordEmail').val())) {
        var Password = {
            id: "USER_RESET_PASSWORD",
            command: "USER_RESET_PASSWORD",
            code: "81030",
            message: {
                session: livechat.vm.sessionid,
                email: $('#passwordEmail').val()
            }
        };
        sendMessage(Password);
    }
    else
        $('#requestError').html('<span>Please enter a valid Email</span>')

}

function resetPassword() {

    if ($('#resetpassword').val() === $('#resetConfirmPassword').val()) {
        $('#resetError').html('')
        var newPassword = {
            id: "USER_RECOVERY_PASSWORD",
            command: "USER_RECOVERY_PASSWORD",
            code: "81031",
            message: {
                session: livechat.vm.sessionid,
                password: md5($('#resetpassword').val()),
                code: $('#resetCode').val(),
                email: $('#resetEmail').val()
            }
        }
        sendMessage(newPassword);
    }
    else
        $('#resetError').append('<span>Passwords do not match</span>')
}

function cancelRequest(display) {
    if (display == 'login') {
        livechat.vm.display = "login";
        showPanel(livechat.vm.display);
        $('#resetEmail').val('');
        $('#resetCode').val('');
        $('#resetpassword').val('');
        $('#resetConfirmPassword').val('');
        $('#passwordEmail').val('');
        $('#requestError').html('');
        $('#resetError').html('');
    }
    else {
        livechat.vm.display = display;
        showPanel(livechat.vm.display);
        $('#updatedEmail').val('');
        $('#updateError').html('');
    }
}

function validateEmail(email) {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
}

function fbLogin() {
    FB.login(function (response) {
        if (response.authResponse) {
            FB.api('/me', { fields: 'id,name,email' }, function (response) {
                facebookLogin = true;
                fbUsername = response.name;
                fbEmail = response.email;
                fbId = response.id;
                var message = {
                    id: 'register',
                    name: response.name,
                    number: response.name,
                    type: 'USER'
                };
                sendMessage(message);

            });
        } else {
            console.log('User cancelled login or did not fully authorize.');
        }
    }, {
            scope: 'email',
            return_scopes: true
        });
}

function fbLogout() {
    FB.logout(function (response) {
        facebookLogin = false;
        console.log(response);
        // statusChangeCallback();
    })
}

function saveFBEmail() {
    $('#emailUpdated').html('');
    livechat.vm.display = 'updateEmail';
    showPanel(livechat.vm.display);
}

function updateEmail() {
    if ($('#updatedEmail').val() == $('#updatedEmail1').val()) {
        if (validateEmail($('#updatedEmail').val())) {
            var Action = {
                id: "USER_SAVE_FACEBOOK_EMAIL",
                command: "USER_SAVE_FACEBOOK_EMAIL",
                code: "81202",
                message: {
                    userid: livechat.vm.userid,
                    email: $('#updatedEmail').val(),
                    session: livechat.vm.sessionid
                }
            };
            sendMessage(Action);
            $('#emailUpdated').html('Save Facebook Email Updated Successfully !')
        }
        else
            $('#updateError').html('<span>Please enter a valid Email</span>')

    }
    else
        $('#updateError').html('<span>Emails do not match</span>')


}
function openModal(param) {
    var message = {
        message: 'popup'
    }
    if (param == 'create')
        message.url = createURL
    else if (param == 'schedule')
        message.url = scheduleURL + '?userid=' + livechat.vm.userid + '&livechat=' + livechat.vm.livechatid

    top.postMessage(message, document.referrer);
}

function reload() {
    location.reload();
}

function closeServer() {
    stop();
    livechat.vm.reset(); // Reset Vars
    $('#campaigns').html("");
    $('#lvusername').val("");
    $('#lvpassword').val("");
    $('#lvuseremail').val("");
    $('#lvuserquery').val("");
    $('#lvuserid').val("");
    $('#btnclose').hide();
    $('#btnview').hide();
    duplicate= false;
    clearDom();
    showPanel(livechat.vm.display);
    minimize();
    stopLoginTimer();
    $('#qnimate').removeClass('popup-box-on');
    $('#addClass').css('display', 'block');
    livechat.vm.reset(); // Reset Vars
    populateWaitingRoom(false);
    showPanel(livechat.vm.display);
    $('#Capa_videocall').show();
    $('#emailUpdated').html('');
}
function loadJsonConfig(){
    $.getJSON("/config.json", function (data) {
        iceServersConfiguration.iceServers = data.iceServers;
        settings.connection.ws = data.ws;
        settings.connection.ip = data.ip;
        settings.connection.port = data.port;
        settings.connection.service = data.service;
        group = data.group;
        createURL = data.createURL;
        passwordURL = data.passwordURL;
        scheduleURL = data.scheduleURL;
        appId = data.code;
        version = data.version;
        (function (d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) return;
            js = d.createElement(s); js.id = id;
            js.src = "//connect.facebook.net/en_US/all.js";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
        window.fbAsyncInit = function () {
            FB.init({
                appId: appId,
                cookie: true,  // enable cookies to allow the server to access 
                // the session
                xfbml: true,  // parse social plugins on this page
                version: version // use graph api version 2.8
            });

        };

    }).fail(function (error) {
        console.log(error);
    })
}