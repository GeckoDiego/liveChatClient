function loadCampaign(){
    //top.postMessage('maximize', document.referrer);
    console.log("Por Aqui"); 
}
function newWindow(){
	top.postMessage('newWindow', document.referrer);
}
function switchVideo(){
	top.postMessage('switchVideo', document.referrer);
}
function changeDiv(){
	var login = document.getElementById("login");	
	login.classList.add("d-none");
	var mainChat = document.getElementById("mainChat");
	mainChat.classList.remove("d-none");
}
function collapseChat(){
	var chatContent = document.getElementById("chatContent");
		chatContent.classList.toggle("d-none");
	var videoContent = document.getElementById("videoContent");		
		if( chatContent.classList.contains('d-none') ){
			//window.resizeTo(1024, 850);
			videoContent.classList.remove("col-8");
			videoContent.classList.toggle("col-12");
		}else{
			//window.resizeTo(1024, 667);
			videoContent.classList.remove("col-12");
			videoContent.classList.toggle("col-8");
		}
}
function closeWindow(){
	var mywin = window.close();		
	var pb = window.opener.document.getElementById('gecko-chat-frame');
		pb.style.display = "";
	var md = window.opener.document.getElementById('dacpf5V-1530800744955');
		pb.style.display = "none";
	var mf = window.opener.document.getElementById('gecko-iframe');
		pb.style.display = "";
}